import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import {Bell, CheckCheck, ArrowLeft} from 'lucide-react'

const C = colors
const R = radius

type Notif = { id: string; type: string; title: string; body: string; href: string; read_at: string | null; created_at: string }

const TYPE_ICONS: Record<string, string> = {
  new_application: '→', application_accepted: '✓', application_rejected: '✗',
  session_invite: '→', group_invite: '⊕', direct_dm: '↗',
  direct_join: '⚡', contact_request: '♡', check_in: '◎',
  check_in_confirmed: '◉', review_request: '★', nudge: '⏱',
}

function formatRelative(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return m + 'min'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  const d = Math.floor(h / 24)
  if (d < 7) return d + 'j'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setNotifs(data || [])
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])
  const { pullHandlers, pullIndicator } = usePullToRefresh(load)

  async function handleClick(n: Notif) {
    if (!n.read_at) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    if (n.href?.trim()) navigate(n.href)
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read_at)
    if (unread.length === 0) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread.map(n => n.id))
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  return (
    <div {...pullHandlers} style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 14px', borderBottom: `1px solid ${C.rule}`, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', ...typeStyle('body'), color: C.tx2, cursor: 'pointer', padding: 0, marginBottom: 8 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
          <h1 style={{ ...typeStyle('title'), color: C.tx, margin: 0 }}>Notifications</h1>
        </div>
        {notifs.some(n => !n.read_at) && (
          <button onClick={markAllRead} style={{
            padding: '6px 12px', borderRadius: R.chip, ...typeStyle('meta'),
            color: C.sage, background: C.sagebg, border: `1px solid ${C.sagebd}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <CheckCheck size={12} /> Tout lire
          </button>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 16px', paddingBottom: 96 }}>
        {loading && <p style={{ ...typeStyle('body'), color: C.tx3, textAlign: 'center', padding: 24 }}>Chargement...</p>}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <Bell size={28} strokeWidth={1.5} style={{ color: C.tx3, marginBottom: 10 }} />
            <p style={{ ...typeStyle('section'), color: C.tx3, margin: '0 0 4px' }}>Aucune notification</p>
            <p style={{ ...typeStyle('body'), color: C.tx3 }}>Tu seras notifié des candidatures, messages et check-ins</p>
          </div>
        )}

        {notifs.map(n => (
          <button key={n.id} onClick={() => handleClick(n)} style={{
            width: '100%', textAlign: 'left', padding: '14px 12px', borderRadius: R.block,
            border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderBottom: `1px solid ${C.rule}`, position: 'relative',
            borderLeft: n.read_at ? 'none' : `3px solid ${C.p}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: R.icon, flexShrink: 0, marginTop: 1,
                background: n.read_at ? C.bg2 : C.p3, border: `1px solid ${n.read_at ? C.rule : C.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...typeStyle('meta'), color: n.read_at ? C.tx3 : C.p,
              }}>
                {TYPE_ICONS[n.type] || '•'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...typeStyle('label'), color: n.read_at ? C.tx2 : C.tx, margin: 0 }}>{n.title}</p>
                {n.body && <p style={{ ...typeStyle('body'), color: C.tx3, margin: '3px 0 0' }}>{n.body}</p>}
                <p style={{ ...typeStyle('meta'), color: C.tx3, margin: '6px 0 0', textAlign: 'right' }}>{formatRelative(n.created_at)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
