import { useEffect, useState } from 'react'
import { formatKm } from '../places'
import { useStore } from '../store'
import { countdown, freeUntil, hm, meetingCode, reliability } from '../lib'
import { Avatar, Button, Chip, Field, Icon, Sheet, inputCls } from './ui'
import type { Activity, Capsule, Person } from '../types'

/* ───────── Отметка встречи кодами ───────── */

/** Оба показывают друг другу 4-значные коды: совпало — встреча подтверждена и идёт в надёжность. */
export function CheckinSheet({ capsule, person, open, onClose }: { capsule: Capsule; person: Person; open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const mine = meetingCode(capsule.id, 'me')
  const theirs = meetingCode(capsule.id, person.id)
  const close = () => { setCode(''); setError(''); setDone(false); onClose() }

  return (
    <Sheet open={open} onClose={close} title={done ? 'Встреча подтверждена' : 'Отметить встречу'}>
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid place-items-center w-20 h-20 rounded-full bg-ok-soft text-ok anim-like"><Icon name="check" size={40} /></span>
          <p>Вы с {person.name} встретились — это видно в профилях обоих. Надёжность растёт только от подтверждённых встреч.</p>
          <Button onClick={close} className="w-full">Отлично</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted">Покажите свой код собеседнику, а ниже введите код с его экрана — так оба подтвердят, что встреча была.</p>
          <div className="rounded-3xl bg-surface-2 p-4 text-center">
            <div className="text-[12px] text-muted">Ваш код</div>
            <div className="font-mono font-bold text-[44px] tracking-[.25em] tnum text-brand">{mine}</div>
          </div>
          <form className="flex flex-col gap-3" onSubmit={(e) => {
            e.preventDefault()
            if (code === theirs) { dispatch({ type: 'checkIn', capsuleId: capsule.id }); setDone(true) } else setError('Код не совпал. Попросите собеседника показать экран ещё раз.')
          }}>
            <Field id="checkin-code" label="Код собеседника">
              <input id="checkin-code" inputMode="numeric" maxLength={4} autoComplete="off" className={`${inputCls} text-center font-mono text-[22px] tracking-[.4em] tnum`}
                value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }} placeholder="••••" />
            </Field>
            {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
            <Button type="submit" disabled={code.length !== 4}>Подтвердить встречу</Button>
          </form>
          <p className="text-[12px] text-muted text-center">Демо: код собеседника — <span className="font-mono font-semibold select-all">{theirs}</span></p>
        </div>
      )}
    </Sheet>
  )
}

/** Бейдж надёжности: доля встреч, на которые человек пришёл. */
export function ReliabilityBadge({ person, compact = false }: { person: Person; compact?: boolean }) {
  const r = reliability(person)
  if (!r.total) return compact ? null : <span className="text-[12px] text-muted">Пока без подтверждённых встреч</span>
  const tone = r.pct >= 90 ? 'text-ok' : r.pct >= 70 ? 'text-warn' : 'text-danger'
  return compact ? (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold ${tone}`} title={`Пришёл(ла) на ${r.came} из ${r.total} встреч`}>
      <Icon name="shield" size={12} /> приходит {r.pct}%
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${tone}`}>
      <Icon name="shield" size={15} /> <b>Надёжность {r.pct}%</b> <span className="text-muted font-normal">— пришёл(ла) на {r.came} из {r.total} встреч</span>
    </span>
  )
}

/* ───────── Таймер безопасности ───────── */

const SAFETY_DURATIONS = [
  { min: 60, label: '1 час' },
  { min: 120, label: '2 часа' },
  { min: 180, label: '3 часа' },
  { min: 1, label: 'Демо: 1 мин' },
]

