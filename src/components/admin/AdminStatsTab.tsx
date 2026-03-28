import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { formatElapsed } from '../../lib/timing'
import { Calendar, Users, FileText, MessageSquare, Star, Clock } from 'lucide-react'

const S = colors

type StatCard = {
  label: string
  count: number
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Calendar
}

type DayCount = { date: string; count: number }
type ActiveSession = { id: string; title: string; created_at: string; starts_at: string | null }

export default function AdminStatsTab() {
  const [stats, setStats] = useState<StatCard[]>([])
  const [dailyCandidatures, setDailyCandidatures] = useState<DayCount[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)

      const [sessRes, usersRes, appsRes, msgsRes, reviewsRes] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ])

      setStats([
        { label: 'Sessions', count: sessRes.count || 0, color: S.sage, bgColor: S.sagebg, borderColor: S.sagebd, icon: Calendar },
        { label: 'Utilisateurs', count: usersRes.count || 0, color: S.lav, bgColor: S.lavbg, borderColor: S.lavbd, icon: Users },
        { label: 'Candidatures', count: appsRes.count || 0, color: S.p, bgColor: S.p2, borderColor: S.pbd, icon: FileText },
        { label: 'Messages', count: msgsRes.count || 0, color: S.blue, bgColor: S.bluebg, borderColor: S.bluebd, icon: MessageSquare },
        { label: 'Reviews', count: reviewsRes.count || 0, color: S.amber, bgColor: S.amberbg, borderColor: S.amberbd, icon: Star },
      ])

      // Candidatures per day (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: recentApps } = await supabase
        .from('applications')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at')

      const dayMap = new Map<string, number>()
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dayMap.set(d.toISOString().slice(0, 10), 0)
      }
      if (recentApps) {
        for (const app of recentApps) {
          const day = app.created_at.slice(0, 10)
          if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + 1)
        }
      }
      setDailyCandidatures([...dayMap.entries()].map(([date, count]) => ({ date, count })))

      // Active sessions
      const { data: openSessions } = await supabase
        .from('sessions')
        .select('id, title, created_at, starts_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)
      setActiveSessions((openSessions || []) as ActiveSession[])

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={adminStyles.sectionLabel(S.emerald)}>STATISTIQUES</p>
        <div style={{ textAlign: 'center', padding: 32, color: S.tx3, fontSize: 12 }}>Chargement...</div>
      </div>
    )
  }

  const maxBar = Math.max(...dailyCandidatures.map(d => d.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={adminStyles.sectionLabel(S.emerald)}>STATISTIQUES</p>

      {/* Stat cards: 2 + 3 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {stats.slice(0, 2).map(s => (
          <div key={s.label} style={{
            ...adminStyles.card,
            border: '1px solid ' + s.borderColor,
            background: s.bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: 16,
          }}>
            <s.icon size={20} strokeWidth={1.5} style={{ color: s.color }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: fonts.hero }}>
              {s.count}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {stats.slice(2).map(s => (
          <div key={s.label} style={{
            ...adminStyles.card,
            border: '1px solid ' + s.borderColor,
            background: s.bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: 12,
          }}>
            <s.icon size={16} strokeWidth={1.5} style={{ color: s.color }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: fonts.hero }}>
              {s.count}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart: Candidatures par jour */}
      <div style={adminStyles.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.tx, marginBottom: 12, fontFamily: fonts.hero }}>
          Candidatures par jour (7 derniers jours)
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
          {dailyCandidatures.map(d => {
            const barH = maxBar > 0 ? Math.max((d.count / maxBar) * 80, d.count > 0 ? 6 : 2) : 2
            const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: S.tx3, fontWeight: 600 }}>{d.count || ''}</span>
                <div style={{
                  width: '100%',
                  height: barH,
                  background: d.count > 0 ? S.p : S.rule,
                  borderRadius: 4,
                  transition: 'height 0.3s',
                }} />
                <span style={{ fontSize: 8, color: S.tx3, textTransform: 'capitalize' }}>{dayLabel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active sessions */}
      <div style={adminStyles.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.tx, marginBottom: 10, fontFamily: fonts.hero, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} strokeWidth={1.5} style={{ color: S.sage }} />
          Sessions actives
          <span style={{ fontSize: 10, fontWeight: 600, color: S.tx3, marginLeft: 4 }}>({activeSessions.length})</span>
        </div>
        {activeSessions.length === 0 ? (
          <div style={{ fontSize: 12, color: S.tx3, padding: '8px 0' }}>Aucune session active.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeSessions.map(sess => (
              <div key={sess.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid ' + S.rule,
                background: S.bg2,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: S.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {sess.title}
                </div>
                <div style={{ fontSize: 10, color: S.sage, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {formatElapsed(sess.starts_at || sess.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
