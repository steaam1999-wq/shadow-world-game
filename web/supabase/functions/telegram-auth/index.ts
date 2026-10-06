// Komeeta: вход через Telegram.
// GET  — отдаёт имя бота для виджета (если вход настроен).
// POST — данные из виджета Telegram: проверяем подпись токеном бота, находим или создаём пользователя
//        и возвращаем одноразовый ключ входа (token_hash), который сайт обменивает на сессию.
// Секреты функции (Supabase → Edge Functions → Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_NAME.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type, authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const bot = Deno.env.get('TELEGRAM_BOT_NAME')
  if (req.method === 'GET') return json(token && bot ? { bot, id: Number(token.split(':')[0]) } : { bot: null })
  if (req.method !== 'POST' || !token) return json({ error: 'not-configured' }, 400)

  const data = await req.json().catch(() => null) as Record<string, string | number> | null
  if (!data?.hash || !data.id || !data.auth_date) return json({ error: 'bad-request' }, 400)
  // Подпись Telegram: HMAC-SHA256 от отсортированных полей, ключ — SHA256(токен бота).
  const check = Object.keys(data).filter((k) => k !== 'hash' && data[k] !== undefined && data[k] !== null).sort().map((k) => `${k}=${data[k]}`).join('\n')
  const secret = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(check)))
  if (sig !== String(data.hash)) return json({ error: 'bad-signature' }, 403)
  if (Date.now() / 1000 - Number(data.auth_date) > 86400) return json({ error: 'expired' }, 403)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  // У Telegram нет почты — заводим служебный адрес на его id; письма на него не отправляются.
  const email = `tg${data.id}@telegram.komeeta.com`
  const name = String(data.first_name ?? '')
  const meta = { full_name: [data.first_name, data.last_name].filter(Boolean).join(' '), name, telegram_id: String(data.id), telegram_username: data.username ?? null, avatar_url: data.photo_url ?? null, provider: 'telegram' }
  const created = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: meta })
  if (created.error && !/already|exists|registered/i.test(created.error.message)) return json({ error: 'create-failed' }, 500)
  const link = await db.auth.admin.generateLink({ type: 'magiclink', email })
  const hashed = link.data?.properties?.hashed_token
  if (link.error || !hashed) return json({ error: 'link-failed' }, 500)
  return json({ token_hash: hashed, name })
})
