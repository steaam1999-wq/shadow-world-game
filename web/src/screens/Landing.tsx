import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Avatar, Button, Field, Icon, Logo, LogoMark, Sheet, ThemeToggle, Wordmark, inputCls } from '../components/ui'
import type { Me } from '../types'
import { cloudEnabled } from '../cloud/config'
import { NICK_RE, authProviders, humanError, nickConfig, normalizePhone, resetNick, signInNick, signUpNick, requestPasswordReset, sendMagicLink, sendPhoneCode, signIn, signInWithProvider, signInWithTelegram, signUp, telegramLogin, telegramResultFromUrl, verifyEmailCode, verifyPhoneCode } from '../cloud/api'
import { RulesSheet } from '../components/Rules'
import { ConsentCheck, localConsent, saveLocalConsent } from '../components/Consent'
import { invitedBy } from '../components/Invite'

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
  const [stage, setStage] = useState<'welcome' | 'auth' | 'magic' | 'phone'>(() => { try { return sessionStorage.getItem('auth-error') ? 'auth' : 'welcome' } catch { return 'welcome' } })
  const [providers, setProviders] = useState<string[]>([])
  const [sentTo, setSentTo] = useState('')
  const [cooldown, setCooldown] = useState(0)
  // Какие соцсети включены в настройках входа — кнопки только для них.
  useEffect(() => { if (cloudEnabled) void authProviders().then(setProviders) }, [])
  useEffect(() => { if (!cooldown) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t) }, [cooldown])
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
  const [error, setError] = useState(() => { try { const e = sessionStorage.getItem('auth-error') ?? ''; sessionStorage.removeItem('auth-error'); return e } catch { return '' } })
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [agreed, setAgreed] = useState(() => !!localConsent())
  const [needAgree, setNeedAgree] = useState(false)
  /** Новый вход или регистрация — после «18+ и согласие». Не дали ещё — спрашиваем одним касанием в окошке. */
  const [pending, setPending] = useState<(() => void) | null>(null)
  const agreeFirst = (go: () => void) => () => {
    if (!agreed) { setPending(() => go); return }
    saveLocalConsent()
    go()
  }
  const acceptAndGo = () => {
    setAgreed(true); setNeedAgree(false); saveLocalConsent()
    const go = pending; setPending(null); go?.()
  }

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
  const sendLink = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const email = login.trim().toLowerCase()
    if (!email.includes('@')) return setError('Похоже, это не почта — проверьте, есть ли «@»')
    setError(''); setBusy(true)
    try { keepLogin(); await sendMagicLink(email); setSentTo(email); setCooldown(60) }
    catch (err) { setError(/rate|security purposes|seconds/i.test(String((err as Error)?.message)) ? 'Письмо уже отправлено — подождите минуту и попробуйте снова.' : humanError(err)) }
    finally { setBusy(false) }
  }
  const [emailCode, setEmailCode] = useState('')
  const checkEmailCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (emailCode.trim().length < 6) return setError('Введите 6 цифр из письма')
    setError(''); setBusy(true)
    try { const user = await verifyEmailCode(sentTo, emailCode.trim()); await onCloudAuth(user.id, sentTo, '', remember) }
    catch (err) { setError(/invalid|expired/i.test(String((err as Error)?.message)) ? 'Код не подходит или устарел. Нажмите кнопку в письме или запросите новое.' : humanError(err)); setBusy(false) }
  }
  const oauth = async (provider: string) => {
    setError(''); setBusy(true)
    try { await signInWithProvider(provider) } catch (err) { setError(humanError(err)); setBusy(false) }
  }
  const telegram = async () => {
    setError(''); setBusy(true)
    try {
      const u = await telegramLogin()
      if (!u) { setBusy(false); return } // закрыли окно Telegram
      const user = await signInWithTelegram(u)
      await onCloudAuth(user.id, user.email ?? '', u.first_name ?? '', remember)
    } catch (err) {
      setError(/telegram/.test(String((err as Error)?.message)) ? 'Не получилось войти через Telegram. Попробуйте ещё раз или войдите по почте.' : humanError(err))
      setBusy(false)
    }
  }
  // Вернулись со страницы входа Telegram (в приложении): ответ лежит в адресе — входим сразу.
  const [tgReturn] = useState(() => { try { return telegramResultFromUrl(location.hash) } catch { return null } })
  useEffect(() => {
    if (!tgReturn) return
    try { history.replaceState(null, '', location.pathname + location.search) } catch { /* ignore */ }
    setBusy(true)
    void signInWithTelegram(tgReturn)
      .then((user) => onCloudAuth(user.id, user.email ?? '', tgReturn.first_name ?? '', true))
      .catch(() => { setError('Не получилось войти через Telegram. Попробуйте ещё раз или войдите по почте.'); setBusy(false) })
  }, [tgReturn]) // eslint-disable-line react-hooks/exhaustive-deps
  // Телефон: номер → код из SMS
  const [phone, setPhone] = useState('+375 ')
  const [codeSent, setCodeSent] = useState('')
  const [code, setCode] = useState('')
  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const num = normalizePhone(phone)
    if (num.length < 11) return setError('Введите номер полностью, с кодом страны')
    setError(''); setBusy(true)
    try { await sendPhoneCode(num); setCodeSent(num); setCode(''); setCooldown(60) }
    catch (err) { setError(/rate|seconds/i.test(String((err as Error)?.message)) ? 'Код уже отправлен — подождите минуту.' : humanError(err)) }
    finally { setBusy(false) }
  }
  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length < 4) return setError('Введите код из SMS')
    setError(''); setBusy(true)
    try { const user = await verifyPhoneCode(codeSent, code.trim()); await onCloudAuth(user.id, user.email ?? '', '', remember) }
    catch (err) { setError(/invalid|expired/i.test(String((err as Error)?.message)) ? 'Код не подходит или устарел. Проверьте или запросите новый.' : humanError(err)); setBusy(false) }
  }
  // Главная форма: ник (или почта) и пароль. Нет аккаунта — тот же экран, кнопка «Создать аккаунт».
  const [invited] = useState(invitedBy)
  const [newAcc, setNewAcc] = useState(() => !!invited && !state.savedMe) // по приглашению чаще приходят новички
  // Защита от ботов: время на форме, скрытое поле-ловушка и капча Cloudflare (если включена на сервере).
  const shownAt = useRef(Date.now())
  const [trap, setTrap] = useState('')
  const [captchaKey, setCaptchaKey] = useState<string | null>(null)
  const captcha = useRef('')
  const onCaptcha = useCallback((t: string) => { captcha.current = t }, [])
  useEffect(() => { if (cloudEnabled) void nickConfig().then((c) => setCaptchaKey(c.turnstile)) }, [])
  const welcomeSubmit = async () => {
    const raw = login.trim()
    const isEmail = raw.includes('@')
    const nick = raw.toLowerCase().replace(/^@/, '')
    if (!raw) return setError(newAcc ? 'Придумайте ник' : 'Введите ник или почту')
    if (!isEmail && !NICK_RE.test(nick)) return setError('Ник: 3–20 латинских букв, цифр, «_» или «.»')
    if (password.length < 6) return setError('Пароль — не короче 6 символов')
    setError(''); setInfo('')
    if (!cloudEnabled) { keepLogin(); if (newAcc) onRegister('', isEmail ? 'google' : 'phone', remember); else onLogin(remember); return }
    setBusy(true)
    try {
      keepLogin()
      const email = raw.toLowerCase()
      if (newAcc) {
        if (isEmail) {
          const user = await signUp(email, password)
          if (user) await onCloudAuth(user.id, email, '', remember)
          else { setNewAcc(false); setPassword(''); setInfo(`Мы отправили письмо на ${email}. Нажмите в нём ссылку и войдите.`); setBusy(false) }
        } else {
          if (captchaKey && !captcha.current) { setBusy(false); return setError('Подтвердите, что вы не робот') }
          const user = await signUpNick(nick, password, { ms: Date.now() - shownAt.current, website: trap, captcha: captcha.current })
          await onCloudAuth(user.id, '', '', remember)
        }
      } else {
        const user = isEmail ? await signIn(email, password) : await signInNick(nick, password)
        await onCloudAuth(user.id, isEmail ? email : '', '', remember)
      }
    } catch (err) {
      const m = String((err as Error)?.message ?? '')
      setError(/invalid login|credentials/i.test(m) ? 'Неверный ник или пароль' : /занят|Ник:|Пароль|Не получилось|Слишком много|робот|Неверный|Почта ещё/.test(m) ? m : humanError(err))
      setBusy(false)
    }
  }
  /** «Забыли пароль?»: для почты — обычное восстановление, для ника — письмо на привязанную почту. */
  const forgot = async () => {
    const raw = login.trim()
    if (!raw || raw.includes('@') || !cloudEnabled) { openAuth('login'); setResetting(true); return }
    setError(''); setInfo(''); setBusy(true)
    try {
      await resetNick(raw.toLowerCase().replace(/^@/, ''))
      setInfo('Если к этому нику привязана почта, мы отправили на неё ссылку для нового пароля. Проверьте и «Спам».')
    } catch (err) { setError(String((err as Error)?.message ?? humanError(err))) }
    finally { setBusy(false) }
  }
  const soon = (what: string) => setError(`Вход через ${what} включим совсем скоро. Пока войдите по почте — это так же быстро, без пароля.`)
  const social = (m: Me['authMethod']) => (mode === 'login' && state.savedMe ? onLogin(remember) : onRegister(m === 'telegram' ? 'Женя' : '', m, remember))

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-8 h-16">
        {stage === 'welcome' ? <span /> : <Logo className="text-xl" />}
        <ThemeToggle />
      </header>

      {stage === 'welcome' && (
        <main className="flex-1 w-full max-w-[420px] mx-auto flex flex-col overflow-x-clip px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] -mt-10">
          <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center anim-page">
            <div className="-my-7 scale-[0.78] [@media(min-height:800px)]:-my-3 [@media(min-height:800px)]:scale-90 [@media(min-height:900px)]:my-0 [@media(min-height:900px)]:scale-100"><OrbitHero /></div>
            <Wordmark animate className="text-[26px]" />
            <h1 className="sr-only">Komeeta — встречи рядом</h1>
            {invited && (
              <p className="mt-1 rounded-2xl bg-spark/12 px-3.5 py-2.5 text-[14px] leading-snug" role="status">
                👋 {invited === 'plan' ? 'Друг зовёт вас на встречу — войдите, и план откроется сразу.' : invited === 'profile' ? 'С вами поделились страницей в Komeeta — войдите, и она откроется сразу.' : 'Вас пригласил друг — заходите, здесь находят компанию на сегодня.'}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-3 p-3.5 pb-4 rounded-[30px] bg-surface/55 backdrop-blur-2xl ring-1 ring-line/60 shadow-[0_20px_60px_-30px_rgb(0_0_0/.55)] anim-rise">
            {state.savedMe && (
              <button onClick={() => { if (cloudEnabled) { setOtherAccount(true); openAuth('login') } else onLogin(true) }}
                className="flex items-center gap-3 h-14 rounded-full bg-surface shadow-soft pl-2 pr-4 text-left cursor-pointer hover:brightness-95">
                <Avatar name={state.savedMe.name} hue={state.savedMe.hue} src={state.savedMe.photo} size={40} />
                <span className="flex-1 min-w-0 font-semibold truncate">Продолжить как {state.savedMe.name}</span>
                <Icon name="arrow" size={18} />
              </button>
            )}
            <form onSubmit={(e) => { e.preventDefault(); if (newAcc) agreeFirst(() => void welcomeSubmit())(); else void welcomeSubmit() }} className="flex flex-col gap-2.5" noValidate>
              <label htmlFor="w-login" className="sr-only">Ник или почта</label>
              <input id="w-login" value={login} onChange={(e) => setLogin(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                autoComplete="username" placeholder={newAcc ? 'Придумайте ник' : 'Ник или почта'} className={`${inputCls} h-[52px] text-[16px]`} />
              <div className="relative">
                <label htmlFor="w-pass" className="sr-only">Пароль</label>
                <input id="w-pass" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete={newAcc ? 'new-password' : 'current-password'} placeholder={newAcc ? 'Придумайте пароль' : 'Пароль'} className={`${inputCls} h-[52px] text-[16px] pr-14`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full text-muted hover:text-fg cursor-pointer" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}><Icon name="eye" size={20} /></button>
              </div>
              {/* ловушка для ботов: человек это поле не видит и не заполняет */}
              <input type="text" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
              {newAcc && captchaKey && <Turnstile siteKey={captchaKey} onToken={onCaptcha} />}
              <Button type="submit" disabled={busy} className="h-[52px] !rounded-full text-[16px]">{busy ? 'Минутку…' : newAcc ? 'Создать аккаунт' : 'Войти'}</Button>
              {info && <p className="text-center text-[13px] text-ok" role="status">{info}</p>}
              <div className="flex justify-between text-[14px] font-semibold px-1">
                <button type="button" onClick={() => { setNewAcc((v) => !v); setError(''); setInfo('') }} className="text-brand cursor-pointer">{newAcc ? 'У меня есть аккаунт' : 'Создать аккаунт'}</button>
                {!newAcc && <button type="button" onClick={() => void forgot()} className="text-muted hover:text-fg cursor-pointer">Забыли пароль?</button>}
              </div>
            </form>
                        {/* Быстрый вход — маленькие круглые значки; ещё не подключённый способ подсказывает войти по почте */}
            <div className="flex items-center gap-3 pt-1">
              <span className="flex-1 h-px bg-line" /><span className="text-[12.5px] text-muted">или</span><span className="flex-1 h-px bg-line" />
            </div>
            <div className="flex justify-center gap-4">
              <IconAuth label="Войти по почте без пароля" disabled={busy} onClick={agreeFirst(() => (cloudEnabled ? (setStage('magic'), setError(''), setSentTo('')) : openAuth('register')))}><BrandTile kind="mail" /></IconAuth>
              {['telegram', 'google', ...providers.filter((p) => !['telegram', 'google', 'phone'].includes(p))].map((pv) => (
                <IconAuth key={pv} label={`Войти через ${PROVIDER_NAME[pv] ?? pv}`} disabled={busy}
                  onClick={agreeFirst(() => (!cloudEnabled ? social(pv === 'telegram' ? 'telegram' : 'google') : !providers.includes(pv) ? soon(PROVIDER_NAME[pv] ?? pv) : pv === 'telegram' ? void telegram() : void oauth(pv)))}>{pv === 'telegram' || pv === 'google' ? <BrandTile kind={pv} /> : <ProviderIcon id={pv} big />}</IconAuth>
              ))}
              <IconAuth label="Войти по номеру телефона" disabled={busy}
                onClick={agreeFirst(() => (!cloudEnabled ? social('phone') : !providers.includes('phone') ? soon('телефон') : (setStage('phone'), setError(''), setCodeSent(''))))}><BrandTile kind="phone" /></IconAuth>
            </div>
            {!cloudEnabled && (
              <button onClick={() => onDemo(true)} className="-mt-2 h-10 text-[13px] text-muted hover:text-fg cursor-pointer inline-flex items-center justify-center gap-1.5">
                <Icon name="eye" size={15} /> Посмотреть без регистрации
              </button>
            )}
            {error && <p className="text-center text-[13px] text-danger" role="alert">{error}</p>}
          </div>
          <Sheet open={!!pending} onClose={() => setPending(null)} title="Последний шаг">
            <div className="flex flex-col gap-4 pb-1">
              <ConsentCheck plain checked={agreed} onChange={setAgreed} />
              {/* Нажатие кнопки — само подтверждение: текст согласия и документы — прямо над ней */}
              <Button onClick={acceptAndGo} className="h-14 !rounded-full text-[16px]">Подтверждаю — продолжить</Button>
            </div>
          </Sheet>
        </main>
      )}

      {stage === 'phone' && (
        <main className="flex-1 w-full max-w-[400px] mx-auto flex flex-col gap-5 px-6 py-4 anim-page">
          <button onClick={() => { if (codeSent) setCodeSent(''); else setStage('welcome'); setError('') }} className="self-start grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад"><Icon name="back" size={22} /></button>
          {codeSent ? (
            <form onSubmit={(e) => void checkCode(e)} className="flex flex-col gap-4" noValidate>
              <div>
                <h1 className="font-display font-bold text-[28px] leading-tight">Код из SMS</h1>
                <p className="text-[15px] text-muted mt-1">Отправили на <b className="text-fg">{codeSent}</b>. Нет аккаунта — создадим.</p>
              </div>
              <label htmlFor="sms-code" className="sr-only">Код из SMS</label>
              <input id="sms-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className={`${inputCls} h-14 text-[22px] tracking-[.3em] text-center tnum`} />
              {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="h-[52px] !rounded-full text-[16px]">{busy ? 'Проверяем…' : 'Войти'}</Button>
              <Button type="button" variant="secondary" onClick={() => void sendCode()} disabled={busy || cooldown > 0} className="h-12 !rounded-full">{cooldown > 0 ? `Новый код через ${cooldown} с` : 'Отправить код ещё раз'}</Button>
            </form>
          ) : (
            <form onSubmit={(e) => void sendCode(e)} className="flex flex-col gap-4" noValidate>
              <div>
                <h1 className="font-display font-bold text-[28px] leading-tight">Вход по телефону</h1>
                <p className="text-[15px] text-muted mt-1">Пришлём SMS с кодом — пароль не нужен.</p>
              </div>
              <label htmlFor="phone" className="sr-only">Номер телефона</label>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+375 29 123-45-67" className={`${inputCls} h-14 text-[17px] tnum`} />
              {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="h-[52px] !rounded-full text-[16px]">{busy ? 'Отправляем…' : 'Получить код'}</Button>
            </form>
          )}
        </main>
      )}

      {stage === 'magic' && (
        <main className="flex-1 w-full max-w-[400px] mx-auto flex flex-col gap-5 px-6 py-4 anim-page">
          <button onClick={() => { setStage('welcome'); setError('') }} className="self-start grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад"><Icon name="back" size={22} /></button>
          {sentTo ? (
            <div className="flex flex-col items-center gap-4 text-center pt-6">
              <span className="grid place-items-center w-20 h-20 rounded-full bg-brand text-white"><Icon name="send" size={34} /></span>
              <h1 className="font-display font-bold text-[26px] leading-tight">Проверьте почту</h1>
              <p className="text-[15px] text-muted">Отправили письмо на <b className="text-fg">{sentTo}</b>. Нажмите в нём «Войти» или введите код из письма. Письмо может прийти в «Спам».</p>
              <form onSubmit={(e) => void checkEmailCode(e)} className="w-full flex flex-col gap-3" noValidate>
                <label htmlFor="email-code" className="sr-only">Код из письма</label>
                <input id="email-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))} placeholder="Код из письма" className={`${inputCls} h-14 text-[20px] tracking-[.25em] text-center tnum`} />
                {emailCode.length === 6 && <Button type="submit" disabled={busy} className="h-[52px] !rounded-full text-[16px]">{busy ? 'Проверяем…' : 'Войти'}</Button>}
              </form>
              <Button variant="secondary" onClick={() => void sendLink()} disabled={busy || cooldown > 0} className="h-12 !rounded-full w-full">{cooldown > 0 ? `Отправить ещё раз через ${cooldown} с` : 'Отправить ещё раз'}</Button>
              <button onClick={() => setSentTo('')} className="text-[14px] font-semibold text-muted hover:text-fg cursor-pointer">Изменить почту</button>
              {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
            </div>
          ) : (
            <form onSubmit={(e) => void sendLink(e)} className="flex flex-col gap-4" noValidate>
              <div>
                <h1 className="font-display font-bold text-[28px] leading-tight">Вход по почте</h1>
                <p className="text-[15px] text-muted mt-1">Пришлём письмо с кнопкой «Войти» — пароль не нужен. Нет аккаунта — создадим.</p>
              </div>
              <label htmlFor="magic-email" className="sr-only">Почта</label>
              <input id="magic-email" type="email" inputMode="email" autoComplete="email" autoFocus value={login} onChange={(e) => setLogin(e.target.value)} placeholder="you@mail.ru" className={`${inputCls} h-14 text-[17px]`} />
              {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="h-[52px] !rounded-full text-[16px]">{busy ? 'Отправляем…' : 'Получить ссылку'}</Button>
              <button type="button" onClick={() => openAuth('login')} className="text-[14px] font-semibold text-muted hover:text-fg cursor-pointer">Войти с паролем</button>
            </form>
          )}
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
                  if (mode === 'register' && !agreed) { setNeedAgree(true); return setError('Отметьте, что вам есть 18 и вы согласны с документами') }
                  if (mode === 'register') saveLocalConsent()
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
                    {last && mode === 'register' && <ConsentCheck checked={agreed} onChange={(v) => { setAgreed(v); if (v) { setNeedAgree(false); setError('') } }} highlight={needAgree} />}
                    {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
                    {info && <p className="text-[13px] text-ok" role="status">{info}</p>}
                    <div className="flex gap-2">
                      {step > 0 && <Button type="button" variant="secondary" onClick={() => { setStep(step - 1); setError('') }} className="h-13 !rounded-full px-5" aria-label="Предыдущий шаг"><Icon name="back" size={18} /></Button>}
                      <Button type="submit" className="flex-1 h-13 !rounded-full text-[16px]" disabled={busy}>{busy ? 'Минутку…' : !last ? 'Далее' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Button>
                    </div>
                  </form>
                )
              })()}

            </div>

            <p className="text-center text-[13px] text-muted">
              {mode === 'login'
                ? <>Нет аккаунта? <button onClick={() => switchMode('register')} className="font-semibold text-fg cursor-pointer">Зарегистрироваться</button></>
                : <>Уже есть аккаунт? <button onClick={() => switchMode('login')} className="font-semibold text-fg cursor-pointer">Войти</button></>}
            </p>
          </section>
        </div>
      </main>}

      {stage !== 'welcome' && <footer className="px-4 py-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-muted">
        <span>© 2026 Komeeta{cloudEnabled ? '' : ' · демо-версия'}</span>
        <button onClick={() => setRules(true)} className="hover:text-fg cursor-pointer">Правила и конфиденциальность</button>
      </footer>}
      <RulesSheet open={rules} onClose={() => setRules(false)} />
    </div>
  )
}

const PROVIDER_NAME: Record<string, string> = { google: 'Google', apple: 'Apple', telegram: 'Telegram', facebook: 'Facebook', github: 'GitHub', twitter: 'X', discord: 'Discord', azure: 'Microsoft', vk: 'VK' }

function ProviderIcon({ id, big = false }: { id: string; big?: boolean }) {
  const px = big ? 26 : 18
  if (id === 'google') return (
    <svg width={px} height={px} viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  )
  if (id === 'apple') return (
    <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>
  )
  if (id === 'telegram') return <span className="grid place-items-center rounded-full bg-[#2AABEE] text-white" style={{ width: px + 4, height: px + 4 }}><Icon name="send" size={big ? 15 : 10} /></span>
  return <Icon name="user" size={px} />
}

/** Кнопка способа входа: одинаковые по размеру, главная — тёмная. */
/** Заставка входа: логотип-планета, вокруг по орбитам летают интересы людей. */
const ORBIT_INNER = [
  { e: '☕', bg: 'linear-gradient(135deg,#ffb347,#ff7a45)', a: 0 },
  { e: '🎧', bg: 'linear-gradient(135deg,#8a5cff,#5b7cff)', a: 120 },
  { e: '🎨', bg: 'linear-gradient(135deg,#ff4f86,#ff8a5c)', a: 240 },
]
const ORBIT_OUTER = [
  { e: '🏃', bg: 'linear-gradient(135deg,#3fd18f,#1fb57a)', a: 30 },
  { e: '📸', bg: 'linear-gradient(135deg,#4aa8ff,#2a6dff)', a: 102 },
  { e: '🎬', bg: 'linear-gradient(135deg,#ff6b9a,#c44dff)', a: 174 },
  { e: '🍷', bg: 'linear-gradient(135deg,#ff7a59,#e0315f)', a: 246 },
  { e: '🎾', bg: 'linear-gradient(135deg,#ffd257,#ff9f1a)', a: 318 },
]
function OrbitHero() {
  const ring = (items: typeof ORBIT_INNER, r: number, dur: number, rev: boolean, size: number) => (
    <div className="absolute inset-0 orbit-spin" style={{ animationDuration: `${dur}s`, animationDirection: rev ? 'reverse' : 'normal' }}>
      {items.map((it) => (
        <span key={it.e} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${it.a}deg) translateY(-${r}px) rotate(-${it.a}deg)` }}>
          <span className="orbit-spin grid place-items-center rounded-full ring-2 ring-white/70 shadow-[0_8px_18px_-8px_rgb(0_0_0/.6)]"
            style={{ width: size, height: size, margin: -size / 2, background: it.bg, fontSize: size * 0.48, animationDuration: `${dur}s`, animationDirection: rev ? 'normal' : 'reverse' }}>{it.e}</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="relative w-[270px] h-[270px] shrink-0" aria-hidden="true">
      {/* свечение и орбиты */}
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(255_79_134/.35),transparent_70%)] blur-2xl" />
      <div className="absolute inset-[22%] rounded-full border border-dashed border-fg/15" />
      <div className="absolute inset-[4%] rounded-full border border-fg/10" />
      {ring(ORBIT_INNER, 84, 38, false, 38)}
      {ring(ORBIT_OUTER, 124, 60, true, 34)}
      <div className="absolute inset-0 grid place-items-center"><LogoMark size={88} animate /></div>
    </div>
  )
}

function IconAuth({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="rounded-full cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:scale-90 disabled:opacity-60 focus-visible:outline-offset-4">
      {children}
    </button>
  )
}

/** Значок способа входа: плашка-«сквиркл» с логотипом. */
function BrandTile({ kind }: { kind: 'mail' | 'telegram' | 'google' | 'phone' }) {
  const tile = 'relative grid place-items-center w-14 h-14 rounded-full overflow-hidden shadow-[inset_0_1px_0_rgb(255_255_255/.35),0_8px_18px_-10px_rgb(0_0_0/.55)]'
  if (kind === 'google') return (
    <span className={`${tile} bg-white ring-1 ring-black/5`}><ProviderIcon id="google" big /></span>
  )
  if (kind === 'telegram') return (
    <span className={`${tile} bg-[linear-gradient(160deg,#37bbfe,#1e96e8)]`}>
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M5.43 11.87c3.5-1.52 5.83-2.53 7-3.01 3.33-1.39 4.03-1.63 4.48-1.64.1 0 .32.02.46.14.12.1.16.23.17.33.02.09.04.3.02.47-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.06-1.22-.46-1.9-.9-1.05-.7-1.65-1.13-2.68-1.8-1.18-.78-.41-1.21.26-1.91.18-.18 3.25-2.98 3.31-3.23 0-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.1.02-1.79 1.14-5.06 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.87-.44-.75-.25-1.35-.37-1.3-.79.03-.22.33-.44.9-.66z" transform="translate(-.6 .4)" /></svg>
    </span>
  )
  if (kind === 'mail') return (
    <span className={`${tile} bg-brand`}>
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5.5" width="18" height="13" rx="3" fill="rgb(255 255 255 / .18)" /><path d="m4 7.5 8 5.5 8-5.5" />
      </svg>
    </span>
  )
  return (
    <span className={`${tile} bg-[linear-gradient(160deg,#4be38a,#16b765)]`}><Icon name="phone" size={22} fill className="text-white" /></span>
  )
}


/** Капча Cloudflare Turnstile — чаще всего проходит незаметно, без картинок. */
function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    type TS = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void }
    const w = window as unknown as { turnstile?: TS }
    let id = ''
    const draw = () => { if (box.current && w.turnstile) id = w.turnstile.render(box.current, { sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken(''), language: 'ru', appearance: 'interaction-only' }) }
    if (w.turnstile) draw()
    else {
      const sc = document.createElement('script')
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      sc.async = true; sc.onload = draw
      document.head.appendChild(sc)
    }
    return () => { if (id) w.turnstile?.remove(id) }
  }, [siteKey, onToken])
  return <div ref={box} className="flex justify-center" />
}
