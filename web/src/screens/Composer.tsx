import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { CameraView, type Shot } from '../components/Camera'
import { FILTERS, filterOf, filterStyle, type FilterId } from '../components/storyFilters'
import { humanError, uploadShort } from '../cloud/api'
import { requestReload } from '../cloud/sync'
import { slimTrack, usePlayer } from '../music/player'
import { idbRun, reloadDemoPublications, videoFrame, type StoredShort } from './Shorts'
import type { Track } from '../music/engine'

// Новая публикация в три шага, как в современных соцсетях:
// 1) камера Komeeta или галерея, 2) кадр и фильтр, 3) подпись, хештеги, место, песня и «также в историю».

const MAX_SEC = 60
const MAX_MB = 50
const CAPTION_MAX = 200

type Aspect = 'orig' | '4:5' | '1:1' | '9:16'
const ASPECTS: { id: Aspect; label: string; ratio?: number }[] = [
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: 'orig', label: 'Оригинал' },
]

/** Обрезка фото по центру под выбранный формат. */
function cropPhoto(blob: Blob, ratio: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const w = img.width, h = img.height
      let cw = w, ch = Math.round(w / ratio)
      if (ch > h) { ch = h; cw = Math.round(h * ratio) }
      const c = document.createElement('canvas')
      c.width = cw; c.height = ch
      c.getContext('2d')!.drawImage(img, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('crop'))), 'image/jpeg', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('crop')) }
    img.src = url
  })
}

