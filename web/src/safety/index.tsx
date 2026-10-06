import { useState } from 'react'
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
