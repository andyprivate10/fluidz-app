import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Session = { id: string; title: string; description: string; approx_area: string; status: string; host_id: string }
type Member = { applicant_id: string; eps_json: Record<string, unknown> }

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [myStatus, setMyStatus] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) { setError('Session introuvable'); setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)
      const { data, error: se } = await supabase.from('sessions').select('*').eq('id', id).single()
      if (se || !data) { setError('Session introuvable'); setLoading(false); return }
      setSession(data as Session)
      const { data: accepted } = await supabase.from('applications').select('applicant_id, eps_json').eq('session_id', id).eq('status', 'accepted')
      setMembers((accepted as Member[]) ?? [])
      if (user) {
        const { data: myApp } = await supabase.from('applications').select('status').eq('session_id', id).eq('applicant_id', user.id).maybeSingle()
        setMyStatus(myApp?.status ?? null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const st: React.CSSProperties = { background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: 'Inter, sans-serif' }
  const isHost = currentUser && session && currentUser.id === session.host_id

  if (loading) return <div style={{ ...st, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#B8B2CC' }}>Chargement...</p></div>
  if (error || !session) return <div style={{ ...st, padding: 24 }}><p style={{ color: '#F87171' }}>{error || 'Erreur'}</p></div>

  const statusColor = session.status === 'open' ? '#4ADE80' : '#FBBF24'
  const statusLabel = session.status === 'open' ? 'Ouverte' : 'Brouillon'

  return (
    <div style={st}>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #2A2740', background: '#16141F' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: '#2A2740', padding: '3px 10px', borderRadius: 50 }}>{statusLabel}</span>
          {session.approx_area && <span style={{ fontSize: 12, color: '#7E7694' }}>📍 {session.approx_area}</span>}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0EDFF', margin: '0 0 8px' }}>{session.title}</h1>
        {session.description && <p style={{ fontSize: 14, color: '#B8B2CC', margin: 0, lineHeight: 1.5 }}>{session.description}</p>}
      </div>

      {members.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #2A2740' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', marginBottom: 12 }}>LINEUP — {members.length} membre{members.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m, i) => {
              const eps = m.eps_json as Record<string, string>
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '28%', background: 'linear-gradient(135deg,#F9A8A8,#F47272)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(eps.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EDFF' }}>{eps.displayName || 'Membre'}{eps.age ? ', ' + eps.age + ' ans' : ''}</div>
                    <div style={{ fontSize: 12, color: '#7E7694' }}>{eps.role || ''}{eps.morphology ? ' · ' + eps.morphology : ''}{eps.location ? ' · ' + eps.location : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isHost && (
          <button onClick={() => navigate('/session/' + id + '/host')} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Gerer la session →
          </button>
        )}
        {!isHost && myStatus === 'accepted' && (
          <button onClick={() => navigate('/session/' + id + '/dm')} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Ouvrir le DM host 💬
          </button>
        )}
        {!isHost && myStatus === 'pending' && (
          <div style={{ padding: 14, background: '#16141F', border: '1px solid #FBBF24', borderRadius: 12, textAlign: 'center', color: '#FBBF24', fontSize: 14, fontWeight: 600 }}>
            Candidature en attente ⏳
          </div>
        )}
        {!isHost && myStatus === 'rejected' && (
          <div style={{ padding: 14, background: '#16141F', border: '1px solid #F87171', borderRadius: 12, textAlign: 'center', color: '#F87171', fontSize: 14, fontWeight: 600 }}>
            Candidature non retenue
          </div>
        )}
        {!isHost && !myStatus && session.status === 'open' && (
          <button onClick={() => currentUser ? navigate('/session/' + id + '/apply') : navigate('/me')} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Postuler a cette session 🔥
          </button>
        )}
        {!isHost && !myStatus && session.status !== 'open' && (
          <div style={{ padding: 14, background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, textAlign: 'center', color: '#7E7694', fontSize: 14 }}>
            Session pas encore ouverte
          </div>
        )}
      </div>
    </div>
  )
}