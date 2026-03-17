import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Mail, Ghost } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

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
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + next,
      },
    })

    if (error) {
      if (error.message.includes('rate limit')) {
        showToast('Trop de tentatives. Attends 15-30 min.', 'error')
      } else {
        showToast('Erreur: ' + error.message, 'error')
      }
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
    // Store redirect URL for post-auth
    if (next && next !== '/') {
      try { localStorage.setItem('auth_redirect', next) } catch (_) {}
    }

    // Cooldown 60s
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // Dev password login (only in dev mode)
  const isDev = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('dev') === '1' || import.meta.env.DEV)
  const [devEmail, setDevEmail] = useState('marcus@fluidz.test')
  const [devPass, setDevPass] = useState('testpass123')

  async function devLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass })
    if (error) { showToast('Erreur: ' + error.message, 'error'); return }
    // Auto-create profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_profiles').upsert({ id: user.id, display_name: devEmail.split('@')[0] || 'Dev' })
    }
    navigate(next)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: 14,
    padding: '14px 16px', border: '1px solid ' + S.border, outline: 'none',
    fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: S.bg0, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: S.p300, margin: '0 0 8px' }}>fluidz</h1>
          <p style={{ color: S.tx3, fontSize: 14, margin: 0 }}>Recrute ton groupe pour ce soir</p>
        </div>

        {step === 'email' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Magic link */}
            <div style={{ background: S.bg1, borderRadius: 20, padding: 20, border: '1px solid ' + S.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Mail size={18} style={{ color: S.p300 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>Connexion par email</span>
              </div>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                placeholder="ton@email.com"
                type="email"
                autoFocus
                style={inp}
              />
              <button
                onClick={handleMagicLink}
                disabled={loading || !email.trim()}
                style={{
                  width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15,
                  color: '#fff', background: S.grad, border: 'none', marginTop: 12,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !email.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 20px ' + S.p400 + '44',
                }}
              >
                {loading ? 'Envoi...' : 'Envoyer le lien magique →'}
              </button>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: S.border }} />
              <span style={{ fontSize: 12, color: S.tx4, fontWeight: 600 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: S.border }} />
            </div>

            {/* Ghost mode */}
            <button
              onClick={() => navigate('/ghost/setup' + (next !== '/' ? '?invite_code=' + next.split('/').pop() : ''))}
              style={{
                width: '100%', padding: 14, borderRadius: 14, fontWeight: 600, fontSize: 14,
                color: S.tx3, border: '1px solid ' + S.border, background: S.bg1,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Ghost size={16} /> Mode Ghost (24h, sans inscription)
            </button>

            {/* Ghost recover */}
            <button
              onClick={() => navigate('/ghost/recover')}
              style={{ background: 'none', border: 'none', color: S.tx4, fontSize: 12, cursor: 'pointer', textAlign: 'center', padding: 8 }}
            >
              J'ai un code ghost → Récupérer mon profil
            </button>

            {/* Dev login */}
            {isDev && (
              <div style={{ marginTop: 16, background: '#450a0a', borderRadius: 12, padding: 12, border: '1px solid #7f1d1d' }}>
                <p style={{ fontSize: 11, color: '#F87171', fontWeight: 700, margin: '0 0 8px' }}>DEV LOGIN</p>
                <input value={devEmail} onChange={e => setDevEmail(e.target.value)} placeholder="email" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <input value={devPass} onChange={e => setDevPass(e.target.value)} placeholder="password" type="password" style={{ ...inp, fontSize: 12, padding: '8px 12px', marginBottom: 6 }} />
                <button onClick={devLogin} style={{ width: '100%', padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#F87171', border: '1px solid #7f1d1d', background: 'transparent', cursor: 'pointer' }}>DEV Sign in</button>
              </div>
            )}
          </div>
        )}

        {step === 'sent' && (
          <div className="animate-slide-up" style={{ textAlign: 'center' }}>
            <div style={{ background: S.bg1, borderRadius: 20, padding: 28, border: '1px solid ' + S.green + '44' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 8px' }}>Lien envoyé !</h2>
              <p style={{ color: S.tx2, fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
                Ouvre <strong>{email}</strong> et clique sur le lien pour te connecter.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                <a href="https://mail.google.com" target="_blank" rel="noopener" style={{ padding: '8px 16px', borderRadius: 10, background: S.bg2, border: '1px solid ' + S.border, color: S.tx2, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Ouvrir Gmail
                </a>
                <a href="https://outlook.live.com" target="_blank" rel="noopener" style={{ padding: '8px 16px', borderRadius: 10, background: S.bg2, border: '1px solid ' + S.border, color: S.tx2, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Ouvrir Outlook
                </a>
              </div>
              <button
                onClick={handleMagicLink}
                disabled={cooldown > 0 || loading}
                style={{
                  background: 'none', border: 'none', color: cooldown > 0 ? S.tx4 : S.p300,
                  fontSize: 13, cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontWeight: 600,
                }}
              >
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le lien'}
              </button>
            </div>
            <p style={{ color: S.tx4, fontSize: 11, marginTop: 12 }}>
              Vérifie tes spams si tu ne trouves pas l'email
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
