import { useEffect, useState } from 'react'
import { StoreProvider, useNow, useStore } from './store'
import { PlayerProvider, usePlayer } from './music/player'
import { FullPlayer, MiniPlayer } from './music/PlayerUI'
import { MusicPage } from './music/MusicPage'
import { DEMO_ME, Landing } from './screens/Landing'
import { HOUR } from './data'
import { Onboarding } from './screens/Onboarding'
import { CreateActivity, Explore } from './screens/Explore'
import { Feed } from './screens/Feed'
import { Reels } from './screens/Reels'
import { CapsuleChat, CapsuleList } from './screens/Capsules'
import { Profile } from './screens/Profile'
import { Admin } from './admin/Admin'
import { Avatar, Icon, Logo, Sheet, ThemeToggle } from './components/ui'
import { isExpired, relative } from './lib'
import type { Activity, Me } from './types'

type View = 'landing' | 'onboarding' | 'app' | 'admin'
type Tab = 'home' | 'search' | 'reels' | 'capsules' | 'profile' | 'music'

const NAV: { id: Tab | 'create'; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'search', label: 'Поиск', icon: 'search' },
  { id: 'create', label: 'Новый план', icon: 'create' },
  { id: 'reels', label: 'Планы на весь экран', icon: 'reels' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
]

function readHash(): string {
  try { return window.location.hash.slice(1) } catch { return '' }
}

function Root() {
  const { state, dispatch } = useStore()
  const [view, setView] = useState<View>(() => (readHash() === 'admin' ? 'admin' : state.me ? 'app' : 'landing'))
  const [reg, setReg] = useState<{ name: string; method: Me['authMethod'] } | null>(null)

  useEffect(() => {
    try { history.replaceState(null, '', view === 'admin' ? '#admin' : view === 'app' ? '#app' : ' ') } catch { /* ignore */ }
    window.scrollTo(0, 0)
  }, [view])

  const enterDemo = () => {
    dispatch({ type: 'signIn', me: DEMO_ME })
    if (!state.activities.some((a) => a.authorId === 'me')) {
      const now = Date.now()
      const plan = (title: string, category: string, area: string, exactPlace: string, inHours: number, x: number, y: number) =>
        dispatch({ type: 'createActivity', activity: { title, category, area, exactPlace, startsAt: now + inHours * HOUR, durationMin: 90, expiresAt: now + (inHours + 1.5) * HOUR, x, y } })
      plan('Утренний кофе у Чистых прудов, расскажу про любимые обжарки', 'Кофе', 'Чистые пруды', 'Кофейня у выхода из метро', 14, 62, 30)
      plan('Иду в Пушкинский на импрессионистов, ищу компанию', 'Выставка', 'Хамовники', 'Главный вход, Волхонка, 12', 22, 30, 60)
      plan('Прогулка вдоль Яузы на закате', 'Прогулка', 'Басманный', 'Мост у Андроникова монастыря', 30, 76, 36)
    }
    setView('app')
  }

  if (view === 'admin') return <Admin onExit={() => setView(state.me ? 'app' : 'landing')} />
  if (view === 'onboarding') return <Onboarding initialName={reg?.name} method={reg?.method ?? null} onDone={() => setView('app')} onBack={() => setView('landing')} />
  if (view === 'app' && state.me) return <AppShell onSignOut={() => setView('landing')} onAdmin={() => setView('admin')} />
  return (
    <Landing
      onDemo={enterDemo}
      onLogin={() => { if (state.savedMe) { dispatch({ type: 'signIn', me: state.savedMe }); setView('app') } else enterDemo() }}
      onRegister={(name, method) => { setReg({ name, method }); setView('onboarding') }}
      onAdmin={() => setView('admin')}
    />
  )
}

