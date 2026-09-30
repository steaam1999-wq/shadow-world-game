import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { Avatar, Icon } from '../components/ui'
import { GENRE_LABEL, formatTime, personTrack, trackLabel, usePlayer } from './player'
import { searchOnline, trendingOnline, type OnlineLists } from './online'
import { Artwork, Bars, Disc } from './PlayerUI'
import { MySongs } from './MySongs'
import { trackDuration, type Genre, type Track } from './engine'
import { GENRE_BPM } from './catalog'

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

// Подборки по настроению: треки собираются прямо в приложении, играют без интернета.
const MOODS: { id: string; name: string; emoji: string; genres: Genre[]; from: string; to: string }[] = [
  { id: 'calm', name: 'Спокойно', emoji: '☁️', genres: ['lofi', 'ambient', 'jazz'], from: '#6a85ff', to: '#9a74ff' },
  { id: 'walk', name: 'Для прогулки', emoji: '🚶', genres: ['indie', 'bossa', 'funk'], from: '#ffc457', to: '#ff7a45' },
  { id: 'party', name: 'Вечеринка', emoji: '🪩', genres: ['house', 'electro', 'dnb'], from: '#ff4f86', to: '#9a74ff' },
  { id: 'night', name: 'Вечер в городе', emoji: '🌆', genres: ['synthwave', 'hiphop', 'jazz'], from: '#14152a', to: '#ff4f86' },
]
const MIX_TITLES = ['Огни проспекта', 'Тёплый вечер', 'После дождя', 'Набережная', 'Кофе с собой', 'Последний трамвай']

function moodTracks(m: (typeof MOODS)[number]): Track[] {
  return MIX_TITLES.map((title, i) => {
    const g = m.genres[i % m.genres.length]
    return { id: `mix-${m.id}-${i}`, title, artist: `Match · ${m.name}`, genre: g, hue: (m.name.length * 37 + i * 53) % 360, bpm: GENRE_BPM[g], root: 52 + ((i * 3) % 9), bars: 40 }
  })
}

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер'
}

type Online = { state: 'loading' } | ({ state: 'done' } & OnlineLists)

/** Популярное в интернете: грузим один раз, с кнопкой «Повторить». */
function useTrending() {
  const [res, setRes] = useState<Online>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const ctl = new AbortController()
    setRes({ state: 'loading' })
    trendingOnline(ctl.signal).then((r) => { if (!ctl.signal.aborted) setRes({ state: 'done', ...r }) }).catch(() => { if (!ctl.signal.aborted) setRes({ state: 'done', full: [], previews: [], radio: [], failed: ['все'] }) })
    return () => ctl.abort()
  }, [attempt])
  return { res, retry: () => setAttempt((x) => x + 1) }
}

type Tab = 'home' | 'likes' | 'mine' | 'radio'

