import { colors, fonts, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'
import OrbLayer from '../OrbLayer'
import Confetti from '../Confetti'

const S = colors

interface Props {
  reviewedCount: number
  addedToBookCount: number
  onFinish: () => void
}

export default function ReviewSummary({ reviewedCount, addedToBookCount, onFinish }: Props) {
  const { t } = useTranslation()

  return (
    <div style={{
      background: S.bg, minHeight: '100vh', position: 'relative',
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <OrbLayer />
      <Confetti />

      <div style={{ ...glassCard, textAlign: 'center', padding: 32, width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2728;</div>
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 12px',
          fontFamily: fonts.hero,
        }}>
          {t('review.summary')}
        </h2>

        <p style={{ fontSize: 15, color: S.tx2, margin: '0 0 6px' }}>
          {t('review.people_reviewed', { count: reviewedCount })}
        </p>
        <p style={{ fontSize: 15, color: S.sage, fontWeight: 600, margin: '0 0 24px' }}>
          {t('review.added_to_book', { count: addedToBookCount })}
        </p>

        <button onClick={onFinish} style={{
          padding: '14px 32px', borderRadius: 14,
          background: S.p, border: 'none', color: S.tx,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          {t('common.back_home')}
        </button>
      </div>
    </div>
  )
}
