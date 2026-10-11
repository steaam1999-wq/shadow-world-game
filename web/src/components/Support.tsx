// Чат с поддержкой: на вопросы отвечает бот (Claude на сервере). Если бот на сервере не настроен
// или нет связи — отвечаем по встроенным частым вопросам. «Позвать человека» — переписка уходит команде.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { askSupportBot, sendBugReport } from '../cloud/api'
import { deviceLine } from './BugReport'
import { Icon, keepKeyboard, useKeyboardDock } from './ui'

declare const __BUILD__: string

type Msg = { id: string; from: 'me' | 'bot' | 'system'; text: string; at: number }
const KEY = 'komeeta-support'
const GREETING = 'Здравствуйте! Я бот поддержки Komeeta. Спросите что угодно о приложении — отвечу сразу. Если не справлюсь, нажмите «Позвать человека».'
const QUICK = ['Как создать план?', 'Не приходят уведомления', 'Как получить галочку?', 'Как пригласить друга?', 'Как встретиться безопасно?', 'Как удалить аккаунт?']

// Частые вопросы — ответы, когда бот на сервере недоступен.
const FAQ: [RegExp, string][] = [
  [/план|опубликов|создать|встреч[уа] создать/i, 'Нажмите «+» внизу → «План на встречу». Напишите, что предлагаете, выберите время и место и нажмите «Опубликовать на 48 часов». Кто откликнется — появится в «Чатах».'],
  [/уведомл|пуш|не приход/i, 'Android: Настройки телефона → Приложения → Komeeta → Уведомления → Разрешить. iPhone: уведомления работают, только если Komeeta добавлена на экран «Домой» (Safari → «Поделиться» → «На экран „Домой“»). Откройте с иконки и нажмите «Включить уведомления» на главной.'],
  [/галоч|провер|верифик/i, 'Галочка — это проверка профиля. Нажмите баннер «Пройти проверку» на главной или карточку проверки в профиле и сделайте селфи с показанным жестом. Команда проверит и поставит галочку.'],
  [/пригла|друг|ссылк/i, 'Откройте Профиль → «Пригласить» и отправьте ссылку другу. За 3 приглашённых друзей вы получите медаль «Проводник».'],
  [/безопас|опасн|страшн/i, 'Встречайтесь в людных местах и скажите близким, куда идёте. В чате нажмите «⋯» → «Я на встрече»: если вы не отметитесь вовремя, доверенный контакт получит сигнал. Если просят деньги — это мошенники, жалуйтесь через «⋯» → «Пожаловаться».'],
  [/удал.*акк|акк.*удал|удалить профил/i, 'Нажмите «Позвать человека» ниже и напишите, что хотите удалить аккаунт, — команда сделает это вручную.'],
  [/жалоб|пожалов|заблок|спам|мошен/i, 'Откройте чат или профиль человека → «⋯» → «Пожаловаться или заблокировать». Модераторы проверят переписку по жалобе.'],
  [/звон|видео/i, 'Звонки и видеозвонки появляются в чате, когда вы оба написали друг другу. Кнопки — вверху чата рядом с именем.'],
  [/фон|оформлен|тема|цвет/i, 'В чате нажмите «⋯» → «Оформление чата»: фон (можно своё фото), цвет ваших сообщений и размер текста. Профиль оформляется кнопкой «Оформление» в профиле.'],
  [/аккаунт.*переключ|переключ|второй аккаунт|несколько аккаунт/i, 'В профиле нажмите на своё имя — откроется список аккаунтов. Там можно добавить аккаунт и переключаться без пароля.'],
  [/медал|достиж|комет|амбасс/i, 'Медали выдаются за встречи и приглашения: «Первая встреча», «Душа компании», «Надёжный», «Проводник», «Легенда». Соберёте пять — получите «Комету». Значок амбассадора выдаёт команда тем, кто помогает запускать встречи в городе.'],
  [/обнов|не работает|глюч|завис|ошибк/i, 'Попробуйте полностью закрыть приложение и открыть снова — так подтянется последнее обновление. Если не помогло, нажмите «Позвать человека» и опишите, что происходит.'],
]
function faqAnswer(q: string) {
  return FAQ.find(([re]) => re.test(q))?.[1] ?? 'Хороший вопрос — точного ответа у меня нет. Нажмите «Позвать человека», и команда Komeeta ответит вам лично.'
}

