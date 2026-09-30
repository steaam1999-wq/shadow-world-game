// ISKRA: рассылка push-уведомлений о новых сообщениях.
// Вызывается триггером базы (messages_push) с общим секретом в заголовке x-push-secret.
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
    webpush.setVapidDetails('https://steaam1999-wq.github.io/shadow-world-game/', config!.public, config!.private)
  }
  if (req.headers.get('x-push-secret') !== config!.hook) return new Response('forbidden', { status: 403 })

  const { message_id } = await req.json().catch(() => ({}))
  if (!message_id) return new Response('bad request', { status: 400 })
  const { data: m } = await db.from('messages').select('capsule_id, sender, body, photo_path').eq('id', message_id).maybeSingle()
  if (!m) return new Response('no message', { status: 404 })
  const { data: c } = await db.from('capsules').select('author, responder').eq('id', m.capsule_id).maybeSingle()
  if (!c) return new Response('no chat', { status: 404 })
  const to = c.author === m.sender ? c.responder : c.author
  const [{ data: sender }, { data: subs }] = await Promise.all([
    db.from('profiles').select('name').eq('id', m.sender).maybeSingle(),
    db.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', to),
  ])
  if (!subs?.length) return new Response('no subscribers', { status: 200 })

  const text = String(m.body || '') || (m.photo_path ? '📷 Фото' : 'Новое сообщение')
  const payload = JSON.stringify({ title: sender?.name ?? 'ISKRA', body: text.length > 140 ? text.slice(0, 139) + '…' : text, chat: m.capsule_id })
  let sent = 0
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high', topic: String(m.capsule_id).replace(/-/g, '').slice(0, 32) })
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      // Подписка отозвана или устарела — удаляем, чтобы не слать в пустоту.
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
    }
  }))
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
