import { useEffect, useMemo, useRef, useState } from 'react'
import { PlanMusicPicker } from '../music/PlanMusic'
import { PlaceOptions, byXY, formatKm, knownKm, mapKindOf, minskXY, nearestPlace, placeDistanceKm, placeInfo, placeXY } from '../places'
import { HOUR } from '../data'
import { useStore } from '../store'
import { ActivityCard } from '../components/ActivityCard'
import { PostArt } from '../components/PostArt'
import { Avatar, Button, Chip, Field, Icon, Sheet, inputCls, readPhoto } from '../components/ui'
import { useOpenProfile } from '../nav'
import { compatibility, planWhen } from '../lib'
import { Post } from './Feed'
import { Vibe } from './Vibe'
import type { Activity, Me, Person, PlanMusic } from '../types'

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

      {mode === 'map' && <MapTab items={items} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />}

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

// Граница Беларуси (широта, долгота) по Natural Earth 1:10 млн, упрощённая до ~190 точек.
const BY_BORDER: [number, number][] = [[51.517, 23.607], [51.659, 23.532], [51.809, 23.629], [51.843, 23.593], [51.994, 23.676], [52.073, 23.643], [52.125, 23.514], [52.181, 23.488], [52.232, 23.211], [52.289, 23.164], [52.51, 23.391], [52.671, 23.87], [52.743, 23.924], [53.013, 23.91], [53.067, 23.859], [53.152, 23.895], [53.611, 23.589], [53.939, 23.485], [53.898, 23.643], [53.959, 24.169], [53.893, 24.259], [53.886, 24.378], [53.995, 24.666], [53.964, 24.705], [53.976, 24.806], [54.092, 24.781], [54.135, 24.82], [54.133, 25.072], [54.256, 25.206], [54.248, 25.371], [54.298, 25.458], [54.231, 25.555], [54.222, 25.501], [54.145, 25.515], [54.128, 25.652], [54.157, 25.764], [54.236, 25.789], [54.32, 25.695], [54.304, 25.566], [54.346, 25.53], [54.508, 25.63], [54.569, 25.742], [54.766, 25.72], [54.869, 25.782], [54.949, 25.908], [54.969, 26.138], [55.139, 26.264], [55.121, 26.602], [55.215, 26.656], [55.273, 26.8], [55.3, 26.768], [55.337, 26.444], [55.46, 26.545], [55.688, 26.617], [55.707, 26.822], [55.827, 26.98], [55.832, 27.15], [55.788, 27.261], [55.832, 27.351], [55.795, 27.592], [55.923, 27.646], [56.109, 27.927], [56.158, 28.111], [56.043, 28.312], [56.088, 28.388], [56.088, 28.611], [55.946, 28.734], [55.938, 28.831], [55.977, 28.86], [56.024, 29.032], [55.948, 29.396], [55.908, 29.443], [55.788, 29.342], [55.681, 29.482], [55.771, 29.684], [55.771, 29.806], [55.843, 29.907], [55.822, 30.105], [55.859, 30.199], [55.793, 30.469], [55.754, 30.48], [55.719, 30.588], [55.665, 30.595], [55.653, 30.692], [55.594, 30.743], [55.6, 30.887], [55.388, 30.919], [55.286, 30.793], [55.163, 30.959], [55.023, 31.005], [55.025, 30.912], [54.954, 30.919], [54.928, 30.815], [54.786, 30.771], [54.621, 31.167], [54.493, 31.063], [54.449, 31.211], [54.229, 31.326], [54.054, 31.823], [53.969, 31.841], [53.795, 31.743], [53.777, 31.873], [53.81, 32.085], [53.707, 32.463], [53.67, 32.489], [53.635, 32.399], [53.582, 32.413], [53.486, 32.579], [53.488, 32.651], [53.458, 32.647], [53.463, 32.701], [53.334, 32.719], [53.3, 32.456], [53.255, 32.471], [53.192, 32.406], [53.081, 32.118], [53.11, 31.808], [53.192, 31.74], [53.211, 31.592], [53.182, 31.38], [53.089, 31.365], [53.015, 31.247], [52.787, 31.56], [52.725, 31.571], [52.682, 31.481], [52.547, 31.628], [52.512, 31.549], [52.355, 31.61], [52.311, 31.567], [52.252, 31.7], [52.201, 31.682], [52.164, 31.751], [52.1, 31.765], [52.117, 31.383], [52.037, 31.229], [52.08, 31.095], [52.059, 30.919], [51.994, 30.941], [51.999, 30.897], [51.897, 30.743], [51.603, 30.516], [51.372, 30.645], [51.237, 30.552], [51.305, 30.354], [51.403, 30.321], [51.48, 30.177], [51.465, 29.886], [51.43, 29.828], [51.49, 29.637], [51.386, 29.464], [51.365, 29.32], [51.603, 29.162], [51.63, 29.065], [51.57, 28.982], [51.533, 28.798], [51.401, 28.73], [51.443, 28.705], [51.45, 28.636], [51.553, 28.604], [51.571, 28.46], [51.529, 28.334], [51.652, 28.212], [51.558, 28.071], [51.561, 27.956], [51.614, 27.83], [51.517, 27.794], [51.463, 27.715], [51.49, 27.664], [51.59, 27.693], [51.624, 27.477], [51.588, 27.268], [51.651, 27.279], [51.664, 27.189], [51.757, 27.15], [51.749, 26.854], [51.801, 26.667], [51.806, 26.444], [51.85, 26.408], [51.857, 26.174], [51.901, 26.08], [51.928, 25.767], [51.921, 25.353], [51.95, 25.137], [51.882, 24.723], [51.88, 24.392], [51.718, 24.244], [51.587, 23.982], [51.644, 23.751], [51.629, 23.629], [51.517, 23.607]]
const BY_CITIES = ['Минск', 'Брест', 'Гродно', 'Витебск', 'Могилёв', 'Гомель', 'Пинск', 'Полоцк', 'Барановичи', 'Бобруйск']
const BY_CAPITALS = new Set(['Минск', 'Брест', 'Гродно', 'Витебск', 'Могилёв', 'Гомель'])
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

