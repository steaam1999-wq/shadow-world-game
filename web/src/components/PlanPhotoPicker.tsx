import { useState } from 'react'
import { Icon } from './ui'
import { PostArt } from './PostArt'
import { planPhotoUrl, planPhotosOf, loadPlanPhoto } from '../planPhotos'
import { readPhotoFull } from './ui'

/** Фото плана: готовые реалистичные кадры по выбранной категории и «своё фото». Выбор — одним касанием. */
export function PlanPhotoPicker({ category, title, photo, stockId, onChange }: {
  category: string; title: string; photo?: string; stockId?: string
  onChange: (photo: string | undefined, stockId?: string) => void
}) {
  const ids = planPhotosOf(category)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const own = !!photo && !stockId

  const pick = async (id: string) => {
    if (stockId === id) { onChange(undefined); return }
    setBusy(id); setError('')
    try { onChange(await loadPlanPhoto(id), id) } catch { setError('Не получилось загрузить фото. Попробуйте ещё раз.') } finally { setBusy(null) }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-muted">Фото к плану</span>
        {photo && <button type="button" onClick={() => onChange(undefined)} className="text-[12.5px] text-danger font-semibold cursor-pointer">Убрать</button>}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-0.5" role="radiogroup" aria-label="Фото к плану">
        {/* Своё фото */}
        <label htmlFor="act-photo" className={`relative shrink-0 w-[72px] h-[90px] rounded-2xl overflow-hidden grid place-items-center cursor-pointer text-muted border-2 ${own ? 'border-cobalt' : 'border-dashed border-line hover:border-cobalt'}`}>
          {own ? <img src={photo} alt="Своё фото" className="w-full h-full object-cover" /> : (
            <span className="flex flex-col items-center gap-1 text-[11px] leading-tight text-center px-1"><Icon name="camera" size={22} />Своё фото</span>
          )}
        </label>
        <input id="act-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try { onChange(await readPhotoFull(f, 1440)); setError('') } catch { setError('Не получилось открыть файл. Выберите JPG или PNG.') }
        }} />
        {ids.map((id) => {
          const on = stockId === id
          return (
            <button key={id} type="button" role="radio" aria-checked={on} aria-label={`Фото: ${category}`} onClick={() => void pick(id)}
              className={`relative shrink-0 w-[72px] h-[90px] rounded-2xl overflow-hidden cursor-pointer bg-surface-2 border-2 transition ${on ? 'border-cobalt' : 'border-transparent'}`}>
              <img src={planPhotoUrl(id, true)} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              {busy === id && <span className="absolute inset-0 grid place-items-center bg-black/35 text-white text-[11px]">…</span>}
              {on && <span className="absolute right-1 top-1 grid place-items-center w-5 h-5 rounded-full bg-cobalt text-white"><Icon name="check" size={12} /></span>}
            </button>
          )
        })}
        {!ids.length && !photo && (
          <span className="relative shrink-0 w-[72px] h-[90px] rounded-2xl overflow-hidden opacity-70" aria-hidden="true"><PostArt activity={{ id: title || 'new', category, photo: undefined }} /></span>
        )}
      </div>
      <p className="text-[12px] text-muted">{ids.length ? 'Выберите готовое фото или загрузите своё. Без фото будет обложка категории.' : 'Загрузите своё фото. Без него будет обложка категории.'}</p>
      {error && <span className="text-[12.5px] text-danger">{error}</span>}
    </div>
  )
}
