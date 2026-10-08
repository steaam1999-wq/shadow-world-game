import { useEffect, useId, useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { claimReferral, founderBoost, founderWall, humanError, myInvites, type InviteStats } from '../cloud/api'
import { useOpenProfile } from '../nav'
import { Avatar, BUBBLE, Icon, RINGS, Sheet, Toggle } from './ui'

// Друзья зовут друзей: ссылка на план (или на приложение) несёт id пригласившего.
// Три активных друга — значок «Основатель Komeeta» (первые 100), и неделю планы основателя выше в ленте.

const REF_KEY = 'komeeta-ref'
const PLAN_KEY = 'komeeta-open-plan'
const USER_KEY = 'komeeta-open-user'
export const FOUNDER_BOOST_MS = 7 * 86400_000

/** Ссылка-приглашение: на конкретный план или просто в приложение. */
export function inviteUrl(userId?: string | null, planId?: string) {
  const base = `${location.origin}${location.pathname}`
  const parts = [planId && `plan=${planId}`, userId && `ref=${userId}`].filter(Boolean)
  return parts.length ? `${base}#${parts.join('&')}` : base
}

/** Ссылка на страницу человека (с приглашением от того, кто делится). */
export function profileUrl(personId: string, fromId?: string | null) {
  return `${location.origin}${location.pathname}#u=${personId}${fromId ? `&ref=${fromId}` : ''}`
}

/** Читает приглашение из адреса до того, как адрес заменят. */
export function captureInvite() {
  try {
    const h = location.hash
    const ref = /(?:^#|&)ref=([0-9a-f-]{36})(?:&|$)/i.exec(h)?.[1]
    const plan = /(?:^#|&)plan=([\w-]{1,64})(?:&|$)/.exec(h)?.[1]
    if (ref) localStorage.setItem(REF_KEY, ref)
    if (plan) sessionStorage.setItem(PLAN_KEY, plan)
    const user = /(?:^#|&)u=([0-9a-f-]{36})(?:&|$)/i.exec(h)?.[1]
    if (user) sessionStorage.setItem(USER_KEY, user)
  } catch { /* ignore */ }
}

/** План, на который позвали по ссылке (забирается один раз). */
export function takeInvitedPlan() {
  try { const id = sessionStorage.getItem(PLAN_KEY); sessionStorage.removeItem(PLAN_KEY); return id } catch { return null }
}

/** Страница человека, которой поделились по ссылке. Забыть — когда открыли. */
export function invitedUser() {
  try { return sessionStorage.getItem(USER_KEY) } catch { return null }
}
export function forgetInvitedUser() {
  try { sessionStorage.removeItem(USER_KEY) } catch { /* ignore */ }
}

/** Пришёл ли человек по приглашению: для приветствия на входе. */
export function invitedBy(): 'plan' | 'profile' | 'app' | null {
  try {
    if (sessionStorage.getItem(PLAN_KEY)) return 'plan'
    if (sessionStorage.getItem(USER_KEY)) return 'profile'
    return localStorage.getItem(REF_KEY) ? 'app' : null
  } catch { return null }
}

/** После входа засчитываем приглашение пригласившему (сервер примет только от нового аккаунта). */
export function useClaimReferral() {
  const { state } = useStore()
  const userId = state.cloud?.userId
  const ready = !!state.me
  useEffect(() => {
    if (!userId || !ready) return
    let ref: string | null = null
    try { ref = localStorage.getItem(REF_KEY) } catch { /* ignore */ }
    if (!ref) return
    const done = () => { try { localStorage.removeItem(REF_KEY) } catch { /* ignore */ } }
    if (ref === userId) { done(); return }
    claimReferral(ref).then(done, () => { /* попробуем при следующем входе */ })
  }, [userId, ready])
}

/** Белая планета-облачко с кольцами (как в логотипе) — для золотой медали. */
function GoldPlanet({ size }: { size: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="relative z-[1] drop-shadow-[0_1px_1.5px_rgb(90_50_0/.45)]">
      <defs><clipPath id={`gf-${id}`}><rect x="0" y="20" width="40" height="20" /></clipPath></defs>
      <g transform="rotate(-16 20 20)" fill="none" stroke="#fff">
        {RINGS.map(([rx, ry, w, op], i) => <ellipse key={i} cx="20" cy="20" rx={rx} ry={ry} strokeWidth={w * 1.3} strokeOpacity={op * 0.5} />)}
      </g>
      <path d={BUBBLE} fill="#fff" />
      <g transform="rotate(-16 20 20)" clipPath={`url(#gf-${id})`} fill="none" stroke="#fff">
        {RINGS.map(([rx, ry, w, op], i) => <ellipse key={i} cx="20" cy="20" rx={rx} ry={ry} strokeWidth={w * 1.3} strokeOpacity={op} />)}
      </g>
      <g fill="#c48a1c">{[16.6, 20, 23.4].map((x) => <circle key={x} cx={x} cy="19.6" r="1.3" />)}</g>
    </svg>
  )
}

/** Золотая медаль с логотипом. */
export function FounderMedal({ size = 44 }: { size?: number }) {
  return (
    <span className="gold-medal grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <GoldPlanet size={size * 0.72} />
    </span>
  )
}

const FOUNDER_EVENT = 'komeeta:founder'
/** Открыть окно «Что даёт статус Основателя» из любого места. */
export const openFounderInfo = () => window.dispatchEvent(new Event(FOUNDER_EVENT))
export function useFounderInfoRequests(open: () => void) {
  useEffect(() => { window.addEventListener(FOUNDER_EVENT, open); return () => window.removeEventListener(FOUNDER_EVENT, open) }, [open])
}

export function FounderBadge({ n, small }: { n: number; small?: boolean }) {
  const label = `Основатель Komeeta №${n}`
  if (small) return <button type="button" onClick={openFounderInfo} title={label} aria-label={label} className="cursor-pointer"><FounderMedal size={18} /></button>
  return (
    <button type="button" onClick={openFounderInfo} className="inline-flex items-center gap-3 text-left cursor-pointer" aria-label={`${label}. Что даёт статус?`} title={label}>
      <span className="flex flex-col items-center shrink-0">
        <FounderMedal size={44} />
        <span className="gold-ribbon -mt-2 relative z-[2] px-2 rounded-md font-display font-bold text-[11px] leading-[17px] tnum">№{n}</span>
      </span>
      <b className="gold-text font-display text-[15.5px] leading-tight">Основатель Komeeta</b>
    </button>
  )
}

/** Золотая рамка вокруг фото основателя. */
export function GoldFrame({ on, children, medal = 0, corner = 'right', label, info }: { on: boolean; children: ReactNode; medal?: number; corner?: 'right' | 'left'; label?: string; info?: boolean }) {
  if (!on) return <>{children}</>
  return (
    <span className="relative inline-grid shrink-0 leading-[0]">
      <span className="gold-medal grid place-items-center leading-[0] p-[3px]"><span className="grid place-items-center leading-[0] rounded-full bg-surface p-[2px] relative z-[1]">{children}</span></span>
      {medal > 0 && <FounderCorner size={medal} corner={corner} label={label} info={info} />}
    </span>
  )
}

/** Золотая медаль-логотип на уголке аватарки — как значок «онлайн». */
export function FounderCorner({ size, corner = 'right', label, info }: { size: number; corner?: 'right' | 'left'; label?: string; info?: boolean }) {
  // info — нажатие открывает «Что даёт статус Основателя».
  const open = (e: React.SyntheticEvent) => { e.stopPropagation(); e.preventDefault(); openFounderInfo() }
  return (
    <span className={`absolute z-[3] bottom-[-2px] ${corner === 'right' ? 'right-[-3px]' : 'left-[-3px]'} rounded-full bg-surface p-[2px] leading-[0] ${info ? 'cursor-pointer' : ''}`}
      {...(info ? { role: 'button', tabIndex: 0, 'aria-label': `${label ?? 'Основатель Komeeta'}. Что даёт статус?`, title: label, onClick: open, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') open(e) } }
        : label ? { role: 'img', 'aria-label': label, title: label } : { 'aria-hidden': true })}>
      <FounderMedal size={size} />
    </span>
  )
}

export const BOOST_DAY_MS = 86400_000
const BOOST_EVERY_MS = 30 * 86400_000
const nextBoost = (me: { boostAt?: number } | null) => (me?.boostAt ? me.boostAt + BOOST_EVERY_MS : 0)
const dateRu = (t: number) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

/** Пункт меню своего плана: основатель поднимает его наверх ленты на сутки, раз в 30 дней. */
export function BoostPlanButton({ planId, onDone }: { planId: string; onDone: (msg: string) => void }) {
  const { state, dispatch } = useStore()
  const [busy, setBusy] = useState(false)
  const me = state.me
  if (!me?.founder) return null
  const next = nextBoost(me)
  const wait = next > Date.now()
  const boost = async () => {
    if (wait || busy) return
    setBusy(true)
    try {
      const at = state.cloud ? await founderBoost(planId) : Date.now()
      dispatch({ type: 'founderLocal', patch: { boostAt: at, boostPlan: planId } })
      onDone('План поднят наверх ленты на сутки')
    } catch (e) { onDone(humanError(e)) } finally { setBusy(false) }
  }
  return (
    <button onClick={boost} disabled={wait || busy} className="h-14 px-5 text-left cursor-pointer disabled:cursor-default flex items-center gap-3">
      <FounderMedal size={26} />
      <span className="leading-tight">
        <span className={`block font-semibold ${wait ? 'text-muted' : ''}`}>Поднять наверх ленты на сутки</span>
        <span className="block text-[12.5px] text-muted">{wait ? `Следующий подъём — ${dateRu(next)}` : 'Плюс Основателя · раз в 30 дней'}</span>
      </span>
    </button>
  )
}

const PERKS: [string, string, string][] = [
  ['🏅', 'Золотая медаль с номером', 'Навсегда. Номеров всего 100 — потом их не получить.'],
  ['🖼️', 'Золотая рамка вокруг фото', 'Вас сразу видно в профиле.'],
  ['🚀', 'Неделя наверху ленты', 'Сразу после получения статуса ваши планы выше остальных.'],
  ['⬆️', 'Подъём плана раз в месяц', 'Любой свой план — наверх ленты на сутки. Навсегда.'],
  ['✨', 'Новое — вам первым', 'Основатели первыми пробуют новые функции и влияют на то, что будет дальше.'],
  ['🧱', 'Имя на «Стене основателей»', 'Список первых 100 — его видят все. Можно скрыться.'],
]

/** Окно «Что даёт статус Основателя» и «Стена основателей». */
export function FounderSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const [tab, setTab] = useState<'perks' | 'wall'>('perks')
  const [note, setNote] = useState('')
  useEffect(() => { if (open) { setTab('perks'); setNote('') } }, [open])
  const me = state.me
  const userId = state.cloud?.userId
  const founder = me?.founder

  const wall = [
    ...(me?.founder && me.founderWall !== false ? [{ id: 'me', name: me.name, hue: me.hue, photo: me.photo, n: me.founder }] : []),
    ...state.people.filter((p) => p.founder && p.founderWall !== false).map((p) => ({ id: p.id, name: p.name, hue: p.hue, photo: p.photo, n: p.founder! })),
  ].sort((a, b) => a.n - b.n)

  const setWall = async (show: boolean) => {
    try { if (state.cloud) await founderWall(show); dispatch({ type: 'founderLocal', patch: { founderWall: show } }) } catch (e) { setNote(humanError(e)) }
  }
  const invite = async () => {
    const r = await shareLink(inviteUrl(userId), 'Я теперь нахожу компанию на кофе и прогулки в Komeeta. Залетай 🙂')
    if (r === 'copied') setNote('Ссылка скопирована — отправьте её другу')
  }
  const next = nextBoost(me)

  return (
    <Sheet open={open} onClose={onClose} title="Основатели Komeeta">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-surface-2" role="tablist">
          {([['perks', 'Что даёт статус'], ['wall', `Стена · ${wall.length}`]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`h-9 rounded-full text-[14px] font-semibold cursor-pointer ${tab === k ? 'bg-surface shadow-soft' : 'text-muted'}`}>{l}</button>
          ))}
        </div>

        {tab === 'perks' ? <>
          <div className="flex items-center gap-3">
            <FounderMedal size={52} />
            <p className="text-[14px] leading-snug">
              {founder ? <>Вы — <b>Основатель Komeeta №{founder}</b>. Спасибо, что растите Komeeta!</>
                : <>Статус получают первые 100 человек, которые позвали <b>трёх друзей</b>. Друг засчитывается, когда предложит план или напишет кому-то.</>}
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {PERKS.map(([e, t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-surface-2 text-[18px]" aria-hidden="true">{e}</span>
                <span className="leading-snug"><b className="block text-[14.5px]">{t}</b><span className="text-[13px] text-muted">{d}</span></span>
              </li>
            ))}
          </ul>
          {founder ? <>
            <p className="text-[13px] text-muted rounded-2xl bg-surface-2 p-3">
              {next > Date.now() ? `Следующий подъём плана — ${dateRu(next)}.` : 'Подъём плана доступен: откройте «⋯» у своего плана в ленте.'}
            </p>
            <Toggle id="founder-wall" checked={me?.founderWall !== false} onChange={(v) => void setWall(v)} label="Показывать меня на Стене основателей" />
          </> : (
            <button onClick={invite} className="h-12 rounded-full bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer">
              <Icon name="send" size={18} /> Позвать друга
            </button>
          )}
        </> : (
          <div className="flex flex-col gap-1">
            <p className="text-[13px] text-muted mb-2">Первые 100, кто позвал друзей в Komeeta. Занято мест: {wall.length} из 100.</p>
            {wall.length ? wall.map((w) => (
              <button key={w.id} onClick={() => { if (w.id !== 'me') { onClose(); openProfile(w.id) } }} className="flex items-center gap-3 py-2 text-left cursor-pointer">
                <span className="w-9 text-right font-display font-bold text-[14px] gold-text tnum">№{w.n}</span>
                <GoldFrame on medal={16}><Avatar name={w.name} hue={w.hue} src={w.photo} size={38} /></GoldFrame>
                <span className="font-semibold truncate">{w.id === 'me' ? `${w.name} (вы)` : w.name}</span>
              </button>
            )) : <p className="py-6 text-center text-muted">Пока на стене никого — станьте первым!</p>}
          </div>
        )}
        {note && <p className="text-[13px] text-center text-muted" role="status">{note}</p>}
      </div>
    </Sheet>
  )
}

/** Поделиться ссылкой: меню телефона, а если его нет — копируем. */
export async function shareLink(url: string, text: string): Promise<'shared' | 'cancel' | 'copied' | 'fail'> {
  try {
    if (navigator.share) { await navigator.share({ title: 'Komeeta', text, url }); return 'shared' }
  } catch (e) { if ((e as Error)?.name === 'AbortError') return 'cancel' }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied' } catch { return 'fail' }
}

/** Карточка в профиле: прогресс к «Основателю» и кнопка «Позвать друга». */
export function InviteCard() {
  const { state } = useStore()
  const [stats, setStats] = useState<InviteStats | null>(null)
  const [note, setNote] = useState('')
  const userId = state.cloud?.userId
  useEffect(() => {
    if (!userId) return
    let alive = true
    myInvites().then((s) => { if (alive) setStats(s) }, () => { /* без счётчика */ })
    return () => { alive = false }
  }, [userId])
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(''), 2500); return () => clearTimeout(t) }, [note])

  const goal = stats?.goal ?? 3
  const active = Math.min(stats?.active ?? 0, goal)
  const founder = stats?.founder ?? state.me?.founder ?? null
  const left = Math.max(0, (stats?.limit ?? 100) - (stats?.founders ?? 0))
  const invite = async () => {
    const r = await shareLink(inviteUrl(userId), 'Я теперь нахожу компанию на кофе и прогулки в Komeeta. Залетай 🙂')
    if (r === 'copied') setNote('Ссылка скопирована — отправьте её другу')
    if (r === 'fail') setNote('Не удалось поделиться')
  }

  return (
    <section className="rounded-[24px] p-4 flex flex-col gap-3 bg-surface shadow-soft" aria-label="Позвать друзей">
      <div className="flex items-center gap-3">
        {founder ? <FounderMedal size={44} /> : <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-brand text-white"><Icon name="people" size={22} /></span>}
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{founder ? `Вы — Основатель Komeeta №${founder}` : 'Позовите трёх друзей'}</div>
          <div className="text-[13px] text-muted">
            {founder ? 'Медаль и золотая рамка видны всем' : `и станьте Основателем · осталось ${left} из 100`}
          </div>
        </div>
      </div>
      {!founder && (
        <div>
          <div className="flex gap-1.5" aria-label={`Активных друзей: ${active} из ${goal}`}>
            {Array.from({ length: goal }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < active ? 'bg-brand' : 'bg-line'}`} />)}
          </div>
          <div className="mt-1.5 text-[12px] text-muted tnum text-right">{active}/{goal}</div>
        </div>
      )}
      <button onClick={invite} className="h-11 rounded-full bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer">
        <Icon name="send" size={18} /> Позвать друга
      </button>
      <button onClick={openFounderInfo} className="text-[13.5px] font-semibold text-spark cursor-pointer">{founder ? 'Мои плюсы и Стена основателей →' : 'Что даёт статус Основателя →'}</button>
      {note && <p className="text-[13px] text-center text-muted" role="status">{note}</p>}
    </section>
  )
}
