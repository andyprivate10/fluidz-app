import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { colors, fonts } from '../brand'

const S = colors
const GHOST_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface Props {
  createdAt: string // user.created_at ISO string
}

export default function GhostTimer({ createdAt }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, expired: false })

  useEffect(() => {
    function calc() {
      const expiresAt = new Date(createdAt).getTime() + GHOST_TTL_MS
      const diff = expiresAt - Date.now()
      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, expired: true })
        return
      }
      setRemaining({
        hours: Math.floor(diff / (60 * 60 * 1000)),
        minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
        expired: false,
      })
    }
    calc()
    const iv = setInterval(calc, 60000)
    return () => clearInterval(iv)
  }, [createdAt])

  useEffect(() => {
    if (remaining.expired) navigate('/ghost/recover')
  }, [remaining.expired, navigate])

  const isUrgent = !remaining.expired && remaining.hours < 1

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      borderRadius: 14, background: isUrgent ? S.redbg : S.orangebg,
      border: '1px solid ' + (isUrgent ? S.redbd : S.orangebd),
      animation: isUrgent ? 'blink 2s ease-in-out infinite' : undefined,
    }}>
      <AlertTriangle size={16} strokeWidth={1.5} style={{ color: isUrgent ? S.red : S.orange, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: isUrgent ? S.red : S.orange, margin: 0, fontFamily: fonts.body }}>
          {t('ghost_convert.timer_label')}
        </p>
        <p style={{ fontSize: 11, color: isUrgent ? S.red : S.orange, margin: '2px 0 0', opacity: 0.8, fontFamily: fonts.body }}>
          {remaining.expired
            ? t('ghost_convert.timer_expired')
            : t('ghost_convert.timer_remaining', { hours: remaining.hours, minutes: remaining.minutes })
          }
        </p>
      </div>
    </div>
  )
}
