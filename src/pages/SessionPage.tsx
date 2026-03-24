import { colors } from '../brand'
import ConfirmDialog from '../components/ConfirmDialog'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { SkeletonSessionPage } from '../components/Skeleton'
import SessionHero from '../components/session/SessionHero'
import SessionQuickActions from '../components/session/SessionQuickActions'
import SessionContentCards from '../components/session/SessionContentCards'
import SessionLineup from '../components/session/SessionLineup'
import SessionVotes from '../components/session/SessionVotes'
import SessionStatusCard from '../components/session/SessionStatusCard'
import SessionEndedSection from '../components/session/SessionEndedSection'
import ShareToContact from '../components/ShareToContact'
import { useSessionData } from '../hooks/useSessionData'

const S = colors
const st: React.CSSProperties = { background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 96 }

export default function SessionPage() {
  const d = useSessionData()

  if (d.loading) return <SkeletonSessionPage />
  if (d.loadError) return (
    <div style={{ ...st, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center' }}>{d.t('common.load_error')}</p>
    </div>
  )
  if (!d.session) return <div style={{ ...st, padding: 24, color: S.red }}>{d.t('session.not_found')}</div>

  const statusColor = d.session.status === 'open' ? S.sage : d.session.status === 'ended' ? S.red : S.tx2

  return (
    <div style={st} onTouchStart={d.handleTouchStart} onTouchEnd={d.handleTouchEnd}>
      <OrbLayer />
      {d.isRefreshing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: S.bg1, borderBottom: '1px solid '+S.rule }}>
          <div style={{ width: 24, height: 24, border: '2px solid '+S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
      <EventContextNav role={d.eventRole} sessionTitle={d.session.title} />

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
        pendingCount={d.pendingCount}
      />

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

        <SessionVotes
          memberCount={d.members.length}
          pendingApps={d.pendingApps}
          currentUserId={d.currentUser?.id}
          getVoteStats={d.getVoteStats}
          onVote={d.handleVote}
          voteLoadingId={d.voteLoadingId}
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

      {(!d.isHost && (d.showPostulerSuccess || (!d.myApp && d.session.status === 'open'))) && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 20px 24px', background: 'linear-gradient(to top, '+S.bg+' 60%, transparent)', zIndex: 50 }}>
          {d.showPostulerSuccess ? (
            <button disabled style={{ width: '100%', padding: 16, background: S.sagebg, border: '1px solid '+S.sage, borderRadius: 14, color: S.sage, fontSize: 16, fontWeight: 700 }}>
              {d.t('session.applied')}
            </button>
          ) : d.session.max_capacity && (d.members.length + 1) >= d.session.max_capacity ? (
            <button disabled style={{ width: '100%', padding: 16, background: S.redbg, border: '1px solid ' + S.redbd, borderRadius: 14, color: S.red, fontSize: 16, fontWeight: 700 }}>
              {d.t('session.full')}
            </button>
          ) : (
            <button onClick={() => d.currentUser ? d.navigate('/session/' + d.id + '/apply') : (d.session!.invite_code ? d.navigate('/join/' + d.session!.invite_code) : d.navigate('/me'))} className='btn-shimmer' style={{ width: '100%', padding: 16, background: S.p, border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', position: 'relative' as const, overflow: 'hidden', boxShadow: '0 4px 20px ' + S.pbd }}>
              {d.t('session.apply_cta')}
            </button>
          )}
        </div>
      )}
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
