import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CONSENT_SINCE, DocsSheet, type DocId } from './Rules'
import { Icon, LogoMark } from './ui'

const KEY = 'match-consent'

/** Дал ли человек согласие в этом браузере (не раньше текущей редакции документов). */
export function localConsent(): number | null {
  try { const at = Number(localStorage.getItem(KEY)); return at >= CONSENT_SINCE ? at : null } catch { return null }
}
export function saveLocalConsent(at = Date.now()) {
  try { localStorage.setItem(KEY, String(at)) } catch { /* ignore */ }
  return at
}

/** Галочка «Мне есть 18 лет и я согласен(на)…» со ссылками на документы. */
export function ConsentCheck({ checked, onChange, highlight, plain = false }: { checked: boolean; onChange: (v: boolean) => void; highlight?: boolean; plain?: boolean }) {
  const [doc, setDoc] = useState<DocId | null>(null)
  const link = (id: DocId, text: string) => (
    <a href="#" role="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDoc(id) }} className="underline underline-offset-2 font-semibold text-fg cursor-pointer">{text}</a>
  )
  const text = <>Мне есть <b className="text-fg">18 лет</b>. Я принимаю {link('terms', 'соглашение')} и {link('privacy', 'политику конфиденциальности')} и даю {link('consent', 'согласие на обработку персональных данных')}.</>
  // plain — только текст со ссылками: подтверждение — кнопка под ним
  if (plain) return <><p className="text-[14px] leading-snug text-muted">{text}</p><DocsSheet open={!!doc} initial={doc ?? 'terms'} onClose={() => setDoc(null)} /></>
  return (
    <>
      <label className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition ${highlight && !checked ? 'bg-danger-soft ring-2 ring-danger/40' : 'bg-surface/70'}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" aria-label="Мне есть 18 лет, я принимаю соглашение и политику конфиденциальности и даю согласие на обработку персональных данных" />
        <span aria-hidden="true" className={`mt-0.5 grid place-items-center w-6 h-6 shrink-0 rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt ${checked ? 'bg-fg border-fg text-bg' : 'border-muted/60 bg-surface'}`}>
          {checked && <Icon name="check" size={15} />}
        </span>
        <span className="text-[13px] leading-snug text-muted">
          Мне есть <b className="text-fg">18 лет</b>. Я принимаю {link('terms', 'соглашение')} и {link('privacy', 'политику конфиденциальности')} и даю {link('consent', 'согласие на обработку персональных данных')}.
        </span>
      </label>
      <DocsSheet open={!!doc} initial={doc ?? 'terms'} onClose={() => setDoc(null)} />
    </>
  )
}

/** Окно для уже зарегистрированных: подтвердить 18+ и согласие, иначе — выйти. */
export function ConsentGate({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const [ok, setOk] = useState(false)
  const [tried, setTried] = useState(false)
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]" role="dialog" aria-modal="true" aria-label="Подтвердите согласие">
      <div className="anim-fade absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="anim-sheet relative w-full sm:max-w-md rounded-[28px] bg-surface shadow-soft p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <h2 className="font-display font-bold text-[19px] leading-tight">Обновили документы</h2>
            <p className="text-[13px] text-muted">Чтобы продолжить, подтвердите возраст и согласие</p>
          </div>
        </div>
        <ConsentCheck checked={ok} onChange={setOk} highlight={tried} />
        <button onClick={() => { if (ok) onAccept(); else setTried(true) }} className="h-12 rounded-2xl bg-brand text-white font-semibold text-[16px] cursor-pointer">Продолжить</button>
        <button onClick={onDecline} className="h-10 text-[14px] font-semibold text-muted cursor-pointer">Не согласен(на) — выйти</button>
      </div>
    </div>,
    document.body,
  )
}
