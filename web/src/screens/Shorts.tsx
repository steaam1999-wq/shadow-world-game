import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { relative } from '../lib'
import { Avatar, Button, ConfirmSheet, Icon, Sheet } from '../components/ui'
import { LikeButton } from '../components/LikeButton'
import { deleteShort, humanError, setShortThumb } from '../cloud/api'
import { requestReload } from '../cloud/sync'
import type { Person, Short } from '../types'
import type { Track } from '../music/engine'
import { ReportSheet } from './Vibe'
import { ShortCommentsSheet, useShortComments } from '../components/Comments'
import { NewPublication } from './Composer'
import { filterOf, filterStyle } from '../components/storyFilters'
import { usePlayer } from '../music/player'
import { PlaneSend } from '../components/ShareButton'

// Шортсы: короткие вертикальные видео на весь экран. С сервером — общие для всех,
// в демо — только ваши, хранятся в этом браузере.

const MAX_SEC = 60

// ——— Демо: видео в IndexedDB ———
export interface StoredShort { id: string; caption: string; at: number; blob: Blob; kind?: 'video' | 'photo'; thumb?: Blob | null; filter?: string; music?: Track; place?: string }
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('iskra-shorts', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('shorts', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
export async function idbRun<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction('shorts', mode).objectStore('shorts'))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Общий список демо-публикаций: главная и шортсы видят одно и то же.
let demoList: Short[] = []
const demoListeners = new Set<(l: Short[]) => void>()
let demoLoaded = false
export async function reloadDemoPublications() {
  try {
    const all = await idbRun<StoredShort[]>('readonly', (s) => s.getAll() as IDBRequest<StoredShort[]>)
    demoList.forEach((x) => { URL.revokeObjectURL(x.url); if (x.thumb) URL.revokeObjectURL(x.thumb) })
    demoList = all.sort((a, b) => b.at - a.at).map((x) => ({ id: x.id, authorId: 'me', url: URL.createObjectURL(x.blob), caption: x.caption, at: x.at, kind: x.kind ?? 'video', ...(x.thumb ? { thumb: URL.createObjectURL(x.thumb) } : {}), ...(x.filter ? { filter: x.filter } : {}), ...(x.music ? { music: x.music } : {}), ...(x.place ? { place: x.place } : {}) }))
  } catch { demoList = [] }
  demoLoaded = true
  demoListeners.forEach((l) => l(demoList))
}

/** Все публикации (видео и фото): с сервера или из браузера в демо. */
export function usePublications() {
  const { state } = useStore()
  const [demo, setDemo] = useState<Short[]>(demoList)
  useEffect(() => {
    if (state.cloud) return
    demoListeners.add(setDemo)
    if (!demoLoaded) void reloadDemoPublications()
    return () => { demoListeners.delete(setDemo) }
  }, [state.cloud])
  return state.cloud ? (state.shorts ?? []) : demo
}

/** Лайки публикаций: в облаке — на сервере со счётчиком, в демо — в этом браузере. */
function useHearts() {
  const { state, dispatch } = useStore()
  const hearts = state.shortHearts ?? []
  return [hearts, (id: string) => dispatch({ type: 'toggleShortHeart', shortId: id }), (id: string) => state.likeCounts?.[id] ?? (hearts.includes(id) ? 1 : 0)] as const
}

/** Лента шортсов. */
export function ShortsFeed() {
  const list = usePublications().filter((s) => s.kind === 'video')
  const [muted, setMuted] = useState(true)
  const autoMute = useCallback(() => setMuted(true), [])
  const [hearts, toggleHeart, likesOf] = useHearts()
  const [uploading, setUploading] = useState(false)

  return (
    <>
      {list.map((s) => (
        <ShortItem key={s.id} s={s} muted={muted} onToggleMute={() => setMuted((m) => !m)} onAutoMute={autoMute} hearted={hearts.includes(s.id)} likes={likesOf(s.id)} onHeart={() => toggleHeart(s.id)} />
      ))}
      {!list.length && (
        <div className="h-full snap-start grid place-items-center text-white/80 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Icon name="reels" size={44} />
            <p className="text-[17px] font-semibold text-white">Шортсов пока нет</p>
            <p className="text-[14px]">Снимите короткое видео до {MAX_SEC} секунд: место, настроение, куда зовёте.</p>
            <Button onClick={() => setUploading(true)}><Icon name="plus" size={18} /> Добавить шортс</Button>
          </div>
        </div>
      )}
      <button onClick={() => setUploading(true)} className="fixed z-20 right-[max(12px,calc(50%-228px))] top-[calc(10px+env(safe-area-inset-top,0px))] grid place-items-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white cursor-pointer" aria-label="Добавить шортс">
        <Icon name="plus" size={22} />
      </button>
      <NewPublication open={uploading} kind="video" onClose={() => setUploading(false)} onDone={() => setUploading(false)} />
    </>
  )
}

function ShortItem({ s, muted, onToggleMute, onAutoMute, hearted, likes, onHeart }: {
  s: Short; muted: boolean; onToggleMute: () => void; onAutoMute: () => void; hearted: boolean; likes: number; onHeart: () => void
}) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const video = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const mine = s.authorId === 'me'
  const [reporting, setReporting] = useState<Person | null>(null)
  const author = usePublicationAuthor(s)

  const [comments, setComments] = useState(false)
  const commentCount = useShortComments(s.id).length
  const [portrait, setPortrait] = useState(true)
  const visible = useRef(false)

  // iPhone запускает видео сам только без звука и с атрибутом muted в разметке — ставим его вручную.
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '')
  }, [])

  // Играет то видео, которое на экране. Не получилось с первого раза — пробуем, как только загрузится.
  const tryPlay = useCallback(() => {
    const v = video.current
    if (!v || !visible.current) return
    v.muted = muted
    v.play().then(() => setPaused(false)).catch(() => {
      // Со звуком без касания браузер не даёт — запускаем без звука.
      if (!v.muted) { v.muted = true; onAutoMute(); v.play().then(() => setPaused(false)).catch(() => setPaused(true)) } else setPaused(true)
    })
  }, [muted, onAutoMute])
  useEffect(() => {
    const el = box.current, v = video.current
    if (!el || !v) return
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting && e.intersectionRatio > 0.6
      if (visible.current) { v.preload = 'auto'; tryPlay() } else { v.pause(); if (e.intersectionRatio === 0) v.currentTime = 0 }
    }, { threshold: [0, 0.6, 1] })
    io.observe(el)
    const onReady = () => { if (visible.current && v.paused) tryPlay() }
    v.addEventListener('loadeddata', onReady)
    v.addEventListener('canplay', onReady)
    return () => { io.disconnect(); v.removeEventListener('loadeddata', onReady); v.removeEventListener('canplay', onReady) }
  }, [s.url, tryPlay])
  useEffect(() => { if (video.current) video.current.muted = muted }, [muted])

  const tap = () => {
    const v = video.current
    if (!v) return
    if (v.paused) { void v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
  }

  const remove = useRemovePublication(s)


  return (
    <section ref={box} className="relative h-full snap-start snap-always overflow-hidden text-white bg-black" aria-label={s.caption || 'Шортс'}>
      {/* Горизонтальное видео — целиком, по краям размытая копия; вертикальное — на весь экран. */}
      {!portrait && (s.thumb
        ? <img src={s.thumb} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" aria-hidden="true" />
        : <video src={s.url} className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />)}
      <video ref={video} src={s.url} poster={s.thumb} style={filterStyle(s.filter)} className={`absolute inset-0 w-full h-full ${portrait ? 'object-cover' : 'object-contain'}`} loop playsInline muted preload="metadata" onClick={tap}
        onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setPortrait(v.videoHeight / v.videoWidth >= 1.3) }} />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      {paused && <span className="absolute inset-0 grid place-items-center pointer-events-none"><span className="grid place-items-center w-20 h-20 rounded-full bg-black/35 backdrop-blur"><Icon name="play" size={36} fill /></span></span>}

      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-5 drop-shadow">
        <LikeButton liked={hearted} onToggle={onHeart} size={30} className="gap-1">{likes > 0 && <span className="text-[12px] font-semibold tnum">{likes}</span>}</LikeButton>
        <button onClick={() => setComments(true)} className="flex flex-col items-center gap-1 cursor-pointer" aria-label="Комментарии">
          <Icon name="comment" size={30} />{commentCount > 0 && <span className="text-[12px] font-semibold tnum">{commentCount}</span>}
        </button>
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1 cursor-pointer" aria-label={muted ? 'Включить звук' : 'Выключить звук'} aria-pressed={!muted}>
          <Icon name={muted ? 'soundOff' : 'sound'} size={28} />
        </button>
        {(mine || state.isAdmin) && (
          <button onClick={() => setConfirm(true)} className="flex flex-col items-center gap-1 cursor-pointer" aria-label="Удалить шортс"><Icon name="trash" size={26} /></button>
        )}
        {!mine && author && author.id !== 'me' && (
          <button onClick={() => setReporting(author as Person)} className="flex flex-col items-center gap-1 cursor-pointer" aria-label="Пожаловаться на шортс"><Icon name="flag" size={24} /></button>
        )}
      </div>

      <div className="absolute left-0 right-16 bottom-0 p-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-2">
        {author && (
          <button onClick={() => { if (author.id !== 'me') openProfile(author.id) }} className="self-start flex items-center gap-2.5 cursor-pointer">
            <Avatar name={author.name} hue={author.hue} src={author.photo} size={34} verified={author.verified} />
            <span className="font-semibold">{author.name}</span>
            <span className="text-[12px] text-white/70">{relative(s.at, Date.now())}</span>
          </button>
        )}
        {s.caption && <p className="text-[15px] leading-snug whitespace-pre-wrap break-words drop-shadow">{s.caption}</p>}
      </div>

      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} title="Удалить шортс?" text="Видео исчезнет у всех. Вернуть его будет нельзя." action="Удалить" onConfirm={() => { setConfirm(false); void remove() }} />
      <div className="text-fg"><ReportSheet person={reporting} shortId={s.id} onClose={() => setReporting(null)} /></div>
      <ShortCommentsSheet short={s} open={comments} onClose={() => setComments(false)} />
    </section>
  )
}

