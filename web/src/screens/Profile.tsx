import { useEffect, useState } from 'react'
import { PlaceOptions, placeLine } from '../places'
import { VIBE_QUESTIONS } from '../data'
import { useStore } from '../store'
import { getLang, setLang } from '../i18n'
import { ReliabilityBadge } from '../components/Meet'
import { MeetingCards } from '../components/Met'
import { LEVELS, level, plural, profileCompleteness, nameAge, profileTint } from '../lib'
import { Avatar, Button, Chip, Field, Icon, Sheet, ThemeToggle, Toggle, inputCls, readPhoto } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { PostsViewer } from '../components/PostsViewer'
import type { Activity } from '../types'
import { RulesSheet } from '../components/Rules'
import { ProfileEditor } from '../components/ProfileEditor'
import { FollowersSheet } from '../components/Followers'
import { AlertSettings } from '../components/Alerts'
import { PlayingChip } from '../music/NowPlaying'
import { ProfilePublications } from './Shorts'
import { deleteAccount, humanError, submitVerification } from '../cloud/api'

export function Profile({ onSignOut, onAdmin, onRespond, onOpenCapsule }: {
  onSignOut: () => void
  onAdmin: () => void
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
}) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [editVibe, setEditVibe] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [tab, setTab] = useState<'plans' | 'posts' | 'saved' | 'settings'>('posts')
  const [copied, setCopied] = useState(false)
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const share = async () => {
    try { await navigator.clipboard.writeText(`${me.name} в Match: ${myPlans.length} ${plural(myPlans.length, 'план', 'плана', 'планов')} на ближайшие 48 часов`) } catch { /* буфер недоступен */ }
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
      {/* Шапка в духе Threads: имя слева, фото справа, счётчики строкой под описанием */}
      <section className="flex flex-col gap-3 px-4 pt-3 pb-1 rounded-b-[28px]" style={profileTint(me.hue)}>
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="flex items-center gap-1.5 font-display font-bold text-[24px] leading-tight">
              <span className="truncate">{nameAge(me.name, me.age)}</span>
              {me.verified && <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={12} /></span>}
            </h2>
            <div className="text-[14px] text-muted truncate">{placeLine(lv.name, me.district)}</div>
          </div>
          <button onClick={() => setEditing(true)} className="relative cursor-pointer shrink-0" title="Редактировать профиль и фото" aria-label="Редактировать профиль и фото">
            <Avatar name={me.name} hue={me.hue} src={me.photo} size={76} />
            <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-7 h-7 rounded-full bg-brand text-white border-2 border-surface"><Icon name="camera" size={14} /></span>
          </button>
        </div>
        <div className="text-[14px] leading-snug flex flex-col gap-1">
          <PlayingChip />
          {me.meetings + (me.noShows ?? 0) > 0 && <ReliabilityBadge person={{ id: 'me', meetings: me.meetings, noShows: me.noShows ?? 0 }} />}
          {me.bio ? <p className="whitespace-pre-wrap">{me.bio}</p> : <p className="text-muted">Расскажите о себе в пару строк</p>}
          <p className="text-cobalt">{me.tags.map((t) => `#${t.toLowerCase()}`).join(' ')}</p>
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[14px] text-muted">
          {state.cloud ? (
            <button onClick={() => setShowFollowers(true)} className="cursor-pointer hover:text-fg" aria-label="Показать подписчиков и подписки">
              <b className="text-fg tnum">{state.followers?.me ?? 0}</b> {plural(state.followers?.me ?? 0, 'подписчик', 'подписчика', 'подписчиков')}
            </button>
          ) : <span>уровень <b className="text-fg tnum">{lv.idx}</b></span>}
          <span aria-hidden="true">·</span>
          <span><b className="text-fg tnum">{myPlans.length}</b> {plural(myPlans.length, 'план', 'плана', 'планов')}</span>
          <span aria-hidden="true">·</span>
          <span><b className="text-fg tnum">{me.meetings}</b> {plural(me.meetings, 'встреча', 'встречи', 'встреч')}</span>
        </p>
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
            {!me.verified && (state.cloud && state.verification === 'pending'
              ? <span className="shrink-0 h-8 px-3 rounded-full bg-cobalt-soft text-cobalt text-[13px] font-semibold grid place-items-center">На проверке</span>
              : <button onClick={() => setVerifying(true)} className="shrink-0 h-8 px-3 rounded-full bg-cobalt text-white text-[13px] font-semibold cursor-pointer">{state.cloud && state.verification === 'rejected' ? 'Ещё раз' : 'Верификация'}</button>)}
          </div>
        )}
        <MeetingCards />
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

      <div className="grid grid-cols-4 border-t border-line" role="tablist">
        {([['posts', 'camera', 'Фото и видео'], ['plans', 'grid', 'Мои планы'], ['saved', 'bookmark', 'Сохранённое'], ['settings', 'settings', 'Настройки']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)}
            className={`h-11 grid place-items-center border-t -mt-px cursor-pointer ${tab === id ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>
            <Icon name={icon} size={22} />
          </button>
        ))}
      </div>

      {tab === 'posts' && <ProfilePublications authorId="me" onMessage={() => {}} />}

      {(tab === 'plans' || tab === 'saved') && (() => {
        const list = tab === 'plans' ? myPlans : state.activities.filter((a) => state.saved.includes(a.id))
        return list.length ? (
          <div className="grid grid-cols-3 gap-1 px-1">
            {list.map((a) => (
              <button key={a.id} onClick={() => setViewing(a.id)} className="relative aspect-[3/4] max-w-full overflow-hidden rounded-lg cursor-pointer group" aria-label={`Открыть: ${a.title}`}>
                <PostArt activity={a} />
                <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-left text-white text-[11px] font-semibold leading-tight line-clamp-2">{a.title}</span>
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </button>
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

      <section className="rounded-[28px] bg-surface shadow-soft px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg">Оформление</h2>
          <p className="text-[13px] text-muted">Светлая или тёмная тема</p>
        </div>
        <ThemeToggle />
      </section>

      {/* Мова інтэрфейсу */}
      <section className="rounded-[28px] bg-surface shadow-soft p-5 flex items-center justify-between gap-3" data-no-translate>
        <div>
          <h2 className="font-display font-bold text-lg">Язык · Мова</h2>
          <p className="text-[13px] text-muted">Русский или беларуская</p>
        </div>
        <div className="flex rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Язык интерфейса">
          {([['ru', 'Рус'], ['be', 'Бел']] as const).map(([l, label]) => (
            <button key={l} role="radio" aria-checked={getLang() === l} onClick={() => { if (getLang() !== l) setLang(l) }}
              className={`h-9 px-4 rounded-full text-[14px] font-semibold cursor-pointer ${getLang() === l ? 'bg-surface shadow-soft' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
      </section>

      {/* Приватность */}
      <section className="rounded-[28px] bg-surface shadow-soft px-5 py-2 flex flex-col divide-y divide-line">
        <h2 className="font-display font-bold text-lg py-3">Приватность и геолокация</h2>
        <div className="py-3">
          <Field id="me-district" label="Мой город или район">
            <select id="me-district" className={inputCls} value={me.district} onChange={(e) => patch({ district: e.target.value })}>
              <PlaceOptions />
            </select>
          </Field>
        </div>
        <Toggle id="pv-approx" checked={me.privacy.approxLocation} onChange={(v) => patch({ privacy: { ...me.privacy, approxLocation: v } })} label="Только приблизительное местоположение" hint="Другие видят район, а не точку на карте" />
        <Toggle id="pv-age" checked={me.privacy.showExactAge} onChange={(v) => patch({ privacy: { ...me.privacy, showExactAge: v } })} label="Показывать точный возраст" hint="Иначе — диапазон, например 25–29" />
        <Toggle id="pv-songs" checked={!me.privacy.hideSongs} onChange={(v) => patch({ privacy: { ...me.privacy, hideSongs: !v } })} label="Показывать мои любимые песни" hint="Другие видят их во вкладке «Песни» вашего профиля" />
        <Toggle id="pv-now" checked={!me.privacy.hideNowPlaying} onChange={(v) => patch({ privacy: { ...me.privacy, hideNowPlaying: !v } })} label="Показывать, что я слушаю" hint="Играющий трек виден на вашей странице, пока идёт музыка" />
        <Toggle id="pv-contacts" checked={me.privacy.hideFromContacts} onChange={(v) => patch({ privacy: { ...me.privacy, hideFromContacts: v } })} label="Скрыть от контактов телефона" hint="Коллеги и родственники вас не увидят" />
      </section>

      <AlertSettings />

      <SafetySection onSignOut={onSignOut} />

      <div className="flex flex-col gap-2">
        {(!state.cloud || state.isAdmin) && <Button variant="ghost" onClick={onAdmin} className="border border-line"><Icon name="settings" size={18} /> Админ-панель{state.cloud ? '' : ' (демо)'}</Button>}
        {!state.cloud && <Button variant="ghost" onClick={() => { dispatch({ type: 'reset' }); onSignOut() }} className="text-muted">Сбросить демо-данные</Button>}
        <Button variant="danger" onClick={() => { dispatch({ type: 'signOut' }); onSignOut() }}><Icon name="logout" size={18} /> Выйти</Button>
      </div>
      </div>}

      <ProfileEditor open={editing} onClose={() => setEditing(false)} />
      <FollowersSheet personId="me" open={showFollowers} onClose={() => setShowFollowers(false)} />

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

      {viewing && (() => {
        const list = tab === 'saved' ? state.activities.filter((x) => state.saved.includes(x.id)) : myPlans
        return <PostsViewer title={tab === 'saved' ? 'Сохранённое' : 'Мои планы'} items={list} startId={viewing}
          onClose={() => setViewing(null)} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />
      })()}
      <VerifySheet open={verifying} onClose={() => setVerifying(false)} onDone={() => patch({ verified: true })} />
    </div>
  )
}

