import { useState } from 'react'
import { useStore } from '../store'
import { sendBugReport, humanError } from '../cloud/api'
import { Button, Icon, Sheet, inputCls } from './ui'

declare const __BUILD__: string

/** Что за устройство — коротко, чтобы понять, где воспроизводить ошибку. */
function deviceLine() {
  const ua = navigator.userAgent
  const os = /iPhone|iPad/.exec(ua) ? `iOS ${/OS (\d+[_.]\d+)/.exec(ua)?.[1]?.replace('_', '.') ?? ''}` : /Android [\d.]+/.exec(ua)?.[0] ?? (/Mac|Windows|Linux/.exec(ua)?.[0] ?? 'Другое')
  const browser = /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /YaBrowser/.test(ua) ? 'Яндекс' : /Safari/.test(ua) ? 'Safari' : 'браузер'
  const home = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
  return `${os} · ${browser}${home ? ' · с экрана «Домой»' : ''} · ${window.innerWidth}×${window.innerHeight} · ${navigator.language}`
}

/** «Сообщить об ошибке»: текст, скриншот и сведения об устройстве уходят разработчику. */
export function BugReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const [text, setText] = useState('')
  const [shot, setShot] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const close = () => { onClose(); setTimeout(() => { setSent(false); setError('') }, 300) }

  const send = async () => {
    if (!text.trim()) return
    setBusy(true); setError('')
    try {
      if (state.cloud) await sendBugReport(state.cloud.userId, { body: text.trim(), page: document.body.dataset.page ?? '', device: deviceLine(), version: __BUILD__, shot })
      setSent(true); setText(''); setShot(null)
    } catch (e) { setError(humanError(e)) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onClose={close} title={sent ? 'Спасибо!' : 'Сообщить об ошибке'}>
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center pb-2">
          <span className="grid place-items-center w-14 h-14 rounded-full bg-brand text-white"><Icon name="check" size={28} /></span>
          <p className="text-muted">{state.cloud ? 'Сообщение получено — исправим и напишем в обновлении.' : 'Это демо-режим: сообщение не отправлено. Войдите в аккаунт, чтобы отправлять.'}</p>
          <Button onClick={close} className="self-stretch">Готово</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] text-muted leading-snug">Что случилось и что вы делали перед этим? Скриншот очень помогает.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} aria-label="Описание ошибки"
            placeholder="Например: открыл историю — она растянулась, фото не видно" className={`${inputCls} h-auto py-3 resize-none`} autoFocus />
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2 cursor-pointer">
            {shot ? <img src={URL.createObjectURL(shot)} alt="Скриншот" className="w-12 h-12 rounded-xl object-cover" /> : <span className="grid place-items-center w-12 h-12 rounded-xl bg-surface text-muted"><Icon name="camera" size={20} /></span>}
            <span className="flex-1 min-w-0 text-[14px] font-semibold">{shot ? 'Скриншот добавлен' : 'Добавить скриншот'}<span className="block text-[12px] font-normal text-muted">{shot ? 'Нажмите, чтобы заменить' : 'Из галереи телефона'}</span></span>
            {shot && <button type="button" onClick={(e) => { e.preventDefault(); setShot(null) }} className="grid place-items-center w-8 h-8 rounded-full text-muted cursor-pointer" aria-label="Убрать скриншот"><Icon name="x" size={16} /></button>}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) setShot(f); else if (f) setError('Скриншот больше 5 МБ'); e.target.value = '' }} />
          </label>
          <p className="text-[11.5px] text-muted">Вместе с сообщением уйдёт: раздел приложения, модель системы и браузер, размер экрана, версия Komeeta.</p>
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          <Button onClick={() => { void send() }} disabled={busy || !text.trim()} className="h-12">{busy ? 'Отправляем…' : 'Отправить'}</Button>
        </div>
      )}
    </Sheet>
  )
}
