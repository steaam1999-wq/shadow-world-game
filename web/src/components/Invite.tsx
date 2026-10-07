import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { claimReferral, myInvites, type InviteStats } from '../cloud/api'
import { Icon } from './ui'

// Друзья зовут друзей: ссылка на план (или на приложение) несёт id пригласившего.
// Три активных друга — значок «Основатель Komeeta» (первые 100), и неделю планы основателя выше в ленте.

const REF_KEY = 'komeeta-ref'
const PLAN_KEY = 'komeeta-open-plan'
export const FOUNDER_BOOST_MS = 7 * 86400_000

/** Ссылка-приглашение: на конкретный план или просто в приложение. */
export function inviteUrl(userId?: string | null, planId?: string) {
  const base = `${location.origin}${location.pathname}`
  const parts = [planId && `plan=${planId}`, userId && `ref=${userId}`].filter(Boolean)
  return parts.length ? `${base}#${parts.join('&')}` : base
}

/** Читает приглашение из адреса до того, как адрес заменят. */
export function captureInvite() {
  try {
    const h = location.hash
    const ref = /(?:^#|&)ref=([0-9a-f-]{36})(?:&|$)/i.exec(h)?.[1]
    const plan = /(?:^#|&)plan=([\w-]{1,64})(?:&|$)/.exec(h)?.[1]
    if (ref) localStorage.setItem(REF_KEY, ref)
    if (plan) sessionStorage.setItem(PLAN_KEY, plan)
  } catch { /* ignore */ }
}

/** План, на который позвали по ссылке (забирается один раз). */
export function takeInvitedPlan() {
  try { const id = sessionStorage.getItem(PLAN_KEY); sessionStorage.removeItem(PLAN_KEY); return id } catch { return null }
}

/** Пришёл ли человек по приглашению: для приветствия на входе. */
export function invitedBy(): 'plan' | 'app' | null {
  try {
    if (sessionStorage.getItem(PLAN_KEY)) return 'plan'
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

export function FounderBadge({ n, small }: { n: number; small?: boolean }) {
  if (small) return (
    <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-brand text-white" title={`Основатель Komeeta №${n}`} aria-label={`Основатель Komeeta №${n}`}>
      <Icon name="spark" size={9} fill />
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 h-6 pl-1 pr-2.5 rounded-full bg-brand text-white text-[12px] font-semibold w-fit" title="Позвал(а) в Komeeta трёх друзей одним из первых">
      <span className="grid place-items-center w-4 h-4 rounded-full bg-white/25"><Icon name="spark" size={10} fill /></span>
      Основатель Komeeta №{n}
    </span>
  )
}

async function shareLink(url: string, text: string) {
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
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-brand text-white"><Icon name="people" size={22} /></span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{founder ? `Вы — Основатель Komeeta №${founder}` : 'Позовите трёх друзей'}</div>
          <div className="text-[13px] text-muted">
            {founder ? 'Спасибо, что растите Komeeta. Значок виден всем, а неделю ваши планы выше в ленте.'
              : `Когда трое из них предложат план или напишут кому-то — станете Основателем. Значков осталось ${left} из 100.`}
          </div>
        </div>
      </div>
      {!founder && (
        <div>
          <div className="flex gap-1.5" aria-label={`Активных друзей: ${active} из ${goal}`}>
            {Array.from({ length: goal }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < active ? 'bg-brand' : 'bg-line'}`} />)}
          </div>
          <div className="mt-1.5 text-[12.5px] text-muted tnum">
            Активных друзей: {active} из {goal}{stats && stats.invited > stats.active ? ` · ещё ${stats.invited - stats.active} пока присматриваются` : ''}
          </div>
        </div>
      )}
      <button onClick={invite} className="h-11 rounded-full bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer">
        <Icon name="send" size={18} /> Позвать друга
      </button>
      {note && <p className="text-[13px] text-center text-muted" role="status">{note}</p>}
    </section>
  )
}
