import { Fragment, type ReactNode } from 'react'
import { openLink } from '../native'

// http(s)://…, www.… и голые адреса вроде komeeta.com/abc. Почту (a@b.com) не трогаем.
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>«»"]+|(?<![@\w.-])[a-zа-я0-9-]+(?:\.[a-zа-я0-9-]+)*\.(?:com|ru|by|net|org|io|me|app|su|рф|info|tv|link|ly|gl|be|cc)(?:\/[^\s<>«»"]*)?(?![\w@])/giu
const TRAIL = /[.,!?;:)\]}'’”…]+$/

/** Текст, в котором адреса становятся ссылками. Нажатие по ссылке не открывает меню сообщения. */
export function Linkify({ text, className = '' }: { text: string; className?: string }) {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    let raw = m[0]
    const tail = raw.match(TRAIL)?.[0] ?? ''
    if (tail && !(tail.startsWith(')') && raw.includes('('))) raw = raw.slice(0, raw.length - tail.length)
    const at = m.index ?? 0
    if (at > last) out.push(<Fragment key={last}>{text.slice(last, at)}</Fragment>)
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    out.push(
      <a key={at} href={href} target="_blank" rel="noopener noreferrer nofollow" className={`underline underline-offset-2 break-all ${className}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLink(href) }}>{raw}</a>,
    )
    last = at + raw.length
  }
  if (!out.length) return <>{text}</>
  if (last < text.length) out.push(<Fragment key={last}>{text.slice(last)}</Fragment>)
  return <>{out}</>
}
