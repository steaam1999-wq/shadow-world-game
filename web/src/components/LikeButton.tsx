import { useState, type ReactNode } from 'react'
import { Icon } from './ui'

// Шесть маленьких сердечек разлетаются веером; углы и цвета заданы заранее, чтобы салют был ровным.
const BURST = [
  { a: -90, c: 'var(--spark)' },
  { a: -30, c: 'var(--amber)' },
  { a: 30, c: 'var(--violet)' },
  { a: 90, c: 'var(--spark)' },
  { a: 150, c: 'var(--amber)' },
  { a: 210, c: 'var(--violet)' },
]

/** Кнопка «Нравится»: при лайке сердце пружинит и выпускает салют из маленьких сердечек. */
export function LikeButton({ liked, onToggle, size = 26, className = '', children }: {
  liked: boolean
  onToggle: () => void
  size?: number
  className?: string
  children?: ReactNode
}) {
  const [burst, setBurst] = useState(0)
  return (
    <button
      onClick={() => { if (!liked) setBurst((n) => n + 1); onToggle() }}
      className={`relative flex flex-col items-center justify-center cursor-pointer ${className}`}
      aria-label={liked ? 'Убрать лайк' : 'Нравится'} aria-pressed={liked}>
      <span className="relative grid place-items-center">
        <Icon key={`${liked}-${burst}`} name="heart" size={size} fill={liked} className={liked ? 'text-danger anim-like' : ''} />
        {burst > 0 && liked && (
          <span key={burst} className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <span className="like-ring" />
            {BURST.map((b, i) => (
              <span key={i} className="like-particle" style={{ ['--a' as string]: `${b.a}deg`, color: b.c, animationDelay: `${i * 12}ms` }}>
                <Icon name="heart" size={Math.round(size * 0.38)} fill />
              </span>
            ))}
          </span>
        )}
      </span>
      {children}
    </button>
  )
}
