import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CAPSULE_TTL } from '../data'
import { placeDistanceKm } from '../places'
import type { Activity, Capsule, CapsuleStatus, Group, Me, Message, Notice, NowPlaying, Person, PlanComment, PlanMusic, Short } from '../types'
import type { Social } from '../store'
import type { Track } from '../music/engine'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

let client: SupabaseClient | null = null
export function sb() {
  // implicit: ссылка из письма (восстановление пароля) приносит сессию прямо в адресе страницы.
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'implicit' } })
  return client
}

interface ProfileRow { id: string; name: string; age: number | null; bio: string; district: string; hue: number; tags: string[]; answers: Record<string, string>; photo: string | null; photo_path?: string | null; verified: boolean; meetings: number; songs?: Track[] | null; now_playing?: NowPlaying | null; free_until?: string | null }
interface PlanRow { id: string; author: string; title: string; category: string; area: string; starts_at: string; duration_min: number; expires_at: string; x: number; y: number; photo: string | null; photo_path?: string | null; time_hidden: boolean; group_size: number | null; music?: PlanMusic | null }
interface CapsuleRow { id: string; plan_id: string | null; author: string; responder: string; status: CapsuleStatus; created_at: string; expires_at: string; author_read_at?: string | null; responder_read_at?: string | null; author_hidden_at?: string | null; responder_hidden_at?: string | null }
interface MessageRow { id: number; capsule_id: string; sender: string; body: string; created_at: string; photo_path?: string | null }

const ms = (iso: string) => new Date(iso).getTime()

interface ShortRow { id: string; author: string; path: string; caption: string; duration: number | null; kind: 'video' | 'photo' | null; created_at: string; thumb_path?: string | null }

// Ссылки на закрытые файлы выдаются на время. Кэшируем их, иначе при каждом обновлении
// ссылка менялась бы: видео начиналось бы заново, а фото скачивались повторно.
const signed = new Map<string, { url: string; until: number }>()
async function sign(bucket: 'shorts' | 'media' | 'chat', paths: string[]) {
  const now = Date.now()
  const key = (p: string) => `${bucket}:${p}`
  const need = [...new Set(paths)].filter((p) => (signed.get(key(p))?.until ?? 0) < now + 10 * 60_000)
  for (let i = 0; i < need.length; i += 500) {
    // Закрытые фото (планы, старые аватарки) — неделю; видео — 6 часов.
    const ttl = bucket === 'media' ? 7 * 24 * 3600 : 6 * 3600
    const { data, error } = await sb().storage.from(bucket).createSignedUrls(need.slice(i, i + 500), ttl)
    if (error) throw error
    for (const d of data ?? []) if (d.signedUrl && d.path) signed.set(key(d.path), { url: d.signedUrl, until: now + ttl * 1000 })
  }
  return new Map(paths.flatMap((p) => { const s = signed.get(key(p)); return s ? [[p, s.url] as const] : [] }))
}
const signShorts = (paths: string[]) => sign('shorts', paths)

/** Загружает фото (data URL) в хранилище и возвращает путь. */
async function uploadImage(userId: string, dataUrl: string, bucket: 'media' | 'avatars' = 'media') {
  const blob = await (await fetch(dataUrl)).blob()
  const type = ['image/png', 'image/webp'].includes(blob.type) ? blob.type : 'image/jpeg'
  const path = `${userId}/${crypto.randomUUID()}.${type.split('/')[1].replace('jpeg', 'jpg')}`
  const { error } = await sb().storage.from(bucket).upload(path, blob, { contentType: type, upsert: false })
  if (error) throw error
  return bucket === 'avatars' ? `avatars/${path}` : path
}

// Аватарки лежат в открытом хранилище («avatars/…» в photo_path) — у них постоянная ссылка.
// Остальные фото (и старые аватарки) — в закрытом media, по временным ссылкам.
const isPublicPhoto = (p: string) => p.startsWith('avatars/')
const publicPhotoUrl = (p: string) => `${SUPABASE_URL}/storage/v1/object/public/${p}`
async function photoUrls(paths: string[]) {
  const signedUrls = await sign('media', paths.filter((p) => !isPublicPhoto(p)))
  return new Map(paths.map((p) => [p, isPublicPhoto(p) ? publicPhotoUrl(p) : signedUrls.get(p)] as const).filter((e): e is readonly [string, string] => !!e[1]))
}
async function removePhoto(p: string) {
  if (isPublicPhoto(p)) await sb().storage.from('avatars').remove([p.slice('avatars/'.length)])
  else await sb().storage.from('media').remove([p])
}

// Колонки без встроенных фото: так ленту не приходится скачивать вместе со всеми фото целиком.
const PROFILE_COLS = 'id,name,age,bio,district,hue,tags,answers,verified,meetings,songs,now_playing,photo_path,free_until'
const PLAN_COLS = 'id,author,title,category,area,starts_at,duration_min,expires_at,x,y,time_hidden,group_size,photo_path,music'

