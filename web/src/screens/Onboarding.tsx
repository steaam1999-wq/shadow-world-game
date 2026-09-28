import { useState } from 'react'
import { DISTRICTS, VIBE_QUESTIONS } from '../data'
import { useStore } from '../store'
import { Button, Chip, Field, Icon, Logo, inputCls } from '../components/ui'
import type { Me, VibeAnswers } from '../types'

type Method = Me['authMethod']

export function Onboarding({ onDone, onBack, initialName = '', method: initialMethod = null }: { onDone: () => void; onBack: () => void; initialName?: string; method?: Method | null }) {
  const { state, dispatch } = useStore()
  const [step, setStep] = useState(initialMethod ? 1 : 0) // 0 — вход, 1..6 — вопросы, 7 — профиль
  const [method, setMethod] = useState<Method | null>(initialMethod)
  const [phone, setPhone] = useState('+7 ')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [answers, setAnswers] = useState<VibeAnswers>({})
  const [name, setName] = useState(initialName)
  const [age, setAge] = useState('25')
  const [district, setDistrict] = useState(DISTRICTS[0])
  const [bio, setBio] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const total = VIBE_QUESTIONS.length + 1
  const q = step >= 1 && step <= VIBE_QUESTIONS.length ? VIBE_QUESTIONS[step - 1] : null

  const signInWith = (m: Method) => {
    setMethod(m)
    if (m !== 'phone') {
      if (m === 'telegram') setName('Женя')
      setStep(1)
    }
  }

  const finish = () => {
    dispatch({
      type: 'signIn',
      me: {
        name: name.trim(), age: Number(age) || 25, hue: 12, bio: bio.trim(), district, answers, tags,
        verified: method === 'telegram', meetings: 0, authMethod: method ?? 'phone',
        privacy: { showExactAge: true, hideFromContacts: true, approxLocation: true },
        radiusKm: 5,
      },
    })
    onDone()
  }

  return (
    <div className="min-h-full flex flex-col mx-auto max-w-[480px] px-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      <div className="h-16 flex items-center justify-between">
        <button onClick={() => (step === 0 || (initialMethod && step === 1) ? onBack() : setStep(step - 1))} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-2 cursor-pointer" aria-label="Назад">
          <Icon name="back" />
        </button>
        <Logo className="text-lg" />
        <span className="w-10 text-right text-[13px] text-muted font-mono tnum">{step > 0 ? `${step}/${total}` : ''}</span>
      </div>
      {step > 0 && (
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden mb-6">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      )}

      {step === 0 && (
        <div className="anim-rise flex flex-col gap-6 pt-6 flex-1">
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-bold text-3xl leading-tight">Вход в «Искру»</h1>
            <p className="text-muted">Займёт минуту. Потом шесть вопросов, чтобы найти людей на одной волне.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => signInWith('telegram')} className="h-13 !bg-[#2AABEE] !text-white">
              <Icon name="send" size={18} /> Войти через Telegram
            </Button>
            <Button variant="secondary" onClick={() => signInWith('google')} className="h-13">
              <span className="font-display font-bold">G</span> Войти через Google
            </Button>
            <Button variant="secondary" onClick={() => setMethod('phone')} className="h-13">По номеру телефона</Button>
          </div>
          {method === 'phone' && (
            <form
              className="anim-rise flex flex-col gap-3 rounded-[24px] bg-surface shadow-soft p-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!codeSent) setCodeSent(true)
                else if (code.length === 4) setStep(1)
              }}
            >
              <Field id="phone" label="Номер телефона">
                <input id="phone" className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              {codeSent && (
                <Field id="code" label="Код из SMS (в демо подойдёт любой из 4 цифр)">
                  <input id="code" className={`${inputCls} font-mono tracking-[.5em]`} inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
                </Field>
              )}
              <Button type="submit" disabled={codeSent ? code.length !== 4 : phone.replace(/\D/g, '').length < 11}>
                {codeSent ? 'Подтвердить' : 'Получить код'}
              </Button>
            </form>
          )}
          <p className="mt-auto text-[12px] text-muted">Продолжая, вы соглашаетесь с правилами сервиса и подтверждаете, что вам есть 18 лет.</p>
        </div>
      )}

      {q && (
        <div key={q.id} className="anim-rise flex flex-col gap-6 flex-1">
          <div>
            <span className="eyebrow">Вайб-тест</span>
            <h1 className="font-display font-bold text-2xl sm:text-[28px] leading-tight mt-1">{q.title}</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((o) => {
              const active = answers[q.id] === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setAnswers({ ...answers, [q.id]: o.id })
                    setTimeout(() => setStep((s) => s + 1), 180)
                  }}
                  aria-pressed={active}
                  className={`text-left rounded-[26px] p-4 min-h-[150px] flex flex-col justify-between gap-3 border-2 transition duration-200 cursor-pointer ${active ? 'border-spark bg-spark-soft' : 'border-transparent bg-surface shadow-soft hover:-translate-y-0.5'}`}
                >
                  <span className={`font-display text-4xl leading-none ${active ? 'text-spark' : 'text-cobalt'}`} aria-hidden="true">{o.glyph}</span>
                  <span>
                    <span className="block font-semibold leading-tight">{o.label}</span>
                    <span className="block text-[13px] text-muted mt-0.5">{o.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {answers[q.id] && (
            <Button variant="secondary" onClick={() => setStep(step + 1)} className="self-end">Дальше</Button>
          )}
        </div>
      )}

      {step === total && (
        <form className="anim-rise flex flex-col gap-5 flex-1" onSubmit={(e) => { e.preventDefault(); finish() }}>
          <div>
            <span className="eyebrow">Последний шаг</span>
            <h1 className="font-display font-bold text-2xl leading-tight mt-1">Пара слов о себе</h1>
          </div>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field id="name" label="Имя">
              <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас называть" required />
            </Field>
            <Field id="age" label="Возраст">
              <input id="age" className={`${inputCls} tnum`} type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} required />
            </Field>
          </div>
          <Field id="district" label="Район (другие увидят только его)">
            <select id="district" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field id="bio" label="О себе">
            <textarea id="bio" className={`${inputCls} h-24 py-2.5 resize-none`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Чем занимаетесь и что ищете. Пара предложений." maxLength={200} />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">Интересы (минимум 3)</span>
            <div className="flex flex-wrap gap-2">
              {state.tags.map((t) => (
                <Chip key={t} active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
              ))}
            </div>
          </div>
          <Button type="submit" className="mt-auto h-13" disabled={!name.trim() || tags.length < 3 || Number(age) < 18}>
            Смотреть активности
          </Button>
        </form>
      )}
    </div>
  )
}
