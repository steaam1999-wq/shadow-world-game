// Komeeta: push-уведомления о новых сообщениях и подписках.
// Вызывается триггерами базы (messages_push, group_messages_push, follows_push, call_signals_push) и расписанием напоминаний о встречах с общим секретом в заголовке x-push-secret.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
let config: { public: string; private: string; hook: string } | null = null

// --- Приложение для Android: уведомления через Firebase Cloud Messaging (HTTP v1) ---
// Секрет FCM_SERVICE_ACCOUNT — JSON ключа сервисного аккаунта Firebase (Project settings → Service accounts).
type ServiceAccount = { project_id: string; client_email: string; private_key: string }
let fcmAuth: { token: string; until: number } | null = null
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer)
  let s = ''; for (const x of bytes) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function serviceAccount(): ServiceAccount | null {
  try { const raw = Deno.env.get('FCM_SERVICE_ACCOUNT'); return raw ? JSON.parse(raw) as ServiceAccount : null } catch { return null }
}
async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (fcmAuth && fcmAuth.until > Date.now() + 60_000) return fcmAuth.token
  const now = Math.floor(Date.now() / 1000)
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claim}`))
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${b64url(sig)}` }),
  })
  const j = await r.json() as { access_token?: string; expires_in?: number }
  if (!j.access_token) throw new Error('fcm-auth')
  fcmAuth = { token: j.access_token, until: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return j.access_token
}
/** Отправка на устройство с приложением. false — токен устарел, подписку надо удалить. */
async function sendFcm(sa: ServiceAccount, token: string, p: Record<string, unknown>, call: boolean): Promise<boolean | null> {
  const data: Record<string, string> = {}
  for (const k of ['chat', 'person', 'call', 'kind']) if (p[k] != null) data[k] = String(p[k])
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST', headers: { Authorization: `Bearer ${await fcmAccessToken(sa)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      token,
      notification: { title: String(p.title ?? 'Komeeta'), body: String(p.body ?? '') },
      data,
      android: {
        priority: 'high', ttl: call ? '45s' : '3600s',
        notification: { channel_id: call ? 'calls' : 'messages', tag: call ? 'call' : String(p.chat ?? p.kind ?? 'komeeta'), sound: 'default', default_vibrate_timings: !call, ...(call ? { vibrate_timings: ['0s', '0.6s', '0.3s', '0.6s', '0.3s', '0.6s'] } : {}) },
      },
    } }),
  })
  if (r.ok) return true
  const t = await r.text()
  return /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT.*token/i.test(t) ? false : null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  if (!config) {
    const { data, error } = await db.rpc('push_config')
    if (error || !data?.private) return new Response('config missing', { status: 500 })
    config = data
    webpush.setVapidDetails('https://komeeta.com/', config!.public, config!.private)
  }
  if (req.headers.get('x-push-secret') !== config!.hook) return new Response('forbidden', { status: 403 })

  const body = await req.json().catch(() => ({}))
  let to: string[], payload: string, topic: string
  if (body.reminder_plan_id && Array.isArray(body.users)) {
    // За час до встречи: «Скоро встреча — «Название» в 19:00».
    const { data: p } = await db.from('plans').select('title, area, starts_at').eq('id', body.reminder_plan_id).maybeSingle()
    if (!p) return new Response('no plan', { status: 404 })
    const time = new Date(p.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Minsk' })
    to = body.users.filter((u: unknown): u is string => typeof u === 'string')
    payload = JSON.stringify({ title: 'Скоро встреча', body: `«${p.title}» в ${time} · ${p.area}. Не опаздывайте!`, kind: 'reminder' })
    topic = String(body.reminder_plan_id).replace(/-/g, '').slice(0, 32)
  } else if (body.group_message_id) {
    // Сообщение в группе: всем участникам, кроме отправителя.
    const { data: m } = await db.from('group_messages').select('group_id, sender, body, photo_path').eq('id', body.group_message_id).maybeSingle()
    if (!m) return new Response('no message', { status: 404 })
    const [{ data: g }, { data: members }, { data: sender }] = await Promise.all([
      db.from('group_chats').select('title').eq('id', m.group_id).maybeSingle(),
      db.from('group_members').select('user_id').eq('group_id', m.group_id),
      db.from('profiles').select('name').eq('id', m.sender).maybeSingle(),
    ])
    to = (members ?? []).map((x: { user_id: string }) => x.user_id).filter((id: string) => id !== m.sender)
    const text = String(m.body || '') || (m.photo_path ? '📷 Фото' : 'Новое сообщение')
    const line = `${sender?.name ?? 'Кто-то'}: ${text}`
    payload = JSON.stringify({ title: g?.title ?? 'Группа', body: line.length > 140 ? line.slice(0, 139) + '…' : line, chat: m.group_id })
    topic = String(m.group_id).replace(/-/g, '').slice(0, 32)
  } else if (body.call_signal_id) {
    // Входящий звонок: «Саня звонит вам» — нажатие откроет приложение с экраном звонка.
    const { data: c } = await db.from('call_signals').select('call_id, from_user, to_user, kind, payload').eq('id', body.call_signal_id).maybeSingle()
    if (!c || c.kind !== 'offer') return new Response('no call', { status: 404 })
    const { data: who } = await db.from('profiles').select('name').eq('id', c.from_user).maybeSingle()
    const video = !!(c.payload as { video?: boolean })?.video
    to = [c.to_user]
    payload = JSON.stringify({ title: video ? '🎥 Видеозвонок' : '📞 Входящий звонок', body: `${who?.name ?? 'Кто-то'} звонит вам`, kind: 'call', call: c.call_id, person: c.from_user })
    topic = String(c.call_id).replace(/-/g, '').slice(0, 32)
  } else if (body.follower && body.followee) {
    // Новая подписка: «Имя подписался(ась) на вас».
    const { data: f } = await db.from('follows').select('follower').eq('follower', body.follower).eq('followee', body.followee).maybeSingle()
    if (!f) return new Response('no follow', { status: 404 })
    const { data: who } = await db.from('profiles').select('name').eq('id', body.follower).maybeSingle()
    to = [body.followee]
    payload = JSON.stringify({ title: 'Komeeta', body: `${who?.name ?? 'Кто-то'} подписал(ась) на вас`, kind: 'follow', person: body.follower })
    topic = 'follow'
  } else {
    const message_id = body.message_id
    if (!message_id) return new Response('bad request', { status: 400 })
    const { data: m } = await db.from('messages').select('capsule_id, sender, body, photo_path, audio_path').eq('id', message_id).maybeSingle()
    if (!m) return new Response('no message', { status: 404 })
    const { data: c } = await db.from('capsules').select('author, responder').eq('id', m.capsule_id).maybeSingle()
    if (!c) return new Response('no chat', { status: 404 })
    to = [c.author === m.sender ? c.responder : c.author]
    const { data: sender } = await db.from('profiles').select('name').eq('id', m.sender).maybeSingle()
    const text = String(m.body || '') || (m.photo_path ? '📷 Фото' : m.audio_path ? '🎤 Голосовое сообщение' : 'Новое сообщение')
    payload = JSON.stringify({ title: sender?.name ?? 'Komeeta', body: text.length > 140 ? text.slice(0, 139) + '…' : text, chat: m.capsule_id })
    topic = String(m.capsule_id).replace(/-/g, '').slice(0, 32)
  }
  if (!to.length) return new Response('no recipients', { status: 200 })
  const { data: subs } = await db.from('push_subscriptions').select('endpoint, p256dh, auth').in('user_id', to)
  if (!subs?.length) return new Response('no subscribers', { status: 200 })

  let sent = 0
  const sa = serviceAccount()
  await Promise.all(subs.map(async (s) => {
    if (s.endpoint.startsWith('fcm:')) {
      if (!sa) return
      try {
        const ok = await sendFcm(sa, s.endpoint.slice(4), JSON.parse(payload), !!body.call_signal_id)
        if (ok) sent++
        else if (ok === false) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      } catch { /* сеть Firebase — не страшно */ }
      return
    }
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: body.call_signal_id ? 45 : 3600, urgency: 'high', topic })
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      // Подписка отозвана или устарела — удаляем, чтобы не слать в пустоту.
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
    }
  }))
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
