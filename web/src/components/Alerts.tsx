import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Avatar, Button, Icon, Toggle } from './ui'
import type { Person } from '../types'

// Оповещения о новых сообщениях: звук «капелька», баннер сверху, счётчик на иконке
// и системное уведомление, когда вкладка свёрнута.

const KEY = 'iskra-alerts'
interface Prefs { sound: boolean; system: boolean }

function readPrefs(): Prefs {
  try { return { sound: true, system: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { sound: true, system: false } }
}
const listeners = new Set<(p: Prefs) => void>()
function writePrefs(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ }
  listeners.forEach((l) => l(p))
}
function usePrefs(): [Prefs, (p: Partial<Prefs>) => void] {
  const [prefs, setPrefs] = useState(readPrefs)
  useEffect(() => { listeners.add(setPrefs); return () => { listeners.delete(setPrefs) } }, [])
  return [prefs, (p) => writePrefs({ ...readPrefs(), ...p })]
}

// «Капелька» — готовый WAV в памяти. Обычный аудиоэлемент iPhone играет даже при выключенном
// звонке (Web Audio там молчит), но только если его однажды «разбудить» касанием экрана.
function dropWav(): string {
  const rate = 22050, len = Math.round(rate * 0.34)
  const data = new Int16Array(len)
  const drop = (start: number, from: number, to: number, vol: number) => {
    let phase = 0
    for (let i = 0; i < rate * 0.22 && start + i < len; i++) {
      const t = i / rate
      const f = from * Math.pow(to / from, Math.min(1, t / 0.07))
      phase += (2 * Math.PI * f) / rate
      const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.045)
      data[start + i] = Math.max(-32767, Math.min(32767, data[start + i] + Math.sin(phase) * env * vol * 32767))
    }
  }
  drop(0, 520, 1350, 0.55)
  drop(Math.round(rate * 0.11), 900, 1700, 0.2) // тихое «эхо» капли
  const buf = new ArrayBuffer(44 + len * 2), v = new DataView(buf)
  const str = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, len * 2, true)
  data.forEach((x, i) => v.setInt16(44 + i * 2, x, true))
  let bin = ''
  new Uint8Array(buf).forEach((x) => (bin += String.fromCharCode(x)))
  return 'data:audio/wav;base64,' + btoa(bin)
}

let el: HTMLAudioElement | null = null
let unlocked = false
function dropEl() {
  if (!el && typeof Audio !== 'undefined') { el = new Audio(dropWav()); el.preload = 'auto' }
  return el
}
let ctx: AudioContext | null = null
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
  return ctx
}
// Браузеры дают играть звук только после касания: «будим» звук на каждом касании, пока не получится.
function unlock() {
  audioCtx()
  const a = dropEl()
  if (!a || unlocked) return
  a.muted = true
  a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; unlocked = true }).catch(() => { a.muted = false })
}
if (typeof window !== 'undefined') for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true })

/** Запасной вариант через Web Audio: когда уже играет музыка (второй аудиоэлемент на iPhone её бы остановил). */
function dropWebAudio() {
  const ac = audioCtx()
  if (!ac) return
  const t = ac.currentTime + 0.01
  const drop = (at: number, from: number, to: number, vol: number) => {
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(from, at)
    o.frequency.exponentialRampToValueAtTime(to, at + 0.07)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    o.connect(g).connect(ac.destination)
    o.start(at); o.stop(at + 0.25)
  }
  drop(t, 520, 1350, 0.35)
  drop(t + 0.11, 900, 1700, 0.12)
}

/** Звук «капелька». */
export function playDrop() {
  const busy = Array.from(document.querySelectorAll('audio, video')).some((m) => !(m as HTMLMediaElement).paused && !(m as HTMLMediaElement).muted)
  const a = dropEl()
  if (busy || !a) { dropWebAudio(); return }
  a.currentTime = 0
  a.play().catch(() => dropWebAudio())
}

async function notifySystem(title: string, body: string, chat: string, icon?: string) {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    const opts = { body, tag: chat, icon: icon ?? 'icon-192.png', badge: 'icon-192.png', data: { chat } }
    if (reg) await reg.showNotification(title, opts)
    else new Notification(title, opts)
  } catch { /* браузер не умеет — остаются звук и баннер */ }
}

export function registerAlertsWorker() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return
  navigator.serviceWorker.register('sw.js').catch(() => { /* без воркера — только баннер и звук */ })
}

interface Incoming { chat: string; person: Person; text: string; key: string }

