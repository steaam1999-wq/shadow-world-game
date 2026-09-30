import { useState } from 'react'
import { useStore } from '../store'
import { Avatar, Button, Field, Icon, Logo, ThemeToggle, inputCls } from '../components/ui'
import { PostArt } from '../components/PostArt'
import type { Me } from '../types'
import { cloudEnabled } from '../cloud/config'
import { humanError, requestPasswordReset, signIn, signUp } from '../cloud/api'
import { RulesSheet } from '../components/Rules'

// Пример аккаунта: открывается одной кнопкой, чтобы посмотреть приложение без регистрации.
export const DEMO_ME: Me = {
  name: 'Женя', age: 26, hue: 12, district: 'Минск, Центральный р-н',
  bio: 'Дизайнер интерфейсов. Люблю кофе в 8 утра, выставки по выходным и длинные прогулки вдоль Свислочи.',
  answers: { evening: 'walk', music: 'indie', coffee: 'espresso', sport: 'yoga', weekend: 'museum', pace: 'fast' },
  tags: ['Кофе', 'Выставки', 'Прогулки', 'Фото'], verified: true, meetings: 4, authMethod: 'telegram',
  privacy: { showExactAge: true, hideFromContacts: true, approxLocation: true }, radiusKm: 5,
}

type Mode = 'login' | 'register'
const LOGIN_KEY = 'iskra-last-login'

