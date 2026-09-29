import { useStore } from '../store'
import { compatibility, planWhen, relative } from '../lib'
import type { Activity, Person } from '../types'
import { Avatar, Button, Icon, Pill } from './ui'

export function ActivityCard({ activity, person, now, onRespond, onOpenCapsule, compact = false }: {
  activity: Activity
  person: Person | null // null — моя активность
  now: number
  onRespond: (a: Activity) => void
  onOpenCapsule: (activityId: string) => void
  compact?: boolean
}) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const responded = state.liked.includes(activity.id)
  const started = activity.startsAt <= now
  const compat = person ? compatibility(me, person) : null

  return (
    <article className="rounded-[28px] bg-surface shadow-soft p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {person ? <Avatar name={person.name} hue={person.hue} size={44} verified={person.verified} /> : <Avatar name={me.name} hue={me.hue} size={44} verified={me.verified} />}
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{person ? `${person.name}, ${person.age}` : 'Ваша активность'}</div>
          <div className="text-[12px] text-muted flex items-center gap-1">
            <Icon name="pin" size={12} /> {activity.area}{person && <> · {person.distanceKm.toFixed(1).replace('.', ',')} км</>}
          </div>
        </div>
        {compat && (
          <div className="text-right shrink-0">
            <div className="font-display font-bold text-spark tnum leading-none">{compat.score}%</div>
            <div className="text-[11px] text-muted">вайб</div>
          </div>
        )}
      </div>

      <h3 className="font-display font-bold text-[17px] leading-snug">{activity.title}</h3>

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="cobalt">{activity.category}</Pill>
        <Pill tone={started ? 'ok' : 'muted'}>
          <Icon name="clock" size={12} /> {planWhen(activity, now)}
        </Pill>
        {!compact && !started && <span className="text-[12px] text-muted">{relative(activity.startsAt, now)}</span>}
      </div>

      {!compact && compat && compat.sharedTags.length > 0 && (
        <p className="text-[13px] text-muted">Общее: {compat.sharedTags.join(', ')}</p>
      )}

      {person ? (
        responded ? (
          <Button variant="secondary" onClick={() => onOpenCapsule(activity.id)}>
            <Icon name="chat" size={18} /> Открыть капсулу
          </Button>
        ) : (
          <Button onClick={() => onRespond(activity)}>
            <Icon name="spark" size={18} fill /> Хочу с тобой
          </Button>
        )
      ) : (
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
          <span>Точное место: {activity.exactPlace}</span>
          <button onClick={() => dispatch({ type: 'deleteActivity', activityId: activity.id })} className="inline-flex items-center gap-1 text-danger font-semibold cursor-pointer shrink-0">
            <Icon name="trash" size={16} /> Удалить
          </button>
        </div>
      )}
    </article>
  )
}
