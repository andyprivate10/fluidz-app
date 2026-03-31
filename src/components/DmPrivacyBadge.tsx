import { useTranslation } from 'react-i18next'
import { MessageCircle, UserCheck, Lock } from 'lucide-react'
import { colors } from '../brand'
import type { DmPrivacyLevel } from '../lib/dmPrivacy'

const S = colors

interface DmPrivacyBadgeProps {
  level: DmPrivacyLevel
}

const config: Record<DmPrivacyLevel, { color: string; icon: typeof MessageCircle; key: string }> = {
  open:             { color: S.sage, icon: MessageCircle, key: 'interest.dm_badge_open' },
  profile_required: { color: S.blue, icon: UserCheck,     key: 'interest.dm_badge_request' },
  full_access:      { color: S.lav,  icon: Lock,          key: 'interest.dm_badge_closed' },
}

export default function DmPrivacyBadge({ level }: DmPrivacyBadgeProps) {
  const { t } = useTranslation()
  const { color, icon: Icon, key } = config[level]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 99,
        background: color + '14',
        border: '1px solid ' + color + '44',
        fontSize: 11,
        fontWeight: 700,
        color,
      }}
    >
      <Icon size={11} strokeWidth={1.5} />
      {t(key)}
    </span>
  )
}
