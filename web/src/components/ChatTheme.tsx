// Оформление личной переписки: фон, цвет своих сообщений и размер текста.
// Хранится на этом устройстве: для отдельного чата или для всех чатов сразу.
import { useEffect, useState, type CSSProperties } from 'react'
import { Button, Sheet } from './ui'

export interface ChatLook { wall: string; bubble: string; size: 's' | 'm' | 'l' }
const DEFAULT: ChatLook = { wall: 'none', bubble: 'brand', size: 'm' }
const KEY = 'komeeta-chat-look'
const ALL = '*'

export const WALLS: { id: string; name: string; bg: string; dark?: boolean }[] = [
  { id: 'none', name: 'Без фона', bg: 'var(--bg)' },
  { id: 'dawn', name: 'Рассвет', bg: 'radial-gradient(90% 60% at 15% 0%, rgb(255 170 140 / .35), transparent 70%), radial-gradient(80% 60% at 100% 100%, rgb(255 110 170 / .28), transparent 70%), var(--bg)' },
  { id: 'lilac', name: 'Сирень', bg: 'radial-gradient(90% 60% at 85% 0%, rgb(160 120 255 / .32), transparent 70%), radial-gradient(80% 60% at 0% 100%, rgb(255 120 200 / .22), transparent 70%), var(--bg)' },
  { id: 'ocean', name: 'Океан', bg: 'radial-gradient(100% 70% at 0% 0%, rgb(90 170 255 / .30), transparent 70%), radial-gradient(80% 60% at 100% 100%, rgb(60 210 200 / .24), transparent 70%), var(--bg)' },
  { id: 'sage', name: 'Шалфей', bg: 'radial-gradient(100% 70% at 100% 0%, rgb(150 200 140 / .30), transparent 70%), radial-gradient(80% 60% at 0% 100%, rgb(230 210 150 / .24), transparent 70%), var(--bg)' },
  { id: 'dots', name: 'Точки', bg: 'radial-gradient(color-mix(in srgb, var(--fg) 13%, transparent) 1.2px, transparent 1.6px) 0 0 / 22px 22px, var(--bg)' },
  { id: 'night', name: 'Ночь', dark: true, bg: 'radial-gradient(1.2px 1.2px at 20% 30%, #fff9, transparent), radial-gradient(1px 1px at 70% 15%, #fff8, transparent), radial-gradient(1.4px 1.4px at 85% 60%, #fffa, transparent), radial-gradient(1px 1px at 35% 80%, #fff7, transparent), radial-gradient(120% 80% at 50% 0%, #2b1f55, #0d0b1c 70%)' },
  { id: 'cosmos', name: 'Космос', dark: true, bg: 'radial-gradient(60% 40% at 80% 10%, rgb(255 79 134 / .45), transparent 70%), radial-gradient(70% 50% at 10% 90%, rgb(122 92 255 / .5), transparent 70%), #100c1f' },
]

export const BUBBLES: { id: string; name: string; bg: string; glow: string }[] = [
  { id: 'brand', name: 'Komeeta', bg: 'var(--brand)', glow: 'rgb(255 79 134 / .9)' },
  { id: 'violet', name: 'Фиалка', bg: 'linear-gradient(135deg, #8a5cff, #5b3fd6)', glow: 'rgb(122 92 255 / .8)' },
  { id: 'blue', name: 'Синий', bg: 'linear-gradient(135deg, #4aa8ff, #2f6fe0)', glow: 'rgb(60 140 255 / .8)' },
  { id: 'teal', name: 'Бирюза', bg: 'linear-gradient(135deg, #2cc5b0, #138f86)', glow: 'rgb(30 180 160 / .8)' },
  { id: 'green', name: 'Зелёный', bg: 'linear-gradient(135deg, #3fd18f, #1f9d63)', glow: 'rgb(50 190 120 / .8)' },
  { id: 'sunset', name: 'Закат', bg: 'linear-gradient(135deg, #ffb347, #ff6a4f)', glow: 'rgb(255 120 70 / .8)' },
  { id: 'graphite', name: 'Графит', bg: 'linear-gradient(135deg, #5d5a66, #34323b)', glow: 'rgb(40 40 50 / .6)' },
]

const SIZES: { id: ChatLook['size']; name: string; px: number }[] = [
  { id: 's', name: 'Мельче', px: 14 }, { id: 'm', name: 'Обычный', px: 15.5 }, { id: 'l', name: 'Крупнее', px: 17.5 },
]

function readAll(): Record<string, ChatLook> {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
function writeAll(v: Record<string, ChatLook>) {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ }
  window.dispatchEvent(new Event(KEY))
}

/** Оформление этого чата (своё, иначе общее для всех чатов, иначе стандартное). */
export function useChatLook(chatId: string): ChatLook {
  const get = () => { const all = readAll(); return { ...DEFAULT, ...(all[chatId] ?? all[ALL]) } }
  const [look, setLook] = useState(get)
  useEffect(() => {
    setLook(get())
    const on = () => setLook(get())
    window.addEventListener(KEY, on)
    return () => window.removeEventListener(KEY, on)
  }, [chatId]) // eslint-disable-line react-hooks/exhaustive-deps
  return look
}

