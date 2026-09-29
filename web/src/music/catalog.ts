import type { Genre, Track } from './engine'

export const GENRE_BPM: Record<Genre, number> = {
  indie: 118, electro: 124, jazz: 96, hiphop: 86, lofi: 78, synthwave: 100, house: 122, ambient: 70, bossa: 128, dnb: 172, funk: 104,
}

export const GENRE_LABEL: Record<Track['genre'], string> = {
  indie: 'Инди', electro: 'Электроника', jazz: 'Джаз', hiphop: 'Хип-хоп', lofi: 'Лоу-фай', synthwave: 'Синтвейв',
  house: 'Хаус', ambient: 'Эмбиент', bossa: 'Босса-нова', dnb: 'Драм-н-бейс', funk: 'Фанк', file: 'Ваш файл',
}
