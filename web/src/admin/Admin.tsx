import { useState } from 'react'
import { ANALYTICS } from '../data'
import { useStore } from '../store'
import { isExpired, relative } from '../lib'
import { Avatar, Button, Icon, Logo, Pill, inputCls } from '../components/ui'
import { CloudAdmin } from './CloudAdmin'
import { cloudEnabled } from '../cloud/config'

type Tab = 'moderation' | 'analytics' | 'content'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'moderation', label: 'Модерация', icon: 'shield' },
  { id: 'analytics', label: 'Аналитика', icon: 'vibe' },
  { id: 'content', label: 'Контент', icon: 'settings' },
]

export function Admin({ onExit }: { onExit: () => void }) {
  const { state } = useStore()
  // С сервером демо-админку видит только тот, кто сейчас в демо-аккаунте; без входа — «Нет доступа».
  if (state.cloud || (cloudEnabled && !state.me)) return <CloudAdmin onExit={onExit} />
  return <DemoAdmin onExit={onExit} />
}

function DemoAdmin({ onExit }: { onExit: () => void }) {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('moderation')
  const pending = state.verifications.filter((v) => v.state === 'pending').length + state.reports.filter((r) => r.state === 'open').length

  return (
    <div className="min-h-full md:grid md:grid-cols-[232px_1fr]">
      <aside className="md:sticky md:top-0 md:h-dvh border-b md:border-b-0 md:border-r border-line bg-surface px-4 py-3 md:py-6 flex md:flex-col gap-3 md:gap-6">
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-start w-full md:w-auto">
          <div className="flex items-center gap-2"><Logo className="text-lg" /><Pill tone="cobalt">admin</Pill></div>
          <button onClick={onExit} className="md:hidden text-[13px] font-semibold text-muted cursor-pointer">Выйти</button>
        </div>
        <nav className="hidden md:flex flex-col gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 h-10 px-3 rounded-xl font-medium cursor-pointer ${tab === t.id ? 'bg-fg text-bg' : 'hover:bg-surface-2'}`}>
              <Icon name={t.icon} size={18} /> {t.label}
              {t.id === 'moderation' && pending > 0 && <span className="ml-auto text-[12px] font-bold text-spark tnum">{pending}</span>}
            </button>
          ))}
        </nav>
        <Button variant="ghost" onClick={onExit} className="hidden md:flex mt-auto border border-line"><Icon name="back" size={18} /> К сайту</Button>
      </aside>

      <div className="md:hidden flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 h-9 px-4 rounded-full text-[14px] font-semibold cursor-pointer ${tab === t.id ? 'bg-fg text-bg' : 'bg-surface border border-line'}`}>{t.label}</button>
        ))}
      </div>

      <main className="px-4 sm:px-8 py-6 min-w-0 max-w-5xl">
        {tab === 'moderation' && <Moderation />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'content' && <Content />}
      </main>
    </div>
  )
}