/** Город места: районы Минска на карте страны собираются в «Минск». */
const cityOf = (place: string) => (place.startsWith('Минск') ? 'Минск' : place)

/** Кто рядом: люди с указанным городом/районом в пределах радиуса (на этой же карте). */
function useNearbyPeople(me: Me) {
  const { state } = useStore()
  return useMemo(() => {
    const kind = mapKindOf(me.district)
    return state.people
      .filter((p) => p.district && placeInfo(p.district))
      .filter((p) => { const k = mapKindOf(p.district); return kind === 'ru' ? k === 'ru' : kind === 'minsk' ? k === 'minsk' : k !== 'ru' })
      .map((p) => ({ p, km: me.district ? placeDistanceKm(me.district, p.district) : 999 }))
      .filter((x) => !me.district || x.km <= Math.max(me.radiusKm, kind === 'minsk' ? 50 : me.radiusKm))
      .sort((a, b) => a.km - b.km)
      .slice(0, 60)
  }, [state.people, me.district, me.radiusKm])
}

/** Вкладка «Карта»: я, люди рядом и планы. */
function MapTab({ items, now, onRespond, onOpenCapsule }: { items: Activity[]; now: number; onRespond: (a: Activity, text?: string) => void; onOpenCapsule: (activityId: string) => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const openProfile = useOpenProfile()
  const people = useNearbyPeople(me)
  const [layers, setLayers] = useState({ people: true, plans: true })
  const [selected, setSelected] = useState<{ kind: 'plan' | 'person' | 'city'; id: string } | null>(null)
  const [city, setCity] = useState<string | null>(null) // открытый кружок города на карте страны
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const selPlan = selected?.kind === 'plan' ? items.find((a) => a.id === selected.id) ?? null : null
  const selPerson = selected?.kind === 'person' ? people.find((x) => x.p.id === selected.id) ?? null : null

  const locate = () => {
    if (!navigator.geolocation) { setGeoError('Этот браузер не умеет определять место — выберите город из списка.'); return }
    setLocating(true); setGeoError('')
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocating(false)
      const near = nearestPlace(pos.coords.latitude, pos.coords.longitude)
      if (!near || near.km > 60) { setGeoError('Рядом с вами пока нет городов из списка — выберите ближайший вручную.'); return }
      dispatch({ type: 'updateMe', patch: { district: near.name } })
    }, (e) => {
      setLocating(false)
      setGeoError(e.code === 1 ? 'Доступ к геопозиции запрещён — разрешите его в настройках браузера или выберите город из списка.' : 'Не получилось определить место — выберите город из списка.')
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 })
  }

  return (
    <div className="px-4 flex flex-col gap-3">
      {!me.district ? (
        <section className="rounded-[24px] bg-surface shadow-soft p-4 flex flex-col gap-3" aria-label="Ваше место">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-cobalt text-white"><Icon name="pin" size={20} /></span>
            <div>
              <h2 className="font-display font-bold text-[16px]">Покажите себя на карте</h2>
              <p className="text-[13.5px] text-muted leading-snug mt-0.5">Укажите район или город — вы появитесь на карте, а мы покажем, кто рядом. Точный адрес никто не увидит.</p>
            </div>
          </div>
          <button onClick={locate} disabled={locating} className="h-11 rounded-xl bg-brand text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"><Icon name="pin" size={18} /> {locating ? 'Определяем…' : 'Определить по GPS'}</button>
          <select aria-label="Мой город или район" className={inputCls} value="" onChange={(e) => e.target.value && dispatch({ type: 'updateMe', patch: { district: e.target.value } })}>
            <option value="">Или выберите из списка…</option>
            <PlaceOptions none={false} />
          </select>
          {geoError && <p className="text-[13px] text-danger" role="alert">{geoError}</p>}
        </section>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 text-[13px] text-muted truncate"><Icon name="pin" size={13} className="inline -mt-0.5" /> Вы: <b className="text-fg">{me.district}</b></span>
          <button onClick={locate} disabled={locating} className="shrink-0 h-8 px-3 rounded-full bg-surface-2 text-[12.5px] font-semibold cursor-pointer disabled:opacity-60">{locating ? 'Определяем…' : 'Обновить по GPS'}</button>
        </div>
      )}
      {me.district && geoError && <p className="text-[13px] text-danger" role="alert">{geoError}</p>}

      <div className="flex gap-2">
        <Chip active={layers.people} onClick={() => setLayers((l) => ({ ...l, people: !l.people }))}>Люди · {people.length}</Chip>
        <Chip active={layers.plans} onClick={() => setLayers((l) => ({ ...l, plans: !l.plans }))}>Планы · {items.length}</Chip>
      </div>

      <CityMap items={layers.plans ? items : []} people={layers.people ? people.map((x) => x.p) : []} me={me}
        selected={selected?.kind === 'person' && city ? `city:${city}` : selected?.kind === 'city' ? `city:${selected.id}` : selected?.id ?? null}
        onSelect={(id) => { setCity(null); setSelected({ kind: 'plan', id }) }} onSelectPerson={(id) => { setCity(null); setSelected({ kind: 'person', id }) }}
        onSelectCity={(place) => { setCity(place); setSelected({ kind: 'city', id: place }) }} />

      {city && (
        <div className="anim-rise flex flex-col gap-2">
          <p className="text-[13px] font-semibold">{city} · {people.filter((x) => cityOf(x.p.district) === city).length} чел.</p>
          <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar">
            {people.filter((x) => cityOf(x.p.district) === city).map(({ p }) => (
              <button key={p.id} onClick={() => setSelected({ kind: 'person', id: p.id })} className="flex flex-col items-center gap-1 w-16 shrink-0 cursor-pointer" aria-label={p.name}>
                <span className={`rounded-full p-[2px] ${selected?.id === p.id ? 'bg-brand' : ''}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={52} /></span>
                <span className="text-[12px] truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selPerson ? (
        <section className="anim-rise rounded-[24px] bg-surface shadow-soft p-4 flex items-center gap-3" aria-label={selPerson.p.name}>
          <Avatar name={selPerson.p.name} hue={selPerson.p.hue} src={selPerson.p.photo} size={56} verified={selPerson.p.verified} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{selPerson.p.name}{selPerson.p.age ? `, ${selPerson.p.age}` : ''}</div>
            <div className="text-[13px] text-muted truncate">{selPerson.p.district}{knownKm(selPerson.km) ? ` · ${formatKm(selPerson.km)}` : ''}</div>
            <div className="text-[12.5px] font-semibold text-spark">{compatibility(me, selPerson.p).score}% вайб{selPerson.p.freeUntil && selPerson.p.freeUntil > now ? ' · свободен сейчас' : ''}</div>
          </div>
          <button onClick={() => openProfile(selPerson.p.id)} className="shrink-0 h-10 px-4 rounded-full bg-brand text-white font-semibold text-[14px] cursor-pointer">Профиль</button>
        </section>
      ) : selPlan ? (
        <ActivityCard activity={selPlan} person={state.people.find((p) => p.id === selPlan.authorId) ?? null} now={now} onRespond={onRespond} onOpenCapsule={onOpenCapsule} compact />
      ) : (
        <p className="text-center text-[13px] text-muted">Нажмите на человека или точку плана. На карте — районы, не точные адреса.</p>
      )}
    </div>
  )
}

const MAX_ZOOM = 8
/** Размер аватарки на карте: маленькая на общем виде, растёт при приближении. */
const markerPx = (z: number) => Math.round(Math.min(46, 15 * z ** 0.6))

/** Масштаб и сдвиг карты: щипок двумя пальцами, перетаскивание, колёсико, двойное нажатие, кнопки. */
function useMapZoom() {
  const box = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ z: 1, cx: 50, cy: 50 })
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; mid: { x: number; y: number }; v: typeof view } | null>(null)
  const drag = useRef<{ x: number; y: number; v: typeof view; moved: boolean } | null>(null)
  const lastTap = useRef(0)
  const suppressClick = useRef(false)

  const clamp = (v: typeof view) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, v.z))
    const half = 50 / z
    return { z, cx: Math.min(100 - half, Math.max(half, v.cx)), cy: Math.min(100 - half, Math.max(half, v.cy)) }
  }
  const size = () => box.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 }
  /** Точка экрана → координаты карты (0..100) при виде v. */
  const toMap = (x: number, y: number, v: typeof view) => {
    const r = size()
    return { mx: v.cx - 50 / v.z + ((x - r.left) / r.width) * (100 / v.z), my: v.cy - 50 / v.z + ((y - r.top) / r.height) * (100 / v.z) }
  }
  /** Приблизить к точке экрана так, чтобы место под пальцем осталось под пальцем. */
  const zoomAt = (x: number, y: number, z: number, v = view) => {
    const r = size()
    const { mx, my } = toMap(x, y, v)
    const fx = (x - r.left) / r.width, fy = (y - r.top) / r.height
    const nz = Math.min(MAX_ZOOM, Math.max(1, z))
    return clamp({ z: nz, cx: mx - (fx - 0.5) * (100 / nz), cy: my - (fy - 0.5) * (100 / nz) })
  }

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setView((v) => zoomAt(e.clientX, e.clientY, v.z * Math.exp(-e.deltaY * 0.0025), v))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.current.size === 2) {
        const [a, b] = [...pts.current.values()]
        gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: view }
        drag.current = null
      } else if (pts.current.size === 1) {
        drag.current = { x: e.clientX, y: e.clientY, v: view, moved: false }
        suppressClick.current = false
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!pts.current.has(e.pointerId)) return
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const g = gesture.current
      if (g && pts.current.size >= 2) {
        const [a, b] = [...pts.current.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const zoomed = zoomAt(g.mid.x, g.mid.y, g.v.z * (d / Math.max(1, g.dist)), g.v)
        const r = size()
        setView(clamp({ ...zoomed, cx: zoomed.cx - ((mid.x - g.mid.x) / r.width) * (100 / zoomed.z), cy: zoomed.cy - ((mid.y - g.mid.y) / r.height) * (100 / zoomed.z) }))
        suppressClick.current = true
        return
      }
      const dr = drag.current
      if (!dr) return
      const ddx = e.clientX - dr.x, ddy = e.clientY - dr.y
      if (!dr.moved && Math.hypot(ddx, ddy) < 6) return
      if (!dr.moved && dr.v.z === 1) { drag.current = null; return } // на общем виде — обычная прокрутка страницы
      if (!dr.moved) { dr.moved = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
      suppressClick.current = true
      const r = size()
      setView(clamp({ ...dr.v, cx: dr.v.cx - (ddx / r.width) * (100 / dr.v.z), cy: dr.v.cy - (ddy / r.height) * (100 / dr.v.z) }))
    },
    onPointerUp: (e: React.PointerEvent) => {
      pts.current.delete(e.pointerId)
      if (pts.current.size < 2) gesture.current = null
      if (pts.current.size === 0) {
        const tap = drag.current && !drag.current.moved && !suppressClick.current
        drag.current = null
        if (tap) {
          const t = Date.now()
          if (t - lastTap.current < 300) { setView((v) => zoomAt(e.clientX, e.clientY, v.z * 2, v)); lastTap.current = 0; suppressClick.current = true }
          else lastTap.current = t
        }
      }
    },
    onPointerCancel: (e: React.PointerEvent) => { pts.current.delete(e.pointerId); gesture.current = null; drag.current = null },
    onClickCapture: (e: React.MouseEvent) => { if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); suppressClick.current = false } },
  }
  const step = (f: number) => setView((v) => clamp({ ...v, z: v.z * f }))
  return { box, view, handlers, zoomIn: () => step(1.8), zoomOut: () => step(1 / 1.8), reset: () => setView({ z: 1, cx: 50, cy: 50 }) }
}

function CityMap({ items, people, me, selected, onSelect, onSelectPerson, onSelectCity }: { items: Activity[]; people: Person[]; me: Me; selected: string | null; onSelect: (id: string) => void; onSelectPerson: (id: string) => void; onSelectCity: (place: string) => void }) {
  const myDistrict = me.district
  const now = Date.now()
  const kind = mapKindOf(myDistrict)
  const [dx, dy] = placeXY(myDistrict, kind)
  const [mx, my] = kind === 'ru' ? [dx + 4, dy + 5] : [dx, dy] // в Москве смещаем, чтобы метка не совпадала с активностями района
  const { box, view, handlers, zoomIn, zoomOut, reset } = useMapZoom()
  const { z } = view
  const vx = view.cx - 50 / z, vy = view.cy - 50 / z
  /** Координаты карты → проценты на экране; null — точка за краем. */
  const at = (x: number, y: number) => {
    const sx = (x - vx) * z, sy = (y - vy) * z
    return sx < -6 || sx > 106 || sy < -6 || sy > 106 ? null : { left: `${sx}%`, top: `${sy}%` }
  }
  const k = z ** -0.6 // точки и подписи растут медленнее карты
  const px = markerPx(z)
  // На схеме Минска — только минские планы, на карте страны — белорусские, на схеме Москвы — московские.
  const shown = items.flatMap((a) => {
    const kk = mapKindOf(a.area)
    if (kind === 'ru' ? kk !== 'ru' : kind === 'minsk' ? kk !== 'minsk' : kk === 'ru') return []
    if (kind === 'ru') return [{ a, x: a.x, y: a.y }]
    const [x, y] = placeXY(a.area, kind), [jx, jy] = jitter(a.id, kind === 'minsk' ? 18 : 5)
    return [{ a, x: x + jx, y: y + jy }]
  })
  // На общем виде страны люди одного города — кружком с числом; при приближении кружок рассыпается.
  const clustered = kind === 'by' && z < 2.5
  const groups = clustered ? Object.entries(people.reduce<Record<string, Person[]>>((m, p) => { (m[cityOf(p.district)] ??= []).push(p); return m }, {})).filter(([, list]) => list.length > 1) : []
  const inGroup = new Set(groups.flatMap(([, list]) => list.map((p) => p.id)))
  const path = (pts: [number, number][], f: (la: number, lo: number) => [number, number]) => pts.map(([la, lo]) => f(la, lo).map((v) => v.toFixed(1)).join(',')).join(' ')
  const label = kind === 'minsk' ? 'Схема Минска с активностями' : kind === 'by' ? 'Карта Беларуси с активностями' : 'Схема центра Москвы с активностями'
  const meAt = myDistrict ? at(mx, my) : null
  return (
    <div ref={box} {...handlers} className="relative rounded-[28px] overflow-hidden bg-surface-2 aspect-square max-w-full select-none"
      style={{ touchAction: z > 1 ? 'none' : 'pan-y' }}>
      <svg viewBox={`${vx} ${vy} ${100 / z} ${100 / z}`} className="absolute inset-0 w-full h-full" role="img" aria-label={label}>
        {kind === 'minsk' && (
          <>
            <polygon points={path(MKAD, minskXY)} fill="var(--surface)" fillOpacity=".6" stroke="var(--line)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polyline points={path(SVISLOCH, minskXY)} fill="none" stroke="var(--cobalt)" strokeOpacity=".35" strokeWidth={8 * z ** 0.35} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            {MINSK_LABELS.map(([n, la, lo]) => { const [x, y] = minskXY(la, lo); return <text key={n} x={x} y={y} textAnchor="middle" fontSize={3.2 * k} fill="var(--muted)" aria-hidden="true">{n}</text> })}
          </>
        )}
        {kind === 'by' && (
          <>
            <defs>
              <linearGradient id="by-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--spark)" stopOpacity=".10" />
                <stop offset="1" stopColor="var(--cobalt)" stopOpacity=".14" />
              </linearGradient>
            </defs>
            {/* Тень-подложка и сама страна */}
            <polygon points={path(BY_BORDER, byXY)} transform={`translate(${.6 * k} ${1 * k})`} fill="var(--fg)" fillOpacity=".06" />
            <polygon points={path(BY_BORDER, byXY)} fill="var(--surface)" stroke="var(--fg)" strokeOpacity=".28" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polygon points={path(BY_BORDER, byXY)} fill="url(#by-fill)" />
            {BY_CITIES.map((c) => {
              const [x, y] = placeXY(c, 'by')
              const big = BY_CAPITALS.has(c)
              const above = c !== 'Гомель' && c !== 'Брест' && c !== 'Пинск'
              return (
                <g key={c} aria-hidden="true">
                  <circle cx={x} cy={y} r={(c === 'Минск' ? 1.4 : big ? 1 : .7) * k} fill="var(--fg)" fillOpacity={big ? .55 : .35} />
                  <text x={x} y={c === 'Минск' ? y - 4.6 * k : above ? y - 2.2 * k : y + 4.4 * k} textAnchor="middle" fontSize={(c === 'Минск' ? 3.8 : big ? 3.2 : 2.6) * k} fontWeight={c === 'Минск' ? 700 : 500} fill="var(--fg)" fillOpacity={big ? .7 : .5}>{c}</text>
                </g>
              )
            })}
          </>
        )}
        {kind === 'ru' && (
          <>
            {/* Садовое кольцо и Бульварное */}
            <ellipse cx="50" cy="52" rx="38" ry="36" fill="none" stroke="var(--line)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            <ellipse cx="50" cy="48" rx="20" ry="18" fill="none" stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
            {/* Москва-река */}
            <path d="M-2 62 C 14 58, 22 92, 40 90 S 52 66, 50 58 S 66 50, 78 70 S 94 76, 102 70" fill="none" stroke="var(--cobalt)" strokeOpacity=".35" strokeWidth={12 * z ** 0.35} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </>
        )}
        {shown.map(({ a, x, y }) => {
          const on = a.id === selected
          return (
            <g key={a.id} onClick={() => onSelect(a.id)} className="cursor-pointer" role="button" aria-label={a.title}>
              <circle cx={x} cy={y} r={6 * k} fill="transparent" />
              {on && <circle cx={x} cy={y} r={5 * k} fill="var(--spark)" fillOpacity=".2" />}
              <circle cx={x} cy={y} r={(on ? 2.4 : 1.7) * k} fill={a.authorId === 'me' ? 'var(--fg)' : 'var(--spark)'} stroke="var(--surface)" strokeWidth={.6 * k} />
            </g>
          )
        })}
      </svg>
      {/* На карте страны люди одного города — одним кружком с числом */}
      {groups.map(([place, list]) => {
        const [x, y] = placeXY(place, kind)
        const pos = at(x, y)
        if (!pos) return null
        const on = selected === `city:${place}`
        return (
          <button key={place} onClick={() => onSelectCity(place)} aria-label={`${place}: ${list.length} чел.`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center cursor-pointer ${on ? 'z-20' : 'z-10'}`} style={pos}>
            {list.slice(0, 2).map((p, i) => <span key={p.id} className={`rounded-full p-[1.5px] ${on ? 'bg-brand' : 'bg-surface'} shadow-soft`} style={{ marginLeft: i ? -px / 2 : 0 }}><Avatar name={p.name} hue={p.hue} src={p.photo} size={px} /></span>)}
            <span className="-ml-1.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-spark text-on-spark text-[10px] font-bold ring-2 ring-surface">{list.length}</span>
          </button>
        )
      })}
      {/* Люди рядом — аватарки в их районе (со сдвигом, чтобы не слипались) */}
      {people.filter((p) => !inGroup.has(p.id)).map((p) => {
        const [x, y] = placeXY(p.district, kind), [jx, jy] = jitter(p.id, kind === 'minsk' ? 14 : 4)
        const pos = at(Math.min(97, Math.max(3, x + jx)), Math.min(97, Math.max(3, y + jy)))
        if (!pos) return null
        const on = selected === p.id
        const free = !!p.freeUntil && p.freeUntil > now
        return (
          <button key={p.id} onClick={() => onSelectPerson(p.id)} aria-label={`${p.name}, ${p.district}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer ${on ? 'z-20 p-[2.5px] bg-brand' : 'z-10 p-[1.5px] bg-surface shadow-soft'}`} style={pos}>
            <Avatar name={p.name} hue={p.hue} src={p.photo} size={on ? Math.round(px * 1.3) : px} />
            {free && <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-[#22c55e] ring-2 ring-surface" style={{ width: Math.max(7, px / 3.5), height: Math.max(7, px / 3.5) }} />}
          </button>
        )
      })}
      {/* Я — аватарка с пульсом */}
      {meAt && (
        <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={meAt} aria-label={`Вы: ${myDistrict}`} role="img">
          <span className="absolute inset-0 -m-1.5 rounded-full bg-cobalt/30 animate-ping" />
          <span className="relative block rounded-full p-[2px] bg-cobalt shadow-soft"><Avatar name={me.name} hue={me.hue} src={me.photo} size={px + 4} /></span>
        </span>
      )}
      {/* Кнопки масштаба */}
      <div className="absolute right-3 top-3 z-30 flex flex-col rounded-2xl bg-surface/90 backdrop-blur shadow-soft overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={zoomIn} disabled={z >= MAX_ZOOM} className="grid place-items-center w-9 h-9 text-[20px] font-semibold cursor-pointer disabled:opacity-35" aria-label="Приблизить">+</button>
        <span className="h-px bg-line" />
        <button onClick={zoomOut} disabled={z <= 1} className="grid place-items-center w-9 h-9 text-[20px] font-semibold cursor-pointer disabled:opacity-35" aria-label="Отдалить">−</button>
      </div>
      {z > 1 && (
        <button onPointerDown={(e) => e.stopPropagation()} onClick={reset} className="absolute right-3 top-[92px] z-30 grid place-items-center w-9 h-9 rounded-2xl bg-surface/90 backdrop-blur shadow-soft cursor-pointer" aria-label="Показать всю карту"><Icon name="map" size={17} /></button>
      )}
      <div className="absolute left-3 bottom-3 z-30 flex gap-3 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-medium pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-spark" /> план</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> свободен</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cobalt" /> вы</span>
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
