import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { colors, fonts } from '../../brand'

const S = colors
const MAX = 960

interface RevealRef {
  (el: HTMLElement | null): void
}

export default function LandingPro({ rv }: { rv: RevealRef }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <>
      {/* ═══ PRO SECTION ═══ */}
      <section id="pro" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div ref={rv} className="l-rv" style={{
          maxWidth: 700, margin: '0 auto', background: S.bg1, border: '1px solid rgba(144,128,186,0.18)',
          borderRadius: 24, padding: '40px 32px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(144,128,186,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
            borderRadius: 99, background: 'rgba(144,128,186,0.08)', border: '1px solid rgba(144,128,186,0.18)',
            fontSize: 11, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 16,
          }}>{t('landing.pro_badge')}</div>
          <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, letterSpacing: '-0.04em', textAlign: 'center', margin: '0 auto 12px' }}>
            {t('landing.pro_title')}
          </h2>
          <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 24px' }}>
            {t('landing.pro_desc')}
          </p>
          <button onClick={() => navigate('/login')} className="l-btn-shim" style={{
            padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: S.tx, background: S.lav, border: 'none', cursor: 'pointer',
            fontFamily: fonts.body, display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(144,128,186,0.3)',
          }}>
            {t('landing.pro_cta')} <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* ═══ VISION ═══ */}
      <section ref={rv} className="l-rv" style={{ textAlign: 'center', padding: '60px 24px 80px', maxWidth: MAX, margin: '0 auto' }}>
        <blockquote style={{
          fontFamily: fonts.hero, fontSize: 'clamp(20px,4vw,32px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.25, maxWidth: 640, margin: '0 auto 24px',
        }} dangerouslySetInnerHTML={{ __html: t('landing.vision_quote') }} />
        <p style={{ fontSize: 14, color: S.tx2, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          {t('landing.vision_body')}
        </p>
      </section>

      {/* ═══ EARLY ACCESS ═══ */}
      <section ref={rv} className="l-rv" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.p, textAlign: 'center', marginBottom: 14 }}>{t('landing.early_label')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 auto 12px' }}>
          {t('landing.early_title')}
        </h2>
        <p style={{ color: S.tx2, fontSize: 14, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
          {t('landing.early_desc')}
        </p>
        <button onClick={() => navigate('/login?signup=1')} className="l-btn-shim" style={{
          padding: '15px 36px', borderRadius: 16, background: S.p, border: 'none',
          color: S.tx, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body,
          boxShadow: '0 4px 20px rgba(224,136,122,0.3)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {t('landing.early_cta')} <ArrowRight size={16} />
        </button>
        <p style={{ fontSize: 11, color: S.tx3, marginTop: 12, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          {t('landing.no_ads')}
        </p>
      </section>
    </>
  )
}
