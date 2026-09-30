import type { Action } from '../store'
import type { State } from '../types'
import * as api from './api'

let reloader: (() => void) | null = null
export function setReloader(fn: (() => void) | null) { reloader = fn }
export function requestReload() { reloader?.() }

/** Запись действия на сервер. null — действие только локальное (таймер безопасности, просмотренные сторис). */
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
    case 'directMessage': {
      const c = s.capsules.find((x) => x.personId === a.personId)
      if (c) return a.text ? run(api.sendMessage(uid, c.id, a.text)) : null
      return run(api.openDirect(uid, a.capsuleId!, a.personId, a.text))
    }
    case 'send':
      return run(api.sendMessage(uid, a.capsuleId, a.text))
    case 'sendPhoto':
      return run(api.sendPhotoMessage(uid, a.capsuleId, a.photo, a.text ?? ''))
    case 'deleteMessage': {
      const m = s.capsules.find((c) => c.id === a.capsuleId)?.messages.find((x) => x.id === a.messageId)
      return m && /^\d+$/.test(m.id) ? run(api.deleteMessage(m.id, m.photoPath)) : null
    }
    case 'readCapsule':
      return run(api.markRead(a.capsuleId))
    case 'share': {
      const plan = s.activities.find((x) => x.id === a.activityId)
      const c = s.capsules.find((x) => x.personId === a.personId)
      return plan && c ? run(api.sendMessage(uid, c.id, `Смотри, какой план: «${plan.title}» — ${plan.area}`)) : null
    }
    case 'toggleHeart':
      return run(api.setMark('plan_likes', a.activityId, !s.hearts.includes(a.activityId), uid))
    case 'heart':
      return s.hearts.includes(a.activityId) ? null : run(api.setMark('plan_likes', a.activityId, true, uid))
    case 'toggleShortHeart':
      return run(api.setMark('short_likes', a.shortId, !(s.shortHearts ?? []).includes(a.shortId), uid))
    case 'toggleSave':
      return run(api.setMark('saved_plans', a.activityId, !s.saved.includes(a.activityId), uid))
    case 'toggleFollow':
      return run(api.setMark('follows', a.personId, !(s.following ?? []).includes(a.personId), uid))
    case 'setStatus':
      return run(api.setCapsuleStatus(a.capsuleId, a.status).then(() => (a.status === 'met' && s.me ? api.saveProfile(uid, { ...s.me, meetings: s.me.meetings + 1 }) : undefined)))
    case 'addComment':
      return run(api.addComment(a.planId, a.text))
    case 'deleteComment':
      // Ещё не сохранённый комментарий (временный id) удалять на сервере нечего.
      return a.id.startsWith('tmp-') ? null : run(api.deleteComment(a.id))
    case 'block':
      return run(api.block(a.personId))
    case 'unblock':
      return run(api.unblock(uid, a.personId))
    case 'report':
      return run(api.sendReport(a.personId, a.reason, a.text, a.shortId))
    case 'signOut':
      return run(api.signOut())
    default:
      return null
  }
}
