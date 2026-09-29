import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { relative } from '../lib'
import { Avatar, Button, Field, Icon, Sheet, inputCls } from '../components/ui'
import { LikeButton } from '../components/LikeButton'
import { deleteShort, humanError, uploadShort } from '../cloud/api'
import { requestReload } from '../cloud/sync'
import type { Short } from '../types'

// Шортсы: короткие вертикальные видео на весь экран. С сервером — общие для всех,
// в демо — только ваши, хранятся в этом браузере.

const MAX_MB = 50
const MAX_SEC = 60
const CAPTION_MAX = 200

// ——— Демо: видео в IndexedDB ———
interface StoredShort { id: string; caption: string; at: number; blob: Blob; kind?: 'video' | 'photo' }
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('iskra-shorts', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('shorts', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function idbRun<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
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
    demoList.forEach((x) => URL.revokeObjectURL(x.url))
    demoList = all.sort((a, b) => b.at - a.at).map((x) => ({ id: x.id, authorId: 'me', url: URL.createObjectURL(x.blob), caption: x.caption, at: x.at, kind: x.kind ?? 'video' }))
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

const HEARTS_KEY = 'iskra-short-hearts'
function useHearts() {
  const [hearts, setHearts] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(HEARTS_KEY) ?? '[]') } catch { return [] } })
  useEffect(() => { try { localStorage.setItem(HEARTS_KEY, JSON.stringify(hearts.slice(-500))) } catch { /* ignore */ } }, [hearts])
  return [hearts, (id: string) => setHearts((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))] as const
}

