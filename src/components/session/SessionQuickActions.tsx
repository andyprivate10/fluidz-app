import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showToast } from '../Toast'
import { Share2, Navigation, UserCheck, Star } from 'lucide-react'
import { colors, radius } from '../../brand'
import { useAuth } from '../../contexts/AuthContext'

const S = colors
const qBtn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: radius.block, border: '1px solid '+S.rule2, background: 'rgba(22,20,31,0.85)', cursor: 'pointer', minWidth: 64, whiteSpace: 'nowrap' }
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
}

export default function SessionQuickActions({ sessionId, eventRole, exactAddress, status, inviteCode, checkInDone, checkInLoading, onCheckIn, myApp }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isGhost } = useAuth()

  return (
    <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {eventRole === 'member' && (
        <>
          {myApp?.status === 'checked_in' && exactAddress && !isGhost && (
            <button aria-label="Open Maps" onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(exactAddress), '_blank')} style={qBtn}>
              <Navigation size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={qLabel}>{t('session.qa_maps')}</span>
            </button>
          )}
          {!checkInDone && status === 'open' && (
            <button aria-label="Je suis là" onClick={onCheckIn} disabled={checkInLoading} style={{ ...qBtn, borderColor: S.sage, background: S.sagebg, opacity: checkInLoading ? 0.6 : 1 }}>
              <UserCheck size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={{ ...qLabel, color: S.sage }}>{checkInLoading ? '...' : t('session.check_in_action')}</span>
            </button>
          )}
        </>
      )}
      {((eventRole === 'host') || (eventRole === 'member' && checkInDone)) && !isGhost && (
        <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/join/' + inviteCode); showToast(t('session.link_copied'), 'success') }} style={qBtn}>
          <Share2 size={16} strokeWidth={1.5} style={{ color: S.lav }} />
          <span style={qLabel}>{t('session.share_link')}</span>
        </button>
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
