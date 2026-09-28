import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

const PATHS: Record<string, string> = {
  spark: 'M13 2 4 14h7l-1 8 9-12h-7z',
  vibe: 'M3 12h3l2-6 4 12 3-9 2 3h4',
  chat: 'M4 5h16v11H9l-5 4z',
  note: 'M9 17.5V6.4a1.2 1.2 0 0 1 1-1.2l8.6-1.6a1.2 1.2 0 0 1 1.4 1.2v10.7M9 17.5a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0zM20 15.5a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0z',
  play: 'M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z',
  pause: 'M6.5 4h3.5v16H6.5zM14 4h3.5v16H14z',
  skip: 'M4 5.2v13.6a1 1 0 0 0 1.5.8l10-6.8a1 1 0 0 0 0-1.6l-10-6.8A1 1 0 0 0 4 5.2zM17.5 4.5h2.5v15h-2.5z',
  down: 'M6 9l6 6 6-6',
  copy: 'M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4',
  shuffle: 'M3.5 7h3.5c4 0 6 10 10 10h3.5M17.5 14l3 3-3 3M3.5 17H7c1.6 0 2.8-1.6 3.9-3.6M13.1 9.6C14.2 8.4 15.3 7 17 7h3.5M17.5 4l3 3-3 3',
  repeat: 'M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3.5h16V16',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  moon: 'M20.3 14.3a8.3 8.3 0 1 1-10.6-10.6 6.6 6.6 0 0 0 10.6 10.6z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  reels: 'M9 3.5h6a5.5 5.5 0 0 1 5.5 5.5v6a5.5 5.5 0 0 1-5.5 5.5H9A5.5 5.5 0 0 1 3.5 15V9A5.5 5.5 0 0 1 9 3.5zM3.9 8.4h16.2M9.2 3.7l2.4 4.5M14.4 3.7l2.4 4.5M10.6 12.3v4.1c0 .5.5.8.9.5l3.3-2c.4-.3.4-.8 0-1.1l-3.3-2c-.4-.3-.9 0-.9.5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  plus: 'M12 5v14M5 12h14',
  send: 'M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.63-.63l-19 6.5a.5.5 0 0 0-.03.93l7.93 3.18a2 2 0 0 1 1.11 1.11zM21.85 2.15l-10.94 10.94',
  back: 'M15 5l-7 7 7 7',
  shield: 'M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z M9 12l2 2 4-4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12l5 5 9-10',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .5-1.5-1L15 4h-6l-.5 2.5-1.5 1L5 7l-2 4 2 1-2 1 2 4 2-.5 1.5 1L9 20h6l.5-2.5 1.5-1 2 .5 2-4z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  camera: 'M4 8h4l2-3h4l2 3h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  heart: 'M12 20.2c-.3 0-.6-.1-.8-.3C8 17.7 3.2 13.9 3.2 9.4A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8.8 2.4c0 4.5-4.8 8.3-8 10.5-.2.2-.5.3-.8.3z',
  comment: 'M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2A8.5 8.5 0 1 1 20.5 11.5z',
  bookmark: 'M6 3.5h12v17l-6-4.5-6 4.5z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  search: 'M10.8 18.1a7.3 7.3 0 1 0 0-14.6 7.3 7.3 0 0 0 0 14.6zM20.5 20.5l-4.5-4.5',
  home: 'M3.5 11c0-.8.4-1.5 1-2l5.9-4.6a2.6 2.6 0 0 1 3.2 0l5.9 4.6c.6.5 1 1.2 1 2v7.3a2.2 2.2 0 0 1-2.2 2.2H15v-4.8a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 16.7v4.8H5.7a2.2 2.2 0 0 1-2.2-2.2z',
  create: 'M9 3.5h6a5.5 5.5 0 0 1 5.5 5.5v6a5.5 5.5 0 0 1-5.5 5.5H9A5.5 5.5 0 0 1 3.5 15V9A5.5 5.5 0 0 1 9 3.5zM12 8.5v7M8.5 12h7',
  grid: 'M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .7 3.2 2.4 3.6 5.2',
}

