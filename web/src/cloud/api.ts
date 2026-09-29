import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CAPSULE_TTL, DISTRICT_XY } from '../data'
import type { Activity, Capsule, CapsuleStatus, Me, Message, Person } from '../types'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

let client: SupabaseClient | null = null
export function sb() {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

interface ProfileRow { id: string; name: string; age: number; bio: string; district: string; hue: number; tags: string[]; answers: Record<string, string>; photo: string | null; verified: boolean; meetings: number }
interface PlanRow { id: string; author: string; title: string; category: string; area: string; starts_at: string; duration_min: number; expires_at: string; x: number; y: number; photo: string | null; time_hidden: boolean; group_size: number | null }
interface CapsuleRow { id: string; plan_id: string; author: string; responder: string; status: CapsuleStatus; created_at: string; expires_at: string }
interface MessageRow { id: number; capsule_id: string; sender: string; body: string; created_at: string }

const ms = (iso: string) => new Date(iso).getTime()

/** Перевод ошибок Supabase на понятный язык. */
export function humanError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(m)) return 'Неверная почта или пароль.'
  if (/Email not confirmed/i.test(m)) return 'Почта ещё не подтверждена — откройте письмо от Искры и нажмите ссылку.'
  if (/User already registered/i.test(m)) return 'Такая почта уже зарегистрирована — войдите.'
  if (/Password should be/i.test(m)) return 'Пароль слишком простой: нужно минимум 6 символов.'
  if (/rate limit|too many/i.test(m)) return 'Слишком много попыток. Подождите минуту.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Нет связи с сервером. Проверьте интернет.'
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
  const [profiles, plans, capsules, secrets] = await Promise.all([
    db.from('profiles').select('*').limit(500).returns<ProfileRow[]>(),
    db.from('plans').select('*').gt('expires_at', since).order('starts_at').limit(500).returns<PlanRow[]>(),
    db.from('capsules').select('*').order('created_at', { ascending: false }).returns<CapsuleRow[]>(),
    db.from('plan_secrets').select('*').returns<{ plan_id: string; exact_place: string }[]>(),
  ])
  for (const r of [profiles, plans, capsules, secrets]) if (r.error) throw r.error
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
    const exact = place.get(c.plan_id)
    const rows = byCapsule.get(c.id) ?? []
    const msgs: Message[] = [
      { id: `${c.id}-open`, from: 'system', text: 'Капсула открыта. У вас 72 часа, чтобы договориться о встрече.', at: created },
      ...(exact ? [{ id: `${c.id}-place`, from: 'system' as const, text: `Точное место: ${exact}`, at: created }] : []),
      ...rows.map((m) => ({ id: String(m.id), from: m.sender === userId ? 'me' as const : 'them' as const, text: m.body, at: ms(m.created_at) })),
      ...(c.status !== 'active' ? [{ id: `${c.id}-status`, from: 'system' as const, text: STATUS_NOTE[c.status], at: Date.now() }] : []),
    ]
    const seen = read[c.id] ?? 0
    return {
      id: c.id, personId: c.author === userId ? c.responder : c.author, activityId: c.plan_id,
      createdAt: created, expiresAt: ms(c.expires_at), status: c.status, messages: msgs,
      unread: rows.filter((m) => m.sender !== userId && ms(m.created_at) > seen).length,
    }
  })
  return { me, people, activities, capsules: caps }
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

export async function sendMessage(userId: string, capsuleId: string, body: string) {
  const { error } = await sb().from('messages').insert({ capsule_id: capsuleId, sender: userId, body })
  if (error) throw error
}

export async function setCapsuleStatus(id: string, status: CapsuleStatus) {
  const { error } = await sb().from('capsules').update({ status }).eq('id', id)
  if (error) throw error
}

export async function sendReport(target: string, reason: string, body: string) {
  const { error } = await sb().from('reports').insert({ target, reason, body })
  if (error) throw error
}

/** Любое изменение в чате, капсулах или планах — повод перечитать данные. */
export function subscribe(onChange: () => void) {
  const ch = sb().channel('iskra-live')
  for (const table of ['messages', 'capsules', 'plans']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  ch.subscribe()
  return () => { void sb().removeChannel(ch) }
}