/** Загружает видео или фото в хранилище и публикует его. `thumb` — кадр-превью видео (JPEG). */
export async function uploadShort(userId: string, file: Blob & { name?: string }, caption: string, duration: number, kind: 'video' | 'photo' = 'video', thumb?: Blob | null) {
  const ext = kind === 'photo' ? 'jpg' : ((file.name ?? '').split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp4'
  const id = crypto.randomUUID()
  const path = `${userId}/${id}.${ext}`
  const type = kind === 'photo' ? 'image/jpeg' : file.type || (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
  const up = await sb().storage.from('shorts').upload(path, file, { contentType: type, upsert: false })
  if (up.error) throw up.error
  // Превью не обязательно: если не получилось, видео всё равно публикуется.
  let thumbPath: string | null = null
  if (kind === 'video' && thumb) {
    const t = await sb().storage.from('shorts').upload(`${userId}/${id}-thumb.jpg`, thumb, { contentType: 'image/jpeg', upsert: false })
    if (!t.error) thumbPath = t.data.path
  }
  const { error } = await sb().from('shorts').insert({ path, caption, duration: kind === 'photo' ? null : duration, kind, ...(thumbPath ? { thumb_path: thumbPath } : {}) })
  if (error) { await sb().storage.from('shorts').remove(thumbPath ? [path, thumbPath] : [path]); throw error }
}

/** Досоздаёт превью для своего старого видео. */
export async function setShortThumb(userId: string, id: string, thumb: Blob) {
  const t = await sb().storage.from('shorts').upload(`${userId}/${id}-thumb.jpg`, thumb, { contentType: 'image/jpeg', upsert: true })
  if (t.error) throw t.error
  const { error } = await sb().from('shorts').update({ thumb_path: t.data.path }).eq('id', id)
  if (error) throw error
}

export async function deleteShort(id: string, path?: string) {
  const thumbPath = (await sb().from('shorts').select('thumb_path').eq('id', id).maybeSingle<{ thumb_path: string | null }>()).data?.thumb_path
  const { error } = await sb().from('shorts').delete().eq('id', id)
  if (error) throw error
  const files = [path, thumbPath].filter((p): p is string => !!p)
  if (files.length) await sb().storage.from('shorts').remove(files)
}

/** Перевод ошибок Supabase на понятный язык. */
export function humanError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(m)) return 'Неверная почта или пароль.'
  if (/Email not confirmed/i.test(m)) return 'Почта ещё не подтверждена — откройте письмо от Match и нажмите ссылку.'
  if (/User already registered/i.test(m)) return 'Такая почта уже зарегистрирована — войдите.'
  if (/Password should be/i.test(m)) return 'Пароль слишком простой: нужно минимум 6 символов.'
  if (/rate limit|too many/i.test(m)) return 'Слишком много попыток. Подождите минуту.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Нет связи с сервером. Проверьте интернет.'
  // Отказ правил доступа: блокировка между людьми или бан модератором.
  if (/row-level security.*"(capsules|messages)"/i.test(m)) return 'Написать нельзя: переписка заблокирована или аккаунт ограничен модератором.'
  if (/row-level security.*"profiles"/i.test(m)) return 'Регистрация временно закрыта. Попробуйте позже.'
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
  lastUpload = null
  await removePushSubscription() // после выхода уведомления на это устройство приходить не должны
  await sb().auth.signOut()
}

/** Подписка этого браузера на push: сохраняем, чтобы сервер знал, куда слать уведомления. */
export async function savePushSubscription(sub: PushSubscription) {
  const j = sub.toJSON()
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return
  const { error } = await sb().from('push_subscriptions').upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth })
  if (error) throw error
}

export async function removePushSubscription() {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    const sub = await reg?.pushManager?.getSubscription()
    if (!sub) return
    await sb().from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  } catch { /* не критично */ }
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
    photo: p.photo ?? undefined, photoPath: p.photo_path ?? undefined, verified: p.verified, meetings: p.meetings, authMethod: 'email',
    songs: local?.privacy?.hideSongs ? local.songs : safeTracks(p.songs),
    freeUntil: p.free_until ? new Date(p.free_until).getTime() : undefined,
  }
}

// Последнее загруженное фото профиля: пока экран не обновился, повторное сохранение не должно грузить его ещё раз.
let lastUpload: { data: string; path: string } | null = null

export async function saveProfile(userId: string, me: Me) {
  // Новое фото (data URL) уходит в хранилище; ссылка на уже загруженное — оставляем путь как есть.
  const old = me.photoPath ?? null
  const fresh = me.photo?.startsWith('data:') ? me.photo : null
  const photoPath = fresh
    ? (lastUpload?.data === fresh ? lastUpload.path : (lastUpload = { data: fresh, path: await uploadImage(userId, fresh, 'avatars') }).path)
    : me.photo ? old : null
  const { error } = await sb().from('profiles').upsert({
    id: userId, name: me.name, age: me.age ?? null, bio: me.bio, district: me.district, hue: me.hue,
    tags: me.tags, answers: me.answers, photo: null, photo_path: photoPath, meetings: me.meetings,
    songs: me.privacy?.hideSongs ? [] : (me.songs ?? []).slice(0, 50),
  })
  if (error) throw error
  if (old && old !== photoPath) await removePhoto(old)
  // Дата рождения — в закрытой таблице, её видит только сам человек.
  const priv = await sb().from('profile_private').upsert({ user_id: userId, birth_date: me.birthDate ?? null })
  if (priv.error) throw priv.error
}

/** Треки из чужих профилей и планов: только https-ссылки на звук и обложку, иначе ссылку отбрасываем. */
const httpsOnly = (u?: string) => (typeof u === 'string' && u.startsWith('https://') ? u : undefined)
function safeTrack(t: Track | null | undefined): Track | null {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string') return null
  return { ...t, title: String(t.title ?? '').slice(0, 120), artist: String(t.artist ?? '').slice(0, 80), url: httpsOnly(t.url), cover: httpsOnly(t.cover) }
}
const safeTracks = (list: unknown) => (Array.isArray(list) ? list.map((t) => safeTrack(t as Track)).filter((t): t is Track => !!t) : [])

/** Сколько «Сейчас слушает» считается свежим: пока играет, плеер обновляет его каждые 4 минуты. */
export const NOW_PLAYING_TTL = 6 * 60_000

