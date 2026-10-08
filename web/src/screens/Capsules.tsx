import { useEffect, useRef, useState } from 'react'
import { soundCloudLink } from '../music/soundcloud'
import { SoundCloudCard } from '../music/SoundCloudCard'
import { createPortal } from 'react-dom'
import { PhotoViewer } from '../components/PhotoViewer'
import { useStore } from '../store'
import { ReactionChips, ReactionPicker } from '../components/Reactions'
import { PlaylistButton } from '../music/ChatPlaylist'
import { useOpenProfile } from '../nav'
import { hm, planWhen, nameAge } from '../lib'
import { Avatar, Button, ConfirmSheet, Icon, Pill, Sheet, readPhotoFull, useKeyboardInset, type Tone } from '../components/ui'
import { ReportSheet } from './Vibe'
import { GroupAvatar, GroupCreateSheet } from './Groups'
import { AgainCard, CheckinSheet, SafetySheet } from '../components/Meet'
import type { Capsule, CapsuleStatus, Person } from '../types'

/** Человек из переписки; если профиль скрыт (бан или удаление) — заглушка, чтобы чат не ломался. */
function personOrGone(people: Person[], id: string): Person {
  return people.find((x) => x.id === id) ?? { id, name: 'Аккаунт недоступен', age: null, hue: 280, bio: '', district: '', distanceKm: 0, answers: {} as Person['answers'], tags: [], verified: false, meetings: 0 }
}
import { openVerify } from '../components/Verify'
import { MONEY_RE, MeetFeedback, MoneyWarning, SafetyMemo, useSafetyMemo, waitingForReply } from '../safety'
import { useCalls } from '../calls/Calls'

export const STATUS: Record<CapsuleStatus, { label: string; tone: Tone }> = {
  active: { label: 'Переписка', tone: 'spark' },
  agreed: { label: 'Договорились о встрече', tone: 'cobalt' },
  contacts: { label: 'Обменялись контактами', tone: 'ok' },
  met: { label: 'Встреча состоялась', tone: 'ok' },
}

const GROUP_MS = 5 * 60_000
const dayKey = (ts: number) => new Date(ts).toDateString()
/** Разделитель дней в переписке: «Сегодня», «Вчера», «12 марта». */
function dayLabel(ts: number, now: number) {
  if (dayKey(ts) === dayKey(now)) return 'Сегодня'
  if (dayKey(ts) === dayKey(now - 86_400_000)) return 'Вчера'
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}) })
}

