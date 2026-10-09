import { useEffect, useState } from 'react'
import { PlaceSelect } from '../components/PlaceSelect'
import { VIBE_QUESTIONS } from '../data'
import { useNow, useStore } from '../store'
import { getLang, setLang } from '../i18n'
import { ReliabilityBadge } from '../components/Meet'
import { MeetingCards } from '../components/Met'
import { LEVELS, level, plural, profileCompleteness, nameAge } from '../lib'
import { Avatar, Button, Chip, Field, Icon, Sheet, ThemeToggle, Toggle, inputCls } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { PostsViewer } from '../components/PostsViewer'
import { MyPlans } from '../components/MyPlans'
import type { Activity } from '../types'
import { RulesSheet } from '../components/Rules'
import { ProfileEditor } from '../components/ProfileEditor'
import { AvatarRing, ProfileCover, Stats, StatusLine, TagChips, accentOf, statusOf } from '../components/ProfileLook'
import { StyleEditor } from '../components/StyleEditor'
import { FollowersSheet } from '../components/Followers'
import { AlertSettings } from '../components/Alerts'
import { BugReportSheet } from '../components/BugReport'
import { PlayingChip } from '../music/NowPlaying'
import { ProfilePublications, SavedPublications } from './Shorts'
import { useOpenProfile } from '../nav'
import { currentUser, deleteAccount, humanError, linkEmail } from '../cloud/api'
import { VerifyCard, openVerify } from '../components/Verify'
import { FounderBadge, GoldFrame, InviteCard, inviteUrl, profileUrl, shareLink } from '../components/Invite'

