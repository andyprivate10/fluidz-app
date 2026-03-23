import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showToast } from '../Toast'
import { Users, Share2, Settings, MessageCircle, Navigation, UserCheck, Star } from 'lucide-react'
import { colors } from '../../brand'

const S = colors
const qBtn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 14, border: '1px solid '+S.rule2, background: 'rgba(22,20,31,0.85)', cursor: 'pointer', minWidth: 64, whiteSpace: 'nowrap' }
const qLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: S.tx2 }

type Props = {
  sessionId: string
  eventRole: 'host' | 'member' | 'candidate'
  exactAddress: string | null
  status: string
  inviteCode: string | null
  checkInDone: boolean
  checkInLoading: boolean
  onCheckIn: () => void
  myApp: { status: string } | null
  pendingCount: number
}

export default function SessionQuickActions({ sessionId, eventRole, exactAddress, status, inviteCode, checkInDone, checkInLoading, onCheckIn, myApp, pendingCount }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {eventRole === 'member' && (
        <>
          {exactAddress && (
            <button onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(exactAddress), '_blank')} style={qBtn}>
              <Navigation size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={qLabel}>{t('session.qa_maps')}</span>
            </button>
          )}
          {!checkInDone && status === 'open' && (
            <button onClick={onCheckIn} disabled={checkInLoading} style={{ ...qBtn, borderColor: S.sage, background: S.sagebg, opacity: checkInLoading ? 0.6 : 1 }}>
              <UserCheck size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={{ ...qLabel, color: S.sage }}>{checkInLoading ? '...' : t('session.check_in_action')}</span>
            </button>
          )}
          <button onClick={() => navigate('/session/' + sessionId + '/chat')} style={qBtn}>
            <MessageCircle size={16} strokeWidth={1.5} style={{ color: S.lav }} />
            <span style={qLabel}>{t('session.qa_chat')}</span>
          </button>
          <button onClick={() => navigate('/session/' + sessionId + '/dm')} style={qBtn}>
            <MessageCircle size={16} strokeWidth={1.5} style={{ color: S.p }} />
            <span style={qLabel}>{t('session.qa_dm_host')}</span>
          </button>
        </>
      )}
      {eventRole === 'host' && (
        <>
          <button onClick={() => navigate('/session/' + sessionId + '/host')} style={{ ...qBtn, borderColor: S.pbd, background: S.p2 }}>
            <Users size={16} strokeWidth={1.5} style={{ color: S.p }} />
            <span style={{ ...qLabel, color: S.p }}>{pendingCount > 0 ? t('session.candidates_count', { count: pendingCount }) : t('session.candidates')}</span>
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/join/' + inviteCode); showToast(t('session.link_copied'), 'success') }} style={qBtn}>
            <Share2 size={16} strokeWidth={1.5} style={{ color: S.lav }} />
            <span style={qLabel}>{t('session.share_link')}</span>
          </button>
          <button onClick={() => navigate('/session/' + sessionId + '/edit')} style={qBtn}>
            <Settings size={16} strokeWidth={1.5} style={{ color: S.tx3 }} />
            <span style={qLabel}>{t('host.edit')}</span>
          </button>
        </>
      )}
      {eventRole === 'candidate' && !myApp && status === 'open' && (
        <button onClick={() => navigate('/session/' + sessionId + '/apply')} style={{ ...qBtn, borderColor: S.pbd, background: S.p2, flex: 1 }}>
          <Star size={16} strokeWidth={1.5} style={{ color: S.p }} />
          <span style={{ ...qLabel, color: S.p }}>{t('session.apply_cta')}</span>
        </button>
      )}
    </div>
  )
}
