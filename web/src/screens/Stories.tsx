import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { compatibility, planWhen, relative } from '../lib'
import { Avatar, Button, Icon, Sheet, StoryRing } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { TrackChip } from '../music/PlayerUI'
import { personTrack } from '../music/player'
import { ListeningBadge } from '../music/NowPlaying'
import { compressPhoto, readVideoDuration } from './Shorts'
import type { Activity, Person, Story } from '../types'

// Истории как в Instagram: у каждого человека — его истории за сутки и действующий план.
// Кружки сверху главной, просмотр на весь экран с полосками, ответ — в личку.

const STEP_MS = 6000
const MAX_VIDEO_SEC = 60
const MAX_MB = 50
const HUES = [330, 12, 30, 150, 200, 230, 260, 290]

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

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center" role="dialog" aria-modal="true" aria-label={`Истории ${p.name}`}>
      <div className="relative w-full max-w-[480px] h-full flex flex-col text-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-hidden">
        {/* Содержимое */}
        {s?.kind === 'photo' && (
          <>
            <img src={s.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70" />
            <img src={s.url} alt={s.caption || 'История'} className="absolute inset-0 w-full h-full object-contain" />
          </>
        )}
        {s?.kind === 'video' && (
          <video ref={video} key={s.id} src={s.url} className="absolute inset-0 w-full h-full object-contain" autoPlay playsInline muted={false}
            onLoadedMetadata={(e) => setVideoMs(Math.min(MAX_VIDEO_SEC, e.currentTarget.duration || 15) * 1000)} onEnded={() => nav.current.next()} />
        )}
        {s?.kind === 'text' && (
          <div className="absolute inset-0 grid place-items-center p-8" style={{ background: `linear-gradient(160deg, hsl(${s.hue} 80% 55%), hsl(${(s.hue + 50) % 360} 75% 38%))` }}>
            <p className="font-display font-bold text-[28px] leading-tight text-center whitespace-pre-wrap break-words drop-shadow" data-no-translate>{s.caption}</p>
          </div>
        )}
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
          {s && s.kind !== 'text' && s.caption && <p className="text-[16px] font-semibold drop-shadow whitespace-pre-wrap" data-no-translate>{s.caption}</p>}
          {a && (
            <div className="flex flex-col gap-2">
              <span className="self-start rounded-full bg-white/20 backdrop-blur px-3 h-7 inline-flex items-center text-[12px] font-bold uppercase tracking-wider">{a.category}</span>
              <h2 className="font-display font-bold text-[26px] leading-tight drop-shadow">{a.title}</h2>
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
                  placeholder="Ответить на план…" className="flex-1 min-w-0 h-11 rounded-full border border-white/60 bg-transparent px-4 text-white placeholder:text-white/70 focus:outline-none focus:border-white" autoComplete="off" />
                <button type="submit" className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark cursor-pointer" aria-label="Откликнуться и отправить"><Icon name="send" size={18} /></button>
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
          <Sheet open={confirmDelete} onClose={() => { setConfirmDelete(false); setPaused(false) }} title="Удалить историю?">
            <div className="flex flex-col gap-3">
              <p className="text-muted">История исчезнет у всех прямо сейчас.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => { setConfirmDelete(false); setPaused(false) }}>Отмена</Button>
                <Button variant="danger" onClick={() => { dispatch({ type: 'deleteStory', id: s.id }); setConfirmDelete(false); setPaused(false); if (ii > 0) setIi(ii - 1) }}>Удалить</Button>
              </div>
            </div>
          </Sheet>
        </>
      )}
    </div>
  )
}

function plEnd(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? '' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'а' : 'ов'
}

