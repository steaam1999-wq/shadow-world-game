import { useState } from 'react'
import { useStore } from '../store'
import { HOUR } from '../data'
import { plural, planWhen } from '../lib'
import { PostArt } from './PostArt'
import { Avatar, ConfirmSheet, Icon } from './ui'
import type { Activity, Person } from '../types'

/** Сколько осталось — коротко: «5 ч», «40 мин». */
function left(ms: number) {
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / 60000))} мин`
  return `${Math.round(ms / HOUR)} ч`
}

/** Статус плана: идёт, скоро, ждёт — и сколько он ещё виден. */
function status(a: Activity, now: number): { text: string; tone: 'live' | 'soon' | 'wait' | 'done' } {
  if (a.expiresAt <= now) return { text: 'Завершён', tone: 'done' }
  const end = a.startsAt + a.durationMin * 60000
  if (!a.timeHidden && a.startsAt <= now && now < end) return { text: 'Идёт сейчас', tone: 'live' }
  if (!a.timeHidden && a.startsAt > now && a.startsAt - now < 3 * HOUR) return { text: `Через ${left(a.startsAt - now)}`, tone: 'soon' }
  return { text: `Виден ещё ${left(a.expiresAt - now)}`, tone: 'wait' }
}
const TONE = {
  live: 'bg-ok text-white',
  soon: 'bg-amber/90 text-[#3a2400]',
  wait: 'bg-surface-2 text-fg',
  done: 'bg-surface-2 text-muted',
}

/** «Мои планы»: активные сверху с откликами и действиями, завершённые — свёрнуты. */
export function MyPlans({ plans, now, onOpen, onOpenChat, onCreate }: {
  plans: Activity[]; now: number; onOpen: (id: string) => void; onOpenChat: (activityId: string) => void; onCreate?: () => void
}) {
  const { state, dispatch } = useStore()
  const [showDone, setShowDone] = useState(false)
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const active = plans.filter((a) => a.expiresAt > now).sort((a, b) => a.startsAt - b.startsAt)
  const done = plans.filter((a) => a.expiresAt <= now).sort((a, b) => b.startsAt - a.startsAt)
  const responders = (a: Activity) => state.capsules.filter((c) => c.activityId === a.id)
    .map((c) => state.people.find((p) => p.id === c.personId)).filter((p): p is Person => !!p)
  const totalReplies = active.reduce((n, a) => n + responders(a).length, 0)

  if (!plans.length) {
    return (
      <div className="mx-4 mt-2 rounded-[28px] bg-surface shadow-soft p-6 flex flex-col items-center text-center gap-3">
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white"><Icon name="spark" size={30} /></span>
        <div>
          <p className="font-display font-bold text-lg">Пока нет планов</p>
          <p className="text-[13.5px] text-muted mt-1">Предложите встречу — кофе, прогулку, выставку. Люди рядом откликнутся, и откроется чат.</p>
        </div>
        {onCreate && <button onClick={onCreate} className="h-12 px-6 rounded-full bg-brand text-white font-semibold inline-flex items-center gap-2 cursor-pointer"><Icon name="plus" size={18} /> Создать план</button>}
      </div>
    )
  }

  const card = (a: Activity) => {
    const st = status(a, now)
    const people = responders(a)
    const likes = state.likeCounts?.[a.id] ?? 0
    const comments = (state.comments ?? []).filter((c) => c.planId === a.id).length
    const past = st.tone === 'done'
    return (
      <li key={a.id} className={`rounded-[24px] bg-surface shadow-soft overflow-hidden ${past ? 'opacity-75' : ''}`}>
        <button onClick={() => onOpen(a.id)} className="w-full flex gap-3 p-3 text-left cursor-pointer" aria-label={`Открыть план: ${a.title}`}>
          <span className="relative w-[72px] h-[88px] shrink-0 rounded-2xl overflow-hidden"><PostArt activity={a} /></span>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <span className={`self-start h-6 px-2.5 rounded-full inline-flex items-center gap-1 text-[11.5px] font-bold ${TONE[st.tone]}`}>
              {st.tone === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}{st.text}
            </span>
            <span className="font-semibold text-[15px] leading-snug line-clamp-2">{a.title}</span>
            <span className="text-[12.5px] text-muted truncate">{planWhen(a, now)} · {a.area.replace(/^Минск, /, '')}{a.groupSize ? ` · компания до ${a.groupSize}` : ''}</span>
          </span>
        </button>
        <div className="flex items-center gap-2 px-3 pb-3">
          {people.length > 0 ? (
            <button onClick={() => onOpenChat(a.id)} className="flex-1 min-w-0 h-10 pl-1.5 pr-3 rounded-full bg-surface-2 flex items-center gap-2 cursor-pointer" aria-label={`Чаты по плану: ${people.length}`}>
              <span className="flex -space-x-2">{people.slice(0, 3).map((p) => <span key={p.id} className="rounded-full ring-2 ring-surface-2"><Avatar name={p.name} hue={p.hue} src={p.photo} size={28} /></span>)}</span>
              <span className="text-[13px] font-semibold truncate">{people.length} {plural(people.length, 'отклик', 'отклика', 'откликов')}</span>
              <Icon name="chat" size={16} className="ml-auto text-spark shrink-0" />
            </button>
          ) : (
            <span className="flex-1 min-w-0 h-10 px-3 rounded-full bg-surface-2 inline-flex items-center text-[13px] text-muted truncate">{past ? 'Откликов не было' : 'Пока без откликов'}</span>
          )}
          <span className="shrink-0 inline-flex items-center gap-2.5 px-1 text-[12.5px] text-muted tnum">
            <span className="inline-flex items-center gap-1"><Icon name="heart" size={14} />{likes}</span>
            <span className="inline-flex items-center gap-1"><Icon name="comment" size={14} />{comments}</span>
          </span>
          <button onClick={() => setDeleting(a)} className="shrink-0 grid place-items-center w-10 h-10 rounded-full text-muted hover:text-danger hover:bg-surface-2 cursor-pointer" aria-label={`Удалить план: ${a.title}`}><Icon name="trash" size={17} /></button>
        </div>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-1">
      {/* Сводка и быстрое создание */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[17px]">{active.length ? `${active.length} ${plural(active.length, 'активный план', 'активных плана', 'активных планов')}` : 'Нет активных планов'}</p>
          <p className="text-[12.5px] text-muted">{active.length ? (totalReplies ? `${totalReplies} ${plural(totalReplies, 'отклик', 'отклика', 'откликов')} — ответьте в чатах` : 'План виден людям рядом 48 часов') : 'Завершённые — ниже'}</p>
        </div>
        {onCreate && <button onClick={onCreate} className="shrink-0 h-10 px-4 rounded-full bg-brand text-white text-[14px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"><Icon name="plus" size={16} /> Новый</button>}
      </div>

      {active.length > 0 && <ul className="flex flex-col gap-3">{active.map(card)}</ul>}

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <button onClick={() => setShowDone((v) => !v)} className="self-start h-9 px-3.5 rounded-full bg-surface-2 text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer" aria-expanded={showDone}>
            Завершённые · {done.length} <span className={`transition-transform ${showDone ? 'rotate-180' : ''}`}><Icon name="down" size={14} /></span>
          </button>
          {showDone && <ul className="flex flex-col gap-3">{done.map(card)}</ul>}
        </section>
      )}

      <ConfirmSheet open={!!deleting} onClose={() => setDeleting(null)} title="Удалить план?"
        text={deleting ? `«${deleting.title}» исчезнет из ленты и с карты вместе с чатами по этому плану.` : undefined}
        action="Удалить план" onConfirm={() => { if (deleting) dispatch({ type: 'deleteActivity', activityId: deleting.id }); setDeleting(null) }} />
    </div>
  )
}
