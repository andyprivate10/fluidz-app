import { colors, fonts, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface IntentQuestion {
  slug: string
  questionKey: string
  descKey: string
}

const INTENT_QUESTIONS: IntentQuestion[] = [
  { slug: 'amitie', questionKey: 'review.as_friend', descKey: 'review.as_friend_desc' },
  { slug: 'session_adulte', questionKey: 'review.for_session', descKey: 'review.for_session_desc' },
  { slug: 'plan_regulier', questionKey: 'review.for_regular', descKey: 'review.for_regular_desc' },
  { slug: 'kink_partner', questionKey: 'review.kink_partner_q', descKey: 'review.kink_partner_desc' },
  { slug: 'date', questionKey: 'review.for_date', descKey: 'review.for_date_desc' },
  { slug: 'relation_serieuse', questionKey: 'review.for_relationship', descKey: 'review.for_relationship_desc' },
  { slug: 'co_host', questionKey: 'review.for_cohost', descKey: 'review.for_cohost_desc' },
  { slug: 'mentor_initiation', questionKey: 'review.for_mentor', descKey: 'review.for_mentor_desc' },
]

interface Props {
  name: string
  avatar?: string
  onComplete: (intents: string[]) => void
  onSkip: () => void
  showCoHost: boolean
  progress: { current: number; total: number }
}

export default function ReviewIntents({
  name, avatar, onComplete, onSkip, showCoHost, progress,
}: Props) {
  const questions = INTENT_QUESTIONS.filter(
    q => q.slug !== 'co_host' || showCoHost
  )

  return (
    <ReviewIntentsStateful
      name={name}
      avatar={avatar}
      questions={questions}
      onComplete={onComplete}
      onSkip={onSkip}
      progress={progress}
    />
  )
}

// Internal stateful component to walk through questions one by one
import { useState } from 'react'

function ReviewIntentsStateful({
  name, avatar, questions, onComplete, onSkip, progress,
}: {
  name: string
  avatar?: string
  questions: IntentQuestion[]
  onComplete: (intents: string[]) => void
  onSkip: () => void
  progress: { current: number; total: number }
}) {
  const { t } = useTranslation()
  const [idx, setIdx] = useState(0)
  const [intents, setIntents] = useState<string[]>([])

  if (idx >= questions.length) {
    // All answered, fire complete
    onComplete(intents)
    return null
  }

  const q = questions[idx]

  function answer(yes: boolean) {
    const next = yes ? [...intents, q.slug] : intents
    if (idx + 1 >= questions.length) {
      onComplete(next)
    } else {
      setIntents(next)
      setIdx(prev => prev + 1)
    }
  }

  // Sub-progress: intent question idx within the total progress
  const subTotal = progress.total
  const subCurrent = progress.current

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 24px' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {Array.from({ length: subTotal }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < subCurrent ? S.p : i === subCurrent ? S.tx : S.bg3,
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ ...glassCard, width: '100%', textAlign: 'center', padding: 28, marginBottom: 24 }}>
        {avatar ? (
          <img src={avatar} alt="" style={{
            width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid ' + S.rule2, margin: '0 auto 12px', display: 'block',
          }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: S.grad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 12px',
          }}>
            {name[0]?.toUpperCase()}
          </div>
        )}

        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
          {name} &middot; {idx + 1}/{questions.length}
        </p>

        <h2 style={{
          fontSize: 19, fontWeight: 800, color: S.tx, margin: '0 0 8px',
          fontFamily: fonts.hero,
        }}>
          {t(q.questionKey)}
        </h2>

        <p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>{t(q.descKey)}</p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        <button onClick={() => answer(true)} style={{
          flex: 1, padding: 16, borderRadius: 14,
          background: S.p, border: 'none', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          {t('common.yes')}
        </button>
        <button onClick={() => answer(false)} style={{
          flex: 1, padding: 16, borderRadius: 14,
          background: S.bg3, border: '1px solid ' + S.rule2, color: S.tx2,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          {t('common.no')}
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
