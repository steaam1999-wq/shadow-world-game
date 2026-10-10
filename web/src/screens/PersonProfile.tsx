import { useState } from 'react'
import { useStore } from '../store'
import { MetTogether } from '../components/Met'
import { compatibility, planWhen, plural, sharedAnswers, nameAge } from '../lib'
import { Avatar, Icon, StoryRing } from '../components/ui'
import { AmbassadorBadge, AvatarRing, ProfileCover, Stats, StatusLine, TagChips, accentOf, statusOf } from '../components/ProfileLook'
import { usePresence } from '../cloud/presence'
import { AchievementsPanel } from '../components/Achievements'
import { FounderBadge, GoldFrame, profileUrl, shareLink } from '../components/Invite'
import { PostArt } from '../components/PostArt'
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
  const presence = usePresence(state.cloud ? personId : undefined)
  if (!p) return null
  const me = state.me!
  const following = (state.following ?? []).includes(p.id)
  const plans = state.activities.filter((a) => a.authorId === p.id && a.expiresAt > now).sort((a, b) => a.startsAt - b.startsAt)
  const compat = compatibility(me, p)
  const shared = sharedAnswers(me.answers, p.answers)
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

      <section className="relative overflow-hidden flex flex-col gap-3 px-4 pt-4 pb-1 -mt-3 rounded-b-[28px]">
        <ProfileCover style={p.style} photo={p.photo} hue={p.hue} />
        {/* Визитка: аватарка по центру, имя, статус и город */}
        <div className="relative flex flex-col items-center text-center gap-1">
          {p.founder && (!plans.length || state.seenStories.includes(p.id))
            // Основатель без новых историй: только золотая рамка, без второго серого кольца.
            ? <GoldFrame on medal={30} info label={`Основатель Komeeta №${p.founder}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={92} /></GoldFrame>
            : plans.length && !state.seenStories.includes(p.id)
              ? <StoryRing seen={false} size={112}>
                <GoldFrame on={!!p.founder} medal={26} info label={`Основатель Komeeta №${p.founder}`}><Avatar name={p.name} hue={p.hue} src={p.photo} size={p.founder ? 92 : 102} /></GoldFrame>
              </StoryRing>
              : <AvatarRing style={p.style}><Avatar name={p.name} hue={p.hue} src={p.photo} size={104} /></AvatarRing>}
          <h2 className="mt-2.5 flex items-center justify-center gap-1.5 max-w-full font-display font-bold text-[25px] leading-tight">
            <span className="truncate">{nameAge(p.name, p.age)}</span>
            {p.verified && <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={12} /></span>}
          </h2>
          <StatusLine text={statusOf(p.style, now)} style={p.style} online={presence.online} />
          {p.ambassador !== undefined && <div className="mt-1"><AmbassadorBadge city={p.ambassador} /></div>}
          {p.founder && <div className="mt-1.5"><FounderBadge n={p.founder} /></div>}
        </div>

        <div className="relative text-[14px] leading-snug flex flex-col items-center text-center gap-2">
          {p.meetings + (p.noShows ?? 0) > 0 && <ReliabilityBadge person={p} />}
          {listening && <div className="mt-0.5 self-stretch text-left"><NowPlayingCard np={listening} who="Слушает сейчас" /></div>}
          {p.bio && <p>{p.bio}</p>}
          <TagChips tags={p.tags} />
        </div>
        <div className="relative pt-1">
          <Stats items={[
            { n: followers.toLocaleString('ru-RU'), label: plural(followers, 'подписчик', 'подписчика', 'подписчиков'), onClick: () => setShowFollowers(true) },
            { n: plans.length, label: plural(plans.length, 'план', 'плана', 'планов') },
            { n: p.meetings, label: plural(p.meetings, 'встреча', 'встречи', 'встреч') },
          ]} />
        </div>
        <div className="relative"><AchievementsPanel personId={p.id} /></div>
        <div className="relative grid grid-cols-2 gap-2">
          <button onClick={message} className="h-10 rounded-xl inline-flex items-center justify-center gap-1.5 font-semibold text-[14px] cursor-pointer hover:brightness-105" style={{ background: accentOf(p.style).color, color: accentOf(p.style).ink }}>
            <Icon name="chat" size={16} /> Написать
          </button>
          <button onClick={() => dispatch({ type: 'toggleFollow', personId: p.id })} aria-pressed={following} className="h-10 rounded-xl inline-flex items-center justify-center gap-1.5 bg-surface-2 font-semibold text-[14px] whitespace-nowrap cursor-pointer hover:brightness-95">
            {following ? <><Icon name="check" size={16} /> Вы подписаны</> : 'Подписаться'}
          </button>
        </div>

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
