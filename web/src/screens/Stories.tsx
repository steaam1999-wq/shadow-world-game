import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
export { StoryCreator } from './StoryCamera'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { compatibility, planWhen, relative, shortArea } from '../lib'
import { Avatar, Button, ConfirmSheet, Icon, Sheet, StoryRing } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { TrackChip } from '../music/PlayerUI'
import { personTrack } from '../music/player'
import { ListeningBadge } from '../music/NowPlaying'
import { StoryCreator } from './StoryCamera'
import { filterOf, filterStyle } from '../components/storyFilters'
import { usePlayer } from '../music/player'
import type { Activity, Person, Story } from '../types'

// Истории как в Instagram: у каждого человека — его истории за сутки и действующий план.
// Кружки сверху главной, просмотр на весь экран с полосками, ответ — в личку.

const STEP_MS = 6000
const MAX_VIDEO_SEC = 60

type Item = { type: 'story'; story: Story } | { type: 'plan'; activity: Activity }
interface Group { personId: string; person: { id: string; name: string; hue: number; photo?: string; verified?: boolean }; items: Item[]; unseen: boolean }

/** Группы историй: мои отдельно, у остальных — непросмотренные первыми. */
export function useStoryGroups(now: number) {
  const { state } = useStore()
  const seen = new Set(state.storiesSeen ?? [])
  const live = (state.stories ?? []).filter((s) => s.expiresAt > now).sort((a, b) => a.at - b.at)
  const plans = state.activities.filter((a) => a.expiresAt > now)
  const me = state.me
  const mine: Group | null = me ? {
    personId: 'me', person: { id: 'me', name: me.name, hue: me.hue, photo: me.photo, verified: me.verified },
    items: live.filter((s) => s.authorId === 'me').map((story) => ({ type: 'story' as const, story })), unseen: false,
  } : null
  const others: Group[] = state.people.flatMap((p): Group[] => {
    const stories = live.filter((s) => s.authorId === p.id)
    const plan = plans.filter((a) => a.authorId === p.id).sort((x, y) => x.startsAt - y.startsAt)[0]
    const items: Item[] = [...stories.map((story) => ({ type: 'story' as const, story })), ...(plan ? [{ type: 'plan' as const, activity: plan }] : [])]
    if (!items.length) return []
    const unseen = stories.some((s) => !seen.has(s.id)) || (!!plan && !state.seenStories.includes(p.id))
    return [{ personId: p.id, person: p, items, unseen }]
  }).sort((a, b) => Number(b.unseen) - Number(a.unseen) || (b.items[0].type === 'story' ? 1 : 0) - (a.items[0].type === 'story' ? 1 : 0))
  return { mine, others }
}

