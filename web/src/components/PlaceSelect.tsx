import { useMemo, useState, type ReactNode } from 'react'
import { PLACE_GROUPS } from '../places'
import { Icon, Sheet, inputCls } from './ui'

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
type Country = 'all' | 'by' | 'ru'

/** Выбор города или района: поиск по названию города и области, Беларусь и Россия. */
export function PlaceSelect({ id, value, onChange, none = true, label = 'Город или район', trigger }: {
  id?: string; value: string; onChange: (v: string) => void; none?: boolean; label?: string
  trigger?: (open: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [country, setCountry] = useState<Country>('all')
  const show = () => { setQ(''); setOpen(true) }
  const pick = (v: string) => { onChange(v); setOpen(false) }

  const groups = useMemo(() => {
    const t = norm(q.trim())
    // Сначала — где слово начинается с запроса («ново» → Новосибирск), если таких нет — где оно встречается внутри.
    const starts = (s: string) => norm(s).split(/[\s,()—-]+/).some((w) => w.startsWith(t))
    const pass = (by: (s: string) => boolean) => base.map((g) => ({ ...g, places: !t || by(g.region) ? g.places : g.places.filter(([n]) => by(n)) })).filter((g) => g.places.length)
    const base = PLACE_GROUPS
      .filter((g) => g.region !== 'Москва, центр') // районы центра Москвы — только для демо
      .filter((g) => country === 'all' || g.country === country)
    const first = pass(starts)
    return first.length || !t ? first : pass((s) => norm(s).includes(t))
  }, [q, country])
  const found = groups.reduce((s, g) => s + g.places.length, 0)

  return (
    <>
      {trigger ? trigger(show) : (
        <button type="button" id={id} onClick={show} aria-label={`${label}: ${value || 'не указан'}`}
          className={`${inputCls} flex items-center justify-between gap-2 text-left cursor-pointer`}>
          <span className={`truncate ${value ? '' : 'text-muted'}`}>{value || 'Не указан — выбрать'}</span>
          <Icon name="search" size={17} className="shrink-0 text-muted" />
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted sticky top-0 z-10">
            <Icon name="search" size={18} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Город, район или область" aria-label="Поиск города"
              className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Очистить" className="cursor-pointer"><Icon name="x" size={16} /></button>}
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-2" role="tablist" aria-label="Страна">
            {([['all', 'Все'], ['by', 'Беларусь'], ['ru', 'Россия']] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={country === k} onClick={() => setCountry(k)}
                className={`h-8 rounded-full text-[13px] font-semibold cursor-pointer ${country === k ? 'bg-surface shadow-soft' : 'text-muted'}`}>{l}</button>
            ))}
          </div>
          {none && !q && (
            <button type="button" onClick={() => pick('')} className={`h-11 px-3 rounded-xl text-left cursor-pointer ${!value ? 'bg-spark/12 font-semibold' : 'hover:bg-surface-2'}`}>Не указывать</button>
          )}
          <div className="flex flex-col gap-3 max-h-[52vh] overflow-y-auto -mx-1 px-1" role="listbox" aria-label="Города">
            {groups.map((g) => (
              <section key={g.region} aria-label={g.region}>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1 px-1">{g.region}</h3>
                <div className="flex flex-col">
                  {g.places.map(([n]) => (
                    <button key={n} type="button" role="option" aria-selected={value === n} onClick={() => pick(n)}
                      className={`h-11 px-3 rounded-xl text-left flex items-center justify-between cursor-pointer ${value === n ? 'bg-spark/12 font-semibold' : 'hover:bg-surface-2'}`}>
                      <span className="truncate">{n}</span>
                      {value === n && <Icon name="check" size={16} className="text-spark shrink-0" />}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            {!found && <p className="py-8 text-center text-muted text-[14px]">Ничего не нашлось. Попробуйте ближайший крупный город или область.</p>}
          </div>
        </div>
      </Sheet>
    </>
  )
}
