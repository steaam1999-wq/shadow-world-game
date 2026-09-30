import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { Icon } from '../components/ui'
import { FILTERS, filterOf, filterStyle, type FilterId } from '../components/storyFilters'
import { slimTrack, usePlayer } from '../music/player'
import { compressPhoto, readVideoDuration } from './Shorts'
import type { Track } from '../music/engine'

// Камера историй Match. Касание кнопки — фото, удержание — видео до 30 секунд.
// Фирменное: кнопка-логотип (два круга сходятся, пока идёт запись), фильтр «Искра»
// и стикер «Позвать» — зритель одним нажатием отвечает «Пойду с тобой!».

const MAX_REC_SEC = 30
const MAX_VIDEO_SEC = 60
const MAX_MB = 50
const HUES = [330, 12, 30, 150, 200, 230, 260, 290]

type Shot = { file: Blob; kind: 'photo' | 'video'; url: string; duration: number; mirrored: boolean }

function recorderType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const t of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) if (MediaRecorder.isTypeSupported(t)) return t
  return ''
}

/** Кнопка съёмки в виде знака Match: круги расходятся, при записи — сходятся, по краю — прогресс. */
function Shutter({ recording, progress }: { recording: boolean; progress: number }) {
  const r = 38, c = 2 * Math.PI * r
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
      <circle cx="46" cy="46" r={r} fill="rgb(255 255 255 / .18)" stroke="rgb(255 255 255 / .9)" strokeWidth="4" />
      {recording && <circle cx="46" cy="46" r={r} fill="none" stroke="#ff4f86" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 46 46)" />}
      <g style={{ transition: 'transform .35s cubic-bezier(.2,.8,.2,1)' }}>
        <circle cx={recording ? 43 : 38} cy="46" r="13" fill="none" stroke="#fff" strokeWidth="4" style={{ transition: 'cx .35s' }} />
        <circle cx={recording ? 49 : 54} cy="46" r="13" fill="none" stroke="#fff" strokeWidth="4" style={{ transition: 'cx .35s' }} />
      </g>
    </svg>
  )
}

