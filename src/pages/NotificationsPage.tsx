import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors } from '../brand'

type Notif = { id: string; user_id: string; type: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string }

const S = {
  ...colors,
  red: '#F87171', orange: '#FBBF24', blue: '#7DD3FC',
  grad: colors.p,
}

const TYPE_ICONS: Record<string, string> = {
  new_application: '📩',
  application_accepted: '✅',
  application_rejected: '❌',
  session_invite: '📩',
  group_invite: '👥',
  direct_dm: '💬',
  direct_join: '⚡',
  contact_request: '💕',
  check_in: '📍',
  review_request: '⭐',
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
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u?.id ?? null)
      if (u) load(u.id)
    })
  }, [])

  async function load(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, href, read_at, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setList((data as Notif[]) ?? [])
    setLoading(false)
  }

  const refreshNotifs = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, href, read_at, created_at')
      .eq('user_id', user)
      .order('created_at', { ascending: false })
    setList((data as Notif[]) ?? [])
  }, [user])

  const { pullHandlers, pullIndicator } = usePullToRefresh(refreshNotifs)

  async function handleNotifClick(n: Notif) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
    setList(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    if (n.href && n.href.trim() !== '') navigate(n.href)
  }

  async function markAllRead() {
    if (!user) return
    setMarkingAll(true)
    const now = new Date().toISOString()
    await supabase.from('notifications').update({ read_at: now }).eq('user_id', user).is('read_at', null)
    setList(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? now })))
    setMarkingAll(false)
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: S.tx3 }}>Connecte-toi pour voir tes notifications.</p>
      </div>
    )
  }

  return (
    <div {...pullHandlers} style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96 }}>
      {pullIndicator}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← Retour</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: 0 }}>Notifications</h1>
          {list.some(n => n.read_at == null) && (
            <button onClick={markAllRead} disabled={markingAll} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid ' + S.rule, background: S.bg1, color: S.tx2, cursor: 'pointer' }}>
              {markingAll ? '...' : 'Tout marquer comme lu'}
            </button>
          )}
        </div>
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
                  width: '100%', textAlign: 'left', padding: 16, borderRadius: 14, border: '1px solid ' + S.rule,
                  background: n.read_at ? S.bg1 : S.bg1, cursor: 'pointer', fontFamily: 'inherit', position: 'relative', borderLeft: n.read_at ? 'none' : '3px solid #F9A8A8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {n.read_at == null && <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.orange, flexShrink: 0, marginTop: 6 }} aria-hidden />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, color: S.tx, fontWeight: 700 }}>{TYPE_ICONS[n.type] || '🔔'} {n.title || ''}</p>
                    {n.body && <p style={{ margin: '4px 0 0', fontSize: 12, color: S.tx2 }}>{n.body}</p>}
                    <p style={{ margin: '8px 0 0', fontSize: 11, color: S.tx4, textAlign: 'right' }}>{formatRelative(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
