import { useStore } from '../store'
import { usePlayer } from './player'
import { songsOf } from './PersonSongs'
import type { Track } from './engine'
import type { Person } from '../types'

// Музыкальное совпадение: общие песни и исполнители между мной и другим человеком.

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, ' ').trim()
const key = (t: Track) => `${norm(t.artist)}|${norm(t.title)}`
// Сборные «исполнители» каталога и радио — не настоящий вкус человека.
const NOT_ARTISTS = new Set(['', 'match radio', 'night drive', 'studio 7', 'радио', 'неизвестный исполнитель'])

export interface Taste { songs: Track[]; artists: string[]; score: number }

export function tasteMatch(mine: Track[], myLikedIds: string[], theirs: Track[]): Taste {
  const ids = new Set([...mine.map((t) => t.id), ...myLikedIds])
  const keys = new Set(mine.map(key))
  const songs = theirs.filter((t) => ids.has(t.id) || keys.has(key(t)))
  const myArtists = new Set(mine.map((t) => norm(t.artist)).filter((a) => !NOT_ARTISTS.has(a)))
  const artists = [...new Map(theirs.filter((t) => myArtists.has(norm(t.artist))).map((t) => [norm(t.artist), t.artist])).values()]
  return { songs, artists, score: songs.length * 3 + artists.length }
}

/** Совпадение моего вкуса с человеком. */
export function useTaste() {
  const { state } = useStore()
  const player = usePlayer()
  const mine = state.me?.songs ?? []
  return (p: Person) => tasteMatch(mine, player.likes, songsOf(p, !!state.cloud))
}

export function tasteLine(t: Taste) {
  const parts: string[] = []
  if (t.songs.length) parts.push(`${t.songs.length} ${t.songs.length === 1 ? 'общая песня' : t.songs.length < 5 ? 'общие песни' : 'общих песен'}`)
  if (t.artists.length) parts.push(`слушаете ${t.artists.slice(0, 2).join(', ')}${t.artists.length > 2 ? ` и ещё ${t.artists.length - 2}` : ''}`)
  return parts.join(' · ')
}
