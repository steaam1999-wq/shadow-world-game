import { useEffect, useRef } from 'react'
import { engine, type Track } from './engine'
import { GENRE_LABEL, formatTime, usePlayer } from './player'
import { Icon } from '../components/ui'

/** Обложка-пластинка: крутится, пока трек играет. */
export function Disc({ track, size, spinning }: { track: Track; size: number; spinning: boolean }) {
  const h = track.hue
  return (
    <span className={`relative grid place-items-center rounded-full shrink-0 shadow-soft ${spinning ? 'anim-spin' : ''}`}
      style={{ width: size, height: size, background: `conic-gradient(from 30deg, hsl(${h} 70% 62%), hsl(${(h + 60) % 360} 70% 58%), hsl(${(h + 150) % 360} 60% 55%), hsl(${h} 70% 62%))` }}>
      <span className="absolute inset-[18%] rounded-full" style={{ background: 'repeating-radial-gradient(circle, rgb(0 0 0 / .14) 0 1px, transparent 1px 4px)' }} />
      <span className="relative rounded-full bg-surface" style={{ width: size * 0.2, height: size * 0.2 }} />
    </span>
  )
}

/** Кнопка «♫ Название» под именем — запускает песню человека. */
export function TrackChip({ track, queue, light = false }: { track: Track; queue?: Track[]; light?: boolean }) {
  const player = usePlayer()
  const active = player.track?.id === track.id && player.playing
  return (
    <button onClick={(e) => { e.stopPropagation(); if (active) player.toggle(); else player.play(track, queue) }}
      className={`inline-flex items-center gap-1 max-w-full text-[12px] cursor-pointer ${light ? 'text-white/90' : 'text-muted hover:text-fg'}`}
      aria-label={active ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}>
      <Icon name={active ? 'pause' : 'note'} size={13} fill={active} />
      <span className="truncate">{track.title} · {track.artist}</span>
      {active && <Bars />}
    </button>
  )
}

function Bars() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3 ml-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => <span key={i} className="w-[2px] bg-current rounded-full anim-eq" style={{ animationDelay: `${i * -0.3}s` }} />)}
    </span>
  )
}

