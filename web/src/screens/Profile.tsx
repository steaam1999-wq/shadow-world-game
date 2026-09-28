import { useState } from 'react'
import { DISTRICTS, VIBE_QUESTIONS } from '../data'
import { useStore } from '../store'
import { LEVELS, level, plural, profileCompleteness } from '../lib'
import { Avatar, Button, Chip, Field, Icon, Pill, Sheet, Toggle, inputCls } from '../components/ui'

export function Profile({ onSignOut, onAdmin }: { onSignOut: () => void; onAdmin: () => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [editVibe, setEditVibe] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const lv = level(me.meetings)
  const complete = profileCompleteness(me)
  const patch = (p: Partial<typeof me>) => dispatch({ type: 'updateMe', patch: p })

  const badges = [
    { id: 'first', name: 'Первая искра', desc: 'Первая состоявшаяся встреча', got: me.meetings >= 1 },
    { id: 'verified', name: 'Проверенный', desc: 'Прошёл верификацию', got: me.verified },
    { id: 'full', name: 'Открытая книга', desc: 'Профиль заполнен на 100%', got: complete === 100 },
    { id: 'host', name: 'Организатор', desc: 'Предложил свою активность', got: state.activities.some((a) => a.authorId === 'me') },
    { id: 'fast', name: 'Без лишних слов', desc: 'Договорился быстрее 24 часов', got: state.capsules.some((c) => c.status !== 'active') },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Шапка профиля */}
      <section className="rounded-3xl bg-surface border border-line p-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={me.name} hue={me.hue} size={76} verified={me.verified} />
            <label htmlFor="photo" className="absolute -left-1 -bottom-1 grid place-items-center w-8 h-8 rounded-full bg-fg text-bg cursor-pointer border-2 border-surface" title="Сменить фото">
              <Icon name="camera" size={15} />
            </label>
            <input id="photo" type="file" accept="image/*" className="sr-only" onChange={() => patch({ hue: Math.floor(Math.random() * 360) })} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-xl">{me.name}, {me.age}</h1>
            <p className="text-[13px] text-muted">{me.district} · вход через {me.authMethod === 'telegram' ? 'Telegram' : me.authMethod === 'google' ? 'Google' : 'телефон'}</p>
            <div className="mt-1.5"><Pill tone="spark">Ур. {lv.idx} · {lv.name}</Pill></div>
          </div>
        </div>
        <Field id="me-bio" label="О себе">
          <textarea id="me-bio" className={`${inputCls} h-20 py-2 resize-none`} value={me.bio} onChange={(e) => patch({ bio: e.target.value })} maxLength={200} placeholder="Пара предложений о себе" />
        </Field>
        <div>
          <div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold">Профиль заполнен</span><span className="font-mono tnum">{complete}%</span></div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full bg-ok" style={{ width: `${complete}%` }} /></div>
        </div>
        {!me.verified && (
          <button onClick={() => setVerifying(true)} className="flex items-center gap-3 rounded-2xl bg-cobalt-soft text-cobalt p-3 text-left cursor-pointer">
            <Icon name="shield" size={26} />
            <span className="flex-1"><span className="block font-semibold">Пройти верификацию</span><span className="block text-[13px] opacity-80">Селфи с жестом. Проверенным отвечают в 3 раза чаще.</span></span>
          </button>
        )}
      </section>

      {/* Уровни и значки */}
      <section className="rounded-3xl bg-fg text-bg p-5 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="eyebrow !text-bg/60">Уровень доверия</span>
            <h2 className="font-display font-bold text-xl">{lv.name}</h2>
          </div>
          <div className="text-right text-[13px] opacity-75">
            {me.meetings} {plural(me.meetings, 'встреча', 'встречи', 'встреч')}
            {lv.next && <><br />до «{lv.next.name}»: {lv.next.min - me.meetings}</>}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5" aria-label={`Уровень ${lv.idx} из ${LEVELS.length}`}>
          {LEVELS.map((l, i) => (
            <div key={l.name} className="flex flex-col gap-1">
              <div className={`h-1.5 rounded-full ${i < lv.idx ? 'bg-spark' : 'bg-white/15'}`} />
              <span className={`text-[10px] truncate ${i < lv.idx ? '' : 'opacity-50'}`}>{l.name}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {badges.map((b) => (
            <div key={b.id} className={`flex items-center gap-3 rounded-2xl p-3 ${b.got ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
              <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${b.got ? 'bg-spark text-on-spark' : 'bg-white/10'}`}><Icon name={b.got ? 'spark' : 'x'} size={16} fill={b.got} /></span>
              <span className="min-w-0"><span className="block font-semibold text-[14px]">{b.name}</span><span className="block text-[12px] opacity-70">{b.desc}</span></span>
            </div>
          ))}
        </div>
      </section>

      {/* Вайб-тест и интересы */}
      <section className="rounded-3xl bg-surface border border-line p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Мой вайб</h2>
          <Button variant="secondary" className="h-9 px-4 text-[14px]" onClick={() => setEditVibe(true)}>Изменить</Button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {VIBE_QUESTIONS.map((q) => {
            const o = q.options.find((x) => x.id === me.answers[q.id])
            return (
              <div key={q.id} className="min-w-0">
                <dt className="text-[12px] text-muted">{q.title}</dt>
                <dd className="font-semibold">{o?.label ?? '—'}</dd>
              </div>
            )
          })}
        </dl>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Интересы</span>
          <div className="flex flex-wrap gap-2">
            {state.tags.map((t) => (
              <Chip key={t} active={me.tags.includes(t)} onClick={() => patch({ tags: me.tags.includes(t) ? me.tags.filter((x) => x !== t) : [...me.tags, t] })}>{t}</Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Приватность */}
      <section className="rounded-3xl bg-surface border border-line px-5 py-2 flex flex-col divide-y divide-line">
        <h2 className="font-display font-bold text-lg py-3">Приватность и геолокация</h2>
        <div className="py-3">
          <Field id="me-district" label="Мой район">
            <select id="me-district" className={inputCls} value={me.district} onChange={(e) => patch({ district: e.target.value })}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        <Toggle id="pv-approx" checked={me.privacy.approxLocation} onChange={(v) => patch({ privacy: { ...me.privacy, approxLocation: v } })} label="Только приблизительное местоположение" hint="Другие видят район, а не точку на карте" />
        <Toggle id="pv-age" checked={me.privacy.showExactAge} onChange={(v) => patch({ privacy: { ...me.privacy, showExactAge: v } })} label="Показывать точный возраст" hint="Иначе — диапазон, например 25–29" />
        <Toggle id="pv-contacts" checked={me.privacy.hideFromContacts} onChange={(v) => patch({ privacy: { ...me.privacy, hideFromContacts: v } })} label="Скрыть от контактов телефона" hint="Коллеги и родственники вас не увидят" />
      </section>

      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={onAdmin} className="border border-line"><Icon name="settings" size={18} /> Админ-панель (демо)</Button>
        <Button variant="ghost" onClick={() => { dispatch({ type: 'reset' }); onSignOut() }} className="text-muted">Сбросить демо-данные</Button>
        <Button variant="danger" onClick={() => { dispatch({ type: 'signOut' }); onSignOut() }}><Icon name="logout" size={18} /> Выйти</Button>
      </div>

      <Sheet open={editVibe} onClose={() => setEditVibe(false)} title="Вайб-тест">
        <div className="flex flex-col gap-5">
          {VIBE_QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col gap-2">
              <span className="font-semibold">{q.title}</span>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <Chip key={o.id} active={me.answers[q.id] === o.id} onClick={() => patch({ answers: { ...me.answers, [q.id]: o.id } })}>{o.label}</Chip>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={() => setEditVibe(false)}>Сохранить</Button>
        </div>
      </Sheet>

      <VerifySheet open={verifying} onClose={() => setVerifying(false)} onDone={() => patch({ verified: true })} />
    </div>
  )
}

function VerifySheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const close = () => { setFile(null); setSent(false); onClose() }
  return (
    <Sheet open={open} onClose={close} title="Верификация">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Селфи отправлено модератору. В демо проверка проходит сразу: синяя галочка уже в профиле.</p>
          <Button onClick={close}>Отлично</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-2 p-5 text-center">
            <div className="font-display font-extrabold text-5xl text-cobalt" aria-hidden="true">✌</div>
            <p className="mt-2 font-semibold">Сфотографируйтесь, показывая два пальца у виска</p>
            <p className="text-[13px] text-muted">Жест меняется каждый раз, поэтому старое фото не подойдёт.</p>
          </div>
          <label htmlFor="selfie" className="flex items-center justify-center gap-2 h-12 rounded-full border-2 border-dashed border-line cursor-pointer hover:border-cobalt font-semibold">
            <Icon name="camera" size={18} /> {file ? file : 'Загрузить селфи'}
          </label>
          <input id="selfie" type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
          <Button disabled={!file} onClick={() => { onDone(); setSent(true) }}>Отправить на проверку</Button>
          <p className="text-[12px] text-muted">Фото видит только модератор и удаляет после проверки. Биометрические данные мы не храним.</p>
        </div>
      )}
    </Sheet>
  )
}
