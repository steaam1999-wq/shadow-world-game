// Komeeta: серверы для звонков (STUN/TURN). Если в секретах есть ключ Cloudflare Realtime TURN —
// выдаём временные (на сутки) логин и пароль к TURN; без ключа — только бесплатные STUN, звонки идут напрямую.
// Секреты: CLOUDFLARE_TURN_KEY_ID, CLOUDFLARE_TURN_API_TOKEN (задаются в Supabase, в коде их нет).
const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' } })
  // TURN — только вошедшим пользователям (подпись токена уже проверил Supabase), иначе чужие могли бы тратить трафик.
  let role = ''
  try { role = JSON.parse(atob((req.headers.get('authorization') ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role ?? '' } catch { /* без токена */ }
  if (role !== 'authenticated') return json({ iceServers: STUN, turn: false })
  const key = Deno.env.get('CLOUDFLARE_TURN_KEY_ID'), token = Deno.env.get('CLOUDFLARE_TURN_API_TOKEN')
  if (!key || !token) return json({ iceServers: STUN, turn: false })
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${key}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }),
    })
    if (!r.ok) return json({ iceServers: STUN, turn: false })
    const d = await r.json()
    const list = Array.isArray(d.iceServers) ? d.iceServers : d.iceServers ? [d.iceServers] : []
    return json({ iceServers: [...STUN, ...list], turn: list.length > 0 })
  } catch {
    return json({ iceServers: STUN, turn: false })
  }
})