export async function setNowPlaying(userId: string, value: NowPlaying | null) {
  const { error } = await sb().from('profiles').update({ now_playing: value }).eq('id', userId)
  if (error) throw error
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>()
  if (error) throw error
  if (data?.photo_path) data.photo = (await photoUrls([data.photo_path])).get(data.photo_path) ?? null
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
  const [profiles, plans, capsules, secrets, blocks, admins, verif, shortRows, settingRows, priv, companies, missedRows, myNoShows] = await Promise.all([
    db.from('profiles').select(PROFILE_COLS).limit(500).returns<ProfileRow[]>(),
    db.from('plans').select(PLAN_COLS).gt('expires_at', since).order('starts_at').limit(500).returns<PlanRow[]>(),
    db.from('capsules').select('*').order('created_at', { ascending: false }).returns<CapsuleRow[]>(),
    db.from('plan_secrets').select('*').returns<{ plan_id: string; exact_place: string }[]>(),
    db.from('blocks').select('blocked').returns<{ blocked: string }[]>(),
    db.from('admins').select('user_id').returns<{ user_id: string }[]>(),
    db.from('verification_requests').select('status').eq('user_id', userId).maybeSingle<{ status: 'pending' | 'approved' | 'rejected' }>(),
    db.from('shorts').select('*').order('created_at', { ascending: false }).limit(200).returns<ShortRow[]>(),
    db.from('app_settings').select('key, value').returns<{ key: string; value: unknown }[]>(),
    db.from('profile_private').select('birth_date').eq('user_id', userId).maybeSingle<{ birth_date: string | null }>(),
    db.rpc('plan_companies'),
    db.rpc('no_show_counts'),
    db.from('no_shows').select('capsule_id').returns<{ capsule_id: string }[]>(),
  ])
  for (const r of [profiles, plans, capsules, secrets, blocks, admins, verif, shortRows, settingRows, priv, companies, missedRows, myNoShows]) if (r.error) throw r.error
  const settings = parseSettings(settingRows.data ?? [])
  // Заблокированных не показываем нигде: ни в людях, ни в ленте, ни в сообщениях.
  const hidden = new Set((blocks.data ?? []).map((b) => b.blocked))
  const blocked = (profiles.data ?? []).filter((p) => hidden.has(p.id)).map((p) => ({ id: p.id, name: p.name }))
  profiles.data = (profiles.data ?? []).filter((p) => !hidden.has(p.id))
  plans.data = (plans.data ?? []).filter((p) => !hidden.has(p.author))
  capsules.data = (capsules.data ?? []).filter((c) => !hidden.has(c.author) && !hidden.has(c.responder))
  const planIds = (plans.data ?? []).map((p) => p.id)
  const commentRows = planIds.length
    ? await db.from('plan_comments').select('*').in('plan_id', planIds).order('created_at').limit(2000).returns<{ id: number; plan_id: string; author: string; body: string; created_at: string; reply_to: number | null }[]>()
    : { data: [], error: null }
  if (commentRows.error) throw commentRows.error
  const comments: PlanComment[] = (commentRows.data ?? []).filter((c) => !hidden.has(c.author)).map((c) => ({
    id: String(c.id), planId: c.plan_id, authorId: c.author === userId ? 'me' : c.author, text: c.body, at: ms(c.created_at), ...(c.reply_to ? { replyTo: String(c.reply_to) } : {}),
  }))
  const capsuleIds = (capsules.data ?? []).map((c) => c.id)
  const messages = capsuleIds.length
    ? await db.from('messages').select('*').in('capsule_id', capsuleIds).order('created_at').returns<MessageRow[]>()
    : { data: [] as MessageRow[], error: null }
  if (messages.error) throw messages.error

  await attachPhotos(profiles.data ?? [], plans.data ?? [])
  const mine = (profiles.data ?? []).find((p) => p.id === userId) ?? null
  const missed = new Map(((missedRows.data ?? []) as { user_id: string; missed: number }[]).map((x) => [x.user_id, x.missed]))
  const reported = new Set((myNoShows.data ?? []).map((x) => x.capsule_id))
  const me = mine ? { ...profileToMe(mine, local), birthDate: priv.data?.birth_date ?? undefined, noShows: missed.get(userId) ?? 0 } : null
  const place = new Map((secrets.data ?? []).map((s) => [s.plan_id, s.exact_place]))

  const people: Person[] = (profiles.data ?? []).filter((p) => p.id !== userId).map((p) => ({
    id: p.id, name: p.name, age: p.age, hue: p.hue, bio: p.bio, district: p.district,
    distanceKm: placeDistanceKm(me?.district ?? '', p.district), answers: p.answers, tags: p.tags, verified: p.verified, meetings: p.meetings,
    photo: p.photo ?? undefined, songs: safeTracks(p.songs), noShows: missed.get(p.id) ?? 0,
    freeUntil: p.free_until ? new Date(p.free_until).getTime() : undefined,
    nowPlaying: p.now_playing?.track && Date.now() - p.now_playing.at < NOW_PLAYING_TTL && safeTrack(p.now_playing.track) ? { track: safeTrack(p.now_playing.track)!, at: p.now_playing.at } : null,
  }))

  // Кто уже в компании группового плана (без автора; я — 'me').
  const companyOf = (planId: string, author: string) => ((companies.data ?? []) as { plan_id: string; user_id: string }[])
    .filter((c) => c.plan_id === planId && c.user_id !== author && !hidden.has(c.user_id))
    .map((c) => (c.user_id === userId ? 'me' : c.user_id))
  const activities: Activity[] = (plans.data ?? []).map((p) => ({
    id: p.id, authorId: p.author === userId ? 'me' : p.author, title: p.title, category: p.category, area: p.area,
    exactPlace: place.get(p.id) ?? '', startsAt: ms(p.starts_at), durationMin: p.duration_min, expiresAt: ms(p.expires_at),
    x: p.x, y: p.y, photo: p.photo ?? undefined, timeHidden: p.time_hidden || undefined, groupSize: p.group_size ?? undefined, members: p.group_size ? companyOf(p.id, p.author) : undefined, music: p.music?.track && safeTrack(p.music.track) ? { track: safeTrack(p.music.track)!, start: Math.max(0, Number(p.music.start) || 0) } : undefined,
  }))

  const byCapsule = new Map<string, MessageRow[]>()
  const chatPhotos = await sign('chat', (messages.data ?? []).flatMap((m) => (m.photo_path ? [m.photo_path] : [])))
  for (const m of messages.data ?? []) byCapsule.set(m.capsule_id, [...(byCapsule.get(m.capsule_id) ?? []), m])

  // Чаты, которые я удалил у себя: старые сообщения не показываем; пока нет новых — чат скрыт из списка.
  const hiddenAt = (c: CapsuleRow) => { const h = c.author === userId ? c.author_hidden_at : c.responder_hidden_at; return h ? ms(h) : 0 }
  for (const c of capsules.data ?? []) { const h = hiddenAt(c); if (h) byCapsule.set(c.id, (byCapsule.get(c.id) ?? []).filter((m) => ms(m.created_at) > h)) }
  const caps: Capsule[] = (capsules.data ?? []).map((c) => {
    const created = ms(c.created_at)
    const exact = c.plan_id ? place.get(c.plan_id) : undefined
    const rows = byCapsule.get(c.id) ?? []
    const msgs: Message[] = [
      { id: `${c.id}-open`, from: 'system', text: c.plan_id ? 'Чат открыт. Договоритесь о встрече — точное место уже здесь.' : 'Личная переписка.', at: created },
      ...(exact ? [{ id: `${c.id}-place`, from: 'system' as const, text: `Точное место: ${exact}`, at: created }] : []),
      ...rows.map((m) => ({ id: String(m.id), from: m.sender === userId ? 'me' as const : 'them' as const, text: m.body, at: ms(m.created_at), ...(m.photo_path ? { photo: chatPhotos.get(m.photo_path), photoPath: m.photo_path } : {}) })),
      ...(c.status !== 'active' ? [{ id: `${c.id}-status`, from: 'system' as const, text: STATUS_NOTE[c.status], at: Date.now() }] : []),
    ]
    const seen = read[c.id] ?? 0
    return {
      id: c.id, personId: c.author === userId ? c.responder : c.author, activityId: c.plan_id ?? '',
      createdAt: created, expiresAt: ms(c.expires_at), status: c.status, messages: hiddenAt(c) ? msgs.filter((m) => m.from !== 'system') : msgs,
      hidden: !!hiddenAt(c) && !rows.length,
      ...(reported.has(c.id) ? { noShow: true } : {}),
      theirReadAt: (() => { const r = c.author === userId ? c.responder_read_at : c.author_read_at; return r ? ms(r) : undefined })(),
      unread: rows.filter((m) => m.sender !== userId && ms(m.created_at) > seen).length,
    }
  })
  const visibleShorts = (shortRows.data ?? []).filter((s) => !hidden.has(s.author))
  const shortIds = visibleShorts.map((s) => s.id)
  const sc = shortIds.length
    ? await db.from('short_comments').select('*').in('short_id', shortIds).order('created_at').limit(3000).returns<{ id: number; short_id: string; author: string; body: string; created_at: string; reply_to: number | null }[]>()
    : { data: [], error: null }
  if (sc.error) throw sc.error
  const shortComments: PlanComment[] = (sc.data ?? []).filter((c) => !hidden.has(c.author)).map((c) => ({
    id: String(c.id), planId: c.short_id, authorId: c.author === userId ? 'me' : c.author, text: c.body, at: ms(c.created_at), ...(c.reply_to ? { replyTo: String(c.reply_to) } : {}),
  }))
  const urls = await signShorts(visibleShorts.flatMap((s) => (s.thumb_path ? [s.path, s.thumb_path] : [s.path])))
  const shorts: Short[] = visibleShorts.filter((s) => urls.has(s.path)).map((s) => ({
    id: s.id, authorId: s.author === userId ? 'me' : s.author, url: urls.get(s.path)!, path: s.path, kind: s.kind === 'photo' ? 'photo' : 'video', caption: s.caption, at: ms(s.created_at),
    ...(s.thumb_path && urls.has(s.thumb_path) ? { thumb: urls.get(s.thumb_path)!, thumbPath: s.thumb_path } : {}),
  }))
  const groups = await loadGroups(db, userId, hidden)
  const social = await loadSocial(db, userId, planIds, shorts.map((s) => s.id), hidden,
    new Set(activities.filter((a) => a.authorId === 'me').map((a) => a.id)), new Set(shorts.filter((s) => s.authorId === 'me').map((s) => s.id)))
  return { me, people, activities, capsules: caps, groups, comments, blocked, isAdmin: (admins.data ?? []).length > 0, verification: verif.data?.status ?? null, shorts, shortComments, social, settings }
}

