import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { colors } from '../brand'
import { useTranslation } from 'react-i18next'
import { usePushNotifications } from '../hooks/usePushNotifications'

const S = colors

export default function PushPrompt() {
  const { t } = useTranslation()
  const { status, subscribe } = usePushNotifications()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status !== 'default') return
    // Don't show if user dismissed before
    try {
      const dismissed = localStorage.getItem('push_prompt_dismissed')
      if (dismissed) return
    } catch {}
    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [status])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem('push_prompt_dismissed', '1') } catch {}
  }

  async function allow() {
    await subscribe()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 150, background: 'rgba(22,20,31,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid ' + S.rule2, padding: '16px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <button onClick={dismiss} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 4 }}>
        <X size={14} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: S.p2, border: '1px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell size={18} style={{ color: S.p }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: S.tx, margin: '0 0 2px' }}>{t('push.enable_title')}</p>
          <p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>{t('push.enable_desc')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={dismiss} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {t('push.later')}
        </button>
        <button onClick={allow} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', background: S.p, color: S.tx, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {t('push.allow')}
        </button>
      </div>
    </div>
  )
}
