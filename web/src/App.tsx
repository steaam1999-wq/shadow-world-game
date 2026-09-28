import { useEffect, useState } from 'react'
import { StoreProvider, useNow, useStore } from './store'
import { Landing } from './screens/Landing'
import { Onboarding } from './screens/Onboarding'
import { Ideas } from './screens/Ideas'
import { Vibe } from './screens/Vibe'
import { CapsuleChat, CapsuleList } from './screens/Capsules'
import { Profile } from './screens/Profile'
import { Admin } from './admin/Admin'
import { Icon, Logo } from './components/ui'
import { isExpired } from './lib'
import type { Activity } from './types'

type View = 'landing' | 'onboarding' | 'app' | 'admin'
type Tab = 'ideas' | 'vibe' | 'capsules' | 'profile'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'ideas', label: 'Идеи', icon: 'spark' },
  { id: 'vibe', label: 'Вайб', icon: 'vibe' },
  { id: 'capsules', label: 'Капсулы', icon: 'chat' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
]

function readHash(): string {
  try { return window.location.hash.slice(1) } catch { return '' }
}

function Root() {
  const { state } = useStore()
  const [view, setView] = useState<View>(() => (readHash() === 'admin' ? 'admin' : state.me ? 'app' : 'landing'))

  useEffect(() => {
    try { history.replaceState(null, '', view === 'admin' ? '#admin' : view === 'app' ? '#app' : ' ') } catch { /* ignore */ }
    window.scrollTo(0, 0)
  }, [view])

  if (view === 'admin') return <Admin onExit={() => setView(state.me ? 'app' : 'landing')} />
  if (view === 'onboarding') return <Onboarding onDone={() => setView('app')} onBack={() => setView('landing')} />
  if (view === 'app' && state.me) return <AppShell onSignOut={() => setView('landing')} onAdmin={() => setView('admin')} />
  return <Landing onStart={() => setView(state.me ? 'app' : 'onboarding')} onAdmin={() => setView('admin')} />
}

function AppShell({ onSignOut, onAdmin }: { onSignOut: () => void; onAdmin: () => void }) {
  const { state, dispatch } = useStore()
  const now = useNow()
  const [tab, setTab] = useState<Tab>('ideas')
  const [chat, setChat] = useState<string | null>(null)
  const [toast, setToast] = useState<Activity | null>(null)

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
  const respond = (a: Activity) => {
    dispatch({ type: 'respond', activityId: a.id })
    setToast(a)
  }

  const unread = state.capsules.filter((c) => c.unread > 0 && !isExpired(c, now)).length
  const showAnnouncement = state.announcement && state.announcement !== state.dismissedAnnouncement
  const inChat = tab === 'capsules' && chat

  return (
    <div className="min-h-full mx-auto max-w-[480px] bg-bg sm:border-x sm:border-line flex flex-col">
      {!inChat && (
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 bg-bg/90 backdrop-blur px-4 h-14 flex items-center justify-between">
          <Logo className="text-lg" />
          <span className="text-[13px] text-muted">Привет, {state.me!.name}</span>
        </header>
      )}

      <main className={`flex-1 px-4 ${inChat ? 'flex flex-col' : 'pt-2 pb-[calc(96px+env(safe-area-inset-bottom,0px))]'}`}>
        {showAnnouncement && !inChat && (
          <div className="anim-rise mb-4 flex items-start gap-3 rounded-2xl bg-cobalt-soft text-cobalt p-3.5">
            <Icon name="bell" size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-[14px] font-medium">{state.announcement}</p>
            <button onClick={() => dispatch({ type: 'dismissAnnouncement' })} aria-label="Скрыть уведомление" className="cursor-pointer"><Icon name="x" size={16} /></button>
          </div>
        )}
        {tab === 'ideas' && <Ideas now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {tab === 'vibe' && <Vibe now={now} onRespond={respond} onOpenCapsule={openCapsuleByActivity} />}
        {tab === 'capsules' && (chat ? <CapsuleChat id={chat} now={now} onBack={() => setChat(null)} /> : <CapsuleList now={now} onOpen={setChat} />)}
        {tab === 'profile' && <Profile onSignOut={onSignOut} onAdmin={onAdmin} />}
      </main>

      {toast && (
        <div className="anim-rise fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] z-40 w-[calc(100%-32px)] max-w-[448px] rounded-2xl bg-fg text-bg p-3.5 flex items-center gap-3 shadow-xl" role="status">
          <Icon name="spark" size={22} className="text-spark shrink-0" fill />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Капсула открыта</div>
            <div className="text-[13px] opacity-75">72 часа, чтобы договориться. Точное место уже в чате.</div>
          </div>
          <button onClick={() => openCapsuleByActivity(toast.id)} className="shrink-0 h-9 px-3 rounded-full bg-spark text-on-spark font-semibold text-[14px] cursor-pointer">В чат</button>
        </div>
      )}

      {!inChat && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom,0px)]" aria-label="Разделы">
          <ul className="grid grid-cols-4">
            {TABS.map((t) => (
              <li key={t.id}>
                <button onClick={() => { setTab(t.id); setChat(null) }} aria-current={tab === t.id ? 'page' : undefined}
                  className={`relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${tab === t.id ? 'text-spark' : 'text-muted hover:text-fg'}`}>
                  <Icon name={t.icon} size={22} fill={t.id === 'ideas' && tab === t.id} />
                  {t.label}
                  {t.id === 'capsules' && unread > 0 && (
                    <span className="absolute top-2 left-[calc(50%+6px)] grid place-items-center min-w-4 h-4 px-1 rounded-full bg-spark text-on-spark text-[10px] font-bold">{unread}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  )
}
