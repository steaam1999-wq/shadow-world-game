import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FeedPublication, usePublications } from './Shorts'
import { useStore } from '../store'
import { compatibility, planWhen, relative, sharedAnswers } from '../lib'
import { Avatar, Button, Icon, Sheet, StoryRing } from '../components/ui'
import { PostArt, likeCount } from '../components/PostArt'
import { TrackChip } from '../music/PlayerUI'
import { ShareButton } from '../components/ShareButton'
import { LikeButton } from '../components/LikeButton'
import { FreeNow, GroupStack, groupFull, joinLabel } from '../components/Meet'
import { useOpenProfile } from '../nav'
import { personTrack } from '../music/player'
import { ReportSheet } from './Vibe'
import { CommentsPreview, CommentsSheet } from '../components/Comments'
import type { Activity, Person, Short } from '../types'

interface Props {
  now: number
  onInvite: (personId: string) => void
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
  onCreate: () => void
  onMessage: (personId: string) => void
}

export function Feed({ now, onRespond, onOpenCapsule, onCreate, onInvite, onMessage }: Props) {
  const { state } = useStore()
  const publications = usePublications()
  // Список сторис фиксируется при открытии, иначе пересортировка «просмотренных» сбивает индекс.
  const [viewer, setViewer] = useState<{ items: { p: Person; a: Activity }[]; index: number } | null>(null)
  const [hidden, setHidden] = useState<string[]>([])

  const live = state.activities.filter((a) => a.expiresAt > now && !hidden.includes(a.id))
  // Сторис: по одной на человека с активным планом, непросмотренные первыми.
  const stories = state.people
    .map((p) => ({ p, a: live.filter((a) => a.authorId === p.id).sort((x, y) => x.startsAt - y.startsAt)[0] }))
    .filter((x): x is { p: Person; a: Activity } => !!x.a)
    .sort((x, y) => Number(state.seenStories.includes(x.p.id)) - Number(state.seenStories.includes(y.p.id)))
  const followed = state.following ?? []
  const rank = (x: Activity) => (x.authorId === 'me' ? 0 : followed.includes(x.authorId) ? 1 : 2)
  const posts = [...live].sort((a, b) => rank(a) - rank(b) || a.startsAt - b.startsAt)
  const me = state.me!
  const openProfile = useOpenProfile()
  // Люди без активного плана: иначе новенькие не видны на главной, пока не предложат план.
  const quiet = state.people.filter((p) => !stories.some((s) => s.p.id === p.id))

  return (
    <div className="flex flex-col">
      {/* Сторис */}
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pt-3 pb-4">
        <button onClick={onCreate} className="flex flex-col items-center gap-1 w-[72px] shrink-0 cursor-pointer">
          <span className="relative">
            <span className="grid place-items-center w-[68px] h-[68px]"><Avatar name={me.name} hue={me.hue} src={me.photo} size={60} /></span>
            <span className="absolute right-0.5 bottom-0.5 grid place-items-center w-6 h-6 rounded-full bg-brand text-white border-2 border-surface"><Icon name="plus" size={14} /></span>
          </span>
          <span className="text-[12px] text-muted truncate w-full text-center">Создать</span>
        </button>
        {stories.map(({ p }, i) => (
          <button key={p.id} onClick={() => setViewer({ items: stories, index: i })} className="flex flex-col items-center gap-1 w-[72px] shrink-0 cursor-pointer">
            <StoryRing seen={state.seenStories.includes(p.id)} size={68}>
              <Avatar name={p.name} hue={p.hue} src={p.photo} size={58} />
            </StoryRing>
            <span className="text-[12px] truncate w-full text-center">{p.name}</span>
          </button>
        ))}
      </div>

      <FreeNow now={now} onInvite={onInvite} />

      {quiet.length > 0 && (
        <section className="mb-4" aria-label="Люди в ISKRA">
          <h2 className="px-4 mb-2 text-[13px] font-semibold text-muted">Люди в ISKRA · {state.people.length}</h2>
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4">
            {quiet.map((p) => (
              <button key={p.id} onClick={() => openProfile(p.id)} className="flex flex-col items-center gap-1 w-[64px] shrink-0 cursor-pointer" aria-label={`Профиль ${p.name}`}>
                <Avatar name={p.name} hue={p.hue} src={p.photo} size={52} verified={p.verified} />
                <span className="text-[12px] truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {state.announcement && state.announcement !== state.dismissedAnnouncement && <Announcement text={state.announcement} />}

      {mixFeed(posts, publications).map((x) => x.kind === 'pub' ? (
        <FeedPublication key={x.s.id} s={x.s} onMessage={onMessage} />
      ) : (
        <Post key={x.a.id} activity={x.a} person={state.people.find((p) => p.id === x.a.authorId) ?? null} now={now}
          onRespond={onRespond} onOpenCapsule={onOpenCapsule} onHide={() => setHidden([...hidden, x.a.id])} />
      ))}
      {!posts.length && !publications.length && (
        <div className="p-10 text-center flex flex-col items-center gap-3">
          <p className="font-semibold">{state.cloud ? 'Пока никто не предложил план — будьте первым!' : 'Планы на ближайшие 48 часов закончились'}</p>
          <Button onClick={onCreate}>Предложить свой</Button>
        </div>
      )}
      {(posts.length > 0 || publications.length > 0) && (
        <div className="py-10 flex flex-col items-center gap-2 text-center">
          <span className="grid place-items-center w-14 h-14 rounded-full border-2 border-spark text-spark"><Icon name="check" size={28} /></span>
          <p className="font-semibold">Вы всё посмотрели</p>
          <p className="text-[13px] text-muted">Новые планы появляются каждый час</p>
        </div>
      )}

      {viewer && (
        <StoryViewer
          items={viewer.items}
          index={viewer.index}
          now={now}
          onIndex={(index) => setViewer({ ...viewer, index })}
          onClose={() => setViewer(null)}
          onReply={(a, text) => { setViewer(null); onRespond(a, text) }}
          onOpenCapsule={(id) => { setViewer(null); onOpenCapsule(id) }}
        />
      )}
    </div>
  )
}

/** Лента главной: свежие публикации идут вперемешку с планами (после каждых двух планов — публикация). */
function mixFeed(plans: Activity[], pubs: Short[]) {
  const out: ({ kind: 'plan'; a: Activity } | { kind: 'pub'; s: Short })[] = []
  let i = 0
  plans.forEach((a, n) => {
    out.push({ kind: 'plan', a })
    if (n % 2 === 1 && i < pubs.length) out.push({ kind: 'pub', s: pubs[i++] })
  })
  while (i < pubs.length) out.push({ kind: 'pub', s: pubs[i++] })
  // Свою свежую публикацию показываем сразу наверху.
  const fresh = out.findIndex((x) => x.kind === 'pub' && x.s.authorId === 'me' && Date.now() - x.s.at < 10 * 60_000)
  if (fresh > 0) out.unshift(...out.splice(fresh, 1))
  return out
}

function Announcement({ text }: { text: string }) {
  const { dispatch } = useStore()
  return (
    <div className="mx-4 mt-3 flex items-start gap-3 rounded-2xl bg-cobalt-soft text-cobalt p-3.5">
      <Icon name="bell" size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-[14px] font-medium">{text}</p>
      <button onClick={() => dispatch({ type: 'dismissAnnouncement' })} aria-label="Скрыть уведомление" className="cursor-pointer"><Icon name="x" size={16} /></button>
    </div>
  )
}

export function Post({ activity: a, person, now, onRespond, onOpenCapsule, onHide }: {
  activity: Activity
  person: Person | null
  now: number
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
  onHide?: () => void
}) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const hearted = state.hearts.includes(a.id)
  const saved = state.saved.includes(a.id)
  const responded = state.liked.includes(a.id)
  const [pop, setPop] = useState(0)
  const [menu, setMenu] = useState(false)
  const [comments, setComments] = useState(false)
  const [reporting, setReporting] = useState<Person | null>(null)
  const openProfile = useOpenProfile()
  const lastTap = useRef(0)
  const track = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const onTrackScroll = () => {
    const el = track.current
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }
  const started = a.startsAt <= now
  const compat = person ? compatibility(me, person) : null
  const author = person ?? { name: me.name, hue: me.hue, verified: me.verified }

  const onImageTap = () => {
    const t = Date.now()
    if (t - lastTap.current < 320) {
      dispatch({ type: 'heart', activityId: a.id })
      setPop((n) => n + 1)
    }
    lastTap.current = t
  }

  return (
    <article className="pb-7">
      <header className="flex items-center gap-3 px-4 pt-1 pb-3">
        <button onClick={() => person && openProfile(person.id)} className={person ? 'cursor-pointer' : 'cursor-default'} aria-label={person ? `Профиль ${person.name}` : undefined} tabIndex={person ? 0 : -1}>
          <StoryRing seen={!person || state.seenStories.includes(person.id)} size={40}>
            <Avatar name={author.name} hue={author.hue} src={person ? person.photo : me.photo} size={32} />
          </StoryRing>
        </button>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="flex items-center gap-1 font-semibold text-[14px]">
            {person ? <button onClick={() => openProfile(person.id)} className="cursor-pointer hover:underline">{person.name}</button> : me.name}
            {author.verified && <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-cobalt text-white"><Icon name="check" size={9} /></span>}
            {!person && <span className="font-normal text-muted">· ваш план</span>}
          </div>
          {person ? <TrackChip track={personTrack(person)} /> : <div className="text-[12px] text-muted truncate">{a.area}</div>}
        </div>
        <button onClick={() => setMenu(true)} className="grid place-items-center w-9 h-9 -mr-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Ещё"><Icon name="more" size={22} /></button>
      </header>

      {/* Карусель 4:5: кадр плана и карточка с деталями */}
      <div className="relative mx-3">
        <div ref={track} onScroll={onTrackScroll} className="flex overflow-x-auto no-scrollbar snap-x-mandatory rounded-[22px] bg-surface-2 select-none">
          <div className="relative snap-start shrink-0 w-full aspect-[4/5] overflow-hidden" onClick={onImageTap}>
            <PostArt activity={a} />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 text-white backdrop-blur-md px-3 h-7 text-[12px] font-medium">
              <Icon name="clock" size={13} /> {planWhen(a, now)}
            </span>
            {compat && (
              <span className="absolute right-3 top-3 rounded-full bg-white/80 text-[#111114] backdrop-blur-md px-3 h-7 inline-flex items-center text-[12px] font-semibold tnum">{compat.score}% вайб</span>
            )}
            {/* Плашечный заголовок — единый визуальный код обложек */}
            <p className="absolute left-3 right-14 bottom-11 pointer-events-none">
              <Plate>{a.title}</Plate>
            </p>
            {pop > 0 && (
              <span key={pop} className="anim-pop absolute inset-0 grid place-items-center pointer-events-none text-white drop-shadow-lg">
                <Icon name="heart" size={110} fill />
              </span>
            )}
          </div>
          <div className="relative snap-start shrink-0 w-full aspect-[4/5] overflow-hidden">
            {/* Кадр «перетекает» с первого слайда и растворяется в карточке */}
            <div className="absolute inset-y-0 -left-[70%] w-full [mask-image:linear-gradient(to_right,#000_55%,transparent_100%)] opacity-70"><PostArt activity={a} /></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-surface" />
            <div className="relative h-full flex flex-col justify-between gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-muted uppercase tracking-[.12em]">{a.category}</span>
                <h3 className="font-display font-semibold text-[24px] leading-tight">{a.title}</h3>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[14px]">
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3"><dt className="text-[12px] text-muted">Когда</dt><dd className="font-semibold">{planWhen(a, now)}</dd></div>
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3"><dt className="text-[12px] text-muted">Сколько</dt><dd className="font-semibold">{a.timeHidden ? 'По договорённости' : a.durationMin >= 60 ? `${a.durationMin / 60} ч` : `${a.durationMin} мин`}</dd></div>
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3 col-span-2"><dt className="text-[12px] text-muted">Где</dt><dd className="font-semibold">{a.area}{person ? ' · точный адрес откроется в чате' : ` · ${a.exactPlace}`}</dd></div>
                {compat && (
                  <div className="rounded-2xl bg-surface/80 backdrop-blur p-3 col-span-2">
                    <dt className="text-[12px] text-muted">Совпало в вайб-тесте</dt>
                    <dd className="font-semibold">{sharedAnswers(me.answers, person!.answers).join(', ') || 'Пока ничего — тем интереснее'}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-2 py-1.5" aria-hidden="true">
          {[0, 1].map((i) => <span key={i} className={`h-1.5 rounded-full bg-white transition-all duration-300 ${slide === i ? 'w-4' : 'w-1.5 opacity-60'}`} />)}
        </div>
      </div>

      {person ? (
        <div className="px-3 pt-3">
          {a.groupSize && <div className="pb-2.5 px-1"><GroupStack activity={a} /></div>}
          <Button variant={responded ? 'secondary' : 'primary'} className="w-full h-12" disabled={!responded && groupFull(a)} onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))}>
            {joinLabel(a, responded)} <Icon name="arrow" size={18} />
          </Button>
        </div>
      ) : (
        <div className="mx-4 mt-3 flex flex-col gap-2">
          {a.groupSize && <GroupStack activity={a} />}
          <p className="flex items-center gap-2 text-[13px] text-muted"><Icon name="pin" size={15} /> Точное место увидят только в чате: {a.exactPlace}</p>
        </div>
      )}

      <div className="flex items-center gap-1 px-2.5 pt-1.5">
        <LikeButton liked={hearted} onToggle={() => dispatch({ type: 'toggleHeart', activityId: a.id })} className="w-10 h-10" />
        <button onClick={() => setComments(true)} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Комментарии"><Icon name="comment" size={25} /></button>
        <ShareButton activity={a} now={now} />
        <button onClick={() => dispatch({ type: 'toggleSave', activityId: a.id })} className="ml-auto grid place-items-center w-10 h-10 cursor-pointer" aria-label={saved ? 'Убрать из сохранённого' : 'Сохранить'} aria-pressed={saved}>
          <Icon name="bookmark" size={24} fill={saved} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-1 text-[14px]">
        {/* Чужие лайки на сервере пока не хранятся — там показываем только свой. */}
        {state.cloud ? hearted && <span className="font-semibold">Вам нравится</span>
          : <span className="font-semibold tnum">{likeCount(a.id, hearted).toLocaleString('ru-RU')} отметок «Нравится»</span>}
        <p><span className="font-semibold">{person ? person.name : me.name}</span> {a.title}</p>
        <p className="text-muted">#{a.category.toLowerCase()} #{a.area.toLowerCase().replace(/[^а-яёa-z0-9]+/g, '')}</p>
        {compat && compat.sharedTags.length > 0 && <p className="text-muted text-[13px]">Общие интересы: {compat.sharedTags.join(', ')}</p>}
        <CommentsPreview activity={a} onOpen={() => setComments(true)} />
        <span className="text-[12px] text-muted">{a.timeHidden ? 'Время обсудим в чате' : started ? 'Идёт сейчас' : `Начало ${relative(a.startsAt, now)}`}</span>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Действия">
        <div className="flex flex-col divide-y divide-line -mx-5">
          {person && <button onClick={() => { setMenu(false); setReporting(person) }} className="h-12 px-5 text-left font-semibold text-danger cursor-pointer">Пожаловаться</button>}
          {onHide && person && <button onClick={() => { setMenu(false); onHide() }} className="h-12 px-5 text-left cursor-pointer">Не интересно</button>}
          {!person && <button onClick={() => { setMenu(false); dispatch({ type: 'deleteActivity', activityId: a.id }) }} className="h-12 px-5 text-left font-semibold text-danger cursor-pointer">Удалить план</button>}
          <button onClick={() => { setMenu(false); dispatch({ type: 'toggleSave', activityId: a.id }) }} className="h-12 px-5 text-left cursor-pointer">{saved ? 'Убрать из сохранённого' : 'Сохранить'}</button>
        </div>
      </Sheet>
      <ReportSheet person={reporting} onClose={() => setReporting(null)} />
      <CommentsSheet activity={a} open={comments} onClose={() => setComments(false)} />
    </article>
  )
}

const STORY_MS = 6000

function StoryViewer({ items, index, now, onIndex, onClose, onReply, onOpenCapsule }: {
  items: { p: Person; a: Activity }[]
  index: number
  now: number
  onIndex: (i: number) => void
  onClose: () => void
  onReply: (a: Activity, text: string) => void
  onOpenCapsule: (activityId: string) => void
}) {
  const openProfile = useOpenProfile()
  const { state, dispatch } = useStore()
  const { p, a } = items[index]
  const [text, setText] = useState('')
  const [paused, setPaused] = useState(false)
  const responded = state.liked.includes(a.id)
  const compat = compatibility(state.me!, p)

  useEffect(() => { dispatch({ type: 'seeStory', personId: p.id }) }, [p.id, dispatch])
  // Колбэки в ref: родитель перерисовывается каждую секунду, и таймер не должен сбрасываться.
  const nav = useRef({ onIndex, onClose, count: items.length })
  useEffect(() => { nav.current = { onIndex, onClose, count: items.length } })
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => (index + 1 < nav.current.count ? nav.current.onIndex(index + 1) : nav.current.onClose()), STORY_MS)
    return () => clearTimeout(t)
  }, [index, paused])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && index + 1 < items.length) onIndex(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onIndex, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center" role="dialog" aria-modal="true" aria-label={`Сторис ${p.name}`}>
      <div className="relative w-full max-w-[480px] h-full flex flex-col text-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="absolute inset-0 opacity-90"><PostArt activity={a} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75" />

        <div className="relative flex gap-1 px-2 pt-2">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
              <div key={`${index}-${i}`} className="h-full bg-white"
                style={i < index ? { width: '100%' } : i === index ? { animation: `storybar ${STORY_MS}ms linear both`, animationPlayState: paused ? 'paused' : 'running' } : { width: 0 }} />
            </div>
          ))}
        </div>
        <div className="relative flex items-center gap-3 px-3 py-3">
          <button onClick={() => { onClose(); openProfile(p.id) }} className="cursor-pointer" aria-label={`Профиль ${p.name}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={36} verified={p.verified} /></button>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold text-[14px]"><button onClick={() => { onClose(); openProfile(p.id) }} className="cursor-pointer">{p.name}</button> <span className="font-normal opacity-75">· {compat.score}% вайб</span></div>
            <div className="text-[12px] opacity-75">{a.area} · {planWhen(a, now)}</div>
            <TrackChip track={personTrack(p)} light />
          </div>
          <button onClick={onClose} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Закрыть"><Icon name="x" size={26} /></button>
        </div>

        {/* Зоны перелистывания */}
        <div className="relative flex-1 flex">
          <button className="w-1/3 h-full cursor-pointer" aria-label="Предыдущая" onClick={() => index > 0 && onIndex(index - 1)} />
          <button className="w-2/3 h-full cursor-pointer" aria-label="Следующая" onClick={() => (index + 1 < items.length ? onIndex(index + 1) : onClose())} />
        </div>

        <div className="relative px-4 pb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="self-start rounded-full bg-white/20 backdrop-blur px-3 h-7 inline-flex items-center text-[12px] font-bold uppercase tracking-wider">{a.category}</span>
            <h2 className="font-display font-bold text-[26px] leading-tight drop-shadow">{a.title}</h2>
          </div>
          {responded ? (
            <Button onClick={() => onOpenCapsule(a.id)} className="!bg-white !text-[#14152a]">Открыть чат</Button>
          ) : (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onReply(a, text.trim() || 'Хочу с тобой!') }}>
              <input id="story-reply" aria-label="Ответить на план" value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
                placeholder="Ответить на план…" className="flex-1 min-w-0 h-11 rounded-full border border-white/60 bg-transparent px-4 text-white placeholder:text-white/70 focus:outline-none focus:border-white" autoComplete="off" />
              <button type="submit" className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark cursor-pointer" aria-label="Откликнуться и отправить"><Icon name="send" size={18} /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/** Текст на плашке, как подписи на обложках: каждая строка в своей подложке. */
export function Plate({ children, size = 'md' }: { children: ReactNode; size?: 'md' | 'lg' }) {
  return (
    <span className={`[box-decoration-break:clone] [-webkit-box-decoration-break:clone] bg-white text-[#111114] rounded-md px-2 py-0.5 font-display font-semibold ${size === 'lg' ? 'text-[22px] leading-[1.55]' : 'text-[17px] leading-[1.6]'}`}>
      {children}
    </span>
  )
}
