import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { Avatar, Chip, Icon } from '../components/ui'
import { Plate } from '../screens/Feed'
import { CATALOG, PLAYLISTS, playlistTracks, type Playlist } from './catalog'
import { GENRE_LABEL, formatTime, genreOf, personTrack, trackLabel, usePlayer } from './player'
import { searchOnline, trendingOnline, type OnlineLists } from './online'
import { Disc } from './PlayerUI'
import { MySongs } from './MySongs'
import { trackDuration, type Genre, type Track } from './engine'

function Cover({ hue, children, className = '' }: { hue: number; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(90% 80% at 20% 15%, hsl(${(hue + 40) % 360} 85% 72%), transparent 60%), radial-gradient(90% 90% at 90% 90%, hsl(${(hue + 320) % 360} 70% 50%), transparent 65%), hsl(${hue} 65% 58%)` }}>
      <div className="grain" />
      {children}
    </div>
  )
}

export function TrackRow({ track, queue, index }: { track: Track; queue: Track[]; index?: number }) {
  const p = usePlayer()
  const cur = p.track?.id === track.id
  const liked = p.likes.includes(track.id)
  return (
    <li className={`flex items-center gap-3 p-2 rounded-2xl ${cur ? 'bg-surface/80 shadow-soft' : ''}`}>
      <button onClick={() => (cur ? p.toggle() : p.play(track, queue))} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={`Слушать: ${track.title}`}>
        {index !== undefined && <span className="w-5 text-center text-[13px] text-muted font-mono tnum shrink-0">{index + 1}</span>}
        <Disc track={track} size={42} spinning={cur && p.playing} />
        <span className="min-w-0 flex-1">
          <span className={`block font-semibold text-[14px] truncate ${cur ? 'text-spark' : ''}`}>{track.title}</span>
          <span className="block text-[12px] text-muted truncate">{track.artist} · {trackLabel(track)}{track.genre !== 'file' ? ` · ${formatTime(trackDuration(track))}` : track.seconds ? ` · ${formatTime(track.seconds)}` : ''}</span>
        </span>
      </button>
      <button onClick={() => p.toggleLike(track.id, track)} className={`grid place-items-center w-9 h-9 rounded-full cursor-pointer shrink-0 ${liked ? 'text-spark' : 'text-muted'}`} aria-label={liked ? 'Убрать из любимых' : 'В любимые'} aria-pressed={liked}>
        <Icon name="heart" size={20} fill={liked} />
      </button>
    </li>
  )
}

export function MusicPage() {
  const { state } = useStore()
  const p = usePlayer()
  const me = state.me!
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<Genre | null>(null)
  const [open, setOpen] = useState<Playlist | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const myGenre = genreOf(me.answers)
  const people = state.people.map((x) => ({ person: x, track: personTrack(x) }))
  const forYou = useMemo(() => {
    const same = people.filter((x) => x.track.genre === myGenre).map((x) => x.track)
    return [...same, ...CATALOG.filter((x) => x.genre === myGenre || (myGenre === 'indie' && x.genre === 'lofi'))].slice(0, 8)
  }, [people, myGenre])
  const liked = p.library.filter((x) => p.likes.includes(x.id))
  const genres = Array.from(new Set(CATALOG.map((x) => x.genre))) as Genre[]
  const q = query.trim().toLowerCase()
  const spotify = parseSpotify(query)
  const all = p.library.filter((x) => (!genre || x.genre === genre) && (!q || `${x.title} ${x.artist} ${GENRE_LABEL[x.genre]}`.toLowerCase().includes(q)))

  if (open) {
    const tracks = playlistTracks(open, p.library)
    const total = tracks.reduce((a, x) => a + trackDuration(x), 0)
    return (
      <div className="flex flex-col gap-4 px-4 pt-2">
        <button onClick={() => setOpen(null)} className="self-start inline-flex items-center gap-1 h-9 -ml-2 px-2 rounded-full text-muted hover:text-fg cursor-pointer"><Icon name="back" size={18} /> Музыка</button>
        <Cover hue={open.hue} className="rounded-[28px] aspect-square max-w-full shadow-soft">
          <div className="absolute left-4 right-4 bottom-4 flex flex-col items-start gap-1">
            <Plate size="lg">{open.title}</Plate>
          </div>
        </Cover>
        <div>
          <p className="text-muted">{open.subtitle}</p>
          <p className="text-[13px] text-muted">{tracks.length} треков · {Math.round(total / 60)} мин · {open.genres.map((g) => GENRE_LABEL[g]).join(', ')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => tracks[0] && p.play(tracks[0], tracks)} className="flex-1 h-12 rounded-2xl bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-soft"><Icon name="play" size={18} fill /> Слушать</button>
          <button onClick={() => { if (!p.shuffle) p.toggleShuffle(); const r = tracks[Math.floor(Math.random() * tracks.length)]; if (r) p.play(r, tracks) }} className="flex-1 h-12 rounded-2xl bg-surface-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="shuffle" size={18} /> Вперемешку</button>
        </div>
        <ul className="flex flex-col -mx-2">{tracks.map((x, i) => <TrackRow key={x.id} track={x} queue={tracks} index={i} />)}</ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="px-4 flex gap-2">
        <label htmlFor="music-search" className="flex-1 flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={18} />
          <input id="music-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Трек, исполнитель, жанр" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
        </label>
        <button onClick={() => fileRef.current?.click()} className="grid place-items-center w-11 h-11 rounded-2xl bg-surface-2 cursor-pointer" aria-label="Загрузить свой трек"><Icon name="upload" size={20} /></button>
        <input ref={fileRef} id="music-file" type="file" accept="audio/*" multiple className="sr-only" onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) void p.addFiles(f); e.target.value = '' }} />
      </div>

      {spotify && <SpotifyEmbed type={spotify.type} id={spotify.id} />}
      {!spotify && q.length >= 2 && <OnlineSection key={q} title="В интернете" load={(sig) => searchOnline(q, sig)} delay={450} />}
      {!spotify && q.length >= 2 && (
        <a href={`https://open.spotify.com/search/${encodeURIComponent(query.trim())}`} target="_blank" rel="noopener noreferrer"
          className="mx-4 h-11 rounded-2xl bg-[#1DB954] text-black font-semibold text-[14px] inline-flex items-center justify-center gap-2">
          Найти «{query.trim()}» в Spotify <Icon name="arrow" size={16} />
        </a>
      )}
      {!spotify && q.length >= 2 && (
        <a href={`https://zaycev.net/search?query_search=${encodeURIComponent(query.trim())}`} target="_blank" rel="noopener noreferrer"
          className="mx-4 h-11 rounded-2xl bg-surface-2 font-semibold text-[14px] inline-flex items-center justify-center gap-2">
          <Icon name="search" size={17} /> Найти «{query.trim()}» на Зайцев.нет <Icon name="arrow" size={16} />
        </a>
      )}

      {!q && (
        <>
          <MySongs />
          <p className="-mt-3 px-4 text-[12px] text-muted">Есть ссылка на Spotify? Вставьте её в поиск — откроется плеер Spotify.</p>
          <OnlineSection title="Сейчас в интернете" load={trendingOnline} fullLabel="В тренде · Audius, целиком" previewLabel="Топ-чарт · iTunes, отрывки по 30 секунд" radioLabel="Популярное радио · прямой эфир" />
          <section className="flex flex-col gap-3">
            <div className="px-4 flex items-end justify-between">
              <div>
                <h2 className="font-display font-semibold text-xl">Для вас</h2>
                <p className="text-[13px] text-muted">По вашему вайбу: {GENRE_LABEL[myGenre].toLowerCase()} и люди с похожим вкусом</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 snap-x-mandatory">
              {forYou.map((x) => (
                <button key={x.id} onClick={() => p.play(x, forYou)} className="snap-start shrink-0 w-36 flex flex-col text-left cursor-pointer group">
                  <Cover hue={x.hue} className="rounded-[22px] aspect-square max-w-full shadow-soft">
                    <span className="absolute right-2 bottom-2 grid place-items-center w-10 h-10 rounded-full bg-white/90 text-[#111114] shadow-soft transition group-hover:scale-105">
                      <Icon name={p.track?.id === x.id && p.playing ? 'pause' : 'play'} size={16} fill />
                    </span>
                  </Cover>
                  <span className="block mt-2 font-semibold text-[14px] truncate">{x.title}</span>
                  <span className="block text-[12px] text-muted truncate">{x.artist}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3 px-4">
            <h2 className="font-display font-semibold text-xl">Плейлисты</h2>
            <div className="grid grid-cols-2 gap-3">
              {PLAYLISTS.map((pl) => (
                <button key={pl.id} onClick={() => setOpen(pl)} className="flex flex-col text-left cursor-pointer" aria-label={`Плейлист «${pl.title}»`}>
                  <Cover hue={pl.hue} className="rounded-[22px] aspect-square max-w-full shadow-soft">
                    <span className="absolute left-2.5 right-2.5 bottom-2.5"><Plate>{pl.title}</Plate></span>
                  </Cover>
                  <span className="block mt-1.5 text-[12px] text-muted">{pl.subtitle}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="px-4 font-display font-semibold text-xl">Песни людей рядом</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
              {people.map(({ person, track }) => {
                const cur = p.track?.id === track.id && p.playing
                return (
                  <button key={person.id} onClick={() => (cur ? p.toggle() : p.play(track, people.map((x) => x.track)))} className="flex flex-col items-center gap-1 w-[76px] shrink-0 cursor-pointer" aria-label={`Песня ${person.name}: ${track.title}`}>
                    <span className="relative">
                      <Avatar name={person.name} hue={person.hue} size={64} />
                      <span className="absolute -right-1 -bottom-1 grid place-items-center w-7 h-7 rounded-full bg-brand text-white border-2 border-surface"><Icon name={cur ? 'pause' : 'play'} size={12} fill /></span>
                    </span>
                    <span className="text-[12px] font-medium truncate w-full text-center">{person.name}</span>
                    <span className="text-[11px] text-muted truncate w-full text-center">{GENRE_LABEL[track.genre]}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {liked.length > 0 && (
            <section className="flex flex-col gap-2 px-4">
              <h2 className="font-display font-semibold text-xl">Любимые <span className="text-muted font-normal tnum">· {liked.length}</span></h2>
              <ul className="flex flex-col -mx-2">{liked.map((x) => <TrackRow key={x.id} track={x} queue={liked} />)}</ul>
            </section>
          )}
        </>
      )}

      {!spotify && <section className="flex flex-col gap-3">
        <h2 className="px-4 font-display font-semibold text-xl">{q ? 'Результаты' : 'Все треки'} <span className="text-muted font-normal tnum">· {all.length}</span></h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
          <Chip active={!genre} onClick={() => setGenre(null)}>Все</Chip>
          {genres.map((g) => <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? null : g)}>{GENRE_LABEL[g]}</Chip>)}
        </div>
        <ul className="flex flex-col px-2">{all.map((x) => <TrackRow key={x.id} track={x} queue={all} />)}</ul>
        {!all.length && <p className="px-4 text-muted">{q ? 'В приложении ничего не нашлось — смотрите результаты из интернета выше.' : 'Ничего не нашлось. Попробуйте другой запрос или загрузите свой трек.'}</p>}
      </section>}
    </div>
  )
}

type Online = { state: 'loading' } | ({ state: 'done' } & OnlineLists)

/** Музыка из интернета: Audius (полные треки) и iTunes (отрывки по 30 секунд). */
function OnlineSection({ title, load, delay = 0, fullLabel = 'Полные треки · Audius', previewLabel = 'Отрывки по 30 секунд · iTunes', radioLabel = 'Радиостанции · прямой эфир' }: {
  title: string; load: (signal: AbortSignal) => Promise<OnlineLists>; delay?: number; fullLabel?: string; previewLabel?: string; radioLabel?: string
}) {
  const [res, setRes] = useState<Online>({ state: 'loading' })
  const loadRef = useRef(load)
  useEffect(() => {
    const ctl = new AbortController()
    const t = setTimeout(() => {
      loadRef.current(ctl.signal).then((r) => { if (!ctl.signal.aborted) setRes({ state: 'done', ...r }) })
    }, delay)
    return () => { clearTimeout(t); ctl.abort() }
  }, [delay])

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <h2 className="px-4 font-display font-semibold text-xl flex items-center gap-2"><Icon name="globe" size={20} /> {title}</h2>
      {res.state === 'loading' && <p className="px-4 text-muted">Загружаем…</p>}
      {res.state === 'done' && (
        <>
          <OnlineList label={fullLabel} tracks={res.full} />
          <OnlineList label={previewLabel} tracks={res.previews} />
          <OnlineList label={radioLabel} tracks={res.radio} />
          {!res.full.length && !res.previews.length && !res.radio.length && (
            <p className="px-4 text-muted">
              {res.failed.length === 3 ? 'Не удалось связаться с музыкальными сервисами. Проверьте интернет; в превью Claude внешние сайты могут быть закрыты.' : 'В интернете ничего не нашлось.'}
            </p>
          )}
          {res.failed.length > 0 && res.failed.length < 3 && <p className="px-4 text-[12px] text-muted">Сейчас не отвечает: {res.failed.join(', ')}.</p>}
        </>
      )}
    </section>
  )
}

function OnlineList({ label, tracks }: { label: string; tracks: Track[] }) {
  const [all, setAll] = useState(false)
  if (!tracks.length) return null
  const shown = all ? tracks : tracks.slice(0, 6)
  return (
    <div className="flex flex-col gap-1">
      <p className="px-4 text-[13px] text-muted">{label} <span className="tnum">· {tracks.length}</span></p>
      <ul className="flex flex-col px-2">{shown.map((x) => <TrackRow key={x.id} track={x} queue={tracks} />)}</ul>
      {tracks.length > shown.length && (
        <button onClick={() => setAll(true)} className="mx-4 h-10 rounded-2xl bg-surface-2 font-semibold text-[14px] cursor-pointer">Показать все · {tracks.length}</button>
      )}
    </div>
  )
}

const SPOTIFY_RE = /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})/

function parseSpotify(text: string) {
  const m = SPOTIFY_RE.exec(text)
  return m ? { type: m[1], id: m[2] } : null
}

/** Официальный плеер Spotify: целиком для Premium после входа, остальным — отрывок. */
function SpotifyEmbed({ type, id }: { type: string; id: string }) {
  return (
    <section className="flex flex-col gap-2 px-4">
      <h2 className="font-display font-semibold text-xl">Spotify</h2>
      <iframe title="Плеер Spotify" src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`}
        className="w-full rounded-2xl border-0" height={type === 'track' || type === 'episode' ? 152 : 380} loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      <p className="text-[12px] text-muted">Полностью песни играют, если вы вошли в Spotify с подпиской Premium; иначе — отрывок. В приложении Claude плеер может не загрузиться — откройте сайт в браузере.</p>
    </section>
  )
}
