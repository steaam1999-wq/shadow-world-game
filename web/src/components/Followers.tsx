import { useStore } from '../store'
import { useOpenProfile } from '../nav'
import { Avatar, Sheet } from './ui'

/** Список подписчиков: нажали на число «подписчиков» — видно, кто именно. */
export function FollowersSheet({ personId, open, onClose }: { personId: string | null; open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const openProfile = useOpenProfile()
  const ids = personId ? state.followersOf?.[personId] ?? [] : []
  const people = ids.flatMap((id) => {
    if (id === 'me') return state.me ? [{ id: 'me', name: `${state.me.name} (вы)`, hue: state.me.hue, photo: state.me.photo, verified: state.me.verified, district: state.me.district }] : []
    const p = state.people.find((x) => x.id === id)
    return p ? [{ id: p.id, name: p.name, hue: p.hue, photo: p.photo, verified: p.verified, district: p.district }] : []
  })
  return (
    <Sheet open={open} onClose={onClose} title="Подписчики">
      {people.length ? (
        <ul className="flex flex-col -mx-2">
          {people.map((p) => (
            <li key={p.id}>
              <button onClick={() => { if (p.id !== 'me') { onClose(); openProfile(p.id) } }} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-surface-2 cursor-pointer">
                <Avatar name={p.name} hue={p.hue} src={p.photo} size={44} verified={p.verified} />
                <span className="min-w-0">
                  <span className="block font-semibold truncate">{p.name}</span>
                  <span className="block text-[13px] text-muted truncate">{p.district}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="py-6 text-center text-muted">Подписчиков пока нет.</p>}
    </Sheet>
  )
}
