import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { cloudEnabled, VAPID_PUBLIC_KEY } from '../cloud/config'
import { savePushSubscription } from '../cloud/api'
import { Avatar, Icon, Toggle } from './ui'
import type { Person } from '../types'
// Звук «Классика»: присланный файл, слегка изменённый (тон +4%, мягче верха, тише, без тишины по краям).
import CLASSIC_URL from '../assets/match-notify.wav?inline'

// Оповещения о новых сообщениях: звук «капелька», баннер сверху, счётчик на иконке
// и системное уведомление, когда вкладка свёрнута.

const KEY = 'iskra-alerts'
interface Prefs { sound: boolean; system: boolean; tone: ToneId; v?: number; asked?: boolean }

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs> & { v?: number }
    // Один раз переключаем всех на новый звук «Классика»; дальше выбор человека сохраняется.
    if (raw.v !== 2) { raw.tone = 'classic'; raw.v = 2; try { localStorage.setItem(KEY, JSON.stringify(raw)) } catch { /* ignore */ } }
    return { sound: true, system: false, tone: 'classic', ...raw }
  } catch { return { sound: true, system: false, tone: 'classic' } }
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

// Звуки уведомлений — короткие и мягкие, собираются прямо в браузере (готовый WAV в памяти).
// Обычный аудиоэлемент iPhone играет даже при выключенном звонке (Web Audio там молчит),
// но только если его однажды «разбудить» касанием экрана.

export type ToneId = 'classic' | 'vk' | 'vkSoft' | 'vkUp' | 'drop' | 'bubble' | 'bell' | 'marimba' | 'crystal' | 'kalimba' | 'tap'
export const TONES: { id: ToneId; name: string; desc: string }[] = [
  { id: 'classic', name: 'Классика', desc: 'Ваш звук — чуть мягче и тише' },
  { id: 'vk', name: 'Ностальгия', desc: 'Как сообщение во ВКонтакте в 2017-м' },
  { id: 'vkSoft', name: 'Ностальгия · мягче', desc: 'Тот же «ту-дум», ниже и теплее' },
  { id: 'vkUp', name: 'Ностальгия · вверх', desc: '«Ту-дум» наоборот — ноты вверх' },
  { id: 'drop', name: 'Капелька', desc: 'Фирменный звук Match' },
  { id: 'bubble', name: 'Пузырёк', desc: 'Лёгкий «бульк»' },
  { id: 'kalimba', name: 'Калимба', desc: 'Тёплая деревянная нота' },
  { id: 'marimba', name: 'Маримба', desc: 'Две мягкие ноты' },
  { id: 'bell', name: 'Колокольчик', desc: 'Тихий и долгий' },
  { id: 'crystal', name: 'Хрусталь', desc: 'Три высокие искры' },
  { id: 'tap', name: 'Тихий тап', desc: 'Почти неслышный' },
]

