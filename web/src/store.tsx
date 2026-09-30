import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { CAPSULE_TTL, QUICK_REPLIES, seedState } from './data'
import type { Activity, Capsule, CapsuleStatus, Me, Notice, NowPlaying, Person, PlanComment, Report, Short, Safety, State, Verification } from './types'
import { cloudEffect, requestReload } from './cloud/sync'

const STORAGE_KEY = 'iskra-state'
const SESSION_KEY = 'iskra-session'

export type Action =
  | { type: 'signIn'; me: Me }
  | { type: 'updateMe'; patch: Partial<Me> }
  | { type: 'signOut' }
  | { type: 'forgetSaved' }
  | { type: 'reset' }
  | { type: 'respond'; activityId: string; text?: string; capsuleId?: string }
  | { type: 'createActivity'; activity: Omit<Activity, 'id' | 'authorId'>; id?: string }
  | { type: 'deleteActivity'; activityId: string }
  | { type: 'send'; capsuleId: string; text: string }
  | { type: 'reply'; capsuleId: string }
  | { type: 'setStatus'; capsuleId: string; status: CapsuleStatus }
  | { type: 'readCapsule'; capsuleId: string }
  | { type: 'sendPhoto'; capsuleId: string; photo: string; text?: string }
  | { type: 'deleteMessage'; capsuleId: string; messageId: string }
  | { type: 'hideChat'; capsuleId: string }
  | { type: 'repost'; activityId: string }
  | { type: 'nowPlaying'; value: NowPlaying | null }
  | { type: 'cloudMessage'; capsuleId: string; id: string; mine: boolean; text: string; at: number }
  | { type: 'report'; personId: string; reason: string; text: string; shortId?: string }
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
  | { type: 'toggleShortHeart'; shortId: string }
  | { type: 'seeNotices' }
  | { type: 'setRemember'; remember: boolean }
  | { type: 'setFree'; until: number | null }
  | { type: 'invite'; personId: string; text: string }
  | { type: 'startSafety'; safety: Safety }
  | { type: 'extendSafety'; minutes: number }
  | { type: 'endSafety' }
  | { type: 'checkIn'; capsuleId: string }
  | { type: 'wantAgain'; capsuleId: string; want: boolean }
  | { type: 'directMessage'; personId: string; capsuleId?: string; text?: string }
  | { type: 'block'; personId: string; name: string }
  | { type: 'addComment'; planId: string; text: string }
  | { type: 'deleteComment'; id: string }
  | { type: 'addShortComment'; shortId: string; text: string }
  | { type: 'deleteShortComment'; id: string }
  | { type: 'unblock'; personId: string }
  | { type: 'cloudSignIn'; userId: string; email: string }
  | { type: 'cloudLoad'; me: Me | null; people: Person[]; activities: Activity[]; capsules: Capsule[]; blocked?: { id: string; name: string }[]; isAdmin?: boolean; verification?: State['verification']; comments?: PlanComment[]; shortComments?: PlanComment[]; shorts?: Short[]; social?: Social; settings?: { announcement: string | null; categories: string[] | null; tags: string[] | null; registrationOpen: boolean } }
  | { type: 'verificationSent' }
  | { type: 'cloudError'; message: string | null }

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

// Демо: кто из собеседников втайне не захочет второй встречи.
const PARTNER_NO = ['p3', 'p8']

const uid = () => Math.random().toString(36).slice(2, 10)

const STATUS_TEXT: Record<CapsuleStatus, string> = {
  active: 'Статус встречи сброшен.',
  agreed: 'Вы договорились о встрече.',
  contacts: 'Вы обменялись контактами.',
  met: 'Встреча состоялась. +1 к уровню доверия у обоих.',
}

