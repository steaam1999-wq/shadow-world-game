import { useState } from 'react'
import type { Activity, Capsule } from '../types'
import { Button, Icon, Sheet } from '../components/ui'

// Защита в чатах: распознаём просьбы о деньгах и предупреждаем; памятка перед первой встречей.

/** Похоже на просьбу о деньгах, номер карты или криптокошелёк — то же правило, что на сервере. */
export const MONEY_RE = /(\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|переве(ди|сти|дите)|скин(ь|уть|ьте) (деньг|на карт|денег)|номер карты|реквизит|займ(и|ёшь|ешь)|одолж|в долг|usdt|bitcoin|биткоин|крипт)/i

/** Плашка под сообщением собеседника, если в нём просят денег. */
export function MoneyWarning() {
  return (
    <div className="flex items-start gap-2 max-w-full rounded-2xl bg-danger-soft text-danger px-3 py-2 text-[12.5px] leading-snug" role="alert">
      <Icon name="shield" size={15} className="shrink-0 mt-px" />
      <span><b>Осторожно:</b> никогда не переводите деньги и не сообщайте данные карты людям из приложения. Так часто действуют мошенники.</span>
    </div>
  )
}

/** Не больше 3 сообщений подряд без ответа (так же проверяет сервер). */
export function waitingForReply(messages: { from: string }[]) {
  const last = messages.filter((m) => m.from !== 'system').slice(-3)
  return last.length === 3 && last.every((m) => m.from === 'me')
}

const MEMO_KEY = 'safety-memo-seen'
export function useSafetyMemo() {
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(MEMO_KEY) } catch { return false } })
  const close = () => { setOpen(false); try { localStorage.setItem(MEMO_KEY, String(Date.now())) } catch { /* ignore */ } }
  return { open, close }
}

const TIPS: [string, string][] = [
  ['📍', 'Первую встречу — в людном месте: кафе, парк, торговый центр.'],
  ['👀', 'Скажите близкому, куда и с кем идёте. В чате есть кнопка «Я на встрече».'],
  ['🚗', 'Добирайтесь сами — не садитесь в чужую машину на первой встрече.'],
  ['💳', 'Никогда не переводите деньги и не отправляйте документы.'],
  ['🚩', 'Что-то не так — уходите, блокируйте и жалуйтесь. Мы проверяем каждую жалобу.'],
]

/** Памятка перед первой встречей — показывается один раз, при первом открытии чата. */
export function SafetyMemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Перед встречей 💛">
      <div className="flex flex-col gap-4 pb-1">
        <ul className="flex flex-col gap-3">
          {TIPS.map(([e, t]) => (
            <li key={t} className="flex items-start gap-3">
              <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-surface-2 text-[18px]" aria-hidden="true">{e}</span>
              <span className="text-[14.5px] leading-snug pt-1.5">{t}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onClose} className="h-12 !rounded-full">Понятно</Button>
      </div>
    </Sheet>
  )
}

/** После встречи: «Всё прошло хорошо?». Показываем, когда время плана прошло и оба писали в чате; ответ — один раз. */
export function MeetFeedback({ capsule, activity, name, now, onBad }: { capsule: Capsule; activity?: Activity; name: string; now: number; onBad: () => void }) {
  const key = `meet-feedback:${capsule.id}`
  const [done, setDone] = useState(() => { try { return !!localStorage.getItem(key) } catch { return true } })
  const [thanks, setThanks] = useState(false)
  if (done || !activity || activity.timeHidden) return null
  const ended = activity.startsAt + activity.durationMin * 60_000 < now
  const talked = capsule.messages.some((m) => m.from === 'me') && capsule.messages.some((m) => m.from === 'them')
  if (!ended || !talked) return null
  const answer = (v: 'good' | 'bad' | 'none') => {
    try { localStorage.setItem(key, v) } catch { /* ignore */ }
    if (v === 'bad') { setDone(true); onBad(); return }
    if (v === 'good') { setThanks(true); setTimeout(() => setDone(true), 1600); return }
    setDone(true)
  }
  return (
    <div className="self-stretch rounded-[22px] bg-surface shadow-soft p-4 flex flex-col gap-3 text-center" role="group" aria-label="Как прошла встреча">
      {thanks ? <p className="font-semibold py-2">Отлично! Рады, что всё хорошо 💛</p> : <>
        <div>
          <div className="font-display font-semibold text-[17px]">Встреча с {name} прошла хорошо?</div>
          <p className="text-[13px] text-muted">Ответ видите только вы. Если что-то было не так — поможем.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => answer('bad')}>👎 Было неприятно</Button>
          <Button onClick={() => answer('good')}>👍 Всё хорошо</Button>
        </div>
        <button onClick={() => answer('none')} className="text-[13px] font-semibold text-muted hover:text-fg cursor-pointer">Мы не встретились</button>
      </>}
    </div>
  )
}
