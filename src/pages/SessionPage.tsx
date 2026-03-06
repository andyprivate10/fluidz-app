import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Session = { id: string; title: string; description: string; approx_area: string; exact_address: string | null; status: string; host_id: string; invite_code: string | null }
type Member = { applicant_id: string; eps_json: Record<string, string>; status: string }

const st: React.CSSProperties = { background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: 'Inter, sans-serif' }
const card: React.CSSProperties = { background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 16 }

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [myApp, setMyApp] = useState<{ status: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInDone, setCheckInDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const isHost = currentUser?.id === session?.host_id

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)

      const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single()
      setSession(sess)

      const { data: accepted } = await supabase
        .from('applications')
        .select('applicant_id, eps_json, status')
        .eq('session_id', id)
        .eq('status', 'accepted')
      setMembers(accepted ?? [])

      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('status')
          .eq('session_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle()
        setMyApp(app)
        if (app?.status === 'checked_in') setCheckInDone(true)
      }

      setLoading(false)
    }
    load()
  }, [id])

  const handleCheckIn = async () => {
    if (!currentUser) return
    setCheckInLoading(true)
    await supabase
      .from('applications')
      .update({ status: 'checked_in' })
      .eq('session_id', id)
      .eq('applicant_id', currentUser.id)
    setMyApp(prev => prev ? { ...prev, status: 'checked_in' } : null)
    setCheckInDone(true)
    setCheckInLoading(false)
  }

  if (loading) return <div style={{ ...st, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: '#B8B2CC' }}>Chargement...</p></div>
  if (!session) return <div style={{ ...st, padding: 24, color: '#F87171' }}>Session introuvable.</div>

  const statusLabel = session.status === 'open' ? 'Ouverte' : 'Brouillon'
  const statusColor = session.status === 'open' ? '#4ADE80' : '#7E7694'

  return (
    <div style={st}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #2A2740', background: '#16141F' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F0EDFF', flex: 1 }}>{session.title}</h1>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: '#2A2740', padding: '3px 10px', borderRadius: 50, marginLeft: 8, whiteSpace: 'nowrap' }}>{statusLabel}</span>
        </div>
        {session.approx_area && <div style={{ fontSize: 13, color: '#7E7694', marginTop: 6 }}>Autour de {session.approx_area}</div>}
        {isHost && <div style={{ fontSize: 12, color: '#F9A8A8', marginTop: 4, fontWeight: 600 }}>Tu es le host</div>}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {session.description && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>DESCRIPTION</div>
            <div style={{ fontSize: 14, color: '#B8B2CC', lineHeight: 1.6 }}>{session.description}</div>
          </div>
        )}

        {members.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 12 }}>LINEUP ({members.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => {
                const eps = m.eps_json || {}
                return (
                  <Link key={m.applicant_id} to={'/profile/' + m.applicant_id} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '28%', background: 'linear-gradient(135deg,#F9A8A8,#F47272)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {(eps.displayName || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EDFF' }}>{eps.displayName || 'Anonyme'}{eps.age ? ', ' + eps.age : ''}</div>
                      {eps.role && <div style={{ fontSize: 12, color: '#F9A8A8' }}>{eps.role}{eps.morphology ? ' · ' + eps.morphology : ''}</div>}
                    </div>
                    {m.status === 'checked_in' && <div style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>Check-in</div>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {myApp?.status === 'accepted' && !checkInDone && (
          <button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#4ADE80,#16a34a)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            {checkInLoading ? 'Enregistrement...' : 'Je suis arrive ! Check-in'}
          </button>
        )}

        {checkInDone && (
          <div style={{ ...card, background: '#14532d', borderColor: '#4ADE80', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>Bienvenue !</div>
            <div style={{ fontSize: 14, color: '#4ADE80', marginTop: 4 }}>Check-in confirme</div>
            {session.exact_address && <div style={{ fontSize: 14, color: '#F0EDFF', marginTop: 8, fontWeight: 600 }}>{session.exact_address}</div>}
          </div>
        )}

        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/session/' + id + '/host')} style={{ width: '100%', padding: 14, background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, color: '#F0EDFF', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Gerer la session
            </button>
            {session.invite_code && (
              <button onClick={() => {
                const url = window.location.origin + '/join/' + session.invite_code
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
              }} style={{ width: '100%', padding: 14, background: copied ? '#14532d' : '#16141F', border: '1px solid ' + (copied ? '#4ADE80' : '#F9A8A8'), borderRadius: 12, color: copied ? '#4ADE80' : '#F9A8A8', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {copied ? 'Lien copie !' : 'Partager le lien'}
              </button>
            )}
          </div>
        )}

        {!isHost && !myApp && session.status === 'open' && (
          <button onClick={() => currentUser ? navigate('/session/' + id + '/apply') : navigate('/me')} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Postuler a cette session
          </button>
        )}

        {myApp && myApp.status !== 'accepted' && myApp.status !== 'checked_in' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#B8B2CC' }}>
              {myApp.status === 'pending' ? 'Candidature en attente...' : myApp.status === 'rejected' ? 'Candidature refusee' : 'Candidature envoyee'}
            </div>
          </div>
        )}

        {myApp?.status === 'accepted' && (
          <button onClick={() => navigate('/session/' + id + '/dm')} style={{ width: '100%', padding: 14, background: '#16141F', border: '1px solid #4ADE80', borderRadius: 12, color: '#4ADE80', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Ouvrir le DM avec le host
          </button>
        )}

      </div>
    </div>
  )
}