function load(uid: string): Msg[] {
  try { const v = JSON.parse(localStorage.getItem(`${KEY}:${uid}`) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
const mid = () => Math.random().toString(36).slice(2)

/** Строка «Поддержка» — вверху списка чатов. */
export function SupportRow({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-3 py-2 text-left cursor-pointer" aria-label="Чат с поддержкой">
      <span className="grid place-items-center w-[54px] h-[54px] rounded-full bg-brand text-white shrink-0 shadow-soft"><Icon name="chat" size={24} /></span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 font-semibold">Поддержка Komeeta <span className="grid place-items-center w-4 h-4 rounded-full bg-cobalt text-white"><Icon name="check" size={10} /></span></span>
        <span className="block text-[14px] text-muted truncate">Ответим на любой вопрос о приложении</span>
      </span>
    </button>
  )
}

export function SupportChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const uid = state.cloud?.userId ?? 'demo'
  const [msgs, setMsgs] = useState<Msg[]>(() => load(uid))
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [human, setHuman] = useState<'idle' | 'sent' | 'sending'>('idle')
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const { kb } = useKeyboardDock()
  useEffect(() => { setMsgs(load(uid)) }, [uid])
  useEffect(() => { try { localStorage.setItem(`${KEY}:${uid}`, JSON.stringify(msgs.slice(-60))) } catch { /* ignore */ } }, [msgs, uid])
  useEffect(() => { if (open) setTimeout(() => end.current?.scrollIntoView({ block: 'end' }), 50) }, [open, msgs.length, busy])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null

  const ask = async (q: string) => {
    const t = q.trim()
    if (!t || busy) return
    const mine: Msg = { id: mid(), from: 'me', text: t.slice(0, 2000), at: Date.now() }
    const next = [...msgs, mine]
    setMsgs(next); setText(''); setBusy(true)
    input.current?.focus()
    let answer = ''
    if (state.cloud) {
      const history = next.filter((m) => m.from !== 'system').slice(-12).map((m) => ({ role: m.from === 'me' ? 'user' as const : 'assistant' as const, content: m.text }))
      const r = await askSupportBot(history).catch(() => ({ error: 'failed' as const }))
      if ('text' in r) answer = r.text
      else if (r.error === 'limit') answer = 'На сегодня вопросов много — бот отдыхает до завтра. Если срочно, нажмите «Позвать человека».'
      else if (r.error === 'busy') answer = 'Сейчас много вопросов, попробуйте через минуту. ' + faqAnswer(t)
      else answer = faqAnswer(t)
    } else {
      await new Promise((r) => setTimeout(r, 700))
      answer = faqAnswer(t)
    }
    setMsgs((m) => [...m, { id: mid(), from: 'bot', text: answer, at: Date.now() }])
    setBusy(false)
  }

  const callHuman = async () => {
    if (human !== 'idle') return
    setHuman('sending')
    const transcript = msgs.map((m) => `${m.from === 'me' ? 'Человек' : m.from === 'bot' ? 'Бот' : '—'}: ${m.text}`).join('\n').slice(-1900)
    try {
      if (state.cloud) await sendBugReport(state.cloud.userId, { body: `[Поддержка] ${transcript || 'Просит связаться'}`, page: 'support', device: deviceLine(), version: __BUILD__ })
      setMsgs((m) => [...m, { id: mid(), from: 'system', text: 'Переписка передана команде Komeeta. Ответ придёт в уведомления или на почту — обычно в течение дня.', at: Date.now() }])
      setHuman('sent')
    } catch {
      setMsgs((m) => [...m, { id: mid(), from: 'system', text: 'Не получилось отправить. Проверьте интернет и нажмите ещё раз.', at: Date.now() }])
      setHuman('idle')
    }
  }

  const shown: Msg[] = [{ id: 'hello', from: 'bot', text: GREETING, at: 0 }, ...msgs]
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label="Поддержка Komeeta"
      style={kb ? { bottom: `max(0px, calc(${kb}px - env(safe-area-inset-bottom, 0px)))` } : undefined}>
      <header className="shrink-0 flex items-center gap-2.5 px-3 pb-2 pt-[calc(8px+env(safe-area-inset-top,0px))] border-b border-line/60 bg-bg/90 backdrop-blur-2xl">
        <button onClick={onClose} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Закрыть поддержку"><Icon name="back" /></button>
        <span className="grid place-items-center w-10 h-10 rounded-full bg-brand text-white shrink-0"><Icon name="chat" size={19} /></span>
        <span className="flex-1 min-w-0 leading-tight">
          <span className="block font-semibold">Поддержка Komeeta</span>
          <span className="block text-[12px] text-[#16a34a] font-medium">бот · отвечает сразу</span>
        </span>
        {msgs.length > 0 && <button onClick={() => { setMsgs([]); setHuman('idle') }} className="h-9 px-3 rounded-full text-[13px] text-muted hover:bg-surface-2 cursor-pointer">Очистить</button>}
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-2">
        {shown.map((m) => m.from === 'system'
          ? <p key={m.id} className="self-center max-w-[90%] my-1 text-center text-[12.5px] text-muted bg-surface-2/70 rounded-2xl px-3 py-1.5">{m.text}</p>
          : <div key={m.id} className={`msg-in max-w-[85%] rounded-[20px] px-3.5 py-2 text-[15.5px] leading-[1.38] whitespace-pre-wrap break-words ${m.from === 'me' ? 'self-end bubble-me text-white rounded-br-[6px]' : 'self-start bubble-them text-fg rounded-bl-[6px]'}`}>{m.text}</div>)}
        {busy && (
          <div className="self-start bubble-them rounded-[20px] rounded-bl-[6px] h-10 px-4 inline-flex items-center gap-1" role="status" aria-label="Бот печатает…">
            {[0, 1, 2].map((d) => <span key={d} className="typing-dot w-2 h-2 rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />)}
          </div>
        )}
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {QUICK.map((q) => <button key={q} onClick={() => void ask(q)} className="h-9 px-3.5 rounded-full bg-surface-2 ring-1 ring-line text-[13.5px] font-medium cursor-pointer active:scale-95 transition">{q}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <div className={`shrink-0 border-t border-line/60 bg-bg/90 backdrop-blur-2xl px-3 pt-2 ${kb ? 'pb-2' : 'pb-[calc(10px+env(safe-area-inset-bottom,0px))]'} flex flex-col gap-2`}>
        {msgs.some((m) => m.from === 'me') && human !== 'sent' && (
          <button onClick={() => void callHuman()} disabled={human === 'sending'} className="self-center inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-surface-2 text-[13px] font-semibold cursor-pointer disabled:opacity-60">
            <Icon name="user" size={15} /> {human === 'sending' ? 'Передаём…' : 'Позвать человека'}
          </button>
        )}
        <form onSubmit={(e) => { e.preventDefault(); void ask(text) }} className="flex items-center gap-2">
          <input ref={input} id="support-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Ваш вопрос…" autoComplete="off" aria-label="Вопрос в поддержку"
            className="flex-1 min-w-0 h-12 rounded-full bg-surface-2/80 ring-1 ring-line/70 px-4 text-[15.5px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-spark/50" />
          <button type="submit" disabled={!text.trim() || busy} {...keepKeyboard} aria-label="Отправить вопрос"
            className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-brand text-white disabled:opacity-40 cursor-pointer"><Icon name="send" size={19} /></button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