/** Фото из хранилища — временными ссылками; старые (base64 в базе) — отдельным запросом, только где они ещё есть. */
async function attachPhotos(profiles: ProfileRow[], plans: PlanRow[]) {
  const db = sb()
  const [urls, oldProfiles, oldPlans] = await Promise.all([
    photoUrls([...profiles, ...plans].flatMap((r) => (r.photo_path ? [r.photo_path] : []))),
    profiles.some((p) => !p.photo_path) ? db.from('profiles').select('id,photo').is('photo_path', null).not('photo', 'is', null).limit(500).returns<{ id: string; photo: string }[]>() : Promise.resolve({ data: [], error: null }),
    plans.some((p) => !p.photo_path) ? db.from('plans').select('id,photo').in('id', plans.filter((p) => !p.photo_path).map((p) => p.id)).not('photo', 'is', null).returns<{ id: string; photo: string }[]>() : Promise.resolve({ data: [], error: null }),
  ])
  const legacy = new Map([...(oldProfiles.data ?? []), ...(oldPlans.data ?? [])].map((r) => [r.id, r.photo]))
  for (const r of [...profiles, ...plans]) r.photo = (r.photo_path ? urls.get(r.photo_path) : legacy.get(r.id)) ?? null
}

/** Общие настройки из админки: объявление, категории, интересы, открыта ли регистрация. */
export interface AppSettings { announcement: string | null; categories: string[] | null; tags: string[] | null; registrationOpen: boolean }
function parseSettings(rows: { key: string; value: unknown }[]): AppSettings {
  const get = (k: string) => rows.find((r) => r.key === k)?.value
  const list = (v: unknown) => (Array.isArray(v) && v.length ? v.map(String) : null)
  const ann = get('announcement')
  return { announcement: typeof ann === 'string' && ann.trim() ? ann : null, categories: list(get('categories')), tags: list(get('tags')), registrationOpen: get('registration_open') !== false }
}

