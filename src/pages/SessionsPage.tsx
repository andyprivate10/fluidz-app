import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Session = { id: string; title: string; status: string; approx_area: string; created_at: string }

export default function SessionsPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/me'); return }
      const { data } = await supabase.from('sessions').select('*').eq('host_id', user.id).order('created_at', { ascending: false })
      setSessions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #2A2740', background: '#16141F' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EDFF' }}>Mes sessions</div>
        <div style={{ fontSize: 13, color: '#7E7694', marginTop: 2 }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/session/create')}
          style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #F9A8A8, #F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          + Nouvelle session
        </button>
        {loading && <p style={{ color: '#B8B2CC', textAlign: 'center' }}>Chargement...</p>}
        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#7E7694', fontSize: 14 }}>
            Aucune session.<br />Cr&eacute;e ta premi&egrave;re !
          </div>
        )}
        {sessions.map(sess => (
          <div
            key={sess.id}
            onClick={() => navigate(`/session/${sess.id}/host`)}
            style={{ background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 16, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EDFF', flex: 1 }}>{sess.title}</div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: sess.status === 'open' ? '#4ADE80' : '#7E7694',
                  background: '#2A2740',
                  padding: '2px 8px',
                  borderRadius: 50,
                  marginLeft: 8,
                }}
              >
                {sess.status === 'open' ? 'Ouverte' : 'Brouillon'}
              </span>
            </div>
            {sess.approx_area && <div style={{ fontSize: 12, color: '#7E7694', marginTop: 6 }}>📍 {sess.approx_area}</div>}
            <div style={{ fontSize: 11, color: '#453F5C', marginTop: 4 }}>{new Date(sess.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
