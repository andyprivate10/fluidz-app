import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Users, MapPin } from 'lucide-react'
import { colors } from '../../brand'
import { getSessionCover } from '../../lib/sessionCover'

const S = colors

type Props = {
  session: { title: string; status: string; tags?: string[]; approx_area: string; max_capacity?: number; host_id: string }
  members: { applicant_id: string; status: string }[]
  memberAvatars: Record<string, string>
  memberNames: Record<string, string>
  statusColor: string
  statusLabel: string
  elapsed: string
  remaining: string
  isHost: boolean
  hostProfile: { name: string; avatar?: string } | null
}

export default function SessionHero({ session, members, memberAvatars, memberNames, statusColor, statusLabel, elapsed, remaining, isHost, hostProfile }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={{ position: 'relative', minHeight: 200, overflow: 'hidden', borderBottom: '1px solid '+S.rule }}>
      <div style={{ position: 'absolute', inset: 0, background: getSessionCover(session.tags).bg }} />
      <div style={{ position: 'absolute', width: 260, height: 260, top: -100, right: -80, borderRadius: '50%', filter: 'blur(70px)', background: getSessionCover(session.tags).overlay, animation: 'orbDrift1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(to top, ${S.bg} 5%, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '16px 24px 20px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, lineHeight: 1.1 }}>{session.title}</h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: statusColor === S.sage ? S.sagebg : statusColor === S.red ? S.redbg : S.p2, border: '1px solid ' + (statusColor === S.sage ? S.sagebd : statusColor === S.red ? S.redbd : S.pbd), padding: '3px 10px', borderRadius: 50, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 3 }}>
            {session.status === 'open' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: 'blink 2s ease-in-out infinite' }} />}
            {statusLabel}
          </span>
          {members.length > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.tx2, display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} strokeWidth={1.5} />{members.length + 1}{session.max_capacity ? '/' + session.max_capacity : ''}</span>}
          {session.approx_area && <span style={{ fontSize: 10, fontWeight: 600, color: S.tx3, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={9} strokeWidth={1.5} />{session.approx_area}</span>}
          {elapsed && session.status === 'open' && <span style={{ fontSize: 10, fontWeight: 600, color: S.tx3, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} strokeWidth={1.5} />{elapsed}</span>}
          {remaining && session.status === 'open' && <span style={{ fontSize: 10, fontWeight: 600, color: S.p, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} strokeWidth={1.5} />{remaining === 'terminé' ? t('session.ended') : remaining}</span>}
        </div>

        {session.tags && session.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {session.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: S.p, padding: '3px 10px', borderRadius: 99, background: S.p2, border: '1px solid ' + S.pbd }}>{tag}</span>
            ))}
          </div>
        )}

        {members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, paddingLeft: 4 }}>
            {members.slice(0, 6).map((m, i) => {
              const avatar = memberAvatars[m.applicant_id]
              const name = memberNames[m.applicant_id] || '?'
              const isCheckedIn = m.status === 'checked_in'
              return (
                <div key={m.applicant_id} style={{ marginLeft: i > 0 ? -8 : 0, position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/profile/' + m.applicant_id)}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', padding: 2, background: isCheckedIn ? 'linear-gradient(135deg, '+S.p+', '+S.lav+')' : 'linear-gradient(135deg, '+S.p+'66, '+S.lav+'44)', boxShadow: isCheckedIn ? '0 0 8px '+S.p+'44' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {avatar ? (
                      <img src={avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.bg }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: S.tx2, border: '2px solid ' + S.bg }}>{name[0].toUpperCase()}</div>
                    )}
                  </div>
                  {isCheckedIn && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: S.sage, border: '2px solid ' + S.bg }} />}
                </div>
              )
            })}
            {members.length > 6 && (
              <div style={{ marginLeft: -8, width: 38, height: 38, borderRadius: '50%', background: S.bg2, border: '2px solid ' + S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: S.tx3 }}>+{members.length - 6}</div>
            )}
          </div>
        )}

        {!isHost && hostProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }} onClick={() => navigate('/profile/' + session.host_id)}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', padding: 1.5, background: 'linear-gradient(135deg, '+S.p+', '+S.lav+')' }}>
              {hostProfile.avatar ? (
                <img src={hostProfile.avatar} alt="" style={{ width: 25, height: 25, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid ' + S.bg }} />
              ) : (
                <div style={{ width: 25, height: 25, borderRadius: '50%', background: S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: S.p, fontWeight: 700, border: '1.5px solid ' + S.bg }}>{hostProfile.name[0]}</div>
              )}
            </div>
            <div>
              <span style={{ fontSize: 12, color: S.tx, fontWeight: 600 }}>{hostProfile.name}</span>
              <span style={{ fontSize: 10, color: S.tx3, marginLeft: 6 }}>Host</span>
            </div>
          </div>
        )}
        {isHost && <div style={{ marginTop: 8 }}><span style={{ fontSize: 10, fontWeight: 700, color: S.p, background: S.p2, border: '1px solid ' + S.pbd, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host</span></div>}
      </div>
    </div>
  )
}
