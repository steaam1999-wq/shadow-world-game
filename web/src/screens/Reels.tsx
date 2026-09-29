import { useRef, useState } from 'react'
import { useStore } from '../store'
import { compatibility, planWhen } from '../lib'
import { Avatar, Button, Icon } from '../components/ui'
import { PostArt, likeCount } from '../components/PostArt'
import { Plate } from './Feed'
import { LikeButton } from '../components/LikeButton'
import { TrackChip } from '../music/PlayerUI'
import { personTrack } from '../music/player'
import type { Activity, Person } from '../types'

/** Вертикальная лента на весь экран: один план — один экран, листается свайпом вверх. */
export function Reels({ now, onRespond, onOpenCapsule }: { now: number; onRespond: (a: Activity) => void; onOpenCapsule: (activityId: string) => void }) {
  const { state } = useStore()
  const items = state.activities
    .filter((a) => a.expiresAt > now && a.authorId !== 'me')
    .map((a) => ({ a, p: state.people.find((p) => p.id === a.authorId)! }))
    .filter((x) => x.p)
    .sort((x, y) => compatibility(state.me!, y.p).score - compatibility(state.me!, x.p).score)

  return (
    <div className="h-[calc(100dvh-env(safe-area-inset-top,0px))] overflow-y-auto no-scrollbar snap-y snap-mandatory bg-black">
      {items.map(({ a, p }) => (
        <Reel key={a.id} a={a} p={p} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />
      ))}
      {!items.length && <div className="h-full grid place-items-center text-white/70 p-8 text-center">Новых планов пока нет. Загляните через час.</div>}
    </div>
  )
}

function Reel({ a, p, now, onRespond, onOpenCapsule }: { a: Activity; p: Person; now: number; onRespond: (a: Activity) => void; onOpenCapsule: (activityId: string) => void }) {
  const { state, dispatch } = useStore()
  const hearted = state.hearts.includes(a.id)
  const saved = state.saved.includes(a.id)
  const responded = state.liked.includes(a.id)
  const compat = compatibility(state.me!, p)
  const [pop, setPop] = useState(0)
  const lastTap = useRef(0)

  const onTap = () => {
    const t = Date.now()
    if (t - lastTap.current < 320) { dispatch({ type: 'heart', activityId: a.id }); setPop((n) => n + 1) }
    lastTap.current = t
  }

  const action = (icon: string, label: string, onClick: () => void, active = false, count?: string) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer" aria-label={label} aria-pressed={active}>
      <Icon name={icon} size={30} fill={active} className={active && icon === 'heart' ? 'text-danger anim-bump' : ''} />
      {count && <span className="text-[12px] font-semibold tnum">{count}</span>}
    </button>
  )

  return (
    <section className="relative h-full snap-start snap-always overflow-hidden text-white" aria-label={a.title}>
      <div className="absolute inset-0 scale-110" onClick={onTap}><PostArt activity={a} /></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/35 via-transparent to-black/70" />
      <div className="absolute left-4 top-3 font-display font-semibold text-[20px] drop-shadow pointer-events-none">Планы</div>
      {pop > 0 && (
        <span key={pop} className="anim-pop absolute inset-0 grid place-items-center pointer-events-none drop-shadow-lg"><Icon name="heart" size={120} fill /></span>
      )}

      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-5 drop-shadow">
        <LikeButton liked={hearted} onToggle={() => dispatch({ type: 'toggleHeart', activityId: a.id })} size={30} className="gap-1">
          <span className="text-[12px] font-semibold tnum">{likeCount(a.id, hearted).toLocaleString('ru-RU')}</span>
        </LikeButton>
        {action('comment', 'Написать', () => (responded ? onOpenCapsule(a.id) : onRespond(a)), false, responded ? 'чат' : undefined)}
        {action('bookmark', saved ? 'Убрать из сохранённого' : 'Сохранить', () => dispatch({ type: 'toggleSave', activityId: a.id }), saved)}
      </div>

      <div className="absolute left-0 right-16 bottom-0 p-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={p.name} hue={p.hue} size={34} verified={p.verified} />
          <span className="font-semibold">{p.name}, {p.age}</span>
          <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 h-6 inline-flex items-center text-[12px] font-semibold tnum">{compat.score}% вайб</span>
        </div>
        <p><Plate size="lg">{a.title}</Plate></p>
        <TrackChip track={personTrack(p)} light />
        <div className="flex items-center gap-2 text-[13px] text-white/85">
          <Icon name="clock" size={14} /> {planWhen(a, now)} · <Icon name="pin" size={14} /> {a.area}
        </div>
        <Button variant={responded ? 'secondary' : 'primary'} className="h-12" onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))}>
          {responded ? 'Открыть капсулу' : 'Хочу с тобой'} <Icon name="arrow" size={18} />
        </Button>
      </div>
    </section>
  )
}