/** Следит за новыми входящими и показывает баннер; `openChat` — какой чат сейчас открыт. */
export function MessageAlerts({ openChat, onOpen }: { openChat: string | null; onOpen: (chatId: string) => void }) {
  const { state } = useStore()
  const [prefs] = usePrefs()
  const [banner, setBanner] = useState<Incoming | null>(null)
  const since = useRef(Date.now() - 3000)
  const seen = useRef(new Set<string>())

  useEffect(() => {
    const fresh: Incoming[] = []
    for (const c of state.capsules) {
      const person = state.people.find((p) => p.id === c.personId)
      if (!person) continue
      for (const m of c.messages) {
        if (m.from !== 'them' || m.at < since.current || seen.current.has(m.id)) continue
        seen.current.add(m.id)
        fresh.push({ chat: c.id, person, text: m.text, key: m.id })
      }
    }
    const last = fresh[fresh.length - 1]
    if (!last) return
    if (prefs.sound) playDrop()
    try { navigator.vibrate?.(35) } catch { /* ignore */ }
    if (document.hidden && prefs.system && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void notifySystem(last.person.name, last.text, last.chat, last.person.photo)
    }
    if (last.chat !== openChat || document.hidden) setBanner(last)
  }, [state.capsules, state.people, openChat, prefs.sound, prefs.system])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 4500)
    return () => clearTimeout(t)
  }, [banner])
  useEffect(() => { if (banner && banner.chat === openChat) setBanner(null) }, [openChat, banner])

  // Клик по системному уведомлению — открыть нужный чат.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const on = (e: MessageEvent) => { if (e.data?.type === 'open-chat' && e.data.chat) onOpen(e.data.chat) }
    navigator.serviceWorker.addEventListener('message', on)
    return () => navigator.serviceWorker.removeEventListener('message', on)
  }, [onOpen])

  // Счётчик непрочитанных — в заголовке вкладки и на иконке приложения.
  const unread = state.capsules.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0)
  useEffect(() => {
    document.title = unread ? `(${unread}) ISKRA` : 'ISKRA'
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
    try { void (unread ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {}) } catch { /* ignore */ }
  }, [unread])

  if (!banner) return null
  return (
    <button key={banner.key} onClick={() => { setBanner(null); onOpen(banner.chat) }}
      className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(10px+env(safe-area-inset-top,0px))] z-[60] w-[calc(100%-24px)] max-w-[456px] glass glass-solid rounded-[22px] p-3 flex items-center gap-3 text-left shadow-soft cursor-pointer" role="status" aria-live="polite">
      <span className="relative shrink-0">
        <Avatar name={banner.person.name} hue={banner.person.hue} src={banner.person.photo} size={42} />
        <span className="absolute -right-1 -bottom-1 grid place-items-center w-5 h-5 rounded-full bg-cobalt text-white border-2 border-surface"><Icon name="drop" size={11} fill /></span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate">{banner.person.name}</span>
        <span className="block text-[14px] text-muted truncate">{banner.text}</span>
      </span>
    </button>
  )
}

/** Настройки оповещений для вкладки «Настройки» профиля. */
export function AlertSettings() {
  const [prefs, set] = usePrefs()
  const supported = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState(supported ? Notification.permission : 'denied')
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone)
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)

  const toggleSystem = async (on: boolean) => {
    if (!on) { set({ system: false }); return }
    if (!supported) return
    const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    setPerm(p)
    set({ system: p === 'granted' })
  }

  return (
    <section className="rounded-[28px] bg-surface shadow-soft px-5 py-2 flex flex-col divide-y divide-line">
      <h2 className="font-display font-bold text-lg py-3">Уведомления</h2>
      <div>
        <Toggle id="al-sound" checked={prefs.sound} onChange={(v) => { set({ sound: v }); if (v) playDrop() }} label="Звук «капелька»" hint="Когда приходит новое сообщение" />
        {prefs.sound && <Button variant="ghost" className="!h-9 !px-3 mb-2 self-start" onClick={playDrop}><Icon name="drop" size={16} /> Послушать</Button>}
      </div>
      {supported ? (
        <Toggle id="al-system" checked={prefs.system && perm === 'granted'} onChange={(v) => { void toggleSystem(v) }} label="Уведомления на устройстве"
          hint={perm === 'denied' ? 'Запрещены в настройках браузера — разрешите их для этого сайта' : 'Когда ISKRA открыта в фоне или свёрнута'} />
      ) : (
        <p className="py-3 text-[13px] text-muted">
          {ios && !standalone ? 'На iPhone уведомления работают, если добавить сайт на экран «Домой»: «Поделиться» → «На экран Домой», и открыть ISKRA оттуда.' : 'Этот браузер не показывает системные уведомления — остаются звук и баннер.'}
        </p>
      )}
    </section>
  )
}
