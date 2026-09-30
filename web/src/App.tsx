import { useCallback, useEffect, useState } from 'react'
import { StoreProvider, useNow, useStore } from './store'
import { PlayerProvider, usePlayer } from './music/player'
import { FullPlayer, MiniPlayer } from './music/PlayerUI'
import { MusicPage } from './music/MusicPage'
import { SafetyBanner } from './components/Meet'
import { PersonProfile } from './screens/PersonProfile'
import { ProfileNav } from './nav'
import { DEMO_ME, Landing } from './screens/Landing'
import { HOUR } from './data'
import { Onboarding } from './screens/Onboarding'
import { CreateActivity, Explore } from './screens/Explore'
import { Feed } from './screens/Feed'
import { Reels } from './screens/Reels'
import { NewPublication } from './screens/Shorts'
import { CapsuleChat, CapsuleList } from './screens/Capsules'
import { Profile } from './screens/Profile'
import { Admin } from './admin/Admin'
import { CloudSync } from './cloud/CloudSync'
import { MessageAlerts } from './components/Alerts'
import { fetchMyProfile, profileToMe } from './cloud/api'
import { cloudEnabled } from './cloud/config'
import { NewPassword } from './screens/NewPassword'
import { Avatar, Icon, Logo, Sheet } from './components/ui'
import { isExpired, relative } from './lib'
import type { Activity, Me } from './types'

type View = 'landing' | 'onboarding' | 'app' | 'admin' | 'recovery'
type Tab = 'home' | 'search' | 'reels' | 'capsules' | 'profile' | 'music'

const NAV: { id: Tab | 'create'; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'search', label: 'Поиск', icon: 'search' },
  { id: 'create', label: 'Создать', icon: 'create' },
  { id: 'reels', label: 'Планы на весь экран', icon: 'reels' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
]

function readHash(): string {
  try { return window.location.hash.slice(1) } catch { return '' }
}

