import type { Genre, Track } from './engine'

export const GENRE_BPM: Record<Genre, number> = {
  indie: 118, electro: 124, jazz: 96, hiphop: 86, lofi: 78, synthwave: 100, house: 122, ambient: 70, bossa: 128, dnb: 172, funk: 104,
}

export const GENRE_LABEL: Record<Track['genre'], string> = {
  indie: 'Инди', electro: 'Электроника', jazz: 'Джаз', hiphop: 'Хип-хоп', lofi: 'Лоу-фай', synthwave: 'Синтвейв',
  house: 'Хаус', ambient: 'Эмбиент', bossa: 'Босса-нова', dnb: 'Драм-н-бейс', funk: 'Фанк', file: 'Ваш файл',
}

// Оттенок обложки по жанру, чтобы каталог читался с первого взгляда.
const GENRE_HUE: Record<Genre, number> = {
  indie: 24, electro: 200, jazz: 42, hiphop: 280, lofi: 330, synthwave: 300, house: 170, ambient: 230, bossa: 90, dnb: 0, funk: 55,
}

let n = 0
const t = (title: string, artist: string, genre: Genre, bars = 40): Track => {
  n++
  return { id: `c${n}`, title, artist, genre, hue: (GENRE_HUE[genre] + n * 7) % 360, bpm: GENRE_BPM[genre], root: 52 + ((n * 5) % 9), bars }
}

// Вымышленные исполнители; все треки синтезируются в браузере.
export const CATALOG: Track[] = [
  t('Утро на Покровке', 'Пенка', 'lofi'),
  t('Раф без сахара', 'Пенка', 'lofi'),
  t('Дождь на Чистых', 'Тёплый ламповый', 'lofi'),
  t('Кофе навынос', 'Бариста FM', 'bossa'),
  t('Летняя веранда', 'Бариста FM', 'bossa'),
  t('Ипанема на Яузе', 'Сеньорита Москва', 'bossa'),
  t('Первое свидание', 'Смелые', 'indie'),
  t('Сообщение в 2 ночи', 'Смелые', 'indie'),
  t('Крыши Таганки', 'Дворы', 'indie'),
  t('Садовое кольцо', 'Неон 88', 'synthwave'),
  t('Третье транспортное', 'Неон 88', 'synthwave'),
  t('Ночной экспресс', 'Кассета', 'synthwave'),
  t('Суббота, 23:40', 'Кольцевая', 'house'),
  t('Под мостом', 'Кольцевая', 'house'),
  t('Фабрика', 'Резидент', 'house'),
  t('Парк Горького, 6 утра', 'Туман', 'ambient', 24),
  t('Москва-река', 'Туман', 'ambient', 24),
  t('Звёзды над Воробьёвыми', 'Планетарий', 'ambient', 24),
  t('Синяя птица', 'Трио Бронная', 'jazz'),
  t('Бульварное кольцо', 'Трио Бронная', 'jazz'),
  t('Последний сет', 'Контрабас', 'jazz'),
  t('Район', 'МЦК', 'hiphop'),
  t('Пятый подъезд', 'МЦК', 'hiphop'),
  t('Скалодром', 'Хват', 'dnb', 64),
  t('Интервалы', 'Хват', 'dnb', 64),
  t('Пять утра, набережная', 'Темп', 'dnb', 64),
  t('Зеркальный шар', 'Диско-клуб «Искра»', 'funk'),
  t('Танцы на кухне', 'Диско-клуб «Искра»', 'funk'),
  t('Пульс', 'Модуль', 'electro'),
  t('Лофт', 'Модуль', 'electro'),
]

export interface Playlist {
  id: string
  title: string
  subtitle: string
  hue: number
  genres: Genre[]
}

export const PLAYLISTS: Playlist[] = [
  { id: 'date', title: 'Первое свидание', subtitle: 'Чтобы не было неловких пауз', hue: 340, genres: ['indie', 'bossa', 'jazz'] },
  { id: 'coffee', title: 'Кофе утром', subtitle: 'Мягко и без спешки', hue: 28, genres: ['lofi', 'bossa'] },
  { id: 'friday', title: 'Вечер пятницы', subtitle: 'Разогрев перед выходом', hue: 290, genres: ['house', 'funk', 'electro'] },
  { id: 'night', title: 'Ночная Москва', subtitle: 'Такси, неон и Садовое', hue: 260, genres: ['synthwave', 'electro'] },
  { id: 'walk', title: 'Прогулка по набережной', subtitle: 'Под шаг и закат', hue: 200, genres: ['indie', 'ambient', 'lofi'] },
  { id: 'sport', title: 'Тренировка', subtitle: 'Держим темп', hue: 5, genres: ['dnb', 'funk', 'hiphop'] },
]

export function playlistTracks(p: Playlist, pool: Track[] = CATALOG) {
  return pool.filter((x) => x.genre !== 'file' && p.genres.includes(x.genre))
}
