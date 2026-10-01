import { useEffect, useState } from 'react'
import { ageFrom, formatBirth, parseBirth, plural } from '../lib'
import { Field, inputCls } from './ui'

/** Проверка даты рождения: '' — не указана (можно), иначе текст ошибки или null, если всё верно. */
export function birthProblem(text: string): string | null {
  if (!text.trim()) return null
  const iso = parseBirth(text)
  if (!iso) return text.replace(/\D/g, '').length < 8 ? 'Введите дату полностью: ДД.ММ.ГГГГ' : 'Такой даты нет'
  const a = ageFrom(iso)
  if (a < 18) return 'Match Go — только для тех, кому есть 18'
  if (a > 100) return 'Проверьте год рождения'
  return null
}

/** Дата рождения ДД.ММ.ГГГГ — по желанию. Точки ставятся сами. Другие видят только возраст. */
export function BirthDateField({ id, value, onChange }: { id: string; value: string; onChange: (text: string) => void }) {
  const [touched, setTouched] = useState(false)
  const problem = birthProblem(value)
  const iso = parseBirth(value)
  return (
    <Field id={id} label="Дата рождения (необязательно)">
      <input id={id} className={`${inputCls} tnum`} inputMode="numeric" autoComplete="bday" placeholder="ДД.ММ.ГГГГ" maxLength={10} value={value}
        onBlur={() => setTouched(true)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
          onChange([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.'))
        }} />
      <span className={`text-[12px] ${problem && (touched || value.length >= 10) ? 'text-danger' : 'text-muted'}`}>
        {problem && (touched || value.length >= 10) ? problem
          : iso ? `Вам ${ageFrom(iso)} ${plural(ageFrom(iso), 'год', 'года', 'лет')} — другие увидят только возраст`
            : 'Можно не указывать. Другие увидят только возраст, не дату'}
      </span>
    </Field>
  )
}

/** Текст поля из сохранённой даты — для начального значения. */
export function useBirthText(iso?: string) {
  const [text, setText] = useState(formatBirth(iso))
  useEffect(() => { setText(formatBirth(iso)) }, [iso])
  return [text, setText] as const
}
