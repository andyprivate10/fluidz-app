import { useState, useEffect } from 'react'
import { calculateVibeScore, vibeScoreBadge } from '../lib/vibeScore'
import type { VibeScoreData } from '../lib/vibeScore'
import { colors } from '../brand'
const S = colors

/**
 * Inline Vibe Score badge — shows score + level label
 * Usage: <VibeScoreBadge userId="xxx" />
 */
export function VibeScoreBadge({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const [data, setData] = useState<VibeScoreData | null>(null)

  useEffect(() => {
    if (!userId) return
    calculateVibeScore(userId).then(setData).catch(() => {})
  }, [userId])

  if (!data) return null

  const badge = vibeScoreBadge(data.score)
  const isSm = size === 'sm'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: isSm ? 10 : 12, fontWeight: 700,
      color: badge.color, background: badge.bg,
      padding: isSm ? '2px 8px' : '3px 10px',
      borderRadius: 99, border: '1px solid ' + badge.color + '44',
      whiteSpace: 'nowrap',
    }}>
      ⚡ {data.score}
    </span>
  )
}

/**
 * Detailed Vibe Score card — shows breakdown
 * Usage: <VibeScoreCard userId="xxx" />
 */
export function VibeScoreCard({ userId }: { userId: string }) {
  const [data, setData] = useState<VibeScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    calculateVibeScore(userId).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [userId])

  if (loading) return null
  if (!data) return null

  const badge = vibeScoreBadge(data.score)
  const bars = [
    { label: 'Reviews', value: data.breakdown.reviews, max: 30, color: S.sage },
    { label: 'Participation', value: data.breakdown.participation, max: 20, color: S.p },
    { label: 'Fiabilité', value: data.breakdown.noReports, max: 15, color: S.blue },
    { label: 'Check-in', value: data.breakdown.checkInRate, max: 15, color: S.p },
    { label: 'Profil', value: data.breakdown.profileComplete, max: 10, color: S.tx2 },
    { label: 'Ancienneté', value: data.breakdown.seniority, max: 10, color: S.tx2 },
  ]

  return (
    <div style={{ background: S.bg1, border: '1px solid '+S.rule, borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: badge.color }}>⚡ {data.score}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: badge.color, background: badge.bg, padding: '3px 10px', borderRadius: 99 }}>{data.label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: S.tx2, width: 80, flexShrink: 0 }}>{bar.label}</span>
            <div style={{ flex: 1, background: S.bg2, borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(bar.value / bar.max) * 100}%`, background: bar.color, height: '100%', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 10, color: S.tx3, width: 30, textAlign: 'right', flexShrink: 0 }}>{bar.value}/{bar.max}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
