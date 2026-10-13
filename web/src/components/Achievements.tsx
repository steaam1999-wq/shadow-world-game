// Достижения: 6 редких медалей за то, ради чего существует Komeeta, — встречи, надёжность, друзья.
// Выдаёт их сервер (check_achievements) по данным базы, поэтому подделать нельзя.
// Нажатие на медаль — за что, прогресс, редкость и что она даст.
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { sb } from '../cloud/api'
import { Sheet } from './ui'
import { GoldPlanet } from './Invite'
import { MEDAL, METALS, METAL_NAME, PAD } from './medalMetals'

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
  { code: 'first_meet', title: 'Первая встреча', short: 'Встреча', colors: ['#f3c08e', '#c8782f', '#5a2e0c'],
    glyph: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19.5c.6-3.1 2.8-5.2 5.5-5.2s4.9 2.1 5.5 5.2M16 11a2.6 2.6 0 1 0 0-5.2M15.6 14.3c2.3.4 4.2 2.2 4.8 5.2',
    how: 'Встретиться с человеком из Komeeta и подтвердить встречу кодами.', perk: 'Значок «Встречался» рядом с именем, когда откликаетесь на план.',
    goal: (p) => [Math.min(p.met, 1), 1] },
  { code: 'soul', title: 'Душа компании', short: 'Душа', colors: ['#ffb3b9', '#d1243a', '#5c0a16'],
    glyph: 'M12 2.8c.9 3.3 5.2 5.5 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.3 1.2-3.9 2.7-5-.1 2 .7 3.4 2 3.9-1-3-.9-6.2.5-9.3z',
    how: 'На 5 ваших планов кто-то откликнулся.', perk: 'Ваши планы поднимаются выше в ленте.',
    goal: (p) => [Math.min(p.responded, 5), 5] },
  { code: 'reliable', title: 'Надёжный', short: 'Надёжный', colors: ['#b5d0ff', '#2f6fe0', '#0e2a66'],
    glyph: 'M12 3l7 3v5.2c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V6zM8.6 12.2l2.4 2.4 4.4-4.6',
    how: '5 подтверждённых встреч и ни одного пропуска.', perk: 'Метка «Надёжный» видна всем — с вами охотнее договариваются.',
    goal: (p) => [p.noshows ? 0 : Math.min(p.met, 5), 5] },
  { code: 'guide', title: 'Проводник', short: 'Проводник', colors: ['#a8f0c8', '#1fae6e', '#08462c'],
    glyph: 'M21 3 3 10.4l7.2 2.8L13 21zM10.2 13.2 21 3',
    how: 'Пригласить в Komeeta 3 друзей по своей ссылке.', perk: 'Особые цвета оформления профиля.',
    goal: (p) => [Math.min(p.invites, 3), 3] },
  { code: 'regular', title: 'Легенда', short: 'Легенда', colors: ['#e0c6ff', '#8e4fe0', '#3a1670'],
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

// ——— Медали — памятные монеты: только металл, гравировка, надпись по кругу, выпуклая матовая эмблема.
// Настоящее 3D (Three.js): в списке — кадр монеты под углом, в карточке — живая монета, вращается на ребре.
function starFacets(cx: number, cy: number, R: number, r: number) {
  const pt = (k: number, rad: number) => [cx + rad * Math.sin((k * Math.PI) / 5), cy - rad * Math.cos((k * Math.PI) / 5)].map((v) => v.toFixed(2)).join(' ')
  const out: [string, boolean][] = []
  for (let i = 0; i < 5; i++) {
    const o = pt(i * 2, R), l = pt(i * 2 - 1, r), rr = pt(i * 2 + 1, r)
    out.push([`M${cx} ${cy} L${l} L${o}Z`, true], [`M${cx} ${cy} L${o} L${rr}Z`, false])
  }
  return out
}
// Эмблемы — карты высоты: белое выше, серое ниже (viewBox 100). Строгая геральдика вместо картинок.
const EMBLEM: Record<string, () => ReactNode> = {
  // Два сцепленных кольца — встреча
  first_meet: () => <g fill="none" strokeWidth="7"><circle cx="38" cy="50" r="22" stroke="#fff" /><circle cx="62" cy="50" r="22" stroke="#d8d8d8" /><path d="M50 31.5a22 22 0 0 1 0 37" stroke="#fff" /></g>,
  // Пламя с внутренним языком
  soul: () => <>
    <path d="M50 8c6 16 24 24 24 46 0 17-11 30-24 30S26 71 26 54c0-12 7-20 14-26 0 10 4 16 9 18-5-12-4-26 1-38z" fill="#fff" />
    <path d="M50 40c4 10 13 14 13 26 0 9-6 15-13 15s-13-6-13-15c0-8 5-12 8-16 1 6 3 8 5 9-2-7-2-13 0-19z" fill="#9a9a9a" />
  </>,
  // Щит с выпуклой галочкой
  reliable: () => <>
    <path d="M50 8l32 10v26c0 22-14 37-32 46-18-9-32-24-32-46V18z" fill="#fff" />
    <path d="M50 18l23 7v19c0 16-10 28-23 35-13-7-23-19-23-35V25z" fill="#8c8c8c" />
    <path d="M37 50l9 9 17-18" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  // Роза ветров
  guide: () => <>
    <circle cx="50" cy="50" r="17" fill="none" stroke="#bbb" strokeWidth="2.5" />
    {[0, 90, 180, 270].map((d) => <g key={d} transform={`rotate(${d + 45} 50 50)`}><path d="M50 50L46 46 50 24z" fill="#9a9a9a" /><path d="M50 50L54 46 50 24z" fill="#7a7a7a" /></g>)}
    {[0, 90, 180, 270].map((d) => <g key={d} transform={`rotate(${d} 50 50)`}><path d="M50 50L44 44 50 6z" fill="#fff" /><path d="M50 50L56 44 50 6z" fill="#b8b8b8" /></g>)}
    <circle cx="50" cy="50" r="5" fill="#fff" />
  </>,
  // Лавровый венок и «10»
  regular: () => <>
    {[-1, 1].map((side) => Array.from({ length: 9 }, (_, i) => {
      const f = (128 + i * 14) * (Math.PI / 180) // левая дуга снизу вверх
      const x0 = 50 + 35 * Math.cos(f), y = 52 + 35 * Math.sin(f)
      const x = side < 0 ? x0 : 100 - x0
      const rot = (f * 180) / Math.PI + 90 + 28
      return <ellipse key={`${side}${i}`} cx={x} cy={y} rx="6.6" ry="2.9" fill={i % 2 ? '#e2e2e2' : '#fff'} transform={`rotate(${side < 0 ? rot : -rot} ${x} ${y})`} />
    }))}
    <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="700" fontFamily="Georgia, 'Times New Roman', serif" fill="#fff">10</text>
  </>,
  // Гранёная звезда
  ambassador: () => <>{starFacets(50, 53, 40, 17).map(([d, light], i) => <path key={i} d={d} fill={light ? '#fff' : '#a8a8a8'} />)}</>,
}
const XMLNS = (svg: string) => svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
function faceSpec(a: Achievement, render: (el: ReactElement) => string) {
  const m = MEDAL[a.code]
  return {
    key: a.code, metal: METALS[m.metal], rim: METALS[m.metal][1], iridescent: m.iridescent, title: a.title,
    emblem: a.code === 'founder' ? XMLNS(render(<GoldPlanet size={512} />))
      : EMBLEM[a.code] ? XMLNS(render(<svg viewBox="0 0 100 100" width="512" height="512">{EMBLEM[a.code]()}</svg>)) : undefined,
    sky: a.code === 'collector' ? XMLNS(render(<CometSky big />)).replace('width="100%" height="100%"', 'width="512" height="512"') : undefined,
    emblemScale: a.code === 'founder' ? 0.5 : 0.56,
  }
}
const cachedShot = (code: string, px: number) => { try { return localStorage.getItem(`komeeta-medal3d:v12:${code}:${px}`) } catch { return null } }
let webgl: boolean | null = null
const canWebGL = () => {
  if (webgl === null) { try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { webgl = false } }
  return webgl
}

function Coin3D({ a, size, spin = false }: { a: Achievement; size: number; spin?: boolean }) {
  const px = Math.round(size * Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 3))
  // Готовый 3D-кадр берём из памяти браузера: на чужих страницах медали появляются сразу, без пересчёта
  const [url, setUrl] = useState<string | null>(() => (spin ? null : cachedShot(a.code, px)))
  const [flat, setFlat] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!spin && cachedShot(a.code, px)) return
    let off = false
    let dispose: (() => void) | undefined
    void Promise.all([import('./medalFace'), import('react-dom/server')]).then(async ([f, srv]) => {
      const spec = faceSpec(a, srv.renderToStaticMarkup)
      const img = await f.faceImage(spec, px)
      if (off) return
      setFlat(img)
      if (!canWebGL()) return
      const m = await import('./medal3d')
      if (off) return
      if (spin) {
        if (!ref.current) return
        const d = await m.mountCoin(ref.current, spec, size)
        if (off) d(); else { dispose = d; setLive(true) }
      } else {
        const u = await m.snapshotCoin(spec, px)
        if (!off) setUrl(u)
      }
    }).catch(() => {})
    return () => { off = true; dispose?.() }
  }, [a, size, spin, px])
  const [light, base, dark] = METALS[MEDAL[a.code].metal]
  // Тень — мягкое пятно под монетой без CSS-фильтров: на iPhone фильтр на холсте с прозрачностью показывает рамку квадрата
  const PADX = PAD
  const off = -((PADX - 1) / 2) * size
  const big = size * PADX
  const ready = spin ? live : !!url
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute left-1/2 -translate-x-1/2 rounded-[50%] pointer-events-none" aria-hidden="true"
        style={{ bottom: -size * 0.05, width: size * 0.78, height: size * 0.16, background: 'radial-gradient(closest-side, rgb(0 0 0 / .42), transparent)', opacity: ready ? 1 : 0.6 }} />
      {!ready && (
        // Пока готовится 3D (или если его нет): металлический бортик и плоский аверс
        <span className="absolute inset-0 rounded-full" style={{ padding: Math.max(2, size * 0.06), background: `conic-gradient(from 210deg, ${light}, ${base}, ${dark}, ${base}, ${light}, ${base}, ${dark}, ${light})` }}>
          <span className="block w-full h-full rounded-full overflow-hidden" style={{ background: `radial-gradient(circle at 35% 30%, ${light}, ${base} 50%, ${dark})` }}>
            {flat && <img src={flat} alt="" draggable={false} className="w-full h-full select-none pointer-events-none" />}
          </span>
        </span>
      )}
      {spin && <canvas ref={ref} className="absolute touch-none cursor-grab" aria-hidden="true" style={{ left: off, top: off, width: big, height: big, opacity: live ? 1 : 0 }} />}
      {!spin && url && <img src={url} alt="" draggable={false} className="absolute select-none pointer-events-none" style={{ left: off, top: off, width: big, height: big }} />}
    </span>
  )
}

