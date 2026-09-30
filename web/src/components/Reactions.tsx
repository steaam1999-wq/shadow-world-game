import { useStore } from '../store'

// Реакции Match на сообщения: искра, кофе, музыка, «встретимся», смех, сердце.
export const REACTIONS = ['🔥', '☕', '🎶', '🤝', '😂', '❤️']

/** Панель выбора реакции — появляется под сообщением по нажатию. */
export function ReactionPicker({ chatId, messageId, onDone }: { chatId: string; messageId: string; onDone: () => void }) {
  const { state, dispatch } = useStore()
  const mine = (state.reactions ?? []).find((r) => r.chatId === chatId && r.messageId === messageId && r.userId === 'me')?.emoji
  // Временное сообщение (ещё не сохранено на сервере) — реагировать пока не на что.
  if (messageId.startsWith('tmp-')) return null
  return (
    <div className="anim-pop inline-flex items-center gap-0.5 rounded-full bg-surface shadow-soft border border-line px-1 py-0.5" role="group" aria-label="Реакции">
      {REACTIONS.map((e) => (
        <button key={e} onClick={() => { dispatch({ type: 'react', chatId, messageId, emoji: mine === e ? null : e }); onDone() }}
          className={`grid place-items-center w-9 h-9 rounded-full text-[20px] cursor-pointer hover:bg-surface-2 ${mine === e ? 'bg-spark-soft' : ''}`} aria-label={`Реакция ${e}`} aria-pressed={mine === e}>{e}</button>
      ))}
    </div>
  )
}

/** Реакции под сообщением: «🔥 2 ☕ 1»; моя — подсвечена, нажатие по ней убирает. */
export function ReactionChips({ chatId, messageId }: { chatId: string; messageId: string }) {
  const { state, dispatch } = useStore()
  const list = (state.reactions ?? []).filter((r) => r.chatId === chatId && r.messageId === messageId)
  if (!list.length) return null
  const counts = REACTIONS.map((e) => ({ e, n: list.filter((r) => r.emoji === e).length, mine: list.some((r) => r.emoji === e && r.userId === 'me') })).filter((x) => x.n)
  const names = (e: string) => list.filter((r) => r.emoji === e).map((r) => (r.userId === 'me' ? 'вы' : state.people.find((p) => p.id === r.userId)?.name ?? 'кто-то')).join(', ')
  return (
    <div className="flex flex-wrap gap-1 -mt-0.5">
      {counts.map(({ e, n, mine }) => (
        <button key={e} onClick={() => { if (mine) dispatch({ type: 'react', chatId, messageId, emoji: null }) }} title={names(e)}
          className={`inline-flex items-center gap-0.5 h-6 px-1.5 rounded-full text-[13px] border ${mine ? 'bg-spark-soft border-spark cursor-pointer' : 'bg-surface border-line cursor-default'}`}
          aria-label={`${e} ${n}: ${names(e)}`}>
          <span>{e}</span>{n > 1 && <span className="text-[11px] font-semibold tnum">{n}</span>}
        </button>
      ))}
    </div>
  )
}
