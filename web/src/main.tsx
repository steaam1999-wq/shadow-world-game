import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerAlertsWorker } from './components/Alerts'
import { Splash } from './components/Splash'
import { startTranslator } from './i18n'
import { listenNativeAuthReturn } from './native'

// Сохранённую тему применяем до первого кадра: переключатель теперь живёт в настройках профиля.
try {
  const theme = localStorage.getItem('iskra-theme')
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme)
} catch { /* хранилище недоступно — следуем теме системы */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Splash />
  </StrictMode>,
)

registerAlertsWorker()
startTranslator()
listenNativeAuthReturn() // приложение для Android: возврат после входа через Google и открытые ссылки komeeta.com
