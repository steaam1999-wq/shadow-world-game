import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Avatar, Icon } from './ui'

export interface ViewerPhoto { src: string; who: string; hue?: number; avatar?: string; at?: number; caption?: string }

const fmt = (ts: number) => {
  const d = new Date(ts), now = new Date()
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `сегодня в ${time}`
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в ${time}`
}

/**
 * Просмотр фото на весь экран, как в мессенджерах: листание влево-вправо, приближение двумя пальцами
 * и двойным нажатием, смахивание вниз — закрыть, касание — спрятать или показать панели.
 */
export function PhotoViewer({ photos, start, onClose }: { photos: ViewerPhoto[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const [ui, setUi] = useState(true)
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 }) // приближение текущего фото
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false }) // листание / смахивание
  const [closing, setClosing] = useState(false)
  const [toast, setToast] = useState('')
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const g = useRef<{ mode: 'none' | 'swipe' | 'pan' | 'pinch'; sx: number; sy: number; z0: typeof z; dist: number; mid: { x: number; y: number }; axis: 'x' | 'y' | null } | null>(null)
  const lastTap = useRef({ t: 0, x: 0, y: 0 })
  const tapTimer = useRef(0)
  const p = photos[i]

  useEffect(() => { setZ({ s: 1, x: 0, y: 0 }) }, [i])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 1800); return () => clearTimeout(t) }, [toast])

  const close = () => { setClosing(true); setTimeout(onClose, 180) }
  const go = (d: number) => { if (photos[i + d]) setI(i + d) }
  const W = () => window.innerWidth
  const H = () => window.innerHeight
  const clampPan = (s: number, x: number, y: number) => {
    const mx = (W() * (s - 1)) / 2, my = (H() * (s - 1)) / 2
    return { s, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }
  }

  const down = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()]
      g.current = { mode: 'pinch', sx: 0, sy: 0, z0: z, dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, axis: null }
      setDrag({ x: 0, y: 0, active: false })
    } else {
      g.current = { mode: z.s > 1 ? 'pan' : 'swipe', sx: e.clientX, sy: e.clientY, z0: z, dist: 0, mid: { x: 0, y: 0 }, axis: null }
    }
  }
  const move = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId) || !g.current) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const st = g.current
    if (st.mode === 'pinch' && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()]
      const s = Math.min(5, Math.max(1, st.z0.s * (Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, st.dist))))
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      // Точка между пальцами остаётся под пальцами.
      const cx = st.mid.x - W() / 2, cy = st.mid.y - H() / 2
      const k = s / st.z0.s
      setZ(clampPan(s, cx - (cx - st.z0.x) * k + (mid.x - st.mid.x), cy - (cy - st.z0.y) * k + (mid.y - st.mid.y)))
      return
    }
    const dx = e.clientX - st.sx, dy = e.clientY - st.sy
    if (st.mode === 'pan') { setZ(clampPan(z.s, st.z0.x + dx, st.z0.y + dy)); return }
    if (st.mode === 'swipe') {
      if (!st.axis && Math.hypot(dx, dy) > 8) st.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (st.axis === 'x') setDrag({ x: dx, y: 0, active: true })
      if (st.axis === 'y') setDrag({ x: 0, y: Math.max(0, dy), active: true })
    }
  }
  const up = (e: React.PointerEvent) => {
    pts.current.delete(e.pointerId)
    const st = g.current
    if (!st) return
    if (st.mode === 'pinch') {
      if (pts.current.size === 0) { g.current = null; if (z.s < 1.05) setZ({ s: 1, x: 0, y: 0 }) }
      else { const [r] = [...pts.current.values()]; g.current = { ...st, mode: z.s > 1 ? 'pan' : 'swipe', sx: r.x, sy: r.y, z0: z } }
      return
    }
    if (pts.current.size) return
    g.current = null
    const moved = Math.hypot(e.clientX - st.sx, e.clientY - st.sy) > 8
    if (st.mode === 'swipe' && st.axis === 'x') {
      const d = drag.x < -W() * 0.18 ? 1 : drag.x > W() * 0.18 ? -1 : 0
      if (d && photos[i + d]) go(d)
      setDrag({ x: 0, y: 0, active: false })
      return
    }
    if (st.mode === 'swipe' && st.axis === 'y') {
      if (drag.y > 110) close()
      setDrag({ x: 0, y: 0, active: false })
      return
    }
    if (moved) return
    // Касание: двойное — приблизить или отдалить, одиночное — спрятать панели.
    const now = Date.now()
    if (now - lastTap.current.t < 280 && Math.hypot(e.clientX - lastTap.current.x, e.clientY - lastTap.current.y) < 30) {
      clearTimeout(tapTimer.current)
      lastTap.current.t = 0
      if (z.s > 1) setZ({ s: 1, x: 0, y: 0 })
      else {
        const s = 2.5, cx = e.clientX - W() / 2, cy = e.clientY - H() / 2
        setZ(clampPan(s, -cx * (s - 1), -cy * (s - 1)))
      }
      return
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY }
    tapTimer.current = window.setTimeout(() => setUi((v) => !v), 280)
  }

  const blob = async () => (await fetch(p.src)).blob()
  const fileName = () => `match-${new Date(p.at ?? Date.now()).toISOString().slice(0, 10)}.jpg`
  const save = async () => {
    try {
      const b = await blob()
      const file = new File([b], fileName(), { type: b.type || 'image/jpeg' })
      // На телефоне «Сохранить изображение» есть в системном меню — открываем его.
      if (/iPhone|iPad|Android/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b); a.download = fileName(); a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      setToast('Фото сохранено')
    } catch (err) { if ((err as Error).name !== 'AbortError') setToast('Не получилось сохранить') }
  }
  const share = async () => {
    try {
      const b = await blob()
      const file = new File([b], fileName(), { type: b.type || 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] })
      else { await navigator.clipboard.writeText(p.src); setToast('Ссылка скопирована') }
    } catch (err) { if ((err as Error).name !== 'AbortError') setToast('Не получилось поделиться') }
  }

  const fade = Math.max(0.35, 1 - drag.y / 500)
  const anim = drag.active || g.current?.mode === 'pinch' || g.current?.mode === 'pan' ? '' : 'transition-transform duration-300 ease-out'
  const glass = 'bg-white/15 backdrop-blur-md'

  return createPortal(
    <div className={`fixed inset-0 z-[96] select-none ${closing ? 'opacity-0 transition-opacity duration-200' : 'anim-fade'}`} role="dialog" aria-modal="true" aria-label="Просмотр фото">
      <div className="absolute inset-0 bg-black transition-opacity" style={{ opacity: fade }} />

      {/* Лента фото: текущее и соседние */}
      <div className="absolute inset-0 overflow-hidden touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {[-1, 0, 1].map((d) => {
          const ph = photos[i + d]
          if (!ph) return null
          const cur = d === 0
          const tx = d * W() + drag.x
          return (
            <div key={i + d} className={`absolute inset-0 grid place-items-center ${anim}`}
              style={{ transform: `translate3d(${tx}px, ${cur ? drag.y : 0}px, 0) scale(${cur ? 1 - drag.y / 2000 : 1})` }}>
              <img src={ph.src} alt={ph.caption || 'Фото'} draggable={false}
                className={`absolute inset-0 w-full h-full object-contain ${cur ? anim : ''}`}
                style={cur ? { transform: `translate3d(${z.x}px, ${z.y}px, 0) scale(${z.s})` } : undefined} />
            </div>
          )
        })}
      </div>

      {/* Верхняя панель: кто и когда, счётчик, закрыть */}
      <div className={`absolute inset-x-0 top-0 z-10 transition-opacity duration-200 ${ui && !drag.y ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-6 bg-gradient-to-b from-black/70 to-transparent text-white">
          <button onClick={close} className="grid place-items-center w-10 h-10 rounded-full hover:bg-white/10 cursor-pointer" aria-label="Закрыть"><Icon name="back" size={22} /></button>
          <Avatar name={p.who} hue={p.hue ?? 200} src={p.avatar} size={36} />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold text-[15px] truncate">{p.who}</div>
            {p.at && <div className="text-[12px] text-white/70 truncate">{fmt(p.at)}</div>}
          </div>
          {photos.length > 1 && <span className={`px-2.5 h-7 rounded-full inline-flex items-center text-[12.5px] font-semibold tnum ${glass}`}>{i + 1} / {photos.length}</span>}
        </div>
      </div>

      {/* Нижняя панель: подпись и действия */}
      <div className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-200 ${ui && !drag.y ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="px-4 pt-10 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black/75 to-transparent text-white flex flex-col gap-3">
          {p.caption && <p className="text-[15px] leading-snug whitespace-pre-wrap break-words max-h-28 overflow-y-auto" data-no-translate>{p.caption}</p>}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { void save() }} className={`h-11 px-5 rounded-full inline-flex items-center gap-2 text-[14px] font-semibold cursor-pointer ${glass}`}><Icon name="download" size={18} /> Сохранить</button>
            <button onClick={() => { void share() }} className={`h-11 px-5 rounded-full inline-flex items-center gap-2 text-[14px] font-semibold cursor-pointer ${glass}`}><Icon name="share" size={18} /> Поделиться</button>
          </div>
        </div>
      </div>

      {/* Стрелки для компьютера */}
      {photos[i - 1] && <button onClick={() => go(-1)} className={`hidden sm:grid absolute left-4 top-1/2 -translate-y-1/2 z-10 place-items-center w-11 h-11 rounded-full text-white cursor-pointer ${glass}`} aria-label="Предыдущее фото"><Icon name="back" size={20} /></button>}
      {photos[i + 1] && <button onClick={() => go(1)} className={`hidden sm:grid absolute right-4 top-1/2 -translate-y-1/2 z-10 place-items-center w-11 h-11 rounded-full text-white cursor-pointer rotate-180 ${glass}`} aria-label="Следующее фото"><Icon name="back" size={20} /></button>}

      {toast && <div className="anim-rise absolute left-1/2 -translate-x-1/2 bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-20 rounded-full bg-white text-black px-4 h-10 inline-flex items-center text-[14px] font-medium" role="status">{toast}</div>}
    </div>,
    document.body,
  )
}
