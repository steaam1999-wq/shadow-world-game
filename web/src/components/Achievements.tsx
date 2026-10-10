// Достижения: ненавязчивая панель кружков в профиле. Нажатие — за что получено и что даёт.
// Выдаёт их сервер (check_achievements) по данным базы, поэтому подделать нельзя.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { sb } from '../cloud/api'
import { profileCompleteness } from '../lib'
import { Sheet } from './ui'

export interface Achievement { code: string; emoji: string; title: string; how: string; perk: string; hue: number }

export const ACHIEVEMENTS: Achievement[] = [
  { code: 'profile_full', emoji: '🌱', title: 'Первый шаг', how: 'Заполнить профиль: фото, «о себе», город и хотя бы 3 интереса.', perk: 'Ваш профиль чаще показывается в подборке «Люди рядом».', hue: 140 },
  { code: 'first_plan', emoji: '📅', title: 'Организатор', how: 'Создать свой первый план встречи.', perk: 'Открывает рамку аватарки «Организатор».', hue: 30 },
  { code: 'soul', emoji: '🔥', title: 'Душа компании', how: 'На 5 ваших планов кто-то откликнулся.', perk: 'Ваши планы поднимаются выше в ленте.', hue: 12 },
  { code: 'first_meet', emoji: '🤝', title: 'Первая встреча', how: 'Встретиться и подтвердить встречу кодами.', perk: 'Значок рядом с именем при отклике на план.', hue: 330 },
  { code: 'regular', emoji: '🏆', title: 'Завсегдатай', how: '10 подтверждённых встреч.', perk: 'Ранний доступ к новым функциям Komeeta.', hue: 45 },
  { code: 'reliable', emoji: '⭐', title: 'Надёжный', how: '5 встреч и ни одного пропуска.', perk: 'Метка «Надёжный» видна всем, с вами охотнее договариваются.', hue: 50 },
  { code: 'guide', emoji: '💌', title: 'Проводник', how: 'Пригласить в Komeeta 3 друзей по своей ссылке.', perk: 'Особые цвета оформления профиля.', hue: 280 },
  { code: 'author', emoji: '📸', title: 'Автор', how: 'Опубликовать 10 фото или видео.', perk: 'Ваши публикации чаще попадают в ленту.', hue: 200 },
  { code: 'night_owl', emoji: '🌙', title: 'Полуночник', how: 'Встреча, которая началась после 22:00.', perk: 'Ночная тема оформления профиля.', hue: 250 },
  { code: 'early_bird', emoji: '☀️', title: 'Ранняя пташка', how: 'Встреча, которая началась до 9:00.', perk: 'Утренняя тема оформления профиля.', hue: 40 },
  { code: 'ambassador', emoji: '🎖', title: 'Амбассадор', how: 'Помогать запускать встречи в своём городе. Выдаёт команда Komeeta.', perk: 'Значок амбассадора и прямая связь с командой.', hue: 320 },
  { code: 'founder', emoji: '👑', title: 'Основатель', how: 'Одним из первых позвать друзей в Komeeta.', perk: 'Золотая рамка и место на «Стене основателей».', hue: 48 },
]

type Earned = Record<string, number> // code → когда получено

/** Мои или чужие достижения (в облаке — с сервера, в демо — по данным в браузере). */
function useEarned(personId: string): Earned | null {
  const { state } = useStore()
  const uid = state.cloud?.userId
  const id = personId === 'me' ? uid : personId
  const [earned, setEarned] = useState<Earned | null>(null)
  const [fresh, setFresh] = useState<string[]>([])
  useEffect(() => {
    if (!state.cloud || !id) return
    let alive = true
    void (async () => {
      // Свои — сначала проверяем, не заработано ли что-то новое.
      if (personId === 'me') {
        const { data } = await sb().rpc('check_achievements')
        if (alive && Array.isArray(data) && data.length) setFresh(data as string[])
      }
      const { data } = await sb().from('achievements').select('code, earned_at').eq('user_id', id)
      if (alive) setEarned(Object.fromEntries((data ?? []).map((r: { code: string; earned_at: string }) => [r.code, new Date(r.earned_at).getTime()])))
    })().catch(() => {})
    return () => { alive = false }
  }, [id, personId, state.cloud])
  useEffect(() => { if (fresh.length) celebrate(fresh) }, [fresh])
  if (!state.cloud) {
    if (personId !== 'me' || !state.me) return {}
    const me = state.me
    return Object.fromEntries([
      profileCompleteness(me) === 100 && 'profile_full',
      state.activities.some((a) => a.authorId === 'me') && 'first_plan',
      me.meetings >= 1 && 'first_meet',
      me.meetings >= 10 && 'regular',
    ].filter(Boolean).map((c) => [c as string, Date.now()]))
  }
  return earned
}

