import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'
import { relative } from '../lib'
import { Button, Icon, Logo, Pill } from '../components/ui'
import { adminReports, humanError, setBan, setReportStatus, type AdminReport } from '../cloud/api'

/** Модерация на сервере: жалобы пользователей и баны. Открывается только администраторам (таблица admins). */
export function CloudAdmin({ onExit }: { onExit: () => void }) {
  const { state } = useStore()
  const [reports, setReports] = useState<AdminReport[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [showResolved, setShowResolved] = useState(false)

  const load = useCallback(() => {
    adminReports().then(setReports, (e) => setError(humanError(e)))
  }, [])
  useEffect(() => { if (state.isAdmin) load() }, [state.isAdmin, load])

  const act = async (id: number, job: () => Promise<void>) => {
    setBusy(id); setError('')
    try { await job(); load() } catch (e) { setError(humanError(e)) } finally { setBusy(null) }
  }

  const now = Date.now()
  const open = (reports ?? []).filter((r) => r.status === 'open')
  const list = showResolved ? reports ?? [] : open

  return (
    <div className="min-h-full max-w-[720px] mx-auto px-4 py-4 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Logo className="text-lg" /><Pill tone="cobalt">модерация</Pill></div>
        <Button variant="ghost" onClick={onExit} className="border border-line h-9 whitespace-nowrap shrink-0"><Icon name="back" size={16} /> К сайту</Button>
      </header>

      {!state.cloud || !state.isAdmin ? (
        <div className="rounded-[24px] bg-surface shadow-soft p-6 text-center flex flex-col gap-2">
          <p className="font-semibold">Нет доступа</p>
          <p className="text-muted text-[14px]">Модерация доступна только администраторам. Войдите под аккаунтом администратора.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display font-bold text-xl">Жалобы {open.length > 0 && <span className="text-spark tnum">· {open.length}</span>}</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowResolved((v) => !v)} className="h-9 px-3 rounded-full bg-surface-2 text-[13px] font-semibold cursor-pointer">{showResolved ? 'Только открытые' : 'Показать все'}</button>
              <button onClick={load} className="grid place-items-center w-9 h-9 rounded-full bg-surface-2 cursor-pointer" aria-label="Обновить"><Icon name="repeat" size={16} /></button>
            </div>
          </div>
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          {reports === null && !error && <p className="text-muted">Загружаем…</p>}
          {reports && !list.length && <p className="rounded-[24px] bg-surface-2 p-6 text-center text-muted">{showResolved ? 'Жалоб пока не было.' : 'Открытых жалоб нет.'}</p>}
          <ul className="flex flex-col gap-3">
            {list.map((r) => (
              <li key={r.id} className={`rounded-[24px] bg-surface shadow-soft p-4 flex flex-col gap-2 ${r.status === 'resolved' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.reason}</span>
                  <span className="text-[12px] text-muted shrink-0">{relative(r.createdAt, now)}</span>
                </div>
                <p className="text-[14px]">На <b>{r.target.name}</b>{r.target.banned && <Pill tone="danger" className="ml-2">забанен</Pill>} · от {r.reporter.name}</p>
                {r.body && r.body !== '—' && <p className="text-[14px] text-muted whitespace-pre-wrap">«{r.body}»</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.status === 'open'
                    ? <Button variant="secondary" className="h-9 text-[13px]" disabled={busy === r.id} onClick={() => act(r.id, () => setReportStatus(r.id, 'resolved'))}><Icon name="check" size={15} /> Решено</Button>
                    : <Button variant="ghost" className="h-9 text-[13px] border border-line" disabled={busy === r.id} onClick={() => act(r.id, () => setReportStatus(r.id, 'open'))}>Вернуть в открытые</Button>}
                  {r.target.banned
                    ? <Button variant="ghost" className="h-9 text-[13px] border border-line" disabled={busy === r.id} onClick={() => act(r.id, () => setBan(r.target.id, false))}>Разбанить</Button>
                    : <Button variant="danger" className="h-9 text-[13px]" disabled={busy === r.id} onClick={() => act(r.id, async () => { await setBan(r.target.id, true, r.reason); await setReportStatus(r.id, 'resolved') })}>Забанить {r.target.name}</Button>}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted">Забаненный пропадает из ленты и поиска у всех, не может публиковать планы и писать сообщения. Разбан возвращает всё как было.</p>
        </>
      )}
    </div>
  )
}
