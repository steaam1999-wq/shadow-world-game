import type { Track } from './engine'

// Источники, которые сами разрешают слушать треки на сторонних сайтах:
// Audius — полные треки независимых артистов, iTunes — официальные 30-секундные отрывки.
const APP = 'iskra'
const AUDIUS = 'https://api.audius.co/v1'

function hueOf(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 360
}

interface AudiusTrack { id: string; title: string; duration: number; is_streamable?: boolean; user?: { name?: string }; artwork?: Record<string, string> | null }
interface ItunesTrack { trackId: number; trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string }

async function audius(q: string, signal: AbortSignal): Promise<Track[]> {
  const r = await fetch(`${AUDIUS}/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP}`, { signal })
  if (!r.ok) throw new Error(String(r.status))
  const { data } = (await r.json()) as { data: AudiusTrack[] }
  return data.filter((t) => t.is_streamable !== false).slice(0, 15).map((t) => ({
    id: `au-${t.id}`, title: t.title, artist: t.user?.name ?? 'Audius', genre: 'file', source: 'audius', hue: hueOf(t.id),
    bpm: 0, root: 0, bars: 0, seconds: t.duration, cover: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
    url: `${AUDIUS}/tracks/${t.id}/stream?app_name=${APP}`,
  }))
}

async function itunes(q: string, signal: AbortSignal): Promise<Track[]> {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=15`, { signal })
  if (!r.ok) throw new Error(String(r.status))
  const { results } = (await r.json()) as { results: ItunesTrack[] }
  return results.filter((t) => t.previewUrl).map((t) => ({
    id: `it-${t.trackId}`, title: t.trackName, artist: t.artistName, genre: 'file', source: 'itunes', hue: hueOf(String(t.trackId)),
    bpm: 0, root: 0, bars: 0, seconds: 30, cover: t.artworkUrl100?.replace('100x100', '400x400'), url: t.previewUrl,
  }))
}

export async function searchOnline(q: string, signal: AbortSignal) {
  const [a, i] = await Promise.allSettled([audius(q, signal), itunes(q, signal)])
  return {
    full: a.status === 'fulfilled' ? a.value : [],
    previews: i.status === 'fulfilled' ? i.value : [],
    failed: [a.status === 'rejected' && 'Audius', i.status === 'rejected' && 'iTunes'].filter(Boolean) as string[],
  }
}