/** Лента шортсов. `onMessage` — написать автору. */
export function ShortsFeed({ onMessage }: { onMessage: (personId: string) => void }) {
  const list = usePublications().filter((s) => s.kind === 'video')
  const [muted, setMuted] = useState(true)
  const [hearts, toggleHeart] = useHearts()
  const [uploading, setUploading] = useState(false)

  return (
    <>
      {list.map((s) => (
        <ShortItem key={s.id} s={s} muted={muted} onToggleMute={() => setMuted((m) => !m)} hearted={hearts.includes(s.id)} onHeart={() => toggleHeart(s.id)}
          onMessage={onMessage} />
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

function ShortItem({ s, muted, onToggleMute, hearted, onHeart, onMessage }: {
  s: Short; muted: boolean; onToggleMute: () => void; hearted: boolean; onHeart: () => void; onMessage: (personId: string) => void
}) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const video = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const mine = s.authorId === 'me'
  const author = usePublicationAuthor(s)

  // Играет только то видео, которое сейчас на экране.
  useEffect(() => {
    const el = box.current, v = video.current
    if (!el || !v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > 0.6) { v.play().then(() => setPaused(false)).catch(() => setPaused(true)) } else { v.pause() }
    }, { threshold: [0, 0.6, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [s.url])
  useEffect(() => { if (video.current) video.current.muted = muted }, [muted])

  const tap = () => {
    const v = video.current
    if (!v) return
    if (v.paused) { void v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
  }

  const remove = useRemovePublication(s)


  return (
    <section ref={box} className="relative h-full snap-start snap-always overflow-hidden text-white bg-black" aria-label={s.caption || 'Шортс'}>
      <video ref={video} src={s.url} className="absolute inset-0 w-full h-full object-cover" loop playsInline muted={muted} preload="metadata" onClick={tap} />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      {paused && <span className="absolute inset-0 grid place-items-center pointer-events-none"><span className="grid place-items-center w-20 h-20 rounded-full bg-black/35 backdrop-blur"><Icon name="play" size={36} fill /></span></span>}

      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-5 drop-shadow">
        <LikeButton liked={hearted} onToggle={onHeart} size={30} className="gap-1" />
        {!mine && author && (
          <button onClick={() => onMessage(author.id)} className="flex flex-col items-center gap-1 cursor-pointer" aria-label={`Написать ${author.name}`}>
            <Icon name="chat" size={30} /><span className="text-[12px] font-semibold">Написать</span>
          </button>
        )}
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1 cursor-pointer" aria-label={muted ? 'Включить звук' : 'Выключить звук'} aria-pressed={!muted}>
          <Icon name={muted ? 'soundOff' : 'sound'} size={28} />
        </button>
        {(mine || state.isAdmin) && (
          <button onClick={() => setConfirm(true)} className="flex flex-col items-center gap-1 cursor-pointer" aria-label="Удалить шортс"><Icon name="trash" size={26} /></button>
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

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Удалить шортс?">
        <div className="flex flex-col gap-3 text-fg">
          <p className="text-muted">Видео удалится для всех, вернуть его нельзя.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirm(false)}>Отмена</Button>
            <Button variant="danger" onClick={() => { setConfirm(false); void remove() }}>Удалить</Button>
          </div>
        </div>
      </Sheet>
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
function compressPhoto(file: File): Promise<Blob> {
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

function readVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve(isFinite(v.duration) ? v.duration : 0)
    v.onerror = () => resolve(-1)
    v.src = url
  })
}

/** Новая публикация: фото или видео с подписью. Видео до 60 с попадает и в «Шортсы». */
export function NewPublication({ open, kind, onClose, onDone }: { open: boolean; kind?: 'video' | 'photo'; onClose: () => void; onDone: () => void }) {
  const { state } = useStore()
  const [file, setFile] = useState<Blob | null>(null)
  const [fileKind, setFileKind] = useState<'video' | 'photo'>('video')
  const [preview, setPreview] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const accept = kind === 'video' ? 'video/mp4,video/quicktime,video/webm,video/*' : kind === 'photo' ? 'image/*' : 'image/*,video/mp4,video/quicktime,video/webm,video/*'

  useEffect(() => {
    if (open) return
    setFile(null); setCaption(''); setError(''); setBusy(false)
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return null })
  }, [open])

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    const isPhoto = f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)
    if (isPhoto) {
      if (kind === 'video') { setError('Для шортса нужно видео.'); return }
      try {
        const blob = await compressPhoto(f)
        setPreview((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(blob) })
        setFile(blob); setFileKind('photo'); setDuration(0)
      } catch { setError('Не получилось открыть фото. Выберите JPG или PNG.') }
      return
    }
    if (f.type && !f.type.startsWith('video/')) { setError('Нужно фото или видео.'); return }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Видео больше ${MAX_MB} МБ. Обрежьте его или снимите в 1080p — на iPhone: Настройки → Камера → Запись видео.`); return }
    const url = URL.createObjectURL(f)
    const d = await readVideoDuration(url)
    if (d < 0) { URL.revokeObjectURL(url); setError('Браузер не может открыть это видео. Попробуйте MP4.'); return }
    if (d > MAX_SEC + 0.5) { URL.revokeObjectURL(url); setError(`Видео длиннее ${MAX_SEC} секунд. Обрежьте его в «Фото» и попробуйте снова.`); return }
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return url })
    setFile(f); setFileKind('video'); setDuration(d)
  }

  const publish = async () => {
    if (!file) return
    setBusy(true); setError('')
    try {
      if (state.cloud) {
        await uploadShort(state.cloud.userId, file, caption.trim(), Math.round(duration * 10) / 10, fileKind)
        requestReload()
      } else {
        await idbRun('readwrite', (s) => s.put({ id: crypto.randomUUID(), caption: caption.trim(), at: Date.now(), blob: file, kind: fileKind } satisfies StoredShort))
        await reloadDemoPublications()
      }
      onDone()
    } catch (e) {
      const m = (e as { message?: string })?.message ?? ''
      setError(/exceeded|too large|413/i.test(m) ? `Файл больше ${MAX_MB} МБ.` : /mime|type/i.test(m) ? 'Этот формат не подходит. Нужно фото (JPG, PNG) или видео (MP4, MOV).' : humanError(e))
      setBusy(false)
    }
  }

  const what = kind === 'video' ? 'видео' : kind === 'photo' ? 'фото' : 'фото или видео'
  return (
    <Sheet open={open} onClose={() => { if (!busy) onClose() }} title={kind === 'video' ? 'Новый шортс' : 'Новая публикация'}>
      <div className="flex flex-col gap-4">
        {preview ? (
          <div className={`relative mx-auto rounded-2xl overflow-hidden bg-black ${fileKind === 'photo' ? 'w-full max-w-[320px]' : 'w-44 aspect-[9/16]'}`}>
            {fileKind === 'photo' ? <img src={preview} alt="Предпросмотр" className="w-full max-h-[50vh] object-contain" /> : <video src={preview} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
            {fileKind === 'video' && <span className="absolute left-2 bottom-2 rounded-full bg-black/50 text-white text-[12px] px-2 tnum">{Math.round(duration)} с</span>}
          </div>
        ) : (
          <button onClick={() => input.current?.click()} className="mx-auto w-44 aspect-[9/16] rounded-2xl border-2 border-dashed border-line grid place-items-center text-muted cursor-pointer hover:border-cobalt">
            <span className="flex flex-col items-center gap-2 px-3 text-center text-[13px]"><Icon name="camera" size={30} /> Выбрать или снять {what}</span>
          </button>
        )}
        <input ref={input} type="file" accept={accept} className="sr-only" onChange={(e) => void pick(e)} aria-label={`Выбрать ${what}`} />
        {preview && <Button variant="ghost" className="self-center" onClick={() => input.current?.click()} disabled={busy}>Выбрать другое</Button>}
        <p className="text-[12px] text-muted text-center -mt-2">{kind === 'photo' ? 'Фото появится на главной.' : `Видео до ${MAX_SEC} секунд и ${MAX_MB} МБ — появится на главной и в «Шортсах».`}</p>
        <Field id="short-caption" label="Подпись">
          <textarea id="short-caption" className={`${inputCls} h-20 py-2 resize-none`} value={caption} maxLength={CAPTION_MAX} onChange={(e) => setCaption(e.target.value)} placeholder="Что происходит? Можно позвать людей с собой" />
        </Field>
        {!state.cloud && <p className="text-[12px] text-muted">Демо-режим: публикация сохранится только в этом браузере.</p>}
        {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
        <Button onClick={() => void publish()} disabled={!file || busy} className="h-12">{busy ? 'Загружаем…' : 'Опубликовать'}</Button>
      </div>
    </Sheet>
  )
}

/** Публикация в ленте главной: фото или видео с подписью. */
export function FeedPublication({ s, onMessage }: { s: Short; onMessage: (personId: string) => void }) {
  const openProfile = useOpenProfile()
  const author = usePublicationAuthor(s)
  const [hearts, toggleHeart] = useHearts()
  const remove = useRemovePublication(s)
  const { state } = useStore()
  const [confirm, setConfirm] = useState(false)
  const [muted, setMuted] = useState(true)
  const video = useRef<HTMLVideoElement>(null)
  const mine = s.authorId === 'me'

  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio > 0.6) void v.play().catch(() => {}); else v.pause() }, { threshold: [0, 0.6] })
    io.observe(v)
    return () => io.disconnect()
  }, [s.url])
  useEffect(() => { if (video.current) video.current.muted = muted }, [muted])

  return (
    <article className="flex flex-col gap-2.5 pb-5" aria-label={s.caption || 'Публикация'}>
      <header className="flex items-center gap-2.5 px-4">
        <button onClick={() => { if (author && author.id !== 'me') openProfile(author.id) }} className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer">
          <Avatar name={author?.name ?? '?'} hue={author?.hue ?? 0} src={author?.photo} size={36} verified={author?.verified} />
          <span className="min-w-0">
            <span className="block font-semibold text-[14px] truncate">{author?.name ?? 'Кто-то'}</span>
            <span className="block text-[12px] text-muted">{relative(s.at, Date.now())}</span>
          </span>
        </button>
        {(mine || state.isAdmin) && <button onClick={() => setConfirm(true)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-danger cursor-pointer" aria-label="Удалить публикацию"><Icon name="trash" size={18} /></button>}
      </header>
      <div className="relative bg-black">
        {s.kind === 'photo'
          ? <img src={s.url} alt={s.caption || 'Фото'} className="w-full max-h-[75vh] object-contain" loading="lazy" onDoubleClick={() => { if (!hearts.includes(s.id)) toggleHeart(s.id) }} />
          : (
            <>
              <video ref={video} src={s.url} className="w-full max-h-[75vh] object-contain" loop playsInline muted preload="metadata" onClick={() => setMuted((m) => !m)} />
              <button onClick={() => setMuted((m) => !m)} className="absolute right-3 bottom-3 grid place-items-center w-8 h-8 rounded-full bg-black/50 text-white cursor-pointer" aria-label={muted ? 'Включить звук' : 'Выключить звук'}><Icon name={muted ? 'soundOff' : 'sound'} size={16} /></button>
            </>
          )}
      </div>
      <div className="flex items-center gap-4 px-4">
        <LikeButton liked={hearts.includes(s.id)} onToggle={() => toggleHeart(s.id)} size={26} />
        {!mine && author && <button onClick={() => onMessage(author.id)} className="cursor-pointer" aria-label={`Написать ${author.name}`}><Icon name="chat" size={26} /></button>}
      </div>
      {s.caption && <p className="px-4 text-[14px] whitespace-pre-wrap break-words"><span className="font-semibold">{author?.name}</span> {s.caption}</p>}
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Удалить публикацию?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">Публикация удалится для всех, вернуть её нельзя.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirm(false)}>Отмена</Button>
            <Button variant="danger" onClick={() => { setConfirm(false); void remove() }}>Удалить</Button>
          </div>
        </div>
      </Sheet>
    </article>
  )
}
