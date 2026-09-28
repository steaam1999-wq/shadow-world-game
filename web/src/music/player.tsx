import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { engine, type Genre, type Track } from './engine'
import { useStore } from '../store'
import type { Person, VibeAnswers } from '../types'

import { CATALOG, GENRE_BPM, GENRE_LABEL } from './catalog'

export { GENRE_LABEL }
const MUSIC_TO_GENRE: Record<string, Genre> = { indie: 'indie', electro: 'electro', jazz: 'jazz', hiphop: 'hiphop' }
const LIKES_KEY = 'iskra-music-likes'
export type Repeat = 'off' | 'all' | 'one'

// Название трека — отсылка к плану или району человека.
const TITLES: Record<string, string> = {
  p1: 'Крымский вал', p2: 'Каркассон', p3: 'Малая Бронная', p4: 'Плёнка 400',
  p5: 'Скалодром', p6: 'Кенийское зерно', p7: 'Байдарки', p8: 'Ночная смена',
}

export function genreOf(answers: VibeAnswers): Genre {
  return MUSIC_TO_GENRE[answers.music] ?? 'indie'
}

export function personTrack(p: Person): Track {
  const g = genreOf(p.answers)
  return { id: `t-${p.id}`, title: TITLES[p.id] ?? p.district, artist: p.name, genre: g, hue: p.hue, bpm: GENRE_BPM[g], root: 55 + (p.hue % 7), bars: 40 }
}

interface PlayerApi {
  track: Track | null
  queue: Track[]
  playing: boolean
  position: number
  duration: number
  volume: number
  expanded: boolean
  play: (t: Track, queue?: Track[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (sec: number) => void
  setVolume: (v: number) => void
  setExpanded: (v: boolean) => void
  addFile: (file: File) => void
  close: () => void
  library: Track[]
  uploads: Track[]
  shuffle: boolean
  repeat: Repeat
  likes: string[]
  toggleShuffle: () => void
  cycleRepeat: () => void
  toggleLike: (id: string) => void
}

const Ctx = createContext<PlayerApi | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const [track, setTrack] = useState<Track | null>(null)
  const [uploads, setUploads] = useState<Track[]>([])
  const [custom, setCustom] = useState<Track[] | null>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVol] = useState(0.8)
  const [expanded, setExpanded] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<Repeat>('all')
  const [likes, setLikes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LIKES_KEY) ?? '[]') as string[] } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(LIKES_KEY, JSON.stringify(likes)) } catch { /* ignore */ } }, [likes])

  const me = state.me
  const baseQueue = useMemo(() => {
    const mine: Track[] = me ? [{ id: 't-me', title: 'Мой вайб', artist: me.name, genre: genreOf(me.answers), hue: me.hue, bpm: GENRE_BPM[genreOf(me.answers)], root: 57, bars: 40 }] : []
    return [...uploads, ...mine, ...state.people.map(personTrack), ...CATALOG]
  }, [me, uploads, state.people])
  const queue = custom ?? baseQueue

  const start = useCallback((t: Track) => {
    engine.load(t)
    setTrack(t)
    setPosition(0)
    setDuration(engine.duration(t))
    engine.play(0).then(() => setPlaying(engine.playing))
  }, [])

  const ref = useRef({ queue, track, shuffle, repeat })
  useEffect(() => { ref.current = { queue, track, shuffle, repeat } })

  const next = useCallback(() => {
    const { queue: q, track: cur, shuffle: sh } = ref.current
    if (!q.length) return
    const i = q.findIndex((x) => x.id === cur?.id)
    let j = (i + 1) % q.length
    if (sh && q.length > 1) { do { j = Math.floor(Math.random() * q.length) } while (j === i) }
    start(q[j])
  }, [start])

  useEffect(() => {
    engine.onEnded = () => {
      const { queue: q, track: cur, repeat: rp } = ref.current
      if (rp === 'one' && cur) { start(cur); return }
      const last = q.findIndex((x) => x.id === cur?.id) === q.length - 1
      if (rp === 'off' && last && !ref.current.shuffle) { setPlaying(false); return }
      next()
    }
    return () => { engine.onEnded = null }
  }, [next, start])

  // Позиция обновляется 4 раза в секунду, пока играет.
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setPosition(engine.position)
      setDuration(engine.duration())
      setPlaying(engine.playing)
    }, 250)
    return () => clearInterval(t)
  }, [playing])

  const api: PlayerApi = {
    track, queue, playing, position, duration, volume, expanded,
    play: (t, q) => {
      if (q) setCustom(q)
      if (track?.id === t.id) { if (!playing) { engine.play().then(() => setPlaying(true)) } return }
      start(t)
    },
    toggle: () => {
      if (!track) { if (queue[0]) start(queue[0]); return }
      if (playing) { engine.pause(); setPlaying(false) } else engine.play().then(() => setPlaying(engine.playing))
    },
    next,
    prev: () => {
      if (engine.position > 3) { engine.seek(0); setPosition(0); return }
      const i = queue.findIndex((x) => x.id === track?.id)
      if (queue.length) start(queue[(i - 1 + queue.length) % queue.length])
    },
    seek: (sec) => { engine.seek(sec); setPosition(sec) },
    setVolume: (v) => { engine.setVolume(v); setVol(v) },
    setExpanded,
    addFile: (file) => {
      const t: Track = { id: `f-${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ''), artist: 'Загружено вами', genre: 'file', hue: 280, bpm: 0, root: 0, bars: 0, url: URL.createObjectURL(file) }
      setUploads((u) => [t, ...u])
      setCustom(null)
      start(t)
    },
    close: () => { engine.stop(); setTrack(null); setPlaying(false); setExpanded(false) },
    library: baseQueue,
    uploads,
    shuffle,
    repeat,
    likes,
    toggleShuffle: () => setShuffle((v) => !v),
    cycleRepeat: () => setRepeat((r) => (r === 'all' ? 'one' : r === 'one' ? 'off' : 'all')),
    toggleLike: (id) => setLikes((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function usePlayer() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePlayer вне PlayerProvider')
  return ctx
}

export function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
