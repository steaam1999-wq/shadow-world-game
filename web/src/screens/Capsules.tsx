import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { hm, planWhen } from '../lib'
import { Avatar, Button, Icon, Pill, Sheet, type Tone } from '../components/ui'
import { ReportSheet } from './Vibe'
import { AgainCard, CheckinSheet, SafetySheet } from '../components/Meet'
import type { Capsule, CapsuleStatus, Person } from '../types'

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

export function CapsuleList({ now, onOpen }: { now: number; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [query, setQuery] = useState('')
  const lastAt = (c: Capsule) => c.messages[c.messages.length - 1]?.at ?? c.createdAt
  const q = query.trim().toLowerCase()
  const list = state.capsules
    .filter((c) => state.people.some((x) => x.id === c.personId))
    .filter((c) => !q || state.people.find((x) => x.id === c.personId)!.name.toLowerCase().includes(q))
    .sort((a, b) => lastAt(b) - lastAt(a))

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display font-bold text-2xl">Чаты</h1>
      {state.capsules.length > 3 && (
        <label className="flex items-center gap-2 h-10 rounded-full bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени" aria-label="Поиск по чатам" className="flex-1 min-w-0 bg-transparent text-fg focus:outline-none" />
        </label>
      )}
      {list.length ? (
        <ul className="flex flex-col">
          {list.map((c) => {
            const p = state.people.find((x) => x.id === c.personId)!
            const last = [...c.messages].reverse().find((m) => m.from !== 'system') ?? c.messages[c.messages.length - 1]
            return (
              <li key={c.id}>
                <button onClick={() => onOpen(c.id)} className="w-full text-left flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-2xl hover:bg-surface cursor-pointer">
                  <Avatar name={p.name} hue={p.hue} src={p.photo} size={54} verified={p.verified} ring={c.unread > 0} />
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className={`shrink-0 text-[12px] tnum ${c.unread ? 'text-spark font-semibold' : 'text-muted'}`}>{when(lastAt(c), now)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[14px] truncate ${c.unread ? 'text-fg font-semibold' : 'text-muted'}`}>
                        {last ? `${last.from === 'me' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                      </span>
                      {c.unread > 0 && <span className="shrink-0 grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-spark text-on-spark text-[11px] font-bold">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-[28px] bg-surface-2 p-8 text-center text-muted">{q ? 'Никого не нашли.' : 'Здесь будут ваши переписки. Напишите человеку из его профиля или откликнитесь на план.'}</div>
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
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { dispatch({ type: 'readCapsule', capsuleId: id }) }, [id, dispatch])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [c?.messages.length, typing])

  if (!c) return null
  const p = state.people.find((x) => x.id === c.personId)!
  const a = state.activities.find((x) => x.id === c.activityId)

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
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
    <div className="flex flex-col h-full">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-surface/55 backdrop-blur-xl border-b border-line -mx-4 px-4 pb-3 pt-2 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="К списку чатов"><Icon name="back" /></button>
          <button onClick={() => openProfile(p.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={`Профиль ${p.name}`}>
          <Avatar name={p.name} hue={p.hue} src={p.photo} size={40} verified={p.verified} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{p.name}, {p.age}</div>
            <div className="text-[12px] text-muted truncate">{a ? `${a.title} · ${planWhen(a, now)}` : c.status !== 'active' ? STATUS[c.status].label : 'в ISKRA'}</div>
          </div>
          </button>
          <button onClick={() => setMenu(true)} className="grid place-items-center w-10 h-10 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Встреча и безопасность"><Icon name="more" size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-2 py-4">
        {c.messages.map((m) =>
          m.from === 'system' ? (
            <div key={m.id} className="self-center max-w-[90%] text-center text-[12px] text-muted bg-surface-2 rounded-full px-3 py-1">{m.text}</div>
          ) : (
            <div key={m.id} className={`max-w-[80%] rounded-3xl px-4 py-2.5 ${m.from === 'me' ? 'self-end bg-brand text-white rounded-br-md' : 'self-start bg-surface-2 rounded-bl-md'}`}>
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <span className={`block text-right text-[11px] tnum ${m.from === 'me' ? 'opacity-75' : 'text-muted'}`}>{hm(m.at)}</span>
            </div>
          ),
        )}
        <AgainCard capsule={c} person={p} />
        {typing && <div className="self-start bg-surface-2 rounded-3xl rounded-bl-md px-4 py-2.5 text-muted anim-flick">{p.name} печатает…</div>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-surface/70 backdrop-blur-xl -mx-4 px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] flex flex-col gap-2 border-t border-line">
        <form onSubmit={send} className="flex gap-2">
              <input id="chat-input" aria-label="Сообщение" className="flex-1 min-w-0 h-11 rounded-full border border-transparent bg-surface-2 px-4 focus:outline-none focus:border-cobalt" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение…" autoComplete="off" />
              <Button type="submit" className="w-11 !px-0 !rounded-full" aria-label="Отправить" disabled={!text.trim()}><Icon name="send" size={18} /></Button>
            </form>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title={p.name}>
        <div className="flex flex-col gap-2">
          {c.status !== 'active' && <Pill tone={STATUS[c.status].tone} className="self-start">{STATUS[c.status].label}</Pill>}
          {a && <p className="text-[13px] text-muted">План: {a.title}. Место: {place}</p>}
          {actions.map((x) => (
            <Button key={x.status} variant="secondary" onClick={() => { dispatch({ type: 'setStatus', capsuleId: c.id, status: x.status }); setMenu(false) }}><Icon name="check" size={18} /> {x.label}</Button>
          ))}
          {canMeet && <Button variant="secondary" onClick={() => { setMenu(false); setCheckin(true) }}><Icon name="check" size={18} /> Отметить встречу</Button>}
          {canMeet && !safetyHere && <Button variant="secondary" onClick={() => { setMenu(false); setSafety(true) }}><Icon name="shield" size={18} /> Я на встрече</Button>}
          <Button variant="secondary" onClick={() => { setMenu(false); openProfile(p.id) }}><Icon name="user" size={18} /> Профиль</Button>
          <Button variant="ghost" className="text-danger" onClick={() => { setMenu(false); setReporting(p) }}><Icon name="flag" size={18} /> Пожаловаться или заблокировать</Button>
        </div>
      </Sheet>
      <ReportSheet person={reporting} onClose={() => setReporting(null)} onBlocked={onBack} />
      <CheckinSheet capsule={c} person={p} open={checkin} onClose={() => setCheckin(false)} />
      <SafetySheet capsule={c} person={p} place={place} open={safety} onClose={() => setSafety(false)} />
    </div>
  )
}
