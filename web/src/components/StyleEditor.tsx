// «Оформление» профиля: акцент, обложка, кольцо аватарки и статус — с живым предпросмотром.
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { nameAge } from '../lib'
import type { ProfileStyle } from '../types'
import { Avatar, Button, Sheet, Toggle } from './ui'
import { ACCENTS, AvatarRing, ProfileCover, StatusLine, accentOf } from './ProfileLook'

const DAY = 24 * 60 * 60_000

function Segment<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1 p-1 rounded-2xl bg-surface-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} role="radio" aria-checked={value === id} onClick={() => onChange(id)}
          className={`h-9 rounded-xl text-[13.5px] cursor-pointer transition ${value === id ? 'bg-surface text-fg font-semibold shadow-soft' : 'text-muted'}`}>{text}</button>
      ))}
    </div>
  )
}

export function StyleEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const me = state.me!
  const [draft, setDraft] = useState<ProfileStyle>(me.style ?? {})
  const [expire, setExpire] = useState(true)
  // Каждое открытие — с текущего оформления: закрыли без «Сохранить» — ничего не меняется.
  useEffect(() => {
    if (!open) return
    setDraft(state.me?.style ?? {})
    setExpire(!!state.me?.style?.statusUntil || !state.me?.style?.status)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p: Partial<ProfileStyle>) => setDraft((d) => ({ ...d, ...p }))

  const save = () => {
    const status = draft.status?.trim().slice(0, 60) || undefined
    const keepUntil = status && status === me.style?.status && me.style?.statusUntil ? me.style.statusUntil : Date.now() + DAY
    const style: ProfileStyle = { ...draft, status, statusUntil: status && expire ? keepUntil : undefined }
    dispatch({ type: 'updateMe', patch: { style } })
    onClose()
  }
  const preview = { ...draft, status: draft.status?.trim() || undefined }

  return (
    <Sheet open={open} onClose={onClose} title="Оформление">
      <div className="flex flex-col gap-4">
        {/* Предпросмотр шапки */}
        <div className="relative overflow-hidden rounded-3xl bg-bg border border-line px-4 pt-5 pb-4 flex flex-col items-center text-center gap-1">
          <ProfileCover style={preview} photo={me.photo} hue={me.hue} />
          <span className="relative"><AvatarRing style={preview}><Avatar name={me.name} hue={me.hue} src={me.photo} size={72} /></AvatarRing></span>
          <span className="relative mt-1.5 font-display font-bold text-[19px]">{nameAge(me.name, me.age)}</span>
          <span className="relative"><StatusLine text={preview.status ?? null} style={preview} /></span>
          <span className="relative mt-2 h-8 px-5 rounded-xl grid place-items-center text-[13px] font-semibold" style={{ background: accentOf(preview).color, color: accentOf(preview).ink }}>Написать</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Акцентный цвет</span>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Акцентный цвет">
            <button role="radio" aria-checked={!draft.accent} onClick={() => set({ accent: undefined })} aria-label="Фирменный Komeeta" title="Фирменный Komeeta"
              className={`w-9 h-9 rounded-full bg-brand cursor-pointer ${!draft.accent ? 'ring-2 ring-fg ring-offset-2 ring-offset-surface' : ''}`} />
            {ACCENTS.map((a) => (
              <button key={a.id} role="radio" aria-checked={draft.accent === a.id} onClick={() => set({ accent: a.id })} aria-label={a.name} title={a.name}
                className={`w-9 h-9 rounded-full cursor-pointer border border-fg/10 ${draft.accent === a.id ? 'ring-2 ring-fg ring-offset-2 ring-offset-surface' : ''}`} style={{ background: a.color }} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Обложка{draft.cover === 'photo' && !me.photo ? ' — сначала добавьте фото профиля' : ''}</span>
          <Segment label="Обложка" value={draft.cover ?? 'color'} onChange={(v) => set({ cover: v })} options={[['none', 'Нет'], ['photo', 'Фото'], ['color', 'Цвет']]} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">Кольцо аватарки</span>
          <Segment label="Кольцо аватарки" value={draft.ring ?? 'none'} onChange={(v) => set({ ring: v })} options={[['none', 'Без'], ['accent', 'Акцент'], ['white', 'Белое']]} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="style-status" className="text-[13px] font-semibold text-muted">Статус</label>
          <div className="relative">
            <input id="style-status" value={draft.status ?? ''} maxLength={60} onChange={(e) => set({ status: e.target.value })} placeholder="Например: на кофе в центре ☕"
              className="w-full h-12 rounded-2xl bg-surface-2 pl-4 pr-14 text-[15px] focus:outline-none focus:ring-2 focus:ring-fg/20" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-muted tnum">{(draft.status ?? '').length}/60</span>
          </div>
          <Toggle id="style-expire" checked={expire} onChange={setExpire} label="Убрать через 24 часа" />
        </div>

        <Button onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}
