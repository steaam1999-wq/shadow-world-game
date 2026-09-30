// Match: сервис-воркер нужен только для уведомлений о новых сообщениях (в том числе push при закрытом сайте).
// Ничего не кэширует — сайт всегда грузится свежим.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const chat = e.notification.data && e.notification.data.chat
  const person = e.notification.data && e.notification.data.person
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const win = list[0]
    if (win) { win.postMessage({ type: 'open-chat', chat, person }); return win.focus() }
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
    if (!safari && list.some((c) => c.visibilityState === 'visible' && c.focused)) return
    return self.registration.showNotification(d.title || 'Match', {
      body: d.body || 'Новое сообщение', tag: d.chat || d.kind || 'iskra', renotify: true,
      icon: 'icon-192.png', badge: 'icon-192.png', data: { chat: d.chat, person: d.person },
    })
  }))
})
