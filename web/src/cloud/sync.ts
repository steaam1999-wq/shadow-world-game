import type { Action } from '../store'
import type { State } from '../types'
import * as api from './api'

let reloader: (() => void) | null = null
export function setReloader(fn: (() => void) | null) { reloader = fn }
export function requestReload() { reloader?.() }

/** Запись действия на сервер. null — действие только локальное (лайки, сохранённое, таймер безопасности). */
export function cloudEffect(a: Action, s: State): Promise<unknown> | null {
  const cloud = s.cloud
  if (!cloud) return null
  const uid = cloud.userId
  const run = (p: Promise<unknown>) => p.catch((e: unknown) => { throw new Error(api.humanError(e)) })
  switch (a.type) {
    case 'signIn':
      return run(api.saveProfile(uid, a.me))
    case 'updateMe':
      return s.me ? run(api.saveProfile(uid, { ...s.me, ...a.patch })) : null
    case 'createActivity':
      return run(api.createPlan(uid, a.id!, a.activity))
    case 'deleteActivity':
      return run(api.deletePlan(a.activityId))
    case 'respond': {
      const plan = s.activities.find((x) => x.id === a.activityId)
      if (!plan || plan.authorId === 'me' || s.liked.includes(plan.id)) return null
      return run(api.respond(uid, a.capsuleId!, plan, a.text))
    }
    case 'send':
      return run(api.sendMessage(uid, a.capsuleId, a.text))
    case 'share': {
      const plan = s.activities.find((x) => x.id === a.activityId)
      const c = s.capsules.find((x) => x.personId === a.personId)
      return plan && c ? run(api.sendMessage(uid, c.id, `Смотри, какой план: «${plan.title}» — ${plan.area}`)) : null
    }
    case 'setStatus':
      return run(api.setCapsuleStatus(a.capsuleId, a.status).then(() => (a.status === 'met' && s.me ? api.saveProfile(uid, { ...s.me, meetings: s.me.meetings + 1 }) : undefined)))
    case 'report':
      return run(api.sendReport(a.personId, a.reason, a.text))
    case 'signOut':
      return run(api.signOut())
    default:
      return null
  }
}
