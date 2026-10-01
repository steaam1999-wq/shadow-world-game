import { useStore } from '../store'
import { Icon } from '../components/ui'
import { Artwork } from './PlayerUI'
import { GENRE_BPM } from './catalog'
import { genreOf, personTrack, trackLabel, usePlayer } from './player'
import type { Genre, Track } from './engine'
import type { Person } from '../types'
import { useTaste } from './taste'

// В демо у людей нет настоящих сохранённых песен — показываем по несколько сгенерированных треков.
const DEMO_TITLES = ['Утро на районе', 'Последний трамвай', 'Кофе с корицей', 'Огни набережной', 'Дождь по крышам', 'Субботний сет']
const DEMO_GENRES: Genre[] = ['lofi', 'synthwave', 'house', 'bossa', 'funk', 'ambient']

function demoSongs(p: Person): Track[] {
  const seed = p.hue + (p.age ?? 0)
  const own = personTrack(p)
  const extra = [0, 1, 2].map((i) => {
    const g = i === 0 ? genreOf(p.answers) : DEMO_GENRES[(seed + i * 2) % DEMO_GENRES.length]
    return { id: `demo-${p.id}-${i}`, title: DEMO_TITLES[(seed + i) % DEMO_TITLES.length], artist: ['Kometa Radio', 'Night Drive', 'Studio 7'][i], genre: g, hue: (p.hue + 70 * (i + 1)) % 360, bpm: GENRE_BPM[g], root: 52 + ((seed + i) % 9), bars: 40 }
  })
  return [own, ...extra]
}

export function songsOf(p: Person, cloud: boolean) {
  return cloud ? (p.songs ?? []) : (p.songs?.length ? p.songs : demoSongs(p))
}

/** Сохранённые песни другого человека: слушать и добавлять себе в «Любимые». */
export function PersonSongs({ person }: { person: Person }) {
  const { state } = useStore()
  const player = usePlayer()
  const taste = useTaste()(person)
  const common = new Set(taste.songs.map((t) => t.id))
  // Общие песни — сверху.
  const songs = [...songsOf(person, !!state.cloud)].sort((a, b) => Number(common.has(b.id)) - Number(common.has(a.id)))

  if (!songs.length) return <p className="py-10 px-6 text-center text-muted text-[14px]">{person.name} пока не сохранял(а) песни. Любимые песни из раздела «Музыка» появляются здесь.</p>
  return (
    <ul className="flex flex-col px-3">
      {songs.map((t) => {
        const current = player.track?.id === t.id
        const liked = player.likes.includes(t.id)
        return (
          <li key={t.id} className={`flex items-center gap-3 p-2 rounded-2xl ${current ? 'bg-surface-2' : ''}`}>
            <button onClick={() => (current ? player.toggle() : player.play(t, songs))} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={current && player.playing ? `Пауза: ${t.title}` : `Слушать: ${t.title}`}>
              <span className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden">
                <Artwork track={t} className="w-full h-full" />
                <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><Icon name={current && player.playing ? 'pause' : 'play'} size={18} fill /></span>
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block font-semibold truncate ${current ? 'text-spark' : ''}`}>{t.title}</span>
                <span className="block text-[13px] text-muted truncate">{common.has(t.id) && <span className="text-spark font-semibold">У вас тоже · </span>}{t.artist} · {trackLabel(t)}</span>
              </span>
            </button>
            {t.source && (
              <button onClick={() => player.toggleLike(t.id, t)} className={`grid place-items-center w-10 h-10 rounded-full cursor-pointer ${liked ? 'text-danger' : 'text-muted hover:text-fg'}`}
                aria-label={liked ? 'Убрать из моих любимых' : 'Добавить в мои любимые'} aria-pressed={liked}>
                <Icon name="heart" size={20} fill={liked} />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
