import { useMemo, useState } from 'react'
import { DISTRICTS, HOUR } from '../data'
import { useStore } from '../store'
import { ActivityCard } from '../components/ActivityCard'
import { Button, Chip, Field, Icon, Sheet, inputCls } from '../components/ui'
import type { Activity } from '../types'

const RADII = [1, 3, 5, 10]
const TIMES = [
  { id: 'all', label: 'Любое время' },
  { id: 'now', label: 'Ближайшие 3 ч' },
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
] as const

// Координаты районов на схеме города (0..100).
const DISTRICT_XY: Record<string, [number, number]> = {
  'Чистые пруды': [62, 30], 'Патриаршие': [28, 38], 'Китай-город': [58, 42], 'Хамовники': [22, 78],
  'Замоскворечье': [52, 64], 'Басманный': [74, 34], 'Таганка': [72, 58], 'Парк Горького': [38, 84],
}

export function Ideas({ now, onRespond, onOpenCapsule }: { now: number; onRespond: (a: Activity) => void; onOpenCapsule: (activityId: string) => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [view, setView] = useState<'list' | 'map'>('list')
  const [time, setTime] = useState<(typeof TIMES)[number]['id']>('all')
  const [cats, setCats] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const items = useMemo(() => {
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
    const endOfTomorrow = endOfToday.getTime() + 24 * HOUR
    return state.activities
      .filter((a) => a.expiresAt > now)
      .filter((a) => {
        const p = state.people.find((x) => x.id === a.authorId)
        return a.authorId === 'me' || (p && p.distanceKm <= me.radiusKm)
      })
      .filter((a) => !cats.length || cats.includes(a.category))
      .filter((a) => {
        if (time === 'now') return a.startsAt - now < 3 * HOUR
        if (time === 'today') return a.startsAt <= endOfToday.getTime()
        if (time === 'tomorrow') return a.startsAt > endOfToday.getTime() && a.startsAt <= endOfTomorrow
        return true
      })
      .sort((a, b) => (a.authorId === 'me' ? -1 : b.authorId === 'me' ? 1 : a.startsAt - b.startsAt))
  }, [state.activities, state.people, me.radiusKm, cats, time, now])

  const selectedItem = items.find((a) => a.id === selected) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Москва · радиус {me.radiusKm} км</span>
          <h1 className="font-display font-bold text-2xl">Идеи на 48 часов</h1>
        </div>
        <div className="flex rounded-full bg-surface-2 p-1" role="tablist" aria-label="Вид">
          {(['list', 'map'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`grid place-items-center w-9 h-8 rounded-full cursor-pointer ${view === v ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`} aria-label={v === 'list' ? 'Списком' : 'На карте'}>
              <Icon name={v} size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col gap-2 -mx-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
          {RADII.map((r) => (
            <Chip key={r} active={me.radiusKm === r} onClick={() => dispatch({ type: 'updateMe', patch: { radiusKm: r } })}>до {r} км</Chip>
          ))}
          <span className="w-px bg-line shrink-0 mx-1" />
          {TIMES.map((t) => <Chip key={t.id} active={time === t.id} onClick={() => setTime(t.id)}>{t.label}</Chip>)}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
          {state.categories.map((c) => (
            <Chip key={c} active={cats.includes(c)} onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}>{c}</Chip>
          ))}
        </div>
      </div>

      <button onClick={() => setCreating(true)} className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-line p-4 text-left hover:border-spark cursor-pointer">
        <span className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark shrink-0"><Icon name="plus" /></span>
        <span>
          <span className="block font-semibold">Предложить свою активность</span>
          <span className="block text-[13px] text-muted">«Иду в кино в 20:00, есть лишний билет»</span>
        </span>
      </button>

      {view === 'map' && (
        <div className="flex flex-col gap-3">
          <CityMap items={items} selected={selected} onSelect={setSelected} myDistrict={me.district} />
          {selectedItem ? (
            <ActivityCard activity={selectedItem} person={state.people.find((p) => p.id === selectedItem.authorId) ?? null} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} compact />
          ) : (
            <p className="text-center text-[13px] text-muted">Нажмите на точку, чтобы увидеть активность. На карте показаны районы, не точные адреса.</p>
          )}
        </div>
      )}

      {view === 'list' && (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <ActivityCard key={a.id} activity={a} person={state.people.find((p) => p.id === a.authorId) ?? null} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />
          ))}
          {!items.length && (
            <div className="rounded-3xl bg-surface p-8 text-center flex flex-col items-center gap-3">
              <p className="font-semibold">По этим фильтрам пока пусто</p>
              <p className="text-[13px] text-muted">Увеличьте радиус или предложите свою активность: её увидят все рядом.</p>
              <Button variant="secondary" onClick={() => { setCats([]); setTime('all'); dispatch({ type: 'updateMe', patch: { radiusKm: 10 } }) }}>Сбросить фильтры</Button>
            </div>
          )}
        </div>
      )}

      <CreateActivity open={creating} onClose={() => setCreating(false)} now={now} />
    </div>
  )
}

