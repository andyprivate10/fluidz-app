import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { colors, fonts } from '../brand'

const S = colors

interface Props {
  open: boolean
  onClose: () => void
  onConverted?: () => void
}

export default function GhostBlockedModal({ open, onClose, onConverted }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleEmailConvert() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim(), password: password.trim() })
      if (error) {
        showToast(error.message, 'error')
      } else {
        showToast(t('ghost_convert.success'), 'success')
        onConverted?.()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleConvert() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: 12,
    padding: '12px 14px', border: '1px solid ' + S.rule, outline: 'none',
    fontSize: 14, fontFamily: fonts.body, boxSizing: 'border-box',
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 301,
        width: 'calc(100% - 48px)', maxWidth: 380,
        background: S.bg1, border: '1px solid ' + S.rule2,
        borderRadius: 24, padding: 28, textAlign: 'center',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: '50%',
          background: S.bg2, border: '1px solid ' + S.rule,
          color: S.tx2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={14} />
        </button>

        <Lock size={32} style={{ color: S.p, marginBottom: 12 }} />
        <h2 style={{ fontFamily: fonts.hero, fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 16px', lineHeight: 1.2 }}>
          {t('ghost_convert.blocked_title')}
        </h2>

        {!showForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setShowForm(true)} style={{
              width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 14,
              color: S.tx, background: S.p, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Mail size={16} /> {t('ghost_convert.blocked_email_btn')}
            </button>
            <button onClick={handleGoogleConvert} disabled={loading} style={{
              width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 14,
              color: S.tx, background: S.bg2, border: '1px solid ' + S.rule2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {t('ghost_convert.blocked_google_btn')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('ghost_convert.email_label')} style={inp} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('ghost_convert.password_label')} style={inp} />
            <button onClick={handleEmailConvert} disabled={loading || !email.trim() || !password.trim()} style={{
              width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 14,
              color: S.tx, background: S.p, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1,
            }}>
              {t('ghost_convert.create_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
