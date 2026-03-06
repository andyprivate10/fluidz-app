import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

type Notif = { id: string; session_id: string; type: string; message: string; read: boolean; created_at: string }

const S = {
  bg0: '#0C0A14', bg1: '#16141F', bg2: '#1F1D2B',
  tx: '#F0EDFF', tx2: '#B8B2CC', tx3: '#7E7694',
  border: '#2A2740', p300: '#F9A8A8',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<string | null>(null)
  const [list, setList] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u?.id ?? null)
      if (u) load(u.id)
    })
  }, [])

  async function load(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('id, session_id, type, message, read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setList((data as Notif[]) ?? [])
    setLoading(false)
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function goSession(sessionId: string) {
    navigate('/session/' + sessionId + '/host')
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
        <p style={{ color: S.tx3 }}>Connecte-toi pour voir tes notifications.</p>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg0, paddingBottom: 96, fontFamily: 'Inter,sans-serif' }}>
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.border }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← Retour</button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: 0 }}>Notifications</h1>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading && <p style={{ color: S.tx3 }}>Chargement...</p>}
        {!loading && list.length === 0 && (
          <p style={{ color: S.tx3, textAlign: 'center', padding: 24 }}>Aucune notification.</p>
        )}
        {!loading && list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(n => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); goSession(n.session_id) }}
                style={{
                  width: '100%', textAlign: 'left', padding: 16, borderRadius: 14, border: '1px solid ' + S.border,
                  background: n.read ? S.bg1 : S.bg2, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.p300 }} />}
                  <span style={{ fontSize: 11, color: S.tx3 }}>{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: S.tx, fontWeight: n.read ? 500 : 600 }}>{n.message}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