function AppShell({ onSignOut, onAdmin }: { onSignOut: () => void; onAdmin: () => void }) {
  const { state, dispatch } = useStore()
  const now = useNow()
  const me = state.me!
  const [tab, setTab] = useState<Tab>('home')
  const [chat, setChat] = useState<string | null>(null)
  const [toast, setToast] = useState<Activity | null>(null)
  const [creating, setCreating] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  // Верхняя панель уезжает при прокрутке вниз и возвращается при прокрутке вверх, как в Инстаграме.
  const [hideTop, setHideTop] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > last + 6 && y > 56) setHideTop(true)
      else if (y < last - 6 || y < 56) setHideTop(false)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setHideTop(false) }, [tab])
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
  const respond = (a: Activity, text?: string) => {
    dispatch({ type: 'respond', activityId: a.id, text })
    setToast(a)
  }

  const unread = state.capsules.filter((c) => c.unread > 0 && !isExpired(c, now)).length
  const inChat = tab === 'capsules' && chat
  const titles: Record<Tab, string> = { home: '', search: 'Поиск', reels: 'Планы', capsules: 'Сообщения', profile: me.name, music: 'Музыка' }

  return (
    <div className="min-h-full mx-auto max-w-[480px] flex flex-col">
      {!inChat && tab !== 'reels' && (
        <header className={`sticky top-[env(safe-area-inset-top,0px)] z-20 bg-surface/55 backdrop-blur-xl px-4 h-14 flex items-center justify-between gap-3 transition-transform duration-300 ease-out ${hideTop ? '-translate-y-[calc(100%+env(safe-area-inset-top,0px))]' : ''}`}>
          {tab === 'home' ? <Logo className="text-xl" /> : <h1 className="font-display font-bold text-lg truncate">{titles[tab]}</h1>}
          <div className="flex items-center gap-1 -mr-2">
            <ThemeToggle />
            <button onClick={() => { setTab('music'); setChat(null) }} className={`relative grid place-items-center w-10 h-10 cursor-pointer ${tab === 'music' ? 'text-spark' : ''}`} aria-label="Музыка">
              <Icon name="note" size={23} />
              {player.playing && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-spark anim-flick" />}
            </button>
            <button onClick={() => setActivityOpen(true)} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label="Уведомления">
              <Icon name="heart" size={25} />
              {state.announcement && state.announcement !== state.dismissedAnnouncement && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />}
            </button>
            {tab !== 'capsules' && (
              <button onClick={() => { setTab('capsules'); setChat(null) }} className="relative grid place-items-center w-10 h-10 cursor-pointer" aria-label="Сообщения">
                <Icon name="send" size={24} />
                {unread > 0 && <span className="absolute top-1 right-0.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold border-2 border-surface">{unread}</span>}
              </button>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 ${inChat ? 'flex flex-col px-4' : tab === 'reels' ? '' : player.track ? 'pb-[calc(140px+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(72px+env(safe-area-inset-bottom,0px))]'}`}>
        {tab === 'home' && <Feed now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} onCreate={() => setCreating(true)} />}
        {tab === 'music' && <MusicPage />}
        {tab === 'reels' && <Reels now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {tab === 'search' && <Explore now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {tab === 'capsules' && (chat ? <CapsuleChat id={chat} now={now} onBack={() => setChat(null)} /> : <div className="px-4 pt-3"><CapsuleList now={now} onOpen={setChat} /></div>)}
        {tab === 'profile' && <Profile onSignOut={onSignOut} onAdmin={onAdmin} />}
      </main>

      {!inChat && tab !== 'reels' && <MiniPlayer />}
      <FullPlayer />
      <CreateActivity open={creating} onClose={() => { setCreating(false) }} now={now} />
      <ActivitySheet open={activityOpen} onClose={() => setActivityOpen(false)} now={now} onOpenCapsule={(id) => { setActivityOpen(false); setTab('capsules'); setChat(id) }} />

      {toast && (
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 bottom-[calc(132px+env(safe-area-inset-bottom,0px))] z-40 w-[calc(100%-32px)] max-w-[448px] rounded-[22px] bg-surface text-fg p-3.5 flex items-center gap-3 shadow-soft ring-1 ring-line" role="status">
          <Icon name="spark" size={22} className="text-spark shrink-0" fill />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Капсула открыта</div>
            <div className="text-[13px] text-muted">72 часа, чтобы договориться. Точное место уже в чате.</div>
          </div>
          <button onClick={() => openCapsuleByActivity(toast.id)} className="shrink-0 h-9 px-4 rounded-xl bg-brand text-white font-semibold text-[14px] cursor-pointer">В чат</button>
        </div>
      )}

      {!inChat && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] bg-surface/65 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom,0px)]" aria-label="Разделы">
          <ul className="grid grid-cols-5">
            {NAV.map((t) => {
              const active = tab === t.id
              return (
                <li key={t.id}>
                  <button
                    onClick={() => (t.id === 'create' ? setCreating(true) : (setTab(t.id), setChat(null)))}
                    aria-current={active ? 'page' : undefined} aria-label={t.label}
                    className={`relative w-full h-14 grid place-items-center cursor-pointer ${active ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                    {t.id === 'profile' ? (
                      <span className={`rounded-full ${active ? 'ring-2 ring-fg ring-offset-1 ring-offset-surface' : ''}`}><Avatar name={me.name} hue={me.hue} src={me.photo} size={26} /></span>
                    ) : (
                      <Icon name={t.icon} size={26} fill={active && (t.id === 'home')} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}

/** «Действия»: уведомления о сообщениях, лайках и системные объявления. */
function ActivitySheet({ open, onClose, now, onOpenCapsule }: { open: boolean; onClose: () => void; now: number; onOpenCapsule: (capsuleId: string) => void }) {
  const { state, dispatch } = useStore()
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const items = [
    ...(state.announcement ? [{ key: 'ann', person: null, text: state.announcement, at: now, onClick: () => dispatch({ type: 'dismissAnnouncement' }) }] : []),
    ...state.capsules.filter((c) => !isExpired(c, now)).map((c) => {
      const p = state.people.find((x) => x.id === c.personId)!
      const last = [...c.messages].reverse().find((m) => m.from === 'them')
      return { key: c.id, person: p, text: last ? `${p.name}: «${last.text}»` : `Капсула с ${p.name} открыта`, at: last?.at ?? c.createdAt, onClick: () => onOpenCapsule(c.id) }
    }),
    ...myPlans.map((a, i) => {
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
              {it.person ? <Avatar name={it.person.name} hue={it.person.hue} size={44} /> : <span className="grid place-items-center w-11 h-11 rounded-full bg-cobalt-soft text-cobalt shrink-0"><Icon name="bell" /></span>}
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
        <Root />
      </PlayerProvider>
    </StoreProvider>
  )
}
