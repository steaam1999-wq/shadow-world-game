import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { FILTERS, filterOf, filterStyle, type FilterId } from '../components/storyFilters'
import { slimTrack, usePlayer } from '../music/player'
import { CameraView, type Shot } from '../components/Camera'
import type { Track } from '../music/engine'

// Камера историй Komeeta. Касание кнопки — фото, удержание — видео до 30 секунд.
// Фирменное: кнопка-логотип (два круга сходятся, пока идёт запись), фильтр «Искра»
// и стикер «Позвать» — зритель одним нажатием отвечает «Пойду с тобой!».

const MAX_REC_SEC = 30
const MAX_VIDEO_SEC = 60
const HUES = [330, 12, 30, 150, 200, 230, 260, 290]

/** Полноэкранное создание истории: камера → редактор (фильтры, подпись, стикеры) или текст. */
export function StoryCreator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const player = usePlayer()
  const [stage, setStage] = useState<'camera' | 'text' | 'edit'>('camera')
  const [shot, setShot] = useState<Shot | null>(null)
  const [filter, setFilter] = useState<FilterId>('spark')
  const [caption, setCaption] = useState('')
  const [invite, setInvite] = useState(false)
  const [track, setTrack] = useState<Track | null>(null)
  const [hue, setHue] = useState(330)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) { setStage('camera'); setShot(null); setCaption(''); setInvite(false); setTrack(null); setText(''); setError(''); setFilter('spark') }
  }, [open])

  if (!open) return null

  const trackChoice = player.track && player.track.genre !== 'file' ? player.track : player.library.find((t) => player.likes.includes(t.id) && t.url && (t.source === 'audius' || t.source === 'itunes')) ?? null

  const publish = async () => {
    const id = crypto.randomUUID()
    const now = Date.now()
    const base = { id, authorId: 'me', at: now, expiresAt: now + 24 * 3600_000, hue }
    const sticker = invite || track ? { ...(invite ? { invite: true } : {}), ...(track ? { track: slimTrack(track) } : {}) } : undefined
    if (stage === 'text') {
      if (!text.trim()) return
      dispatch({ type: 'addStory', story: { ...base, kind: 'text', caption: text.trim().slice(0, 300), ...(sticker ? { sticker } : {}) } })
    } else if (shot) {
      // Демо: фото храним прямо в браузере (data URL), чтобы история пережила перезагрузку.
      let url = shot.url
      if (!state.cloud && shot.kind === 'photo') url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(shot.file) })
      dispatch({ type: 'addStory', file: shot.file, story: { ...base, kind: shot.kind, url, caption: caption.trim().slice(0, 300), ...(filter !== 'none' ? { filter } : {}), ...(sticker ? { sticker } : {}), ...(shot.kind === 'video' ? { duration: Math.round(shot.duration * 10) / 10 } : {}) } })
    } else { setError('Нечего публиковать'); return }
    onClose()
  }

  const stickers = (
    <div className="flex gap-2 justify-center flex-wrap">
      <button onClick={() => setInvite((x) => !x)} aria-pressed={invite} className={`h-9 px-3 rounded-full text-[13px] font-semibold backdrop-blur cursor-pointer ${invite ? 'bg-brand text-white' : 'bg-white/20 text-white'}`}>🙋 Позвать</button>
      <button onClick={() => setTrack((t) => (t ? null : trackChoice))} disabled={!trackChoice} aria-pressed={!!track} title={trackChoice ? '' : 'Включите песню или добавьте её в «Любимые»'}
        className={`h-9 px-3 rounded-full text-[13px] font-semibold backdrop-blur cursor-pointer disabled:opacity-40 ${track ? 'bg-brand text-white' : 'bg-white/20 text-white'}`}>🎵 {track ? track.title.slice(0, 18) : 'Трек'}</button>
    </div>
  )
  const stickerPreview = (invite || track) && (
    <div className="absolute left-1/2 -translate-x-1/2 top-[42%] flex flex-col items-center gap-2 pointer-events-none">
      {invite && <span className="whitespace-nowrap rounded-2xl bg-white text-[#14152a] px-4 py-2 font-display font-bold shadow-soft rotate-[-3deg]">🙋 Пойдём со мной?</span>}
      {track && <span className="rounded-full bg-black/45 backdrop-blur px-3 py-1.5 text-[13px] text-white">🎵 {track.title} · {track.artist}</span>}
    </div>
  )
  const modes = (
    <div className="flex justify-center gap-6 text-[14px] font-semibold" role="tablist" aria-label="Режим">
      {([['camera', 'Камера'], ['text', 'Текст']] as const).map(([m, label]) => (
        <button key={m} role="tab" aria-selected={stage === m} onClick={() => setStage(m)} className={`cursor-pointer ${stage === m ? 'text-white' : 'text-white/55'}`}>{label}</button>
      ))}
    </div>
  )
  const f = filterOf(filter)

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black text-white flex justify-center" role="dialog" aria-modal="true" aria-label="Новая история">
      <div className="relative w-full max-w-[480px] h-full overflow-hidden">
        {stage === 'camera' && (
          <CameraView filter={filter} onFilter={setFilter} onClose={onClose} maxRecSec={MAX_REC_SEC} maxVideoSec={MAX_VIDEO_SEC} footer={modes}
            onShot={(sh, fromGallery) => { setShot(sh); if (fromGallery) setFilter('none'); setStage('edit') }} />
        )}
        {stage === 'edit' && shot && (
          <>
            {shot.kind === 'photo'
              ? <img src={shot.url} alt="Снимок" className="absolute inset-0 w-full h-full object-cover" style={filterStyle(filter)} />
              : <video src={shot.url} className="absolute inset-0 w-full h-full object-cover" style={{ transform: shot.mirrored ? 'scaleX(-1)' : undefined, ...filterStyle(filter) }} autoPlay loop playsInline />}
            {f.overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: f.overlay }} />}
            {stickerPreview}
          </>
        )}
        {stage === 'text' && (
          <div className="absolute inset-0 grid place-items-center p-8" style={{ background: `linear-gradient(160deg, hsl(${hue} 80% 55%), hsl(${(hue + 50) % 360} 75% 38%))` }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={5} autoFocus placeholder="Куда зовёте, что делаете, настроение…" aria-label="Текст истории"
              className="w-full bg-transparent text-center font-display font-bold text-[28px] leading-tight placeholder:text-white/60 resize-none focus:outline-none" />
            {stickerPreview}
          </div>
        )}

        {stage !== 'camera' && (
          <>
            <div className="absolute inset-x-0 top-0 pt-[calc(10px+env(safe-area-inset-top,0px))] px-3 flex items-center gap-2 bg-gradient-to-b from-black/40 to-transparent pb-6">
              <button onClick={() => (stage === 'edit' ? setStage('camera') : onClose())} className="grid place-items-center w-10 h-10 rounded-full bg-black/30 cursor-pointer" aria-label={stage === 'edit' ? 'Переснять' : 'Закрыть'}><Icon name={stage === 'edit' ? 'back' : 'x'} size={22} /></button>
            </div>
            <div className="absolute inset-x-0 bottom-0 pb-[calc(14px+env(safe-area-inset-bottom,0px))] px-3 flex flex-col gap-3 bg-gradient-to-t from-black/60 to-transparent pt-10">
              {stage === 'edit' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-1" role="radiogroup" aria-label="Фильтр">
                  {FILTERS.map((x) => (
                    <button key={x.id} role="radio" aria-checked={filter === x.id} onClick={() => setFilter(x.id)}
                      className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${filter === x.id ? 'bg-white text-[#14152a]' : 'bg-black/35 text-white'}`}>{x.id === 'spark' ? '✦ ' : ''}{x.name}</button>
                  ))}
                </div>
              )}
              {stage === 'edit' && (
                <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder="Подпись (необязательно)" aria-label="Подпись к истории"
                  className="h-11 rounded-full bg-black/35 backdrop-blur px-4 text-white placeholder:text-white/70 focus:outline-none" />
              )}
              {stage === 'text' && (
                <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Цвет фона">
                  {HUES.map((h) => (
                    <button key={h} role="radio" aria-checked={hue === h} aria-label={`Фон ${h}`} onClick={() => setHue(h)}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${hue === h ? 'border-white' : 'border-white/30'}`}
                      style={{ background: `linear-gradient(160deg, hsl(${h} 80% 55%), hsl(${(h + 50) % 360} 75% 38%))` }} />
                  ))}
                </div>
              )}
              {stickers}
              {error && <p className="text-center text-[13px]" role="alert">{error}</p>}
              <button onClick={() => void publish()} disabled={stage === 'text' ? !text.trim() : !shot}
                className="h-12 rounded-full bg-brand text-white font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"><Icon name="send" size={18} /> Опубликовать на 24 часа</button>
              {stage === 'text' && modes}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