export function usePublicationAuthor(s: Short) {
  const { state } = useStore()
  if (s.authorId === 'me') return state.me ? { id: 'me', name: state.me.name, hue: state.me.hue, photo: state.me.photo, verified: state.me.verified } : null
  return state.people.find((p) => p.id === s.authorId) ?? null
}

export function useRemovePublication(s: Short) {
  const { state, dispatch } = useStore()
  return async () => {
    try {
      if (state.cloud) { await deleteShort(s.id, s.path); requestReload() }
      else { await idbRun('readwrite', (st) => st.delete(s.id)); await reloadDemoPublications() }
    } catch (e) { dispatch({ type: 'cloudError', message: humanError(e) }) }
  }
}

/** Фото уменьшаем до 1440 px и сохраняем в JPEG: так оно быстро грузится у всех. */
export function compressPhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 1440 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('photo'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('photo')) }
    img.src = url
  })
}

export function readVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve(isFinite(v.duration) ? v.duration : 0)
    v.onerror = () => resolve(-1)
    v.src = url
  })
}

/** Кадр из видео для превью (JPEG до 480 px). iPhone часто не показывает первый кадр в <video>, поэтому храним картинку. */
export function videoFrame(src: string, remote = false): Promise<Blob | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    let done = false
    const finish = (b: Blob | null) => { if (done) return; done = true; clearTimeout(timer); v.pause(); v.removeAttribute('src'); v.load(); resolve(b) }
    const timer = setTimeout(() => finish(null), 15000)
    const draw = () => {
      if (!v.videoWidth || !v.videoHeight) return finish(null)
      const k = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k)
      try {
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
        c.toBlob((b) => finish(b), 'image/jpeg', 0.8)
      } catch { finish(null) }
    }
    if (remote) v.crossOrigin = 'anonymous'
    v.muted = true; v.playsInline = true; v.preload = 'auto'
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '')
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 2) }
    v.onseeked = () => draw()
    v.onerror = () => finish(null)
    v.src = src
    // Safari не грузит кадры без воспроизведения — запускаем без звука и сразу останавливаем.
    void v.play().then(() => v.pause()).catch(() => {})
  })
}

