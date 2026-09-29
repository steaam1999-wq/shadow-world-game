import type { Activity, Capsule, Person, Report, State, Verification } from './types'

export const HOUR = 3_600_000
export const CAPSULE_TTL = 72 * HOUR

export interface VibeQuestion {
  id: string
  title: string
  options: { id: string; label: string; hint: string; glyph: string }[]
}

// Глифы — короткие «пиктограммы» в духе афиш, без эмодзи.
export const VIBE_QUESTIONS: VibeQuestion[] = [
  {
    id: 'evening',
    title: 'Идеальный вечер пятницы',
    options: [
      { id: 'concert', label: 'Концерт', hint: 'Громко и в толпе', glyph: '♫' },
      { id: 'home', label: 'Кино дома', hint: 'Плед и хороший фильм', glyph: '▶' },
      { id: 'bar', label: 'Бар с друзьями', hint: 'Разговоры до закрытия', glyph: '◐' },
      { id: 'walk', label: 'Прогулка', hint: 'Город ночью', glyph: '↗' },
    ],
  },
  {
    id: 'music',
    title: 'Что играет в наушниках',
    options: [
      { id: 'indie', label: 'Инди и рок', hint: 'Гитары', glyph: '≋' },
      { id: 'electro', label: 'Электроника', hint: 'Бит и синты', glyph: '∿' },
      { id: 'jazz', label: 'Джаз и соул', hint: 'Саксофон и винил', glyph: '◎' },
      { id: 'hiphop', label: 'Хип-хоп', hint: 'Рифмы и флоу', glyph: '▲' },
    ],
  },
  {
    id: 'coffee',
    title: 'Ваши отношения с кофе',
    options: [
      { id: 'espresso', label: 'Эспрессо', hint: 'Без сахара, стоя', glyph: '●' },
      { id: 'raf', label: 'Раф на кокосовом', hint: 'Сладко и большой', glyph: '◉' },
      { id: 'tea', label: 'Только чай', hint: 'Пуэр, улун, травы', glyph: '◇' },
      { id: 'excuse', label: 'Повод выйти', hint: 'Главное — компания', glyph: '○' },
    ],
  },
  {
    id: 'sport',
    title: 'Спорт в вашей жизни',
    options: [
      { id: 'run', label: 'Бег по утрам', hint: '5 км до завтрака', glyph: '»' },
      { id: 'yoga', label: 'Йога', hint: 'Растяжка и дыхание', glyph: '∞' },
      { id: 'team', label: 'Командные игры', hint: 'Футбол, волейбол', glyph: '⬡' },
      { id: 'sofa', label: 'С дивана', hint: 'Болею за своих', glyph: '▭' },
    ],
  },
  {
    id: 'weekend',
    title: 'Выходные — это…',
    options: [
      { id: 'outdoor', label: 'За город', hint: 'Лес, дача, байдарки', glyph: '△' },
      { id: 'museum', label: 'Выставки', hint: 'Музеи и галереи', glyph: '▦' },
      { id: 'sleep', label: 'Отсыпаюсь', hint: 'До полудня минимум', glyph: '☾' },
      { id: 'spont', label: 'Спонтанно', hint: 'Решу утром', glyph: '✦' },
    ],
  },
  {
    id: 'pace',
    title: 'Как вам комфортнее знакомиться',
    options: [
      { id: 'fast', label: 'Сразу встретиться', hint: 'Зачем тянуть', glyph: '⚡' },
      { id: 'talk', label: 'Сначала поболтать', hint: 'Пара сообщений', glyph: '…' },
      { id: 'group', label: 'В компании', hint: 'Групповые встречи', glyph: '⁂' },
      { id: 'depends', label: 'По ситуации', hint: 'Как пойдёт', glyph: '≈' },
    ],
  },
]

export const DEFAULT_CATEGORIES = ['Кофе', 'Выставка', 'Прогулка', 'Концерт', 'Спорт', 'Еда', 'Кино', 'Настолки']
export const DEFAULT_TAGS = ['Кофе', 'Выставки', 'Музыка', 'Спорт', 'Прогулки', 'Кино', 'Еда', 'Настолки', 'Театр', 'Книги', 'Путешествия', 'Фото']


// Координаты районов на схеме города (0..100).
export const DISTRICT_XY: Record<string, [number, number]> = {
  'Чистые пруды': [62, 30], 'Патриаршие': [28, 38], 'Китай-город': [58, 42], 'Хамовники': [22, 78],
  'Замоскворечье': [52, 64], 'Басманный': [74, 34], 'Таганка': [72, 58], 'Парк Горького': [38, 84],
}

export const DISTRICTS = ['Чистые пруды', 'Патриаршие', 'Китай-город', 'Хамовники', 'Замоскворечье', 'Басманный', 'Таганка', 'Парк Горького']

const P = (
  id: string, name: string, age: number, hue: number, district: string, distanceKm: number,
  bio: string, answers: string[], tags: string[], verified: boolean, meetings: number,
): Person => ({
  id, name, age, hue, district, distanceKm, bio, tags, verified, meetings,
  answers: Object.fromEntries(VIBE_QUESTIONS.map((q, i) => [q.id, answers[i]])),
})

