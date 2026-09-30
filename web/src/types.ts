import type { Track } from './music/engine'

export type VibeAnswers = Record<string, string>

/** Музыка к плану: трек из интернета и откуда начинается 15-секундный отрывок. */
export interface PlanMusic { track: Track; start: number }

/** Что человек слушает прямо сейчас; `at` — когда это обновлялось. */
export interface NowPlaying { track: Track; at: number }

export interface Person {
  id: string
  name: string
  age: number | null // null — человек не указал дату рождения
  hue: number
  bio: string
  district: string
  distanceKm: number
  answers: VibeAnswers
  tags: string[]
  verified: boolean
  meetings: number
  photo?: string
  songs?: Track[] // сохранённые онлайн-песни, которые видят другие
  nowPlaying?: NowPlaying | null
  freeUntil?: number // «Свободен сейчас» до этого времени (облако)
  noShows?: number // сколько раз не пришёл(ла) на договорённую встречу (облако)
}

export interface Me {
  name: string
  age: number | null // null — человек не указал дату рождения
  hue: number
  bio: string
  district: string
  answers: VibeAnswers
  tags: string[]
  verified: boolean
  meetings: number
  authMethod: 'telegram' | 'google' | 'phone' | 'email'
  privacy: { showExactAge: boolean; hideFromContacts: boolean; approxLocation: boolean; hideSongs?: boolean; hideNowPlaying?: boolean }
  radiusKm: number
  birthDate?: string // ГГГГ-ММ-ДД, видна только самому человеку
  photo?: string
  photoPath?: string // где фото лежит в хранилище (облако)
  songs?: Track[]
  nowPlaying?: NowPlaying | null
  freeUntil?: number // «Свободен сейчас» до этого времени
  noShows?: number // мои пропущенные встречи по отметкам других
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
  music?: PlanMusic // 15 секунд песни к плану
}

export type CapsuleStatus = 'active' | 'agreed' | 'contacts' | 'met'

export interface Message {
  id: string
  from: 'me' | 'them' | 'system'
  text: string
  at: number
  photo?: string // ссылка на фото или data URL, пока отправляется
  photoPath?: string // путь фото в хранилище чата (облако)
}

/** Групповой чат. Сообщения — как в личном чате, у чужих указан автор (senderId). */
export interface Group {
  id: string
  title: string
  ownerId: string // 'me' или personId
  members: string[] // другие участники (personId), без меня
  messages: (Message & { senderId?: string })[]
  unread: number
  createdAt: number
  planId?: string // чат компании группового плана
  othersReadAt?: number // когда кто-то из участников последний раз открывал группу — для «прочитано»
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
  theirReadAt?: number // когда собеседник последний раз открывал чат — для галочек «прочитано»
  hidden?: boolean // я удалил чат у себя и новых сообщений пока нет
  noShow?: boolean // я отметил, что собеседник не пришёл на встречу
}

/** Уведомление: лайк моего плана или публикации, новая подписка. */
export interface Notice {
  id: string
  kind: 'likePlan' | 'likeShort' | 'follow' | 'repost'
  personId: string
  targetId?: string
  at: number
}

/** Шортс: короткое вертикальное видео. */
export interface Short {
  id: string
  authorId: string // personId или 'me'
  url: string
  path?: string // путь файла в хранилище (облако)
  thumb?: string // кадр-превью видео
  thumbPath?: string
  kind: 'video' | 'photo'
  caption: string
  at: number
}

export interface PlanComment {
  id: string
  planId: string
  authorId: string // personId или 'me'
  text: string
  at: number
  replyTo?: string // id комментария, на который отвечают
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
  groups?: Group[] // групповые чаты
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
  cloud?: { userId: string; email: string } | null // вход через сервер (Supabase); null — локальное демо
  cloudError?: string | null
  cloudRead?: Record<string, number> // capsuleId → когда я последний раз открывал переписку
  blocked?: { id: string; name: string }[] // кого я заблокировал
  isAdmin?: boolean
  comments?: PlanComment[] // комментарии под планами
  verification?: 'pending' | 'approved' | 'rejected' | null // моя заявка на верификацию
  shorts?: Short[] // шортсы из облака (демо хранит свои в браузере)
  registrationOpen?: boolean // админ может временно закрыть регистрацию
  shortHearts?: string[] // id публикаций, которые я лайкнул
  shortComments?: PlanComment[] // комментарии к публикациям (planId = id публикации)
  likeCounts?: Record<string, number> // id плана или публикации → число лайков (облако)
  followers?: Record<string, number> // personId ('me' — я) → число подписчиков (облако)
  followersOf?: Record<string, string[]> // personId ('me' — я) → кто подписан (облако)
  followingOf?: Record<string, string[]> // personId ('me' — я) → на кого подписан (облако)
  notices?: Notice[] // кто лайкнул мои планы и публикации, кто подписался
  noticesSeenAt?: number
}

export interface Safety {
  capsuleId: string
  personId: string
  place: string
  contact: string
  startedAt: number
  until: number
}
