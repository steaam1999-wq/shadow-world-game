import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CAPSULE_TTL, DISTRICT_XY } from '../data'
import type { Activity, Capsule, CapsuleStatus, Me, Message, Person, PlanComment } from '../types'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

let client: SupabaseClient | null = null
export function sb() {
  // implicit: ссылка из письма (восстановление пароля) приносит сессию прямо в адресе страницы.
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'implicit' } })
  return client
}

interface ProfileRow { id: string; name: string; age: number; bio: string; district: string; hue: number; tags: string[]; answers: Record<string, string>; photo: string | null; verified: boolean; meetings: number }
interface PlanRow { id: string; author: string; title: string; category: string; area: string; starts_at: string; duration_min: number; expires_at: string; x: number; y: number; photo: string | null; time_hidden: boolean; group_size: number | null }
interface CapsuleRow { id: string; plan_id: string | null; author: string; responder: string; status: CapsuleStatus; created_at: string; expires_at: string }
interface MessageRow { id: number; capsule_id: string; sender: string; body: string; created_at: string }

const ms = (iso: string) => new Date(iso).getTime()

/** Перевод ошибок Supabase на понятный язык. */
export function humanError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(m)) return 'Неверная почта или пароль.'
  if (/Email not confirmed/i.test(m)) return 'Почта ещё не подтверждена — откройте письмо от ISKRA и нажмите ссылку.'
  if (/User already registered/i.test(m)) return 'Такая почта уже зарегистрирована — войдите.'
  if (/Password should be/i.test(m)) return 'Пароль слишком простой: нужно минимум 6 символов.'
  if (/rate limit|too many/i.test(m)) return 'Слишком много попыток. Подождите минуту.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Нет связи с сервером. Проверьте интернет.'
  // Отказ правил доступа: блокировка между людьми или бан модератором.
  if (/row-level security.*"(capsules|messages)"/i.test(m)) return 'Написать нельзя: переписка заблокирована или аккаунт ограничен модератором.'
  if (/row-level security.*"plans"/i.test(m)) return 'Публиковать планы нельзя: аккаунт ограничен модератором.'
  if (/row-level security/i.test(m)) return 'Это действие запрещено.'
  return 'Ошибка сервера: ' + m
}

export async function signIn(email: string, password: string) {
  const { data, error } = await sb().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

/** Возвращает пользователя или null, если нужно подтвердить почту по ссылке из письма. */
export async function signUp(email: string, password: string) {
  const { data, error } = await sb().auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } })
  if (error) throw error
  return data.session ? data.user : null
}

export async function signOut() {
  await sb().auth.signOut()
}

export async function currentUser() {
  const { data } = await sb().auth.getSession()
  return data.session?.user ?? null
}

function distanceKm(from: string, to: string) {
  const a = DISTRICT_XY[from], b = DISTRICT_XY[to]
  if (!a || !b) return 3
  // Схема центра ≈ 12 км в поперечнике.
  return Math.max(0.5, Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 1.2) / 10)
}

export function profileToMe(p: ProfileRow, local: Me | null): Me {
  return {
    privacy: { showExactAge: true, hideFromContacts: true, approxLocation: true }, radiusKm: 10,
    ...local,
    name: p.name, age: p.age, bio: p.bio, district: p.district, hue: p.hue, tags: p.tags, answers: p.answers,
    photo: p.photo ?? undefined, verified: p.verified, meetings: p.meetings, authMethod: 'email',
  }
}

export async function saveProfile(userId: string, me: Me) {
  const { error } = await sb().from('profiles').upsert({
    id: userId, name: me.name, age: me.age, bio: me.bio, district: me.district, hue: me.hue,
    tags: me.tags, answers: me.answers, photo: me.photo ?? null, meetings: me.meetings,
  })
  if (error) throw error
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>()
  if (error) throw error
  return data
}

const STATUS_NOTE: Record<Exclude<CapsuleStatus, 'active'>, string> = {
  agreed: 'Вы договорились о встрече. Таймер остановлен, капсула не сгорит.',
  contacts: 'Вы обменялись контактами. Капсула сохранится.',
  met: 'Встреча состоялась. +1 к уровню доверия у обоих.',
}

