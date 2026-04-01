import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { colors, fonts } from '../brand'
import ConfirmDialog from '../components/ConfirmDialog'
import OrbLayer from '../components/OrbLayer'
import { SkeletonSessionPage } from '../components/Skeleton'
import SessionBottomNav from '../components/session/SessionBottomNav'
import SessionHero from '../components/session/SessionHero'
import SessionQuickActions from '../components/session/SessionQuickActions'
import SessionContentCards from '../components/session/SessionContentCards'
import SessionLineup from '../components/session/SessionLineup'
import SessionVotes from '../components/session/SessionVotes'
import SessionStatusCard from '../components/session/SessionStatusCard'
import SessionEndedSection from '../components/session/SessionEndedSection'
import SessionShareTab from '../components/session/SessionShareTab'
import SessionStory from '../components/session/SessionStory'
import ShareToContact from '../components/ShareToContact'
import { useSessionData } from '../hooks/useSessionData'
import PanicButton from '../components/PanicButton'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'

const S = colors
const st: React.CSSProperties = { background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 72 }

export default function SessionPage() {
  const d = useSessionData()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'session')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ appId: string; name: string } | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')

  // Load bookmark state
  useEffect(() => {
    if (!d.currentUser) return
    supabase.from('user_profiles').select('profile_json').eq('id', d.currentUser.id).maybeSingle().then(({ data }) => {
      const bm = (data?.profile_json as any)?.bookmarked_sessions
      if (Array.isArray(bm) && d.id && bm.includes(d.id)) setBookmarked(true)
    })
  }, [d.currentUser, d.id])

  const toggleBookmark = useCallback(async () => {
    if (!d.currentUser) return
    const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', d.currentUser.id).maybeSingle()
    const pj = (data?.profile_json || {}) as Record<string, unknown>
    const bm = Array.isArray(pj.bookmarked_sessions) ? [...pj.bookmarked_sessions] : []
    const isNow = bm.includes(d.id)
    const next = isNow ? bm.filter((id: string) => id !== d.id) : [...bm, d.id]
    await supabase.from('user_profiles').update({ profile_json: { ...pj, bookmarked_sessions: next } }).eq('id', d.currentUser.id)
    setBookmarked(!isNow)
    showToast(isNow ? t('session.unbookmarked') : t('session.bookmarked'), isNow ? 'info' : 'success')
  }, [d.currentUser, d.id, t])

  async function handleDecide(appId: string, status: 'accepted' | 'rejected') {
    if (status === 'rejected') {
      const app = d.pendingApps.find(a => a.id === appId)
      setRejectTarget({ appId, name: app?.display_name || '' })
      return
    }
    // Accept flow
    setActionLoading(appId)
    const { error } = await supabase.from('applications').update({ status }).eq('id', appId)
    if (error) { showToast(t('errors.error_prefix') + ': ' + error.message, 'error') }
    else {
      showToast(t('host_actions.accepted'), 'success')
      const app = d.pendingApps.find(a => a.id === appId)
      if (app) {
        await supabase.from('notifications').insert({
          user_id: app.applicant_id,
          session_id: d.id,
          type: 'application_accepted',
          title: t('notifications.accepted_title'),
          body: d.session?.title || '',
          href: '/session/' + d.id,
        })
      }
      d.loadData()
    }
    setActionLoading(null)
  }

  async function confirmReject() {
    if (!rejectTarget) return
    setActionLoading(rejectTarget.appId)
    const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', rejectTarget.appId)
    if (error) { showToast(t('errors.error_prefix') + ': ' + error.message, 'error') }
    else {
      showToast(t('host_actions.not_selected'), 'success')
      const app = d.pendingApps.find(a => a.id === rejectTarget.appId)
      if (app) {
        await supabase.from('notifications').insert({
          user_id: app.applicant_id,
          session_id: d.id,
          type: 'application_not_selected',
          title: t('session.not_selected_title'),
          body: rejectMessage.trim() || t('session.not_selected_body', { title: d.session?.title || '' }),
          href: '/session/' + d.id,
        })
      }
      d.loadData()
    }
    setActionLoading(null)
    setRejectTarget(null)
    setRejectMessage('')
  }

  // Determine if visitor (not logged in or no application and not host)
  const effectiveRole: 'host' | 'member' | 'candidate' | 'visitor' =
    !d.currentUser ? 'visitor' :
    d.eventRole === 'candidate' && !d.myApp ? 'visitor' :
    d.eventRole

  // Sync tab from URL on mount
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setActiveTab(t)
  }, [searchParams])

  if (d.loading) return <SkeletonSessionPage />
  if (d.loadError) return (
    <div style={{ ...st, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center', marginBottom: 16 }}>{d.t('common.load_error')}</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 12, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{d.t('common.back')}</button>
    </div>
  )
  if (!d.session) return (
    <div style={{ ...st, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center', marginBottom: 16 }}>{d.t('session.not_found')}</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 12, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{d.t('common.back')}</button>
    </div>
  )

  const statusColor = d.session.status === 'open' ? S.sage : d.session.status === 'ending_soon' ? S.amber : d.session.status === 'ended' ? S.red : S.tx2

  function handleTabChange(tab: string) {
    // Handle special tab actions
    if (tab === 'apply') {
      if (!d.currentUser) {
        navigate('/login?next=/session/' + d.id + '/apply')
        return
      }
      navigate('/session/' + d.id + '/apply')
      return
    }
    setActiveTab(tab)
  }

  return (
    <div style={st} onTouchStart={d.handleTouchStart} onTouchEnd={d.handleTouchEnd}>
      <OrbLayer />
      {d.isRefreshing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: S.bg1, borderBottom: '1px solid ' + S.rule }}>
          <div style={{ width: 24, height: 24, border: '2px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ═══ TAB: session ═══ */}
      {activeTab === 'session' && (
        <>
          <SessionHero
            session={d.session}
            members={d.members}
            memberAvatars={d.memberAvatars}
            memberNames={d.memberNames}
            statusColor={statusColor}
            statusLabel={d.statusLabel}
            elapsed={d.elapsed}
            remaining={d.remaining}
            isHost={d.isHost}
            hostProfile={d.hostProfile}
            onEndSession={d.endSession}
            isBookmarked={bookmarked}
            onToggleBookmark={toggleBookmark}
          />
          {/* Ending soon banner */}
          {d.session.status === 'ending_soon' && d.isHost && (
            <div style={{ margin: '0 16px 8px', padding: '12px 16px', borderRadius: 14, background: S.amberbg, border: '1px solid ' + S.amberbd, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: S.amber }}>{d.t('session.ending_soon_title')}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: S.tx3 }}>{d.t('session.ending_soon_desc')}</p>
              </div>
              <button onClick={async () => {
                const newEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                await supabase.rpc('rpc_extend_session', { p_session_id: d.id, p_new_ends_at: newEnd })
                d.refresh()
              }} style={{ padding: '8px 14px', borderRadius: 10, background: S.sage, border: 'none', color: S.tx, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                {d.t('session.extend_2h')}
              </button>
            </div>
          )}
          {d.session.status !== 'ended' && (
            <SessionQuickActions
              sessionId={d.id!}
              eventRole={d.eventRole}
              exactAddress={d.session.exact_address}
              status={d.session.status}
              inviteCode={d.session.invite_code}
              checkInDone={d.checkInDone}
              checkInLoading={d.checkInLoading}
              onCheckIn={d.handleCheckIn}
              myApp={d.myApp}
            />
          )}
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SessionContentCards
              session={d.session}
              myApp={d.myApp}
              members={d.members}
              memberRoles={d.memberRoles}
              addressCopied={d.addressCopied}
              copyAddress={d.copyAddress}
            />
            <SessionLineup
              members={d.members}
              memberAvatars={d.memberAvatars}
              memberNames={d.memberNames}
              memberRoles={d.memberRoles}
              hostProfile={d.hostProfile}
              hostId={d.session.host_id}
              isMobile={d.isMobile}
            />
            <SessionStatusCard
              session={d.session}
              sessionId={d.id!}
              myApp={d.myApp}
              currentUser={d.currentUser}
              checkInDone={d.checkInDone}
              members={d.members}
              memberNames={d.memberNames}
              memberAvatars={d.memberAvatars}
              copied={d.copied}
              copyMessage={d.copyMessage}
              inviteLinkCopied={d.inviteLinkCopied}
              copyInviteLink={d.copyInviteLink}
              onCancel={d.cancelApplication}
              onLeave={d.leaveSession}
              setShowShareSheet={d.setShowShareSheet}
            />
          </div>
          {/* Panic button for members in live session */}
          {effectiveRole === 'member' && d.session.status !== 'ended' && d.session.host_id && d.id && (
            <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'flex-end' }}>
              <PanicButton sessionId={d.id} hostId={d.session.host_id} sessionTitle={d.session.title} />
            </div>
          )}
          <SessionEndedSection
            session={d.session}
            sessionId={d.id!}
            isHost={d.isHost}
            currentUser={d.currentUser}
            myApp={d.myApp}
            members={d.members}
            reviewSummary={d.reviewSummary}
          />
        </>
      )}

      {/* ═══ TAB: participants (HOST + MEMBER) ═══ */}
      {activeTab === 'participants' && (effectiveRole === 'host' || effectiveRole === 'member') && (
        <div className="tab-content" style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.body, color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.participants')}
          </h2>

          {/* Check-in requests (host only) */}
          {effectiveRole === 'host' && d.checkInRequests.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.sage, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('session.check_in_requests')}
              </h3>
              {d.checkInRequests.map(req => (
                <div key={req.id} style={{ background: S.sagebg, border: '1px solid ' + S.sagebd, borderRadius: 16, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" loading="lazy" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + S.sagebd }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '28%', background: S.sagebg, border: '2px solid ' + S.sagebd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.sage }}>
                      {(req.display_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{req.display_name || t('common.anonymous')}</p>
                    <p style={{ fontSize: 11, color: S.sage, margin: '2px 0 0' }}>{t('session.check_in_requested')}</p>
                  </div>
                  <button onClick={() => d.confirmCheckIn(req.applicant_id)} style={{ padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, color: S.tx, background: S.sage, border: 'none', cursor: 'pointer' }}>
                    {t('session.confirm_check_in')}
                  </button>
                </div>
              ))}
              <div style={{ height: 12 }} />
            </>
          )}

          {/* Members section */}
          {d.members.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.tx2, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('session.members_section')} ({d.members.length})
              </h3>
              {d.members.map(m => {
                const avatar = d.memberAvatars[m.applicant_id]
                const name = d.memberNames[m.applicant_id] || t('common.anonymous')
                const isCheckedIn = m.status === 'checked_in'
                return (
                  <div key={m.applicant_id} onClick={() => navigate('/profile/' + m.applicant_id)} style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    {avatar ? (
                      <img src={avatar} alt="" loading="lazy" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + (isCheckedIn ? S.sage : S.pbd) }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '28%', background: S.bg2, border: '2px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.tx2 }}>
                        {name[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{name}</p>
                      {isCheckedIn && <p style={{ fontSize: 11, color: S.sage, margin: '2px 0 0' }}>✓ {t('session.checked_in')}</p>}
                    </div>
                  </div>
                )
              })}
              <div style={{ height: 12 }} />
            </>
          )}

          {/* Pending candidates (host only) */}
          {effectiveRole === 'host' && d.pendingApps.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.orange, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('session.pending_candidates')} ({d.pendingApps.length})
              </h3>
              {d.pendingApps.map(app => {
                const vs = d.getVoteStats(app.applicant_id)
                return (
                  <div key={app.id} style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {app.avatar_url ? (
                        <img src={app.avatar_url} alt="" loading="lazy" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + S.pbd }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '28%', background: S.p2, border: '2px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.p }}>
                          {(app.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0, cursor: 'pointer' }} onClick={() => navigate('/session/' + d.id + '/candidate/' + app.applicant_id)}>
                          {app.display_name || t('common.anonymous')}
                        </p>
                        <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>
                          {vs.yesCount > 0 || vs.noCount > 0 ? `${vs.yesCount} ✓ · ${vs.noCount} ✗` : t('host.no_votes_yet')}
                        </p>
                        {vs.noCount > vs.yesCount && vs.noCount > 0 && (
                          <p style={{ fontSize: 10, fontWeight: 700, color: S.amber, margin: '2px 0 0' }}>⚠ {t('session.vote_majority_warning')}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDecide(app.id, 'rejected')} disabled={actionLoading === app.id} style={{ flex: 1, padding: 10, borderRadius: 12, fontWeight: 700, fontSize: 13, color: S.red, border: '1px solid ' + S.redbd, background: S.redbg, cursor: 'pointer' }}>
                        {t('host.refuse')}
                      </button>
                      <button onClick={() => handleDecide(app.id, 'accepted')} disabled={actionLoading === app.id} style={{ flex: 2, padding: 10, borderRadius: 12, fontWeight: 700, fontSize: 13, color: S.tx, background: S.p, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px ' + S.pbd }}>
                        {actionLoading === app.id ? '...' : t('host_actions.accept')}
                      </button>
                    </div>
                  </div>
                )
              })}
              <div style={{ height: 12 }} />
            </>
          )}

          {/* Vote section (member only, when pending apps exist) */}
          {effectiveRole === 'member' && d.pendingApps.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.lav, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('session_nav.vote')}
              </h3>
              <SessionVotes
                memberCount={d.members.length}
                pendingApps={d.pendingApps}
                currentUserId={d.currentUser?.id}
                getVoteStats={d.getVoteStats}
                onVote={d.handleVote}
                voteLoadingId={d.voteLoadingId}
              />
            </>
          )}

          {/* Rejected (host only, collapsed) */}
          {effectiveRole === 'host' && d.rejectedApps && d.rejectedApps.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, color: S.tx4, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('session.rejected_section')} ({d.rejectedApps.length})
              </summary>
              <div style={{ marginTop: 8 }}>
                {d.rejectedApps.map(app => (
                  <div key={app.id} style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 12, padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '28%', background: S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: S.tx3 }}>
                      {(app.display_name || '?')[0].toUpperCase()}
                    </div>
                    <p style={{ fontSize: 13, color: S.tx3, margin: 0 }}>{app.display_name || t('common.anonymous')}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Empty state */}
          {d.members.length === 0 && d.pendingApps.length === 0 && (!d.checkInRequests || d.checkInRequests.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: S.tx3 }}>
              <Users size={32} strokeWidth={1.5} style={{ color: S.tx4, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: S.tx2, margin: '0 0 6px' }}>{t('host.no_candidates_title')}</p>
              <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 20px', lineHeight: 1.5 }}>{t('host.no_candidates_desc')}</p>
              <button onClick={() => handleTabChange('share')} style={{ padding: '12px 24px', borderRadius: 14, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('host.share_session')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: story ═══ */}
      {activeTab === 'story' && d.id && (
        <SessionStory sessionId={d.id} />
      )}

      {/* ═══ TAB: share (HOST) ═══ */}
      {activeTab === 'share' && effectiveRole === 'host' && d.session && (
        <div className="tab-content" style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.body, color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.share')}
          </h2>
          <SessionShareTab
            session={d.session}
          />
        </div>
      )}

      {/* ═══ TAB: application (CANDIDATE) ═══ */}
      {activeTab === 'application' && effectiveRole === 'candidate' && (
        <div className="tab-content" style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.body, color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.application')}
          </h2>
          {!d.myApp && d.session.status === 'open' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: S.tx2, fontSize: 14, marginBottom: 20 }}>{t('session.no_application_yet')}</p>
              <button onClick={() => navigate('/session/' + d.id + '/apply')} style={{
                padding: '14px 32px', borderRadius: 16, background: S.p, border: 'none',
                color: S.tx, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px ' + S.pbd,
              }}>{t('session.apply_cta')}</button>
            </div>
          )}
          {d.myApp?.status === 'pending' && (
            <div style={{ background: S.bg1, border: '1px solid ' + S.orangebd, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: S.orange, background: S.orangebg, border: '1px solid ' + S.orangebd, padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase' }}>
                {t('session.status_pending')}
              </span>
              <p style={{ color: S.tx2, fontSize: 13, marginTop: 12 }}>{t('session.pending_desc')}</p>
              <button onClick={d.cancelApplication} style={{
                marginTop: 12, padding: '10px 24px', borderRadius: 12,
                background: 'transparent', border: '1px solid ' + S.redbd, color: S.red,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{t('session.cancel_application')}</button>
            </div>
          )}
          {d.myApp?.status === 'rejected' && (
            <div style={{ background: S.bg1, border: '1px solid ' + S.redbd, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: S.red, background: S.redbg, border: '1px solid ' + S.redbd, padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase' }}>
                {t('session.status_not_selected')}
              </span>
              <p style={{ color: S.tx2, fontSize: 13, marginTop: 12 }}>{t('session.not_selected_desc')}</p>
            </div>
          )}
          {d.myApp?.status === 'withdrawn' && (
            <div style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: S.tx2, background: S.bg2, border: '1px solid ' + S.rule, padding: '4px 12px', borderRadius: 99, textTransform: 'uppercase' }}>
                {t('session.status_withdrawn')}
              </span>
              <p style={{ color: S.tx2, fontSize: 13, marginTop: 12 }}>{t('session.withdrawn_desc')}</p>
              <button onClick={() => navigate('/session/' + d.id + '/apply')} style={{
                marginTop: 12, padding: '12px 24px', borderRadius: 14, background: S.p, border: 'none',
                color: S.tx, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>{t('session.reapply')}</button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: chat ═══ */}
      {activeTab === 'chat' && (
        <div className="tab-content" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <ChatSubTab
              label={t('session_nav.dm_host')}
              active={true}
              onClick={() => navigate('/session/' + d.id + '/dm')}
            />
            <ChatSubTab
              label={t('session_nav.group_chat')}
              active={false}
              disabled={effectiveRole === 'candidate'}
              disabledText={effectiveRole === 'candidate' ? t('session_nav.chat_after_accept') : undefined}
              onClick={() => navigate('/session/' + d.id + '/chat')}
            />
          </div>
        </div>
      )}

      <SessionBottomNav
        sessionId={d.id!}
        role={effectiveRole}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        badges={{ candidates: d.pendingCount }}
        sessionStatus={d.session.status}
      />

      <ShareToContact
        open={d.showShareSheet}
        onClose={() => d.setShowShareSheet(false)}
        shareType="session"
        shareId={d.id || ''}
        shareTitle={d.session.title}
        shareSubtitle={d.session.approx_area}
      />
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: S.bg1, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, border: '1px solid ' + S.rule }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: '0 0 8px' }}>{t('session.not_selected_dialog_title')}</h3>
            <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 16px' }}>{t('session.not_selected_dialog_desc', { name: rejectTarget.name })}</p>
            <textarea
              value={rejectMessage}
              onChange={e => setRejectMessage(e.target.value)}
              placeholder={t('session.rejection_message_placeholder')}
              maxLength={200}
              style={{ width: '100%', minHeight: 80, background: S.bg2, color: S.tx, border: '1px solid ' + S.rule, borderRadius: 12, padding: 12, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setRejectTarget(null); setRejectMessage('') }} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('common.cancel')}
              </button>
              <button onClick={confirmReject} disabled={actionLoading === rejectTarget.appId} style={{ flex: 1, padding: 12, borderRadius: 12, background: S.redbg, border: '1px solid ' + S.redbd, color: S.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {actionLoading === rejectTarget.appId ? '...' : t('session.confirm_not_selected')}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...d.confirmDialogProps} />
    </div>
  )
}

function ChatSubTab({ label, active, onClick, disabled, disabledText }: { label: string; active: boolean; onClick: () => void; disabled?: boolean; disabledText?: string }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 12,
        background: active ? colors.p2 : colors.bg1,
        border: '1px solid ' + (active ? colors.pbd : colors.rule),
        color: disabled ? colors.tx3 : active ? colors.p : colors.tx,
        fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
        fontFamily: fonts.body,
        opacity: disabled ? 0.5 : 1,
      }}
      title={disabledText}
    >
      {label}
    </button>
  )
}
