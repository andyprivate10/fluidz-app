import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, Shield } from 'lucide-react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface LineupMember {
  applicant_id: string
  avatar_url?: string
  display_name?: string
  role?: string
  photos?: string[]
  bio?: string
  kinks_count?: number
  prep?: string
}

interface JoinLineupProps {
  lineup: LineupMember[]
  hostName: string
  hostAvatar: string
  maxCapacity?: number
}

export default function JoinLineup({ lineup, hostName, hostAvatar, maxCapacity }: JoinLineupProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      {/* Members present preview */}
      {lineup.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex' }}>
            {lineup.slice(0, 5).map((m, i) => (
              <div key={m.applicant_id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.bg1 }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '2px solid ' + S.bg1 }}>
                    {(m.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: S.tx2 }}>
            {t('join.members_present', { count: lineup.length })}
          </span>
        </div>
      ) : hostName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {hostAvatar ? (
            <img src={hostAvatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.bg1 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.p2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: S.p, fontWeight: 700 }}>{hostName[0]}</div>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: S.tx2 }}>
            {t('join.host_present', { name: hostName })}
          </span>
        </div>
      ) : null}

      {/* Lineup detail */}
      {lineup.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            <Users size={14} style={{ color: S.tx3 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('session.lineup_label')} · {lineup.length + 1}{maxCapacity ? '/' + maxCapacity : ''}
            </span>
          </div>
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lineup.slice(0, 8).map((m) => (
              <div key={m.applicant_id} onClick={() => navigate('/profile/' + m.applicant_id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(5,4,10,0.80)', borderRadius: 12, border: '1px solid ' + S.rule, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.rule2, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(m.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: S.tx }}>{m.display_name || t('common.anonymous')}</p>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                    {m.role && <span style={{ fontSize: 10, fontWeight: 600, color: S.p, background: S.p2, padding: '1px 6px', borderRadius: 99, border: '1px solid ' + S.pbd }}>{m.role}</span>}
                    {m.prep === 'Actif' && <Shield size={10} strokeWidth={2} style={{ color: S.sage }} />}
                    {m.kinks_count && m.kinks_count > 0 ? <span style={{ fontSize: 9, color: S.tx4 }}>{m.kinks_count} pratiques</span> : null}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: S.tx4, flexShrink: 0 }} />
              </div>
            ))}
            {lineup.length > 8 && <p style={{ fontSize: 12, color: S.tx3, textAlign: 'center', margin: '4px 0 0' }}>{t('session.lineup_more', { count: lineup.length - 8 })}</p>}
          </div>
        </div>
      )}

      {/* Role distribution */}
      {lineup.length > 0 && (() => {
        const roles: Record<string, number> = {}
        lineup.forEach(m => { if (m.role) roles[m.role] = (roles[m.role] || 0) + 1 })
        const prepCount = lineup.filter(m => m.prep === 'Actif').length
        return Object.keys(roles).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
            {Object.entries(roles).map(([role, count]) => (
              <span key={role} style={{ fontSize: 11, fontWeight: 600, color: S.tx2, background: 'rgba(5,4,10,0.80)', padding: '4px 10px', borderRadius: 99, border: '1px solid ' + S.rule }}>
                {count}&times; {role}
              </span>
            ))}
            {prepCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: S.sage, background: S.sagebg, padding: '4px 10px', borderRadius: 99, border: '1px solid ' + S.sagebd, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Shield size={10} strokeWidth={2} /> {prepCount} PrEP
              </span>
            )}
          </div>
        ) : null
      })()}
    </>
  )
}
