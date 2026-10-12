// Достижения: 6 редких медалей за то, ради чего существует Komeeta, — встречи, надёжность, друзья.
// Выдаёт их сервер (check_achievements) по данным базы, поэтому подделать нельзя.
// Нажатие на медаль — за что, прогресс, редкость и что она даст.
import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { sb } from '../cloud/api'
import { Sheet } from './ui'
import { GoldPlanet } from './Invite'

type Progress = { met: number; responded: number; invites: number; noshows: number }
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
    how: 'Собрать всю коллекцию: «Первая встреча», «Душа компании», «Надёжный», «Проводник» и «Легенда».',
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

// ——— Пять медалей коллекции: металлический ободок и маленькая сцена внутри, как на коллекционной монете ———
type Scene = { bezel: string; glow: string; draw: (id: string, big: boolean) => ReactNode }
const metal = (a: string, b: string, c: string, d: string) =>
  `conic-gradient(from 210deg, ${a}, ${b} 10%, ${c} 22%, ${b} 34%, ${a} 46%, ${d} 58%, ${c} 70%, ${b} 82%, ${a} 92%, ${a})`
const SCENES: Record<string, Scene> = {
  // Первая встреча — бронза: две светящиеся точки сходятся на закатном небе, между ними искра
  first_meet: {
    bezel: metal('#ffe2c4', '#c98a55', '#6e3b17', '#e8b48a'), glow: 'rgb(230 140 80 / .55)',
    draw: (id, big) => <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1640" /><stop offset=".55" stopColor="#a8435a" /><stop offset="1" stopColor="#f2a35e" /></linearGradient>
        <radialGradient id={`sun-${id}`}><stop offset="0" stopColor="#fff3d6" /><stop offset=".4" stopColor="#ffc27a" stopOpacity=".8" /><stop offset="1" stopColor="#ff8a4d" stopOpacity="0" /></radialGradient>
        <radialGradient id={`dot-${id}`}><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor="#fff2df" /><stop offset="1" stopColor="#ffd5a8" stopOpacity="0" /></radialGradient>
        <filter id={`b-${id}`}><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <rect width="100" height="100" fill={`url(#sky-${id})`} />
      <circle cx="50" cy="78" r="30" fill={`url(#sun-${id})`} />
      <path d="M0 80 Q25 70 50 76 T100 72 V100 H0Z" fill="#3b1a2e" opacity=".85" />
      <path d="M0 88 Q30 80 60 86 T100 84 V100 H0Z" fill="#24101e" />
      <path d="M14 66 Q32 46 46 50" stroke="#ffe3c2" strokeWidth={big ? 0.8 : 1.4} fill="none" strokeDasharray="1.5 2.5" opacity=".7" />
      <path d="M86 66 Q68 46 54 50" stroke="#ffe3c2" strokeWidth={big ? 0.8 : 1.4} fill="none" strokeDasharray="1.5 2.5" opacity=".7" />
      <circle cx="43" cy="50" r={big ? 7 : 9} fill={`url(#dot-${id})`} filter={`url(#b-${id})`} />
      <circle cx="57" cy="50" r={big ? 7 : 9} fill={`url(#dot-${id})`} filter={`url(#b-${id})`} />
      <circle cx="43" cy="50" r={big ? 2.4 : 3.4} fill="#fff" />
      <circle cx="57" cy="50" r={big ? 2.4 : 3.4} fill="#fff" />
      <path d="M50 41 L51.2 48.8 L59 50 L51.2 51.2 L50 59 L48.8 51.2 L41 50 L48.8 48.8Z" fill="#fff" opacity=".95" />
    </>,
  },
  // Душа компании — розовое золото: костёр, вокруг собрались огоньки
  soul: {
    bezel: metal('#ffe3dc', '#e0a08f', '#8a4a3c', '#f4c2b4'), glow: 'rgb(255 130 80 / .55)',
    draw: (id, big) => <>
      <defs>
        <radialGradient id={`n-${id}`} cx="50%" cy="70%" r="80%"><stop offset="0" stopColor="#5a2418" /><stop offset=".5" stopColor="#24121c" /><stop offset="1" stopColor="#0c0710" /></radialGradient>
        <radialGradient id={`f-${id}`} cx="50%" cy="85%" r="70%"><stop offset="0" stopColor="#fff6c8" /><stop offset=".35" stopColor="#ffb340" /><stop offset=".75" stopColor="#ff5a1f" /><stop offset="1" stopColor="#c21f0a" stopOpacity="0" /></radialGradient>
        <radialGradient id={`gl-${id}`}><stop offset="0" stopColor="#ff9a3d" stopOpacity=".7" /><stop offset="1" stopColor="#ff9a3d" stopOpacity="0" /></radialGradient>
        <radialGradient id={`p-${id}`}><stop offset="0" stopColor="#fff" /><stop offset=".4" stopColor="#ffd9a8" /><stop offset="1" stopColor="#ffb070" stopOpacity="0" /></radialGradient>
        <filter id={`b-${id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <rect width="100" height="100" fill={`url(#n-${id})`} />
      <circle cx="50" cy="66" r="34" fill={`url(#gl-${id})`} />
      <path d="M50 30 C58 42 66 48 62 62 C60 70 55 74 50 74 C45 74 40 70 38 62 C35 51 44 46 46 38 C47 44 50 46 52 46 C50 40 49 35 50 30Z" fill={`url(#f-${id})`} filter={`url(#b-${id})`} />
      <path d="M50 46 C54 53 57 57 55 64 C54 68 52 70 50 70 C48 70 46 68 45 64 C44 58 48 55 50 46Z" fill="#fff4cf" opacity=".9" />
      <path d="M34 78 L66 70 M34 70 L66 78" stroke="#3a1a10" strokeWidth="3.4" strokeLinecap="round" />
      {[[18, 60], [26, 40], [74, 40], [82, 60], [50, 18]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r={big ? 5.5 : 7} fill={`url(#p-${id})`} /><circle cx={x} cy={y} r={big ? 1.6 : 2.4} fill="#fff" /></g>
      ))}
    </>,
  },
  // Надёжный — сталь: рельефный щит с галочкой на глубоком синем
  reliable: {
    bezel: metal('#eef3f8', '#9aa8b8', '#3e4a5a', '#c9d3de'), glow: 'rgb(60 140 230 / .5)',
    draw: (id, big) => <>
      <defs>
        <radialGradient id={`bg-${id}`} cx="45%" cy="35%" r="80%"><stop offset="0" stopColor="#1f4f8f" /><stop offset=".6" stopColor="#0c2347" /><stop offset="1" stopColor="#050c1c" /></radialGradient>
        <linearGradient id={`sh-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f8ff" /><stop offset=".45" stopColor="#a9bdd6" /><stop offset=".55" stopColor="#7f95b2" /><stop offset="1" stopColor="#d6e1ef" /></linearGradient>
        <linearGradient id={`in-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f78d8" /><stop offset="1" stopColor="#0f3b80" /></linearGradient>
        <filter id={`b-${id}`}><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <rect width="100" height="100" fill={`url(#bg-${id})`} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M50 50 L${50 + 60 * Math.cos((i * Math.PI) / 6)} ${50 + 60 * Math.sin((i * Math.PI) / 6)}`} stroke="#5c9cff" strokeWidth="5" opacity=".05" />)}
      <path d="M50 20 L74 29 V48 C74 63 64 75 50 82 C36 75 26 63 26 48 V29Z" fill="#000" opacity=".4" filter={`url(#b-${id})`} transform="translate(0 3)" />
      <path d="M50 20 L74 29 V48 C74 63 64 75 50 82 C36 75 26 63 26 48 V29Z" fill={`url(#sh-${id})`} />
      <path d="M50 26 L69 33 V48 C69 60 61 70 50 76 C39 70 31 60 31 48 V33Z" fill={`url(#in-${id})`} />
      <path d="M40 49 L47 56 L61 41" stroke="#fff" strokeWidth={big ? 5 : 6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M50 26 L69 33 V40 C60 36 42 36 31 41 V33Z" fill="#fff" opacity=".14" />
    </>,
  },
  // Проводник — нефрит: маяк светит лучом в ночное море
  guide: {
    bezel: metal('#e3fff3', '#7fcfae', '#1f6a52', '#b8ecd6'), glow: 'rgb(60 210 160 / .5)',
    draw: (id, big) => <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06141f" /><stop offset=".65" stopColor="#0f3a46" /><stop offset="1" stopColor="#14594f" /></linearGradient>
        <linearGradient id={`beam-${id}`} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#fff7d1" stopOpacity="0" /><stop offset="1" stopColor="#fff7d1" stopOpacity=".75" /></linearGradient>
        <radialGradient id={`lamp-${id}`}><stop offset="0" stopColor="#fff" /><stop offset=".3" stopColor="#fff2b0" /><stop offset="1" stopColor="#ffd75e" stopOpacity="0" /></radialGradient>
        <filter id={`b-${id}`}><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <rect width="100" height="100" fill={`url(#sky-${id})`} />
      {[[16, 18], [30, 10], [70, 14], [86, 26], [60, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={big ? 0.6 : 1} fill="#fff" opacity=".7" />)}
      <path d="M56 34 L100 18 L100 42Z" fill={`url(#beam-${id})`} filter={`url(#b-${id})`} />
      <path d="M44 34 L0 22 L0 44Z" fill={`url(#beam-${id})`} filter={`url(#b-${id})`} transform="scale(-1 1) translate(-100 0)" opacity=".6" />
      <path d="M0 74 Q25 70 50 74 T100 72 V100 H0Z" fill="#0a2a33" />
      <path d="M8 80 Q20 78 32 80 M60 82 Q74 79 88 82 M30 88 Q45 86 60 88" stroke="#5fd3b3" strokeWidth="1" opacity=".5" fill="none" />
      <path d="M44 74 L46.5 40 H53.5 L56 74Z" fill="#f2f5f4" />
      <path d="M45.3 56 H54.7 L55.3 64 H44.7Z M46 44 H54 L54.4 50 H45.6Z" fill="#d0463e" />
      <rect x="45" y="33" width="10" height="7" rx="1" fill="#1c2b30" />
      <path d="M44 33 L50 27 L56 33Z" fill="#d0463e" />
      <circle cx="50" cy="36.5" r={big ? 9 : 12} fill={`url(#lamp-${id})`} />
      <circle cx="50" cy="36.5" r="2.2" fill="#fff" />
    </>,
  },
  // Легенда — тёмное золото: лавровый венок, над ним дугой — 10 звёзд (10 встреч)
  regular: {
    bezel: metal('#fff4cf', '#d9a43a', '#6b4508', '#f2cf7c'), glow: 'rgb(240 180 60 / .55)',
    draw: (id, big) => {
      const stars = Array.from({ length: 10 }, (_, i) => { const t = Math.PI * (1.08 + (i / 9) * 0.84); return [50 + 30 * Math.cos(t), 56 + 30 * Math.sin(t)] as const })
      const leaves = Array.from({ length: 7 }, (_, i) => i / 6)
      return <>
        <defs>
          <radialGradient id={`bg-${id}`} cx="50%" cy="40%" r="80%"><stop offset="0" stopColor="#3b2a5c" /><stop offset=".6" stopColor="#181033" /><stop offset="1" stopColor="#07050f" /></radialGradient>
          <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c2" /><stop offset=".45" stopColor="#e2ad3f" /><stop offset="1" stopColor="#8a5a0c" /></linearGradient>
          <radialGradient id={`s-${id}`}><stop offset="0" stopColor="#fff" /><stop offset=".4" stopColor="#ffe9a8" /><stop offset="1" stopColor="#ffd25e" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#bg-${id})`} />
        <path d={`M${stars[0][0]} ${stars[0][1]} A30 30 0 0 1 ${stars[9][0]} ${stars[9][1]}`} stroke="#ffe7a3" strokeWidth={big ? 0.5 : 0.9} opacity=".3" fill="none" />
        {stars.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={big ? 3.4 : 4.6} fill={`url(#s-${id})`} /><circle cx={x} cy={y} r={big ? 1.1 : 1.7} fill="#fff" /></g>)}
        {[1, -1].map((side) => (
          <g key={side} transform={side > 0 ? undefined : 'translate(100 0) scale(-1 1)'}>
            <path d="M48 84 C34 82 24 72 24 56" stroke={`url(#gold-${id})`} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {leaves.map((t) => {
              const ang = Math.PI * (0.5 + t * 0.62)
              const x = 48 - 24 * Math.sin(t * 1.25) * 1.0 - (t > 0.6 ? 2 : 0), y = 84 - 28 * t
              const r = (-ang * 180) / Math.PI
              return <g key={t}>
                <ellipse cx={x - 3.2} cy={y - 1} rx="1.6" ry="4" fill={`url(#gold-${id})`} transform={`rotate(${r + 150} ${x - 3.2} ${y - 1})`} />
                <ellipse cx={x + 1.6} cy={y - 2.6} rx="1.6" ry="4" fill={`url(#gold-${id})`} transform={`rotate(${r + 200} ${x + 1.6} ${y - 2.6})`} />
              </g>
            })}
          </g>
        ))}
        <text x="50" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill={`url(#gold-${id})`} fontFamily="Unbounded, Onest, sans-serif">10</text>
      </>
    },
  },
}

function SceneMedal({ code, size, ring, shine }: { code: string; size: number; ring: number; shine?: boolean }) {
  const id = useId().replace(/:/g, '')
  const sc = SCENES[code]
  const big = size >= 40
  return (
    <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 ${size * 0.12}px ${size * 0.36}px -${size * 0.1}px ${sc.glow}` }}>
      <span className="absolute inset-0 rounded-full" style={{ background: sc.bezel }} />
      <span className="gold-ring-spin absolute inset-0 rounded-full mix-blend-screen" style={{ background: 'conic-gradient(from 0deg, transparent 0 72%, rgb(255 255 255 / .75) 81%, transparent 90%)' }} />
      <span className="absolute rounded-full" style={{ inset: ring * 0.55, boxShadow: 'inset 0 1px 1px rgb(0 0 0 / .45), 0 1px 0 rgb(255 255 255 / .5)' }} />
      <span className="absolute rounded-full overflow-hidden" style={{ inset: ring }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="block" aria-hidden="true">
          {sc.draw(id, big)}
          <radialGradient id={`v-${id}`}><stop offset=".68" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
          <rect width="100" height="100" fill={`url(#v-${id})`} />
        </svg>
        {shine && <span className="medal-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />}
      </span>
    </span>
  )
}

const COMET_STARS: [number, number, number, number][] = [
  [14, 22, 0.55, 0.9], [26, 12, 0.35, 0.6], [44, 20, 0.45, 0.8], [58, 9, 0.3, 0.5], [82, 44, 0.5, 0.85], [88, 62, 0.35, 0.6], [70, 78, 0.45, 0.7],
  [52, 88, 0.3, 0.5], [18, 46, 0.3, 0.55], [10, 70, 0.4, 0.7], [62, 60, 0.28, 0.45], [36, 40, 0.25, 0.4], [76, 24, 0.3, 0.5], [24, 86, 0.3, 0.5],
]

/** Медаль «Комета»: металл и космос без мультяшности — как фото кометы в объективе. */
function CometMedal({ size, ring }: { size: number; ring: number }) {
  const id = useId().replace(/:/g, '')
  const big = size >= 40
  return (
    <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 ${size * 0.12}px ${size * 0.38}px -${size * 0.1}px rgb(70 110 220 / .55)` }}>
      {/* Платиновый ободок: холодный металл с бегущим бликом */}
      <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #eef3ff, #9aa5c0 10%, #3b4259 22%, #aeb8d0 34%, #f6f9ff 46%, #6f7a97 58%, #2c3247 70%, #9ea9c4 82%, #dfe6f6 92%, #eef3ff)' }} />
      <span className="gold-ring-spin absolute inset-0 rounded-full mix-blend-screen" style={{ background: 'conic-gradient(from 0deg, transparent 0 70%, rgb(220 235 255 / .9) 80%, transparent 90%)' }} />
      <span className="absolute rounded-full" style={{ inset: ring * 0.55, boxShadow: 'inset 0 1px 1px rgb(0 0 0 / .45), 0 1px 0 rgb(255 255 255 / .5)' }} />
      <span className="absolute rounded-full overflow-hidden" style={{ inset: ring }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="block" aria-hidden="true">
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
        <span className="medal-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg]" />
      </span>
    </span>
  )
}

/** Медаль: металлический ободок, глянец, белый значок. Не получена — тёмное стекло и кольцо прогресса. */
export function Medal({ a, got, size = 56, progress = 0, shine = false }: { a: Achievement; got: boolean; size?: number; progress?: number; shine?: boolean }) {
  const [light, main, dark] = a.colors
  const ring = Math.max(3, size * 0.075)
  const r = size / 2 - ring / 2
  const c = 2 * Math.PI * r
  // Комета — за всю коллекцию: платиновый ободок, глубокий космос с туманностью и настоящая комета (ядро, кома, два хвоста)
  if (a.code === 'collector' && got) return <CometMedal size={size} ring={ring} />
  if (got && SCENES[a.code]) return <SceneMedal code={a.code} size={size} ring={ring} shine={shine} />
  // Амбассадор — фирменные цвета Komeeta: вращающийся ободок, звезда со свечением, лента на большой медали
  if (a.code === 'ambassador' && got) {
    return (
      <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 ${size * 0.12}px ${size * 0.34}px -${size * 0.1}px rgb(255 79 134 / .7)` }}>
        <span className="gold-ring-spin absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #ffb347, #ff4f86 33%, #8a5cff 66%, #ffb347)' }} />
        <span className="absolute rounded-full overflow-hidden" style={{ inset: ring, background: 'radial-gradient(circle at 34% 28%, #ff9cbd 0%, #e2306f 42%, #5b23b8 100%)', boxShadow: `inset 0 ${size * 0.03}px 0 rgb(255 255 255 / .4), inset 0 -${size * 0.06}px ${size * 0.12}px rgb(30 0 60 / .35)` }}>
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-b-[50%] bg-gradient-to-b from-white/30 to-transparent" />
          <span className="medal-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
        </span>
        <svg className="relative" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: `drop-shadow(0 0 ${size * 0.06}px rgb(255 220 240 / .9))` }}>
          <path d={a.glyph} fill="#fff" />
        </svg>
        {size >= 90 && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 -rotate-6 px-3 py-1 rounded-lg font-display font-bold text-[12px] tracking-[.12em] text-white whitespace-nowrap"
            style={{ background: 'linear-gradient(95deg, #ff4f86, #8a5cff)', boxShadow: '0 8px 18px -6px rgb(255 79 134 / .8)' }}>АМБАССАДОР</span>
        )}
      </span>
    )
  }
  // Основатель — живое золото с логотипом Komeeta, как медаль на экране приветствия
  if (a.code === 'founder' && got) {
    return (
      <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 ${size * 0.12}px ${size * 0.34}px -${size * 0.1}px rgb(233 185 73 / .75)` }}>
        {/* Ободок вращается — ровный блик «бежит» по кругу */}
        <span className="gold-ring-spin absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #fff3c4, #d9a33a 25%, #8a5a12 37%, #d9a33a 50%, #fff3c4 62%, #d9a33a 75%, #8a5a12 87%, #fff3c4)' }} />
        {/* Золотой диск строго по центру (обёртка задаёт размер — у .gold-medal своё позиционирование) */}
        <span className="absolute" style={{ inset: ring }}>
          <span className="gold-medal grid place-items-center w-full h-full">
            <GoldPlanet size={size * 0.62} />
          </span>
        </span>
        {/* Искорки — внутри границ медали, симметрично */}
        {[[0.7, 0.04, 0], [0.04, 0.72, 1.3]].map(([x, y, d], i) => (
          <svg key={i} className="gold-twinkle absolute pointer-events-none" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: size * 0.22, height: size * 0.22, animationDelay: `${d}s` }} viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#fff6cf" d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
          </svg>
        ))}
      </span>
    )
  }
  return (
    <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size }}>
      {got ? (
        <>
          <span className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 210deg, ${light}, ${main}, ${dark}, ${main}, ${light}, ${main}, ${dark}, ${light})`, boxShadow: `0 ${size * 0.12}px ${size * 0.32}px -${size * 0.12}px ${main}` }} />
          <span className="absolute rounded-full overflow-hidden" style={{ inset: ring, background: `radial-gradient(circle at 32% 28%, ${light} 0%, ${main} 45%, ${dark} 100%)`, boxShadow: `inset 0 ${size * 0.03}px 0 rgb(255 255 255 / .45), inset 0 -${size * 0.06}px ${size * 0.12}px rgb(0 0 0 / .28)` }}>
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-b-[50%] bg-gradient-to-b from-white/35 to-transparent" />
            {shine && <span className="medal-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-[-20deg]" />}
          </span>
        </>
      ) : (
        <>
          <span className="absolute inset-0 rounded-full bg-surface-2" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} />
          <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={ring} />
            {progress > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={main} strokeWidth={ring} strokeLinecap="round" strokeDasharray={`${c * Math.min(1, progress)} ${c}`} />}
          </svg>
        </>
      )}
      <svg className="relative" width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke={got ? '#fff' : 'var(--muted)'} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
        style={got ? { filter: `drop-shadow(0 ${size * 0.02}px ${size * 0.03}px ${dark})` } : { opacity: 0.55 }} aria-hidden="true">
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
        <button onClick={() => setCollOpen(true)} className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3 py-2 text-left cursor-pointer" aria-label={`Коллекция: ${inSet} из 5. Что дадут за полную коллекцию`}>
          <span className="flex gap-1 flex-1">
            {COLLECTION.map((c) => {
              const a = ACHIEVEMENTS.find((x) => x.code === c)!
              return <span key={c} className="h-1.5 flex-1 rounded-full" style={{ background: earned[c] ? `linear-gradient(90deg, ${a.colors[0]}, ${a.colors[1]})` : 'var(--line)' }} />
            })}
          </span>
          <span className="text-[12px] text-muted whitespace-nowrap">Коллекция <b className="text-fg tnum">{inSet}/5</b> · награда</span>
          <span className="text-[13px]" aria-hidden="true">☄️</span>
        </button>
      )}
      <Sheet open={collOpen} onClose={() => setCollOpen(false)} title="Коллекция">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="relative grid place-items-center py-2">
            <span className="absolute w-44 h-44 rounded-full blur-3xl opacity-40" style={{ background: comet.colors[1] }} />
            <Medal a={comet} got size={112} />
          </div>
          <h3 className="font-display font-bold text-[22px] leading-tight">Соберите все 5 — получите «Комету»</h3>
          <p className="text-[13px] text-muted -mt-1">Самая редкая медаль Komeeta. Собрано {inSet} из 5.</p>
          <div className="flex gap-2 justify-center">
            {COLLECTION.map((c) => { const a = ACHIEVEMENTS.find((x) => x.code === c)!; return <Medal key={c} a={a} got={!!earned[c]} size={44} progress={frac(a)} /> })}
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
