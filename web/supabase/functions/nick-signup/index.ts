// Komeeta: регистрация по нику и паролю (без почты).
// Supabase требует почту — заводим служебный адрес <ник>@users.komeeta.com, сразу подтверждённый.
// Сайт после ответа входит обычным способом: signInWithPassword(служебный адрес, пароль).
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type, authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const body = await req.json().catch(() => null) as { nick?: string; password?: string } | null
  const nick = String(body?.nick ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  if (!/^[a-z0-9_.]{3,20}$/.test(nick)) return json({ error: 'bad-nick' }, 400)
  if (password.length < 6 || password.length > 72) return json({ error: 'bad-password' }, 400)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { error } = await db.auth.admin.createUser({ email: `${nick}@users.komeeta.com`, password, email_confirm: true, user_metadata: { nick, provider: 'nick' } })
  if (error) return json({ error: /already|exists|registered/i.test(error.message) ? 'taken' : /password/i.test(error.message) ? 'weak-password' : 'failed' }, /already|exists|registered/i.test(error.message) ? 409 : 400)
  return json({ ok: true })
})
