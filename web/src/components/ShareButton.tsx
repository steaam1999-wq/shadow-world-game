import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { compatibility, planWhen } from '../lib'
import { Avatar, Icon, Sheet } from './ui'
import type { Activity, Person } from '../types'

const HOLD_MS = 380
interface Point { x: number; y: number }
interface Flight { id: number; from: Point; to: Point }

const center = (r: DOMRect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

/** Пять человек, с кем переписывались последними (кроме автора). */
function useRecentPeople(excludeId?: string) {
  const { state } = useStore()
  return useMemo(() => {
    const last = new Map<string, number>()
    for (const c of state.capsules) {
      const at = c.messages.filter((m) => m.from !== 'system').at(-1)?.at
      if (at && at > (last.get(c.personId) ?? 0)) last.set(c.personId, at)
    }
    return state.people
      .filter((p) => p.id !== excludeId && !state.blocked?.some((b) => b.id === p.id))
      .map((p) => ({ p, at: last.get(p.id) ?? 0, c: state.me ? compatibility(state.me, p).score : 0 }))
      .sort((a, b) => b.at - a.at || b.c - a.c)
      .slice(0, 5)
      .map((x) => x.p)
  }, [state.people, state.capsules, state.me, state.blocked, excludeId])
}

// «Вжух» улетающего самолётика и мягкий «тук» при получении — собираются прямо в браузере.
let audio: AudioContext | null = null
function playWhoosh() {
  try {
    audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const ctx = audio
    void ctx.resume()
    const t = ctx.currentTime
    const len = 0.75
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource(); noise.buffer = buf
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4
    bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35); bp.frequency.exponentialRampToValueAtTime(900, t + len)
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    noise.connect(bp).connect(g).connect(ctx.destination); noise.start(t); noise.stop(t + len)
    // Приземление у получателя: две тихие ноты вверх.
    ;[[880, 1.0], [1318.5, 1.09]].forEach(([f, at]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t + at); og.gain.exponentialRampToValueAtTime(0.12, t + at + 0.015); og.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.35)
      o.connect(og).connect(ctx.destination); o.start(t + at); o.stop(t + at + 0.4)
    })
  } catch { /* без звука */ }
}

/**
 * Самолётик «Отправить».
 * Нажатие — справа по центру выезжают 5 человек, с кем вы последними переписывались, и «Ещё…».
 * Можно и зажать, провести к человеку и отпустить. К выбранному улетает самолётик со звуком.
 */
