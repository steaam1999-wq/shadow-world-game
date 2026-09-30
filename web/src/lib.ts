import { HOUR, VIBE_QUESTIONS } from './data'
import type { Activity, Capsule, Me, Person, VibeAnswers } from './types'

/** Совместимость: совпадения ответов вайб-теста (80%) + общие интересы (20%). */
export function compatibility(me: Pick<Me, 'answers' | 'tags'>, p: Pick<Person, 'answers' | 'tags'>) {
  const same = VIBE_QUESTIONS.filter((q) => me.answers[q.id] && me.answers[q.id] === p.answers[q.id]).length
  const sharedTags = me.tags.filter((t) => p.tags.includes(t))
  const tagScore = me.tags.length ? sharedTags.length / Math.min(me.tags.length, p.tags.length || 1) : 0
  const score = Math.round(40 + 45 * (same / VIBE_QUESTIONS.length) + 15 * Math.min(tagScore, 1))
  return { score: Math.min(score, 99), same, sharedTags }
}

export function sharedAnswers(a: VibeAnswers, b: VibeAnswers) {
  return VIBE_QUESTIONS.flatMap((q) => {
    if (!a[q.id] || a[q.id] !== b[q.id]) return []
    const opt = q.options.find((o) => o.id === a[q.id])
    return opt ? [opt.label] : []
  })
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 71:42:09 */
export function countdown(ms: number) {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function hm(ts: number) {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** «Сегодня, 19:30», «Завтра, 12:00», «чт, 18:00» */
export function whenLabel(ts: number, now = Date.now()) {
  const d = new Date(ts)
  const today = new Date(now)
  const dayDiff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / (24 * HOUR),
  )
  const prefix = dayDiff === 0 ? 'Сегодня' : dayDiff === 1 ? 'Завтра' : dayDiff === 2 ? 'Послезавтра' : WEEKDAYS[d.getDay()]
  return `${prefix}, ${hm(ts)}`
}

export function relative(ts: number, now = Date.now()) {
  const diff = ts - now
  const abs = Math.abs(diff)
  const h = Math.floor(abs / HOUR)
  const m = Math.round((abs % HOUR) / 60000)
  const txt = h >= 1 ? `${h} ч${m && h < 10 ? ` ${m} мин` : ''}` : `${Math.max(m, 1)} мин`
  return diff >= 0 ? `через ${txt}` : `${txt} назад`
}

export const LEVELS = [
  { min: 0, name: 'Искра' },
  { min: 1, name: 'Огонёк' },
  { min: 3, name: 'Костёр' },
  { min: 6, name: 'Маяк' },
  { min: 10, name: 'Фейерверк' },
]

export function level(meetings: number) {
  let idx = 0
  LEVELS.forEach((l, i) => {
    if (meetings >= l.min) idx = i
  })
  const next = LEVELS[idx + 1]
  return { idx: idx + 1, name: LEVELS[idx].name, next, progress: next ? (meetings - LEVELS[idx].min) / (next.min - LEVELS[idx].min) : 1 }
}

export function profileCompleteness(me: Me) {
  const checks = [
    !!me.name,
    !!me.bio && me.bio.length > 20,
    Object.keys(me.answers).length === VIBE_QUESTIONS.length,
    me.tags.length >= 3,
    me.verified,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}


/** Таймер тикает, только пока капсула в режиме переписки. */
export const isBurning = (c: Capsule) => c.status === 'active'
export const isExpired = (_c: Capsule, _now: number) => false // чаты больше не сгорают

/** Подпись времени плана: скрытое время, «уже идёт» или «Сегодня, 19:30». */
export function planWhen(a: Pick<Activity, 'startsAt' | 'timeHidden'>, now = Date.now()) {
  if (a.timeHidden) return 'Время обсудим'
  if (a.startsAt <= now) return 'Уже идёт'
  return whenLabel(a.startsAt, now)
}

// Надёжность: сколько встреч человек подтвердил кодом и сколько пропустил без предупреждения (демо-данные).
const NO_SHOWS: Record<string, number> = { p3: 1, p6: 1, p8: 2 }

export function reliability(p: { id: string; meetings: number; noShows?: number }) {
  const missed = p.noShows ?? NO_SHOWS[p.id] ?? 0
  const total = p.meetings + missed
  return { came: p.meetings, total, pct: total ? Math.round((p.meetings / total) * 100) : 100 }
}

// Кто сейчас свободен рядом (демо): минуты от открытия приложения.
const T0 = Date.now()
const FREE_NOW: Record<string, number> = { p1: 95, p5: 140, p8: 55, p4: 30 }

export function freeUntil(personId: string, now = Date.now()) {
  const m = FREE_NOW[personId]
  if (!m) return null
  const until = T0 + m * 60_000
  return until > now ? until : null
}

/** Код встречи: 4 цифры, одинаковые для пары в пределах капсулы. */
export function meetingCode(capsuleId: string, who: string) {
  let h = 7
  for (const ch of capsuleId + who) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return String(1000 + (h % 9000))
}

/** «Аня, 26» или просто «Аня», если возраст не указан. */
export const nameAge = (name: string, age?: number | null) => (age ? `${name}, ${age}` : name)

/** Полных лет на сегодня по дате рождения «ГГГГ-ММ-ДД». */
export function ageFrom(birth: string, now = new Date()) {
  const [y, m, d] = birth.split('-').map(Number)
  let a = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--
  return a
}

/** «ДД.ММ.ГГГГ» → «ГГГГ-ММ-ДД»; null — дата неполная или такой даты нет. */
export function parseBirth(text: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim())
  if (!m) return null
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}
export const formatBirth = (iso?: string) => (iso ? iso.split('-').reverse().join('.') : '')
