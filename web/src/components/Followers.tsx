import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { plural } from '../lib'
import { Avatar, Icon, Sheet } from './ui'

type Tab = 'followers' | 'following'

/** Подписчики и подписки человека, как в Threads: две вкладки, поиск и кнопка подписки у каждого. */
export function FollowersSheet({ personId, open, onClose, initialTab = 'followers' }: { personId: string | null; open: boolean; onClose: () => void; initialTab?: Tab }) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [query, setQuery] = useState('')
  useEffect(() => { if (open) { setTab(initialTab); setQuery('') } }, [open, initialTab])

  // В демо сервера нет: подписки — это мой список, подписчиков не показываем.
  const followers = personId ? state.followersOf?.[personId] ?? [] : []
  const following = personId ? state.followingOf?.[personId] ?? (personId === 'me' ? state.following ?? [] : []) : []
  const mine = state.following ?? []
  const q = query.trim().toLowerCase()

  const rows = (tab === 'followers' ? followers : following).flatMap((id) => {
    if (id === 'me') return state.me ? [{ id: 'me', name: state.me.name, hue: state.me.hue, photo: state.me.photo, verified: state.me.verified, sub: state.me.district }] : []
    const p = state.people.find((x) => x.id === id)
    return p ? [{ id: p.id, name: p.name, hue: p.hue, photo: p.photo, verified: p.verified, sub: `${p.district}${(state.followers?.[p.id] ?? 0) ? ` · ${state.followers![p.id]} ${plural(state.followers![p.id], 'подписчик', 'подписчика', 'подписчиков')}` : ''}` }] : []
  }).filter((p) => !q || p.name.toLowerCase().includes(q))

  const tabBtn = (id: Tab, label: string, n: number) => (
    <button role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      className={`flex-1 h-11 text-[15px] font-semibold border-b cursor-pointer transition ${tab === id ? 'border-fg text-fg' : 'border-line text-muted'}`}>
      {label} <span className="tnum">{n.toLocaleString('ru-RU')}</span>
    </button>
  )

  return (
    <Sheet open={open} onClose={onClose} title={personId === 'me' ? state.me?.name ?? '' : state.people.find((p) => p.id === personId)?.name ?? ''}>
      <div className="flex flex-col gap-3 min-h-[55vh]">
        <div className="flex -mx-5" role="tablist">
          {tabBtn('followers', 'Подписчики', followers.length)}
          {tabBtn('following', 'Подписки', following.length)}
        </div>
        <label className="flex items-center gap-2 h-10 rounded-xl bg-surface-2 px-3 text-muted">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" aria-label="Поиск по людям" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" />
        </label>
        {rows.length ? (
          <ul className="flex flex-col">
            {rows.map((p) => {
              const followed = mine.includes(p.id)
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-b-0">
                  <button onClick={() => { if (p.id !== 'me') { onClose(); openProfile(p.id) } }} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                    <Avatar name={p.name} hue={p.hue} src={p.photo} size={44} verified={p.verified} />
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{p.id === 'me' ? `${p.name} (вы)` : p.name}</span>
                      <span className="block text-[13px] text-muted truncate">{p.sub}</span>
                    </span>
                  </button>
                  {p.id !== 'me' && (
                    <button onClick={() => dispatch({ type: 'toggleFollow', personId: p.id })} aria-pressed={followed}
                      className={`shrink-0 h-9 px-4 rounded-xl text-[14px] font-semibold cursor-pointer transition ${followed ? 'border border-line text-muted' : 'bg-fg text-bg'}`}>
                      {followed ? 'Вы подписаны' : 'Подписаться'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-10 text-center text-muted">
            {q ? 'Никого не нашли.' : tab === 'followers' ? 'Подписчиков пока нет.' : 'Пока ни на кого не подписан(а).'}
          </p>
        )}
      </div>
    </Sheet>
  )
}
