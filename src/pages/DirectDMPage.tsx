import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Send, Camera } from 'lucide-react'
import { compressImage } from '../lib/media'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

type Message = { id: string; text: string; sender_id: string; created_at: string; sender_name: string; has_media?: boolean; media_urls?: string[] }


// Deterministic session ID for direct DMs between two users
function directDmSessionId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort()
  // Create a deterministic UUID-like string
  const combined = sorted.join('-')
  // Simple hash → UUID format
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `dddd0000-${hex.slice(0,4)}-${hex.slice(4,8)}-0000-${sorted[0].slice(0,12)}`
}

export default function DirectDMPage() {
  const { peerId } = useParams<{ peerId: string }>()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [peerProfile, setPeerProfile] = useState<{ name: string; avatar?: string; role?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!peerId) return
    init()
  }, [peerId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    setCurrentUser(user)

    // Load peer profile
    const { data: peer } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', peerId).maybeSingle()
    if (peer) {
      const pj = (peer.profile_json || {}) as Record<string, unknown>
      setPeerProfile({ name: peer.display_name || 'Anonyme', avatar: pj.avatar_url as string, role: pj.role as string })
    }

    // Load my display name
    const { data: me } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle()
    setDisplayName(me?.display_name || user.email || 'Moi')

    // Ensure a "direct DM session" exists
    const sid = directDmSessionId(user.id, peerId!)
    setSessionId(sid)

    // Check if session exists
    const { data: existing } = await supabase.from('sessions').select('id').eq('id', sid).maybeSingle()
    if (!existing) {
      await supabase.from('sessions').insert({
        id: sid, host_id: user.id, title: 'DM Direct', status: 'open',
        description: 'Direct message', approx_area: '',
      }).select('id').single()
    }

    // Load messages
    const { data: msgs } = await supabase.from('messages')
      .select('id, text, sender_id, created_at, sender_name, has_media, media_urls')
      .eq('session_id', sid).eq('room_type', 'dm')
      .order('created_at')
      .limit(100)
    setMessages(msgs || [])

    // Mark direct DM notifications as read
    await supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('type', 'direct_dm')
      .like('href', '%/dm/' + user.id + '%')
      .is('read_at', null)

    // Realtime
    const channel = supabase.channel('direct-dm-' + sid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'session_id=eq.' + sid }, (payload: any) => {
        const msg = payload.new as Message & { room_type?: string }
        if (msg.room_type !== 'dm') return
        setMessages(prev => [...prev, { id: msg.id, text: msg.text, sender_id: msg.sender_id, created_at: msg.created_at, sender_name: msg.sender_name, has_media: msg.has_media, media_urls: msg.media_urls }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!newMessage.trim() || !currentUser || !sessionId || sending) return
    setSending(true)
    const msgText = newMessage.trim()
    await supabase.from('messages').insert({
      session_id: sessionId, sender_id: currentUser.id, text: msgText,
      sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
    })
    // Notify peer
    await supabase.from('notifications').insert({
      user_id: peerId, type: 'direct_dm',
      title: '💬 ' + displayName,
      body: msgText.length > 60 ? msgText.slice(0, 60) + '...' : msgText,
      href: '/dm/' + currentUser.id,
    }).then(() => {})
    setNewMessage('')
    setSending(false)
  }

  async function handleSendPhoto(file: File) {
    if (!currentUser || !sessionId) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `${currentUser.id}/dm_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, compressed)
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('messages').insert({
        session_id: sessionId, sender_id: currentUser.id, text: '📷 Photo',
        sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
        has_media: true, media_urls: [publicUrl],
      })
    } catch {}
    setUploading(false)
  }

  const isMe = (senderId: string) => senderId === currentUser?.id

  return (
    <div style={{ background: S.bg0, height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ padding: '12px 16px', borderBottom: '1px solid ' + S.border, background: S.bg1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        {peerProfile?.avatar ? (
          <img src={peerProfile.avatar} alt="" onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', cursor: 'pointer', border: '1px solid ' + S.border }} />
        ) : (
          <div onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {(peerProfile?.name || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }} onClick={() => navigate('/profile/' + peerId)}>
          <p style={{ fontSize: 15, fontWeight: 700, color: S.tx, margin: 0, cursor: 'pointer' }}>{peerProfile?.name || 'Chargement...'}</p>
          {peerProfile?.role && <p style={{ fontSize: 11, color: S.p300, margin: 0 }}>{peerProfile.role}</p>}
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Nouveau DM</p>
            <p style={{ fontSize: 12 }}>Envoie le premier message</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: msg.has_media ? 4 : '10px 14px', fontSize: 15, maxWidth: '80%',
              borderRadius: 16, background: isMe(msg.sender_id) ? S.p300 + '22' : S.bg2,
              borderBottomRightRadius: isMe(msg.sender_id) ? 4 : 16,
              borderBottomLeftRadius: isMe(msg.sender_id) ? 16 : 4,
              overflow: 'hidden',
            }}>
              {msg.has_media && msg.media_urls?.map((url: string, mi: number) => {
                const isAudio = url.endsWith('.webm') || url.includes('audio')
                const isVideo = /\.(mp4|mov)$/i.test(url) || url.includes('video')
                if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 240, height: 36 }} />
                if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 260, borderRadius: 10 }} />
                return <img key={mi} src={url} alt="" style={{ width: '100%', maxWidth: 240, borderRadius: 10 }} />
              })}
              {msg.text && msg.text !== '📷 Photo' && msg.text !== '🎤 Audio' && (
                <span style={{ color: S.tx }}>{msg.text}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ background: S.bg1, padding: 12, borderTop: '1px solid ' + S.border, display: 'flex', gap: 8, flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.border, cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
          <Camera size={16} style={{ color: S.tx3 }} />
          <input type="file" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleSendPhoto(f); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
        <input
          type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..." style={{ flex: 1, padding: 12, background: S.bg2, border: '1px solid ' + S.border, borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={handleSend} disabled={!newMessage.trim() || sending} style={{ width: 40, height: 40, borderRadius: 12, background: newMessage.trim() ? S.grad : S.bg2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={16} style={{ color: newMessage.trim() ? '#fff' : S.tx4 }} />
        </button>
      </div>
    </div>
  )
}
