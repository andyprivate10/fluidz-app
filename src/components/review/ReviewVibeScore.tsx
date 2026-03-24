import { useState } from 'react'
import { Star } from 'lucide-react'
import { colors, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

const VIBE_TAGS = ['fun', 'safe', 'intense', 'chill', 'respectful', 'hot', 'welcoming']

interface Props {
  name: string
  avatar?: string
  defaultAddToBook: boolean
  onComplete: (data: { rating: number; tags: string[]; addToBook: boolean }) => void
  onSkip: () => void
  isLast: boolean
  progress: { current: number; total: number }
}

export default function ReviewVibeScore({
  name, avatar, defaultAddToBook, onComplete, onSkip, isLast, progress,
}: Props) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [addToBook, setAddToBook] = useState(defaultAddToBook)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function submit() {
    onComplete({ rating, tags, addToBook })
  }

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

      {/* Card */}
      <div style={{ ...glassCard, width: '100%', textAlign: 'center', padding: 24, marginBottom: 20 }}>
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

        <h2 style={{
          fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 6px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          {t('review.vibe_score')}
        </h2>
        <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 16px' }}>{name}</p>

        {/* Stars */}
        <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 8px' }}>{t('review.star_label')}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} style={{
              width: 48, height: 48, borderRadius: 14,
              border: '1px solid ' + (rating >= n ? S.pbd : S.rule),
              background: rating >= n ? S.p2 : S.bg2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <Star size={22} fill={rating >= n ? '#FBBF24' : 'none'} style={{ color: rating >= n ? '#FBBF24' : S.tx4 }} />
            </button>
          ))}
        </div>

        {/* Vibe tags */}
        <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 8px' }}>{t('review.vibe_tags_label')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {VIBE_TAGS.map(tag => {
            const on = tags.includes(tag)
            return (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                border: '1px solid ' + (on ? S.pbd : S.rule),
                background: on ? S.p2 : S.bg2,
                color: on ? S.p : S.tx3,
              }}>
                {t('review.tag_' + tag)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Add to NaughtyBook toggle */}
      <div
        role="switch"
        aria-checked={addToBook}
        onClick={() => setAddToBook(prev => !prev)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', width: '100%',
          background: addToBook ? S.sagebg : S.bg2,
          borderRadius: 14, border: '1px solid ' + (addToBook ? S.sagebd : S.rule),
          marginBottom: 20, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: addToBook ? S.sage : S.tx3 }}>
          {t('review.add_to_book')}
        </span>
        <div style={{
          width: 40, height: 22, borderRadius: 11,
          background: addToBook ? S.sage : S.tx4,
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 2, left: addToBook ? 20 : 2,
            transition: 'left 0.2s',
          }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button onClick={onSkip} style={{
          padding: '12px 20px', borderRadius: 14,
          border: '1px solid ' + S.rule, background: 'transparent',
          color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {t('review.skip')}
        </button>
        <button onClick={submit} style={{
          flex: 1, padding: 14, borderRadius: 14,
          background: S.p, border: 'none', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          opacity: rating > 0 ? 1 : 0.5,
        }}>
          {isLast ? t('review.finish') : t('review.next')}
        </button>
      </div>
    </div>
  )
}
