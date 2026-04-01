import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { colors } from '../brand'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from './Toast'
import { sendPushToUser } from '../lib/pushSender'

const S = colors

interface Props {
  sessionId: string
  hostId: string
  sessionTitle: string
}

export default function PanicButton({ sessionId, hostId, sessionTitle }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [sent, setSent] = useState(false)

  if (sent) return null

  async function handlePanic() {
    if (!user) return
    setSent(true)
    setConfirming(false)

    // Alert host
    await supabase.from('notifications').insert({
      user_id: hostId,
      session_id: sessionId,
      type: 'panic_alert',
      title: t('panic.alert_title'),
      body: t('panic.alert_body', { title: sessionTitle }),
      href: '/session/' + sessionId,
    })
    sendPushToUser(hostId, t('panic.alert_title'), t('panic.alert_body', { title: sessionTitle }), '/session/' + sessionId)

    // Also insert admin-visible report
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'panic_alert',
      title: t('panic.admin_title'),
      body: JSON.stringify({ session_id: sessionId, user_id: user.id, timestamp: new Date().toISOString() }),
      href: '/session/' + sessionId,
    })

    showToast(t('panic.sent_toast'), 'info')
  }

  if (confirming) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: S.bg1, borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, textAlign: 'center', border: '1px solid ' + S.redbd }}>
          <AlertTriangle size={36} style={{ color: S.red, marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: '0 0 8px' }}>{t('panic.confirm_title')}</h3>
          <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 20px' }}>{t('panic.confirm_desc')}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('common.cancel')}
            </button>
            <button onClick={handlePanic} style={{ flex: 1, padding: 12, borderRadius: 12, background: S.red, border: 'none', color: S.tx, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('panic.send_alert')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: '8px 14px', borderRadius: 10,
        background: 'transparent', border: '1px solid ' + S.rule,
        color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <AlertTriangle size={14} strokeWidth={1.5} />
      {t('panic.button_label')}
    </button>
  )
}
