import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'

const PATHS: Record<string, string> = {
  spark: 'M13 2 4 14h7l-1 8 9-12h-7z',
  vibe: 'M3 12h3l2-6 4 12 3-9 2 3h4',
  chat: 'M4 5h16v11H9l-5 4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  plus: 'M12 5v14M5 12h14',
  send: 'M4 12 20 4l-6 16-3-7z',
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
}

export function Icon({ name, size = 20, className = '', fill = false }: { name: keyof typeof PATHS | string; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-extrabold tracking-tight ${className}`}>
      <span className="grid place-items-center rounded-[10px] bg-fg text-spark w-8 h-8">
        <Icon name="spark" size={18} fill />
      </span>
      искра
    </span>
  )
}

/** Аватар: инициал на цветном фоне, оттенок уникален для человека. Вместо фото в демо. */
export function Avatar({ name, hue, size = 48, verified = false, ring = false }: { name: string; hue: number; size?: number; verified?: boolean; ring?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className={`grid place-items-center w-full h-full rounded-full font-display font-bold text-white ${ring ? 'ring-2 ring-spark ring-offset-2 ring-offset-surface' : ''}`}
        style={{ background: `linear-gradient(145deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 65% 42%))`, fontSize: size * 0.4 }}
      >
        {name.slice(0, 1)}
      </span>
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
  primary: 'bg-spark text-on-spark hover:brightness-110',
  secondary: 'bg-surface-2 text-fg hover:bg-line',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
  dark: 'bg-fg text-bg hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Chip({ active = false, onClick, children, className = '' }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  const base = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 h-8 text-[13px] font-medium border transition ${className}`
  const look = active ? 'bg-fg text-bg border-fg' : 'bg-surface text-fg border-line hover:border-muted'
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
      <button className="absolute inset-0 bg-black/45 cursor-default" aria-label="Закрыть" onClick={onClose} />
      <div className="anim-rise relative w-full sm:max-w-md max-h-[90%] overflow-y-auto bg-surface rounded-t-3xl sm:rounded-3xl px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
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

export const inputCls = 'w-full h-11 rounded-xl border border-line bg-bg px-3 text-fg placeholder:text-muted focus:outline-none focus:border-cobalt'
