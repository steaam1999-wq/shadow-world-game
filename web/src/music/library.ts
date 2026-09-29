// Мои песни: аудиофайлы хранятся в IndexedDB этого браузера и переживают перезагрузку.
// Хранилище может быть недоступно (приватный режим, запрет сайта) — тогда песни живут до перезагрузки.

export interface StoredSong {
  id: string
  title: string
  artist: string
  duration: number // секунды, 0 — неизвестно
  addedAt: number
  blob: Blob
}

const DB = 'iskra-music'
const STORE = 'songs'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function loadSongs(): Promise<StoredSong[]> {
  try {
    const all = await tx<StoredSong[]>('readonly', (s) => s.getAll() as IDBRequest<StoredSong[]>)
    return all.sort((a, b) => b.addedAt - a.addedAt)
  } catch {
    return []
  }
}

/** Сохраняет песню; возвращает false, если браузер не дал места. */
export async function saveSong(song: StoredSong): Promise<boolean> {
  try { await tx('readwrite', (s) => s.put(song)); return true } catch { return false }
}

export async function deleteSong(id: string) {
  try { await tx('readwrite', (s) => s.delete(id)) } catch { /* уже нет */ }
}

/** «Исполнитель — Название.mp3» → { artist, title }; без тире всё имя идёт в название. */
export function parseFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim()
  const m = base.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: '', title: base }
}

/** Длительность файла по метаданным; 0, если браузер не смог прочитать. */
export function readDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const a = new Audio()
    const done = (d: number) => { URL.revokeObjectURL(url); resolve(isFinite(d) ? d : 0) }
    a.preload = 'metadata'
    a.onloadedmetadata = () => done(a.duration)
    a.onerror = () => done(0)
    setTimeout(() => done(0), 4000)
    a.src = url
  })
}