/** «Я на встрече»: не отметились вовремя — другу уходит сообщение с местом встречи. */
export function SafetySheet({ capsule, person, place, open, onClose }: { capsule: Capsule; person: Person; place: string; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [contact, setContact] = useState(state.me?.trustedContact ?? '')
  const [min, setMin] = useState(120)
  return (
    <Sheet open={open} onClose={onClose} title="Я на встрече">
      <form className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault()
        const now = Date.now()
        dispatch({ type: 'startSafety', safety: { capsuleId: capsule.id, personId: person.id, place, contact: contact.trim(), startedAt: now, until: now + min * 60_000 } })
        onClose()
      }}>
        <p className="text-[14px] text-muted">Если не нажмёте «Всё хорошо» до конца таймера, мы отправим другу, с кем и где вы. {person.name} ничего не увидит.</p>
        <Field id="safety-contact" label="Кому сообщить">
          <input id="safety-contact" className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Мама, +7 900 000-00-00" required />
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Через сколько проверить</span>
          <div className="flex flex-wrap gap-2">
            {SAFETY_DURATIONS.map((d) => <Chip key={d.min} active={min === d.min} onClick={() => setMin(d.min)}>{d.label}</Chip>)}
          </div>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3 text-[13px]"><span className="text-muted">Место:</span> {place}</div>
        <Button type="submit" disabled={!contact.trim()}><Icon name="shield" size={18} /> Включить таймер</Button>
      </form>
    </Sheet>
  )
}

/** Плашка идущей встречи и тревога, если время вышло. Показывается поверх всего приложения. */
export function SafetyBanner({ now, top = 64 }: { now: number; top?: number }) {
  const { state, dispatch } = useStore()
  const [alarm, setAlarm] = useState(false)
  const [copied, setCopied] = useState(false)
  const s = state.safety
  const overdue = !!s && now >= s.until
  useEffect(() => { if (overdue) setAlarm(true) }, [overdue])
  if (!s) return null
  const person = state.people.find((p) => p.id === s.personId)
  const left = s.until - now
  const message = `Это ${state.me?.name ?? 'я'} через ISKRA. С ${hm(s.startedAt)} я на встрече с человеком из приложения (${person?.name ?? 'имя в профиле'}), место: ${s.place}. Я не отметилась(ся), что всё хорошо — пожалуйста, позвони мне.`
  const copy = async () => { try { await navigator.clipboard.writeText(message); setCopied(true) } catch { setCopied(false) } }

  return (
    <>
      <div className="glass glass-solid fixed inset-x-3 mx-auto max-w-[456px] z-30 rounded-[22px] p-2.5 flex items-center gap-2.5" style={{ top: `calc(${top}px + env(safe-area-inset-top, 0px))` }} role="status">
        <span className="grid place-items-center w-10 h-10 rounded-full bg-ok-soft text-ok shrink-0"><Icon name="shield" size={20} /></span>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="font-semibold text-[14px] truncate">Встреча · {person?.name}</div>
          <div className={`text-[12px] font-mono tnum whitespace-nowrap ${overdue ? 'text-danger' : 'text-muted'}`}>{overdue ? 'время вышло' : countdown(left)}</div>
        </div>
        <button onClick={() => dispatch({ type: 'extendSafety', minutes: 30 })} className="h-9 px-2.5 rounded-xl bg-surface-2 text-[13px] font-semibold cursor-pointer shrink-0 whitespace-nowrap" aria-label="Продлить на 30 минут">+30 мин</button>
        <button onClick={() => { dispatch({ type: 'endSafety' }); setAlarm(false) }} className="h-9 px-3 rounded-xl bg-ok text-white text-[13px] font-semibold cursor-pointer shrink-0 whitespace-nowrap">Всё ок</button>
      </div>

      {alarm && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm px-4" role="alertdialog" aria-modal="true" aria-label="Проверка безопасности">
          <div className="anim-rise w-full max-w-[400px] rounded-[28px] bg-surface p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-12 h-12 rounded-full bg-danger-soft text-danger shrink-0"><Icon name="bell" size={24} /></span>
              <h2 className="font-display font-semibold text-xl leading-tight">Вы не отметились, что всё хорошо</h2>
            </div>
            <p className="text-[14px] text-muted">В рабочей версии это сообщение уже ушло бы контакту <b className="text-fg">{s.contact}</b> по SMS. В демо отправки нет — можно скопировать и отправить самим:</p>
            <p className="text-[13px] rounded-2xl bg-surface-2 p-3 select-all">{message}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={copy}>{copied ? 'Скопировано' : 'Скопировать'}</Button>
              <Button onClick={() => { dispatch({ type: 'endSafety' }); setAlarm(false) }} className="whitespace-nowrap">Всё хорошо</Button>
            </div>
            <p className="text-center text-[13px] text-muted">Если вы в опасности — звоните <span className="font-mono font-bold text-danger select-all">112</span></p>
          </div>
        </div>
      )}
    </>
  )
}

