import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {Ghost, Copy, Check, ArrowRight, ArrowLeft} from 'lucide-react'
import { showToast } from '../components/Toast'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function GhostSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') || ''
  const inviteCode = searchParams.get('invite_code') || ''

  const [step, setStep] = useState<'name' | 'pin' | 'done'>('name')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [ghostCode, setGhostCode] = useState('')
  const [ghostId, setGhostId] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  async function handleCreate() {
    if (!displayName.trim()) { showToast('Choisis un pseudo', 'error'); return }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { showToast('Le code secret doit faire 4 chiffres', 'error'); return }

    setLoading(true)
    const code = generateCode()

    const { data, error } = await supabase.from('ghost_sessions').insert({
      session_code: code,
      secret_pin: pin,
      display_name: displayName.trim(),
      profile_json: {},
    }).select('id, session_code').single()

    if (error) {
      // Code collision — retry once
      if (error.code === '23505') {
        const code2 = generateCode()
        const { data: d2, error: e2 } = await supabase.from('ghost_sessions').insert({
          session_code: code2,
          secret_pin: pin,
          display_name: displayName.trim(),
          profile_json: {},
        }).select('id, session_code').single()
        if (e2) { showToast('Erreur: ' + e2.message, 'error'); setLoading(false); return }
        setGhostCode(d2.session_code)
        setGhostId(d2.id)
      } else {
        showToast('Erreur: ' + error.message, 'error')
        setLoading(false)
        return
      }
    } else {
      setGhostCode(data.session_code)
      setGhostId(data.id)
    }

    // Store ghost info in localStorage for this session
    try {
      localStorage.setItem('ghost_id', data?.id || ghostId)
      localStorage.setItem('ghost_code', data?.session_code || ghostCode)
      localStorage.setItem('ghost_name', displayName.trim())
    } catch (_) {}

    setStep('done')
    setLoading(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(ghostCode).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  function goToApply() {
    const gId = ghostId || localStorage.getItem('ghost_id') || ''
    if (sessionId) {
      navigate(`/session/${sessionId}/apply?ghost_id=${gId}`)
    } else if (inviteCode) {
      navigate(`/join/${inviteCode}?ghost_id=${gId}`)
    } else {
      navigate('/')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.bg2, color: S.tx, borderRadius: 14,
    padding: '14px 16px', border: '1px solid ' + S.rule, outline: 'none',
    fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box',
    textAlign: 'center',
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Ghost size={40} style={{ color: S.p, marginBottom: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.tx, margin: '0 0 6px' }}>Mode Ghost ◌</h1>
          <p style={{ color: S.tx3, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Profil temporaire 24h. Pas d'email, pas de compte. Tu peux le convertir plus tard.
          </p>
        </div>

        {step === 'name' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ton pseudo</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Alex, Le Beau Gosse..."
                maxLength={30}
                autoFocus
                style={inp}
              />
            </div>
            <button
              onClick={() => {
                if (!displayName.trim()) { showToast('Choisis un pseudo', 'error'); return }
                setStep('pin')
              }}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(244,114,114,0.3)' }}
            >
              Suivant →
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code secret (4 chiffres)</label>
              <input
                value={pin}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPin(v)
                }}
                placeholder="• • • •"
                maxLength={4}
                inputMode="numeric"
                autoFocus
                style={{ ...inp, fontSize: 28, fontWeight: 800, letterSpacing: '0.3em' }}
              />
              <p style={{ fontSize: 11, color: S.tx4, margin: '8px 0 0', textAlign: 'center' }}>
                Pour retrouver ton profil si tu fermes l'app
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || pin.length !== 4}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || pin.length !== 4 ? 0.7 : 1 }}
            >
              {loading ? 'Création...' : 'Créer mon profil ghost'}
            </button>
            <button onClick={() => setStep('name')} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={16} strokeWidth={1.5} />Retour
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ background: S.bg1, border: '1px solid ' + S.sage + '44', borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 14, color: S.sage, fontWeight: 700, marginBottom: 16 }}>Profil ghost créé ✓</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Ton code de récupération</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: S.p, letterSpacing: '0.15em', fontFamily: 'monospace' }}>{ghostCode}</span>
                  <button onClick={copyCode} style={{ background: codeCopied ? S.sage + '22' : S.bg2, border: '1px solid ' + (codeCopied ? S.sage : S.rule), borderRadius: 10, padding: 8, cursor: 'pointer', color: codeCopied ? S.sage : S.tx3 }}>
                    {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ background: S.bg, borderRadius: 12, padding: '10px 16px', border: '1px solid ' + S.rule }}>
                  <div style={{ fontSize: 10, color: S.tx4, fontWeight: 600 }}>PSEUDO</div>
                  <div style={{ fontSize: 14, color: S.tx, fontWeight: 700 }}>{displayName}</div>
                </div>
                <div style={{ background: S.bg, borderRadius: 12, padding: '10px 16px', border: '1px solid ' + S.rule }}>
                  <div style={{ fontSize: 10, color: S.tx4, fontWeight: 600 }}>PIN</div>
                  <div style={{ fontSize: 14, color: S.tx, fontWeight: 700 }}>{'•'.repeat(4)}</div>
                </div>
              </div>

              <div style={{ background: S.orange + '14', border: '1px solid ' + S.orange + '33', borderRadius: 12, padding: 12, marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: S.orange, margin: 0, fontWeight: 600 }}>
                  ⏳ Profil valide 24h. Note ce code pour retrouver ton profil !
                </p>
              </div>
            </div>

            <button
              onClick={goToApply}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(244,114,114,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Continuer <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/ghost/recover')}
              style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 12, cursor: 'pointer', padding: 8 }}
            >
              J'ai déjà un code → Récupérer mon profil
            </button>
          </div>
        )}

        {/* Recovery link */}
        {step !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => navigate('/ghost/recover' + (sessionId ? '?session_id=' + sessionId : inviteCode ? '?invite_code=' + inviteCode : ''))}
              style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              J'ai déjà un code → Récupérer mon profil
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
