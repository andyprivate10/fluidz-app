import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'

const S = colors

interface Props {
  userId: string
}

export default function HostBadge({ userId }: Props) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<{ count: number; avg: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('host_id', userId).in('status', ['open', 'ended', 'ending_soon'])
      if (cancelled) return
      if (!count || count < 3) { setStats(null); return }

      const { data: reviews } = await supabase.from('reviews').select('rating, session_id').is('target_id', null)
      // Filter reviews for this host's sessions
      const { data: hostSessions } = await supabase.from('sessions').select('id').eq('host_id', userId)
      if (cancelled) return
      const sessionIds = new Set((hostSessions || []).map(s => s.id))
      const hostReviews = (reviews || []).filter(r => sessionIds.has(r.session_id))
      const avg = hostReviews.length > 0 ? hostReviews.reduce((s, r) => s + r.rating, 0) / hostReviews.length : 0

      setStats({ count: count || 0, avg: Math.round(avg * 10) / 10 })
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  if (!stats) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: S.amber,
      background: S.amberbg,
      border: '1px solid ' + S.amberbd,
    }}>
      <Star size={10} strokeWidth={2} fill={S.amber} />
      {t('host_badge.label', { count: stats.count })}
      {stats.avg > 0 && <span style={{ color: S.tx2 }}>· {stats.avg}</span>}
    </span>
  )
}
