import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { CAPSULE_TTL, QUICK_REPLIES, seedState } from './data'
import type { Activity, CapsuleStatus, Me, Report, Safety, State, Verification } from './types'

const STORAGE_KEY = 'iskra-state'
const SESSION_KEY = 'iskra-session'

type Action =
  | { type: 'signIn'; me: Me }
  | { type: 'updateMe'; patch: Partial<Me> }
  | { type: 'signOut' }
  | { type: 'reset' }
  | { type: 'respond'; activityId: string; text?: string }
  | { type: 'createActivity'; activity: Omit<Activity, 'id' | 'authorId'> }
  | { type: 'deleteActivity'; activityId: string }
  | { type: 'send'; capsuleId: string; text: string }
  | { type: 'reply'; capsuleId: string }
  | { type: 'setStatus'; capsuleId: string; status: CapsuleStatus }
  | { type: 'readCapsule'; capsuleId: string }
  | { type: 'report'; personId: string; reason: string; text: string }
  | { type: 'resolveReport'; id: string; state: Report['state'] }
  | { type: 'verify'; id: string; state: Verification['state'] }
  | { type: 'setCategories'; categories: string[] }
  | { type: 'setTags'; tags: string[] }
  | { type: 'announce'; text: string | null }
  | { type: 'dismissAnnouncement' }
  | { type: 'toggleHeart'; activityId: string }
  | { type: 'heart'; activityId: string }
  | { type: 'toggleSave'; activityId: string }
  | { type: 'seeStory'; personId: string }
  | { type: 'share'; personId: string; activityId: string }
  | { type: 'toggleFollow'; personId: string }
  | { type: 'setRemember'; remember: boolean }
  | { type: 'setFree'; until: number | null }
  | { type: 'invite'; personId: string; text: string }
  | { type: 'startSafety'; safety: Safety }
  | { type: 'extendSafety'; minutes: number }
  | { type: 'endSafety' }
  | { type: 'checkIn'; capsuleId: string }

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

const uid = () => Math.random().toString(36).slice(2, 10)

const STATUS_TEXT: Record<CapsuleStatus, string> = {
  active: 'Капсула снова в режиме переписки.',
  agreed: 'Вы договорились о встрече. Таймер остановлен, капсула не сгорит.',
  contacts: 'Вы обменялись контактами. Капсула сохранится.',
  met: 'Встреча состоялась. +1 к уровню доверия у обоих.',
}

