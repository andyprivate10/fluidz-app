import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Mail, Ghost, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { colors, fonts, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors
const R = radius

const AUTH_TIMEOUT = 10000 // 10s timeout on auth calls

function withTimeout<T>(promise: Promise<T>, ms = AUTH_TIMEOUT): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms)
    ),
  ])
}

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'
  const startSignup = searchParams.get('signup') === '1'
  const isDev = searchParams.get('dev') === '1' || import.meta.env.DEV || window.location.hostname === 'localhost'

  const [mode, setMode] = useState<'login' | 'signup'>(startSignup ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [signupNeedsConfirm, setSignupNeedsConfirm] = useState(false)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const iv = setInterval(() => setCooldown(prev => prev <= 1 ? 0 : prev - 1), 1000)
    return () => clearInterval(iv)
  }, [cooldown])

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  async function checkProfileAndRedirect(userId: string) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name, profile_json')
      .eq('id', userId)
      .maybeSingle()
    const pj = profile?.profile_json
    const isOnboarded = pj?.onboarding_done || pj?.avatar_url || pj?.role || (profile?.display_name && profile.display_name !== 'Anonymous')
    if (!profile || !isOnboarded) {
      navigate('/onboarding')
    } else {
      navigate(next)
    }
  }

  async function handleEmailPassword() {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!validateEmail(trimmed)) { setError(t('auth.error_invalid_email')); return }
    if (password.length < 6) { setError(t('auth.password_min')); return }

    if (mode === 'signup') {
      if (password !== confirmPassword) { setError(t('auth.error_password_mismatch')); return }
      setLoading(true)
      try {
        const { data, error: err } = await withTimeout(supabase.auth.signUp({ email: trimmed, password }))
        if (err) {
          setLoading(false)
          console.error('Signup error:', err.message)
          if (err.message.includes('already registered') || err.message.includes('already exists')) {
            setError(t('auth.error_account_exists'))
          } else if (err.message.includes('rate limit')) {
            setError(t('auth.error_rate_limit'))
          } else {
            setError(err.message)
          }
          return
        }
        if (data.user) {
          // Auto-login after signup
          const { error: loginErr } = await withTimeout(supabase.auth.signInWithPassword({ email: trimmed, password }))
          if (loginErr) {
            // Signup succeeded but needs email confirmation
            setSignupNeedsConfirm(true)
            setLoading(false)
            return
          }
          setLoading(false)
          navigate('/onboarding')
        }
      } catch (e: any) {
        setLoading(false)
        if (e?.message === 'AUTH_TIMEOUT') {
          console.error('Signup timeout')
          setError(t('auth.error_timeout'))
        } else {
          console.error('Signup unexpected error:', e)
          setError(e?.message || 'Unknown error')
        }
        return
      }
    } else {
      setLoading(true)
      try {
        const { data, error: err } = await withTimeout(supabase.auth.signInWithPassword({ email: trimmed, password }))
        if (err) {
          setLoading(false)
          console.error('Login error:', err.message)
          if (err.message.includes('Invalid login') || err.message.includes('invalid')) {
            setError(t('auth.error_wrong_password'))
          } else if (err.message.includes('Email not confirmed')) {
            setError(t('auth.error_email_not_confirmed'))
          } else if (err.message.includes('rate limit')) {
            setError(t('auth.error_rate_limit'))
          } else {
            setError(err.message)
          }
          return
        }
        if (data.user) {
          if (next && next !== '/') {
            try { localStorage.setItem('auth_redirect', next) } catch (_) {}
          }
          setLoading(false)
          await checkProfileAndRedirect(data.user.id)
        }
      } catch (e: any) {
        setLoading(false)
        if (e?.message === 'AUTH_TIMEOUT') {
          console.error('Login timeout')
          setError(t('auth.error_timeout'))
        } else {
          console.error('Login unexpected error:', e)
          setError(e?.message || 'Unknown error')
        }
      }
    }
  }

  async function handleMagicLink() {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!validateEmail(trimmed)) { setError(t('auth.error_invalid_email')); return }
    if (cooldown > 0) return
    setLoading(true)
    try {
      const { error: err } = await withTimeout(supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + next },
      }))
      if (err) {
        setLoading(false)
        console.error('Magic link error:', err.message)
        if (err.message.includes('rate limit')) setError(t('auth.error_rate_limit'))
        else setError(err.message)
        return
      }
      setMagicLinkSent(true)
      setLoading(false)
      if (next && next !== '/') {
        try { localStorage.setItem('auth_redirect', next) } catch (_) {}
      }
      setCooldown(60)
    } catch (e: any) {
      setLoading(false)
      if (e?.message === 'AUTH_TIMEOUT') {
        console.error('Magic link timeout')
        setError(t('auth.error_timeout'))
      } else {
        console.error('Magic link unexpected error:', e)
        setError(e?.message || 'Unknown error')
      }
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  // Quick dev login
  const [devLoading, setDevLoading] = useState('')
  async function quickDevLogin(account: string) {
    const email = `${account}@fluidz.test`
    setDevLoading(account)
    try {
      const { data, error: err } = await withTimeout(supabase.auth.signInWithPassword({ email, password: 'testpass123' }))
      if (err) { showToast(err.message, 'error'); setDevLoading(''); return }
      if (data.user) {
        await supabase.from('user_profiles').upsert({ id: data.user.id, display_name: account.charAt(0).toUpperCase() + account.slice(1) })
        navigate(next)
      }
    } catch (e: any) {
      if (e?.message === 'AUTH_TIMEOUT') {
        showToast(t('auth.error_timeout'), 'error')
      } else {
        console.error('Dev login error:', e)
        showToast(e?.message || 'Unknown error', 'error')
      }
    }
    setDevLoading('')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: R.block,
    padding: '14px 16px', border: `1px solid ${S.rule}`, outline: 'none',
    fontSize: 15, fontFamily: fonts.body, letterSpacing: '-0.02em',
    boxSizing: 'border-box',
  }

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: S.rule }} />
      <span style={{ fontSize: 12, color: S.tx4, fontWeight: 600 }}>{t('auth.or')}</span>
      <div style={{ flex: 1, height: 1, background: S.rule }} />
    </div>
  )

  if (signupNeedsConfirm) {
    return (
      <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />
        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }} className="animate-slide-up">
          <div style={{ background: S.bg1, borderRadius: R.card, padding: 32, border: `1px solid ${S.sagebd}`, textAlign: 'center' }}>
            <Mail size={32} strokeWidth={1.5} style={{ color: S.sage, marginBottom: 14 }} />
            <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px' }}>{t('auth.signup_success_title')}</h2>
            <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>
              {t('auth.signup_confirm_instructions', { email })}
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
            <button onClick={() => { setSignupNeedsConfirm(false); setMode('login') }} style={{
              background: 'none', border: 'none', ...typeStyle('label'),
              color: S.p, cursor: 'pointer',
            }}>
              {t('auth.back_to_login')}
            </button>
          </div>
          <p style={{ ...typeStyle('meta'), color: S.tx3, marginTop: 14, textAlign: 'center' }}>{t('auth.check_spam')}</p>
        </div>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />
        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }} className="animate-slide-up">
          <div style={{ background: S.bg1, borderRadius: R.card, padding: 32, border: `1px solid ${S.sagebd}`, textAlign: 'center' }}>
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
              {cooldown > 0 ? t('auth.cooldown', { seconds: cooldown }) : t('auth.resend_link')}
            </button>
          </div>
          <p style={{ ...typeStyle('meta'), color: S.tx3, marginTop: 14, textAlign: 'center' }}>{t('auth.check_spam')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 10px', fontSize: 32, fontFamily: fonts.hero }}>fluidz</h1>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>{t('auth.subtitle')}</p>
        </div>

        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* DEV Quick Login */}
          {isDev && (
            <div style={{ background: S.p2, borderRadius: R.card, padding: 14, border: `1px solid ${S.pbd}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Zap size={14} style={{ color: S.p }} />
                <span style={{ ...typeStyle('micro'), color: S.p, fontWeight: 700 }}>DEV QUICK LOGIN</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { name: 'marcus', label: 'Marcus (Host)' },
                  { name: 'karim', label: 'Karim' },
                  { name: 'yann', label: 'Yann' },
                ] as const).map(a => (
                  <button
                    key={a.name}
                    onClick={() => quickDevLogin(a.name)}
                    disabled={!!devLoading}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: R.chip,
                      ...typeStyle('label'), fontSize: 12, color: '#fff', background: S.p,
                      border: 'none', cursor: devLoading ? 'not-allowed' : 'pointer',
                      opacity: devLoading && devLoading !== a.name ? 0.5 : 1,
                    }}
                  >
                    {devLoading === a.name ? '...' : a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* METHOD 1: Email + Password */}
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: R.card, padding: 24, border: `1px solid ${S.rule2}`, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder={t('auth.email_placeholder')} type="email" autoFocus
                style={inp}
              />
              <div style={{ position: 'relative' }}>
                <input
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder={t('auth.password')} type={showPassword ? 'text' : 'password'}
                  onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleEmailPassword()}
                  style={{ ...inp, paddingRight: 44 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                }}>
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.5} style={{ color: S.tx3 }} />
                    : <Eye size={16} strokeWidth={1.5} style={{ color: S.tx3 }} />}
                </button>
              </div>

              {mode === 'signup' && (
                <input
                  value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder={t('auth.confirm_password')} type={showPassword ? 'text' : 'password'}
                  onKeyDown={e => e.key === 'Enter' && handleEmailPassword()}
                  style={inp}
                />
              )}

              {error && (
                <p style={{ ...typeStyle('label'), color: S.red, margin: 0 }}>{error}</p>
              )}

              <button onClick={handleEmailPassword} disabled={loading || !email.trim() || !password} style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: 16, borderRadius: R.btn, ...typeStyle('section'),
                color: '#fff', background: S.p, border: 'none',
                cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !email.trim() || !password ? 0.5 : 1,
                boxShadow: `0 4px 24px ${S.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading
                  ? t('auth.sending')
                  : <>{mode === 'login' ? t('auth.login_button') : t('auth.signup_button')} <ArrowRight size={16} strokeWidth={2} /></>}
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
              </button>

              {mode === 'signup' && (
                <p style={{ ...typeStyle('meta'), color: S.tx3, margin: 0, textAlign: 'center' }}>
                  {t('auth.password_min')}
                </p>
              )}

              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setConfirmPassword('') }} style={{
                background: 'none', border: 'none', ...typeStyle('label'), color: S.p, cursor: 'pointer', textAlign: 'center', padding: 4,
              }}>
                {mode === 'login' ? t('auth.switch_to_signup') : t('auth.switch_to_login')}
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: 14, borderRadius: R.btn, fontSize: 15, fontWeight: 600,
            background: '#fff', color: '#333', border: '1px solid #ddd', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: fonts.body,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t('auth.google')}
          </button>

          {divider}

          {/* METHOD 2: Magic Link */}
          <button onClick={handleMagicLink} disabled={loading || !email.trim() || cooldown > 0} style={{
            width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
            color: S.tx, border: `1px solid ${S.rule2}`, background: S.bg2,
            cursor: loading || !email.trim() || cooldown > 0 ? 'not-allowed' : 'pointer',
            opacity: loading || !email.trim() || cooldown > 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Mail size={15} strokeWidth={1.5} style={{ color: S.p }} />
            {cooldown > 0 ? t('auth.cooldown', { seconds: cooldown }) : t('auth.magic_link')}
          </button>

          {divider}

          {/* METHOD 3: Ghost Mode */}
          <div style={{ background: S.lavbg, borderRadius: R.card, padding: 20, border: `1px solid ${S.lavbd}` }}>
            <p style={{ ...typeStyle('label'), color: S.lav, margin: '0 0 6px' }}>{t('auth.ghost_title')}</p>
            <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '0 0 14px', lineHeight: 1.5 }}>{t('auth.ghost_desc')}</p>
            <button onClick={() => navigate('/ghost/setup' + (next !== '/' ? '?invite_code=' + next.split('/').pop() : ''))} style={{
              width: '100%', padding: 12, borderRadius: R.btn, ...typeStyle('label'),
              color: S.lav, border: `1px solid ${S.lavbd}`, background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Ghost size={15} strokeWidth={1.5} /> {t('auth.ghost_cta')}
            </button>
          </div>

          <button onClick={() => navigate('/ghost/recover')} style={{
            background: 'none', border: 'none', ...typeStyle('meta'), color: S.tx3, cursor: 'pointer', textAlign: 'center', padding: 8,
          }}>
            {t('auth.ghost_recover')}
          </button>

        </div>

      </div>
    </div>
  )
}
