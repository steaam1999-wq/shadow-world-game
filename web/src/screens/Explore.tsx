import { useEffect, useMemo, useState } from 'react'
import { PlanMusicPicker } from '../music/PlanMusic'
import { PlaceOptions, byXY, knownKm, mapKindOf, minskXY, placeDistanceKm, placeInfo, placeXY } from '../places'
import { HOUR } from '../data'
import { useStore } from '../store'
import { ActivityCard } from '../components/ActivityCard'
import { PostArt } from '../components/PostArt'
import { Button, Chip, Field, Icon, Sheet, inputCls, readPhoto } from '../components/ui'
import { compatibility, planWhen } from '../lib'
import { Post } from './Feed'
import { Vibe } from './Vibe'
import type { Activity, PlanMusic } from '../types'

const RADII = [3, 10, 50, 500]
const TIMES = [
  { id: 'all', label: 'Любое время' },
  { id: 'now', label: 'Ближайшие 3 ч' },
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
] as const


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
        const km = placeInfo(a.area) && placeInfo(me.district) ? placeDistanceKm(me.district, a.area) : p?.distanceKm
        // Город не указан (у меня или у автора) — расстояние неизвестно, план показываем.
        return a.authorId === 'me' || (p && (!me.district || !knownKm(km) || km! <= me.radiusKm))
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
          <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск: выставка, кофе, Зыбицкая…" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
          {query && <button onClick={() => setQuery('')} aria-label="Очистить поиск" className="cursor-pointer"><Icon name="x" size={16} /></button>}
        </label>
      </div>

      <div>
        <div className="grid grid-cols-3 border-b border-line" role="tablist">
          {([['plans', 'grid', 'Планы'], ['people', 'people', 'Люди'], ['map', 'map', 'Карта']] as const).map(([id, icon, label]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
              className={`h-11 flex items-center justify-center gap-1.5 text-[13px] font-semibold border-b-2 -mb-px cursor-pointer whitespace-nowrap min-w-0 ${mode === id ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>
              <Icon name={icon} size={17} /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode !== 'people' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
            {me.district && RADII.map((r) => (
              <Chip key={r} active={me.radiusKm === r} onClick={() => dispatch({ type: 'updateMe', patch: { radiusKm: r } })}>{r === 500 ? 'Вся страна' : `до ${r} км`}</Chip>
            ))}
            {me.district && <span className="w-px bg-line shrink-0 mx-1" />}
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

// Грубый контур Беларуси (широта, долгота) — только чтобы было понятно, где точки.
const BY_BORDER: [number, number][] = [[56.17, 28.15], [55.8, 30.9], [55.3, 30.95], [54.9, 30.8], [54.4, 31.3], [53.8, 32.0], [53.3, 32.7], [52.9, 32.1], [52.3, 31.6],
  [52.1, 31.8], [51.6, 30.6], [51.3, 30.5], [51.5, 29.3], [51.4, 28.0], [51.6, 26.0], [51.5, 25.0], [51.6, 23.6], [52.2, 23.2], [52.7, 23.9], [53.4, 23.6],
  [53.9, 23.5], [54.15, 25.8], [54.9, 25.8], [55.6, 26.6], [55.8, 27.6]]
const BY_CITIES = ['Минск', 'Брест', 'Гродно', 'Витебск', 'Могилёв', 'Гомель']
// Схема Минска: МКАД и Свислочь (широта, долгота) — только чтобы было понятно, где точки.
const MKAD: [number, number][] = [[53.975, 27.5], [53.965, 27.62], [53.93, 27.69], [53.87, 27.7], [53.83, 27.66], [53.82, 27.55], [53.84, 27.45], [53.885, 27.41], [53.94, 27.43]]
const SVISLOCH: [number, number][] = [[53.975, 27.44], [53.945, 27.5], [53.915, 27.54], [53.905, 27.558], [53.89, 27.585], [53.875, 27.615], [53.855, 27.645], [53.835, 27.68]]
const MINSK_LABELS: [string, number, number][] = [['Центр', 53.906, 27.555], ['Уручье', 53.945, 27.68], ['Серебрянка', 53.865, 27.62], ['Малиновка', 53.845, 27.47], ['Каменная Горка', 53.91, 27.44]]

/** Небольшой сдвиг точки плана, чтобы планы из одного района не слипались. */
function jitter(id: string, size: number): [number, number] {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return [((h & 0xff) / 255 - 0.5) * size, (((h >> 8) & 0xff) / 255 - 0.5) * size]
}

function CityMap({ items, selected, onSelect, myDistrict }: { items: Activity[]; selected: string | null; onSelect: (id: string) => void; myDistrict: string }) {
  const kind = mapKindOf(myDistrict)
  const [dx, dy] = placeXY(myDistrict, kind)
  const [mx, my] = kind === 'ru' ? [dx + 4, dy + 5] : [dx, dy] // в Москве смещаем, чтобы метка не совпадала с активностями района
  // На схеме Минска — только минские планы, на карте страны — белорусские, на схеме Москвы — московские.
  const shown = items.flatMap((a) => {
    const k = mapKindOf(a.area)
    if (kind === 'ru' ? k !== 'ru' : kind === 'minsk' ? k !== 'minsk' : k === 'ru') return []
    if (kind === 'ru') return [{ a, x: a.x, y: a.y }]
    const [x, y] = placeXY(a.area, kind), [jx, jy] = jitter(a.id, kind === 'minsk' ? 18 : 5)
    return [{ a, x: x + jx, y: y + jy }]
  })
  const path = (pts: [number, number][], f: (la: number, lo: number) => [number, number]) => pts.map(([la, lo]) => f(la, lo).map((v) => v.toFixed(1)).join(',')).join(' ')
  const label = kind === 'minsk' ? 'Схема Минска с активностями' : kind === 'by' ? 'Карта Беларуси с активностями' : 'Схема центра Москвы с активностями'
  return (
    <div className="relative rounded-[28px] overflow-hidden bg-surface-2 aspect-square max-w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" role="img" aria-label={label}>
        {kind === 'minsk' && (
          <>
            <polygon points={path(MKAD, minskXY)} fill="var(--surface)" fillOpacity=".6" stroke="var(--line)" strokeWidth="1.4" strokeLinejoin="round" />
            <polyline points={path(SVISLOCH, minskXY)} fill="none" stroke="var(--cobalt)" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {MINSK_LABELS.map(([n, la, lo]) => { const [x, y] = minskXY(la, lo); return <text key={n} x={x} y={y} textAnchor="middle" fontSize="3.2" fill="var(--muted)" aria-hidden="true">{n}</text> })}
          </>
        )}
        {kind === 'by' && (
          <>
            <polygon points={path(BY_BORDER, byXY)} fill="var(--surface)" fillOpacity=".6" stroke="var(--line)" strokeWidth="1.2" strokeLinejoin="round" />
            {BY_CITIES.map((c) => {
              const [x, y] = placeXY(c, 'by')
              return <g key={c} aria-hidden="true"><circle cx={x} cy={y} r=".9" fill="var(--muted)" /><text x={x} y={y - 2.2} textAnchor="middle" fontSize="3.4" fill="var(--muted)">{c}</text></g>
            })}
          </>
        )}
        {kind === 'ru' && (
          <>
            {/* Садовое кольцо и Бульварное */}
            <ellipse cx="50" cy="52" rx="38" ry="36" fill="none" stroke="var(--line)" strokeWidth="1.6" />
            <ellipse cx="50" cy="48" rx="20" ry="18" fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 1.5" />
            {/* Москва-река */}
            <path d="M-2 62 C 14 58, 22 92, 40 90 S 52 66, 50 58 S 66 50, 78 70 S 94 76, 102 70" fill="none" stroke="var(--cobalt)" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {/* Моё положение — приблизительно (если город указан) */}
        {myDistrict && <circle cx={mx} cy={my} r={kind === 'by' ? 5 : 9} fill="var(--cobalt)" fillOpacity=".12" />}
        {myDistrict && <circle cx={mx} cy={my} r="1.8" fill="var(--cobalt)" stroke="var(--surface)" strokeWidth=".8" />}
        {shown.map(({ a, x, y }) => {
          const on = a.id === selected
          return (
            <g key={a.id} onClick={() => onSelect(a.id)} className="cursor-pointer" role="button" aria-label={a.title}>
              <circle cx={x} cy={y} r="6" fill="transparent" />
              {on && <circle cx={x} cy={y} r="5" fill="var(--spark)" fillOpacity=".2" />}
              <circle cx={x} cy={y} r={on ? 3 : 2.3} fill={a.authorId === 'me' ? 'var(--fg)' : 'var(--spark)'} stroke="var(--surface)" strokeWidth=".8" />
            </g>
          )
        })}
      </svg>
      <div className="absolute left-3 bottom-3 flex gap-3 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-medium">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-spark" /> активность</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cobalt" /> вы ({kind === 'by' ? 'город' : 'район'})</span>
      </div>
    </div>
  )
}

export function CreateActivity({ open, onClose, now }: { open: boolean; onClose: () => void; now: number }) {
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(state.categories[0])
  const [area, setArea] = useState(state.me?.district || 'Минск')
  const [exactPlace, setExactPlace] = useState('')
  const [day, setDay] = useState<'today' | 'tomorrow'>('today')
  const [clock, setClock] = useState('19:00')
  const [duration, setDuration] = useState(120)
  const [hideTime, setHideTime] = useState(false)
  const [groupSize, setGroupSize] = useState(0) // 0 — вдвоём
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState('')
  const [music, setMusic] = useState<PlanMusic | undefined>()
  const [when, setWhen] = useState<'hour' | 'evening' | 'tomorrow' | 'custom' | 'later'>('evening')
  const [more, setMore] = useState(false)
  // Быстрый выбор времени: одно касание вместо даты, часов и длительности.
  const pickWhen = (w: typeof when) => {
    setWhen(w)
    const d = new Date(now)
    const pad = (n: number) => String(n).padStart(2, '0')
    setHideTime(w === 'later')
    if (w === 'hour') { const t = new Date(now + HOUR); setDay('today'); setClock(`${pad(t.getHours())}:${pad(Math.floor(t.getMinutes() / 5) * 5)}`) }
    if (w === 'evening') { setDay('today'); setClock(d.getHours() >= 19 ? `${pad(Math.min(23, d.getHours() + 1))}:00` : '19:00') }
    if (w === 'tomorrow') { setDay('tomorrow'); setClock('19:00') }
  }
  // Открыли форму — «сегодня вечером» от текущего времени, настройки свёрнуты.
  useEffect(() => { if (open) { pickWhen('evening'); setMore(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const IDEAS: [string, string][] = [['Кофе после работы, кто со мной?', 'Кофе'], ['Прогулка по набережной Свислочи', 'Прогулка'], ['Иду на выставку, нужна компания', 'Выставка'], ['Настолки вечером — не хватает игрока', 'Настолки']]

  const submit = () => {
    const [h, m] = clock.split(':').map(Number)
    const d = new Date(now)
    d.setHours(h, m, 0, 0)
    if (day === 'tomorrow') d.setDate(d.getDate() + 1)
    let startsAt = d.getTime()
    if (startsAt < now) startsAt = now + 0.5 * HOUR
    // Время скрыто: план висит стандартные 48 часов, о времени договариваются в капсуле.
    if (hideTime) startsAt = now
    const [x, y] = placeXY(area)
    dispatch({
      type: 'createActivity',
      activity: {
        title: title.trim(), category, area, exactPlace: exactPlace.trim() || 'Уточню в чате', startsAt,
        durationMin: hideTime ? 0 : duration, timeHidden: hideTime || undefined,
        ...(groupSize ? { groupSize, members: [] } : {}),
        expiresAt: hideTime ? now + 48 * HOUR : startsAt + duration * 60_000, x: x + (Math.random() * 3 - 1.5), y: y + (Math.random() * 3 - 1.5), photo, music,
      },
    })
    setTitle(''); setExactPlace(''); setPhoto(undefined); setMusic(undefined)
    onClose()
  }

  const whenLabel = hideTime ? 'Время обсудим в чате' : `${day === 'today' ? 'Сегодня' : 'Завтра'} в ${clock}`
  return (
    <Sheet open={open} onClose={onClose} title="Новый план">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
        {/* 1. Что */}
        <Field id="act-title" label="Что вы предлагаете">
          <input id="act-title" className={`${inputCls} text-[16px]`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Иду на лекцию в Ok16, пойдёшь со мной?" maxLength={80} required autoFocus />
        </Field>
        {!title && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 -mt-2" aria-label="Идеи">
            {IDEAS.map(([t, c]) => (
              <button key={t} type="button" onClick={() => { setTitle(t); if (state.categories.includes(c)) setCategory(c) }} className="shrink-0 h-8 px-3 rounded-full border border-dashed border-line text-[13px] text-muted hover:text-fg cursor-pointer">💡 {t}</button>
            ))}
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5" role="radiogroup" aria-label="Категория">
          {state.categories.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)} className="shrink-0">{c}</Chip>)}
        </div>

        {/* 2. Когда — одним касанием */}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Когда</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Когда">
            {([['hour', 'Через час'], ['evening', 'Сегодня вечером'], ['tomorrow', 'Завтра'], ['custom', 'Своё время'], ['later', 'Договоримся']] as const).map(([w, label]) => (
              <Chip key={w} active={when === w} onClick={() => pickWhen(w)}>{label}</Chip>
            ))}
          </div>
          {when === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <select id="act-day" aria-label="День" className={inputCls} value={day} onChange={(e) => setDay(e.target.value as 'today' | 'tomorrow')}>
                <option value="today">Сегодня</option>
                <option value="tomorrow">Завтра</option>
              </select>
              <input id="act-time" aria-label="Во сколько" type="time" className={`${inputCls} tnum`} value={clock} onChange={(e) => setClock(e.target.value)} required />
            </div>
          )}
          <p className="text-[12px] text-muted">{whenLabel} · 📍 {area}</p>
        </div>

        {/* 3. Остальное — по желанию */}
        <button type="button" onClick={() => setMore((x) => !x)} aria-expanded={more} className="flex items-center justify-between gap-2 min-h-11 py-2 px-4 rounded-2xl bg-surface-2 text-[14px] font-semibold text-left cursor-pointer">
          <span>Ещё настройки <span className="font-normal text-muted">· фото, компания, место, музыка</span></span>
          <Icon name="down" size={18} className={`transition ${more ? 'rotate-180' : ''}`} />
        </button>
        {more && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <label htmlFor="act-photo" className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-line cursor-pointer hover:border-cobalt grid place-items-center text-muted">
                {photo ? <img src={photo} alt="Фото плана" className="w-full h-full object-cover" /> : (
                  <span className="absolute inset-0"><PostArt activity={{ id: title || 'new', category, photo: undefined }} /><span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Icon name="camera" size={24} /></span></span>
                )}
              </label>
              <input id="act-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try { setPhoto(await readPhoto(f)); setPhotoError('') } catch { setPhotoError('Не получилось открыть файл. Выберите JPG или PNG.') }
              }} />
              <div className="text-[13px] text-muted flex flex-col gap-1">
                <span>Фото места или настроения. Без фото будет обложка категории.</span>
                {photo && <button type="button" onClick={() => setPhoto(undefined)} className="self-start text-danger font-semibold cursor-pointer">Убрать фото</button>}
                {photoError && <span className="text-danger">{photoError}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">Сколько человек</span>
              <div className="flex flex-wrap gap-2">
                {[[0, 'Вдвоём'], [3, 'Компания на 3'], [4, 'Компания на 4']].map(([n, label]) => (
                  <Chip key={n} active={groupSize === n} onClick={() => setGroupSize(Number(n))}>{label}</Chip>
                ))}
              </div>
              {groupSize > 0 && <p className="text-[12px] text-muted">Вы и ещё {groupSize - 1} человека — для компании будет общий чат.</p>}
            </div>
            {!hideTime && (
              <Field id="act-duration" label="Длительность">
                <select id="act-duration" className={inputCls} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[60, 90, 120, 180].map((m) => <option key={m} value={m}>{m / 60} ч</option>)}
                </select>
              </Field>
            )}
            <Field id="act-area" label="Город или район (виден всем)">
              <select id="act-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
                <PlaceOptions none={false} />
              </select>
            </Field>
            <Field id="act-place" label="Точное место (увидит только тот, с кем откроется чат)">
              <input id="act-place" className={inputCls} value={exactPlace} onChange={(e) => setExactPlace(e.target.value)} placeholder="Кофейня у выхода из метро" maxLength={80} />
            </Field>
            <PlanMusicPicker value={music} onChange={setMusic} />
          </div>
        )}
        <Button type="submit" disabled={!title.trim()} className="h-12">Опубликовать на 48 часов</Button>
      </form>
    </Sheet>
  )
}
