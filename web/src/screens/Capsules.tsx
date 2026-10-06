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
import { openVerify } from '../components/Verify'
import { MONEY_RE, MeetFeedback, MoneyWarning, SafetyMemo, useSafetyMemo, waitingForReply } from '../safety'

export const STATUS: Record<CapsuleStatus, { label: string; tone: Tone }> = {
  active: { label: 'Переписка', tone: 'spark' },
  agreed: { label: 'Договорились о встрече', tone: 'cobalt' },
  contacts: { label: 'Обменялись контактами', tone: 'ok' },
  met: { label: 'Встреча состоялась', tone: 'ok' },
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
  const preview = (m: { from: string; text: string; photo?: string; photoPath?: string } | undefined, who = '') =>
    m ? `${m.from === 'me' ? 'Вы: ' : who ? `${who}: ` : ''}${m.text || (m.photo || m.photoPath ? '📷 Фото' : '')}` : 'Нет сообщений'
  // Личные чаты и группы — одним списком, свежие сверху.
  const rows = [
    ...state.capsules
      .filter((c) => !c.hidden && c.id !== undo?.id && state.people.some((x) => x.id === c.personId))
      .filter((c) => !q || state.people.find((x) => x.id === c.personId)!.name.toLowerCase().includes(q))
      .map((c) => ({ kind: 'direct' as const, id: c.id, at: lastAt(c), c })),
    ...(state.groups ?? [])
      .filter((g) => !q || g.title.toLowerCase().includes(q))
      .map((g) => ({ kind: 'group' as const, id: g.id, at: g.messages[g.messages.length - 1]?.at ?? g.createdAt, g })),
  ].sort((a, b) => b.at - a.at)
  const leaving = (state.groups ?? []).find((g) => g.id === leavingGroup)

  const row = (id: string, at: number, unread: number, avatar: React.ReactNode, title: string, text: string, label: string, onDelete: () => void) => (
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
            const p = state.people.find((x) => x.id === c.personId)!
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
  const p = state.people.find((x) => x.id === c.personId)!
  const a = state.activities.find((x) => x.id === c.activityId)

  // Защита: без ответа — не больше 3 сообщений; «только проверенные» — первое сообщение только с галочкой.
  const waiting = waitingForReply(c.messages)
  const theyWrote = c.messages.some((m) => m.from === 'them')
  const verifiedOnly = !!p.onlyVerified && !state.me?.verified && !theyWrote
  const locked = waiting || verifiedOnly
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
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-surface/55 backdrop-blur-xl border-b border-line -mx-4 px-4 pb-3 pt-2 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="К списку чатов"><Icon name="back" /></button>
          <button onClick={() => openProfile(p.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={`Профиль ${p.name}`}>
          <Avatar name={p.name} hue={p.hue} src={p.photo} size={40} verified={p.verified} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{nameAge(p.name, p.age)}</div>
            <div className="text-[12px] text-muted truncate">{a ? `${a.title} · ${planWhen(a, now)}` : c.status !== 'active' ? STATUS[c.status].label : 'в Komeeta'}</div>
          </div>
          </button>
          <PlaylistButton chatId={c.id} />
          <button onClick={() => setMenu(true)} className="grid place-items-center w-10 h-10 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Встреча и безопасность"><Icon name="more" size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-2 py-4">
        {c.messages.map((m) =>
          m.from === 'system' ? (
            <div key={m.id} className="self-center max-w-[90%] text-center text-[12px] text-muted bg-surface-2 rounded-full px-3 py-1">{m.text}</div>
          ) : (
            <div key={m.id} className={`max-w-[80%] flex flex-col gap-1 ${m.from === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div onClick={() => setPicked(picked === m.id ? null : m.id)}
                className={`rounded-3xl cursor-pointer ${m.photo ? 'p-1' : 'px-4 py-2.5'} ${m.from === 'me' ? 'bg-brand text-white rounded-br-md' : 'bg-surface text-fg rounded-bl-md shadow-[0_1px_3px_rgb(0_0_0/.08)] ring-1 ring-line/70'}`}>
                {m.photo && (
                  <button onClick={(e) => { e.stopPropagation(); setViewing(m.photo!) }} className="block cursor-zoom-in" aria-label="Открыть фото">
                    <img src={m.photo} alt="Фото" className="block max-w-[240px] max-h-[320px] rounded-[20px] object-cover" loading="lazy" />
                  </button>
                )}
                {m.text && <p data-no-translate className={`whitespace-pre-wrap break-words ${m.photo ? 'px-3 pt-1.5' : ''}`}>{m.text}</p>}
                {m.text && soundCloudLink(m.text) && <div className="mt-2 mb-1 w-[250px] max-w-full text-fg" onClick={(e) => e.stopPropagation()}><SoundCloudCard text={m.text} compact /></div>}
                <span className={`flex items-center justify-end gap-1 text-[11px] tnum ${m.photo ? 'px-3 pb-1' : ''} ${m.from === 'me' ? 'opacity-80' : 'text-muted'}`}>
                  {hm(m.at)}
                  {m.from === 'me' && <span aria-label={(c.theirReadAt ?? 0) >= m.at ? 'Прочитано' : 'Отправлено'}>{(c.theirReadAt ?? 0) >= m.at ? '✓✓' : '✓'}</span>}
                </span>
              </div>
              {m.from === 'them' && m.text && MONEY_RE.test(m.text) && <MoneyWarning />}
              <ReactionChips chatId={c.id} messageId={m.id} />
              {picked === m.id && <ReactionPicker chatId={c.id} messageId={m.id} onDone={() => setPicked(null)} />}
              {picked === m.id && m.from === 'me' && (
                <button onClick={() => { dispatch({ type: 'deleteMessage', capsuleId: c.id, messageId: m.id }); setPicked(null) }}
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-danger-soft text-danger text-[12px] font-semibold cursor-pointer"><Icon name="trash" size={13} /> Удалить у всех</button>
              )}
            </div>
          ),
        )}
        <MeetFeedback capsule={c} activity={a} name={p.name} now={now} onBad={() => setReporting(p)} />
        <AgainCard capsule={c} person={p} />
        {typing && <div className="self-start bg-surface-2 rounded-3xl rounded-bl-md px-4 py-2.5 text-muted anim-flick">{p.name} печатает…</div>}
        <div ref={endRef} />
      </div>

      <div className={`sticky bottom-0 bg-surface/80 backdrop-blur-xl -mx-4 px-4 pt-2 ${kb ? 'pb-2' : 'pb-[calc(12px+env(safe-area-inset-bottom,0px))]'} flex flex-col gap-2 border-t border-line z-10`} style={kb ? { bottom: kb } : undefined}>
        {photoError && <p className="text-[12px] text-danger" role="alert">{photoError}</p>}
        {locked && (
          <p className="flex items-center gap-2 text-[12.5px] text-muted px-1" role="status">
            <Icon name={verifiedOnly ? 'shield' : 'clock'} size={14} className="shrink-0" />
            <span className="flex-1">{verifiedOnly ? `${p.name} принимает первые сообщения только от проверенных профилей.` : `Подождите ответа — без ответа можно отправить не больше 3 сообщений подряд.`}</span>
            {verifiedOnly && <button type="button" onClick={openVerify} className="shrink-0 h-8 px-3 rounded-full bg-cobalt text-white text-[12.5px] font-semibold cursor-pointer">Пройти проверку</button>}
          </p>
        )}
        <form onSubmit={send} className="flex gap-2">
          <button type="button" disabled={locked} onClick={() => photoInput.current?.click()} className="disabled:opacity-40 grid place-items-center w-11 h-11 shrink-0 rounded-full bg-surface-2 text-muted hover:text-fg cursor-pointer" aria-label="Отправить фото"><Icon name="camera" size={20} /></button>
          <input ref={photoInput} type="file" accept="image/*" className="sr-only" aria-label="Выбрать фото для отправки" onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try { dispatch({ type: 'sendPhoto', capsuleId: c.id, photo: await readPhotoFull(f) }); setPhotoError('') } catch { setPhotoError('Не получилось открыть фото. Выберите JPG или PNG.') }
          }} />
              <input id="chat-input" aria-label="Сообщение" onFocus={() => setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 350)} className="flex-1 min-w-0 h-11 rounded-full border border-transparent bg-surface-2 px-4 focus:outline-none focus:border-cobalt" value={text} onChange={(e) => setText(e.target.value)} placeholder={locked ? 'Пока нельзя написать' : 'Сообщение…'} disabled={locked} autoComplete="off" />
              <Button type="submit" className="w-11 !px-0 !rounded-full" aria-label="Отправить" disabled={!text.trim() || locked}><Icon name="send" size={18} /></Button>
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