/** Всё, что видно пользователю: люди, планы, его капсулы с перепиской. */
export async function loadAll(userId: string, local: Me | null, read: Record<string, number>) {
  const db = sb()
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
  const [profiles, plans, capsules, secrets, blocks, admins, verif] = await Promise.all([
    db.from('profiles').select('*').limit(500).returns<ProfileRow[]>(),
    db.from('plans').select('*').gt('expires_at', since).order('starts_at').limit(500).returns<PlanRow[]>(),
    db.from('capsules').select('*').order('created_at', { ascending: false }).returns<CapsuleRow[]>(),
    db.from('plan_secrets').select('*').returns<{ plan_id: string; exact_place: string }[]>(),
    db.from('blocks').select('blocked').returns<{ blocked: string }[]>(),
    db.from('admins').select('user_id').returns<{ user_id: string }[]>(),
    db.from('verification_requests').select('status').eq('user_id', userId).maybeSingle<{ status: 'pending' | 'approved' | 'rejected' }>(),
  ])
  for (const r of [profiles, plans, capsules, secrets, blocks, admins, verif]) if (r.error) throw r.error
  // Заблокированных не показываем нигде: ни в людях, ни в ленте, ни в сообщениях.
  const hidden = new Set((blocks.data ?? []).map((b) => b.blocked))
  const blocked = (profiles.data ?? []).filter((p) => hidden.has(p.id)).map((p) => ({ id: p.id, name: p.name }))
  profiles.data = (profiles.data ?? []).filter((p) => !hidden.has(p.id))
  plans.data = (plans.data ?? []).filter((p) => !hidden.has(p.author))
  capsules.data = (capsules.data ?? []).filter((c) => !hidden.has(c.author) && !hidden.has(c.responder))
  const planIds = (plans.data ?? []).map((p) => p.id)
  const commentRows = planIds.length
    ? await db.from('plan_comments').select('*').in('plan_id', planIds).order('created_at').limit(2000).returns<{ id: number; plan_id: string; author: string; body: string; created_at: string }[]>()
    : { data: [], error: null }
  if (commentRows.error) throw commentRows.error
  const comments: PlanComment[] = (commentRows.data ?? []).filter((c) => !hidden.has(c.author)).map((c) => ({
    id: String(c.id), planId: c.plan_id, authorId: c.author === userId ? 'me' : c.author, text: c.body, at: ms(c.created_at),
  }))
  const capsuleIds = (capsules.data ?? []).map((c) => c.id)
  const messages = capsuleIds.length
    ? await db.from('messages').select('*').in('capsule_id', capsuleIds).order('created_at').returns<MessageRow[]>()
    : { data: [] as MessageRow[], error: null }
  if (messages.error) throw messages.error

  const mine = (profiles.data ?? []).find((p) => p.id === userId) ?? null
  const me = mine ? profileToMe(mine, local) : null
  const place = new Map((secrets.data ?? []).map((s) => [s.plan_id, s.exact_place]))

  const people: Person[] = (profiles.data ?? []).filter((p) => p.id !== userId).map((p) => ({
    id: p.id, name: p.name, age: p.age, hue: p.hue, bio: p.bio, district: p.district,
    distanceKm: distanceKm(me?.district ?? '', p.district), answers: p.answers, tags: p.tags, verified: p.verified, meetings: p.meetings,
    photo: p.photo ?? undefined,
  }))

  const activities: Activity[] = (plans.data ?? []).map((p) => ({
    id: p.id, authorId: p.author === userId ? 'me' : p.author, title: p.title, category: p.category, area: p.area,
    exactPlace: place.get(p.id) ?? '', startsAt: ms(p.starts_at), durationMin: p.duration_min, expiresAt: ms(p.expires_at),
    x: p.x, y: p.y, photo: p.photo ?? undefined, timeHidden: p.time_hidden || undefined, groupSize: p.group_size ?? undefined, members: p.group_size ? [] : undefined,
  }))

  const byCapsule = new Map<string, MessageRow[]>()
  for (const m of messages.data ?? []) byCapsule.set(m.capsule_id, [...(byCapsule.get(m.capsule_id) ?? []), m])

  const caps: Capsule[] = (capsules.data ?? []).map((c) => {
    const created = ms(c.created_at)
    const exact = c.plan_id ? place.get(c.plan_id) : undefined
    const rows = byCapsule.get(c.id) ?? []
    const msgs: Message[] = [
      { id: `${c.id}-open`, from: 'system', text: c.plan_id ? 'Капсула открыта. У вас 72 часа, чтобы договориться о встрече.' : 'Личная переписка. У вас 72 часа, чтобы договориться о встрече.', at: created },
      ...(exact ? [{ id: `${c.id}-place`, from: 'system' as const, text: `Точное место: ${exact}`, at: created }] : []),
      ...rows.map((m) => ({ id: String(m.id), from: m.sender === userId ? 'me' as const : 'them' as const, text: m.body, at: ms(m.created_at) })),
      ...(c.status !== 'active' ? [{ id: `${c.id}-status`, from: 'system' as const, text: STATUS_NOTE[c.status], at: Date.now() }] : []),
    ]
    const seen = read[c.id] ?? 0
    return {
      id: c.id, personId: c.author === userId ? c.responder : c.author, activityId: c.plan_id ?? '',
      createdAt: created, expiresAt: ms(c.expires_at), status: c.status, messages: msgs,
      unread: rows.filter((m) => m.sender !== userId && ms(m.created_at) > seen).length,
    }
  })
  return { me, people, activities, capsules: caps, comments, blocked, isAdmin: (admins.data ?? []).length > 0, verification: verif.data?.status ?? null }
}

