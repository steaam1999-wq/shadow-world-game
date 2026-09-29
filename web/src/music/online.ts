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

interface AudiusTrack { id: string; title: string; duration: number; is_streamable?: boolean; is_downloadable?: boolean; download?: { is_downloadable?: boolean } | null; user?: { name?: string }; artwork?: Record<string, string> | null }
interface ItunesTrack { trackId: number; trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string; wrapperType?: string }

async function json<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(String(r.status))
  return (await r.json()) as T
}

const fromAudius = (list: AudiusTrack[]): Track[] => list.filter((t) => t.is_streamable !== false).map((t) => ({
  id: `au-${t.id}`, title: t.title, artist: t.user?.name ?? 'Audius', genre: 'file', source: 'audius', hue: hueOf(t.id),
  bpm: 0, root: 0, bars: 0, seconds: t.duration, cover: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
  url: `${AUDIUS}/tracks/${t.id}/stream?app_name=${APP}`, downloadable: !!(t.is_downloadable ?? t.download?.is_downloadable),
}))

const fromItunes = (list: ItunesTrack[]): Track[] => list.filter((t) => t.previewUrl).map((t) => ({
  id: `it-${t.trackId}`, title: t.trackName, artist: t.artistName, genre: 'file', source: 'itunes', hue: hueOf(String(t.trackId)),
  bpm: 0, root: 0, bars: 0, seconds: 30, cover: t.artworkUrl100?.replace('100x100', '400x400'), url: t.previewUrl,
}))

export interface OnlineLists { full: Track[]; previews: Track[]; radio: Track[]; failed: string[] }

async function both(a: Promise<Track[]>, i: Promise<Track[]>, r: Promise<Track[]>): Promise<OnlineLists> {
  const [ra, ri, rr] = await Promise.allSettled([a, i, r])
  return {
    full: ra.status === 'fulfilled' ? ra.value : [],
    previews: ri.status === 'fulfilled' ? ri.value : [],
    radio: rr.status === 'fulfilled' ? rr.value : [],
    failed: [ra.status === 'rejected' && 'Audius', ri.status === 'rejected' && 'iTunes', rr.status === 'rejected' && 'Radio Browser'].filter(Boolean) as string[],
  }
}

// Radio Browser — открытая база интернет-радио; у проекта несколько равноправных серверов.
const RADIO_HOSTS = ['de1', 'nl1', 'at1'].map((h) => `https://${h}.api.radio-browser.info/json`)
interface Station { stationuuid: string; name: string; url_resolved: string; favicon?: string; tags?: string; country?: string; hls?: number }

async function radio(path: string, signal: AbortSignal): Promise<Track[]> {
  let last: unknown
  for (const host of RADIO_HOSTS) {
    try {
      const list = await json<Station[]>(`${host}${path}`, signal)
      // Сайт открыт по https: поток по http браузер заблокирует.
      return list.filter((st) => st.url_resolved?.startsWith('https://') && !st.hls).slice(0, LIMIT).map((st) => ({
        id: `rb-${st.stationuuid}`, title: st.name.trim(), artist: st.tags?.split(',').slice(0, 2).join(', ') || st.country || 'Радио',
        genre: 'file', source: 'radio', hue: hueOf(st.stationuuid), bpm: 0, root: 0, bars: 0,
        cover: st.favicon?.startsWith('https://') ? st.favicon : undefined, url: st.url_resolved,
      }))
    } catch (e) {
      if (signal.aborted) throw e
      last = e
    }
  }
  throw last
}

export function searchOnline(q: string, signal: AbortSignal) {
  const e = encodeURIComponent(q)
  return both(
    json<{ data: AudiusTrack[] }>(`${AUDIUS}/tracks/search?query=${e}&limit=${LIMIT}&app_name=${APP}`, signal).then((r) => fromAudius(r.data)),
    json<{ results: ItunesTrack[] }>(`https://itunes.apple.com/search?term=${e}&media=music&entity=song&limit=${LIMIT}`, signal).then((r) => fromItunes(r.results)),
    radio(`/stations/search?name=${e}&order=clickcount&reverse=true&hidebroken=true&limit=100`, signal),
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
    radio('/stations/search?language=russian&order=clickcount&reverse=true&hidebroken=true&limit=100', signal),
  )
}
