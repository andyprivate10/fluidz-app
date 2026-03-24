import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, glassCard, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { sessionTiming } from '../lib/timing'
import { getSessionCover } from '../lib/sessionCover'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { Plus, Clock, CheckCircle2, Radio, MapPin, Globe, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SkeletonCard } from '../components/Skeleton'

const S = colors
const R = radius

type Session = { id: string; title: string; status: string; approx_area: string; created_at: string; host_id: string; tags?: string[]; starts_at?: string; ends_at?: string; cover_url?: string }
type AppSession = { session_id: string; status: string; title: string; approx_area: string; tags?: string[]; cover_url?: string }

export default function SessionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [myHosted, setMyHosted] = useState<Session[]>([])
  const [myActive, setMyActive] = useState<AppSession[]>([])
  const [myPending, setMyPending] = useState<AppSession[]>([])
  const [publicSessions, setPublicSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login?next=/sessions'); return }

    const { data: h } = await supabase.from('sessions').select('*').eq('host_id', user.id).neq('title', DM_DIRECT_TITLE).order('created_at', { ascending: false })
    setMyHosted(h || [])

    const { data: apps } = await supabase.from('applications').select('session_id, status, sessions(title, approx_area, tags, cover_url)').eq('applicant_id', user.id).order('created_at', { ascending: false })
    const mapped = (apps || []).map((a: any) => ({
      session_id: a.session_id, status: a.status,
      title: a.sessions?.title || 'Session', approx_area: a.sessions?.approx_area || '',
      tags: a.sessions?.tags || [],
      cover_url: a.sessions?.cover_url || undefined,
    }))
    setMyActive(mapped.filter(a => a.status === 'accepted' || a.status === 'checked_in'))
    setMyPending(mapped.filter(a => a.status === 'pending'))

    const { data: pub } = await supabase.from('sessions').select('*').eq('status', 'open').neq('host_id', user.id).neq('title', DM_DIRECT_TITLE).order('created_at', { ascending: false }).limit(20)
    setPublicSessions(pub || [])

    setLoading(false)
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  const sectionLabel = (text: string, color: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 6px' }}>{text}</p>
  )

  const sessionCard = (sess: Session, onClick: () => void) => {
    const isOpen = sess.status === 'open'
    const isEnded = sess.status === 'ended'
    const cover = getSessionCover(sess.tags, sess.cover_url)
    return (
      <div key={sess.id} onClick={onClick} style={{ ...glassCard, background: cover.bg, overflow: 'hidden', position: 'relative' }}>
        {/* Cover image or glass overlay */}
        {cover.coverImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,20,31,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ ...typeStyle('section'), color: S.tx, margin: 0, flex: 1 }}>{sess.title}</p>
          <span style={{
            ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.pill, marginLeft: 8,
            color: isOpen ? S.sage : isEnded ? S.red : S.tx3,
            background: isOpen ? S.sagebg : isEnded ? S.redbg : S.bg2,
            border: `1px solid ${isOpen ? S.sagebd : isEnded ? S.redbd : S.rule}`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isOpen && <Radio size={8} />}
            {isOpen ? t('session.live') : isEnded ? t('session.ended') : t('session.draft')}
          </span>
        </div>
        {sess.approx_area && (
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} strokeWidth={1.5} />{sess.approx_area}
          </p>
        )}
        {sess.tags && sess.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {sess.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.chip, background: 'rgba(249,168,168,0.15)', color: S.p, border: `1px solid rgba(249,168,168,0.25)` }}>{tag}</span>
            ))}
          </div>
        )}
        <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '8px 0 0' }}>{sessionTiming(sess)}</p>
        {isEnded && (
          <p style={{ ...typeStyle('meta'), color: S.p, fontWeight: 600, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>{t('sessions.review_session')} →</p>
        )}
        </div>
      </div>
    )
  }

  const appCard = (app: AppSession, icon: React.ReactNode, badgeColor: string, badgeText: string) => {
    const cover = getSessionCover(app.tags, app.cover_url)
    return (
    <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)} style={{ ...glassCard, background: cover.bg, overflow: 'hidden', position: 'relative' }}>
      {cover.coverImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,20,31,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ ...typeStyle('section'), color: S.tx, margin: 0, flex: 1 }}>{app.title}</p>
        <span style={{
          ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.pill, marginLeft: 8,
          color: badgeColor, background: badgeColor + '12', border: `1px solid ${badgeColor}33`,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {icon}{badgeText}
        </span>
      </div>
      {app.approx_area && <p style={{ ...typeStyle('body'), color: S.tx2, margin: '5px 0 0' }}>{app.approx_area}</p>}
      </div>
    </div>
  )}

  const pinnedCount = myActive.length + myPending.length
  const hostedOpen = myHosted.filter(s => s.status === 'open')

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 16px', borderBottom: `1px solid ${S.rule}`, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <h1 style={{ ...typeStyle('title'), color: S.tx, margin: 0 }}>{t('sessions.title')}</h1>
      </div>

      <div className="stagger-children" style={{ position: 'relative', zIndex: 1, padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 96 }}>

        <button onClick={() => navigate('/session/create')} style={{
          width: '100%', padding: 14, marginTop: 8, background: S.p, border: 'none', borderRadius: R.btn,
          color: '#fff', ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${S.pbd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden',
        }}>
          <Plus size={16} strokeWidth={2.5} />
          {t('session.new_session')}
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
        </button>

        {!loading && pinnedCount === 0 && hostedOpen.length === 0 && publicSessions.length === 0 && myHosted.filter(s => s.status !== 'open').length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: S.tx3 }}>
            <Zap size={28} strokeWidth={1.5} style={{ color: S.tx3, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
            <p style={{ ...typeStyle('section'), margin: '0 0 6px', color: S.tx2 }}>{t('sessions.empty_hosted')}</p>
            <p style={{ ...typeStyle('body'), color: S.tx3, margin: 0 }}>{t('sessions.empty_applied')}</p>
          </div>
        )}

        {pinnedCount > 0 && (
          <>
            {sectionLabel(t('sessions.pinned'), S.sage)}
            {myActive.map(app => appCard(app, <CheckCircle2 size={10} />, S.sage, t('status.accepted')))}
            {myPending.map(app => appCard(app, <Clock size={10} />, S.lav, t('status.pending')))}
          </>
        )}

        {hostedOpen.length > 0 && (
          <>
            {sectionLabel(t('sessions.my_hosted'), S.p)}
            {hostedOpen.map(sess => sessionCard(sess, () => navigate('/session/' + sess.id + '/host')))}
          </>
        )}

        {sectionLabel(t('sessions.nearby'), S.lav)}
        {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><SkeletonCard lines={2} /><SkeletonCard lines={3} /><SkeletonCard lines={2} /></div>}
        {!loading && publicSessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 28, color: S.tx3 }}>
            <Globe size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: S.tx3 }} />
            <p style={{ ...typeStyle('body'), margin: 0 }}>{t('sessions.no_public')}</p>
          </div>
        )}
        {publicSessions.map(sess => sessionCard(sess, () => navigate('/session/' + sess.id)))}

        {myHosted.filter(s => s.status !== 'open').length > 0 && (
          <>
            {sectionLabel(t('sessions.past'), S.tx3)}
            {myHosted.filter(s => s.status !== 'open').slice(0, 5).map(sess => sessionCard(sess, () => navigate('/session/' + sess.id)))}
          </>
        )}
      </div>
    </div>
  )
}