const GESTURES = [
  { glyph: '✌', text: 'два пальца у виска' },
  { glyph: '👍', text: 'большой палец вверх у щеки' },
  { glyph: '👌', text: 'знак «ок» у подбородка' },
  { glyph: '✋', text: 'ладонь у подбородка' },
  { glyph: '☝', text: 'указательный палец у носа' },
]

function VerifySheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useStore()
  const [photo, setPhoto] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Жест выбирается заново при каждом открытии — старое фото не подойдёт.
  const [gesture, setGesture] = useState(() => GESTURES[Math.floor(Math.random() * GESTURES.length)])
  useEffect(() => { if (open) setGesture(GESTURES[Math.floor(Math.random() * GESTURES.length)]) }, [open])
  const close = () => { setPhoto(null); setSent(false); setError(''); onClose() }

  const send = async () => {
    if (!photo) return
    if (!state.cloud) { onDone(); setSent(true); return }
    setBusy(true); setError('')
    try {
      await submitVerification(state.cloud.userId, photo, `${gesture.glyph} ${gesture.text}`)
      dispatch({ type: 'verificationSent' })
      setSent(true)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Верификация">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted">{state.cloud
            ? 'Селфи отправлено модератору. Синяя галочка появится в профиле, как только его проверят. Фото удаляется сразу после проверки.'
            : 'Селфи отправлено модератору. В демо проверка проходит сразу: синяя галочка уже в профиле.'}</p>
          <Button onClick={close}>Отлично</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {state.cloud && state.verification === 'rejected' && <p className="text-[13px] text-danger">Прошлое селфи не подошло: лицо должно быть хорошо видно, а жест — совпадать с заданием.</p>}
          <div className="rounded-2xl bg-surface-2 p-5 text-center">
            <div className="font-display font-bold text-5xl text-cobalt" aria-hidden="true">{gesture.glyph}</div>
            <p className="mt-2 font-semibold">Сфотографируйтесь: {gesture.text}</p>
            <p className="text-[13px] text-muted">Жест меняется каждый раз, поэтому старое фото не подойдёт.</p>
          </div>
          <label htmlFor="selfie" className="relative flex items-center justify-center gap-2 h-12 rounded-full border-2 border-dashed border-line cursor-pointer hover:border-cobalt font-semibold overflow-hidden">
            {photo ? <><img src={photo} alt="" className="w-8 h-8 rounded-full object-cover" /> Селфи выбрано — заменить</> : <><Icon name="camera" size={18} /> Загрузить селфи</>}
          </label>
          <input id="selfie" type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { setPhoto(await readPhoto(f)); setError('') } catch { setError('Не получилось открыть фото. Выберите JPG или PNG.') }
          }} />
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          <Button disabled={!photo || busy} onClick={send}>{busy ? 'Отправляем…' : 'Отправить на проверку'}</Button>
          <p className="text-[12px] text-muted">Фото видит только модератор и удаляет после проверки. Биометрические данные мы не храним.</p>
        </div>
      )}
    </Sheet>
  )
}

