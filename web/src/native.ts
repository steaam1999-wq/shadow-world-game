// Komeeta внутри своего Android-приложения (Capacitor): сайт работает как обычно,
// а уведомления, вход через Google и Telegram идут через возможности приложения — без Chrome.
// Плагины приложение подставляет само (window.Capacitor), в обычном браузере этот файл ничего не делает.
import { sb } from './cloud/api'

type Listener = { remove: () => Promise<void> }
type PushPlugin = {
  checkPermissions: () => Promise<{ receive: string }>
  requestPermissions: () => Promise<{ receive: string }>
  register: () => Promise<void>
  addListener: (ev: string, cb: (x: Record<string, unknown>) => void) => Promise<Listener>
  removeAllDeliveredNotifications?: () => Promise<void>
}
type Cap = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins: {
    PushNotifications?: PushPlugin
    Browser?: { open: (o: { url: string; presentationStyle?: string }) => Promise<void>; close: () => Promise<void> }
    App?: { addListener: (ev: string, cb: (x: { url?: string; isActive?: boolean }) => void) => Promise<Listener> }
  }
}
const cap = (): Cap | null => (window as unknown as { Capacitor?: Cap }).Capacitor ?? null

/** Открыто в приложении Komeeta для Android (а не в браузере). */
export const isNativeApp = () => !!cap()?.isNativePlatform?.()

/** Адрес, на который браузер вернёт человека в приложение после входа через Google. */
export const NATIVE_AUTH_REDIRECT = 'com.komeeta.app://auth'

// --- Push-уведомления приложения (Firebase) ---

let token: Promise<string | null> | null = null
/** Разрешение и регистрация в Firebase; возвращает токен устройства или null. */
function registerPush(ask: boolean): Promise<string | null> {
  const push = cap()?.Plugins.PushNotifications
  if (!push) return Promise.resolve(null)
  if (token && !ask) return token
  token = (async () => {
    let perm = (await push.checkPermissions()).receive
    if (perm !== 'granted' && ask) perm = (await push.requestPermissions()).receive
    if (perm !== 'granted') return null
    return new Promise<string | null>((resolve) => {
      const t = setTimeout(() => resolve(null), 20000)
      void push.addListener('registration', (x) => { clearTimeout(t); resolve(String(x.value ?? '')) })
      void push.addListener('registrationError', () => { clearTimeout(t); resolve(null) })
      void push.register().catch(() => { clearTimeout(t); resolve(null) })
    })
  })()
  return token
}

/** Включить уведомления в приложении: спросить разрешение и сохранить устройство на сервере. */
export async function enableNativePush(ask = true): Promise<boolean> {
  const t = await registerPush(ask).catch(() => null)
  if (!t) return false
  const { error } = await sb().from('push_subscriptions').upsert({ endpoint: `fcm:${t}`, p256dh: 'fcm', auth: 'fcm' })
  return !error
}

/** Есть ли разрешение на уведомления в приложении. */
export async function nativePushGranted(): Promise<boolean> {
  try { return (await cap()?.Plugins.PushNotifications?.checkPermissions())?.receive === 'granted' } catch { return false }
}

/** Нажали на уведомление приложения — открыть чат/профиль (звонок откроется сам, когда приложение проснётся). */
export function onNativePushOpen(cb: (d: { chat?: string; person?: string; call?: string }) => void) {
  const push = cap()?.Plugins.PushNotifications
  if (!push) return () => {}
  const l = push.addListener('pushNotificationActionPerformed', (x) => {
    const n = (x.notification ?? {}) as { data?: Record<string, string> }
    cb(n.data ?? {})
  })
  return () => { void l.then((h) => h.remove()) }
}

// --- Вход через Google: во внешнем браузере (Google запрещает вход внутри приложений) ---

/** Открыть страницу входа Google; вернёмся в приложение по ссылке com.komeeta.app://auth#access_token=… */
export async function nativeOAuth(url: string) {
  const browser = cap()?.Plugins.Browser
  if (browser) await browser.open({ url, presentationStyle: 'popover' })
  else location.href = url
}

/** Ловим возврат из браузера: переносим токены в адрес страницы, дальше всё как на сайте. */
export function listenNativeAuthReturn() {
  const app = cap()?.Plugins.App
  if (!app) return
  void app.addListener('appUrlOpen', (x) => {
    const url = x.url ?? ''
    if (url.startsWith(NATIVE_AUTH_REDIRECT)) {
      void cap()?.Plugins.Browser?.close().catch(() => {})
      const i = url.indexOf('#'), q = url.indexOf('?')
      const rest = i >= 0 ? url.slice(i) : q >= 0 ? '#' + url.slice(q + 1) : ''
      location.replace(`${location.origin}/${rest}`)
      setTimeout(() => location.reload(), 50)
    } else if (url.startsWith('https://komeeta.com')) {
      // Ссылка komeeta.com (приглашение, профиль) открылась в приложении
      location.replace(url)
    }
  })
}

// --- Вход через Telegram: страница Telegram открывается прямо в приложении, без всплывающего окна ---

/** Отправить человека на страницу входа Telegram; ответ вернётся в адресе: #tgAuthResult=… */
export function nativeTelegramRedirect(botId: number) {
  const back = `${location.origin}/?source=app`
  location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(location.origin)}&request_access=write&lang=ru&return_to=${encodeURIComponent(back)}`
}
