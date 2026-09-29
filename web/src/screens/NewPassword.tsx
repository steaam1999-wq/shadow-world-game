import { useEffect, useState } from 'react'
import { Button, Field, Logo, inputCls } from '../components/ui'
import { humanError, sb, updatePassword } from '../cloud/api'

/** Сюда ведёт ссылка «Сбросить пароль» из письма: Supabase кладёт сессию восстановления в адрес страницы. */
export function NewPassword({ onDone, onCancel }: { onDone: (userId: string, email: string) => Promise<void>; onCancel: () => void }) {
  const [linkError] = useState(() => new URLSearchParams(location.hash.slice(1)).get('error_description'))
  const [status, setStatus] = useState<'checking' | 'ok' | 'bad'>(linkError ? 'bad' : 'checking')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (linkError) return
    sb().auth.getSession().then(({ data }) => setStatus(data.session ? 'ok' : 'bad'), () => setStatus('bad'))
  }, [linkError])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return setError('Пароль должен быть не короче 6 символов')
    if (password !== repeat) return setError('Пароли не совпадают')
    setError(''); setBusy(true)
    try {
      const user = await updatePassword(password)
      try { history.replaceState(null, '', location.pathname) } catch { /* ignore */ }
      await onDone(user.id, user.email ?? '')
    } catch (err) {
      setError(humanError(err))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-6 gap-6">
      <Logo className="text-xl" />
      <div className="w-full max-w-[400px] rounded-[32px] bg-surface shadow-soft p-5 flex flex-col gap-4">
        <h1 className="font-display font-semibold text-xl">Новый пароль</h1>
        {status === 'checking' && <p className="text-muted">Проверяем ссылку…</p>}
        {status === 'bad' && (
          <>
            <p className="text-muted">Ссылка устарела или уже использована. Запросите новую на экране входа: «Забыли пароль?».</p>
            <Button onClick={onCancel}>Ко входу</Button>
          </>
        )}
        {status === 'ok' && (
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <Field id="new-password" label="Новый пароль">
              <input id="new-password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Минимум 6 символов" />
            </Field>
            <Field id="new-password-2" label="Ещё раз">
              <input id="new-password-2" type="password" className={inputCls} value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
            </Field>
            {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
            <Button type="submit" className="h-12" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить и войти'}</Button>
          </form>
        )}
      </div>
    </div>
  )
}
