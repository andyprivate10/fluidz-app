import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Get display name
      supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
      })

      // Latest hosted session
      supabase.from('sessions').select('id, title, approx_area, status')
        .eq('host_id', user.id).eq('status', 'open')
        .order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => {
          const row = Array.isArray(data) ? data[0] : data
          setLatestHost(row ?? null)
        })

      // Pending applications
      supabase.from('applications').select('session_id, status, sessions(title)')
        .eq('applicant_id', user.id).eq('status', 'pending')
        .then(({ data }) => {
          setPendingApps((data || []).map((a: any) => ({
            session_id: a.session_id,
            title: a.sessions?.title || 'Session',
          })))
        })
    })
  }, [])

  function handleJoinCode() {
    const code = inviteCode.trim()
    if (!code) return
    // If user pasted a full URL, extract the code
    const match = code.match(/\/join\/([a-zA-Z0-9]+)/)
    if (match) {
      navigate('/join/' + match[1])
    } else {
      navigate('/join/' + code)
    }
  }

  return (
    <div style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>

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
            <button onClick={() => navigate('/session/create')} style={{ width: '100%', padding: 16, background: S.grad, border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px ' + S.p400 + '44' }}>
              Créer une session
            </button>
            <button onClick={() => navigate('/me')} style={{ width: '100%', padding: 14, borderRadius: 14, color: S.tx2, border: '1px solid ' + S.border, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Se connecter
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