/** CSS-переменные и фон для экрана переписки. */
export function chatLookStyle(look: ChatLook): { vars: CSSProperties; wall: string | null; dark: boolean } {
  const b = BUBBLES.find((x) => x.id === look.bubble) ?? BUBBLES[0]
  const w = WALLS.find((x) => x.id === look.wall) ?? WALLS[0]
  const px = SIZES.find((x) => x.id === look.size)?.px ?? 15.5
  return {
    vars: { '--bubble-me': b.bg, '--bubble-glow': b.glow, '--chat-fs': `${px}px` } as CSSProperties,
    wall: w.id === 'none' ? null : w.bg,
    dark: !!w.dark,
  }
}

/** Фон переписки на весь экран — под сообщениями. */
export function ChatWallpaper({ look }: { look: ChatLook }) {
  const { wall } = chatLookStyle(look)
  if (!wall) return null
  return <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: wall }} aria-hidden="true" />
}

export function ChatThemeSheet({ open, onClose, chatId, name }: { open: boolean; onClose: () => void; chatId: string; name: string }) {
  const current = useChatLook(chatId)
  const [draft, setDraft] = useState<ChatLook>(current)
  const [forAll, setForAll] = useState(false)
  useEffect(() => { if (open) { setDraft(current); setForAll(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const s = chatLookStyle(draft)
  const set = (p: Partial<ChatLook>) => setDraft((d) => ({ ...d, ...p }))
  const save = () => {
    const all = readAll()
    if (forAll) { all[ALL] = draft; delete all[chatId] } else all[chatId] = draft
    writeAll(all)
    onClose()
  }
  const reset = () => {
    const all = readAll()
    delete all[chatId]
    if (forAll) delete all[ALL]
    writeAll(all)
    onClose()
  }
  const ring = (on: boolean) => on ? 'ring-2 ring-offset-2 ring-offset-surface ring-fg' : 'ring-1 ring-line'

  return (
    <Sheet open={open} onClose={onClose} title="Оформление чата">
      <div className="flex flex-col gap-5" style={s.vars}>
        {/* Живой предпросмотр */}
        <div className="relative h-[170px] rounded-[22px] overflow-hidden ring-1 ring-line" style={{ background: s.wall ?? 'var(--bg)' }}>
          <div className="absolute inset-0 flex flex-col justify-end gap-1.5 p-3" style={{ fontSize: 'var(--chat-fs)' }}>
            <span className="self-start bubble-them text-fg rounded-[18px] rounded-bl-[4px] px-3 py-1.5 leading-[1.35] max-w-[75%]">Привет! Идём сегодня? 👋</span>
            <span className="self-end bubble-me text-white rounded-[18px] rounded-br-[7px] px-3 py-1.5 leading-[1.35] max-w-[75%]">Да, давай в 19:00</span>
            <span className="self-end bubble-me text-white rounded-[18px] rounded-tr-[7px] rounded-br-[4px] px-3 py-1.5 leading-[1.35] max-w-[75%]">Возле фонтана ✨</span>
          </div>
        </div>

        <section>
          <h3 className="text-[13px] font-semibold text-muted mb-2">Фон</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {WALLS.map((w) => (
              <button key={w.id} onClick={() => set({ wall: w.id })} className="flex flex-col items-center gap-1 cursor-pointer" aria-pressed={draft.wall === w.id} aria-label={`Фон: ${w.name}`}>
                <span className={`block w-full aspect-[3/4] rounded-2xl transition ${ring(draft.wall === w.id)}`} style={{ background: w.bg }} />
                <span className="text-[11.5px] text-muted truncate max-w-full">{w.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-muted mb-2">Мои сообщения</h3>
          <div className="flex flex-wrap gap-3">
            {BUBBLES.map((b) => (
              <button key={b.id} onClick={() => set({ bubble: b.id })} className={`w-10 h-10 rounded-full cursor-pointer transition ${ring(draft.bubble === b.id)}`} style={{ background: b.bg }} aria-pressed={draft.bubble === b.id} aria-label={`Цвет сообщений: ${b.name}`} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-muted mb-2">Размер текста</h3>
          <div className="grid grid-cols-3 p-1 rounded-full bg-surface-2">
            {SIZES.map((z) => (
              <button key={z.id} onClick={() => set({ size: z.id })} className={`h-9 rounded-full text-[13.5px] font-semibold cursor-pointer transition ${draft.size === z.id ? 'bg-surface shadow-soft' : 'text-muted'}`} aria-pressed={draft.size === z.id}>{z.name}</button>
            ))}
          </div>
        </section>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-[var(--spark)]" checked={forAll} onChange={(e) => setForAll(e.target.checked)} />
          <span className="text-[14.5px]">Для всех чатов, а не только с {name}</span>
        </label>

        <div className="flex flex-col gap-2">
          <Button onClick={save}>Готово</Button>
          <Button variant="ghost" onClick={reset}>Сбросить</Button>
        </div>
      </div>
    </Sheet>
  )
}
