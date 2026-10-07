import type { CSSProperties } from 'react'

// Фильтры камеры историй. Хранится только название — фильтр накладывается при показе,
// поэтому одинаково работает и для фото, и для видео на любом телефоне.

export type FilterId = 'none' | 'spark' | 'sunset' | 'minsk' | 'cold' | 'vivid'

export const FILTERS: { id: FilterId; name: string; css: string; overlay?: string }[] = [
  { id: 'none', name: 'Обычный', css: 'none' },
  // Фирменный: тёплое свечение в цветах Komeeta.
  { id: 'spark', name: 'Искра', css: 'saturate(1.25) contrast(1.06) brightness(1.04)', overlay: 'linear-gradient(45deg, rgb(255 196 87 / .28), rgb(255 79 134 / .22) 55%, rgb(154 116 255 / .26))' },
  { id: 'sunset', name: 'Закат', css: 'sepia(.35) saturate(1.45) hue-rotate(-12deg) contrast(1.05)' },
  { id: 'minsk', name: 'Минск ч/б', css: 'grayscale(1) contrast(1.18) brightness(1.03)' },
  { id: 'cold', name: 'Холод', css: 'saturate(.85) hue-rotate(12deg) brightness(1.05) contrast(1.05)', overlay: 'linear-gradient(180deg, rgb(74 168 255 / .16), transparent)' },
  { id: 'vivid', name: 'Ярко', css: 'saturate(1.65) contrast(1.12)' },
]

export const isFilter = (v: unknown): v is FilterId => FILTERS.some((f) => f.id === v)
export const filterOf = (id?: string) => FILTERS.find((f) => f.id === id) ?? FILTERS[0]
export const filterStyle = (id?: string): CSSProperties => { const f = filterOf(id); return f.css === 'none' ? {} : { filter: f.css } }