/** Медаль. Получена — монета; не получена — тёмное стекло, контур значка и кольцо прогресса. */
export function Medal({ a, got, size = 56, progress = 0, spin = false }: { a: Achievement; got: boolean; size?: number; progress?: number; shine?: boolean; spin?: boolean }) {
  const main = a.colors[1]
  const ring = Math.max(3, size * 0.075)
  const r = size / 2 - ring / 2
  const c = 2 * Math.PI * r
  if (got && MEDAL[a.code]) {
    if (a.code === 'ambassador' && size >= 90) {
      return (
        <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
          <Coin3D a={a} size={size} spin={spin} />
          <span className="absolute z-[1] -bottom-2 left-1/2 -translate-x-1/2 -rotate-6 px-3 py-1 rounded-lg font-display font-bold text-[12px] tracking-[.12em] text-white whitespace-nowrap"
            style={{ background: 'linear-gradient(95deg, #ff4f86, #8a5cff)', boxShadow: '0 8px 18px -6px rgb(255 79 134 / .8)' }}>АМБАССАДОР</span>
        </span>
      )
    }
    return <Coin3D a={a} size={size} spin={spin} />
  }
  // Крупная, но ещё не полученная — та же монета, приглушённая, с замком
  if (size >= 90 && MEDAL[a.code]) {
    return (
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
        <span className="block" style={{ filter: 'grayscale(1) contrast(.9)', opacity: 0.38 }}><Coin3D a={a} size={size} /></span>
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 grid place-items-center w-9 h-9 rounded-full bg-surface border border-line text-muted shadow-soft" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
      </span>
    )
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

function EyeIcon({ off, size = 14 }: { off?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}
    </svg>
  )
}

/** Панель достижений. Свой профиль — все 6 (неполученные с прогрессом), чужой — только полученные. */
export function AchievementsPanel({ personId }: { personId: string }) {
  const { state, dispatch } = useStore()
  const { earned: raw, progress, stats } = useAchievements(personId)
  // Амбассадор действует, пока значок не сняли: снятый — не показываем
  const isAmb = personId === 'me' ? state.me?.ambassador !== undefined : state.people.find((p) => p.id === personId)?.ambassador !== undefined
  const earned = raw && !isAmb && raw.ambassador ? Object.fromEntries(Object.entries(raw).filter(([c]) => c !== 'ambassador')) : raw
  const [open, setOpen] = useState<Achievement | null>(null)
  const [collOpen, setCollOpen] = useState(false)
  if (!earned) return null
  const mine = personId === 'me'
  // Что человек скрыл из панели: другие этих медалей не видят, он сам — видит с пометкой
  const style = mine ? state.me?.style : state.people.find((p) => p.id === personId)?.style
  const hidden = new Set(style?.hideAch ?? [])
  const allHidden = !!style?.hideAllAch
  const setStyle = (patch: Partial<NonNullable<typeof style>>) => dispatch({ type: 'updateMe', patch: { style: { ...state.me?.style, ...patch } } })
  const toggleHide = (code: string) => setStyle({ hideAch: hidden.has(code) ? [...hidden].filter((c) => c !== code) : [...hidden, code] })
  const got = ACHIEVEMENTS.filter((a) => earned[a.code])
  const list = mine ? ACHIEVEMENTS.filter((a) => !a.special || earned[a.code]).sort((x, y) => Number(!!earned[y.code]) - Number(!!earned[x.code])) : got.filter((a) => !hidden.has(a.code))
  if (!mine && allHidden) return null
  if (!list.length) return null
  const frac = (a: Achievement) => { if (!progress || !a.goal) return 0; const [n, of] = a.goal(progress); return n / of }
  const COLLECTION = ['first_meet', 'soul', 'reliable', 'guide', 'regular']
  const inSet = COLLECTION.filter((c) => earned[c]).length
  const comet = ACHIEVEMENTS.find((x) => x.code === 'collector')!
  const active = Math.min(progress?.active_invites ?? 0, 5)
  const at = open ? earned[open.code] : 0
  const g = open && progress && open.goal ? open.goal(progress) : null
  const holders = open && stats ? stats.by[open.code] ?? 0 : null
  const rare = holders !== null && stats ? (holders <= Math.max(1, stats.total * 0.1) ? 'редкая' : holders <= stats.total * 0.3 ? 'необычная' : 'обычная') : ''
  return (
    <section className="flex flex-col gap-2.5" aria-label="Достижения">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-muted">Достижения</span>
        {mine ? (
          <span className="flex items-center gap-3">
            <span className="text-[12px] text-muted tnum">{got.length} / {list.length}</span>
            <button type="button" onClick={() => setStyle({ hideAllAch: allHidden ? undefined : true })} aria-pressed={allHidden}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-line text-[12px] text-muted cursor-pointer">
              <EyeIcon off={allHidden} />{allHidden ? 'Скрыты от всех' : 'Видны всем'}
            </button>
          </span>
        ) : null}
      </div>
      {/* До 6 медалей — ровной сеткой; больше — ряд листается пальцем */}
      <div className={!mine ? 'flex flex-wrap justify-center gap-3' : list.length > 6 ? 'flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4' : 'grid grid-cols-6 gap-1 -mx-1'}>
        {list.map((a) => (
          <button key={a.code} onClick={() => setOpen(a)} className={`flex flex-col items-center gap-1 min-w-0 cursor-pointer ${mine && list.length > 6 ? 'w-[62px] shrink-0' : ''}`} aria-label={`${a.title}${earned[a.code] ? '' : ' — ещё не получено'}`}>
            <span className="relative">
              <span className={mine && (allHidden || hidden.has(a.code)) && earned[a.code] ? 'block opacity-55' : 'block'}><Medal a={a} got={!!earned[a.code]} size={56} progress={frac(a)} /></span>
              {mine && earned[a.code] && (allHidden || hidden.has(a.code)) && <span className="absolute -right-1 -bottom-1 grid place-items-center w-5 h-5 rounded-full bg-surface border border-line text-muted"><EyeIcon off size={11} /></span>}
            </span>
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
            <span className="absolute w-52 h-52 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(closest-side, #aab4ff, transparent)' }} />
            <Medal a={comet} got size={136} spin />
          </div>
          <h3 className="font-display font-bold text-[22px] leading-tight">Самая редкая медаль Komeeta</h3>
          <p className="text-[13px] text-muted -mt-1">Два условия — оба навсегда: медаль не забирается.</p>
          <span className="self-start text-[13px] font-semibold">1. Вся коллекция · <span className="tnum">{inSet} из 5</span></span>
          <div className="flex gap-2 justify-center">
            {COLLECTION.map((c) => { const a = ACHIEVEMENTS.find((x) => x.code === c)!; return <Medal key={c} a={a} got={!!earned[c]} size={50} progress={frac(a)} /> })}
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
        {open && (() => {
          const metal = MEDAL[open.code] ? METALS[MEDAL[open.code].metal] : open.colors
          const pct = holders !== null && stats?.total ? Math.max(1, Math.round((holders / stats.total) * 100)) : null
          return (
            <div className="flex flex-col items-center text-center pb-1">
              {/* Сцена: мягкий свет сверху и тень «на столе» под монетой */}
              <div className="relative grid place-items-center w-full pt-2 pb-5">
                <span className="absolute top-0 w-64 h-64 rounded-full opacity-[.2] pointer-events-none" style={{ background: `radial-gradient(closest-side, ${metal[0]}, transparent)` }} />
                <Medal a={open} got={!!at} size={150} progress={g ? g[0] / g[1] : 0} spin={!!at} />
                {!!at && <span className="absolute bottom-1 w-28 h-3 rounded-[50%] pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgb(0 0 0 / .45), transparent)' }} />}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[.2em] text-muted">
                {MEDAL[open.code] ? METAL_NAME[MEDAL[open.code].metal] : 'Медаль'}{rare ? ` · ${rare}` : ''}
              </span>
              <h3 className="mt-1.5 font-display font-bold text-[26px] leading-tight tracking-[-.01em] text-balance">{open.title}</h3>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-line text-[12.5px] text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full ${at ? 'bg-ok' : 'bg-line'}`} />
                  {at ? new Date(at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Ещё не получена'}
                </span>
                {holders !== null && stats && (
                  <span className="inline-flex items-center h-7 px-3 rounded-full border border-line text-[12.5px] text-muted tnum">
                    {holders} из {stats.total}{pct !== null ? ` · ${pct}%` : ''}
                  </span>
                )}
              </div>
              {!at && g && (
                <div className="w-full mt-4 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[12px] text-muted tnum"><span>Прогресс</span><span>{g[0]} / {g[1]}</span></div>
                  <div className="h-1 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(g[0] / g[1]) * 100}%`, background: `linear-gradient(90deg, ${metal[1]}, ${metal[0]})` }} /></div>
                </div>
              )}
              {mine && !!at && (
                <label htmlFor="ach-visible" className="w-full mt-4 flex items-center gap-3 rounded-[20px] border border-line px-4 py-3 text-left cursor-pointer">
                  <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full border border-line text-muted"><EyeIcon off={hidden.has(open.code) || allHidden} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium">Показывать в профиле</span>
                    <span className="block text-[12.5px] text-muted">{allHidden ? 'Сейчас все достижения скрыты' : hidden.has(open.code) ? 'Другие не видят эту медаль' : 'Эту медаль видят все'}</span>
                  </span>
                  <span className="relative w-[46px] h-7 shrink-0">
                    <input id="ach-visible" type="checkbox" role="switch" checked={!hidden.has(open.code) && !allHidden} disabled={allHidden}
                      onChange={() => toggleHide(open.code)} className="absolute inset-0 opacity-0 z-[1] cursor-pointer" />
                    <span className={`absolute inset-0 rounded-full transition-colors ${!hidden.has(open.code) && !allHidden ? 'bg-ok' : 'bg-line'}`} />
                    <span className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${!hidden.has(open.code) && !allHidden ? 'translate-x-[18px]' : ''}`} />
                  </span>
                </label>
              )}
              <div className="w-full mt-5 rounded-[20px] border border-line overflow-hidden text-left">
                <div className="flex gap-3 p-4">
                  <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full border border-line text-muted" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /></svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{at ? 'За что' : 'Условие'}</span>
                    <p className="mt-1 text-[15px] leading-snug">{open.how}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 border-t border-line">
                  <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full border border-line text-muted" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" /><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" opacity=".6" /></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Привилегия</span>
                      <span className={`inline-flex items-center gap-1 text-[11.5px] ${open.live ? 'text-ok' : 'text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${open.live ? 'bg-ok' : 'bg-muted/60'}`} />{open.live ? 'Действует' : 'Скоро'}
                      </span>
                    </span>
                    <p className="mt-1 text-[15px] leading-snug">{open.perk}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
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

