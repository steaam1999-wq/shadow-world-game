import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { DISTRICTS } from '../data'
import { Avatar, Button, Chip, Field, Icon, Sheet, Toggle, inputCls, readPhoto } from '../components/ui'
import { ReliabilityBadge } from '../components/Meet'
import { ListingArt } from './ListingArt'
import { CONDITION_LABEL, MARKET_CATEGORIES, ago, priceLabel } from './data'
import type { Listing } from '../types'

type View = 'all' | 'fav' | 'mine'
type Sort = 'new' | 'cheap' | 'expensive'

/** Маркет: барахолка между людьми рядом — объявления, избранное, свои объявления. */
export function Market({ now, onContact }: { now: number; onContact: (sellerId: string) => void }) {
  const { state, dispatch } = useStore()
  const listings = state.listings ?? []
  const fav = state.favListings ?? []
  const [view, setView] = useState<View>('all')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('new')
  const [maxPrice, setMaxPrice] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const max = Number(maxPrice) || 0
    return listings
      .filter((l) => (view === 'mine' ? l.sellerId === 'me' : view === 'fav' ? fav.includes(l.id) : !l.sold || l.sellerId === 'me'))
      .filter((l) => !cat || (cat === 'Бесплатно' ? !l.price : l.category === cat))
      .filter((l) => !q || `${l.title} ${l.description} ${l.district}`.toLowerCase().includes(q))
      .filter((l) => !max || l.price <= max)
      .sort((a, b) => (sort === 'cheap' ? a.price - b.price : sort === 'expensive' ? b.price - a.price : b.createdAt - a.createdAt))
  }, [listings, fav, view, query, cat, sort, maxPrice])
  const opened = listings.find((l) => l.id === open) ?? null

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="px-4 flex gap-2">
        <label htmlFor="market-search" className="flex-1 min-w-0 flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={18} />
          <input id="market-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск в Маркете" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
        </label>
        <Button className="h-11 px-4 shrink-0" onClick={() => setCreating(true)}><Icon name="plus" size={18} /> Подать</Button>
      </div>

      <div className="grid grid-cols-3 mx-4 p-1 rounded-2xl bg-surface-2" role="tablist" aria-label="Объявления">
        {([['all', 'Все'], ['fav', `Избранное${fav.length ? ` · ${fav.length}` : ''}`], ['mine', 'Мои']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={`h-9 rounded-xl text-[13px] font-semibold cursor-pointer transition ${view === id ? 'bg-surface shadow-soft' : 'text-muted'}`}>{label}</button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
        <Chip active={!cat} onClick={() => setCat(null)}>Все категории</Chip>
        {MARKET_CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</Chip>)}
      </div>

      <div className="flex items-center gap-2 px-4">
        <label htmlFor="market-sort" className="sr-only">Сортировка</label>
        <select id="market-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-xl bg-surface-2 px-3 text-[13px] font-medium cursor-pointer focus:outline-none">
          <option value="new">Сначала новые</option>
          <option value="cheap">Сначала дешевле</option>
          <option value="expensive">Сначала дороже</option>
        </select>
        <label htmlFor="market-max" className="flex items-center gap-1.5 h-9 rounded-xl bg-surface-2 px-3 text-[13px] text-muted">
          до
          <input id="market-max" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} placeholder="любой" className="w-16 bg-transparent text-fg focus:outline-none tnum" />
          ₽
        </label>
        <span className="ml-auto text-[12px] text-muted tnum whitespace-nowrap">{items.length} шт.</span>
      </div>

      {items.length ? (
        <div className="grid grid-cols-2 gap-2.5 px-3">
          {items.map((l) => <ListingCard key={l.id} listing={l} now={now} onOpen={() => setOpen(l.id)} />)}
        </div>
      ) : (
        <div className="mx-4 rounded-[24px] bg-surface-2 p-8 text-center flex flex-col items-center gap-3">
          <p className="font-semibold">{view === 'mine' ? 'Вы ещё ничего не продаёте' : view === 'fav' ? 'В избранном пусто' : 'Ничего не нашлось'}</p>
          <p className="text-[13px] text-muted">{view === 'mine' ? 'Продайте то, что давно не нужно, — людям рядом.' : view === 'fav' ? 'Нажмите на сердечко на объявлении, чтобы вернуться к нему позже.' : 'Попробуйте другой запрос или уберите фильтры.'}</p>
          {view === 'mine' && <Button onClick={() => setCreating(true)}>Подать объявление</Button>}
        </div>
      )}

      {opened && <ListingDetail listing={opened} now={now} onClose={() => setOpen(null)} onContact={(id) => { dispatch({ type: 'contactSeller', listingId: opened.id }); setOpen(null); onContact(id) }} />}
      <CreateListing open={creating} onClose={() => setCreating(false)} onCreated={() => setView('mine')} />
    </div>
  )
}

