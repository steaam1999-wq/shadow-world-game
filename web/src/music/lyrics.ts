import type { Track } from './engine'

// LRCLIB — открытая база текстов песен, часто с таймингом строк (формат LRC).
export interface Lyrics { lines: { at: number | null; text: string }[]; synced: boolean; instrumental: boolean }
interface Hit { trackName: string; artistName: string; duration: number; instrumental: boolean; plainLyrics: string | null; syncedLyrics: string | null }

const cache = new Map<string, Lyrics | null>()

function parse(hit: Hit): Lyrics {
  if (hit.instrumental) return { lines: [], synced: false, instrumental: true }
  if (hit.syncedLyrics) {
    const lines = hit.syncedLyrics.split('\n').flatMap((row) => {
      const m = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(row.trim())
      return m ? [{ at: Number(m[1]) * 60 + Number(m[2]), text: m[3].trim() }] : []
    })
    if (lines.length) return { lines, synced: true, instrumental: false }
  }
  return { lines: (hit.plainLyrics ?? '').split('\n').map((text) => ({ at: null, text: text.trim() })), synced: false, instrumental: false }
}

/** Текст песни или null, если в базе его нет. Синтезированные треки Искры — без слов. */
export async function fetchLyrics(t: Track, signal: AbortSignal): Promise<Lyrics | null> {
  if (t.genre !== 'file') return { lines: [], synced: false, instrumental: true }
  const key = `${t.artist}|${t.title}`.toLowerCase()
  if (cache.has(key)) return cache.get(key)!
  const q = new URLSearchParams({ track_name: t.title, artist_name: t.artist })
  const r = await fetch(`https://lrclib.net/api/search?${q}`, { signal })
  if (!r.ok) throw new Error(String(r.status))
  const hits = ((await r.json()) as Hit[]).filter((h) => h.instrumental || h.plainLyrics || h.syncedLyrics)
  // Если знаем длительность — берём версию, ближайшую по длине: у неё совпадёт тайминг.
  const len = t.source === 'itunes' ? 0 : t.seconds ?? 0
  const best = len ? [...hits].sort((a, b) => Math.abs(a.duration - len) - Math.abs(b.duration - len))[0] : hits[0]
  const res = best ? parse(best) : null
  cache.set(key, res)
  return res
}
