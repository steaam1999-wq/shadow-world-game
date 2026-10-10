import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { StoreProvider, useNow, useStore } from './store'
import { PlayerProvider, usePlayer } from './music/player'
import { FullPlayer, MiniPlayer } from './music/PlayerUI'
import { SafetyBanner } from './components/Meet'
import { ProfileNav } from './nav'
import { DEMO_ME, Landing } from './screens/Landing'
import { HOUR } from './data'
import { Feed } from './screens/Feed'
import { CapsuleChat, CapsuleList, NewChatSheet } from './screens/Capsules'
import { GroupChat } from './screens/Groups'
import { NewPublication } from './screens/LazyComposer'
import { StoryCreator } from './screens/Stories' // ещё нужен ленте (кружки историй), отдельно не грузится
import { CloudSync } from './cloud/CloudSync'
import { MessageAlerts } from './components/Alerts'
import { acceptConsent, fetchMyProfile, profileToMe, sessionFromUrl } from './cloud/api'
import { ConsentGate, localConsent, saveLocalConsent } from './components/Consent'
import { CONSENT_SINCE } from './components/Rules'
import { cloudEnabled } from './cloud/config'
import { Avatar, Icon, Logo, LogoMark, Sheet } from './components/ui'
import { VerifySheet, useVerifyRequests } from './components/Verify'
import { CallProvider } from './calls/Calls'
import { FounderSheet, captureInvite, forgetInvitedUser, invitedUser, useClaimReferral, useFounderInfoRequests } from './components/Invite'
import { isExpired, relative } from './lib'
import { AchievementToast } from './components/Achievements'
import type { Activity, Me, Person, PlanComment, State } from './types'

// Разделы, которые нужны не сразу, подгружаются при первом открытии — главная открывается быстрее.
type PropsOf<C> = C extends (props: infer P) => unknown ? (unknown extends P ? object : P) : object
function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] as ComponentType<PropsOf<M[K]>> })))
}
const MusicPage = lazyNamed(() => import('./music/MusicPage'), 'MusicPage')
const PersonProfile = lazyNamed(() => import('./screens/PersonProfile'), 'PersonProfile')
const Onboarding = lazyNamed(() => import('./screens/Onboarding'), 'Onboarding')
const Explore = lazyNamed(() => import('./screens/Explore'), 'Explore')
const CreateActivity = lazyNamed(() => import('./screens/Explore'), 'CreateActivity')
const Reels = lazyNamed(() => import('./screens/Reels'), 'Reels')
const Profile = lazyNamed(() => import('./screens/Profile'), 'Profile')
const Admin = lazyNamed(() => import('./admin/Admin'), 'Admin')
const NewPassword = lazyNamed(() => import('./screens/NewPassword'), 'NewPassword')

/** Пока раздел подгружается — спокойный индикатор вместо пустого экрана. */
function Loading() {
  return <div className="grid place-items-center py-24" role="status" aria-label="Загрузка"><span className="w-8 h-8 rounded-full border-[3px] border-line border-t-spark animate-spin" /></div>
}

type View = 'landing' | 'onboarding' | 'app' | 'admin' | 'recovery' | 'callback'
type Tab = 'home' | 'search' | 'reels' | 'capsules' | 'profile' | 'music'

const NAV: { id: Tab | 'create'; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'navHome' },
  { id: 'search', label: 'Поиск', icon: 'navSearch' },
  { id: 'create', label: 'Создать', icon: 'create' },
  { id: 'capsules', label: 'Чаты', icon: 'navChat' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
]

function readHash(): string {
  try { return window.location.hash.slice(1) } catch { return '' }
}

/** Экран «Входим…»: забираем сессию из ссылки и продолжаем как обычный вход. */
function AuthCallback({ onUser, onFail }: { onUser: (u: { id: string; email: string; name: string }) => Promise<void>; onFail: () => void }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    sessionFromUrl().then((u) => { if (!alive) return; if (u) void onUser(u); else setFailed(true) }, () => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="min-h-full grid place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={72} animate />
        {failed ? (
          <>
            <p className="font-semibold">Ссылка устарела или уже использована</p>
            <button onClick={onFail} className="h-11 px-5 rounded-full bg-brand text-white font-semibold cursor-pointer">Войти ещё раз</button>
          </>
        ) : <p className="text-muted">Входим…</p>}
      </div>
    </div>
  )
}

