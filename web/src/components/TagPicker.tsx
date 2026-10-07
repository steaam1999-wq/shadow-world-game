import { useState } from 'react'
import { Chip, Icon, inputCls } from './ui'

export const TAG_MAX = 20
export const TAG_LEN = 24

/** Интересы: готовые из списка плюс свои — вписываются вручную. Всё необязательно. */
export function TagPicker({ options, value, onChange }: { options: string[]; value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState('')
  const has = (t: string) => value.some((x) => x.toLowerCase() === t.toLowerCase())
  const toggle = (t: string) => onChange(has(t) ? value.filter((x) => x.toLowerCase() !== t.toLowerCase()) : value.length < TAG_MAX ? [...value, t] : value)
  const own = value.filter((t) => !options.some((o) => o.toLowerCase() === t.toLowerCase()))
  const add = () => {
    const t = text.replace(/^#+/, '').replace(/\s+/g, ' ').trim().slice(0, TAG_LEN)
    if (!t) return
    const nice = t[0].toUpperCase() + t.slice(1)
    if (!has(nice) && value.length < TAG_MAX) onChange([...value, nice])
    setText('')
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-muted">Интересы и хобби{value.length ? ` · ${value.length}` : ''} <span className="font-normal">(необязательно)</span></span>
      <div className="flex flex-wrap gap-2">
        {options.map((t) => <Chip key={t} active={has(t)} onClick={() => toggle(t)}>{t}</Chip>)}
        {own.map((t) => (
          <Chip key={t} active onClick={() => toggle(t)}>
            <span className="inline-flex items-center gap-1">{t} <Icon name="x" size={12} /></span>
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <label htmlFor="own-tag" className="sr-only">Своё хобби</label>
        <input id="own-tag" className={`${inputCls} flex-1 min-w-0`} value={text} maxLength={TAG_LEN} placeholder="Своё хобби: бадминтон, аниме, джаз…"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} autoComplete="off" />
        <button type="button" onClick={add} disabled={!text.trim() || value.length >= TAG_MAX}
          className="h-11 px-4 rounded-xl bg-surface-2 font-semibold text-[14px] cursor-pointer disabled:opacity-40 disabled:cursor-default">Добавить</button>
      </div>
      {value.length >= TAG_MAX && <span className="text-[12px] text-muted">Не больше {TAG_MAX} интересов</span>}
    </div>
  )
}
