import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { DISTRICTS } from '../data'
import { Avatar, Button, Chip, Field, Icon, Sheet, inputCls } from './ui'
import type { Me } from '../types'

const OUT = 480 // сторона итогового фото
const HUES = [12, 28, 45, 95, 150, 190, 215, 250, 280, 320, 345]
const BIO_MAX = 200

/** Кадрирование: квадратная рамка, фото двигается пальцем и приближается ползунком. */
function PhotoCropper({ src, onDone, onCancel }: { src: string; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // сдвиг центра фото от центра рамки, в долях рамки
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])

  // Во сколько раз фото больше рамки по каждой оси при текущем приближении (рамка всегда закрыта целиком).
  const cover = img ? Math.max(1 / img.width, 1 / img.height) : 1
  const w = img ? img.width * cover * zoom : 1
  const h = img ? img.height * cover * zoom : 1
  const clamp = (p: { x: number; y: number }) => ({ x: Math.max(-(w - 1) / 2, Math.min((w - 1) / 2, p.x)), y: Math.max(-(h - 1) / 2, Math.min((h - 1) / 2, p.y)) })
  const at = clamp(pos)

  const start = (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: at.x, py: at.y } }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    const size = box.current?.clientWidth ?? 1
    if (d) setPos(clamp({ x: d.px + (e.clientX - d.x) / size, y: d.py + (e.clientY - d.y) / size }))
  }

  const apply = () => {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    const dw = w * OUT, dh = h * OUT
    ctx.drawImage(img, OUT / 2 - dw / 2 + at.x * OUT, OUT / 2 - dh / 2 + at.y * OUT, dw, dh)
    onDone(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={box} className="relative w-full max-w-[320px] mx-auto aspect-square overflow-hidden rounded-[24px] bg-surface-2 touch-none cursor-grab active:cursor-grabbing select-none"
        onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
        {img && (
          <img src={src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
            style={{ width: `${w * 100}%`, height: `${h * 100}%`, left: `${(0.5 - w / 2 + at.x) * 100}%`, top: `${(0.5 - h / 2 + at.y) * 100}%` }} />
        )}
        {/* Круг показывает, как фото будет выглядеть в аватарке. */}
        <div className="absolute inset-0 pointer-events-none rounded-[24px]" style={{ boxShadow: 'inset 0 0 0 9999px rgb(0 0 0 / .35)', WebkitMaskImage: 'radial-gradient(circle, transparent 49.5%, #000 50%)', maskImage: 'radial-gradient(circle, transparent 49.5%, #000 50%)' }} />
      </div>
      <label htmlFor="crop-zoom" className="flex items-center gap-3 text-muted">
        <Icon name="search" size={18} />
        <input id="crop-zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--spark)]" aria-label="Приближение" />
      </label>
      <p className="text-center text-[13px] text-muted -mt-2">Двигайте фото пальцем, приближайте ползунком</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel}>Отмена</Button>
        <Button onClick={apply} disabled={!img}>Готово</Button>
      </div>
    </div>
  )
}

