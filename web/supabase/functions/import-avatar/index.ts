// Komeeta: фото из Telegram или Google для профиля. Возвращает картинку как data:URL — дальше её сохраняет
// само приложение (как обычное фото профиля). Берём только с адресов Telegram и Google, не больше 5 МБ.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const ALLOWED = /(^|\.)(googleusercontent\.com|t\.me|telegram\.org|telesco\.pe|cdn-telegram\.org)$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'method' })
  const auth = req.headers.get('Authorization') ?? ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
  const { data: who } = await db.auth.getUser(auth.replace(/^Bearer\s+/i, ''))
  const meta = who?.user?.user_metadata as Record<string, unknown> | undefined
  if (!who?.user) return reply(401, { error: 'auth' })
  let src = String(meta?.avatar_url ?? meta?.picture ?? '')
  if (!src) return reply(200, { photo: null })
  let url: URL
  try { url = new URL(src) } catch { return reply(200, { photo: null }) }
  if (url.protocol !== 'https:' || !ALLOWED.test(url.hostname)) return reply(200, { photo: null })
  // У Google по умолчанию крошечная картинка 96×96 — просим 512.
  if (/googleusercontent\.com$/i.test(url.hostname)) src = src.replace(/=s\d+(-c)?$/, '=s512-c')
  try {
    const r = await fetch(src, { redirect: 'follow' })
    const finalHost = new URL(r.url).hostname
    const type = r.headers.get('content-type') ?? ''
    if (!r.ok || !ALLOWED.test(finalHost) || !/^image\/(jpeg|png|webp)/i.test(type)) return reply(200, { photo: null })
    const buf = new Uint8Array(await r.arrayBuffer())
    if (buf.length < 500 || buf.length > 5 * 1024 * 1024) return reply(200, { photo: null })
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    return reply(200, { photo: `data:${type.split(';')[0]};base64,${btoa(bin)}` })
  } catch {
    return reply(200, { photo: null })
  }
})
