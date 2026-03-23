import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { getSessionCover } from '../lib/sessionCover'
import { Plus, ArrowRight, Flame, Clock, CheckCircle2, Ghost } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const S = colors
const R = radius

type QuickSession = { id: string; title: string; approx_area: string; status: string; tags?: string[]; member_count?: number }

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [latestHost, setLatestHost] = useState<QuickSession | null>(null)
  const [pendingApps, setPendingApps] = useState<{ session_id: string; title: string }[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [activeApps, setActiveApps] = useState<{ session_id: string; title: string; status: string }[]>([])
  const [hostPendingCount, setHostPendingCount] = useState(0)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    try {
      const redirect = localStorage.getItem('auth_redirect')
      if (redirect) { localStorage.removeItem('auth_redirect'); navigate(redirect); return }
    } catch (_) {}

    const { data: profData } = await supabase.from('user_profiles').select('display_name,profile_json').eq('id', user.id).maybeSingle()
    if (profData?.display_name) {
      setDisplayName(profData.display_name)
      const pj = (profData.profile_json || {}) as Record<string, unknown>
      const isNewUser = !pj.role && !pj.avatar_url && !pj.onboarding_done
      if (isNewUser) {
        navigate('/onboarding'); return
      }
    }

    const { data: hosted } = await supabase.from('sessions').select('id, title, approx_area, status, tags')
      .eq('host_id', user.id).eq('status', 'open').neq('title', DM_DIRECT_TITLE)
      .order('created_at', { ascending: false }).limit(1)
    const hostSession = Array.isArray(hosted) ? hosted[0] ?? null : hosted ?? null
    setLatestHost(hostSession)
    if (hostSession) {
      const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', hostSession.id).eq('status', 'pending')
      setHostPendingCount(count ?? 0)
      const { count: mc } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', hostSession.id).in('status', ['accepted', 'checked_in'])
      if (hostSession) (hostSession as any).member_count = (mc || 0) + 1
    }

    const { data: pending } = await supabase.from('applications').select('session_id, status, sessions(title)')
      .eq('applicant_id', user.id).eq('status', 'pending')
    setPendingApps((pending || []).map((a: any) => ({ session_id: a.session_id, title: a.sessions?.title || 'Session' })))

    const { data: active } = await supabase.from('applications').select('session_id, status, sessions(title)')
      .eq('applicant_id', user.id).in('status', ['accepted', 'checked_in'])
    setActiveApps((active || []).map((a: any) => ({ session_id: a.session_id, status: a.status, title: a.sessions?.title || 'Session' })))
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  function handleJoinCode() {
    const code = inviteCode.trim()
    if (!code) return
    const match = code.match(/\/join\/([a-zA-Z0-9]+)(\?.*)?/)
    if (match) navigate('/join/' + match[1] + (match[2] || ''))
    else navigate('/join/' + code)
  }

  // ─── Shared styles ────────────────────────────────────
  const card = glassCard
  const chip: React.CSSProperties = {
    ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.chip,
    background: S.p3, color: S.p, border: `1px solid ${S.pbd}`,
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      {/* ─── Header ──────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '52px 24px 20px' }}>
        <h1 style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 6px' }}>fluidz</h1>
        {userId && displayName ? (
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>{t('home.hey', { name: displayName })}</p>
        ) : !userId ? (
          <div style={{ marginTop: 8 }}>
            <p style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 8px', lineHeight: 1.2 }}>
              {t('home.tagline')}
            </p>
            <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('home.subtitle')}
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              {[
                { n: '1', t: t('home.step1'), d: t('home.step1_desc') },
                { n: '2', t: t('home.step2'), d: t('home.step2_desc') },
                { n: '3', t: t('home.step3'), d: t('home.step3_desc') },
              ].map(step => (
                <div key={step.n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.p2, border: '1px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', ...typeStyle('label'), color: S.p }}>{step.n}</div>
                  <p style={{ ...typeStyle('label'), color: S.tx, margin: '0 0 2px' }}>{step.t}</p>
                  <p style={{ ...typeStyle('meta'), color: S.tx3, margin: 0 }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

      {/* ─── Content ─────────────────────────────────── */}
      <div className="stagger-children" style={{ position: 'relative', zIndex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 96 }}>

        {/* Host active session */}
        {latestHost && (
          <div onClick={() => navigate('/session/' + latestHost.id + '/host')} style={{ ...card, background: getSessionCover(latestHost.tags).bg, border: `1px solid ${S.pbd}`, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,20,31,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 8px' }}>{t('home.your_session')}</p>
            <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>{latestHost.title}</p>
            {latestHost.approx_area && <p style={{ ...typeStyle('body'), color: S.tx2, margin: '4px 0 0' }}>{latestHost.approx_area}</p>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {latestHost.member_count && latestHost.member_count > 1 && (
                <span style={{ ...typeStyle('meta'), color: S.sage, fontWeight: 600 }}>{t('session.member_count', { count: latestHost.member_count })}</span>
              )}
              {latestHost.tags?.slice(0, 3).map(t => <span key={t} style={chip}>{t}</span>)}
            </div>
            {hostPendingCount > 0 && (
              <p style={{ ...typeStyle('label'), color: S.p, margin: '8px 0 0' }}>{hostPendingCount} candidature{hostPendingCount > 1 ? 's' : ''} en attente</p>
            )}
            </div>
          </div>
        )}

        {/* Pending applications */}
        {pendingApps.length > 0 && (
          <div style={{ ...card, border: `1px solid ${S.lavbd}` }}>
            <p style={{ ...typeStyle('micro'), color: S.lav, margin: '0 0 10px' }}>{t('home.pending_apps')}</p>
            {pendingApps.map(app => (
              <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${S.rule}` }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{app.title}</p>
                <Clock size={14} style={{ color: S.lav }} />
              </div>
            ))}
          </div>
        )}

        {/* Active sessions */}
        {activeApps.length > 0 && (
          <div style={{ ...card, border: `1px solid ${S.sagebd}` }}>
            <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 10px' }}>{t('home.active_sessions')}</p>
            {activeApps.map(app => (
              <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${S.rule}` }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{app.title}</p>
                <CheckCircle2 size={14} style={{ color: app.status === 'checked_in' ? S.sage : S.tx3 }} />
              </div>
            ))}
          </div>
        )}

        {/* Join code */}
        <div style={card}>
          <p style={{ ...typeStyle('label'), color: S.tx2, margin: '0 0 10px' }}>{t('home.join_link')}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
              placeholder={t('home.join_placeholder')}
              style={{
                flex: 1, padding: '10px 14px', background: S.bg2, border: `1px solid ${S.rule}`,
                borderRadius: R.icon, color: S.tx, fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '-0.02em',
              }}
            />
            <button onClick={handleJoinCode} style={{
              padding: '10px 16px', borderRadius: R.icon, background: S.p, border: 'none',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {userId && !latestHost && pendingApps.length === 0 && activeApps.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
            <Flame size={28} style={{ color: S.p, margin: '0 auto 10px', display: 'block' }} strokeWidth={1.5} />
            <p style={{ ...typeStyle('section'), color: S.tx, margin: '0 0 6px' }}>{t('home.ready')}</p>
            <p style={{ ...typeStyle('body'), color: S.tx2, lineHeight: 1.6 }}>
              {t('home.ready_desc')}
            </p>
          </div>
        )}

        {/* CTA — Create session */}
        {userId && (
          <>
            <button onClick={() => navigate('/session/create')} style={{
              position: 'relative', overflow: 'hidden', width: '100%', padding: 16,
              background: S.p, border: 'none', borderRadius: R.btn, color: '#fff',
              ...typeStyle('section'), cursor: 'pointer',
              boxShadow: `0 4px 24px ${S.pbd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Plus size={18} strokeWidth={2.5} />
              {t('home.create_session')}
              {/* Shimmer */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { label: 'Custom', slug: 'custom', color: S.p, bg: S.p2, border: S.pbd },
                { label: 'Dark Room', slug: 'darkroom', color: '#E0887A', bg: 'rgba(224,136,122,0.10)', border: 'rgba(224,136,122,0.25)' },
                { label: 'Techno', slug: 'techno', color: '#6BA888', bg: 'rgba(107,168,136,0.10)', border: 'rgba(107,168,136,0.25)' },
              ]).map(tpl => (
                <button key={tpl.slug} onClick={() => navigate('/session/create?tpl=' + tpl.slug)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: R.chip, ...typeStyle('meta'),
                    color: tpl.color, border: `1px solid ${tpl.border}`, background: tpl.bg, cursor: 'pointer',
                    fontWeight: 600,
                  }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Logged out CTAs */}
        {!userId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate('/login?next=/session/create')} style={{
              position: 'relative', overflow: 'hidden', width: '100%', padding: 16,
              background: S.p, border: 'none', borderRadius: R.btn, color: '#fff',
              ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${S.pbd}`,
            }}>
              {t('home.create_session')}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
              color: S.tx2, border: `1px solid ${S.rule}`, background: 'transparent', cursor: 'pointer',
            }}>
              {t('home.login')}
            </button>
            <button onClick={() => navigate('/ghost/setup')} style={{
              width: '100%', padding: 12, borderRadius: R.btn, ...typeStyle('meta'),
              color: S.lav, border: 'none', background: S.lavbg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Ghost size={14} strokeWidth={1.5} />
              {t('home.ghost_mode')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