const PEOPLE: Person[] = [
  P('p1', 'Алина', 26, 18, 'Чистые пруды', 1.2, 'Дизайнер шрифтов. Ищу, с кем обсудить выставку и не спорить про Helvetica.', ['walk', 'indie', 'espresso', 'yoga', 'museum', 'fast'], ['Выставки', 'Кофе', 'Книги'], true, 7),
  P('p2', 'Максим', 29, 210, 'Китай-город', 2.4, 'Бэкенд-разработчик, по вечерам играю в настолки и пеку хлеб.', ['bar', 'electro', 'excuse', 'team', 'spont', 'group'], ['Настолки', 'Еда', 'Музыка'], true, 12),
  P('p3', 'Вера', 24, 330, 'Патриаршие', 3.1, 'Учусь на реставратора. Люблю утренний бег по набережной и джаз-бары.', ['concert', 'jazz', 'raf', 'run', 'museum', 'talk'], ['Музыка', 'Спорт', 'Театр'], false, 2),
  P('p4', 'Тимур', 31, 150, 'Хамовники', 4.0, 'Фотограф. Снимаю город на плёнку, могу показать места без туристов.', ['walk', 'indie', 'espresso', 'sofa', 'outdoor', 'fast'], ['Фото', 'Прогулки', 'Путешествия'], true, 9),
  P('p5', 'Соня', 27, 280, 'Замоскворечье', 2.0, 'Продакт в финтехе. Хожу на стендапы и ищу компанию на скалодром.', ['concert', 'hiphop', 'raf', 'team', 'spont', 'fast'], ['Спорт', 'Кино', 'Еда'], true, 4),
  P('p6', 'Илья', 25, 45, 'Басманный', 1.6, 'Бариста и немного музыкант. Сварю лучший фильтр в районе.', ['home', 'jazz', 'espresso', 'yoga', 'sleep', 'talk'], ['Кофе', 'Музыка', 'Книги'], false, 1),
  P('p7', 'Даша', 28, 0, 'Таганка', 3.5, 'Архитектор. Выходные провожу на байдарках или в Пушкинском.', ['walk', 'indie', 'tea', 'run', 'outdoor', 'depends'], ['Путешествия', 'Выставки', 'Спорт'], true, 6),
  P('p8', 'Артём', 30, 190, 'Парк Горького', 4.8, 'Врач-ординатор. Свободен редко, поэтому зову сразу на конкретное.', ['bar', 'electro', 'excuse', 'run', 'spont', 'fast'], ['Еда', 'Спорт', 'Кино'], true, 3),
]

const ACTS = (now: number): Activity[] => {
  const a = (
    id: string, authorId: string, title: string, category: string, area: string, exactPlace: string,
    inHours: number, durationMin: number, x: number, y: number,
  ): Activity => ({
    id, authorId, title, category, area, exactPlace, durationMin, x, y,
    startsAt: now + inHours * HOUR,
    expiresAt: now + (inHours + durationMin / 60) * HOUR,
  })
  return [
    a('a1', 'p1', 'Иду на выставку Дейнеки, нужен собеседник после', 'Выставка', 'Новая Третьяковка', 'Главный вход, Крымский Вал, 10', 2.5, 120, 44, 70),
    a('a2', 'p2', 'Собираю стол на «Каркассон», не хватает одного', 'Настолки', 'Китай-город', 'Антикафе «Ход конём», 2 этаж', 5, 180, 58, 40),
    a('a3', 'p3', 'Джем-сейшн в баре, первое отделение бесплатно', 'Концерт', 'Патриаршие', 'Бар «Синяя птица», Малая Бронная', 26, 150, 28, 38),
    a('a4', 'p4', 'Фотопрогулка по дворам Хамовников на закате', 'Прогулка', 'Хамовники', 'Выход из м. Фрунзенская, у киоска', 20, 90, 22, 78),
    a('a5', 'p5', 'Скалодром для новичков, возьму второй абонемент', 'Спорт', 'Замоскворечье', 'Скалодром «Трамонтана», ресепшн', 30, 120, 50, 62),
    a('a6', 'p6', 'Пью кофе на Мясницкой, угощу новым зерном из Кении', 'Кофе', 'Чистые пруды', 'Кофейня у «Тургеневской», за стойкой', 1, 60, 62, 30),
    a('a7', 'p7', 'Кино под открытым небом: «Амели», есть лишний плед', 'Кино', 'Таганка', 'Крыша ДК «Таганка», вход со двора', 44, 150, 72, 55),
    a('a8', 'p8', 'Грузинская кухня после смены, ищу компанию на хинкали', 'Еда', 'Парк Горького', 'Ресторан у входа в парк, веранда', 3, 90, 38, 84),
  ].map((x) => (x.id === 'a2' ? { ...x, groupSize: 4, members: ['p5'] } : x.id === 'a7' ? { ...x, groupSize: 4, members: ['p3', 'p6'] } : x))
}

