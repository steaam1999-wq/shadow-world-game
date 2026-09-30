import { useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { compatibility, nameAge } from '../lib'
import { formatKm, knownKm } from '../places'
import { tasteLine, useTaste } from '../music/taste'
import { Avatar, Icon } from './ui'

// «Сюрприз недели»: раз в неделю Match предлагает познакомиться с одним человеком рядом —
// лучшее сочетание вайб-теста, музыки и расстояния среди тех, с кем вы ещё не общались.

const KEY = 'match-surprise'
const week = () => Math.floor((Date.now() / 86_400_000 + 3) / 7) // неделя начинается в понедельник

function readSkip(): { week: number; skip: string[]; hidden: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return v.week === week() ? { week: v.week, skip: v.skip ?? [], hidden: !!v.hidden } : { week: week(), skip: [], hidden: false }
  } catch { return { week: week(), skip: [], hidden: false } }
}

export function SurpriseMeet({ onMessage }: { onMessage: (personId: string) => void }) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const tasteOf = useTaste()
  const [pref, setPref] = useState(readSkip)
  const save = (v: typeof pref) => { setPref(v); try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ } }
  const me = state.me
  if (!me || pref.hidden) return null
  const talked = new Set(state.capsules.map((c) => c.personId))
  const pick = state.people
    .filter((p) => !talked.has(p.id) && !pref.skip.includes(p.id))
    .map((p) => {
      const c = compatibility(me, p).score
      const t = tasteOf(p)
      const near = knownKm(p.distanceKm) ? Math.max(0, 20 - p.distanceKm) : 5
      // Номер недели перемешивает равных кандидатов, чтобы сюрприз менялся.
      const jitter = (p.id.charCodeAt(p.id.length - 1) * 7 + week() * 13) % 10
      return { p, c, t, score: c + t.score * 8 + near + jitter }
    })
    .sort((a, b) => b.score - a.score)[0]
  if (!pick) return null
  const { p, c, t } = pick
  const why = [`${c}% по вайб-тесту`, tasteLine(t), knownKm(p.distanceKm) ? formatKm(p.distanceKm) : ''].filter(Boolean).join(' · ')
  return (
    <section className="mx-4 mb-4 rounded-[24px] bg-surface shadow-soft p-4 flex flex-col gap-3 relative overflow-hidden" aria-label="Сюрприз недели">
      <div className="absolute inset-0 opacity-[.14] pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, hsl(${p.hue} 90% 60%), transparent 60%)` }} />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-spark"><Icon name="spark" size={14} fill /> Сюрприз недели</span>
        <button onClick={() => save({ ...pref, hidden: true })} className="grid place-items-center w-7 h-7 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label="Скрыть до следующей недели"><Icon name="x" size={14} /></button>
      </div>
      <button onClick={() => openProfile(p.id)} className="relative flex items-center gap-3 text-left cursor-pointer">
        <Avatar name={p.name} hue={p.hue} src={p.photo} size={56} verified={p.verified} />
        <span className="flex-1 min-w-0">
          <span className="block font-display font-bold text-lg leading-tight">{nameAge(p.name, p.age)}</span>
          <span className="block text-[13px] text-muted">{why}</span>
          {p.bio && <span className="block text-[13px] truncate">{p.bio}</span>}
        </span>
      </button>
      <div className="relative grid grid-cols-2 gap-2">
        <button onClick={() => save({ ...pref, skip: [...pref.skip, p.id] })} className="h-10 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer">Другой сюрприз</button>
        <button onClick={() => onMessage(p.id)} className="h-10 rounded-xl bg-brand text-white font-semibold text-[14px] cursor-pointer inline-flex items-center justify-center gap-1.5"><Icon name="chat" size={16} /> Написать</button>
      </div>
    </section>
  )
}
