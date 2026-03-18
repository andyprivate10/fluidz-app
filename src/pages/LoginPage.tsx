import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Mail, Ghost, ArrowRight } from 'lucide-react'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'

const C = colors
const R = radius

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleMagicLink() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) { showToast('Email invalide', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + next },
    })
    if (error) {
      showToast(error.message.includes('rate limit') ? 'Trop de tentatives. Attends 15-30 min.' : 'Erreur: ' + error.message, 'error')
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
    width: '100%', background: C.bg2, color: C.tx, borderRadius: R.block,
    padding: '14px 16px', border: `1px solid ${C.rule}`, outline: 'none',
    fontSize: 15, fontFamily: 'inherit', letterSpacing: '-0.02em',
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ ...typeStyle('hero'), color: C.p, margin: '0 0 10px', fontSize: 40 }}>fluidz</h1>
          <p style={{ ...typeStyle('body'), color: C.tx2, margin: 0 }}>Recrute ton groupe pour ce soir</p>
        </div>

        {step === 'email' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Magic link card */}
            <div style={{ background: C.bg1, borderRadius: R.card, padding: 24, border: `1px solid ${C.rule}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Mail size={16} strokeWidth={1.5} style={{ color: C.p }} />
                <span style={{ ...typeStyle('label'), color: C.tx }}>Connexion par email</span>
              </div>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                placeholder="ton@email.com" type="email" autoFocus
                style={inp}
              />
              <button onClick={handleMagicLink} disabled={loading || !email.trim()} style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: 16, borderRadius: R.btn, ...typeStyle('section'),
                color: '#fff', background: C.p, border: 'none', marginTop: 14,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !email.trim() ? 0.5 : 1,
                boxShadow: `0 4px 24px ${C.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? 'Envoi...' : <>Envoyer le lien magique <ArrowRight size={16} strokeWidth={2} /></>}
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
              </button>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.rule }} />
              <span style={{ ...typeStyle('meta'), color: C.tx3 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: C.rule }} />
            </div>

            {/* Ghost */}
            <button onClick={() => navigate('/ghost/setup' + (next !== '/' ? '?invite_code=' + next.split('/').pop() : ''))} style={{
              width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
              color: C.lav, border: `1px solid ${C.lavbd}`, background: C.lavbg,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Ghost size={15} strokeWidth={1.5} /> Mode Ghost (24h, sans inscription)
            </button>

            <button onClick={() => navigate('/ghost/recover')} style={{
              background: 'none', border: 'none', ...typeStyle('meta'), color: C.tx3, cursor: 'pointer', textAlign: 'center', padding: 8,
            }}>
              J'ai un code ghost — Récupérer mon profil
            </button>

            {/* Dev */}
            {isDev && (
              <div style={{ marginTop: 16, background: C.bg2, borderRadius: R.block, padding: 14, border: `1px solid ${C.rule2}` }}>
                <p style={{ ...typeStyle('micro'), color: C.red, margin: '0 0 8px' }}>DEV LOGIN</p>
                <input value={devEmail} onChange={e => setDevEmail(e.target.value)} placeholder="email" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <input value={devPass} onChange={e => setDevPass(e.target.value)} placeholder="password" type="password" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <button onClick={devLogin} style={{ width: '100%', padding: 8, borderRadius: R.chip, ...typeStyle('label'), color: C.red, border: `1px solid rgba(248,113,113,0.24)`, background: 'transparent', cursor: 'pointer' }}>DEV Sign in</button>
              </div>
            )}
          </div>
        )}

        {step === 'sent' && (
          <div className="animate-slide-up" style={{ textAlign: 'center' }}>
            <div style={{ background: C.bg1, borderRadius: R.card, padding: 32, border: `1px solid ${C.sagebd}` }}>
              <Mail size={32} strokeWidth={1.5} style={{ color: C.sage, marginBottom: 14 }} />
              <h2 style={{ ...typeStyle('title'), color: C.tx, margin: '0 0 10px' }}>Lien envoyé</h2>
              <p style={{ ...typeStyle('body'), color: C.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>
                Ouvre <strong style={{ color: C.tx }}>{email}</strong> et clique sur le lien pour te connecter.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                <a href="https://mail.google.com" target="_blank" rel="noopener" style={{
                  padding: '9px 16px', borderRadius: R.chip, background: C.bg2, border: `1px solid ${C.rule}`,
                  ...typeStyle('label'), color: C.tx2, textDecoration: 'none',
                }}>Gmail</a>
                <a href="https://outlook.live.com" target="_blank" rel="noopener" style={{
                  padding: '9px 16px', borderRadius: R.chip, background: C.bg2, border: `1px solid ${C.rule}`,
                  ...typeStyle('label'), color: C.tx2, textDecoration: 'none',
                }}>Outlook</a>
              </div>
              <button onClick={handleMagicLink} disabled={cooldown > 0 || loading} style={{
                background: 'none', border: 'none', ...typeStyle('label'),
                color: cooldown > 0 ? C.tx3 : C.p, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              }}>
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le lien'}
              </button>
            </div>
            <p style={{ ...typeStyle('meta'), color: C.tx3, marginTop: 14 }}>Vérifie tes spams si tu ne trouves pas l'email</p>
          </div>
        )}

      </div>
    </div>
  )
}
