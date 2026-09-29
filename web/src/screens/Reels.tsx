import { useRef, useState } from 'react'
import { useStore } from '../store'
import { compatibility, planWhen } from '../lib'
import { Avatar, Button, Icon } from '../components/ui'
import { PostArt, likeCount } from '../components/PostArt'
import { Plate } from './Feed'
import { LikeButton } from '../components/LikeButton'
import { GroupStack, groupFull, joinLabel } from '../components/Meet'
import { TrackChip } from '../music/PlayerUI'
import { personTrack } from '../music/player'
import type { Activity, Person } from '../types'
import { ShortsFeed } from './Shorts'

/** Вертикальная лента на весь экран: один план — один экран, листается свайпом вверх. */
export function Reels({ now, onRespond, onOpenCapsule, onMessage }: { now: number; onRespond: (a: Activity) => void; onOpenCapsule: (activityId: string) => void; onMessage: (personId: string) => void }) {
  const { state } = useStore()
  const [mode, setMode] = useState<'plans' | 'shorts'>(() => { try { return sessionStorage.getItem('iskra-reels-mode') === 'shorts' ? 'shorts' : 'plans' } catch { return 'plans' } })
  const scroller = useRef<HTMLDivElement>(null)
  const pick = (m: 'plans' | 'shorts') => {
    setMode(m)
    scroller.current?.scrollTo({ top: 0 })
    try { sessionStorage.setItem('iskra-reels-mode', m) } catch { /* ignore */ }
  }
  const items = state.activities
    .filter((a) => a.expiresAt > now && a.authorId !== 'me')
    .map((a) => ({ a, p: state.people.find((p) => p.id === a.authorId)! }))
    .filter((x) => x.p)
    .sort((x, y) => compatibility(state.me!, y.p).score - compatibility(state.me!, x.p).score)

  return (
    <div className="relative">
      <div className="fixed z-20 left-1/2 -translate-x-1/2 top-[calc(10px+env(safe-area-inset-top,0px))] flex rounded-full bg-black/30 backdrop-blur-md p-1 text-white text-[14px] font-semibold" role="tablist" aria-label="Что смотреть">
        {([['plans', 'Планы'], ['shorts', 'Шортсы']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={mode === id} onClick={() => pick(id)}
            className={`h-8 px-4 rounded-full cursor-pointer transition ${mode === id ? 'bg-white text-black' : 'text-white/85'}`}>{label}</button>
        ))}
      </div>
      <div ref={scroller} className="h-[calc(100dvh-env(safe-area-inset-top,0px))] overflow-y-auto no-scrollbar snap-y snap-mandatory bg-black">
        {mode === 'shorts' ? <ShortsFeed onMessage={onMessage} /> : (
          <>
            {items.map(({ a, p }) => (
              <Reel key={a.id} a={a} p={p} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />
            ))}
            {!items.length && <div className="h-full grid place-items-center text-white/70 p-8 text-center">Новых планов пока нет. Загляните через час.</div>}
          </>
        )}
      </div>
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
      {pop > 0 && (
        <span key={pop} className="anim-pop absolute inset-0 grid place-items-center pointer-events-none drop-shadow-lg"><Icon name="heart" size={120} fill /></span>
      )}

      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-5 drop-shadow">
        <LikeButton liked={hearted} onToggle={() => dispatch({ type: 'toggleHeart', activityId: a.id })} size={30} className="gap-1">
          {!state.cloud && <span className="text-[12px] font-semibold tnum">{likeCount(a.id, hearted).toLocaleString('ru-RU')}</span>}
        </LikeButton>
        {action('comment', 'Написать', () => (responded ? onOpenCapsule(a.id) : onRespond(a)), false, responded ? 'чат' : undefined)}
        {action('bookmark', saved ? 'Убрать из сохранённого' : 'Сохранить', () => dispatch({ type: 'toggleSave', activityId: a.id }), saved)}
      </div>

      <div className="absolute left-0 right-16 bottom-0 p-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={p.name} hue={p.hue} src={p.photo} size={34} verified={p.verified} />
          <span className="font-semibold">{p.name}, {p.age}</span>
          <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 h-6 inline-flex items-center text-[12px] font-semibold tnum">{compat.score}% вайб</span>
        </div>
        <p><Plate size="lg">{a.title}</Plate></p>
        <TrackChip track={personTrack(p)} light />
        <div className="flex items-center gap-2 text-[13px] text-white/85">
          <Icon name="clock" size={14} /> {planWhen(a, now)} · <Icon name="pin" size={14} /> {a.area}
        </div>
        {a.groupSize && <GroupStack activity={a} light />}
        <Button variant={responded ? 'secondary' : 'primary'} className="h-12" disabled={!responded && groupFull(a)} onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))}>
          {joinLabel(a, responded)} <Icon name="arrow" size={18} />
        </Button>
      </div>
    </section>
  )
}
