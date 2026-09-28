import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { compatibility, whenLabel } from '../lib'
import { Avatar, Icon, Sheet } from './ui'
import type { Activity, Person } from '../types'

const HOLD_MS = 380
interface Point { x: number; y: number }
interface Flight { id: number; from: Point; to: Point }

const center = (r: DOMRect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

/**
 * Самолётик под постом.
 * Короткое нажатие — меню «Поделиться». Долгое — справа выезжают 5 человек, с которыми вы чаще
 * всего переписываетесь; отпустите палец на нужном, и к нему улетит самолётик с планом.
 */
export function ShareButton({ activity, now }: { activity: Activity; now: number }) {
  const { state, dispatch } = useStore()
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)
  const [fan, setFan] = useState(false)
  const [fanIn, setFanIn] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [sheet, setSheet] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const [received, setReceived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // «Чаще всего общаетесь» — по числу сообщений в капсулах, дальше по совместимости.
  const top = useMemo(() => {
    const count = (p: Person) => state.capsules.filter((c) => c.personId === p.id).reduce((n, c) => n + c.messages.filter((m) => m.from !== 'system').length, 0)
    return state.people
      .filter((p) => p.id !== activity.authorId)
      .map((p) => ({ p, n: count(p), c: compatibility(state.me!, p).score }))
      .sort((a, b) => b.n - a.n || b.c - a.c)
      .slice(0, 5)
      .map((x) => x.p)
  }, [state.people, state.capsules, state.me, activity.authorId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const openFan = () => {
    setFan(true)
    requestAnimationFrame(() => setFanIn(true))
    try { navigator.vibrate?.(12) } catch { /* нет вибрации */ }
  }
  const closeFan = () => { setFanIn(false); setHover(null); setTimeout(() => setFan(false), 220) }

  const send = (person: Person, target?: Element | null) => {
    const b = btn.current?.getBoundingClientRect()
    const t = (target ?? document.querySelector(`[data-share-person="${person.id}"]`))?.getBoundingClientRect()
    if (b && t) setFlights((f) => [...f, { id: Date.now(), from: center(b), to: center(t) }])
    dispatch({ type: 'share', personId: person.id, activityId: activity.id })
    setTimeout(() => { setReceived(person.id); setToast(`Отправлено: ${person.name}`) }, 1000)
    setTimeout(() => { setReceived(null); if (fan) closeFan() }, 1550)
  }

  const personAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-share-person]')
    return el ? el.getAttribute('data-share-person') : null
  }

  const onDown = (e: React.PointerEvent) => {
    btn.current?.setPointerCapture(e.pointerId)
    timer.current = window.setTimeout(() => { timer.current = null; openFan() }, HOLD_MS)
  }
  const onMove = (e: React.PointerEvent) => { if (fan) setHover(personAt(e.clientX, e.clientY)) }
  const onUp = (e: React.PointerEvent) => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; setSheet(true); return }
    if (!fan) return
    const id = personAt(e.clientX, e.clientY)
    const p = top.find((x) => x.id === id)
    if (p) send(p)
    // Отпустили мимо — веер остаётся, можно выбрать касанием.
  }
  const onCancel = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null } }

  const text = `${activity.title} — ${activity.area}, ${whenLabel(activity.startsAt, now)}. Нашёл в «Искре»`
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setToast('Скопировано') } catch { setToast('Не удалось скопировать — выделите текст вручную') }
    setSheet(false)
  }
  const shareOut = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Искра', text }); setSheet(false); return }
    } catch { /* отменили или недоступно — копируем */ }
    await copy()
  }

  // Веер: столбик аватарок у правого края, дугой над кнопкой (или под ней, если сверху мало места).
  const b = btn.current?.getBoundingClientRect()
  const up = b ? b.top > 5 * 68 + 60 : true

  return (
    <>
      <button ref={btn} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(true) } }}
        className="relative z-[61] grid place-items-center w-10 h-10 cursor-pointer select-none touch-none [-webkit-touch-callout:none]"
        aria-label="Поделиться. Зажмите, чтобы быстро отправить другу">
        <Icon name="send" size={24} className={fan ? 'text-spark' : ''} />
      </button>

      {fan && b && createPortal(
        <div className="fixed inset-0 z-[60]" onPointerUp={(e) => { if (e.target === e.currentTarget) closeFan() }}>
          <div className={`absolute inset-0 bg-black/25 backdrop-blur-[3px] transition-opacity duration-200 ${fanIn ? 'opacity-100' : 'opacity-0'}`} onClick={closeFan} />
          <p className={`absolute left-1/2 -translate-x-1/2 top-[calc(20px+env(safe-area-inset-top,0px))] rounded-full bg-surface/90 backdrop-blur px-4 h-9 inline-flex items-center text-[13px] font-medium shadow-soft transition-opacity ${fanIn ? 'opacity-100' : 'opacity-0'}`}>
            {hover ? `Отпустите — отправим ${top.find((x) => x.id === hover)?.name}` : 'Проведите к человеку и отпустите'}
          </p>
          {top.map((p, i) => {
            const y = up ? b.top - 64 - i * 68 : b.bottom + 16 + i * 68
            const arc = Math.sin((i / Math.max(top.length - 1, 1)) * Math.PI) * 26
            const on = hover === p.id
            return (
              <button key={p.id} data-share-person={p.id} onClick={() => send(p)}
                className="absolute flex items-center gap-2 cursor-pointer"
                style={{ top: y, right: 12 + arc, transform: fanIn ? 'translateX(0)' : 'translateX(140%)', transition: `transform .32s cubic-bezier(.2,.9,.3,1.2) ${i * 40}ms` }}
                aria-label={`Отправить ${p.name}`}>
                <span className={`rounded-full bg-surface/95 backdrop-blur px-3 h-8 inline-flex items-center text-[13px] shadow-soft transition ${on ? 'font-semibold scale-105' : 'opacity-90'}`}>{p.name}</span>
                <span className={`rounded-full p-[2.5px] transition duration-150 ${on ? 'bg-brand scale-[1.18]' : 'bg-surface'} ${received === p.id ? 'anim-received' : ''}`}>
                  <span className="block rounded-full bg-surface p-[2px]"><Avatar name={p.name} hue={p.hue} size={50} /></span>
                </span>
              </button>
            )
          })}
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

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Поделиться">
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
            {top.map((p) => (
              <button key={p.id} data-share-person={p.id} onClick={(e) => send(p, e.currentTarget.querySelector('[data-avatar]'))} className="flex flex-col items-center gap-1 w-16 shrink-0 cursor-pointer" aria-label={`Отправить ${p.name}`}>
                <span data-avatar className={`rounded-full ${received === p.id ? 'anim-received' : ''}`}><Avatar name={p.name} hue={p.hue} size={56} /></span>
                <span className="text-[12px] truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={shareOut} className="h-12 rounded-2xl bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="send" size={18} /> Поделиться</button>
            <button onClick={copy} className="h-12 rounded-2xl bg-surface-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="copy" size={18} /> Копировать</button>
          </div>
          <p className="text-[13px] text-muted p-3 rounded-2xl bg-surface-2 select-all">{text}</p>
          <p className="text-[12px] text-muted text-center">Совет: зажмите самолётик под постом — справа появятся друзья, отправка в одно движение.</p>
        </div>
      </Sheet>
    </>
  )
}

/** Бумажный самолётик: два крыла и киль, окрашен фирменным градиентом. */
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
      <g stroke="#fff" strokeWidth=".7" strokeLinejoin="round">
        <path d="M21.5 2.5 2.5 7.6l7 3.4z" fill="url(#plane-grad)" />
        <path d="M21.5 2.5 9.5 11l3.9 10.5z" fill="url(#plane-grad)" />
        <path d="M9.5 11l.9 5.6 1.9-2.3z" fill="#000" fillOpacity=".25" />
      </g>
    </svg>
  )
}

// Нос самолётика смотрит вверх-вправо: поправка, чтобы он летел носом вперёд.
const NOSE_ANGLE = (Math.atan2(-8.5, 12) * 180) / Math.PI

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
