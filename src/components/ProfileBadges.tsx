import type { ReactElement } from 'react'
import { Shield, Clock, Sparkles } from 'lucide-react'
import { colors } from '../brand'

const S = colors

interface ProfileBadgesProps {
  createdAt?: string | null
  lastSeen?: string | null
  prepStatus?: string | null
  size?: 'sm' | 'md'
}

export default function ProfileBadges({ createdAt, lastSeen, prepStatus, size = 'md' }: ProfileBadgesProps) {
  const isSm = size === 'sm'
  const fs = isSm ? 9 : 11
  const pad = isSm ? '2px 7px' : '4px 10px'
  const iconSize = isSm ? 8 : 10

  const badges: ReactElement[] = []

  // New profile badge (< 7 days)
  if (createdAt) {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86400000
    if (days < 7) {
      badges.push(
        <span key="new" style={{ padding: pad, borderRadius: 99, fontSize: fs, fontWeight: 700, color: S.p, background: S.p2, border: '1px solid ' + S.pbd, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Sparkles size={iconSize} strokeWidth={2} />New
        </span>
      )
    }
  }

  // PrEP badge
  if (prepStatus === 'Actif') {
    badges.push(
      <span key="prep" style={{ padding: pad, borderRadius: 99, fontSize: fs, fontWeight: 700, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <Shield size={iconSize} strokeWidth={2} />PrEP
      </span>
    )
  }

  // Last seen badge (idle > 30 days)
  if (lastSeen) {
    const days = (Date.now() - new Date(lastSeen).getTime()) / 86400000
    if (days > 30) {
      badges.push(
        <span key="idle" style={{ padding: pad, borderRadius: 99, fontSize: fs, fontWeight: 600, color: S.tx2, background: S.bg2, border: '1px solid ' + S.rule, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Clock size={iconSize} strokeWidth={2} />{Math.floor(days)}j
        </span>
      )
    }
  }

  if (badges.length === 0) return null

  return <>{badges}</>
}