export async function adminSaveSetting(key: 'announcement' | 'categories' | 'tags' | 'registration_open', value: unknown) {
  const { error } = await sb().from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

export interface AdminStats {
  users: number; users_24h: number; users_7d: number; verified: number; plans_active: number; plans_7d: number; messages_24h: number
  chats: number; posts: number; likes: number; follows: number; reports_open: number; bans: number; verifications_pending: number; push_devices: number
  daily: { day: string; users: number; plans: number; messages: number }[]
}
export async function adminStats(): Promise<AdminStats> {
  const { data, error } = await sb().rpc('admin_stats')
  if (error) throw error
  return data as AdminStats
}

export interface AdminUser {
  id: string; name: string; age: number | null; district: string; photo: string | null; verified: boolean; createdAt: number; email: string
  lastSignIn: number | null; isAdmin: boolean; banned: boolean; banReason: string | null; plans: number; posts: number; followers: number; reports: number
}
export async function adminUsers(q: string): Promise<AdminUser[]> {
  const { data, error } = await sb().rpc('admin_users', { q })
  if (error) throw error
  const rows = (data ?? []) as { id: string; name: string; age: number | null; district: string; photo_path: string | null; verified: boolean; created_at: string; email: string; last_sign_in_at: string | null; is_admin: boolean; banned: boolean; ban_reason: string | null; plans: number; posts: number; followers: number; reports: number }[]
  const urls = await photoUrls(rows.flatMap((r) => (r.photo_path ? [r.photo_path] : [])))
  return rows.map((r) => ({
    id: r.id, name: r.name, age: r.age, district: r.district, photo: r.photo_path ? urls.get(r.photo_path) ?? null : null, verified: r.verified,
    createdAt: ms(r.created_at), email: r.email, lastSignIn: r.last_sign_in_at ? ms(r.last_sign_in_at) : null, isAdmin: r.is_admin,
    banned: r.banned, banReason: r.ban_reason, plans: Number(r.plans), posts: Number(r.posts), followers: Number(r.followers), reports: Number(r.reports),
  }))
}
export async function adminSetVerified(userId: string, v: boolean) {
  const { error } = await sb().rpc('admin_set_verified', { u: userId, v })
  if (error) throw error
}
export async function adminSetAdmin(userId: string, v: boolean) {
  const { error } = await sb().rpc('admin_set_admin', { u: userId, v })
  if (error) throw new Error(/last admin/.test(error.message) ? 'Нельзя снять последнего администратора.' : error.message)
}
/** Удалить все планы и публикации пользователя (например, после бана за спам). */
export async function adminWipeContent(userId: string) {
  const db = sb()
  const [{ data: plans }, { data: posts }] = await Promise.all([
    db.from('plans').select('id').eq('author', userId).returns<{ id: string }[]>(),
    db.from('shorts').select('id, path').eq('author', userId).returns<{ id: string; path: string }[]>(),
  ])
  for (const p of plans ?? []) await deletePlan(p.id)
  for (const s of posts ?? []) await deleteShort(s.id, s.path)
  return { plans: plans?.length ?? 0, posts: posts?.length ?? 0 }
}

type LikeRow = { user_id: string; created_at: string }
async function loadSocial(db: SupabaseClient, userId: string, planIds: string[], shortIds: string[], hidden: Set<string>, myPlans: Set<string>, myShorts: Set<string>): Promise<Social> {
  const [pl, sl, fo, sv, sh] = await Promise.all([
    planIds.length ? db.from('plan_likes').select('plan_id, user_id, created_at').in('plan_id', planIds).limit(10000).returns<(LikeRow & { plan_id: string })[]>() : Promise.resolve({ data: [], error: null }),
    shortIds.length ? db.from('short_likes').select('short_id, user_id, created_at').in('short_id', shortIds).limit(10000).returns<(LikeRow & { short_id: string })[]>() : Promise.resolve({ data: [], error: null }),
    db.from('follows').select('follower, followee, created_at').limit(10000).returns<{ follower: string; followee: string; created_at: string }[]>(),
    db.from('saved_plans').select('plan_id').returns<{ plan_id: string }[]>(),
    // Репосты моих планов: правила доступа отдают только их (и мои собственные).
    db.from('plan_shares').select('id, plan_id, user_id, created_at').order('created_at', { ascending: false }).limit(500).returns<{ id: number; plan_id: string; user_id: string; created_at: string }[]>(),
  ])
  for (const r of [pl, sl, fo, sv, sh]) if (r.error) throw r.error
  const planLikes = (pl.data ?? []).filter((l) => !hidden.has(l.user_id))
  const shortLikes = (sl.data ?? []).filter((l) => !hidden.has(l.user_id))
  const follows = (fo.data ?? []).filter((f) => !hidden.has(f.follower) && !hidden.has(f.followee))
  const likeCounts: Record<string, number> = {}
  for (const l of planLikes) likeCounts[l.plan_id] = (likeCounts[l.plan_id] ?? 0) + 1
  for (const l of shortLikes) likeCounts[l.short_id] = (likeCounts[l.short_id] ?? 0) + 1
  const followers: Record<string, number> = {}
  const followersOf: Record<string, string[]> = {}
  const followingOf: Record<string, string[]> = {}
  for (const f of follows) {
    const k = f.followee === userId ? 'me' : f.followee
    const who = f.follower === userId ? 'me' : f.follower
    followingOf[who] = [...(followingOf[who] ?? []), k]
    followers[k] = (followers[k] ?? 0) + 1
    followersOf[k] = [...(followersOf[k] ?? []), f.follower === userId ? 'me' : f.follower]
  }
  // Уведомления: чужие лайки моих планов и публикаций и подписки на меня.
  const notices: Notice[] = [
    ...planLikes.filter((l) => l.user_id !== userId && myPlans.has(l.plan_id)).map((l) => ({ id: `lp-${l.plan_id}-${l.user_id}`, kind: 'likePlan' as const, personId: l.user_id, targetId: l.plan_id, at: ms(l.created_at) })),
    ...shortLikes.filter((l) => l.user_id !== userId && myShorts.has(l.short_id)).map((l) => ({ id: `ls-${l.short_id}-${l.user_id}`, kind: 'likeShort' as const, personId: l.user_id, targetId: l.short_id, at: ms(l.created_at) })),
    ...follows.filter((f) => f.followee === userId).map((f) => ({ id: `f-${f.follower}`, kind: 'follow' as const, personId: f.follower, at: ms(f.created_at) })),
    ...(sh.data ?? []).filter((r) => r.user_id !== userId && !hidden.has(r.user_id) && myPlans.has(r.plan_id)).map((r) => ({ id: `r-${r.id}`, kind: 'repost' as const, personId: r.user_id, targetId: r.plan_id, at: ms(r.created_at) })),
  ].sort((a, b) => b.at - a.at).slice(0, 100)
  return {
    hearts: planLikes.filter((l) => l.user_id === userId).map((l) => l.plan_id),
    shortHearts: shortLikes.filter((l) => l.user_id === userId).map((l) => l.short_id),
    saved: (sv.data ?? []).map((s) => s.plan_id),
    following: follows.filter((f) => f.follower === userId).map((f) => f.followee),
    likeCounts, followers, notices, followersOf, followingOf,
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
    duration_min: a.durationMin, expires_at: new Date(a.expiresAt).toISOString(), x: a.x, y: a.y, photo: null,
    photo_path: a.photo?.startsWith('data:') ? await uploadImage(userId, a.photo) : null,
    music: a.music ?? null,
    time_hidden: !!a.timeHidden, group_size: a.groupSize ?? null,
  })
  if (error) throw error
  const secret = await db.from('plan_secrets').insert({ plan_id: id, exact_place: a.exactPlace })
  if (secret.error) throw secret.error
}

