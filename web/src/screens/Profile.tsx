import { useState } from 'react'
import { DISTRICTS, VIBE_QUESTIONS } from '../data'
import { useStore } from '../store'
import { LEVELS, level, plural, profileCompleteness } from '../lib'
import { Avatar, Button, Chip, Field, Icon, Sheet, Toggle, inputCls, readPhoto } from '../components/ui'
import { PostArt } from '../components/PostArt'

export function Profile({ onSignOut, onAdmin }: { onSignOut: () => void; onAdmin: () => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [editVibe, setEditVibe] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'plans' | 'saved' | 'settings'>('plans')
  const [copied, setCopied] = useState(false)
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const share = async () => {
    try { await navigator.clipboard.writeText(`${me.name} в «Искре»: ${myPlans.length} ${plural(myPlans.length, 'план', 'плана', 'планов')} на ближайшие 48 часов`) } catch { /* буфер недоступен */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
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
    <div className="flex flex-col gap-3 pb-4">
      {/* Шапка в духе Инстаграма: фото, счётчики, имя и био */}
      <section className="flex flex-col gap-3 px-4 pt-3">
        <div className="flex items-center gap-6">
          <label htmlFor="photo" className="relative cursor-pointer shrink-0" title="Сменить фото">
            <Avatar name={me.name} hue={me.hue} src={me.photo} size={86} />
            <span className="absolute right-0 bottom-0 grid place-items-center w-7 h-7 rounded-full bg-brand text-white border-2 border-surface"><Icon name="plus" size={14} /></span>
          </label>
          <input id="photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) try { patch({ photo: await readPhoto(f, 400) }) } catch { /* не изображение */ }
          }} />
          <dl className="flex-1 grid grid-cols-3 text-center">
            {[[myPlans.length, plural(myPlans.length, 'план', 'плана', 'планов')], [me.meetings, plural(me.meetings, 'встреча', 'встречи', 'встреч')], [lv.idx, 'уровень']].map(([v, l]) => (
              <div key={String(l)}><dt className="font-bold text-lg tnum leading-tight">{v}</dt><dd className="text-[13px] text-muted">{l}</dd></div>
            ))}
          </dl>
        </div>
        <div className="text-[14px] leading-snug">
          <div className="flex items-center gap-1 font-semibold">
            {me.name}, {me.age}
            {me.verified && <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-cobalt text-white"><Icon name="check" size={9} /></span>}
          </div>
          <div className="text-muted">{lv.name} · {me.district}</div>
          {me.bio ? <p className="whitespace-pre-wrap">{me.bio}</p> : <p className="text-muted">Расскажите о себе в пару строк</p>}
          <p className="text-cobalt">{me.tags.map((t) => `#${t.toLowerCase()}`).join(' ')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setEditing(true)} className="h-9 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer hover:brightness-95">Редактировать</button>
          <button onClick={share} className="h-9 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer hover:brightness-95">{copied ? 'Скопировано' : 'Поделиться'}</button>
        </div>
        {complete < 100 && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <div className="flex-1">
              <div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold">Профиль заполнен</span><span className="font-mono tnum">{complete}%</span></div>
              <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-ok" style={{ width: `${complete}%` }} /></div>
            </div>
            {!me.verified && <button onClick={() => setVerifying(true)} className="shrink-0 h-8 px-3 rounded-full bg-cobalt text-white text-[13px] font-semibold cursor-pointer">Верификация</button>}
          </div>
        )}
        {/* Значки как «актуальное» */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
          {badges.map((b) => (
            <div key={b.id} className={`flex flex-col items-center gap-1 w-[68px] shrink-0 ${b.got ? '' : 'opacity-40'}`} title={b.desc}>
              <span className="grid place-items-center w-16 h-16 rounded-full border border-line p-1">
                <span className={`grid place-items-center w-full h-full rounded-full ${b.got ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}><Icon name="spark" size={22} fill /></span>
              </span>
              <span className="text-[11px] text-center leading-tight">{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 border-t border-line" role="tablist">
        {([['plans', 'grid', 'Мои планы'], ['saved', 'bookmark', 'Сохранённое'], ['settings', 'settings', 'Настройки']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)}
            className={`h-11 grid place-items-center border-t -mt-px cursor-pointer ${tab === id ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>
            <Icon name={icon} size={22} />
          </button>
        ))}
      </div>

      {(tab === 'plans' || tab === 'saved') && (() => {
        const list = tab === 'plans' ? myPlans : state.activities.filter((a) => state.saved.includes(a.id))
        return list.length ? (
          <div className="grid grid-cols-3 gap-1 px-1">
            {list.map((a) => (
              <div key={a.id} className="relative aspect-[3/4] max-w-full overflow-hidden rounded-lg">
                <PostArt activity={a} />
                <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px] font-semibold leading-tight line-clamp-2">{a.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-6 text-center flex flex-col items-center gap-2">
            <span className="grid place-items-center w-16 h-16 rounded-full border-2 border-fg"><Icon name={tab === 'plans' ? 'camera' : 'bookmark'} size={28} /></span>
            <p className="font-display font-bold text-lg">{tab === 'plans' ? 'Пока нет планов' : 'Ничего не сохранено'}</p>
            <p className="text-[13px] text-muted">{tab === 'plans' ? 'Нажмите «+» внизу, чтобы предложить первый план.' : 'Нажмите на закладку под постом, чтобы вернуться к нему позже.'}</p>
          </div>
        )
      })()}

      {tab === 'settings' && <div className="flex flex-col gap-5 px-4 pt-2">

      {/* Уровни и значки */}
      <section className="rounded-[28px] bg-surface shadow-soft p-5 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Уровень доверия</span>
            <h2 className="font-display font-bold text-xl">{lv.name}</h2>
          </div>
          <div className="text-right text-[13px] text-muted">
            {me.meetings} {plural(me.meetings, 'встреча', 'встречи', 'встреч')}
            {lv.next && <><br />до «{lv.next.name}»: {lv.next.min - me.meetings}</>}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5" aria-label={`Уровень ${lv.idx} из ${LEVELS.length}`}>
          {LEVELS.map((l, i) => (
            <div key={l.name} className="flex flex-col gap-1">
              <div className={`h-1.5 rounded-full ${i < lv.idx ? 'bg-brand' : 'bg-surface-2'}`} />
              <span className={`text-[10px] truncate ${i < lv.idx ? '' : 'opacity-50'}`}>{l.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Вайб-тест и интересы */}
      <section className="rounded-[28px] bg-surface shadow-soft p-5 flex flex-col gap-4">
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
      </section>

      {/* Приватность */}
      <section className="rounded-[28px] bg-surface shadow-soft px-5 py-2 flex flex-col divide-y divide-line">
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
      </div>}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Редактировать профиль">
        <div className="flex flex-col gap-4">
          <Field id="me-name" label="Имя">
            <input id="me-name" className={inputCls} value={me.name} onChange={(e) => patch({ name: e.target.value })} maxLength={30} />
          </Field>
          <Field id="me-bio" label="О себе">
            <textarea id="me-bio" className={`${inputCls} h-24 py-2 resize-none`} value={me.bio} onChange={(e) => patch({ bio: e.target.value })} maxLength={200} placeholder="Пара предложений о себе" />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">Интересы</span>
            <div className="flex flex-wrap gap-2">
              {state.tags.map((t) => (
                <Chip key={t} active={me.tags.includes(t)} onClick={() => patch({ tags: me.tags.includes(t) ? me.tags.filter((x) => x !== t) : [...me.tags, t] })}>{t}</Chip>
              ))}
            </div>
          </div>
          <Button onClick={() => setEditing(false)} disabled={!me.name.trim()}>Готово</Button>
        </div>
      </Sheet>

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
            <div className="font-display font-bold text-5xl text-cobalt" aria-hidden="true">✌</div>
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
