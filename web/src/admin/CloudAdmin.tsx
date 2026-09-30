import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { plural, relative, nameAge } from '../lib'
import { Avatar, Button, Icon, Logo, Pill, Sheet, Toggle, inputCls } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from '../data'
import { requestReload } from '../cloud/sync'
import {
  adminReports, adminSaveSetting, adminSetAdmin, adminSetVerified, adminStats, adminUsers, adminVerifications, adminWipeContent,
  decideVerification, deletePlan, deleteShort, humanError, setBan, setReportStatus,
  type AdminReport, type AdminStats, type AdminUser, type AdminVerification,
} from '../cloud/api'

type Tab = 'overview' | 'users' | 'moderation' | 'content' | 'settings'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Обзор', icon: 'grid' },
  { id: 'users', label: 'Люди', icon: 'user' },
  { id: 'moderation', label: 'Модерация', icon: 'flag' },
  { id: 'content', label: 'Контент', icon: 'reels' },
  { id: 'settings', label: 'Настройки', icon: 'settings' },
]

/** Админ-панель на сервере. Открывается только администраторам (таблица admins). */
export function CloudAdmin({ onExit }: { onExit: () => void }) {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [error, setError] = useState('')
  const [pending, setPending] = useState({ reports: 0, verifs: 0 })

  return (
    <div className="min-h-full max-w-[860px] mx-auto px-4 py-4 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Logo className="text-lg" /><Pill tone="cobalt">админ</Pill></div>
        <Button variant="ghost" onClick={onExit} className="border border-line h-9 whitespace-nowrap shrink-0"><Icon name="back" size={16} /> К сайту</Button>
      </header>

      {!state.cloud || !state.isAdmin ? (
        <div className="rounded-[24px] bg-surface shadow-soft p-6 text-center flex flex-col gap-2">
          <p className="font-semibold">Нет доступа</p>
          <p className="text-muted text-[14px]">Админ-панель доступна только администраторам. Войдите под аккаунтом администратора.</p>
        </div>
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4" role="tablist" aria-label="Разделы админки">
            {TABS.map((t) => {
              const badge = t.id === 'moderation' ? pending.reports + pending.verifs : 0
              return (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setError('') }}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-semibold cursor-pointer ${tab === t.id ? 'bg-fg text-bg' : 'bg-surface-2'}`}>
                  <Icon name={t.icon} size={16} /> {t.label}
                  {badge > 0 && <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[11px] tnum">{badge}</span>}
                </button>
              )
            })}
          </nav>
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          {tab === 'overview' && <Overview onError={setError} onPending={setPending} go={setTab} />}
          {tab === 'users' && <Users onError={setError} />}
          {tab === 'moderation' && <Moderation onError={setError} />}
          {tab === 'content' && <Content onError={setError} />}
          {tab === 'settings' && <Settings onError={setError} />}
        </>
      )}
    </div>
  )
}

const card = 'rounded-[24px] bg-surface shadow-soft p-4'

function Overview({ onError, onPending, go }: { onError: (e: string) => void; onPending: (p: { reports: number; verifs: number }) => void; go: (t: Tab) => void }) {
  const [s, setS] = useState<AdminStats | null>(null)
  const load = useCallback(() => { adminStats().then((x) => { setS(x); onPending({ reports: x.reports_open, verifs: x.verifications_pending }) }, (e) => onError(humanError(e))) }, [onError, onPending])
  useEffect(load, [load])
  if (!s) return <p className="text-muted">Загружаем…</p>
  const tiles: [string, number, string?, Tab?][] = [
    ['Пользователи', s.users, `+${s.users_24h} за сутки · +${s.users_7d} за неделю`, 'users'],
    ['Проверенные', s.verified, s.users ? `${Math.round((s.verified / s.users) * 100)}% от всех` : ''],
    ['Активные планы', s.plans_active, `+${s.plans_7d} за неделю`, 'content'],
    ['Сообщения за сутки', s.messages_24h, `чатов всего: ${s.chats}`],
    ['Публикации', s.posts, '', 'content'],
    ['Лайки', s.likes, `подписок: ${s.follows}`],
    ['Открытые жалобы', s.reports_open, '', 'moderation'],
    ['Ждут верификации', s.verifications_pending, '', 'moderation'],
    ['Забанены', s.bans, '', 'users'],
    ['Устройства с push', s.push_devices, 'получают уведомления при закрытом сайте'],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map(([label, v, note, to]) => (
          <button key={label} onClick={() => to && go(to)} className={`${card} text-left flex flex-col gap-0.5 ${to ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}>
            <span className="text-[12px] text-muted">{label}</span>
            <span className={`font-display font-bold text-2xl tnum ${label === 'Открытые жалобы' && v > 0 ? 'text-danger' : ''}`}>{v.toLocaleString('ru-RU')}</span>
            {note && <span className="text-[12px] text-muted">{note}</span>}
          </button>
        ))}
      </div>
      <section className={card}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Последние 14 дней</h2>
          <button onClick={load} className="grid place-items-center w-8 h-8 rounded-full bg-surface-2 cursor-pointer" aria-label="Обновить"><Icon name="repeat" size={14} /></button>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[13px] tnum">
            <thead><tr className="text-muted text-left"><th className="p-1 font-medium">День</th><th className="p-1 font-medium text-right">Новые люди</th><th className="p-1 font-medium text-right">Планы</th><th className="p-1 font-medium text-right">Сообщения</th></tr></thead>
            <tbody>
              {[...s.daily].reverse().map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="p-1">{new Date(d.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' })}</td>
                  <td className="p-1 text-right">{d.users}</td><td className="p-1 text-right">{d.plans}</td><td className="p-1 text-right">{d.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

type Filter = 'all' | 'new' | 'banned' | 'admins' | 'unverified' | 'reported'
const FILTERS: [Filter, string][] = [['all', 'Все'], ['new', 'Новые за неделю'], ['reported', 'С жалобами'], ['unverified', 'Без галочки'], ['banned', 'Забанены'], ['admins', 'Админы']]

function Users({ onError }: { onError: (e: string) => void }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [open, setOpen] = useState<AdminUser | null>(null)
  const load = useCallback(() => { adminUsers(q.trim()).then(setUsers, (e) => onError(humanError(e))) }, [q, onError])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])
  const now = Date.now()
  const list = (users ?? []).filter((u) =>
    filter === 'all' ? true : filter === 'new' ? now - u.createdAt < 7 * 86400_000 : filter === 'banned' ? u.banned : filter === 'admins' ? u.isAdmin : filter === 'unverified' ? !u.verified : u.reports > 0)
  const me = state.cloud?.userId

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 h-11 rounded-2xl bg-surface-2 px-3.5 text-muted">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, почта или город" aria-label="Поиск пользователей" className="flex-1 min-w-0 bg-transparent text-fg placeholder:text-muted focus:outline-none" />
      </label>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer ${filter === id ? 'bg-cobalt text-white' : 'bg-surface-2'}`}>{label}</button>
        ))}
      </div>
      {users === null ? <p className="text-muted">Загружаем…</p> : (
        <>
          <p className="text-[13px] text-muted">{list.length} {plural(list.length, 'человек', 'человека', 'человек')}</p>
          <ul className="flex flex-col gap-2">
            {list.map((u) => (
              <li key={u.id}>
                <button onClick={() => setOpen(u)} className={`${card} !p-3 w-full flex items-center gap-3 text-left cursor-pointer hover:brightness-95`}>
                  <Avatar name={u.name} hue={u.name.length * 37} src={u.photo ?? undefined} size={44} verified={u.verified} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold truncate">{nameAge(u.name, u.age)}
                      {u.isAdmin && <Pill tone="cobalt">админ</Pill>}{u.banned && <Pill tone="danger">бан</Pill>}{u.id === me && <Pill tone="muted">вы</Pill>}
                    </span>
                    <span className="block text-[12px] text-muted truncate">{u.email}{u.district ? ` · ${u.district}` : ''}</span>
                    <span className="block text-[12px] text-muted">с {new Date(u.createdAt).toLocaleDateString('ru-RU')} · планов {u.plans} · публикаций {u.posts} · подписчиков {u.followers}{u.reports ? ` · жалоб ${u.reports}` : ''}</span>
                  </span>
                  <Icon name="arrow" size={16} className="text-muted shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <UserSheet user={open} onClose={() => setOpen(null)} onChanged={() => { load(); requestReload() }} onError={onError} self={open?.id === me} />
    </div>
  )
}

function UserSheet({ user: u, onClose, onChanged, onError, self }: { user: AdminUser | null; onClose: () => void; onChanged: () => void; onError: (e: string) => void; self: boolean }) {
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('')
  const [wipe, setWipe] = useState(false)
  const [done, setDone] = useState('')
  useEffect(() => { setReason(''); setWipe(false); setDone('') }, [u?.id])
  if (!u) return <Sheet open={false} onClose={onClose} title=""><span /></Sheet>
  const run = async (job: () => Promise<unknown>, msg: string) => {
    setBusy(true); onError('')
    try { await job(); setDone(msg); onChanged() } catch (e) { onError(humanError(e)) } finally { setBusy(false) }
  }
  return (
    <Sheet open={!!u} onClose={onClose} title={nameAge(u.name, u.age)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={u.name} hue={u.name.length * 37} src={u.photo ?? undefined} size={64} verified={u.verified} />
          <div className="text-[13px] text-muted flex flex-col">
            <span className="text-fg">{u.email}</span>
            <span>{u.district || 'город не указан'}</span>
            <span>Зарегистрирован(а) {relative(u.createdAt, Date.now())}{u.lastSignIn ? ` · заходил(а) ${relative(u.lastSignIn, Date.now())}` : ''}</span>
            <span>Планов {u.plans} · публикаций {u.posts} · подписчиков {u.followers} · жалоб {u.reports}</span>
          </div>
        </div>
        {u.banned && <p className="rounded-2xl bg-danger-soft text-danger text-[13px] p-3">Забанен(а){u.banReason ? `: ${u.banReason}` : ''}</p>}
        {done && <p className="rounded-2xl bg-ok-soft text-ok text-[13px] p-3" role="status">{done}</p>}
        <div className="rounded-2xl bg-surface-2 px-3.5">
          <Toggle id="adm-verified" checked={u.verified} onChange={(v) => run(() => adminSetVerified(u.id, v), v ? 'Галочка поставлена' : 'Галочка снята')} label="Проверенный профиль" hint="Синяя галочка у имени" />
          <Toggle id="adm-admin" checked={u.isAdmin} onChange={(v) => run(() => adminSetAdmin(u.id, v), v ? 'Теперь администратор' : 'Больше не администратор')} label="Администратор" hint={self ? 'Это вы' : 'Доступ к этой панели'} />
        </div>
        {!self && (u.banned ? (
          <Button variant="secondary" disabled={busy} onClick={() => run(() => setBan(u.id, false), 'Бан снят')}>Разбанить</Button>
        ) : (
          <div className="flex flex-col gap-2">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина бана (увидят только админы)" maxLength={200} aria-label="Причина бана" />
            <Button variant="danger" disabled={busy} onClick={() => run(() => setBan(u.id, true, reason.trim() || 'Нарушение правил'), 'Забанен(а)')}>Забанить</Button>
          </div>
        ))}
        {!self && (u.plans > 0 || u.posts > 0) && (wipe ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setWipe(false)}>Отмена</Button>
            <Button variant="danger" disabled={busy} onClick={() => run(async () => { const r = await adminWipeContent(u.id); setWipe(false); return r }, 'Планы и публикации удалены')}>Да, удалить всё</Button>
          </div>
        ) : (
          <Button variant="ghost" className="text-danger" onClick={() => setWipe(true)}><Icon name="trash" size={16} /> Удалить все планы и публикации</Button>
        ))}
      </div>
    </Sheet>
  )
}

function Moderation({ onError }: { onError: (e: string) => void }) {
  const [reports, setReports] = useState<AdminReport[] | null>(null)
  const [verifs, setVerifs] = useState<AdminVerification[]>([])
  const [deciding, setDeciding] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const load = useCallback(() => {
    adminReports().then(setReports, (e) => onError(humanError(e)))
    adminVerifications().then(setVerifs, (e) => onError(humanError(e)))
  }, [onError])
  useEffect(load, [load])
  const act = async (id: number, job: () => Promise<void>) => {
    setBusy(id); onError('')
    try { await job(); load() } catch (e) { onError(humanError(e)) } finally { setBusy(null) }
  }
  const decide = async (userId: string, ok: boolean) => {
    setDeciding(userId)
    try { await decideVerification(userId, ok); load() } catch (e) { onError(humanError(e)) } finally { setDeciding(null) }
  }
  const now = Date.now()
  const open = (reports ?? []).filter((r) => r.status === 'open')
  const list = showResolved ? reports ?? [] : open

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-display font-bold text-xl">Верификация {verifs.length > 0 && <span className="text-cobalt tnum">· {verifs.length}</span>}</h2>
        {!verifs.length && <p className="rounded-[24px] bg-surface-2 p-4 text-center text-muted text-[14px]">Заявок нет.</p>}
        <ul className="flex flex-col gap-3">
          {verifs.map((v) => (
            <li key={v.userId} className={`${card} flex gap-4`}>
              {v.photo ? <img src={v.photo} alt={`Селфи ${v.name}`} className="w-28 h-28 rounded-2xl object-cover shrink-0" /> : <span className="w-28 h-28 rounded-2xl bg-surface-2 shrink-0" />}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <span className="font-semibold">{nameAge(v.name, v.age)}</span>
                <span className="text-[13px] text-muted">Задание: {v.gesture}</span>
                <span className="text-[12px] text-muted">{relative(v.createdAt, now)}</span>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button className="h-9 text-[13px]" disabled={deciding === v.userId} onClick={() => decide(v.userId, true)}><Icon name="check" size={15} /> Одобрить</Button>
                  <Button variant="secondary" className="h-9 text-[13px]" disabled={deciding === v.userId} onClick={() => decide(v.userId, false)}>Отклонить</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl">Жалобы {open.length > 0 && <span className="text-spark tnum">· {open.length}</span>}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowResolved((v) => !v)} className="h-9 px-3 rounded-full bg-surface-2 text-[13px] font-semibold cursor-pointer">{showResolved ? 'Только открытые' : 'Показать все'}</button>
          <button onClick={load} className="grid place-items-center w-9 h-9 rounded-full bg-surface-2 cursor-pointer" aria-label="Обновить"><Icon name="repeat" size={16} /></button>
        </div>
      </div>
      {reports === null && <p className="text-muted">Загружаем…</p>}
      {reports && !list.length && <p className="rounded-[24px] bg-surface-2 p-6 text-center text-muted">{showResolved ? 'Жалоб пока не было.' : 'Открытых жалоб нет.'}</p>}
      <ul className="flex flex-col gap-3">
        {list.map((r) => (
          <li key={r.id} className={`${card} flex flex-col gap-2 ${r.status === 'resolved' ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{r.reason}</span>
              <span className="text-[12px] text-muted shrink-0">{relative(r.createdAt, now)}</span>
            </div>
            <p className="text-[14px]">На <b>{r.target.name}</b>{r.target.banned && <Pill tone="danger" className="ml-2">забанен</Pill>} · от {r.reporter.name}</p>
            {r.body && r.body !== '—' && <p className="text-[14px] text-muted whitespace-pre-wrap">«{r.body}»</p>}
            {r.post && (
              <div className="flex gap-3 items-start rounded-2xl bg-surface-2 p-2">
                {r.post.kind === 'photo' ? <img src={r.post.url} alt="Публикация" className="w-24 h-24 rounded-xl object-cover" /> : <video src={r.post.url} className="w-24 h-32 rounded-xl object-cover bg-black" controls playsInline preload="metadata" />}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <p className="text-[13px] text-muted">Публикация{r.post.caption ? `: «${r.post.caption}»` : ''}</p>
                  <Button variant="danger" className="h-9 text-[13px] self-start" disabled={busy === r.id} onClick={() => act(r.id, async () => { await deleteShort(r.post!.id, r.post!.path); await setReportStatus(r.id, 'resolved') })}><Icon name="trash" size={15} /> Удалить публикацию</Button>
                </div>
              </div>
            )}
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
      <p className="text-[12px] text-muted">Забаненный пропадает из ленты и поиска у всех, не может публиковать и писать сообщения. Разбан возвращает всё как было.</p>
    </div>
  )
}

function Content({ onError }: { onError: (e: string) => void }) {
  const { state } = useStore()
  const [kind, setKind] = useState<'plans' | 'posts'>('plans')
  const [confirm, setConfirm] = useState<{ id: string; path?: string; title: string; post: boolean } | null>(null)
  const now = Date.now()
  const author = (id: string) => (id === 'me' ? state.me?.name ?? 'Вы' : state.people.find((p) => p.id === id)?.name ?? 'удалён')
  const plans = useMemo(() => [...state.activities].filter((a) => a.expiresAt > now - 7 * 86400_000).sort((a, b) => b.startsAt - a.startsAt), [state.activities, now])
  const posts = state.shorts ?? []
  const remove = async () => {
    if (!confirm) return
    try { if (confirm.post) await deleteShort(confirm.id, confirm.path); else await deletePlan(confirm.id); requestReload() } catch (e) { onError(humanError(e)) }
    setConfirm(null)
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {([['plans', `Планы · ${plans.length}`], ['posts', `Публикации · ${posts.length}`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setKind(id)} className={`h-9 px-4 rounded-full text-[14px] font-semibold cursor-pointer ${kind === id ? 'bg-cobalt text-white' : 'bg-surface-2'}`}>{label}</button>
        ))}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {kind === 'plans' ? plans.map((a) => (
          <li key={a.id} className={`${card} !p-2 flex flex-col gap-2`}>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden"><PostArt activity={a} /></div>
            <span className="text-[13px] font-semibold line-clamp-2">{a.title}</span>
            <span className="text-[12px] text-muted">{author(a.authorId)} · {a.expiresAt < now ? 'завершён' : 'активен'}</span>
            <Button variant="ghost" className="h-8 text-[12px] text-danger" onClick={() => setConfirm({ id: a.id, title: a.title, post: false })}><Icon name="trash" size={14} /> Удалить</Button>
          </li>
        )) : posts.map((s) => (
          <li key={s.id} className={`${card} !p-2 flex flex-col gap-2`}>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
              {s.kind === 'photo' ? <img src={s.url} alt="" className="w-full h-full object-cover" /> : <video src={s.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />}
            </div>
            <span className="text-[13px] line-clamp-2">{s.caption || 'Без подписи'}</span>
            <span className="text-[12px] text-muted">{author(s.authorId)} · {relative(s.at, now)}</span>
            <Button variant="ghost" className="h-8 text-[12px] text-danger" onClick={() => setConfirm({ id: s.id, path: s.path, title: s.caption || 'публикацию', post: true })}><Icon name="trash" size={14} /> Удалить</Button>
          </li>
        ))}
      </ul>
      {(kind === 'plans' ? plans : posts).length === 0 && <p className="rounded-[24px] bg-surface-2 p-6 text-center text-muted">Пока пусто.</p>}
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Удалить?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">«{confirm?.title}» удалится у всех, вернуть нельзя.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>Отмена</Button>
            <Button variant="danger" onClick={() => void remove()}>Удалить</Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

function ListEditor({ title, hint, value, fallback, onSave }: { title: string; hint: string; value: string[]; fallback: string[]; onSave: (v: string[]) => Promise<void> }) {
  const [items, setItems] = useState(value)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => setItems(value), [value])
  const add = () => { const t = draft.trim(); if (t && !items.includes(t)) setItems([...items, t.slice(0, 30)]); setDraft('') }
  return (
    <section className={`${card} flex flex-col gap-3`}>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-[13px] text-muted">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-surface-2 text-[13px] font-medium">
            {t}
            <button onClick={() => setItems(items.filter((x) => x !== t))} className="grid place-items-center w-6 h-6 rounded-full hover:bg-surface cursor-pointer" aria-label={`Убрать ${t}`}><Icon name="x" size={12} /></button>
          </span>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2">
        <input className={inputCls} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Добавить" maxLength={30} aria-label={`Добавить: ${title}`} />
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>Добавить</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button onClick={async () => { await onSave(items); setSaved(true); setTimeout(() => setSaved(false), 1500) }} disabled={!items.length}>{saved ? 'Сохранено' : 'Сохранить для всех'}</Button>
        <Button variant="ghost" onClick={() => setItems(fallback)}>Как было по умолчанию</Button>
      </div>
    </section>
  )
}

function Settings({ onError }: { onError: (e: string) => void }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState(state.announcement ?? '')
  const [sent, setSent] = useState('')
  const [regOpen, setRegOpen] = useState(state.registrationOpen !== false)
  useEffect(() => { setRegOpen(state.registrationOpen !== false) }, [state.registrationOpen])
  const save = async (key: 'announcement' | 'categories' | 'tags' | 'registration_open', value: unknown, msg: string) => {
    onError('')
    try { await adminSaveSetting(key, value); setSent(msg); requestReload(); setTimeout(() => setSent(''), 2000) } catch (e) { onError(humanError(e)) }
  }
  return (
    <div className="flex flex-col gap-4">
      {sent && <p className="rounded-2xl bg-ok-soft text-ok text-[13px] p-3" role="status">{sent}</p>}
      <section className={`${card} flex flex-col gap-3`}>
        <div>
          <h3 className="font-semibold">Объявление для всех</h3>
          <p className="text-[13px] text-muted">Показывается сверху на главной у всех пользователей, пока каждый сам его не закроет.</p>
        </div>
        <textarea className={`${inputCls} h-24 py-2 resize-none`} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Например: в субботу большая встреча в парке Горького — приходите!" aria-label="Текст объявления" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { dispatch({ type: 'announce', text: text.trim() || null }); void save('announcement', text.trim(), text.trim() ? 'Объявление отправлено всем' : 'Объявление снято') }}>Опубликовать</Button>
          {state.announcement && <Button variant="ghost" onClick={() => { setText(''); void save('announcement', '', 'Объявление снято') }}>Снять</Button>}
        </div>
      </section>

      <section className={`${card} flex flex-col`}>
        <Toggle id="adm-reg" checked={regOpen} onChange={(v) => { setRegOpen(v); void save('registration_open', v, v ? 'Регистрация открыта' : 'Регистрация закрыта: новые анкеты создать нельзя') }}
          label="Регистрация открыта" hint="Выключите, чтобы временно не пускать новых людей. Уже зарегистрированные пользуются как обычно." />
      </section>

      <ListEditor title="Категории планов" hint="Из них выбирают при создании плана и фильтруют поиск." value={state.categories} fallback={DEFAULT_CATEGORIES} onSave={(v) => save('categories', v, 'Категории обновлены')} />
      <ListEditor title="Интересы" hint="Из них выбирают интересы в анкете и профиле." value={state.tags} fallback={DEFAULT_TAGS} onSave={(v) => save('tags', v, 'Интересы обновлены')} />
    </div>
  )
}
