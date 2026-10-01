import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './ui'
import { FILTERS, filterOf, filterStyle, type FilterId } from './storyFilters'
import { compressPhoto, readVideoDuration } from '../screens/Shorts'

// Камера Komeeta для историй и публикаций. Касание кнопки — фото, удержание — видео.
// Кнопка — знак Komeeta: два круга сходятся, пока идёт запись. Фильтры видны прямо в видоискателе.

export type Shot = { file: Blob; kind: 'photo' | 'video'; url: string; duration: number; mirrored: boolean }

const MAX_MB = 50

function recorderType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const t of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) if (MediaRecorder.isTypeSupported(t)) return t
  return ''
}

/** Кнопка съёмки в виде знака Komeeta: круги расходятся, при записи — сходятся, по краю — прогресс. */
export function Shutter({ recording, progress, videoOnly = false }: { recording: boolean; progress: number; videoOnly?: boolean }) {
  const r = 38, c = 2 * Math.PI * r
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
      <circle cx="46" cy="46" r={r} fill={videoOnly && !recording ? 'rgb(255 79 134 / .55)' : 'rgb(255 255 255 / .18)'} stroke="rgb(255 255 255 / .9)" strokeWidth="4" />
      {recording && <circle cx="46" cy="46" r={r} fill="none" stroke="#ff4f86" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 46 46)" />}
      <circle cx={recording ? 43 : 38} cy="46" r="13" fill="none" stroke="#fff" strokeWidth="4" style={{ transition: 'cx .35s' }} />
      <circle cx={recording ? 49 : 54} cy="46" r="13" fill="none" stroke="#fff" strokeWidth="4" style={{ transition: 'cx .35s' }} />
    </svg>
  )
}