/** Превью своих старых видео: создаём один раз, когда автор открывает профиль. */
const thumbTried = new Set<string>()
function useBackfillThumbs(list: Short[]) {
  const { state } = useStore()
  const userId = state.cloud?.userId
  useEffect(() => {
    if (!userId) return
    const todo = list.filter((s) => s.authorId === 'me' && s.kind === 'video' && !s.thumb && !thumbTried.has(s.id))
    if (!todo.length) return
    let stop = false
    void (async () => {
      let made = false
      for (const s of todo) {
        if (stop) break
        thumbTried.add(s.id)
        const b = await videoFrame(s.url, true)
        if (b) { try { await setShortThumb(userId, s.id, b); made = true } catch { /* не страшно: останется видео */ } }
      }
      if (made) requestReload()
    })()
    return () => { stop = true }
  }, [userId, list])
}

export { NewPublication } from './Composer'

/** Песня публикации: плашка поверх фото, нажатие включает её. */
function MusicTag({ track }: { track: Track }) {
  const player = usePlayer()
  const on = player.track?.id === track.id && player.playing
  return (
    <button onClick={() => (player.track?.id === track.id ? player.toggle() : player.play(track, [track]))} className="absolute left-3 bottom-3 max-w-[70%] inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/55 backdrop-blur text-white text-[12px] font-semibold cursor-pointer" aria-label={on ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}>
      <Icon name={on ? 'pause' : 'note'} size={13} fill={on} /><span className="truncate">{track.title} · {track.artist}</span>
    </button>
  )
}

