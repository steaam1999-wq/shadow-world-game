import { useEffect, useRef, useState } from 'react'
import { BirthDateField, birthProblem } from './BirthDate'
import { ageFrom, formatBirth, parseBirth } from '../lib'
import { PlaceOptions } from '../places'
import { useStore } from '../store'
import { Avatar, Button, Chip, Field, Icon, Sheet, inputCls } from './ui'
import type { Me } from '../types'

const HUES = [12, 28, 45, 95, 150, 190, 215, 250, 280, 320, 345]
const BIO_MAX = 200

/** Кадрирование: двигайте пальцем, приближайте двумя пальцами, колёсиком или ползунком, поворачивайте на 90°. */
function PhotoCropper({ src, onDone, onCancel }: { src: string; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0) // 0, 90, 180, 270
  const [pos, setPos] = useState({ x: 0, y: 0 }) // сдвиг центра фото от центра рамки, в долях рамки
  const [dragging, setDragging] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ x: number; y: number; px: number; py: number; dist: number; zoom: number } | null>(null)
  const lastTap = useRef(0)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])

  // Размер фото относительно рамки (рамка всегда закрыта целиком); при повороте на 90° стороны меняются местами.
  const turned = rot % 180 !== 0
  const iw = img?.width ?? 1, ih = img?.height ?? 1
  const cover = Math.max(1 / (turned ? ih : iw), 1 / (turned ? iw : ih))
  const W = (turned ? ih : iw) * cover * zoom, H = (turned ? iw : ih) * cover * zoom
  const clampPos = (p: { x: number; y: number }, w = W, h = H) => ({ x: Math.max(-(w - 1) / 2, Math.min((w - 1) / 2, p.x)), y: Math.max(-(h - 1) / 2, Math.min((h - 1) / 2, p.y)) })
  const at = clampPos(pos)
  const setZoomClamped = (z: number) => setZoom(Math.max(1, Math.min(4, z)))

  const center = () => { const pts = [...pointers.current.values()]; return { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length } }
  const spread = () => { const [a, b] = [...pointers.current.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0 }
  const begin = () => { const c = center(); gesture.current = { x: c.x, y: c.y, px: at.x, py: at.y, dist: spread(), zoom } }

  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setDragging(true)
    begin()
    // Двойное касание — приблизить вдвое или вернуть как было.
    const t = Date.now()
    if (pointers.current.size === 1 && t - lastTap.current < 300) { setZoomClamped(zoom > 1.5 ? 1 : 2); if (zoom > 1.5) setPos({ x: 0, y: 0 }) }
    lastTap.current = t
  }
  const move = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    const size = box.current?.clientWidth ?? 1
    if (!g) return
    const c = center()
    if (pointers.current.size >= 2 && g.dist > 0) setZoomClamped(g.zoom * (spread() / g.dist))
    setPos(clampPos({ x: g.px + (c.x - g.x) / size, y: g.py + (c.y - g.y) / size }))
  }
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size) begin(); else { gesture.current = null; setDragging(false); setPos(at) }
  }

  const apply = () => {
    if (!img) return
    const OUT = 720
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.translate(OUT * (0.5 + at.x), OUT * (0.5 + at.y))
    ctx.rotate((rot * Math.PI) / 180)
    const dw = iw * cover * zoom * OUT, dh = ih * cover * zoom * OUT
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
    onDone(canvas.toDataURL('image/jpeg', 0.9))
  }

  const tool = 'grid place-items-center w-11 h-11 rounded-full bg-surface-2 cursor-pointer hover:brightness-95 disabled:opacity-40'
  return (
    <div className="flex flex-col gap-4">
      <div ref={box} className="relative w-full max-w-[340px] mx-auto aspect-square overflow-hidden rounded-[24px] bg-black touch-none cursor-grab active:cursor-grabbing select-none"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onWheel={(e) => setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}>
        {img && (
          <img src={src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
            style={{ width: `${iw * cover * zoom * 100}%`, height: `${ih * cover * zoom * 100}%`, left: `${(0.5 + at.x) * 100}%`, top: `${(0.5 + at.y) * 100}%`, transform: `translate(-50%, -50%) rotate(${rot}deg)` }} />
        )}
        {/* Круг — как фото будет выглядеть в аватарке; сетка помогает выровнять, пока двигаете. */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 49.5%, rgb(0 0 0 / .45) 50%)' }} />
        <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/80" />
        {dragging && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => <span key={i} className="border border-white/25" />)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={tool} onClick={() => setZoomClamped(zoom / 1.25)} disabled={zoom <= 1} aria-label="Отдалить"><span className="text-xl leading-none">−</span></button>
        <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} className="flex-1 accent-[var(--spark)]" aria-label="Приближение" />
        <button type="button" className={tool} onClick={() => setZoomClamped(zoom * 1.25)} disabled={zoom >= 4} aria-label="Приблизить"><span className="text-xl leading-none">+</span></button>
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-2 text-[14px] font-semibold cursor-pointer" onClick={() => { setRot((r) => (r + 90) % 360); setPos({ x: 0, y: 0 }) }}><Icon name="repeat" size={16} /> Повернуть</button>
        <button type="button" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-2 text-[14px] font-semibold cursor-pointer" onClick={() => { setZoom(1); setRot(0); setPos({ x: 0, y: 0 }) }}>Сбросить</button>
      </div>
      <p className="text-center text-[13px] text-muted -mt-2">Двигайте фото пальцем, приближайте двумя пальцами. Двойное касание — приблизить.</p>
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
  const [birth, setBirth] = useState(formatBirth(me.birthDate))
  const [raw, setRaw] = useState<string | null>(null) // выбранное фото до кадрирования
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // Каждое открытие начинается с текущего профиля: «Отмена» ничего не меняет.
  useEffect(() => { if (open) { setDraft(state.me!); setBirth(formatBirth(state.me!.birthDate)); setRaw(null); setError('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const problem = !draft.name.trim() ? 'Введите имя' : birthProblem(birth) ?? ''
  const birthIso = parseBirth(birth)

  const save = () => {
    if (problem) { setError(problem); return }
    const patch: Partial<Me> = { name: draft.name.trim(), age: birthIso ? ageFrom(birthIso) : null, birthDate: birthIso ?? undefined, district: draft.district, bio: draft.bio.trim(), tags: draft.tags, hue: draft.hue, photo: draft.photo }
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

          <Field id="me-name" label="Имя">
            <input id="me-name" className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={30} autoComplete="given-name" />
          </Field>
          <BirthDateField id="me-birth" value={birth} onChange={setBirth} />
          <Field id="me-district" label="Город или район (другие видят только его)">
            <select id="me-district" className={inputCls} value={draft.district} onChange={(e) => set({ district: e.target.value })}>
              <PlaceOptions />
            </select>
          </Field>
          <Field id="me-bio" label="О себе">
            <textarea id="me-bio" className={`${inputCls} h-24 py-2 resize-none`} value={draft.bio} onChange={(e) => set({ bio: e.target.value.slice(0, BIO_MAX) })} placeholder="Пара предложений: чем занимаетесь, что любите, с кем хочется встретиться" />
            <span className={`self-end text-[12px] tnum ${draft.bio.length >= BIO_MAX ? 'text-danger' : 'text-muted'}`}>{draft.bio.length}/{BIO_MAX}</span>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">Интересы{draft.tags.length ? ` · ${draft.tags.length}` : ''} <span className="font-normal">(необязательно)</span></span>
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
