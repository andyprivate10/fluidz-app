import { Mail } from 'lucide-react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface Props {
  email: string
  setEmail: (v: string) => void
  loading: boolean
  msg: string
  hasGuestToken: boolean
  sendMagicLink: () => void
  inputStyle: React.CSSProperties
}

export default function MeLoginForm({ email, setEmail, loading, msg, hasGuestToken, sendMagicLink, inputStyle }: Props) {
  const { t } = useTranslation()
  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 96px' }}>
      {hasGuestToken && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: S.p2, border: '1px solid ' + S.pbd, maxWidth: 360, width: '100%' }}>
          <p style={{ margin: 0, fontSize: 13, color: S.tx, fontWeight: 600 }}>{t('me.guest_warning')}</p>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: S.tx2 }}>{t('me.guest_warning_desc')}</p>
        </div>
      )}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, background: S.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px' }}>fluidz</h1>
        <p style={{ color: S.tx3, fontSize: 14 }}>{t('me.login_prompt')}</p>
      </div>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('profile.placeholder_email')} style={{ ...inputStyle, maxWidth: 360, marginBottom: 12 }} onKeyDown={e => e.key === 'Enter' && sendMagicLink()} />
      <button onClick={sendMagicLink} disabled={loading} style={{ width: '100%', maxWidth: 360, padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: S.tx, background: S.grad, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: `0 4px 20px ${S.p}44` }}>
        {loading ? t('me.sending') : hasGuestToken ? t('me.create_account') : <><Mail size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />{t('me.send_magic_link')}</>}
      </button>
      {msg && <p style={{ marginTop: 16, fontSize: 13, color: S.tx2, textAlign: 'center' }}>{msg}</p>}
    </div>
  )
}