export async function deletePlan(id: string) {
  const { data } = await sb().from('plans').select('photo_path').eq('id', id).maybeSingle<{ photo_path: string | null }>()
  const { error } = await sb().from('plans').delete().eq('id', id)
  if (error) throw error
  if (data?.photo_path) await sb().storage.from('media').remove([data.photo_path])
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

// ——— Групповые чаты ———
interface GroupMessageRow { id: number; group_id: string; sender: string; body: string; photo_path: string | null; created_at: string }
export type { GroupMessageRow }

/** Мои группы с участниками и перепиской. Сообщения тех, кого я заблокировал, не показываем. */
async function loadGroups(db: SupabaseClient, userId: string, hidden: Set<string>): Promise<Group[]> {
  const chats = await db.from('group_chats').select('*').returns<{ id: string; title: string; owner: string; created_at: string; plan_id: string | null }[]>()
  if (chats.error) throw chats.error
  const ids = (chats.data ?? []).map((g) => g.id)
  if (!ids.length) return []
  const [members, msgs] = await Promise.all([
    db.from('group_members').select('group_id, user_id, read_at').in('group_id', ids).returns<{ group_id: string; user_id: string; read_at: string | null }[]>(),
    db.from('group_messages').select('*').in('group_id', ids).order('created_at').limit(3000).returns<GroupMessageRow[]>(),
  ])
  if (members.error) throw members.error
  if (msgs.error) throw msgs.error
  const photos = await sign('chat', (msgs.data ?? []).flatMap((m) => (m.photo_path ? [m.photo_path] : [])))
  // Создатель, который ещё не добавил себя (сбой при создании), видит группу, но не участник — такую пропускаем.
  return (chats.data ?? []).flatMap((g): Group[] => {
    const ms = (members.data ?? []).filter((m) => m.group_id === g.id)
    const mine = ms.find((m) => m.user_id === userId)
    if (!mine) return []
    const myRead = mine.read_at ? ms_(mine.read_at) : 0
    const rows = (msgs.data ?? []).filter((m) => m.group_id === g.id && !hidden.has(m.sender))
    const others = ms.filter((m) => m.user_id !== userId)
    return [{
      id: g.id, title: g.title, ownerId: g.owner === userId ? 'me' : g.owner, createdAt: ms_(g.created_at), ...(g.plan_id ? { planId: g.plan_id } : {}),
      members: others.map((m) => m.user_id).filter((id) => !hidden.has(id)),
      othersReadAt: Math.max(0, ...others.map((m) => (m.read_at ? ms_(m.read_at) : 0))) || undefined,
      messages: [
        { id: `${g.id}-open`, from: 'system' as const, text: 'Группа создана', at: ms_(g.created_at) },
        ...rows.map((m) => ({
          id: String(m.id), from: m.sender === userId ? 'me' as const : 'them' as const, senderId: m.sender === userId ? 'me' : m.sender, text: m.body, at: ms_(m.created_at),
          ...(m.photo_path ? { photo: photos.get(m.photo_path), photoPath: m.photo_path } : {}),
        })),
      ],
      unread: rows.filter((m) => m.sender !== userId && ms_(m.created_at) > myRead).length,
    }]
  })
}
const ms_ = (iso: string) => new Date(iso).getTime()

export async function createGroup(userId: string, id: string, title: string, members: string[]) {
  const { error } = await sb().from('group_chats').insert({ id, title })
  if (error) throw error
  const add = await sb().from('group_members').insert([userId, ...members].map((user_id) => ({ group_id: id, user_id })))
  if (add.error) { await sb().from('group_chats').delete().eq('id', id); throw add.error }
}

/** Войти в общий чат компании группового плана (создаётся при первом участнике). */
export async function joinPlanGroup(planId: string) {
  const { error } = await sb().rpc('join_plan_group', { p: planId })
  if (error) throw new Error(/group full/.test(error.message) ? 'В компании уже нет мест.' : /expired/.test(error.message) ? 'План уже закончился.' : error.message)
}

export async function sendGroupMessage(groupId: string, body: string) {
  const { error } = await sb().from('group_messages').insert({ group_id: groupId, body })
  if (error) throw error
}

export async function sendGroupPhoto(groupId: string, dataUrl: string, text: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${groupId}/${crypto.randomUUID()}.jpg`
  const up = await sb().storage.from('chat').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (up.error) throw up.error
  const { error } = await sb().from('group_messages').insert({ group_id: groupId, body: text, photo_path: path })
  if (error) { await sb().storage.from('chat').remove([path]); throw error }
}

export async function deleteGroupMessage(id: string, photoPath?: string) {
  const { error } = await sb().from('group_messages').delete().eq('id', Number(id))
  if (error) throw error
  if (photoPath) await sb().storage.from('chat').remove([photoPath])
}

export async function markGroupRead(userId: string, groupId: string) {
  const { error } = await sb().from('group_members').update({ read_at: new Date().toISOString() }).eq('group_id', groupId).eq('user_id', userId)
  if (error) throw error
}

export async function renameGroup(groupId: string, title: string) {
  const { error } = await sb().from('group_chats').update({ title }).eq('id', groupId)
  if (error) throw error
}

export async function addGroupMembers(groupId: string, members: string[]) {
  const { error } = await sb().from('group_members').insert(members.map((user_id) => ({ group_id: groupId, user_id })))
  if (error) throw error
}

export async function removeGroupMember(groupId: string, personId: string) {
  const { error } = await sb().from('group_members').delete().eq('group_id', groupId).eq('user_id', personId)
  if (error) throw error
}

/** Выйти из группы; создатель вместо этого удаляет её целиком. */
export async function leaveGroup(userId: string, groupId: string, owner: boolean) {
  const { error } = owner ? await sb().from('group_chats').delete().eq('id', groupId) : await sb().from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  if (error) throw error
}

/** «Свободен сейчас» на столько минут (0 — снять). Время ставит сервер. */
export async function setFree(minutes: number) {
  const { error } = await sb().rpc('set_free', { minutes })
  if (error) throw error
}

/** Отметить, что собеседник не пришёл на договорённую встречу (или снять отметку). */
export async function setNoShow(capsuleId: string, target: string, on: boolean) {
  const { error } = on
    ? await sb().from('no_shows').insert({ capsule_id: capsuleId, target })
    : await sb().from('no_shows').delete().eq('capsule_id', capsuleId)
  if (error && error.code !== '23505') throw error
}

export async function sendMessage(userId: string, capsuleId: string, body: string) {
  const { error } = await sb().from('messages').insert({ capsule_id: capsuleId, sender: userId, body })
  if (error) throw error
}

/** Фото в чат: файл в хранилище chat/<id чата>/, в сообщении — путь к нему. */
export async function sendPhotoMessage(userId: string, capsuleId: string, dataUrl: string, text: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${capsuleId}/${crypto.randomUUID()}.jpg`
  const up = await sb().storage.from('chat').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (up.error) throw up.error
  const { error } = await sb().from('messages').insert({ capsule_id: capsuleId, sender: userId, body: text, photo_path: path })
  if (error) { await sb().storage.from('chat').remove([path]); throw error }
}

export async function deleteMessage(id: string, photoPath?: string) {
  const { error } = await sb().from('messages').delete().eq('id', Number(id))
  if (error) throw error
  if (photoPath) await sb().storage.from('chat').remove([photoPath])
}

export async function addRepost(planId: string) {
  const { error } = await sb().from('plan_shares').insert({ plan_id: planId })
  if (error) throw error
}

export async function hideChat(capsuleId: string) {
  const { error } = await sb().rpc('hide_chat', { c: capsuleId })
  if (error) throw error
}

export async function markRead(capsuleId: string) {
  const { error } = await sb().rpc('mark_read', { c: capsuleId })
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
  // Видео и фото лежат в хранилище отдельно от базы — убираем свои файлы до удаления аккаунта.
  const user = await currentUser()
  if (user) {
    for (const bucket of ['shorts', 'media', 'avatars']) {
      const { data } = await sb().storage.from(bucket).list(user.id, { limit: 1000 })
      if (data?.length) await sb().storage.from(bucket).remove(data.map((f) => `${user.id}/${f.name}`))
    }
    // Мои чаты удалятся вместе с аккаунтом — убираем и фото из них.
    const { data: chats } = await sb().from('capsules').select('id').returns<{ id: string }[]>()
    for (const c of chats ?? []) {
      const { data } = await sb().storage.from('chat').list(c.id, { limit: 1000 })
      if (data?.length) await sb().storage.from('chat').remove(data.map((f) => `${c.id}/${f.name}`))
    }
    // Мои фото в групповых чатах.
    const { data: gp } = await sb().from('group_messages').select('photo_path').eq('sender', user.id).not('photo_path', 'is', null).returns<{ photo_path: string }[]>()
    if (gp?.length) await sb().storage.from('chat').remove(gp.map((m) => m.photo_path))
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

const replyRef = (replyTo?: string) => (replyTo && /^\d+$/.test(replyTo) ? { reply_to: Number(replyTo) } : {})

export async function addComment(planId: string, body: string, replyTo?: string) {
  const { error } = await sb().from('plan_comments').insert({ plan_id: planId, body, ...replyRef(replyTo) })
  if (error) throw error
}

export async function addShortComment(shortId: string, body: string, replyTo?: string) {
  const { error } = await sb().from('short_comments').insert({ short_id: shortId, body, ...replyRef(replyTo) })
  if (error) throw error
}

export async function deleteShortComment(id: string) {
  const { error } = await sb().from('short_comments').delete().eq('id', Number(id))
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
export interface AdminVerification { userId: string; name: string; age: number | null; photo: string; gesture: string; createdAt: number }

export async function adminVerifications(): Promise<AdminVerification[]> {
  const db = sb()
  const [reqs, profiles] = await Promise.all([
    db.from('verification_requests').select('*').eq('status', 'pending').order('created_at').returns<{ user_id: string; photo: string | null; gesture: string; created_at: string }[]>(),
    db.from('profiles').select('id,name,age').returns<{ id: string; name: string; age: number | null }[]>(),
  ])
  for (const r of [reqs, profiles]) if (r.error) throw r.error
  const who = new Map((profiles.data ?? []).map((p) => [p.id, p]))
  return (reqs.data ?? []).map((r) => ({
    userId: r.user_id, name: who.get(r.user_id)?.name ?? 'удалён', age: who.get(r.user_id)?.age ?? null,
    photo: r.photo ?? '', gesture: r.gesture, createdAt: ms(r.created_at),
  }))
}

/** Решение модератора: триггер в базе ставит или снимает галочку и удаляет селфи. */
export async function decideVerification(userId: string, approve: boolean) {
  const { error } = await sb().from('verification_requests').update({ status: approve ? 'approved' : 'rejected' }).eq('user_id', userId)
  if (error) throw error
}
export interface AdminReport { id: number; reason: string; body: string; status: 'open' | 'resolved'; createdAt: number; reporter: { id: string; name: string }; target: { id: string; name: string; banned: boolean }; post?: { id: string; path: string; kind: 'video' | 'photo'; caption: string; url: string } }

export async function adminReports(): Promise<AdminReport[]> {
  const db = sb()
  const [reports, profiles, bans] = await Promise.all([
    db.from('reports').select('*').order('created_at', { ascending: false }).limit(200).returns<{ id: number; reporter: string; target: string; reason: string; body: string; status: 'open' | 'resolved'; created_at: string; short_id: string | null }[]>(),
    db.from('profiles').select('id,name').returns<{ id: string; name: string }[]>(),
    db.from('bans').select('user_id').returns<{ user_id: string }[]>(),
  ])
  for (const r of [reports, profiles, bans]) if (r.error) throw r.error
  const name = new Map((profiles.data ?? []).map((p) => [p.id, p.name]))
  const banned = new Set((bans.data ?? []).map((b) => b.user_id))
  // Публикации, на которые пожаловались: чтобы модератор видел, о чём речь.
  const ids = [...new Set((reports.data ?? []).flatMap((r) => (r.short_id ? [r.short_id] : [])))]
  const posts = ids.length ? (await db.from('shorts').select('id,path,kind,caption').in('id', ids).returns<{ id: string; path: string; kind: 'video' | 'photo'; caption: string }[]>()).data ?? [] : []
  const urls = await sign('shorts', posts.map((p) => p.path))
  const post = new Map(posts.map((p) => [p.id, { ...p, url: urls.get(p.path) ?? '' }]))
  return (reports.data ?? []).map((r) => ({
    post: r.short_id ? post.get(r.short_id) : undefined,
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

export async function sendReport(target: string, reason: string, body: string, shortId?: string) {
  const { error } = await sb().from('reports').insert({ target, reason, body, ...(shortId ? { short_id: shortId } : {}) })
  if (error) throw error
}

/** Любое изменение в чате, капсулах, планах или профилях — повод перечитать данные.
 *  Новые сообщения дополнительно приходят сразу (`onMessage`), чтобы не ждать перезагрузки.
 *  Канал сам переподключается: телефон обрывает соединение, когда вкладка свёрнута. */
export function subscribe(onChange: () => void, onMessage: (m: MessageRow) => void, onStatus?: (live: boolean) => void, onGroupMessage?: (m: GroupMessageRow) => void) {
  let ch: ReturnType<SupabaseClient['channel']> | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  const open = () => {
    if (stopped) return
    if (ch) void sb().removeChannel(ch)
    ch = sb().channel(`iskra-live-${Date.now()}`)
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => onMessage(p.new as MessageRow))
    if (onGroupMessage) ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (p) => onGroupMessage(p.new as GroupMessageRow))
    for (const table of ['messages', 'capsules', 'plans', 'profiles', 'plan_comments', 'shorts', 'plan_likes', 'short_likes', 'follows', 'plan_shares', 'app_settings', 'short_comments', 'group_chats', 'group_members', 'group_messages']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
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
