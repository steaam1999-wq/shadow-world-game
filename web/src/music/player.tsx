import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { engine, type Genre, type Track } from './engine'
import { useStore } from '../store'
import type { Person, VibeAnswers } from '../types'

const MUSIC_TO_GENRE: Record<string, Genre> = { indie: 'indie', electro: 'electro', jazz: 'jazz', hiphop: 'hiphop' }
const GENRE_BPM: Record<Genre, number> = { indie: 118, electro: 124, jazz: 96, hiphop: 86 }
export const GENRE_LABEL: Record<Track['genre'], string> = { indie: 'Инди', electro: 'Электроника', jazz: 'Джаз', hiphop: 'Хип-хоп', file: 'Ваш файл' }

// Название трека — отсылка к плану или району человека.
const TITLES: Record<string, string> = {
  p1: 'Крымский вал', p2: 'Каркассон', p3: 'Малая Бронная', p4: 'Плёнка 400',
  p5: 'Скалодром', p6: 'Кенийское зерно', p7: 'Байдарки', p8: 'Ночная смена',
}

function genreOf(answers: VibeAnswers): Genre {
  return MUSIC_TO_GENRE[answers.music] ?? 'indie'
}

export function personTrack(p: Person): Track {
  const g = genreOf(p.answers)
  return { id: `t-${p.id}`, title: TITLES[p.id] ?? p.district, artist: p.name, genre: g, hue: p.hue, bpm: GENRE_BPM[g], root: 55 + (p.hue % 7), bars: 24 }
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

  const me = state.me
  const baseQueue = useMemo(() => {
    const mine: Track[] = me ? [{ id: 't-me', title: 'Мой вайб', artist: me.name, genre: genreOf(me.answers), hue: me.hue, bpm: GENRE_BPM[genreOf(me.answers)], root: 57, bars: 24 }] : []
    return [...uploads, ...mine, ...state.people.map(personTrack)]
  }, [me, uploads, state.people])
  const queue = custom ?? baseQueue

  const start = useCallback((t: Track) => {
    engine.load(t)
    setTrack(t)
    setPosition(0)
    setDuration(engine.duration(t))
    engine.play(0).then(() => setPlaying(engine.playing))
  }, [])

  const queueRef = useRef(queue)
  const trackRef = useRef(track)
  useEffect(() => { queueRef.current = queue; trackRef.current = track })

  const next = useCallback(() => {
    const q = queueRef.current
    const i = q.findIndex((x) => x.id === trackRef.current?.id)
    if (q.length) start(q[(i + 1) % q.length])
  }, [start])

  useEffect(() => {
    engine.onEnded = () => next()
    return () => { engine.onEnded = null }
  }, [next])

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
