import { useEffect, useRef, useState } from 'react'
import type { Track } from './engine'
import { formatTime, trackLabel, usePlayer } from './player'
import { Icon } from '../components/ui'

/** Обложка-пластинка: крутится, пока трек играет. */
export function Disc({ track, size, spinning }: { track: Track; size: number; spinning: boolean }) {
  const h = track.hue
  return (
    <span className={`relative grid place-items-center rounded-full shrink-0 shadow-soft ${spinning ? 'anim-spin' : ''}`}
      style={{ width: size, height: size, background: `conic-gradient(from 30deg, hsl(${h} 70% 62%), hsl(${(h + 60) % 360} 70% 58%), hsl(${(h + 150) % 360} 60% 55%), hsl(${h} 70% 62%))` }}>
      {track.cover && <img src={track.cover} alt="" className="absolute inset-0 w-full h-full rounded-full object-cover" />}
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

/** Квадратная обложка: фото трека или рисованная по цвету трека. */
export function Artwork({ track, className = '' }: { track: Track; className?: string }) {
  const h = track.hue
  return (
    <span className={`relative block overflow-hidden shrink-0 ${className}`}
      style={{ background: `radial-gradient(90% 80% at 25% 20%, hsl(${(h + 40) % 360} 85% 70%), transparent 60%), linear-gradient(145deg, hsl(${h} 65% 55%), hsl(${(h + 60) % 360} 60% 35%))` }}>
      {track.cover ? <img src={track.cover} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
        <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto w-[38%] h-[38%] text-white/85" aria-hidden="true">
          <path d="M9 17.5V6.4a1.2 1.2 0 0 1 1-1.2l8-1.6a1.2 1.2 0 0 1 1.4 1.2v10.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="6.5" cy="17.5" r="2.5" fill="currentColor" /><circle cx="16.9" cy="15.5" r="2.5" fill="currentColor" />
        </svg>
      )}
    </span>
  )
}

/** Мини-плеер над нижним меню, как в Яндекс Музыке: обложка, название, лайк и пауза. */
export function MiniPlayer() {
  const p = usePlayer()
  if (!p.track || p.expanded) return null
  const t = p.track
  const liked = p.likes.includes(t.id)
  const pct = p.duration ? (p.position / p.duration) * 100 : 0
  return (
    <div className="anim-rise fixed inset-x-3 mx-auto bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-30 max-w-[456px] rounded-[20px] glass overflow-hidden">
      <div className="h-[2px] bg-fg/10"><div className="h-full bg-fg/70" style={{ width: `${pct}%` }} /></div>
      <div className="flex items-center gap-3 p-2 pr-2">
        <button onClick={() => p.setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label="Открыть плеер">
          <Artwork track={t} className="w-11 h-11 rounded-[10px]" />
          <span className="min-w-0">
            <span className="block font-semibold text-[14px] truncate">{t.title}</span>
            <span className="block text-[12px] text-muted truncate">{t.artist}</span>
          </span>
        </button>
        <button onClick={() => p.toggleLike(t.id, t)} className={`grid place-items-center w-10 h-10 rounded-full cursor-pointer shrink-0 ${liked ? 'text-spark' : ''}`} aria-label={liked ? 'Убрать из любимых' : 'Нравится'} aria-pressed={liked}>
          <Icon name="heart" size={22} fill={liked} />
        </button>
        <button onClick={p.toggle} className="grid place-items-center w-10 h-10 rounded-full cursor-pointer shrink-0" aria-label={p.playing ? 'Пауза' : 'Играть'}>
          <Icon name={p.playing ? 'pause' : 'play'} size={24} fill />
        </button>
        <button onClick={p.close} className="grid place-items-center w-8 h-8 rounded-full text-muted cursor-pointer shrink-0" aria-label="Закрыть плеер"><Icon name="x" size={16} /></button>
      </div>
    </div>
  )
}

/** Полноэкранный плеер в духе Яндекс Музыки: тёмный фон по цветам обложки, большая обложка, лайк/дизлайк. */
export function FullPlayer() {
  const p = usePlayer()
  const fileRef = useRef<HTMLInputElement>(null)
  const swipe = useRef<number | null>(null)
  const [showQueue, setShowQueue] = useState(false)
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
  const liked = !!t && p.likes.includes(t.id)
  const live = !p.duration || !isFinite(p.duration)
  const pct = live ? 0 : (Math.min(p.position, p.duration) / p.duration) * 100
  const idx = p.queue.findIndex((q) => q.id === t?.id)
  const upNext = idx >= 0 ? [...p.queue.slice(idx + 1), ...p.queue.slice(0, idx)] : p.queue

  return (
    <div className="fixed inset-0 z-50 flex justify-center text-white" role="dialog" aria-modal="true" aria-label="Плеер">
      <div className="absolute inset-0 bg-[#0e0d12]" />
      {t?.cover
        ? <img src={t.cover} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-55" />
        : <div className="absolute inset-0" style={{ background: `radial-gradient(80% 55% at 30% 15%, hsl(${h} 70% 45% / .75), transparent 70%), radial-gradient(70% 60% at 85% 70%, hsl(${(h + 60) % 360} 70% 40% / .6), transparent 70%)` }} />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/70" />

      <div className="relative w-full max-w-[480px] h-full overflow-y-auto no-scrollbar flex flex-col px-6 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between h-12 shrink-0">
          <button onClick={() => p.setExpanded(false)} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-white/10 cursor-pointer" aria-label="Свернуть плеер">
            <Icon name="down" size={26} />
          </button>
          <span className="text-[13px] font-semibold text-white/75 truncate px-2">{t ? trackLabel(t) : 'Музыка'}</span>
          <button onClick={() => fileRef.current?.click()} className="grid place-items-center w-10 h-10 -mr-2 rounded-full hover:bg-white/10 cursor-pointer" aria-label="Загрузить свой трек">
            <Icon name="upload" size={22} />
          </button>
          <input ref={fileRef} id="track-file" type="file" accept="audio/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) p.addFile(f); e.target.value = '' }} />
        </div>

        {t ? (
          <>
            <div className="flex-1 min-h-[16px]" />
            <div className="py-4 grid place-items-center"
              onTouchStart={(e) => { swipe.current = e.touches[0].clientX }}
              onTouchEnd={(e) => {
                if (swipe.current === null) return
                const dx = e.changedTouches[0].clientX - swipe.current
                swipe.current = null
                if (dx < -60) p.next(); else if (dx > 60) p.prev()
              }}>
              <Artwork track={t} className={`w-full max-w-[340px] aspect-square rounded-[16px] shadow-[0_24px_60px_-12px_rgb(0_0_0/.6)] transition-transform duration-500 ease-out ${p.playing ? 'scale-100' : 'scale-[.86]'}`} />
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-[24px] leading-tight truncate">{t.title}</h2>
                <p className="text-[16px] text-white/65 truncate">{t.artist}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/20" />
                <div className="absolute left-0 h-[3px] rounded-full bg-white" style={{ width: `${pct}%` }} />
                <input id="seek" type="range" min={0} max={Math.max(p.duration, 0.1)} step={0.1} value={Math.min(p.position, p.duration || 0)} disabled={live}
                  onChange={(e) => p.seek(Number(e.target.value))} className="yrange relative w-full cursor-pointer disabled:cursor-default" aria-label="Перемотка" />
              </div>
              <div className="flex justify-between text-[12px] text-white/60 font-mono tnum mt-1">
                <span>{formatTime(p.position)}</span><span>{live ? 'эфир' : `−${formatTime(p.duration - p.position)}`}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button onClick={() => { if (liked) p.toggleLike(t.id, t); p.next() }} className="grid place-items-center w-12 h-12 rounded-full text-white/75 hover:bg-white/10 cursor-pointer" aria-label="Не нравится — пропустить">
                <Icon name="heartOff" size={24} />
              </button>
              <button onClick={p.prev} className="grid place-items-center w-14 h-14 rounded-full hover:bg-white/10 cursor-pointer" aria-label="Предыдущий трек"><Icon name="skip" size={30} fill className="rotate-180" /></button>
              <button onClick={p.toggle} className="grid place-items-center w-[76px] h-[76px] rounded-full bg-white text-[#111] shadow-[0_10px_30px_-8px_rgb(0_0_0/.5)] cursor-pointer active:scale-95 transition" aria-label={p.playing ? 'Пауза' : 'Играть'}>
                <Icon name={p.playing ? 'pause' : 'play'} size={32} fill />
              </button>
              <button onClick={p.next} className="grid place-items-center w-14 h-14 rounded-full hover:bg-white/10 cursor-pointer" aria-label="Следующий трек"><Icon name="skip" size={30} fill /></button>
              <button onClick={() => p.toggleLike(t.id, t)} className={`grid place-items-center w-12 h-12 rounded-full hover:bg-white/10 cursor-pointer ${liked ? 'text-[#ff3d6e]' : 'text-white/75'}`} aria-label={liked ? 'Убрать из любимых' : 'Нравится'} aria-pressed={liked}>
                <Icon name="heart" size={26} fill={liked} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-5 text-white/70">
              <button onClick={p.toggleShuffle} className={`grid place-items-center w-10 h-10 rounded-full cursor-pointer ${p.shuffle ? 'text-white bg-white/15' : ''}`} aria-label="Перемешать" aria-pressed={p.shuffle}><Icon name="shuffle" size={20} /></button>
              <label htmlFor="volume" className="flex items-center gap-2 flex-1 mx-3">
                <Icon name="volume" size={18} />
                <input id="volume" type="range" min={0} max={1} step={0.01} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} className="yrange yrange-vol flex-1 cursor-pointer" aria-label="Громкость"
                  style={{ '--fill': `${p.volume * 100}%` } as React.CSSProperties} />
              </label>
              <button onClick={p.cycleRepeat} className={`relative grid place-items-center w-10 h-10 rounded-full cursor-pointer ${p.repeat !== 'off' ? 'text-white bg-white/15' : ''}`}
                aria-label={p.repeat === 'one' ? 'Повтор трека' : p.repeat === 'all' ? 'Повтор очереди' : 'Без повтора'}>
                <Icon name="repeat" size={20} />
                {p.repeat === 'one' && <span className="absolute top-1 right-1 text-[9px] font-bold">1</span>}
              </button>
            </div>

            <button onClick={() => setShowQueue((v) => !v)} className="mt-5 self-center inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/12 text-[13px] font-semibold cursor-pointer" aria-expanded={showQueue}>
              <Icon name="list" size={16} /> Далее · {upNext.length}
            </button>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="font-display font-semibold text-xl">Что послушаем?</p>
              <p className="text-white/65 text-[14px]">У каждого человека своя песня вайба — по ответу в тесте о музыке.</p>
              <button onClick={p.toggle} className="h-11 px-5 rounded-full bg-white text-[#111] font-semibold cursor-pointer">Включить первую</button>
            </div>
          </div>
        )}

        {t && showQueue && (
          <ul className="flex flex-col -mx-2 mt-4">
            {upNext.map((q) => (
              <li key={q.id}>
                <button onClick={() => p.play(q)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left cursor-pointer hover:bg-white/10">
                  <Artwork track={q} className="w-11 h-11 rounded-[8px]" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[14px] truncate">{q.title}</span>
                    <span className="block text-[12px] text-white/60 truncate">{q.artist}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
