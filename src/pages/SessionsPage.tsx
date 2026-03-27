import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { sessionTiming } from '../lib/timing'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { Plus, Globe, Zap, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SkeletonCard } from '../components/Skeleton'
import SessionInfoCard from '../components/SessionInfoCard'

const S = colors
const R = radius

type Session = { id: string; title: string; status: string; approx_area: string; created_at: string; host_id: string; tags?: string[]; starts_at?: string; ends_at?: string; cover_url?: string; template_slug?: string }
type AppSession = { session_id: string; status: string; title: string; approx_area: string; tags?: string[]; cover_url?: string; template_slug?: string; session_status?: string; created_at?: string; starts_at?: string; ends_at?: string }

export default function SessionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'nearby' | 'ended'>('nearby')
  const [myHosted, setMyHosted] = useState<Session[]>([])
  const [myActive, setMyActive] = useState<AppSession[]>([])
  const [myPending, setMyPending] = useState<AppSession[]>([])
  const [myRejected, setMyRejected] = useState<AppSession[]>([])
  const [publicSessions, setPublicSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) { navigate('/login?next=/sessions'); return }

    const { data: h } = await supabase.from('sessions').select('*').eq('host_id', user.id).neq('title', DM_DIRECT_TITLE).order('created_at', { ascending: false })
    setMyHosted(h || [])

    const { data: apps } = await supabase.from('applications').select('session_id, status, sessions(title, approx_area, tags, cover_url, template_slug, status, created_at, starts_at, ends_at)').eq('applicant_id', user.id).order('created_at', { ascending: false })
    const mapped = (apps || []).map((a: any) => ({
      session_id: a.session_id, status: a.status,
      title: a.sessions?.title || 'Session', approx_area: a.sessions?.approx_area || '',
      tags: a.sessions?.tags || [],
      session_status: a.sessions?.status,
      cover_url: a.sessions?.cover_url || undefined,
      template_slug: a.sessions?.template_slug || undefined,
      created_at: a.sessions?.created_at,
      starts_at: a.sessions?.starts_at,
      ends_at: a.sessions?.ends_at,
    }))
    setMyActive(mapped.filter(a => a.status === 'accepted' || a.status === 'checked_in'))
    setMyPending(mapped.filter(a => a.status === 'pending'))
    setMyRejected(mapped.filter(a => a.status === 'rejected'))

    const { data: pub } = await supabase.from('sessions').select('*').eq('status', 'open').neq('host_id', user.id).neq('title', DM_DIRECT_TITLE).order('created_at', { ascending: false }).limit(20)
    setPublicSessions(pub || [])

    setLoading(false)
  }, [navigate, user])

  useEffect(() => { loadData() }, [loadData])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  const sectionLabel = (text: string, color: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 6px' }}>{text}</p>
  )

  const renderSessionCard = (sess: Session, onClick: () => void) => (
    <SessionInfoCard
      key={sess.id}
      session={sess}
      onClick={onClick}
      timing={sessionTiming(sess)}
      endedCta={sess.status === 'ended' ? `${t('sessions.review_session')} →` : undefined}
    />
  )

  const renderAppCard = (app: AppSession, extraBadge?: string) => (
    <SessionInfoCard
      key={app.session_id}
      session={{ id: app.session_id, title: app.title, status: app.session_status ?? 'open', approx_area: app.approx_area, tags: app.tags, cover_url: app.cover_url, template_slug: app.template_slug }}
      compact
      showCapacity={false}
      label={extraBadge}
      labelColor={extraBadge ? S.orange : undefined}
    />
  )

  // Derived data
  const hostedOpen = myHosted.filter(s => s.status === 'open')
  const hostedEnded = myHosted.filter(s => s.status === 'ended')
  const endedParticipated = myActive.filter(a => a.session_status === 'ended')
    .concat(myPending.filter(a => a.session_status === 'ended'))
  // Active sessions (not ended) for "nearby" tab
  const activeParticipating = myActive.filter(a => a.session_status !== 'ended')
  const activePending = myPending.filter(a => a.session_status !== 'ended')
  const activeRejected = myRejected.filter(a => a.session_status !== 'ended')

  const hasPinnedSessions = hostedOpen.length > 0 || activeParticipating.length > 0 || activePending.length > 0
  const hasEndedSessions = hostedEnded.length > 0 || endedParticipated.length > 0
  const nearbyCount = hostedOpen.length + activeParticipating.length + activePending.length + publicSessions.length
  const endedCount = hostedEnded.length + endedParticipated.length

  // Tab style
  const tabBtn = (tab: 'nearby' | 'ended', label: string) => {
    const active = activeTab === tab
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        style={{
          flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
          borderRadius: R.chip,
          background: active ? S.p : 'transparent',
          color: active ? '#fff' : S.tx3,
          ...typeStyle('label'),
          fontSize: 13, fontWeight: active ? 700 : 500,
          transition: 'all 0.2s ease',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '48px 20px 16px', borderBottom: `1px solid ${S.rule}`, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <h1 style={{ ...typeStyle('title'), color: S.tx, margin: 0 }}>{t('sessions.title')}</h1>
      </div>

      {/* Tabs */}
      <div style={{ position: 'sticky', top: 73, zIndex: 10, padding: '12px 20px 12px', display: 'flex', gap: 4, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${S.rule}` }}>
        <div style={{ display: 'flex', width: '100%', gap: 4, background: S.bg2, borderRadius: R.block, padding: 3, border: `1px solid ${S.rule}` }}>
          {tabBtn('nearby', nearbyCount > 0 ? `${t('sessions.tab_nearby')} (${nearbyCount})` : t('sessions.tab_nearby'))}
          {tabBtn('ended', endedCount > 0 ? `${t('sessions.tab_ended')} (${endedCount})` : t('sessions.tab_ended'))}
        </div>
      </div>

      <div className="stagger-children" style={{ position: 'relative', zIndex: 1, padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 96 }}>

        {/* ═══ New session CTA (always visible) ═══ */}
        <button onClick={() => navigate('/session/create')} style={{
          width: '100%', padding: 14, marginTop: 8, background: S.p, border: 'none', borderRadius: R.btn,
          color: '#fff', ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${S.pbd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden',
        }}>
          <Plus size={16} strokeWidth={2.5} />
          {t('session.new_session')}
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
        </button>

        {/* ═══ TAB: Autour de moi ═══ */}
        {activeTab === 'nearby' && (
          <>
            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <SkeletonCard lines={2} /><SkeletonCard lines={3} /><SkeletonCard lines={2} />
              </div>
            )}

            {/* Empty state */}
            {!loading && !hasPinnedSessions && publicSessions.length === 0 && activeRejected.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: S.tx3 }}>
                <Zap size={28} strokeWidth={1.5} style={{ color: S.tx3, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ ...typeStyle('section'), margin: '0 0 6px', color: S.tx2 }}>{t('sessions.empty_hosted')}</p>
                <p style={{ ...typeStyle('body'), color: S.tx3, margin: 0 }}>{t('sessions.empty_applied')}</p>
              </div>
            )}

            {/* Section 1: MES SESSIONS (pinned) */}
            {hostedOpen.length > 0 && (
              <>
                {sectionLabel(t('sessions.my_sessions'), S.p)}
                {hostedOpen.map(sess => renderSessionCard(sess, () => navigate('/session/' + sess.id)))}
              </>
            )}

            {activeParticipating.length > 0 && (
              <>
                {sectionLabel(t('sessions.participating'), S.sage)}
                {activeParticipating.map(app => renderAppCard(app))}
              </>
            )}

            {activePending.length > 0 && (
              <>
                {sectionLabel(t('sessions.pending_apps'), S.lav)}
                {activePending.map(app => renderAppCard(app, t('sessions.pending_apps')))}
              </>
            )}

            {/* Rejected: friendly message, no cards */}
            {activeRejected.length > 0 && (
              <div style={{
                margin: '12px 0', padding: '14px 16px',
                background: S.bg1, borderRadius: R.block,
                border: `1px solid ${S.sagebd}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Sparkles size={18} strokeWidth={1.5} style={{ color: S.sage, flexShrink: 0 }} />
                <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>
                  {t('sessions.rejected_message')}
                </p>
              </div>
            )}

            {/* Section 2: AUTOUR DE MOI (nearby public) */}
            {sectionLabel(t('sessions.nearby'), S.lav)}
            {!loading && publicSessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: 28, color: S.tx3 }}>
                <Globe size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', display: 'block', color: S.tx3 }} />
                <p style={{ ...typeStyle('body'), margin: 0 }}>{t('sessions.no_public')}</p>
              </div>
            )}
            {publicSessions.map(sess => renderSessionCard(sess, () => navigate('/session/' + sess.id)))}
          </>
        )}

        {/* ═══ TAB: Terminées ═══ */}
        {activeTab === 'ended' && (
          <>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <SkeletonCard lines={2} /><SkeletonCard lines={2} />
              </div>
            )}

            {!loading && !hasEndedSessions && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: S.tx3 }}>
                <Zap size={28} strokeWidth={1.5} style={{ color: S.tx3, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ ...typeStyle('body'), margin: 0, color: S.tx2 }}>{t('sessions.no_ended')}</p>
              </div>
            )}

            {hostedEnded.length > 0 && (
              <>
                {sectionLabel(t('sessions.my_ended'), S.p)}
                {hostedEnded.map(sess => renderSessionCard(sess, () => navigate('/session/' + sess.id)))}
              </>
            )}

            {endedParticipated.length > 0 && (
              <>
                {sectionLabel(t('sessions.past_participated'), S.tx3)}
                {endedParticipated.map(app => (
                  <SessionInfoCard
                    key={app.session_id}
                    session={{ id: app.session_id, title: app.title, status: 'ended', approx_area: app.approx_area, tags: app.tags, cover_url: app.cover_url, template_slug: app.template_slug }}
                    compact
                    showCapacity={false}
                    timing={app.created_at ? sessionTiming({ created_at: app.created_at, starts_at: app.starts_at, ends_at: app.ends_at }) : undefined}
                    endedCta={`${t('sessions.review_session')} →`}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
