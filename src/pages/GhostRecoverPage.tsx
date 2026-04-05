import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {Ghost, ArrowRight, Mail, ArrowLeft} from 'lucide-react'
import { showToast } from '../components/Toast'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'

const S = colors

export default function GhostRecoverPage() {
  const { t } = useTranslation()
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
    if (cleanCode.length !== 6) { showToast(t('ghost_recover.code_6_chars'), 'error'); return }
    if (pin.length !== 4) { showToast(t('ghost_recover.pin_4_digits'), 'error'); return }

    setLoading(true)
    const { data, error } = await supabase.from('ghost_sessions')
      .select('id, display_name, profile_json, expires_at, is_expired, claimed_user_id')
      .eq('session_code', cleanCode)
      .eq('secret_pin', pin)
      .maybeSingle()

    if (error || !data) {
      showToast(t('ghost_recover.wrong_code'), 'error')
      setLoading(false)
      return
    }

    if (data.claimed_user_id) {
      showToast(t('ghost.already_converted'), 'error')
      setLoading(false)
      return
    }

    if (data.is_expired || new Date(data.expires_at) < new Date()) {
      showToast(t('ghost.expired_24h'), 'error')
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
      showToast(t('errors.error_prefix') + ': ' + error.message, 'error')
      setConverting(false)
      return
    }

    // Store ghost ID for merge after login
    try { localStorage.setItem('ghost_merge_id', ghost.id) } catch (_) {}

    showToast(t('ghost.email_sent_convert'), 'info')
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
    fontSize: 16, fontFamily: fonts.body, boxSizing: 'border-box',
    textAlign: 'center',
  }

  const timeLeft = ghost ? Math.max(0, Math.floor((new Date(ghost.expires_at).getTime() - Date.now()) / 3600000)) : 0

  return (
    <div style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Ghost size={40} style={{ color: S.p, marginBottom: 12 }} />
          <h1 style={{ fontSize:24,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin: '0 0 6px' }}>{t('ghost.recover_title')}</h1>
          <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('ghost.recover_desc')}</p>
        </div>

        {!ghost ? (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ghost_recover.session_code_label')}</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder={t('placeholders.recovery_code')}
                maxLength={6}
                autoFocus
                style={{ ...inp, fontSize: 24, fontWeight: 800, letterSpacing: '0.2em', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ghost_recover.secret_code_label')}</label>
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
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: S.tx, background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || code.length !== 6 || pin.length !== 4 ? 0.7 : 1 }}
            >
              {loading ? t('common.searching_dots') : t('common.recover')}
            </button>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back_label')}</button>
          </div>
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: S.bg1, border: '1px solid ' + S.sagebd, borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: S.sage, fontWeight: 700, marginBottom: 12 }}>{t('ghost.found')}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.tx, marginBottom: 4 }}>{ghost.display_name}</div>
              <div style={{ fontSize: 12, color: S.tx3 }}>
                {timeLeft > 0 ? t('ghost.hours_left', { hours: timeLeft }) : t('ghost.expires_soon')}
              </div>
              {Object.keys(ghost.profile_json || {}).length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {ghost.profile_json.role && <span style={{ fontSize: 11, color: S.p, background: S.p2, padding: '2px 8px', borderRadius: 99 }}>{ghost.profile_json.role}</span>}
                  {ghost.profile_json.age && <span style={{ fontSize: 11, color: S.tx2, background: S.bg2, padding: '2px 8px', borderRadius: 99 }}>{ghost.profile_json.age} {t('profile.age_years')}</span>}
                </div>
              )}
            </div>

            <button onClick={goToApply} style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: S.tx, background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {t('ghost_recover.continue_ghost')} <ArrowRight size={18} />
            </button>

            {!showConvert ? (
              <button onClick={() => setShowConvert(true)} style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.sage, border: '1px solid ' + S.sagebd, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Mail size={16} /> {t('ghost.save_real_account')}
              </button>
            ) : (
              <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, padding: 16, border: '1px solid ' + S.sagebd }}>
                <p style={{ fontSize: 12, color: S.sage, fontWeight: 700, margin: '0 0 10px' }}>{t('ghost_recover.convert_title')}</p>
                <input
                  value={convertEmail}
                  onChange={e => setConvertEmail(e.target.value)}
                  placeholder="you@email.com"
                  type="email"
                  style={{ ...inp, textAlign: 'left', fontSize: 14, marginBottom: 10 }}
                />
                <button
                  onClick={handleConvert}
                  disabled={converting || !convertEmail.trim()}
                  style={{ width: '100%', padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 14, color: S.tx, background: S.sage, border: 'none', cursor: converting ? 'not-allowed' : 'pointer', opacity: converting || !convertEmail.trim() ? 0.7 : 1 }}
                >
                  {converting ? t('ghost_recover.sending') : t('ghost_recover.send_confirmation')}
                </button>
                <p style={{ fontSize: 11, color: S.tx4, margin: '8px 0 0', textAlign: 'center' }}>
                  {t('ghost.profile_preserved')}
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
              {t('ghost.no_profile_yet')} → {t('ghost.create_profile')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
