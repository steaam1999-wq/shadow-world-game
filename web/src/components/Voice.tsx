import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'

/** Голосовые сообщения: запись с микрофона и проигрыватель в пузыре чата. */

export const VOICE_MAX_MS = 120_000
const BARS = 34

/** Формат записи: m4a играет везде (и на iPhone), webm — запасной для браузеров без него. */
function pickType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) if (MediaRecorder.isTypeSupported?.(t)) return t
  return ''
}
export const canRecordVoice = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickType() !== null

export const fmtVoice = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

/** Запись: start() — начать, finish(true) — отправить, finish(false) — удалить. levels — живая громкость для полосок. */
export function useVoiceRecorder(onDone: (dataUrl: string, ms: number) => void) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState<number[]>([])
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const pending = useRef<'idle' | 'starting' | 'abort'>('idle') // кнопку отпустили, пока микрофон ещё включался
  const r = useRef<{ rec: MediaRecorder; stream: MediaStream; chunks: Blob[]; at: number; send: boolean; ctx?: AudioContext; raf: number; tick: number } | null>(null)
  const done = useRef(onDone)
  done.current = onDone

  const stopAll = () => {
    const x = r.current
    if (!x) return
    cancelAnimationFrame(x.raf); clearInterval(x.tick)
    x.stream.getTracks().forEach((t) => t.stop())
    void x.ctx?.close().catch(() => {})
  }

  const finish = (send: boolean) => {
    const x = r.current
    if (!x) { if (pending.current === 'starting') { pending.current = 'abort'; if (send) setHint('Удерживайте кнопку, пока говорите') } return }
    x.send = send
    if (x.rec.state !== 'inactive') x.rec.stop()
    else stopAll()
    setRecording(false)
  }

  const start = async () => {
    if (r.current || pending.current !== 'idle') return
    setError(''); setHint('')
    pending.current = 'starting'
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    } catch {
      pending.current = 'idle'
      setError('Нет доступа к микрофону — разрешите его в настройках браузера.')
      return
    }
    const aborted = (pending.current as string) === 'abort'
    pending.current = 'idle'
    if (aborted) { stream.getTracks().forEach((t) => t.stop()); return }
    const type = pickType()
    const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined)
    const x = { rec, stream, chunks: [] as Blob[], at: Date.now(), send: false, raf: 0, tick: 0, ctx: undefined as AudioContext | undefined }
    r.current = x
    rec.ondataavailable = (e) => { if (e.data.size) x.chunks.push(e.data) }
    rec.onstop = () => {
      stopAll()
      r.current = null
      const ms = Date.now() - x.at
      if (x.send && ms < 700) setHint('Удерживайте кнопку, пока говорите')
      if (!x.send || ms < 700 || !x.chunks.length) return
      const blob = new Blob(x.chunks, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] })
      const fr = new FileReader()
      fr.onload = () => done.current(String(fr.result), Math.min(ms, VOICE_MAX_MS))
      fr.readAsDataURL(blob)
    }
    rec.start(250)
    setRecording(true); setElapsed(0); setLevels([])
    try { navigator.vibrate?.(15) } catch { /* ignore */ }
    x.tick = window.setInterval(() => {
      const ms = Date.now() - x.at
      setElapsed(ms)
      if (ms >= VOICE_MAX_MS) finish(true)
    }, 200)
    // Живые полоски громкости
    try {
      const ctx = new AudioContext()
      x.ctx = ctx
      const an = ctx.createAnalyser()
      an.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(an)
      const buf = new Uint8Array(an.fftSize)
      let last = 0
      const loop = (t: number) => {
        x.raf = requestAnimationFrame(loop)
        if (t - last < 90) return
        last = t
        an.getByteTimeDomainData(buf)
        let peak = 0
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128))
        setLevels((l) => [...l.slice(-(BARS - 1)), Math.min(1, peak / 70)])
      }
      x.raf = requestAnimationFrame(loop)
    } catch { /* без полосок */ }
  }

  useEffect(() => () => { if (r.current) { r.current.send = false; try { r.current.rec.stop() } catch { stopAll() } } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!hint) return; const t = setTimeout(() => setHint(''), 2500); return () => clearTimeout(t) }, [hint])
  return { recording, elapsed, levels, error, hint, start, finish, clearError: () => setError('') }
}