/** Время последнего сообщения: сегодня — часы, раньше — дата. */
function when(ts: number, now: number) {
  const d = new Date(ts), n = new Date(now)
  if (d.toDateString() === n.toDateString()) return hm(ts)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const REVEAL = 84 // ширина красной кнопки удаления

const FULL = 0.55 // доля ширины: протянули дальше — удаляем сразу, как в «Почте» и Telegram

/** Строка чата: свайп справа налево открывает «Удалить», длинный свайп — удаляет сразу. */
function SwipeRow({ open, onOpenChange, onClick, onDelete, label, removing, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; onClick: () => void; onDelete: () => void; label: string; removing?: boolean; children: React.ReactNode
}) {
  const [dx, setDx] = useState<number | null>(null) // сдвиг во время жеста
  const li = useRef<HTMLLIElement>(null)
  const start = useRef<{ x: number; y: number; base: number; horizontal: boolean | null } | null>(null)
  const moved = useRef(false)
  const width = () => li.current?.offsetWidth ?? 360
  const offset = removing ? -width() : dx ?? (open ? -REVEAL : 0)
  const full = dx !== null && -dx > width() * FULL

  const down = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, horizontal: null }; moved.current = false }
  const move = (e: React.PointerEvent) => {
    const st = start.current
    if (!st) return
    const ddx = e.clientX - st.x, ddy = e.clientY - st.y
    if (st.horizontal === null && Math.hypot(ddx, ddy) > 8) {
      st.horizontal = Math.abs(ddx) > Math.abs(ddy)
      if (st.horizontal) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (!st.horizontal) return
    moved.current = true
    const next = Math.min(0, st.base + ddx)
    if (dx !== null && (-next > width() * FULL) !== full) { try { navigator.vibrate?.(10) } catch { /* ignore */ } }
    setDx(next)
  }
  const up = () => {
    const st = start.current
    start.current = null
    if (st?.horizontal && dx !== null) { if (full) onDelete(); else onOpenChange(dx < -REVEAL / 2) }
    setDx(null)
  }

  return (
    <li ref={li} className="relative -mx-3 overflow-hidden rounded-2xl transition-[max-height,opacity] duration-300 ease-out"
      style={{ maxHeight: removing ? 0 : 96, opacity: removing ? 0 : 1 }}>
      <button onClick={onDelete} tabIndex={open ? 0 : -1} aria-label={label} aria-hidden={offset === 0}
        className={`absolute inset-y-0 right-0 flex items-center justify-end overflow-hidden bg-danger text-white cursor-pointer ${dx === null ? 'transition-[width] duration-300 ease-out' : ''}`} style={{ width: Math.max(0, -offset) }}>
        <span className={`flex flex-col items-center gap-0.5 text-[12px] font-semibold transition-transform duration-200 ${full ? 'scale-110' : ''}`}
          style={{ width: REVEAL, flex: 'none', marginRight: full ? Math.max(0, -offset - REVEAL) : 0, transition: 'margin .2s ease-out' }}>
          <Icon name="trash" size={22} /> Удалить
        </span>
      </button>
      <button onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClick={() => { if (moved.current) { moved.current = false; return } if (open) onOpenChange(false); else onClick() }}
        onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') onDelete() }}
        className={`relative w-full text-left flex items-center gap-3 py-2.5 px-3 hover:bg-surface/60 cursor-pointer touch-pan-y ${dx === null ? 'transition-transform duration-300 ease-out' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}>
        {children}
      </button>
    </li>
  )
}

/** Новый чат: выбрать любого человека. Сначала те, с кем уже общались и на кого подписаны. */
export function NewChatSheet({ open, onClose, onPick, onGroupCreated }: { open: boolean; onClose: () => void; onPick: (personId: string) => void; onGroupCreated: (groupId: string) => void }) {
  const { state } = useStore()
  const [query, setQuery] = useState('')
  const [grouping, setGrouping] = useState(false)
  useEffect(() => { if (!open) { setQuery(''); setGrouping(false) } }, [open])
  const q = query.trim().toLowerCase()
  const following = new Set(state.following ?? [])
  const chatted = new Set(state.capsules.filter((c) => !c.hidden).map((c) => c.personId))
  const rank = (p: Person) => (chatted.has(p.id) ? 0 : following.has(p.id) ? 1 : 2)
  const people = state.people
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ru'))
  if (grouping) return <GroupCreateSheet open={open} onClose={onClose} onCreated={onGroupCreated} />
  return (
    <Sheet open={open} onClose={onClose} title="Новый чат">
      <div className="flex flex-col gap-3">
        <button onClick={() => setGrouping(true)} className="flex items-center gap-3 p-2 -mx-2 rounded-2xl hover:bg-surface-2 text-left cursor-pointer">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-brand text-white shrink-0"><Icon name="people" size={20} /></span>
          <span className="min-w-0"><span className="block font-semibold">Новая группа</span><span className="block text-[13px] text-muted">Чат на несколько человек</span></span>
        </button>
        <label className="flex items-center gap-2 h-10 rounded-full bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Кому написать?" aria-label="Поиск людей" className="flex-1 min-w-0 bg-transparent text-fg focus:outline-none" />
        </label>
        {people.length ? (
          <ul className="flex flex-col max-h-[55vh] overflow-y-auto -mx-2">
            {people.map((p) => (
              <li key={p.id}>
                <button onClick={() => onPick(p.id)} className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-surface-2 text-left cursor-pointer">
                  <Avatar name={p.name} hue={p.hue} src={p.photo} size={44} verified={p.verified} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{nameAge(p.name, p.age)}</span>
                    <span className="block text-[13px] text-muted truncate">{chatted.has(p.id) ? 'Уже общаетесь' : following.has(p.id) ? 'Вы подписаны' : p.district || p.bio || '\u00a0'}</span>
                  </span>
                  <Icon name="chat" size={20} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-muted text-[14px]">{q ? 'Никого не нашли.' : 'Пока некому написать — людей ещё нет.'}</p>
        )}
      </div>
    </Sheet>
  )
}

export function CapsuleList({ now, onOpen, onNew }: { now: number; onOpen: (id: string) => void; onNew: (personId: string) => void }) {
  const { state } = useStore()
  const { dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [swiped, setSwiped] = useState<string | null>(null) // у какой строки открыта кнопка удаления
  // Удалённый чат сначала уезжает и прячется; пока висит «Вернуть», его можно восстановить.
  const [removing, setRemoving] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null)
  const commit = useRef<(() => void) | null>(null)
  useEffect(() => () => { commit.current?.() }, [])
  const deleteChat = (id: string, name: string) => {
    commit.current?.()
    setSwiped(null)
    setRemoving(id)
    setTimeout(() => { setRemoving(null); setUndo({ id, name }) }, 300)
    const timer = setTimeout(() => { if (commit.current === done) done() }, 4500) // только своё удаление, не следующее
    const done = () => { clearTimeout(timer); commit.current = null; setUndo(null); dispatch({ type: 'hideChat', capsuleId: id }) }
    commit.current = done
    cancel.current = () => clearTimeout(timer)
  }
  const cancel = useRef<(() => void) | null>(null)
  const restore = () => { cancel.current?.(); commit.current = null; setUndo(null); setSwiped(null) }
  const [creating, setCreating] = useState(false)
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null)
  const lastAt = (c: Capsule) => c.messages[c.messages.length - 1]?.at ?? c.createdAt
  const q = query.trim().toLowerCase()
  const preview = (m: { from: string; text: string; photo?: string; photoPath?: string } | undefined, who = ''): React.ReactNode => {
    if (!m) return 'Нет сообщений'
    const log = callLog(m.text)
    if (log) {
      // Звонок в превью: значок и подпись вместо эмодзи; пропущенный входящий — красным.
      const bad = log.missed && m.from !== 'me'
      return (
        <span className={`inline-flex items-center gap-1.5 align-middle ${bad ? 'text-danger' : ''}`}>
          <Icon name={log.video ? 'video' : 'phone'} size={log.video ? 15 : 13} fill />
          {log.missed ? (m.from === 'me' ? `${log.video ? 'Видеозвонок' : 'Звонок'} без ответа` : `Пропущенный ${log.video ? 'видеозвонок' : 'звонок'}`)
            : `${log.video ? 'Видеозвонок' : 'Звонок'}${log.duration ? ` · ${log.duration}` : ''}`}
        </span>
      )
    }
    return `${m.from === 'me' ? 'Вы: ' : who ? `${who}: ` : ''}${m.text || (m.photo || m.photoPath ? '📷 Фото' : '')}`
  }
  // Личные чаты и группы — одним списком, свежие сверху.
  const rows = [
    ...state.capsules
      .filter((c) => !c.hidden && c.id !== undo?.id && state.people.some((x) => x.id === c.personId))
      .filter((c) => !q || personOrGone(state.people, c.personId).name.toLowerCase().includes(q))
      .map((c) => ({ kind: 'direct' as const, id: c.id, at: lastAt(c), c })),
    ...(state.groups ?? [])
      .filter((g) => !q || g.title.toLowerCase().includes(q))
      .map((g) => ({ kind: 'group' as const, id: g.id, at: g.messages[g.messages.length - 1]?.at ?? g.createdAt, g })),
  ].sort((a, b) => b.at - a.at)
  const leaving = (state.groups ?? []).find((g) => g.id === leavingGroup)

  const row = (id: string, at: number, unread: number, avatar: React.ReactNode, title: string, text: React.ReactNode, label: string, onDelete: () => void) => (
    <SwipeRow key={id} removing={removing === id} open={swiped === id} onOpenChange={(o) => setSwiped(o ? id : null)} onClick={() => onOpen(id)} onDelete={onDelete} label={label}>
      {avatar}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate">{title}</span>
          <span className={`shrink-0 text-[12px] tnum ${unread ? 'text-spark font-semibold' : 'text-muted'}`}>{when(at, now)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[14px] truncate ${unread ? 'text-fg font-semibold' : 'text-muted'}`}>{text}</span>
          {unread > 0 && <span className="shrink-0 grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-spark text-on-spark text-[11px] font-bold">{unread}</span>}
        </div>
      </div>
    </SwipeRow>
  )

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">Чаты</h1>
      <div className="flex items-center gap-2">
        <label className="flex-1 min-w-0 flex items-center gap-2 h-11 rounded-full bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по чатам" aria-label="Поиск по чатам" className="flex-1 min-w-0 bg-transparent text-fg focus:outline-none" />
        </label>
        <button onClick={() => setCreating(true)} className="shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-brand text-white font-semibold text-[14px] shadow-[0_8px_20px_-10px_rgb(255_79_134/.8)] cursor-pointer"><Icon name="plus" size={18} /> Новый чат</button>
      </div>
      {rows.length ? (
        <ul className="flex flex-col">
          {rows.map((r) => {
            if (r.kind === 'group') {
              const g = r.g
              const last = [...g.messages].reverse().find((m) => m.from !== 'system')
              const who = last?.from === 'them' ? (state.people.find((p) => p.id === last.senderId)?.name ?? '') : ''
              return row(g.id, r.at, g.unread, <GroupAvatar group={g} />, g.title, last ? preview(last, who) : 'Группа создана', g.ownerId === 'me' ? `Удалить группу ${g.title}` : `Выйти из группы ${g.title}`, () => setLeavingGroup(g.id))
            }
            const c = r.c
            const p = personOrGone(state.people, c.personId)
            const last = [...c.messages].reverse().find((m) => m.from !== 'system') ?? c.messages[c.messages.length - 1]
            return row(c.id, r.at, c.unread, <Avatar name={p.name} hue={p.hue} src={p.photo} size={54} verified={p.verified} ring={c.unread > 0} />, p.name, preview(last), `Удалить чат с ${p.name}`, () => deleteChat(c.id, p.name))
          })}
        </ul>
      ) : (
        <div className="rounded-[28px] bg-surface-2 p-8 flex flex-col items-center gap-3 text-center text-muted">
          {q ? 'Никого не нашли.' : 'Здесь будут ваши переписки. Начните новый чат или группу, напишите человеку из его профиля или откликнитесь на план.'}
          {!q && <Button onClick={() => setCreating(true)}><Icon name="edit" size={18} /> Новый чат</Button>}
        </div>
      )}
      <ConfirmSheet open={!!leaving} onClose={() => { setLeavingGroup(null); setSwiped(null) }}
        icon={leaving ? <GroupAvatar group={leaving} /> : null}
        title={leaving?.ownerId === 'me' ? `Удалить «${leaving?.title}»?` : `Выйти из «${leaving?.title}»?`}
        text={leaving?.ownerId === 'me' ? 'Группа и переписка исчезнут у всех участников.' : 'Переписка пропадёт у вас. Вернуть сможет только создатель.'}
        action={leaving?.ownerId === 'me' ? 'Удалить группу' : 'Выйти из группы'}
        onConfirm={() => { if (leaving) dispatch({ type: 'leaveGroup', groupId: leaving.id }); setLeavingGroup(null); setSwiped(null) }} />
      <NewChatSheet open={creating} onClose={() => setCreating(false)} onPick={(id) => { setCreating(false); onNew(id) }} onGroupCreated={(id) => { setCreating(false); onOpen(id) }} />
      {undo && createPortal(
        <div className="anim-sheet fixed left-3 right-3 bottom-[calc(100px+env(safe-area-inset-bottom,0px))] z-[55] mx-auto max-w-md flex items-center gap-3 rounded-2xl bg-fg text-bg pl-4 pr-2 h-13 min-h-12 shadow-soft" role="status">
          <Icon name="trash" size={18} />
          <span className="flex-1 min-w-0 truncate text-[14px] font-medium"><b>{undo.name}</b> — чат удалён</span>
          <button onClick={restore} className="h-9 px-3 rounded-xl font-semibold text-[14px] text-spark cursor-pointer">Вернуть</button>
        </div>,
        document.body,
      )}
    </div>
  )
}

