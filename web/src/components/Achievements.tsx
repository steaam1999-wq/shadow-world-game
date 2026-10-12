// Достижения: 6 редких медалей за то, ради чего существует Komeeta, — встречи, надёжность, друзья.
// Выдаёт их сервер (check_achievements) по данным базы, поэтому подделать нельзя.
// Нажатие на медаль — за что, прогресс, редкость и что она даст.
import { useEffect, useId, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { sb } from '../cloud/api'
import { Sheet } from './ui'
import { GoldPlanet } from './Invite'

type Progress = { met: number; responded: number; invites: number; noshows: number; active_invites?: number }
export interface Achievement {
  code: string; title: string; short: string; how: string; perk: string
  colors: [string, string, string] // светлый, основной, тёмный
  glyph: string // контур значка (viewBox 24)
  goal?: (p: Progress) => [number, number] // сколько есть / сколько нужно
  live?: boolean // преимущество уже работает (а не «скоро»)
  special?: boolean // выдаёт команда — в профиле видна только у тех, у кого есть
}

export const ACHIEVEMENTS: Achievement[] = [
  { code: 'first_meet', title: 'Первая встреча', short: 'Встреча', colors: ['#ffe2c4', '#d08a52', '#6e3b17'],
    glyph: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19.5c.6-3.1 2.8-5.2 5.5-5.2s4.9 2.1 5.5 5.2M16 11a2.6 2.6 0 1 0 0-5.2M15.6 14.3c2.3.4 4.2 2.2 4.8 5.2',
    how: 'Встретиться с человеком из Komeeta и подтвердить встречу кодами.', perk: 'Значок «Встречался» рядом с именем, когда откликаетесь на план.',
    goal: (p) => [Math.min(p.met, 1), 1] },
  { code: 'soul', title: 'Душа компании', short: 'Душа', colors: ['#ffe3dc', '#e8907a', '#8a4a3c'],
    glyph: 'M12 2.8c.9 3.3 5.2 5.5 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.3 1.2-3.9 2.7-5-.1 2 .7 3.4 2 3.9-1-3-.9-6.2.5-9.3z',
    how: 'На 5 ваших планов кто-то откликнулся.', perk: 'Ваши планы поднимаются выше в ленте.',
    goal: (p) => [Math.min(p.responded, 5), 5] },
  { code: 'reliable', title: 'Надёжный', short: 'Надёжный', colors: ['#dbe8f8', '#4f86d6', '#1f3f73'],
    glyph: 'M12 3l7 3v5.2c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V6zM8.6 12.2l2.4 2.4 4.4-4.6',
    how: '5 подтверждённых встреч и ни одного пропуска.', perk: 'Метка «Надёжный» видна всем — с вами охотнее договариваются.',
    goal: (p) => [p.noshows ? 0 : Math.min(p.met, 5), 5] },
  { code: 'guide', title: 'Проводник', short: 'Проводник', colors: ['#d8fbec', '#3fbf95', '#1f6a52'],
    glyph: 'M21 3 3 10.4l7.2 2.8L13 21zM10.2 13.2 21 3',
    how: 'Пригласить в Komeeta 3 друзей по своей ссылке.', perk: 'Особые цвета оформления профиля.',
    goal: (p) => [Math.min(p.invites, 3), 3] },
  { code: 'regular', title: 'Легенда', short: 'Легенда', colors: ['#fff4cf', '#dca23a', '#6b4508'],
    glyph: 'M7 4h10v3.2a5 5 0 0 1-10 0zM7 5.2H4.2v1.3A3.4 3.4 0 0 0 7.6 10M17 5.2h2.8v1.3A3.4 3.4 0 0 1 16.4 10M12 12.2v3.3M8.6 20h6.8l-.7-3.6H9.3z',
    how: '10 подтверждённых встреч.', perk: 'Ранний доступ к новым функциям Komeeta.',
    goal: (p) => [Math.min(p.met, 10), 10] },
  { code: 'ambassador', title: 'Амбассадор', short: 'Амбассадор', colors: ['#ffd0e0', '#ff4f86', '#5b23b8'],
    glyph: 'M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z',
    how: 'Помогать запускать встречи в своём городе. Медаль выдаёт команда Komeeta лично.', perk: 'Ваши планы выше в ленте, отметка «★ Амбассадор» у имени на планах, видно, кто смотрел ваши планы, значок с городом в профиле и прямая связь с командой.', live: true, special: true },
  { code: 'collector', title: 'Комета', short: 'Комета', colors: ['#d8f3ff', '#7a5cff', '#1a0b3d'],
    glyph: 'M14.5 9.5 21 3M11.5 7.5 17 2M16.5 12.5 22 7M9.5 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z',
    how: 'Собрать всю коллекцию из 5 медалей и привести 5 активных друзей: у каждого фото и «о себе», от 3 публикаций или планов, заходил 5 дней из первой недели и общался в Komeeta не только с вами.',
    perk: 'Радужная рамка «Комета» вокруг фото, ваши планы в самом верху ленты и видно, кто их смотрел. Скоро: «Зал славы» и бонусы от заведений-партнёров.', live: true, special: true },
  { code: 'founder', title: 'Основатель', short: 'Основатель', colors: ['#fff1b8', '#e9b949', '#8a5a12'],
    glyph: 'M3.8 8.2 8 12l4-6.8 4 6.8 4.2-3.8-1.9 9.6H5.7zM6 20h12',
    how: 'Одним из первых позвать друзей в Komeeta по программе основателей.', perk: 'Золотая рамка вокруг фото, медаль с номером у имени и место на «Стене основателей».', live: true },
]

type Earned = Record<string, number> // code → когда получено

function useAchievements(personId: string) {
  const { state } = useStore()
  const uid = state.cloud?.userId
  const id = personId === 'me' ? uid : personId
  const [earned, setEarned] = useState<Earned | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [stats, setStats] = useState<{ total: number; by: Record<string, number> } | null>(null)
  useEffect(() => {
    if (!state.cloud || !id) return
    let alive = true
    void (async () => {
      if (personId === 'me') {
        const { data } = await sb().rpc('check_achievements')
        const fresh = (Array.isArray(data) ? data as string[] : []).filter((c) => ACHIEVEMENTS.some((a) => a.code === c))
        if (alive && fresh.length) celebrate(fresh)
        const pr = await sb().rpc('achievement_progress')
        if (alive && pr.data) setProgress(pr.data as Progress)
      }
      const [{ data }, st] = await Promise.all([
        sb().from('achievements').select('code, earned_at').eq('user_id', id),
        sb().rpc('achievement_stats'),
      ])
      if (!alive) return
      setEarned(Object.fromEntries((data ?? []).map((r: { code: string; earned_at: string }) => [r.code, new Date(r.earned_at).getTime()])))
      const s = st.data as { total: number; by_code: Record<string, number> } | null
      if (s) setStats({ total: s.total, by: s.by_code ?? {} })
    })().catch(() => {})
    return () => { alive = false }
  }, [id, personId, state.cloud])
  if (!state.cloud) {
    if (personId !== 'me' || !state.me) return { earned: {}, progress: null, stats: null }
    const met = state.me.meetings
    return { earned: Object.fromEntries([met >= 1 && 'first_meet', met >= 10 && 'regular', !!state.me.founder && 'founder', state.me.ambassador !== undefined && 'ambassador'].filter(Boolean).map((c) => [c as string, Date.now()])), progress: { met, responded: 0, invites: 0, noshows: 0 }, stats: null }
  }
  return { earned, progress, stats }
}

let showNew: ((a: Achievement) => void) | null = null
function celebrate(codes: string[]) {
  codes.map((c) => ACHIEVEMENTS.find((a) => a.code === c)).filter((a): a is Achievement => !!a)
    .forEach((a, i) => setTimeout(() => showNew?.(a), i * 3200))
}

const COMET_STARS: [number, number, number, number][] = [
  [14, 22, 0.55, 0.9], [26, 12, 0.35, 0.6], [44, 20, 0.45, 0.8], [58, 9, 0.3, 0.5], [82, 44, 0.5, 0.85], [88, 62, 0.35, 0.6], [70, 78, 0.45, 0.7],
  [52, 88, 0.3, 0.5], [18, 46, 0.3, 0.55], [10, 70, 0.4, 0.7], [62, 60, 0.28, 0.45], [36, 40, 0.25, 0.4], [76, 24, 0.3, 0.5], [24, 86, 0.3, 0.5],
]

/** Космос с кометой — поле монеты «Комета» (ядро, кома, два хвоста, туманности). */
function CometSky({ big }: { big: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" className="absolute inset-0 block" aria-hidden="true">
          <defs>
            <radialGradient id={`sky-${id}`} cx="62%" cy="38%" r="75%"><stop offset="0" stopColor="#1d2a5c" /><stop offset=".55" stopColor="#0b1131" /><stop offset="1" stopColor="#03050f" /></radialGradient>
            <radialGradient id={`neb1-${id}`}><stop offset="0" stopColor="#7b4be0" stopOpacity=".55" /><stop offset="1" stopColor="#7b4be0" stopOpacity="0" /></radialGradient>
            <radialGradient id={`neb2-${id}`}><stop offset="0" stopColor="#1fb2d6" stopOpacity=".35" /><stop offset="1" stopColor="#1fb2d6" stopOpacity="0" /></radialGradient>
            <linearGradient id={`dust-${id}`} x1="30" y1="70" x2="96" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff6e6" stopOpacity=".95" /><stop offset=".35" stopColor="#ffe2b8" stopOpacity=".45" /><stop offset="1" stopColor="#ffd9a8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`ion-${id}`} x1="32" y1="68" x2="98" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#e8f6ff" stopOpacity=".95" /><stop offset=".4" stopColor="#7cc8ff" stopOpacity=".55" /><stop offset="1" stopColor="#4a8dff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`coma-${id}`}><stop offset="0" stopColor="#ffffff" /><stop offset=".25" stopColor="#e6f4ff" stopOpacity=".9" /><stop offset=".6" stopColor="#8fd0ff" stopOpacity=".3" /><stop offset="1" stopColor="#8fd0ff" stopOpacity="0" /></radialGradient>
            <radialGradient id={`vig-${id}`}><stop offset=".68" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
            <filter id={`b1-${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
            <filter id={`b2-${id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter>
            <filter id={`b05-${id}`}><feGaussianBlur stdDeviation=".5" /></filter>
          </defs>
          <rect width="100" height="100" fill={`url(#sky-${id})`} />
          <ellipse cx="26" cy="74" rx="34" ry="22" fill={`url(#neb1-${id})`} transform="rotate(-30 26 74)" />
          <ellipse cx="78" cy="28" rx="30" ry="18" fill={`url(#neb2-${id})`} transform="rotate(-35 78 28)" />
          {COMET_STARS.map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r * (big ? 1 : 1.6)} fill="#fff" opacity={o} className={i % 4 === 0 ? 'gold-twinkle' : undefined} style={i % 4 === 0 ? { animationDelay: `${i * 0.37}s` } : undefined} />
          ))}
          {/* Пылевой хвост — широкий, изогнутый, тёплый */}
          <path d="M33 68 Q58 52 98 20 L100 34 Q66 60 35 71 Z" fill={`url(#dust-${id})`} filter={`url(#b2-${id})`} />
          <path d="M33 68 Q56 54 92 26 L94 32 Q62 58 34 70 Z" fill={`url(#dust-${id})`} opacity=".6" filter={`url(#b1-${id})`} />
          {/* Ионный хвост — тонкий, прямой, голубой */}
          <path d="M32.5 66.5 L97 4 L99.5 7.5 L34.5 68.5 Z" fill={`url(#ion-${id})`} filter={`url(#b05-${id})`} />
          <path d="M33 67 L90 12" stroke={`url(#ion-${id})`} strokeWidth={big ? 0.7 : 1.6} opacity=".95" />
          {/* Кома и ядро */}
          <circle cx="33.5" cy="67.5" r={big ? 14 : 18} fill={`url(#coma-${id})`} filter={`url(#b1-${id})`} />
          <circle cx="33.5" cy="67.5" r={big ? 3.6 : 5} fill="#fff" filter={`url(#b05-${id})`} />
          <circle cx="33.5" cy="67.5" r="1.8" fill="#fff" />
          <rect width="100" height="100" fill={`url(#vig-${id})`} />
          {/* Стекло: мягкий блик сверху */}
          <ellipse cx="34" cy="14" rx="34" ry="12" fill="#fff" opacity=".06" filter={`url(#b2-${id})`} />
        </svg>
  )
}

