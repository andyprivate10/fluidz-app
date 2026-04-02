import { useState } from 'react'
import { colors, fonts } from '../brand'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { QrCode, CheckCircle } from 'lucide-react'
import PageFadeIn from '../components/PageFadeIn'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'

const S = colors

export default function ScanPage() {
  const { t } = useTranslation()
  useAuth()
  const [scannedValue, setScannedValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name?: string } | null>(null)

  async function handleConfirm() {
    const match = scannedValue.match(/^fluidz:checkin:([^:]+):([^:]+)$/)
    if (!match) {
      showToast(t('scan.invalid_code'), 'error')
      return
    }
    const sessionId = match[1]
    const guestId = match[2]
    setLoading(true)
    setResult(null)

    const { error } = await supabase
      .from('applications')
      .update({ checked_in: true, status: 'checked_in', check_in_requested: false })
      .eq('session_id', sessionId)
      .eq('applicant_id', guestId)

    if (error) {
      showToast(t('errors.error_prefix') + ': ' + error.message, 'error')
      setResult({ success: false })
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', guestId)
        .maybeSingle()
      const name = profile?.display_name || t('common.anonymous')
      showToast(t('scan.checkin_confirmed', { name }), 'success')
      setResult({ success: true, name })
    }
    setLoading(false)
  }

  return (
    <PageFadeIn>
      <div style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '48px 20px 96px' }}>
        <OrbLayer />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>{t('scan.title')}</h1>
          <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 24px' }}>{t('scan.subtitle')}</p>

          {result?.success ? (
            <div style={{ background: S.sagebg, border: '1px solid ' + S.sagebd, borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <CheckCircle size={32} strokeWidth={1.5} style={{ color: S.sage, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: S.sage, margin: '0 0 4px' }}>{t('scan.success')}</p>
              <p style={{ fontSize: 14, color: S.tx, margin: 0 }}>{result.name}</p>
              <button onClick={() => { setResult(null); setScannedValue('') }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, border: '1px solid ' + S.sagebd, background: 'transparent', color: S.sage, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('scan.scan_another')}
              </button>
            </div>
          ) : (
            <div style={{ background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 16, padding: 20 }}>
              <div style={{ textAlign: 'center', padding: '24px 0', marginBottom: 16 }}>
                <QrCode size={48} strokeWidth={1.5} style={{ color: S.tx3 }} />
                <p style={{ fontSize: 12, color: S.tx4, margin: '8px 0 0' }}>{t('scan.manual_hint')}</p>
              </div>
              <label style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                {t('scan.manual_label')}
              </label>
              <input
                type="text"
                value={scannedValue}
                onChange={e => setScannedValue(e.target.value)}
                placeholder="fluidz:checkin:..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, background: S.bg,
                  border: '1px solid ' + S.rule, color: S.tx, fontSize: 13, outline: 'none',
                  fontFamily: fonts.body, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleConfirm}
                disabled={loading || !scannedValue.trim()}
                style={{
                  width: '100%', marginTop: 12, padding: 14, borderRadius: 12,
                  background: loading ? S.bg1 : S.p, border: 'none',
                  color: S.tx, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                  opacity: loading || !scannedValue.trim() ? 0.5 : 1,
                }}
              >
                {loading ? t('common.loading') : t('scan.confirm')}
              </button>
              {result?.success === false && (
                <p style={{ fontSize: 12, color: S.red, margin: '10px 0 0', textAlign: 'center' }}>{t('scan.error')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageFadeIn>
  )
}