const RATE = 22050
interface Note { at: number; from: number; to?: number; glide?: number; vol: number; attack: number; decay: number; len: number; partials?: [number, number][] }
// Округлые ноты в духе старого звука ВК: основной тон + чуть второй и третьей гармоники.
const ROUND: [number, number][] = [[2, 0.12], [3, 0.035]]
const NOTES: Record<Exclude<ToneId, 'classic'>, Note[]> = {
  vk: [{ at: 0, from: 1047, vol: 0.36, attack: 0.004, decay: 0.07, len: 0.3, partials: ROUND }, { at: 0.085, from: 784, vol: 0.34, attack: 0.004, decay: 0.09, len: 0.36, partials: ROUND }],
  vkSoft: [{ at: 0, from: 698, vol: 0.4, attack: 0.006, decay: 0.09, len: 0.34, partials: [[2, 0.18]] }, { at: 0.095, from: 523, vol: 0.38, attack: 0.006, decay: 0.11, len: 0.4, partials: [[2, 0.18]] }],
  vkUp: [{ at: 0, from: 784, vol: 0.34, attack: 0.004, decay: 0.07, len: 0.3, partials: ROUND }, { at: 0.085, from: 1175, vol: 0.32, attack: 0.004, decay: 0.09, len: 0.36, partials: ROUND }],
  drop: [{ at: 0, from: 520, to: 1350, glide: 0.07, vol: 0.55, attack: 0.006, decay: 0.045, len: 0.22 }, { at: 0.11, from: 900, to: 1700, glide: 0.07, vol: 0.2, attack: 0.006, decay: 0.045, len: 0.22 }],
  bubble: [{ at: 0, from: 260, to: 760, glide: 0.06, vol: 0.5, attack: 0.004, decay: 0.05, len: 0.2 }, { at: 0.09, from: 420, to: 1000, glide: 0.05, vol: 0.28, attack: 0.004, decay: 0.04, len: 0.15 }],
  kalimba: [{ at: 0, from: 784, vol: 0.42, attack: 0.002, decay: 0.16, len: 0.55, partials: [[5.4, 0.12]] }],
  marimba: [{ at: 0, from: 659, vol: 0.42, attack: 0.003, decay: 0.09, len: 0.35, partials: [[4, 0.15]] }, { at: 0.13, from: 988, vol: 0.36, attack: 0.003, decay: 0.09, len: 0.35, partials: [[4, 0.15]] }],
  bell: [{ at: 0, from: 1318, vol: 0.26, attack: 0.008, decay: 0.35, len: 0.9, partials: [[2.01, 0.25], [3, 0.08]] }],
  crystal: [1568, 2093, 2637].map((f, i) => ({ at: i * 0.08, from: f, vol: 0.17, attack: 0.004, decay: 0.12, len: 0.4, partials: [[2, 0.2]] as [number, number][] })),
  tap: [{ at: 0, from: 600, to: 420, glide: 0.03, vol: 0.4, attack: 0.002, decay: 0.025, len: 0.1 }],
}

// Лёгкое эхо, как у «ностальгических» звуков: несколько тихих повторов.
const ECHO: Partial<Record<ToneId, { delay: number; feedback: number; taps: number }>> = {
  vk: { delay: 0.075, feedback: 0.26, taps: 3 }, vkSoft: { delay: 0.09, feedback: 0.28, taps: 3 }, vkUp: { delay: 0.075, feedback: 0.26, taps: 3 },
}
const cache = new Map<ToneId, Float32Array>()
function samples(id: Exclude<ToneId, 'classic'>): Float32Array {
  const hit = cache.get(id)
  if (hit) return hit
  const notes = NOTES[id]
  const echo = ECHO[id]
  const total = Math.max(...notes.map((n) => n.at + n.len)) + 0.02 + (echo ? echo.delay * echo.taps : 0)
  const out = new Float32Array(Math.round(RATE * total))
  for (const n of notes) {
    const start = Math.round(n.at * RATE)
    const parts: [number, number][] = [[1, 1], ...(n.partials ?? [])]
    const phase = parts.map(() => 0)
    for (let i = 0; i < n.len * RATE && start + i < out.length; i++) {
      const t = i / RATE
      const f = n.to ? n.from * Math.pow(n.to / n.from, Math.min(1, t / (n.glide ?? 0.05))) : n.from
      const env = Math.min(1, t / n.attack) * Math.exp(-t / n.decay)
      let v = 0
      parts.forEach(([mult, amp], k) => { phase[k] += (2 * Math.PI * f * mult) / RATE; v += Math.sin(phase[k]) * amp })
      out[start + i] += v * env * n.vol
    }
  }
  if (echo) {
    const dry = out.slice(), d = Math.round(echo.delay * RATE)
    for (let k = 1; k <= echo.taps; k++) { const g = Math.pow(echo.feedback, k); for (let i = k * d; i < out.length; i++) out[i] += dry[i - k * d] * g }
  }
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]))
  cache.set(id, out)
  return out
}

function wav(id: Exclude<ToneId, 'classic'>): string {
  const data = samples(id)
  const len = data.length
  const buf = new ArrayBuffer(44 + len * 2), v = new DataView(buf)
  const str = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, RATE, true)
  v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, len * 2, true)
  data.forEach((x, i) => v.setInt16(44 + i * 2, Math.round(x * 32767), true))
  let bin = ''
  new Uint8Array(buf).forEach((x) => (bin += String.fromCharCode(x)))
  return 'data:audio/wav;base64,' + btoa(bin)
}

