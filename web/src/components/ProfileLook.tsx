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

/** Хромовая голографическая корона над фото «Кометы»: зеркальный металл, радуга перетекает по нему,
 *  пробегает блик, камни поблёскивают. */
function HoloCrown({ width }: { width: number }) {
  const id = useId().replace(/:/g, '')
  const body = 'M10 58L12 22 24 40 31 14 41 36 50 4 59 36 69 14 76 40 88 22 90 58Q50 66 10 58z'
  const band = 'M8 56Q50 66 92 56L92 66Q50 76 8 66z'
  const balls: [number, number, number][] = [[12, 21, 4.2], [31, 13, 4.6], [50, 4, 5.4], [69, 13, 4.6], [88, 21, 4.2]]
  const layer = (fill: string, extra?: CSSProperties) => (
    <g style={extra}><path d={body} fill={fill} /><path d={band} fill={fill} />{balls.map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill={fill} />)}</g>
  )
  return (
    <svg width={width} height={width * 0.78} viewBox="0 -3 100 80" aria-hidden="true" style={{ overflow: 'visible', filter: 'drop-shadow(0 3px 4px rgb(0 0 0 / .55)) drop-shadow(0 0 1px rgb(255 255 255 / .5))' }}>
      <defs>
        <linearGradient id={`c-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".25" stopColor="#d7dbe3" /><stop offset=".48" stopColor="#5a5f6e" /><stop offset=".58" stopColor="#f3f5f8" /><stop offset=".8" stopColor="#a3a9b6" /><stop offset="1" stopColor="#f7f8fa" />
        </linearGradient>
        <radialGradient id={`b-${id}`} cx=".36" cy=".3" r=".75"><stop offset="0" stopColor="#fff" /><stop offset=".45" stopColor="#9aa1ae" /><stop offset=".8" stopColor="#2b2f39" /><stop offset="1" stopColor="#c9ced8" /></radialGradient>
        <linearGradient id={`h-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="80" y2="40" spreadMethod="repeat">
          <stop offset="0" stopColor="#ff3d6e" /><stop offset=".17" stopColor="#ffb340" /><stop offset=".34" stopColor="#fff36b" /><stop offset=".5" stopColor="#45ffb0" />
          <stop offset=".66" stopColor="#3dc9ff" /><stop offset=".83" stopColor="#7a5cff" /><stop offset="1" stopColor="#ff3d6e" />
          <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="80 40" dur="6s" repeatCount="indefinite" />
        </linearGradient>
        <linearGradient id={`s-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="30">
          <stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".95" /><stop offset=".6" stopColor="#fff" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" values="-130 0; -130 0; 130 0" keyTimes="0; .5; 1" dur="4s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      {layer(`url(#c-${id})`)}
      {balls.map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill={`url(#b-${id})`} />)}
      {/* правые грани зубцов темнее — объём */}
      <path d="M12 22L24 40 24 60 12 59zM31 14L41 36 41 62 31 61zM50 4L59 36 59 63 50 63zM69 14L76 40 76 61 69 61zM88 22L90 58 88 58z" fill="#1d2230" opacity=".28" />
      {layer(`url(#h-${id})`, { mixBlendMode: 'overlay', opacity: 0.42 })}
      {layer(`url(#s-${id})`, { mixBlendMode: 'screen' })}
      <path d="M50 34l5 9-5 9-5-9z" fill="#e0263a" /><path d="M50 34l5 9h-10z" fill="#ff6a5a" />
      <path d="M31 40l3.6 6.5L31 53l-3.6-6.5z" fill="#2a4bff" /><path d="M69 40l3.6 6.5L69 53l-3.6-6.5z" fill="#2a4bff" />
      {balls.map(([x, y, r]) => <circle key={`g${x}`} cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#fff" opacity=".9" />)}
    </svg>
  )
}

/** Рамка «Комета» — за всю коллекцию медалей. Как оправа ювелирной работы: платиновый бортик
 *  с голографическим переливом, бусинный ободок, бегущий блик и искры; сверху — хромовая корона, снизу — монета «Комета».
 *  На маленьких аватарках (лента) — бортик с переливом и маленькая корона. */
export function CometFrame({ on, children, width = 3, badge }: { on?: boolean; children: ReactNode; width?: number; badge?: ReactNode }) {
  if (!on) return <>{children}</>
  const big = width >= 4
  const w = big ? 9 : width + 1
  return (
    <span className="relative inline-grid place-items-center rounded-full leading-[0] shrink-0" style={{ padding: w + (big ? 3 : 1) }} title="Комета: вся коллекция медалей">
      {big && <span className="absolute -inset-3 rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgb(140 120 255 / .35), rgb(80 170 255 / .15) 60%, transparent)', filter: 'blur(6px)' }} />}
      {/* Платиновый бортик */}
      <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 200deg, #ffffff, #b8bdc8 12%, #5d636e 24%, #e9ecf2 36%, #8a909c 50%, #ffffff 62%, #6b717c 76%, #d5d9e1 88%, #ffffff)',
        boxShadow: '0 4px 14px -4px rgb(0 0 0 / .6), inset 0 0 0 1px rgb(255 255 255 / .5)' }} />
      {/* Голографическая плёнка — медленно переливается */}
      <span className="gold-ring-spin absolute inset-0 rounded-full mix-blend-overlay opacity-80" style={{ animationDuration: '9s', background: 'conic-gradient(from 0deg, #ff6aa8, #ffd36b, #7dffcf, #6ab8ff, #b18cff, #ff6aa8)' }} />
      {/* Бегущий блик */}
      <span className="gold-ring-spin absolute inset-0 rounded-full mix-blend-screen" style={{ animationDuration: '4.5s', background: 'conic-gradient(from 0deg, transparent 0 74%, rgb(255 255 255 / .95) 82%, transparent 90%)' }} />
      {big && (
        // Бусинный ободок и гравированная канавка
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="47.6" fill="none" stroke="rgb(255 255 255 / .85)" strokeWidth="1.5" strokeDasharray="0 3.32" strokeLinecap="round" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(20 22 28 / .45)" strokeWidth=".6" />
        </svg>
      )}
      {/* Внутренний срез оправы */}
      <span className="absolute rounded-full bg-bg" style={{ inset: w, boxShadow: 'inset 0 2px 3px rgb(0 0 0 / .55), 0 0 0 1px rgb(255 255 255 / .55)' }} />
      <span className="relative">{children}</span>
      {big && [[0.08, 0.1, 0], [0.84, 0.18, 1.1], [0.9, 0.7, 2]].map(([x, y, d], i) => (
        <svg key={i} className="gold-twinkle absolute pointer-events-none" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: 14, height: 14, animationDelay: `${d}s`, filter: 'drop-shadow(0 0 4px rgb(190 200 255 / .9))' }} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#fff" d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
        </svg>
      ))}
      {big && badge && <span className="absolute z-[2] left-1/2 -bottom-3 -translate-x-1/2 leading-[0]">{badge}</span>}
      {/* Корона над фото — слегка наклонена и плавно покачивается */}
      <span className="absolute z-[3] left-1/2 leading-[0] pointer-events-none" style={{ top: big ? -30 : -9, transform: `translateX(-50%) rotate(${big ? -6 : -8}deg)` }}>
        <span className={big ? "block anim-float" : "block"} style={{ animationDuration: "4.5s" }}><HoloCrown width={big ? 58 : 18} /></span>
      </span>
    </span>
  )
}

/** Отметка «Амбассадор» рядом с именем на плане. */
export function AmbassadorMark() {
  return <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-full text-[10.5px] font-bold text-white whitespace-nowrap" style={{ background: 'linear-gradient(95deg, #ff4f86, #8a5cff)' }} title="Амбассадор Komeeta">★ Амбассадор</span>
}
