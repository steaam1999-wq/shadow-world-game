import type { Track } from './engine'

// Источники, которые сами разрешают слушать треки на сторонних сайтах:
// Audius — полные треки независимых артистов, iTunes — официальные 30-секундные отрывки.
const APP = 'iskra'
const AUDIUS = 'https://api.audius.co/v1'
const LIMIT = 50

function hueOf(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 360
}

interface AudiusTrack { id: string; title: string; duration: number; is_streamable?: boolean; user?: { name?: string }; artwork?: Record<string, string> | null }
interface ItunesTrack { trackId: number; trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string; wrapperType?: string }

async function json<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(String(r.status))
  return (await r.json()) as T
}

const fromAudius = (list: AudiusTrack[]): Track[] => list.filter((t) => t.is_streamable !== false).map((t) => ({
  id: `au-${t.id}`, title: t.title, artist: t.user?.name ?? 'Audius', genre: 'file', source: 'audius', hue: hueOf(t.id),
  bpm: 0, root: 0, bars: 0, seconds: t.duration, cover: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
  url: `${AUDIUS}/tracks/${t.id}/stream?app_name=${APP}`,
}))

const fromItunes = (list: ItunesTrack[]): Track[] => list.filter((t) => t.previewUrl).map((t) => ({
  id: `it-${t.trackId}`, title: t.trackName, artist: t.artistName, genre: 'file', source: 'itunes', hue: hueOf(String(t.trackId)),
  bpm: 0, root: 0, bars: 0, seconds: 30, cover: t.artworkUrl100?.replace('100x100', '400x400'), url: t.previewUrl,
}))

export interface OnlineLists { full: Track[]; previews: Track[]; failed: string[] }

async function both(a: Promise<Track[]>, i: Promise<Track[]>): Promise<OnlineLists> {
  const [ra, ri] = await Promise.allSettled([a, i])
  return {
    full: ra.status === 'fulfilled' ? ra.value : [],
    previews: ri.status === 'fulfilled' ? ri.value : [],
    failed: [ra.status === 'rejected' && 'Audius', ri.status === 'rejected' && 'iTunes'].filter(Boolean) as string[],
  }
}

export function searchOnline(q: string, signal: AbortSignal) {
  const e = encodeURIComponent(q)
  return both(
    json<{ data: AudiusTrack[] }>(`${AUDIUS}/tracks/search?query=${e}&limit=${LIMIT}&app_name=${APP}`, signal).then((r) => fromAudius(r.data)),
    json<{ results: ItunesTrack[] }>(`https://itunes.apple.com/search?term=${e}&media=music&entity=song&limit=${LIMIT}`, signal).then((r) => fromItunes(r.results)),
  )
}

/** Что слушают сейчас: тренды Audius и чарт Apple Music (отрывки подтягиваются через lookup). */
export function trendingOnline(signal: AbortSignal) {
  const chart = json<{ feed: { results: { id: string }[] } }>(`https://rss.applemarketingtools.com/api/v2/us/music/most-played/${LIMIT}/songs.json`, signal)
    .then(async (r) => {
      const ids = r.feed.results.map((x) => x.id)
      const { results } = await json<{ results: ItunesTrack[] }>(`https://itunes.apple.com/lookup?id=${ids.join(',')}&entity=song`, signal)
      const byId = new Map(results.filter((x) => x.wrapperType !== 'artist').map((x) => [String(x.trackId), x]))
      return fromItunes(ids.map((id) => byId.get(id)).filter((x): x is ItunesTrack => !!x))
    })
  return both(
    json<{ data: AudiusTrack[] }>(`${AUDIUS}/tracks/trending?limit=${LIMIT}&app_name=${APP}`, signal).then((r) => fromAudius(r.data)),
    chart,
  )
}
