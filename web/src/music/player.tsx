import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { engine, type Genre, type Track } from './engine'
import { useStore } from '../store'
import type { Person, VibeAnswers } from '../types'

import { CATALOG, GENRE_BPM, GENRE_LABEL } from './catalog'
import { deleteSong, loadSongs, parseFileName, readDuration, saveSong, type StoredSong } from './library'

export { GENRE_LABEL }
export const trackLabel = (t: Track) => (t.source === 'audius' ? 'Audius' : t.source === 'itunes' ? 'Отрывок · iTunes' : GENRE_LABEL[t.genre])
const MUSIC_TO_GENRE: Record<string, Genre> = { indie: 'indie', electro: 'electro', jazz: 'jazz', hiphop: 'hiphop' }
const LIKES_KEY = 'iskra-music-likes'
const ONLINE_KEY = 'iskra-music-online'
const MY_SONG_KEY = 'iskra-my-song'
const MAX_MB = 60
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
  /** Загружает песни; возвращает, сколько сохранено навсегда, сколько только до перезагрузки и что отклонено. */
  addFiles: (files: File[], opts?: { play?: boolean }) => Promise<{ saved: number; temporary: number; rejected: string[] }>
  removeUpload: (id: string) => void
  renameUpload: (id: string, title: string, artist: string) => void
  mySongId: string | null
  setMySong: (id: string | null) => void
  close: () => void
  library: Track[]
  uploads: Track[]
  shuffle: boolean
  repeat: Repeat
  likes: string[]
  toggleShuffle: () => void
  cycleRepeat: () => void
  toggleLike: (id: string, track?: Track) => void
}

const Ctx = createContext<PlayerApi | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const [track, setTrack] = useState<Track | null>(null)
  const [uploads, setUploads] = useState<Track[]>([])
  const songs = useRef(new Map<string, StoredSong>())
  const [mySongId, setMySongId] = useState<string | null>(() => {
    try { return localStorage.getItem(MY_SONG_KEY) } catch { return null }
  })
  useEffect(() => {
    try { if (mySongId) localStorage.setItem(MY_SONG_KEY, mySongId); else localStorage.removeItem(MY_SONG_KEY) } catch { /* ignore */ }
  }, [mySongId])
  // Песни, загруженные раньше в этом браузере.
  useEffect(() => {
    let alive = true
    loadSongs().then((list) => {
      if (!alive) return
      list.forEach((s) => songs.current.set(s.id, s))
      setUploads((cur) => [...cur, ...list.filter((s) => !cur.some((c) => c.id === s.id)).map(songTrack)])
    })
    return () => { alive = false }
  }, [])
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
  // Лайкнутые треки из интернета храним целиком: без этого их не найти в «Любимых» после перезагрузки.
  const [online, setOnline] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem(ONLINE_KEY) ?? '[]') as Track[] } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(ONLINE_KEY, JSON.stringify(online)) } catch { /* ignore */ } }, [online])

  const me = state.me
  const baseQueue = useMemo(() => {
    const mine: Track[] = me ? [{ id: 't-me', title: 'Мой вайб', artist: me.name, genre: genreOf(me.answers), hue: me.hue, bpm: GENRE_BPM[genreOf(me.answers)], root: 57, bars: 40 }] : []
    return [...uploads, ...online, ...mine, ...state.people.map(personTrack), ...CATALOG]
  }, [me, uploads, online, state.people])
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

  const addFiles = async (files: File[], opts: { play?: boolean } = {}) => {
    const rejected: string[] = []
    const added: Track[] = []
    let saved = 0
    let temporary = 0
    for (const file of files) {
      if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i.test(file.name)) { rejected.push(`${file.name}: это не аудиофайл`); continue }
      if (file.size > MAX_MB * 1024 * 1024) { rejected.push(`${file.name}: больше ${MAX_MB} МБ`); continue }
      const { title, artist } = parseFileName(file.name)
      const song: StoredSong = { id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, artist, duration: await readDuration(file), addedAt: Date.now(), blob: file }
      songs.current.set(song.id, song)
      if (await saveSong(song)) saved++; else temporary++
      added.push(songTrack(song))
    }
    if (added.length) {
      setUploads((u) => [...added, ...u])
      if (opts.play !== false) { setCustom(null); start(added[0]) }
    }
    return { saved, temporary, rejected }
  }

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
    addFile: (file) => { void addFiles([file]) },
    addFiles,
    removeUpload: (id) => {
      const t = uploads.find((x) => x.id === id)
      if (track?.id === id) { engine.stop(); setTrack(null); setPlaying(false) }
      if (t?.url) URL.revokeObjectURL(t.url)
      setUploads((u) => u.filter((x) => x.id !== id))
      songs.current.delete(id)
      if (mySongId === id) setMySongId(null)
      void deleteSong(id)
    },
    renameUpload: (id, title, artist) => {
      const clean = { title: title.trim() || 'Без названия', artist: artist.trim() }
      setUploads((u) => u.map((x) => (x.id === id ? { ...x, title: clean.title, artist: clean.artist || 'Моя песня' } : x)))
      if (track?.id === id) setTrack((t) => (t ? { ...t, title: clean.title, artist: clean.artist || 'Моя песня' } : t))
      const stored = songs.current.get(id)
      if (stored) { const upd = { ...stored, ...clean }; songs.current.set(id, upd); void saveSong(upd) }
    },
    mySongId,
    setMySong: setMySongId,
    close: () => { engine.stop(); setTrack(null); setPlaying(false); setExpanded(false) },
    library: baseQueue,
    uploads,
    shuffle,
    repeat,
    likes,
    toggleShuffle: () => setShuffle((v) => !v),
    cycleRepeat: () => setRepeat((r) => (r === 'all' ? 'one' : r === 'one' ? 'off' : 'all')),
    toggleLike: (id, t) => {
      const on = !likes.includes(id)
      setLikes((l) => (on ? [...l, id] : l.filter((x) => x !== id)))
      if (t?.source) setOnline((o) => (on ? [t, ...o.filter((x) => x.id !== id)] : o.filter((x) => x.id !== id)))
    },
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

function songTrack(s: StoredSong): Track {
  let h = 0
  for (const ch of s.id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return { id: s.id, title: s.title, artist: s.artist || 'Моя песня', genre: 'file', hue: Math.abs(h) % 360, bpm: 0, root: 0, bars: 0, url: URL.createObjectURL(s.blob), seconds: s.duration }
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
