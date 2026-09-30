import { useEffect, useState } from 'react'
import { Button, Icon, Sheet } from '../components/ui'
import { Artwork, Bars } from './PlayerUI'
import { formatTime, slimTrack, trackLabel, usePlayer } from './player'
import { searchOnline } from './online'
import type { Track } from './engine'
import type { PlanMusic } from '../types'

// Музыка к плану: 15 секунд любой песни из интернета (Audius — целиком, iTunes — 30-секундный отрывок).
export const CLIP = 15

// Один общий проигрыватель отрывков: включили у одного плана — у другого остановилось.
let audio: HTMLAudioElement | null = null
let owner: string | null = null
let stopAt = 0
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function stopClip() {
  audio?.pause()
  owner = null
  notify()
}

function playClip(key: string, m: PlanMusic) {
  if (!m.track.url) return
  if (!audio) {
    audio = new Audio()
    audio.addEventListener('timeupdate', () => { if (audio && audio.currentTime >= stopAt) stopClip() })
    audio.addEventListener('ended', stopClip)
    audio.addEventListener('pause', () => { if (owner) { owner = null; notify() } })
  }
  const a = audio
  owner = key
  stopAt = m.start + CLIP
  const start = () => { a.currentTime = m.start; void a.play().catch(stopClip) }
  if (a.src !== m.track.url) { a.src = m.track.url; a.addEventListener('loadedmetadata', start, { once: true }); a.load() } else start()
  notify()
}

function useClip(key: string) {
  const [, force] = useState(0)
  useEffect(() => { const l = () => force((n) => n + 1); listeners.add(l); return () => { listeners.delete(l) } }, [])
  return owner === key
}

/** Кнопка «♫ Песня · Исполнитель» у плана: нажали — играет 15 секунд, ещё раз — стоп. */
export function PlanMusicChip({ id, music, light = false }: { id: string; music: PlanMusic; light?: boolean }) {
  const player = usePlayer()
  const on = useClip(id)
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (on) { stopClip(); return }
    if (player.playing) player.toggle() // основной плеер ставим на паузу, чтобы не играло два трека
    playClip(id, music)
  }
  return (
    <button onClick={toggle} aria-label={on ? `Остановить: ${music.track.title}` : `Послушать 15 секунд: ${music.track.title}`} aria-pressed={on}
      className={`inline-flex items-center gap-1.5 max-w-full rounded-full px-3 h-7 text-[12px] font-medium cursor-pointer ${light ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-surface-2 hover:brightness-95'}`}>
      <Icon name={on ? 'pause' : 'note'} size={13} className={light ? '' : 'text-spark'} fill={on} />
      <span className="truncate">{music.track.title} · {music.track.artist}</span>
      {on && <Bars />}
    </button>
  )
}

/** Выбор музыки при создании плана: поиск песни и отрывок на 15 секунд. */
export function PlanMusicPicker({ value, onChange }: { value?: PlanMusic; onChange: (m: PlanMusic | undefined) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <>
          <PlanMusicChip id="new-plan" music={value} />
          <button type="button" onClick={() => setOpen(true)} className="text-[13px] font-semibold text-cobalt cursor-pointer shrink-0">Изменить</button>
          <button type="button" onClick={() => { stopClip(); onChange(undefined) }} className="text-[13px] font-semibold text-danger cursor-pointer shrink-0">Убрать</button>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-surface-2 text-[14px] font-semibold cursor-pointer hover:brightness-95">
          <Icon name="note" size={18} className="text-spark" /> Добавить музыку · 15 сек
        </button>
      )}
      <MusicSheet open={open} initial={value} onClose={() => setOpen(false)} onDone={(m) => { onChange(m); setOpen(false) }} />
    </div>
  )
}

