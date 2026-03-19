import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { Compass, BookOpen, MapPin, User, Plus, ArrowRight, Flame, Clock, CheckCircle2, Ghost } from 'lucide-react'

const S = colors
const R = radius

type QuickSession = { id: string; title: string; approx_area: string; status: string; tags?: string[]; member_count?: number }

export default function HomePage() {
  const navigate = useNavigate()
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
  const card: React.CSSProperties = {
    background: S.bg1, border: `1px solid ${S.rule}`, borderRadius: R.card, padding: 16,
  }
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
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>Hey {displayName}</p>
        ) : !userId ? (
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '8px 0 0', lineHeight: 1.6 }}>
            Recrute ton groupe pour ce soir. Partage un lien, les candidats postulent, tu choisis.
          </p>
        ) : null}

        {/* Quick nav */}
        {userId && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[
              { icon: Compass, label: 'Discover', path: '/explore' },
              { icon: BookOpen, label: 'Book', path: '/contacts' },
              { icon: MapPin, label: 'Adresses', path: '/addresses' },
              { icon: User, label: 'Profil', path: '/me' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                flex: 1, padding: '10px 4px', borderRadius: R.block, background: S.bg2,
                border: `1px solid ${S.rule}`, cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <item.icon size={16} strokeWidth={1.5} style={{ color: S.tx3 }} />
                <span style={{ ...typeStyle('meta'), color: S.tx3 }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ─────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 96 }}>

        {/* Host active session */}
        {latestHost && (
          <div onClick={() => navigate('/session/' + latestHost.id + '/host')} style={{ ...card, border: `1px solid ${S.pbd}`, cursor: 'pointer' }}>
            <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 8px' }}>TA SESSION ACTIVE</p>
            <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>{latestHost.title}</p>
            {latestHost.approx_area && <p style={{ ...typeStyle('body'), color: S.tx2, margin: '4px 0 0' }}>{latestHost.approx_area}</p>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {latestHost.member_count && latestHost.member_count > 1 && (
                <span style={{ ...typeStyle('meta'), color: S.sage, fontWeight: 600 }}>{latestHost.member_count} membres</span>
              )}
              {latestHost.tags?.slice(0, 3).map(t => <span key={t} style={chip}>{t}</span>)}
            </div>
            {hostPendingCount > 0 && (
              <p style={{ ...typeStyle('label'), color: S.p, margin: '8px 0 0' }}>{hostPendingCount} candidature{hostPendingCount > 1 ? 's' : ''} en attente</p>
            )}
          </div>
        )}

        {/* Pending applications */}
        {pendingApps.length > 0 && (
          <div style={{ ...card, border: `1px solid ${S.lavbd}` }}>
            <p style={{ ...typeStyle('micro'), color: S.lav, margin: '0 0 10px' }}>CANDIDATURES EN ATTENTE</p>
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
            <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 10px' }}>SESSIONS ACTIVES</p>
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
          <p style={{ ...typeStyle('label'), color: S.tx2, margin: '0 0 10px' }}>Rejoindre avec un lien</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
              placeholder="Code ou lien d'invitation"
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
            <p style={{ ...typeStyle('section'), color: S.tx, margin: '0 0 6px' }}>Prêt pour ce soir ?</p>
            <p style={{ ...typeStyle('body'), color: S.tx2, lineHeight: 1.6 }}>
              Crée une session et partage le lien, ou explore les profils autour de toi.
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
              Créer une session
              {/* Shimmer */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {['Dark Room', 'Chemical', 'Techno'].map(tpl => (
                <button key={tpl} onClick={() => navigate('/session/create?tpl=' + tpl.toLowerCase().replace(' ', ''))}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: R.chip, ...typeStyle('meta'),
                    color: S.tx3, border: `1px solid ${S.rule}`, background: S.bg1, cursor: 'pointer',
                  }}>
                  {tpl}
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
              Créer une session
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
              Se connecter
            </button>
            <button onClick={() => navigate('/ghost/setup')} style={{
              width: '100%', padding: 12, borderRadius: R.btn, ...typeStyle('meta'),
              color: S.lav, border: 'none', background: S.lavbg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Ghost size={14} strokeWidth={1.5} />
              Mode Ghost (24h, sans compte)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