const els = new Map<ToneId, HTMLAudioElement>()
const unlockedEls = new Set<ToneId>()
function toneEl(id: ToneId) {
  if (typeof Audio === 'undefined') return null
  let el = els.get(id)
  if (!el) { el = new Audio(id === 'classic' ? CLASSIC_URL : wav(id)); el.preload = 'auto'; els.set(id, el) }
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
// Браузеры дают играть звук только после касания: «будим» выбранный звук на каждом касании, пока не получится.
function unlock() {
  audioCtx()
  const id = readPrefs().tone
  const a = toneEl(id)
  if (!a || unlockedEls.has(id)) return
  a.muted = true
  a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; unlockedEls.add(id) }).catch(() => { a.muted = false })
}
if (typeof window !== 'undefined') for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true })

/** Запасной вариант через Web Audio: когда уже играет музыка (второй аудиоэлемент на iPhone её бы остановил). */
let classicBuf: AudioBuffer | null = null
function playWebAudio(id: ToneId) {
  const ac = audioCtx()
  if (!ac) return
  if (id === 'classic') {
    const go = (b: AudioBuffer) => { const src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start() }
    if (classicBuf) go(classicBuf)
    else void fetch(CLASSIC_URL).then((r) => r.arrayBuffer()).then((ab) => ac.decodeAudioData(ab)).then((b) => { classicBuf = b; go(b) }).catch(() => {})
    return
  }
  const data = samples(id)
  const b = ac.createBuffer(1, data.length, RATE)
  b.getChannelData(0).set(data)
  const src = ac.createBufferSource()
  src.buffer = b
  src.connect(ac.destination)
  src.start()
}

/** Звук уведомления (выбранный в настройках или переданный — для «послушать»). */
export function playDrop(id: ToneId = readPrefs().tone) {
  const busy = Array.from(document.querySelectorAll('audio, video')).some((m) => !(m as HTMLMediaElement).paused && !(m as HTMLMediaElement).muted)
  const a = toneEl(id)
  if (busy || !a) { playWebAudio(id); return }
  a.currentTime = 0
  a.play().catch(() => playWebAudio(id))
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
  if (!('serviceWorker' in navigator) || (location.protocol !== 'https:' && location.hostname !== 'localhost')) return
  navigator.serviceWorker.register('sw.js').catch(() => { /* без воркера — только баннер и звук */ })
}

function b64ToBytes(b64: string) {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

/** Подписывает это устройство на push, чтобы уведомления приходили и при закрытом сайте. */
export async function enablePush(): Promise<boolean> {
  try {
    if (!cloudEnabled || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY) })
    await savePushSubscription(sub)
    return true
  } catch { return false }
}

/** Отписывает устройство, когда человек выключил уведомления. */
async function disablePush() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    await sub?.unsubscribe()
  } catch { /* ignore */ }
}

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () => !!(window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone)