export function MusicPage() {
  const { state } = useStore()
  const p = usePlayer()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('home')
  const trending = useTrending()

  const people = state.people.map((x) => ({ person: x, track: personTrack(x) }))
  const liked = p.library.filter((x) => p.likes.includes(x.id))
  const q = query.trim().toLowerCase()
  const spotify = parseEmbed(query)
  const all = q ? p.library.filter((x) => `${x.title} ${x.artist} ${GENRE_LABEL[x.genre]}`.toLowerCase().includes(q)) : []
  const tabs: [Tab, string][] = [['home', 'Для вас'], ['likes', `Любимые${liked.length ? ` · ${liked.length}` : ''}`], ['mine', `Мои файлы${p.uploads.length ? ` · ${p.uploads.length}` : ''}`], ['radio', 'Радио']]
  const playAll = (list: Track[], shuffled = false) => {
    if (!list.length) return
    if (shuffled !== p.shuffle) p.toggleShuffle()
    p.play(shuffled ? list[Math.floor(Math.random() * list.length)] : list[0], list)
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="px-4 flex flex-col gap-3">
        <div>
          <h1 className="font-display font-bold text-[26px] leading-tight">{greeting()}</h1>
          <p className="text-[14px] text-muted">Что послушаем?</p>
        </div>
        <label htmlFor="music-search" className="flex items-center gap-2 h-12 rounded-full bg-surface shadow-soft px-4 text-muted">
          <Icon name="search" size={18} />
          <input id="music-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Песня, исполнитель или ссылка" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
          {query && <button onClick={() => setQuery('')} className="grid place-items-center w-7 h-7 rounded-full bg-surface-2 text-muted cursor-pointer" aria-label="Очистить поиск"><Icon name="x" size={14} /></button>}
        </label>
        {!q && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="tablist" aria-label="Разделы музыки">
            {tabs.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`shrink-0 h-9 px-4 rounded-full text-[14px] font-semibold cursor-pointer transition ${tab === id ? 'bg-fg text-bg' : 'bg-surface-2 text-fg'}`}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Поиск */}
      {spotify && <EmbedPlayer embed={spotify} />}
      {!spotify && q.length >= 2 && <OnlineSection key={q} title="В интернете" load={(sig) => searchOnline(q, sig)} delay={450} />}
      {!spotify && all.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-4 font-display font-semibold text-lg">В приложении <span className="text-muted font-normal tnum">· {all.length}</span></h2>
          <ul className="flex flex-col px-2">{all.map((x) => <TrackRow key={x.id} track={x} queue={all} />)}</ul>
        </section>
      )}
      {!spotify && q.length >= 2 && (
        <div className="px-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">Искать также:</span>
          {[['Яндекс Музыка', `https://music.yandex.ru/search?text=${encodeURIComponent(query.trim())}`],
            ['Spotify', `https://open.spotify.com/search/${encodeURIComponent(query.trim())}`]].map(([name, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-surface-2 font-semibold">{name} <Icon name="arrow" size={13} /></a>
          ))}
        </div>
      )}

      {!q && tab === 'home' && (
        <>
          {p.track && <NowCard />}
          <section className="flex flex-col gap-3 px-4" aria-label="Настроение">
            <h2 className="font-display font-semibold text-lg">Под настроение</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {MOODS.map((m) => {
                const list = moodTracks(m)
                const on = !!p.track && p.track.id.startsWith(`mix-${m.id}-`) && p.playing
                return (
                  <button key={m.id} onClick={() => (p.track?.id.startsWith(`mix-${m.id}-`) ? p.toggle() : playAll(list))} className="relative h-[100px] rounded-2xl p-3 text-left text-white overflow-hidden cursor-pointer active:scale-[.98] transition"
                    style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }} aria-label={on ? `Пауза: ${m.name}` : `Слушать подборку «${m.name}»`}>
                    <span className="block font-display font-bold text-[16px] leading-tight drop-shadow">{m.name}</span>
                    <span className="absolute right-2 bottom-1 text-[34px] leading-none opacity-90" aria-hidden="true">{m.emoji}</span>
                    <span className="absolute left-3 bottom-3 grid place-items-center w-7 h-7 rounded-full bg-white/25 backdrop-blur"><Icon name={on ? 'pause' : 'play'} size={13} fill /></span>
                  </button>
                )
              })}
            </div>
          </section>

          {liked.length > 0 && (
            <Shelf title="Ваши любимые" action={['Все', () => setTab('likes')]}>
              {liked.slice(0, 12).map((t) => <CoverCard key={t.id} track={t} queue={liked} />)}
            </Shelf>
          )}

          <Shelf title="Песни людей рядом">
            {people.map(({ person, track }) => (
              <CoverCard key={person.id} track={track} queue={people.map((x) => x.track)} subtitle={person.name}
                badge={<span className="absolute right-1.5 bottom-1.5 rounded-full ring-2 ring-surface"><Avatar name={person.name} hue={person.hue} src={person.photo} size={26} /></span>} />
            ))}
          </Shelf>

          <TrendingShelves res={trending.res} retry={trending.retry} />
          <p className="px-4 -mt-2 text-[12px] text-muted">Есть ссылка на Яндекс Музыку или Spotify? Вставьте её в поиск — откроется их плеер.</p>
        </>
      )}

      {!q && tab === 'likes' && (
        liked.length ? (
          <section className="flex flex-col gap-3 px-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => playAll(liked)} className="h-11 rounded-full bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="play" size={16} fill /> Слушать</button>
              <button onClick={() => playAll(liked, true)} className="h-11 rounded-full bg-surface-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="shuffle" size={16} /> Перемешать</button>
            </div>
            <ul className="flex flex-col -mx-2">{liked.map((x, i) => <TrackRow key={x.id} track={x} queue={liked} index={i} />)}</ul>
          </section>
        ) : (
          <Empty icon="heart" title="Пока нет любимых" text="Нажимайте ♡ у песен — они соберутся здесь и появятся в вашем профиле." action={['Найти музыку', () => setTab('home')]} />
        )
      )}

      {!q && tab === 'mine' && <MySongs />}

      {!q && tab === 'radio' && (
        trending.res.state === 'loading' ? <p className="px-4 text-muted">Загружаем радио…</p>
          : trending.res.radio.length ? (
            <ul className="flex flex-col px-2">{trending.res.radio.map((x) => <TrackRow key={x.id} track={x} queue={trending.res.state === 'done' ? trending.res.radio : []} />)}</ul>
          ) : <Empty icon="globe" title="Радио не отвечает" text="Проверьте интернет и попробуйте ещё раз." action={['Повторить', trending.retry]} />
      )}
    </div>
  )
}