/** Заблокированные, правила, удаление аккаунта. */
function SafetySection({ onSignOut }: { onSignOut: () => void }) {
  const { state, dispatch } = useStore()
  const [rules, setRules] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const blocked = state.blocked ?? []

  const remove = async () => {
    setBusy(true); setError('')
    try {
      await deleteAccount()
      dispatch({ type: 'signOut' })
      dispatch({ type: 'forgetSaved' }) // после выхода: иначе экран входа предложит удалённый аккаунт
      try { localStorage.removeItem('iskra-last-login') } catch { /* ignore */ }
      onSignOut()
    } catch (e) {
      setError(humanError(e)); setBusy(false)
    }
  }

  return (
    <section className="rounded-[28px] bg-surface shadow-soft px-5 py-2 flex flex-col divide-y divide-line">
      <h2 className="font-display font-bold text-lg py-3">Безопасность</h2>
      <div className="py-3 flex flex-col gap-2">
        <span className="text-[14px] font-semibold">Заблокированные</span>
        {blocked.length ? blocked.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3">
            <span className="truncate">{b.name}</span>
            <button onClick={() => dispatch({ type: 'unblock', personId: b.id })} className="shrink-0 h-8 px-3 rounded-full bg-surface-2 text-[13px] font-semibold cursor-pointer">Разблокировать</button>
          </div>
        )) : <p className="text-[13px] text-muted">Никого. Заблокировать можно в профиле человека или в чате — меню «…».</p>}
      </div>
      <button onClick={() => setRules(true)} className="py-3 flex items-center justify-between text-left cursor-pointer">
        <span className="text-[14px] font-semibold">Правила и конфиденциальность</span><Icon name="arrow" size={16} />
      </button>
      {state.cloud && (
        <button onClick={() => setConfirm(true)} className="py-3 text-left text-[14px] font-semibold text-danger cursor-pointer">Удалить аккаунт</button>
      )}
      <RulesSheet open={rules} onClose={() => setRules(false)} />
      <Sheet open={confirm} onClose={() => !busy && setConfirm(false)} title="Удалить аккаунт?">
        <div className="flex flex-col gap-3">
          <p className="text-muted">Профиль, планы и вся переписка удалятся сразу и навсегда. Восстановить их будет нельзя.</p>
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          <Button variant="danger" onClick={remove} disabled={busy}>{busy ? 'Удаляем…' : 'Удалить навсегда'}</Button>
          <Button variant="secondary" onClick={() => setConfirm(false)} disabled={busy}>Отмена</Button>
        </div>
      </Sheet>
    </section>
  )
}
