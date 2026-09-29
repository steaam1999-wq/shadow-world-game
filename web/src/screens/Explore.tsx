import { useMemo, useState } from 'react'
import { DISTRICTS, HOUR } from '../data'
import { useStore } from '../store'
import { ActivityCard } from '../components/ActivityCard'
import { PostArt } from '../components/PostArt'
import { Button, Chip, Field, Icon, Sheet, Toggle, inputCls, readPhoto } from '../components/ui'
import { compatibility, planWhen } from '../lib'
import { Post } from './Feed'
import { Vibe } from './Vibe'
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

type Mode = 'plans' | 'people' | 'map'

export function Explore({ now, onRespond, onOpenCapsule }: { now: number; onRespond: (a: Activity, text?: string) => void; onOpenCapsule: (activityId: string) => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [mode, setMode] = useState<Mode>('plans')
  const [query, setQuery] = useState('')
  const [time, setTime] = useState<(typeof TIMES)[number]['id']>('all')
  const [cats, setCats] = useState<string[]>([])
  const [groupsOnly, setGroupsOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const items = useMemo(() => {
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
    const endOfTomorrow = endOfToday.getTime() + 24 * HOUR
    const q = query.trim().toLowerCase()
    return state.activities
      .filter((a) => a.expiresAt > now)
      .filter((a) => {
        const p = state.people.find((x) => x.id === a.authorId)
        return a.authorId === 'me' || (p && p.distanceKm <= me.radiusKm)
      })
      .filter((a) => !cats.length || cats.includes(a.category))
      .filter((a) => !groupsOnly || !!a.groupSize)
      .filter((a) => {
        if (!q) return true
        const p = state.people.find((x) => x.id === a.authorId)
        return [a.title, a.area, a.category, p?.name ?? ''].some((t) => t.toLowerCase().includes(q))
      })
      .filter((a) => {
        if (time === 'now') return a.startsAt - now < 3 * HOUR
        if (time === 'today') return a.startsAt <= endOfToday.getTime()
        if (time === 'tomorrow') return a.startsAt > endOfToday.getTime() && a.startsAt <= endOfTomorrow
        return true
      })
      .sort((a, b) => a.startsAt - b.startsAt)
  }, [state.activities, state.people, me.radiusKm, cats, time, now, query, groupsOnly])

  const selectedItem = items.find((a) => a.id === selected) ?? null
  const opened = state.activities.find((a) => a.id === open) ?? null

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="px-4">
        <label htmlFor="search" className="flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={18} />
          <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск: выставка, кофе, Таганка…" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
          {query && <button onClick={() => setQuery('')} aria-label="Очистить поиск" className="cursor-pointer"><Icon name="x" size={16} /></button>}
        </label>
      </div>

      <div className="grid grid-cols-3 border-b border-line" role="tablist">
        {([['plans', 'grid', 'Планы'], ['people', 'people', 'Люди'], ['map', 'map', 'Карта']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
            className={`h-11 flex items-center justify-center gap-1.5 text-[13px] font-semibold border-b-2 -mb-px cursor-pointer ${mode === id ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>
            <Icon name={icon} size={17} /> {label}
          </button>
        ))}
      </div>

      {mode !== 'people' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
            {RADII.map((r) => (
              <Chip key={r} active={me.radiusKm === r} onClick={() => dispatch({ type: 'updateMe', patch: { radiusKm: r } })}>до {r} км</Chip>
            ))}
            <span className="w-px bg-line shrink-0 mx-1" />
            {TIMES.map((t) => <Chip key={t.id} active={time === t.id} onClick={() => setTime(t.id)}>{t.label}</Chip>)}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
            <Chip active={groupsOnly} onClick={() => setGroupsOnly(!groupsOnly)}>Компании 3–4</Chip>
            {state.categories.map((c) => (
              <Chip key={c} active={cats.includes(c)} onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}>{c}</Chip>
            ))}
          </div>
        </div>
      )}

      {mode === 'plans' && (
        items.length ? (
          <div className="grid grid-cols-3 grid-flow-dense gap-1 px-1">
            {items.map((a, i) => {
              const p = state.people.find((x) => x.id === a.authorId)
              const big = i % 10 === 2 // крупная плитка, как в «Интересном»
              return (
                <button key={a.id} onClick={() => setOpen(a.id)} className={`relative aspect-[3/4] max-w-full overflow-hidden rounded-lg cursor-pointer group ${big ? 'col-span-2 row-span-2' : ''}`} aria-label={a.title}>
                  <PostArt activity={a} />
                  <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-left text-white">
                    {big && <span className="block text-[12px] font-semibold opacity-85">{planWhen(a, now)}</span>}
                    <span className={`block font-semibold leading-tight ${big ? 'text-[16px] line-clamp-3' : 'text-[11px] line-clamp-2'}`}>{a.title}</span>
                  </span>
                  {p && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/35 backdrop-blur-md text-white px-1.5 text-[11px] font-bold tnum">{compatibility(me, p).score}%</span>}
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                </button>
              )
            })}
          </div>
        ) : <EmptyResults onReset={() => { setCats([]); setTime('all'); setQuery(''); dispatch({ type: 'updateMe', patch: { radiusKm: 10 } }) }} />
      )}

      {mode === 'people' && <div className="px-4"><Vibe now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} /></div>}

      {mode === 'map' && (
        <div className="px-4 flex flex-col gap-3">
          <CityMap items={items} selected={selected} onSelect={setSelected} myDistrict={me.district} />
          {selectedItem ? (
            <ActivityCard activity={selectedItem} person={state.people.find((p) => p.id === selectedItem.authorId) ?? null} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} compact />
          ) : (
            <p className="text-center text-[13px] text-muted">Нажмите на точку, чтобы увидеть план. На карте показаны районы, не точные адреса.</p>
          )}
        </div>
      )}

      {opened && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="План">
          <button className="absolute inset-0 bg-black/60 cursor-default" aria-label="Закрыть" onClick={() => setOpen(null)} />
          <div className="anim-rise relative w-full max-w-[480px] max-h-[92%] overflow-y-auto bg-surface rounded-t-[28px] sm:rounded-[28px] pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
            <Post activity={opened} person={state.people.find((p) => p.id === opened.authorId) ?? null} now={now}
              onRespond={(a, t) => { setOpen(null); onRespond(a, t) }} onOpenCapsule={(id) => { setOpen(null); onOpenCapsule(id) }} />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-4 rounded-3xl bg-surface-2 p-8 text-center flex flex-col items-center gap-3">
      <p className="font-semibold">Ничего не нашлось</p>
      <p className="text-[13px] text-muted">Увеличьте радиус, смените фильтры или предложите свой план.</p>
      <Button variant="secondary" onClick={onReset}>Сбросить фильтры</Button>
    </div>
  )
}

function CityMap({ items, selected, onSelect, myDistrict }: { items: Activity[]; selected: string | null; onSelect: (id: string) => void; myDistrict: string }) {
  const [dx, dy] = DISTRICT_XY[myDistrict] ?? [50, 50]
  const [mx, my] = [dx + 4, dy + 5] // смещение, чтобы метка не совпадала с активностями района
  return (
    <div className="relative rounded-[28px] overflow-hidden bg-surface-2 aspect-square max-w-full">
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

export function CreateActivity({ open, onClose, now }: { open: boolean; onClose: () => void; now: number }) {
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(state.categories[0])
  const [area, setArea] = useState(state.me?.district ?? DISTRICTS[0])
  const [exactPlace, setExactPlace] = useState('')
  const [day, setDay] = useState<'today' | 'tomorrow'>('today')
  const [clock, setClock] = useState('19:00')
  const [duration, setDuration] = useState(120)
  const [hideTime, setHideTime] = useState(false)
  const [groupSize, setGroupSize] = useState(0) // 0 — вдвоём
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState('')

  const submit = () => {
    const [h, m] = clock.split(':').map(Number)
    const d = new Date(now)
    d.setHours(h, m, 0, 0)
    if (day === 'tomorrow') d.setDate(d.getDate() + 1)
    let startsAt = d.getTime()
    if (startsAt < now) startsAt = now + 0.5 * HOUR
    // Время скрыто: план висит стандартные 48 часов, о времени договариваются в капсуле.
    if (hideTime) startsAt = now
    const [x, y] = DISTRICT_XY[area] ?? [50, 50]
    dispatch({
      type: 'createActivity',
      activity: {
        title: title.trim(), category, area, exactPlace: exactPlace.trim() || 'Уточню в капсуле', startsAt,
        durationMin: hideTime ? 0 : duration, timeHidden: hideTime || undefined,
        ...(groupSize ? { groupSize, members: [] } : {}),
        expiresAt: hideTime ? now + 48 * HOUR : startsAt + duration * 60_000, x: x + (Math.random() * 6 - 3), y: y + (Math.random() * 6 - 3), photo,
      },
    })
    setTitle(''); setExactPlace(''); setPhoto(undefined)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новый план">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="flex gap-3 items-center">
          <label htmlFor="act-photo" className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-line cursor-pointer hover:border-cobalt grid place-items-center text-muted">
            {photo ? <img src={photo} alt="Фото плана" className="w-full h-full object-cover" /> : (
              <span className="absolute inset-0"><PostArt activity={{ id: title || 'new', category, photo: undefined }} /><span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Icon name="camera" size={26} /></span></span>
            )}
          </label>
          <input id="act-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { setPhoto(await readPhoto(f)); setPhotoError('') } catch { setPhotoError('Не получилось открыть файл. Выберите JPG или PNG.') }
          }} />
          <div className="text-[13px] text-muted flex flex-col gap-1">
            <span>Добавьте фото места или настроения. Без фото будет обложка категории.</span>
            {photo && <button type="button" onClick={() => setPhoto(undefined)} className="self-start text-danger font-semibold cursor-pointer">Убрать фото</button>}
            {photoError && <span className="text-danger">{photoError}</span>}
          </div>
        </div>
        <Field id="act-title" label="Что вы предлагаете">
          <input id="act-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Иду на лекцию в Гараж, пойдёшь со мной?" maxLength={80} required />
        </Field>
        <div className="flex flex-wrap gap-2">
          {state.categories.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Формат</span>
          <div className="flex flex-wrap gap-2">
            {[[0, 'Вдвоём'], [3, 'Компания на 3'], [4, 'Компания на 4']].map(([n, label]) => (
              <Chip key={n} active={groupSize === n} onClick={() => setGroupSize(Number(n))}>{label}</Chip>
            ))}
          </div>
          {groupSize > 0 && <p className="text-[12px] text-muted">Вы и ещё {groupSize - 1} {groupSize - 1 === 2 ? 'человека' : 'человека'}: меньше неловкости, чем один на один. План исчезнет из ленты, когда наберётся компания.</p>}
        </div>
        <div className="rounded-2xl bg-surface-2 px-3.5">
          <Toggle id="act-hide-time" checked={hideTime} onChange={setHideTime} label="Не показывать время"
            hint={hideTime ? 'В посте будет «Время обсудим» — договоритесь в капсуле' : 'Скрыть «когда», «во сколько» и длительность'} />
        </div>
        {!hideTime && <>
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
        </>}
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