function ListingCard({ listing: l, now, onOpen }: { listing: Listing; now: number; onOpen: () => void }) {
  const { state, dispatch } = useStore()
  const faved = (state.favListings ?? []).includes(l.id)
  return (
    <article className="relative rounded-[20px] bg-surface shadow-soft overflow-hidden flex flex-col">
      <button onClick={onOpen} className="text-left cursor-pointer flex flex-col" aria-label={`${l.title}, ${priceLabel(l)}`}>
        <div className="relative aspect-square max-w-full">
          <ListingArt listing={l} />
          {l.sold && <span className="absolute inset-0 grid place-items-center bg-black/45 text-white font-semibold">Продано</span>}
          {l.condition === 'new' && !l.sold && <span className="absolute left-2 top-2 rounded-full bg-white/85 text-[#111114] px-2 h-6 inline-flex items-center text-[11px] font-semibold">Новое</span>}
        </div>
        <div className="p-2.5 flex flex-col gap-0.5">
          <span className={`font-display font-semibold text-[16px] tnum ${l.price ? '' : 'text-ok'}`}>{priceLabel(l)}</span>
          <span className="text-[13px] leading-snug line-clamp-2">{l.title}</span>
          <span className="text-[11px] text-muted truncate">{l.district} · {ago(l.createdAt, now)}</span>
        </div>
      </button>
      {l.sellerId !== 'me' && (
        <button onClick={() => dispatch({ type: 'toggleFavListing', id: l.id })} className={`absolute right-2 top-2 grid place-items-center w-8 h-8 rounded-full bg-white/85 cursor-pointer ${faved ? 'text-danger' : 'text-[#111114]'}`}
          aria-label={faved ? 'Убрать из избранного' : 'В избранное'} aria-pressed={faved}>
          <Icon name="heart" size={17} fill={faved} />
        </button>
      )}
    </article>
  )
}

