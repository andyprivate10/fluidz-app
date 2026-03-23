import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, Check } from 'lucide-react'
import { colors } from '../../brand'

const S = colors
const card: React.CSSProperties = { background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 20, padding: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }

type Member = { applicant_id: string; eps_json: Record<string, any>; status: string }

type Props = {
  members: Member[]
  memberAvatars: Record<string, string>
  memberNames: Record<string, string>
  memberRoles: Record<string, string>
  hostProfile: { name: string; avatar?: string } | null
  hostId: string
  isMobile: boolean
}

export default function SessionLineup({ members, memberAvatars, memberNames, memberRoles, hostProfile, hostId, isMobile }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [sheetMember, setSheetMember] = useState<Member | null>(null)

  if (members.length === 0) return null

  return (
    <div style={card}>
      <div style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>{t('session.section_lineup')} · {members.length + 1}</div>
      {/* Avatar row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {hostProfile && (
            <button type="button" onClick={() => navigate('/profile/' + hostId)} style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
              {hostProfile.avatar ? (
                <img src={hostProfile.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid '+S.p, boxSizing: 'border-box' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', border: '2px solid '+S.p, boxSizing: 'border-box' }}>
                  {hostProfile.name[0].toUpperCase()}
                </div>
              )}
              <span style={{ position: 'absolute', top: -4, right: -4 }}><Star size={10} strokeWidth={1.5} fill={S.p} color={S.p} /></span>
            </button>
          )}
          {members.slice(0, 5).map((m, i) => {
            const avatarUrl = memberAvatars[m.applicant_id]
            return (
              <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ marginLeft: i === 0 ? 0 : -8, display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid '+S.bg1, boxSizing: 'border-box' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', border: '2px solid '+S.bg1, boxSizing: 'border-box' }}>
                    {(memberNames[m.applicant_id] || (m.eps_json as any)?.profile_snapshot?.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </button>
            )
          })}
          {members.length > 5 && <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 600, color: S.tx2 }}>+{members.length - 5}</span>}
        </div>
        {/* Name links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {members.slice(0, 5).map(m => {
            const name = memberNames[m.applicant_id] || (m.eps_json as any)?.profile_snapshot?.display_name || 'Anonyme'
            return (
              <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ fontSize: 13, color: S.tx2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{name}{m.status === 'checked_in' && <Check size={10} strokeWidth={2.5} style={{ color: S.sage, display: 'inline', marginLeft: 2 }} />}{memberRoles[m.applicant_id] && <span style={{ fontSize: 10, color: S.p, marginLeft: 2 }}>{memberRoles[m.applicant_id]}</span>}</button>
            )
          })}
          {members.length > 5 && <span style={{ fontSize: 12, color: S.tx2 }}>+{members.length - 5}</span>}
        </div>
      </div>
      {/* Full member list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {members.map(m => {
          const eps = m.eps_json || {}
          const avatarUrl = memberAvatars[m.applicant_id]
          const role = memberRoles[m.applicant_id] || eps.role
          const name = memberNames[m.applicant_id] || (eps as any).profile_snapshot?.display_name || eps.displayName || 'Anonyme'
          return (
            <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {(name || '?')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>{name}{(eps as any).age ? ', ' + (eps as any).age : ''}</div>
                {role && <div style={{ fontSize: 11, color: S.tx2 }}>{role}</div>}
              </div>
              {m.status === 'checked_in' && <div style={{ fontSize: 11, color: S.sage, fontWeight: 600 }}>Check-in</div>}
            </button>
          )
        })}
      </div>
      {/* Bottom sheet */}
      {sheetMember && isMobile && (
        <>
          <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setSheetMember(null)} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: S.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: '1px solid '+S.rule, padding: '20px 20px 24px', zIndex: 50 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: S.tx2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              {memberAvatars[sheetMember.applicant_id] ? (
                <img src={memberAvatars[sheetMember.applicant_id]} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>
                  {(memberNames[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.profile_snapshot?.display_name || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.tx }}>{memberNames[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.profile_snapshot?.display_name || 'Anonyme'}</div>
                {(memberRoles[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.role) && (
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'white', background: S.p }}>
                    {memberRoles[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.role}
                  </span>
                )}
              </div>
            </div>
            {((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio) && (
              <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.5, margin: '0 0 16px' }}>
                {String((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio || '').slice(0, 120)}
                {String((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio || '').length > 120 ? '…' : ''}
              </p>
            )}
            <button onClick={() => { navigate('/profile/' + sheetMember.applicant_id); setSheetMember(null) }} style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.p, border: 'none', cursor: 'pointer' }}>
              {t('session.view_full_profile')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
