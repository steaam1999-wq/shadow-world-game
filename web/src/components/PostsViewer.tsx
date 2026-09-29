import { useEffect, useRef } from 'react'
import { useNow, useStore } from '../store'
import { Post } from '../screens/Feed'
import { Icon } from './ui'
import type { Activity } from '../types'

/** Лента постов из сетки профиля: открывается на выбранном и листается дальше, как в Инстаграме. */
export function PostsViewer({ title, items, startId, onClose, onRespond, onOpenCapsule }: {
  title: string
  items: Activity[]
  startId: string
  onClose: () => void
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
}) {
  const { state } = useStore()
  const now = useNow()
  const scroller = useRef<HTMLDivElement>(null)

  // Сразу показываем выбранный пост, без анимации прокрутки.
  useEffect(() => {
    const el = scroller.current?.querySelector(`[data-post="${startId}"]`) as HTMLElement | null
    if (el && scroller.current) scroller.current.scrollTop = el.offsetTop - 8
  }, [startId])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-bg" role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative w-full max-w-[480px] h-full flex flex-col">
        <header className="glass bar shrink-0 pt-[env(safe-area-inset-top,0px)] px-2">
          <div className="h-14 flex items-center gap-2">
            <button onClick={onClose} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад"><Icon name="back" /></button>
            <h2 className="font-display font-semibold text-lg">{title}</h2>
          </div>
        </header>
        <div ref={scroller} className="relative flex-1 overflow-y-auto pt-2 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
          {items.map((a) => (
            <div key={a.id} data-post={a.id}>
              <Post activity={a} person={state.people.find((p) => p.id === a.authorId) ?? null} now={now}
                onRespond={(x, t) => { onClose(); onRespond(x, t) }} onOpenCapsule={(id) => { onClose(); onOpenCapsule(id) }} />
            </div>
          ))}
          {!items.length && <p className="py-16 text-center text-muted">Здесь пока пусто</p>}
        </div>
      </div>
    </div>
  )
}
