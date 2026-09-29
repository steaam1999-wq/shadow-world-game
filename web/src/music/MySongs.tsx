import { useRef, useState } from 'react'
import { Button, Field, Icon, Sheet, inputCls } from '../components/ui'
import { formatTime, usePlayer } from './player'
import { Disc } from './PlayerUI'
import type { Track } from './engine'

/** «Мои песни»: загрузка своих аудиофайлов (кнопкой или перетаскиванием), список, правка и удаление. */
export function MySongs() {
  const p = usePlayer()
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const [editing, setEditing] = useState<Track | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Track | null>(null)

  const upload = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? [])
    if (!files.length) return
    setBusy(true)
    const r = await p.addFiles(files)
    setBusy(false)
    const parts: string[] = []
    if (r.saved) parts.push(`Добавлено: ${r.saved}`)
    if (r.temporary) parts.push(`${r.temporary} — только до перезагрузки: браузер не дал места для хранения`)
    if (r.rejected.length) parts.push(`Не подошли: ${r.rejected.join('; ')}`)
    setNote({ text: parts.join('. '), tone: r.temporary || r.rejected.length ? 'warn' : 'ok' })
  }

  return (
    <section className="flex flex-col gap-3 px-4" aria-labelledby="my-songs-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="my-songs-title" className="font-display font-semibold text-xl">Мои песни {p.uploads.length > 0 && <span className="text-muted font-normal tnum">· {p.uploads.length}</span>}</h2>
          <p className="text-[13px] text-muted">Хранятся только в этом браузере, никуда не отправляются</p>
        </div>
        {p.uploads.length > 0 && (
          <button onClick={() => p.play(p.uploads[0], p.uploads)} className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-brand text-white shadow-soft cursor-pointer" aria-label="Слушать мои песни">
            <Icon name="play" size={18} fill />
          </button>
        )}
      </div>

      <label htmlFor="my-songs-file"
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files) }}
        className={`flex items-center gap-4 rounded-[24px] border-2 border-dashed p-4 cursor-pointer transition ${drag ? 'border-spark bg-spark-soft' : 'border-line bg-surface/60 hover:border-spark'}`}>
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-brand text-white shrink-0 shadow-soft">
          <Icon name={busy ? 'note' : 'upload'} size={22} className={busy ? 'anim-flick' : ''} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{busy ? 'Загружаю…' : 'Загрузить песни'}</span>
          <span className="block text-[13px] text-muted">MP3, M4A, WAV, OGG, FLAC · до 60 МБ · можно несколько сразу или перетащить сюда</span>
        </span>
      </label>
      <input ref={fileRef} id="my-songs-file" type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.opus" multiple className="sr-only"
        onChange={(e) => { void upload(e.target.files); e.target.value = '' }} />

      {note && (
        <p role="status" className={`text-[13px] rounded-2xl px-3.5 py-2.5 ${note.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>{note.text}</p>
      )}

      {p.uploads.length > 0 ? (
        <ul className="flex flex-col -mx-2">
          {p.uploads.map((t) => {
            const cur = p.track?.id === t.id
            const mine = p.mySongId === t.id
            return (
              <li key={t.id} className={`flex items-center gap-2 p-2 rounded-2xl ${cur ? 'bg-surface/80 shadow-soft' : ''}`}>
                <button onClick={() => (cur ? p.toggle() : p.play(t, p.uploads))} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer" aria-label={`Слушать: ${t.title}`}>
                  <Disc track={t} size={42} spinning={cur && p.playing} />
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold text-[14px] truncate ${cur ? 'text-spark' : ''}`}>{t.title}</span>
                    <span className="block text-[12px] text-muted truncate">
                      {t.artist}{t.seconds ? ` · ${formatTime(t.seconds)}` : ''}{mine && <span className="text-spark font-semibold"> · в профиле</span>}
                    </span>
                  </span>
                </button>
                <button onClick={() => p.setMySong(mine ? null : t.id)} className={`grid place-items-center w-9 h-9 rounded-full cursor-pointer shrink-0 ${mine ? 'text-spark' : 'text-muted hover:text-fg'}`}
                  aria-label={mine ? 'Убрать из профиля' : 'Поставить в профиль'} aria-pressed={mine} title={mine ? 'Песня в профиле' : 'Поставить в профиль'}>
                  <Icon name="user" size={19} />
                </button>
                <button onClick={() => setEditing(t)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-fg cursor-pointer shrink-0" aria-label={`Изменить: ${t.title}`}>
                  <Icon name="edit" size={18} />
                </button>
                <button onClick={() => setConfirmDelete(t)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-danger cursor-pointer shrink-0" aria-label={`Удалить: ${t.title}`}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">Пока пусто. Загрузите любимые треки — их можно слушать здесь и поставить песней в профиль.</p>
      )}

      <EditSheet track={editing} onClose={() => setEditing(null)} />
      <Sheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить песню?">
        <div className="flex flex-col gap-4">
          <p className="text-muted">«{confirmDelete?.title}» пропадёт из «Моих песен» в этом браузере. Сам файл на устройстве останется.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Отмена</Button>
            <Button variant="danger" onClick={() => { if (confirmDelete) p.removeUpload(confirmDelete.id); setConfirmDelete(null) }}>Удалить</Button>
          </div>
        </div>
      </Sheet>
    </section>
  )
}

function EditSheet({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const p = usePlayer()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [forId, setForId] = useState<string | null>(null)
  if (track && forId !== track.id) {
    setForId(track.id)
    setTitle(track.title)
    setArtist(track.artist === 'Моя песня' ? '' : track.artist)
  }
  return (
    <Sheet open={!!track} onClose={onClose} title="Изменить песню">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (track) p.renameUpload(track.id, title, artist); onClose() }}>
        <Field id="song-title" label="Название">
          <input id="song-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required />
        </Field>
        <Field id="song-artist" label="Исполнитель">
          <input id="song-artist" className={inputCls} value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={60} placeholder="Необязательно" />
        </Field>
        <Button type="submit" disabled={!title.trim()}>Сохранить</Button>
      </form>
    </Sheet>
  )
}