/* ───────── Свободен сейчас ───────── */

const FREE_DURATIONS = [60, 120, 180]

/** Блок в ленте: объявить, что вы свободны, и позвать тех, кто тоже свободен рядом. */
export function FreeNow({ now, onInvite }: { now: number; onInvite: (personId: string) => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [choosing, setChoosing] = useState(false)
  const [invited, setInvited] = useState<string[]>([])
  const iAmFree = !!me.freeUntil && me.freeUntil > now
  // Статус «свободен» пока не хранится на сервере — в режиме с сервером блок не показываем, чтобы не обманывать.
  const free = state.people
    .map((p) => ({ p, until: freeUntil(p.id, now) }))
    .filter((x): x is { p: Person; until: number } => !!x.until && x.p.distanceKm <= me.radiusKm + 2)
    .sort((a, b) => a.p.distanceKm - b.p.distanceKm)

  if (state.cloud) return null
  return (
    <section className="mx-4 mb-4 rounded-[24px] bg-surface shadow-soft p-3.5 flex flex-col gap-3" aria-label="Свободны сейчас">
      {iAmFree ? (
        <div className="flex items-center gap-3">
          <span className="relative grid place-items-center w-10 h-10 rounded-full bg-ok-soft text-ok shrink-0">
            <Icon name="spark" size={18} fill /><span className="absolute -right-0.5 -top-0.5 w-3 h-3 rounded-full bg-ok border-2 border-surface anim-flick" />
          </span>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="font-semibold">Вы свободны до {hm(me.freeUntil!)}</div>
            <div className="text-[12px] text-muted">Люди рядом видят, что вас можно позвать прямо сейчас</div>
          </div>
          <button onClick={() => dispatch({ type: 'setFree', until: null })} className="text-[13px] text-muted hover:text-fg cursor-pointer shrink-0">Отменить</button>
        </div>
      ) : (
        <button onClick={() => setChoosing(true)} className="flex items-center gap-3 text-left cursor-pointer">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-brand text-white shrink-0"><Icon name="spark" size={18} fill /></span>
          <span className="flex-1 min-w-0 leading-tight">
            <span className="block font-semibold">Свободен(на) сейчас?</span>
            <span className="block text-[12px] text-muted">{free.length ? `${free.length} ${free.length === 1 ? 'человек рядом свободен' : 'человека рядом свободны'} — встретьтесь в ближайший час` : 'Отметьтесь — и вас смогут позвать прямо сейчас'}</span>
          </span>
          <Icon name="arrow" size={18} />
        </button>
      )}

      {free.length > 0 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
          {free.map(({ p, until }) => (
            <div key={p.id} className="shrink-0 w-[132px] rounded-2xl bg-surface-2 p-2.5 flex flex-col items-center gap-1.5 text-center">
              <span className="relative"><Avatar name={p.name} hue={p.hue} src={p.photo} size={48} verified={p.verified} /><span className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full bg-ok border-2 border-surface-2" /></span>
              <span className="text-[13px] font-semibold leading-tight">{p.name}, {p.age}</span>
              <span className="text-[11px] text-muted leading-tight">{formatKm(p.distanceKm)} · до {hm(until)}</span>
              <ReliabilityBadge person={p} compact />
              <button disabled={invited.includes(p.id)} onClick={() => { setInvited([...invited, p.id]); onInvite(p.id) }}
                className="mt-0.5 w-full h-8 rounded-xl bg-brand text-white text-[12px] font-semibold cursor-pointer disabled:opacity-50">
                {invited.includes(p.id) ? 'Позвали' : 'Позвать'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={choosing} onClose={() => setChoosing(false)} title="Свободен(на) сейчас">
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted">Люди рядом увидят зелёную точку и смогут позвать вас на кофе или прогулку прямо сейчас. Точное место — только в чате.</p>
          <div className="grid grid-cols-3 gap-2">
            {FREE_DURATIONS.map((m) => (
              <Button key={m} variant="secondary" onClick={() => { dispatch({ type: 'setFree', until: Date.now() + m * 60_000 }); setChoosing(false) }}>
                {m / 60} ч
              </Button>
            ))}
          </div>
        </div>
      </Sheet>
    </section>
  )
}

/* ───────── Групповые планы ───────── */

/** Кто уже идёт компанией: аватарки организатора и участников, пустые места пунктиром. */
export function GroupStack({ activity, light = false }: { activity: Activity; light?: boolean }) {
  const { state } = useStore()
  if (!activity.groupSize) return null
  const ids = [activity.authorId, ...(activity.members ?? [])]
  const free = Math.max(0, activity.groupSize - ids.length)
  const face = (id: string) => {
    if (id === 'me') return state.me ? <Avatar name={state.me.name} hue={state.me.hue} src={state.me.photo} size={28} /> : null
    const p = state.people.find((x) => x.id === id)
    return p ? <Avatar name={p.name} hue={p.hue} src={p.photo} size={28} /> : null
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex -space-x-2">
        {ids.map((id) => <span key={id} className={`rounded-full ring-2 ${light ? 'ring-black/30' : 'ring-surface'}`}>{face(id)}</span>)}
        {Array.from({ length: free }).map((_, i) => (
          <span key={i} className={`grid place-items-center w-7 h-7 rounded-full border-2 border-dashed ${light ? 'border-white/60 text-white/80' : 'border-line text-muted'} text-[13px] bg-transparent`}>+</span>
        ))}
      </div>
      <span className={`text-[13px] ${light ? 'text-white/90' : 'text-muted'}`}>
        <b className={light ? 'text-white' : 'text-fg'}>Компания {ids.length} из {activity.groupSize}</b> · {free ? `${free} ${free === 1 ? 'место' : 'места'}` : 'мест нет'}
      </span>
    </div>
  )
}

export function groupFull(a: Activity) {
  return !!a.groupSize && [a.authorId, ...(a.members ?? [])].length >= a.groupSize
}

/** Текст главной кнопки плана с учётом компании. */
export function joinLabel(a: Activity, responded: boolean) {
  if (responded) return 'Открыть чат'
  if (a.groupSize) return groupFull(a) ? 'Мест нет' : 'Присоединиться к компании'
  return 'Хочу с тобой'
}

/* ───────── Взаимное «хочу ещё» ───────── */

/** После подтверждённой встречи — тайный вопрос. Совпало «да» у обоих — капсула открывается снова. */
export function AgainCard({ capsule, person }: { capsule: Capsule; person: Person }) {
  const { dispatch } = useStore()
  if (capsule.status !== 'met' || capsule.again) return null
  return (
    <div className="self-stretch rounded-[22px] bg-surface shadow-soft p-4 flex flex-col gap-3 text-center">
      <span className="mx-auto grid place-items-center w-11 h-11 rounded-full bg-brand text-white"><Icon name="heart" size={20} fill /></span>
      <div>
        <div className="font-display font-semibold text-[17px]">{person.name} — хотите встретиться ещё?</div>
        <p className="text-[13px] text-muted">Ответ тайный. Если вы оба скажете «да» — мы напомним вам друг о друге. Отказ собеседник не увидит.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: 'wantAgain', capsuleId: capsule.id, want: false })}>Пожалуй, нет</Button>
        <Button onClick={() => dispatch({ type: 'wantAgain', capsuleId: capsule.id, want: true })}>Да, хочу ещё</Button>
      </div>
    </div>
  )
}
