import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../Toast'
import { VibeScoreBadge } from '../VibeScoreBadge'
import { colors, glassCard } from '../../brand'

const S = colors

type Vote = { applicant_id: string; vote: string }

type Props = {
  app: any
  sessionId: string
  sessionTitle?: string
  votes: Vote[]
  actionLoading: string | null
  onDecide: (appId: string, status: 'accepted' | 'rejected') => void
  onConfirmCheckIn: (appId: string) => void
}

export default function HostCandidateCard({ app, sessionId, sessionTitle, votes, actionLoading, onDecide, onConfirmCheckIn }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const prof = app.user_profiles
  const pj = prof?.profile_json || {}
  const snapshot = app.eps_json?.profile_snapshot || {}
  const isGhost = !!app.eps_json?.is_phantom || prof?.display_name === 'Invité'
  const displayName = prof?.display_name || snapshot?.display_name || 'Anonyme'
  const displayRole = pj.role || snapshot?.role

  return (
    <div style={{ ...glassCard, borderRadius: 18, overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: 16 }}>
        {/* Header: name + role + view profile */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: S.tx }}>
              <Link to={'/profile/' + app.applicant_id} style={{ color: S.tx, textDecoration: 'none' }}>{displayName}</Link>
            </p>
            {isGhost && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: S.tx4, color: S.tx2, border: '1px solid ' + S.rule }}>Ghost</span>}
            {displayRole && <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: S.p2, color: S.p, border: '1px solid ' + S.pbd }}>{displayRole}</span>}
            {!isGhost && <VibeScoreBadge userId={app.applicant_id} />}
          </div>
          <button onClick={() => navigate('/session/' + sessionId + '/candidate/' + app.applicant_id)} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, color: S.tx3, border: '1px solid ' + S.rule, background: 'transparent', cursor: 'pointer' }}>{t('host.view_profile')}</button>
        </div>

        {/* Age + location */}
        {(pj.age || snapshot?.age) && <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 4px' }}>{pj.age || snapshot.age} ans{pj.location || snapshot?.location ? ' · ' + (pj.location || snapshot.location) : ''}</p>}
        {(pj.bio || snapshot?.bio) && <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 8px', lineHeight: 1.4 }}>{pj.bio || snapshot.bio}</p>}

        {/* Tags: morphology + kinks */}
        {(pj.morphology || (isGhost && snapshot?.morphology)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[pj.morphology || snapshot?.morphology, ...(pj.kinks || snapshot?.kinks || []).slice(0, 3)].filter(Boolean).map((tag: string, i: number) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: S.bg2, color: S.tx3, border: '1px solid ' + S.rule }}>{tag}</span>
            ))}
            {(pj.kinks || snapshot?.kinks || []).length > 3 && <span style={{ fontSize: 11, color: S.tx4 }}>+{(pj.kinks || snapshot?.kinks).length - 3}</span>}
          </div>
        )}

        {/* Message to host */}
        {app.eps_json?.message && (
          <div style={{ padding: '10px 12px', background: S.bg2, borderRadius: 10, border: '1px solid ' + S.bluebd, marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: S.blue, fontWeight: 700, margin: '0 0 2px' }}>{t('host.message_to_host')}</p>
            <p style={{ fontSize: 13, color: S.tx2, margin: 0, lineHeight: 1.4 }}>{app.eps_json.message}</p>
          </div>
        )}

        {/* Occasion note */}
        {app.eps_json?.occasion_note && (
          <div style={{ padding: '10px 12px', background: S.bg2, borderRadius: 10, border: '1px solid ' + S.pbd, marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: S.p, fontWeight: 700, margin: '0 0 2px' }}>{t('host.session_note')}</p>
            <p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>{app.eps_json.occasion_note}</p>
          </div>
        )}

        {/* Limits */}
        {(pj.limits || (isGhost && snapshot?.limits)) && (
          <div style={{ padding: '8px 12px', background: S.redbg, borderRadius: 10, border: '1px solid ' + S.redbd, marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: S.red, fontWeight: 700, margin: '0 0 2px' }}>{t('host.limits_label')}</p>
            <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{pj.limits || snapshot?.limits}</p>
          </div>
        )}

        {/* Pending: votes + accept/reject */}
        {app.status === 'pending' && (
          <div style={{ marginTop: 10 }}>
            {(() => {
              const appVotes = votes.filter(v => v.applicant_id === app.applicant_id)
              const yes = appVotes.filter(v => v.vote === 'yes').length
              const no = appVotes.filter(v => v.vote === 'no').length
              if (yes + no === 0) return null
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: S.bg2, borderRadius: 10, border: '1px solid ' + S.rule }}>
                  <span style={{ fontSize: 12, color: S.tx3 }}>{t('host.votes_label')}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.sage, display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={14} /> {yes}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.red, display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsDown size={14} /> {no}</span>
                </div>
              )
            })()}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onDecide(app.id, 'rejected')} disabled={actionLoading === app.id} style={{ flex: 1, padding: 11, borderRadius: 12, fontWeight: 700, fontSize: 14, color: S.red, border: '1px solid ' + S.redbd, background: S.redbg, cursor: 'pointer' }}>
                {t('host.refuse')}
              </button>
              <button onClick={() => onDecide(app.id, 'accepted')} disabled={actionLoading === app.id} className="btn-shimmer" style={{ flex: 2, padding: 11, borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px ' + S.pbd }}>
                {actionLoading === app.id ? '...' : t('host_actions.accept')}
              </button>
            </div>
          </div>
        )}

        {/* Accepted / checked_in actions */}
        {(app.status === 'accepted' || app.status === 'checked_in') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
            {app.status === 'accepted' && app.checked_in === true && (
              <>
                <span style={{ fontSize: 12, color: S.orange, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: S.orangebg, border: '1px solid ' + S.orangebd }}>{t('host.arrival_to_confirm')}</span>
                <button onClick={() => onConfirmCheckIn(app.id)} disabled={actionLoading === app.id} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: S.sage, border: '1px solid ' + S.sage, background: S.sagebg, cursor: 'pointer' }}>
                  {actionLoading === app.id ? '...' : <><Check size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 2 }} />{t('host.confirm_checkin')}</>}
                </button>
              </>
            )}
            {app.status === 'checked_in' && (
              <span style={{ fontSize: 12, color: S.sage, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Check size={12} strokeWidth={2.5} />{t('host.arrived_badge')}</span>
            )}
            {app.status === 'accepted' && !app.checked_in && (
              <span style={{ fontSize: 12, color: S.sage, fontWeight: 600 }}>{t('host.accepted_route')}</span>
            )}
            <button onClick={() => navigate('/session/' + sessionId + '/dm/' + app.applicant_id)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, color: S.p, border: '1px solid ' + S.pbd, background: 'transparent', cursor: 'pointer' }}>DM</button>
            {app.status === 'accepted' && !app.checked_in && (
              <button onClick={async () => {
                await supabase.from('notifications').insert({
                  user_id: app.applicant_id, session_id: sessionId, type: 'nudge',
                  title: t('host.nudge_title'),
                  body: (sessionTitle || 'Session') + ' ' + t('host.nudge_body_suffix'),
                  href: '/session/' + sessionId,
                })
                showToast(t('host.nudge_sent'), 'success')
              }} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, color: S.p, border: '1px solid ' + S.amberbd, background: 'transparent', cursor: 'pointer' }}>{t('host.nudge_btn')}</button>
            )}
            <button onClick={() => onDecide(app.id, 'rejected')} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: S.tx3, border: '1px solid ' + S.rule, background: 'transparent', cursor: 'pointer' }}>{t('host.cancel_app')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
