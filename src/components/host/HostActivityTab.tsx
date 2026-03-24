import { useTranslation } from 'react-i18next'
import { colors, glassCard } from '../../brand'
import type { ActivityEvent } from '../../hooks/useHostDashboard'

const S = colors

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const EVENT_CONFIG: Record<string, { color: string; icon: string; key: string }> = {
  applied:    { color: S.orange,  icon: '\uD83D\uDCE9', key: 'host.activity_applied' },
  accepted:   { color: S.sage,    icon: '\u2705',       key: 'host.activity_accepted' },
  rejected:   { color: S.red,     icon: '\u274C',       key: 'host.activity_rejected' },
  checked_in: { color: S.sage,    icon: '\uD83D\uDCCD', key: 'host.activity_checked_in' },
  ejected:    { color: S.red,     icon: '\uD83D\uDEAB', key: 'host.activity_ejected' },
}

type Props = {
  activityFeed: ActivityEvent[]
  arrivedCount: number
  totalAccepted: number
  apps: any[]
}

export default function HostActivityTab({ activityFeed, arrivedCount, totalAccepted, apps }: Props) {
  const { t } = useTranslation()
  const enRouteCount = totalAccepted - arrivedCount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
      {/* Stats cards */}
      {totalAccepted > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: t('host.arrived'), count: arrivedCount, color: S.sage, bg: S.sagebg },
            { label: t('host.en_route'), count: enRouteCount, color: S.orange, bg: S.orangebg },
            { label: t('host.total'), count: totalAccepted, color: S.p, bg: S.p2 },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{
              flex: 1, ...glassCard, padding: '14px 10px', textAlign: 'center',
              borderColor: color + '22', background: bg,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 11, color: S.tx3, fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Activity feed */}
      <div style={{ ...glassCard }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: S.lav,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
        }}>
          {t('home.recent_activity')}
        </div>

        {activityFeed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: S.tx3, fontSize: 13 }}>
            {t('host.no_activity')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activityFeed.map((event, idx) => {
              const cfg = EVENT_CONFIG[event.type]
              return (
                <div key={event.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: idx < activityFeed.length - 1 ? '1px solid ' + S.rule : 'none',
                }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                      {t(cfg.key, { name: event.name })}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: S.tx3, whiteSpace: 'nowrap' }}>
                    {timeAgo(event.time)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Role distribution (inline, kept simple) */}
      {apps.length > 0 && (() => {
        const roleCounts: Record<string, number> = {}
        apps.forEach(a => {
          const role = (a.eps_json?.role as string) || (a.user_profiles?.profile_json?.role as string)
          if (role) roleCounts[role] = (roleCounts[role] || 0) + 1
        })
        const totalWithRole = Object.values(roleCounts).reduce((s, c) => s + c, 0)
        if (totalWithRole === 0) return null
        const roleColors: Record<string, string> = {
          top: S.p, bottom: S.lav, versa: S.sage, side: S.blue,
          Top: S.p, Bottom: S.lav, Versa: S.sage, Side: S.blue,
        }
        return (
          <div style={{ ...glassCard }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              {t('host.role_distribution')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                const pct = (count / totalWithRole) * 100
                const color = roleColors[role] || S.tx2
                return (
                  <div key={role}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color }}>{role}</span>
                      <span style={{ fontSize: 11, color: S.tx3 }}>{count}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: S.bg1, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