/** Ряд кружков над лентой. */
export function StoriesRow({ now, onRespond, onOpenCapsule, onMessage }: {
  now: number
  onRespond: (a: Activity, text: string) => void
  onOpenCapsule: (activityId: string) => void
  onMessage: (personId: string, text: string) => void
}) {
  const { mine, others } = useStoryGroups(now)
  // Состав фиксируем при открытии, иначе пересортировка «просмотренных» сбивает порядок.
  const [viewer, setViewer] = useState<{ groups: Group[]; index: number } | null>(null)
  const [creating, setCreating] = useState(false)
  const hasMine = !!mine?.items.length

  return (
    <>
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pt-3 pb-4">
        {mine && (
          <div className="relative flex flex-col items-center gap-1 w-[72px] shrink-0">
            <button onClick={() => (hasMine ? setViewer({ groups: [mine], index: 0 }) : setCreating(true))} className="cursor-pointer" aria-label={hasMine ? 'Моя история' : 'Добавить историю'}>
              {hasMine
                ? <StoryRing seen={false} size={68}><Avatar name={mine.person.name} hue={mine.person.hue} src={mine.person.photo} size={58} /></StoryRing>
                : <span className="grid place-items-center w-[68px] h-[68px]"><Avatar name={mine.person.name} hue={mine.person.hue} src={mine.person.photo} size={60} /></span>}
            </button>
            <button onClick={() => setCreating(true)} className="absolute right-0.5 top-[46px] grid place-items-center w-6 h-6 rounded-full bg-brand text-white border-2 border-surface cursor-pointer" aria-label="Новая история"><Icon name="plus" size={14} /></button>
            <span className="text-[12px] text-muted truncate w-full text-center">{hasMine ? 'Ваша история' : 'Добавить'}</span>
          </div>
        )}
        {others.map((g, i) => (
          <button key={g.personId} onClick={() => setViewer({ groups: others, index: i })} className="flex flex-col items-center gap-1 w-[72px] shrink-0 cursor-pointer" aria-label={`Истории ${g.person.name}`}>
            <span className="relative">
              <StoryRing seen={!g.unseen} size={68}>
                <Avatar name={g.person.name} hue={g.person.hue} src={g.person.photo} size={58} />
              </StoryRing>
              <ListeningBadge person={g.person as Person} />
            </span>
            <span className="text-[12px] truncate w-full text-center">{g.person.name}</span>
          </button>
        ))}
      </div>
      {viewer && (
        <StoryViewer groups={viewer.groups} start={viewer.index} now={now} onClose={() => setViewer(null)}
          onRespond={(a, t) => { setViewer(null); onRespond(a, t) }} onOpenCapsule={(id) => { setViewer(null); onOpenCapsule(id) }}
          onMessage={onMessage} onAdd={() => { setViewer(null); setCreating(true) }} />
      )}
      <StoryCreator open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

function StoryViewer({ groups, start, now, onClose, onRespond, onOpenCapsule, onMessage, onAdd }: {
  groups: Group[]; start: number; now: number; onClose: () => void
  onRespond: (a: Activity, text: string) => void; onOpenCapsule: (activityId: string) => void
  onMessage: (personId: string, text: string) => void; onAdd: () => void
}) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const [gi, setGi] = useState(start)
  // Начинаем с первой непросмотренной истории человека.
  const firstUnseen = (g: Group) => Math.max(0, g.items.findIndex((it) => it.type === 'story' ? !(state.storiesSeen ?? []).includes(it.story.id) && it.story.authorId !== 'me' : !state.seenStories.includes(g.personId)))
  const [ii, setIi] = useState(() => firstUnseen(groups[start]))
  const [paused, setPaused] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState('')
  const [viewsOpen, setViewsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const [videoMs, setVideoMs] = useState<number | null>(null)

  // Мои истории могли удалиться — пересчитываем группу из свежего состояния.
  const g0 = groups[gi]
  const g: Group = g0.personId === 'me'
    ? { ...g0, items: (state.stories ?? []).filter((s) => s.authorId === 'me' && s.expiresAt > now).sort((a, b) => a.at - b.at).map((story) => ({ type: 'story' as const, story })) }
    : g0
  const item = g.items[Math.min(ii, g.items.length - 1)]
  const mine = g.personId === 'me'

  const next = () => {
    if (ii + 1 < g.items.length) { setIi(ii + 1); return }
    if (gi + 1 < groups.length) { setGi(gi + 1); setIi(firstUnseen(groups[gi + 1])); return }
    onClose()
  }
  const prev = () => {
    if (ii > 0) { setIi(ii - 1); return }
    if (gi > 0) { setGi(gi - 1); setIi(0) }
  }
  const nav = useRef({ next })
  useEffect(() => { nav.current = { next } })

  useEffect(() => { if (!g.items.length) onClose() }, [g.items.length, onClose])
  // Отметка «просмотрено».
  useEffect(() => {
    if (!item) return
    if (item.type === 'story') { if (item.story.authorId !== 'me') dispatch({ type: 'viewStory', id: item.story.id }) }
    else dispatch({ type: 'seeStory', personId: g.personId })
  }, [item, g.personId, dispatch])
  useEffect(() => { setText(''); setSent(''); setVideoMs(null) }, [gi, ii])

  const duration = item?.type === 'story' && item.story.kind === 'video' ? videoMs : STEP_MS
  useEffect(() => {
    if (paused || !duration) return
    const t = setTimeout(() => nav.current.next(), duration)
    return () => clearTimeout(t)
  }, [gi, ii, paused, duration])
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (paused) v.pause(); else void v.play().catch(() => {})
  }, [paused, gi, ii])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') nav.current.next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!item) return null
  const p = g.person
  const person = state.people.find((x) => x.id === g.personId)
  const reply = (t: string) => {
    const msg = t.trim()
    if (!msg || item.type !== 'story') return
    const quote = item.story.kind === 'text' ? `«${item.story.caption.slice(0, 60)}»` : item.story.kind === 'photo' ? 'фото' : 'видео'
    onMessage(g.personId, `Ответ на историю (${quote}): ${msg}`)
    setText(''); setSent('Отправлено в личку'); setPaused(false)
  }
  const s = item.type === 'story' ? item.story : null
  const a = item.type === 'plan' ? item.activity : null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex justify-center" role="dialog" aria-modal="true" aria-label={`Истории ${p.name}`}>
      <div className="relative w-full max-w-[480px] h-full flex flex-col text-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-hidden">
        {/* Содержимое */}
        {s?.kind === 'photo' && (
          <>
            <img src={s.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70" />
            <img src={s.url} alt={s.caption || 'История'} className="absolute inset-0 w-full h-full object-contain" style={filterStyle(s.filter)} />
          </>
        )}
        {s?.kind === 'video' && (
          <video ref={video} key={s.id} src={s.url} className="absolute inset-0 w-full h-full object-contain" style={filterStyle(s.filter)} autoPlay playsInline muted={false}
            onLoadedMetadata={(e) => setVideoMs(Math.min(MAX_VIDEO_SEC, e.currentTarget.duration || 15) * 1000)} onEnded={() => nav.current.next()} />
        )}
        {s?.kind === 'text' && (
          <div className="absolute inset-0 grid place-items-center p-8" style={{ background: `linear-gradient(160deg, hsl(${s.hue} 80% 55%), hsl(${(s.hue + 50) % 360} 75% 38%))` }}>
            <p className="font-display font-bold text-[28px] leading-tight text-center whitespace-pre-wrap break-words drop-shadow" data-no-translate>{s.caption}</p>
          </div>
        )}
        {s && filterOf(s.filter).overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: filterOf(s.filter).overlay }} />}
        {a && <div className="absolute inset-0 opacity-90"><PostArt activity={a} /></div>}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70 pointer-events-none" />

        {/* Полоски */}
        <div className="relative flex gap-1 px-2 pt-2">
          {g.items.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
              <div key={`${gi}-${ii}-${i}-${duration}`} className="h-full bg-white"
                style={i < ii ? { width: '100%' } : i === ii && duration ? { animation: `storybar ${duration}ms linear both`, animationPlayState: paused ? 'paused' : 'running' } : { width: 0 }} />
            </div>
          ))}
        </div>
        <div className="relative flex items-center gap-3 px-3 py-3">
          <button onClick={() => { if (!mine) { onClose(); openProfile(p.id) } }} className="cursor-pointer" aria-label={mine ? 'Вы' : `Профиль ${p.name}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={36} verified={p.verified} /></button>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold text-[14px]">{mine ? 'Ваша история' : p.name}
              <span className="font-normal opacity-75"> · {s ? relative(s.at, now) : a ? `план · ${planWhen(a, now)}` : ''}</span>
              {!mine && a && person && <span className="font-normal opacity-75"> · {compatibility(state.me!, person).score}% вайб</span>}
            </div>
            {a && person && <TrackChip track={personTrack(person)} light />}
          </div>
          <button onClick={() => setPaused((x) => !x)} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label={paused ? 'Продолжить' : 'Пауза'}><Icon name={paused ? 'play' : 'pause'} size={20} fill /></button>
          <button onClick={onClose} className="grid place-items-center w-10 h-10 cursor-pointer" aria-label="Закрыть"><Icon name="x" size={26} /></button>
        </div>

        {/* Зоны перелистывания; удержание — пауза */}
        <div className="relative flex-1 flex" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
          <button className="w-1/3 h-full cursor-pointer" aria-label="Предыдущая" onClick={prev} />
          <button className="w-2/3 h-full cursor-pointer" aria-label="Следующая" onClick={() => nav.current.next()} />
        </div>

        <div className="relative px-4 pb-4 flex flex-col gap-3">
          {s?.sticker && <StorySticker story={s} mine={mine} name={p.name} onInvite={() => { reply('Пойду с тобой! 🙋'); setSent('Приглашение принято — написали в личку') }} />}
          {s && s.kind !== 'text' && s.caption && <p className="text-[16px] font-semibold drop-shadow whitespace-pre-wrap" data-no-translate>{s.caption}</p>}
          {a && (
            <div className="glass-panel rounded-[22px] p-3.5 pl-4 flex items-center gap-3.5">
              <div className="shrink-0 text-center pr-3.5 border-r border-white/20 min-w-[58px]">
                {a.timeHidden ? <><div className="text-[10.5px] font-semibold tracking-[.12em] text-[#ffb3cb] uppercase">Время</div><div className="font-display font-bold text-[15px]">обсудим</div></>
                  : <><div className="text-[10.5px] font-semibold tracking-[.12em] text-[#ffb3cb] uppercase">{planWhen(a, now).split(', ')[0]}</div><div className="font-display font-bold text-[21px] leading-none mt-1 tnum">{planWhen(a, now).split(', ')[1] ?? ''}</div></>}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-[17px] leading-snug line-clamp-3">{a.title}</h2>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-white/80"><Icon name="pin" size={13} /> <span className="truncate">{shortArea(a.area)}</span></p>
              </div>
            </div>
          )}

          {mine && s ? (
            <div className="flex items-center gap-2">
              <button onClick={() => { setPaused(true); setViewsOpen(true) }} className="flex-1 h-11 rounded-full bg-white/15 backdrop-blur inline-flex items-center justify-center gap-2 font-semibold cursor-pointer"><Icon name="eye" size={18} /> {s.views?.length ?? 0} просмотр{plEnd(s.views?.length ?? 0)}</button>
              <button onClick={onAdd} className="grid place-items-center w-11 h-11 rounded-full bg-white/15 backdrop-blur cursor-pointer" aria-label="Добавить ещё историю"><Icon name="plus" size={20} /></button>
              <button onClick={() => { setPaused(true); setConfirmDelete(true) }} className="grid place-items-center w-11 h-11 rounded-full bg-white/15 backdrop-blur cursor-pointer" aria-label="Удалить историю"><Icon name="trash" size={18} /></button>
            </div>
          ) : a ? (
            state.liked.includes(a.id) ? (
              <Button onClick={() => onOpenCapsule(a.id)} className="!bg-white !text-[#14152a]">Открыть чат</Button>
            ) : (
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onRespond(a, text.trim() || 'Хочу с тобой!') }}>
                <input id="story-reply" aria-label="Ответить на план" value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
                  placeholder="Ответить на план…" className="glass-chip flex-1 min-w-0 h-12 rounded-full px-4 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50" autoComplete="off" />
                <button type="submit" className="grid place-items-center w-12 h-12 rounded-full bg-brand text-white shadow-[0_6px_18px_rgb(255_79_134/.45)] cursor-pointer" aria-label="Откликнуться и отправить"><Icon name="send" size={18} /></button>
              </form>
            )
          ) : s ? (
            <div className="flex flex-col gap-2">
              {sent && <p className="self-center text-[13px] bg-black/40 rounded-full px-3 py-1" role="status">{sent}</p>}
              <div className="flex gap-2 justify-center">
                {['🔥', '❤️', '😂', '☕'].map((e) => (
                  <button key={e} onClick={() => reply(e)} className="grid place-items-center w-11 h-11 rounded-full bg-white/15 backdrop-blur text-[22px] cursor-pointer" aria-label={`Ответить ${e}`}>{e}</button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); reply(text) }}>
                <input id="story-reply" aria-label="Ответить на историю" value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
                  placeholder="Ответить на историю…" className="flex-1 min-w-0 h-11 rounded-full border border-white/60 bg-transparent px-4 text-white placeholder:text-white/70 focus:outline-none focus:border-white" autoComplete="off" />
                <button type="submit" disabled={!text.trim()} className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark cursor-pointer disabled:opacity-50" aria-label="Отправить ответ"><Icon name="send" size={18} /></button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {mine && s && (
        <>
          <Sheet open={viewsOpen} onClose={() => { setViewsOpen(false); setPaused(false) }} title={`Просмотры · ${s.views?.length ?? 0}`}>
            {s.views?.length ? (
              <ul className="flex flex-col -mx-2 max-h-[50vh] overflow-y-auto">
                {[...s.views].sort((x, y) => y.at - x.at).map((v) => {
                  const who = state.people.find((x) => x.id === v.personId)
                  return who ? (
                    <li key={v.personId}>
                      <button onClick={() => { onClose(); openProfile(who.id) }} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-2 text-left cursor-pointer">
                        <Avatar name={who.name} hue={who.hue} src={who.photo} size={40} />
                        <span className="flex-1 min-w-0 font-semibold truncate">{who.name}</span>
                        <span className="text-[12px] text-muted">{relative(v.at, Date.now())}</span>
                      </button>
                    </li>
                  ) : null
                })}
              </ul>
            ) : <p className="py-6 text-center text-muted">Пока никто не посмотрел. История видна 24 часа.</p>}
          </Sheet>
          <ConfirmSheet open={confirmDelete} onClose={() => { setConfirmDelete(false); setPaused(false) }} title="Удалить историю?" text="История исчезнет у всех прямо сейчас." action="Удалить историю"
            onConfirm={() => { dispatch({ type: 'deleteStory', id: s.id }); setConfirmDelete(false); setPaused(false); if (ii > 0) setIi(ii - 1) }} />
        </>
      )}
    </div>,
    document.body,
  )
}

function plEnd(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? '' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'а' : 'ов'
}

/** Стикеры на истории: «Позвать» (фирменный — зритель одним нажатием соглашается) и трек. */
function StorySticker({ story, mine, name, onInvite }: { story: Story; mine: boolean; name: string; onInvite: () => void }) {
  const player = usePlayer()
  const t = story.sticker?.track
  const playing = !!t && player.track?.id === t.id && player.playing
  return (
    <div className="flex flex-col items-center gap-2">
      {story.sticker?.invite && (
        mine
          ? <span className="rounded-2xl bg-white text-[#14152a] px-4 py-2 font-display font-bold rotate-[-3deg]">🙋 Пойдём со мной?</span>
          : <button onClick={onInvite} className="rounded-2xl bg-white text-[#14152a] px-4 py-2 font-display font-bold rotate-[-3deg] shadow-soft cursor-pointer" aria-label={`Пойти с ${name}`}>🙋 Пойду с тобой!</button>
      )}
      {t && (
        <button onClick={() => (player.track?.id === t.id ? player.toggle() : player.play(t, [t]))} className="inline-flex items-center gap-2 rounded-full bg-black/45 backdrop-blur px-3 py-1.5 text-[13px] cursor-pointer" aria-label={playing ? `Пауза: ${t.title}` : `Слушать: ${t.title}`}>
          <Icon name={playing ? 'pause' : 'play'} size={14} fill /> 🎵 {t.title} · {t.artist}
        </button>
      )}
    </div>
  )
}
