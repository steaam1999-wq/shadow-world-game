import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { sb, sendMessage } from '../cloud/api'
import { useStore } from '../store'
import { Avatar, Icon } from '../components/ui'
import type { Person } from '../types'
import { nativeCallEnded } from '../native'

// Звонки и видеозвонки: WebRTC напрямую между телефонами. Сервер только передаёт «сигналы»
// (предложение, ответ, адреса для соединения) через таблицу call_signals — звук и видео через него не идут.
// Звонить можно тем, с кем уже переписывались в обе стороны (проверяет сервер).

type Phase = 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended'
interface CallState {
  id: string
  peer: string
  video: boolean
  dir: 'out' | 'in'
  phase: Phase
  startedAt?: number
  note?: string
  offer?: RTCSessionDescriptionInit
}
interface Signal { id: number; call_id: string; from_user: string; to_user: string; kind: 'offer' | 'answer' | 'ice' | 'end' | 'decline' | 'busy'; payload: Record<string, unknown>; created_at: string }

const RING_MS = 45_000
const STUN: RTCIceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]

let iceCache: Promise<RTCIceServer[]> | null = null
/** STUN/TURN с сервера (TURN — если подключён Cloudflare); не ответил за 4 с — только STUN. */
function iceServers() {
  iceCache ??= Promise.race([
    sb().functions.invoke('turn').then(({ data }) => (Array.isArray(data?.iceServers) && data.iceServers.length ? data.iceServers as RTCIceServer[] : STUN)),
    new Promise<RTCIceServer[]>((r) => setTimeout(() => r(STUN), 4000)),
  ]).catch(() => STUN)
  return iceCache
}

const send = async (callId: string, to: string, kind: Signal['kind'], payload: Record<string, unknown> = {}) => {
  const { error } = await sb().from('call_signals').insert({ call_id: callId, to_user: to, kind, payload })
  if (error) throw error
}

/* ───────── Звуки: гудки у звонящего, мелодия у того, кому звонят ───────── */
let audio: AudioContext | null = null
function beep(freqs: number[], ms: number, gain = 0.08) {
  try {
    audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    void audio.resume()
    const t = audio.currentTime
    for (const f of freqs) {
      const o = audio.createOscillator(), g = audio.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.03)
      g.gain.setValueAtTime(gain, t + ms / 1000 - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + ms / 1000 + 0.02)
    }
  } catch { /* без звука */ }
}
function useRingtone(kind: 'in' | 'out' | null) {
  useEffect(() => {
    if (!kind) return
    const play = () => {
      if (kind === 'out') beep([425], 1000, 0.05)
      else { beep([660, 880], 350); setTimeout(() => beep([660, 990], 350), 450); try { navigator.vibrate?.([400, 200, 400]) } catch { /* ignore */ } }
    }
    play()
    const t = setInterval(play, kind === 'out' ? 4000 : 2600)
    return () => { clearInterval(t); try { navigator.vibrate?.(0) } catch { /* ignore */ } }
  }, [kind])
}

const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

/* ───────── Контекст: начать звонок из любого места ───────── */
interface CallsApi { start: (personId: string, video: boolean) => void; busy: boolean }
const Ctx = createContext<CallsApi>({ start: () => {}, busy: false })
export const useCalls = () => useContext(Ctx)

