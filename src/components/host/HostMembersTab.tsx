import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import { colors, glassCard } from '../../brand'

const S = colors

type Props = {
  members: any[]
  sessionId: string
  actionLoading: string | null
  onEject: (appId: string) => void
  onConfirmCheckIn: (appId: string) => void
  apps: any[]
}

export default function HostMembersTab({ members, sessionId, actionLoading, onEject, onConfirmCheckIn, apps }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Role distribution from all apps
  const roleCounts: Record<string, number> = {}
  apps.filter(a => a.status === 'accepted' || a.status === 'checked_in').forEach(a => {
    const role = (a.eps_json?.role as string) || (a.user_profiles?.profile_json?.role as string)
    if (role) roleCounts[role] = (roleCounts[role] || 0) + 1
  })
  const totalWithRole = Object.values(roleCounts).reduce((s, c) => s + c, 0)
  const roleColors: Record<string, string> = {
    top: S.p, bottom: S.lav, versa: S.sage, side: S.blue,
    Top: S.p, Bottom: S.lav, Versa: S.sage, Side: S.blue,
  }

  const getStatusBadge = (app: any) => {
    if (app.status === 'checked_in') {
      return { label: t('host.arrived_badge'), color: S.sage, bg: S.sagebg, bd: S.sagebd, dot: S.sage }
    }
    if (app.status === 'accepted' && app.checked_in) {
      return { label: t('host.arrival_to_confirm'), color: S.orange, bg: S.orangebg, bd: S.orangebd, dot: S.orange }
    }
    return { label: t('host.en_route'), color: S.blue, bg: S.bluebg, bd: S.bluebd, dot: S.blue }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
      {/* Role distribution summary */}
      {totalWithRole > 0 && (
        <div style={{ ...glassCard }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: S.lav,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
          }}>
            {t('host.role_distribution')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
              const color = roleColors[role] || S.tx2
              return (
                <span key={role} style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                  color, background: color + '14', border: '1px solid ' + color + '33',
                }}>
                  {count} {role}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: S.tx3, fontSize: 14 }}>
          {t('host.no_members')}
        </div>
      ) : (
        members.map(app => {
          const prof = app.user_profiles
          const displayName = prof?.display_name || 'Anonyme'
          const role = app.eps_json?.role || prof?.profile_json?.role
          const badge = getStatusBadge(app)

          return (
            <div key={app.id} style={{ ...glassCard, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: S.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: S.lav, flexShrink: 0,
                }}>
                  {displayName[0].toUpperCase()}
                </div>

                {/* Name + role + status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Link to={'/profile/' + app.applicant_id} style={{ fontSize: 14, fontWeight: 700, color: S.tx, textDecoration: 'none' }}>
                      {displayName}
                    </Link>
                    {role && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: S.p2, color: S.p, border: '1px solid ' + S.pbd }}>
                        {role}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: badge.dot,
                      animation: badge.dot === S.sage ? 'none' : 'blink 2s ease-in-out infinite',
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: badge.color,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {app.status === 'accepted' && app.checked_in === true && (
                    <button
                      onClick={() => onConfirmCheckIn(app.id)}
                      disabled={actionLoading === app.id}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        border: '1px solid ' + S.sagebd, background: S.sagebg, color: S.sage,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      <Check size={12} strokeWidth={2.5} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/session/' + sessionId + '/dm/' + app.applicant_id)}
                    style={{
                      padding: '5px 10px', borderRadius: 8, fontSize: 11,
                      border: '1px solid ' + S.pbd, background: 'transparent', color: S.p,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    <MessageCircle size={12} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => onEject(app.id)}
                    style={{
                      padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: '1px solid ' + S.redbd, background: 'transparent', color: S.red,
                      cursor: 'pointer',
                    }}
                  >
                    {t('host.eject_member')}
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
