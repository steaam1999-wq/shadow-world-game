import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CAPSULE_TTL } from '../data'
import { placeDistanceKm } from '../places'
import type { Activity, Capsule, CapsuleStatus, Me, Message, Notice, NowPlaying, Person, PlanComment, Short } from '../types'
import type { Social } from '../store'
import type { Track } from '../music/engine'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

let client: SupabaseClient | null = null
export function sb() {
  // implicit: ссылка из письма (восстановление пароля) приносит сессию прямо в адресе страницы.
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'implicit' } })
  return client
}

interface ProfileRow { id: string; name: string; age: number; bio: string; district: string; hue: number; tags: string[]; answers: Record<string, string>; photo: string | null; verified: boolean; meetings: number; songs?: Track[] | null; now_playing?: NowPlaying | null }
interface PlanRow { id: string; author: string; title: string; category: string; area: string; starts_at: string; duration_min: number; expires_at: string; x: number; y: number; photo: string | null; time_hidden: boolean; group_size: number | null }
interface CapsuleRow { id: string; plan_id: string | null; author: string; responder: string; status: CapsuleStatus; created_at: string; expires_at: string }
interface MessageRow { id: number; capsule_id: string; sender: string; body: string; created_at: string }

const ms = (iso: string) => new Date(iso).getTime()

interface ShortRow { id: string; author: string; path: string; caption: string; duration: number | null; kind: 'video' | 'photo' | null; created_at: string }

// Ссылки на закрытые видео выдаются на время. Кэшируем их, иначе при каждом обновлении
// ссылка менялась бы и видео начиналось заново.
const signed = new Map<string, { url: string; until: number }>()
async function signShorts(paths: string[]) {
  const now = Date.now()
  const need = paths.filter((p) => (signed.get(p)?.until ?? 0) < now + 10 * 60_000)
  if (need.length) {
    const { data, error } = await sb().storage.from('shorts').createSignedUrls(need, 6 * 3600)
    if (error) throw error
    for (const d of data ?? []) if (d.signedUrl && d.path) signed.set(d.path, { url: d.signedUrl, until: now + 6 * 3600_000 })
  }
  return new Map(paths.flatMap((p) => { const s = signed.get(p); return s ? [[p, s.url] as const] : [] }))
}