// Тихое уведомление о новом достижении (одно на всё приложение).
let showNew: ((a: Achievement) => void) | null = null
function celebrate(codes: string[]) {
  const list = codes.map((c) => ACHIEVEMENTS.find((a) => a.code === c)).filter((a): a is Achievement => !!a)
  list.forEach((a, i) => setTimeout(() => showNew?.(a), i * 2600))
}

function Circle({ a, got, size = 46 }: { a: Achievement; got: boolean; size?: number }) {
  return (
    <span className="relative grid place-items-center rounded-full shrink-0 transition"
      style={{
        width: size, height: size, fontSize: size * 0.46,
        background: got ? `radial-gradient(circle at 35% 30%, hsl(${a.hue} 90% 72%), hsl(${(a.hue + 25) % 360} 75% 48%))` : 'var(--surface-2)',
        boxShadow: got ? `0 6px 16px -6px hsl(${a.hue} 80% 50% / .7), inset 0 1px 0 rgb(255 255 255 / .45)` : 'inset 0 0 0 1.5px var(--line)',
        filter: got ? undefined : 'grayscale(1)',
        opacity: got ? 1 : 0.45,
      }}>
      {a.emoji}
      {!got && <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-4 h-4 rounded-full bg-surface text-[9px]" aria-hidden="true">🔒</span>}
    </span>
  )
}

/** Панель достижений: строка кружков. Свой профиль — все (полученные яркие), чужой — только полученные. */
export function AchievementsPanel({ personId }: { personId: string }) {
  const earned = useEarned(personId)
  const [open, setOpen] = useState<Achievement | null>(null)
  if (!earned) return null
  const mine = personId === 'me'
  const got = ACHIEVEMENTS.filter((a) => earned[a.code])
  const list = mine ? [...got, ...ACHIEVEMENTS.filter((a) => !earned[a.code])] : got
  if (!list.length) return null
  const at = open ? earned[open.code] : 0
  return (
    <section className="flex flex-col gap-2" aria-label="Достижения">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-muted">Достижения</span>
        <span className="text-[12px] text-muted tnum">{got.length} из {ACHIEVEMENTS.length}</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
        {list.map((a) => (
          <button key={a.code} onClick={() => setOpen(a)} className="cursor-pointer rounded-full" aria-label={`${a.title}${earned[a.code] ? '' : ' — ещё не получено'}`}>
            <Circle a={a} got={!!earned[a.code]} />
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="flex flex-col items-center text-center gap-4 pb-2">
            <Circle a={open} got={!!at} size={96} />
            <p className={`text-[13px] font-semibold ${at ? 'text-ok' : 'text-muted'}`}>
              {at ? `Получено ${new Date(at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Ещё не получено'}
            </p>
            <div className="w-full flex flex-col gap-2 text-left">
              <div className="rounded-2xl bg-surface-2 p-3.5">
                <span className="block text-[12px] font-semibold text-muted mb-1">{at ? 'За что получено' : 'Как получить'}</span>
                <span className="text-[14.5px]">{open.how}</span>
              </div>
              <div className="rounded-2xl bg-surface-2 p-3.5">
                <span className="flex items-center gap-2 text-[12px] font-semibold text-muted mb-1">Что даёт <span className="px-1.5 py-0.5 rounded-full bg-spark-soft text-spark text-[10.5px]">скоро</span></span>
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
    showNew = (x) => { setA(x); setTimeout(() => setA((cur) => (cur === x ? null : cur)), 2400) }
    return () => { showNew = null }
  }, [])
  if (!a) return null
  return createPortal(
    <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[96] rounded-full bg-surface text-fg pl-1.5 pr-4 h-12 inline-flex items-center gap-2.5 shadow-soft ring-1 ring-line" role="status">
      <Circle a={a} got size={36} />
      <span className="text-[14px]"><b>Новое достижение:</b> {a.title}</span>
    </div>,
    document.body,
  )
}