function Root() {
  const { state, dispatch } = useStore()
  const [view, setView] = useState<View>(() => {
    captureInvite() // до первой отрисовки: экран входа сразу покажет «вас позвали»
    const hash = readHash()
    // Ошибка входа через Google/Apple (не ссылка из письма) — на экран входа с понятным сообщением.
    if (cloudEnabled && /error_code=/.test(hash) && !/type=recovery|otp_expired/.test(hash)) {
      try { sessionStorage.setItem('auth-error', 'Не получилось войти через Google. Попробуйте ещё раз или войдите другим способом.') } catch { /* ignore */ }
      return 'landing'
    }
    if (cloudEnabled && /type=recovery|error_code=/.test(hash)) return 'recovery' // ссылка «новый пароль» из письма
    if (cloudEnabled && /access_token=/.test(hash)) return 'callback' // вход по ссылке из письма, Google или Apple
    return hash === 'admin' ? 'admin' : state.me ? 'app' : 'landing'
  })
  const [reg, setReg] = useState<{ name: string; method: Me['authMethod'] } | null>(null)

  useEffect(() => {
    if (view === 'recovery' || view === 'callback') return // токен из адреса ещё нужен
    // Ссылка на публикацию: запоминаем, лента откроет её после входа.
    try { if (location.hash.startsWith('#pub=')) sessionStorage.setItem('match-open-pub', location.hash.slice(5)) } catch { /* ignore */ }
    try { history.replaceState(null, '', view === 'admin' ? '#admin' : view === 'app' ? '#app' : ' ') } catch { /* ignore */ }
    window.scrollTo(0, 0)
  }, [view])

  const enterDemo = () => {
    if (state.cloud) dispatch({ type: 'signOut' }) // демо — только локально, на сервер ничего не уходит
    dispatch({ type: 'signIn', me: DEMO_ME })
    if (!state.activities.some((a) => a.authorId === 'me')) {
      const now = Date.now()
      const plan = (title: string, category: string, area: string, exactPlace: string, inHours: number, x: number, y: number) =>
        dispatch({ type: 'createActivity', activity: { title, category, area, exactPlace, startsAt: now + inHours * HOUR, durationMin: 90, expiresAt: now + (inHours + 1.5) * HOUR, x, y } })
      plan('Утренний кофе на Октябрьской, расскажу про любимые обжарки', 'Кофе', 'Минск, Центральный р-н', 'Кофейня у выхода из метро', 14, 62, 30)
      plan('Иду в Художественный музей на новую выставку, ищу компанию', 'Выставка', 'Минск, Центральный р-н', 'Главный вход, ул. Ленина, 20', 22, 30, 60)
      plan('Прогулка вдоль Свислочи на закате', 'Прогулка', 'Минск, Советский р-н', 'У Парка Челюскинцев, главный вход', 30, 76, 36)
    }
    setView('app')
  }

  // Вход через сервер: есть профиль — сразу в приложение, нет — анкета.
  const onCloudAuth = async (userId: string, email: string, name: string) => {
    dispatch({ type: 'cloudSignIn', userId, email })
    const profile = await fetchMyProfile(userId)
    if (profile) {
      dispatch({ type: 'cloudLoad', me: profileToMe(profile, null), people: [], activities: [], capsules: [] })
      setView('app')
    } else {
      setReg({ name, method: 'email' })
      setView('onboarding')
    }
  }

  if (view === 'callback') return <AuthCallback onUser={(u) => onCloudAuth(u.id, u.email, u.name)} onFail={() => setView('landing')} />
  if (view === 'recovery') return <Suspense fallback={<Loading />}><NewPassword onDone={(userId, email) => onCloudAuth(userId, email, '')} onCancel={() => setView('landing')} /></Suspense>
  if (view === 'admin') return <Suspense fallback={<Loading />}><Admin onExit={() => setView(state.me ? 'app' : 'landing')} /></Suspense>
  if (view === 'onboarding') return <Suspense fallback={<Loading />}><Onboarding initialName={reg?.name} method={reg?.method ?? null} onDone={() => setView('app')} onBack={() => setView('landing')} /></Suspense>
  if (view === 'app' && state.me) return <AppShell onSignOut={() => setView('landing')} onAdmin={() => setView('admin')} />
  return (
    <Landing
      onDemo={(remember) => { dispatch({ type: 'setRemember', remember }); enterDemo() }}
      onLogin={(remember) => { dispatch({ type: 'setRemember', remember }); if (state.savedMe) { dispatch({ type: 'signIn', me: state.savedMe }); setView('app') } else enterDemo() }}
      onRegister={(name, method, remember) => { dispatch({ type: 'setRemember', remember }); setReg({ name, method }); setView('onboarding') }}
      onCloudAuth={(userId, email, name, remember) => { dispatch({ type: 'setRemember', remember }); return onCloudAuth(userId, email, name) }}
    />
  )
}

