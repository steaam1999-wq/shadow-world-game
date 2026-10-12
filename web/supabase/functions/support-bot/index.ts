// Komeeta: бот поддержки. Отвечает на вопросы о приложении через Claude.
// Только для вошедших; не больше 40 вопросов в сутки на человека. Ключ — секрет ANTHROPIC_API_KEY в Supabase.
// Нет ключа — отвечаем 503 «not_configured», и приложение отвечает по встроенным частым вопросам.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Неизменная часть — кэшируется, поэтому повторные вопросы стоят дёшево. Ничего изменчивого (даты, имена) сюда не класть.
const SYSTEM = `Ты — бот поддержки приложения Komeeta (komeeta.com). Отвечай по-русски, коротко и по-человечески: 1–5 предложений или короткий список шагов. Без канцелярита. Обращайся на «вы».

Что такое Komeeta: приложение для живых встреч с людьми рядом. Не знакомства и не свайпы — человек публикует план («кофе в 19:00», «прогулка в парке»), другие откликаются, договариваются в чате и встречаются. Работает по Беларуси и России, сейчас запуск в Барановичах. Бесплатно.

Как всё устроено (кнопки и пути в приложении):
- Нижняя панель: Главная, Поиск, «+» (создать), Чаты, Профиль.
- Создать план: «+» → «План на встречу» → что предлагаете, когда, место → «Опубликовать на 48 часов». План виден 48 часов. Можно сделать групповой план (компания до N человек).
- Откликнуться на план: нажать на карточку плана или кнопку «Откликнуться» → откроется чат с автором. С одним человеком — один общий чат.
- Свободен(на) сейчас: на главной блок «Свободен(на) сейчас?» — отметить, что вы свободны, и позвать тех, кто рядом.
- Чаты: личные и групповые, фото, голосовые (зажать микрофон), реакции, удаление своего сообщения «у всех», звонки и видеозвонки (доступны, когда вы оба написали друг другу). «⋯» в чате → «Оформление чата»: фон (в том числе своё фото), цвет сообщений, размер текста.
- Защита в чате: пока собеседник не ответил, можно отправить не больше 3 сообщений. Предупреждение, если в чате просят деньги. Кнопка «Пожаловаться или заблокировать» в «⋯».
- Встреча: в чате «⋯» → «Договорились о встрече», «Отметить встречу» (код из 4 цифр), «Я на встрече» — таймер безопасности: если не отметиться вовремя, доверенный контакт получит сигнал.
- Профиль: фото, о себе, интересы, район. «Оформление» — акцентный цвет, обложка, кольцо аватарки, статус на 24 часа. Нажать на своё имя в профиле — переключение между аккаунтами без пароля, «Добавить аккаунт».
- Проверка профиля (синяя галочка): баннер на главной или Профиль → карточка проверки; нужно сделать селфи с жестом, проверяет команда. Если человек в сети, галочка светится зелёным.
- Достижения: «Первая встреча», «Душа компании», «Надёжный», «Проводник» (3 приглашённых друга), «Легенда» (10 встреч), «Основатель» (первые пользователи). «Комета» — самая редкая: собрать эти пять (кроме «Основателя») и привести 5 активных друзей (у каждого фото и «о себе», от 3 публикаций или планов, заходил 5 дней из первой недели, общался не только с пригласившим). Даёт радужную рамку у фото, планы выше в ленте, видно, кто смотрел планы. «Амбассадор» — помогает запускать встречи в городе, выдаёт команда.
- Пригласить друга: Профиль → поделиться/пригласить, ссылка-приглашение.
- Уведомления: Android-приложение — разрешить уведомления в настройках телефона (Настройки → Приложения → Komeeta → Уведомления). iPhone — только если сайт добавлен на экран «Домой» (Safari → «Поделиться» → «На экран „Домой“»), затем открыть с иконки и нажать «Включить уведомления».
- Приложение для Android скачивается с komeeta.com (APK). На iPhone — сайт, добавленный на экран «Домой».
- Если что-то не обновилось — полностью закрыть приложение и открыть снова.
- Удалить аккаунт или сменить почту: написать команде через «Сообщить об ошибке» (Профиль → Настройки) — сделаем вручную.
- Жалоба на человека: в его профиле или чате «⋯» → «Пожаловаться». Модераторы читают переписку только по жалобе.

Правила:
- Отвечай только про Komeeta и встречи. На посторонние темы вежливо скажи, что помогаешь с приложением.
- Не выдумывай функций, которых нет в списке. Если не знаешь или вопрос про конкретную ошибку/аккаунт/оплату/бан — скажи, что передашь команде, и предложи нажать «Позвать человека» под чатом.
- Никогда не проси пароли, коды из СМС/почты, данные карт.
- Про безопасность встреч: встречаться в людных местах, сказать близким, пользоваться «Я на встрече».`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'method' })
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return reply(503, { error: 'not_configured' })

  // Запрос от вошедшего: дальше работаем от его имени (лимит считает база по auth.uid()).
  const auth = req.headers.get('Authorization') ?? ''
  const db = createClient(url, anonKey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } })
  const { data: who } = await db.auth.getUser(auth.replace(/^Bearer\s+/i, ''))
  if (!who?.user) return reply(401, { error: 'auth' })
  const { data: n, error: limErr } = await db.rpc('support_tick')
  if (limErr) return reply(500, { error: 'limit' })
  if ((n as number) > 40) return reply(429, { error: 'limit' })

  const body = await req.json().catch(() => ({})) as { messages?: { role: string; content: string }[] }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }))
  // Диалог должен начинаться с вопроса человека и заканчиваться им.
  while (history.length && history[0].role !== 'user') history.shift()
  if (!history.length || history[history.length - 1].role !== 'user') return reply(400, { error: 'messages' })

  const client = new Anthropic({ apiKey: key })
  try {
    // Fallbacks: если основная модель откажется по правилам безопасности, сервер сам повторит на подходящей модели.
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: history,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    } as unknown as Parameters<typeof client.beta.messages.create>[0]) as Anthropic.Beta.BetaMessage
    if (res.stop_reason === 'refusal') return reply(200, { text: 'С этим вопросом я помочь не могу. Нажмите «Позвать человека» — ответит команда Komeeta.' })
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
    return reply(200, { text: text || 'Не получилось ответить. Попробуйте переформулировать или нажмите «Позвать человека».' })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return reply(429, { error: 'busy' })
    if (e instanceof Anthropic.AuthenticationError) return reply(503, { error: 'not_configured' })
    if (e instanceof Anthropic.APIError) return reply(502, { error: `api ${e.status}` })
    return reply(500, { error: 'failed' })
  }
})