/** Большая карточка «Сейчас играет» — открывает полный плеер. */
function NowCard() {
  const p = usePlayer()
  const t = p.track!
  return (
    <div className="mx-4 rounded-[24px] bg-surface shadow-soft p-3 flex items-center gap-3">
      <button onClick={() => p.setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label="Открыть плеер">
        <Artwork track={t} className="w-16 h-16 rounded-2xl" />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-spark">{p.playing && <Bars />} {p.playing ? 'Сейчас играет' : 'На паузе'}</span>
          <span className="block font-semibold truncate">{t.title}</span>
          <span className="block text-[13px] text-muted truncate">{t.artist}</span>
        </span>
      </button>
      <button onClick={p.toggle} className="grid place-items-center w-12 h-12 rounded-full bg-brand text-white cursor-pointer shrink-0" aria-label={p.playing ? 'Пауза' : 'Играть'}><Icon name={p.playing ? 'pause' : 'play'} size={20} fill /></button>
    </div>
  )
}

/** Горизонтальная полка с обложками. */
function Shelf({ title, action, children }: { title: string; action?: [string, () => void]; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="px-4 flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        {action && <button onClick={action[1]} className="text-[14px] font-semibold text-spark cursor-pointer">{action[0]}</button>}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">{children}</div>
    </section>
  )
}

function CoverCard({ track, queue, subtitle, badge }: { track: Track; queue: Track[]; subtitle?: string; badge?: ReactNode }) {
  const p = usePlayer()
  const cur = p.track?.id === track.id
  return (
    <button onClick={() => (cur ? p.toggle() : p.play(track, queue))} className="w-[132px] shrink-0 flex flex-col gap-1.5 text-left cursor-pointer" aria-label={cur && p.playing ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}>
      <span className="relative block">
        <Artwork track={track} className="w-[132px] h-[132px] rounded-2xl shadow-soft" />
        <span className={`absolute left-2 bottom-2 grid place-items-center w-9 h-9 rounded-full text-white backdrop-blur ${cur ? 'bg-spark' : 'bg-black/35'}`}><Icon name={cur && p.playing ? 'pause' : 'play'} size={15} fill /></span>
        {badge}
      </span>
      <span className={`block text-[13px] font-semibold leading-tight line-clamp-2 ${cur ? 'text-spark' : ''}`}>{track.title}</span>
      <span className="block text-[12px] text-muted truncate -mt-1">{subtitle ?? track.artist}</span>
    </button>
  )
}

function TrendingShelves({ res, retry }: { res: Online; retry: () => void }) {
  if (res.state === 'loading') {
    return (
      <Shelf title="Популярное сейчас">
        {Array.from({ length: 4 }).map((_, i) => <span key={i} className="w-[132px] h-[132px] shrink-0 rounded-2xl bg-surface-2 animate-pulse" />)}
      </Shelf>
    )
  }
  if (!res.full.length && !res.previews.length) {
    return (
      <div className="mx-4 rounded-2xl bg-surface-2 p-4 flex items-center gap-3">
        <Icon name="globe" size={22} />
        <span className="flex-1 text-[14px] text-muted">Популярное из интернета сейчас не загрузилось. Проверьте подключение.</span>
        <button onClick={retry} className="h-9 px-3 rounded-full bg-surface font-semibold text-[13px] cursor-pointer">Повторить</button>
      </div>
    )
  }
  return (
    <>
      {res.full.length > 0 && <Shelf title="В тренде">{res.full.slice(0, 15).map((t) => <CoverCard key={t.id} track={t} queue={res.full} />)}</Shelf>}
      {res.previews.length > 0 && <Shelf title="Топ-чарт · отрывки">{res.previews.slice(0, 15).map((t) => <CoverCard key={t.id} track={t} queue={res.previews} />)}</Shelf>}
    </>
  )
}

function Empty({ icon, title, text, action }: { icon: string; title: string; text: string; action?: [string, () => void] }) {
  return (
    <div className="mx-4 rounded-[24px] bg-surface shadow-soft p-6 flex flex-col items-center gap-2 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-full bg-surface-2"><Icon name={icon} size={24} /></span>
      <p className="font-display font-bold text-lg">{title}</p>
      <p className="text-[14px] text-muted">{text}</p>
      {action && <button onClick={action[1]} className="mt-1 h-10 px-4 rounded-full bg-brand text-white font-semibold cursor-pointer">{action[0]}</button>}
    </div>
  )
}

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
      <h2 className="px-4 font-display font-semibold text-lg flex items-center gap-2"><Icon name="globe" size={18} /> {title}</h2>
      {res.state === 'loading' && <p className="px-4 text-muted">Ищем…</p>}
      {res.state === 'done' && (
        <>
          <OnlineList label={fullLabel} tracks={res.full} />
          <OnlineList label={previewLabel} tracks={res.previews} />
          <OnlineList label={radioLabel} tracks={res.radio} />
          {!res.full.length && !res.previews.length && !res.radio.length && (
            <p className="px-4 text-muted">{res.failed.length === 3 ? 'Музыкальные сервисы не ответили. Проверьте подключение к интернету.' : 'В интернете ничего не нашлось.'}</p>
          )}
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
      <p className="text-[12px] text-muted">Целиком песни играют, если вы вошли в {embed.name === 'Spotify' ? 'Spotify' : 'Яндекс Музыку'} с подпиской; иначе — отрывок.</p>
    </section>
  )
}
