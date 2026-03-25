import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { colors, radius, typeStyle, glassCard } from '../brand'
import { ArrowRight, Shield, Users, Zap, Lock, MessageCircle, Eye, Star, Phone, MapPin, Sliders, MessageSquare } from 'lucide-react'

const S = colors
const R = radius

const features = [
  { icon: Users, key: 'group_sessions' },
  { icon: Lock, key: 'privacy_first' },
  { icon: Shield, key: 'trust_based' },
  { icon: MessageCircle, key: 'realtime_chat' },
  { icon: Eye, key: 'selective_sharing' },
  { icon: Zap, key: 'instant_matching' },
]

const diffs = [
  { icon: Phone, key: 'no_phone' },
  { icon: MapPin, key: 'address' },
  { icon: Sliders, key: 'profile' },
  { icon: MessageSquare, key: 'no_whatsapp' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [inviteCode, setInviteCode] = useState('')

  function handleInvite() {
    const code = inviteCode.trim()
    if (!code) return
    // Handle full URLs like /join/CODE or just CODE
    const match = code.match(/\/join\/([A-Za-z0-9]+)/) || code.match(/^([A-Za-z0-9]+)$/)
    if (match) navigate('/join/' + match[1])
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', overflow: 'hidden' }}>

      {/* ═══ HERO ═══ */}
      <section style={{ position: 'relative', padding: '80px 24px 60px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        {/* Orb glow */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,168,168,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 42, fontWeight: 800,
            color: S.tx, lineHeight: 1.1, margin: '0 0 16px',
            background: `linear-gradient(135deg, ${S.tx}, ${S.p})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            fluidz
          </h1>
          <p style={{ fontSize: 18, fontWeight: 600, color: S.tx, margin: '0 0 8px', lineHeight: 1.4 }}>
            {t('landing.headline')}
          </p>
          <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: '0 0 28px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('landing.subheadline')}
          </p>

          {/* Invite code card */}
          <div style={{
            ...glassCard, border: `1px solid ${S.pbd}`, padding: 20, marginBottom: 24,
            maxWidth: 340, marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ ...typeStyle('label'), color: S.p, margin: '0 0 12px' }}>{t('landing.have_invite')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                placeholder={t('landing.invite_placeholder')}
                style={{
                  flex: 1, background: S.bg2, color: S.tx, borderRadius: R.chip,
                  padding: '12px 14px', border: `1px solid ${S.rule}`, outline: 'none',
                  fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              <button onClick={handleInvite} style={{
                padding: '12px 20px', borderRadius: R.chip, background: S.p,
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: `0 2px 12px ${S.pbd}`,
              }}>
                {t('landing.join')}
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
            <button onClick={() => navigate('/login?next=/session/create')} style={{
              width: '100%', padding: '16px 24px', borderRadius: 14,
              background: S.grad, border: 'none', color: '#fff',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(249,168,168,0.3)',
              position: 'relative', overflow: 'hidden',
            }} className="btn-shimmer">
              {t('landing.cta_start')} <ArrowRight size={18} strokeWidth={2} />
            </button>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '14px 24px', borderRadius: 14,
              background: 'transparent', border: '1px solid ' + S.rule,
              color: S.tx2, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              {t('landing.cta_login')}
            </button>
          </div>

          <p style={{ ...typeStyle('meta'), color: S.tx3, marginTop: 16 }}>{t('landing.no_ads')}</p>
        </div>
      </section>

      {/* ═══ KILLER FEATURE 1 — Sessions ═══ */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ ...glassCard, border: `1px solid ${S.pbd}`, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 12px' }}>{t('landing.killer_1_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_1_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_1_desc')}</p>

          {/* Mini session preview card */}
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: `1px solid ${S.rule}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>Dark Room Bastille</p>
                <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '4px 0 0' }}>Ce soir, 23h</p>
              </div>
              <div style={{ display: 'flex', gap: -6 }}>
                {['#E0887A', '#9080BA', '#6BA888'].map((c, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%', background: c,
                    border: `2px solid ${S.bg2}`, marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: 3 - i,
                  }} />
                ))}
              </div>
            </div>
            <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '0 0 10px' }}>{t('landing.members', { count: 4 })}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['tag_private', 'tag_vote', 'tag_address'].map(k => (
                <span key={k} style={{
                  ...typeStyle('meta'), color: S.p, background: S.p3, border: `1px solid ${S.pbd}`,
                  borderRadius: R.chip, padding: '4px 8px',
                }}>
                  {t(`landing.${k}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KILLER FEATURE 2 — VibeScore ═══ */}
      <section style={{ padding: '0 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ ...glassCard, border: `1px solid ${S.sagebd}`, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 12px' }}>{t('landing.killer_2_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_2_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_2_desc')}</p>

          {/* Mini profile card */}
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: `1px solid ${S.rule}` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>K</div>
              <div>
                <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>Karim</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {[1, 2, 3, 4].map(i => (
                    <Star key={i} size={12} fill={S.sage} strokeWidth={0} style={{ color: S.sage }} />
                  ))}
                  <Star size={12} fill="none" strokeWidth={1.5} style={{ color: S.sage }} />
                  <span style={{ ...typeStyle('meta'), color: S.tx2, marginLeft: 4 }}>4.2</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ ...typeStyle('meta'), color: S.sage, background: S.sagebg, border: `1px solid ${S.sagebd}`, borderRadius: R.chip, padding: '4px 8px' }}>{t('landing.vibe_respectful')}</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>Sessions</p>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>12</p>
              </div>
              <div>
                <p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>Vibe</p>
                <p style={{ ...typeStyle('label'), color: S.sage, margin: 0 }}>4.2</p>
              </div>
              <div>
                <p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>{t('landing.reliability')}</p>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>96%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', margin: '0 0 24px' }}>
          {t('landing.features_label')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {features.map(({ icon: Icon, key }) => (
            <div key={key} style={{
              ...glassCard, padding: '20px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: S.p3, border: '1px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.5} style={{ color: S.p }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t(`landing.feat_${key}`)}</p>
                <p style={{ fontSize: 11, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{t(`landing.feat_${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', margin: '0 0 24px' }}>
          {t('landing.how_it_works')}
        </p>
        {[1, 2, 3, 4].map(step => (
          <div key={step} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20,
            padding: '16px', borderRadius: 14,
            background: step === 1 ? 'rgba(249,168,168,0.06)' : 'transparent',
            border: step === 1 ? '1px solid ' + S.pbd : '1px solid transparent',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: step === 1 ? S.p : S.bg2,
              border: '1px solid ' + (step === 1 ? S.p : S.rule),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: step === 1 ? '#fff' : S.tx3,
            }}>
              {step}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t(`landing.step_${step}`)}</p>
              <p style={{ fontSize: 12, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{t(`landing.step_${step}_desc`)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ DIFFERENTIATORS ═══ */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', margin: '0 0 24px' }}>
          {t('landing.diff_label')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {diffs.map(({ icon: Icon, key }) => (
            <div key={key} style={{
              ...glassCard, padding: '20px 16px', border: `1px solid ${S.sagebd}`,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: S.sagebg, border: '1px solid ' + S.sagebd, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.5} style={{ color: S.sage }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t(`landing.diff_${key}`)}</p>
                <p style={{ fontSize: 11, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{t(`landing.diff_${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: S.tx, margin: '0 0 8px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {t('landing.bottom_cta')}
        </p>
        <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 24px' }}>
          {t('landing.bottom_desc')}
        </p>
        <button onClick={() => navigate('/login')} className="btn-shimmer" style={{
          padding: '16px 40px', borderRadius: 14,
          background: S.grad, border: 'none', color: '#fff',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(249,168,168,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          {t('landing.cta_start')} <ArrowRight size={18} strokeWidth={2} style={{ display: 'inline', marginLeft: 6 }} />
        </button>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '24px', borderTop: '1px solid ' + S.rule, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 11, color: S.tx4, margin: 0 }}>
          fluidz — {t('landing.footer')}
        </p>
      </footer>
    </div>
  )
}
