import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { colors } from '../../brand'

const S = colors
const card: React.CSSProperties = { background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 20, padding: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }

type PendingApp = { id: string; applicant_id: string; display_name?: string | null; avatar_url?: string | null }

type Props = {
  memberCount: number
  pendingApps: PendingApp[]
  currentUserId: string | undefined
  getVoteStats: (applicantId: string) => { yesCount: number; noCount: number; myVote: string | null | undefined }
  onVote: (applicantId: string, choice: 'yes' | 'no') => void
  voteLoadingId: string | null
}

export default function SessionVotes({ memberCount, pendingApps, currentUserId, getVoteStats, onVote, voteLoadingId }: Props) {
  const { t } = useTranslation()

  if (memberCount < 3) {
    return <div style={card}><p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>{t('session.vote_needs_3')}</p></div>
  }

  const visible = pendingApps.filter(p => !currentUserId || p.applicant_id !== currentUserId)

  return (
    <div style={card}>
      <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{t('session.section_vote')}</div>
      {visible.length === 0 ? (
        <p style={{ fontSize: 13, color: S.tx2, margin: '4px 0 0' }}>{t('session.no_pending')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(p => {
            const { yesCount, noCount, myVote } = getVoteStats(p.applicant_id)
            const disabled = !!myVote || voteLoadingId === p.applicant_id
            const name = p.display_name || 'Anonyme'
            return (
              <div key={p.id} style={{ padding: 10, borderRadius: 12, background: S.bg, border: '1px solid '+S.rule, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {name[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>{name}</div>
                    <div style={{ fontSize: 11, color: S.tx2 }}>{t('session.application_pending')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={disabled} onClick={() => onVote(p.applicant_id, 'yes')} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 999,
                    border: '1px solid ' + (myVote === 'yes' ? S.p : S.pbd),
                    background: myVote === 'yes' ? S.p : 'transparent',
                    color: myVote === 'yes' ? S.bg : S.p,
                    fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled && myVote !== 'yes' ? 0.5 : 1,
                  }}>
                    <span style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}><ThumbsUp size={14} /> {t('common.yes')}</span>
                  </button>
                  <button type="button" disabled={disabled} onClick={() => onVote(p.applicant_id, 'no')} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 999,
                    border: '1px solid ' + (myVote === 'no' ? S.p : S.rule),
                    background: myVote === 'no' ? S.rule : 'transparent',
                    color: myVote === 'no' ? S.p : S.tx2,
                    fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled && myVote !== 'no' ? 0.5 : 1,
                  }}>
                    <span style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}><ThumbsDown size={14} /> {t('common.no')}</span>
                  </button>
                </div>
                <div style={{ fontSize: 12, color: S.tx2, textAlign: 'right' }}>
                  {t('session.vote_count', { yes: yesCount, no: noCount })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: S.tx2, marginTop: 8 }}>{t('session.vote_info')}</p>
    </div>
  )
}