function Root() {
  const { state, dispatch } = useStore()
  const [view, setView] = useState<View>(() => {
    const hash = readHash()
    if (cloudEnabled && /type=recovery|error_code=/.test(hash)) return 'recovery' // ссылка «новый пароль» из письма
    return hash === 'admin' ? 'admin' : state.me ? 'app' : 'landing'
  })
  const [reg, setReg] = useState<{ name: string; method: Me['authMethod'] } | null>(null)

  useEffect(() => {
    if (view === 'recovery') return // токен восстановления из адреса ещё нужен экрану нового пароля
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

  if (view === 'recovery') return <NewPassword onDone={(userId, email) => onCloudAuth(userId, email, '')} onCancel={() => setView('landing')} />
  if (view === 'admin') return <Admin onExit={() => setView(state.me ? 'app' : 'landing')} />
  if (view === 'onboarding') return <Onboarding initialName={reg?.name} method={reg?.method ?? null} onDone={() => setView('app')} onBack={() => setView('landing')} />
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
  const [tab, setTab] = useState<Tab>('home')
  const [chat, setChat] = useState<string | null>(null)
  const [person, setPerson] = useState<string | null>(null)
  const openProfile = (id: string) => { setPerson(id); setChat(null); window.scrollTo(0, 0) }
  const [toast, setToast] = useState<Activity | null>(null)
  const [creating, setCreating] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
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
    const c = state.capsules.find((x) => x.activityId === activityId)
    if (c) { setTab('capsules'); setChat(c.id); setToast(null) }
  }
  // «Позвать» из «Свободны сейчас»: создаём капсулу и открываем её, как только она появится.
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const invite = (personId: string) => {
    const name = state.people.find((p) => p.id === personId)?.name ?? ''
    dispatch({ type: 'invite', personId, text: `${name}, привет! Я тоже свободен(на) сейчас и рядом — может, кофе в ближайшие полчаса?` })
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
  const openChatById = useCallback((id: string) => { setPerson(null); setTab('capsules'); setChat(id) }, [])

  const respond = (a: Activity, text?: string) => {
    dispatch({ type: 'respond', activityId: a.id, text })
    setToast(a)
  }

  const unread = state.capsules.filter((c) => c.unread > 0 && !isExpired(c, now)).length
  const inChat = tab === 'capsules' && chat
  const titles: Record<Tab, string> = { home: '', search: 'Поиск', reels: 'Планы', capsules: 'Сообщения', profile: me.name, music: 'Музыка' }

  return (
    <ProfileNav.Provider value={openProfile}>
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
            <button onClick={() => { setActivityOpen(true); dispatch({ type: 'seeNotices' }) }} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label="Уведомления">
              <Icon name="heart" size={25} />
              {((state.announcement && state.announcement !== state.dismissedAnnouncement) || (state.notices ?? []).some((n) => n.at > (state.noticesSeenAt ?? 0))) && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />}
            </button>
            {tab !== 'capsules' && (
              <button onClick={() => { setTab('capsules'); setChat(null); setPerson(null) }} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label="Сообщения">
                <Icon name="send" size={24} />
                {unread > 0 && <span className="absolute top-1 right-0.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold border-2 border-surface">{unread}</span>}
              </button>
            )}
          </div>
          </div>
        </header>
      )}
      {!inChat && (tab !== 'reels' || person) && <div className="h-14 shrink-0" aria-hidden="true" />}

      <main className={`flex-1 ${inChat ? 'flex flex-col px-4' : tab === 'reels' && !person ? '' : player.track ? 'pb-[calc(168px+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(96px+env(safe-area-inset-bottom,0px))]'}`}>
        {person && <PersonProfile personId={person} now={now} onBack={() => setPerson(null)} onRespond={(a, t) => { setPerson(null); respond(a, t) }}
          onOpenCapsule={(id) => { setPerson(null); openCapsuleByActivity(id) }} onOpenChat={(id) => { setPerson(null); setTab('capsules'); setChat(id) }} />}
        {!person && tab === 'home' && <Feed now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} onCreate={() => setChoosing(true)} onInvite={invite} onMessage={messagePerson} />}
        {!person && tab === 'music' && <MusicPage />}
        {!person && tab === 'reels' && <Reels now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} onMessage={messagePerson} />}
        {!person && tab === 'search' && <Explore now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {!person && tab === 'capsules' && (chat ? <CapsuleChat id={chat} now={now} onBack={() => setChat(null)} /> : <div className="px-4 pt-3"><CapsuleList now={now} onOpen={setChat} /></div>)}
        {!person && tab === 'profile' && <Profile onSignOut={onSignOut} onAdmin={onAdmin} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
      </main>

      {!inChat && (tab !== 'reels' || person) && <MiniPlayer />}
      <SafetyBanner now={now} top={inChat ? 104 : 64} />
      <FullPlayer />
      <MessageAlerts openChat={tab === 'capsules' && !person ? chat : null} onOpen={openChatById} onOpenProfile={openProfile} />
      <CreateActivity open={creating} onClose={() => { setCreating(false) }} now={now} />
      <NewPublication open={posting} onClose={() => setPosting(false)} onDone={() => { setPosting(false); setTab('home'); setPerson(null); window.scrollTo(0, 0) }} />
      <Sheet open={choosing} onClose={() => setChoosing(false)} title="Что опубликовать?">
        <div className="flex flex-col gap-2">
          {[
            { icon: 'camera', title: 'Публикация', text: 'Фото или видео с подписью — появится на главной', go: () => setPosting(true) },
            { icon: 'spark', title: 'План на встречу', text: 'Позовите людей: что, где и когда, на 48 часов', go: () => setCreating(true) },
          ].map((o) => (
            <button key={o.title} onClick={() => { setChoosing(false); o.go() }} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2 text-left cursor-pointer hover:brightness-95">
              <span className="grid place-items-center w-11 h-11 rounded-full bg-brand text-white shrink-0"><Icon name={o.icon} size={20} /></span>
              <span className="min-w-0"><span className="block font-semibold">{o.title}</span><span className="block text-[13px] text-muted">{o.text}</span></span>
            </button>
          ))}
        </div>
      </Sheet>
      <ActivitySheet open={activityOpen} onClose={() => setActivityOpen(false)} now={now} openProfile={openProfile} onOpenCapsule={(id) => { setActivityOpen(false); setTab('capsules'); setChat(id) }} />

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

      {!inChat && (
        <nav className="glass glass-solid fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] inset-x-3 mx-auto z-30 max-w-[456px] rounded-[32px] p-1.5" aria-label="Разделы">
          <ul className="relative grid grid-cols-5">
            {NAV.map((t) => {
              const active = tab === t.id
              return (
                <li key={t.id}>
                  <button
                    onClick={() => (t.id === 'create' ? setChoosing(true) : (setTab(t.id), setChat(null), setPerson(null)))}
                    aria-current={active ? 'page' : undefined} aria-label={t.label}
                    className={`relative w-full h-13 grid place-items-center rounded-[26px] cursor-pointer transition duration-300 ${active ? 'text-fg tab-active' : 'text-fg/80 hover:text-fg'}`}>
                    {t.id === 'profile' ? (
                      <Avatar name={me.name} hue={me.hue} src={me.photo} size={28} />
                    ) : (
                      <Icon name={t.icon} size={26} fill={active && (t.id === 'home')} className="tab-icon" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
    </ProfileNav.Provider>
  )
}

/** «Действия»: уведомления о сообщениях, лайках и системные объявления. */
function ActivitySheet({ open, onClose, now, onOpenCapsule, openProfile }: { open: boolean; onClose: () => void; now: number; onOpenCapsule: (capsuleId: string) => void; openProfile: (id: string) => void }) {
  const { state, dispatch } = useStore()
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const items = [
    ...(state.announcement ? [{ key: 'ann', person: null, text: state.announcement, at: now, onClick: () => dispatch({ type: 'dismissAnnouncement' }) }] : []),
    ...state.capsules.filter((c) => !c.hidden && !isExpired(c, now) && state.people.some((x) => x.id === c.personId)).map((c) => {
      const p = state.people.find((x) => x.id === c.personId)!
      const last = [...c.messages].reverse().find((m) => m.from === 'them')
      return { key: c.id, person: p, text: last ? `${p.name}: «${last.text}»` : `Чат с ${p.name}`, at: last?.at ?? c.createdAt, onClick: () => onOpenCapsule(c.id) }
    }),
    // Лайки и подписки с сервера.
    ...(state.notices ?? []).flatMap((n) => {
      const p = state.people.find((x) => x.id === n.personId)
      if (!p) return []
      const plan = n.kind === 'likePlan' ? state.activities.find((x) => x.id === n.targetId) : undefined
      const text = n.kind === 'follow' ? `${p.name} подписал(ась) на вас` : n.kind === 'likePlan' ? `${p.name}: нравится ваш план${plan ? ` «${plan.title}»` : ''}` : `${p.name}: нравится ваша публикация`
      return [{ key: n.id, person: p, text, at: n.at, onClick: () => { onClose(); openProfile(p.id) } }]
    }),
    // В демо отметки планов выдуманы, чтобы экран не пустовал.
    ...(state.cloud || !state.people.length ? [] : myPlans).map((a, i) => {
      const p = state.people[(i * 3 + 1) % state.people.length]
      return { key: `like-${a.id}`, person: p, text: `${p.name} и ещё ${4 + i} человек отметили ваш план «${a.title}»`, at: now - 25 * 60_000 * (i + 1), onClick: onClose }
    }),
  ].sort((a, b) => b.at - a.at)

  return (
    <Sheet open={open} onClose={onClose} title="Уведомления">
      <ul className="flex flex-col -mx-2">
        {items.map((it) => (
          <li key={it.key}>
            <button onClick={it.onClick} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-surface-2 cursor-pointer">
              {it.person ? <Avatar name={it.person.name} hue={it.person.hue} src={it.person.photo} size={44} /> : <span className="grid place-items-center w-11 h-11 rounded-full bg-cobalt-soft text-cobalt shrink-0"><Icon name="bell" /></span>}
              <span className="flex-1 min-w-0 text-[14px]">{it.text} <span className="text-muted">{relative(it.at, now)}</span></span>
            </button>
          </li>
        ))}
        {!items.length && <li className="p-4 text-center text-muted">Пока тихо. Откликнитесь на план, и здесь появятся ответы.</li>}
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
