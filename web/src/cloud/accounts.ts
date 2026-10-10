// Несколько аккаунтов на одном устройстве: вошли один раз — дальше переключаемся без пароля.
// Храним для каждого аккаунта его ключ продления сессии (как Supabase хранит его для текущего входа)
// и обновляем ключ всякий раз, когда сессия продлевается. Выход из аккаунта убирает его из списка.
import { sb } from './api'

export interface SavedAccount { userId: string; email: string; name: string; photo?: string; refresh: string; at: number }
const KEY = 'komeeta-accounts'

export function savedAccounts(): SavedAccount[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function write(list: SavedAccount[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 5))) } catch { /* ignore */ }
  window.dispatchEvent(new Event('komeeta-accounts'))
}

/** Запомнить текущий аккаунт (имя и фото — для списка). */
export async function rememberCurrent(me: { name: string; photo?: string }) {
  const { data } = await sb().auth.getSession()
  const s = data.session
  if (!s?.refresh_token) return
  const list = savedAccounts().filter((a) => a.userId !== s.user.id)
  const photo = me.photo && !me.photo.startsWith('data:') ? me.photo : undefined
  write([{ userId: s.user.id, email: s.user.email ?? '', name: me.name, photo, refresh: s.refresh_token, at: Date.now() }, ...list])
}

/** Сессия продлилась — у сохранённого аккаунта новый ключ (старый перестаёт работать). */
let watching = false
export function watchAccounts() {
  if (watching) return
  watching = true
  sb().auth.onAuthStateChange((_e, s) => {
    if (!s?.refresh_token) return
    const list = savedAccounts()
    const i = list.findIndex((a) => a.userId === s.user.id)
    if (i < 0 || list[i].refresh === s.refresh_token) return
    list[i] = { ...list[i], refresh: s.refresh_token }
    write(list)
  })
}

export function forgetAccount(userId: string) {
  write(savedAccounts().filter((a) => a.userId !== userId))
}

/** Перейти в другой сохранённый аккаунт. Текущий остаётся в списке.
 *  Не «выходим» (это отозвало бы сессию на сервере) — просто подменяем сессию на этом устройстве. */
export async function switchAccount(userId: string, me: { name: string; photo?: string }): Promise<SavedAccount> {
  await rememberCurrent(me) // самый свежий ключ текущего аккаунта — чтобы вернуться
  const target = savedAccounts().find((a) => a.userId === userId)
  if (!target) throw new Error('Аккаунт не найден')
  const { data: cur } = await sb().auth.getSession()
  const back = cur.session ? savedAccounts().find((a) => a.userId === cur.session!.user.id) : undefined
  const { data, error } = await sb().auth.refreshSession({ refresh_token: target.refresh })
  if (error || !data.session) {
    forgetAccount(userId)
    // Вернуть текущий вход, если неудачная попытка его сбросила
    if (back) { const { data: now } = await sb().auth.getSession(); if (!now.session) await sb().auth.refreshSession({ refresh_token: back.refresh }).catch(() => null) }
    throw new Error('Вход в этот аккаунт устарел — войдите в него ещё раз.')
  }
  return target
}

/** Перед входом в ещё один аккаунт: текущий сохраняем. Новый вход сам заменит сессию на устройстве. */
export async function leaveForAnotherAccount(me: { name: string; photo?: string }) {
  await rememberCurrent(me)
}