/** Загружает видео или фото в хранилище и публикует его. */
export async function uploadShort(userId: string, file: Blob & { name?: string }, caption: string, duration: number, kind: 'video' | 'photo' = 'video') {
  const ext = kind === 'photo' ? 'jpg' : ((file.name ?? '').split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp4'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const type = kind === 'photo' ? 'image/jpeg' : file.type || (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
  const up = await sb().storage.from('shorts').upload(path, file, { contentType: type, upsert: false })
  if (up.error) throw up.error
  const { error } = await sb().from('shorts').insert({ path, caption, duration: kind === 'photo' ? null : duration, kind })
  if (error) { await sb().storage.from('shorts').remove([path]); throw error }
}

export async function deleteShort(id: string, path?: string) {
  const { error } = await sb().from('shorts').delete().eq('id', id)
  if (error) throw error
  if (path) await sb().storage.from('shorts').remove([path])
}

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

export function profileToMe(p: ProfileRow, local: Me | null): Me {
  return {
    privacy: { showExactAge: true, hideFromContacts: true, approxLocation: true }, radiusKm: 10,
    ...local,
    name: p.name, age: p.age, bio: p.bio, district: p.district, hue: p.hue, tags: p.tags, answers: p.answers,
    photo: p.photo ?? undefined, verified: p.verified, meetings: p.meetings, authMethod: 'email',
    songs: local?.privacy?.hideSongs ? local.songs : (p.songs ?? []),
  }
}

export async function saveProfile(userId: string, me: Me) {
  const { error } = await sb().from('profiles').upsert({
    id: userId, name: me.name, age: me.age, bio: me.bio, district: me.district, hue: me.hue,
    tags: me.tags, answers: me.answers, photo: me.photo ?? null, meetings: me.meetings,
    songs: me.privacy?.hideSongs ? [] : (me.songs ?? []).slice(0, 50),
  })
  if (error) throw error
}

/** Сколько «Сейчас слушает» считается свежим: пока играет, плеер обновляет его каждые 4 минуты. */
export const NOW_PLAYING_TTL = 6 * 60_000

export async function setNowPlaying(userId: string, value: NowPlaying | null) {
  const { error } = await sb().from('profiles').update({ now_playing: value }).eq('id', userId)
  if (error) throw error
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>()
  if (error) throw error
  return data
}

const STATUS_NOTE: Record<Exclude<CapsuleStatus, 'active'>, string> = {
  agreed: 'Вы договорились о встрече.',
  contacts: 'Вы обменялись контактами.',
  met: 'Встреча состоялась. +1 к уровню доверия у обоих.',
}

/** Всё, что видно пользователю: люди, планы, его капсулы с перепиской. */
export async function loadAll(userId: string, local: Me | null, read: Record<string, number>) {
  const db = sb()
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
  const [profiles, plans, capsules, secrets, blocks, admins, verif, shortRows] = await Promise.all([
    db.from('profiles').select('*').limit(500).returns<ProfileRow[]>(),
    db.from('plans').select('*').gt('expires_at', since).order('starts_at').limit(500).returns<PlanRow[]>(),
    db.from('capsules').select('*').order('created_at', { ascending: false }).returns<CapsuleRow[]>(),
    db.from('plan_secrets').select('*').returns<{ plan_id: string; exact_place: string }[]>(),
    db.from('blocks').select('blocked').returns<{ blocked: string }[]>(),
    db.from('admins').select('user_id').returns<{ user_id: string }[]>(),
    db.from('verification_requests').select('status').eq('user_id', userId).maybeSingle<{ status: 'pending' | 'approved' | 'rejected' }>(),
    db.from('shorts').select('*').order('created_at', { ascending: false }).limit(200).returns<ShortRow[]>(),
  ])
  for (const r of [profiles, plans, capsules, secrets, blocks, admins, verif, shortRows]) if (r.error) throw r.error
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
    distanceKm: placeDistanceKm(me?.district ?? '', p.district), answers: p.answers, tags: p.tags, verified: p.verified, meetings: p.meetings,
    photo: p.photo ?? undefined, songs: Array.isArray(p.songs) ? p.songs : [],
    nowPlaying: p.now_playing?.track && Date.now() - p.now_playing.at < NOW_PLAYING_TTL ? p.now_playing : null,
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
      { id: `${c.id}-open`, from: 'system', text: c.plan_id ? 'Чат открыт. Договоритесь о встрече — точное место уже здесь.' : 'Личная переписка.', at: created },
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
  const visibleShorts = (shortRows.data ?? []).filter((s) => !hidden.has(s.author))
  const urls = await signShorts(visibleShorts.map((s) => s.path))
  const shorts: Short[] = visibleShorts.filter((s) => urls.has(s.path)).map((s) => ({
    id: s.id, authorId: s.author === userId ? 'me' : s.author, url: urls.get(s.path)!, path: s.path, kind: s.kind === 'photo' ? 'photo' : 'video', caption: s.caption, at: ms(s.created_at),
  }))
  const social = await loadSocial(db, userId, planIds, shorts.map((s) => s.id), hidden,
    new Set(activities.filter((a) => a.authorId === 'me').map((a) => a.id)), new Set(shorts.filter((s) => s.authorId === 'me').map((s) => s.id)))
  return { me, people, activities, capsules: caps, comments, blocked, isAdmin: (admins.data ?? []).length > 0, verification: verif.data?.status ?? null, shorts, social }
}

type LikeRow = { user_id: string; created_at: string }
async function loadSocial(db: SupabaseClient, userId: string, planIds: string[], shortIds: string[], hidden: Set<string>, myPlans: Set<string>, myShorts: Set<string>): Promise<Social> {
  const [pl, sl, fo, sv] = await Promise.all([
    planIds.length ? db.from('plan_likes').select('plan_id, user_id, created_at').in('plan_id', planIds).limit(10000).returns<(LikeRow & { plan_id: string })[]>() : Promise.resolve({ data: [], error: null }),
    shortIds.length ? db.from('short_likes').select('short_id, user_id, created_at').in('short_id', shortIds).limit(10000).returns<(LikeRow & { short_id: string })[]>() : Promise.resolve({ data: [], error: null }),
    db.from('follows').select('follower, followee, created_at').limit(10000).returns<{ follower: string; followee: string; created_at: string }[]>(),
    db.from('saved_plans').select('plan_id').returns<{ plan_id: string }[]>(),
  ])
  for (const r of [pl, sl, fo, sv]) if (r.error) throw r.error
  const planLikes = (pl.data ?? []).filter((l) => !hidden.has(l.user_id))
  const shortLikes = (sl.data ?? []).filter((l) => !hidden.has(l.user_id))
  const follows = (fo.data ?? []).filter((f) => !hidden.has(f.follower) && !hidden.has(f.followee))
  const likeCounts: Record<string, number> = {}
  for (const l of planLikes) likeCounts[l.plan_id] = (likeCounts[l.plan_id] ?? 0) + 1
  for (const l of shortLikes) likeCounts[l.short_id] = (likeCounts[l.short_id] ?? 0) + 1
  const followers: Record<string, number> = {}
  for (const f of follows) { const k = f.followee === userId ? 'me' : f.followee; followers[k] = (followers[k] ?? 0) + 1 }
  // Уведомления: чужие лайки моих планов и публикаций и подписки на меня.
  const notices: Notice[] = [
    ...planLikes.filter((l) => l.user_id !== userId && myPlans.has(l.plan_id)).map((l) => ({ id: `lp-${l.plan_id}-${l.user_id}`, kind: 'likePlan' as const, personId: l.user_id, targetId: l.plan_id, at: ms(l.created_at) })),
    ...shortLikes.filter((l) => l.user_id !== userId && myShorts.has(l.short_id)).map((l) => ({ id: `ls-${l.short_id}-${l.user_id}`, kind: 'likeShort' as const, personId: l.user_id, targetId: l.short_id, at: ms(l.created_at) })),
    ...follows.filter((f) => f.followee === userId).map((f) => ({ id: `f-${f.follower}`, kind: 'follow' as const, personId: f.follower, at: ms(f.created_at) })),
  ].sort((a, b) => b.at - a.at).slice(0, 100)
  return {
    hearts: planLikes.filter((l) => l.user_id === userId).map((l) => l.plan_id),
    shortHearts: shortLikes.filter((l) => l.user_id === userId).map((l) => l.short_id),
    saved: (sv.data ?? []).map((s) => s.plan_id),
    following: follows.filter((f) => f.follower === userId).map((f) => f.followee),
    likeCounts, followers, notices,
  }
}
/** Отметка «нравится», подписка или «Сохранить»: on — поставить, иначе снять. Повтор не ошибка. */
export async function setMark(kind: 'plan_likes' | 'short_likes' | 'follows' | 'saved_plans', id: string, on: boolean, userId: string) {
  const col = kind === 'plan_likes' ? 'plan_id' : kind === 'short_likes' ? 'short_id' : kind === 'follows' ? 'followee' : 'plan_id'
  const own = kind === 'follows' ? 'follower' : 'user_id'
  const row: Record<string, string> = { [col]: id }
  const q = on ? sb().from(kind).insert(row as never) : sb().from(kind).delete().eq(col, id).eq(own, userId)
  const { error } = await q
  if (error && error.code !== '23505') throw error
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
  // Видео лежат в хранилище отдельно от базы — убираем свои файлы до удаления аккаунта.
  const user = await currentUser()
  if (user) {
    const { data } = await sb().storage.from('shorts').list(user.id, { limit: 1000 })
    if (data?.length) await sb().storage.from('shorts').remove(data.map((f) => `${user.id}/${f.name}`))
  }
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

/** Любое изменение в чате, капсулах, планах или профилях — повод перечитать данные.
 *  Новые сообщения дополнительно приходят сразу (`onMessage`), чтобы не ждать перезагрузки.
 *  Канал сам переподключается: телефон обрывает соединение, когда вкладка свёрнута. */
export function subscribe(onChange: () => void, onMessage: (m: MessageRow) => void, onStatus?: (live: boolean) => void) {
  let ch: ReturnType<SupabaseClient['channel']> | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  const open = () => {
    if (stopped) return
    if (ch) void sb().removeChannel(ch)
    ch = sb().channel(`iskra-live-${Date.now()}`)
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => onMessage(p.new as MessageRow))
    for (const table of ['messages', 'capsules', 'plans', 'profiles', 'plan_comments', 'shorts', 'plan_likes', 'short_likes', 'follows']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    ch.subscribe((status) => {
      onStatus?.(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') onChange() // пока канала не было, могли прийти сообщения
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(retry)
        if (!stopped) retry = setTimeout(open, 3000)
      }
    })
  }
  void sb().auth.getSession().then(({ data }) => { if (data.session) sb().realtime.setAuth(data.session.access_token) }).finally(open)
  return {
    reconnect: () => { clearTimeout(retry); open() },
    stop: () => { stopped = true; clearTimeout(retry); if (ch) void sb().removeChannel(ch) },
  }
}
export type { MessageRow }
