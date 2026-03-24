import { useTranslation } from 'react-i18next'
import { colors } from '../../brand'

const S = colors

type Props = {
  apps: { status: string; eps_json?: Record<string, unknown>; created_at?: string; user_profiles?: { profile_json?: Record<string, unknown> } }[]
}

export default function HostSessionStats({ apps }: Props) {
  const { t } = useTranslation()

  // Role distribution
  const roleCounts: Record<string, number> = {}
  apps.forEach(a => {
    const role = (a.eps_json?.role as string) || (a.user_profiles?.profile_json?.role as string)
    if (role) roleCounts[role] = (roleCounts[role] || 0) + 1
  })
  const totalWithRole = Object.values(roleCounts).reduce((s, c) => s + c, 0)

  // Conversion funnel
  const applied = apps.length
  const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in').length
  const checkedIn = apps.filter(a => a.status === 'checked_in').length
  const funnelMax = Math.max(applied, 1)

  const roleColors: Record<string, string> = {
    top: S.p, bottom: S.lav, versa: S.sage, side: S.blue,
    Top: S.p, Bottom: S.lav, Versa: S.sage, Side: S.blue,
  }

  if (apps.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Role distribution */}
      {totalWithRole > 0 && (
        <div style={{ padding: 14, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('host.role_distribution')}</div>
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
      )}

      {/* Conversion funnel */}
      <div style={{ padding: 14, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('host.conversion_funnel')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: t('host.pending'), count: applied, color: S.orange },
            { label: t('host.accepted_tab'), count: accepted, color: S.sage },
            { label: t('host.arrived'), count: checkedIn, color: S.p },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                <span style={{ fontSize: 11, color: S.tx3 }}>{count}</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: S.bg1, overflow: 'hidden' }}>
                <div style={{ width: `${(count / funnelMax) * 100}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