/** Лайки и подписки с сервера: мои отметки, счётчики и уведомления. */
export interface Social {
  hearts: string[]; shortHearts: string[]; saved: string[]; following: string[]
  likeCounts: Record<string, number>; followers: Record<string, number>; notices: Notice[]
  followersOf: Record<string, string[]> // personId ('me' — я) → кто подписан
  followingOf: Record<string, string[]> // personId ('me' — я) → на кого подписан
}

function bump(counts: Record<string, number> | undefined, id: string, d: number) {
  if (!counts) return counts
  return { ...counts, [id]: Math.max(0, (counts[id] ?? 0) + d) }
}

function reducer(state: State, action: Action): State {
  const now = Date.now()
  switch (action.type) {
    case 'signIn':
      return { ...state, me: action.me, savedMe: action.me }
    case 'updateMe':
      return state.me ? { ...state, me: { ...state.me, ...action.patch }, savedMe: { ...state.me, ...action.patch } } : state
    case 'signOut':
      if (state.cloud) return { ...seedState(), remember: state.remember, savedMe: state.me ?? state.savedMe, cloud: null }
      return { ...state, me: null, savedMe: state.me ?? state.savedMe }
    case 'reset':
      // Демо-данные сбрасываем, но последний вход оставляем — чтобы предложить его на экране входа.
      return { ...seedState(), savedMe: state.me ?? state.savedMe, remember: state.remember }
    case 'forgetSaved':
      return { ...state, savedMe: null }
    case 'respond': {
      if (state.liked.includes(action.activityId)) return state
      const activity = state.activities.find((a) => a.id === action.activityId)
      if (!activity) return state
      const isGroup = !!activity.groupSize
      if (isGroup && (activity.members?.length ?? 0) + 1 >= activity.groupSize!) return state // мест нет
      const others = (activity.members ?? []).map((id) => state.people.find((p) => p.id === id)?.name).filter(Boolean)
      const author = state.people.find((p) => p.id === activity.authorId)?.name ?? 'организатор'
      const capsule = {
        id: action.capsuleId ?? uid(),
        personId: activity.authorId,
        activityId: activity.id,
        createdAt: now,
        expiresAt: now + CAPSULE_TTL,
        status: 'active' as const,
        unread: 1,
        messages: [
          { id: uid(), from: 'system' as const, text: 'Чат открыт. Договоритесь о встрече — точное место уже здесь.', at: now },
          { id: uid(), from: 'system' as const, text: `Точное место: ${activity.exactPlace}`, at: now },
          ...(isGroup ? [{ id: uid(), from: 'system' as const, text: `Вы в компании: ${[author, ...others, 'вы'].join(', ')}. Пока переписка с организатором, общий чат компании — в рабочей версии.`, at: now }] : []),
          ...(action.text ? [{ id: uid(), from: 'me' as const, text: action.text, at: now + 1 }] : []),
          // В демо собеседник отвечает сам; на сервере ответит живой человек.
          ...(state.cloud ? [] : [{ id: uid(), from: 'them' as const, text: 'Привет! План в силе. Во сколько тебе удобно подойти?', at: now + 2 }]),
        ].filter((m) => !(state.cloud && m.text.startsWith('Точное место: ') && !activity.exactPlace)),
      }
      const activities = isGroup ? state.activities.map((a) => (a.id === activity.id ? { ...a, members: [...(a.members ?? []), 'me'] } : a)) : state.activities
      return { ...state, activities, liked: [...state.liked, activity.id], capsules: [capsule, ...state.capsules] }
    }
    case 'wantAgain': {
      // Ответ тайный: собеседник узнает о «да» только при взаимности, об отказе — никогда.
      const c = state.capsules.find((x) => x.id === action.capsuleId)
      if (!c || c.again) return state
      const partnerWants = !state.cloud && !PARTNER_NO.includes(c.personId)
      const both = action.want && partnerWants
      const text = both
        ? 'Совпало: вы оба хотите встретиться ещё! Договоритесь о второй встрече.'
        : action.want ? 'Ответ записан. Если собеседник тоже захочет — мы сразу скажем. Отказы никому не показываем.' : 'Ответ записан. Собеседник об этом не узнает.'
      return {
        ...state,
        capsules: state.capsules.map((x) => (x.id === c.id ? {
          ...x, again: action.want ? 'yes' : 'no',
          ...(both ? { status: 'active' as const, createdAt: now, expiresAt: now + CAPSULE_TTL } : {}),
          messages: [...x.messages, { id: uid(), from: 'system' as const, text, at: now }, ...(both ? [{ id: uid(), from: 'them' as const, text: 'Ура! Мне тоже было очень классно. Куда пойдём в этот раз?', at: now + 1 }] : [])],
        } : x)),
      }
    }
    case 'createActivity':
      return { ...state, activities: [{ ...action.activity, id: action.id ?? uid(), authorId: 'me' }, ...state.activities] }
    case 'deleteActivity':
      return { ...state, activities: state.activities.filter((a) => a.id !== action.activityId) }
    case 'send':
      return {
        ...state,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId ? { ...c, hidden: false, messages: [...c.messages, { id: uid(), from: 'me', text: action.text, at: now }] } : c,
        ),
      }
    case 'nowPlaying':
      return state.me ? { ...state, me: { ...state.me, nowPlaying: action.value } } : state
    case 'cloudMessage': {
      // Новое сообщение пришло по живому каналу — показываем сразу, не дожидаясь полной перезагрузки.
      const c = state.capsules.find((x) => x.id === action.capsuleId)
      if (!c || c.messages.some((m) => m.id === action.id)) return state
      // Своё сообщение уже на экране (временный id) — полная перезагрузка заменит его.
      if (action.mine) return state
      return {
        ...state,
        capsules: state.capsules.map((x) => x.id === c.id ? { ...x, hidden: false, messages: [...x.messages, { id: action.id, from: 'them' as const, text: action.text, at: action.at }], unread: x.unread + 1 } : x),
      }
    }
    case 'reply':
      return {
        ...state,
        capsules: state.capsules.map((c) =>
          c.id === action.capsuleId
            ? { ...c, theirReadAt: now, messages: [...c.messages, { id: uid(), from: 'them', text: QUICK_REPLIES[Math.floor(Math.random() * QUICK_REPLIES.length)], at: now }] }
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
    case 'sendPhoto':
      return {
        ...state,
        capsules: state.capsules.map((c) => c.id === action.capsuleId ? { ...c, hidden: false, messages: [...c.messages, { id: uid(), from: 'me' as const, text: action.text ?? '', photo: action.photo, at: now }] } : c),
      }
    case 'repost':
      return state // запись на сервер — в cloud/sync
    case 'hideChat':
      return { ...state, capsules: state.capsules.map((c) => (c.id === action.capsuleId ? { ...c, hidden: true, messages: [], unread: 0 } : c)) }
    case 'deleteMessage':
      return { ...state, capsules: state.capsules.map((c) => c.id === action.capsuleId ? { ...c, messages: c.messages.filter((m) => m.id !== action.messageId) } : c) }
    case 'readCapsule':
      return {
        ...state,
        capsules: state.capsules.map((c) => (c.id === action.capsuleId ? { ...c, unread: 0 } : c)),
        ...(state.cloud ? { cloudRead: { ...state.cloudRead, [action.capsuleId]: now } } : {}),
      }
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
    case 'toggleHeart': {
      const on = !state.hearts.includes(action.activityId)
      return { ...state, hearts: toggle(state.hearts, action.activityId), likeCounts: bump(state.likeCounts, action.activityId, on ? 1 : -1) }
    }
    case 'heart':
      return state.hearts.includes(action.activityId) ? state : { ...state, hearts: [...state.hearts, action.activityId], likeCounts: bump(state.likeCounts, action.activityId, 1) }
    case 'toggleShortHeart': {
      const on = !(state.shortHearts ?? []).includes(action.shortId)
      return { ...state, shortHearts: toggle(state.shortHearts ?? [], action.shortId), likeCounts: bump(state.likeCounts, action.shortId, on ? 1 : -1) }
    }
    case 'seeNotices':
      return { ...state, noticesSeenAt: now }
    case 'toggleSave':
      return { ...state, saved: toggle(state.saved, action.activityId) }
    case 'share': {
      // Пересланный план попадает в капсулу с человеком; если её нет — открываем новую.
      const activity = state.activities.find((x) => x.id === action.activityId)
      if (!activity) return state
      const text = `Смотри, какой план: «${activity.title}» — ${activity.area}`
      const existing = state.capsules.find((c) => c.personId === action.personId)
      if (!existing && state.cloud) return state // на сервере капсула открывается только откликом на план
      if (existing) {
        return { ...state, capsules: state.capsules.map((c) => (c.id === existing.id ? { ...c, messages: [...c.messages, { id: uid(), from: 'me', text, at: now }] } : c)) }
      }
      const capsule = {
        id: uid(), personId: action.personId, activityId: activity.id, createdAt: now, expiresAt: now + CAPSULE_TTL, status: 'active' as const, unread: 0,
        messages: [
          { id: uid(), from: 'system' as const, text: 'Чат открыт. Договоритесь о встрече — точное место уже здесь.', at: now },
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
          { id: uid(), from: 'system' as const, text: 'Вы оба свободны прямо сейчас.', at: now },
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
    case 'toggleFollow': {
      const on = !(state.following ?? []).includes(action.personId)
      const list = state.followersOf?.[action.personId] ?? []
      return {
        ...state, following: toggle(state.following ?? [], action.personId), followers: bump(state.followers, action.personId, on ? 1 : -1),
        ...(state.followersOf ? { followersOf: { ...state.followersOf, [action.personId]: on ? [...list, 'me'] : list.filter((x) => x !== 'me') } } : {}),
        ...(state.followingOf ? { followingOf: { ...state.followingOf, me: on ? [...(state.followingOf.me ?? []), action.personId] : (state.followingOf.me ?? []).filter((x) => x !== action.personId) } } : {}),
      }
    }
    case 'seeStory':
      return state.seenStories.includes(action.personId) ? state : { ...state, seenStories: [...state.seenStories, action.personId] }
    case 'directMessage': {
      // Личная переписка из профиля: одна на пару людей, без привязки к плану.
      const msg = action.text ? [{ id: uid(), from: 'me' as const, text: action.text, at: now }] : []
      const existing = state.capsules.find((c) => c.personId === action.personId)
      if (existing) return { ...state, capsules: state.capsules.map((c) => (c.id === existing.id ? { ...c, messages: [...c.messages, ...msg] } : c)) }
      const capsule = {
        id: action.capsuleId ?? uid(), personId: action.personId, activityId: '', createdAt: now, expiresAt: now + CAPSULE_TTL, status: 'active' as const, unread: 0,
        messages: [{ id: uid(), from: 'system' as const, text: 'Личная переписка.', at: now }, ...msg],
      }
      return { ...state, capsules: [capsule, ...state.capsules] }
    }
    case 'block': {
      const gone = (id: string) => id === action.personId
      return {
        ...state,
        people: state.people.filter((p) => !gone(p.id)),
        activities: state.activities.filter((a) => !gone(a.authorId)),
        capsules: state.capsules.filter((c) => !gone(c.personId)),
        comments: (state.comments ?? []).filter((c) => !gone(c.authorId)),
        blocked: [...(state.blocked ?? []).filter((b) => !gone(b.id)), { id: action.personId, name: action.name }],
      }
    }
    case 'addComment':
      return { ...state, comments: [...(state.comments ?? []), { id: `tmp-${uid()}`, planId: action.planId, authorId: 'me', text: action.text, at: now }] }
    case 'deleteComment':
      return { ...state, comments: (state.comments ?? []).filter((c) => c.id !== action.id) }
    case 'addShortComment':
      return { ...state, shortComments: [...(state.shortComments ?? []), { id: `tmp-${uid()}`, planId: action.shortId, authorId: 'me', text: action.text, at: now }] }
    case 'deleteShortComment':
      return { ...state, shortComments: (state.shortComments ?? []).filter((c) => c.id !== action.id) }
    case 'verificationSent':
      return { ...state, verification: 'pending' }
    case 'unblock':
      return { ...state, blocked: (state.blocked ?? []).filter((b) => b.id !== action.personId) }
    case 'cloudSignIn':
      // Демо-данные на время входа через сервер не нужны: люди, планы и капсулы придут из базы.
      return { ...state, cloud: { userId: action.userId, email: action.email }, people: [], activities: [], capsules: [], liked: [], hearts: [], saved: [], following: [], seenStories: [], blocked: [], isAdmin: false, verification: null, comments: [], shorts: [], cloudError: null }
    case 'cloudLoad':
      if (!state.cloud) return state
      return {
        ...state,
        people: action.people, activities: action.activities, capsules: action.capsules,
        ...(action.blocked ? { blocked: action.blocked } : {}), ...(action.isAdmin !== undefined ? { isAdmin: action.isAdmin } : {}),
        ...(action.verification !== undefined ? { verification: action.verification } : {}),
        ...(action.comments ? { comments: action.comments } : {}),
        ...(action.shorts ? { shorts: action.shorts } : {}),
        ...(action.shortComments ? { shortComments: action.shortComments } : {}),
        ...(action.social ?? {}),
        // Настройки из админки: объявление для всех, категории планов и интересы.
        ...(action.settings ? { registrationOpen: action.settings.registrationOpen, announcement: action.settings.announcement, ...(action.settings.categories ? { categories: action.settings.categories } : {}), ...(action.settings.tags ? { tags: action.settings.tags } : {}) } : {}),
        liked: action.capsules.map((c) => c.activityId),
        ...(action.me ? { me: action.me, savedMe: action.me } : {}),
      }
    case 'cloudError':
      return { ...state, cloudError: action.message }
  }
}

function load(): State {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) sessionStorage.setItem(SESSION_KEY, '1')
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      let parsed = JSON.parse(raw) as State
      // Демо переехало из Москвы в Минск: обновляем демо-людей, их планы и переписку, свои планы оставляем.
      if (parsed.version === 2 && !parsed.cloud && parsed.people?.some((p) => p.district === 'Чистые пруды')) {
        const seed = seedState()
        parsed = { ...parsed, people: seed.people, capsules: seed.capsules, activities: [...seed.activities, ...parsed.activities.filter((x) => x.authorId === 'me')] }
      }
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
  const [state, baseDispatch] = useReducer(reducer, undefined, load)
  const ref = useRef(state)
  useEffect(() => { ref.current = state })
  // При входе через сервер действие сначала меняет экран (оптимистично), затем уходит в базу;
  // после записи данные перечитываются, и на экране остаётся то, что реально сохранилось.
  const dispatch = useCallback((a: Action) => {
    const before = ref.current
    if (before.cloud) {
      if (a.type === 'createActivity' && !a.id) a = { ...a, id: crypto.randomUUID() }
      if ((a.type === 'respond' || a.type === 'directMessage') && !a.capsuleId) a = { ...a, capsuleId: crypto.randomUUID() }
      const job = cloudEffect(a, before)
      if (job) job.then(requestReload, (e: Error) => { baseDispatch({ type: 'cloudError', message: e.message }); requestReload() })
    }
    // Следующее действие в том же обработчике должно видеть результат этого (например, выход, потом демо).
    ref.current = reducer(before, a)
    baseDispatch(a)
  }, [])
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
