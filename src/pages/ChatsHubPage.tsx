import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { MessageCircle, Users } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

type ChatThread = {
  id: string
  type: 'dm_session' | 'group'
  sessionId: string
  sessionTitle: string
  peerId?: string
  peerName?: string
  peerAvatar?: string
  lastMessage: string
  lastMessageAt: string
  isHost: boolean
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'maintenant'
  if (m < 60) return m + 'min'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  const days = Math.floor(h / 24)
  return days + 'j'
}

export default function ChatsHubPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'dm' | 'direct' | 'group'>('all')
  

  const loadThreads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    

    // Get all sessions where user is host or accepted member
    const [{ data: hosted }, { data: applied }] = await Promise.all([
      supabase.from('sessions').select('id, title, host_id').eq('host_id', user.id),
      supabase.from('applications').select('session_id, sessions(id, title, host_id)').eq('applicant_id', user.id).in('status', ['accepted', 'checked_in']),
    ])

    const sessionMap = new Map<string, { title: string; hostId: string; isHost: boolean }>()
    ;(hosted || []).forEach((s: any) => sessionMap.set(s.id, { title: s.title, hostId: s.host_id, isHost: true }))
    ;(applied || []).forEach((a: any) => {
      if (a.sessions && !sessionMap.has(a.session_id)) {
        sessionMap.set(a.session_id, { title: a.sessions.title, hostId: a.sessions.host_id, isHost: false })
      }
    })

    const sessionIds = Array.from(sessionMap.keys())
    if (sessionIds.length === 0) { setThreads([]); setLoading(false); return }

    // Get latest message per (session_id, room_type, dm_peer_id) combo
    const { data: msgs } = await supabase
      .from('messages')
      .select('session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })
      .limit(200)

    // Build thread map
    const threadMap = new Map<string, ChatThread>()

    for (const msg of (msgs || [])) {
      const sess = sessionMap.get(msg.session_id)
      if (!sess) continue

      if (msg.room_type === 'group') {
        const key = `group_${msg.session_id}`
        if (!threadMap.has(key)) {
          threadMap.set(key, {
            id: key, type: 'group', sessionId: msg.session_id,
            sessionTitle: sess.title, lastMessage: msg.text,
            lastMessageAt: msg.created_at, isHost: sess.isHost,
          })
        }
      } else if (msg.room_type === 'dm') {
        // Determine the peer (the other person in the DM)
        const peerId = msg.sender_id === user.id ? msg.dm_peer_id : msg.sender_id
        if (!peerId) continue
        const key = `dm_${msg.session_id}_${peerId}`
        if (!threadMap.has(key)) {
          threadMap.set(key, {
            id: key, type: sess.title === 'DM Direct' ? 'direct' as any : 'dm_session', sessionId: msg.session_id,
            sessionTitle: sess.title, peerId, peerName: msg.sender_id === user.id ? '' : msg.sender_name,
            lastMessage: msg.text, lastMessageAt: msg.created_at, isHost: sess.isHost,
          })
        }
      }
    }

    // Fetch peer profiles for DMs
    const peerIds = [...new Set([...threadMap.values()].filter(t => t.peerId).map(t => t.peerId!))]
    if (peerIds.length > 0) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', peerIds)
      const profMap = new Map<string, { name: string; avatar?: string }>()
      ;(profiles || []).forEach((p: any) => {
        profMap.set(p.id, { name: p.display_name || 'Anonyme', avatar: p.profile_json?.avatar_url })
      })
      for (const t of threadMap.values()) {
        if (t.peerId && profMap.has(t.peerId)) {
          const p = profMap.get(t.peerId)!
          t.peerName = p.name
          t.peerAvatar = p.avatar
        }
      }
    }

    const sorted = [...threadMap.values()].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    setThreads(sorted)
    setLoading(false)
  }, [navigate])

  useEffect(() => { loadThreads() }, [loadThreads])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadThreads)

  const filtered = tab === 'all' ? threads : tab === 'direct' ? threads.filter(t => (t as any).type === 'direct') : tab === 'dm' ? threads.filter(t => t.type === 'dm_session') : threads.filter(t => t.type === 'group')

  function goToThread(t: ChatThread) {
    if (t.type === 'group') navigate(`/session/${t.sessionId}/chat`)
    else if ((t as any).type === 'direct') navigate(`/dm/${t.peerId}`)
    else navigate(`/session/${t.sessionId}/dm/${t.peerId}`)
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <div style={{ padding: '40px 20px 12px', borderBottom: '1px solid ' + S.border }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 12px' }}>Messages</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['all', 'Tous'], ['direct', 'Directs'], ['dm', 'Sessions'], ['group', 'Groupes']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '7px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid ' + (tab === k ? S.p300 + '55' : S.border),
              background: tab === k ? S.p300 + '14' : 'transparent',
              color: tab === k ? S.p300 : S.tx3,
            }}>{l} {k !== 'all' ? `(${threads.filter(t => k === 'dm' ? t.type === 'dm_session' : t.type === 'group').length})` : ''}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && <p style={{ color: S.tx3, textAlign: 'center', padding: 24 }}>Chargement...</p>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            <MessageCircle size={32} style={{ color: S.tx4, marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Pas de messages</p>
            <p style={{ fontSize: 12 }}>Tes conversations apparaîtront ici</p>
          </div>
        )}

        {filtered.map(t => (
          <button key={t.id} onClick={() => goToThread(t)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
            background: 'transparent', border: 'none', borderBottom: '1px solid ' + S.border,
            cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            {/* Avatar */}
            {t.type === 'group' ? (
              <div style={{ width: 44, height: 44, borderRadius: '28%', background: S.p300 + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={20} style={{ color: S.p300 }} />
              </div>
            ) : t.peerAvatar ? (
              <img src={t.peerAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '28%', objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.border }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(t.peerName || '?')[0].toUpperCase()}
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: S.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.type === 'group' ? `💬 ${t.sessionTitle}` : t.peerName || 'Anonyme'}
                </span>
                <span style={{ fontSize: 10, color: S.tx4, flexShrink: 0, marginLeft: 8 }}>{timeAgo(t.lastMessageAt)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: t.isHost ? S.p300 : S.green, fontWeight: 600, flexShrink: 0 }}>
                  {(t as any).type === 'direct' ? 'Direct' : t.type === 'group' ? 'Groupe' : t.isHost ? 'Host' : 'Session'}
                </span>
                <span style={{ fontSize: 11, color: S.tx3 }}>·</span>
                <span style={{ fontSize: 11, color: S.tx4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sessionTitle}</span>
              </div>
              <p style={{ fontSize: 12, color: S.tx3, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.lastMessage.slice(0, 60)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