export function Profile({ onSignOut, onAdmin, onRespond, onOpenCapsule, onCreatePlan }: {
  onCreatePlan?: () => void
  onSignOut: () => void
  onAdmin: () => void
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
}) {
  const { state, dispatch } = useStore()
  const openProfile = useOpenProfile()
  const me = state.me!
  const [editVibe, setEditVibe] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [styling, setStyling] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [tab, setTab] = useState<'plans' | 'posts' | 'saved' | 'settings'>('plans')
  const [copied, setCopied] = useState(false)
  const myPlans = state.activities.filter((a) => a.authorId === 'me')
  const now = useNow()
  // Ссылка на мою страницу: друг откроет её сразу после входа, а новичок засчитается как приглашённый.
  const share = async () => {
    const id = state.cloud?.userId
    const r = await shareLink(id ? profileUrl(id, id) : inviteUrl(null), `${me.name} в Komeeta — заглядывай на мою страницу 🙂`)
    if (r !== 'copied') return
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  const lv = level(me.meetings)
  const complete = profileCompleteness(me)
  const patch = (p: Partial<typeof me>) => dispatch({ type: 'updateMe', patch: p })

  const badges = [
    { id: 'first', name: 'Первая встреча', desc: 'Первая состоявшаяся встреча', got: me.meetings >= 1 },
    { id: 'verified', name: 'Проверенный', desc: 'Прошёл верификацию', got: me.verified },
    { id: 'full', name: 'Открытая книга', desc: 'Профиль заполнен на 100%', got: complete === 100 },
    { id: 'host', name: 'Организатор', desc: 'Предложил свою активность', got: state.activities.some((a) => a.authorId === 'me') },
    { id: 'fast', name: 'Без лишних слов', desc: 'Договорился быстрее 24 часов', got: state.capsules.some((c) => c.status !== 'active') },
  ]

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Шапка «визитка»: обложка, аватарка по центру, имя, статус и счётчики */}
      <section className="relative overflow-hidden flex flex-col gap-3 px-4 pt-5 pb-1 rounded-b-[28px]">
        <ProfileCover style={me.style} photo={me.photo} hue={me.hue} />
        <div className="relative flex flex-col items-center text-center gap-1">
          <button onClick={() => setEditing(true)} className="relative cursor-pointer shrink-0" title="Редактировать профиль и фото" aria-label="Редактировать профиль и фото">
            {me.founder
              ? <GoldFrame on medal={30} info label={`Основатель Komeeta №${me.founder}`}><Avatar name={me.name} hue={me.hue} src={me.photo} size={92} /></GoldFrame>
              : <AvatarRing style={me.style}><Avatar name={me.name} hue={me.hue} src={me.photo} size={104} /></AvatarRing>}
            {!me.founder && <span className="absolute z-[3] right-0.5 bottom-0.5 grid place-items-center w-8 h-8 rounded-full bg-surface text-fg border-2 border-bg shadow-soft"><Icon name="camera" size={15} /></span>}
          </button>
          <h2 className="mt-2.5 flex items-center justify-center gap-1.5 max-w-full font-display font-bold text-[25px] leading-tight">
            <span className="truncate">{nameAge(me.name, me.age)}</span>
            {me.verified && <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={12} /></span>}
          </h2>
          <StatusLine text={statusOf(me.style, now)} style={me.style} />
          {me.founder && <div className="mt-1.5"><FounderBadge n={me.founder} /></div>}
        </div>
        <div className="relative text-[14px] leading-snug flex flex-col items-center text-center gap-2">
          <PlayingChip />
          {me.meetings + (me.noShows ?? 0) > 0 && <ReliabilityBadge person={{ id: 'me', meetings: me.meetings, noShows: me.noShows ?? 0 }} />}
          {me.bio ? <p className="whitespace-pre-wrap">{me.bio}</p> : <p className="text-muted">Расскажите о себе в пару строк</p>}
          <TagChips tags={me.tags} />
        </div>
        <div className="relative pt-1">
          <Stats items={[
            state.cloud ? { n: state.followers?.me ?? 0, label: plural(state.followers?.me ?? 0, 'подписчик', 'подписчика', 'подписчиков'), onClick: () => setShowFollowers(true) } : { n: lv.idx, label: 'уровень' },
            { n: myPlans.length, label: plural(myPlans.length, 'план', 'плана', 'планов') },
            { n: me.meetings, label: plural(me.meetings, 'встреча', 'встречи', 'встреч') },
          ]} />
        </div>
        <div className="relative grid grid-cols-3 gap-2">
          <button onClick={() => setEditing(true)} className="h-10 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer hover:brightness-95" aria-label="Редактировать профиль">Профиль</button>
          <button onClick={() => setStyling(true)} className="h-10 rounded-xl font-semibold text-[13.5px] px-1 truncate cursor-pointer hover:brightness-95" style={{ background: accentOf(me.style).color, color: accentOf(me.style).ink }}>Оформление</button>
          <button onClick={share} className="h-10 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer hover:brightness-95">{copied ? 'Скопировано' : 'Поделиться'}</button>
        </div>
        {complete < 100 && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <div className="flex-1">
              <div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold">Профиль заполнен</span><span className="font-mono tnum">{complete}%</span></div>
              <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-ok" style={{ width: `${complete}%` }} /></div>
            </div>
            {!me.verified && (state.cloud && state.verification === 'pending'
              ? <span className="shrink-0 h-8 px-3 rounded-full bg-cobalt-soft text-cobalt text-[13px] font-semibold grid place-items-center">На проверке</span>
              : <button onClick={openVerify} className="shrink-0 h-8 px-3 rounded-full bg-cobalt text-white text-[13px] font-semibold cursor-pointer">{state.cloud && state.verification === 'rejected' ? 'Ещё раз' : 'Верификация'}</button>)}
          </div>
        )}
        <VerifyCard />
        <InviteCard />
        <MeetingCards />
        {/* Достижения: полученные — яркие, остальные — подсказкой, как их получить */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4" aria-label="Достижения">
          {[...badges].sort((x, y) => Number(y.got) - Number(x.got)).map((b) => (
            <span key={b.id} title={b.desc} className={`shrink-0 inline-flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full text-[12px] font-semibold ${b.got ? 'bg-surface shadow-soft' : 'bg-surface-2 text-muted'}`}>
              <span className={`grid place-items-center w-6 h-6 rounded-full ${b.got ? 'bg-brand text-white' : 'bg-line text-muted'}`}><Icon name={b.got ? 'spark' : 'clock'} size={12} fill={b.got} /></span>
              {b.name}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-4 border-t border-line" role="tablist">
        {([['plans', 'grid', 'Мои планы'], ['posts', 'camera', 'Фото и видео'], ['saved', 'bookmark', 'Сохранённое'], ['settings', 'settings', 'Настройки']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)}
            className={`h-14 flex flex-col items-center justify-center gap-1 border-t-2 -mt-px cursor-pointer ${tab === id ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>
            <Icon name={icon} size={20} />
            <span className={`text-[11px] leading-none ${tab === id ? 'font-semibold' : ''}`}>{id === 'posts' ? 'Посты' : id === 'plans' ? 'Планы' : id === 'saved' ? 'Сохранено' : 'Настройки'}</span>
          </button>
        ))}
      </div>

      {tab === 'posts' && <ProfilePublications authorId="me" onMessage={() => {}} />}

      {tab === 'plans' && <MyPlans plans={myPlans} now={now} onOpen={setViewing} onOpenChat={onOpenCapsule} onCreate={onCreatePlan} />}

      {tab === 'saved' && (() => {
        const list = state.activities.filter((a) => state.saved.includes(a.id))
        const posts = (state.savedShorts ?? []).length
        return list.length || posts ? (
          <div className="flex flex-col gap-3">
          {posts > 0 && <SavedPublications onMessage={openProfile} />}
          {list.length > 0 && <div className="grid grid-cols-3 gap-1 px-1">
            {list.map((a) => (
              <button key={a.id} onClick={() => setViewing(a.id)} className="relative aspect-[3/4] max-w-full overflow-hidden rounded-lg cursor-pointer group" aria-label={`Открыть: ${a.title}`}>
                <PostArt activity={a} />
                <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-left text-white text-[11px] font-semibold leading-tight line-clamp-2">{a.title}</span>
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </button>
            ))}
          </div>}
          </div>
        ) : (
          <div className="py-12 px-6 text-center flex flex-col items-center gap-2">
            <span className="grid place-items-center w-16 h-16 rounded-full border-2 border-fg"><Icon name="bookmark" size={28} /></span>
            <p className="font-display font-bold text-lg">Ничего не сохранено</p>
            <p className="text-[13px] text-muted">Нажмите на закладку под постом, фото или видео, чтобы вернуться к нему позже.</p>
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
          <h2 className="font-display font-bold text-lg">Мой вайб <span className="text-[13px] font-normal text-muted">(необязательно)</span></h2>
          <Button variant="secondary" className="h-9 px-4 text-[14px]" onClick={() => setEditVibe(true)}>{Object.keys(me.answers).length ? 'Изменить' : 'Пройти'}</Button>
        </div>
        {!Object.keys(me.answers).length && <p className="text-[13.5px] text-muted -mt-2">Не указан. Можно не проходить — но с ним точнее подбираются люди и «% вайба».</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {VIBE_QUESTIONS.filter((q) => me.answers[q.id]).map((q) => {
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
            <PlaceSelect id="me-district" value={me.district} onChange={(v) => patch({ district: v })} label="Мой город или район" />
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

      <button onClick={() => setBugOpen(true)} className="rounded-[28px] bg-surface shadow-soft p-4 flex items-center gap-3 text-left cursor-pointer">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand text-white shrink-0"><Icon name="flag" size={20} /></span>
        <span className="flex-1 min-w-0"><span className="block font-semibold">Сообщить об ошибке</span><span className="block text-[13px] text-muted">Что-то сломалось или неудобно? Напишите — исправим</span></span>
        <Icon name="arrow" size={18} className="text-muted" />
      </button>
      <BugReportSheet open={bugOpen} onClose={() => setBugOpen(false)} />

      <div className="flex flex-col gap-2">
        {(!state.cloud || state.isAdmin) && <Button variant="ghost" onClick={onAdmin} className="border border-line"><Icon name="settings" size={18} /> Админ-панель{state.cloud ? '' : ' (демо)'}</Button>}
        {!state.cloud && <Button variant="ghost" onClick={() => { dispatch({ type: 'reset' }); onSignOut() }} className="text-muted">Сбросить демо-данные</Button>}
        <Button variant="danger" onClick={() => { dispatch({ type: 'signOut' }); onSignOut() }}><Icon name="logout" size={18} /> Выйти</Button>
      </div>
      </div>}

      <ProfileEditor open={editing} onClose={() => setEditing(false)} />
      <StyleEditor open={styling} onClose={() => setStyling(false)} />
      <FollowersSheet personId="me" open={showFollowers} onClose={() => setShowFollowers(false)} />

      <Sheet open={editVibe} onClose={() => setEditVibe(false)} title="Вайб-тест">
        <div className="flex flex-col gap-5">
          <p className="text-[13px] text-muted -mt-2">Всё по желанию: отвечайте на что хочется. Нажмите на выбранный ответ ещё раз, чтобы убрать его.</p>
          {VIBE_QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col gap-2">
              <span className="font-semibold">{q.title}</span>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <Chip key={o.id} active={me.answers[q.id] === o.id} onClick={() => {
                    const next = { ...me.answers }
                    if (next[q.id] === o.id) delete next[q.id]; else next[q.id] = o.id
                    patch({ answers: next })
                  }}>{o.label}</Chip>
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => { patch({ answers: {} }); setEditVibe(false) }} disabled={!Object.keys(me.answers).length}>Не указывать</Button>
            <Button onClick={() => setEditVibe(false)}>Сохранить</Button>
          </div>
        </div>
      </Sheet>

      {viewing && (() => {
        const list = tab === 'saved' ? state.activities.filter((x) => state.saved.includes(x.id)) : myPlans
        return <PostsViewer title={tab === 'saved' ? 'Сохранённое' : 'Мои планы'} items={list} startId={viewing}
          onClose={() => setViewing(null)} onRespond={onRespond} onOpenCapsule={onOpenCapsule} />
      })()}
    </div>
  )
}

/** Аккаунт по нику: привязать почту, чтобы восстановить пароль, если забудете. */
function RecoveryEmail() {
  const [auth, setAuth] = useState<{ email: string; nick: string | null; pending: string | null } | null>(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    void currentUser().then((u) => u && setAuth({ email: u.email ?? '', nick: (u.user_metadata?.nick as string | undefined) ?? null, pending: u.new_email ?? null }))
  }, [])
  if (!auth?.nick) return null // вход по почте или соцсети — почта и так есть
  const linked = !auth.email.endsWith('@users.komeeta.com')
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = value.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setMsg({ ok: false, text: 'Похоже, это не почта — проверьте адрес' })
    setBusy(true); setMsg(null)
    try { await linkEmail(email); setAuth({ ...auth, pending: email }); setValue(''); setMsg({ ok: true, text: `Отправили письмо на ${email}. Нажмите в нём ссылку — и почта привяжется.` }) }
    catch (err) { setMsg({ ok: false, text: humanError(err) }) }
    finally { setBusy(false) }
  }
  return (
    <div className="py-3 flex flex-col gap-2">
      <span className="text-[14px] font-semibold">Почта для восстановления</span>
      {linked ? (
        <p className="text-[13px] text-muted">Привязана: <b className="text-fg">{auth.email}</b>. Если забудете пароль — нажмите «Забыли пароль?» на входе и укажите ник.</p>
      ) : (
        <>
          <p className="text-[13px] text-muted">{auth.pending ? `Ждём подтверждения: ${auth.pending}. Проверьте почту и «Спам».` : 'Сейчас вы входите только по нику. Привяжите почту — тогда забытый пароль можно будет восстановить.'}</p>
          <form onSubmit={(e) => void save(e)} className="flex gap-2">
            <label htmlFor="rec-email" className="sr-only">Почта</label>
            <input id="rec-email" type="email" inputMode="email" autoComplete="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@mail.ru" className={`${inputCls} h-11 flex-1 min-w-0`} />
            <Button type="submit" disabled={busy || !value.trim()} className="h-11 shrink-0">{busy ? '…' : 'Привязать'}</Button>
          </form>
        </>
      )}
      {msg && <p className={`text-[13px] ${msg.ok ? 'text-ok' : 'text-danger'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
    </div>
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
      {state.cloud && <RecoveryEmail />}
      {state.me && (
        <div className="py-1">
          <Toggle id="sf-verified" checked={!!state.me.onlyVerified} onChange={(v) => dispatch({ type: 'updateMe', patch: { onlyVerified: v } })}
            label="Писать мне могут только проверенные" hint="Первое сообщение — только от людей с синей галочкой. Тем, с кем вы уже общаетесь, это не мешает." />
          <Toggle id="sf-calls" checked={!state.me.callsOff} onChange={(v) => dispatch({ type: 'updateMe', patch: { callsOff: !v } })}
            label="Принимать звонки" hint="Позвонить могут только те, с кем вы уже переписывались в обе стороны." />
        </div>
      )}
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
