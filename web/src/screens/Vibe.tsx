import { useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { ReliabilityBadge } from '../components/Meet'
import { compatibility, planWhen, sharedAnswers } from '../lib'
import { Avatar, Button, Icon, Pill, Sheet, inputCls } from '../components/ui'
import type { Activity, Person } from '../types'

const REASONS = ['Фейковый профиль', 'Спам или реклама', 'Грубость', 'Фото не совпадает', 'Другое']

export function Vibe({ now, onRespond, onOpenCapsule }: { now: number; onRespond: (a: Activity) => void; onOpenCapsule: (activityId: string) => void }) {
  const openProfile = useOpenProfile()
  const { state } = useStore()
  const me = state.me!
  const [hidden, setHidden] = useState<string[]>([])
  const [reporting, setReporting] = useState<Person | null>(null)

  const ranked = state.people
    .filter((p) => !hidden.includes(p.id))
    .map((p) => ({ p, c: compatibility(me, p), act: state.activities.find((a) => a.authorId === p.id && a.expiresAt > now) }))
    .sort((a, b) => b.c.score - a.c.score)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">По итогам вайб-теста</span>
        <h1 className="font-display font-bold text-2xl">На одной волне</h1>
      </div>

      {ranked.map(({ p, c, act }, i) => {
        const shared = sharedAnswers(me.answers, p.answers)
        const responded = act && state.liked.includes(act.id)
        return (
          <article key={p.id} className={`relative overflow-hidden rounded-[28px] bg-surface shadow-soft p-5 flex flex-col gap-4 `}>
            <div className="flex items-start gap-4">
              <button onClick={() => openProfile(p.id)} className="cursor-pointer" aria-label={`Профиль ${p.name}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={64} verified={p.verified} /></button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-lg"><button onClick={() => openProfile(p.id)} className="cursor-pointer hover:underline">{p.name}, {p.age}</button></h2>
                  {i === 0 && <Pill tone="spark">Лучший мэтч</Pill>}
                </div>
                <p className={`text-[13px] text-muted`}>{p.district} · {p.distanceKm.toFixed(1).replace('.', ',')} км · встреч: {p.meetings}</p>
                <ReliabilityBadge person={p} compact />
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-semibold text-3xl text-brand tnum leading-none">{c.score}<span className="text-lg">%</span></div>
              </div>
            </div>

            {/* Шкала совместимости */}
            <div className={`h-1.5 rounded-full overflow-hidden bg-surface-2`}>
              <div className="h-full rounded-full bg-brand" style={{ width: `${c.score}%` }} />
            </div>

            <p className="text-[14px] leading-relaxed">{p.bio}</p>

            {shared.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-[12px] mr-1 self-center text-muted`}>Совпало:</span>
                {shared.map((s) => (
                  <span key={s} className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-surface-2`}>{s}</span>
                ))}
              </div>
            )}

            {act ? (
              <div className={`rounded-2xl p-3.5 flex flex-col gap-3 bg-surface-2`}>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-spark"><Icon name="spark" size={14} fill /> ПЛАН · {planWhen(act, now)}</div>
                <p className="font-semibold leading-snug">{act.title}</p>
                {responded ? (
                  <Button variant="secondary" onClick={() => onOpenCapsule(act.id)}><Icon name="chat" size={18} /> Открыть капсулу</Button>
                ) : (
                  <Button onClick={() => onRespond(act)}><Icon name="spark" size={18} fill /> Откликнуться на план</Button>
                )}
              </div>
            ) : (
              <p className={`text-[13px] text-muted`}>Сейчас нет активных планов. Мы сообщим, когда появятся.</p>
            )}

            <div className={`flex justify-between text-[13px] text-muted`}>
              <button onClick={() => setHidden([...hidden, p.id])} className="cursor-pointer hover:underline">Не показывать</button>
              <button onClick={() => setReporting(p)} className="inline-flex items-center gap-1 cursor-pointer hover:underline"><Icon name="flag" size={14} /> Пожаловаться</button>
            </div>
          </article>
        )
      })}

      <ReportSheet person={reporting} onClose={() => setReporting(null)} />
    </div>
  )
}

export function ReportSheet({ person, onClose, onBlocked }: { person: Person | null; onClose: () => void; onBlocked?: () => void }) {
  const { dispatch } = useStore()
  const [reason, setReason] = useState(REASONS[0])
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const close = () => { setSent(false); setText(''); onClose() }
  const block = () => {
    if (!person) return
    dispatch({ type: 'block', personId: person.id, name: person.name })
    close()
    onBlocked?.()
  }
  return (
    <Sheet open={!!person} onClose={close} title={sent ? 'Жалоба отправлена' : `Жалоба на ${person?.name ?? ''}`}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Спасибо. Модератор проверит жалобу и, если правила нарушены, заблокирует аккаунт. Чтобы {person?.name} не мог(ла) вам писать и пропал(а) из вашей ленты — заблокируйте.</p>
          <Button variant="danger" onClick={block}>Заблокировать {person?.name}</Button>
          <Button variant="secondary" onClick={close}>Готово</Button>
        </div>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (person) dispatch({ type: 'report', personId: person.id, reason, text: text.trim() || '—' }); setSent(true) }}>
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 rounded-xl border border-line px-3 h-11 cursor-pointer has-[:checked]:border-spark">
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--spark)]" />
              {r}
            </label>
          ))}
          <textarea id="report-text" aria-label="Подробности" className={`${inputCls} h-20 py-2 resize-none`} placeholder="Что случилось (необязательно)" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" variant="danger">Отправить жалобу</Button>
          <button type="button" onClick={block} className="self-center text-[14px] font-semibold text-muted hover:text-danger cursor-pointer">Просто заблокировать, без жалобы</button>
        </form>
      )}
    </Sheet>
  )
}
