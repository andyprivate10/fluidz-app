import { useState, useEffect } from 'react'
import { colors } from '../brand'
import { Download, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const S = colors

export default function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    try {
      if (localStorage.getItem('pwa_dismissed')) return
      if (window.matchMedia('(display-mode: standalone)').matches) return
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem('pwa_dismissed', '1') } catch {}
  }

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 200,
      maxWidth: 448, margin: '0 auto',
      background: S.bg1, border: '1px solid ' + S.pbd, borderRadius: 16,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: S.p2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Download size={20} style={{ color: S.p }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: S.tx, margin: 0 }}>
          {t('app.name')}
        </p>
        <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>
          {t('app.tagline')}
        </p>
      </div>
      <button onClick={install} style={{
        padding: '8px 14px', borderRadius: 10, background: S.p, border: 'none',
        color: S.tx, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
      }}>
        {t('app.install')}
      </button>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  )
}
