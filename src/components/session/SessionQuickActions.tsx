import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { showToast } from '../Toast'
import { Share2, Navigation, UserCheck, Star, Bookmark } from 'lucide-react'
import { colors, radius } from '../../brand'
import { supabase } from '../../lib/supabase'
import { useState, useEffect } from 'react'
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
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle().then(({ data }) => {
        const bm = (data?.profile_json as any)?.bookmarked_sessions
        if (Array.isArray(bm) && bm.includes(sessionId)) setBookmarked(true)
      })
    })
  }, [sessionId])

  async function toggleBookmark() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
    const pj = (data?.profile_json || {}) as Record<string, unknown>
    const bm = Array.isArray(pj.bookmarked_sessions) ? [...pj.bookmarked_sessions] : []
    const isNow = bm.includes(sessionId)
    const next = isNow ? bm.filter((id: string) => id !== sessionId) : [...bm, sessionId]
    await supabase.from('user_profiles').update({ profile_json: { ...pj, bookmarked_sessions: next } }).eq('id', user.id)
    setBookmarked(!isNow)
    showToast(isNow ? t('session.unbookmarked') : t('session.bookmarked'), isNow ? 'info' : 'success')
  }

  return (
    <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {eventRole === 'member' && (
        <>
          {exactAddress && !isGhost && (
            <button aria-label="Open Maps" onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(exactAddress), '_blank')} style={qBtn}>
              <Navigation size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={qLabel}>{t('session.qa_maps')}</span>
            </button>
          )}
          {!checkInDone && status === 'open' && (
            <button aria-label="Check-in" onClick={onCheckIn} disabled={checkInLoading} style={{ ...qBtn, borderColor: S.sage, background: S.sagebg, opacity: checkInLoading ? 0.6 : 1 }}>
              <UserCheck size={16} strokeWidth={1.5} style={{ color: S.sage }} />
              <span style={{ ...qLabel, color: S.sage }}>{checkInLoading ? '...' : t('session.check_in_action')}</span>
            </button>
          )}
        </>
      )}
      {eventRole === 'host' && !isGhost && (
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
      <button onClick={toggleBookmark} style={{ ...qBtn, borderColor: bookmarked ? S.pbd : S.rule2, background: bookmarked ? S.p3 : 'rgba(22,20,31,0.85)' }}>
        <Bookmark size={16} strokeWidth={1.5} fill={bookmarked ? S.p : 'none'} style={{ color: bookmarked ? S.p : S.tx3 }} />
        <span style={{ ...qLabel, color: bookmarked ? S.p : S.tx2 }}>{bookmarked ? t('session.bookmarked') : t('session.bookmark')}</span>
      </button>
    </div>
  )
}