function Moderation() {
  const { state, dispatch } = useStore()
  const now = Date.now()
  const pendingV = state.verifications.filter((v) => v.state === 'pending')
  const doneV = state.verifications.filter((v) => v.state !== 'pending')
  const openR = state.reports.filter((r) => r.state === 'open')
  const closedR = state.reports.filter((r) => r.state !== 'open')

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display font-bold text-2xl">Модерация</h1>
        <p className="text-muted">Проверка новых пользователей и жалоб. Цель: ответ в течение часа.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-lg">Верификация селфи <Pill tone={pendingV.length ? 'warn' : 'ok'}>{pendingV.length} в очереди</Pill></h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {pendingV.map((v) => (
            <article key={v.id} className="rounded-2xl bg-surface border border-line p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={v.name} hue={v.hue} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{v.name}, {v.age}</div>
                  <div className="text-[12px] text-muted">Вход: {v.method} · {relative(v.at, now)}</div>
                </div>
              </div>
              <div className="rounded-xl bg-surface-2 px-3 py-2 text-[13px]">Требуемый жест: <b>{v.gesture}</b></div>
              <div className="flex gap-2">
                <Button className="flex-1 h-10" variant="secondary" onClick={() => dispatch({ type: 'verify', id: v.id, state: 'approved' })}><Icon name="check" size={16} /> Одобрить</Button>
                <Button className="flex-1 h-10" variant="danger" onClick={() => dispatch({ type: 'verify', id: v.id, state: 'rejected' })}><Icon name="x" size={16} /> Отклонить</Button>
              </div>
            </article>
          ))}
          {!pendingV.length && <p className="text-muted">Очередь пуста.</p>}
        </div>
        {doneV.length > 0 && (
          <p className="text-[13px] text-muted">Обработано: {doneV.map((v) => `${v.name} (${v.state === 'approved' ? 'одобрен' : 'отклонён'})`).join(', ')}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-lg">Жалобы <Pill tone={openR.length ? 'danger' : 'ok'}>{openR.length} открыто</Pill></h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-[14px] min-w-[640px]">
            <thead className="text-left text-muted text-[12px] uppercase tracking-wider">
              <tr><th className="p-3 font-semibold">На кого</th><th className="p-3 font-semibold">Причина</th><th className="p-3 font-semibold">Подробности</th><th className="p-3 font-semibold">Когда</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {[...openR, ...closedR].map((r) => {
                const p = state.people.find((x) => x.id === r.personId)
                return (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="p-3"><div className="flex items-center gap-2">{p && <Avatar name={p.name} hue={p.hue} src={p.photo} size={28} />}<span className="font-medium">{p?.name ?? '—'}</span></div></td>
                    <td className="p-3"><Pill tone={r.state === 'open' ? 'warn' : 'muted'}>{r.reason}</Pill></td>
                    <td className="p-3 text-muted max-w-[260px]">{r.text}</td>
                    <td className="p-3 text-muted whitespace-nowrap">{relative(r.at, now)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {r.state === 'open' ? (
                        <div className="inline-flex gap-2">
                          <button className="h-8 px-3 rounded-full bg-surface-2 font-semibold text-[13px] cursor-pointer" onClick={() => dispatch({ type: 'resolveReport', id: r.id, state: 'resolved' })}>Отклонить</button>
                          <button className="h-8 px-3 rounded-full bg-danger-soft text-danger font-semibold text-[13px] cursor-pointer" onClick={() => dispatch({ type: 'resolveReport', id: r.id, state: 'banned' })}>Заблокировать</button>
                        </div>
                      ) : (
                        <Pill tone={r.state === 'banned' ? 'danger' : 'ok'}>{r.state === 'banned' ? 'Заблокирован' : 'Закрыта'}</Pill>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Analytics() {
  const { state } = useStore()
  const now = Date.now()
  const [hover, setHover] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)
  const regs = ANALYTICS.registrations
  const total = regs.reduce((a, b) => a + b, 0)
  const prevWeek = regs.slice(0, 7).reduce((a, b) => a + b, 0)
  const thisWeek = regs.slice(7).reduce((a, b) => a + b, 0)
  const growth = Math.round(((thisWeek - prevWeek) / prevWeek) * 100)
  const liveCapsules = state.capsules.filter((c) => !isExpired(c, now)).length + 214
  const funnel = ANALYTICS.funnel
  const conv = Math.round((funnel[3].value / funnel[1].value) * 100)

  // Геометрия графика: одна шкала для столбцов и делений.
  const W = 640, H = 220, padL = 32, padB = 26, padT = 12
  const max = 120
  const ticks = [0, 40, 80, 120]
  const bw = (W - padL) / regs.length
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display font-bold text-2xl">Аналитика</h1>
        <p className="text-muted">15–28 сентября, Минск. Демо-данные.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Регистрации за 14 дней', value: total.toLocaleString('ru-RU'), note: `${growth > 0 ? '+' : ''}${growth}% неделя к неделе`, tone: growth >= 0 ? 'text-ok' : 'text-danger' },
          { label: 'Активные чаты', value: liveCapsules.toLocaleString('ru-RU'), note: 'сейчас, с таймером или договорённостью', tone: 'text-muted' },
          { label: 'Чат → встреча', value: `${conv}%`, note: 'цель MVP: 20%', tone: conv >= 20 ? 'text-ok' : 'text-warn' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-surface border border-line p-4">
            <div className="text-[13px] text-muted">{k.label}</div>
            <div className="font-display font-bold text-3xl tnum mt-1">{k.value}</div>
            <div className={`text-[13px] mt-1 ${k.tone}`}>{k.note}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-surface border border-line p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Регистрации по дням</h2>
          <button onClick={() => setAsTable(!asTable)} className="text-[13px] font-semibold text-cobalt cursor-pointer">{asTable ? 'Показать график' : 'Показать таблицей'}</button>
        </div>
        {asTable ? (
          <div className="overflow-x-auto">
            <table className="text-[13px] tnum">
              <tbody>
                <tr>{ANALYTICS.days.map((d) => <th key={d} className="px-2 py-1 font-medium text-muted whitespace-nowrap">{d}</th>)}</tr>
                <tr>{regs.map((v, i) => <td key={i} className="px-2 py-1 text-center">{v}</td>)}</tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-auto" role="img" aria-label="Столбчатая диаграмма регистраций по дням" onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
                  <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
                </g>
              ))}
              {regs.map((v, i) => {
                const x = padL + i * bw + 1
                const w = bw - 2 // зазор 2px между столбцами
                const top = y(v)
                const bottom = y(0)
                const r = Math.min(4, w / 2)
                return (
                  <g key={i} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}>
                    <rect x={padL + i * bw} y={padT} width={bw} height={H - padT - padB} fill="transparent" />
                    <path d={`M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`}
                      fill="var(--spark)" fillOpacity={hover === null || hover === i ? 1 : 0.45} />
                    {i % 2 === 0 && (
                      <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{ANALYTICS.days[i].split(' ')[0]}</text>
                    )}
                  </g>
                )
              })}
              <text x={W - 2} y={y(regs[regs.length - 1]) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--fg)">{regs[regs.length - 1]}</text>
            </svg>
            {hover !== null && (
              <div className="pointer-events-none absolute top-1 rounded-xl bg-fg text-bg px-3 py-1.5 text-[13px] tnum shadow-lg"
                style={{ left: `calc(${((padL + (hover + 0.5) * bw) / W) * 100}% - 48px)` }}>
                <b>{regs[hover]}</b> · {ANALYTICS.days[hover]}
              </div>
            )}
          </div>
        )}
        <p className="text-[12px] text-muted">Пики приходятся на выходные: в пятницу и субботу люди ищут планы на вечер.</p>
      </section>

      <section className="rounded-2xl bg-surface border border-line p-4 sm:p-5 flex flex-col gap-4">
        <h2 className="font-semibold">Воронка: от отклика до встречи</h2>
        <ol className="flex flex-col gap-3">
          {funnel.map((f, i) => (
            <li key={f.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
              <span className="text-[14px]">{f.label}</span>
              <span className="text-[14px] font-semibold tnum text-right">{f.value.toLocaleString('ru-RU')}{i > 0 && <span className="text-muted font-normal"> · {Math.round((f.value / funnel[i - 1].value) * 100)}%</span>}</span>
              <div className="col-span-2 h-2.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-cobalt" style={{ width: `${(f.value / funnel[0].value) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function ListEditor({ id, title, items, onChange }: { id: string; title: string; items: string[]; onChange: (v: string[]) => void }) {
  const [value, setValue] = useState('')
  return (
    <section className="rounded-2xl bg-surface border border-line p-4 sm:p-5 flex flex-col gap-3">
      <h2 className="font-semibold">{title} <span className="text-muted font-normal tnum">· {items.length}</span></h2>
      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-surface-2 text-[13px] font-medium">
            {c}
            <button onClick={() => onChange(items.filter((x) => x !== c))} className="grid place-items-center w-6 h-6 rounded-full hover:bg-line cursor-pointer" aria-label={`Удалить ${c}`}><Icon name="x" size={12} /></button>
          </span>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = value.trim(); if (v && !items.includes(v)) onChange([...items, v]); setValue('') }}>
        <input id={id} aria-label={`Новое значение: ${title}`} className={`${inputCls} flex-1 min-w-0`} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Добавить…" maxLength={24} />
        <Button type="submit" variant="dark" disabled={!value.trim()}>Добавить</Button>
      </form>
    </section>
  )
}

function Content() {
  const { state, dispatch } = useStore()
  const [text, setText] = useState(state.announcement ?? 'Пятница! В ленте уже 40+ планов на вечер. Загляните в «Идеи».')
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display font-bold text-2xl">Контент</h1>
        <p className="text-muted">Категории встреч, теги интересов и системные уведомления. Изменения сразу видны в приложении.</p>
      </header>
      <ListEditor id="new-category" title="Категории встреч" items={state.categories} onChange={(v) => dispatch({ type: 'setCategories', categories: v })} />
      <ListEditor id="new-tag" title="Теги интересов" items={state.tags} onChange={(v) => dispatch({ type: 'setTags', tags: v })} />
      <section className="rounded-2xl bg-surface border border-line p-4 sm:p-5 flex flex-col gap-3">
        <h2 className="font-semibold flex items-center gap-2"><Icon name="bell" size={18} /> Системное уведомление</h2>
        <textarea id="announcement" aria-label="Текст уведомления" className={`${inputCls} h-24 py-2 resize-none`} value={text} onChange={(e) => setText(e.target.value)} maxLength={160} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => dispatch({ type: 'announce', text: text.trim() || null })} disabled={!text.trim()}>Отправить всем</Button>
          {state.announcement && <Button variant="secondary" onClick={() => dispatch({ type: 'announce', text: null })}>Снять</Button>}
          {state.announcement && <Pill tone="ok">Показывается в приложении</Pill>}
        </div>
      </section>
    </div>
  )
}
