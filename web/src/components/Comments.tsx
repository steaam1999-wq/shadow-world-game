import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { relative } from '../lib'
import { Avatar, Icon, Sheet } from './ui'
import type { Activity, PlanComment, Short } from '../types'

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
  const { dispatch } = useStore()
  const list = useComments(activity.id)
  return (
    <CommentsSheetBase list={list} ownerIsMe={activity.authorId === 'me'} open={open} onClose={onClose}
      empty="Комментариев пока нет. Спросите что-нибудь о плане — ответ увидят все."
      onAdd={(text, replyTo) => dispatch({ type: 'addComment', planId: activity.id, text, replyTo })} onDelete={(id) => dispatch({ type: 'deleteComment', id })} />
  )
}

export function useShortComments(shortId: string) {
  const { state } = useStore()
  return (state.shortComments ?? []).filter((c) => c.planId === shortId)
}

/** Комментарии к публикации или шортсу. */
export function ShortCommentsSheet({ short, open, onClose }: { short: Short; open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const list = useShortComments(short.id)
  return (
    <CommentsSheetBase list={list} ownerIsMe={short.authorId === 'me'} open={open} onClose={onClose}
      empty="Комментариев пока нет. Напишите первым!"
      onAdd={(text, replyTo) => dispatch({ type: 'addShortComment', shortId: short.id, text, replyTo })} onDelete={(id) => dispatch({ type: 'deleteShortComment', id })} />
  )
}

/** Ветки: верхние комментарии и все ответы под ними (ответ на ответ попадает в ту же ветку, как в Instagram). */
export function threads(list: PlanComment[]) {
  const byId = new Map(list.map((c) => [c.id, c]))
  const rootOf = (c: PlanComment) => {
    let r = c
    for (let i = 0; i < 50 && r.replyTo && byId.has(r.replyTo); i++) r = byId.get(r.replyTo)!
    return r
  }
  const tops = list.filter((c) => rootOf(c) === c)
  const replies = new Map<string, PlanComment[]>()
  for (const c of list) { const r = rootOf(c); if (r !== c) replies.set(r.id, [...(replies.get(r.id) ?? []), c]) }
  return { tops, replies, byId }
}

function CommentsSheetBase({ list, ownerIsMe, open, onClose, empty, onAdd, onDelete }: {
  list: PlanComment[]; ownerIsMe: boolean; open: boolean; onClose: () => void; empty: string; onAdd: (text: string, replyTo?: string) => void; onDelete: (id: string) => void
}) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const author = useAuthor()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<PlanComment | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const endRef = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const now = Date.now()
  const { tops, replies, byId } = threads(list)
  const topCount = tops.length
  // Прокрутка вниз — только при новом верхнем комментарии, а не при ответе в середине.
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ block: 'end' }) }, [open, topCount])
  useEffect(() => { if (!open) { setReplyTo(null); setExpanded(new Set()) } }, [open])
  // Комментарий, на который отвечали, удалили — отменяем ответ.
  useEffect(() => { if (replyTo && !byId.has(replyTo.id)) setReplyTo(null) }, [byId, replyTo])

  const startReply = (c: PlanComment) => {
    setReplyTo(c)
    const root = tops.find((t) => t.id === c.id || (replies.get(t.id) ?? []).some((r) => r.id === c.id))
    if (root) setExpanded((e) => new Set(e).add(root.id))
    input.current?.focus()
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onAdd(t.slice(0, 500), replyTo?.id)
    setText(''); setReplyTo(null)
  }

  const row = (c: PlanComment, reply: boolean) => {
    const a = author(c)
    const canDelete = c.authorId === 'me' || ownerIsMe || !!state.isAdmin
    const parent = reply && c.replyTo ? byId.get(c.replyTo) : undefined
    const parentName = parent ? (author(parent)?.name ?? null) : null
    return (
      <div className="flex gap-3 items-start">
        <button onClick={() => { if (a && a.id !== 'me') { onClose(); openProfile(a.id) } }} className="shrink-0 cursor-pointer" aria-label={a ? `Профиль ${a.name}` : 'Автор'}>
          <Avatar name={a?.name ?? '?'} hue={a?.hue ?? 0} src={a?.photo} size={reply ? 26 : 34} />
        </button>
        <div className="flex-1 min-w-0 text-[14px]">
          <p className="break-words">
            <span className="font-semibold">{a?.name ?? 'Кто-то'}</span>{' '}
            {parentName && <span className="text-cobalt">@{parentName} </span>}
            {c.text}
          </p>
          <span className="flex items-center gap-3 text-[12px] text-muted">
            {relative(c.at, now)}
            {!c.id.startsWith('tmp-') && (
              <button onClick={() => startReply(c)} className="font-semibold hover:text-fg cursor-pointer" aria-label={`Ответить ${a?.name ?? ''}`.trim()}>Ответить</button>
            )}
          </span>
        </div>
        {canDelete && (
          <button onClick={() => onDelete(c.id)} className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-muted hover:text-danger cursor-pointer" aria-label="Удалить комментарий">
            <Icon name="trash" size={16} />
          </button>
        )}
      </div>
    )
  }

  const replyName = replyTo ? (author(replyTo)?.name ?? 'Кто-то') : ''
  return (
    <Sheet open={open} onClose={onClose} title={list.length ? `Комментарии · ${list.length}` : 'Комментарии'}>
      <div className="flex flex-col gap-4 text-fg">
        {!list.length && <p className="text-center text-muted py-6">{empty}</p>}
        <ul className="flex flex-col gap-3">
          {tops.map((c) => {
            const rs = replies.get(c.id) ?? []
            // Одну-две реплики показываем сразу, длинную ветку — по кнопке.
            const show = rs.length <= 2 || expanded.has(c.id)
            return (
              <li key={c.id} className="flex flex-col gap-2">
                {row(c, false)}
                {rs.length > 0 && (
                  <div className="ml-[46px] flex flex-col gap-2">
                    {show && rs.map((r) => <div key={r.id}>{row(r, true)}</div>)}
                    {rs.length > 2 && (
                      <button onClick={() => setExpanded((e) => { const n = new Set(e); if (show) n.delete(c.id); else n.add(c.id); return n })} className="self-start flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-fg cursor-pointer">
                        <span className="w-6 h-px bg-line" />{show ? 'Скрыть ответы' : `Посмотреть ответы (${rs.length})`}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div ref={endRef} />
        <div className="sticky bottom-0 flex flex-col gap-1.5 bg-surface pt-2">
          {replyTo && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-1.5 text-[13px] text-muted">
              <span className="truncate">Ответ для <span className="font-semibold text-fg">{replyName}</span></span>
              <button onClick={() => setReplyTo(null)} className="grid place-items-center w-6 h-6 rounded-full hover:text-fg cursor-pointer" aria-label="Отменить ответ"><Icon name="x" size={14} /></button>
            </div>
          )}
          <form onSubmit={send} className="flex gap-2">
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500}
              placeholder={replyTo ? `Ответ для ${replyName}…` : state.me ? `Комментарий от ${state.me.name}…` : 'Комментарий…'}
              className="flex-1 min-w-0 h-11 rounded-2xl bg-surface-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-cobalt" aria-label={replyTo ? 'Текст ответа' : 'Текст комментария'} />
            <button type="submit" disabled={!text.trim()} className="grid place-items-center w-11 h-11 rounded-full bg-spark text-on-spark disabled:opacity-40 cursor-pointer" aria-label={replyTo ? 'Отправить ответ' : 'Отправить комментарий'}><Icon name="send" size={18} /></button>
          </form>
        </div>
      </div>
    </Sheet>
  )
}
