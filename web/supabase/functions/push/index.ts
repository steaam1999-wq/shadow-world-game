// Komeeta: push-уведомления о новых сообщениях и подписках.
// Вызывается триггерами базы (messages_push, group_messages_push, follows_push, call_signals_push) и расписанием напоминаний о встречах с общим секретом в заголовке x-push-secret.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
let config: { public: string; private: string; hook: string } | null = null

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
  await Promise.all(subs.map(async (s) => {
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
