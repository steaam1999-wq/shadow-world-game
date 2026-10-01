import { engine, type Track } from './engine'

/** Почему трек нельзя скачать, или null, если можно. */
export function downloadBlock(t: Track): string | null {
  if (t.source === 'itunes') return 'Это отрывок из iTunes — Apple не разрешает его скачивать.'
  if (t.source === 'soundcloud') return 'Трек SoundCloud слушается через их плеер — скачать можно только на самом SoundCloud, если автор разрешил.'
  if (t.source === 'radio') return 'Это прямой эфир радио — его нельзя скачать.'
  if (t.source === 'audius' && !t.downloadable) return 'Автор на Audius не разрешил скачивать этот трек.'
  return null
}

const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'track'

/** Готовит файл; сохраняет его пользователь нажатием на ссылку — так Safari не блокирует скачивание. */
export async function prepareDownload(t: Track): Promise<{ url: string; name: string }> {
  let blob: Blob
  if (t.genre !== 'file') blob = await engine.renderWav(t)
  else {
    const r = await fetch(t.url!)
    if (!r.ok) throw new Error(String(r.status))
    blob = await r.blob()
  }
  const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('mp4') || blob.type.includes('aac') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('flac') ? 'flac' : 'mp3'
  return { url: URL.createObjectURL(blob), name: `${safe(t.artist)} - ${safe(t.title)}.${ext}` }
}
