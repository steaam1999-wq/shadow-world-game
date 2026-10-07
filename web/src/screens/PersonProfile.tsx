import { useState } from 'react'
import { formatKm, placeLine } from '../places'
import { useStore } from '../store'
import { MetTogether } from '../components/Met'
import { compatibility, level, planWhen, plural, sharedAnswers, nameAge, profileTint } from '../lib'
import { Avatar, Button, Icon, StoryRing } from '../components/ui'
import { GoldFrame, profileUrl, shareLink } from '../components/Invite'
import { PostArt } from '../components/PostArt'
import { TrackChip } from '../music/PlayerUI'
import { personTrack } from '../music/player'
import { PersonSongs, songsOf } from '../music/PersonSongs'
import { tasteLine, useTaste } from '../music/taste'
import { NowPlayingCard, nowPlayingOf } from '../music/NowPlaying'
import { Post } from './Feed'
import { ReportSheet } from './Vibe'
import { ProfilePublications } from './Shorts'
import { FollowersSheet } from '../components/Followers'
import { ReliabilityBadge } from '../components/Meet'
import type { Activity, Person } from '../types'

// Демо-счётчики подписчиков: стабильные для человека, плюс ваша подписка.
function followerBase(p: Person) {
  return 180 + p.meetings * 41 + (p.hue % 97)
}

