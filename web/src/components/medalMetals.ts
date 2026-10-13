// Металлы медалей и рамки за них. Общие для медалей (Achievements) и рамок вокруг фото (ProfileLook).
import type { ProfileStyle } from '../types'

export type Metal = [string, string, string] // светлый, основной, тёмный
export const METALS: Record<string, Metal> = {
  bronze: ['#f3c08e', '#c8782f', '#5a2e0c'],
  ruby: ['#ffb3b9', '#d1243a', '#5c0a16'],
  sapphire: ['#b5d0ff', '#2f6fe0', '#0e2a66'],
  emerald: ['#a8f0c8', '#1fae6e', '#08462c'],
  amethyst: ['#e0c6ff', '#8e4fe0', '#3a1670'],
  gold: ['#fff0bf', '#cfa040', '#654308'],
  platinum: ['#ffffff', '#dcdfe5', '#787d87'],
  gunmetal: ['#c4c8d0', '#565a62', '#1b1d21'],
}
export const METAL_NAME: Record<string, string> = { bronze: 'Бронза', ruby: 'Рубин', sapphire: 'Сапфир', emerald: 'Изумруд', amethyst: 'Аметист', gold: 'Золото', platinum: 'Платина', gunmetal: 'Тёмный металл' }
// У каждой медали свой цвет; рамка вокруг фото берёт тот же цвет. «Амбассадор», «Основатель» и «Комета» остались прежними.
export const MEDAL: Record<string, { metal: keyof typeof METALS; iridescent?: boolean }> = {
  first_meet: { metal: 'bronze' }, soul: { metal: 'ruby' }, reliable: { metal: 'sapphire' }, guide: { metal: 'emerald' },
  regular: { metal: 'amethyst' }, ambassador: { metal: 'platinum' }, founder: { metal: 'gold' }, collector: { metal: 'gunmetal', iridescent: true },
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
