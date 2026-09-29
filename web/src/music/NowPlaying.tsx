import { useStore } from '../store'
import { Icon } from '../components/ui'
import { Artwork, Bars } from './PlayerUI'
import { personTrack, trackLabel, usePlayer } from './player'
import type { NowPlaying, Person } from '../types'

// «Сейчас слушает»: что играет у человека прямо сейчас. В демо «слушают» несколько людей.
const DEMO_LISTENING = ['p1', 'p3', 'p5']

export function nowPlayingOf(p: Person, cloud: boolean): NowPlaying | null {
  if (cloud) return p.nowPlaying ?? null
  return DEMO_LISTENING.includes(p.id) ? { track: personTrack(p), at: Date.now() } : null
}

/** Карточка «Слушает сейчас» на странице человека — можно включить тот же трек. */
export function NowPlayingCard({ np, who }: { np: NowPlaying; who: string }) {
  const player = usePlayer()
  const t = np.track
  const playable = t.genre !== 'file' && (!!t.source || t.bpm > 0)
  const current = player.track?.id === t.id && player.playing
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5 pr-3">
      <Artwork track={t} className="w-11 h-11 rounded-xl" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-spark">{who} <Bars /></div>
        <div className="font-semibold text-[14px] truncate">{t.title}</div>
        <div className="text-[12px] text-muted truncate">{t.artist} · {t.genre === 'file' ? 'своя песня' : trackLabel(t)}</div>
      </div>
      {playable && (
        <button onClick={() => (current ? player.toggle() : player.play(t, [t]))} className="grid place-items-center w-10 h-10 rounded-full bg-brand text-white shrink-0 cursor-pointer"
          aria-label={current ? `Пауза: ${t.title}` : `Слушать вместе: ${t.title}`}>
          <Icon name={current ? 'pause' : 'play'} size={18} fill />
        </button>
      )}
    </div>
  )
}

/** Маленький значок ноты на аватарке того, кто сейчас слушает музыку. */
export function ListeningBadge({ person }: { person: Person }) {
  const { state } = useStore()
  if (!nowPlayingOf(person, !!state.cloud)) return null
  return (
    <span className="absolute -left-0.5 -bottom-0.5 grid place-items-center w-5 h-5 rounded-full bg-spark text-on-spark border-2 border-surface" title="Слушает музыку" aria-label="Слушает музыку">
      <Icon name="note" size={10} />
    </span>
  )
}