function reducer(state: State, action: Action): State {
  const now = Date.now()
  switch (action.type) {
    case 'signIn':
      return { ...state, me: action.me, savedMe: action.me }
    case 'updateMe':
      return state.me ? { ...state, me: { ...state.me, ...action.patch }, savedMe: { ...state.me, ...action.patch } } : state
    case 'signOut':
      return { ...state, me: null, savedMe: state.me ?? state.savedMe }
    case 'reset':
      return seedState()
    case 'respond': {
      if (state.liked.includes(action.activityId)) return state
      const activity = state.activities.find((a) => a.id === action.activityId)
      if (!activity) return state
      const capsule = {
        id: uid(),
        personId: activity.authorId,
        activityId: activity.id,
        createdAt: now,
        expiresAt: now + CAPSULE_TTL,
        status: 'active' as const,
        unread: 1,
        messages: [
          { id: uid(), from: 'system' as const, text: 'Капсула открыта. У вас 72 часа, чтобы договориться о встрече.', at: now },
          { id: uid(), from: 'system' as const, text: `Точное место: ${activity.exactPlace}`, at: now },
          ...(action.text ? [{ id: uid(), from: 'me' as const, text: action.text, at: now + 1 }] : []),
          { id: uid(), from: 'them' as const, text: 'Привет! План в силе. Во сколько тебе удобно подойти?', at: now + 2 },
        ],
      }
      return { ...state, liked: [...state.liked, activity.id], capsules: [capsule, ...state.capsules] }
    }
    case 'createActivity':
      return { ...state, activities: [{ ...action.activity, id: uid(), authorId: 'me' }, ...state.activities] }
    case 'deleteActivity':
      return { ...state, activities: state.activities.filter((a) => a.id !== action.activityId) }
    case 'send':
      return {
        ...state,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId ? { ...c, messages: [...c.messages, { id: uid(), from: 'me', text: action.text, at: now }] } : c,
        ),
      }
    case 'reply':
      return {
        ...state,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId
            ? { ...c, messages: [...c.messages, { id: uid(), from: 'them', text: QUICK_REPLIES[Math.floor(Math.random() * QUICK_REPLIES.length)], at: now }] }
            : c,
        ),
      }
    case 'setStatus':
      return {
        ...state,
        me: action.status === 'met' && state.me ? { ...state.me, meetings: state.me.meetings + 1 } : state.me,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId
            ? { ...c, status: action.status, messages: [...c.messages, { id: uid(), from: 'system', text: STATUS_TEXT[action.status], at: now }] }
            : c,
        ),
      }
    case 'readCapsule':
      return { ...state, capsules: state.capsules.map((c) => (c.id === action.capsuleId ? { ...c, unread: 0 } : c)) }
    case 'report':
      return { ...state, reports: [{ id: uid(), personId: action.personId, reason: action.reason, text: action.text, at: now, state: 'open' }, ...state.reports] }
    case 'resolveReport':
      return { ...state, reports: state.reports.map((r) => (r.id === action.id ? { ...r, state: action.state } : r)) }
    case 'verify':
      return { ...state, verifications: state.verifications.map((v) => (v.id === action.id ? { ...v, state: action.state } : v)) }
    case 'setCategories':
      return { ...state, categories: action.categories }
    case 'setTags':
      return { ...state, tags: action.tags }
    case 'announce':
      return { ...state, announcement: action.text }
    case 'dismissAnnouncement':
      return { ...state, dismissedAnnouncement: state.announcement }
    case 'toggleHeart':
      return { ...state, hearts: toggle(state.hearts, action.activityId) }
    case 'heart':
      return state.hearts.includes(action.activityId) ? state : { ...state, hearts: [...state.hearts, action.activityId] }
    case 'toggleSave':
      return { ...state, saved: toggle(state.saved, action.activityId) }
    case 'share': {
      // Пересланный план попадает в капсулу с человеком; если её нет — открываем новую.
      const activity = state.activities.find((x) => x.id === action.activityId)
      if (!activity) return state
      const text = `Смотри, какой план: «${activity.title}» — ${activity.area}`
      const existing = state.capsules.find((c) => c.personId === action.personId)
      if (existing) {
        return { ...state, capsules: state.capsules.map((c) => (c.id === existing.id ? { ...c, messages: [...c.messages, { id: uid(), from: 'me', text, at: now }] } : c)) }
      }
      const capsule = {
        id: uid(), personId: action.personId, activityId: activity.id, createdAt: now, expiresAt: now + CAPSULE_TTL, status: 'active' as const, unread: 0,
        messages: [
          { id: uid(), from: 'system' as const, text: 'Капсула открыта. У вас 72 часа, чтобы договориться о встрече.', at: now },
          { id: uid(), from: 'me' as const, text, at: now + 1 },
        ],
      }
      return { ...state, capsules: [capsule, ...state.capsules] }
    }
    case 'setFree':
      return state.me ? { ...state, me: { ...state.me, freeUntil: action.until ?? undefined } } : state
    case 'invite': {
      // Спонтанное приглашение из «Свободны сейчас»: сообщение в капсулу с человеком, при необходимости новая капсула.
      const existing = state.capsules.find((c) => c.personId === action.personId && c.status !== 'met')
      if (existing) {
        return { ...state, capsules: state.capsules.map((c) => (c.id === existing.id ? { ...c, messages: [...c.messages, { id: uid(), from: 'me', text: action.text, at: now }, { id: uid(), from: 'them', text: 'Да, я как раз рядом! Давай через 20 минут?', at: now + 1 }] } : c)) }
      }
      const capsule = {
        id: uid(), personId: action.personId, activityId: '', createdAt: now, expiresAt: now + CAPSULE_TTL, status: 'active' as const, unread: 1,
        messages: [
          { id: uid(), from: 'system' as const, text: 'Спонтанная капсула: вы оба свободны прямо сейчас.', at: now },
          { id: uid(), from: 'me' as const, text: action.text, at: now + 1 },
          { id: uid(), from: 'them' as const, text: 'О, давай! Я минутах в 15 от тебя. Где встречаемся?', at: now + 2 },
        ],
      }
      return { ...state, capsules: [capsule, ...state.capsules] }
    }
    case 'startSafety':
      return {
        ...state, safety: action.safety,
        me: state.me ? { ...state.me, trustedContact: action.safety.contact } : state.me,
        capsules: state.capsules.map((c) => (c.id === action.safety.capsuleId ? { ...c, messages: [...c.messages, { id: uid(), from: 'system', text: 'Вы на встрече. Таймер безопасности включён — собеседник об этом не узнает.', at: now }] } : c)),
      }
    case 'extendSafety':
      return state.safety ? { ...state, safety: { ...state.safety, until: Math.max(state.safety.until, now) + action.minutes * 60_000 } } : state
    case 'endSafety':
      return { ...state, safety: null }
    case 'checkIn':
      return {
        ...state,
        me: state.me ? { ...state.me, meetings: state.me.meetings + 1 } : state.me,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId
            ? { ...c, status: 'met', messages: [...c.messages, { id: uid(), from: 'system', text: 'Встреча подтверждена кодами — оба пришли. +1 к надёжности у обоих.', at: now }] }
            : c,
        ),
      }
    case 'setRemember':
      return { ...state, remember: action.remember }
    case 'toggleFollow':
      return { ...state, following: toggle(state.following ?? [], action.personId) }
    case 'seeStory':
      return state.seenStories.includes(action.personId) ? state : { ...state, seenStories: [...state.seenStories, action.personId] }
  }
}

function load(): State {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) sessionStorage.setItem(SESSION_KEY, '1')
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === 2) {
        // Без «Запомнить меня» вход живёт до закрытия браузера: новая сессия — снова экран входа.
        let sameSession = false
        try { sameSession = sessionStorage.getItem(SESSION_KEY) === '1'; sessionStorage.setItem(SESSION_KEY, '1') } catch { /* нет sessionStorage */ }
        if (parsed.remember === false && !sameSession && parsed.me) return { ...parsed, savedMe: parsed.me, me: null }
        return parsed
      }
    }
  } catch {
    /* хранилище недоступно — работаем на демо-данных */
  }
  return seedState()
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore вне StoreProvider')
  return ctx
}

/** Текущее время, обновляемое раз в секунду — для таймеров капсул. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
