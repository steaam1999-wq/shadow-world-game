import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { humanError, submitVerification } from '../cloud/api'
import { Button, Icon, Sheet, readPhoto } from './ui'

// Проверка профиля селфи с жестом: синяя галочка. Окно можно открыть из любого места — событием openVerify().

const EVENT = 'komeeta:verify'
export const openVerify = () => window.dispatchEvent(new Event(EVENT))
/** Подписка на «открой проверку» — окно живёт в оболочке приложения. */
export function useVerifyRequests(open: () => void) {
  useEffect(() => { window.addEventListener(EVENT, open); return () => window.removeEventListener(EVENT, open) }, [open])
}

const GESTURES = [
  { glyph: '✌', text: 'два пальца у виска' },
  { glyph: '👍', text: 'большой палец вверх у щеки' },
  { glyph: '👌', text: 'знак «ок» у подбородка' },
  { glyph: '✋', text: 'ладонь у подбородка' },
  { glyph: '☝', text: 'указательный палец у носа' },
]

export function VerifySheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useStore()
  const [photo, setPhoto] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Жест выбирается заново при каждом открытии — старое фото не подойдёт.
  const [gesture, setGesture] = useState(() => GESTURES[Math.floor(Math.random() * GESTURES.length)])
  useEffect(() => { if (open) setGesture(GESTURES[Math.floor(Math.random() * GESTURES.length)]) }, [open])
  const close = () => { setPhoto(null); setSent(false); setError(''); onClose() }

  const send = async () => {
    if (!photo) return
    if (!state.cloud) { onDone(); setSent(true); return }
    setBusy(true); setError('')
    try {
      await submitVerification(state.cloud.userId, photo, `${gesture.glyph} ${gesture.text}`)
      dispatch({ type: 'verificationSent' })
      setSent(true)
    } catch (e) {
      setError(humanError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Верификация">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted">{state.cloud
            ? 'Селфи отправлено модератору. Синяя галочка появится в профиле, как только его проверят. Фото удаляется сразу после проверки.'
            : 'Селфи отправлено модератору. В демо проверка проходит сразу: синяя галочка уже в профиле.'}</p>
          <Button onClick={close}>Отлично</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {state.cloud && state.verification === 'rejected' && <p className="text-[13px] text-danger">Прошлое селфи не подошло: лицо должно быть хорошо видно, а жест — совпадать с заданием.</p>}
          <div className="rounded-2xl bg-surface-2 p-5 text-center">
            <div className="font-display font-bold text-5xl text-cobalt" aria-hidden="true">{gesture.glyph}</div>
            <p className="mt-2 font-semibold">Сфотографируйтесь: {gesture.text}</p>
            <p className="text-[13px] text-muted">Жест меняется каждый раз, поэтому старое фото не подойдёт.</p>
          </div>
          <label htmlFor="selfie" className="relative flex items-center justify-center gap-2 h-12 rounded-full border-2 border-dashed border-line cursor-pointer hover:border-cobalt font-semibold overflow-hidden">
            {photo ? <><img src={photo} alt="" className="w-8 h-8 rounded-full object-cover" /> Селфи выбрано — заменить</> : <><Icon name="camera" size={18} /> Загрузить селфи</>}
          </label>
          <input id="selfie" type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { setPhoto(await readPhoto(f)); setError('') } catch { setError('Не получилось открыть фото. Выберите JPG или PNG.') }
          }} />
          {error && <p className="text-[13px] text-danger" role="alert">{error}</p>}
          <Button disabled={!photo || busy} onClick={send}>{busy ? 'Отправляем…' : 'Отправить на проверку'}</Button>
          <p className="text-[12px] text-muted">Фото видит только модератор и удаляет после проверки. Биометрические данные мы не храним.</p>
        </div>
      )}
    </Sheet>
  )
}


const PERKS = ['Синяя галочка рядом с именем', 'Вам пишут охотнее — люди видят, что вы настоящий', 'Можно писать тем, кто принимает сообщения только от проверенных']

/** Карточка в профиле: зачем нужна галочка и кнопка «Пройти проверку». Для проверенных — не показывается. */
export function VerifyCard() {
  const { state } = useStore()
  const me = state.me
  if (!me || me.verified) return null
  const pending = !!state.cloud && state.verification === 'pending'
  const rejected = !!state.cloud && state.verification === 'rejected'
  return (
    <section className="rounded-[24px] p-4 flex flex-col gap-3 bg-cobalt-soft ring-1 ring-cobalt/20" aria-label="Проверка профиля">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={22} /></span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{pending ? 'Селфи на проверке' : 'Получите синюю галочку'}</div>
          <div className="text-[13px] text-muted">{pending ? 'Обычно проверяем в течение суток — галочка появится сама.' : rejected ? 'Прошлое селфи не подошло — попробуйте ещё раз.' : 'Одно селфи с жестом — минута, и профилю больше доверяют.'}</div>
        </div>
      </div>
      {!pending && <>
        <ul className="flex flex-col gap-1.5 text-[13.5px]">
          {PERKS.map((p) => <li key={p} className="flex items-start gap-2"><Icon name="check" size={15} className="text-cobalt shrink-0 mt-0.5" />{p}</li>)}
        </ul>
        <Button onClick={openVerify} className="h-11 !rounded-full !bg-cobalt">{rejected ? 'Попробовать ещё раз' : 'Пройти проверку'}</Button>
      </>}
    </section>
  )
}

const BANNER_KEY = 'verify-banner-hidden'
/** Баннер на главной для непроверенных: скрывается на неделю. */
export function VerifyBanner() {
  const { state } = useStore()
  const [hidden, setHidden] = useState(() => { try { return Date.now() - Number(localStorage.getItem(BANNER_KEY) ?? 0) < 7 * 86400_000 } catch { return false } })
  if (!state.me || state.me.verified || hidden || (state.cloud && state.verification === 'pending')) return null
  const hide = () => { setHidden(true); try { localStorage.setItem(BANNER_KEY, String(Date.now())) } catch { /* ignore */ } }
  return (
    <div className="mx-4 mb-4 rounded-[22px] bg-cobalt-soft ring-1 ring-cobalt/20 p-3.5 flex items-center gap-3" role="region" aria-label="Проверка профиля">
      <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-cobalt text-white"><Icon name="check" size={20} /></span>
      <button onClick={openVerify} className="flex-1 min-w-0 text-left cursor-pointer">
        <span className="block font-semibold text-[14.5px]">Подтвердите, что это вы</span>
        <span className="block text-[12.5px] text-muted">С галочкой вам будут писать охотнее · 1 минута</span>
      </button>
      <button onClick={hide} className="grid place-items-center w-8 h-8 shrink-0 rounded-full text-muted hover:bg-surface cursor-pointer" aria-label="Скрыть на неделю"><Icon name="x" size={16} /></button>
    </div>
  )
}