/** Редактор профиля: фото с кадрированием, имя, возраст, район, «о себе», интересы и цвет. Сохраняется одной кнопкой. */
export function ProfileEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [draft, setDraft] = useState<Me>(me)
  const [age, setAge] = useState(String(me.age))
  const [raw, setRaw] = useState<string | null>(null) // выбранное фото до кадрирования
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // Каждое открытие начинается с текущего профиля: «Отмена» ничего не меняет.
  useEffect(() => { if (open) { setDraft(state.me!); setAge(String(state.me!.age)); setRaw(null); setError('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (p: Partial<Me>) => setDraft((d) => ({ ...d, ...p }))
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Это не фото. Выберите JPG, PNG или HEIC.'); return }
    const r = new FileReader()
    r.onload = () => { setRaw(r.result as string); setError('') }
    r.onerror = () => setError('Не получилось открыть фото.')
    r.readAsDataURL(f)
  }

  const ageNum = Number(age)
  const problem = !draft.name.trim() ? 'Введите имя'
    : !Number.isInteger(ageNum) || ageNum < 18 || ageNum > 99 ? 'Возраст — от 18 до 99'
    : draft.tags.length < 3 ? 'Выберите хотя бы 3 интереса' : ''

  const save = () => {
    if (problem) { setError(problem); return }
    const patch: Partial<Me> = { name: draft.name.trim(), age: ageNum, district: draft.district, bio: draft.bio.trim(), tags: draft.tags, hue: draft.hue, photo: draft.photo }
    dispatch({ type: 'updateMe', patch })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={raw ? 'Кадрирование' : 'Редактировать профиль'}>
      {raw ? (
        <PhotoCropper src={raw} onCancel={() => setRaw(null)} onDone={(photo) => { set({ photo }); setRaw(null) }} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={draft.name || '?'} hue={draft.hue} src={draft.photo} size={112} />
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-2 text-[14px] font-semibold cursor-pointer"><Icon name="upload" size={16} /> {draft.photo ? 'Сменить фото' : 'Добавить фото'}</button>
              <button onClick={() => cameraRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-2 text-[14px] font-semibold cursor-pointer"><Icon name="camera" size={16} /> Снять</button>
              {draft.photo && <button onClick={() => set({ photo: undefined })} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-danger text-[14px] font-semibold cursor-pointer"><Icon name="trash" size={16} /> Удалить</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={pick} aria-label="Выбрать фото" />
            <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" onChange={pick} aria-label="Снять фото" />
            {state.cloud && me.verified && draft.photo !== me.photo && <p className="text-[12px] text-muted text-center">На фото должны быть вы — модератор может попросить пройти верификацию заново.</p>}
          </div>

          {!draft.photo && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">Цвет аватарки</span>
              <div className="flex flex-wrap gap-2">
                {HUES.map((h) => (
                  <button key={h} onClick={() => set({ hue: h })} aria-label={`Цвет ${h}`} aria-pressed={draft.hue === h}
                    className={`w-8 h-8 rounded-full cursor-pointer ${draft.hue === h ? 'ring-2 ring-fg ring-offset-2 ring-offset-surface' : ''}`}
                    style={{ background: `linear-gradient(145deg, hsl(${h} 62% 68%), hsl(${(h + 40) % 360} 52% 50%))` }} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field id="me-name" label="Имя">
              <input id="me-name" className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={30} autoComplete="given-name" />
            </Field>
            <Field id="me-age" label="Возраст">
              <input id="me-age" className={`${inputCls} tnum`} type="number" inputMode="numeric" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
          </div>
          <Field id="me-district" label="Район (другие видят только его)">
            <select id="me-district" className={inputCls} value={draft.district} onChange={(e) => set({ district: e.target.value })}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field id="me-bio" label="О себе">
            <textarea id="me-bio" className={`${inputCls} h-24 py-2 resize-none`} value={draft.bio} onChange={(e) => set({ bio: e.target.value.slice(0, BIO_MAX) })} placeholder="Пара предложений: чем занимаетесь, что любите, с кем хочется встретиться" />
            <span className={`self-end text-[12px] tnum ${draft.bio.length >= BIO_MAX ? 'text-danger' : 'text-muted'}`}>{draft.bio.length}/{BIO_MAX}</span>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">Интересы · {draft.tags.length} {draft.tags.length < 3 && <span className="font-normal">(нужно хотя бы 3)</span>}</span>
            <div className="flex flex-wrap gap-2">
              {state.tags.map((t) => (
                <Chip key={t} active={draft.tags.includes(t)} onClick={() => set({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] })}>{t}</Chip>
              ))}
            </div>
          </div>
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          <div className="grid grid-cols-2 gap-2 sticky bottom-0 bg-surface pt-2">
            <Button variant="secondary" onClick={onClose}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