export function Landing({ onDemo, onLogin, onRegister, onCloudAuth }: {
  onDemo: (remember: boolean) => void
  onLogin: (remember: boolean) => void
  onRegister: (name: string, method: Me['authMethod'], remember: boolean) => void
  onCloudAuth: (userId: string, email: string, name: string, remember: boolean) => Promise<void>
}) {
  const { state, dispatch } = useStore()
  const [mode, setMode] = useState<Mode>('login')
  // Сначала — экран приветствия; форма открывается по кнопке «Начать» или «Войти».
  const [stage, setStage] = useState<'welcome' | 'auth'>('welcome')
  const [step, setStep] = useState(0) // шаг формы: по одному вопросу на экран
  const [login, setLogin] = useState(() => { try { return localStorage.getItem(LOGIN_KEY) ?? '' } catch { return '' } })
  const [remember, setRemember] = useState(state.remember !== false)
  const [otherAccount, setOtherAccount] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [rules, setRules] = useState(false)
  const quick = mode === 'login' && !otherAccount ? state.savedMe : null
  // Логин последнего входа подставляем в форму; пароль не храним — его предложит менеджер паролей браузера.
  const keepLogin = () => { try { if (login.trim()) localStorage.setItem(LOGIN_KEY, login.trim()) } catch { /* ignore */ } }
  const forget = () => {
    dispatch({ type: 'forgetSaved' })
    try { localStorage.removeItem(LOGIN_KEY) } catch { /* ignore */ }
    setLogin('')
  }
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // С сервером: настоящий вход по почте и паролю через Supabase.
  const cloudSubmit = async () => {
    const email = login.trim().toLowerCase()
    if (!email.includes('@')) return setError('Введите почту — вход по телефону появится позже')
    if (password.length < 6) return setError('Пароль должен быть не короче 6 символов')
    if (mode === 'register' && !name.trim()) return setError('Как вас зовут?')
    setError(''); setInfo(''); setBusy(true)
    try {
      keepLogin()
      if (mode === 'login') {
        const user = await signIn(email, password)
        await onCloudAuth(user.id, email, '', remember)
      } else {
        const user = await signUp(email, password)
        if (user) await onCloudAuth(user.id, email, name.trim(), remember)
        else { setMode('login'); setPassword(''); setInfo(`Мы отправили письмо на ${email}. Откройте его, нажмите ссылку для подтверждения и войдите.`) }
      }
    } catch (err) {
      setError(humanError(err))
    } finally {
      setBusy(false)
    }
  }

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = login.trim().toLowerCase()
    if (!email.includes('@')) return setError('Введите почту, на которую зарегистрирован аккаунт')
    setError(''); setInfo(''); setBusy(true)
    try {
      await requestPasswordReset(email)
      setInfo(`Если аккаунт с почтой ${email} есть, мы отправили на неё ссылку для нового пароля. Проверьте и папку «Спам».`)
    } catch (err) {
      setError(humanError(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cloudEnabled) { void cloudSubmit(); return }
    if (!login.trim()) return setError('Введите телефон или почту')
    if (password.length < 6) return setError('Пароль должен быть не короче 6 символов')
    if (mode === 'register') {
      if (!name.trim()) return setError('Как вас зовут?')
      keepLogin()
      onRegister(name.trim(), login.includes('@') ? 'google' : 'phone', remember)
    } else { keepLogin(); onLogin(remember) }
  }
  const switchMode = (m: Mode) => { setMode(m); setError(''); setResetting(false); setStep(0) }
  const openAuth = (m: Mode) => { switchMode(m); setStage('auth') }
  const social = (m: Me['authMethod']) => (mode === 'login' && state.savedMe ? onLogin(remember) : onRegister(m === 'telegram' ? 'Женя' : '', m, remember))

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-8 h-16">
        <Logo className="text-xl" />
        <ThemeToggle />
      </header>

      {stage === 'welcome' && (
        <main className="flex-1 flex flex-col items-center px-4 pb-6">
          <div className="w-full max-w-[420px] flex flex-col gap-6">
            <HeroCollage />
            <div className="flex flex-col gap-3 text-center anim-page">
              <h1 className="font-display font-bold text-[29px] leading-[1.15]">Хватит свайпать.<br /><span className="text-brand">Время встречаться.</span></h1>
              <p className="text-[15px] text-muted leading-snug">Планы на вечер рядом с вами — кофе, выставки, прогулки. Откликнитесь и встретьтесь в тот же день.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {state.savedMe && (
                <button onClick={() => { if (cloudEnabled) { setOtherAccount(true); openAuth('login') } else onLogin(true) }}
                  className="flex items-center gap-3 rounded-[22px] bg-surface shadow-soft p-3 text-left cursor-pointer hover:brightness-95">
                  <Avatar name={state.savedMe.name} hue={state.savedMe.hue} src={state.savedMe.photo} size={44} verified={state.savedMe.verified} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">Продолжить как {state.savedMe.name}</span>
                    <span className="block text-[12px] text-muted truncate">{login || 'Сохранённый вход на этом устройстве'}</span>
                  </span>
                  <Icon name="arrow" size={18} />
                </button>
              )}
              <Button onClick={() => openAuth('register')} className="h-14 text-[16px] !rounded-full">Начать — это бесплатно</Button>
              <Button variant="secondary" onClick={() => openAuth('login')} className="h-14 text-[16px] !rounded-full">У меня уже есть аккаунт</Button>
              {!cloudEnabled && (
                <button onClick={() => onDemo(true)} className="h-11 text-[14px] font-semibold text-muted hover:text-fg cursor-pointer inline-flex items-center justify-center gap-1.5">
                  <Icon name="eye" size={16} /> Посмотреть без регистрации
                </button>
              )}
            </div>
            <p className="text-center text-[12px] text-muted">Только для тех, кому есть 18 · проверенные профили · блокировка и жалобы в один тап</p>
          </div>
        </main>
      )}

      {stage === 'auth' && <main className="flex-1 grid grid-cols-[minmax(0,1fr)] place-items-start justify-items-center px-4 py-4">
        <div className="w-full max-w-[400px] flex flex-col gap-6 anim-page">
          {/* Вход и регистрация */}
          <section className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <button onClick={() => { setStage('welcome'); setError(''); setInfo(''); setOtherAccount(false) }} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад"><Icon name="back" size={22} /></button>
              <div>
                <h1 className="font-display font-bold text-[26px] leading-tight">{mode === 'login' ? 'С возвращением 👋' : 'Создайте аккаунт'}</h1>
                <p className="text-[14px] text-muted">{mode === 'login' ? 'Войдите, чтобы увидеть планы рядом' : 'Минута — и можно звать людей на встречу'}</p>
              </div>
            </div>

            <div className="rounded-[32px] bg-surface shadow-soft p-5 flex flex-col gap-4">

              {quick && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => (cloudEnabled ? setOtherAccount(true) : onLogin(true))} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left cursor-pointer hover:brightness-95">
                    <Avatar name={quick.name} hue={quick.hue} src={quick.photo} size={44} verified={quick.verified} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">Продолжить как {quick.name}</span>
                      <span className="block text-[12px] text-muted truncate">{login || 'Сохранённый вход на этом устройстве'}</span>
                    </span>
                    <Icon name="arrow" size={18} />
                  </button>
                  <div className="flex justify-center gap-4 text-[13px] text-muted">
                    <button onClick={() => setOtherAccount(true)} className="hover:text-fg cursor-pointer">Войти в другой аккаунт</button>
                    <button onClick={forget} className="hover:text-danger cursor-pointer">Забыть этот аккаунт</button>
                  </div>
                </div>
              )}
              {resetting && !quick && (
                <form onSubmit={sendReset} className="flex flex-col gap-3" noValidate>
                  <p className="text-[14px] text-muted">Пришлём на почту ссылку, по которой можно задать новый пароль.</p>
                  <Field id="reset-email" label="Почта">
                    <input id="reset-email" type="email" className={inputCls} value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" placeholder="you@mail.ru" />
                  </Field>
                  {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
                  {info && <p className="text-[13px] text-ok" role="status">{info}</p>}
                  <Button type="submit" className="h-12" disabled={busy}>{busy ? 'Минутку…' : 'Прислать ссылку'}</Button>
                  <button type="button" onClick={() => { setResetting(false); setError(''); setInfo('') }} className="self-center text-[13px] text-muted hover:text-fg cursor-pointer">Назад ко входу</button>
                </form>
              )}
              {!quick && !resetting && (() => {
                // Один вопрос на экран: имя (только регистрация) → почта → пароль.
                const steps = mode === 'register' ? (['name', 'login', 'password'] as const) : (['login', 'password'] as const)
                const cur = steps[Math.min(step, steps.length - 1)]
                const last = step >= steps.length - 1
                const next = (e: React.FormEvent) => {
                  e.preventDefault()
                  setError('')
                  if (cur === 'name' && !name.trim()) return setError('Как вас зовут?')
                  if (cur === 'login') {
                    if (!login.trim()) return setError(cloudEnabled ? 'Введите почту' : 'Введите телефон или почту')
                    if (cloudEnabled && !login.includes('@')) return setError('Похоже, это не почта — проверьте, есть ли «@»')
                  }
                  if (!last) { setStep(step + 1); return }
                  submit(e)
                }
                const q = cur === 'name' ? 'Как вас зовут?' : cur === 'login' ? (cloudEnabled ? 'Ваша почта' : 'Телефон или почта') : mode === 'login' ? 'Пароль' : 'Придумайте пароль'
                const hint = cur === 'name' ? 'Так вас увидят другие. Можно только имя.' : cur === 'login' ? (mode === 'login' ? 'На неё зарегистрирован аккаунт' : 'Пришлём письмо для подтверждения') : mode === 'login' ? `Вход как ${login}` : 'Не короче 6 символов'
                return (
                  <form onSubmit={next} method="post" action="#" className="flex flex-col gap-4" noValidate>
                    <div className="flex gap-1.5" aria-label={`Шаг ${step + 1} из ${steps.length}`}>
                      {steps.map((x, i) => <span key={x} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-brand' : 'bg-surface-2'}`} />)}
                    </div>
                    <div key={cur} className="flex flex-col gap-2 anim-page">
                      <label htmlFor={cur === 'name' ? 'reg-name' : cur === 'login' ? 'auth-login' : 'auth-password'} className="font-display font-bold text-[22px] leading-tight">{q}</label>
                      <p className="text-[13px] text-muted -mt-1 truncate">{hint}</p>
                      {cur === 'name' && (
                        <input id="reg-name" name="name" className={`${inputCls} h-14 text-[17px]`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="Например, Женя" autoFocus />
                      )}
                      {cur === 'login' && (
                        <input id="auth-login" name="username" type={cloudEnabled ? 'email' : 'text'} inputMode={cloudEnabled ? 'email' : 'text'} className={`${inputCls} h-14 text-[17px]`} value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" placeholder={cloudEnabled ? 'you@mail.ru' : '+7 900 000-00-00'} autoFocus />
                      )}
                      {cur === 'password' && (
                        <div className="relative">
                          {/* Почта рядом с паролем — чтобы менеджер паролей сохранил пару */}
                          <input type="text" name="username" autoComplete="username" value={login} readOnly className="sr-only" tabIndex={-1} aria-hidden="true" />
                          <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} className={`${inputCls} h-14 text-[17px] pr-12`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Минимум 6 символов" autoFocus />
                          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} aria-pressed={showPassword} aria-controls="auth-password"
                            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-xl text-muted hover:text-fg cursor-pointer">
                            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                    {cur === 'password' && (
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="auth-remember" className="flex items-center gap-2 cursor-pointer select-none text-[14px]">
                          <input id="auth-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-5 h-5 rounded-md accent-[var(--spark)] cursor-pointer" />
                          Запомнить меня
                        </label>
                        {cloudEnabled && mode === 'login' && (
                          <button type="button" onClick={() => { setResetting(true); setError(''); setInfo('') }} className="text-[13px] font-semibold text-muted hover:text-fg cursor-pointer">Забыли пароль?</button>
                        )}
                      </div>
                    )}
                    {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
                    {info && <p className="text-[13px] text-ok" role="status">{info}</p>}
                    <div className="flex gap-2">
                      {step > 0 && <Button type="button" variant="secondary" onClick={() => { setStep(step - 1); setError('') }} className="h-13 !rounded-full px-5" aria-label="Предыдущий шаг"><Icon name="back" size={18} /></Button>}
                      <Button type="submit" className="flex-1 h-13 !rounded-full text-[16px]" disabled={busy}>{busy ? 'Минутку…' : !last ? 'Далее' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Button>
                    </div>
                  </form>
                )
              })()}

              {!cloudEnabled && <>
              <div className="flex items-center gap-3 text-[12px] text-muted"><span className="flex-1 h-px bg-line" />или<span className="flex-1 h-px bg-line" /></div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => social('telegram')} className="h-11 rounded-2xl bg-[#2AABEE] text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer">
                  <Icon name="send" size={16} /> Telegram
                </button>
                <button onClick={() => social('google')} className="h-11 rounded-2xl bg-surface-2 font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer">
                  <span className="font-display font-bold">G</span> Google
                </button>
              </div>
              </>}
            </div>

            <p className="text-center text-[13px] text-muted">
              {mode === 'login'
                ? <>Нет аккаунта? <button onClick={() => switchMode('register')} className="font-semibold text-fg cursor-pointer">Зарегистрироваться</button></>
                : <>Уже есть аккаунт? <button onClick={() => switchMode('login')} className="font-semibold text-fg cursor-pointer">Войти</button></>}
            </p>
          </section>
        </div>
      </main>}

      <footer className="px-4 py-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-muted">
        <span>© 2026 Match{cloudEnabled ? '' : ' · демо-версия'}</span>
        <button onClick={() => setRules(true)} className="hover:text-fg cursor-pointer">Правила и конфиденциальность</button>
      </footer>
      <RulesSheet open={rules} onClose={() => setRules(false)} />
    </div>
  )
}

/** Живой коллаж на экране приветствия: карточки планов, люди и «точка встречи» в центре. */
function HeroCollage() {
  const cards = [
    { id: 'hero-1', category: 'Кофе', cls: 'left-[4%] top-[8%] -rotate-[8deg] anim-float', label: '☕ Кофе' },
    { id: 'hero-2', category: 'Выставка', cls: 'right-[4%] top-[2%] rotate-[7deg] anim-float-slow', label: '🖼 Выставка' },
    { id: 'hero-3', category: 'Прогулка', cls: 'left-[calc(50%-62px)] bottom-0 rotate-[2deg] anim-float', label: '🚶 Прогулка' },
  ]
  const people = [
    { name: 'Алина', hue: 330, cls: 'left-[9%] bottom-[4%] anim-float-slow' },
    { name: 'Максим', hue: 220, cls: 'right-[9%] bottom-[10%] anim-float' },
  ]
  return (
    <div className="relative h-[270px] mt-2" aria-hidden="true">
      {cards.map((c) => (
        <div key={c.id} className={`absolute w-[124px] aspect-[3/4] rounded-[22px] overflow-hidden shadow-soft ring-4 ring-surface ${c.cls}`}>
          <PostArt activity={{ id: c.id, category: c.category }} />
          <span className="absolute left-2 bottom-2 rounded-full bg-white/90 text-[#14152a] text-[11px] font-semibold px-2 py-0.5">{c.label}</span>
        </div>
      ))}
      {people.map((p) => (
        <span key={p.name} className={`absolute rounded-full ring-4 ring-surface shadow-soft ${p.cls}`}><Avatar name={p.name} hue={p.hue} size={44} /></span>
      ))}
      <span className="absolute left-1/2 top-0 -translate-x-1/2 z-10">
        <span className="block rounded-full bg-surface shadow-soft px-3 py-1 text-[12px] font-semibold whitespace-nowrap anim-float-slow">🎶 95% совпадение</span>
      </span>
    </div>
  )
}