/** Полноэкранное создание истории: камера → редактор (фильтры, подпись, стикеры) или текст. */
export function StoryCreator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const player = usePlayer()
  const [stage, setStage] = useState<'camera' | 'text' | 'edit'>('camera')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [camError, setCamError] = useState('')
  const [torch, setTorch] = useState(false)
  const [torchOk, setTorchOk] = useState(false)
  const [flashFront, setFlashFront] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recMs, setRecMs] = useState(0)
  const [shot, setShot] = useState<Shot | null>(null)
  const [filter, setFilter] = useState<FilterId>('spark')
  const [caption, setCaption] = useState('')
  const [invite, setInvite] = useState(false)
  const [track, setTrack] = useState<Track | null>(null)
  const [hue, setHue] = useState(330)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const rec = useRef<{ r: MediaRecorder; chunks: Blob[]; started: number; timer: ReturnType<typeof setInterval> } | null>(null)
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressed = useRef(false)
  const gallery = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setTorch(false); setTorchOk(false)
  }, [])

  const startCamera = useCallback(async (face: 'user' | 'environment') => {
    stopCamera()
    setCamError('')
    if (!navigator.mediaDevices?.getUserMedia) { setCamError('Этот браузер не даёт доступ к камере. Выберите фото или видео из галереи.'); return }
    try {
      const constraints = { video: { facingMode: face, width: { ideal: 1080 }, height: { ideal: 1920 } } }
      const s = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: true }).catch(() => navigator.mediaDevices.getUserMedia(constraints))
      stream.current = s
      const v = video.current
      if (v) { v.srcObject = s; v.muted = true; await v.play().catch(() => {}) }
      const caps = (s.getVideoTracks()[0]?.getCapabilities?.() ?? {}) as { torch?: boolean }
      setTorchOk(!!caps.torch)
    } catch (e) {
      const name = (e as { name?: string }).name
      setCamError(name === 'NotAllowedError' ? 'Нет доступа к камере. Разрешите его в настройках браузера или выберите файл из галереи.' : 'Камера недоступна. Выберите фото или видео из галереи.')
    }
  }, [stopCamera])

  // Открыли — включаем камеру; закрыли — всё сбрасываем.
  useEffect(() => {
    if (!open) {
      stopCamera(); setStage('camera'); setShot(null); setCaption(''); setInvite(false); setTrack(null); setText(''); setError(''); setFilter('spark')
      return
    }
    if (stage === 'camera') void startCamera(facing)
    else stopCamera()
    return () => { if (stage === 'camera') stopCamera() }
  }, [open, stage, facing, startCamera, stopCamera])

  useEffect(() => {
    const t = stream.current?.getVideoTracks()[0]
    if (t && torchOk) void t.applyConstraints({ advanced: [{ torch } as MediaTrackConstraintSet] }).catch(() => {})
  }, [torch, torchOk])

  if (!open) return null
  const mirrored = facing === 'user'

  const takePhoto = async () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    // Фронтальная «вспышка»: экран на мгновение становится белым.
    if (mirrored && flashFront) { setFlashing(true); await new Promise((r) => setTimeout(r, 180)) }
    const k = Math.min(1, 1920 / Math.max(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k)
    const ctx = c.getContext('2d')!
    if (mirrored) { ctx.translate(c.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(v, 0, 0, c.width, c.height)
    setFlashing(false)
    c.toBlob((b) => {
      if (!b) return
      setShot({ file: b, kind: 'photo', url: URL.createObjectURL(b), duration: 0, mirrored: false })
      setStage('edit')
    }, 'image/jpeg', 0.88)
  }

  const startRec = () => {
    const s = stream.current
    const type = recorderType()
    if (!s || type === null) { setCamError('Запись видео в этом браузере недоступна — снимите фото или выберите видео из галереи.'); return }
    const r = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s)
    const chunks: Blob[] = []
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    r.onstop = () => {
      const started = rec.current?.started ?? Date.now()
      if (rec.current) clearInterval(rec.current.timer)
      rec.current = null
      setRecording(false); setRecMs(0)
      // Тип без параметров кодека — так файл примет хранилище.
      const base = (r.mimeType || type || 'video/webm').split(';')[0]
      const blob = new Blob(chunks, { type: base })
      if (!blob.size) return
      setShot({ file: blob, kind: 'video', url: URL.createObjectURL(blob), duration: (Date.now() - started) / 1000, mirrored })
      setStage('edit')
    }
    r.start(250)
    const started = Date.now()
    const timer = setInterval(() => {
      const ms = Date.now() - started
      setRecMs(ms)
      if (ms >= MAX_REC_SEC * 1000) stopRec()
    }, 100)
    rec.current = { r, chunks, started, timer }
    setRecording(true)
  }
  const stopRec = () => { const cur = rec.current; if (cur && cur.r.state !== 'inactive') cur.r.stop() }

  const down = () => {
    pressed.current = true
    hold.current = setTimeout(() => { if (pressed.current) startRec() }, 280)
  }
  const up = () => {
    pressed.current = false
    if (hold.current) clearTimeout(hold.current)
    if (rec.current) stopRec(); else void takePhoto()
  }

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) {
      try { const b = await compressPhoto(f); setShot({ file: b, kind: 'photo', url: URL.createObjectURL(b), duration: 0, mirrored: false }); setFilter('none'); setStage('edit') }
      catch { setCamError('Не получилось открыть фото. Выберите JPG или PNG.') }
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) { setCamError(`Видео больше ${MAX_MB} МБ.`); return }
    const url = URL.createObjectURL(f)
    const d = await readVideoDuration(url)
    if (d < 0) { URL.revokeObjectURL(url); setCamError('Браузер не может открыть это видео. Попробуйте MP4.'); return }
    if (d > MAX_VIDEO_SEC + 0.5) { URL.revokeObjectURL(url); setCamError(`Видео длиннее ${MAX_VIDEO_SEC} секунд.`); return }
    setShot({ file: f, kind: 'video', url, duration: d, mirrored: false }); setFilter('none'); setStage('edit')
  }

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
  const f = filterOf(filter)

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black text-white flex justify-center" role="dialog" aria-modal="true" aria-label="Новая история">
      <div className="relative w-full max-w-[480px] h-full overflow-hidden">
        {/* Камера */}
        {stage === 'camera' && (
          <>
            <video ref={video} className="absolute inset-0 w-full h-full object-cover" style={{ transform: mirrored ? 'scaleX(-1)' : undefined, ...filterStyle(filter) }} playsInline muted autoPlay />
            {f.overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: f.overlay }} />}
            {flashing && <div className="absolute inset-0 bg-white z-10" />}
            {camError && <div className="absolute inset-x-6 top-1/3 rounded-2xl bg-black/60 p-4 text-center text-[14px]" role="alert">{camError}</div>}
          </>
        )}
        {/* Редактор снятого */}
        {stage === 'edit' && shot && (
          <>
            {shot.kind === 'photo'
              ? <img src={shot.url} alt="Снимок" className="absolute inset-0 w-full h-full object-cover" style={filterStyle(filter)} />
              : <video src={shot.url} className="absolute inset-0 w-full h-full object-cover" style={{ transform: shot.mirrored ? 'scaleX(-1)' : undefined, ...filterStyle(filter) }} autoPlay loop playsInline />}
            {f.overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: f.overlay }} />}
            {stickerPreview}
          </>
        )}
        {/* Текстовая история */}
        {stage === 'text' && (
          <div className="absolute inset-0 grid place-items-center p-8" style={{ background: `linear-gradient(160deg, hsl(${hue} 80% 55%), hsl(${(hue + 50) % 360} 75% 38%))` }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={5} autoFocus placeholder="Куда зовёте, что делаете, настроение…" aria-label="Текст истории"
              className="w-full bg-transparent text-center font-display font-bold text-[28px] leading-tight placeholder:text-white/60 resize-none focus:outline-none" />
            {stickerPreview}
          </div>
        )}

        {/* Верх */}
        <div className="absolute inset-x-0 top-0 pt-[calc(10px+env(safe-area-inset-top,0px))] px-3 flex items-center gap-2 bg-gradient-to-b from-black/40 to-transparent pb-6">
          <button onClick={() => (stage === 'edit' ? setStage('camera') : onClose())} className="grid place-items-center w-10 h-10 rounded-full bg-black/30 cursor-pointer" aria-label={stage === 'edit' ? 'Переснять' : 'Закрыть камеру'}><Icon name={stage === 'edit' ? 'back' : 'x'} size={22} /></button>
          <span className="flex-1" />
          {stage === 'camera' && (
            <>
              {(torchOk || mirrored) && (
                <button onClick={() => (mirrored ? setFlashFront((x) => !x) : setTorch((x) => !x))} aria-pressed={mirrored ? flashFront : torch}
                  className={`h-10 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${(mirrored ? flashFront : torch) ? 'bg-[#ffc457] text-[#14152a]' : 'bg-black/30'}`} aria-label="Вспышка">⚡ {(mirrored ? flashFront : torch) ? 'Вкл' : 'Выкл'}</button>
              )}
              <button onClick={() => setFacing((x) => (x === 'user' ? 'environment' : 'user'))} className="grid place-items-center w-10 h-10 rounded-full bg-black/30 cursor-pointer" aria-label="Сменить камеру"><Icon name="repeat" size={20} /></button>
            </>
          )}
        </div>

        {/* Низ */}
        <div className="absolute inset-x-0 bottom-0 pb-[calc(14px+env(safe-area-inset-bottom,0px))] px-3 flex flex-col gap-3 bg-gradient-to-t from-black/60 to-transparent pt-10">
          {(stage === 'camera' || stage === 'edit') && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1" role="radiogroup" aria-label="Фильтр">
              {FILTERS.map((x) => (
                <button key={x.id} role="radio" aria-checked={filter === x.id} onClick={() => setFilter(x.id)}
                  className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${filter === x.id ? 'bg-white text-[#14152a]' : 'bg-black/35 text-white'}`}>{x.id === 'spark' ? '✦ ' : ''}{x.name}</button>
              ))}
            </div>
          )}

          {stage === 'camera' && (
            <>
              <div className="relative flex items-center justify-center">
                <button onClick={() => gallery.current?.click()} className="absolute left-4 grid place-items-center w-12 h-12 rounded-xl bg-white/20 cursor-pointer" aria-label="Выбрать из галереи"><Icon name="grid" size={22} /></button>
                <button onPointerDown={down} onPointerUp={up} onPointerLeave={() => { if (rec.current) up() }} onContextMenu={(e) => e.preventDefault()}
                  className="cursor-pointer touch-none select-none" aria-label={recording ? 'Остановить запись' : 'Снять: касание — фото, удержание — видео'}>
                  <Shutter recording={recording} progress={recMs / (MAX_REC_SEC * 1000)} />
                </button>
                {recording && <span className="absolute right-6 text-[14px] font-semibold tnum">● {Math.floor(recMs / 1000)} с</span>}
              </div>
              <p className="text-center text-[12px] opacity-80">{recording ? 'Отпустите, чтобы закончить' : 'Касание — фото · удержание — видео'}</p>
              <input ref={gallery} type="file" accept="image/*,video/mp4,video/quicktime,video/webm,video/*" className="sr-only" onChange={pick} aria-label="Выбрать фото или видео для истории" />
            </>
          )}

          {(stage === 'edit' || stage === 'text') && (
            <>
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
            </>
          )}

          {/* Режимы */}
          {stage !== 'edit' && (
            <div className="flex justify-center gap-6 text-[14px] font-semibold" role="tablist" aria-label="Режим">
              {([['camera', 'Камера'], ['text', 'Текст']] as const).map(([m, label]) => (
                <button key={m} role="tab" aria-selected={stage === m} onClick={() => setStage(m)} className={`cursor-pointer ${stage === m ? 'text-white' : 'text-white/55'}`}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