export function PlaneSend({ excludeId, onSend, onMore, size = 24, className = 'w-10 h-10', label = 'Поделиться' }: {
  excludeId?: string; onSend: (p: Person) => void; onMore: () => void; size?: number; className?: string; label?: string
}) {
  const recent = useRecentPeople(excludeId)
  // Пока веер открыт, порядок не меняется — иначе после отправки люди «прыгали» бы под самолётиком.
  const [top, setTop] = useState<Person[]>([])
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)
  const held = useRef(false)
  const [fan, setFan] = useState(false)
  const [fanIn, setFanIn] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [received, setReceived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const openFan = () => {
    if (!recent.length) { onMore(); return }
    setTop(recent)
    setFan(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setFanIn(true)))
    try { navigator.vibrate?.(12) } catch { /* нет вибрации */ }
  }
  const closeFan = () => { setFanIn(false); setHover(null); setTimeout(() => setFan(false), 220) }

  const send = (person: Person) => {
    const b = btn.current?.getBoundingClientRect()
    const t = document.querySelector(`[data-share-person="${person.id}"] [data-avatar]`)?.getBoundingClientRect()
    if (b && t) setFlights((f) => [...f, { id: Date.now(), from: center(b), to: center(t) }])
    playWhoosh()
    onSend(person)
    setTimeout(() => { setReceived(person.id); setToast(`Отправлено: ${person.name}`); try { navigator.vibrate?.(8) } catch { /* ignore */ } }, 1000)
    setTimeout(() => { setReceived(null); closeFan() }, 1450)
  }

  const personAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-share-person]')
    return el ? el.getAttribute('data-share-person') : null
  }

  const onDown = (e: React.PointerEvent) => {
    held.current = false
    btn.current?.setPointerCapture(e.pointerId)
    timer.current = window.setTimeout(() => { timer.current = null; held.current = true; openFan() }, HOLD_MS)
  }
  const onMove = (e: React.PointerEvent) => { if (fan && held.current) setHover(personAt(e.clientX, e.clientY)) }
  const onUp = (e: React.PointerEvent) => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; if (fan) closeFan(); else openFan(); return }
    if (!held.current) return
    held.current = false
    const id = personAt(e.clientX, e.clientY)
    const p = top.find((x) => x.id === id)
    setHover(null)
    if (p) send(p)
    // Отпустили мимо — веер остаётся, можно выбрать касанием.
  }
  const onCancel = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null } }

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const rows = top.length + 1
  const fanTop = vh / 2 - (rows * 68 - 12) / 2

  return (
    <>
      <button ref={btn} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFan() } }}
        className={`relative ${fan ? 'z-[61]' : ''} grid place-items-center ${className} cursor-pointer select-none touch-none [-webkit-touch-callout:none]`}
        aria-label={label}>
        <Icon name="send" size={size} className={fan ? 'text-spark' : ''} />
      </button>

      {fan && createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Кому отправить">
          <div className={`absolute inset-0 bg-black/25 backdrop-blur-[3px] transition-opacity duration-200 ${fanIn ? 'opacity-100' : 'opacity-0'}`} onClick={closeFan} />
          <p className={`absolute left-1/2 -translate-x-1/2 top-[calc(20px+env(safe-area-inset-top,0px))] whitespace-nowrap rounded-full bg-surface/90 backdrop-blur px-4 h-9 inline-flex items-center text-[13px] font-medium shadow-soft transition-opacity ${fanIn ? 'opacity-100' : 'opacity-0'}`}>
            {hover ? `Отпустите — отправим ${top.find((x) => x.id === hover)?.name}` : 'Кому отправить?'}
          </p>
          {top.map((p, i) => {
            const y = fanTop + i * 68
            const arc = Math.sin((i / Math.max(rows - 1, 1)) * Math.PI) * 26
            const on = hover === p.id
            return (
              <button key={p.id} data-share-person={p.id} onClick={() => send(p)}
                className="absolute flex items-center gap-2 cursor-pointer"
                style={{ top: y, right: 12 + arc, transform: fanIn ? 'translateX(0)' : 'translateX(140%)', transition: `transform .32s cubic-bezier(.2,.9,.3,1.2) ${i * 40}ms` }}
                aria-label={`Отправить ${p.name}`}>
                <span className={`rounded-full bg-surface/95 backdrop-blur px-3 h-8 inline-flex items-center text-[13px] shadow-soft transition ${on ? 'font-semibold scale-105' : 'opacity-90'}`}>{p.name}</span>
                <span data-avatar className={`rounded-full p-[2.5px] transition duration-150 ${on ? 'bg-brand scale-[1.18]' : 'bg-surface'} ${received === p.id ? 'anim-received' : ''}`}>
                  <span className="block rounded-full bg-surface p-[2px]"><Avatar name={p.name} hue={p.hue} src={p.photo} size={50} /></span>
                </span>
              </button>
            )
          })}
          <button onClick={() => { closeFan(); onMore() }} className="absolute flex items-center gap-2 cursor-pointer"
            style={{ top: fanTop + top.length * 68, right: 12, transform: fanIn ? 'translateX(0)' : 'translateX(140%)', transition: `transform .32s cubic-bezier(.2,.9,.3,1.2) ${top.length * 40}ms` }}
            aria-label="Ещё способы поделиться">
            <span className="rounded-full bg-surface/95 backdrop-blur px-3 h-8 inline-flex items-center text-[13px] shadow-soft opacity-90">Ссылка, копировать…</span>
            <span className="grid place-items-center w-[59px] h-[59px] rounded-full bg-surface shadow-soft"><Icon name="more" size={24} /></span>
          </button>
        </div>,
        document.body,
      )}

      {flights.map((f) => createPortal(<PlaneFlight key={f.id} from={f.from} to={f.to} onDone={() => setFlights((x) => x.filter((y) => y.id !== f.id))} />, document.body))}

      {toast && createPortal(
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[70] rounded-full bg-fg text-bg px-4 h-10 inline-flex items-center gap-2 text-[14px] font-medium shadow-soft" role="status">
          <Icon name="send" size={16} /> {toast}
        </div>,
        document.body,
      )}
    </>
  )
}