function CityMap({ items, selected, onSelect, myDistrict }: { items: Activity[]; selected: string | null; onSelect: (id: string) => void; myDistrict: string }) {
  const [dx, dy] = DISTRICT_XY[myDistrict] ?? [50, 50]
  const [mx, my] = [dx + 4, dy + 5] // смещение, чтобы метка не совпадала с активностями района
  return (
    <div className="relative rounded-3xl overflow-hidden border border-line bg-surface-2 aspect-square max-w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" role="img" aria-label="Схема центра Москвы с активностями">
        {/* Садовое кольцо и Бульварное */}
        <ellipse cx="50" cy="52" rx="38" ry="36" fill="none" stroke="var(--line)" strokeWidth="1.6" />
        <ellipse cx="50" cy="48" rx="20" ry="18" fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 1.5" />
        {/* Москва-река */}
        <path d="M-2 62 C 14 58, 22 92, 40 90 S 52 66, 50 58 S 66 50, 78 70 S 94 76, 102 70" fill="none" stroke="var(--cobalt)" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
        {/* Моё положение — приблизительно */}
        <circle cx={mx} cy={my} r="9" fill="var(--cobalt)" fillOpacity=".12" />
        <circle cx={mx} cy={my} r="1.8" fill="var(--cobalt)" stroke="var(--surface)" strokeWidth=".8" />
        {items.map((a) => {
          const on = a.id === selected
          return (
            <g key={a.id} onClick={() => onSelect(a.id)} className="cursor-pointer" role="button" aria-label={a.title}>
              <circle cx={a.x} cy={a.y} r="6" fill="transparent" />
              {on && <circle cx={a.x} cy={a.y} r="5" fill="var(--spark)" fillOpacity=".2" />}
              <circle cx={a.x} cy={a.y} r={on ? 3 : 2.3} fill={a.authorId === 'me' ? 'var(--fg)' : 'var(--spark)'} stroke="var(--surface)" strokeWidth=".8" />
            </g>
          )
        })}
      </svg>
      <div className="absolute left-3 bottom-3 flex gap-3 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-medium">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-spark" /> активность</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cobalt" /> вы (район)</span>
      </div>
    </div>
  )
}

function CreateActivity({ open, onClose, now }: { open: boolean; onClose: () => void; now: number }) {
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(state.categories[0])
  const [area, setArea] = useState(state.me?.district ?? DISTRICTS[0])
  const [exactPlace, setExactPlace] = useState('')
  const [day, setDay] = useState<'today' | 'tomorrow'>('today')
  const [clock, setClock] = useState('19:00')
  const [duration, setDuration] = useState(120)

  const submit = () => {
    const [h, m] = clock.split(':').map(Number)
    const d = new Date(now)
    d.setHours(h, m, 0, 0)
    if (day === 'tomorrow') d.setDate(d.getDate() + 1)
    let startsAt = d.getTime()
    if (startsAt < now) startsAt = now + 0.5 * HOUR
    const [x, y] = DISTRICT_XY[area] ?? [50, 50]
    dispatch({
      type: 'createActivity',
      activity: {
        title: title.trim(), category, area, exactPlace: exactPlace.trim() || 'Уточню в капсуле', startsAt, durationMin: duration,
        expiresAt: startsAt + duration * 60_000, x: x + (Math.random() * 6 - 3), y: y + (Math.random() * 6 - 3),
      },
    })
    setTitle(''); setExactPlace('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новая активность">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Field id="act-title" label="Что вы предлагаете">
          <input id="act-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Иду на лекцию в Гараж, пойдёшь со мной?" maxLength={80} required />
        </Field>
        <div className="flex flex-wrap gap-2">
          {state.categories.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="act-day" label="Когда">
            <select id="act-day" className={inputCls} value={day} onChange={(e) => setDay(e.target.value as 'today' | 'tomorrow')}>
              <option value="today">Сегодня</option>
              <option value="tomorrow">Завтра</option>
            </select>
          </Field>
          <Field id="act-time" label="Во сколько">
            <input id="act-time" type="time" className={`${inputCls} tnum`} value={clock} onChange={(e) => setClock(e.target.value)} required />
          </Field>
        </div>
        <Field id="act-duration" label="Длительность">
          <select id="act-duration" className={inputCls} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {[60, 90, 120, 180].map((m) => <option key={m} value={m}>{m / 60} ч</option>)}
          </select>
        </Field>
        <Field id="act-area" label="Район (виден всем)">
          <select id="act-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field id="act-place" label="Точное место (увидит только тот, с кем откроется капсула)">
          <input id="act-place" className={inputCls} value={exactPlace} onChange={(e) => setExactPlace(e.target.value)} placeholder="Кофейня у выхода из метро" maxLength={80} />
        </Field>
        <Button type="submit" disabled={!title.trim()} className="h-12">Опубликовать на 48 часов</Button>
      </form>
    </Sheet>
  )
}
