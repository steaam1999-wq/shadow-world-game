// Komeeta: сервис-воркер — уведомления (в том числе push при закрытом сайте) и быстрый повторный запуск.
// Кэш: файлы сборки (assets/ с хэшем в имени) — из кэша, они не меняются; страница — сначала из сети
// (чтобы обновления приходили сразу), а без сети или при медленной сети — из кэша.
const CACHE = 'komeeta-v5' // сменили логотип — новое имя сбрасывает старые иконки в телефонах
const MAX_ASSETS = 80

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))

async function trim(cache) {
  const keys = (await cache.keys()).filter((r) => r.url.includes('/assets/'))
  for (const r of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(r)
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Supabase, музыка, шрифты — как обычно, без кэша
  if (url.pathname.endsWith('/version.json')) return // метка версии — всегда из сети

  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok) { cache.put(req, res.clone()); trim(cache) }
      return res
    }))
    return
  }

  if (req.mode === 'navigate') {
    const key = new Request(new URL('./', self.registration.scope).href)
    e.respondWith(caches.open(CACHE).then(async (cache) => {
      const net = fetch(req).then((res) => { if (res.ok) cache.put(key, res.clone()); return res })
      // Медленная сеть — через 3 секунды показываем сохранённую версию, свежая подхватится в следующий раз.
      const slow = new Promise((resolve) => setTimeout(resolve, 3000)).then(() => cache.match(key))
      try {
        const first = await Promise.race([net, slow])
        return first || await net
      } catch {
        return (await cache.match(key)) || Response.error()
      }
    }))
    return
  }

  // Иконки, манифест, звуки: отдаём сохранённое и тихо обновляем.
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(req)
    const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => hit)
    return hit || net
  }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const chat = e.notification.data && e.notification.data.chat
  const person = e.notification.data && e.notification.data.person
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const win = list[0]
    const call = e.notification.data && e.notification.data.call
    // Звонок: экран входящего откроется сам — приложение проверяет звонки при запуске.
    if (win) { if (!call) win.postMessage({ type: 'open-chat', chat, person }); return win.focus() }
    return self.clients.openWindow('./#app')
  }))
})

// Push с сервера: новое сообщение, пока сайт закрыт или свёрнут.
self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { d = { body: e.data && e.data.text() } }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    // Приложение открыто и на экране — там уже прозвучала «капелька» и показан баннер.
    // Safari требует показывать уведомление на каждый push, поэтому там показываем всегда.
    const safari = /Safari/.test(self.navigator.userAgent) && !/Chrome|Chromium|Android/.test(self.navigator.userAgent)
    const call = d.kind === 'call'
    // Звонок показываем всегда: в Android-приложении свёрнутая страница иногда числится «на экране».
    if (!safari && !call && list.some((c) => c.visibilityState === 'visible' && c.focused)) return
    return self.registration.showNotification(d.title || 'Komeeta', {
      body: d.body || 'Новое сообщение', tag: call ? 'call' : d.chat || d.kind || 'iskra', renotify: true,
      icon: 'icon-192.png', badge: 'icon-192.png', data: { chat: d.chat, person: d.person, call: d.call },
      // Звонок: не исчезает сам и вибрирует как вызов
      ...(call ? { requireInteraction: true, vibrate: [500, 250, 500, 250, 500] } : {}),
    })
  }))
})