export function PersonProfile({ personId, now, onBack, onRespond, onOpenCapsule, onOpenChat }: {
  personId: string
  now: number
  onBack: () => void
  onRespond: (a: Activity, text?: string) => void
  onOpenCapsule: (activityId: string) => void
  onOpenChat: (capsuleId: string) => void
}) {
  const { state, dispatch } = useStore()
  const p = state.people.find((x) => x.id === personId)
  const [open, setOpen] = useState<Activity | null>(null)
  const [reporting, setReporting] = useState<Person | null>(null)
  const [tab, setTab] = useState<'plans' | 'posts' | 'songs'>('posts')
  const [showFollowers, setShowFollowers] = useState(false)
  const tasteOf = useTaste() // до раннего выхода: хуки вызываются всегда в одном порядке
  const [copied, setCopied] = useState(false)
  if (!p) return null
  const me = state.me!
  const following = (state.following ?? []).includes(p.id)
  const plans = state.activities.filter((a) => a.authorId === p.id && a.expiresAt > now).sort((a, b) => a.startsAt - b.startsAt)
  const compat = compatibility(me, p)
  const shared = sharedAnswers(me.answers, p.answers)
  const lv = level(p.meetings)
  const followers = state.cloud ? state.followers?.[p.id] ?? 0 : followerBase(p) + (following ? 1 : 0)
  const capsule = state.capsules.find((c) => c.personId === p.id)
  const songCount = songsOf(p, !!state.cloud).length
  const listening = nowPlayingOf(p, !!state.cloud)
  const taste = tasteOf(p)

  const message = () => {
    if (capsule) { onOpenChat(capsule.id); return }
    const id = crypto.randomUUID()
    dispatch({ type: 'directMessage', personId: p.id, capsuleId: id })
    onOpenChat(id)
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center gap-2 px-2 pt-1">
        <button onClick={onBack} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад"><Icon name="back" /></button>
        <h1 className="flex-1 font-display font-semibold text-lg truncate">{p.name}</h1>
        <button onClick={() => void shareLink(profileUrl(p.id, state.cloud?.userId), `${p.name} в Komeeta — посмотри страницу`).then((r) => { if (r === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 1800) } })}
          className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Поделиться страницей"><Icon name="share" size={21} /></button>
        <button onClick={() => setReporting(p)} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Пожаловаться"><Icon name="more" size={22} /></button>
        {copied && <span className="fixed left-1/2 -translate-x-1/2 top-[calc(64px+env(safe-area-inset-top,0px))] z-[95] rounded-full bg-fg text-bg px-4 h-10 inline-flex items-center text-[14px] font-medium shadow-soft" role="status">Ссылка на страницу скопирована</span>}
      </div>

      <section className="flex flex-col gap-3 px-4 pt-3 pb-1 -mt-3 rounded-b-[28px]" style={profileTint(p.hue)}>
        {/* Как в Threads: имя слева, фото справа */}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="flex items-center gap-1.5 font-display font-bold text-[24px] leading-tight">
              <span className="truncate">{nameAge(p.name, p.age)}</span>
              {p.verified && <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={12} /></span>}
            </h2>
            <div className="text-[14px] text-muted truncate">{placeLine(lv.name, p.district, formatKm(p.distanceKm))}</div>
          </div>
          {p.founder && (!plans.length || state.seenStories.includes(p.id))
            // Основатель без новых историй: только золотая рамка, без второго серого кольца.
            ? <GoldFrame on medal={30} info label={`Основатель Komeeta №${p.founder}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={74} /></GoldFrame>
            : <StoryRing seen={!plans.length || state.seenStories.includes(p.id)} size={84}>
              <GoldFrame on={!!p.founder} medal={26} info label={`Основатель Komeeta №${p.founder}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={p.founder ? 62 : 72} /></GoldFrame>
            </StoryRing>}
        </div>

        <div className="text-[14px] leading-snug flex flex-col gap-1">
          <ReliabilityBadge person={p} />
          <TrackChip track={personTrack(p)} />
          {listening && <div className="mt-0.5"><NowPlayingCard np={listening} who="Слушает сейчас" /></div>}
          {p.bio && <p>{p.bio}</p>}
          <p className="text-cobalt">{p.tags.map((t) => `#${t.toLowerCase()}`).join(' ')}</p>
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[14px] text-muted">
          <button onClick={() => setShowFollowers(true)} className="cursor-pointer hover:text-fg" aria-label="Показать подписчиков и подписки">
            <b className="text-fg tnum">{followers.toLocaleString('ru-RU')}</b> {plural(followers, 'подписчик', 'подписчика', 'подписчиков')}
          </button>
          <span aria-hidden="true">·</span>
          <span><b className="text-fg tnum">{plans.length}</b> {plural(plans.length, 'план', 'плана', 'планов')}</span>
          <span aria-hidden="true">·</span>
          <span><b className="text-fg tnum">{p.meetings}</b> {plural(p.meetings, 'встреча', 'встречи', 'встреч')}</span>
        </p>

        <div className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[13px] flex items-center gap-3">
          <span className="font-display font-semibold text-xl text-brand tnum">{compat.score}%</span>
          <span className="text-muted">{shared.length ? `Совпало: ${shared.join(', ')}` : 'В тесте пока не совпали — тем интереснее'}</span>
        </div>
        <MetTogether personId={p.id} />
        {taste.score > 0 && (
          <button onClick={() => setTab('songs')} className="rounded-2xl bg-spark-soft px-3.5 py-2.5 text-[13px] flex items-center gap-3 text-left cursor-pointer">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-spark text-on-spark shrink-0"><Icon name="note" size={16} /></span>
            <span className="min-w-0"><b className="block text-fg">Совпадение по музыке</b><span className="text-muted">{tasteLine(taste)}</span></span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant={following ? "secondary" : "primary"} className="h-10 text-[14px] whitespace-nowrap" onClick={() => dispatch({ type: 'toggleFollow', personId: p.id })} aria-pressed={following}>
            {following ? <><Icon name="check" size={16} /> Вы подписаны</> : 'Подписаться'}
          </Button>
          <Button variant="secondary" className="h-10 text-[14px] whitespace-nowrap" onClick={message}>
            <Icon name="chat" size={16} /> Написать
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-3 border-t border-line mt-1" role="tablist">
        {([['posts', 'camera', 'Фото и видео'], ['plans', 'grid', 'Планы'], ['songs', 'note', 'Песни']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`h-11 grid place-items-center -mt-px text-[13px] font-semibold cursor-pointer ${tab === id ? 'border-t border-fg' : 'text-muted'}`}>
            <span className="inline-flex items-center gap-1.5"><Icon name={icon} size={18} /> {label}{id === 'songs' && songCount ? ` · ${songCount}` : ''}</span>
          </button>
        ))}
      </div>
      {tab === 'posts' ? <ProfilePublications authorId={p.id} onMessage={message} /> : tab === 'songs' ? <PersonSongs person={p} /> : plans.length ? (
        <div className="grid grid-cols-3 gap-1 px-1">
          {plans.map((a) => (
            <button key={a.id} onClick={() => setOpen(a)} className="relative aspect-[3/4] max-w-full overflow-hidden rounded-lg cursor-pointer" aria-label={a.title}>
              <PostArt activity={a} />
              <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-left text-white">
                <span className="block text-[10px] opacity-85">{planWhen(a, now)}</span>
                <span className="block text-[11px] font-semibold leading-tight line-clamp-2">{a.title}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-muted text-[14px]">Сейчас активных планов нет</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="План">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default" aria-label="Закрыть" onClick={() => setOpen(null)} />
          <div className="anim-rise relative w-full max-w-[480px] max-h-[92%] overflow-y-auto bg-surface rounded-t-[28px] sm:rounded-[28px] pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
            <Post activity={open} person={p} now={now} onRespond={(a, t) => { setOpen(null); onRespond(a, t) }} onOpenCapsule={(id) => { setOpen(null); onOpenCapsule(id) }} />
          </div>
        </div>
      )}
      <ReportSheet person={reporting} onClose={() => setReporting(null)} onBlocked={onBack} />
      <FollowersSheet personId={p.id} open={showFollowers} onClose={() => setShowFollowers(false)} />
    </div>
  )
}
