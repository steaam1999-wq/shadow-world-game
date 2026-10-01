import { useState } from 'react'
import { Icon } from './ui'

// Подсказка новичку: как устроен Komeeta. Показывается, пока её не закроют.
const KEY = 'match-tips-v1'

export function WelcomeTips() {
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(KEY) === '1' } catch { return true } })
  if (hidden) return null
  const close = () => { setHidden(true); try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } }
  const steps = [
    { icon: 'plus', title: '«+» внизу', text: 'создать план встречи, публикацию, историю или чат' },
    { icon: 'spark', title: 'Кружки сверху', text: 'истории и планы людей — нажмите, чтобы посмотреть' },
    { icon: 'chat', title: '«Чаты»', text: 'договориться о встрече; точное место — только там' },
  ]
  return (
    <section className="mx-4 mb-4 rounded-[24px] bg-surface shadow-soft p-4 flex flex-col gap-3" aria-label="Как пользоваться Komeeta">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-[17px]">Как пользоваться Komeeta</h2>
        <button onClick={close} className="grid place-items-center w-8 h-8 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Скрыть подсказку"><Icon name="x" size={16} /></button>
      </div>
      <ol className="flex flex-col gap-2.5">
        {steps.map((s) => (
          <li key={s.title} className="flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-brand text-white"><Icon name={s.icon} size={18} /></span>
            <span className="text-[14px] leading-snug"><b>{s.title}</b> — {s.text}</span>
          </li>
        ))}
      </ol>
      <button onClick={close} className="h-10 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer">Понятно</button>
    </section>
  )
}