/** Видоискатель с управлением. Рисуется внутри полноэкранного окна (родитель задаёт размеры). */
export function CameraView({ filter, onFilter, onShot, onClose, maxRecSec = 30, maxVideoSec = 60, videoOnly = false, footer }: {
  filter: FilterId
  onFilter: (f: FilterId) => void
  onShot: (s: Shot, fromGallery: boolean) => void
  onClose: () => void
  maxRecSec?: number
  maxVideoSec?: number
  videoOnly?: boolean // шортс: только видео, касание начинает и останавливает запись
  footer?: ReactNode
}) {
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [camError, setCamError] = useState('')
  const [torch, setTorch] = useState(false)
  const [torchOk, setTorchOk] = useState(false)
  const [flashFront, setFlashFront] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recMs, setRecMs] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const rec = useRef<{ r: MediaRecorder; started: number; timer: ReturnType<typeof setInterval> } | null>(null)
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressed = useRef(false)
  const gallery = useRef<HTMLInputElement>(null)
  const mirrored = facing === 'user'

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setTorch(false); setTorchOk(false)
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      stopCamera()
      setCamError('')
      if (!navigator.mediaDevices?.getUserMedia) { setCamError('Этот браузер не даёт доступ к камере. Выберите фото или видео из галереи.'); return }
      try {
        const constraints = { video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } } }
        const s = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: true }).catch(() => navigator.mediaDevices.getUserMedia(constraints))
        if (!alive) { s.getTracks().forEach((t) => t.stop()); return }
        stream.current = s
        const v = video.current
        if (v) { v.srcObject = s; v.muted = true; await v.play().catch(() => {}) }
        const caps = (s.getVideoTracks()[0]?.getCapabilities?.() ?? {}) as { torch?: boolean }
        setTorchOk(!!caps.torch)
      } catch (e) {
        const name = (e as { name?: string }).name
        if (alive) setCamError(name === 'NotAllowedError' ? 'Нет доступа к камере. Разрешите его в настройках браузера или выберите файл из галереи.' : 'Камера недоступна. Выберите фото или видео из галереи.')
      }
    })()
    return () => { alive = false; if (rec.current) { clearInterval(rec.current.timer); rec.current.r.onstop = null; rec.current = null }; stopCamera() }
  }, [facing, stopCamera])

  useEffect(() => {
    const t = stream.current?.getVideoTracks()[0]
    if (t && torchOk) void t.applyConstraints({ advanced: [{ torch } as MediaTrackConstraintSet] }).catch(() => {})
  }, [torch, torchOk])

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
    c.toBlob((b) => { if (b) onShot({ file: b, kind: 'photo', url: URL.createObjectURL(b), duration: 0, mirrored: false }, false) }, 'image/jpeg', 0.88)
  }

  const stopRec = () => { const cur = rec.current; if (cur && cur.r.state !== 'inactive') cur.r.stop() }
  const startRec = () => {
    const s = stream.current
    const type = recorderType()
    if (!s || type === null) { setCamError('Запись видео в этом браузере недоступна — выберите видео из галереи.'); return }
    const r = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s)
    const chunks: Blob[] = []
    const started = Date.now()
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    r.onstop = () => {
      if (rec.current) clearInterval(rec.current.timer)
      rec.current = null
      setRecording(false); setRecMs(0)
      // Тип без параметров кодека — так файл примет хранилище.
      const blob = new Blob(chunks, { type: (r.mimeType || type || 'video/webm').split(';')[0] })
      if (blob.size) onShot({ file: blob, kind: 'video', url: URL.createObjectURL(blob), duration: (Date.now() - started) / 1000, mirrored }, false)
    }
    r.start(250)
    const timer = setInterval(() => {
      const ms = Date.now() - started
      setRecMs(ms)
      if (ms >= maxRecSec * 1000) stopRec()
    }, 100)
    rec.current = { r, started, timer }
    setRecording(true)
  }

  const down = () => {
    if (videoOnly) return
    pressed.current = true
    hold.current = setTimeout(() => { if (pressed.current) startRec() }, 280)
  }
  const up = () => {
    if (videoOnly) { if (rec.current) stopRec(); else startRec(); return }
    pressed.current = false
    if (hold.current) clearTimeout(hold.current)
    if (rec.current) stopRec(); else void takePhoto()
  }

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setCamError('')
    if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) {
      if (videoOnly) { setCamError('Для шортса нужно видео.'); return }
      try { const b = await compressPhoto(f); onShot({ file: b, kind: 'photo', url: URL.createObjectURL(b), duration: 0, mirrored: false }, true) }
      catch { setCamError('Не получилось открыть фото. Выберите JPG или PNG.') }
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) { setCamError(`Видео больше ${MAX_MB} МБ. Обрежьте его или снимите в 1080p.`); return }
    const url = URL.createObjectURL(f)
    const d = await readVideoDuration(url)
    if (d < 0) { URL.revokeObjectURL(url); setCamError('Браузер не может открыть это видео. Попробуйте MP4.'); return }
    if (d > maxVideoSec + 0.5) { URL.revokeObjectURL(url); setCamError(`Видео длиннее ${maxVideoSec} секунд. Обрежьте его в «Фото».`); return }
    onShot({ file: f, kind: 'video', url, duration: d, mirrored: false }, true)
  }

  const f = filterOf(filter)
  const hint = recording ? (videoOnly ? 'Нажмите ещё раз, чтобы закончить' : 'Отпустите, чтобы закончить') : videoOnly ? 'Нажмите, чтобы начать запись' : 'Касание — фото · удержание — видео'

  return (
    <>
      <video ref={video} className="absolute inset-0 w-full h-full object-cover" style={{ transform: mirrored ? 'scaleX(-1)' : undefined, ...filterStyle(filter) }} playsInline muted autoPlay />
      {f.overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: f.overlay }} />}
      {flashing && <div className="absolute inset-0 bg-white z-10" />}
      {camError && <div className="absolute inset-x-6 top-1/3 rounded-2xl bg-black/60 p-4 text-center text-[14px]" role="alert">{camError}</div>}

      <div className="absolute inset-x-0 top-0 pt-[calc(10px+env(safe-area-inset-top,0px))] px-3 flex items-center gap-2 bg-gradient-to-b from-black/40 to-transparent pb-6">
        <button onClick={onClose} className="grid place-items-center w-10 h-10 rounded-full bg-black/30 cursor-pointer" aria-label="Закрыть камеру"><Icon name="x" size={22} /></button>
        <span className="flex-1" />
        {(torchOk || mirrored) && (
          <button onClick={() => (mirrored ? setFlashFront((x) => !x) : setTorch((x) => !x))} aria-pressed={mirrored ? flashFront : torch}
            className={`h-10 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${(mirrored ? flashFront : torch) ? 'bg-[#ffc457] text-[#14152a]' : 'bg-black/30'}`} aria-label="Вспышка">⚡ {(mirrored ? flashFront : torch) ? 'Вкл' : 'Выкл'}</button>
        )}
        <button onClick={() => setFacing((x) => (x === 'user' ? 'environment' : 'user'))} disabled={recording} className="grid place-items-center w-10 h-10 rounded-full bg-black/30 cursor-pointer disabled:opacity-40" aria-label="Сменить камеру"><Icon name="repeat" size={20} /></button>
      </div>

      <div className="absolute inset-x-0 bottom-0 pb-[calc(14px+env(safe-area-inset-bottom,0px))] px-3 flex flex-col gap-3 bg-gradient-to-t from-black/60 to-transparent pt-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1" role="radiogroup" aria-label="Фильтр">
          {FILTERS.map((x) => (
            <button key={x.id} role="radio" aria-checked={filter === x.id} onClick={() => onFilter(x.id)}
              className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${filter === x.id ? 'bg-white text-[#14152a]' : 'bg-black/35 text-white'}`}>{x.id === 'spark' ? '✦ ' : ''}{x.name}</button>
          ))}
        </div>
        <div className="relative flex items-center justify-center">
          <button onClick={() => gallery.current?.click()} disabled={recording} className="absolute left-4 grid place-items-center w-12 h-12 rounded-xl bg-white/20 cursor-pointer disabled:opacity-40" aria-label="Выбрать из галереи"><Icon name="grid" size={22} /></button>
          <button onPointerDown={down} onPointerUp={up} onPointerLeave={() => { if (rec.current && !videoOnly) up() }} onContextMenu={(e) => e.preventDefault()}
            className="cursor-pointer touch-none select-none" aria-label={recording ? 'Остановить запись' : videoOnly ? 'Начать запись видео' : 'Снять: касание — фото, удержание — видео'}>
            <Shutter recording={recording} progress={recMs / (maxRecSec * 1000)} videoOnly={videoOnly} />
          </button>
          {recording && <span className="absolute right-6 text-[14px] font-semibold tnum">● {Math.floor(recMs / 1000)} с</span>}
        </div>
        <p className="text-center text-[12px] opacity-80">{hint}</p>
        <input ref={gallery} type="file" accept={videoOnly ? 'video/mp4,video/quicktime,video/webm,video/*' : 'image/*,video/mp4,video/quicktime,video/webm,video/*'} className="sr-only" onChange={(e) => void pick(e)} aria-label="Выбрать фото или видео из галереи" />
        {footer}
      </div>
    </>
  )
}
