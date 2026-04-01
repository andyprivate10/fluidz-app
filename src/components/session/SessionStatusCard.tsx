import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Share2, MessageCircle, Check, Send, UserPlus } from 'lucide-react'
import { colors, glassCard } from '../../brand'
import { useTranslation } from 'react-i18next'
import MapView from '../MapView'
import type { Session, Member } from '../../hooks/useSessionData'
import type { User } from '@supabase/supabase-js'

const S = colors

interface Props {
  session: Session
  sessionId: string
  myApp: { status: string } | null
  currentUser: User | null
  checkInDone: boolean
  members: Member[]
  memberNames: Record<string, string>
  memberAvatars: Record<string, string>
  copied: boolean
  copyMessage: (text: string) => void
  inviteLinkCopied: boolean
  copyInviteLink: (text: string) => void
  onCancel: () => void
  onLeave: () => void
  setShowShareSheet: (v: boolean) => void
}

export default function SessionStatusCard({
  session, sessionId, myApp, currentUser, checkInDone, members,
  memberNames, memberAvatars, copied, copyMessage,
  inviteLinkCopied, copyInviteLink, onCancel, onLeave, setShowShareSheet,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [directCopied, setDirectCopied] = useState(false)
  const isHost = currentUser?.id === session.host_id

  return (
    <>
      {/* Check-in awaiting confirmation */}
      {checkInDone && myApp?.status !== 'checked_in' && (
        <div style={{ ...glassCard, background: S.p2, borderColor: S.p, textAlign: 'center' }}>
          <Clock size={24} style={{color:S.p,margin:'0 auto'}} />
          <div style={{ fontSize: 14, color: S.p, marginTop: 4, fontWeight: 600 }}>{t('session.awaiting_confirmation')}</div>
          <p style={{ fontSize: 12, color: S.tx2, marginTop: 6, margin: '6px 0 0' }}>{t('session.host_must_confirm')}</p>
        </div>
      )}

      {/* Checked-in card */}
      {myApp?.status === 'checked_in' && (
        <div style={{ ...glassCard, background: S.sagebg, borderColor: S.sage, textAlign: 'center' }}>
          <div style={{ fontSize: 20 }}>{t('session.welcome')}</div>
          <div style={{ fontSize: 14, color: S.sage, marginTop: 4 }}>{t('session.checkin_confirmed')}</div>
          {session.exact_address && <div style={{ fontSize: 14, color: S.tx, marginTop: 8, fontWeight: 600 }}>{session.exact_address}</div>}
          {session.invite_code && (
            <>
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + session.invite_code
                copyInviteLink(url)
              }}
              style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 12, border: '1px solid '+S.sage, background: inviteLinkCopied ? S.sagebg : 'transparent', color: S.sage, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {inviteLinkCopied ? t('session.link_copied') : t('session.invite_link')}
            </button>
            {isHost && (
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + session.invite_code + '?direct=1'
                  navigator.clipboard?.writeText(url)
                  setDirectCopied(true)
                  setTimeout(() => setDirectCopied(false), 2000)
                }}
                style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+(directCopied ? S.sage : S.lavbd), background: directCopied ? S.sagebg : 'transparent', color: directCopied ? S.sage : S.lav, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <UserPlus size={13} strokeWidth={1.5} /> {directCopied ? t('session.direct_link_copied') : t('session.direct_invite')}
              </button>
            )}
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + session.invite_code
                const rolesW = session.lineup_json?.roles_wanted as Record<string,number> | undefined
                const rolesText = rolesW && Object.keys(rolesW).length > 0 ? ' – ' + t('session.share_looking_for') + ' ' + Object.entries(rolesW).map(([r,c]) => c+' '+r).join(', ') : ''
                const text = '🔥 ' + session.title + (session.approx_area ? ' – ' + session.approx_area : '') + rolesText + ' – ' + (members.length+1) + ' ' + t('session.share_already_here') + ' – ' + t('session.share_join_us') + ' : ' + url
                copyMessage(text)
              }}
              style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+S.rule, background: copied ? S.sagebg : 'transparent', color: copied ? S.sage : S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {copied ? t('session.msg_copied') : t('session.copy_share_msg')}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + session.invite_code
                  navigator.share({ title: session.title, text: '🔥 ' + session.title + ' – ' + t('common.join_us'), url }).catch(() => {})
                }}
                style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+S.sage, background: 'transparent', color: S.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Share2 size={13} strokeWidth={1.5} style={{marginRight:4}} /> {t('session.share')}
              </button>
            )}
            {currentUser && (
              <button
                onClick={() => setShowShareSheet(true)}
                style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+S.lavbd, background: 'transparent', color: S.lav, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <Send size={13} strokeWidth={1.5} /> {t('share.recommend_session')}
              </button>
            )}
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => navigate('/session/' + sessionId + '/chat')} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid '+S.pbd, background: S.p2, color: S.p, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <MessageCircle size={13} strokeWidth={1.5} style={{marginRight:4}} /> {t('session.group_chat')}
            </button>
            <button onClick={() => navigate('/session/' + sessionId + '/dm')} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid '+S.rule, background: S.bg1, color: S.tx2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('session.dm_host')}
            </button>
          </div>
        </div>
      )}

      {/* Add to book */}
      {myApp?.status === 'checked_in' && members.length > 0 && (
        <div style={{ ...glassCard, borderColor: S.pbd }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: S.tx2, margin: '0 0 8px' }}>{t('session.add_to_book')}</p>
          <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 10px' }}>{t('session.add_to_book_desc')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {members.filter(m => m.applicant_id !== currentUser?.id).slice(0, 6).map(m => {
              const name = memberNames[m.applicant_id] || t('common.anonymous_fallback')
              const avatar = memberAvatars[m.applicant_id]
              return (
                <button key={m.applicant_id} onClick={() => navigate('/contacts/' + m.applicant_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid '+S.rule, background: S.bg2, cursor: 'pointer' }}>
                  {avatar ? (
                    <img src={avatar} alt="" loading="lazy" style={{ width: 20, height: 20, borderRadius: '28%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: '28%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: S.tx }}>{name[0].toUpperCase()}</div>
                  )}
                  <span style={{ fontSize: 12, color: S.tx2, fontWeight: 600 }}>{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Status card: pending / accepted / rejected / checked_in */}
      {myApp && (
        <div style={{ ...glassCard }}>
          {myApp.status === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.p, padding: '6px 12px', borderRadius: 99, background: S.p2, border: '1px solid '+S.amberbd }}>{t('session.pending')}</span>
              <button onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid '+S.rule, background: 'transparent', color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t('session.cancel_application')}
              </button>
            </div>
          )}
          {myApp.status === 'accepted' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.sage, padding: '6px 12px', borderRadius: 99, background: S.sagebg, border: '1px solid '+S.sagebd }}><Check size={12} strokeWidth={2} style={{display:'inline',marginRight:3}} />{t('session.accepted')}</span>
              <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{t('session.address_after_checkin')}</p>
              <button onClick={() => navigate('/session/' + sessionId + '/dm')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.sage, borderRadius: 12, color: S.sage, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {t('session.open_dm')}
              </button>
              <button onClick={onLeave} style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: S.tx3, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                {t('session.leave_session')}
              </button>
            </div>
          )}
          {myApp.status === 'rejected' && (
            <span style={{ fontSize: 14, fontWeight: 600, color: S.red, padding: '6px 12px', borderRadius: 99, background: S.redbg, border: '1px solid '+S.redbd }}>{t('session.rejected')}</span>
          )}
          {myApp.status === 'checked_in' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.sage, padding: '6px 12px', borderRadius: 99, background: S.sagebg, border: '1px solid '+S.sagebd }}><Check size={12} strokeWidth={2} style={{display:'inline',marginRight:3}} />{t('session.checkin_confirmed')}</span>
              {session.exact_address && (
                <div style={{ padding: '10px 12px', background: S.sagebg, borderRadius: 10, border: '1px solid '+S.sagebd }}>
                  <p style={{ fontSize: 11, color: S.sage, fontWeight: 700, margin: '0 0 2px' }}>{t('session.address_label')}</p>
                  <p style={{ fontSize: 14, color: S.tx, fontWeight: 600, margin: 0 }}>{session.exact_address}</p>
                </div>
              )}
              {(session as any).approx_lat && (session as any).approx_lng && (
                <MapView
                  center={[(session as any).approx_lat, (session as any).approx_lng]}
                  zoom={15}
                  height={180}
                  pins={[{ id: session.id, lat: (session as any).approx_lat, lng: (session as any).approx_lng, label: session.title, type: 'session' }]}
                />
              )}
              <button onClick={() => navigate('/session/' + sessionId + '/dm')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.sage, borderRadius: 12, color: S.sage, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {t('session.open_dm')}
              </button>
              <button onClick={() => navigate('/session/' + sessionId + '/chat')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.p, borderRadius: 12, color: S.p, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {t('session.group_chat')}
              </button>
              <button onClick={onLeave} style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: S.tx3, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                {t('session.leave_session')}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