function ListingDetail({ listing: l, now, onClose, onContact }: { listing: Listing; now: number; onClose: () => void; onContact: (sellerId: string) => void }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const [phone, setPhone] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const seller = state.people.find((p) => p.id === l.sellerId)
  const mine = l.sellerId === 'me'
  const faved = (state.favListings ?? []).includes(l.id)
  const demoPhone = `+7 9${(l.id.charCodeAt(1) * 7919) % 100}-${(l.id.length * 131) % 900 + 100}-••-••`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={l.title}>
      <button className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default" aria-label="Закрыть" onClick={onClose} />
      <div className="anim-rise relative w-full max-w-[480px] max-h-[94%] overflow-y-auto bg-surface rounded-t-[28px] sm:rounded-[28px] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <div className="relative aspect-[4/3] max-w-full">
          <ListingArt listing={l} />
          <button onClick={onClose} className="absolute left-3 top-3 grid place-items-center w-10 h-10 rounded-full bg-white/85 text-[#111114] cursor-pointer" aria-label="Закрыть"><Icon name="x" size={20} /></button>
          {!mine && (
            <button onClick={() => dispatch({ type: 'toggleFavListing', id: l.id })} className={`absolute right-3 top-3 grid place-items-center w-10 h-10 rounded-full bg-white/85 cursor-pointer ${faved ? 'text-danger' : 'text-[#111114]'}`} aria-label={faved ? 'Убрать из избранного' : 'В избранное'} aria-pressed={faved}>
              <Icon name="heart" size={20} fill={faved} />
            </button>
          )}
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-display font-semibold text-[26px] tnum ${l.price ? '' : 'text-ok'}`}>{priceLabel(l)}</span>
              {l.sold && <span className="rounded-full bg-surface-2 px-2.5 h-6 inline-flex items-center text-[12px] font-semibold text-muted">Продано</span>}
            </div>
            <h2 className="text-[18px] font-semibold leading-snug">{l.title}</h2>
            <p className="text-[13px] text-muted">{l.district} · {ago(l.createdAt, now)} · {l.views} просмотров</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-[14px]">
            <div className="rounded-2xl bg-surface-2 p-3"><dt className="text-[12px] text-muted">Категория</dt><dd className="font-semibold">{l.category}</dd></div>
            <div className="rounded-2xl bg-surface-2 p-3"><dt className="text-[12px] text-muted">Состояние</dt><dd className="font-semibold">{CONDITION_LABEL[l.condition]}</dd></div>
          </dl>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{l.description}</p>

          {mine ? (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => dispatch({ type: 'setListingSold', id: l.id, sold: !l.sold })}>{l.sold ? 'Вернуть в продажу' : 'Отметить «Продано»'}</Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={18} /> Удалить объявление</Button>
            </div>
          ) : (
            <>
              {seller && (
                <button onClick={() => { onClose(); openProfile(seller.id) }} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left cursor-pointer hover:brightness-95">
                  <Avatar name={seller.name} hue={seller.hue} size={44} verified={seller.verified} />
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="block font-semibold">{seller.name} · {seller.district}</span>
                    <ReliabilityBadge person={seller} compact />
                  </span>
                  <Icon name="arrow" size={18} />
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => seller && onContact(seller.id)} disabled={l.sold}><Icon name="chat" size={18} /> Написать</Button>
                <Button variant="secondary" className="whitespace-nowrap" onClick={() => setPhone(true)}>{phone ? <span className="font-mono tnum text-[13px]">{demoPhone}</span> : <><Icon name="eye" size={18} /> Телефон</>}</Button>
              </div>
              {phone && <p className="text-[12px] text-muted -mt-2">Демо: номер скрыт. В рабочей версии здесь будет настоящий телефон продавца.</p>}
              <div className="rounded-2xl bg-warn-soft text-warn p-3 text-[13px] flex gap-2.5">
                <Icon name="shield" size={18} className="shrink-0 mt-0.5" />
                <span>Встречайтесь в людном месте, проверяйте вещь до оплаты и не переводите предоплату незнакомцам. Для встречи можно включить «Я на встрече» в чате.</span>
              </div>
            </>
          )}
        </div>
      </div>
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Удалить объявление?">
        <div className="flex flex-col gap-4">
          <p className="text-muted">«{l.title}» пропадёт из Маркета.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Отмена</Button>
            <Button variant="danger" onClick={() => { dispatch({ type: 'deleteListing', id: l.id }); setConfirmDelete(false); onClose() }}>Удалить</Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

function CreateListing({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [free, setFree] = useState(false)
  const [exchange, setExchange] = useState(false)
  const [category, setCategory] = useState<string>(MARKET_CATEGORIES[0])
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [district, setDistrict] = useState(state.me?.district ?? DISTRICTS[0])
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState('')
  const valid = title.trim().length >= 3 && (free || Number(price) > 0)

  const submit = () => {
    dispatch({
      type: 'addListing',
      listing: {
        title: title.trim(), price: free ? 0 : Number(price), exchange: exchange || undefined, category: free ? 'Бесплатно' : category,
        condition, district, description: description.trim() || 'Без описания — спросите в сообщениях.', photo,
      },
    })
    setTitle(''); setPrice(''); setFree(false); setExchange(false); setDescription(''); setPhoto(undefined)
    onClose(); onCreated()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новое объявление">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (valid) submit() }}>
        <div className="flex gap-3 items-center">
          <label htmlFor="listing-photo" className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-line cursor-pointer hover:border-cobalt">
            <ListingArt listing={{ id: title || 'new', category: free ? 'Бесплатно' : category, photo }} />
            {!photo && <span className="absolute inset-0 grid place-items-center bg-black/20 text-white"><Icon name="camera" size={26} /></span>}
          </label>
          <input id="listing-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { setPhoto(await readPhoto(f)); setPhotoError('') } catch { setPhotoError('Не получилось открыть файл. Выберите JPG или PNG.') }
          }} />
          <div className="text-[13px] text-muted flex flex-col gap-1">
            <span>Фото продаёт лучше всего. Без фото будет иконка категории.</span>
            {photo && <button type="button" onClick={() => setPhoto(undefined)} className="self-start text-danger font-semibold cursor-pointer">Убрать фото</button>}
            {photoError && <span className="text-danger">{photoError}</span>}
          </div>
        </div>
        <Field id="listing-title" label="Что продаёте">
          <input id="listing-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Велосипед городской, 28 дюймов" maxLength={70} required />
        </Field>
        <div className="rounded-2xl bg-surface-2 px-3.5">
          <Toggle id="listing-free" checked={free} onChange={setFree} label="Отдам бесплатно" hint="Цена не нужна, объявление попадёт в «Бесплатно»" />
        </div>
        {!free && (
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <Field id="listing-price" label="Цена, ₽">
              <input id="listing-price" inputMode="numeric" className={`${inputCls} tnum`} value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="3 500" required />
            </Field>
            <label htmlFor="listing-exchange" className="flex items-center gap-2 h-11 text-[14px] cursor-pointer">
              <input id="listing-exchange" type="checkbox" checked={exchange} onChange={(e) => setExchange(e.target.checked)} className="w-5 h-5 accent-[var(--spark)]" /> Обмен
            </label>
          </div>
        )}
        {!free && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">Категория</span>
            <div className="flex flex-wrap gap-2">
              {MARKET_CATEGORIES.filter((c) => c !== 'Бесплатно').map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Состояние</span>
          <div className="flex gap-2">
            <Chip active={condition === 'used'} onClick={() => setCondition('used')}>Б/у</Chip>
            <Chip active={condition === 'new'} onClick={() => setCondition('new')}>Новое</Chip>
          </div>
        </div>
        <Field id="listing-district" label="Где забрать">
          <select id="listing-district" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field id="listing-desc" label="Описание">
          <textarea id="listing-desc" className={`${inputCls} h-24 py-2.5 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} placeholder="Состояние, комплект, почему продаёте" />
        </Field>
        <Button type="submit" disabled={!valid} className="h-12">Опубликовать</Button>
      </form>
    </Sheet>
  )
}