export function Icon({ name, size = 20, className = '', fill = false }: { name: keyof typeof PATHS | string; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Знак «Искры»: облачко сообщения с огоньком внутри — глянцевый, в тёплом градиенте. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0 drop-shadow-[0_4px_10px_rgb(200_60_40/.35)]">
      <defs>
        <linearGradient id="logo-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f68a60" />
          <stop offset=".55" stopColor="#d9503b" />
          <stop offset="1" stopColor="#a8292b" />
        </linearGradient>
        <radialGradient id="logo-flame" cx=".5" cy=".75" r=".7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe9d6" />
        </radialGradient>
      </defs>
      {/* облачко с хвостиком снизу слева */}
      <path d="M12.5 2.5h15a10 10 0 0 1 10 10v8a10 10 0 0 1-10 10H16.8l-9.3 7.2 1.6-7.8A10 10 0 0 1 2.5 20.5v-8a10 10 0 0 1 10-10z"
        fill="url(#logo-bubble)" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />
      {/* глянцевый блик */}
      <path d="M6.6 12.2a6.4 6.4 0 0 1 5.4-5.6" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.6" strokeLinecap="round" />
      {/* огонёк и красная капля внутри */}
      <path d="M20.3 6.8c1.3 3.4 5.9 5.9 5.9 10.6a6.2 6.2 0 0 1-12.4 0c0-2.8 1.5-4.5 2.8-5.6.2 1.7 1 2.6 2 3.1-.1-3.3.7-5.6 1.7-8.1z" fill="url(#logo-flame)" />
      <path d="M20 14.3c1.1 1.7 2.7 2.9 2.7 5a2.7 2.7 0 0 1-5.4 0c0-2.1 1.6-3.3 2.7-5z" fill="#e2462f" />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight logo-word ${className}`}>
      <LogoMark size={className.includes('text-xl') ? 36 : 32} />
      искра
    </span>
  )
}

/** Аватар: инициал на цветном фоне, оттенок уникален для человека. Вместо фото в демо. */
export function Avatar({ name, hue, size = 48, verified = false, ring = false, src }: { name: string; hue: number; size?: number; verified?: boolean; ring?: boolean; src?: string }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt="" className={`w-full h-full rounded-full object-cover ${ring ? 'ring-2 ring-spark ring-offset-2 ring-offset-surface' : ''}`} />
      ) : <span
        className={`grid place-items-center w-full h-full rounded-full font-display font-bold text-white ${ring ? 'ring-2 ring-spark ring-offset-2 ring-offset-surface' : ''}`}
        style={{ background: `linear-gradient(145deg, hsl(${hue} 62% 68%), hsl(${(hue + 40) % 360} 52% 50%))`, fontSize: size * 0.4 }}
      >
        {name.slice(0, 1)}
      </span>}
      {verified && (
        <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center rounded-full bg-cobalt text-white border-2 border-surface" style={{ width: size * 0.36, height: size * 0.36, minWidth: 16, minHeight: 16 }} title="Верифицирован">
          <Icon name="check" size={Math.max(10, size * 0.22)} />
        </span>
      )}
    </span>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-soft hover:brightness-105 active:scale-[.98]',
  secondary: 'bg-surface-2 text-fg hover:brightness-95 active:scale-[.98]',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
  dark: 'bg-fg text-bg hover:opacity-90 active:scale-[.98]',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-11 font-semibold transition duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Chip({ active = false, onClick, children, className = '' }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  const base = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 h-8 text-[13px] font-medium transition duration-200 ${className}`
  const look = active ? 'bg-fg text-bg' : 'bg-surface-2 text-fg hover:brightness-95'
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} ${look} cursor-pointer`}>{children}</button>
  ) : (
    <span className={`${base} ${look}`}>{children}</span>
  )
}

export type Tone = 'spark' | 'cobalt' | 'ok' | 'warn' | 'danger' | 'muted'
const TONES: Record<Tone, string> = {
  spark: 'bg-spark-soft text-spark',
  cobalt: 'bg-cobalt-soft text-cobalt',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  muted: 'bg-surface-2 text-muted',
}

export function Pill({ tone = 'muted', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[12px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>
}

export function Toggle({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-4 py-3 cursor-pointer">
      <span className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative w-11 h-6 rounded-full bg-line transition peer-checked:bg-ok peer-focus-visible:outline-2 peer-focus-visible:outline-cobalt after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

/** Нижняя шторка (на десктопе — модальное окно по центру). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-default" aria-label="Закрыть" onClick={onClose} />
      <div className="anim-rise relative w-full sm:max-w-md max-h-[90%] overflow-y-auto bg-surface rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 shadow-soft pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid place-items-center w-9 h-9 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Закрыть">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-muted">{label}</label>
      {children}
    </div>
  )
}

export const inputCls = 'w-full h-11 rounded-2xl border border-transparent bg-surface-2 px-3.5 text-fg placeholder:text-muted focus:outline-none focus:border-cobalt'

/** Кольцо сторис: градиент, пока не просмотрено, серое — после. */
export function StoryRing({ seen, size, children }: { seen: boolean; size: number; children: ReactNode }) {
  return (
    <span className="grid place-items-center rounded-full p-[2.5px] shrink-0"
      style={{ width: size, height: size, background: seen ? 'var(--line)' : 'var(--brand)' }}>
      <span className="grid place-items-center w-full h-full rounded-full bg-surface p-[2px]">{children}</span>
    </span>
  )
}

/** Уменьшает загруженное фото до квадрата 720px в JPEG, чтобы оно поместилось в хранилище браузера. */
export function readPhoto(file: File, max = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Не удалось открыть изображение'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const size = Math.min(max, side)
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

const THEME_KEY = 'iskra-theme'

function systemDark() {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
}

/** Переключатель светлой/тёмной темы; выбор запоминается в браузере. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch { /* хранилище недоступно */ }
    return systemDark() ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
  }, [theme])
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button onClick={() => setTheme(next)} className="grid place-items-center w-10 h-10 rounded-full cursor-pointer hover:bg-surface-2" aria-label={next === 'dark' ? 'Включить тёмную тему' : 'Включить светлую тему'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={22} />
    </button>
  )
}
