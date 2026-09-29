import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Avatar, Icon } from '../components/ui'
import { GENRE_LABEL, formatTime, personTrack, trackLabel, usePlayer } from './player'
import { searchOnline, trendingOnline, type OnlineLists } from './online'
import { Disc } from './PlayerUI'
import { MySongs } from './MySongs'
import { trackDuration, type Track } from './engine'

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
  const [query, setQuery] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const people = state.people.map((x) => ({ person: x, track: personTrack(x) }))
  const liked = p.library.filter((x) => p.likes.includes(x.id))
  const q = query.trim().toLowerCase()
  const spotify = parseEmbed(query)
  const all = q ? p.library.filter((x) => `${x.title} ${x.artist} ${GENRE_LABEL[x.genre]}`.toLowerCase().includes(q)) : []

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

      {spotify && <EmbedPlayer embed={spotify} />}
      {!spotify && q.length >= 2 && <OnlineSection key={q} title="В интернете" load={(sig) => searchOnline(q, sig)} delay={450} />}
      {!spotify && q.length >= 2 && (
        <div className="px-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">Искать также:</span>
          {[['Яндекс Музыка', `https://music.yandex.ru/search?text=${encodeURIComponent(query.trim())}`],
            ['Зайцев.нет', `https://zaycev.net/search?query_search=${encodeURIComponent(query.trim())}`],
            ['Spotify', `https://open.spotify.com/search/${encodeURIComponent(query.trim())}`]].map(([name, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-surface-2 font-semibold">{name} <Icon name="arrow" size={13} /></a>
          ))}
        </div>
      )}

      {!q && (
        <>
          <MySongs />
          <p className="-mt-3 px-4 text-[12px] text-muted">Есть ссылка на Яндекс Музыку или Spotify? Вставьте её в поиск — откроется их плеер.</p>
          <OnlineSection title="Сейчас в интернете" load={trendingOnline} fullLabel="В тренде · Audius, целиком" previewLabel="Топ-чарт · iTunes, отрывки по 30 секунд" radioLabel="Популярное радио · прямой эфир" />
          <section className="flex flex-col gap-3">
            <h2 className="px-4 font-display font-semibold text-xl">Песни людей рядом</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
              {people.map(({ person, track }) => {
                const cur = p.track?.id === track.id && p.playing
                return (
                  <button key={person.id} onClick={() => (cur ? p.toggle() : p.play(track, people.map((x) => x.track)))} className="flex flex-col items-center gap-1 w-[76px] shrink-0 cursor-pointer" aria-label={`Песня ${person.name}: ${track.title}`}>
                    <span className="relative">
                      <Avatar name={person.name} hue={person.hue} src={person.photo} size={64} />
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

      {!spotify && all.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-4 font-display font-semibold text-xl">В приложении <span className="text-muted font-normal tnum">· {all.length}</span></h2>
          <ul className="flex flex-col px-2">{all.map((x) => <TrackRow key={x.id} track={x} queue={all} />)}</ul>
        </section>
      )}
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
const YANDEX_RE = /(music\.yandex\.[a-z]+)\/(?:album\/(\d+)(?:\/track\/(\d+))?|users\/([^/?#]+)\/playlists\/(\d+)|track\/(\d+))/

interface Embed { name: string; src?: string; height: number; link: string }

function parseEmbed(text: string): Embed | null {
  const sp = SPOTIFY_RE.exec(text)
  if (sp) {
    const small = sp[1] === 'track' || sp[1] === 'episode'
    return { name: 'Spotify', src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?utm_source=generator`, height: small ? 152 : 380, link: `https://open.spotify.com/${sp[1]}/${sp[2]}` }
  }
  const ya = YANDEX_RE.exec(text)
  if (ya) {
    const [, host, album, track, user, kind, bareTrack] = ya
    const base = `https://${host}`
    if (album && track) return { name: 'Яндекс Музыка', src: `${base}/iframe/track/${track}/${album}`, height: 180, link: `${base}/album/${album}/track/${track}` }
    if (album) return { name: 'Яндекс Музыка', src: `${base}/iframe/album/${album}`, height: 450, link: `${base}/album/${album}` }
    if (user && kind) return { name: 'Яндекс Музыка', src: `${base}/iframe/playlist/${user}/${kind}`, height: 450, link: `${base}/users/${user}/playlists/${kind}` }
    // Для ссылки вида /track/ID плеер Яндекса требует ещё и номер альбома — открываем песню на их сайте.
    return { name: 'Яндекс Музыка', height: 0, link: `${base}/track/${bareTrack}` }
  }
  return null
}

/** Официальные встраиваемые плееры: целиком песни играют по подписке сервиса, иначе — отрывок. */
function EmbedPlayer({ embed }: { embed: Embed }) {
  return (
    <section className="flex flex-col gap-2 px-4">
      <h2 className="font-display font-semibold text-xl">{embed.name}</h2>
      {embed.src ? (
        <iframe title={`Плеер: ${embed.name}`} src={embed.src} className="w-full rounded-2xl border-0" height={embed.height} loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      ) : (
        <p className="text-muted">Эту ссылку нельзя открыть во встроенном плеере. Скопируйте ссылку на песню из альбома — или откройте её на сайте.</p>
      )}
      <a href={embed.link} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-1 text-[14px] font-semibold">Открыть в {embed.name === 'Spotify' ? 'Spotify' : 'Яндекс Музыке'} <Icon name="arrow" size={15} /></a>
      <p className="text-[12px] text-muted">Целиком песни играют, если вы вошли в {embed.name === 'Spotify' ? 'Spotify' : 'Яндекс Музыку'} с подпиской; иначе — отрывок. В приложении Claude плеер может не загрузиться — откройте сайт в браузере.</p>
    </section>
  )
}
