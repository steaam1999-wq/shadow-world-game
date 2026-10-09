// «В сети»: отмечаемся, пока приложение открыто, и раз в 30 секунд узнаём, кто сейчас в сети.
import { useEffect, useSyncExternalStore } from 'react'
import { sb } from './api'

type Seen = { seenAt: number; onlineUntil: number }
let seen = new Map<string, Seen>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

async function refresh() {
  const { data } = await sb().from('presence').select('user_id, seen_at, online_until').limit(1000)
  if (!data) return
  seen = new Map((data as { user_id: string; seen_at: string; online_until: string | null }[])
    .map((r) => [r.user_id, { seenAt: new Date(r.seen_at).getTime(), onlineUntil: r.online_until ? new Date(r.online_until).getTime() : 0 }]))
  emit()
}

/** Подключить «в сети» для вошедшего человека (один раз, в корне приложения). */
export function usePresenceHeartbeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    const touch = (on: boolean) => { void sb().rpc('touch_seen', { on_line: on }).then(() => {}, () => {}) }
    const visible = () => document.visibilityState === 'visible'
    const beat = () => { if (visible()) { touch(true); void refresh() } }
    const change = () => { if (visible()) beat(); else touch(false) }
    const leave = () => touch(false)
    beat()
    const t = setInterval(beat, 30_000)
    document.addEventListener('visibilitychange', change)
    window.addEventListener('pagehide', leave)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', change); window.removeEventListener('pagehide', leave) }
  }, [userId])
}

/** Когда человек был в сети: online — прямо сейчас, иначе время последнего визита (или undefined). */
export function usePresence(personId: string | undefined): { online: boolean; seenAt?: number } {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l) } }, () => (personId ? seen.get(personId) : undefined))
  if (!s) return { online: false }
  return { online: s.onlineUntil > Date.now(), seenAt: s.seenAt }
}

/** «в сети» / «был(а) 5 мин назад» / «был(а) вчера в 21:40». */
export function seenLabel(p: { online: boolean; seenAt?: number }, now = Date.now()): string | null {
  if (p.online) return 'в сети'
  if (!p.seenAt) return null
  const min = Math.floor((now - p.seenAt) / 60_000)
  if (min < 1) return 'был(а) только что'
  if (min < 60) return `был(а) ${min} мин назад`
  const d = new Date(p.seenAt), today = new Date(now)
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `был(а) в ${time}`
  const y = new Date(now - 86_400_000)
  if (d.toDateString() === y.toDateString()) return `был(а) вчера в ${time}`
  return `был(а) ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
}