/** Новая история: фото, видео до минуты или текст на цветном фоне. */
export function StoryCreator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [mode, setMode] = useState<'media' | 'text'>('media')
  const [file, setFile] = useState<Blob | null>(null)
  const [kind, setKind] = useState<'photo' | 'video'>('photo')
  const [preview, setPreview] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [caption, setCaption] = useState('')
  const [hue, setHue] = useState(330)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) return
    setFile(null); setCaption(''); setError(''); setMode('media')
    setPreview(null) // ссылку не отзываем: её показывает только что опубликованная история
  }, [open])

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    const photo = f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)
    if (photo) {
      try {
        const blob = await compressPhoto(f)
        setFile(blob); setKind('photo'); setPreview(URL.createObjectURL(blob))
      } catch { setError('Не получилось открыть фото. Выберите JPG или PNG.') }
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Видео больше ${MAX_MB} МБ.`); return }
    const url = URL.createObjectURL(f)
    const d = await readVideoDuration(url)
    if (d < 0) { URL.revokeObjectURL(url); setError('Браузер не может открыть это видео. Попробуйте MP4.'); return }
    if (d > MAX_VIDEO_SEC + 0.5) { URL.revokeObjectURL(url); setError(`Видео длиннее ${MAX_VIDEO_SEC} секунд.`); return }
    setFile(f); setKind('video'); setDuration(d); setPreview(url)
  }

  const publish = async () => {
    const id = crypto.randomUUID()
    const now = Date.now()
    const base = { id, authorId: 'me', at: now, expiresAt: now + 24 * 3600_000, hue }
    if (mode === 'text') {
      if (!caption.trim()) return
      dispatch({ type: 'addStory', story: { ...base, kind: 'text', caption: caption.trim().slice(0, 300) } })
    } else {
      if (!file || !preview) return
      // В демо фото храним прямо в браузере (data URL), чтобы история пережила перезагрузку.
      let url = preview
      if (!state.cloud && kind === 'photo') url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file) })
      dispatch({ type: 'addStory', story: { ...base, kind, url, caption: caption.trim().slice(0, 300), ...(kind === 'video' ? { duration: Math.round(duration * 10) / 10 } : {}) }, file })
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новая история">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1" role="tablist">
          {([['media', 'Фото или видео'], ['text', 'Текст']] as const).map(([m, label]) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`h-9 rounded-full text-[14px] font-semibold cursor-pointer ${mode === m ? 'bg-surface shadow-soft' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
        {mode === 'media' ? (
          <>
            {preview ? (
              <div className="relative mx-auto w-44 aspect-[9/16] rounded-2xl overflow-hidden bg-black">
                {kind === 'photo' ? <img src={preview} alt="Предпросмотр" className="w-full h-full object-cover" /> : <video src={preview} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
                <button onClick={() => input.current?.click()} className="absolute right-2 top-2 h-8 px-3 rounded-full bg-black/50 text-white text-[12px] font-semibold cursor-pointer">Заменить</button>
              </div>
            ) : (
              <button onClick={() => input.current?.click()} className="mx-auto w-44 aspect-[9/16] rounded-2xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 text-muted cursor-pointer hover:bg-surface-2">
                <Icon name="camera" size={32} /><span className="text-[14px] font-semibold">Выбрать фото или видео</span><span className="text-[12px]">видео до {MAX_VIDEO_SEC} секунд</span>
              </button>
            )}
            <input ref={input} type="file" accept="image/*,video/mp4,video/quicktime,video/webm,video/*" className="sr-only" onChange={pick} aria-label="Выбрать фото или видео для истории" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder="Подпись (необязательно)" aria-label="Подпись к истории"
              className="h-11 rounded-2xl bg-surface-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-cobalt" />
          </>
        ) : (
          <>
            <div className="mx-auto w-44 aspect-[9/16] rounded-2xl grid place-items-center p-4 text-white" style={{ background: `linear-gradient(160deg, hsl(${hue} 80% 55%), hsl(${(hue + 50) % 360} 75% 38%))` }}>
              <p className="font-display font-bold text-[17px] leading-tight text-center whitespace-pre-wrap break-words">{caption || 'Ваш текст'}</p>
            </div>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} rows={3} placeholder="Куда зовёте, что делаете, настроение…" aria-label="Текст истории"
              className="rounded-2xl bg-surface-2 p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-cobalt" />
            <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Цвет фона">
              {HUES.map((h) => (
                <button key={h} role="radio" aria-checked={hue === h} aria-label={`Фон ${h}`} onClick={() => setHue(h)}
                  className={`w-8 h-8 rounded-full cursor-pointer ${hue === h ? 'ring-2 ring-fg ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ background: `linear-gradient(160deg, hsl(${h} 80% 55%), hsl(${(h + 50) % 360} 75% 38%))` }} />
              ))}
            </div>
          </>
        )}
        {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
        <Button onClick={() => void publish()} disabled={mode === 'text' ? !caption.trim() : !file}>Опубликовать на 24 часа</Button>
      </div>
    </Sheet>
  )
}
