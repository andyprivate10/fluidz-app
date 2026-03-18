import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

type QuickSession = { id: string; title: string; approx_area: string; status: string }

export default function HomePage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [latestHost, setLatestHost] = useState<QuickSession | null>(null)
  const [pendingApps, setPendingApps] = useState<{ session_id: string; title: string }[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [activeApps, setActiveApps] = useState<{ session_id: string; title: string; status: string }[]>([])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Check for post-auth redirect (deep linking)
    try {
      const redirect = localStorage.getItem('auth_redirect')
      if (redirect) {
        localStorage.removeItem('auth_redirect')
        navigate(redirect)
        return
      }
    } catch (_) {}

    const { data: profData } = await supabase.from('user_profiles').select('display_name,profile_json').eq('id', user.id).maybeSingle()
    if (profData?.display_name) {
      setDisplayName(profData.display_name)
      const pj = (profData.profile_json || {}) as Record<string, unknown>
      const isNewUser = !pj.role && !pj.avatar_url && !pj.onboarding_done
      if (isNewUser && profData.display_name !== 'Marcus' && profData.display_name !== 'Karim' && profData.display_name !== 'Yann') {
        navigate('/onboarding')
        return
      }
    }

    const { data: hosted } = await supabase.from('sessions').select('id, title, approx_area, status')
      .eq('host_id', user.id).eq('status', 'open')
      .order('created_at', { ascending: false }).limit(1)
    setLatestHost(Array.isArray(hosted) ? hosted[0] ?? null : hosted ?? null)

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
    // If user pasted a full URL, extract the code
    const match = code.match(/\/join\/([a-zA-Z0-9]+)(\?.*)?/)
    if (match) {
      navigate('/join/' + match[1] + (match[2] || ''))
    } else {
      navigate('/join/' + code)
    }
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}

      <div style={{ padding: '48px 24px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: S.p300, margin: '0 0 4px' }}>fluidz</h1>
        {userId && displayName && (
          <p style={{ fontSize: 15, color: S.tx2, margin: 0 }}>Hey {displayName} 👋</p>
        )}
        {!userId && (
          <p style={{ fontSize: 14, color: S.tx2, margin: '8px 0 0', lineHeight: 1.5 }}>
            Recrute ton groupe pour ce soir. Partage un lien, les candidats postulent, tu choisis.
          </p>
        )}
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Host's active session */}
        {latestHost && (
          <div
            onClick={() => navigate('/session/' + latestHost.id + '/host')}
            style={{ background: S.bg1, border: '1px solid ' + S.p300 + '44', borderRadius: 16, padding: 16, cursor: 'pointer' }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: S.p300, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ta session active</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: 0 }}>{latestHost.title}</p>
            <p style={{ fontSize: 12, color: S.tx3, margin: '4px 0 0' }}>{latestHost.approx_area}</p>
          </div>
        )}

        {/* Pending applications */}
        {pendingApps.length > 0 && (
          <div style={{ background: S.bg1, border: '1px solid ' + S.yellow + '44', borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.yellow, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidatures en attente</p>
            {pendingApps.map(app => (
              <div
                key={app.session_id}
                onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid ' + S.border }}
              >
                <p style={{ fontSize: 14, color: S.tx, margin: 0, fontWeight: 600 }}>{app.title}</p>
                <span style={{ fontSize: 11, color: S.yellow, fontWeight: 600 }}></span>
              </div>
            ))}
          </div>
        )}

        {/* Active sessions (accepted/checked-in) */}
        {activeApps.length > 0 && (
          <div style={{ background: S.bg1, border: '1px solid ' + S.green + '44', borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.green, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions actives</p>
            {activeApps.map(app => (
              <div
                key={app.session_id}
                onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid ' + S.border }}
              >
                <p style={{ fontSize: 14, color: S.tx, margin: 0, fontWeight: 600 }}>{app.title}</p>
                <span style={{ fontSize: 11, color: S.green, fontWeight: 600 }}>{app.status === 'checked_in' ? 'Check-in ✓' : 'Accepté'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Join with invite code */}
        <div style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.tx2, margin: '0 0 10px' }}>Rejoindre avec un lien</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
              placeholder="Code ou lien d'invitation"
              style={{ flex: 1, padding: '10px 14px', background: S.bg2, border: '1px solid ' + S.border, borderRadius: 10, color: S.tx, fontSize: 14, outline: 'none' }}
            />
            <button onClick={handleJoinCode} style={{ padding: '10px 16px', borderRadius: 10, background: S.grad, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              →
            </button>
          </div>
        </div>

        {/* Create session CTA */}
        {userId && (
          <button
            onClick={() => navigate('/session/create')}
            style={{ width: '100%', padding: 16, background: S.grad, border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px ' + S.p400 + '44', marginTop: 4 }}
          >
            + Créer une session
          </button>
        )}

        {/* Login CTA for non-logged-in */}
        {!userId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button onClick={() => navigate('/login?next=/session/create')} style={{ width: '100%', padding: 16, background: S.grad, border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px ' + S.p400 + '44' }}>
              Créer une session
            </button>
            <button onClick={() => navigate('/login')} style={{ width: '100%', padding: 14, borderRadius: 14, color: S.tx2, border: '1px solid ' + S.border, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Se connecter
            </button>
            <button onClick={() => navigate('/ghost/setup')} style={{ width: '100%', padding: 12, borderRadius: 14, color: S.tx4, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Mode Ghost (24h, sans compte) →
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
