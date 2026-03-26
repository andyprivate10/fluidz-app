import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '../../brand'

const S = colors
const MAX = 960

export default function LandingFooter({ scrollTo }: { scrollTo: (id: string) => void }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <footer style={{ padding: '48px 24px 32px', borderTop: '1px solid ' + S.rule, maxWidth: MAX, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: fonts.hero, fontSize: 18, fontWeight: 800, color: S.p, marginBottom: 8 }}>fluidz</div>
          <p style={{ fontSize: 12, color: S.tx3, maxWidth: 260, lineHeight: 1.6 }}>
            {t('landing.footer')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_product')}</h4>
            <a onClick={() => scrollTo('features')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_features')}</a>
            <a onClick={() => scrollTo('how')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_how')}</a>
            <a onClick={() => scrollTo('pro')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_pro')}</a>
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_app')}</h4>
            <a onClick={() => navigate('/login')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_open_app')}</a>
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_legal')}</h4>
            <a style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_privacy')}</a>
            <a style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_terms')}</a>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid ' + S.rule }}>
        <p style={{ fontSize: 11, color: S.tx3 }}>&copy; 2026 Fluidz &middot; {t('landing.footer_copy')}</p>
      </div>
    </footer>
  )
}
