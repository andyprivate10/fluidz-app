import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

type Notif = { id: string; session_id: string; type: string; message: string; read: boolean; created_at: string }

const S = {
  bg0: '#0C0A14', bg1: '#16141F', bg2: '#1F1D2B',
  tx: '#F0EDFF', tx2: '#B8B2CC', tx3: '#7E7694', tx4: '#453F5C',
  border: '#2A2740', p300: '#F9A8A8', orange: '#FBBF24',
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return 'hier ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffHours < 24 * 7) return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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

  async function handleNotifClick(n: Notif) {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    setList(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    const href = '/session/' + n.session_id + '/host'
    if (href) navigate(href)
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
          <p style={{ color: S.tx3, textAlign: 'center', padding: 24 }}>Aucune notification</p>
        )}
        {!loading && list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(n => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                style={{
                  width: '100%', textAlign: 'left', padding: 16, borderRadius: 14, border: '1px solid ' + S.border,
                  background: S.bg1, cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.orange, flexShrink: 0, marginTop: 6 }} aria-hidden />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, color: S.tx, fontWeight: 700 }}>{n.message}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: S.tx2 }}>{n.type === 'new_application' ? 'Nouvelle candidature' : n.type}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 11, color: S.tx4, textAlign: 'right' }}>{formatRelative(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
