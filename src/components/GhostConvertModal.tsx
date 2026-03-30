import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { colors, fonts } from '../brand'

const S = colors

interface Props {
  open: boolean
  onClose: () => void
  onConverted?: () => void
}

export default function GhostConvertModal({ open, onClose, onConverted }: Props) {
  const { t } = useTranslation()
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
        await supabase.auth.refreshSession()
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
      // Google OAuth will redirect — success handled on return
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
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
        maxWidth: 480, margin: '0 auto',
        background: S.bg1, borderTop: '1px solid ' + S.rule2,
        borderRadius: '24px 24px 0 0', padding: '24px 24px 32px',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: '50%',
          background: S.bg2, border: '1px solid ' + S.rule,
          color: S.tx2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} />
        </button>

        <h2 style={{ fontFamily: fonts.hero, fontSize: 20, fontWeight: 800, color: S.tx, margin: '0 0 6px' }}>
          {t('ghost_convert.title')}
        </h2>
        <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('ghost_convert.subtitle')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
              {t('ghost_convert.email_label')}
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
              {t('ghost_convert.password_label')}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} />
          </div>
          <button onClick={handleEmailConvert} disabled={loading || !email.trim() || !password.trim()} style={{
            width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15,
            color: S.tx, background: S.p, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Mail size={16} /> {t('ghost_convert.create_btn')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: S.rule }} />
          <span style={{ fontSize: 12, color: S.tx3 }}>{t('ghost_convert.or')}</span>
          <div style={{ flex: 1, height: 1, background: S.rule }} />
        </div>

        <button onClick={handleGoogleConvert} disabled={loading} style={{
          width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15,
          color: S.tx, background: S.bg2, border: '1px solid ' + S.rule2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {t('ghost_convert.google_btn')}
        </button>
      </div>
    </>
  )
}
