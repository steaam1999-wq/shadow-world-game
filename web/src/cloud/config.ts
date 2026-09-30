// Подключение к Supabase. Оба значения публичные (anon-ключ рассчитан на браузер,
// доступ ограничивают правила RLS в supabase/schema.sql). Пусто — работает локальное демо.
// Переменные VITE_SUPABASE_* при сборке перекрывают значения (для тестового стенда).
const URL = 'https://mrivbqkqdaxtvwcsljzu.supabase.co'
const ANON_KEY = 'sb_publishable_vQOSHry2UtWJlP2dSDrrqA_URApDiSl'

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || URL
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || ANON_KEY

// Публичный ключ для push-уведомлений (закрытая пара хранится в секретах Supabase).
export const VAPID_PUBLIC_KEY = 'BNFGUbBGFotZRRYiTQB7yIAHgNtchaFnh9y4D5MMfhsumLndmotqVJfwp5qEOnLcQu9SkkAgMjT6aF1ajqDF0jM'

export const cloudEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
