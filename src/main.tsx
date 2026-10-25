import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './hooks/useSettings'
import { FocusProvider } from './focus/FocusContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <FocusProvider>
        <App />
      </FocusProvider>
    </SettingsProvider>
  </StrictMode>,
)
