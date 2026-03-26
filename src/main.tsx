import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

// Global unhandled rejection handler — show toast for unexpected errors
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason || '')
  // Skip network errors (offline, CORS) to avoid spam
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) return
  console.error('Unhandled rejection:', event.reason)
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// force rebuild
console.info('[fluidz] build 20260326')