/** Публикация в ленте главной: фото или видео с подписью. */
export function FeedPublication({ s, onMessage }: { s: Short; onMessage: (personId: string) => void }) {
  const openProfile = useOpenProfile()
  const author = usePublicationAuthor(s)
  const [hearts, toggleHeart, likesOf] = useHearts()
  const remove = useRemovePublication(s)
  const { state, dispatch } = useStore()
  const [confirm, setConfirm] = useState(false)
  const [muted, setMuted] = useState(true)
  const video = useRef<HTMLVideoElement>(null)
  const mine = s.authorId === 'me'
  const [comments, setComments] = useState(false)
  const commentCount = useShortComments(s.id).length
  const [reporting, setReporting] = useState<Person | null>(null)
  const [share, setShare] = useState(false)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio > 0.6) void v.play().catch(() => {}); else v.pause() }, { threshold: [0, 0.6] })
    io.observe(v)
    return () => io.disconnect()
  }, [s.url])
  useEffect(() => { if (video.current) video.current.muted = muted }, [muted])

  return (
    <article data-pub={s.id} className="flex flex-col gap-2.5 pb-5 scroll-mt-20 rounded-2xl transition-shadow" aria-label={s.caption || 'Публикация'}>
      <header className="flex items-center gap-2.5 px-4">
        <button onClick={() => { if (author && author.id !== 'me') openProfile(author.id) }} className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer">
          <Avatar name={author?.name ?? '?'} hue={author?.hue ?? 0} src={author?.photo} size={36} verified={author?.verified} />
          <span className="min-w-0">
            <span className="block font-semibold text-[14px] truncate">{author?.name ?? 'Кто-то'}</span>
            <span className="block text-[12px] text-muted truncate">{s.place ? `📍 ${s.place} · ` : ''}{relative(s.at, Date.now())}</span>
          </span>
        </button>
        {(mine || state.isAdmin) && <button onClick={() => setConfirm(true)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-danger cursor-pointer" aria-label="Удалить публикацию"><Icon name="trash" size={18} /></button>}
        {!mine && author && author.id !== 'me' && <button onClick={() => setReporting(author as Person)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-danger cursor-pointer" aria-label="Пожаловаться на публикацию"><Icon name="flag" size={18} /></button>}
      </header>
      <div className="relative bg-black">
        {s.kind === 'photo'
          ? <img src={s.url} alt={s.caption || 'Фото'} className="w-full max-h-[75vh] object-contain" style={filterStyle(s.filter)} onError={() => requestReload()} onDoubleClick={() => { if (!hearts.includes(s.id)) toggleHeart(s.id) }} />
          : (
            <>
              <video ref={(el) => { video.current = el; if (el) { el.muted = muted; el.setAttribute('muted', ''); el.setAttribute('playsinline', '') } }} src={s.url} poster={s.thumb} className="w-full max-h-[75vh] object-contain" style={filterStyle(s.filter)} loop playsInline muted preload="metadata" onClick={() => setMuted((m) => !m)} />
              <button onClick={() => setMuted((m) => !m)} className="absolute right-3 bottom-3 grid place-items-center w-8 h-8 rounded-full bg-black/50 text-white cursor-pointer" aria-label={muted ? 'Включить звук' : 'Выключить звук'}><Icon name={muted ? 'soundOff' : 'sound'} size={16} /></button>
            </>
          )}
        {filterOf(s.filter).overlay && <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: filterOf(s.filter).overlay }} />}
        {s.music && <MusicTag track={s.music} />}
      </div>
      <div className="flex items-center gap-4 px-4">
        <LikeButton liked={hearts.includes(s.id)} onToggle={() => toggleHeart(s.id)} size={26} />
        {likesOf(s.id) > 0 && <span className="-ml-2 text-[14px] font-semibold tnum">{likesOf(s.id)}</span>}
        <button onClick={() => setComments(true)} className="inline-flex items-center gap-1 cursor-pointer" aria-label="Комментарии"><Icon name="comment" size={26} />{commentCount > 0 && <span className="text-[14px] font-semibold tnum">{commentCount}</span>}</button>
        <PlaneSend excludeId={s.authorId} size={25} className="w-7 h-7" label="Поделиться публикацией" onMore={() => setShare(true)}
          onSend={(p) => dispatch({ type: 'directMessage', personId: p.id, capsuleId: crypto.randomUUID(), text: pubMessage(s, author?.name) })} />
      </div>
      {s.caption && <p className="px-4 text-[14px] whitespace-pre-wrap break-words"><span className="font-semibold">{author?.name}</span> {s.caption}</p>}
      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} title="Удалить публикацию?" text="Публикация исчезнет у всех. Вернуть её будет нельзя." action="Удалить" onConfirm={() => { setConfirm(false); void remove() }} />
      <ReportSheet person={reporting} shortId={s.id} onClose={() => setReporting(null)} />
      <ShortCommentsSheet short={s} open={comments} onClose={() => setComments(false)} />
      <PublicationShare s={s} authorName={author?.name} open={share} onClose={() => setShare(false)} onMessage={onMessage} />
    </article>
  )
}

