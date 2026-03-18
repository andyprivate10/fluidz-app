import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { MessageCircle, Users, Compass, Zap } from 'lucide-react'

const C = colors
const R = radius

type ChatThread = {
  id: string; type: 'dm_session' | 'group' | 'direct'; sessionId: string; sessionTitle: string
  peerId?: string; peerName?: string; peerAvatar?: string
  lastMessage: string; lastMessageAt: string; lastSenderId: string; isHost: boolean
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'now'
  if (m < 60) return m + 'min'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  return Math.floor(h / 24) + 'j'
}

export default function ChatsHubPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'direct' | 'dm' | 'group'>('all')
  const [user, setUser] = useState<any>(null)

  const loadThreads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    setUser(user)

    const [{ data: hosted }, { data: applied }, { data: dmPeerMsgs }] = await Promise.all([
      supabase.from('sessions').select('id, title, host_id').eq('host_id', user.id),
      supabase.from('applications').select('session_id, sessions(id, title, host_id)').eq('applicant_id', user.id).in('status', ['accepted', 'checked_in']),
      supabase.from('messages').select('session_id').eq('dm_peer_id', user.id).limit(50),
    ])

    const sessionMap = new Map<string, { title: string; hostId: string; isHost: boolean }>()
    ;(hosted || []).forEach((s: any) => sessionMap.set(s.id, { title: s.title, hostId: s.host_id, isHost: true }))
    ;(applied || []).forEach((a: any) => {
      if (a.sessions && !sessionMap.has(a.session_id)) sessionMap.set(a.session_id, { title: a.sessions.title, hostId: a.sessions.host_id, isHost: false })
    })
    const dmPeerSessionIds = [...new Set((dmPeerMsgs || []).map((m: any) => m.session_id))].filter(sid => !sessionMap.has(sid))
    if (dmPeerSessionIds.length > 0) {
      const { data: dmSessions } = await supabase.from('sessions').select('id, title, host_id').in('id', dmPeerSessionIds)
      ;(dmSessions || []).forEach((s: any) => sessionMap.set(s.id, { title: s.title, hostId: s.host_id, isHost: false }))
    }

    const sessionIds = Array.from(sessionMap.keys())
    if (sessionIds.length === 0) { setThreads([]); setLoading(false); return }

    const { data: msgs } = await supabase.from('messages').select('session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at').in('session_id', sessionIds).order('created_at', { ascending: false }).limit(200)

    const threadMap = new Map<string, ChatThread>()
    for (const msg of (msgs || [])) {
      const sess = sessionMap.get(msg.session_id)
      if (!sess) continue
      if (msg.room_type === 'group') {
        const key = `group_${msg.session_id}`
        if (!threadMap.has(key)) threadMap.set(key, { id: key, type: 'group', sessionId: msg.session_id, sessionTitle: sess.title, lastMessage: msg.text, lastMessageAt: msg.created_at, lastSenderId: msg.sender_id, isHost: sess.isHost })
      } else if (msg.room_type === 'dm') {
        const peerId = msg.sender_id === user.id ? msg.dm_peer_id : msg.sender_id
        if (!peerId) continue
        const key = `dm_${msg.session_id}_${peerId}`
        if (!threadMap.has(key)) threadMap.set(key, { id: key, type: sess.title === 'DM Direct' ? 'direct' : 'dm_session', sessionId: msg.session_id, sessionTitle: sess.title, peerId, peerName: msg.sender_id === user.id ? '' : msg.sender_name, lastMessage: msg.text, lastMessageAt: msg.created_at, lastSenderId: msg.sender_id, isHost: sess.isHost })
      }
    }

    const peerIds = [...new Set([...threadMap.values()].filter(t => t.peerId).map(t => t.peerId!))]
    if (peerIds.length > 0) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', peerIds)
      const profMap = new Map<string, { name: string; avatar?: string }>()
      ;(profiles || []).forEach((p: any) => profMap.set(p.id, { name: p.display_name || 'Anonyme', avatar: p.profile_json?.avatar_url }))
      for (const t of threadMap.values()) {
        if (t.peerId && profMap.has(t.peerId)) { const p = profMap.get(t.peerId)!; t.peerName = p.name; t.peerAvatar = p.avatar }
      }
    }

    setThreads([...threadMap.values()].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()))
    setLoading(false)
  }, [navigate])

  useEffect(() => { loadThreads() }, [loadThreads])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadThreads)

  const filtered = tab === 'all' ? threads : threads.filter(t => t.type === tab || (tab === 'dm' && t.type === 'dm_session'))

  function goToThread(t: ChatThread) {
    if (t.type === 'group') navigate(`/session/${t.sessionId}/chat`)
    else if (t.type === 'direct') navigate(`/dm/${t.peerId}`)
    else navigate(`/session/${t.sessionId}/dm/${t.peerId}`)
  }

  const tabDefs = [
    { k: 'all' as const, label: 'Tous' },
    { k: 'direct' as const, label: 'Directs' },
    { k: 'dm' as const, label: 'Sessions' },
    { k: 'group' as const, label: 'Groupes' },
  ]

  return (
    <div {...pullHandlers} style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 14px', borderBottom: `1px solid ${C.rule}` }}>
        <h1 style={{ ...typeStyle('title'), color: C.tx, margin: '0 0 14px' }}>Messages</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabDefs.map(({ k, label }) => {
            const count = k === 'all' ? 0 : threads.filter(t => k === 'direct' ? t.type === 'direct' : k === 'dm' ? t.type === 'dm_session' : t.type === 'group').length
            return (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: '7px 4px', borderRadius: R.chip, ...typeStyle('meta'), cursor: 'pointer',
                border: `1px solid ${tab === k ? C.p + '44' : C.rule}`,
                background: tab === k ? C.p2 : 'transparent',
                color: tab === k ? C.p : C.tx3,
              }}>
                {label}{count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '4px 16px', paddingBottom: 96 }}>
        {loading && <p style={{ ...typeStyle('body'), color: C.tx3, textAlign: 'center', padding: 24 }}>Chargement...</p>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: C.tx3 }}>
            <MessageCircle size={28} style={{ color: C.tx3, marginBottom: 10 }} strokeWidth={1.5} />
            <p style={{ ...typeStyle('section'), margin: '0 0 6px' }}>Pas encore de messages</p>
            <p style={{ ...typeStyle('body'), color: C.tx3, margin: '0 0 16px' }}>Rejoins une session ou explore les profils</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => navigate('/explore')} style={{ padding: '8px 16px', borderRadius: R.chip, ...typeStyle('label'), color: C.p, border: `1px solid ${C.pbd}`, background: C.p3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Compass size={12} /> Explorer
              </button>
              <button onClick={() => navigate('/sessions')} style={{ padding: '8px 16px', borderRadius: R.chip, ...typeStyle('label'), color: C.tx3, border: `1px solid ${C.rule}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={12} /> Sessions
              </button>
            </div>
          </div>
        )}

        {filtered.map(t => {
          const isUnread = t.lastSenderId !== user?.id && (Date.now() - new Date(t.lastMessageAt).getTime()) < 86400000
          return (
            <button key={t.id} onClick={() => goToThread(t)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px',
              background: 'transparent', border: 'none', borderBottom: `1px solid ${C.rule}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              {/* Avatar */}
              {t.type === 'group' ? (
                <div style={{ width: 42, height: 42, borderRadius: R.avatar, background: C.p3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${C.pbd}` }}>
                  <Users size={18} strokeWidth={1.5} style={{ color: C.p }} />
                </div>
              ) : t.peerAvatar ? (
                <img src={t.peerAvatar} alt="" style={{ width: 42, height: 42, borderRadius: R.avatar, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.rule2}` }} />
              ) : (
                <div style={{ width: 42, height: 42, borderRadius: R.avatar, background: C.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', ...typeStyle('label'), color: C.tx3, flexShrink: 0 }}>
                  {(t.peerName || '?')[0].toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...typeStyle('label'), color: C.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.type === 'group' ? t.sessionTitle : t.peerName || 'Anonyme'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                    {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.p }} />}
                    <span style={{ ...typeStyle('meta'), color: C.tx3 }}>{timeAgo(t.lastMessageAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{
                    ...typeStyle('meta'), fontWeight: 600, flexShrink: 0,
                    color: t.type === 'direct' ? '#7DD3FC' : t.type === 'group' ? C.lav : C.sage,
                  }}>
                    {t.type === 'direct' ? 'Direct' : t.type === 'group' ? 'Groupe' : t.isHost ? 'Host' : 'Session'}
                  </span>
                  {t.type !== 'direct' && <>
                    <span style={{ ...typeStyle('meta'), color: C.tx3 }}>·</span>
                    <span style={{ ...typeStyle('meta'), color: C.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sessionTitle}</span>
                  </>}
                </div>
                <p style={{ ...typeStyle('body'), color: C.tx3, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.lastMessage.slice(0, 60)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
