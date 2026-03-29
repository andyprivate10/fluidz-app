import { colors, fonts, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface Props {
  name: string
  avatar?: string
  question: string
  description?: string
  yesLabel: string
  noLabel: string
  onYes: () => void
  onNo: () => void
  onSkip: () => void
  progress: { current: number; total: number }
}

export default function ReviewQuestion({
  name, avatar, question, description,
  yesLabel, noLabel, onYes, onNo, onSkip, progress,
}: Props) {
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 24px' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {Array.from({ length: progress.total }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < progress.current ? S.p : i === progress.current ? S.tx : S.bg3,
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Person card */}
      <div style={{ ...glassCard, width: '100%', textAlign: 'center', padding: 28, marginBottom: 24 }}>
        {avatar ? (
          <img src={avatar} alt="" style={{
            width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
            border: '3px solid ' + S.rule2, margin: '0 auto 16px', display: 'block',
          }} />
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: '50%', background: S.grad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: S.tx, margin: '0 auto 16px',
          }}>
            {name[0]?.toUpperCase()}
          </div>
        )}

        <h2 style={{
          fontSize: 20, fontWeight: 800, color: S.tx, margin: '0 0 12px',
          fontFamily: fonts.hero,
        }}>
          {question}
        </h2>

        {description && (
          <p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>{description}</p>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button onClick={onYes} style={{
          width: '100%', padding: 16, borderRadius: 14,
          background: S.p, border: 'none', color: S.tx,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}>
          {yesLabel}
        </button>
        <button onClick={onNo} style={{
          width: '100%', padding: 16, borderRadius: 14,
          background: S.bg3, border: '1px solid ' + S.rule2, color: S.tx2,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}>
          {noLabel}
        </button>
      </div>

      {/* Skip */}
      <button onClick={onSkip} style={{
        marginTop: 16, background: 'none', border: 'none',
        color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        {t('review.skip')}
      </button>
    </div>
  )
}
