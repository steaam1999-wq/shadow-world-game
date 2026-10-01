import type { Track } from './engine'

// SoundCloud: человек вставляет ссылку на трек или плейлист, а играет официальный плеер SoundCloud
// (виджет с открытым API). Права на треки — на стороне SoundCloud, ключи и договоры не нужны.

const LINK_RE = /https?:\/\/(?:www\.|m\.)?(?:soundcloud\.com\/[\w-]+\/(?:sets\/)?[\w-]+|on\.soundcloud\.com\/\w+)[^\s]*/i

/** Ссылка SoundCloud из текста (без мусора вокруг), иначе null. */
export function soundCloudLink(text: string): string | null {
  const m = LINK_RE.exec(text.trim())
  if (!m) return null
  const u = new URL(m[0])
  u.hostname = u.hostname.replace(/^(www\.|m\.)/, '')
  u.search = '' // ?si=…&utm_… — метки «поделиться» плееру не нужны
  u.hash = ''
  return u.toString().replace(/\/$/, '')
}

function hueOf(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 360
}

export const soundCloudId = (url: string) => `sc-${url.replace(/^https:\/\/(on\.)?soundcloud\.com\//, '').replace(/[^\w/-]/g, '').slice(0, 120)}`

/** Название из самой ссылки: soundcloud.com/artist-name/track-name → «Track Name», «Artist Name». */
function fromSlug(url: string): { title: string; artist: string } {
  const [user, a, b] = url.replace(/^https:\/\/soundcloud\.com\//, '').split('/')
  const nice = (x?: string) => (x ?? '').replace(/[-_]+/g, ' ').replace(/\s+\d{6,}$/, '').trim().replace(/^./, (c) => c.toUpperCase())
  if (/^https:\/\/on\./.test(url)) return { title: 'Трек SoundCloud', artist: 'SoundCloud' }
  return { title: nice(a === 'sets' ? b : a) || 'Трек SoundCloud', artist: nice(user) || 'SoundCloud' }
}

// Плеер SoundCloud не понимает короткие ссылки on.soundcloud.com из кнопки «Поделиться».
// oEmbed отдаёт готовый код плеера с постоянным адресом трека (api.soundcloud.com/tracks/…) — берём его.
const widgetUrls = new Map<string, string>()
function rememberWidgetUrl(url: string, html?: string) {
  const src = /src="([^"]+)"/.exec(html ?? '')?.[1]?.replace(/&amp;/g, '&')
  try { const u = src && new URL(src).searchParams.get('url'); if (u) widgetUrls.set(url, u) } catch { /* ignore */ }
}
/** Адрес, который понимает плеер: постоянный адрес трека; в худшем случае — сама ссылка. */
export async function widgetUrl(url: string): Promise<string> {
  if (/api\.soundcloud\.com\//.test(url)) return url
  const hit = widgetUrls.get(url)
  if (hit) return hit
  try {
    const r = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    if (r.ok) rememberWidgetUrl(url, ((await r.json()) as { html?: string }).html)
  } catch { /* нет ответа — пробуем саму ссылку */ }
  return widgetUrls.get(url) ?? url
}

/** Трек по ссылке: название, исполнитель и обложка из официального oEmbed SoundCloud. */
export async function soundCloudTrack(url: string, signal?: AbortSignal): Promise<Track> {
  const base: Track = { id: soundCloudId(url), ...fromSlug(url), genre: 'file', source: 'soundcloud', hue: hueOf(url), bpm: 0, root: 0, bars: 0, url }
  let r: Response
  try { r = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal }) } catch (e) {
    if (signal?.aborted) throw e
    return base // нет ответа — играем по ссылке, название берём из неё
  }
  if (r.status === 404 || r.status === 403) throw new Error('not-found') // удалён, приватный или встраивание запрещено
  if (!r.ok) return base
  const o = (await r.json()) as { title?: string; author_name?: string; thumbnail_url?: string; html?: string }
  rememberWidgetUrl(url, o.html)
  const artist = o.author_name?.trim() || base.artist
  // oEmbed отдаёт «Название by Исполнитель».
  const title = (o.title ?? '').replace(new RegExp(`\\s+by\\s+${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '').trim() || base.title
  const cover = o.thumbnail_url?.replace(/-(large|t300x300)\./, '-t500x500.') // крупнее, для обложки плеера
  return { ...base, title, artist, cover: cover?.startsWith('https://') ? cover : undefined }
}

// --- Официальный виджет: прячем его, пока он играет по нашим кнопкам ---

interface Widget {
  bind(ev: string, cb: (e?: { currentPosition?: number }) => void): void
  play(): void
  pause(): void
  seekTo(ms: number): void
  setVolume(v: number): void
  getDuration(cb: (ms: number) => void): void
}
interface SCApi { Widget: ((el: HTMLIFrameElement) => Widget) & { Events: Record<string, string> } }

let apiPromise: Promise<SCApi> | null = null
function loadApi(): Promise<SCApi> {
  const w = window as unknown as { SC?: SCApi }
  if (w.SC?.Widget) return Promise.resolve(w.SC)
  apiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://w.soundcloud.com/player/api.js'
    s.async = true
    s.onload = () => (w.SC?.Widget ? resolve(w.SC) : reject(new Error('sc-api')))
    s.onerror = () => { apiPromise = null; reject(new Error('sc-api')) }
    document.head.appendChild(s)
  })
  return apiPromise
}

/** Место для виджета: обычно за краем экрана; если телефон не дал включить звук — всплывает над меню. */
function host() {
  let el = document.getElementById('sc-host')
  if (el) return el
  el = document.createElement('div')
  el.id = 'sc-host'
  el.setAttribute('role', 'region')
  el.setAttribute('aria-label', 'Плеер SoundCloud')
  Object.assign(el.style, { position: 'fixed', left: '-10000px', bottom: '0', width: '320px', zIndex: '85' })
  document.body.appendChild(el)
  return el
}
function showHost(mode: false | 'tap' | 'error', link?: string) {
  const el = host()
  el.querySelector('[data-sc-hint]')?.remove()
  if (!mode) {
    Object.assign(el.style, { left: '-10000px', right: 'auto', width: '320px', bottom: '0', boxShadow: 'none' })
    return
  }
  Object.assign(el.style, { left: '12px', right: '12px', width: 'auto', bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 12px 40px -12px rgb(0 0 0 / .45)', background: '#fff' })
  const hint = document.createElement('div')
  hint.dataset.scHint = ''
  Object.assign(hint.style, { display: 'flex', alignItems: 'center', gap: '10px', font: '600 13px system-ui, sans-serif', padding: '10px 10px 10px 14px', color: '#222' })
  const text = document.createElement('span')
  text.style.flex = '1'
  text.textContent = mode === 'tap' ? 'Нажмите ▶ в плеере SoundCloud — телефон просит одно касание' : 'SoundCloud не даёт проиграть этот трек здесь.'
  hint.appendChild(text)
  if (mode === 'error' && link) {
    const a = document.createElement('a')
    a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Открыть'
    Object.assign(a.style, { color: '#ff5500', textDecoration: 'none', whiteSpace: 'nowrap' })
    hint.appendChild(a)
  }
  const close = document.createElement('button')
  close.textContent = '✕'
  close.setAttribute('aria-label', 'Скрыть плеер SoundCloud')
  Object.assign(close.style, { border: '0', background: 'transparent', font: '600 16px system-ui', color: '#666', cursor: 'pointer', padding: '4px 6px' })
  close.onclick = () => showHost(false)
  hint.appendChild(close)
  el.prepend(hint)
}

/**
 * Обёртка над виджетом с тем же видом, что у <audio>: play/pause/currentTime/duration/volume/onended.
 * Так движок плеера управляет SoundCloud так же, как остальными онлайн-треками.
 */
export class SoundCloudAudio {
  private frame: HTMLIFrameElement
  private widget: Widget | null = null
  private ready: Promise<Widget>
  private pos = 0
  private dur = NaN
  private vol = 0.8
  private wantPlay = false
  private started = false
  private failed = false
  private link: string
  paused = true
  onended: (() => void) | null = null

  constructor(url: string) {
    this.frame = document.createElement('iframe')
    this.frame.title = 'Плеер SoundCloud'
    this.frame.allow = 'autoplay; encrypted-media'
    this.frame.width = '100%'
    this.frame.height = '120'
    this.frame.style.border = '0'
    this.frame.style.display = 'block'
    this.link = url
    const h = host()
    h.querySelectorAll('iframe').forEach((f) => f.remove())
    h.appendChild(this.frame)
    this.ready = Promise.all([widgetUrl(url), loadApi()]).then(([src, SC]) => new Promise<Widget>((resolve) => {
      this.frame.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&color=%23ff4f86`
      const w = SC.Widget(this.frame)
      const E = SC.Widget.Events
      w.bind(E.READY, () => {
        this.widget = w
        w.setVolume(Math.round(this.vol * 100))
        w.getDuration((ms) => { if (ms > 0) this.dur = ms / 1000 })
        resolve(w)
      })
      w.bind(E.PLAY_PROGRESS, (e) => { if (e?.currentPosition !== undefined) this.pos = e.currentPosition / 1000 })
      w.bind(E.PLAY, () => { this.paused = false; this.started = true; showHost(false); w.getDuration((ms) => { if (ms > 0) this.dur = ms / 1000 }) })
      w.bind(E.PAUSE, () => { this.paused = true })
      w.bind(E.FINISH, () => { this.paused = true; this.onended?.() })
      if (E.ERROR) w.bind(E.ERROR, () => { this.failed = true; if (this.wantPlay) showHost('error', this.link) })
    }))
  }

  get currentTime() { return this.pos }
  set currentTime(sec: number) {
    if (Math.abs(sec - this.pos) < 0.5) return
    this.pos = sec
    void this.ready.then((w) => w.seekTo(sec * 1000))
  }
  get duration() { return this.dur }
  get volume() { return this.vol }
  set volume(v: number) { this.vol = v; this.widget?.setVolume(Math.round(v * 100)) }
  set src(v: string) { if (!v) this.destroy() }

  async play() {
    this.wantPlay = true
    this.paused = false
    // Плеер так и не загрузился (неверная ссылка, трек скрыт) — говорим об этом, а не ждём молча.
    const stuck = setTimeout(() => { if (this.wantPlay && !this.widget) showHost('error', this.link) }, 8000)
    const w = await this.ready
    clearTimeout(stuck)
    if (!this.wantPlay) return
    if (this.failed) { showHost('error', this.link); return }
    w.play()
    // iPhone не даёт стороннему плееру включить звук без касания — показываем сам плеер SoundCloud.
    setTimeout(() => { if (this.wantPlay && !this.started && !this.failed) showHost('tap') }, 1800)
  }
  pause() {
    this.wantPlay = false
    this.paused = true
    this.widget?.pause()
  }
  private destroy() {
    this.wantPlay = false
    this.widget?.pause()
    this.frame.remove()
    showHost(false)
  }
}
