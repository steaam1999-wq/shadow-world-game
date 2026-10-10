// Переключение между аккаунтами на этом устройстве — без пароля, как в Instagram.
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { fetchMyProfile, profileToMe } from '../cloud/api'
import { forgetAccount, leaveForAnotherAccount, rememberCurrent, savedAccounts, switchAccount, type SavedAccount } from '../cloud/accounts'
import { Avatar, Icon, Sheet } from './ui'

export function useSavedAccounts() {
  const [list, setList] = useState(savedAccounts)
  useEffect(() => {
    const on = () => setList(savedAccounts())
    window.addEventListener('komeeta-accounts', on)
    return () => window.removeEventListener('komeeta-accounts', on)
  }, [])
  return list
}

export function AccountSwitcher({ open, onClose, onAddAccount }: { open: boolean; onClose: () => void; onAddAccount: () => void }) {
  const { state, dispatch } = useStore()
  const list = useSavedAccounts()
  const me = state.me
  const current = state.cloud?.userId
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (open && me && current) { setError(''); void rememberCurrent(me) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!me || !current) return null

  const go = async (a: SavedAccount) => {
    setBusy(a.userId); setError('')
    try {
      await switchAccount(a.userId, me)
      dispatch({ type: 'cloudSignIn', userId: a.userId, email: a.email })
      const p = await fetchMyProfile(a.userId)
      if (p) dispatch({ type: 'cloudLoad', me: profileToMe(p, null), people: [], activities: [], capsules: [] })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally { setBusy(null) }
  }
  const add = async () => {
    setBusy('add')
    try { await leaveForAnotherAccount(me) } catch { /* не страшно */ }
    dispatch({ type: 'signOutLocal' })
    setBusy(null); onClose(); onAddAccount()
  }
  const others = list.filter((a) => a.userId !== current)
  const row = 'w-full flex items-center gap-3 py-2.5 text-left'
  return (
    <Sheet open={open} onClose={onClose} title="Аккаунты">
      <div className="flex flex-col">
        <div className={row}>
          <Avatar name={me.name} hue={me.hue} src={me.photo} size={48} />
          <span className="flex-1 min-w-0"><b className="block truncate">{me.name}</b><span className="block text-[12.5px] text-muted truncate">{state.cloud?.email || 'сейчас открыт'}</span></span>
          <span className="grid place-items-center w-6 h-6 rounded-full bg-brand text-white"><Icon name="check" size={14} /></span>
        </div>
        {others.map((a) => (
          <div key={a.userId} className="flex items-center gap-2 border-t border-line">
            <button onClick={() => void go(a)} disabled={!!busy} className={`${row} cursor-pointer disabled:opacity-60`} aria-label={`Перейти в аккаунт ${a.name}`}>
              <Avatar name={a.name} hue={a.name.length * 37} src={a.photo} size={48} />
              <span className="flex-1 min-w-0"><b className="block truncate">{a.name}</b><span className="block text-[12.5px] text-muted truncate">{busy === a.userId ? 'Переходим…' : a.email}</span></span>
            </button>
            <button onClick={() => forgetAccount(a.userId)} className="grid place-items-center w-9 h-9 rounded-full text-muted hover:bg-surface-2 cursor-pointer shrink-0" aria-label={`Убрать ${a.name} из списка`}><Icon name="x" size={16} /></button>
          </div>
        ))}
        <button onClick={() => void add()} disabled={!!busy} className={`${row} border-t border-line cursor-pointer`}>
          <span className="grid place-items-center w-12 h-12 rounded-full border-2 border-dashed border-line text-muted"><Icon name="plus" size={20} /></span>
          <span className="font-semibold">Добавить аккаунт</span>
        </button>
        {error && <p className="text-[13px] text-danger pt-1" role="alert">{error}</p>}
        <p className="text-[12px] text-muted pt-2">Аккаунты хранятся только на этом устройстве. Переход — без пароля. «Выйти» в настройках убирает аккаунт из списка.</p>
      </div>
    </Sheet>
  )
}