// ——— Медали-монеты: переливающийся хромовый обод, поле, глянцевый знак, бегущий свет и блик.
// На крупной медали (в карточке) — настоящая толщина ребра и мягкое покачивание в 3D.
type Coin = { rim: string; edge: string; field: string; ink: 'dark' | 'light' | 'gold'; glow: string; fill?: boolean }
const HOLO = '#ff3d6e, #ffb340, #fff36b, #45ffb0, #3dc9ff, #7a5cff, #ff3dd1, #ff3d6e'
const GOLD_RIM = '#fff3c4, #d9a33a, #ffffff, #ffd36b, #8a5a12, #fff7dc, #ffb347, #fff3c4'
const COINS: Record<string, Coin> = {
  first_meet: { rim: '#ffffff, #9aa0aa, #f4f4f6, #c9b8ff, #a5ecff, #ffffff, #6c717a, #e8e8ea, #ffd0ea, #ffffff', edge: 'linear-gradient(90deg, #5d626b, #e9eaec, #7b808a)',
    field: 'radial-gradient(circle at 38% 30%, #ffffff, #d7d9dd 28%, #9ea2a9 55%, #eceef0 72%, #7c8088 100%)', ink: 'dark', glow: 'rgb(190 200 220 / .5)' },
  soul: { rim: '#ffb36b, #ff5a4a, #ffe9a8, #ffffff, #b9e5ff, #ffc96b, #ff6a3d, #fff4d6, #ffb36b', edge: 'linear-gradient(90deg, #a0603a, #ffe2bd, #b8653a)',
    field: 'radial-gradient(circle at 40% 32%, #ffffff, #fbf8f2 45%, #ece5d9 80%, #d9cfbf)', ink: 'dark', glow: 'rgb(255 140 80 / .5)', fill: true },
  reliable: { rim: '#a5ecff, #4f86d6, #ffffff, #c9b8ff, #2f5fb3, #e6f4ff, #6fb8ff, #a5ecff', edge: 'linear-gradient(90deg, #0f2a6e, #8fb8ff, #16347f)',
    field: 'radial-gradient(circle at 50% 36%, #7aa8ff, #2a5bd0 50%, #0f2a6e 80%, #081638)', ink: 'light', glow: 'rgb(79 134 214 / .55)' },
  guide: { rim: '#9cff6b, #2ee6c5, #6fa8ff, #e6f7ff, #ffe66b, #9cff6b, #1d8f4a, #c6ffd9, #9cff6b', edge: 'linear-gradient(90deg, #0d4f24, #6bff9d, #1a6a35)',
    field: 'radial-gradient(circle at 50% 38%, #8ef59a, #2aa449 48%, #0f5a25 78%, #072e13)', ink: 'light', glow: 'rgb(63 191 120 / .55)' },
  regular: { rim: GOLD_RIM, edge: 'linear-gradient(90deg, #6b4508, #ffe2a0, #7a500e)',
    field: 'radial-gradient(circle at 40% 30%, #3a3a40, #141416 55%, #000)', ink: 'gold', glow: 'rgb(220 162 58 / .55)' },
  ambassador: { rim: '#ffb347, #ff4f86, #ffd0e0, #8a5cff, #ffffff, #ff4f86, #ffb347', edge: 'linear-gradient(90deg, #5b23b8, #ff9cbd, #6a2bc4)',
    field: 'radial-gradient(circle at 34% 28%, #ff9cbd, #e2306f 42%, #5b23b8 100%)', ink: 'light', glow: 'rgb(255 79 134 / .6)', fill: true },
  founder: { rim: GOLD_RIM, edge: 'linear-gradient(90deg, #6e4508, #ffe2a0, #7a500e)',
    field: 'radial-gradient(circle at 36% 28%, #fff6d0, #f2c45a 40%, #b07a1c 75%, #6e4508)', ink: 'gold', glow: 'rgb(233 185 73 / .6)' },
  collector: { rim: HOLO, edge: 'linear-gradient(90deg, #2a1b6e, #b9a6ff, #1d2a5c)', field: '#03050f', ink: 'light', glow: 'rgb(110 120 255 / .6)' },
}
const INK = {
  dark: ['#6a6a72', '#1a1a1d', '#000000'],
  light: ['#ffffff', '#eef2fa', '#b9c2d6'],
  gold: ['#fff3c4', '#e9b949', '#8a5a12'],
}