export function CapsuleChat({ id, now, onBack }: { id: string; now: number; onBack: () => void }) {
  const openProfile = useOpenProfile()
  const calls = useCalls()
  const { state, dispatch } = useStore()
  const c = state.capsules.find((x) => x.id === id)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [checkin, setCheckin] = useState(false)
  const [safety, setSafety] = useState(false)
  const [reporting, setReporting] = useState<Person | null>(null)
  const [menu, setMenu] = useState(false)
  const [noShowAsk, setNoShowAsk] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const memo = useSafetyMemo()

  // Открыли чат или пришло новое, пока он открыт, — отмечаем прочитанным (собеседник увидит ✓✓).
  const incoming = c?.messages.filter((m) => m.from === 'them').length ?? 0
  useEffect(() => { dispatch({ type: 'readCapsule', capsuleId: id }) }, [id, incoming, dispatch])
  const [picked, setPicked] = useState<string | null>(null) // своё сообщение, у которого показана кнопка «Удалить»
  const [viewing, setViewing] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const kb = useKeyboardInset() // высота клавиатуры — строка ввода остаётся над ней
  const photoInput = useRef<HTMLInputElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [c?.messages.length, typing])

  if (!c) return null
  // Профиль скрыт (бан администрации или удалён): переписку видно, писать нельзя.
  const gone = !state.people.some((x) => x.id === c.personId)
  const p = personOrGone(state.people, c.personId)
  const a = state.activities.find((x) => x.id === c.activityId)

  // Защита: без ответа — не больше 3 сообщений; «только проверенные» — первое сообщение только с галочкой.
  const waiting = waitingForReply(c.messages)
  const theyWrote = c.messages.some((m) => m.from === 'them')
  const verifiedOnly = !!p.onlyVerified && !state.me?.verified && !theyWrote
  const locked = gone || waiting || verifiedOnly
  const canCall = !!state.cloud && !gone && theyWrote && c.messages.some((m) => m.from === 'me') && !p.callsOff
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || locked) return
    dispatch({ type: 'send', capsuleId: c.id, text: t })
    setText('')
    if (state.cloud) return // на сервере отвечает живой человек
    setTyping(true)
    setTimeout(() => { dispatch({ type: 'reply', capsuleId: c.id }); setTyping(false) }, 1400 + Math.random() * 1200)
  }

  const actions: { status: CapsuleStatus; label: string }[] =
    c.status === 'active' ? [{ status: 'agreed', label: 'Договорились о встрече' }, { status: 'contacts', label: 'Обменялись контактами' }]
      : c.status === 'agreed' ? [{ status: 'contacts', label: 'Обменялись контактами' }] : []
  const canMeet = c.status === 'agreed' || c.status === 'contacts'
  const safetyHere = state.safety?.capsuleId === c.id
  const place = a?.exactPlace ?? 'место из переписки'

  return (
    <div className="flex flex-col flex-1 min-h-[100dvh]">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-bg/90 backdrop-blur-2xl backdrop-saturate-150 border-b border-line/60 -mx-4 px-3 pb-2 pt-2 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={onBack} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="К списку чатов"><Icon name="back" /></button>
          <button onClick={() => openProfile(p.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer rounded-2xl pr-1" aria-label={`Профиль ${p.name}`}>
          <Avatar name={p.name} hue={p.hue} src={p.photo} size={38} verified={p.verified} />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold text-[15.5px] truncate">{nameAge(p.name, p.age)}</div>
            <div className="text-[12px] text-muted truncate mt-0.5">{a ? `${a.title} · ${planWhen(a, now)}` : c.status !== 'active' ? STATUS[c.status].label : 'в Komeeta'}</div>
          </div>
          </button>
          <CallButtons person={p} canCall={canCall}
            hint={!state.cloud ? 'Звонки работают после входа в аккаунт' : p.callsOff ? `${p.name} не принимает звонки` : 'Позвонить можно, когда вы оба написали друг другу'} />
          <PlaylistButton chatId={c.id} />
          <button onClick={() => setMenu(true)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Встреча и безопасность"><Icon name="more" size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col py-3">
        {c.messages.map((m, i) => {
          const prev = c.messages[i - 1], next = c.messages[i + 1]
          const newDay = !prev || dayKey(prev.at) !== dayKey(m.at)
          const day = newDay && <div key={`d-${m.id}`} className="sticky top-[calc(64px+env(safe-area-inset-top,0px))] z-[5] self-center my-3 px-3 h-6 inline-flex items-center rounded-full bg-surface/70 backdrop-blur-md ring-1 ring-line/60 text-[11.5px] font-semibold text-muted">{dayLabel(m.at, now)}</div>
          if (m.from === 'system') return [day,
            <div key={m.id} className="self-center max-w-[90%] my-2 text-center text-[12px] text-muted bg-surface-2/70 backdrop-blur rounded-full px-3 py-1">{m.text}</div>]
          // Подряд идущие сообщения одного человека — одна «стопка»: меньше отступ, скругление у стыков.
          const joinPrev = !newDay && prev?.from === m.from && m.at - prev.at < GROUP_MS
          const joinNext = !!next && next.from === m.from && next.at - m.at < GROUP_MS && dayKey(next.at) === dayKey(m.at)
          const me = m.from === 'me'
          const read = (c.theirReadAt ?? 0) >= m.at
          const corners = me ? `${joinPrev ? 'rounded-tr-[7px]' : ''} ${joinNext ? 'rounded-br-[7px]' : 'rounded-br-[4px]'}`
            : `${joinPrev ? 'rounded-tl-[7px]' : ''} ${joinNext ? 'rounded-bl-[7px]' : 'rounded-bl-[4px]'}`
          const time = (
            <span className={`inline-flex items-center gap-0.5 text-[10.5px] tnum leading-none ${me ? 'text-white/80' : 'text-muted'}`}>
              {hm(m.at)}
              {me && <Ticks read={read} />}
            </span>
          )
          return [day,
            <div key={m.id} className={`msg-in flex items-end gap-2 max-w-[84%] ${joinPrev ? 'mt-[3px]' : 'mt-2.5'} ${me ? 'self-end' : 'self-start'}`}>
              {!me && <span className="w-7 shrink-0">{!joinNext && <Avatar name={p.name} hue={p.hue} src={p.photo} size={28} />}</span>}
              <div className={`min-w-0 flex flex-col gap-1 ${me ? 'items-end' : 'items-start'}`}>
                <div onClick={() => setPicked(picked === m.id ? null : m.id)}
                  className={`relative rounded-[20px] cursor-pointer select-none transition-transform active:scale-[.98] ${corners} ${m.photo ? 'p-[3px]' : 'pl-3.5 pr-3 py-2'} ${me ? 'bubble-me text-white' : 'bubble-them text-fg'}`}>
                  {m.photo && (
                    <button onClick={(e) => { e.stopPropagation(); setViewing(m.photo!) }} className="relative block cursor-zoom-in" aria-label="Открыть фото">
                      <img src={m.photo} alt="Фото" className={`block max-w-[240px] max-h-[320px] rounded-[17px] object-cover ${corners}`} loading="lazy" />
                      {!m.text && <span className="absolute right-2 bottom-2 rounded-full bg-black/45 backdrop-blur px-2 py-1 [&_*]:!text-white">{time}</span>}
                    </button>
                  )}
                  {callLog(m.text) ? <CallLog log={callLog(m.text)!} me={me} time={time} onCall={canCall ? (v) => calls.start(p.id, v) : undefined} /> : m.text && (
                    <p data-no-translate className={`whitespace-pre-wrap break-words text-[15.5px] leading-[1.35] ${m.photo ? 'px-2.5 pt-1.5 pb-1' : ''}`}>
                      {m.text}
                      {/* Время прячется в конце последней строки, как в мессенджерах */}
                      <span className="float-right ml-2.5 mt-[7px] -mb-1 translate-y-[2px]">{time}</span>
                    </p>
                  )}
                  {m.text && soundCloudLink(m.text) && <div className="mt-2 mb-1 w-[250px] max-w-full text-fg" onClick={(e) => e.stopPropagation()}><SoundCloudCard text={m.text} compact /></div>}
                </div>
                {m.from === 'them' && m.text && MONEY_RE.test(m.text) && <MoneyWarning />}
                <ReactionChips chatId={c.id} messageId={m.id} />
                {picked === m.id && <ReactionPicker chatId={c.id} messageId={m.id} onDone={() => setPicked(null)} />}
                {picked === m.id && me && (
                  <button onClick={() => { dispatch({ type: 'deleteMessage', capsuleId: c.id, messageId: m.id }); setPicked(null) }}
                    className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-danger-soft text-danger text-[12px] font-semibold cursor-pointer"><Icon name="trash" size={13} /> Удалить у всех</button>
                )}
              </div>
            </div>]
        })}
        <div className="h-2" />
        <MeetFeedback capsule={c} activity={a} name={p.name} now={now} onBad={() => setReporting(p)} />
        <AgainCard capsule={c} person={p} />
        {typing && (
          <div className="msg-in self-start flex items-end gap-2 mt-2.5">
            <Avatar name={p.name} hue={p.hue} src={p.photo} size={28} />
            <div className="bubble-them rounded-[20px] rounded-bl-[4px] h-10 px-4 inline-flex items-center gap-1" role="status" aria-label={`${p.name} печатает…`}>
              {[0, 1, 2].map((d) => <span key={d} className="typing-dot w-2 h-2 rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} className="scroll-mb-[96px]" />
      </div>

      <div className={`sticky bottom-0 bg-bg/75 backdrop-blur-2xl backdrop-saturate-150 -mx-4 px-3 pt-2 ${kb ? 'pb-2' : 'pb-[calc(12px+env(safe-area-inset-bottom,0px))]'} flex flex-col gap-2 border-t border-line/60 z-10`} style={kb ? { bottom: kb } : undefined}>
        {photoError && <p className="text-[12px] text-danger" role="alert">{photoError}</p>}
        {locked && (
          <p className="flex items-center gap-2 text-[12.5px] text-muted px-1" role="status">
            <Icon name={gone || verifiedOnly ? 'shield' : 'clock'} size={14} className="shrink-0" />
            <span className="flex-1">{gone ? 'Аккаунт заблокирован администрацией или удалён — писать ему нельзя.' : verifiedOnly ? `${p.name} принимает первые сообщения только от проверенных профилей.` : `Подождите ответа: пока собеседник не ответил, можно отправить не больше 3 сообщений. После ответа — без ограничений.`}</span>
            {!gone && verifiedOnly && <button type="button" onClick={openVerify} className="shrink-0 h-8 px-3 rounded-full bg-cobalt text-white text-[12.5px] font-semibold cursor-pointer">Пройти проверку</button>}
          </p>
        )}
        <form onSubmit={send} className="flex items-end gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1 h-12 pl-1.5 pr-1.5 rounded-full bg-surface-2/80 ring-1 ring-line/70 focus-within:ring-2 focus-within:ring-spark/50 transition-shadow">
            <button type="button" disabled={locked} onClick={() => photoInput.current?.click()} className="disabled:opacity-40 grid place-items-center w-9 h-9 shrink-0 rounded-full text-muted hover:text-fg hover:bg-surface cursor-pointer" aria-label="Отправить фото"><Icon name="camera" size={20} /></button>
            <input ref={photoInput} type="file" accept="image/*" className="sr-only" aria-label="Выбрать фото для отправки" onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try { dispatch({ type: 'sendPhoto', capsuleId: c.id, photo: await readPhotoFull(f) }); setPhotoError('') } catch { setPhotoError('Не получилось открыть фото. Выберите JPG или PNG.') }
            }} />
            <input id="chat-input" aria-label="Сообщение" onFocus={() => setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 350)} className="flex-1 min-w-0 h-full bg-transparent px-1.5 text-[15.5px] placeholder:text-muted focus:outline-none" value={text} onChange={(e) => setText(e.target.value)} placeholder={locked ? 'Пока нельзя написать' : 'Сообщение…'} disabled={locked} autoComplete="off" />
          </div>
          <button type="submit" aria-label="Отправить" disabled={!text.trim() || locked}
            className={`grid place-items-center w-12 h-12 shrink-0 rounded-full cursor-pointer transition-all duration-200 ${text.trim() && !locked ? 'bg-brand text-white shadow-[0_8px_20px_-8px_rgb(255_79_134/.9)] scale-100' : 'bg-surface-2 text-muted scale-95'}`}>
            <Icon name="send" size={19} className={text.trim() ? 'translate-x-[1px]' : ''} />
          </button>
        </form>
      </div>
      {viewing && (() => {
        // Все фото этого чата — листаются в просмотре.
        const photos = c.messages.filter((m) => m.photo).map((m) => m.from === 'me'
          ? { src: m.photo!, who: 'Вы', hue: state.me?.hue, avatar: state.me?.photo, at: m.at, caption: m.text }
          : { src: m.photo!, who: p.name, hue: p.hue, avatar: p.photo, at: m.at, caption: m.text })
        return <PhotoViewer photos={photos} start={Math.max(0, photos.findIndex((x) => x.src === viewing))} onClose={() => setViewing(null)} />
      })()}
      <SafetyMemo open={memo.open} onClose={memo.close} />
      <Sheet open={menu} onClose={() => setMenu(false)} title={p.name}>
        <div className="flex flex-col gap-2">
          {c.status !== 'active' && <Pill tone={STATUS[c.status].tone} className="self-start">{STATUS[c.status].label}</Pill>}
          {a && <p className="text-[13px] text-muted">План: {a.title}. Место: {place}</p>}
          {actions.map((x) => (
            <Button key={x.status} variant="secondary" onClick={() => { dispatch({ type: 'setStatus', capsuleId: c.id, status: x.status }); setMenu(false) }}><Icon name="check" size={18} /> {x.label}</Button>
          ))}
          {canMeet && <Button variant="secondary" onClick={() => { setMenu(false); setCheckin(true) }}><Icon name="check" size={18} /> Отметить встречу</Button>}
          {canMeet && !safetyHere && <Button variant="secondary" onClick={() => { setMenu(false); setSafety(true) }}><Icon name="shield" size={18} /> Я на встрече</Button>}
          {canMeet && (c.noShow
            ? <Button variant="ghost" onClick={() => { dispatch({ type: 'noShow', capsuleId: c.id, on: false }); setMenu(false) }}><Icon name="x" size={18} /> Снять отметку «не пришёл(ла)»</Button>
            : <Button variant="ghost" className="text-warn" onClick={() => { setMenu(false); setNoShowAsk(true) }}><Icon name="clock" size={18} /> {p.name} не пришёл(ла)</Button>)}
          <Button variant="secondary" onClick={() => { setMenu(false); openProfile(p.id) }}><Icon name="user" size={18} /> Профиль</Button>
          <Button variant="ghost" className="text-danger" onClick={() => { setMenu(false); setReporting(p) }}><Icon name="flag" size={18} /> Пожаловаться или заблокировать</Button>
        </div>
      </Sheet>
      <Sheet open={noShowAsk} onClose={() => setNoShowAsk(false)} title={`${p.name} не пришёл(ла)?`}>
        <div className="flex flex-col gap-3">
          <p className="text-muted text-[14px]">Отметка честная и тихая: {p.name} не узнает, кто её поставил, а в надёжности станет на одну пропущенную встречу больше. Если потом всё-таки встретитесь и подтвердите встречу кодами — отметка перестанет считаться. Снять её можно в этом же меню.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setNoShowAsk(false)}>Отмена</Button>
            <Button variant="danger" onClick={() => { dispatch({ type: 'noShow', capsuleId: c.id, on: true }); setNoShowAsk(false) }}>Не пришёл(ла)</Button>
          </div>
        </div>
      </Sheet>
      <ReportSheet person={reporting} onClose={() => setReporting(null)} onBlocked={onBack} />
      <CheckinSheet capsule={c} person={p} open={checkin} onClose={() => setCheckin(false)} />
      <SafetySheet capsule={c} person={p} place={place} open={safety} onClose={() => setSafety(false)} />
    </div>
  )
}

type CallLogInfo = { video: boolean; missed: boolean; duration?: string }
/** Запись о звонке в переписке («📞 Звонок · 1:23», «🎥 Пропущенный звонок») — показываем карточкой, а не текстом с эмодзи. */
function callLog(text?: string): CallLogInfo | null {
  const r = /^(📞|🎥)\s*(Звонок|Видеозвонок|Пропущенный звонок)(?: · (\d+:\d{2}(?::\d{2})?))?$/u.exec(text?.trim() ?? '')
  return r ? { video: r[1] === '🎥', missed: r[2] === 'Пропущенный звонок', duration: r[3] } : null
}

function CallLog({ log, me, time, onCall }: { log: CallLogInfo; me: boolean; time: React.ReactNode; onCall?: (video: boolean) => void }) {
  const title = log.video ? 'Видеозвонок' : 'Звонок'
  // Записи пишет звонивший: «моя» — исходящий, «их» — входящий.
  const sub = log.missed ? (me ? 'Без ответа' : 'Пропущенный') : (me ? 'Исходящий' : 'Входящий')
  const bad = log.missed && !me
  return (
    <div className="flex items-center gap-3 min-w-[200px] py-0.5">
      <button type="button" disabled={!onCall} onClick={(e) => { e.stopPropagation(); onCall?.(log.video) }} aria-label={onCall ? `Перезвонить: ${title.toLowerCase()}` : title}
        className={`relative grid place-items-center w-11 h-11 shrink-0 rounded-full transition active:scale-90 enabled:cursor-pointer ${me ? 'bg-white/20 text-white' : bad ? 'bg-danger-soft text-danger' : 'bg-spark-soft text-spark'}`}>
        <Icon name={log.video ? 'video' : 'phone'} size={log.video ? 20 : 18} fill />
        <span className={`absolute -right-0.5 -bottom-0.5 grid place-items-center w-[18px] h-[18px] rounded-full ring-2 ${me ? 'bg-white text-spark ring-transparent' : bad ? 'bg-danger text-white ring-surface' : 'bg-spark text-white ring-surface'}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={me ? '' : 'rotate-180'}>
            <path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4" />
          </svg>
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] leading-tight">{title}</div>
        <div className={`flex items-center gap-1.5 text-[12.5px] mt-0.5 ${me ? 'text-white/85' : bad ? 'text-danger' : 'text-muted'}`}>
          <span>{sub}</span>
          {log.duration && <><span aria-hidden="true">·</span><span className="tnum">{log.duration}</span></>}
        </div>
      </div>
      <span className="self-end translate-y-[2px]">{time}</span>
    </div>
  )
}

/** Галочки: одна — отправлено, две — прочитано. */
function Ticks({ read }: { read: boolean }) {
  return (
    <svg width={read ? 16 : 11} height="10" viewBox={read ? '0 0 16 10' : '0 0 11 10'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={read ? 'Прочитано' : 'Отправлено'} className={read ? 'text-white' : ''}>
      <path d="M1 5.5 3.8 8.3 9.6 1.5" />
      {read && <path d="M7.2 8.1 7.4 8.3 13.2 1.5" />}
    </svg>
  )
}

/** Звонок и видеозвонок из шапки чата. Пока звонить нельзя — подсказка, почему. */
function CallButtons({ person, canCall, hint }: { person: Person; canCall: boolean; hint: string }) {
  const { start, busy } = useCalls()
  const [tip, setTip] = useState(false)
  useEffect(() => { if (!tip) return; const t = setTimeout(() => setTip(false), 2600); return () => clearTimeout(t) }, [tip])
  const go = (video: boolean) => (canCall ? start(person.id, video) : setTip(true))
  const btn = `grid place-items-center w-9 h-9 rounded-full cursor-pointer transition active:scale-90 ${canCall ? 'bg-spark-soft text-spark hover:brightness-95' : 'bg-surface-2 text-muted/70'}`
  return (
    <>
      <button onClick={() => go(false)} disabled={busy} className={btn} aria-label={`Позвонить ${person.name}`}><Icon name="phone" size={17} fill /></button>
      <button onClick={() => go(true)} disabled={busy} className={`${btn} mr-1`} aria-label={`Видеозвонок ${person.name}`}><Icon name="video" size={19} fill /></button>
      {tip && createPortal(
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[95] max-w-[90vw] rounded-2xl bg-fg text-bg px-4 py-2.5 text-[13.5px] font-medium shadow-soft text-center" role="status">{hint}</div>,
        document.body,
      )}
    </>
  )
}
