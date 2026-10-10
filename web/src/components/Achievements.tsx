// Достижения: 6 редких медалей за то, ради чего существует Komeeta, — встречи, надёжность, друзья.
// Выдаёт их сервер (check_achievements) по данным базы, поэтому подделать нельзя.
// Нажатие на медаль — за что, прогресс, редкость и что она даст.
import { useEffect, useState } from 'react'
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
  { code: 'first_meet', title: 'Первая встреча', short: 'Встреча', colors: ['#ffd1dc', '#ff5d8f', '#b4185a'],
    glyph: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19.5c.6-3.1 2.8-5.2 5.5-5.2s4.9 2.1 5.5 5.2M16 11a2.6 2.6 0 1 0 0-5.2M15.6 14.3c2.3.4 4.2 2.2 4.8 5.2',
    how: 'Встретиться с человеком из Komeeta и подтвердить встречу кодами.', perk: 'Значок «Встречался» рядом с именем, когда откликаетесь на план.',
    goal: (p) => [Math.min(p.met, 1), 1] },
  { code: 'soul', title: 'Душа компании', short: 'Душа', colors: ['#ffe0b0', '#ff8a3d', '#b8450f'],
    glyph: 'M12 2.8c.9 3.3 5.2 5.5 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.3 1.2-3.9 2.7-5-.1 2 .7 3.4 2 3.9-1-3-.9-6.2.5-9.3z',
    how: 'На 5 ваших планов кто-то откликнулся.', perk: 'Ваши планы поднимаются выше в ленте.',
    goal: (p) => [Math.min(p.responded, 5), 5] },
  { code: 'reliable', title: 'Надёжный', short: 'Надёжный', colors: ['#c8f7dc', '#22c08a', '#0b6e4c'],
    glyph: 'M12 3l7 3v5.2c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V6zM8.6 12.2l2.4 2.4 4.4-4.6',
    how: '5 подтверждённых встреч и ни одного пропуска.', perk: 'Метка «Надёжный» видна всем — с вами охотнее договариваются.',
    goal: (p) => [p.noshows ? 0 : Math.min(p.met, 5), 5] },
  { code: 'guide', title: 'Проводник', short: 'Проводник', colors: ['#e2d6ff', '#8a5cff', '#4b23b8'],
    glyph: 'M21 3 3 10.4l7.2 2.8L13 21zM10.2 13.2 21 3',
    how: 'Пригласить в Komeeta 3 друзей по своей ссылке.', perk: 'Особые цвета оформления профиля.',
    goal: (p) => [Math.min(p.invites, 3), 3] },
  { code: 'regular', title: 'Легенда', short: 'Легенда', colors: ['#fff1b8', '#f5b31b', '#9a6206'],
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

/** Медаль: металлический ободок, глянец, белый значок. Не получена — тёмное стекло и кольцо прогресса. */
export function Medal({ a, got, size = 56, progress = 0, shine = false }: { a: Achievement; got: boolean; size?: number; progress?: number; shine?: boolean }) {
  const [light, main, dark] = a.colors
  const ring = Math.max(3, size * 0.075)
  const r = size / 2 - ring / 2
  const c = 2 * Math.PI * r
  // Комета — за всю коллекцию: космос, радужный ободок, хвост кометы
  if (a.code === 'collector' && got) {
    return (
      <span className="relative inline-grid place-items-center shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 ${size * 0.12}px ${size * 0.4}px -${size * 0.1}px rgb(122 92 255 / .8)` }}>
        <span className="gold-ring-spin absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #ffb347, #ff4f86, #8a5cff, #4aa8ff, #3fd18f, #ffd27a, #ffb347)' }} />
        <span className="absolute rounded-full overflow-hidden" style={{ inset: ring, background: 'radial-gradient(circle at 30% 25%, #3a2a7a 0%, #160b33 55%, #07030f 100%)' }}>
          {[[0.22, 0.3], [0.7, 0.22], [0.3, 0.75], [0.78, 0.66], [0.55, 0.5]].map(([x, y], i) => (
            <span key={i} className="gold-twinkle absolute rounded-full bg-white" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: Math.max(1.5, size * 0.025), height: Math.max(1.5, size * 0.025), animationDelay: `${i * 0.5}s` }} />
          ))}
          <span className="medal-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
        </span>
        <svg className="relative" width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: `drop-shadow(0 0 ${size * 0.07}px rgb(160 200 255 / .95))` }}>
          <defs><linearGradient id="comet-tail" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" /></linearGradient></defs>
          <path d="M8 16 21 3" stroke="url(#comet-tail)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M8.5 13.5 17 5M10.5 18 19 9.5" stroke="url(#comet-tail)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7.5" cy="16.5" r="4.6" fill="#fff" />
          <circle cx="7.5" cy="16.5" r="2.4" fill="#d8ecff" />
        </svg>
      </span>
    )
  }
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
