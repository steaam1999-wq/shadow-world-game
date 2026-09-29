import { useEffect, useRef, useState } from 'react'
import { CAPSULE_TTL } from '../data'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { countdown, hm, isBurning, isExpired, planWhen } from '../lib'
import { Avatar, Button, Icon, Pill, type Tone } from '../components/ui'
import { ReportSheet } from './Vibe'
import { AgainCard, CheckinSheet, SafetySheet } from '../components/Meet'
import type { Capsule, CapsuleStatus, Person } from '../types'

export const STATUS: Record<CapsuleStatus, { label: string; tone: Tone }> = {
  active: { label: 'Переписка', tone: 'spark' },
  agreed: { label: 'Договорились о встрече', tone: 'cobalt' },
  contacts: { label: 'Обменялись контактами', tone: 'ok' },
  met: { label: 'Встреча состоялась', tone: 'ok' },
}

function Timer({ c, now, big = false }: { c: Capsule; now: number; big?: boolean }) {
  if (!isBurning(c)) return <span className={`font-mono text-muted ${big ? 'text-sm' : 'text-[12px]'}`}>таймер остановлен</span>
  const left = c.expiresAt - now
  const urgent = left < 6 * 3600_000
  return (
    <span className={`font-mono font-bold tnum ${urgent ? 'text-danger' : 'text-spark'} ${big ? 'text-sm' : 'text-[13px]'}`}>
      {left > 0 ? countdown(left) : 'сгорела'}
    </span>
  )
}

const HINT_KEY = 'iskra-capsule-hint'

