// Komeeta: вход и регистрация по нику — с защитой от ботов.
// GET                         → { turnstile: ключ сайта капчи или null }
// POST { action: 'signup' }   → создаёт аккаунт (служебная почта <ник>@users.komeeta.com, сразу подтверждена)
// POST { action: 'login' }    → вход: ник → настоящая почта (если привязана) → сессия
// POST { action: 'reset' }    → письмо для нового пароля на привязанную почту (ответ всегда одинаковый)
// Защита: лимиты по сети и по нику, скрытое поле-ловушка, «слишком быстро» (боты), капча Cloudflare Turnstile, если задан TURNSTILE_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type, authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const URL_ = Deno.env.get('SUPABASE_URL')!
const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
const NICK = /^[a-z0-9_.]{3,20}$/

async function sha(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + (Deno.env.get('SUPABASE_URL') ?? '')))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
/** Сколько попыток такого вида с этим ключом было за период. */
async function count(kind: string, key: string, minutes: number) {
  const { count: n } = await admin.from('auth_attempts').select('id', { count: 'exact', head: true })
    .eq('kind', kind).eq('key', key).gt('created_at', new Date(Date.now() - minutes * 60_000).toISOString())
  return n ?? 0
}
const note = (kind: string, key: string) => admin.from('auth_attempts').insert({ kind, key })

async function captchaOk(token: unknown, ip: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false
  const form = new FormData(); form.append('secret', secret); form.append('response', token); form.append('remoteip', ip)
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }).then((x) => x.json()).catch(() => null) as { success?: boolean } | null
  return !!r?.success
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method === 'GET') return json({ turnstile: Deno.env.get('TURNSTILE_SITE_KEY') || null })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown').split(',')[0].trim()
  const ipKey = await sha(ip)
  const b = await req.json().catch(() => null) as { action?: string; nick?: string; password?: string; website?: string; ms?: number; captcha?: string } | null
  if (!b) return json({ error: 'bad-request' }, 400)
  const nick = String(b.nick ?? '').trim().toLowerCase().replace(/^@/, '')

  if (b.action === 'signup') {
    const password = String(b.password ?? '')
    // ловушки для ботов: скрытое поле заполнено или форма отправлена быстрее чем за 2 секунды
    if (b.website || Number(b.ms ?? 0) < 2000) return json({ error: 'bot' }, 400)
    if (!NICK.test(nick)) return json({ error: 'bad-nick' }, 400)
    if (password.length < 6 || password.length > 72) return json({ error: 'bad-password' }, 400)
    if (await count('signup', ipKey, 60) >= 3 || await count('signup', ipKey, 1440) >= 10) return json({ error: 'too-many' }, 429)
    if (!(await captchaOk(b.captcha, ip))) return json({ error: 'captcha' }, 400)
    await note('signup', ipKey)
    const { error } = await admin.auth.admin.createUser({ email: `${nick}@users.komeeta.com`, password, email_confirm: true, user_metadata: { nick, provider: 'nick' } })
    if (error) {
      const taken = /already|exists|registered/i.test(error.message)
      return json({ error: taken ? 'taken' : /password/i.test(error.message) ? 'weak-password' : 'failed' }, taken ? 409 : 400)
    }
    return json({ ok: true })
  }

  if (b.action === 'login') {
    if (!NICK.test(nick)) return json({ error: 'credentials' }, 400)
    // подбор пароля: не больше 10 попыток на ник за 15 минут и 30 с одной сети
    if (await count('login', nick, 15) >= 10 || await count('login-ip', ipKey, 15) >= 30) return json({ error: 'too-many' }, 429)
    const { data: email } = await admin.rpc('nick_email', { n: nick })
    const anon = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
    const { data, error } = await anon.auth.signInWithPassword({ email: (email as string | null) ?? `${nick}@users.komeeta.com`, password: String(b.password ?? '') })
    if (error || !data.session) {
      await note('login', nick); await note('login-ip', ipKey)
      return json({ error: /confirm/i.test(error?.message ?? '') ? 'unconfirmed' : 'credentials' }, 400)
    }
    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  }

  if (b.action === 'reset') {
    if (await count('reset', ipKey, 60) >= 5) return json({ error: 'too-many' }, 429)
    await note('reset', ipKey)
    const { data: email } = NICK.test(nick) ? await admin.rpc('nick_email', { n: nick }) : { data: null }
    const real = typeof email === 'string' && !email.endsWith('@users.komeeta.com') ? email : null
    if (real) {
      const anon = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
      await anon.auth.resetPasswordForEmail(real, { redirectTo: String(req.headers.get('origin') ?? 'https://komeeta.com') + '/' })
    }
    // одинаковый ответ — по нему нельзя узнать, есть ли такой ник и привязана ли почта
    return json({ ok: true })
  }
  return json({ error: 'bad-action' }, 400)
})
