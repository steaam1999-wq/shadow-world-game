import { useState } from 'react'
import { formatKm } from '../places'
import { useStore } from '../store'
import { compatibility, planWhen, plural, sharedAnswers } from '../lib'
import { Avatar, Button, Icon, StoryRing } from '../components/ui'
import { PostArt } from '../components/PostArt'
import { PersonSongs, songsOf } from '../music/PersonSongs'
import { NowPlayingCard, nowPlayingOf } from '../music/NowPlaying'
import { Post } from './Feed'
import { ReportSheet } from './Vibe'
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
  const [tab, setTab] = useState<'plans' | 'songs'>('plans')
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
        <button onClick={() => setReporting(p)} className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Пожаловаться"><Icon name="more" size={22} /></button>
      </div>

      <section className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-6">
          <StoryRing seen={!plans.length || state.seenStories.includes(p.id)} size={92}>
            <Avatar name={p.name} hue={p.hue} src={p.photo} size={80} />
          </StoryRing>
          <dl className="flex-1 grid grid-cols-3 text-center">
            {[[plans.length, plural(plans.length, 'план', 'плана', 'планов')], [followers, plural(followers, 'подписчик', 'подписчика', 'подписчиков')], [p.meetings, plural(p.meetings, 'встреча', 'встречи', 'встреч')]].map(([v, l]) => (
              <div key={String(l)}><dt className="font-bold text-lg tnum leading-tight">{typeof v === 'number' ? v.toLocaleString('ru-RU') : v}</dt><dd className="text-[12px] text-muted">{l}</dd></div>
            ))}
          </dl>
        </div>

        <div className="text-[14px] leading-snug flex flex-col gap-0.5">
          <div className="flex items-center gap-1 font-semibold">
            {p.name}, {p.age}
            {p.verified && <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-cobalt text-white"><Icon name="check" size={9} /></span>}
          </div>
          <div className="text-muted">{p.district} · {formatKm(p.distanceKm)}</div>
          <ReliabilityBadge person={p} />
          {listening && <div className="mt-1.5"><NowPlayingCard np={listening} who="Слушает сейчас" /></div>}
          <p className="mt-1">{p.bio}</p>
          <p className="text-cobalt">{p.tags.map((t) => `#${t.toLowerCase()}`).join(' ')}</p>
        </div>

        <div className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[13px] flex items-center gap-3">
          <span className="font-display font-semibold text-xl text-brand tnum">{compat.score}%</span>
          <span className="text-muted">{shared.length ? `Совпало: ${shared.join(', ')}` : 'В тесте пока не совпали — тем интереснее'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant={following ? "secondary" : "primary"} className="h-10 text-[14px] whitespace-nowrap" onClick={() => dispatch({ type: 'toggleFollow', personId: p.id })} aria-pressed={following}>
            {following ? <><Icon name="check" size={16} /> Вы подписаны</> : 'Подписаться'}
          </Button>
          <Button variant="secondary" className="h-10 text-[14px] whitespace-nowrap" onClick={message}>
            <Icon name="chat" size={16} /> Написать
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 border-t border-line mt-1" role="tablist">
        {([['plans', 'grid', 'Планы'], ['songs', 'note', 'Песни']] as const).map(([id, icon, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`h-11 grid place-items-center -mt-px text-[13px] font-semibold cursor-pointer ${tab === id ? 'border-t border-fg' : 'text-muted'}`}>
            <span className="inline-flex items-center gap-1.5"><Icon name={icon} size={18} /> {label}{id === 'songs' && songCount ? ` · ${songCount}` : ''}</span>
          </button>
        ))}
      </div>
      {tab === 'songs' ? <PersonSongs person={p} /> : plans.length ? (
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
    </div>
  )
}