function CoinMedal({ a, size }: { a: Achievement; size: number }) {
  const id = useId().replace(/:/g, '')
  const k = COINS[a.code]
  const deep = size >= 90
  const ink = INK[k.ink]
  const art = a.code === 'collector' ? <CometSky big={size >= 40} />
    : a.code === 'founder' ? <span className="coin-m__art"><GoldPlanet size={size * 0.6} /></span>
    : (
      <svg className="coin-m__art" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden="true"
        style={{ filter: `drop-shadow(0 ${Math.max(1, size * 0.02)}px ${Math.max(1, size * 0.03)}px rgb(0 0 0 / ${k.ink === 'dark' ? 0.35 : 0.55}))` }}>
        <defs><linearGradient id={`ink-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={ink[0]} /><stop offset=".5" stopColor={ink[1]} /><stop offset="1" stopColor={ink[2]} /></linearGradient></defs>
        <path d={a.glyph} fill={k.fill ? `url(#ink-${id})` : 'none'} stroke={`url(#ink-${id})`} strokeWidth={k.fill ? 0.6 : 2.3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  const delay = ACHIEVEMENTS.findIndex((x) => x.code === a.code) * 0.7
  return (
    <span className={`coin-m${deep ? ' coin-m--3d' : ''}`} style={{ width: size, height: size, '--rimc': k.rim, '--edge': k.edge, '--field': k.field,
      '--rim': `${Math.max(2, size * 0.05)}px`, '--depth': `${size * 0.07}px`, '--coin-delay': `${delay}s` } as CSSProperties}>
      <span className="coin-m__body">
        {deep && Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="coin-m__edge" style={{ transform: `translateZ(calc(var(--depth) * ${(i / 9 - 0.5).toFixed(3)}))`, filter: `brightness(${(0.55 + 0.45 * Math.sin((i / 9) * Math.PI)).toFixed(2)})` }} />
        ))}
        <span className="coin-m__face" style={{ boxShadow: `0 ${size * 0.1}px ${size * 0.3}px -${size * 0.08}px ${k.glow}, inset 0 0 0 1px rgb(255 255 255 / .35)` }}>
          <span className="coin-m__inner">{art}</span>
        </span>
      </span>
    </span>
  )
}

/** Медаль. Получена — монета; не получена — тёмное стекло, контур значка и кольцо прогресса. */
export function Medal({ a, got, size = 56, progress = 0 }: { a: Achievement; got: boolean; size?: number; progress?: number; shine?: boolean }) {
  const main = a.colors[1]
  const ring = Math.max(3, size * 0.075)
  const r = size / 2 - ring / 2
  const c = 2 * Math.PI * r
  if (got && COINS[a.code]) {
    if (a.code === 'ambassador' && size >= 90) {
      return (
        <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
          <CoinMedal a={a} size={size} />
          <span className="absolute z-[1] -bottom-2 left-1/2 -translate-x-1/2 -rotate-6 px-3 py-1 rounded-lg font-display font-bold text-[12px] tracking-[.12em] text-white whitespace-nowrap"
            style={{ background: 'linear-gradient(95deg, #ff4f86, #8a5cff)', boxShadow: '0 8px 18px -6px rgb(255 79 134 / .8)' }}>АМБАССАДОР</span>
        </span>
      )
    }
    return <CoinMedal a={a} size={size} />
  }
  return (
    <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-surface-2" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} />
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={ring} />
        {progress > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={main} strokeWidth={ring} strokeLinecap="round" strokeDasharray={`${c * Math.min(1, progress)} ${c}`} />}
      </svg>
      <svg className="relative" width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }} aria-hidden="true">
        <path d={a.glyph} />
      </svg>
    </span>
  )
}

