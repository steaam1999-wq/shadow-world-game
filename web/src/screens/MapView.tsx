import { useEffect, useMemo, useRef, useState } from 'react'
import { byXY, countryOf, formatKm, knownKm, mapKindOf, minskXY, nearestPlace, placeDistanceKm, placeInfo, placeXY, ruXY } from '../places'
import { RU_BORDER } from '../ru-border'
import { PlaceSelect } from '../components/PlaceSelect'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { PostArt } from '../components/PostArt'
import { Avatar, Icon } from '../components/ui'
import { compatibility, planWhen } from '../lib'
import type { Activity, Me, Person } from '../types'

// Карта «Рядом»: я, люди рядом и планы на схеме Минска, карте Беларуси или центре Москвы.
// Показываются только районы и города — не точные адреса.

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

/** Город места: районы Минска на карте страны собираются в «Минск», районы центра Москвы — в «Москву». */
const cityOf = (place: string) => (place.startsWith('Минск') ? 'Минск' : mapKindOf(place) === 'ru' ? 'Москва' : place)
// Крупные города на карте России — для ориентира.
const RU_CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Нижний Новгород', 'Екатеринбург', 'Новосибирск', 'Красноярск', 'Иркутск', 'Хабаровск', 'Владивосток', 'Ростов-на-Дону', 'Краснодар', 'Самара', 'Омск', 'Якутск', 'Мурманск', 'Калининград', 'Архангельск', 'Петропавловск-Камчатский', 'Магадан']
const RU_BIG = new Set(['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Владивосток'])

/** Кто рядом: люди с указанным городом/районом в пределах радиуса (на этой же карте). */
function useNearbyPeople(me: Me) {
  const { state } = useStore()
  return useMemo(() => {
    const kind = mapKindOf(me.district)
    return state.people
      .filter((p) => p.district && placeInfo(p.district))
      .filter((p) => { const k = mapKindOf(p.district); return kind === 'ru' ? k === 'ru' : kind === 'minsk' ? k === 'minsk' : countryOf(k) === countryOf(kind) })
      .map((p) => ({ p, km: me.district ? placeDistanceKm(me.district, p.district) : 999 }))
      .filter((x) => !me.district || me.radiusKm >= 500 || x.km <= Math.max(me.radiusKm, kind === 'minsk' ? 50 : me.radiusKm)) // «Вся страна» — без ограничения
      .sort((a, b) => a.km - b.km)
      .slice(0, 80)
  }, [state.people, me.district, me.radiusKm])
}

const RADII = [3, 10, 50, 500]
type Layer = 'all' | 'people' | 'plans'
type Pick = { kind: 'plan' | 'person'; id: string } | { kind: 'city'; id: string }

