// Оформление профиля: обложка, кольцо аватарки, статус и акцентный цвет — спокойные, без кричащих эффектов.
import { useId, type CSSProperties, type ReactNode } from 'react'
import type { Accent, ProfileStyle } from '../types'

export const ACCENTS: { id: Accent; name: string; color: string; ink: string }[] = [
  { id: 'graphite', name: 'Графит', color: '#8d8a93', ink: '#141216' },
  { id: 'sage', name: 'Шалфей', color: '#9fb59a', ink: '#141a13' },
  { id: 'sand', name: 'Песок', color: '#cdb08a', ink: '#221a10' },
  { id: 'rose', name: 'Пыльная роза', color: '#c9a0a8', ink: '#24161a' },
  { id: 'blue', name: 'Глубокий синий', color: '#6f86b3', ink: '#ffffff' },
  { id: 'pearl', name: 'Жемчуг', color: '#e9e3ea', ink: '#16111b' },
]

/** Цвет акцента и цвет текста на нём; без акцента — фирменный цвет Komeeta. */
export function accentOf(style?: ProfileStyle): { color: string; ink: string } {
  const a = ACCENTS.find((x) => x.id === style?.accent)
  return a ? { color: a.color, ink: a.ink } : { color: 'var(--spark)', ink: 'var(--on-spark)' }
}

/** Статус под именем, если он задан и ещё не истёк. */
export function statusOf(style: ProfileStyle | undefined, now = Date.now()): string | null {
  if (!style?.status) return null
  if (style.statusUntil && style.statusUntil < now) return null
  return style.status
}

/** Обложка в шапке профиля: размытое фото, мягкий цвет или прежний фон цвета профиля. */
export function ProfileCover({ style, photo, hue }: { style?: ProfileStyle; photo?: string; hue: number }) {
  const cover = style?.cover ?? 'color'
  const fade = <span className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
  if (cover === 'none') return null
  if (cover === 'photo' && photo) {
    return (
      <span className="absolute inset-x-0 top-0 h-[300px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img src={photo} alt="" className="absolute inset-[-40px] w-[calc(100%+80px)] h-[calc(100%+80px)] object-cover blur-2xl saturate-[1.1] opacity-80" />
        {fade}
      </span>
    )
  }
  const a = style?.accent ? accentOf(style).color : null
  const bg = a
    ? `radial-gradient(70% 90% at 30% 0%, ${a}66 0%, transparent 70%), radial-gradient(60% 80% at 85% 10%, ${a}40 0%, transparent 70%)`
    : `linear-gradient(180deg, hsl(${hue} 85% 65% / .38) 0%, hsl(${(hue + 40) % 360} 80% 60% / .16) 55%, transparent 100%)`
  return <span className="absolute inset-x-0 top-0 h-[300px] pointer-events-none" style={{ background: bg }} aria-hidden="true">{fade}</span>
}

/** Тонкое кольцо вокруг аватарки: в цвет акцента или белое с мягким свечением. */
export function AvatarRing({ style, children }: { style?: ProfileStyle; children: ReactNode }) {
  const ring = style?.ring ?? 'none'
  const css: CSSProperties = ring === 'accent' ? { boxShadow: `0 0 0 3px var(--bg), 0 0 0 5px ${accentOf(style).color}` }
    : ring === 'white' ? { boxShadow: '0 0 0 3px rgb(255 255 255 / .92), 0 0 26px rgb(255 255 255 / .28)' } : {}
  return <span className="inline-grid rounded-full leading-[0]" style={css}>{children}</span>
}

/** Строка статуса: точка в цвет акцента и короткий текст. */
export function StatusLine({ text, style, online }: { text: string | null; style?: ProfileStyle; online?: boolean }) {
  if (!text && !online) return null
  return (
    <span className="inline-flex items-center gap-1.5 max-w-full text-[14px] text-fg/85">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: online ? '#22c55e' : accentOf(style).color }} />
      <span className="truncate">{[online ? 'в сети' : null, text].filter(Boolean).join(' · ')}</span>
    </span>
  )
}

/** Интересы стеклянными капсулами. */
export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="h-8 px-3 rounded-full inline-flex items-center text-[13px] border border-fg/10 bg-[linear-gradient(180deg,rgb(255_255_255/.10),rgb(255_255_255/.03))] backdrop-blur">{t}</span>
      ))}
    </div>
  )
}

