import { useEffect, useState } from 'react'
import { LogoMark, Wordmark } from './ui'

// Заставка при запуске: знак Komeeta «встречается» и появляется название. Один раз за сеанс.
const KEY = 'match-splash'

export function Splash() {
  const [stage, setStage] = useState<'show' | 'fade' | 'gone'>(() => {
    try { return sessionStorage.getItem(KEY) ? 'gone' : 'show' } catch { return 'gone' }
  })
  useEffect(() => {
    if (stage === 'gone') return
    try { sessionStorage.setItem(KEY, '1') } catch { /* ignore */ }
    const fade = setTimeout(() => setStage('fade'), 1700)
    const gone = setTimeout(() => setStage('gone'), 2050)
    return () => { clearTimeout(fade); clearTimeout(gone) }
  }, [stage === 'gone']) // eslint-disable-line react-hooks/exhaustive-deps
  if (stage === 'gone') return null
  return (
    <div className="splash" style={{ opacity: stage === 'fade' ? 0 : 1 }} aria-hidden="true" onClick={() => setStage('gone')}>
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={104} animate />
        <div className="flex flex-col items-center gap-1">
          <Wordmark animate className="text-[40px]" />
          <span className="splash-word text-[15px] text-white/70 mt-2">Живые встречи рядом</span>
        </div>
      </div>
    </div>
  )
}