/** Самолётик под планом: веер друзей + меню «Поделиться». */
export function ShareButton({ activity, now }: { activity: Activity; now: number }) {
  const { state, dispatch } = useStore()
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const others = state.people.filter((p) => p.id !== activity.authorId).slice(0, 12)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t) }, [toast])

  const sendTo = (person: Person) => {
    dispatch({ type: 'share', personId: person.id, activityId: activity.id })
    dispatch({ type: 'repost', activityId: activity.id })
  }
  const text = `${activity.title} — ${activity.area}, ${planWhen(activity, now).toLowerCase()}. Нашёл в Match`
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setToast('Скопировано'); dispatch({ type: 'repost', activityId: activity.id }) } catch { setToast('Не удалось скопировать — выделите текст вручную') }
    setSheet(false)
  }
  const shareOut = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Match', text }); dispatch({ type: 'repost', activityId: activity.id }); setSheet(false); return }
    } catch { /* отменили или недоступно — копируем */ }
    await copy()
  }

  return (
    <>
      <PlaneSend excludeId={activity.authorId} onSend={sendTo} onMore={() => setSheet(true)} label="Поделиться планом" />
      {toast && createPortal(
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[70] rounded-full bg-fg text-bg px-4 h-10 inline-flex items-center text-[14px] font-medium shadow-soft" role="status">{toast}</div>,
        document.body,
      )}
      {createPortal(
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Поделиться">
          <div className="flex flex-col gap-5">
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
              {others.map((p) => (
                <button key={p.id} onClick={() => { sendTo(p); setToast(`Отправлено: ${p.name}`) }} className="flex flex-col items-center gap-1 w-16 shrink-0 cursor-pointer" aria-label={`Отправить ${p.name}`}>
                  <Avatar name={p.name} hue={p.hue} src={p.photo} size={56} />
                  <span className="text-[12px] truncate w-full text-center">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={shareOut} className="h-12 rounded-2xl bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="send" size={18} /> Поделиться</button>
              <button onClick={copy} className="h-12 rounded-2xl bg-surface-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="copy" size={18} /> Копировать</button>
            </div>
            <p className="text-[13px] text-muted p-3 rounded-2xl bg-surface-2 select-all">{text}</p>
          </div>
        </Sheet>,
        document.body,
      )}
    </>
  )
}

/** Бумажный самолётик со скруглёнными углами, окрашен фирменным градиентом; тень выделяет второе крыло. */
function PaperPlane({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="plane-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--amber)' }} />
          <stop offset=".55" style={{ stopColor: 'var(--spark)' }} />
          <stop offset="1" style={{ stopColor: 'var(--violet)' }} />
        </linearGradient>
      </defs>
      <path d="M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.63-.63l-19 6.5a.5.5 0 0 0-.03.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"
        fill="url(#plane-grad)" stroke="#fff" strokeWidth=".8" strokeLinejoin="round" />
      <path d="M21.85 2.15 10.91 13.09" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10.91 13.09 14.54 21.69a.5.5 0 0 0 .93-.03l6.38-19.51z" fill="#000" fillOpacity=".14" />
    </svg>
  )
}

// Нос самолётика смотрит вверх-вправо: поправка, чтобы он летел носом вперёд.
const NOSE_ANGLE = -45

/** Самолётик летит по плавной дуге к аватарке получателя, покачиваясь, со шлейфом. */
function PlaneFlight({ from, to, onDone }: { from: Point; to: Point; onDone: () => void }) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const done = useRef(onDone)
  useEffect(() => { done.current = onDone })
  useEffect(() => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const lift = Math.min(170, Math.abs(dx) * 0.5 + Math.abs(dy) * 0.2 + 80)
    // Квадратичная кривая Безье: старт → контрольная точка выше середины → цель.
    const c = { x: dx * 0.35, y: Math.min(0, dy) * 0.5 - lift }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const N = 30
    const frames: Keyframe[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const x = 2 * (1 - t) * t * c.x + t * t * dx
      const y = 2 * (1 - t) * t * c.y + t * t * dy
      const tx = 2 * (1 - t) * c.x + 2 * t * (dx - c.x)
      const ty = 2 * (1 - t) * c.y + 2 * t * (dy - c.y)
      const wobble = Math.sin(t * Math.PI * 3) * 8 * (1 - t)
      const angle = (Math.atan2(ty, tx) * 180) / Math.PI - NOSE_ANGLE + wobble
      const scale = 0.85 + Math.sin(t * Math.PI) * 0.45 - t * 0.35
      frames.push({ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg) scale(${scale})`, opacity: t > 0.88 ? (1 - t) / 0.12 : 1 })
    }
    const anims = refs.current.map((el, i) => el?.animate(frames, {
      duration: reduce ? 200 : 1100, delay: reduce ? 0 : i * 70, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'both',
    }))
    const last = anims[anims.length - 1]
    if (last) last.onfinish = () => done.current()
    return () => anims.forEach((a) => a?.cancel())
  }, [from, to])
  return (
    <>
      {[1, 0.35, 0.15].map((o, i) => (
        <div key={i} ref={(el) => { refs.current[i] = el }} className="fixed pointer-events-none drop-shadow-[0_6px_10px_rgb(0_0_0/.25)]"
          style={{ left: from.x, top: from.y, zIndex: 65 - i, opacity: o, filter: i ? `blur(${i}px)` : undefined }}>
          <div style={{ opacity: o }}><PaperPlane size={i ? 36 : 44} /></div>
        </div>
      ))}
    </>
  )
}
