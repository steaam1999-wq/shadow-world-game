// Металлы медалей и рамки за них. Общие для медалей (Achievements) и рамок вокруг фото (ProfileLook).
import type { ProfileStyle } from '../types'

export type Metal = [string, string, string] // светлый, основной, тёмный
export const METALS: Record<string, Metal> = {
  bronze: ['#f0c39a', '#a8693a', '#4e2a10'],
  copper: ['#f4c0a8', '#b86f52', '#55291c'],
  steel: ['#e4e9ee', '#8a94a0', '#353b43'],
  silver: ['#ffffff', '#c3c7cf', '#5c616a'],
  gold: ['#fff0bf', '#cfa040', '#654308'],
  platinum: ['#ffffff', '#dcdfe5', '#787d87'],
  gunmetal: ['#c4c8d0', '#565a62', '#1b1d21'],
}
export const METAL_NAME: Record<string, string> = { bronze: 'Бронза', copper: 'Медь', steel: 'Сталь', silver: 'Серебро', gold: 'Золото', platinum: 'Платина', gunmetal: 'Тёмный металл' }
export const MEDAL: Record<string, { metal: keyof typeof METALS; iridescent?: boolean }> = {
  first_meet: { metal: 'bronze' }, soul: { metal: 'copper' }, reliable: { metal: 'steel' }, guide: { metal: 'silver' },
  regular: { metal: 'gold' }, ambassador: { metal: 'platinum' }, founder: { metal: 'gold' }, collector: { metal: 'gunmetal', iridescent: true },
}

/** Рамки за медали — от самой престижной к простой. Каждая полученная медаль открывает свою рамку. */
export const FRAME_RANK = ['collector', 'founder', 'ambassador', 'regular', 'guide', 'reliable', 'soul', 'first_meet']
export const FRAME_TITLE: Record<string, string> = {
  collector: 'Комета', founder: 'Основатель', ambassador: 'Амбассадор', regular: 'Легенда',
  guide: 'Проводник', reliable: 'Надёжный', soul: 'Душа компании', first_meet: 'Первая встреча',
}

/** Какая рамка у человека: выбранная им (если медаль есть), иначе самая престижная из полученных.
 *  Основатель без данных о медалях — золотая рамка, как раньше. «none» — без рамки. */
export function frameOf(style: ProfileStyle | undefined, medals: string[] | undefined, founder?: number): string | null {
  if (style?.frame === 'none') return null
  const own = FRAME_RANK.filter((c) => medals?.includes(c) || (c === 'founder' && !!founder))
  if (style?.frame && own.includes(style.frame)) return style.frame
  return own[0] ?? null
}

/** Запас вокруг 3D-монеты: она занимает 1/PAD кадра, чтобы края не обрезались и не было видно рамки квадрата. */
export const PAD = 1.14
