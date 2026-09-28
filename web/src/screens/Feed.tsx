import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { compatibility, relative, sharedAnswers, whenLabel } from '../lib'
import { Avatar, Button, Icon, Sheet, StoryRing } from '../components/ui'
import { PostArt, likeCount } from '../components/PostArt'
import { ReportSheet } from './Vibe'
import type { Activity, Person } from '../types'

interface Props {
  now: number
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
  onCreate: () => void
}

export function Feed({ now, onRespond, onOpenCapsule, onCreate }: Props) {
  const { state } = useStore()
  // Список сторис фиксируется при открытии, иначе пересортировка «просмотренных» сбивает индекс.
  const [viewer, setViewer] = useState<{ items: { p: Person; a: Activity }[]; index: number } | null>(null)
  const [hidden, setHidden] = useState<string[]>([])

  const live = state.activities.filter((a) => a.expiresAt > now && !hidden.includes(a.id))
  // Сторис: по одной на человека с активным планом, непросмотренные первыми.
  const stories = state.people
    .map((p) => ({ p, a: live.filter((a) => a.authorId === p.id).sort((x, y) => x.startsAt - y.startsAt)[0] }))
    .filter((x): x is { p: Person; a: Activity } => !!x.a)
    .sort((x, y) => Number(state.seenStories.includes(x.p.id)) - Number(state.seenStories.includes(y.p.id)))
  const posts = [...live].sort((a, b) => (a.authorId === 'me' ? -1 : b.authorId === 'me' ? 1 : a.startsAt - b.startsAt))
  const me = state.me!

  return (
    <div className="flex flex-col">
      {/* Сторис */}
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pt-3 pb-4">
        <button onClick={onCreate} className="flex flex-col items-center gap-1 w-[72px] shrink-0 cursor-pointer">
          <span className="relative">
            <span className="grid place-items-center w-[68px] h-[68px]"><Avatar name={me.name} hue={me.hue} src={me.photo} size={60} /></span>
            <span className="absolute right-0.5 bottom-0.5 grid place-items-center w-6 h-6 rounded-full bg-brand text-white border-2 border-surface"><Icon name="plus" size={14} /></span>
          </span>
          <span className="text-[12px] text-muted truncate w-full text-center">Ваш план</span>
        </button>
        {stories.map(({ p }, i) => (
          <button key={p.id} onClick={() => setViewer({ items: stories, index: i })} className="flex flex-col items-center gap-1 w-[72px] shrink-0 cursor-pointer">
            <StoryRing seen={state.seenStories.includes(p.id)} size={68}>
              <Avatar name={p.name} hue={p.hue} size={58} />
            </StoryRing>
            <span className="text-[12px] truncate w-full text-center">{p.name}</span>
          </button>
        ))}
      </div>

      {state.announcement && state.announcement !== state.dismissedAnnouncement && <Announcement text={state.announcement} />}

      {posts.map((a) => (
        <Post key={a.id} activity={a} person={state.people.find((p) => p.id === a.authorId) ?? null} now={now}
          onRespond={onRespond} onOpenCapsule={onOpenCapsule} onHide={() => setHidden([...hidden, a.id])} />
      ))}
      {!posts.length && (
        <div className="p-10 text-center flex flex-col items-center gap-3">
          <p className="font-semibold">Планы на ближайшие 48 часов закончились</p>
          <Button onClick={onCreate}>Предложить свой</Button>
        </div>
      )}
      {posts.length > 0 && (
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
  const [reporting, setReporting] = useState<Person | null>(null)
  const [copied, setCopied] = useState(false)
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
  const share = async () => {
    try { await navigator.clipboard.writeText(`${a.title} — ${a.area}, ${whenLabel(a.startsAt, now)}. Искра`) } catch { /* буфер недоступен */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <article className="pb-7">
      <header className="flex items-center gap-3 px-4 pt-1 pb-3">
        <StoryRing seen={!person || state.seenStories.includes(person.id)} size={40}>
          <Avatar name={author.name} hue={author.hue} src={person ? undefined : me.photo} size={32} />
        </StoryRing>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="flex items-center gap-1 font-semibold text-[14px]">
            {person ? person.name : me.name}
            {author.verified && <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-cobalt text-white"><Icon name="check" size={9} /></span>}
            {!person && <span className="font-normal text-muted">· ваш план</span>}
          </div>
          <div className="text-[12px] text-muted truncate">{a.area}{person && ` · ${person.distanceKm.toFixed(1).replace('.', ',')} км`}</div>
        </div>
        <button onClick={() => setMenu(true)} className="grid place-items-center w-9 h-9 -mr-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Ещё"><Icon name="more" size={22} /></button>
      </header>

      {/* Карусель 4:5: кадр плана и карточка с деталями */}
      <div className="relative mx-3">
        <div ref={track} onScroll={onTrackScroll} className="flex overflow-x-auto no-scrollbar snap-x-mandatory rounded-[22px] bg-surface-2 select-none">
          <div className="relative snap-start shrink-0 w-full aspect-[4/5] overflow-hidden" onClick={onImageTap}>
            <PostArt activity={a} />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 text-white backdrop-blur-md px-3 h-7 text-[12px] font-medium">
              <Icon name="clock" size={13} /> {started ? 'Уже идёт' : whenLabel(a.startsAt, now)}
            </span>
            {compat && (
              <span className="absolute right-3 top-3 rounded-full bg-white/80 text-[#111114] backdrop-blur-md px-3 h-7 inline-flex items-center text-[12px] font-semibold tnum">{compat.score}% вайб</span>
            )}
            {pop > 0 && (
              <span key={pop} className="anim-pop absolute inset-0 grid place-items-center pointer-events-none text-white drop-shadow-lg">
                <Icon name="heart" size={110} fill />
              </span>
            )}
          </div>
          <div className="relative snap-start shrink-0 w-full aspect-[4/5] overflow-hidden">
            <div className="absolute inset-0 opacity-25 blur-2xl scale-125"><PostArt activity={a} /></div>
            <div className="relative h-full flex flex-col justify-between gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-muted uppercase tracking-[.12em]">{a.category}</span>
                <h3 className="font-display font-semibold text-[24px] leading-tight">{a.title}</h3>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[14px]">
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3"><dt className="text-[12px] text-muted">Когда</dt><dd className="font-semibold">{started ? 'Уже идёт' : whenLabel(a.startsAt, now)}</dd></div>
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3"><dt className="text-[12px] text-muted">Сколько</dt><dd className="font-semibold">{a.durationMin >= 60 ? `${a.durationMin / 60} ч` : `${a.durationMin} мин`}</dd></div>
                <div className="rounded-2xl bg-surface/80 backdrop-blur p-3 col-span-2"><dt className="text-[12px] text-muted">Где</dt><dd className="font-semibold">{a.area}{person ? ' · точный адрес откроется в капсуле' : ` · ${a.exactPlace}`}</dd></div>
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
          <Button variant={responded ? 'secondary' : 'primary'} className="w-full h-12" onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))}>
            {responded ? 'Открыть капсулу' : 'Хочу с тобой'} <Icon name="arrow" size={18} />
          </Button>
        </div>
      ) : (
        <p className="mx-4 mt-3 flex items-center gap-2 text-[13px] text-muted">
          <Icon name="pin" size={15} /> Точное место увидят только в капсуле: {a.exactPlace}
        </p>
      )}

      <div className="flex items-center gap-1 px-2.5 pt-1.5">
        <button onClick={() => dispatch({ type: 'toggleHeart', activityId: a.id })} className={`grid place-items-center w-10 h-10 cursor-pointer ${hearted ? 'text-danger' : ''}`} aria-label={hearted ? 'Убрать лайк' : 'Нравится'} aria-pressed={hearted}>
          <Icon key={String(hearted)} name="heart" size={26} fill={hearted} className={hearted ? 'anim-bump' : ''} />
        </button>
        {person && (
          <button onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Написать"><Icon name="comment" size={25} /></button>
        )}
        <button onClick={share} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Скопировать приглашение"><Icon name="send" size={24} /></button>
        {copied && <span className="text-[12px] text-muted">Текст скопирован</span>}
        <button onClick={() => dispatch({ type: 'toggleSave', activityId: a.id })} className="ml-auto grid place-items-center w-10 h-10 cursor-pointer" aria-label={saved ? 'Убрать из сохранённого' : 'Сохранить'} aria-pressed={saved}>
          <Icon name="bookmark" size={24} fill={saved} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-1 text-[14px]">
        <span className="font-semibold tnum">{likeCount(a.id, hearted).toLocaleString('ru-RU')} отметок «Нравится»</span>
        <p><span className="font-semibold">{person ? person.name : me.name}</span> {a.title}</p>
        <p className="text-muted">#{a.category.toLowerCase()} #{a.area.toLowerCase().replace(/[^а-яёa-z0-9]+/g, '')}</p>
        {compat && compat.sharedTags.length > 0 && <p className="text-muted text-[13px]">Общие интересы: {compat.sharedTags.join(', ')}</p>}
        <span className="text-[12px] text-muted">{started ? 'Идёт сейчас' : `Начало ${relative(a.startsAt, now)}`}</span>
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
          <Avatar name={p.name} hue={p.hue} size={36} verified={p.verified} />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold text-[14px]">{p.name} <span className="font-normal opacity-75">· {compat.score}% вайб</span></div>
            <div className="text-[12px] opacity-75">{a.area} · {whenLabel(a.startsAt, now)}</div>
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
            <Button onClick={() => onOpenCapsule(a.id)} className="!bg-white !text-[#14152a]">Открыть капсулу</Button>
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
