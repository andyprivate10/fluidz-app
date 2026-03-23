import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'
import { ArrowRight, Shield, Users, Zap, Lock, MessageCircle, Eye } from 'lucide-react'

const S = colors

const features = [
  { icon: Users, key: 'group_sessions' },
  { icon: Lock, key: 'privacy_first' },
  { icon: Shield, key: 'trust_based' },
  { icon: MessageCircle, key: 'realtime_chat' },
  { icon: Eye, key: 'selective_sharing' },
  { icon: Zap, key: 'instant_matching' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

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
          <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: '0 0 32px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('landing.subheadline')}
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '16px 24px', borderRadius: 14,
              background: S.grad, border: 'none', color: '#fff',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(249,168,168,0.3)',
              position: 'relative', overflow: 'hidden',
            }}
            className="btn-shimmer"
            >
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
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section style={{ padding: '40px 24px 60px', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', margin: '0 0 24px' }}>
          {t('landing.features_label')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {features.map(({ icon: Icon, key }) => (
            <div key={key} style={{
              background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid ' + S.rule2, borderRadius: 16, padding: '20px 16px',
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
      <section style={{ padding: '40px 24px 60px', maxWidth: 480, margin: '0 auto' }}>
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
