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
      showToast(error.message.includes('rate limit') ? t('auth.too_many') : 'Erreur: ' + error.message, 'error')
      setLoading(false); return
    }
    setStep('sent'); setLoading(false)
    if (next && next !== '/') { try { localStorage.setItem('auth_redirect', next) } catch (_) {} }
    setCooldown(60)
    const iv = setInterval(() => { setCooldown(prev => { if (prev <= 1) { clearInterval(iv); return 0 } return prev - 1 }) }, 1000)
  }

  // Dev login
  const isDev = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('dev') === '1' || import.meta.env.DEV)
  const [devEmail, setDevEmail] = useState('marcus@fluidz.test')
  const [devPass, setDevPass] = useState('testpass123')

  async function devLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass })
    if (error) { showToast('Erreur: ' + error.message, 'error'); return }
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
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 10px', fontSize: 40 }}>fluidz</h1>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>{t('auth.tagline')}</p>
        </div>

        {step === 'email' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Magic link card */}
            <div style={{ background: S.bg1, borderRadius: R.card, padding: 24, border: `1px solid ${S.rule}` }}>
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
