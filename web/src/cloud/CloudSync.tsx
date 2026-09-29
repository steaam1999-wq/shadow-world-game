import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import * as api from './api'
import { setReloader } from './sync'

/** Держит данные в актуальном виде: первая загрузка, живые обновления из базы и страховочный опрос раз в минуту. */
export function CloudSync() {
  const { state, dispatch } = useStore()
  const ref = useRef(state)
  useEffect(() => { ref.current = state })
  const userId = state.cloud?.userId

  useEffect(() => {
    if (!userId) return
    let alive = true, busy = false, again = false
    const load = async () => {
      if (busy) { again = true; return }
      busy = true
      try {
        // Сессия могла истечь или смениться на другом экране — тогда выходим, а не показываем чужое.
        const user = await api.currentUser()
        if (!alive) return
        if (!user || user.id !== userId) { dispatch({ type: 'signOut' }); return }
        const d = await api.loadAll(userId, ref.current.me, ref.current.cloudRead ?? {})
        if (alive) dispatch({ type: 'cloudLoad', ...d })
      } catch (e) {
        if (alive) dispatch({ type: 'cloudError', message: api.humanError(e) })
      } finally {
        busy = false
        if (again && alive) { again = false; void load() }
      }
    }
    setReloader(() => void load())
    void load()
    const off = api.subscribe(() => void load())
    const t = setInterval(() => void load(), 60_000)
    return () => { alive = false; off(); clearInterval(t); setReloader(null) }
  }, [userId, dispatch])
  return null
}
