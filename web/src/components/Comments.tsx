import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { relative } from '../lib'
import { Avatar, Icon, Sheet } from './ui'
import type { Activity, PlanComment } from '../types'

export function useComments(planId: string) {
  const { state } = useStore()
  return (state.comments ?? []).filter((c) => c.planId === planId)
}

function useAuthor() {
  const { state } = useStore()
  return (c: PlanComment) => {
    if (c.authorId === 'me') return state.me ? { id: 'me', name: state.me.name, hue: state.me.hue, photo: state.me.photo } : null
    return state.people.find((p) => p.id === c.authorId) ?? null
  }
}

/** Пара последних комментариев прямо под постом и ссылка на все. */
export function CommentsPreview({ activity, onOpen }: { activity: Activity; onOpen: () => void }) {
  const list = useComments(activity.id)
  const author = useAuthor()
  if (!list.length) return <button onClick={onOpen} className="self-start text-muted cursor-pointer">Добавить комментарий…</button>
  return (
    <>
      {list.length > 2 && <button onClick={onOpen} className="self-start text-muted cursor-pointer">Посмотреть все комментарии ({list.length})</button>}
      {list.slice(-2).map((c) => (
        <button key={c.id} onClick={onOpen} className="text-left cursor-pointer line-clamp-2"><span className="font-semibold">{author(c)?.name ?? 'Кто-то'}</span> {c.text}</button>
      ))}
    </>
  )
}

/** Все комментарии под планом: читать, писать, удалять свои (автор плана удаляет любые). */
export function CommentsSheet({ activity, open, onClose }: { activity: Activity; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const list = useComments(activity.id)
  const author = useAuthor()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const now = Date.now()
  const myPlan = activity.authorId === 'me'
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ block: 'end' }) }, [open, list.length])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    dispatch({ type: 'addComment', planId: activity.id, text: t.slice(0, 500) })
    setText('')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Комментарии">
      <div className="flex flex-col gap-4">
        {!list.length && <p className="text-center text-muted py-6">Комментариев пока нет. Спросите что-нибудь о плане — ответ увидят все.</p>}
        <ul className="flex flex-col gap-3">
          {list.map((c) => {
            const a = author(c)
            const canDelete = c.authorId === 'me' || myPlan
            return (
              <li key={c.id} className="flex gap-3 items-start">
                <button onClick={() => { if (a && a.id !== 'me') { onClose(); openProfile(a.id) } }} className="shrink-0 cursor-pointer" aria-label={a ? `Профиль ${a.name}` : 'Автор'}>
                  <Avatar name={a?.name ?? '?'} hue={a?.hue ?? 0} src={a?.photo} size={34} />
                </button>
                <div className="flex-1 min-w-0 text-[14px]">
                  <p className="break-words"><span className="font-semibold">{a?.name ?? 'Кто-то'}</span> {c.text}</p>
                  <span className="text-[12px] text-muted">{relative(c.at, now)}</span>
                </div>
                {canDelete && (
                  <button onClick={() => dispatch({ type: 'deleteComment', id: c.id })} className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-muted hover:text-danger cursor-pointer" aria-label="Удалить комментарий">
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <div ref={endRef} />
        <form onSubmit={send} className="sticky bottom-0 flex gap-2 bg-surface pt-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={state.me ? `Комментарий от ${state.me.name}…` : 'Комментарий…'}
            className="flex-1 min-w-0 h-11 rounded-2xl bg-surface-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-cobalt" aria-label="Текст комментария" />
          <button type="submit" disabled={!text.trim()} className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark disabled:opacity-40 cursor-pointer" aria-label="Отправить комментарий"><Icon name="send" size={18} /></button>
        </form>
      </div>
    </Sheet>
  )
}
