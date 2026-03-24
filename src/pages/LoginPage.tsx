import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Mail, Ghost, ArrowRight } from 'lucide-react'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors
const R = radius

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleMagicLink() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) { showToast(t('auth.email_invalid'), 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + next },
    })
    if (error) {
      showToast(error.message.includes('rate limit') ? t('auth.too_many') : t('common.error') + ': ' + error.message, 'error')
      setLoading(false); return
    }
    setStep('sent'); setLoading(false)
    if (next && next !== '/') { try { localStorage.setItem('auth_redirect', next) } catch (_) {} }
    setCooldown(60)
    const iv = setInterval(() => { setCooldown(prev => { if (prev <= 1) { clearInterval(iv); return 0 } return prev - 1 }) }, 1000)
  }

  // Dev login
  const isDev = import.meta.env.DEV
  const [devEmail, setDevEmail] = useState('marcus@fluidz.test')
  const [devPass, setDevPass] = useState('testpass123')

  async function devLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass })
    if (error) { showToast(t('common.error') + ': ' + error.message, 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('user_profiles').upsert({ id: user.id, display_name: devEmail.split('@')[0] || 'Dev' })
    navigate(next)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: R.block,
    padding: '14px 16px', border: `1px solid ${S.rule}`, outline: 'none',
    fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em',
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 10px', fontSize: 40 }}>fluidz</h1>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>{t('auth.tagline')}</p>
        </div>

        {step === 'email' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Google OAuth */}
            <button onClick={async () => {
              await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })
            }} style={{
              width: '100%', padding: 14, borderRadius: R.btn, fontSize: 15, fontWeight: 600,
              background: '#fff', color: '#333', border: '1px solid #ddd', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {t('auth.google')}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0' }}>
              <div style={{ flex: 1, height: 1, background: S.rule }} />
              <span style={{ fontSize: 12, color: S.tx4, fontWeight: 600 }}>{t('auth.or_email')}</span>
              <div style={{ flex: 1, height: 1, background: S.rule }} />
            </div>

            {/* Magic link card */}
            <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: R.card, padding: 24, border: `1px solid ${S.rule2}`, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Mail size={16} strokeWidth={1.5} style={{ color: S.p }} />
                <span style={{ ...typeStyle('label'), color: S.tx }}>{t('auth.email_login')}</span>
              </div>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                placeholder={t('auth.email_placeholder')} type="email" autoFocus
                style={inp}
              />
              <button onClick={handleMagicLink} disabled={loading || !email.trim()} style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: 16, borderRadius: R.btn, ...typeStyle('section'),
                color: '#fff', background: S.p, border: 'none', marginTop: 14,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !email.trim() ? 0.5 : 1,
                boxShadow: `0 4px 24px ${S.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? t('auth.sending') : <>{t('auth.send_magic_link')} <ArrowRight size={16} strokeWidth={2} /></>}
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
              </button>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: S.rule }} />
              <span style={{ ...typeStyle('meta'), color: S.tx3 }}>{t('auth.or')}</span>
              <div style={{ flex: 1, height: 1, background: S.rule }} />
            </div>

            {/* Ghost */}
            <button onClick={() => navigate('/ghost/setup' + (next !== '/' ? '?invite_code=' + next.split('/').pop() : ''))} style={{
              width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
              color: S.lav, border: `1px solid ${S.lavbd}`, background: S.lavbg,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Ghost size={15} strokeWidth={1.5} /> {t('home.ghost_mode')}
            </button>

            <button onClick={() => navigate('/ghost/recover')} style={{
              background: 'none', border: 'none', ...typeStyle('meta'), color: S.tx3, cursor: 'pointer', textAlign: 'center', padding: 8,
            }}>
              {t('auth.ghost_recover')}
            </button>

            {/* Dev */}
            {isDev && (
              <div style={{ marginTop: 16, background: S.bg2, borderRadius: R.block, padding: 14, border: `1px solid ${S.rule2}` }}>
                <p style={{ ...typeStyle('micro'), color: S.red, margin: '0 0 8px' }}>DEV LOGIN</p>
                <input value={devEmail} onChange={e => setDevEmail(e.target.value)} placeholder="email" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <input value={devPass} onChange={e => setDevPass(e.target.value)} placeholder="password" type="password" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <button onClick={devLogin} style={{ width: '100%', padding: 8, borderRadius: R.chip, ...typeStyle('label'), color: S.red, border: `1px solid ${S.red}3d`, background: 'transparent', cursor: 'pointer' }}>DEV Sign in</button>
              </div>
            )}
          </div>
        )}

        {step === 'sent' && (
          <div className="animate-slide-up" style={{ textAlign: 'center' }}>
            <div style={{ background: S.bg1, borderRadius: R.card, padding: 32, border: `1px solid ${S.sagebd}` }}>
              <Mail size={32} strokeWidth={1.5} style={{ color: S.sage, marginBottom: 14 }} />
              <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px' }}>{t('auth.link_sent')}</h2>
              <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>
                {t('auth.check_email_instructions', { email })}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                <a href="https://mail.google.com" target="_blank" rel="noopener" style={{
                  padding: '9px 16px', borderRadius: R.chip, background: S.bg2, border: `1px solid ${S.rule}`,
                  ...typeStyle('label'), color: S.tx2, textDecoration: 'none',
                }}>Gmail</a>
                <a href="https://outlook.live.com" target="_blank" rel="noopener" style={{
                  padding: '9px 16px', borderRadius: R.chip, background: S.bg2, border: `1px solid ${S.rule}`,
                  ...typeStyle('label'), color: S.tx2, textDecoration: 'none',
                }}>Outlook</a>
              </div>
              <button onClick={handleMagicLink} disabled={cooldown > 0 || loading} style={{
                background: 'none', border: 'none', ...typeStyle('label'),
                color: cooldown > 0 ? S.tx3 : S.p, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              }}>
                {cooldown > 0 ? t('auth.resend_cooldown', { seconds: cooldown }) : t('auth.resend_link')}
              </button>
            </div>
            <p style={{ ...typeStyle('meta'), color: S.tx3, marginTop: 14 }}>{t('auth.check_spam')}</p>
          </div>
        )}

      </div>
    </div>
  )
}