/** Полоски волны: из самого звука, если браузер умеет его разобрать, иначе — ровный «узор» по ссылке. */
function useWave(src: string | undefined, seed: string) {
  const [wave, setWave] = useState<number[]>(() => fakeWave(seed))
  useEffect(() => {
    if (!src) return
    let off = false
    void (async () => {
      try {
        const data = await (await fetch(src)).arrayBuffer()
        const ctx = new OfflineAudioContext(1, 1, 44100)
        const audio = await ctx.decodeAudioData(data)
        const ch = audio.getChannelData(0)
        const step = Math.floor(ch.length / BARS) || 1
        const out: number[] = []
        for (let i = 0; i < BARS; i++) {
          let sum = 0
          for (let j = i * step; j < Math.min(ch.length, (i + 1) * step); j += 8) sum = Math.max(sum, Math.abs(ch[j]))
          out.push(sum)
        }
        const max = Math.max(...out, 0.01)
        if (!off) setWave(out.map((v) => Math.max(0.18, v / max)))
      } catch { /* остаётся узор */ }
    })()
    return () => { off = true }
  }, [src])
  return wave
}
function fakeWave(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return Array.from({ length: BARS }, (_, i) => { h = Math.imul(h ^ i, 16777619); return 0.25 + ((h >>> 0) % 1000) / 1000 * 0.75 })
}

let playing: HTMLAudioElement | null = null // одновременно играет одно голосовое
const SPEEDS = [1, 1.5, 2]

export function VoiceMessage({ id, src, ms, me, time }: { id: string; src?: string; ms: number; me: boolean; time?: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState(0) // 0..1
  const [speed, setSpeed] = useState(1)
  const wave = useWave(src, id)
  const total = ms || 0

  useEffect(() => () => { audio.current?.pause() }, [])
  const el = () => {
    if (audio.current || !src) return audio.current
    const a = new Audio(src)
    a.preload = 'auto'
    a.ontimeupdate = () => { const d = isFinite(a.duration) && a.duration > 0 ? a.duration : total / 1000; setPos(d ? Math.min(1, a.currentTime / d) : 0) }
    a.onended = () => { setOn(false); setPos(0) }
    a.onpause = () => setOn(false)
    a.onplay = () => setOn(true)
    audio.current = a
    return a
  }
  const toggle = () => {
    const a = el()
    if (!a) return
    if (on) { a.pause(); return }
    if (playing && playing !== a) playing.pause()
    playing = a
    a.playbackRate = speed
    void a.play().catch(() => setOn(false))
  }
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = el()
    if (!a) return
    const box = e.currentTarget.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    const d = isFinite(a.duration) && a.duration > 0 ? a.duration : total / 1000
    a.currentTime = k * d
    setPos(k)
    if (!on) toggle()
  }
  const nextSpeed = () => { const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; setSpeed(s); if (audio.current) audio.current.playbackRate = s }
  const shown = on || pos > 0 ? total * (1 - pos) : total

  return (
    <div className="flex items-center gap-2.5 w-[230px] max-w-full py-0.5" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={toggle} disabled={!src} aria-label={on ? 'Пауза' : 'Слушать голосовое'}
        className={`grid place-items-center w-10 h-10 shrink-0 rounded-full transition active:scale-90 cursor-pointer disabled:opacity-50 ${me ? 'bg-white text-spark' : 'bg-brand text-white'}`}>
        <Icon name={on ? 'pause' : 'play'} size={18} fill className={on ? '' : 'translate-x-[1px]'} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[2px] h-7 cursor-pointer touch-none" onPointerDown={seek} role="slider" aria-label="Перемотка" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos * 100)}>
          {wave.map((v, i) => {
            const played = (i + 0.5) / wave.length <= pos
            return <span key={i} className={`flex-1 rounded-full transition-colors ${played ? (me ? 'bg-white' : 'bg-spark') : me ? 'bg-white/45' : 'bg-muted/40'}`} style={{ height: `${Math.round(v * 100)}%`, minHeight: 3 }} />
          })}
        </div>
        <div className={`flex items-center justify-between text-[11px] tnum mt-0.5 ${me ? 'text-white/85' : 'text-muted'}`}>
          <span className="inline-flex items-center gap-1.5">
            {fmtVoice(shown)}
            {(on || speed !== 1) && <button type="button" onClick={nextSpeed} className={`px-1.5 rounded-full font-bold cursor-pointer ${me ? 'bg-white/25' : 'bg-surface-2'}`} aria-label="Скорость">{speed}×</button>}
          </span>
          {time}
        </div>
      </div>
    </div>
  )
}