export function NewPublication({ open, kind, onClose, onDone }: { open: boolean; kind?: 'video' | 'photo'; onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useStore()
  const player = usePlayer()
  const [stage, setStage] = useState<'camera' | 'edit' | 'details'>('camera')
  const [shot, setShot] = useState<Shot | null>(null)
  const [filter, setFilter] = useState<FilterId>('spark')
  const [aspect, setAspect] = useState<Aspect>('4:5')
  const [caption, setCaption] = useState('')
  const [place, setPlace] = useState<string | null>(null)
  const [music, setMusic] = useState<Track | null>(null)
  const [alsoStory, setAlsoStory] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const videoOnly = kind === 'video'

  useEffect(() => {
    if (open) return
    setStage('camera'); setShot(null); setFilter('spark'); setAspect('4:5'); setCaption(''); setPlace(null); setMusic(null); setAlsoStory(false); setBusy(false); setError('')
  }, [open])

  if (!open) return null
  const me = state.me
  const f = filterOf(filter)
  const ratio = shot?.kind === 'photo' ? ASPECTS.find((a) => a.id === aspect)?.ratio : undefined
  const trackChoice = player.track && player.track.genre !== 'file' ? player.track : player.library.find((t) => player.likes.includes(t.id) && t.url && (t.source === 'audius' || t.source === 'itunes')) ?? null
  // Подсказки хештегов: мои интересы, потом популярные в приложении.
  const tags = [...new Set([...(me?.tags ?? []), ...(state.tags ?? [])])].slice(0, 10).map((t) => `#${t.toLowerCase().replace(/\s+/g, '')}`)
  const addTag = (t: string) => setCaption((c) => (c.includes(t) ? c : `${c}${c && !c.endsWith(' ') ? ' ' : ''}${t} `).slice(0, CAPTION_MAX))
  const title = videoOnly ? 'Новый шортс' : 'Новая публикация'

  const media = (cls: string) => shot && (
    <>
      {shot.kind === 'photo'
        ? <img src={shot.url} alt="Предпросмотр" className={cls} style={filterStyle(filter)} />
        : <video src={shot.url} className={cls} style={{ transform: shot.mirrored ? 'scaleX(-1)' : undefined, ...filterStyle(filter) }} autoPlay loop muted playsInline />}
      {f.overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: f.overlay }} />}
    </>
  )

  const publish = async () => {
    if (!shot) return
    setBusy(true); setError('')
    try {
      const file = shot.kind === 'photo' && ratio ? await cropPhoto(shot.file, ratio) : shot.file
      const extra = { ...(filter !== 'none' ? { filter } : {}), ...(music ? { music: slimTrack(music) } : {}), ...(place ? { place } : {}) }
      const thumb = shot.kind === 'video' ? await videoFrame(shot.url) : null
      const text = caption.trim().slice(0, CAPTION_MAX)
      if (state.cloud) {
        await uploadShort(state.cloud.userId, file, text, Math.round(shot.duration * 10) / 10, shot.kind, thumb, extra)
        requestReload()
      } else {
        await idbRun('readwrite', (s) => s.put({ id: crypto.randomUUID(), caption: text, at: Date.now(), blob: file, kind: shot.kind, thumb, ...extra } satisfies StoredShort))
        await reloadDemoPublications()
      }
      if (alsoStory) {
        const now = Date.now()
        let url = URL.createObjectURL(file)
        if (!state.cloud && shot.kind === 'photo') url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file) })
        dispatch({ type: 'addStory', file, story: { id: crypto.randomUUID(), authorId: 'me', kind: shot.kind, url, caption: text, hue: me?.hue ?? 330, at: now, expiresAt: now + 24 * 3600_000, ...(filter !== 'none' ? { filter } : {}), ...(music ? { sticker: { track: slimTrack(music) } } : {}), ...(shot.kind === 'video' ? { duration: Math.round(shot.duration * 10) / 10 } : {}) } })
      }
      onDone()
    } catch (e) {
      const m = (e as { message?: string })?.message ?? ''
      setError(/exceeded|too large|413/i.test(m) ? `Файл больше ${MAX_MB} МБ.` : /mime|type/i.test(m) ? 'Этот формат не подходит. Нужно фото (JPG, PNG) или видео (MP4, MOV).' : humanError(e))
      setBusy(false)
    }
  }

  const chip = (on: boolean, label: string, onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled} aria-pressed={on} className={`h-9 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer disabled:opacity-40 ${on ? 'bg-brand text-white' : 'bg-surface-2 text-fg'}`}>{label}</button>
  )

  return createPortal(
    <div className={`fixed inset-0 z-[80] flex justify-center ${stage === 'details' ? 'bg-bg text-fg' : 'bg-black text-white'}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative w-full max-w-[480px] h-full overflow-hidden">
        {stage === 'camera' && (
          <CameraView filter={filter} onFilter={setFilter} onClose={() => { if (!busy) onClose() }} videoOnly={videoOnly} maxRecSec={MAX_SEC} maxVideoSec={MAX_SEC}
            onShot={(s, fromGallery) => { setShot(s); if (fromGallery) setFilter('none'); setAspect(s.kind === 'video' ? 'orig' : '4:5'); setStage('edit') }}
            footer={<p className="text-center text-[12px] font-semibold">{title}</p>} />
        )}

        {stage === 'edit' && shot && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-2">
              <button onClick={() => setStage('camera')} className="grid place-items-center w-10 h-10 rounded-full bg-white/10 cursor-pointer" aria-label="Переснять"><Icon name="back" size={22} /></button>
              <span className="flex-1 text-center font-semibold">Редактор</span>
              <button onClick={() => setStage('details')} className="h-10 px-4 rounded-full bg-brand text-white font-semibold cursor-pointer">Далее</button>
            </div>
            <div className="flex-1 min-h-0 grid place-items-center px-3">
              <div className="relative w-full max-h-full overflow-hidden rounded-2xl bg-black" style={ratio ? { aspectRatio: String(ratio), maxHeight: '100%', width: ratio >= 0.8 ? '100%' : 'auto', height: ratio < 0.8 ? '100%' : 'auto' } : { height: '100%' }}>
                {media(`absolute inset-0 w-full h-full ${ratio ? 'object-cover' : 'object-contain'}`)}
                {shot.kind === 'video' && <span className="absolute left-2 bottom-2 rounded-full bg-black/55 text-white text-[12px] px-2 py-0.5 tnum">{Math.round(shot.duration)} с</span>}
              </div>
            </div>
            <div className="flex flex-col gap-3 px-3 pt-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
              {shot.kind === 'photo' && (
                <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Формат кадра">
                  {ASPECTS.map((a) => (
                    <button key={a.id} role="radio" aria-checked={aspect === a.id} onClick={() => setAspect(a.id)}
                      className={`h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${aspect === a.id ? 'bg-white text-[#14152a]' : 'bg-white/12 text-white'}`}>{a.label}</button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="Фильтр">
                {FILTERS.map((x) => (
                  <button key={x.id} role="radio" aria-checked={filter === x.id} onClick={() => setFilter(x.id)} className="shrink-0 flex flex-col items-center gap-1 cursor-pointer">
                    <span className={`relative block w-16 h-16 rounded-xl overflow-hidden ${filter === x.id ? 'ring-2 ring-white' : 'opacity-80'}`}>
                      {shot.kind === 'photo'
                        ? <img src={shot.url} alt="" className="w-full h-full object-cover" style={filterStyle(x.id)} />
                        : <span className="block w-full h-full bg-gradient-to-br from-[#ffc457] via-[#ff4f86] to-[#9a74ff]" style={filterStyle(x.id)} />}
                      {x.overlay && <span className="absolute inset-0 mix-blend-soft-light" style={{ background: x.overlay }} />}
                    </span>
                    <span className={`text-[11px] ${filter === x.id ? 'font-semibold' : 'opacity-75'}`}>{x.id === 'spark' ? '✦ ' : ''}{x.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {stage === 'details' && shot && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-2 border-b border-line">
              <button onClick={() => setStage('edit')} disabled={busy} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад к редактору"><Icon name="back" size={22} /></button>
              <span className="flex-1 text-center font-semibold">{title}</span>
              <span className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="relative w-20 shrink-0 self-start rounded-xl overflow-hidden bg-black" style={{ aspectRatio: String(ratio ?? (shot.kind === 'video' ? 9 / 16 : 4 / 5)) }}>
                  {media('absolute inset-0 w-full h-full object-cover')}
                </div>
                <div className="flex-1 flex flex-col">
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))} rows={4} maxLength={CAPTION_MAX} autoFocus
                    placeholder="Расскажите, что происходит. Можно позвать людей с собой…" aria-label="Подпись к публикации"
                    className="flex-1 bg-transparent resize-none focus:outline-none text-[15px]" />
                  <span className={`self-end text-[12px] tnum ${caption.length > CAPTION_MAX - 20 ? 'text-warn' : 'text-muted'}`}>{caption.length}/{CAPTION_MAX}</span>
                </div>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-muted uppercase tracking-wide">Хештеги</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => <button key={t} onClick={() => addTag(t)} className={`h-8 px-3 rounded-full text-[13px] cursor-pointer ${caption.includes(t) ? 'bg-cobalt text-white' : 'bg-surface-2 text-cobalt'}`}>{t}</button>)}
                  </div>
                </div>
              )}
              <div className="rounded-2xl bg-surface shadow-soft divide-y divide-line">
                <div className="flex items-center gap-3 p-3.5">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-surface-2"><Icon name="pin" size={18} /></span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-[14px]">Место</span><span className="block text-[12px] text-muted truncate">{place ?? 'Не указано'}</span></span>
                  {chip(!!place, place ? 'Убрать' : (me?.district ? me.district.split(',')[0] : 'Минск'), () => setPlace(place ? null : (me?.district || 'Минск')))}
                </div>
                <div className="flex items-center gap-3 p-3.5">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-surface-2"><Icon name="note" size={18} /></span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-[14px]">Песня</span><span className="block text-[12px] text-muted truncate">{music ? `${music.title} · ${music.artist}` : trackChoice ? 'Добавить то, что слушаете' : 'Включите песню или добавьте в «Любимые»'}</span></span>
                  {chip(!!music, music ? 'Убрать' : 'Добавить', () => setMusic(music ? null : trackChoice), !music && !trackChoice)}
                </div>
                <div className="flex items-center gap-3 p-3.5">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-brand text-white"><Icon name="plus" size={18} /></span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-[14px]">Также в историю</span><span className="block text-[12px] text-muted">Кружок сверху главной на 24 часа</span></span>
                  {chip(alsoStory, alsoStory ? 'Да' : 'Нет', () => setAlsoStory((x) => !x))}
                </div>
              </div>
              {!state.cloud && <p className="text-[12px] text-muted">Демо-режим: публикация сохранится только в этом браузере.</p>}
              {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
            </div>
            <div className="px-4 pt-2 pb-[calc(14px+env(safe-area-inset-bottom,0px))] border-t border-line">
              <button onClick={() => void publish()} disabled={busy} className="w-full h-12 rounded-full bg-brand text-white font-semibold cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Загружаем…</> : <><Icon name="send" size={18} /> Опубликовать</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