export async function createPlan(userId: string, id: string, a: Omit<Activity, 'id' | 'authorId'>) {
  const db = sb()
  const { error } = await db.from('plans').insert({
    id, author: userId, title: a.title, category: a.category, area: a.area, starts_at: new Date(a.startsAt).toISOString(),
    duration_min: a.durationMin, expires_at: new Date(a.expiresAt).toISOString(), x: a.x, y: a.y, photo: a.photo ?? null,
    time_hidden: !!a.timeHidden, group_size: a.groupSize ?? null,
  })
  if (error) throw error
  const secret = await db.from('plan_secrets').insert({ plan_id: id, exact_place: a.exactPlace })
  if (secret.error) throw secret.error
}

export async function deletePlan(id: string) {
  const { error } = await sb().from('plans').delete().eq('id', id)
  if (error) throw error
}

export async function respond(userId: string, capsuleId: string, plan: Activity, text?: string) {
  const db = sb()
  const { error } = await db.from('capsules').insert({ id: capsuleId, plan_id: plan.id, author: plan.authorId, responder: userId, expires_at: new Date(Date.now() + CAPSULE_TTL).toISOString() })
  if (error) throw error
  if (text) await sendMessage(userId, capsuleId, text)
}

/** Личная переписка без плана: открывает её тот, кто пишет первым. */
export async function openDirect(userId: string, capsuleId: string, otherId: string, text?: string) {
  const { error } = await sb().from('capsules').insert({ id: capsuleId, author: otherId, responder: userId, expires_at: new Date(Date.now() + CAPSULE_TTL).toISOString() })
  if (error) throw error
  if (text) await sendMessage(userId, capsuleId, text)
}

export async function sendMessage(userId: string, capsuleId: string, body: string) {
  const { error } = await sb().from('messages').insert({ capsule_id: capsuleId, sender: userId, body })
  if (error) throw error
}

export async function setCapsuleStatus(id: string, status: CapsuleStatus) {
  const { error } = await sb().from('capsules').update({ status }).eq('id', id)
  if (error) throw error
}

export async function block(personId: string) {
  const { error } = await sb().from('blocks').insert({ blocked: personId })
  if (error && error.code !== '23505') throw error
}

export async function unblock(userId: string, personId: string) {
  const { error } = await sb().from('blocks').delete().eq('blocker', userId).eq('blocked', personId)
  if (error) throw error
}

export async function deleteAccount() {
  const { error } = await sb().rpc('delete_my_account')
  if (error) throw error
  await sb().auth.signOut({ scope: 'local' })
}

export async function requestPasswordReset(email: string) {
  const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { data, error } = await sb().auth.updateUser({ password })
  if (error) throw error
  return data.user
}

