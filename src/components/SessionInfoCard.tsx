import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Radio, MapPin, Users } from 'lucide-react'
import { colors, radius, typeStyle, glassCard } from '../brand'
import { getSessionCover } from '../lib/sessionCover'

const S = colors
const R = radius

type SessionInfoCardSession = {
  id: string
  title: string
  status: string
  approx_area?: string
  tags?: string[]
  cover_url?: string
  template_slug?: string
  max_capacity?: number
}

interface Props {
  session: SessionInfoCardSession
  memberCount?: number
  onClick?: () => void
  compact?: boolean
  showCapacity?: boolean
  label?: string
  labelColor?: string
  timing?: string
  endedCta?: string
}

export default function SessionInfoCard({
  session, memberCount, onClick, compact, showCapacity = true,
  label, labelColor, timing, endedCta,
}: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const cover = getSessionCover(session.tags, session.cover_url, session.template_slug)
  const isOpen = session.status === 'open'
  const isEnded = session.status === 'ended'

  const handleClick = onClick || (() => navigate('/session/' + session.id))

  const capacity = showCapacity && session.max_capacity && memberCount !== undefined
    ? `${memberCount + 1}/${session.max_capacity}`
    : memberCount !== undefined && memberCount > 0
      ? `${memberCount + 1}`
      : null

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={session.title}
      style={{
        ...glassCard,
        background: cover.bg,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        opacity: isEnded ? 0.7 : 1,
      }}
    >
      {cover.coverImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${cover.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: cover.coverImage ? 'rgba(22,20,31,0.35)' : 'rgba(22,20,31,0.55)',
        backdropFilter: cover.coverImage ? 'blur(1px)' : 'blur(4px)',
        WebkitBackdropFilter: cover.coverImage ? 'blur(1px)' : 'blur(4px)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {label && (
          <p style={{
            ...typeStyle('micro'), color: labelColor || S.p,
            margin: '0 0 6px',
          }}>{label}</p>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <p style={{
            ...typeStyle('section'), color: S.tx,
            margin: 0, flex: 1,
          }}>{session.title}</p>
          <span style={{
            ...typeStyle('meta'),
            padding: '3px 10px', borderRadius: R.pill, marginLeft: 8,
            color: isOpen ? S.sage : isEnded ? S.red : S.tx3,
            background: isOpen ? S.sagebg : isEnded ? S.redbg : S.bg2,
            border: `1px solid ${isOpen ? S.sagebd : isEnded ? S.redbd : S.rule}`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isOpen && <Radio size={8} />}
            {isOpen ? t('session.live')
              : isEnded ? t('session.ended')
              : t('session.draft')}
          </span>
        </div>

        {session.approx_area && (
          <p style={{
            ...typeStyle('body'), color: S.tx2,
            margin: '5px 0 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <MapPin size={11} strokeWidth={1.5} />{session.approx_area}
          </p>
        )}

        {!compact && session.tags && session.tags.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap',
          }}>
            {session.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{
                ...typeStyle('meta'),
                padding: '3px 10px', borderRadius: R.chip,
                background: 'rgba(249,168,168,0.15)', color: S.p,
                border: '1px solid rgba(249,168,168,0.25)',
              }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 8,
        }}>
          {capacity && (
            <span style={{
              ...typeStyle('meta'), color: S.tx2,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Users size={10} strokeWidth={1.5} />{capacity}
            </span>
          )}
          {timing && (
            <span style={{ ...typeStyle('meta'), color: S.tx3 }}>
              {timing}
            </span>
          )}
        </div>

        {isEnded && endedCta && (
          <p style={{
            ...typeStyle('meta'), color: S.p, fontWeight: 600,
            margin: '6px 0 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>{endedCta}</p>
        )}
      </div>
    </div>
  )
}