export function CallProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const uid = state.cloud?.userId ?? null
  const [call, setCall] = useState<CallState | null>(null)
  const callRef = useRef<CallState | null>(null)
  callRef.current = call
  const pc = useRef<RTCPeerConnection | null>(null)
  const local = useRef<MediaStream | null>(null)
  const [remote, setRemote] = useState<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const pending = useRef<RTCIceCandidateInit[]>([])
  const ringTimer = useRef(0)
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [, tick] = useState(0)
  const capsulesRef = useRef(state.capsules)
  capsulesRef.current = state.capsules

  // Секундомер разговора
  useEffect(() => {
    if (call?.phase !== 'active') return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [call?.phase])

  /** Итог звонка — строкой в переписке (пишет только звонивший, чтобы не было двух записей). */
  const logToChat = useCallback((c: CallState, text: string) => {
    if (!uid || c.dir !== 'out') return
    const cap = [...capsulesRef.current].filter((x) => x.personId === c.peer).sort((a, b) => b.createdAt - a.createdAt)[0]
    if (cap) void sendMessage(uid, cap.id, text).catch(() => { /* не страшно */ })
  }, [uid])

  const cleanup = useCallback(() => {
    clearTimeout(ringTimer.current)
    pc.current?.close(); pc.current = null
    local.current?.getTracks().forEach((t) => t.stop()); local.current = null
    pending.current = []
    setRemote(null); setLocalStream(null); setMuted(false); setCamOff(false); setFacing('user')
  }, [])

  /** Завершить: сообщить собеседнику, записать итог, через секунду закрыть экран. */
  const finish = useCallback((note: string, signal?: Signal['kind'], reason?: string) => {
    const c = callRef.current
    if (!c || c.phase === 'ended') return
    if (signal) void send(c.id, c.peer, signal, reason ? { reason } : {}).catch(() => { /* собеседник всё равно узнает по таймауту */ })
    const talked = c.startedAt ? Date.now() - c.startedAt : 0
    logToChat(c, talked ? `${c.video ? '🎥 Видеозвонок' : '📞 Звонок'} · ${fmt(talked)}` : `${c.video ? '🎥' : '📞'} Пропущенный звонок`)
    cleanup()
    setCall({ ...c, phase: 'ended', note })
    const id = c.id
    setTimeout(() => {
      setCall((cur) => (cur?.id === id ? null : cur))
      void sb().from('call_signals').delete().eq('call_id', id) // сигналы больше не нужны
    }, 1600)
  }, [cleanup, logToChat])

  const media = async (video: boolean, face: 'user' | 'environment' = 'user') => {
    const s = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: video ? cam(face) : false,
    })
    local.current = s
    setLocalStream(s)
    return s
  }

  const makePeer = async (c: CallState) => {
    const p = new RTCPeerConnection({ iceServers: await iceServers() })
    pc.current = p
    p.onicecandidate = (e) => { if (e.candidate) void send(c.id, c.peer, 'ice', { candidate: e.candidate.toJSON() }).catch(() => {}) }
    p.ontrack = (e) => setRemote(e.streams[0] ?? new MediaStream([e.track]))
    let drop = 0
    p.onconnectionstatechange = () => {
      const s = p.connectionState
      if (s === 'connected') { clearTimeout(drop); setCall((cur) => (cur && cur.id === c.id ? { ...cur, phase: 'active', startedAt: cur.startedAt ?? Date.now() } : cur)) }
      if (s === 'failed') finish('Не удалось соединиться — возможно, мешает сеть. Попробуйте другой Wi-Fi или мобильный интернет.', 'end')
      if (s === 'disconnected') drop = window.setTimeout(() => { if (p.connectionState !== 'connected') finish('Связь прервалась', 'end') }, 10000)
    }
    return p
  }
  const flushIce = async () => {
    const p = pc.current
    if (!p?.remoteDescription) return
    for (const c of pending.current.splice(0)) await p.addIceCandidate(c).catch(() => {})
  }

  /** Позвонить. */
  const start = useCallback(async (personId: string, video: boolean) => {
    if (!uid || callRef.current) return
    const c: CallState = { id: crypto.randomUUID(), peer: personId, video, dir: 'out', phase: 'outgoing' }
    setCall(c)
    try {
      const s = await media(video)
      const p = await makePeer(c)
      s.getTracks().forEach((t) => p.addTrack(t, s))
      const offer = await p.createOffer()
      await p.setLocalDescription(offer)
      await send(c.id, personId, 'offer', { sdp: offer.sdp, video })
      ringTimer.current = window.setTimeout(() => { if (callRef.current?.id === c.id && callRef.current.phase === 'outgoing') finish('Не ответили', 'end', 'missed') }, RING_MS)
    } catch (e) {
      const m = (e as Error)?.message ?? ''
      cleanup()
      const note = /Permission|NotAllowed/i.test(m) ? (video ? 'Нет доступа к камере или микрофону — разрешите их в настройках браузера.' : 'Нет доступа к микрофону — разрешите его в настройках браузера.')
        : /row-level security/i.test(m) ? 'Звонить можно, когда вы оба написали друг другу и звонки не отключены.'
        : /call-limit/.test(m) ? 'Слишком много звонков за час. Попробуйте позже.' : 'Не получилось позвонить. Проверьте интернет.'
      setCall({ ...c, phase: 'ended', note })
      setTimeout(() => setCall((cur) => (cur?.id === c.id ? null : cur)), 2600)
    }
  }, [uid, cleanup, finish]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Принять входящий. */
  const accept = async () => {
    const c = callRef.current
    if (!c || c.phase !== 'incoming' || !c.offer) return
    setCall({ ...c, phase: 'connecting' })
    try {
      const s = await media(c.video)
      const p = await makePeer(c)
      s.getTracks().forEach((t) => p.addTrack(t, s))
      await p.setRemoteDescription(c.offer)
      // Адреса, которые звонящий прислал, пока приложение было закрыто.
      const { data } = await sb().from('call_signals').select('payload').eq('call_id', c.id).eq('kind', 'ice').eq('from_user', c.peer)
      for (const r of (data ?? []) as { payload: { candidate?: RTCIceCandidateInit } }[]) if (r.payload.candidate) pending.current.push(r.payload.candidate)
      const answer = await p.createAnswer()
      await p.setLocalDescription(answer)
      await send(c.id, c.peer, 'answer', { sdp: answer.sdp })
      await flushIce()
    } catch (e) {
      const m = (e as Error)?.message ?? ''
      finish(/Permission|NotAllowed/i.test(m) ? 'Нет доступа к микрофону или камере' : 'Не получилось ответить', 'end')
    }
  }

  // Сигналы от собеседника
  const onSignal = useCallback(async (s: Signal) => {
    const c = callRef.current
    if (s.kind === 'offer') {
      if (c && c.phase !== 'ended') { if (c.id !== s.call_id) void send(s.call_id, s.from_user, 'busy').catch(() => {}); return }
      if (Date.now() - new Date(s.created_at).getTime() > RING_MS) return
      setCall({ id: s.call_id, peer: s.from_user, video: !!s.payload.video, dir: 'in', phase: 'incoming', offer: { type: 'offer', sdp: String(s.payload.sdp ?? '') } })
      clearTimeout(ringTimer.current)
      ringTimer.current = window.setTimeout(() => { if (callRef.current?.id === s.call_id && callRef.current.phase === 'incoming') finish('Пропущенный звонок') }, RING_MS)
      return
    }
    if (!c || c.id !== s.call_id) return
    if (s.kind === 'answer' && pc.current && c.dir === 'out') {
      clearTimeout(ringTimer.current)
      setCall({ ...c, phase: 'connecting' })
      await pc.current.setRemoteDescription({ type: 'answer', sdp: String(s.payload.sdp ?? '') }).catch(() => {})
      await flushIce()
    } else if (s.kind === 'ice') {
      const cand = s.payload.candidate as RTCIceCandidateInit | undefined
      if (!cand) return
      if (pc.current?.remoteDescription) await pc.current.addIceCandidate(cand).catch(() => {})
      else pending.current.push(cand)
    } else if (s.kind === 'decline') finish('Собеседник отклонил звонок')
    else if (s.kind === 'busy') finish('Собеседник сейчас разговаривает')
    else if (s.kind === 'end') finish(c.phase === 'incoming' ? 'Пропущенный звонок' : 'Звонок завершён')
  }, [finish])

  // Подписка на сигналы + проверка, не звонят ли прямо сейчас (приложение открыли из уведомления)
  useEffect(() => {
    if (!uid) return
    const ch = sb().channel(`calls-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `to_user=eq.${uid}` }, (e) => { void onSignal(e.new as Signal) })
      .subscribe()
    void (async () => {
      const since = new Date(Date.now() - RING_MS).toISOString()
      const { data } = await sb().from('call_signals').select('*').eq('to_user', uid).eq('kind', 'offer').gt('created_at', since).order('created_at', { ascending: false }).limit(1)
      const offer = (data ?? [])[0] as Signal | undefined
      if (!offer) return
      const { data: ended } = await sb().from('call_signals').select('id').eq('call_id', offer.call_id).in('kind', ['end', 'decline']).limit(1)
      if (!ended?.length) void onSignal(offer)
    })()
    return () => { void sb().removeChannel(ch) }
  }, [uid, onSignal])

  // Приложение для Android: «Принять»/«Отклонить» нажали на экране вызова поверх блокировки.
  const autoAnswer = useRef<string | null>(null)
  const acceptRef = useRef<() => void>(() => {})
  acceptRef.current = () => { void accept() }
  useEffect(() => {
    if (!uid) return
    const on = () => {
      const w = window as unknown as { __komeetaCall?: { action: string; call: string } }
      const d = w.__komeetaCall
      w.__komeetaCall = undefined
      if (!d?.call) return
      if (d.action === 'answer') {
        if (callRef.current?.id === d.call && callRef.current.phase === 'incoming') acceptRef.current()
        else autoAnswer.current = d.call // предложение звонка ещё не дошло — примем, как только придёт
      } else if (d.action === 'decline') {
        void (async () => {
          const { data } = await sb().from('call_signals').select('from_user').eq('call_id', d.call).eq('kind', 'offer').limit(1)
          const from = (data ?? [])[0] as { from_user?: string } | undefined
          if (from?.from_user) await send(d.call, from.from_user, 'decline').catch(() => {})
          if (callRef.current?.id === d.call) setCall(null)
        })()
      }
    }
    on()
    window.addEventListener('komeeta-call', on)
    return () => window.removeEventListener('komeeta-call', on)
  }, [uid])
  useEffect(() => {
    if (call?.phase === 'incoming' && autoAnswer.current === call.id) { autoAnswer.current = null; acceptRef.current() }
  }, [call?.id, call?.phase])

  // Звонок закончился — приложение снова уходит за экран блокировки
  const hadCall = useRef(false)
  useEffect(() => { const on = !!call && call.phase !== 'ended'; if (hadCall.current && !on) nativeCallEnded(); hadCall.current = on }, [call])
  useRingtone(call?.phase === 'incoming' ? 'in' : call?.phase === 'outgoing' ? 'out' : null)

  const toggleMic = () => { const t = local.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMuted(!t.enabled) } }
  const toggleCam = () => { const t = local.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCamOff(!t.enabled) } }
  const flip = async () => {
    const next = facing === 'user' ? 'environment' : 'user'
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: cam(next) })
      const track = s.getVideoTracks()[0]
      const sender = pc.current?.getSenders().find((x) => x.track?.kind === 'video')
      await sender?.replaceTrack(track)
      const old = local.current?.getVideoTracks()[0]
      if (old) { local.current!.removeTrack(old); old.stop() }
      local.current?.addTrack(track)
      setLocalStream(new MediaStream(local.current?.getTracks() ?? []))
      setFacing(next)
    } catch { /* камера одна */ }
  }

  const peer = call ? state.people.find((p) => p.id === call.peer) ?? null : null
  return (
    <Ctx.Provider value={{ start: (id, v) => void start(id, v), busy: !!call }}>
      {children}
      {call && createPortal(
        <CallScreen call={call} peer={peer} remote={remote} local={localStream} muted={muted} camOff={camOff} mirror={facing === 'user'}
          onAccept={() => void accept()} onDecline={() => finish('Звонок отклонён', 'decline')} onHangup={() => finish(call.phase === 'outgoing' ? 'Звонок отменён' : 'Звонок завершён', 'end')}
          onMic={toggleMic} onCam={toggleCam} onFlip={() => void flip()} />,
        document.body,
      )}
    </Ctx.Provider>
  )
}

/** Камера без принудительного кадрирования: просим только разрешение, пропорции — родные у матрицы (иначе телефон обрезает кадр и картинка выглядит приближенной). */
const cam = (face: 'user' | 'environment'): MediaTrackConstraints => ({ facingMode: face, width: { ideal: 1280 }, resizeMode: 'none' } as MediaTrackConstraints)

function Sound({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => { const a = ref.current; if (a) { a.srcObject = stream; void a.play().catch(() => {}) } }, [stream])
  return <audio ref={ref} autoPlay />
}

function Video({ stream, muted, mirror, className }: { stream: MediaStream | null; muted?: boolean; mirror?: boolean; className: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.srcObject = stream
    if (stream) void v.play().catch(() => {})
  }, [stream])
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} style={mirror ? { transform: 'scaleX(-1)' } : undefined} />
}

function CallScreen({ call, peer, remote, local, muted, camOff, mirror, onAccept, onDecline, onHangup, onMic, onCam, onFlip }: {
  call: CallState; peer: Person | null; remote: MediaStream | null; local: MediaStream | null; muted: boolean; camOff: boolean; mirror: boolean
  onAccept: () => void; onDecline: () => void; onHangup: () => void; onMic: () => void; onCam: () => void; onFlip: () => void
}) {
  const name = peer?.name ?? 'Собеседник'
  const showRemoteVideo = call.video && !!remote && remote.getVideoTracks().length > 0 && call.phase === 'active'
  const status = call.phase === 'incoming' ? (call.video ? 'Видеозвонок…' : 'Входящий звонок…')
    : call.phase === 'outgoing' ? 'Вызов…' : call.phase === 'connecting' ? 'Соединяем…'
    : call.phase === 'active' ? fmt(Date.now() - (call.startedAt ?? Date.now())) : call.note ?? 'Звонок завершён'
  const round = 'grid place-items-center w-16 h-16 rounded-full cursor-pointer transition active:scale-95'
  return (
    <div className="fixed inset-0 z-[120] text-white flex flex-col bg-[radial-gradient(120%_80%_at_50%_0%,#3b1d4e,#120a1c_70%)]" role="dialog" aria-modal="true" aria-label={`Звонок: ${name}`}>
      {/* Звук собеседника (в видеозвонке он идёт вместе с видео) */}
      {!showRemoteVideo && remote && <Sound stream={remote} />}
      {showRemoteVideo && <Video stream={remote} className="absolute inset-0 w-full h-full object-cover" />}
      {showRemoteVideo && <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />}
      {call.video && local && call.phase !== 'ended' && !camOff && (
        <Video stream={local} muted mirror={mirror} className={showRemoteVideo
          ? 'absolute right-4 top-[calc(16px+env(safe-area-inset-top,0px))] w-28 h-40 rounded-2xl object-cover ring-2 ring-white/40 shadow-2xl z-10'
          : 'absolute inset-0 w-full h-full object-cover'} />
      )}
      {/* Пока ждём ответа — своя камера на весь экран, затемнённая для читаемости имени и кнопок */}
      {call.video && local && call.phase !== 'ended' && !camOff && !showRemoteVideo && (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/.55),rgb(0_0_0/.25)_35%,rgb(0_0_0/.25)_65%,rgb(0_0_0/.6))] pointer-events-none" />
      )}

      <div className={`relative z-[5] flex flex-col items-center gap-3 px-6 ${showRemoteVideo ? 'pt-[calc(24px+env(safe-area-inset-top,0px))] items-start' : 'flex-1 justify-center pt-[env(safe-area-inset-top,0px)] pb-6'}`}>
        {!showRemoteVideo && (
          <span className="relative grid place-items-center">
            {(call.phase === 'incoming' || call.phase === 'outgoing') && <span className="absolute inset-0 -m-3 rounded-full bg-white/10 animate-ping" />}
            <span className="grid place-items-center leading-none rounded-full p-1 bg-white/15"><Avatar name={name} hue={peer?.hue ?? 280} src={peer?.photo} size={120} /></span>
          </span>
        )}
        <h2 className={`font-display font-bold ${showRemoteVideo ? 'text-[20px] drop-shadow' : 'text-[28px] mt-3'}`}>{name}</h2>
        <p className={`text-white/75 text-center ${call.phase === 'active' ? 'tnum text-[16px]' : 'text-[15px]'}`} role="status">{status}</p>
      </div>

      <div className="relative z-[5] mt-auto shrink-0 px-8 pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
        {call.phase === 'incoming' ? (
          <div className="flex items-center justify-between">
            <button onClick={onDecline} className={`${round} bg-[#ef4444]`} aria-label="Отклонить"><Icon name="phone" size={28} fill className="rotate-[135deg]" /></button>
            <button onClick={onAccept} className={`${round} bg-[#22c55e] animate-bounce`} aria-label="Принять"><Icon name={call.video ? 'video' : 'phone'} size={28} fill /></button>
          </div>
        ) : call.phase !== 'ended' ? (
          <div className="flex items-center justify-center gap-5">
            <button onClick={onMic} className={`${round} ${muted ? 'bg-white text-[#120a1c]' : 'bg-white/15 backdrop-blur'}`} aria-label={muted ? 'Включить микрофон' : 'Выключить микрофон'} aria-pressed={muted}><Icon name={muted ? 'micOff' : 'mic'} size={26} /></button>
            {call.video && <button onClick={onCam} className={`${round} ${camOff ? 'bg-white text-[#120a1c]' : 'bg-white/15 backdrop-blur'}`} aria-label={camOff ? 'Включить камеру' : 'Выключить камеру'} aria-pressed={camOff}><Icon name={camOff ? 'videoOff' : 'video'} size={26} /></button>}
            {call.video && <button onClick={onFlip} className={`${round} bg-white/15 backdrop-blur`} aria-label="Сменить камеру"><Icon name="flip" size={26} /></button>}
            <button onClick={onHangup} className={`${round} bg-[#ef4444]`} aria-label="Завершить звонок"><Icon name="phone" size={28} fill className="rotate-[135deg]" /></button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
