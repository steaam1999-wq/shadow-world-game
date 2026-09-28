import { useState } from 'react'
import { useStore } from '../store'
import { Avatar, Button, Field, Icon, Logo, ThemeToggle, inputCls } from '../components/ui'
import { PostArt } from '../components/PostArt'
import type { Me } from '../types'

// Пример аккаунта: открывается одной кнопкой, чтобы посмотреть приложение без регистрации.
export const DEMO_ME: Me = {
  name: 'Женя', age: 26, hue: 12, district: 'Чистые пруды',
  bio: 'Дизайнер интерфейсов. Люблю кофе в 8 утра, выставки по выходным и длинные прогулки вдоль Яузы.',
  answers: { evening: 'walk', music: 'indie', coffee: 'espresso', sport: 'yoga', weekend: 'museum', pace: 'fast' },
  tags: ['Кофе', 'Выставки', 'Прогулки', 'Фото'], verified: true, meetings: 4, authMethod: 'telegram',
  privacy: { showExactAge: true, hideFromContacts: true, approxLocation: true }, radiusKm: 5,
}

const DEMO_PLANS = [
  { id: 'demo-1', category: 'Кофе' },
  { id: 'demo-2', category: 'Выставка' },
  { id: 'demo-3', category: 'Прогулка' },
]

type Mode = 'login' | 'register'

export function Landing({ onDemo, onLogin, onRegister, onAdmin }: {
  onDemo: () => void
  onLogin: () => void
  onRegister: (name: string, method: Me['authMethod']) => void
  onAdmin: () => void
}) {
  const { state } = useStore()
  const [mode, setMode] = useState<Mode>('login')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!login.trim()) return setError('Введите телефон или почту')
    if (password.length < 6) return setError('Пароль должен быть не короче 6 символов')
    if (mode === 'register') {
      if (!name.trim()) return setError('Как вас зовут?')
      onRegister(name.trim(), login.includes('@') ? 'google' : 'phone')
    } else onLogin()
  }
  const switchMode = (m: Mode) => { setMode(m); setError('') }
  const social = (m: Me['authMethod']) => (mode === 'login' && state.savedMe ? onLogin() : onRegister(m === 'telegram' ? 'Женя' : '', m))

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-8 h-16">
        <Logo className="text-xl" />
        <ThemeToggle />
      </header>

      <main className="flex-1 grid place-items-center px-4 py-6">
        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {/* Вход и регистрация */}
          <section className="w-full flex flex-col gap-5">
            <h1 className="text-center font-display font-semibold text-[28px] leading-tight">Хватит свайпать.<br /><span className="text-brand">Время встречаться.</span></h1>

            <div className="rounded-[32px] bg-surface shadow-soft p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-2" role="tablist" aria-label="Вход или регистрация">
                {([['login', 'Вход'], ['register', 'Регистрация']] as const).map(([m, label]) => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                    className={`h-10 rounded-xl text-[14px] font-semibold cursor-pointer transition ${mode === m ? 'bg-surface shadow-soft' : 'text-muted'}`}>{label}</button>
                ))}
              </div>

              <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
                {mode === 'register' && (
                  <Field id="reg-name" label="Имя">
                    <input id="reg-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="Как вас называть" />
                  </Field>
                )}
                <Field id="auth-login" label="Телефон или почта">
                  <input id="auth-login" className={inputCls} value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" placeholder="+7 900 000-00-00" />
                </Field>
                <Field id="auth-password" label="Пароль">
                  <input id="auth-password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Минимум 6 символов" />
                </Field>
                {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
                <Button type="submit" className="h-12 mt-1">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Button>
              </form>

              <div className="flex items-center gap-3 text-[12px] text-muted"><span className="flex-1 h-px bg-line" />или<span className="flex-1 h-px bg-line" /></div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => social('telegram')} className="h-11 rounded-2xl bg-[#2AABEE] text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer">
                  <Icon name="send" size={16} /> Telegram
                </button>
                <button onClick={() => social('google')} className="h-11 rounded-2xl bg-surface-2 font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer">
                  <span className="font-display font-bold">G</span> Google
                </button>
              </div>
            </div>

            <p className="text-center text-[13px] text-muted">
              {mode === 'login'
                ? <>Нет аккаунта? <button onClick={() => switchMode('register')} className="font-semibold text-fg cursor-pointer">Зарегистрироваться</button></>
                : <>Уже есть аккаунт? <button onClick={() => switchMode('login')} className="font-semibold text-fg cursor-pointer">Войти</button></>}
            </p>
          </section>
          {/* Пример аккаунта */}
          <section className="rounded-[28px] bg-surface/80 shadow-soft p-4 flex flex-col gap-3" aria-label="Пример аккаунта">
            <div className="flex items-center gap-3">
              <span className="rounded-full p-[2px] bg-brand shrink-0"><span className="block rounded-full bg-surface p-[2px]"><Avatar name={DEMO_ME.name} hue={DEMO_ME.hue} size={46} verified /></span></span>
              <div className="flex-1 min-w-0 leading-tight">
                <div className="font-semibold truncate">{DEMO_ME.name}, {DEMO_ME.age}</div>
                <div className="text-[12px] text-muted truncate">Пример аккаунта · 3 плана</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {DEMO_PLANS.map((p) => (
                  <div key={p.id} className="relative w-9 aspect-[3/4] rounded-md overflow-hidden"><PostArt activity={p} /></div>
                ))}
              </div>
            </div>
            <Button variant="secondary" onClick={onDemo} className="w-full h-10 text-[14px]">
              <Icon name="user" size={17} /> Посмотреть без регистрации
            </Button>
          </section>
        </div>
      </main>

      <footer className="px-4 py-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-muted">
        <span>© 2026 «Искра» · демо-версия</span>
        <button onClick={onAdmin} className="hover:text-fg cursor-pointer">Админ-панель</button>
      </footer>
    </div>
  )
}