export async function addComment(planId: string, body: string) {
  const { error } = await sb().from('plan_comments').insert({ plan_id: planId, body })
  if (error) throw error
}

export async function deleteComment(id: string) {
  const { error } = await sb().from('plan_comments').delete().eq('id', Number(id))
  if (error) throw error
}

export async function submitVerification(userId: string, photo: string, gesture: string) {
  const { error } = await sb().from('verification_requests').upsert({ user_id: userId, photo, gesture, status: 'pending' })
  if (error) throw error
}

// ===== Админка =====
export interface AdminVerification { userId: string; name: string; age: number; photo: string; gesture: string; createdAt: number }

export async function adminVerifications(): Promise<AdminVerification[]> {
  const db = sb()
  const [reqs, profiles] = await Promise.all([
    db.from('verification_requests').select('*').eq('status', 'pending').order('created_at').returns<{ user_id: string; photo: string | null; gesture: string; created_at: string }[]>(),
    db.from('profiles').select('id,name,age').returns<{ id: string; name: string; age: number }[]>(),
  ])
  for (const r of [reqs, profiles]) if (r.error) throw r.error
  const who = new Map((profiles.data ?? []).map((p) => [p.id, p]))
  return (reqs.data ?? []).map((r) => ({
    userId: r.user_id, name: who.get(r.user_id)?.name ?? 'удалён', age: who.get(r.user_id)?.age ?? 0,
    photo: r.photo ?? '', gesture: r.gesture, createdAt: ms(r.created_at),
  }))
}

/** Решение модератора: триггер в базе ставит или снимает галочку и удаляет селфи. */
export async function decideVerification(userId: string, approve: boolean) {
  const { error } = await sb().from('verification_requests').update({ status: approve ? 'approved' : 'rejected' }).eq('user_id', userId)
  if (error) throw error
}
export interface AdminReport { id: number; reason: string; body: string; status: 'open' | 'resolved'; createdAt: number; reporter: { id: string; name: string }; target: { id: string; name: string; banned: boolean } }

export async function adminReports(): Promise<AdminReport[]> {
  const db = sb()
  const [reports, profiles, bans] = await Promise.all([
    db.from('reports').select('*').order('created_at', { ascending: false }).limit(200).returns<{ id: number; reporter: string; target: string; reason: string; body: string; status: 'open' | 'resolved'; created_at: string }[]>(),
    db.from('profiles').select('id,name').returns<{ id: string; name: string }[]>(),
    db.from('bans').select('user_id').returns<{ user_id: string }[]>(),
  ])
  for (const r of [reports, profiles, bans]) if (r.error) throw r.error
  const name = new Map((profiles.data ?? []).map((p) => [p.id, p.name]))
  const banned = new Set((bans.data ?? []).map((b) => b.user_id))
  return (reports.data ?? []).map((r) => ({
    id: r.id, reason: r.reason, body: r.body, status: r.status, createdAt: ms(r.created_at),
    reporter: { id: r.reporter, name: name.get(r.reporter) ?? 'удалён' },
    target: { id: r.target, name: name.get(r.target) ?? 'удалён', banned: banned.has(r.target) },
  }))
}

export async function setReportStatus(id: number, status: 'open' | 'resolved') {
  const { error } = await sb().from('reports').update({ status }).eq('id', id)
  if (error) throw error
}

export async function setBan(userId: string, ban: boolean, reason = '') {
  const q = ban ? sb().from('bans').insert({ user_id: userId, reason }) : sb().from('bans').delete().eq('user_id', userId)
  const { error } = await q
  if (error && error.code !== '23505') throw error
}

export async function sendReport(target: string, reason: string, body: string) {
  const { error } = await sb().from('reports').insert({ target, reason, body })
  if (error) throw error
}

/** Любое изменение в чате, капсулах, планах или профилях — повод перечитать данные. */
export function subscribe(onChange: () => void) {
  const ch = sb().channel('iskra-live')
  for (const table of ['messages', 'capsules', 'plans', 'profiles', 'plan_comments']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  ch.subscribe()
  return () => { void sb().removeChannel(ch) }
}
