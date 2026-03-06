import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = { bg0: '#0C0A14', bg1: '#16141F', tx: '#F0EDFF', tx2: '#B8B2CC', tx3: '#7E7694', p300: '#F9A8A8', border: '#2A2740', grad: 'linear-gradient(135deg,#F9A8A8,#F47272)' }

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<string | null>(null)
  const [latestHostSession, setLatestHostSession] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u?.id ?? null)
      if (u) {
        supabase.from('sessions').select('id, title').eq('host_id', u.id).order('created_at', { ascending: false }).limit(1).then(({ data }) => {
          const row = Array.isArray(data) ? data[0] : data
          setLatestHostSession(row ?? null)
        })
      } else setLatestHostSession(null)
    })
  }, [])

  return (
    <div style={{ background: S.bg0, padding: 24, maxWidth: 390, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100vh', justifyContent: 'center', paddingBottom: 80, fontFamily: 'Inter,sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: S.p300, margin: 0 }}>fluidz</h1>

      {!user && (
        <p style={{ color: S.tx2, fontSize: 14, margin: 0 }}>
          Bienvenue sur Fluidz — organise ou rejoins des plans de groupe en toute simplicité.
        </p>
      )}

      {user && latestHostSession && (
        <button
          type="button"
          onClick={() => navigate('/session/' + latestHostSession!.id + '/host')}
          style={{ padding: 14, borderRadius: 12, border: '1px solid ' + S.border, background: S.bg1, color: S.tx2, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
        >
          📍 Ta session : {latestHostSession.title}
        </button>
      )}

      <p style={{ color: S.tx2, fontSize: 14, margin: 0 }}>Plans de groupe ce soir</p>
      <button type="button" onClick={() => navigate('/session/create')} style={{ padding: 14, borderRadius: 12, fontWeight: 700, color: '#fff', background: S.grad, border: 'none', cursor: 'pointer' }}>
        Créer une session
      </button>
      <button type="button" onClick={() => navigate('/join')} style={{ padding: 14, borderRadius: 12, color: S.tx2, border: '1px solid ' + S.border, background: 'transparent', cursor: 'pointer' }}>
        Rejoindre avec un lien
      </button>
    </div>
  )
}
