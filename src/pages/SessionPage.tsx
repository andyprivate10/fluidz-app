import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { colors } from '../brand'
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
import ShareToContact from '../components/ShareToContact'
import { useSessionData } from '../hooks/useSessionData'
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

  async function handleDecide(appId: string, status: 'accepted' | 'rejected') {
    setActionLoading(appId)
    const { error } = await supabase.from('applications').update({ status }).eq('id', appId)
    if (error) { showToast(t('errors.error_prefix') + ': ' + error.message, 'error') }
    else {
      showToast(status === 'accepted' ? t('host_actions.accepted') : t('host_actions.rejected'), 'success')
      d.loadData()
    }
    setActionLoading(null)
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
    <div style={{ ...st, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center' }}>{d.t('common.load_error')}</p>
    </div>
  )
  if (!d.session) return <div style={{ ...st, padding: 24, color: S.red }}>{d.t('session.not_found')}</div>

  const statusColor = d.session.status === 'open' ? S.sage : d.session.status === 'ended' ? S.red : S.tx2

  // Count pending votes for member badge
  const pendingVoteCount = d.pendingApps.filter(app => {
    const { myVote } = d.getVoteStats(app.applicant_id)
    return !myVote
  }).length

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
          />
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

      {/* ═══ TAB: candidates (HOST) ═══ */}
      {activeTab === 'candidates' && effectiveRole === 'host' && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.candidates')}
            {d.pendingApps.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: S.red, background: S.redbg, border: '1px solid ' + S.redbd, padding: '2px 8px', borderRadius: 99 }}>{d.pendingApps.length}</span>}
          </h2>
          {d.pendingApps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: S.tx3 }}>
              <p style={{ fontSize: 14 }}>{t('host.no_pending')}</p>
            </div>
          )}
          {d.pendingApps.map(app => {
            const vs = d.getVoteStats(app.applicant_id)
            return (
              <div key={app.id} style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {app.avatar_url ? (
                    <img src={app.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + S.pbd }} />
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
                  </div>
                </div>
                {/* Accept / Reject buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleDecide(app.id, 'rejected')} disabled={actionLoading === app.id} style={{ flex: 1, padding: 10, borderRadius: 12, fontWeight: 700, fontSize: 13, color: S.red, border: '1px solid ' + S.redbd, background: S.redbg, cursor: 'pointer' }}>
                    {t('host.refuse')}
                  </button>
                  <button onClick={() => handleDecide(app.id, 'accepted')} disabled={actionLoading === app.id} style={{ flex: 2, padding: 10, borderRadius: 12, fontWeight: 700, fontSize: 13, color: '#fff', background: S.p, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px ' + S.pbd }}>
                    {actionLoading === app.id ? '...' : t('host_actions.accept')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ TAB: vote (MEMBER) ═══ */}
      {activeTab === 'vote' && effectiveRole === 'member' && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.vote')}
          </h2>
          <SessionVotes
            memberCount={d.members.length}
            pendingApps={d.pendingApps}
            currentUserId={d.currentUser?.id}
            getVoteStats={d.getVoteStats}
            onVote={d.handleVote}
            voteLoadingId={d.voteLoadingId}
          />
        </div>
      )}

      {/* ═══ TAB: application (CANDIDATE) ═══ */}
      {activeTab === 'application' && effectiveRole === 'candidate' && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: S.tx, margin: '0 0 16px' }}>
            {t('session_nav.application')}
          </h2>
          {!d.myApp && d.session.status === 'open' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: S.tx2, fontSize: 14, marginBottom: 20 }}>{t('session.no_application_yet')}</p>
              <button onClick={() => navigate('/session/' + d.id + '/apply')} style={{
                padding: '14px 32px', borderRadius: 16, background: S.p, border: 'none',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
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
                {t('session.status_rejected')}
              </span>
              <p style={{ color: S.tx2, fontSize: 13, marginTop: 12 }}>{t('session.rejected_desc')}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: chat ═══ */}
      {activeTab === 'chat' && (
        <div style={{ padding: '16px' }}>
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
        badges={{ candidates: d.pendingCount, votes: pendingVoteCount }}
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
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        opacity: disabled ? 0.5 : 1,
      }}
      title={disabledText}
    >
      {label}
    </button>
  )
}
