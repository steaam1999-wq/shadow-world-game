// Подключение к Supabase. Оба значения публичные (anon-ключ рассчитан на браузер,
// доступ ограничивают правила RLS в supabase/schema.sql). Пусто — работает локальное демо.
// Переменные VITE_SUPABASE_* при сборке перекрывают значения (для тестового стенда).
const URL = ''
const ANON_KEY = ''

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || URL
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || ANON_KEY

export const cloudEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
