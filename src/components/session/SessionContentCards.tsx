import { Check, MapPin } from 'lucide-react'
import { colors, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'
import type { Session, Member } from '../../hooks/useSessionData'

const S = colors

interface Props {
  session: Session
  myApp: { status: string } | null
  members: Member[]
  memberRoles: Record<string, string>
  addressCopied: boolean
  copyAddress: (text: string) => void
}

export default function SessionContentCards({ session, myApp, members, memberRoles, addressCopied, copyAddress }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {/* ─── CAPACITY PROGRESS ─── */}
      {session.max_capacity && session.max_capacity > 0 && (() => {
        const current = members.length + 1 // +1 for host
        const max = session.max_capacity!
        const pct = Math.min((current / max) * 100, 100)
        const full = current >= max
        const color = full ? S.red : pct > 75 ? S.orange : S.sage
        return (
          <div style={{ ...glassCard, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{full ? t('session.capacity_full') : t('session.capacity_progress')}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{current}/{max}</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: S.bg2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )
      })()}

      {/* ─── ADDRESS (member only, prominent) ─── */}
      {myApp?.status === 'checked_in' && session.exact_address && (
        <div style={{ ...glassCard, borderColor: S.sagebd, background: 'rgba(74,222,128,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} strokeWidth={1.5} style={{ color: S.sage, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: S.tx, fontWeight: 600, flex: 1 }}>{session.exact_address}</span>
            <button onClick={() => copyAddress(session.exact_address || '')} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (addressCopied ? S.sage : S.rule), background: addressCopied ? S.sagebg : 'transparent', color: addressCopied ? S.sage : S.tx3, whiteSpace: 'nowrap' as const }}>
              {addressCopied ? t('session.copied') : t('session.copy')}
            </button>
          </div>
        </div>
      )}

      {session.description && (
        <div style={glassCard}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{t('session.section_description')}</div>
          <div style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6 }}>{session.description}</div>
        </div>
      )}

      {session.lineup_json?.host_rules && (
        <div style={glassCard}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{t('session.host_rules_label')}</div>
          <div style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{session.lineup_json.host_rules}</div>
        </div>
      )}

      {/* Rôles recherchés */}
      {session.lineup_json?.roles_wanted && Object.keys(session.lineup_json.roles_wanted).length > 0 && (() => {
        const wanted = session.lineup_json.roles_wanted as Record<string, number>
        // Count current roles in lineup
        const currentRoles: Record<string, number> = {}
        members.forEach(m => {
          const role = m.eps_json?.role || memberRoles[m.applicant_id]
          if (role) currentRoles[role] = (currentRoles[role] || 0) + 1
        })
        const missing: { role: string; need: number }[] = []
        Object.entries(wanted).forEach(([role, count]) => {
          const have = currentRoles[role] || 0
          if (have < Number(count)) missing.push({ role, need: Number(count) - have })
        })
        return (
          <div style={glassCard}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{t('session.section_roles_wanted')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(wanted).map(([role, count]) => {
                const have = currentRoles[role] || 0
                const filled = have >= Number(count)
                return (
                  <span key={role} style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                    color: filled ? S.sage : S.p,
                    background: filled ? S.sagebg : S.p2,
                    border: '1px solid ' + (filled ? S.sagebd : S.pbd),
                  }}>
                    {filled ? <Check size={11} strokeWidth={2.5} style={{display:'inline'}} /> : `${Number(count) - have}×`} {role}
                  </span>
                )
              })}
            </div>
            {missing.length > 0 && (
              <p style={{ fontSize: 11, color: S.p, margin: '8px 0 0' }}>
                {t('session.searching_roles', { roles: missing.map(m => `${m.need} ${m.role}`).join(', ') })}
              </p>
            )}
          </div>
        )
      })()}

      {myApp?.status === 'checked_in' && session.lineup_json?.directions?.length ? (
        <div style={glassCard}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{t('session.section_access')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {session.lineup_json.directions.map((step, i) => {
              const text = typeof step === 'string' ? step : step.text
              const photo = typeof step === 'string' ? undefined : step.photo_url
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.p, minWidth: 22 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: S.tx2, margin: 0, lineHeight: 1.5 }}>{text}</p>
                    {photo && <img src={photo} alt="" loading="lazy" style={{ width: '100%', maxWidth: 240, height: 140, objectFit: 'cover', borderRadius: 10, marginTop: 6, border: '1px solid '+S.rule }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </>
  )
}