export function CapsuleList({ now, onOpen }: { now: number; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [hintSeen, setHintSeen] = useState(() => { try { return localStorage.getItem(HINT_KEY) === '1' } catch { return false } })
  const live = state.capsules.filter((c) => !isExpired(c, now))
  const expired = state.capsules.filter((c) => isExpired(c, now))

  const row = (c: Capsule) => {
    const p = state.people.find((x) => x.id === c.personId)!
    const a = state.activities.find((x) => x.id === c.activityId)
    const last = c.messages[c.messages.length - 1]
    const burning = isBurning(c) && !isExpired(c, now)
    const fraction = Math.max(0, Math.min(1, (c.expiresAt - now) / CAPSULE_TTL))
    return (
      <li key={c.id}>
        <button onClick={() => onOpen(c.id)} className="w-full text-left flex gap-3 p-3 -mx-3 rounded-2xl hover:bg-surface cursor-pointer">
          <Avatar name={p.name} hue={p.hue} size={52} verified={p.verified} ring={c.unread > 0} />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold truncate">{p.name}</span>
              <Timer c={c} now={now} />
            </div>
            <div className="text-[13px] text-muted truncate">{a?.title ?? (c.activityId ? 'Активность завершена' : 'Спонтанная встреча')}</div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[13px] truncate ${c.unread ? 'text-fg font-semibold' : 'text-muted'}`}>
                {last.from === 'me' ? 'Вы: ' : ''}{last.text}
              </span>
              {c.unread > 0 && <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-spark text-on-spark text-[11px] font-bold">{c.unread}</span>}
            </div>
            {burning ? (
              <div className="h-1 rounded-full bg-surface-2 overflow-hidden mt-0.5" aria-hidden="true">
                <div className={`h-full rounded-full ${fraction < 1 / 12 ? 'bg-danger' : 'bg-spark'}`} style={{ width: `${fraction * 100}%` }} />
              </div>
            ) : (
              <Pill tone={STATUS[c.status].tone} className="self-start">{STATUS[c.status].label}</Pill>
            )}
          </div>
        </button>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">72 часа на договорённость</span>
        <h1 className="font-display font-bold text-2xl">Капсулы</h1>
      </div>
      {!hintSeen && (
        <div className="relative rounded-[24px] bg-surface shadow-soft p-4 pr-11 text-[14px] leading-snug">
          <p className="font-semibold mb-1">Что такое капсула</p>
          <p className="text-muted">Это чат с человеком, на чей план вы откликнулись. На договорённость — 72 часа: не успели условиться о встрече — капсула сгорает. Точное место встречи видно только здесь.</p>
          <button onClick={() => { setHintSeen(true); try { localStorage.setItem(HINT_KEY, '1') } catch { /* ignore */ } }}
            className="absolute right-2 top-2 grid place-items-center w-9 h-9 rounded-full text-muted hover:text-fg cursor-pointer" aria-label="Понятно, скрыть подсказку"><Icon name="x" size={16} /></button>
        </div>
      )}
      {live.length ? <ul className="flex flex-col gap-1">{live.map(row)}</ul> : (
        <div className="rounded-[28px] bg-surface-2 p-8 text-center text-muted">Откликнитесь на план в ленте или в «Поиске», и здесь появится первая капсула.</div>
      )}
      {expired.length > 0 && (
        <>
          <h2 className="eyebrow mt-4">Сгоревшие</h2>
          <ul className="flex flex-col gap-1 opacity-60">{expired.map(row)}</ul>
        </>
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
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { dispatch({ type: 'readCapsule', capsuleId: id }) }, [id, dispatch])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [c?.messages.length, typing])

  if (!c) return null
  const p = state.people.find((x) => x.id === c.personId)!
  const a = state.activities.find((x) => x.id === c.activityId)
  const expired = isExpired(c, now)
  const fraction = Math.max(0, Math.min(1, (c.expiresAt - now) / CAPSULE_TTL))

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    dispatch({ type: 'send', capsuleId: c.id, text: t })
    setText('')
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
          <button onClick={onBack} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="К списку капсул"><Icon name="back" /></button>
          <button onClick={() => openProfile(p.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={`Профиль ${p.name}`}>
          <Avatar name={p.name} hue={p.hue} size={40} verified={p.verified} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{p.name}, {p.age}</div>
            <div className="text-[12px] text-muted truncate">{a ? `${a.title} · ${planWhen(a, now)}` : c.activityId ? 'Активность завершена' : 'Спонтанная встреча'}</div>
          </div>
          </button>
          <button onClick={() => setReporting(p)} className="grid place-items-center w-10 h-10 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Пожаловаться"><Icon name="flag" size={18} /></button>
        </div>
        <div className="flex items-center gap-3">
          {isBurning(c) ? (
            <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
              <div className={`h-full rounded-full ${fraction < 1 / 12 ? 'bg-danger' : 'bg-spark'}`} style={{ width: `${fraction * 100}%` }} />
            </div>
          ) : (
            <Pill tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Pill>
          )}
          <span className="ml-auto"><Timer c={c} now={now} big /></span>
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
        {expired ? (
          <p className="text-center text-[13px] text-muted py-2">Капсула сгорела: за 72 часа вы не договорились. Можно откликнуться на новую активность {p.name}.</p>
        ) : (
          <>
            {(actions.length > 0 || canMeet) && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {canMeet && (
                  <button onClick={() => setCheckin(true)} className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-brand text-white text-[13px] font-semibold cursor-pointer">
                    <Icon name="check" size={14} /> Отметить встречу
                  </button>
                )}
                {canMeet && !safetyHere && (
                  <button onClick={() => setSafety(true)} className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ok-soft text-ok text-[13px] font-semibold cursor-pointer">
                    <Icon name="shield" size={14} /> Я на встрече
                  </button>
                )}
                {actions.map((x) => (
                  <button key={x.status} onClick={() => dispatch({ type: 'setStatus', capsuleId: c.id, status: x.status })}
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-surface-2 text-[13px] font-medium hover:brightness-95 cursor-pointer">
                    <Icon name="check" size={14} /> {x.label}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={send} className="flex gap-2">
              <input id="chat-input" aria-label="Сообщение" className="flex-1 min-w-0 h-11 rounded-full border border-transparent bg-surface-2 px-4 focus:outline-none focus:border-cobalt" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение по делу…" autoComplete="off" />
              <Button type="submit" className="w-11 !px-0 !rounded-full" aria-label="Отправить" disabled={!text.trim()}><Icon name="send" size={18} /></Button>
            </form>
          </>
        )}
      </div>
      <ReportSheet person={reporting} onClose={() => setReporting(null)} />
      <CheckinSheet capsule={c} person={p} open={checkin} onClose={() => setCheckin(false)} />
      <SafetySheet capsule={c} person={p} place={place} open={safety} onClose={() => setSafety(false)} />
    </div>
  )
}
