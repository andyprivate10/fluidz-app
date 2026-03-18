import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Send, Camera } from 'lucide-react'
import { compressImage } from '../lib/media'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

function formatTime(d: string): string {
  const dt = new Date(d)
  const now = new Date()
  const sameDay = dt.toDateString() === now.toDateString()
  if (sameDay) return dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const S = {
  ...colors,
  red: '#F87171', orange: '#FBBF24', blue: '#7DD3FC',
  grad: colors.p,
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
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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

    // Ensure a "direct DM session" exists (upsert to avoid race condition)
    const sid = directDmSessionId(user.id, peerId!)
    setSessionId(sid)

    await supabase.from('sessions').upsert({
      id: sid, host_id: user.id, title: 'DM Direct', status: 'open',
      description: 'Direct message', approx_area: '',
    }, { onConflict: 'id' })

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

    setLoading(false)
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
      const isVideo = file.type.startsWith('video/')
      let uploadFile: Blob = file
      const ext = isVideo ? (file.name.split('.').pop() || 'mp4') : 'jpg'
      const label = isVideo ? '🎬 Vidéo' : '📷 Photo'
      if (!isVideo) uploadFile = await compressImage(file)
      const path = `${currentUser.id}/ddm_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, uploadFile, { contentType: isVideo ? file.type : 'image/jpeg' })
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('messages').insert({
        session_id: sessionId, sender_id: currentUser.id, text: label,
        sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
        has_media: true, media_urls: [publicUrl],
      })
    } catch {}
    setUploading(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size < 100) return
        setUploading(true)
        const path = currentUser.id + '/dm_audio_' + Date.now() + '.webm'
        const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'audio/webm' })
        if (error) { setUploading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        await supabase.from('messages').insert({
          session_id: sessionId, sender_id: currentUser.id, text: '🎤 Audio',
          sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
          has_media: true, media_urls: [publicUrl],
        })
        setUploading(false)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch { /* mic denied */ }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const isMe = (senderId: string) => senderId === currentUser?.id

  if (loading) return (
    <div style={{ background: S.bg, height: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid ' + S.rule, background: S.bg1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '28%', background: S.bg2 }} />
        <div style={{ width: 120, height: 16, borderRadius: 8, background: S.bg2 }} />
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'flex-start', width: 200, height: 40, borderRadius: 16, background: S.bg2 }} />
        <div style={{ alignSelf: 'flex-end', width: 160, height: 36, borderRadius: 16, background: S.bg2 }} />
        <div style={{ alignSelf: 'flex-start', width: 240, height: 40, borderRadius: 16, background: S.bg2 }} />
      </div>
    </div>
  )

  return (
    <div style={{ background: S.bg, height: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />
      {/* Header */}
      <header style={{ padding: '12px 16px', borderBottom: '1px solid ' + S.rule, background: S.bg1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        {peerProfile?.avatar ? (
          <img src={peerProfile.avatar} alt="" onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', cursor: 'pointer', border: '1px solid ' + S.rule }} />
        ) : (
          <div onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {(peerProfile?.name || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }} onClick={() => navigate('/profile/' + peerId)}>
          <p style={{ fontSize: 15, fontWeight: 700, color: S.tx, margin: 0, cursor: 'pointer' }}>{peerProfile?.name || 'Chargement...'}</p>
          {peerProfile?.role && <span style={{ fontSize: 11, color: S.p }}>{peerProfile.role}</span>}
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
              borderRadius: 16, background: isMe(msg.sender_id) ? S.p + '22' : S.bg2,
              borderBottomRightRadius: isMe(msg.sender_id) ? 4 : 16,
              borderBottomLeftRadius: isMe(msg.sender_id) ? 16 : 4,
              overflow: 'hidden',
            }}
            onContextMenu={(e) => {
              if (!isMe(msg.sender_id)) return
              e.preventDefault()
              if (window.confirm('Supprimer ce message ?')) {
                supabase.from('messages').delete().eq('id', msg.id).then(() => {
                  setMessages(prev => prev.filter(m => m.id !== msg.id))
                })
              }
            }}
            >
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
              <div style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 4, marginTop: 2, padding: msg.has_media ? '0 8px 4px' : 0 }}>
                <span style={{ fontSize: 10, color: S.tx4 }}>{formatTime(msg.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ background: S.bg1, padding: 12, borderTop: '1px solid ' + S.rule, display: 'flex', gap: 8, flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule, cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
          <Camera size={16} style={{ color: S.tx3 }} />
          <input type="file" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleSendPhoto(f); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: recording ? '#F87171' : S.bg2, color: recording ? '#fff' : S.tx3, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: recording ? 'pulse 1s infinite' : 'none' }}>
          {recording ? '■' : '●'}
        </button>
        <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
        <input
          type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..." style={{ flex: 1, padding: 12, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={handleSend} disabled={!newMessage.trim() || sending} style={{ width: 40, height: 40, borderRadius: 12, background: newMessage.trim() ? S.grad : S.bg2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={16} style={{ color: newMessage.trim() ? '#fff' : S.tx4 }} />
        </button>
      </div>
    </div>
  )
}
