import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { colors, typeStyle, radius } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Home } from 'lucide-react'

const S = colors

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <OrbLayer />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <p style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 12px' }}>404</p>
        <p style={{ ...typeStyle('section'), color: S.tx, margin: '0 0 6px' }}>{t('common.not_found')}</p>
        <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 24px' }}>{t('common.not_found_desc')}</p>
        <button onClick={() => navigate('/')} style={{
          padding: '12px 24px', borderRadius: radius.btn, background: S.p, border: 'none',
          color: '#fff', ...typeStyle('label'), cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: `0 4px 24px ${S.pbd}`,
        }}>
          <Home size={14} strokeWidth={1.5} /> {t('common.back_home')}
        </button>
      </div>
    </div>
  )
}