/** Счётчики под именем: три колонки по центру. */
export function Stats({ items }: { items: { n: number | string; label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex justify-center gap-7">
      {items.map((s) => {
        const body = <><b className="block font-display font-bold text-[18px] tnum leading-tight">{s.n}</b><span className="text-[12.5px] text-muted">{s.label}</span></>
        return s.onClick
          ? <button key={s.label} onClick={s.onClick} className="text-center cursor-pointer" aria-label={`${s.n} ${s.label}`}>{body}</button>
          : <div key={s.label} className="text-center">{body}</div>
      })}
    </div>
  )
}

/** Значок «Амбассадор Komeeta» — помощник, который запускает встречи в своём городе. */
export function AmbassadorBadge({ city }: { city?: string }) {
  if (city === undefined) return null
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-1 pr-3 rounded-full text-[12.5px] font-semibold border border-[color-mix(in_srgb,var(--spark)_45%,transparent)] bg-[color-mix(in_srgb,var(--spark)_12%,transparent)]"
      title="Амбассадор Komeeta: запускает встречи в своём городе">
      <span className="grid place-items-center w-5 h-5 rounded-full bg-brand text-white text-[11px]">★</span>
      Амбассадор Komeeta{city ? ` · ${city}` : ''}
    </span>
  )
}

/** Корона «Кометы» — строгий ювелирный знак: пять тонких зубцов с жемчужинами и узкий обод, платина.
 *  Контур цвета фона «врезает» корону в кольцо рамки. */
function Crown({ width }: { width: number }) {
  const id = useId().replace(/:/g, '')
  const tips: [number, number, number][] = [[5, 10, 1.6], [12.5, 5.5, 1.7], [20, 2.4, 2], [27.5, 5.5, 1.7], [35, 10, 1.6]]
  const bases = [9, 14.5, 20, 25.5, 31]
  const prong = ([x, y]: [number, number, number], bx: number) => `M${x - 0.7} ${y} L${x + 0.7} ${y} L${bx + 2} 20 L${bx - 2} 20 Z`
  const shape = <>
    {tips.map((t, i) => <path key={i} d={prong(t, bases[i])} />)}
    {tips.map(([x, y, r], i) => <circle key={`p${i}`} cx={x} cy={y - r * 0.6} r={r} />)}
    <rect x="7" y="19.4" width="26" height="4.2" rx="1.6" />
  </>
  return (
    <svg width={width} height={width * 0.66} viewBox="0 -1 40 26" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`pt-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".45" stopColor="#d9dde4" /><stop offset=".62" stopColor="#8d939e" /><stop offset="1" stopColor="#eef0f4" />
        </linearGradient>
      </defs>
      <g fill="var(--bg)" stroke="var(--bg)" strokeWidth="3" strokeLinejoin="round">{shape}</g>
      <g fill={`url(#pt-${id})`}>{shape}</g>
      <rect x="7" y="21.2" width="26" height=".6" fill="#6b717c" opacity=".55" />
    </svg>
  )
}

/** Рамка «Комета» — за всю коллекцию медалей. Тонкое платиновое кольцо с медленным бликом
 *  и небольшая корона, врезанная в кольцо сверху. Сдержанно, как ювелирное изделие. */
export function CometFrame({ on, children, width = 3 }: { on?: boolean; children: ReactNode; width?: number }) {
  if (!on) return <>{children}</>
  const big = width >= 4
  const ring = big ? 2.5 : 1.5
  const gap = big ? 3 : 1.5
  return (
    <span className="relative inline-grid place-items-center rounded-full leading-[0] shrink-0" style={{ padding: ring + gap }} title="Комета: вся коллекция медалей">
      <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #ffffff, #aab0bb 18%, #e8ebf0 34%, #7c828d 52%, #f4f5f8 68%, #a4aab5 84%, #ffffff)',
        boxShadow: big ? '0 0 0 .5px rgb(255 255 255 / .25), 0 6px 18px -8px rgb(0 0 0 / .7)' : undefined }} />
      <span className="gold-ring-spin absolute inset-0 rounded-full mix-blend-screen" style={{ animationDuration: '9s', background: 'conic-gradient(from 0deg, transparent 0 80%, rgb(255 255 255 / .8) 87%, transparent 93%)' }} />
      <span className="absolute rounded-full bg-bg" style={{ inset: ring }} />
      <span className="relative">{children}</span>
      <span className="absolute z-[3] left-1/2 -translate-x-1/2 leading-[0] pointer-events-none" style={{ top: big ? -11 : -5.5 }}>
        <Crown width={big ? 30 : 13} />
      </span>
    </span>
  )
}

/** Отметка «Амбассадор» рядом с именем на плане. */
export function AmbassadorMark() {
  return <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-full text-[10.5px] font-bold text-white whitespace-nowrap" style={{ background: 'linear-gradient(95deg, #ff4f86, #8a5cff)' }} title="Амбассадор Komeeta">★ Амбассадор</span>
}
