import type { ReactNode } from 'react'
import type { Activity } from '../types'

// Обложки-иллюстрации для планов без фото: у каждой категории свой сюжет,
// оттенок слегка меняется от плана к плану, чтобы лента не была однообразной.
const SCENES: Record<string, { from: number; to: number; draw: ReactNode }> = {
  'Кофе': {
    from: 28, to: 350,
    draw: (
      <g>
        <path d="M110 180h140v70a50 50 0 0 1-50 50h-40a50 50 0 0 1-50-50z" fill="#fff" fillOpacity=".92" />
        <path d="M250 200h18a28 28 0 0 1 0 56h-20" fill="none" stroke="#fff" strokeOpacity=".92" strokeWidth="14" />
        <path d="M150 150c-12-18 12-26 0-46M185 150c-12-18 12-26 0-46M220 150c-12-18 12-26 0-46" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="180" cy="315" rx="110" ry="14" fill="#000" fillOpacity=".12" />
      </g>
    ),
  },
  'Выставка': {
    from: 215, to: 265,
    draw: (
      <g>
        <rect x="60" y="90" width="130" height="170" fill="#fff" fillOpacity=".92" />
        <rect x="76" y="106" width="98" height="138" fill="#000" fillOpacity=".15" />
        <circle cx="125" cy="160" r="26" fill="#fff" fillOpacity=".8" />
        <rect x="210" y="130" width="100" height="100" fill="#fff" fillOpacity=".85" />
        <path d="M222 218l30-40 22 26 14-16 12 30z" fill="#000" fillOpacity=".2" />
        <rect x="40" y="300" width="280" height="6" fill="#fff" fillOpacity=".45" />
      </g>
    ),
  },
  'Прогулка': {
    from: 20, to: 300,
    draw: (
      <g>
        <circle cx="240" cy="140" r="54" fill="#fff" fillOpacity=".9" />
        <path d="M0 260c60-50 120-50 180-10s120 30 180-20v130H0z" fill="#000" fillOpacity=".18" />
        <path d="M0 300c80-40 150-30 220 0s110 10 140-10v70H0z" fill="#000" fillOpacity=".22" />
      </g>
    ),
  },
  'Концерт': {
    from: 285, to: 330,
    draw: (
      <g>
        <path d="M90 0 150 280H30zM270 0l60 280H210zM180 0l45 280h-90z" fill="#fff" fillOpacity=".16" />
        <circle cx="90" cy="40" r="16" fill="#fff" fillOpacity=".9" />
        <circle cx="180" cy="30" r="16" fill="#fff" fillOpacity=".9" />
        <circle cx="270" cy="40" r="16" fill="#fff" fillOpacity=".9" />
        <path d="M0 280h360v80H0z" fill="#000" fillOpacity=".3" />
        <path d="M40 300a14 14 0 1 1 0 .1M110 296a16 16 0 1 1 0 .1M190 300a14 14 0 1 1 0 .1M260 294a18 18 0 1 1 0 .1M325 300a14 14 0 1 1 0 .1" fill="#000" fillOpacity=".35" />
      </g>
    ),
  },
  'Спорт': {
    from: 150, to: 200,
    draw: (
      <g>
        {[[70, 80], [150, 60], [240, 100], [110, 160], [210, 190], [290, 170], [80, 250], [170, 270], [270, 260]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y}l18-8 14 12-6 18-20 2-10-14z`} fill="#fff" fillOpacity={0.55 + (i % 3) * 0.15} />
        ))}
        <path d="M180 0v360" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeDasharray="10 8" />
      </g>
    ),
  },
  'Еда': {
    from: 10, to: 45,
    draw: (
      <g>
        <circle cx="180" cy="190" r="110" fill="#fff" fillOpacity=".92" />
        <circle cx="180" cy="190" r="78" fill="#000" fillOpacity=".08" />
        {[[150, 165], [205, 170], [175, 215], [140, 215], [215, 215]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="18" fill="#fff" stroke="#000" strokeOpacity=".15" strokeWidth="3" />
        ))}
        <path d="M40 90v100M30 90v40M50 90v40M320 90c-18 20-18 60 0 70v30" stroke="#fff" strokeOpacity=".85" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  'Кино': {
    from: 230, to: 5,
    draw: (
      <g>
        <rect x="40" y="70" width="280" height="160" rx="6" fill="#fff" fillOpacity=".9" />
        <path d="M160 115v70l60-35z" fill="#000" fillOpacity=".25" />
        <path d="M0 290h360v70H0z" fill="#000" fillOpacity=".25" />
        {[40, 90, 140, 190, 240, 290].map((x) => <path key={x} d={`M${x} 290a22 22 0 0 1 44 0z`} fill="#000" fillOpacity=".3" />)}
      </g>
    ),
  },
  'Настолки': {
    from: 190, to: 130,
    draw: (
      <g>
        {[[120, 130], [180, 165], [240, 130], [120, 200], [240, 200], [180, 235]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 36}l31 18v36l-31 18-31-18v-36z`} fill="#fff" fillOpacity={0.5 + (i % 3) * 0.18} />
        ))}
        <rect x="265" y="255" width="44" height="44" rx="8" fill="#fff" fillOpacity=".95" transform="rotate(14 287 277)" />
        <circle cx="280" cy="270" r="4" fill="#000" fillOpacity=".4" />
        <circle cx="294" cy="284" r="4" fill="#000" fillOpacity=".4" />
      </g>
    ),
  },
}

const FALLBACK = {
  from: 16, to: 250,
  draw: <path d="M200 60 110 200h60l-12 100 92-150h-62z" fill="#fff" fillOpacity=".92" />,
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function PostArt({ activity, className = '' }: { activity: Pick<Activity, 'id' | 'category' | 'photo'>; className?: string }) {
  if (activity.photo) return <img src={activity.photo} alt="" className={`w-full h-full object-cover ${className}`} />
  const scene = SCENES[activity.category] ?? FALLBACK
  const shift = (hash(activity.id) % 30) - 15
  // id для SVG-ссылок url(#…) — только латиница и цифры, иначе градиент не находится и обложка чернеет.
  const gid = `g-${activity.id.replace(/[^a-zA-Z0-9_-]/g, '')}-${hash(activity.id).toString(36)}`
  return (
    <svg viewBox="0 0 360 360" className={`w-full h-full block ${className}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${scene.from + shift} 70% 70%)`} />
          <stop offset="1" stopColor={`hsl(${scene.to + shift} 55% 50%)`} />
        </linearGradient>
        <filter id={`${gid}-n`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id={`${gid}-v`} cx=".5" cy=".45" r=".75">
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </radialGradient>
      </defs>
      <rect width="360" height="360" fill={`url(#${gid})`} />
      <g opacity=".92">{scene.draw}</g>
      {/* Плёночное зерно и лёгкая виньетка — «живой» кадр вместо стерильной заливки */}
      <rect width="360" height="360" filter={`url(#${gid}-n)`} opacity=".16" style={{ mixBlendMode: 'overlay' }} />
      <rect width="360" height="360" fill={`url(#${gid}-v)`} />
    </svg>
  )
}

/** Число лайков в демо: стабильное для плана + мой лайк. */
export function likeCount(activityId: string, mine: boolean) {
  return 12 + (hash(activityId) % 180) + (mine ? 1 : 0)
}
