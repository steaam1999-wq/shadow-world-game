import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FeedPublication, usePublications } from './Shorts'
import { ListeningBadge } from '../music/NowPlaying'
import { PlanMusicChip } from '../music/PlanMusic'
import { useStore } from '../store'
import { compatibility, planWhen, plural, relative, sharedAnswers, shortArea } from '../lib'
import { Avatar, Button, Icon, Sheet, StoryRing } from '../components/ui'
import { PostArt, likeCount } from '../components/PostArt'
import { TrackChip } from '../music/PlayerUI'
import { ShareButton } from '../components/ShareButton'
import { LikeButton } from '../components/LikeButton'
import { FreeNow, GroupStack, UpcomingMeeting, groupFull, joinLabel } from '../components/Meet'
import { VerifyBanner } from '../components/Verify'
import { BOOST_DAY_MS, BoostPlanButton, FOUNDER_BOOST_MS, FounderCorner, GoldFrame, takeInvitedPlan } from '../components/Invite'
import { SurpriseMeet } from '../components/Surprise'
import { PushPrompt } from '../components/Alerts'
import { StoriesRow, useStoryGroups } from './Stories'
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

/** Открыли ссылку на публикацию (#pub=…) — ждём, пока она загрузится, и прокручиваем к ней. */
function useOpenSharedPublication() {
  useEffect(() => {
    let t = 0
    const open = () => {
      let id = /^#pub=([\w-]+)$/.exec(location.hash)?.[1]
      try { id ??= sessionStorage.getItem('match-open-pub') ?? undefined; sessionStorage.removeItem('match-open-pub') } catch { /* ignore */ }
      // Друг позвал на свой план: открываем именно его.
      const plan = id ? null : takeInvitedPlan()
      const sel = id ? `[data-pub="${CSS.escape(id)}"]` : plan ? `[data-plan="${CSS.escape(plan)}"]` : ''
      if (!sel) return
      clearInterval(t)
      let tries = 0
      t = window.setInterval(() => {
        const el = document.querySelector<HTMLElement>(sel)
        if (el || ++tries > 40) {
          clearInterval(t)
          if (location.hash.startsWith('#pub=')) history.replaceState(null, '', '#app')
          if (!el) return
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          el.classList.add('ring-2', 'ring-spark')
          setTimeout(() => el.classList.remove('ring-2', 'ring-spark'), 2500)
        }
      }, 250)
    }
    open()
    window.addEventListener('hashchange', open)
    return () => { clearInterval(t); window.removeEventListener('hashchange', open) }
  }, [])
}

