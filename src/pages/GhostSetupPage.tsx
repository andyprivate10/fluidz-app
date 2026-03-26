import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {Ghost, Copy, Check, ArrowRight, ArrowLeft, Clock, UserPlus} from 'lucide-react'
import { showToast } from '../components/Toast'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useCopyFeedback } from '../hooks/useCopyFeedback'
import { useTranslation } from 'react-i18next'

const S = colors

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function GhostSetupPage() {
  const { t } = useTranslation()
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
  const [anonAuthFailed, setAnonAuthFailed] = useState(false)
  const { copied: codeCopied, copy: copyCode } = useCopyFeedback()

  async function handleCreate() {
    if (!displayName.trim()) { showToast(t('ghost.choose_pseudo'), 'error'); return }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { showToast(t('ghost.pin_length'), 'error'); return }

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
        if (e2) { showToast(t('errors.error_prefix') + ': ' + e2.message, 'error'); setLoading(false); return }
        setGhostCode(d2.session_code)
        setGhostId(d2.id)
      } else {
        showToast(t('errors.error_prefix') + ': ' + error.message, 'error')
        setLoading(false)
        return
      }
    } else {
      setGhostCode(data.session_code)
      setGhostId(data.id)
    }

    const finalGhostId = data?.id || ghostId
    const finalGhostCode = data?.session_code || ghostCode

    // Store ghost info in localStorage for this session
    try {
      localStorage.setItem('ghost_id', finalGhostId)
      localStorage.setItem('ghost_code', finalGhostCode)
      localStorage.setItem('ghost_name', displayName.trim())
    } catch (_) {}

    // Create anonymous auth session so AuthContext.user is set
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
    if (anonErr) {
      console.error('Anonymous auth failed:', anonErr.message)
      // Show fallback — ghost row exists but no auth session
      setAnonAuthFailed(true)
      setStep('done')
      setLoading(false)
      return
    }

    // Create user_profiles row with display name
    if (anonData.user) {
      await supabase.from('user_profiles').upsert({
        id: anonData.user.id,
        display_name: displayName.trim(),
        profile_json: { is_ghost: true, ghost_session_id: finalGhostId }
      }, { onConflict: 'id' })
    }

    setStep('done')
    setLoading(false)
  }

  function handleCopyCode() {
    copyCode(ghostCode)
  }

  async function goToApply() {
    const gId = ghostId || localStorage.getItem('ghost_id') || ''
    if (sessionId) {
      // Check capacity before navigating
      const [{ data: sess }, { count }] = await Promise.all([
        supabase.from('sessions').select('max_capacity,template_slug,cover_url').eq('id', sessionId).maybeSingle(),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).in('status', ['accepted', 'checked_in']),
      ])
      if (sess?.max_capacity && (count ?? 0) + 1 >= sess.max_capacity) {
        showToast(t('ghost.session_full'), 'error')
        return
      }
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
    fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
    textAlign: 'center',
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* 24h warning banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: S.orangebg, border: '1px solid ' + S.orangebd, marginBottom: 16 }}>
          <Clock size={16} strokeWidth={1.5} style={{ color: S.orange, flexShrink: 0 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: S.orange, margin: 0, lineHeight: 1.4 }}>
            {t('ghost.temp_access_warning')}
          </p>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Ghost size={40} style={{ color: S.p, marginBottom: 12 }} />
          <h1 style={{ fontSize:24,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 6px' }}>{t('ghost.title')} ◌</h1>
          <p style={{ color: S.tx3, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {t('ghost.subtitle')}
          </p>
        </div>

        {step === 'name' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ghost.your_pseudo')}</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('placeholders.ghost_pseudo')}
                maxLength={30}
                autoFocus
                style={inp}
              />
            </div>
            <button
              onClick={() => {
                if (!displayName.trim()) { showToast(t('ghost.choose_pseudo'), 'error'); return }
                setStep('pin')
              }}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 24px rgba(244,114,114,0.3)' }}
            >
              {t('ghost.next_button')}
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ghost.pin_label')}</label>
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
                {t('ghost.pin_help')}
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || pin.length !== 4}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || pin.length !== 4 ? 0.7 : 1 }}
            >
              {loading ? t('ghost_setup.creating') : t('ghost_setup.create_ghost')}
            </button>
            <button onClick={() => setStep('name')} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={16} strokeWidth={1.5} />{t('common.back_label')}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>

            {anonAuthFailed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: S.orangebg, border: '1px solid ' + S.orangebd }}>
                <Clock size={16} strokeWidth={1.5} style={{ color: S.orange, flexShrink: 0 }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: S.orange, margin: 0, lineHeight: 1.4 }}>
                  {t('ghost.anon_auth_failed')}
                </p>
              </div>
            )}

            <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.sagebd, borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 14, color: S.sage, fontWeight: 700, marginBottom: 16 }}>{t('ghost.title')}</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{t('ghost.your_recovery_code')}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: S.p, letterSpacing: '0.15em', fontFamily: 'monospace' }}>{ghostCode}</span>
                  <button onClick={handleCopyCode} style={{ background: codeCopied ? S.sagebg : S.bg2, border: '1px solid ' + (codeCopied ? S.sage : S.rule), borderRadius: 10, padding: 8, cursor: 'pointer', color: codeCopied ? S.sage : S.tx3 }}>
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

              <div style={{ background: S.orangebg, border: '1px solid ' + S.orangebd, borderRadius: 12, padding: 12, marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: S.orange, margin: 0, fontWeight: 600 }}>
                  {t('ghost.valid_24h')}
                </p>
              </div>
            </div>

            <button
              onClick={goToApply}
              style={{ width: '100%', padding: 16, borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 24px rgba(244,114,114,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {t('session.continue_button')} <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/ghost/recover')}
              style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 12, cursor: 'pointer', padding: 8 }}
            >
              {t('ghost.have_code_recover')}
            </button>
          </div>
        )}

        {/* Create account CTA */}
        {step !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: 20, padding: '16px', borderRadius: 16, background: S.bg1, border: '1px solid ' + S.rule }}>
            <UserPlus size={20} style={{ color: S.p, marginBottom: 6 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: S.tx, margin: '0 0 4px' }}>{t('ghost.prefer_real_account')}</p>
            <p style={{ fontSize: 11, color: S.tx3, margin: '0 0 10px' }}>{t('ghost.real_account_benefit')}</p>
            <button
              onClick={() => navigate('/login' + (sessionId ? '?next=/session/' + sessionId + '/apply' : inviteCode ? '?next=/join/' + inviteCode : ''))}
              style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: S.p, background: S.p2, border: '1px solid ' + S.pbd, cursor: 'pointer' }}
            >
              {t('ghost.create_account_cta')}
            </button>
          </div>
        )}

        {/* Recovery link */}
        {step !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => navigate('/ghost/recover' + (sessionId ? '?session_id=' + sessionId : inviteCode ? '?invite_code=' + inviteCode : ''))}
              style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('ghost.have_code_recover')}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
