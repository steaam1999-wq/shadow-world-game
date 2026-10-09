// Komeeta: администратор удаляет аккаунт пользователя целиком (вход, профиль и все данные — каскадом).
// Вызывает только вошедший админ; себя и другого админа удалить нельзя.
import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')!
const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'method' })
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: who } = await db.auth.getUser(token)
  const caller = who?.user?.id
  if (!caller) return reply(401, { error: 'auth' })
  const { data: isAdmin } = await db.from('admins').select('user_id').eq('user_id', caller).maybeSingle()
  if (!isAdmin) return reply(403, { error: 'forbidden' })

  const { user } = await req.json().catch(() => ({})) as { user?: string }
  if (!user || !/^[0-9a-f-]{36}$/i.test(user)) return reply(400, { error: 'user' })
  if (user === caller) return reply(400, { error: 'self' })
  const { data: target } = await db.from('admins').select('user_id').eq('user_id', user).maybeSingle()
  if (target) return reply(400, { error: 'admin' })

  // Файлы человека в хранилищах (аватарка, фото, видео) — тоже убираем.
  for (const bucket of ['avatars', 'media', 'shorts']) {
    const { data: files } = await db.storage.from(bucket).list(user, { limit: 1000 })
    if (files?.length) await db.storage.from(bucket).remove(files.map((f) => `${user}/${f.name}`))
  }
  const { error } = await db.auth.admin.deleteUser(user)
  if (error) return reply(500, { error: error.message })
  return reply(200, { ok: true })
})