/** Подписка на push при каждом входе, если разрешение уже дано — иначе уведомления не придут. */
export function usePushAutoSubscribe() {
  const { state } = useStore()
  const [prefs, set] = usePrefs()
  useEffect(() => {
    if (!state.cloud || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    // Разрешение дали раньше, а переключатель ни разу не трогали — включаем.
    if (!prefs.system && !prefs.asked) { set({ system: true, asked: true }); return }
    if (prefs.system) void enablePush()
  }, [state.cloud, prefs.system, prefs.asked]) // eslint-disable-line react-hooks/exhaustive-deps
}

const PROMPT_KEY = 'match-push-prompt'

/** Карточка на главной: включить уведомления одной кнопкой (или как это сделать на iPhone). */
export function PushPrompt() {
  const { state } = useStore()
  const [prefs, set] = usePrefs()
  const supported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator
  const [perm, setPerm] = useState(supported ? Notification.permission : 'denied')
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(PROMPT_KEY) === '1' } catch { return false } })
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const iosBrowser = isIos() && !isStandalone()
  if (!cloudEnabled || !state.cloud || hidden) return null
  if (!iosBrowser && !failed && (!supported || perm === 'denied' || (perm === 'granted' && prefs.system))) return null
  const close = () => { setHidden(true); try { localStorage.setItem(PROMPT_KEY, '1') } catch { /* ignore */ } }
  const turnOn = async () => {
    setBusy(true)
    const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    setPerm(p)
    if (p === 'granted') { set({ system: true, asked: true }); const ok = await enablePush(); setFailed(!ok); if (ok) playDrop() }
    setBusy(false)
  }
  return (
    <section className="mx-4 mb-4 rounded-[24px] bg-surface shadow-soft p-4 flex flex-col gap-3" aria-label="Уведомления">
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-brand text-white"><Icon name="bell" size={20} /></span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-[16px]">Не пропускайте сообщения</h2>
          <p className="text-[13.5px] text-muted leading-snug mt-0.5">
            {iosBrowser
              ? 'На iPhone уведомления приходят, только если открыть Match с экрана «Домой».'
              : 'Включите уведомления — они придут на экран, даже когда Match закрыт.'}
          </p>
        </div>
        <button onClick={close} className="grid place-items-center w-8 h-8 -mt-1 -mr-1 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Скрыть"><Icon name="x" size={16} /></button>
      </div>
      {iosBrowser ? (
        <ol className="flex flex-col gap-2 text-[14px] leading-snug">
          <li className="flex items-center gap-3"><span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-surface-2 font-bold text-[13px]">1</span><span>Нажмите <b>«Поделиться»</b> <span aria-hidden>⎋</span> внизу Safari</span></li>
          <li className="flex items-center gap-3"><span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-surface-2 font-bold text-[13px]">2</span><span>Выберите <b>«На экран „Домой“»</b></span></li>
          <li className="flex items-center gap-3"><span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-surface-2 font-bold text-[13px]">3</span><span>Откройте Match с иконки и нажмите «Включить» здесь</span></li>
        </ol>
      ) : (
        <>
        {failed && <p className="text-[13px] text-danger leading-snug" role="alert">Не получилось подписать это устройство. {/Android/.test(navigator.userAgent) ? 'На Android откройте Match в Google Chrome — в некоторых браузерах уведомления сайтов не работают.' : 'Проверьте интернет и попробуйте ещё раз.'}</p>}
        <button onClick={() => { void turnOn() }} disabled={busy} className="h-11 rounded-xl bg-brand text-white font-semibold text-[15px] cursor-pointer disabled:opacity-60">
          {busy ? 'Включаем…' : failed ? 'Попробовать ещё раз' : 'Включить уведомления'}
        </button>
        </>
      )}
    </section>
  )
}

interface Incoming { chat: string; person: Person; text: string; key: string; profile?: boolean; at?: number }

