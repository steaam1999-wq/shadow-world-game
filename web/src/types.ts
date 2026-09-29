export type VibeAnswers = Record<string, string>

export interface Person {
  id: string
  name: string
  age: number
  hue: number
  bio: string
  district: string
  distanceKm: number
  answers: VibeAnswers
  tags: string[]
  verified: boolean
  meetings: number
}

export interface Me {
  name: string
  age: number
  hue: number
  bio: string
  district: string
  answers: VibeAnswers
  tags: string[]
  verified: boolean
  meetings: number
  authMethod: 'telegram' | 'google' | 'phone'
  privacy: { showExactAge: boolean; hideFromContacts: boolean; approxLocation: boolean }
  radiusKm: number
  photo?: string
  freeUntil?: number // «Свободен сейчас» до этого времени
  trustedContact?: string // кому сообщить, если встреча пошла не так
}

export interface Activity {
  id: string
  authorId: string // 'me' для собственных
  title: string
  category: string
  area: string // публичное, приблизительное место
  exactPlace: string // открывается только после мэтча
  startsAt: number
  durationMin: number
  expiresAt: number
  x: number // координаты на схеме города, 0..100
  y: number
  photo?: string // data URL загруженного фото; без него рисуется обложка категории
  timeHidden?: boolean // автор не показывает время — договорятся в капсуле
  groupSize?: number // групповой план: сколько всего человек, включая автора (3–4)
  members?: string[] // кто уже присоединился (personId или 'me'), без автора
}

export type CapsuleStatus = 'active' | 'agreed' | 'contacts' | 'met'

export interface Message {
  id: string
  from: 'me' | 'them' | 'system'
  text: string
  at: number
}

export interface Capsule {
  id: string
  personId: string
  activityId: string
  createdAt: number
  expiresAt: number
  status: CapsuleStatus
  messages: Message[]
  unread: number
  again?: 'yes' | 'no' // мой тайный ответ «хочу встретиться ещё»
}

export interface Report {
  id: string
  personId: string
  reason: string
  text: string
  at: number
  state: 'open' | 'resolved' | 'banned'
}

export interface Verification {
  id: string
  name: string
  age: number
  hue: number
  method: string
  gesture: string
  at: number
  state: 'pending' | 'approved' | 'rejected'
}

export interface State {
  version: number
  me: Me | null
  people: Person[]
  activities: Activity[]
  capsules: Capsule[]
  liked: string[] // activityId, на которые я откликнулся
  hearts: string[] // activityId, которые я лайкнул
  saved: string[]
  seenStories: string[] // personId
  categories: string[]
  tags: string[]
  reports: Report[]
  verifications: Verification[]
  announcement: string | null
  dismissedAnnouncement: string | null
  following?: string[] // personId, на кого я подписан
  safety?: Safety | null // идёт встреча с таймером безопасности
  remember?: boolean // «Запомнить меня»: false — выход при закрытии браузера
  savedMe?: Me | null // профиль последнего входа: «Войти» без бэкенда возвращает его
}

export interface Safety {
  capsuleId: string
  personId: string
  place: string
  contact: string
  startedAt: number
  until: number
}
