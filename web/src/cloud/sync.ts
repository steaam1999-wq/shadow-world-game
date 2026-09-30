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
      // Групповой план: кроме переписки с автором — общий чат компании.
      return run(api.respond(uid, a.capsuleId!, plan, a.text).then(() => (plan.groupSize ? api.joinPlanGroup(plan.id) : undefined)))
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
    case 'repost': {
      const plan = s.activities.find((x) => x.id === a.activityId)
      return plan && plan.authorId !== 'me' ? run(api.addRepost(a.activityId)) : null
    }
    case 'hideChat':
      return run(api.hideChat(a.capsuleId))
    case 'setFree':
      return run(api.setFree(a.until ? Math.max(1, Math.round((a.until - Date.now()) / 60_000)) : 0))
    case 'invite': {
      const c = s.capsules.find((x) => x.personId === a.personId && !x.activityId)
      return c ? run(api.sendMessage(uid, c.id, a.text)) : a.capsuleId ? run(api.openDirect(uid, a.capsuleId, a.personId, a.text)) : null
    }
    case 'react':
      return /^\d+$/.test(a.messageId) ? run(api.setReaction(a.chatId, a.messageId, a.emoji)) : null
    case 'addChatTrack':
      return run(api.addChatTrack(a.chatId, a.track))
    case 'removeChatTrack':
      return /^\d+$/.test(a.id) ? run(api.removeChatTrack(a.id)) : null
    case 'noShow': {
      const c = s.capsules.find((x) => x.id === a.capsuleId)
      return c ? run(api.setNoShow(c.id, c.personId, a.on)) : null
    }
    case 'createGroup':
      return run(api.createGroup(uid, a.id, a.title, a.members))
    case 'sendGroup':
      return run(api.sendGroupMessage(a.groupId, a.text))
    case 'sendGroupPhoto':
      return run(api.sendGroupPhoto(a.groupId, a.photo, a.text ?? ''))
    case 'deleteGroupMessage': {
      const m = (s.groups ?? []).find((g) => g.id === a.groupId)?.messages.find((x) => x.id === a.messageId)
      return m && /^\d+$/.test(m.id) ? run(api.deleteGroupMessage(m.id, m.photoPath)) : null
    }
    case 'readGroup':
      return run(api.markGroupRead(uid, a.groupId))
    case 'renameGroup':
      return run(api.renameGroup(a.groupId, a.title))
    case 'addGroupMembers':
      return run(api.addGroupMembers(a.groupId, a.members))
    case 'removeGroupMember':
      return run(api.removeGroupMember(a.groupId, a.personId))
    case 'leaveGroup': {
      const g = (s.groups ?? []).find((x) => x.id === a.groupId)
      return g ? run(api.leaveGroup(uid, g.id, g.ownerId === 'me')) : null
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
      return run(api.addComment(a.planId, a.text, a.replyTo))
    case 'addShortComment':
      return run(api.addShortComment(a.shortId, a.text, a.replyTo))
    case 'deleteShortComment':
      return a.id.startsWith('tmp-') ? null : run(api.deleteShortComment(a.id))
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