/** Карта: на весь экран, поверх — переключатели и кнопки, внизу — лента карточек. */
export function MapTab({ items, now, onOpenPlan }: { items: Activity[]; now: number; onOpenPlan: (id: string) => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const openProfile = useOpenProfile()
  const people = useNearbyPeople(me)
  const [layer, setLayer] = useState<Layer>('all')
  const [picked, setPicked] = useState<Pick | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const zoom = useMapZoom(mapKindOf(me.district) === 'rus' ? 22 : MAX_ZOOM) // Россия огромная — приближать можно сильнее
  const rail = useRef<HTMLDivElement>(null)
  const kind = mapKindOf(me.district)

  const showPeople = layer !== 'plans'
  const showPlans = layer !== 'people'
  const plans = useMemo(() => items.filter((a) => {
    const k = mapKindOf(a.area)
    return kind === 'ru' ? k === 'ru' : kind === 'minsk' ? k === 'minsk' : countryOf(k) === countryOf(kind)
  }), [items, kind])
  // Лента: сначала люди (ближе — раньше), потом планы (скорее — раньше); в кружке города — только его люди.
  const cards = [
    ...(showPeople ? people.filter((x) => picked?.kind !== 'city' || cityOf(x.p.district) === picked.id).map((x) => ({ kind: 'person' as const, id: x.p.id, x })) : []),
    ...(showPlans && picked?.kind !== 'city' ? plans.map((a) => ({ kind: 'plan' as const, id: a.id, a })) : []),
  ]

  const scrollTo = (id: string) => requestAnimationFrame(() => rail.current?.querySelector(`[data-card="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }))
  const pointOf = (p: Pick): [number, number] | null => {
    if (p.kind === 'person') { const x = people.find((y) => y.p.id === p.id); if (!x) return null; const [px, py] = placeXY(x.p.district, kind), [jx, jy] = jitter(x.p.id, kind === 'minsk' ? 14 : kind === 'rus' ? 0.6 : 4); return [px + jx, py + jy] }
    if (p.kind === 'plan') { const a = plans.find((y) => y.id === p.id); if (!a) return null; if (kind === 'ru') return [a.x, a.y]; const [px, py] = placeXY(a.area, kind), [jx, jy] = jitter(a.id, kind === 'minsk' ? 18 : kind === 'rus' ? 0.8 : 5); return [px + jx, py + jy] }
    return placeXY(p.id, kind)
  }
  const pick = (p: Pick, fly = false) => {
    setPicked(p)
    if (p.kind !== 'city') scrollTo(p.id)
    else rail.current?.scrollTo({ left: 0, behavior: 'smooth' })
    const pt = pointOf(p)
    if (fly && pt) zoom.flyTo(pt[0], pt[1], p.kind === 'city' ? 3 : Math.max(zoom.view.z, 2.6))
  }
  const centerMe = () => {
    if (!me.district) { locate(); return }
    const [x, y] = placeXY(me.district, kind)
    zoom.flyTo(x, y, Math.max(zoom.view.z, kind === 'minsk' ? 2.2 : kind === 'rus' ? 5 : 3))
  }

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

  const glass = 'bg-surface/80 backdrop-blur-xl shadow-[0_6px_24px_-8px_rgb(0_0_0/.25)] ring-1 ring-black/5'
  const selectedId = picked ? (picked.kind === 'city' ? `city:${picked.id}` : picked.id) : null

  return (
    <div className="px-3">
      <div className="relative h-[calc(100dvh-262px-env(safe-area-inset-bottom,0px))] min-h-[420px] rounded-[30px] overflow-hidden">
        <CityMap zoom={zoom} items={showPlans ? plans : []} people={showPeople ? people.map((x) => x.p) : []} me={me} selected={selectedId}
          onSelect={(id) => pick({ kind: 'plan', id })} onSelectPerson={(id) => pick({ kind: 'person', id })} onSelectCity={(place) => pick({ kind: 'city', id: place }, true)}
          onBackground={() => setPicked(null)} />

        {/* Верх: что показывать и радиус */}
        <div className="absolute left-3 right-3 top-3 z-40 flex items-center gap-2 pointer-events-none">
          <div className={`pointer-events-auto min-w-0 flex p-1 rounded-full ${glass}`} role="tablist" aria-label="Что показывать на карте">
            {([['all', 'Все'], ['people', `Люди ${people.length}`], ['plans', `Планы ${plans.length}`]] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={layer === id} onClick={() => { setLayer(id); setPicked(null) }}
                className={`h-8 px-2.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition ${layer === id ? 'bg-fg text-bg' : 'text-fg/75'}`}>{label}</button>
            ))}
          </div>
          {me.district && (
            <label className={`pointer-events-auto relative ml-auto shrink-0 h-10 pl-3 pr-7 rounded-full inline-flex items-center whitespace-nowrap text-[12.5px] font-semibold ${glass}`}>
              {me.radiusKm >= 500 ? 'Страна' : `${me.radiusKm} км`}
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60"><Icon name="down" size={13} /></span>
              <select aria-label="Радиус" value={me.radiusKm} onChange={(e) => dispatch({ type: 'updateMe', patch: { radiusKm: Number(e.target.value) } })} className="absolute inset-0 opacity-0 cursor-pointer">
                {RADII.map((r) => <option key={r} value={r}>{r === 500 ? 'Вся страна' : `до ${r} км`}</option>)}
              </select>
            </label>
          )}
        </div>

        {/* Справа: я, приблизить, отдалить */}
        <div className="absolute right-3 top-16 z-40 flex flex-col gap-2">
          <button onClick={centerMe} disabled={locating} className={`grid place-items-center w-10 h-10 rounded-full cursor-pointer text-cobalt ${glass}`} aria-label={me.district ? 'Показать меня' : 'Определить по GPS'}><Icon name="pin" size={19} /></button>
          <div className={`flex flex-col rounded-full overflow-hidden ${glass}`}>
            <button onClick={zoom.zoomIn} disabled={zoom.view.z >= zoom.max} className="grid place-items-center w-10 h-10 text-[20px] leading-none cursor-pointer disabled:opacity-30" aria-label="Приблизить">+</button>
            <button onClick={zoom.zoomOut} disabled={zoom.view.z <= 1} className="grid place-items-center w-10 h-10 text-[20px] leading-none cursor-pointer disabled:opacity-30" aria-label="Отдалить">−</button>
          </div>
        </div>

        {/* Место не указано — карточка поверх карты */}
        {!me.district && (
          <div className="absolute inset-x-3 bottom-3 z-40">
            <section className={`rounded-[24px] p-4 flex flex-col gap-3 ${glass} !bg-surface/90`} aria-label="Ваше место">
              <div>
                <h2 className="font-display font-bold text-[17px]">Где вы?</h2>
                <p className="text-[13px] text-muted leading-snug mt-0.5">Появитесь на карте и увидите, кто рядом. Видно только район — не точный адрес.</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button onClick={locate} disabled={locating} className="h-11 rounded-2xl bg-brand text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"><Icon name="pin" size={18} /> {locating ? 'Определяем…' : 'Определить по GPS'}</button>
                <PlaceSelect value="" none={false} label="Мой город или район" onChange={(v) => v && dispatch({ type: 'updateMe', patch: { district: v } })}
                  trigger={(open) => <button type="button" onClick={open} className="h-11 px-4 rounded-2xl bg-surface-2 font-semibold text-[14px] inline-flex items-center cursor-pointer">Найти город</button>} />
              </div>
              {geoError && <p className="text-[13px] text-danger" role="alert">{geoError}</p>}
            </section>
          </div>
        )}

        {/* Низ: лента карточек */}
        {me.district && (
          <div className="absolute inset-x-0 bottom-3 z-40 flex flex-col gap-2">
            {(geoError || picked?.kind === 'city') && (
              <div className="px-3 flex">
                {geoError ? <p className={`rounded-2xl px-3 py-2 text-[12.5px] text-danger ${glass}`} role="alert">{geoError}</p>
                  : picked?.kind === 'city' && <button onClick={() => setPicked(null)} className={`h-8 px-3 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${glass}`}>{picked.id} · {cards.length} чел. <Icon name="x" size={13} /></button>}
              </div>
            )}
            {cards.length > 0 ? (
              <div ref={rail} className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory px-3 pb-1 scroll-px-3">
                {cards.map((c) => {
                  const on = picked?.id === c.id && picked.kind === c.kind
                  if (c.kind === 'person') {
                    const { p, km } = c.x
                    const free = !!p.freeUntil && p.freeUntil > now
                    return (
                      <div key={c.id} data-card={c.id} onClick={() => pick({ kind: 'person', id: p.id }, true)}
                        className={`snap-start shrink-0 w-[250px] rounded-[22px] p-3 flex items-center gap-3 cursor-pointer transition ${glass} ${on ? '!bg-surface ring-2 !ring-spark' : ''}`}>
                        <span className="relative shrink-0"><Avatar name={p.name} hue={p.hue} src={p.photo} size={48} verified={p.verified} />{free && <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-[#22c55e] ring-2 ring-surface" />}</span>
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="font-semibold text-[14.5px] truncate">{p.name}{p.age ? `, ${p.age}` : ''}</div>
                          <div className="text-[12px] text-muted truncate">{knownKm(km) ? `${formatKm(km)} · ` : ''}{p.district.replace(/^Минск, /, '')}</div>
                          <div className="text-[12px] font-semibold text-spark">{compatibility(me, p).score}% вайб{free ? ' · свободен' : ''}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openProfile(p.id) }} className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-fg text-bg cursor-pointer" aria-label={`Профиль ${p.name}`}><Icon name="arrow" size={16} /></button>
                      </div>
                    )
                  }
                  const a = c.a
                  return (
                    <div key={c.id} data-card={c.id} onClick={() => pick({ kind: 'plan', id: a.id }, true)}
                      className={`snap-start shrink-0 w-[250px] rounded-[22px] p-2 pr-3 flex items-center gap-3 cursor-pointer transition ${glass} ${on ? '!bg-surface ring-2 !ring-spark' : ''}`}>
                      <span className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden"><PostArt activity={a} /></span>
                      <div className="flex-1 min-w-0 leading-tight">
                        <div className="text-[11.5px] font-semibold text-spark truncate">{planWhen(a, now)}</div>
                        <div className="font-semibold text-[14px] line-clamp-2">{a.title}</div>
                        <div className="text-[12px] text-muted truncate">{a.area.replace(/^Минск, /, '')}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onOpenPlan(a.id) }} className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-fg text-bg cursor-pointer" aria-label={`Открыть план ${a.title}`}><Icon name="arrow" size={16} /></button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-3"><p className={`rounded-2xl px-4 py-3 text-[13px] text-muted text-center ${glass}`}>Рядом пока никого. Увеличьте радиус или создайте план.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const MAX_ZOOM = 8
/** Размер аватарки на карте: маленькая на общем виде, растёт при приближении. */
const markerPx = (z: number) => Math.round(Math.min(46, 15 * z ** 0.6))
type View = { z: number; cx: number; cy: number }

/**
 * Масштаб и сдвиг карты: щипок, перетаскивание, колёсико, двойное нажатие, кнопки, плавный перелёт.
 * Карта — квадрат 0..100; окно может быть любой формы (масштаб по ширине).
 */
function useMapZoom(max = MAX_ZOOM) {
  const box = useRef<HTMLDivElement>(null)
  const [view, setViewRaw] = useState<View>({ z: 1, cx: 50, cy: 50 })
  const [aspect, setAspect] = useState(1) // высота / ширина окна
  const viewRef = useRef(view)
  const anim = useRef(0)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; mid: { x: number; y: number }; v: View } | null>(null)
  const drag = useRef<{ x: number; y: number; v: View; moved: boolean } | null>(null)
  const lastTap = useRef(0)
  const suppressClick = useRef(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); if (r.width) setAspect(r.height / r.width) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clamp = (v: View, a = aspect): View => {
    const z = Math.min(max, Math.max(1, v.z))
    const w = 100 / z, h = w * a
    const cx = w >= 100 ? 50 : Math.min(100 - w / 2, Math.max(w / 2, v.cx))
    const cy = h >= 100 ? 50 : Math.min(100 - h / 2, Math.max(h / 2, v.cy))
    return { z, cx, cy }
  }
  const setView = (f: View | ((v: View) => View)) => {
    cancelAnimationFrame(anim.current)
    setViewRaw((v) => { const n = clamp(typeof f === 'function' ? f(v) : f); viewRef.current = n; return n })
  }
  useEffect(() => { setViewRaw((v) => { const n = clamp(v); viewRef.current = n; return n }) }, [aspect]) // eslint-disable-line react-hooks/exhaustive-deps

  const rect = () => box.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 }
  const zoomAt = (x: number, y: number, z: number, v: View): View => {
    const r = rect()
    const w = 100 / v.z, h = w * aspect
    const fx = (x - r.left) / r.width, fy = (y - r.top) / r.height
    const mx = v.cx - w / 2 + fx * w, my = v.cy - h / 2 + fy * h
    const nz = Math.min(max, Math.max(1, z)), nw = 100 / nz, nh = nw * aspect
    return clamp({ z: nz, cx: mx - (fx - 0.5) * nw, cy: my - (fy - 0.5) * nh })
  }
  /** Плавно перелететь к точке карты. */
  const flyTo = (x: number, y: number, z: number) => {
    cancelAnimationFrame(anim.current)
    const from = viewRef.current, to = clamp({ z, cx: x, cy: y })
    const t0 = performance.now(), dur = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : 420
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3
      const n = { z: from.z + (to.z - from.z) * e, cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e }
      viewRef.current = n; setViewRaw(n)
      if (k < 1) anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setView((v) => zoomAt(e.clientX, e.clientY, v.z * Math.exp(-e.deltaY * 0.0025), v)) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      cancelAnimationFrame(anim.current)
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.current.size === 2) {
        const [a, b] = [...pts.current.values()]
        gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: viewRef.current }
        drag.current = null
      } else if (pts.current.size === 1) {
        drag.current = { x: e.clientX, y: e.clientY, v: viewRef.current, moved: false }
        suppressClick.current = false
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!pts.current.has(e.pointerId)) return
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const g = gesture.current
      const r = rect()
      if (g && pts.current.size >= 2) {
        const [a, b] = [...pts.current.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const zv = zoomAt(g.mid.x, g.mid.y, g.v.z * (d / Math.max(1, g.dist)), g.v)
        const w = 100 / zv.z
        setView({ ...zv, cx: zv.cx - ((mid.x - g.mid.x) / r.width) * w, cy: zv.cy - ((mid.y - g.mid.y) / r.width) * w })
        suppressClick.current = true
        return
      }
      const dr = drag.current
      if (!dr) return
      const ddx = e.clientX - dr.x, ddy = e.clientY - dr.y
      if (!dr.moved && Math.hypot(ddx, ddy) < 6) return
      if (!dr.moved) { dr.moved = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
      suppressClick.current = true
      const w = 100 / dr.v.z
      setView({ ...dr.v, cx: dr.v.cx - (ddx / r.width) * w, cy: dr.v.cy - (ddy / r.width) * w })
    },
    onPointerUp: (e: React.PointerEvent) => {
      pts.current.delete(e.pointerId)
      if (pts.current.size < 2) gesture.current = null
      if (pts.current.size === 0) {
        const tap = drag.current && !drag.current.moved && !suppressClick.current
        drag.current = null
        if (tap) {
          const t = Date.now()
          if (t - lastTap.current < 300) { const n = zoomAt(e.clientX, e.clientY, viewRef.current.z * 2, viewRef.current); flyTo(n.cx, n.cy, n.z); lastTap.current = 0; suppressClick.current = true }
          else lastTap.current = t
        }
      }
    },
    onPointerCancel: (e: React.PointerEvent) => { pts.current.delete(e.pointerId); gesture.current = null; drag.current = null },
    onClickCapture: (e: React.MouseEvent) => { if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); suppressClick.current = false } },
  }
  const step = (f: number) => { const v = viewRef.current; flyTo(v.cx, v.cy, v.z * f) }
  return { box, view, aspect, handlers, flyTo, max, zoomIn: () => step(1.8), zoomOut: () => step(1 / 1.8) }
}
type Zoom = ReturnType<typeof useMapZoom>

function CityMap({ zoom, items, people, me, selected, onSelect, onSelectPerson, onSelectCity, onBackground }: {
  zoom: Zoom; items: Activity[]; people: Person[]; me: Me; selected: string | null
  onSelect: (id: string) => void; onSelectPerson: (id: string) => void; onSelectCity: (place: string) => void; onBackground: () => void
}) {
  const { state } = useStore()
  const myDistrict = me.district
  const now = Date.now()
  const kind = mapKindOf(myDistrict)
  const [dx, dy] = placeXY(myDistrict, kind)
  const [mx, my] = kind === 'ru' ? [dx + 4, dy + 5] : [dx, dy] // в Москве смещаем, чтобы метка не совпадала с активностями района
  const { z } = zoom.view
  const vw = 100 / z, vh = vw * zoom.aspect
  const vx = zoom.view.cx - vw / 2, vy = zoom.view.cy - vh / 2
  /** Координаты карты → проценты окна; null — точка за краем. */
  const at = (x: number, y: number) => {
    const sx = ((x - vx) / vw) * 100, sy = ((y - vy) / vh) * 100
    return sx < -6 || sx > 106 || sy < -6 || sy > 106 ? null : { left: `${sx}%`, top: `${sy}%` }
  }
  const k = z ** -0.6 // точки и подписи растут медленнее карты
  const px = markerPx(z)
  const shown = items.map((a) => {
    if (kind === 'ru') return { a, x: a.x, y: a.y }
    const [x, y] = placeXY(a.area, kind), [jx, jy] = jitter(a.id, kind === 'minsk' ? 18 : kind === 'rus' ? 0.8 : 5)
    return { a, x: x + jx, y: y + jy }
  })
  // На общем виде страны люди одного города — кружком; при приближении кружок рассыпается.
  const clustered = (kind === 'by' && z < 2.5) || (kind === 'rus' && z < 6)
  const groups = clustered ? Object.entries(people.reduce<Record<string, Person[]>>((m, p) => { (m[cityOf(p.district)] ??= []).push(p); return m }, {})).filter(([, list]) => list.length > 1) : []
  const inGroup = new Set(groups.flatMap(([, list]) => list.map((p) => p.id)))
  const path = (pts: [number, number][], f: (la: number, lo: number) => [number, number]) => pts.map(([la, lo]) => f(la, lo).map((v) => v.toFixed(1)).join(',')).join(' ')
  const label = kind === 'minsk' ? 'Схема Минска' : kind === 'by' ? 'Карта Беларуси' : kind === 'rus' ? 'Карта России' : 'Схема центра Москвы'
  const meAt = myDistrict ? at(mx, my) : null
  // При приближении — сколько людей в городе (на карте страны) или районе (на схеме Минска), вместе со мной.
  const showCounts = kind !== 'ru' && z >= (kind === 'by' ? 1.6 : kind === 'rus' ? 4 : 2)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of [...state.people.map((p) => p.district), myDistrict]) {
      if (!d || !placeInfo(d)) continue
      const kk = mapKindOf(d)
      if (kind === 'minsk' ? kk !== 'minsk' : countryOf(kk) !== countryOf(kind)) continue
      const key = kind === 'minsk' ? d : cityOf(d)
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [state.people, myDistrict, kind])
  const short = (place: string) => place.replace(/^Минск, /, '').replace(/ р-н$/, '')

  return (
    <div ref={zoom.box} {...zoom.handlers} onClick={(e) => { if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).closest('[data-map-bg]')) onBackground() }}
      className="absolute inset-0 overflow-hidden select-none bg-[radial-gradient(120%_80%_at_30%_20%,color-mix(in_oklab,var(--spark)_10%,var(--surface-2)),var(--surface-2))]"
      style={{ touchAction: 'none' }}>
      {/* Лёгкая сетка — «картографическая» подложка, двигается вместе с картой */}
      <div data-map-bg aria-hidden="true" className="absolute inset-0 opacity-[.35]"
        style={{ backgroundImage: 'radial-gradient(var(--line) 1px, transparent 1.2px)', backgroundSize: `${18 * z ** 0.5}px ${18 * z ** 0.5}px`, backgroundPosition: `${-vx * 4}px ${-vy * 4}px` }} />
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" role="img" aria-label={label}>
        {kind === 'minsk' && (
          <>
            <polygon points={path(MKAD, minskXY)} fill="var(--surface)" fillOpacity=".75" stroke="var(--fg)" strokeOpacity=".18" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polyline points={path(SVISLOCH, minskXY)} fill="none" stroke="var(--cobalt)" strokeOpacity=".3" strokeWidth={8 * z ** 0.35} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            {!showCounts && MINSK_LABELS.map(([n, la, lo]) => { const [x, y] = minskXY(la, lo); return <text key={n} x={x} y={y} textAnchor="middle" fontSize={3 * k} fontWeight={600} fill="var(--fg)" fillOpacity=".4" aria-hidden="true">{n}</text> })}
          </>
        )}
        {kind === 'by' && (
          <>
            <polygon points={path(BY_BORDER, byXY)} transform={`translate(${.5 * k} ${.9 * k})`} fill="var(--fg)" fillOpacity=".07" />
            <polygon points={path(BY_BORDER, byXY)} fill="var(--surface)" stroke="var(--fg)" strokeOpacity=".22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            {BY_CITIES.map((c) => {
              const [x, y] = placeXY(c, 'by')
              const big = BY_CAPITALS.has(c)
              const above = c !== 'Гомель' && c !== 'Брест' && c !== 'Пинск'
              return (
                <g key={c} aria-hidden="true">
                  <circle cx={x} cy={y} r={(c === 'Минск' ? 1.2 : big ? .9 : .6) * k} fill="var(--fg)" fillOpacity={big ? .4 : .25} />
                  {!(showCounts && counts.has(c)) && <text x={x} y={c === 'Минск' ? y - 4 * k : above ? y - 2 * k : y + 4 * k} textAnchor="middle" fontSize={(c === 'Минск' ? 3.4 : big ? 2.9 : 2.4) * k} fontWeight={600} fill="var(--fg)" fillOpacity={big ? .55 : .38}>{c}</text>}
                </g>
              )
            })}
          </>
        )}
        {kind === 'rus' && (
          <>
            {RU_BORDER.map((ring, i) => <polygon key={`s${i}`} points={path(ring, ruXY)} transform={`translate(${.25 * k} ${.45 * k})`} fill="var(--fg)" fillOpacity=".07" />)}
            {RU_BORDER.map((ring, i) => <polygon key={i} points={path(ring, ruXY)} fill="var(--surface)" stroke="var(--fg)" strokeOpacity=".22" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
            {RU_CITIES.map((c) => {
              const [x, y] = placeXY(c, 'rus')
              const big = RU_BIG.has(c)
              if (!big && z < 2.2) return null
              return (
                <g key={c} aria-hidden="true">
                  <circle cx={x} cy={y} r={(big ? .55 : .4) * k} fill="var(--fg)" fillOpacity={big ? .4 : .28} />
                  {!(showCounts && counts.has(c)) && <text x={x} y={y - 1.2 * k} textAnchor="middle" fontSize={(big ? 1.9 : 1.5) * k} fontWeight={600} fill="var(--fg)" fillOpacity={big ? .55 : .4}>{c}</text>}
                </g>
              )
            })}
          </>
        )}
        {kind === 'ru' && (
          <>
            <ellipse cx="50" cy="52" rx="38" ry="36" fill="var(--surface)" fillOpacity=".6" stroke="var(--fg)" strokeOpacity=".15" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <ellipse cx="50" cy="48" rx="20" ry="18" fill="none" stroke="var(--fg)" strokeOpacity=".12" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
            <path d="M-2 62 C 14 58, 22 92, 40 90 S 52 66, 50 58 S 66 50, 78 70 S 94 76, 102 70" fill="none" stroke="var(--cobalt)" strokeOpacity=".3" strokeWidth={12 * z ** 0.35} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* Планы — капли с подсветкой */}
      {shown.map(({ a, x, y }) => {
        const pos = at(x, y)
        if (!pos) return null
        const on = a.id === selected
        const d = Math.round((on ? 1.5 : 1) * Math.max(10, px * 0.62))
        return (
          <button key={a.id} onClick={() => onSelect(a.id)} aria-label={a.title} style={pos}
            className={`absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full cursor-pointer transition-[width,height] ${on ? 'z-20' : 'z-[5]'}`}>
            <span className={`block rounded-full ring-2 ring-surface shadow-soft ${a.authorId === 'me' ? 'bg-fg' : 'bg-[image:var(--brand)]'}`} style={{ width: d, height: d }} />
            {on && <span className="absolute inset-0 -m-2 rounded-full bg-spark/25 animate-ping" />}
          </button>
        )
      })}

      {/* Кружки городов */}
      {groups.map(([place, list]) => {
        const [x, y] = placeXY(place, kind)
        const pos = at(x, y)
        if (!pos) return null
        const on = selected === `city:${place}`
        return (
          <button key={place} onClick={() => onSelectCity(place)} aria-label={`${place}: ${list.length} чел.`} style={pos}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center cursor-pointer ${on ? 'z-20' : 'z-10'}`}>
            {list.slice(0, 2).map((p, i) => <span key={p.id} className={`rounded-full p-[1.5px] ${on ? 'bg-spark' : 'bg-surface'} shadow-soft`} style={{ marginLeft: i ? -px / 2 : 0 }}><Avatar name={p.name} hue={p.hue} src={p.photo} size={px} /></span>)}
            {!(showCounts && counts.has(place)) && <span className="-ml-1.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-fg text-bg text-[10px] font-bold ring-2 ring-surface">{list.length}</span>}
          </button>
        )
      })}

      {/* Люди */}
      {people.filter((p) => !inGroup.has(p.id)).map((p) => {
        const [x, y] = placeXY(p.district, kind), [jx, jy] = jitter(p.id, kind === 'minsk' ? 14 : kind === 'rus' ? 0.6 : 4)
        const pos = at(Math.min(97, Math.max(3, x + jx)), Math.min(97, Math.max(3, y + jy)))
        if (!pos) return null
        const on = selected === p.id
        const free = !!p.freeUntil && p.freeUntil > now
        return (
          <button key={p.id} onClick={() => onSelectPerson(p.id)} aria-label={`${p.name}, ${p.district}`} style={pos}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-transform ${on ? 'z-20 p-[2.5px] bg-spark scale-125' : 'z-10 p-[1.5px] bg-surface shadow-soft'}`}>
            <Avatar name={p.name} hue={p.hue} src={p.photo} size={px} />
            {free && <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-[#22c55e] ring-2 ring-surface" style={{ width: Math.max(7, px / 3.5), height: Math.max(7, px / 3.5) }} />}
          </button>
        )
      })}

      {/* Число людей в городе или районе */}
      {showCounts && [...counts].map(([place, n]) => {
        const [x, y] = placeXY(place, kind)
        const pos = at(x, y - (kind === 'minsk' ? 7 : kind === 'rus' ? 0.4 : 2))
        if (!pos) return null
        const sx = Math.min(97, Math.max(3, parseFloat(pos.left)))
        const shift = sx < 22 ? 0 : sx > 78 ? -100 : -50
        return (
          <span key={place} className="absolute z-[25] pointer-events-none whitespace-nowrap rounded-full bg-surface/90 backdrop-blur shadow-soft pl-2.5 pr-1 h-6 inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
            style={{ left: `${sx}%`, top: pos.top, transform: `translate(${shift}%, calc(-100% - ${px / 2 + 4}px))` }}>
            {short(place)}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-fg text-bg px-1.5 h-[18px] text-[10.5px] font-bold tnum"><Icon name="people" size={11} />{n}</span>
          </span>
        )
      })}

      {/* Я */}
      {meAt && (
        <span className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={meAt} aria-label={`Вы: ${myDistrict}`} role="img">
          <span className="absolute inset-0 -m-2 rounded-full bg-cobalt/25 animate-ping" />
          <span className="relative block rounded-full p-[2.5px] bg-cobalt shadow-[0_4px_14px_-2px_rgb(0_0_0/.35)]"><Avatar name={me.name} hue={me.hue} src={me.photo} size={px + 4} /></span>
        </span>
      )}
    </div>
  )
}
