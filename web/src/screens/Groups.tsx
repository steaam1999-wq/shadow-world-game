import { useEffect, useRef, useState } from 'react'
import { soundCloudLink } from '../music/soundcloud'
import { SoundCloudCard } from '../music/SoundCloudCard'
import { useStore } from '../store'
import { ReactionChips, ReactionPicker } from '../components/Reactions'
import { PlaylistButton } from '../music/ChatPlaylist'
import { useOpenProfile } from '../nav'
import { hm } from '../lib'
import { Avatar, Button, Icon, Sheet, readPhoto } from '../components/ui'
import type { Group, Person } from '../types'

// Групповые чаты: создание, переписка, участники. Создатель добавляет и убирает людей,
// меняет название и может удалить группу; остальные пишут и могут выйти.

const MAX_MEMBERS = 50
const TITLE_MAX = 60

/** Аватар группы: два участника внахлёст или значок людей. */
export function GroupAvatar({ group, size = 54 }: { group: Group; size?: number }) {
  const { state } = useStore()
  const people = group.members.map((id) => state.people.find((p) => p.id === id)).filter((p): p is Person => !!p).slice(0, 2)
  if (people.length < 2) {
    return <span className="grid place-items-center shrink-0 rounded-full bg-brand text-white" style={{ width: size, height: size }}><Icon name="people" size={size * 0.45} /></span>
  }
  const s = Math.round(size * 0.68)
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute left-0 top-0"><Avatar name={people[0].name} hue={people[0].hue} src={people[0].photo} size={s} /></span>
      <span className="absolute right-0 bottom-0 rounded-full ring-2 ring-surface"><Avatar name={people[1].name} hue={people[1].hue} src={people[1].photo} size={s} /></span>
    </span>
  )
}