function AppShell({ onSignOut, onAdmin }: { onSignOut: () => void; onAdmin: () => void }) {
  const { state, dispatch } = useStore()
  const now = useNow()
  const me = state.me!
  const [verifying, setVerifying] = useState(false)
  useVerifyRequests(useCallback(() => setVerifying(true), []))
  useClaimReferral()
  const [founderInfo, setFounderInfo] = useState(false)
  useFounderInfoRequests(useCallback(() => setFounderInfo(true), []))
  const [tab, setTab] = useState<Tab>('home')
  // 18+ и согласие на обработку данных: у новых — с экрана входа, у зарегистрированных раньше — разовое окно.
  const consentOk = !state.cloud || (me.consentAt ?? 0) >= CONSENT_SINCE
  const cloudId = state.cloud?.userId
  const acceptNow = useCallback(() => {
    const at = saveLocalConsent()
    dispatch({ type: 'updateMe', patch: { consentAt: at } })
    if (cloudId) void acceptConsent(cloudId).catch(() => { /* отметим при следующем входе */ })
  }, [cloudId, dispatch])
  useEffect(() => { if (!consentOk && localConsent()) acceptNow() }, [consentOk, acceptNow])
  const [chat, setChat] = useState<string | null>(null)
  const [person, setPerson] = useState<string | null>(null)
  // Где сейчас человек — уходит в «Сообщить об ошибке».
  useEffect(() => { document.body.dataset.page = person ? 'профиль человека' : chat ? 'чат' : tab }, [tab, person, chat])
  const openProfile = (id: string) => { setPerson(id); setChat(null); window.scrollTo(0, 0) }
  // Поделились страницей человека: открываем её, как только люди загрузятся.
  const peopleRef = useRef(state.people)
  peopleRef.current = state.people
  useEffect(() => {
    const id = invitedUser()
    if (!id) return
    if (id === state.cloud?.userId) { forgetInvitedUser(); setTab('profile'); return }
    let tries = 0
    const t = window.setInterval(() => {
      if (peopleRef.current.some((p) => p.id === id)) { clearInterval(t); forgetInvitedUser(); setPerson(id); setChat(null) }
      else if (++tries > 40) { clearInterval(t); forgetInvitedUser() }
    }, 250)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [toast, setToast] = useState<Activity | null>(null)
  const [creating, setCreating] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [newChat, setNewChat] = useState(false)
  const [storying, setStorying] = useState(false)
  const [posting, setPosting] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [seenBefore, setSeenBefore] = useState(0) // что было новым на момент открытия — подсвечиваем в списке
  // Новое с прошлого просмотра: лайки, репосты, подписки, комментарии и ответы.
  const freshNotices = (state.notices ?? []).filter((n) => n.at > (state.noticesSeenAt ?? 0) && state.people.some((p) => p.id === n.personId)).length
    + commentNotices(state).filter((c) => c.at > (state.noticesSeenAt ?? 0)).length
  // Листаете ленту дальше — панель уезжает вверх; возвращаетесь — выезжает «жидким стеклом».
  const [hideTop, setHideTop] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 56) setHideTop(false)
      else if (y > last + 4) setHideTop(true)
      else if (y < last - 4) setHideTop(false)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setHideTop(false) }, [tab, person])
  const player = usePlayer()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => { window.scrollTo(0, 0) }, [tab, chat])

  const openCapsuleByActivity = (activityId: string) => {
    // У группового плана сначала открываем общий чат компании.
    const g = (state.groups ?? []).find((x) => x.planId === activityId)
    const c = state.capsules.find((x) => x.activityId === activityId)
    const id = g?.id ?? c?.id
    if (id) { setTab('capsules'); setChat(id); setToast(null) }
  }
  // «Позвать» из «Свободны сейчас»: создаём капсулу и открываем её, как только она появится.
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const invite = (personId: string) => {
    const name = state.people.find((p) => p.id === personId)?.name ?? ''
    dispatch({ type: 'invite', personId, capsuleId: crypto.randomUUID(), text: `${name}, привет! Я тоже свободен(на) сейчас и рядом — может, кофе в ближайшие полчаса?` })
    setPendingInvite(personId)
  }
  useEffect(() => {
    if (!pendingInvite) return
    const c = state.capsules.find((x) => x.personId === pendingInvite && x.status !== 'met')
    if (c) { setPendingInvite(null); setPerson(null); setTab('capsules'); setChat(c.id) }
  }, [pendingInvite, state.capsules])

  // Написать человеку: есть переписка — открываем её, нет — создаём личный чат.
  const messagePerson = (personId: string) => {
    const c = state.capsules.find((x) => x.personId === personId)
    if (c) { openChatById(c.id); return }
    const id = crypto.randomUUID()
    dispatch({ type: 'directMessage', personId, capsuleId: id })
    openChatById(id)
  }
  const closeChat = useCallback(() => setChat(null), [])
  const openChatById = useCallback((id: string) => { setPerson(null); setTab('capsules'); setChat(id) }, [])

  const respond = (a: Activity, text?: string) => {
    dispatch({ type: 'respond', activityId: a.id, text })
    setToast(a)
  }

  const unread = state.capsules.filter((c) => c.unread > 0 && !isExpired(c, now)).length + (state.groups ?? []).filter((g) => g.unread > 0).length
  const inChat = tab === 'capsules' && chat
  const titles: Record<Tab, string> = { home: '', search: 'Поиск', reels: 'Шортсы и планы', capsules: 'Чаты', profile: me.name, music: 'Музыка' }

  return (
    <ProfileNav.Provider value={openProfile}>
      <AchievementToast />
    <CallProvider>
    <div className="min-h-full mx-auto max-w-[480px] flex flex-col">
      {!inChat && (tab !== 'reels' || person) && (
        <header className={`bar fixed top-0 inset-x-0 mx-auto w-full max-w-[480px] z-20 pt-[env(safe-area-inset-top,0px)] px-4 flex items-center glass transition-transform duration-300 ease-out ${hideTop ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="w-full h-14 flex items-center justify-between gap-3">
          {tab === 'home' || person ? <Logo className="text-xl" /> : <h1 className="font-display font-bold text-lg truncate">{titles[tab]}</h1>}
          <div className="flex items-center gap-1 -mr-2">
            <button onClick={() => { setTab('music'); setChat(null); setPerson(null) }} className={`relative grid place-items-center w-10 h-10 cursor-pointer ${tab === 'music' ? 'text-spark' : ''}`} aria-label="Музыка">
              <Icon name="note" size={23} />
              {player.playing && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-spark anim-flick" />}
            </button>
            <button onClick={() => { setSeenBefore(state.noticesSeenAt ?? 0); setActivityOpen(true); dispatch({ type: 'seeNotices' }) }} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label={freshNotices ? `Уведомления: ${freshNotices} новых` : 'Уведомления'}>
              <Icon name="heart" size={25} />
              {freshNotices > 0 && <span className="anim-rise absolute top-0.5 right-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10.5px] font-bold tnum ring-2 ring-bg">{freshNotices > 9 ? '9+' : freshNotices}</span>}
            </button>
            <button onClick={() => { setTab('reels'); setChat(null); setPerson(null) }} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label="Шортсы и планы на весь экран">
              <Icon name="reels" size={24} />
            </button>
          </div>
          </div>
        </header>
      )}
      {!inChat && (tab !== 'reels' || person) && <div className="h-14 shrink-0" aria-hidden="true" />}

      <main className={`flex-1 ${inChat ? 'flex flex-col px-4' : tab === 'reels' && !person ? '' : player.track ? 'pb-[calc(168px+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(96px+env(safe-area-inset-bottom,0px))]'}`}>
        <div key={person ?? tab} className={`anim-page ${inChat ? 'flex-1 flex flex-col' : ''}`}>
        <Suspense fallback={<Loading />}>
        {person && <PersonProfile personId={person} now={now} onBack={() => setPerson(null)} onRespond={(a, t) => { setPerson(null); respond(a, t) }}
          onOpenCapsule={(id) => { setPerson(null); openCapsuleByActivity(id) }} onOpenChat={(id) => { setPerson(null); setTab('capsules'); setChat(id) }} />}
        {!person && tab === 'home' && <Feed now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} onCreate={() => setChoosing(true)} onInvite={invite} onMessage={messagePerson} />}
        {!person && tab === 'music' && <MusicPage />}
        {!person && tab === 'reels' && <Reels now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {!person && tab === 'search' && <Explore now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {!person && tab === 'capsules' && (chat && (state.capsules.some((c) => c.id === chat) || (state.groups ?? []).some((g) => g.id === chat)) ? ((state.groups ?? []).some((g) => g.id === chat) ? <GroupChat id={chat} onBack={closeChat} /> : <CapsuleChat id={chat} now={now} onBack={() => setChat(null)} />) : <div className="px-4 pt-3"><CapsuleList now={now} onOpen={setChat} onNew={messagePerson} /></div>)}
        {!person && tab === 'profile' && <Profile onSignOut={onSignOut} onAdmin={onAdmin} onRespond={respond} onOpenCapsule={openCapsuleByActivity} onCreatePlan={() => setCreating(true)} />}
        </Suspense>
        </div>
      </main>

      {!inChat && (tab !== 'reels' || person) && <MiniPlayer />}
      <SafetyBanner now={now} top={inChat ? 104 : 64} />
      <FullPlayer />
      <MessageAlerts openChat={tab === 'capsules' && !person ? chat : null} onOpen={openChatById} onOpenProfile={openProfile} />
      {creating && <Suspense fallback={null}><CreateActivity open={creating} onClose={() => { setCreating(false) }} now={now} /></Suspense>}
      <NewPublication open={posting} onClose={() => setPosting(false)} onDone={() => { setPosting(false); setTab('home'); setPerson(null); window.scrollTo(0, 0) }} />
      <Sheet open={choosing} onClose={() => setChoosing(false)} title="Что создать?">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: 'spark', title: 'План на встречу', go: () => setCreating(true) },
            { icon: 'plus', title: 'История', go: () => setStorying(true) },
            { icon: 'camera', title: 'Публикация', go: () => setPosting(true) },
            { icon: 'chat', title: 'Новый чат', go: () => setNewChat(true) },
          ].map((o) => (
            <button key={o.title} onClick={() => { setChoosing(false); o.go() }} className="flex flex-col items-center justify-center gap-2.5 h-[118px] rounded-[24px] bg-surface-2 cursor-pointer transition active:scale-95 hover:brightness-95">
              <span className="grid place-items-center w-12 h-12 rounded-full bg-brand text-white shadow-[0_8px_18px_-10px_rgb(255_79_134/.9)]"><Icon name={o.icon} size={22} /></span>
              <span className="font-semibold text-[15px]">{o.title}</span>
            </button>
          ))}
        </div>
      </Sheet>
      {storying && <Suspense fallback={null}><StoryCreator open={storying} onClose={() => { setStorying(false); setTab('home'); setPerson(null) }} /></Suspense>}
      {!consentOk && !localConsent() && <ConsentGate onAccept={acceptNow} onDecline={() => { dispatch({ type: 'signOut' }); onSignOut() }} />}
      <NewChatSheet open={newChat} onClose={() => setNewChat(false)} onPick={(id) => { setNewChat(false); messagePerson(id) }} onGroupCreated={(id) => { setNewChat(false); openChatById(id) }} />
      <ActivitySheet open={activityOpen} seenBefore={seenBefore} onClose={() => setActivityOpen(false)} now={now} openProfile={openProfile} onOpenCapsule={(id) => { setActivityOpen(false); setTab('capsules'); setChat(id) }} />

      {state.cloudError && (
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-40 w-[calc(100%-32px)] max-w-[448px] rounded-[18px] bg-danger-soft text-danger p-3 pr-11 text-[14px] shadow-soft" role="alert">
          {state.cloudError}
          <button onClick={() => dispatch({ type: 'cloudError', message: null })} className="absolute right-2 top-2 grid place-items-center w-8 h-8 rounded-full cursor-pointer" aria-label="Скрыть ошибку"><Icon name="x" size={16} /></button>
        </div>
      )}

      {toast && (
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 bottom-[calc(160px+env(safe-area-inset-bottom,0px))] z-40 w-[calc(100%-32px)] max-w-[448px] rounded-[22px] bg-surface text-fg p-3.5 flex items-center gap-3 shadow-soft ring-1 ring-line" role="status">
          <Icon name="spark" size={22} className="text-spark shrink-0" fill />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Чат открыт</div>
            <div className="text-[13px] text-muted">Напишите первым — точное место уже в чате.</div>
          </div>
          <button onClick={() => openCapsuleByActivity(toast.id)} className="shrink-0 h-9 px-4 rounded-xl bg-brand text-white font-semibold text-[14px] cursor-pointer">В чат</button>
        </div>
      )}

      <FounderSheet open={founderInfo} onClose={() => setFounderInfo(false)} />
      <VerifySheet open={verifying} onClose={() => setVerifying(false)} onDone={() => dispatch({ type: 'updateMe', patch: { verified: true } })} />
      {!inChat && (
        <nav className="nav-bar fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] inset-x-3 mx-auto z-30 max-w-[440px] rounded-[30px] px-2 py-1.5" aria-label="Разделы">
          <ul className="grid grid-cols-5 items-center">
            {NAV.map((t) => {
              const active = tab === t.id && !person
              // «Создать» — главная кнопка: круг в фирменном градиенте посередине.
              if (t.id === 'create') return (
                <li key={t.id} className="grid place-items-center">
                  <button onClick={() => setChoosing(true)} aria-label={t.label}
                    className="grid place-items-center w-[52px] h-[52px] rounded-full bg-brand text-white shadow-[0_8px_22px_-8px_rgb(255_79_134/.75)] cursor-pointer active:scale-90 transition-transform duration-200">
                    <Icon name="plus" size={26} className="[stroke-width:2.4]" />
                  </button>
                </li>
              )
              return (
                <li key={t.id}>
                  <button
                    onClick={() => { setTab(t.id as Tab); setChat(null); setPerson(null) }}
                    aria-current={active ? 'page' : undefined} aria-label={t.id === 'capsules' && unread ? `${t.label}: ${unread} непрочитанных` : t.label}
                    className={`group w-full h-[58px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-300 ${active ? 'text-spark' : 'text-muted hover:text-fg'}`}>
                    {/* мягкая «капсула» за значком активной вкладки */}
                    <span className={`relative grid place-items-center h-8 w-14 rounded-full transition-all duration-300 ease-out ${active ? 'bg-spark/12 scale-100' : 'bg-transparent scale-90 group-active:scale-95'}`}>
                      {t.id === 'profile' ? (
                        <span className={`grid place-items-center w-6 h-6 rounded-full overflow-hidden transition-opacity ${active ? 'opacity-100' : 'opacity-80'}`}><Avatar name={me.name} hue={me.hue} src={me.photo} size={24} /></span>
                      ) : (
                        <Icon name={t.icon} size={23} className="nav-icon" />
                      )}
                      {t.id === 'capsules' && unread > 0 && <span className="absolute -top-1 right-1.5 grid place-items-center min-w-[17px] h-[17px] px-1 rounded-full bg-danger text-white text-[10px] font-bold ring-2 ring-surface">{unread}</span>}
                    </span>
                    <span className={`text-[10.5px] leading-none tracking-[.01em] transition-all ${active ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
    </CallProvider>
    </ProfileNav.Provider>
  )
}

/** «Действия»: уведомления о сообщениях, лайках и системные объявления. */
/** Уведомления: только лайки, репосты и комментарии к моим планам и публикациям. */
/** Чужие комментарии, о которых нужно сообщить: под моими планами и публикациями и ответы на мои комментарии. */
function commentNotices(state: State) {
  const pick = (list: PlanComment[], mineTarget: (id: string) => boolean, short: boolean) => {
    const myIds = new Set(list.filter((c) => c.authorId === 'me').map((c) => c.id))
    return list.flatMap((c) => {
      if (c.authorId === 'me') return []
      const reply = !!c.replyTo && myIds.has(c.replyTo)
      return reply || mineTarget(c.planId) ? [{ ...c, reply, short }] : []
    })
  }
  return [
    ...pick(state.comments ?? [], (id) => state.activities.some((a) => a.id === id && a.authorId === 'me'), false),
    ...pick(state.shortComments ?? [], (id) => (state.shorts ?? []).some((s) => s.id === id && s.authorId === 'me'), true),
  ]
}

function ActivitySheet({ open, seenBefore, onClose, now, openProfile }: { open: boolean; seenBefore: number; onClose: () => void; now: number; onOpenCapsule: (capsuleId: string) => void; openProfile: (id: string) => void }) {
  const { state, dispatch } = useStore()
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const planTitle = (id?: string) => { const a = state.activities.find((x) => x.id === id); return a ? ` «${a.title}»` : '' }
  type Item = { key: string; person: Person; kind: 'like' | 'repost' | 'comment' | 'follow'; text: string; at: number }
  const items: Item[] = [
    // Лайки, репосты и новые подписчики с сервера.
    ...(state.notices ?? []).flatMap((n): Item[] => {
      const p = state.people.find((x) => x.id === n.personId)
      if (!p) return []
      if (n.kind === 'follow') return [{ key: n.id, person: p, kind: 'follow', text: 'подписался(ась) на вас', at: n.at }]
      if (n.kind === 'repost') return [{ key: n.id, person: p, kind: 'repost', text: `сделал(а) репост вашего плана${planTitle(n.targetId)}`, at: n.at }]
      return [{ key: n.id, person: p, kind: 'like', text: n.kind === 'likePlan' ? `нравится ваш план${planTitle(n.targetId)}` : 'нравится ваша публикация', at: n.at }]
    }),
    // Комментарии под моими планами и публикациями и ответы на мои комментарии.
    ...commentNotices(state).flatMap((c): Item[] => {
      const p = state.people.find((x) => x.id === c.authorId)
      const quote = `«${c.text.length > 80 ? c.text.slice(0, 79) + '…' : c.text}»`
      const text = c.reply ? `ответил(а) на ваш комментарий: ${quote}` : c.short ? `прокомментировал(а) вашу публикацию: ${quote}` : `прокомментировал(а)${planTitle(c.planId)}: ${quote}`
      return p ? [{ key: `${c.short ? 'sc' : 'c'}-${c.id}`, person: p, kind: 'comment', text, at: c.at }] : []
    }),
    // В демо лайки выдуманы, чтобы экран не пустовал.
    ...(state.cloud || !state.people.length ? [] : myPlans).map((a, i): Item => {
      const p = state.people[(i * 3 + 1) % state.people.length]
      return { key: `like-${a.id}`, person: p, kind: 'like', text: `и ещё ${4 + i} человек отметили ваш план «${a.title}»`, at: now - 25 * 60_000 * (i + 1) }
    }),
  ].sort((a, b) => b.at - a.at)
  const badge = { like: ['heart', 'bg-danger'], repost: ['send', 'bg-cobalt'], comment: ['comment', 'bg-ok'], follow: ['user', 'bg-violet'] } as const
  const following = state.following ?? []

  return (
    <Sheet open={open} onClose={onClose} title="Уведомления">
      <ul className="flex flex-col -mx-2">
        {items.map((it) => (
          <li key={it.key} className={`relative flex items-center rounded-xl ${it.at > seenBefore ? 'bg-spark/[.07]' : ''}`}>
            {it.at > seenBefore && <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-spark" aria-label="Новое" />}
            <button onClick={() => { onClose(); openProfile(it.person.id) }} className="flex-1 min-w-0 flex items-center gap-3 p-2 pl-3 rounded-xl text-left hover:bg-surface-2 cursor-pointer">
              <span className="relative shrink-0">
                <Avatar name={it.person.name} hue={it.person.hue} src={it.person.photo} size={44} />
                <span className={`absolute -right-1 -bottom-1 grid place-items-center w-5 h-5 rounded-full text-white border-2 border-surface ${badge[it.kind][1]}`}><Icon name={badge[it.kind][0]} size={10} fill={it.kind === 'like'} /></span>
              </span>
              <span className="flex-1 min-w-0 text-[14px]"><b>{it.person.name}</b> {it.text} <span className="text-muted">{relative(it.at, now)}</span></span>
            </button>
            {it.kind === 'follow' && (following.includes(it.person.id)
              ? <span className="shrink-0 mr-2 h-8 px-3 rounded-full bg-surface-2 text-[12.5px] font-semibold inline-flex items-center">Вы подписаны</span>
              : <button onClick={() => dispatch({ type: 'toggleFollow', personId: it.person.id })} className="shrink-0 mr-2 h-8 px-3 rounded-full bg-brand text-white text-[12.5px] font-semibold cursor-pointer">Подписаться</button>)}
          </li>
        ))}
        {!items.length && <li className="p-4 text-center text-muted">Пока тихо. Здесь появятся лайки, репосты и комментарии к вашим планам и публикациям.</li>}
      </ul>
    </Sheet>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <PlayerProvider>
        <CloudSync />
        <Root />
      </PlayerProvider>
    </StoreProvider>
  )
}
