// ISKRA: сервис-воркер нужен только для системных уведомлений о новых сообщениях.
// Ничего не кэширует — сайт всегда грузится свежим.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const chat = e.notification.data && e.notification.data.chat
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const win = list[0]
    if (win) { win.postMessage({ type: 'open-chat', chat }); return win.focus() }
    return self.clients.openWindow('./#app')
  }))
})