/** Выбор нескольких людей с поиском. */
function PeoplePicker({ exclude = [], picked, onToggle }: { exclude?: string[]; picked: string[]; onToggle: (id: string) => void }) {
  const { state } = useStore()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const following = new Set(state.following ?? [])
  const chatted = new Set(state.capsules.filter((c) => !c.hidden).map((c) => c.personId))
  const rank = (p: Person) => (chatted.has(p.id) ? 0 : following.has(p.id) ? 1 : 2)
  const people = state.people
    .filter((p) => !exclude.includes(p.id) && (!q || p.name.toLowerCase().includes(q)))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ru'))
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 h-10 rounded-full bg-surface-2 px-3.5 text-muted">
        <Icon name="search" size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти по имени" aria-label="Поиск людей" className="flex-1 min-w-0 bg-transparent text-fg focus:outline-none" />
      </label>
      {people.length ? (
        <ul className="flex flex-col max-h-[42vh] overflow-y-auto -mx-2">
          {people.map((p) => {
            const on = picked.includes(p.id)
            return (
              <li key={p.id}>
                <button onClick={() => onToggle(p.id)} role="checkbox" aria-checked={on} className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-surface-2 text-left cursor-pointer">
                  <Avatar name={p.name} hue={p.hue} src={p.photo} size={42} verified={p.verified} />
                  <span className="flex-1 min-w-0 font-semibold truncate">{p.name}</span>
                  <span className={`grid place-items-center w-6 h-6 rounded-full border-2 ${on ? 'bg-spark border-spark text-on-spark' : 'border-line'}`}>{on && <Icon name="check" size={14} />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : <p className="py-6 text-center text-muted text-[14px]">{q ? 'Никого не нашли.' : 'Больше некого добавить.'}</p>}
    </div>
  )
}

/** Новая группа: выбрать людей и дать название. */
export function GroupCreateSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (groupId: string) => void }) {
  const { state, dispatch } = useStore()
  const [picked, setPicked] = useState<string[]>([])
  const [title, setTitle] = useState('')
  useEffect(() => { if (!open) { setPicked([]); setTitle('') } }, [open])
  const names = picked.map((id) => state.people.find((p) => p.id === id)?.name).filter(Boolean) as string[]
  const auto = [state.me?.name, ...names].filter(Boolean).join(', ').slice(0, TITLE_MAX)
  const toggle = (id: string) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= MAX_MEMBERS - 1 ? l : [...l, id]))
  const create = () => {
    if (picked.length < 2) return
    const id = crypto.randomUUID()
    dispatch({ type: 'createGroup', id, title: title.trim() || auto || 'Группа', members: picked })
    onCreated(id)
  }
  return (
    <Sheet open={open} onClose={onClose} title="Новая группа">
      <div className="flex flex-col gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} placeholder={auto || 'Название группы'} aria-label="Название группы"
          className="h-11 rounded-2xl bg-surface-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-cobalt" />
        {names.length > 0 && <p className="text-[13px] text-muted">В группе: вы, {names.join(', ')}</p>}
        <PeoplePicker picked={picked} onToggle={toggle} />
        <Button onClick={create} disabled={picked.length < 2}>
          <Icon name="people" size={18} /> {picked.length < 2 ? 'Выберите хотя бы двоих' : `Создать группу · ${picked.length + 1}`}
        </Button>
      </div>
    </Sheet>
  )
}

/** Переписка в группе. */
export function GroupChat({ id, onBack }: { id: string; onBack: () => void }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const g = (state.groups ?? []).find((x) => x.id === id)
  const [text, setText] = useState('')
  const [info, setInfo] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const incoming = g?.messages.filter((m) => m.from === 'them').length ?? 0
  useEffect(() => { dispatch({ type: 'readGroup', groupId: id }) }, [id, incoming, dispatch])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [g?.messages.length, typing])

  // Группу удалили или меня из неё убрали — возвращаемся к списку.
  const gone = !g
  useEffect(() => { if (gone) onBack() }, [gone, onBack])
  if (!g) return null

  const person = (pid?: string) => (pid ? state.people.find((p) => p.id === pid) : undefined)
  const demoReply = () => {
    if (state.cloud || !g.members.length) return
    const who = person(g.members[Math.floor(Math.random() * g.members.length)])
    setTyping(who?.name ?? 'Кто-то')
    setTimeout(() => { dispatch({ type: 'groupReply', groupId: g.id }); setTyping(null) }, 1400 + Math.random() * 1200)
  }
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    dispatch({ type: 'sendGroup', groupId: g.id, text: t.slice(0, 2000) })
    setText('')
    demoReply()
  }
  const count = g.members.length + 1

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-surface/55 backdrop-blur-xl border-b border-line -mx-4 px-4 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="К списку чатов"><Icon name="back" /></button>
          <button onClick={() => setInfo(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label="Участники группы">
            <GroupAvatar group={g} size={40} />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold truncate">{g.title}</span>
              <span className="block text-[12px] text-muted truncate">{g.planId ? 'Компания плана · ' : ''}{count} {plural(count)}</span>
            </span>
          </button>
          <PlaylistButton chatId={g.id} />
          <button onClick={() => setInfo(true)} className="grid place-items-center w-10 h-10 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Настройки группы"><Icon name="more" size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-1.5 py-4">
        {g.messages.map((m, i) => {
          if (m.from === 'system') return <div key={m.id} className="self-center max-w-[90%] text-center text-[12px] text-muted bg-surface-2 rounded-full px-3 py-1 my-1">{m.text}</div>
          const mine = m.from === 'me'
          const who = person(m.senderId)
          const prev = g.messages[i - 1]
          const first = !mine && (prev?.from !== 'them' || prev.senderId !== m.senderId)
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'self-end' : 'self-start'} max-w-[85%] ${first ? 'mt-1.5' : ''}`}>
              {!mine && (
                <span className="w-7 shrink-0 self-end">
                  {first && <button onClick={() => who && openProfile(who.id)} className="cursor-pointer" aria-label={who ? `Профиль ${who.name}` : 'Участник'}><Avatar name={who?.name ?? '?'} hue={who?.hue ?? 0} src={who?.photo} size={28} /></button>}
                </span>
              )}
              <div className={`flex flex-col gap-1 min-w-0 ${mine ? 'items-end' : 'items-start'}`}>
                {first && <span className="px-3 text-[12px] font-semibold text-muted">{who?.name ?? 'Бывший участник'}</span>}
                <div onClick={() => setPicked(picked === m.id ? null : m.id)}
                  className={`rounded-3xl cursor-pointer ${m.photo ? 'p-1' : 'px-4 py-2.5'} ${mine ? 'bg-brand text-white rounded-br-md' : 'bg-surface-2 rounded-bl-md'}`}>
                  {m.photo && (
                    <button onClick={(e) => { e.stopPropagation(); setViewing(m.photo!) }} className="block cursor-zoom-in" aria-label="Открыть фото">
                      <img src={m.photo} alt="Фото" className="block max-w-[240px] max-h-[320px] rounded-[20px] object-cover" loading="lazy" />
                    </button>
                  )}
                  {m.text && <p data-no-translate className={`whitespace-pre-wrap break-words ${m.photo ? 'px-3 pt-1.5' : ''}`}>{m.text}</p>}
                {m.text && soundCloudLink(m.text) && <div className="mt-2 mb-1 w-[250px] max-w-full text-fg" onClick={(e) => e.stopPropagation()}><SoundCloudCard text={m.text} compact /></div>}
                  <span className={`flex items-center justify-end gap-1 text-[11px] tnum ${m.photo ? 'px-3 pb-1' : ''} ${mine ? 'opacity-80' : 'text-muted'}`}>
                    {hm(m.at)}
                    {mine && <span aria-label={(g.othersReadAt ?? 0) >= m.at ? 'Прочитано' : 'Отправлено'}>{(g.othersReadAt ?? 0) >= m.at ? '✓✓' : '✓'}</span>}
                  </span>
                </div>
                <ReactionChips chatId={g.id} messageId={m.id} />
                {picked === m.id && <ReactionPicker chatId={g.id} messageId={m.id} onDone={() => setPicked(null)} />}
                {picked === m.id && (mine || g.ownerId === 'me') && (
                  <button onClick={() => { dispatch({ type: 'deleteGroupMessage', groupId: g.id, messageId: m.id }); setPicked(null) }}
                    className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-danger-soft text-danger text-[12px] font-semibold cursor-pointer"><Icon name="trash" size={13} /> Удалить у всех</button>
                )}
              </div>
            </div>
          )
        })}
        {typing && <div className="self-start bg-surface-2 rounded-3xl rounded-bl-md px-4 py-2.5 text-muted anim-flick ml-9">{typing} печатает…</div>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-surface/70 backdrop-blur-xl -mx-4 px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] flex flex-col gap-2 border-t border-line">
        {photoError && <p className="text-[12px] text-danger" role="alert">{photoError}</p>}
        <form onSubmit={send} className="flex gap-2">
          <button type="button" onClick={() => photoInput.current?.click()} className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-surface-2 text-muted hover:text-fg cursor-pointer" aria-label="Отправить фото"><Icon name="camera" size={20} /></button>
          <input ref={photoInput} type="file" accept="image/*" className="sr-only" aria-label="Выбрать фото для отправки" onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try { dispatch({ type: 'sendGroupPhoto', groupId: g.id, photo: await readPhoto(f, 1280) }); setPhotoError('') } catch { setPhotoError('Не получилось открыть фото. Выберите JPG или PNG.') }
          }} />
          <input id="chat-input" aria-label="Сообщение" className="flex-1 min-w-0 h-11 rounded-full border border-transparent bg-surface-2 px-4 focus:outline-none focus:border-cobalt" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение в группу…" autoComplete="off" />
          <Button type="submit" className="w-11 !px-0 !rounded-full" aria-label="Отправить" disabled={!text.trim()}><Icon name="send" size={18} /></Button>
        </form>
      </div>
      {viewing && (
        <div className="fixed inset-0 z-[70] bg-black/90 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Фото" onClick={() => setViewing(null)}>
          <img src={viewing} alt="Фото" className="max-w-full max-h-full object-contain rounded-xl" />
          <button className="absolute right-4 top-[calc(16px+env(safe-area-inset-top,0px))] grid place-items-center w-10 h-10 rounded-full bg-white/15 text-white cursor-pointer" aria-label="Закрыть"><Icon name="x" size={20} /></button>
        </div>
      )}
      <GroupInfoSheet group={g} open={info} onClose={() => setInfo(false)} onLeft={onBack} />
    </div>
  )
}

function plural(n: number) {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? 'участник' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'участника' : 'участников'
}

/** Участники и настройки группы. */
function GroupInfoSheet({ group: g, open, onClose, onLeft }: { group: Group; open: boolean; onClose: () => void; onLeft: () => void }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const owner = g.ownerId === 'me'
  const [title, setTitle] = useState(g.title)
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)
  useEffect(() => { if (open) { setTitle(g.title); setAdding(false); setPicked([]); setLeaving(false) } }, [open, g.title])
  const members = g.members.map((id) => state.people.find((p) => p.id === id)).filter((p): p is Person => !!p)
  const ownerName = owner ? 'вы' : (state.people.find((p) => p.id === g.ownerId)?.name ?? '')
  const saveTitle = () => { const t = title.trim(); if (t && t !== g.title) dispatch({ type: 'renameGroup', groupId: g.id, title: t.slice(0, TITLE_MAX) }) }
  const room = MAX_MEMBERS - 1 - g.members.length

  if (adding) {
    return (
      <Sheet open={open} onClose={onClose} title="Добавить в группу">
        <div className="flex flex-col gap-3">
          <PeoplePicker exclude={g.members} picked={picked} onToggle={(id) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= room ? l : [...l, id]))} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>Назад</Button>
            <Button disabled={!picked.length} onClick={() => { dispatch({ type: 'addGroupMembers', groupId: g.id, members: picked }); setAdding(false); setPicked([]) }}>Добавить{picked.length ? ` · ${picked.length}` : ''}</Button>
          </div>
        </div>
      </Sheet>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title={g.title}>
      <div className="flex flex-col gap-4">
        {owner && (
          <form onSubmit={(e) => { e.preventDefault(); saveTitle() }} className="flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} aria-label="Название группы" className="flex-1 min-w-0 h-11 rounded-2xl bg-surface-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-cobalt" />
            <Button type="submit" variant="secondary" disabled={!title.trim() || title.trim() === g.title}>Сохранить</Button>
          </form>
        )}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{g.members.length + 1} {plural(g.members.length + 1)}</h3>
          {owner && room > 0 && <Button variant="ghost" className="!h-9 !px-3" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Добавить</Button>}
        </div>
        <ul className="flex flex-col -mx-2 max-h-[40vh] overflow-y-auto">
          <li className="flex items-center gap-3 px-2 py-2">
            <Avatar name={state.me?.name ?? 'Я'} hue={state.me?.hue ?? 0} src={state.me?.photo} size={40} />
            <span className="flex-1 min-w-0 font-semibold truncate">{state.me?.name ?? 'Вы'} <span className="text-muted font-normal">· вы{owner ? ', создатель' : ''}</span></span>
          </li>
          {members.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-surface-2">
              <button onClick={() => { onClose(); openProfile(p.id) }} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                <Avatar name={p.name} hue={p.hue} src={p.photo} size={40} verified={p.verified} />
                <span className="flex-1 min-w-0 font-semibold truncate">{p.name}{p.id === g.ownerId && <span className="text-muted font-normal"> · создатель</span>}</span>
              </button>
              {owner && <button onClick={() => dispatch({ type: 'removeGroupMember', groupId: g.id, personId: p.id })} className="h-8 px-3 rounded-full text-[13px] text-danger hover:bg-danger-soft cursor-pointer" aria-label={`Убрать ${p.name} из группы`}>Убрать</button>}
            </li>
          ))}
        </ul>
        {!owner && ownerName && <p className="text-[13px] text-muted">Добавлять людей и менять название может создатель группы — {ownerName}.</p>}
        {leaving ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-danger-soft p-3">
            <p className="text-[14px]">{owner ? 'Группа и вся переписка удалятся у всех участников.' : 'Вы больше не увидите эту переписку. Вернуть вас сможет только создатель.'}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setLeaving(false)}>Отмена</Button>
              <Button variant="danger" onClick={() => { dispatch({ type: 'leaveGroup', groupId: g.id }); onClose(); onLeft() }}>{owner ? 'Удалить' : 'Выйти'}</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="text-danger" onClick={() => setLeaving(true)}><Icon name={owner ? 'trash' : 'logout'} size={18} /> {owner ? 'Удалить группу' : 'Выйти из группы'}</Button>
        )}
      </div>
    </Sheet>
  )
}