const CAPSULES = (now: number): Capsule[] => [
  {
    id: 'c1', personId: 'p1', activityId: 'a1', createdAt: now - 14 * HOUR, expiresAt: now - 14 * HOUR + CAPSULE_TTL,
    status: 'agreed', unread: 1,
    messages: [
      { id: 'm1', from: 'system', text: 'Чат открыт. Договоритесь о встрече — точное место уже здесь.', at: now - 14 * HOUR },
      { id: 'm2', from: 'me', text: 'Привет! Дейнека — любовь. Во сколько идёшь?', at: now - 13.9 * HOUR },
      { id: 'm3', from: 'them', text: 'Думаю к шести. Потом можно на Крымскую набережную.', at: now - 13 * HOUR },
      { id: 'm4', from: 'system', text: 'Вы договорились о встрече.', at: now - 12.8 * HOUR },
      { id: 'm5', from: 'them', text: 'Я буду в зелёной куртке у главного входа.', at: now - 1 * HOUR },
    ],
  },
  {
    id: 'c2', personId: 'p6', activityId: 'a6', createdAt: now - 67 * HOUR, expiresAt: now - 67 * HOUR + CAPSULE_TTL,
    status: 'active', unread: 0,
    messages: [
      { id: 'm1', from: 'system', text: 'Чат открыт. Договоритесь о встрече — точное место уже здесь.', at: now - 67 * HOUR },
      { id: 'm2', from: 'them', text: 'Привет! Зерно из Кении приехало, заходи попробовать.', at: now - 66 * HOUR },
      { id: 'm3', from: 'me', text: 'Звучит отлично. Какие дни у тебя свободны?', at: now - 40 * HOUR },
    ],
  },
  {
    id: 'c3', personId: 'p4', activityId: 'a4', createdAt: now - 80 * HOUR, expiresAt: now - 8 * HOUR,
    status: 'active', unread: 0,
    messages: [
      { id: 'm1', from: 'system', text: 'Чат открыт. Договоритесь о встрече — точное место уже здесь.', at: now - 80 * HOUR },
      { id: 'm2', from: 'me', text: 'Привет! Давно хочу научиться снимать на плёнку.', at: now - 79 * HOUR },
    ],
  },
]

const REPORTS = (now: number): Report[] => [
  { id: 'r1', personId: 'p8', reason: 'Спам', text: 'Отправляет ссылку на телеграм-канал в каждом чате.', at: now - 3 * HOUR, state: 'open' },
  { id: 'r2', personId: 'p3', reason: 'Фото не совпадает', text: 'На встрече был другой человек, не как на фото.', at: now - 20 * HOUR, state: 'open' },
  { id: 'r3', personId: 'p2', reason: 'Грубость', text: 'Оскорбил после отказа встретиться.', at: now - 50 * HOUR, state: 'resolved' },
]

const VERIFICATIONS = (now: number): Verification[] => [
  { id: 'v1', name: 'Кирилл', age: 27, hue: 120, method: 'Telegram', gesture: 'Два пальца у виска', at: now - 0.5 * HOUR, state: 'pending' },
  { id: 'v2', name: 'Полина', age: 23, hue: 300, method: 'Телефон', gesture: 'Ладонь у подбородка', at: now - 2 * HOUR, state: 'pending' },
  { id: 'v3', name: 'Олег', age: 34, hue: 60, method: 'Google', gesture: 'Большой палец вверх', at: now - 5 * HOUR, state: 'pending' },
  { id: 'v4', name: 'Ксения', age: 29, hue: 250, method: 'Telegram', gesture: 'Знак «ок»', at: now - 7 * HOUR, state: 'pending' },
]

export function seedState(now = Date.now()): State {
  return {
    version: 2,
    me: null,
    people: PEOPLE,
    activities: ACTS(now),
    capsules: CAPSULES(now),
    liked: ['a1', 'a6', 'a4'],
    hearts: ['a1'],
    saved: [],
    seenStories: [],
    following: ['p1'],
    categories: DEFAULT_CATEGORIES,
    tags: DEFAULT_TAGS,
    reports: REPORTS(now),
    verifications: VERIFICATIONS(now),
    announcement: null,
    dismissedAnnouncement: null,
  }
}

// Аналитика для админки: 14 дней, демо-данные.
export const ANALYTICS = {
  days: ['15 сен', '16 сен', '17 сен', '18 сен', '19 сен', '20 сен', '21 сен', '22 сен', '23 сен', '24 сен', '25 сен', '26 сен', '27 сен', '28 сен'],
  registrations: [42, 38, 51, 47, 63, 88, 94, 55, 49, 58, 61, 79, 112, 97],
  funnel: [
    { label: 'Отклики на активности', value: 1840 },
    { label: 'Открытые чаты', value: 1126 },
    { label: 'Договорились о встрече', value: 412 },
    { label: 'Встреча состоялась', value: 268 },
  ],
}

export const QUICK_REPLIES = [
  'Отлично, давай так и сделаем!',
  'Я могу чуть позже, минут на 20. Нормально?',
  'Супер. Напишу, когда буду подходить.',
  'Звучит здорово, мне как раз по пути.',
  'Договорились! Если что-то поменяется — напишу.',
]