type Voice = ReturnType<typeof useVoiceRecorder>
const CANCEL_PX = 90

/** Кнопка микрофона: зажали — запись, отпустили — отправили, увели палец влево — отмена. */
export function VoiceHoldButton({ voice, onSlide }: { voice: Voice; onSlide: (dx: number) => void }) {
  const g = useRef<{ x: number; id: number; cancelled: boolean } | null>(null)
  const end = (send: boolean) => {
    const st = g.current
    g.current = null
    onSlide(0)
    if (!st || st.cancelled) return
    voice.finish(send)
  }
  // Клавиатура: пробел/Enter — то же удержание
  const keyDown = (e: React.KeyboardEvent) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !g.current) { e.preventDefault(); g.current = { x: 0, id: -1, cancelled: false }; void voice.start() } }
  const keyUp = (e: React.KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end(true) } }
  return (
    <button type="button" aria-label="Удерживайте, чтобы записать голосовое"
      onPointerDown={(e) => {
        if (e.button !== 0 || g.current) return
        e.preventDefault()
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
        g.current = { x: e.clientX, id: e.pointerId, cancelled: false }
        void voice.start()
      }}
      onPointerMove={(e) => {
        const st = g.current
        if (!st || st.cancelled || st.id !== e.pointerId) return
        const dx = Math.max(0, st.x - e.clientX)
        onSlide(dx)
        if (dx > CANCEL_PX) { st.cancelled = true; voice.finish(false); onSlide(0); try { navigator.vibrate?.(20) } catch { /* ignore */ } }
      }}
      onPointerUp={(e) => { if (g.current?.id === e.pointerId) end(true) }}
      onPointerCancel={(e) => { if (g.current?.id === e.pointerId) end(false) }}
      onKeyDown={keyDown} onKeyUp={keyUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
      className={`relative grid place-items-center w-12 h-12 shrink-0 rounded-full cursor-pointer bg-brand text-white transition-transform duration-200 ${voice.recording ? 'scale-[1.35] shadow-[0_0_0_8px_rgb(255_79_134/.18),0_10px_26px_-8px_rgb(255_79_134/.9)]' : 'shadow-[0_8px_20px_-8px_rgb(255_79_134/.9)]'}`}>
      {voice.recording && <span className="absolute inset-0 rounded-full bg-spark/40 animate-ping" aria-hidden="true" />}
      <Icon name="mic" size={21} className="relative" />
    </button>
  )
}

/** Полоса записи на месте строки ввода: таймер, громкость, подсказка «влево — отмена». */
export function VoiceRecordingStrip({ elapsed, levels, slide }: { elapsed: number; levels: number[]; slide: number }) {
  const bars = [...Array(Math.max(0, 18 - levels.length)).fill(0.08), ...levels.slice(-18)]
  const k = Math.min(1, slide / CANCEL_PX)
  return (
    <div className="flex-1 min-w-0 flex items-center gap-3 h-12 px-4 rounded-full bg-surface-2/80 ring-1 ring-line/70 overflow-hidden" role="status" aria-label={`Запись ${fmtVoice(elapsed)}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-danger anim-flick shrink-0" />
      <span className="tnum text-[15px] font-semibold w-10 shrink-0">{fmtVoice(elapsed)}</span>
      <div className="w-16 shrink-0 flex items-center gap-[2px] h-6">
        {bars.map((v, i) => <span key={i} className="flex-1 rounded-full bg-spark transition-[height] duration-100" style={{ height: `${Math.max(14, Math.round(v * 100))}%` }} />)}
      </div>
      <span className="flex-1 min-w-0 truncate text-right text-[13px] text-muted transition-transform" style={{ transform: `translateX(${-Math.min(slide, CANCEL_PX) * 0.35}px)`, opacity: 1 - k * 0.5 }}>
        <span className={k > 0.6 ? 'text-danger font-semibold' : ''}>‹ влево — отмена</span>
      </span>
    </div>
  )
}
