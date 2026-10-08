import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { Avatar, Icon, Sheet } from '../components/ui'
import { Artwork, Bars } from './PlayerUI'
import { slimTrack, trackLabel, usePlayer } from './player'
import { searchOnline } from './online'
import { soundCloudLink } from './soundcloud'
import { SoundCloudCard } from './SoundCloudCard'
import type { Track } from './engine'

// Общий плейлист переписки: каждый добавляет песни — получается саундтрек встречи.

export function usePlaylist(chatId: string) {
  const { state } = useStore()
  return (state.playlists ?? []).filter((x) => x.chatId === chatId)
}

/** Кнопка в шапке чата: нота со счётчиком песен. */
export function PlaylistButton({ chatId }: { chatId: string }) {
  const [open, setOpen] = useState(false)
  const count = usePlaylist(chatId).length
  return (
    <>
      <button onClick={() => setOpen(true)} className="relative grid place-items-center w-9 h-9 rounded-full text-muted hover:bg-surface-2 cursor-pointer" aria-label={`Плейлист встречи${count ? `: ${count}` : ''}`}>
        <Icon name="note" size={20} />
        {count > 0 && <span className="absolute top-1 right-0.5 grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-spark text-on-spark text-[10px] font-bold">{count}</span>}
      </button>
      {/* Шапка чата размыта (backdrop-filter) и «запирает» fixed-окна внутри себя — выносим окно в body. */}
      {createPortal(<PlaylistSheet chatId={chatId} open={open} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function PlaylistSheet({ chatId, open, onClose }: { chatId: string; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const player = usePlayer()
  const items = usePlaylist(chatId)
  const [adding, setAdding] = useState(false)
  useEffect(() => { if (!open) setAdding(false) }, [open])
  const queue = items.map((x) => x.track)
  const who = (id: string) => (id === 'me' ? state.me : state.people.find((p) => p.id === id))

  if (adding) return <AddSheet open={open} onClose={onClose} onBack={() => setAdding(false)} have={queue.map((t) => t.id)} onAdd={(t) => dispatch({ type: 'addChatTrack', chatId, track: slimTrack(t) })} />
  return (
    <Sheet open={open} onClose={onClose} title="Плейлист встречи">
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-muted">Каждый добавляет свои песни — получается общий саундтрек. Включите его по дороге на встречу.</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => queue.length && player.play(queue[0], queue)} disabled={!queue.length} className="h-11 rounded-2xl bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"><Icon name="play" size={18} fill /> Слушать всё</button>
          <button onClick={() => setAdding(true)} disabled={items.length >= 50} className="h-11 rounded-2xl bg-surface-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"><Icon name="plus" size={18} /> Добавить</button>
        </div>
        {items.length ? (
          <ul className="flex flex-col -mx-2 max-h-[50vh] overflow-y-auto">
            {items.map((x) => {
              const current = player.track?.id === x.track.id
              const p = who(x.addedBy)
              return (
                <li key={x.id} className={`flex items-center gap-3 p-2 rounded-2xl ${current ? 'bg-surface-2' : ''}`}>
                  <button onClick={() => (current ? player.toggle() : player.play(x.track, queue))} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={current && player.playing ? `Пауза: ${x.track.title}` : `Слушать: ${x.track.title}`}>
                    <span className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden">
                      <Artwork track={x.track} className="w-full h-full" />
                      {current && player.playing && <span className="absolute inset-0 grid place-items-center bg-black/30 text-white"><Bars /></span>}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block font-semibold text-[14px] truncate ${current ? 'text-spark' : ''}`}>{x.track.title}</span>
                      <span className="block text-[12px] text-muted truncate">{x.track.artist}</span>
                    </span>
                  </button>
                  {p && <span title={`Добавил(а): ${p.name}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={24} /></span>}
                  {x.addedBy === 'me' && <button onClick={() => dispatch({ type: 'removeChatTrack', id: x.id })} className="grid place-items-center w-8 h-8 rounded-full text-muted hover:text-danger cursor-pointer" aria-label={`Убрать ${x.track.title}`}><Icon name="x" size={16} /></button>}
                </li>
              )
            })}
          </ul>
        ) : <p className="py-6 text-center text-muted text-[14px]">Пока пусто. Добавьте первую песню — остальные увидят её здесь.</p>}
      </div>
    </Sheet>
  )
}

function AddSheet({ open, onClose, onBack, have, onAdd }: { open: boolean; onClose: () => void; onBack: () => void; have: string[]; onAdd: (t: Track) => void }) {
  const player = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[] | null>(null)
  const [error, setError] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const q = query.trim()
  // Любимые песни из интернета — добавить без поиска.
  const favorites = player.library.filter((t) => player.likes.includes(t.id) && t.url && (t.source === 'audius' || t.source === 'itunes' || t.source === 'soundcloud'))

  const sc = soundCloudLink(q)
  useEffect(() => {
    if (q.length < 2 || sc) { setResults(null); setError(''); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchOnline(q, ctrl.signal).then((r) => {
        setResults([...r.full, ...r.previews].slice(0, 40))
        setError(r.full.length + r.previews.length ? '' : r.failed.length ? 'Музыкальные сервисы не ответили. Проверьте интернет.' : 'Ничего не нашлось.')
      }).catch(() => { if (!ctrl.signal.aborted) setError('Не получилось поискать. Проверьте интернет.') })
    }, 400)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q])

  const list = results ?? favorites
  return (
    <Sheet open={open} onClose={onClose} title="Добавить в плейлист">
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 h-10 rounded-full bg-surface-2 px-3.5 text-muted">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Песня, исполнитель или ссылка SoundCloud" aria-label="Поиск песни" className="flex-1 min-w-0 bg-transparent text-fg focus:outline-none" />
        </label>
        {sc && <SoundCloudCard text={q} compact action={(t) => {
          const inList = have.includes(t.id) || added.includes(t.id)
          return <button disabled={inList} onClick={() => { onAdd(t); setAdded((a) => [...a, t.id]) }} className="h-9 px-3 rounded-full bg-fg text-bg text-[13px] font-semibold cursor-pointer disabled:opacity-50 shrink-0">{inList ? 'Добавлено' : 'Добавить'}</button>
        }} />}
        {!results && !sc && <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">{favorites.length ? 'Мои любимые' : 'Найдите песню по названию'}</p>}
        {error && <p className="text-[13px] text-muted">{error}</p>}
        <ul className="flex flex-col -mx-2 max-h-[50vh] overflow-y-auto">
          {list.map((t) => {
            const inList = have.includes(t.id) || added.includes(t.id)
            return (
              <li key={t.id}>
                <button disabled={inList} onClick={() => { onAdd(t); setAdded((a) => [...a, t.id]) }} className="w-full flex items-center gap-3 p-2 rounded-2xl text-left hover:bg-surface-2 cursor-pointer disabled:cursor-default">
                  <Artwork track={t} className="w-11 h-11 rounded-xl" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[14px] truncate">{t.title}</span>
                    <span className="block text-[12px] text-muted truncate">{t.artist} · {trackLabel(t)}</span>
                  </span>
                  <Icon name={inList ? 'check' : 'plus'} size={18} className={inList ? 'text-ok' : 'text-spark'} />
                </button>
              </li>
            )
          })}
        </ul>
        <button onClick={onBack} className="h-11 rounded-2xl bg-surface-2 font-semibold cursor-pointer">Готово</button>
      </div>
    </Sheet>
  )
}
