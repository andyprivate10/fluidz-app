import { Clock, MessageCircle, Check } from 'lucide-react'
import { colors, glassCard } from '../brand'
import ConfirmDialog from '../components/ConfirmDialog'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { useHostDashboard } from '../hooks/useHostDashboard'
import type { HostTab } from '../hooks/useHostDashboard'
import HostActivityTab from '../components/host/HostActivityTab'
import HostRecruitTab from '../components/host/HostRecruitTab'
import HostCandidatesTab from '../components/host/HostCandidatesTab'
import HostMembersTab from '../components/host/HostMembersTab'

const S = colors

export default function HostDashboard() {
  const h = useHostDashboard()

  if (h.loading) return (
    <div style={{ minHeight: '100vh', background: S.bg, maxWidth: 480, margin: '0 auto', padding: '80px 20px 40px' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ ...glassCard, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: i * 0.15 + 's' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.bg2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '60%', height: 14, borderRadius: 6, background: S.bg2, marginBottom: 6 }} />
              <div style={{ width: '35%', height: 10, borderRadius: 4, background: S.bg2 }} />
            </div>
          </div>
          <div style={{ width: '80%', height: 10, borderRadius: 4, background: S.bg2, marginBottom: 8 }} />
          <div style={{ width: '50%', height: 10, borderRadius: 4, background: S.bg2 }} />
        </div>
      ))}
    </div>
  )

  if (h.loadError) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center' }}>{h.t('common.load_error')}</p>
    </div>
  )

  const cover = h.getSessionCover(h.sess?.tags, h.sess?.cover_url, h.sess?.template_slug)
  const isLive = h.sess?.status === 'open'
  const isEnded = h.sess?.status === 'ended'

  const tabs: { key: HostTab; label: string; count?: number }[] = [
    { key: 'activite', label: h.t('host.activity_tab') },
    { key: 'recruit', label: h.t('host.recruit_tab') },
    { key: 'candidats', label: h.t('host.candidates_tab'), count: h.counts.pending },
    { key: 'membres', label: h.t('host.members_tab'), count: h.counts.accepted },
  ]

  return (
    <div {...h.pullHandlers} style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />
      {h.pullIndicator}
      <EventContextNav role="host" sessionTitle={h.sess?.title} />

      {/* === HEADER === */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid ' + S.rule }}>
        {cover.coverImage ? (
          <>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,4,10,0.65)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: cover.bg }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,22,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '12px 20px 16px' }}>
          {/* Top row: badges + title + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '3px 8px', borderRadius: 99, background: S.p2, color: S.p, border: '1px solid ' + S.pbd,
                }}>Host</span>
                {isLive && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: S.sage, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.sage, animation: 'blink 2s ease-in-out infinite' }} />
                    {h.t('host.status_live')}
                  </span>
                )}
                {isEnded && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: S.redbg, color: S.red, border: '1px solid ' + S.redbd,
                  }}>
                    {h.t('host.status_ended')}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, margin: '0 0 3px', lineHeight: 1.2 }}>
                {h.sess?.title}
              </h1>
              <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{h.sess?.approx_area}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {h.elapsed && isLive && (
                <span style={{ fontSize: 11, fontWeight: 600, color: S.tx2, background: S.bg3, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                  <Clock size={10} strokeWidth={1.5} style={{ marginRight: 2 }} />{h.elapsed}
                </span>
              )}
              {h.remaining && isLive && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: h.remaining === 'termine' ? S.red : S.p,
                  background: h.remaining === 'termine' ? S.redbg : S.p2,
                  padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap',
                }}>
                  {h.remaining === 'termine' ? h.t('host.time_ended') : h.t('host.time_remaining', { time: h.remaining })}
                </span>
              )}
              {h.totalAccepted > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: S.sage, background: S.sagebg, padding: '3px 10px', borderRadius: 50 }}>
                  {h.arrivedCount}/{h.totalAccepted}
                </span>
              )}
              {h.sess?.max_capacity && (() => {
                const total = h.totalAccepted + 1
                const full = total >= h.sess.max_capacity
                return (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: full ? S.red : S.tx2,
                    background: full ? S.redbg : S.bg3,
                    padding: '3px 10px', borderRadius: 50,
                    border: '1px solid ' + (full ? S.redbd : S.rule),
                  }}>
                    {total}/{h.sess.max_capacity}{full ? ' ' + h.t('host.capacity_full') : ''}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Published toggle */}
          {!isEnded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: h.sess?.is_published !== false ? S.sage : S.tx3,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: h.sess?.is_published !== false ? S.sage : S.tx3, flex: 1 }}>
                {h.sess?.is_published !== false ? h.t('session.published') : h.t('session.unpublished')}
              </span>
              <button onClick={h.togglePublish} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                border: '1px solid ' + S.rule, background: S.bg2, color: S.tx2, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {h.t('session.toggle_publish')}
              </button>
            </div>
          )}

          {/* Action buttons: Edit + End */}
          {!isEnded && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => h.navigate('/session/' + h.id + '/edit')} style={{
                flex: 1, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1px solid ' + S.rule, background: S.bg2, color: S.tx2, cursor: 'pointer',
              }}>
                {h.t('host.edit_session')}
              </button>
              <button onClick={h.closeSession} style={{
                flex: 1, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1px solid ' + S.redbd, background: 'transparent', color: S.red, cursor: 'pointer',
              }}>
                {h.t('host.end_session')}
              </button>
            </div>
          )}

          {/* Roles summary */}
          {h.sess?.lineup_json?.roles_wanted && Object.keys(h.sess.lineup_json.roles_wanted).length > 0 && (() => {
            const wanted = h.sess.lineup_json.roles_wanted as Record<string, number>
            const currentRoles: Record<string, number> = {}
            h.apps.filter(a => a.status === 'accepted' || a.status === 'checked_in').forEach((a: any) => {
              const r = a.eps_json?.role || a.user_profiles?.profile_json?.role
              if (r) currentRoles[r] = (currentRoles[r] || 0) + 1
            })
            return (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(22,20,31,0.6)', border: '1px solid ' + S.rule }}>
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
                        {have}/{count} {role}{filled ? <Check size={11} strokeWidth={2.5} style={{ display: 'inline', marginLeft: 3 }} /> : null}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* === GROUP CHAT BUTTON === */}
      <div style={{ padding: '12px 20px 0' }}>
        <button
          onClick={() => h.navigate('/session/' + h.id + '/chat')}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            border: '1px solid ' + S.pbd,
            background: S.p2, color: S.p,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            position: 'relative',
          }}
        >
          <MessageCircle size={18} strokeWidth={2} />
          {h.t('host.group_chat_btn')}
          {h.unreadChatCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              minWidth: 20, height: 20, borderRadius: 10,
              background: S.red, color: '#fff',
              fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 5px',
            }}>
              {h.unreadChatCount > 99 ? '99+' : h.unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* === TABS === */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4, background: S.bg2, borderRadius: 12, padding: 3, border: '1px solid ' + S.rule }}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => h.setTab(key)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                background: h.tab === key ? 'rgba(224,136,122,0.12)' : 'transparent',
                color: h.tab === key ? S.p : S.tx3,
                position: 'relative',
              }}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: 2,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: h.tab === key ? S.p : S.tx3,
                  color: S.bg,
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* === TAB CONTENT === */}
      <div style={{ paddingTop: 14 }}>
        {h.tab === 'activite' && (
          <HostActivityTab
            activityFeed={h.activityFeed}
            arrivedCount={h.arrivedCount}
            totalAccepted={h.totalAccepted}
            apps={h.apps}
          />
        )}

        {h.tab === 'recruit' && (
          <HostRecruitTab
            linkCopied={h.linkCopied}
            copyLink={h.copyLink}
            messageCopied={h.messageCopied}
            copyMessageText={h.copyMessageText}
            getPreparedMessage={h.getPreparedMessage}
            getInviteUrl={h.getInviteUrl}
            getDirectInviteUrl={h.getDirectInviteUrl}
            shareSession={h.shareSession}
            myContacts={h.myContacts}
            myGroups={h.myGroups}
            inviteContact={h.inviteContact}
            inviteGroup={h.inviteGroup}
          />
        )}

        {h.tab === 'candidats' && (
          <HostCandidatesTab
            candidateSubTab={h.candidateSubTab}
            setCandidateSubTab={h.setCandidateSubTab}
            filteredCandidates={h.filteredCandidates}
            sessionId={h.id!}
            sessionTitle={h.sess?.title}
            votes={h.votes}
            actionLoading={h.actionLoading}
            counts={h.counts}
            onDecide={h.decide}
            onConfirmCheckIn={h.confirmCheckIn}
            onEject={h.ejectMember}
          />
        )}

        {h.tab === 'membres' && (
          <HostMembersTab
            members={h.members}
            sessionId={h.id!}
            actionLoading={h.actionLoading}
            onEject={h.ejectMember}
            onConfirmCheckIn={h.confirmCheckIn}
            apps={h.apps}
          />
        )}
      </div>

      <ConfirmDialog {...h.confirmDialogProps} />
    </div>
  )
}
