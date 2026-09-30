import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { Avatar, Icon } from './ui'
import { personTrack, usePlayer } from '../music/player'
import { useTaste } from '../music/taste'
import type { Capsule, Person } from '../types'

// «Мы встретились»: карточки состоявшихся встреч — профиль как дневник реальных знакомств.

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

interface Meeting { capsule: Capsule; person: Person; title: string; at: number }

export function useMeetings(): Meeting[] {
  const { state } = useStore()
  return state.capsules.flatMap((c): Meeting[] => {
    if (c.status !== 'met') return []
    const person = state.people.find((p) => p.id === c.personId)
    if (!person) return []
    const a = state.activities.find((x) => x.id === c.activityId)
    // Когда виделись: время плана, если он уже прошёл, иначе последнее сообщение до отметки.
    const lastTalk = [...c.messages].reverse().find((m) => m.from !== 'system')?.at
    const at = a && a.startsAt < Date.now() ? a.startsAt : lastTalk ?? c.createdAt
    return [{ capsule: c, person, title: a?.title ?? 'Личная встреча', at }]
  }).sort((x, y) => y.at - x.at)
}

function MeetingCard({ m, wide = false }: { m: Meeting; wide?: boolean }) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const player = usePlayer()
  const taste = useTaste()(m.person)
  // Трек встречи: общая песня, если есть, иначе песня собеседника.
  const track = taste.songs[0] ?? personTrack(m.person)
  const playing = player.track?.id === track.id && player.playing
  return (
    <div className={`relative shrink-0 ${wide ? 'w-full' : 'w-[210px]'} rounded-[24px] p-4 flex flex-col gap-3 text-white overflow-hidden shadow-soft`}
      style={{ background: `linear-gradient(145deg, hsl(${m.person.hue} 70% 55%), hsl(${(m.person.hue + 60) % 360} 65% 42%))` }}>
      <div className="flex items-center gap-2">
        <span className="flex -space-x-3">
          <span className="rounded-full ring-2 ring-white/70"><Avatar name={state.me?.name ?? 'Я'} hue={state.me?.hue ?? 0} src={state.me?.photo} size={40} /></span>
          <button onClick={() => openProfile(m.person.id)} className="rounded-full ring-2 ring-white/70 cursor-pointer" aria-label={`Профиль ${m.person.name}`}><Avatar name={m.person.name} hue={m.person.hue} src={m.person.photo} size={40} /></button>
        </span>
        <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide opacity-90">Мы встретились</span>
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[17px] leading-tight truncate">{state.me?.name} и {m.person.name}</p>
        <p className="text-[13px] opacity-90 truncate">{m.title} · {dateFmt.format(m.at)}</p>
      </div>
      <button onClick={() => (player.track?.id === track.id ? player.toggle() : player.play(track, [track]))}
        className="flex items-center gap-2 rounded-full bg-black/20 px-2.5 py-1.5 text-[12px] text-left cursor-pointer backdrop-blur" aria-label={playing ? `Пауза: ${track.title}` : `Слушать трек встречи: ${track.title}`}>
        <Icon name={playing ? 'pause' : 'play'} size={14} fill />
        <span className="truncate">{taste.songs.length ? 'Ваша общая песня' : 'Трек встречи'}: {track.title}</span>
      </button>
    </div>
  )
}

/** Лента карточек в своём профиле. */
export function MeetingCards() {
  const meetings = useMeetings()
  if (!meetings.length) return null
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-[15px]">Мы встретились · {meetings.length}</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {meetings.map((m) => <MeetingCard key={m.capsule.id} m={m} />)}
      </div>
    </div>
  )
}

/** В профиле другого человека: мы с ним уже встречались. */
export function MetTogether({ personId }: { personId: string }) {
  const m = useMeetings().find((x) => x.person.id === personId)
  return m ? <MeetingCard m={m} wide /> : null
}
