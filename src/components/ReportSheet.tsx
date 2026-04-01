import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { useAuth } from '../contexts/AuthContext'

const S = colors

const REASONS = [
  'fake_profile',
  'inappropriate',
  'harassment',
  'illegal_content',
  'other',
] as const

interface Props {
  open: boolean
  onClose: () => void
  targetUserId: string
  targetName: string
  context?: 'profile' | 'chat' | 'session'
}

export default function ReportSheet({ open, onClose, targetUserId, targetName, context = 'profile' }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    if (!user || !selectedReason) return
    setSending(true)

    // Auto-capture screenshot data (page URL + timestamp)
    const screenshotMeta = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      context,
      reporter_id: user.id,
      target_id: targetUserId,
      target_name: targetName,
      reason: selectedReason,
      details: details.trim() || undefined,
    }

    // Insert report into admin queue
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'report',
      title: t('report.report_title', { name: targetName }),
      body: JSON.stringify(screenshotMeta),
      href: '/profile/' + targetUserId,
    })

    setSending(false)
    onClose()
    setSelectedReason(null)
    setDetails('')
    showToast(t('report.sent_toast'), 'success')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: S.bg1, borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t('report.title')}</h3>
        <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 16px' }}>{t('report.subtitle', { name: targetName })}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {REASONS.map(reason => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              style={{
                padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                background: selectedReason === reason ? S.redbg : S.bg2,
                border: '1px solid ' + (selectedReason === reason ? S.redbd : S.rule),
                color: selectedReason === reason ? S.red : S.tx,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t('report.reason_' + reason)}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder={t('report.details_placeholder')}
          maxLength={500}
          rows={3}
          style={{ width: '100%', padding: 12, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx2, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={!selectedReason || sending} style={{ flex: 1, padding: 14, borderRadius: 14, background: selectedReason ? S.red : S.bg2, border: 'none', color: S.tx, fontSize: 14, fontWeight: 700, cursor: selectedReason ? 'pointer' : 'default', opacity: selectedReason ? 1 : 0.5 }}>
            {sending ? '...' : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