/** Следит за новыми входящими и показывает баннер; `openChat` — какой чат сейчас открыт. */
export function MessageAlerts({ openChat, onOpen, onOpenProfile }: { openChat: string | null; onOpen: (chatId: string) => void; onOpenProfile: (personId: string) => void }) {
  const { state } = useStore()
  const [prefs] = usePrefs()
  usePushAutoSubscribe()
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
        fresh.push({ chat: c.id, person, text: m.text || '📷 Фото', key: m.id, at: m.at })
      }
    }
    // Сообщения в группах: баннер с автором, в тексте — название группы.
    for (const g of state.groups ?? []) {
      for (const m of g.messages) {
        if (m.from !== 'them' || m.at < since.current || seen.current.has(m.id)) continue
        seen.current.add(m.id)
        const person = state.people.find((p) => p.id === m.senderId)
        if (person) fresh.push({ chat: g.id, person, text: `${g.title}: ${m.text || '📷 Фото'}`, key: m.id, at: m.at })
      }
    }
    fresh.sort((a, b) => (a.at ?? 0) - (b.at ?? 0))
    const last = fresh[fresh.length - 1]
    if (!last) return
    if (prefs.sound) playDrop()
    try { navigator.vibrate?.(35) } catch { /* ignore */ }
    if (document.hidden && prefs.system && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void notifySystem(last.person.name, last.text, last.chat, last.person.photo)
    }
    if (last.chat !== openChat || document.hidden) setBanner(last)
  }, [state.capsules, state.groups, state.people, openChat, prefs.sound, prefs.system])

  // Новые подписчики и лайки — та же «капелька» и плашка сверху.
  useEffect(() => {
    const fresh = (state.notices ?? []).filter((n) => n.at >= since.current && !seen.current.has(n.id)).sort((a, b) => a.at - b.at)
    fresh.forEach((n) => seen.current.add(n.id))
    const n = fresh[fresh.length - 1]
    const person = n && state.people.find((p) => p.id === n.personId)
    if (!n || !person) return
    const text = n.kind === 'follow' ? 'подписал(ась) на вас' : n.kind === 'repost' ? 'сделал(а) репост вашего плана' : n.kind === 'likePlan' ? 'нравится ваш план' : 'нравится ваша публикация'
    if (prefs.sound) playDrop()
    try { navigator.vibrate?.(35) } catch { /* ignore */ }
    setBanner({ chat: '', person, text, key: n.id, profile: true })
  }, [state.notices, state.people, prefs.sound])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 4500)
    return () => clearTimeout(t)
  }, [banner])
  useEffect(() => { if (banner && !banner.profile && banner.chat === openChat) setBanner(null) }, [openChat, banner])

  // Клик по системному уведомлению — открыть нужный чат.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const on = (e: MessageEvent) => {
      if (e.data?.type === 'open-chat' && e.data.chat) onOpen(e.data.chat)
      if (e.data?.type === 'open-chat' && e.data.person) onOpenProfile(e.data.person)
    }
    navigator.serviceWorker.addEventListener('message', on)
    return () => navigator.serviceWorker.removeEventListener('message', on)
  }, [onOpen, onOpenProfile])

  // Счётчик непрочитанных — в заголовке вкладки и на иконке приложения.
  const unread = state.capsules.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0) + (state.groups ?? []).reduce((n, g) => n + (g.unread > 0 ? 1 : 0), 0)
  useEffect(() => {
    document.title = unread ? `(${unread}) Match` : 'Match'
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
    try { void (unread ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {}) } catch { /* ignore */ }
  }, [unread])

  if (!banner) return null
  return (
    <button key={banner.key} onClick={() => { setBanner(null); if (banner.profile) onOpenProfile(banner.person.id); else onOpen(banner.chat) }}
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

  const { state } = useStore()
  const [pushOk, setPushOk] = useState(false)
  const toggleSystem = async (on: boolean) => {
    if (!on) { set({ system: false, asked: true }); void disablePush(); return }
    if (!supported) return
    const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    setPerm(p)
    set({ system: p === 'granted', asked: true })
    if (p === 'granted' && state.cloud) setPushOk(await enablePush())
  }
  // Разрешение уже есть — продлеваем подписку (браузер может её сменить).
  useEffect(() => { if (prefs.system && perm === 'granted' && state.cloud) void enablePush().then(setPushOk) }, [prefs.system, perm, state.cloud])

  return (
    <section className="rounded-[28px] bg-surface shadow-soft px-5 py-2 flex flex-col divide-y divide-line">
      <h2 className="font-display font-bold text-lg py-3">Уведомления</h2>
      <div>
        <Toggle id="al-sound" checked={prefs.sound} onChange={(v) => { set({ sound: v }); if (v) playDrop() }} label="Звук уведомлений" hint={`Сейчас: ${TONES.find((t) => t.id === prefs.tone)?.name ?? 'Капелька'} — нажмите на звук, чтобы послушать и выбрать`} />
        {prefs.sound && (
          <ul className="flex flex-col gap-1 pb-3" role="radiogroup" aria-label="Звук уведомлений">
            {TONES.map((t) => {
              const on = prefs.tone === t.id
              return (
                <li key={t.id}>
                  <button role="radio" aria-checked={on} onClick={() => { set({ tone: t.id }); playDrop(t.id) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left cursor-pointer transition ${on ? 'bg-spark-soft' : 'hover:bg-surface-2'}`}>
                    <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${on ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}><Icon name={on ? 'check' : 'drop'} size={16} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-[14px]">{t.name}</span>
                      <span className="block text-[12px] text-muted">{t.desc}</span>
                    </span>
                    <Icon name="play" size={14} className="text-muted" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {supported ? (
        <Toggle id="al-system" checked={prefs.system && perm === 'granted'} onChange={(v) => { void toggleSystem(v) }} label="Уведомления на устройстве"
          hint={perm === 'denied' ? 'Запрещены в настройках браузера — разрешите их для этого сайта' : pushOk ? 'Придут, даже когда Match закрыта' : 'Когда Match открыта в фоне или свёрнута'} />
      ) : (
        <p className="py-3 text-[13px] text-muted">
          {ios && !standalone ? 'На iPhone уведомления работают, если добавить сайт на экран «Домой»: «Поделиться» → «На экран Домой», и открыть Match оттуда.' : 'Этот браузер не показывает системные уведомления — остаются звук и баннер.'}
        </p>
      )}
    </section>
  )
}
