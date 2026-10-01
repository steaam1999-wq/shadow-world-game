import { useEffect, useState } from 'react'
import type { Track } from './engine'
import { usePlayer } from './player'
import { Artwork } from './PlayerUI'
import { Icon } from '../components/ui'
import { soundCloudLink, soundCloudTrack } from './soundcloud'

const cache = new Map<string, Track>()

/** Трек по ссылке SoundCloud из текста: { link, track, error }. */
export function useSoundCloud(text: string) {
  const link = soundCloudLink(text)
  const [state, setState] = useState<{ link: string; track?: Track; error?: string } | null>(null)
  useEffect(() => {
    if (!link) { setState(null); return }
    const hit = cache.get(link)
    if (hit) { setState({ link, track: hit }); return }
    setState({ link })
    const ctrl = new AbortController()
    soundCloudTrack(link, ctrl.signal).then((t) => { cache.set(link, t); setState({ link, track: t }) }, (e: Error) => {
      if (!ctrl.signal.aborted) setState({ link, error: e.message === 'not-found' ? 'Трек не найден: он удалён, скрыт или автор запретил его встраивать.' : 'Не получилось открыть ссылку.' })
    })
    return () => ctrl.abort()
  }, [link])
  return link ? state ?? { link } : null
}

/** Карточка трека SoundCloud: обложка, название, ▶ и действие (♥ или «добавить»). */
export function SoundCloudCard({ text, action, compact }: { text: string; action?: (t: Track) => React.ReactNode; compact?: boolean }) {
  const sc = useSoundCloud(text)
  const player = usePlayer()
  if (!sc) return null
  const t = sc.track
  const on = !!t && player.track?.id === t.id && player.playing
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-surface shadow-soft ${compact ? 'p-2' : 'p-3'}`} aria-label="Трек SoundCloud">
      {t ? <Artwork track={t} className={`${compact ? 'w-11 h-11' : 'w-14 h-14'} rounded-xl shrink-0`} /> : <span className={`${compact ? 'w-11 h-11' : 'w-14 h-14'} rounded-xl shrink-0 bg-surface-2 animate-pulse`} />}
      <div className="flex-1 min-w-0 leading-tight">
        <div className="font-semibold text-[14.5px] truncate">{t?.title ?? (sc.error ? 'Не открылось' : 'Загружаем…')}</div>
        <div className="text-[12.5px] text-muted truncate">{sc.error ?? (t ? `${t.artist} · SoundCloud` : 'SoundCloud')}</div>
        {sc.error && <a href={sc.link} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-spark">Открыть в SoundCloud</a>}
      </div>
      {t && action?.(t)}
      {t && (
        <button onClick={() => (on ? player.toggle() : player.play(t, [t]))} className="grid place-items-center w-11 h-11 rounded-full bg-[#ff5500] text-white shrink-0 cursor-pointer" aria-label={on ? `Пауза: ${t.title}` : `Слушать: ${t.title}`}>
          <Icon name={on ? 'pause' : 'play'} size={18} fill />
        </button>
      )}
    </div>
  )
}
