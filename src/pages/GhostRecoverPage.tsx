import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {Ghost, ArrowRight, Mail, ArrowLeft} from 'lucide-react'
import { showToast } from '../components/Toast'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors

export default function GhostRecoverPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') || ''
  const inviteCode = searchParams.get('invite_code') || ''

  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [ghost, setGhost] = useState<{ id: string; display_name: string; profile_json: any; expires_at: string } | null>(null)
  const [convertEmail, setConvertEmail] = useState('')
  const [converting, setConverting] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  async function handleRecover() {
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length !== 6) { showToast('Le code fait 6 caractères', 'error'); return }
    if (pin.length !== 4) { showToast('Le PIN fait 4 chiffres', 'error'); return }

    setLoading(true)
    const { data, error } = await supabase.from('ghost_sessions')
      .select('id, display_name, profile_json, expires_at, is_expired, claimed_user_id')
      .eq('session_code', cleanCode)
      .eq('secret_pin', pin)
      .maybeSingle()

    if (error || !data) {
      showToast('Code ou PIN incorrect', 'error')
      setLoading(false)
      return
    }

    if (data.claimed_user_id) {
      showToast('Ce ghost a déjà été converti en compte', 'error')
      setLoading(false)
      return
    }

    if (data.is_expired || new Date(data.expires_at) < new Date()) {
      showToast('Ce profil ghost a expiré (24h dépassées)', 'error')
      setLoading(false)
      return
    }

    setGhost(data)
    // Store in localStorage
    try {
      localStorage.setItem('ghost_id', data.id)
      localStorage.setItem('ghost_code', cleanCode)
      localStorage.setItem('ghost_name', data.display_name)
    } catch (_) {}
    setLoading(false)
  }

  async function handleConvert() {
    if (!convertEmail.trim() || !ghost) return
    setConverting(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: convertEmail.trim(),
      options: { shouldCreateUser: true },
    })

    if (error) {
      showToast('Erreur: ' + error.message, 'error')
      setConverting(false)
      return
    }

    // Store ghost ID for merge after login
    try { localStorage.setItem('ghost_merge_id', ghost.id) } catch (_) {}

    showToast('Email envoyé ! Clique le lien pour finaliser', 'info')
    setConverting(false)
    navigate('/me?ghost_merge=' + ghost.id)
  }

  function goToApply() {
    if (!ghost) return
    if (sessionId) {
      navigate(`/session/${sessionId}/apply?ghost_id=${ghost.id}`)
    } else if (inviteCode) {
      navigate(`/join/${inviteCode}?ghost_id=${ghost.id}`)
    } else {
      navigate('/')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: 14,
    padding: '14px 16px', border: '1px solid ' + S.rule, outline: 'none',
    fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
    textAlign: 'center',
  }

  const timeLeft = ghost ? Math.max(0, Math.floor((new Date(ghost.expires_at).getTime() - Date.now()) / 3600000)) : 0

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Ghost size={40} style={{ color: S.p, marginBottom: 12 }} />
          <h1 style={{ fontSize:24,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 6px' }}>Récupérer mon profil</h1>
          <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>Entre ton code de session et ton PIN</p>
        </div>

        {!ghost ? (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code de session</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="X7K9M2"
                maxLength={6}
                autoFocus
                style={{ ...inp, fontSize: 24, fontWeight: 800, letterSpacing: '0.2em', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code secret</label>
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                maxLength={4}
                inputMode="numeric"
                style={{ ...inp, fontSize: 24, fontWeight: 800, letterSpacing: '0.3em' }}
              />
            </div>
            <button
              onClick={handleRecover}
              disabled={loading || code.length !== 6 || pin.length !== 4}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || code.length !== 6 || pin.length !== 4 ? 0.7 : 1 }}
            >
              {loading ? 'Recherche...' : 'Récupérer'}
            </button>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
          </div>
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: S.bg1, border: '1px solid ' + S.sage + '44', borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: S.sage, fontWeight: 700, marginBottom: 12 }}>Profil retrouvé ✓</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.tx, marginBottom: 4 }}>{ghost.display_name}</div>
              <div style={{ fontSize: 12, color: S.tx3 }}>
                ⏳ {timeLeft > 0 ? `${timeLeft}h restantes` : 'Expire bientôt'}
              </div>
              {Object.keys(ghost.profile_json || {}).length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {ghost.profile_json.role && <span style={{ fontSize: 11, color: S.p, background: S.p2, padding: '2px 8px', borderRadius: 99 }}>{ghost.profile_json.role}</span>}
                  {ghost.profile_json.age && <span style={{ fontSize: 11, color: S.tx2, background: S.bg2, padding: '2px 8px', borderRadius: 99 }}>{ghost.profile_json.age} ans</span>}
                </div>
              )}
            </div>

            <button onClick={goToApply} style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Continuer en ghost <ArrowRight size={18} />
            </button>

            {!showConvert ? (
              <button onClick={() => setShowConvert(true)} style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.sage, border: '1px solid ' + S.sage + '44', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Mail size={16} /> Sauvegarder en vrai compte
              </button>
            ) : (
              <div style={{ background: S.bg1, borderRadius: 16, padding: 16, border: '1px solid ' + S.sage + '33' }}>
                <p style={{ fontSize: 12, color: S.sage, fontWeight: 700, margin: '0 0 10px' }}>Convertir en compte permanent</p>
                <input
                  value={convertEmail}
                  onChange={e => setConvertEmail(e.target.value)}
                  placeholder="ton@email.com"
                  type="email"
                  style={{ ...inp, textAlign: 'left', fontSize: 14, marginBottom: 10 }}
                />
                <button
                  onClick={handleConvert}
                  disabled={converting || !convertEmail.trim()}
                  style={{ width: '100%', padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#fff', background: S.sage, border: 'none', cursor: converting ? 'not-allowed' : 'pointer', opacity: converting || !convertEmail.trim() ? 0.7 : 1 }}
                >
                  {converting ? 'Envoi...' : 'Envoyer le lien de confirmation'}
                </button>
                <p style={{ fontSize: 11, color: S.tx4, margin: '8px 0 0', textAlign: 'center' }}>
                  Ton profil, tes photos et tes candidatures seront conservés
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create ghost link */}
        {!ghost && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => navigate('/ghost/setup' + (sessionId ? '?session_id=' + sessionId : inviteCode ? '?invite_code=' + inviteCode : ''))}
              style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Pas encore de profil ghost ? → Créer un profil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