export function Feed({ now, onRespond, onOpenCapsule, onCreate, onInvite, onMessage }: Props) {
  const { state, dispatch } = useStore()
  const publications = usePublications()
  const [hidden, setHidden] = useState<string[]>([])
  useOpenSharedPublication()

  const live = state.activities.filter((a) => a.expiresAt > now && !hidden.includes(a.id))
  const storyGroups = useStoryGroups(now).others
  const followed = state.following ?? []
  // Основатели (позвали трёх друзей) неделю после значка стоят выше остальных.
  const boosted = new Set(state.people.filter((p) => p.founderAt && now - p.founderAt < FOUNDER_BOOST_MS).map((p) => p.id))
  // Подъём плана основателем (раз в месяц): сутки этот план выше остальных.
  const lifted = new Set(state.people.flatMap((p) => (p.boostPlan && p.boostAt && now - p.boostAt < BOOST_DAY_MS ? [p.boostPlan] : [])))
  const rank = (x: Activity) => (x.authorId === 'me' ? 0 : followed.includes(x.authorId) ? 1 : boosted.has(x.authorId) || lifted.has(x.id) ? 1.5 : 2)
  const posts = [...live].sort((a, b) => rank(a) - rank(b) || a.startsAt - b.startsAt)
  const openProfile = useOpenProfile()
  // Люди без активного плана: иначе новенькие не видны на главной, пока не предложат план.
  const quiet = state.people.filter((p) => !storyGroups.some((g) => g.personId === p.id))
  const [feedMode, setFeedMode] = useState<'all' | 'following'>('all')
  const inFollowing = (id: string) => id === 'me' || followed.includes(id)
  const shownPosts = feedMode === 'all' ? posts : posts.filter((a) => inFollowing(a.authorId))
  const shownPubs = feedMode === 'all' ? publications : publications.filter((x) => inFollowing(x.authorId))

  return (
    <div className="flex flex-col">
      {/* Истории: свои и чужие за сутки, у каждого в конце — его действующий план */}
      <StoriesRow now={now} onRespond={(a, t) => onRespond(a, t)} onOpenCapsule={onOpenCapsule}
        onMessage={(personId, text) => dispatch({ type: 'directMessage', personId, capsuleId: crypto.randomUUID(), text })} />

      <PushPrompt />
      <h2 className="px-4 mb-2 font-display font-bold text-[17px]">Сейчас рядом</h2>
      <UpcomingMeeting now={now} onOpenCapsule={onOpenCapsule} />
      <VerifyBanner />
      <FreeNow now={now} onInvite={onInvite} />
      <SurpriseMeet onMessage={onMessage} />

      {quiet.length > 0 && (
        <section className="mb-4" aria-label="Люди в Komeeta">
          <h2 className="px-4 mb-2 text-[13px] font-semibold text-muted">Люди в Komeeta · {state.people.length}</h2>
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4">
            {quiet.map((p) => (
              <button key={p.id} onClick={() => openProfile(p.id)} className="flex flex-col items-center gap-1 w-[64px] shrink-0 cursor-pointer" aria-label={`Профиль ${p.name}`}>
                <span className="relative"><Avatar name={p.name} hue={p.hue} src={p.photo} size={52} verified={p.verified} /><ListeningBadge person={p} /></span>
                <span className="text-[12px] truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {state.announcement && state.announcement !== state.dismissedAnnouncement && <Announcement text={state.announcement} />}

      {/* Лента: все или только те, на кого подписан */}
      <div className="flex items-center justify-between gap-3 px-4 mb-3 mt-1">
        <h2 className="font-display font-bold text-[17px]">Лента</h2>
        <div className="flex rounded-full bg-surface-2 p-1" role="tablist" aria-label="Что показывать в ленте">
          {([['all', 'Все'], ['following', 'Подписки']] as const).map(([m, label]) => (
            <button key={m} role="tab" aria-selected={feedMode === m} onClick={() => setFeedMode(m)}
              className={`h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer transition ${feedMode === m ? 'bg-surface shadow-soft text-fg' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
      </div>
      {feedMode === 'following' && !mixFeed(shownPosts, shownPubs).length && (
        <div className="mx-4 mb-4 rounded-[24px] bg-surface-2 p-6 text-center text-[14px] text-muted">
          Здесь будут планы и публикации тех, на кого вы подписаны. Откройте профиль человека и нажмите «Подписаться».
        </div>
      )}
      {mixFeed(shownPosts, shownPubs).map((x) => x.kind === 'pub' ? (
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

const likesLabel = (n: number) => `${n.toLocaleString('ru-RU')} ${plural(n, 'отметка', 'отметки', 'отметок')} «Нравится»`

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
  const [boostNote, setBoostNote] = useState('')
  useEffect(() => { if (!boostNote) return; const t = setTimeout(() => setBoostNote(''), 2500); return () => clearTimeout(t) }, [boostNote])
  const [comments, setComments] = useState(false)
  const [reporting, setReporting] = useState<Person | null>(null)
  const openProfile = useOpenProfile()
  const lastTap = useRef(0)
  const started = a.startsAt <= now
  const compat = person ? compatibility(me, person) : null
  const author = person ?? { name: me.name, hue: me.hue, verified: me.verified, founder: me.founder }

  const onImageTap = () => {
    const t = Date.now()
    if (t - lastTap.current < 320) {
      dispatch({ type: 'heart', activityId: a.id })
      setPop((n) => n + 1)
    }
    lastTap.current = t
  }

  return (
    <article className="pb-7 rounded-[20px] transition-shadow" data-plan={a.id}>
      <header className="flex items-center gap-3 px-4 pt-1 pb-3">
        <button onClick={() => person && openProfile(person.id)} className={person ? 'cursor-pointer' : 'cursor-default'} aria-label={person ? `Профиль ${person.name}` : undefined} tabIndex={person ? 0 : -1}>
          {author.founder && (!person || state.seenStories.includes(person.id))
            ? <GoldFrame on medal={15} label={`Основатель Komeeta №${author.founder}`}><Avatar name={author.name} hue={author.hue} src={person ? person.photo : me.photo} size={30} /></GoldFrame>
            : <span className="relative inline-grid">
              <StoryRing seen={!person || state.seenStories.includes(person.id)} size={40}>
                <Avatar name={author.name} hue={author.hue} src={person ? person.photo : me.photo} size={32} />
              </StoryRing>
              {author.founder && <FounderCorner size={15} label={`Основатель Komeeta №${author.founder}`} />}
            </span>}
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

      {/* Кадр 4:5, детали — на матовой «стеклянной» панели снизу */}
      <div className="relative mx-3 rounded-[22px] overflow-hidden bg-surface-2 aspect-[4/5] select-none" onClick={onImageTap}>
        <PostArt activity={a} />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgb(0_0_0/.22)_0%,transparent_20%,transparent_45%,rgb(0_0_0/.4)_100%)]" />
        {compat && (
          <span className="glass-chip absolute right-3 top-3 rounded-full px-3 h-7 inline-flex items-center text-[12px] font-semibold text-white tnum">{compat.score}% вайб</span>
        )}
        {pop > 0 && (
          <span key={pop} className="anim-pop absolute inset-0 grid place-items-center pointer-events-none text-white drop-shadow-lg">
            <Icon name="heart" size={110} fill />
          </span>
        )}
        <div className="glass-panel absolute left-2.5 right-2.5 bottom-2.5 rounded-[24px] p-3.5 text-white" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 h-[26px] px-2.5 rounded-full bg-white/15 text-[12px] font-medium"><Icon name="clock" size={13} /> {started && !a.timeHidden ? 'Идёт сейчас' : planWhen(a, now).replace(', ', ' · ')}</span>
            <span className="inline-flex items-center h-[26px] px-2.5 rounded-full bg-white/15 text-[12px] font-medium">{a.category}</span>
          </div>
          <h3 className="font-display font-bold text-[19px] leading-[1.18] line-clamp-2">{a.title}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/85 min-w-0">
            <Icon name="pin" size={14} /> <span className="truncate">{shortArea(a.area)}</span>
            {a.groupSize && <><span className="opacity-50">•</span><Icon name="people" size={14} /> <span className="shrink-0 tnum">{1 + (a.members?.length ?? 0)} из {a.groupSize}</span></>}
          </p>
          {person && (
            <button onClick={() => (responded ? onOpenCapsule(a.id) : onRespond(a))} disabled={!responded && groupFull(a)}
              className={`mt-3 w-full h-11 rounded-[14px] inline-flex items-center justify-center gap-2 font-semibold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-default ${responded ? 'bg-white/20' : 'bg-brand shadow-[0_6px_18px_rgb(255_79_134/.4)]'}`}>
              {joinLabel(a, responded)} <Icon name={responded ? 'chat' : 'arrow'} size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {a.groupSize && !person && <GroupStack activity={a} />}
        {!person && <p className="flex items-center gap-2 text-[13px] text-muted"><Icon name="pin" size={15} /> Точное место увидят только в чате: {a.exactPlace}</p>}
        {person && !a.groupSize && !responded && <p className="flex items-center gap-2 text-[13px] text-muted"><Icon name="shield" size={15} /> Точное место откроется в чате после отклика</p>}
      </div>

      <div className="flex items-center gap-1 px-2.5 pt-1.5">
        <LikeButton liked={hearted} onToggle={() => dispatch({ type: 'toggleHeart', activityId: a.id })} className="w-10 h-10" />
        <button onClick={() => setComments(true)} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Комментарии"><Icon name="comment" size={25} /></button>
        <ShareButton activity={a} now={now} />
        <button onClick={() => dispatch({ type: 'toggleSave', activityId: a.id })} className="ml-auto grid place-items-center w-10 h-10 cursor-pointer" aria-label={saved ? 'Убрать из сохранённого' : 'Сохранить'} aria-pressed={saved}>
          <Icon name="bookmark" size={24} fill={saved} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-1 text-[14px]">
        {state.cloud ? (state.likeCounts?.[a.id] ?? 0) > 0 && <span className="font-semibold tnum">{likesLabel(state.likeCounts![a.id])}</span>
          : <span className="font-semibold tnum">{likesLabel(likeCount(a.id, hearted))}</span>}
        {a.music && <span className="self-start max-w-full"><PlanMusicChip id={a.id} music={a.music} /></span>}
        <p><span className="font-semibold">{person ? person.name : me.name}</span> {a.title}</p>
        <p className="text-muted">#{a.category.toLowerCase()} #{a.area.toLowerCase().replace(/[^а-яёa-z0-9]+/g, '')}</p>
        {compat && compat.sharedTags.length > 0 && <p className="text-muted text-[13px]">Общие интересы: {compat.sharedTags.join(', ')}</p>}
        {compat && sharedAnswers(me.answers, person!.answers).length > 0 && <p className="text-muted text-[13px]">Совпало в вайб-тесте: {sharedAnswers(me.answers, person!.answers).join(', ')}</p>}
        <CommentsPreview activity={a} onOpen={() => setComments(true)} />
        <span className="text-[12px] text-muted">{a.timeHidden ? 'Время обсудим в чате' : started ? 'Идёт сейчас' : `Начало ${relative(a.startsAt, now)}`}</span>
      </div>

      {boostNote && createPortal(
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[95] rounded-full bg-fg text-bg px-4 h-10 inline-flex items-center text-[14px] font-medium shadow-soft whitespace-nowrap" role="status">{boostNote}</div>,
        document.body,
      )}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Действия">
        <div className="flex flex-col divide-y divide-line -mx-5">
          {person && <button onClick={() => { setMenu(false); setReporting(person) }} className="h-12 px-5 text-left font-semibold text-danger cursor-pointer">Пожаловаться</button>}
          {onHide && person && <button onClick={() => { setMenu(false); onHide() }} className="h-12 px-5 text-left cursor-pointer">Не интересно</button>}
          {!person && <BoostPlanButton planId={a.id} onDone={(msg) => { setMenu(false); setBoostNote(msg) }} />}
          {!person && <button onClick={() => { setMenu(false); dispatch({ type: 'deleteActivity', activityId: a.id }) }} className="h-12 px-5 text-left font-semibold text-danger cursor-pointer">Удалить план</button>}
          <button onClick={() => { setMenu(false); dispatch({ type: 'toggleSave', activityId: a.id }) }} className="h-12 px-5 text-left cursor-pointer">{saved ? 'Убрать из сохранённого' : 'Сохранить'}</button>
        </div>
      </Sheet>
      <ReportSheet person={reporting} onClose={() => setReporting(null)} />
      <CommentsSheet activity={a} open={comments} onClose={() => setComments(false)} />
    </article>
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