/** Ссылка на публикацию: открывает Match и прокручивает ленту к ней. */
export const publicationLink = (id: string) => `${location.origin}${location.pathname}#pub=${id}`
const pubText = (s: Short, authorName?: string) => (s.caption ? `${authorName ? authorName + ': ' : ''}${s.caption}` : `Публикация${authorName ? ' ' + authorName : ''} в Match`)
const pubMessage = (s: Short, authorName?: string) => `Смотри публикацию: ${pubText(s, authorName).slice(0, 140)}\n${publicationLink(s.id)}`

/** «Поделиться»: отправить в чат, скопировать ссылку или текст, системное меню телефона. */
function PublicationShare({ s, authorName, open, onClose, onMessage }: { s: Short; authorName?: string; open: boolean; onClose: () => void; onMessage: (personId: string) => void }) {
  const { state, dispatch } = useStore()
  const [toast, setToast] = useState<string | null>(null)
  const [sent, setSent] = useState<string[]>([])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (open) setSent([]) }, [open])
  const link = publicationLink(s.id)
  const text = pubText(s, authorName)
  // Сначала те, с кем больше переписки.
  const people = state.people
    .filter((p) => p.id !== s.authorId)
    .map((p) => ({ p, n: state.capsules.filter((c) => c.personId === p.id).reduce((n, c) => n + c.messages.length, 0) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 12)
    .map((x) => x.p)

  const copy = async (value: string, done: string) => {
    try { await navigator.clipboard.writeText(value); setToast(done) } catch { setToast('Не удалось скопировать') }
  }
  const sendTo = (p: Person) => {
    dispatch({ type: 'directMessage', personId: p.id, capsuleId: crypto.randomUUID(), text: pubMessage(s, authorName) })
    setSent((x) => [...x, p.id])
    setToast(`Отправлено: ${p.name}`)
  }
  const shareOut = async () => {
    try {
      if (navigator.share) {
        // Фото отправляем файлом, если телефон умеет — тогда его можно сохранить или переслать в любой мессенджер.
        if (s.kind === 'photo') {
          try {
            const blob = await (await fetch(s.url)).blob()
            const file = new File([blob], 'match.jpg', { type: blob.type || 'image/jpeg' })
            if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text}\n${link}` }); onClose(); return }
          } catch (e) { if ((e as Error).name === 'AbortError') return }
        }
        await navigator.share({ title: 'Match', text, url: link }); onClose(); return
      }
    } catch (e) { if ((e as Error).name === 'AbortError') return }
    await copy(link, 'Ссылка скопирована')
  }

  return createPortal(
    <>
      <Sheet open={open} onClose={onClose} title="Поделиться">
        <div className="flex flex-col gap-4">
          {people.length > 0 && (
            <div className="-mx-5 px-5 flex gap-3 overflow-x-auto pb-1" aria-label="Отправить в чат">
              {people.map((p) => {
                const done = sent.includes(p.id)
                return (
                  <button key={p.id} onClick={() => { if (!done) sendTo(p) }} className="flex flex-col items-center gap-1 w-[64px] shrink-0 cursor-pointer" aria-label={done ? `Отправлено ${p.name}` : `Отправить ${p.name}`}>
                    <span className="relative">
                      <Avatar name={p.name} hue={p.hue} src={p.photo} size={56} />
                      {done && <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-6 h-6 rounded-full bg-brand text-white ring-2 ring-surface"><Icon name="check" size={13} /></span>}
                    </span>
                    <span className="text-[12px] truncate w-full text-center">{p.name}</span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { void copy(link, 'Ссылка скопирована') }} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-2 text-[13px] font-medium cursor-pointer"><Icon name="link" size={22} />Ссылка</button>
            <button onClick={() => { void copy(s.caption ? `${s.caption}\n${link}` : link, 'Текст скопирован') }} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-2 text-[13px] font-medium cursor-pointer"><Icon name="copy" size={22} />Копировать</button>
            <button onClick={() => { void shareOut() }} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-2 text-[13px] font-medium cursor-pointer"><Icon name="share" size={22} />Ещё…</button>
          </div>
          {s.authorId !== 'me' && authorName && (
            <button onClick={() => { onClose(); onMessage(s.authorId) }} className="h-11 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer inline-flex items-center justify-center gap-2"><Icon name="chat" size={18} /> Написать {authorName}</button>
          )}
        </div>
      </Sheet>
      {toast && <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[95] rounded-full bg-fg text-bg px-4 h-10 inline-flex items-center text-[14px] font-medium shadow-soft" role="status">{toast}</div>}
    </>,
    document.body,
  )
}

/** Плитка сетки. Картинка растянута через absolute: в Safari `h-full` внутри блока с aspect-ratio даёт нулевую высоту. */
function Tile({ s }: { s: Short }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [s.url, s.thumb])
  const img = s.kind === 'photo' ? s.url : s.thumb
  if (img && !broken) return <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" style={filterStyle(s.filter)} decoding="async" onError={() => { setBroken(true); requestReload() }} />
  if (s.kind === 'video') return <video src={`${s.url}#t=0.1`} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
  return <span className="absolute inset-0 grid place-items-center text-muted"><Icon name="camera" size={22} /></span>
}

/** Сетка публикаций человека в профиле: фото и видео. `mine` — показать плитку «добавить». */
export function ProfilePublications({ authorId, onMessage }: { authorId: string; onMessage: (personId: string) => void }) {
  const list = usePublications().filter((s) => s.authorId === authorId)
  const [open, setOpen] = useState<Short | null>(null)
  const [adding, setAdding] = useState(false)
  const mine = authorId === 'me'
  useBackfillThumbs(list)
  return (
    <>
      <div className="grid grid-cols-3 gap-1 px-1">
        {list.map((s) => (
          <button key={s.id} onClick={() => setOpen(s)} className="relative block w-full aspect-[3/4] rounded-lg overflow-hidden bg-surface-2 cursor-pointer" aria-label={s.caption || (s.kind === 'video' ? 'Видео' : 'Фото')}>
            <Tile s={s} />
            {s.kind === 'video' && <span className="absolute right-1.5 top-1.5 text-white drop-shadow"><Icon name="reels" size={18} /></span>}
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="py-10 px-6 flex flex-col items-center gap-3 text-center">
          <span className="grid place-items-center w-16 h-16 rounded-full border-2 border-fg"><Icon name="camera" size={28} /></span>
          <p className="font-display font-bold text-lg">Пока нет фото и видео</p>
          {mine && <p className="text-[13px] text-muted">Нажмите «+» внизу → «Публикация», чтобы добавить первое.</p>}
          {mine && <Button variant="secondary" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Добавить</Button>}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Публикация">
          <button className="absolute inset-0 bg-black/60 cursor-default" aria-label="Закрыть" onClick={() => setOpen(null)} />
          <div className="anim-rise relative w-full max-w-[480px] max-h-[92%] overflow-y-auto bg-surface rounded-t-[28px] sm:rounded-[28px] pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" />
            <FeedPublication s={open} onMessage={(id) => { setOpen(null); onMessage(id) }} />
          </div>
        </div>
      )}
      <NewPublication open={adding} onClose={() => setAdding(false)} onDone={() => setAdding(false)} />
    </>
  )
}
