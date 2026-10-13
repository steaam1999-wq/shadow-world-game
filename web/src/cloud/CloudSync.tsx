import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import * as api from './api'
import { editedSince, setReloader } from './sync'
import { ageFrom } from '../lib'
import { usePresenceHeartbeat } from './presence'
import { rememberCurrent, watchAccounts } from './accounts'

/** Держит данные в актуальном виде: первая загрузка, живые обновления из базы и страховочный опрос. */
export function CloudSync() {
  const { state, dispatch } = useStore()
  const ref = useRef(state)
  useEffect(() => { ref.current = state })
  const userId = state.cloud?.userId
  usePresenceHeartbeat(userId)

  useEffect(() => {
    if (!userId) return
    let alive = true, busy = false, again = false
    let live = false, lastLoad = 0, migrated = false, movedAvatar = false, triedAvatar = false, fails = 0
    const isNet = (m: string) => /Нет связи/.test(m)
    const load = async () => {
      if (busy) { again = true; return }
      busy = true
      lastLoad = Date.now()
      try {
        // Сессия могла истечь или смениться на другом экране — тогда выходим, а не показываем чужое.
        const user = await api.currentUser()
        if (!alive) return
        if (!user || user.id !== userId) { dispatch({ type: 'signOut' }); return }
        const started = Date.now()
        const d = await api.loadAll(userId, ref.current.me, ref.current.cloudRead ?? {})
        // Пока грузили, человек что-то сделал — эти данные уже устарели; перечитаем ещё раз.
        if (alive && editedSince(started)) { again = true; return }
        if (alive) dispatch({ type: 'cloudLoad', ...d })
        // Связь вернулась — убираем прежний баннер «нет связи», он уже неверный.
        fails = 0
        if (alive && ref.current.cloudError && isNet(ref.current.cloudError)) dispatch({ type: 'cloudError', message: null })
        // Этот аккаунт — в список для быстрого переключения
        if (alive && d.me) { watchAccounts(); void rememberCurrent(d.me).catch(() => {}) }
        // Прошёл день рождения — пересчитываем возраст по дате рождения.
        if (alive && d.me?.birthDate && ageFrom(d.me.birthDate) !== d.me.age) dispatch({ type: 'updateMe', patch: { age: ageFrom(d.me.birthDate) } })
        // Аватарка ещё в закрытом хранилище — один раз переносим в открытое, чтобы ссылка не устаревала.
        if (alive && !movedAvatar && d.me?.photoPath && !d.me.photoPath.startsWith('avatars/') && d.me.photo?.startsWith('http')) {
          movedAvatar = true
          const src = d.me.photo
          void fetch(src).then((r) => r.blob()).then((b) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = rej; fr.readAsDataURL(b) }))
            .then((dataUrl) => { if (alive) dispatch({ type: 'updateMe', patch: { photo: dataUrl } }) }).catch(() => { movedAvatar = false })
        }
        // Вошли через Telegram или Google, а фото в профиле нет — один раз берём фото оттуда.
        if (alive && d.me && !d.me.photo && !d.me.photoPath && !triedAvatar) {
          triedAvatar = true
          const key = `komeeta-avatar-import:${userId}`
          let done = false
          try { done = localStorage.getItem(key) === '1' } catch { /* ignore */ }
          if (!done) void api.importAvatar().then((photo) => {
            try { localStorage.setItem(key, '1') } catch { /* ignore */ }
            if (photo && alive && !ref.current.me?.photo) dispatch({ type: 'updateMe', patch: { photo } })
          }).catch(() => { /* попробуем при следующем входе */ })
        }
        // Старое фото профиля лежит прямо в базе — один раз переносим его в хранилище.
        if (alive && !migrated && d.me?.photo?.startsWith('data:') && !d.me.photoPath) { migrated = true; dispatch({ type: 'updateMe', patch: {} }) }
      } catch (e) {
        const msg = api.humanError(e)
        // iPhone после фона отдаёт первую «битую» попытку — тихо повторяем и ругаемся, только если связи нет совсем.
        if (isNet(msg) && ++fails < 3) { if (alive) setTimeout(() => void load(), 900 * fails) }
        else if (alive) dispatch({ type: 'cloudError', message: msg })
      } finally {
        busy = false
        if (again && alive) { again = false; void load() }
      }
    }
    // Несколько событий подряд (сообщение + обновление чата) — одна перезагрузка.
    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => void load(), 400) }

    setReloader(() => void load())
    void load()
    const channel = api.subscribe(soon, (m) => {
      if (m.photo_path) return // сообщение с фото придёт с перезагрузкой — там уже будет ссылка на фото
      dispatch({ type: 'cloudMessage', capsuleId: m.capsule_id, id: String(m.id), mine: m.sender === userId, text: m.body, at: new Date(m.created_at).getTime() })
    }, (ok) => { live = ok }, (m) => {
      if (m.photo_path) return
      dispatch({ type: 'cloudGroupMessage', groupId: m.group_id, id: String(m.id), senderId: m.sender === userId ? 'me' : m.sender, text: m.body, at: new Date(m.created_at).getTime() })
    })

    // Вернулись в приложение (iPhone рвёт соединение в фоне) — сразу проверяем новое и переподключаемся.
    const wake = () => {
      if (document.visibilityState !== 'visible') return
      void load()
      if (!live) channel.reconnect()
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('focus', wake)
    window.addEventListener('online', wake)
    window.addEventListener('pageshow', wake)
    // Страховка, пока приложение открыто: без живого канала — раз в 15 секунд, с ним — раз в минуту. В фоне не опрашиваем.
    const poll = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (!live) { channel.reconnect(); void load() } else if (Date.now() - lastLoad > 60_000) void load()
    }, 15_000)

    return () => {
      alive = false; clearTimeout(timer); clearInterval(poll); channel.stop(); setReloader(null)
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('focus', wake)
      window.removeEventListener('online', wake)
      window.removeEventListener('pageshow', wake)
    }
  }, [userId, dispatch])
  return null
}