/** Мини-плеер над нижним меню. */
export function MiniPlayer() {
  const p = usePlayer()
  if (!p.track || p.expanded) return null
  const pct = p.duration ? (p.position / p.duration) * 100 : 0
  return (
    <div className="anim-rise fixed inset-x-3 mx-auto bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-30 max-w-[456px] rounded-[24px] glass overflow-hidden">
      <div className="flex items-center gap-3 p-2 pr-2.5">
        <button onClick={() => p.setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label="Открыть плеер">
          <Disc track={p.track} size={42} spinning={p.playing} />
          <span className="min-w-0">
            <span className="block font-semibold text-[14px] truncate">{p.track.title}</span>
            <span className="block text-[12px] text-muted truncate">{p.track.artist}</span>
          </span>
        </button>
        <button onClick={p.toggle} className="grid place-items-center w-10 h-10 rounded-full bg-fg text-bg cursor-pointer shrink-0" aria-label={p.playing ? 'Пауза' : 'Играть'}>
          <Icon name={p.playing ? 'pause' : 'play'} size={18} fill />
        </button>
        <button onClick={p.next} className="grid place-items-center w-9 h-9 rounded-full cursor-pointer shrink-0" aria-label="Следующий трек"><Icon name="skip" size={20} fill /></button>
        <button onClick={p.close} className="grid place-items-center w-8 h-8 rounded-full text-muted cursor-pointer shrink-0" aria-label="Закрыть плеер"><Icon name="x" size={16} /></button>
      </div>
      <div className="h-[3px] bg-surface-2"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

/** Полноэкранный плеер: обложка, визуализатор, перемотка, громкость и очередь. */
export function FullPlayer() {
  const p = usePlayer()
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!p.expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.setExpanded(false)
      if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT') { e.preventDefault(); p.toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [p])
  if (!p.expanded) return null
  const t = p.track
  const h = t?.hue ?? 320

  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true" aria-label="Плеер">
      <div className="absolute inset-0 bg-bg" />
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(80% 60% at 30% 10%, hsl(${h} 70% 70% / .55), transparent 70%), radial-gradient(70% 60% at 90% 60%, hsl(${(h + 70) % 360} 70% 65% / .45), transparent 70%)` }} />
      <div className="relative w-full max-w-[480px] h-full overflow-y-auto flex flex-col px-5 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between h-12">
          <button onClick={() => p.setExpanded(false)} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Свернуть плеер">
            <Icon name="down" size={24} />
          </button>
          <span className="eyebrow">Музыка вайба</span>
          <button onClick={() => fileRef.current?.click()} className="grid place-items-center w-10 h-10 -mr-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Загрузить свой трек">
            <Icon name="upload" size={22} />
          </button>
          <input ref={fileRef} id="track-file" type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) p.addFile(f); e.target.value = '' }} />
        </div>

        {t ? (
          <>
            <div className="grid place-items-center py-6">
              <Disc track={t} size={Math.min(260, typeof window !== 'undefined' ? window.innerWidth - 120 : 260)} spinning={p.playing} />
            </div>
            <Visualizer playing={p.playing} />
            <div className="flex items-end justify-between gap-3 mt-4">
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-[24px] leading-tight truncate">{t.title}</h2>
                <p className="text-muted truncate">{t.artist} · {GENRE_LABEL[t.genre]}{t.bpm ? ` · ${t.bpm} BPM` : ''}</p>
              </div>
              <button onClick={() => p.toggleLike(t.id)} className={`grid place-items-center w-11 h-11 rounded-full cursor-pointer shrink-0 ${p.likes.includes(t.id) ? 'text-spark' : 'text-muted'}`} aria-label={p.likes.includes(t.id) ? 'Убрать из любимых' : 'В любимые'} aria-pressed={p.likes.includes(t.id)}>
                <Icon name="heart" size={26} fill={p.likes.includes(t.id)} />
              </button>
            </div>
            <div className="mt-4">
              <input id="seek" type="range" min={0} max={Math.max(p.duration, 0.1)} step={0.1} value={Math.min(p.position, p.duration)} onChange={(e) => p.seek(Number(e.target.value))}
                className="w-full accent-[var(--spark)] cursor-pointer" aria-label="Перемотка" />
              <div className="flex justify-between text-[12px] text-muted font-mono tnum"><span>{formatTime(p.position)}</span><span>{formatTime(p.duration)}</span></div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={p.toggleShuffle} className={`grid place-items-center w-11 h-11 rounded-full cursor-pointer ${p.shuffle ? 'text-spark' : 'text-muted'}`} aria-label="Перемешать" aria-pressed={p.shuffle}><Icon name="shuffle" size={22} /></button>
              <button onClick={p.prev} className="grid place-items-center w-12 h-12 rounded-full cursor-pointer hover:bg-surface-2" aria-label="Предыдущий трек"><Icon name="skip" size={26} fill className="rotate-180" /></button>
              <button onClick={p.toggle} className="grid place-items-center w-18 h-18 rounded-full bg-brand text-white shadow-soft cursor-pointer active:scale-95 transition" aria-label={p.playing ? 'Пауза' : 'Играть'}>
                <Icon name={p.playing ? 'pause' : 'play'} size={30} fill />
              </button>
              <button onClick={p.next} className="grid place-items-center w-12 h-12 rounded-full cursor-pointer hover:bg-surface-2" aria-label="Следующий трек"><Icon name="skip" size={26} fill /></button>
              <button onClick={p.cycleRepeat} className={`relative grid place-items-center w-11 h-11 rounded-full cursor-pointer ${p.repeat !== 'off' ? 'text-spark' : 'text-muted'}`}
                aria-label={p.repeat === 'one' ? 'Повтор трека' : p.repeat === 'all' ? 'Повтор очереди' : 'Без повтора'}>
                <Icon name="repeat" size={22} />
                {p.repeat === 'one' && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold">1</span>}
              </button>
            </div>
            <label htmlFor="volume" className="flex items-center gap-3 mt-5 text-muted">
              <Icon name="volume" size={20} />
              <input id="volume" type="range" min={0} max={1} step={0.01} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} className="flex-1 accent-[var(--spark)] cursor-pointer" aria-label="Громкость" />
            </label>
          </>
        ) : (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="font-display font-semibold text-xl">Что послушаем?</p>
            <p className="text-muted text-[14px]">У каждого человека своя песня вайба — по ответу в тесте о музыке.</p>
            <button onClick={p.toggle} className="h-11 px-5 rounded-2xl bg-brand text-white font-semibold cursor-pointer">Включить первую</button>
          </div>
        )}

        <h3 className="eyebrow mt-8 mb-2">Очередь</h3>
        <ul className="flex flex-col -mx-2">
          {p.queue.map((q) => {
            const cur = q.id === t?.id
            return (
              <li key={q.id}>
                <button onClick={() => p.play(q)} className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left cursor-pointer ${cur ? 'bg-surface/80' : 'hover:bg-surface/60'}`}>
                  <Disc track={q} size={40} spinning={cur && p.playing} />
                  <span className="flex-1 min-w-0">
                    <span className={`block font-semibold text-[14px] truncate ${cur ? 'text-spark' : ''}`}>{q.title}</span>
                    <span className="block text-[12px] text-muted truncate">{q.artist} · {GENRE_LABEL[q.genre]}</span>
                  </span>
                  {cur && p.playing ? <Bars /> : <Icon name="play" size={16} fill className="text-muted" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** Столбики спектра из анализатора Web Audio. */
function Visualizer({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')!
    let raf = 0
    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth, hgt = canvas.clientHeight
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = hgt * dpr }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx2d.clearRect(0, 0, w, hgt)
      const bins = 32
      const data = new Uint8Array(64)
      if (engine.ctx && playing) engine.analyser.getByteFrequencyData(data)
      const styles = getComputedStyle(document.documentElement)
      const grad = ctx2d.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, styles.getPropertyValue('--amber').trim() || '#ffb938')
      grad.addColorStop(0.5, styles.getPropertyValue('--spark').trim() || '#e8336f')
      grad.addColorStop(1, styles.getPropertyValue('--violet').trim() || '#7a4cf2')
      ctx2d.fillStyle = grad
      const gap = 3
      const bw = (w - gap * (bins - 1)) / bins
      for (let i = 0; i < bins; i++) {
        const v = data[i + 2] / 255
        const bh = Math.max(3, v * hgt)
        const x = i * (bw + gap)
        ctx2d.beginPath()
        ctx2d.roundRect(x, (hgt - bh) / 2, bw, bh, bw / 2)
        ctx2d.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return <canvas ref={ref} className="w-full h-14" aria-hidden="true" />
}