/** Панель достижений. Свой профиль — все 6 (неполученные с прогрессом), чужой — только полученные. */
export function AchievementsPanel({ personId }: { personId: string }) {
  const { state } = useStore()
  const { earned: raw, progress, stats } = useAchievements(personId)
  // Амбассадор действует, пока значок не сняли: снятый — не показываем
  const isAmb = personId === 'me' ? state.me?.ambassador !== undefined : state.people.find((p) => p.id === personId)?.ambassador !== undefined
  const earned = raw && !isAmb && raw.ambassador ? Object.fromEntries(Object.entries(raw).filter(([c]) => c !== 'ambassador')) : raw
  const [open, setOpen] = useState<Achievement | null>(null)
  const [collOpen, setCollOpen] = useState(false)
  if (!earned) return null
  const mine = personId === 'me'
  const got = ACHIEVEMENTS.filter((a) => earned[a.code])
  const list = mine ? ACHIEVEMENTS.filter((a) => !a.special || earned[a.code]).sort((x, y) => Number(!!earned[y.code]) - Number(!!earned[x.code])) : got
  if (!list.length) return null
  const frac = (a: Achievement) => { if (!progress || !a.goal) return 0; const [n, of] = a.goal(progress); return n / of }
  const COLLECTION = ['first_meet', 'soul', 'reliable', 'guide', 'regular']
  const inSet = COLLECTION.filter((c) => earned[c]).length
  const comet = ACHIEVEMENTS.find((x) => x.code === 'collector')!
  const active = Math.min(progress?.active_invites ?? 0, 5)
  const at = open ? earned[open.code] : 0
  const g = open && progress && open.goal ? open.goal(progress) : null
  const holders = open && stats ? stats.by[open.code] ?? 0 : null
  const rare = holders !== null && stats ? (holders <= Math.max(1, stats.total * 0.1) ? 'редкое' : holders <= stats.total * 0.3 ? 'необычное' : 'обычное') : ''
  return (
    <section className="flex flex-col gap-2.5" aria-label="Достижения">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-muted">Достижения</span>
        {mine && <span className="text-[12px] text-muted tnum">{got.length} / {list.length}</span>}
      </div>
      {/* До 6 медалей — ровной сеткой; больше — ряд листается пальцем */}
      <div className={!mine ? 'flex flex-wrap justify-center gap-3' : list.length > 6 ? 'flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4' : 'grid grid-cols-6 gap-1 -mx-1'}>
        {list.map((a) => (
          <button key={a.code} onClick={() => setOpen(a)} className={`flex flex-col items-center gap-1 min-w-0 cursor-pointer ${mine && list.length > 6 ? 'w-[62px] shrink-0' : ''}`} aria-label={`${a.title}${earned[a.code] ? '' : ' — ещё не получено'}`}>
            <Medal a={a} got={!!earned[a.code]} size={50} progress={frac(a)} />
            <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap ${earned[a.code] ? 'text-fg font-medium' : 'text-muted'}`}>{a.short}</span>
          </button>
        ))}
      </div>
      {mine && !earned.collector && (
        <button onClick={() => setCollOpen(true)} className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3 py-2 text-left cursor-pointer" aria-label={`Комета: медали ${inSet} из 5, активные друзья ${active} из 5`}>
          <span className="flex gap-1 flex-1">
            {COLLECTION.map((c) => {
              const a = ACHIEVEMENTS.find((x) => x.code === c)!
              return <span key={c} className="h-1.5 flex-1 rounded-full" style={{ background: earned[c] ? `linear-gradient(90deg, ${a.colors[0]}, ${a.colors[1]})` : 'var(--line)' }} />
            })}
          </span>
          <span className="text-[12px] text-muted whitespace-nowrap">Комета <b className="text-fg tnum">{inSet}/5</b> · друзья <b className="text-fg tnum">{active}/5</b></span>
          <span className="text-[13px]" aria-hidden="true">☄️</span>
        </button>
      )}
      <Sheet open={collOpen} onClose={() => setCollOpen(false)} title="Комета">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="relative grid place-items-center py-2">
            <span className="absolute w-44 h-44 rounded-full blur-3xl opacity-40" style={{ background: comet.colors[1] }} />
            <Medal a={comet} got size={112} />
          </div>
          <h3 className="font-display font-bold text-[22px] leading-tight">Самая редкая медаль Komeeta</h3>
          <p className="text-[13px] text-muted -mt-1">Два условия — оба навсегда: медаль не забирается.</p>
          <span className="self-start text-[13px] font-semibold">1. Вся коллекция · <span className="tnum">{inSet} из 5</span></span>
          <div className="flex gap-2 justify-center">
            {COLLECTION.map((c) => { const a = ACHIEVEMENTS.find((x) => x.code === c)!; return <Medal key={c} a={a} got={!!earned[c]} size={44} progress={frac(a)} /> })}
          </div>
          <div className="w-full flex flex-col gap-1.5 text-left">
            <span className="text-[13px] font-semibold">2. Пять активных друзей · <span className="tnum">{active} из 5</span></span>
            <div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < active ? 'linear-gradient(90deg, #d8f3ff, #7a5cff)' : 'var(--line)' }} />)}</div>
            <span className="text-[12.5px] text-muted leading-snug">Друг пришёл по вашей ссылке и за первую неделю: заполнил фото и «о себе», выложил от 3 публикаций или планов, заходил 5 дней из 7 и переписывался не только с вами.{progress ? ` Пришло по ссылке: ${progress.invites}.` : ''}</span>
          </div>
          <div className="w-full rounded-2xl p-3.5 text-left" style={{ background: 'color-mix(in srgb, #7a5cff 14%, var(--surface-2))' }}>
            <span className="block text-[12px] font-semibold text-muted mb-1.5">Что даёт полная коллекция</span>
            <ul className="text-[14.5px] flex flex-col gap-1.5">
              {([['☄️', 'Радужная рамка «Комета» вокруг фото', true], ['🔝', 'Ваши планы в самом верху ленты', true], ['👁', 'Видно, кто смотрел ваши планы', true], ['🏛', 'Место в «Зале славы» Komeeta', false], ['🎁', 'Бонусы от заведений-партнёров', false]] as const).map(([e, t, live]) => (
                <li key={t} className="flex items-start gap-2"><span>{e}</span><span className="flex-1">{t}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white ${live ? 'bg-ok' : 'bg-[#7a5cff]'}`}>{live ? 'работает' : 'скоро'}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Sheet>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Достижение">
        {open && (
          <div className="flex flex-col items-center text-center gap-3 pb-2">
            <div className="relative grid place-items-center py-3">
              {!!at && <span className="absolute w-44 h-44 rounded-full blur-3xl opacity-40" style={{ background: open.colors[1] }} />}
              <Medal a={open} got={!!at} size={124} progress={g ? g[0] / g[1] : 0} shine={!!at} />
            </div>
            <h3 className="font-display font-bold text-[24px] leading-tight">{open.title}</h3>
            <p className="text-[13px] text-muted -mt-1">
              {at ? `Получено ${new Date(at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Ещё не получено'}
              {holders !== null && stats ? ` · есть у ${holders} из ${stats.total} · ${rare}` : ''}
            </p>
            {!at && g && (
              <div className="w-full flex flex-col gap-1.5 px-1">
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(g[0] / g[1]) * 100}%`, background: `linear-gradient(90deg, ${open.colors[0]}, ${open.colors[1]})` }} /></div>
                <span className="text-[12.5px] text-muted tnum self-end">{g[0]} из {g[1]}</span>
              </div>
            )}
            <div className="w-full flex flex-col gap-2 text-left mt-1">
              <div className="rounded-2xl bg-surface-2 p-3.5">
                <span className="block text-[12px] font-semibold text-muted mb-1">{at ? 'За что получено' : 'Как получить'}</span>
                <span className="text-[14.5px]">{open.how}</span>
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: `color-mix(in srgb, ${open.colors[1]} 12%, var(--surface-2))` }}>
                <span className="flex items-center gap-2 text-[12px] font-semibold text-muted mb-1">Что даёт {open.live
                  ? <span className="px-1.5 py-0.5 rounded-full text-[10.5px] bg-ok text-white">уже действует</span>
                  : <span className="px-1.5 py-0.5 rounded-full text-[10.5px] text-white" style={{ background: open.colors[1] }}>скоро</span>}</span>
                <span className="text-[14.5px]">{open.perk}</span>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </section>
  )
}

/** Всплывающее «Новое достижение» — ставится один раз в корне приложения. */
export function AchievementToast() {
  const [a, setA] = useState<Achievement | null>(null)
  useEffect(() => {
    showNew = (x) => { setA(x); setTimeout(() => setA((cur) => (cur === x ? null : cur)), 3000) }
    return () => { showNew = null }
  }, [])
  if (!a) return null
  return createPortal(
    <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[96] rounded-full bg-surface text-fg pl-1.5 pr-5 h-14 inline-flex items-center gap-3 shadow-soft ring-1 ring-line" role="status">
      <Medal a={a} got size={42} shine />
      <span className="flex flex-col leading-tight"><span className="text-[11.5px] text-muted">Новое достижение</span><b className="text-[15px]">{a.title}</b></span>
    </div>,
    document.body,
  )
}