function MusicSheet({ open, initial, onClose, onDone }: { open: boolean; initial?: PlanMusic; onClose: () => void; onDone: (m: PlanMusic) => void }) {
  const player = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[] | null>(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<Track | null>(initial?.track ?? null)
  const [start, setStart] = useState(initial?.start ?? 0)
  const [length, setLength] = useState(initial?.track.seconds ?? 0)
  const q = query.trim()
  // Любимые песни из интернета — чтобы выбрать без поиска.
  const favorites = player.library.filter((t) => player.likes.includes(t.id) && t.url && (t.source === 'audius' || t.source === 'itunes'))

  useEffect(() => { if (open) { setPicked(initial?.track ?? null); setStart(initial?.start ?? 0); setQuery('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopClip(), [])

  useEffect(() => {
    if (q.length < 2) { setResults(null); setError(''); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchOnline(q, ctrl.signal).then((r) => {
        // Радио — прямой эфир, отрывок из него не вырезать.
        setResults([...r.full, ...r.previews].slice(0, 40))
        setError(r.full.length + r.previews.length ? '' : r.failed.length ? 'Музыкальные сервисы не ответили. Проверьте интернет.' : 'Ничего не нашлось.')
      }).catch(() => { if (!ctrl.signal.aborted) setError('Не получилось поискать. Проверьте интернет.') })
    }, 400)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q])

  // Длина трека: у iTunes — 30 секунд, у Audius известна; если нет — узнаём у самого файла.
  useEffect(() => {
    if (!picked) return
    if (picked.seconds) { setLength(picked.seconds); return }
    const a = new Audio()
    a.preload = 'metadata'
    a.onloadedmetadata = () => setLength(isFinite(a.duration) ? a.duration : CLIP)
    a.src = picked.url ?? ''
  }, [picked])

  const max = Math.max(0, Math.floor(length - CLIP))
  const pick = (t: Track) => { stopClip(); setPicked(t); setStart(Math.min(max, t.source === 'audius' ? 30 : 0)) }
  const preview = () => { if (picked) { if (player.playing) player.toggle(); playClip('picker', { track: picked, start }) } }
  const previewing = useClip('picker')

  const row = (t: Track) => (
    <li key={t.id}>
      <button type="button" onClick={() => pick(t)} className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left cursor-pointer ${picked?.id === t.id ? 'bg-surface-2' : 'hover:bg-surface-2'}`}>
        <Artwork track={t} className="w-11 h-11 rounded-xl" />
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-[14px] truncate">{t.title}</span>
          <span className="block text-[12px] text-muted truncate">{t.artist} · {trackLabel(t)}</span>
        </span>
        {picked?.id === t.id && <Icon name="check" size={18} className="text-spark shrink-0" />}
      </button>
    </li>
  )

  return (
    <Sheet open={open} onClose={() => { stopClip(); onClose() }} title="Музыка к плану">
      <div className="flex flex-col gap-3">
        {picked && (
          <div className="rounded-2xl bg-surface-2 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Artwork track={picked} className="w-12 h-12 rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{picked.title}</div>
                <div className="text-[12px] text-muted truncate">{picked.artist}</div>
              </div>
              <button type="button" onClick={() => (previewing ? stopClip() : preview())} className="grid place-items-center w-10 h-10 rounded-full bg-brand text-white cursor-pointer shrink-0" aria-label={previewing ? 'Остановить' : 'Послушать отрывок'}>
                <Icon name={previewing ? 'pause' : 'play'} size={18} fill />
              </button>
            </div>
            {max > 0 ? (
              <label className="flex flex-col gap-1 text-[13px]">
                <span className="text-muted">Отрывок: <b className="text-fg tnum">{formatTime(start)} – {formatTime(start + CLIP)}</b></span>
                <input type="range" min={0} max={max} step={1} value={Math.min(start, max)} onChange={(e) => { setStart(Number(e.target.value)); stopClip() }} className="accent-[var(--spark)]" aria-label="Начало отрывка" />
              </label>
            ) : <p className="text-[12px] text-muted">Отрывок: первые {CLIP} секунд.</p>}
            <Button type="button" onClick={() => { stopClip(); onDone({ track: slimTrack(picked), start: Math.min(start, max) }) }}>Готово</Button>
          </div>
        )}
        <label className="flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Песня или исполнитель" aria-label="Поиск песни" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" autoComplete="off" />
        </label>
        {error && <p className="text-[13px] text-muted">{error}</p>}
        {results && <ul className="flex flex-col">{results.map(row)}</ul>}
        {!results && q.length < 2 && (
          favorites.length ? (
            <>
              <span className="text-[13px] font-semibold text-muted">Ваши любимые</span>
              <ul className="flex flex-col">{favorites.map(row)}</ul>
            </>
          ) : <p className="text-[13px] text-muted">Найдите любую песню — выберите отрывок на {CLIP} секунд, его услышат все, кто откроет план.</p>
        )}
        {q.length >= 2 && !results && !error && <p className="text-[13px] text-muted">Ищем…</p>}
      </div>
    </Sheet>
  )
}
