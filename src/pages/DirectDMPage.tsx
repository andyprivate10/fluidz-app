import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { ArrowLeft, Send, Camera, Smile, X, Plus } from 'lucide-react'
import { compressImage } from '../lib/media'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { formatMessageTime } from '../lib/timing'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { useTranslation } from 'react-i18next'
import { sendPushToUser } from '../lib/pushSender'
import EmojiBar from '../components/EmojiBar'
import { notifyUser } from '../lib/feedback'
import ImageLightbox from '../components/ImageLightbox'
import ChatMessageMenu from '../components/ChatMessageMenu'

const S = colors

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
  const { t } = useTranslation()
  const { peerId } = useParams<{ peerId: string }>()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [peerProfile, setPeerProfile] = useState<{ name: string; avatar?: string; role?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiBar, setShowEmojiBar] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; sender_name: string } | null>(null)
  const [menuMsg, setMenuMsg] = useState<Message | null>(null)
  const [chatLightbox, setChatLightbox] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [_showAddressSheet, setShowAddressSheet] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { typingUsers, sendTyping, stopTyping } = useTypingIndicator(
    currentUser?.id && peerId ? `typing:direct:${[currentUser.id, peerId].sort().join(':')}` : '',
    currentUser?.id,
    displayName || t('common.anonymous'),
  )

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
      setPeerProfile({ name: peer.display_name || t('common.anonymous'), avatar: pj.avatar_url as string, role: pj.role as string })
    }

    // Load my display name
    const { data: me } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle()
    setDisplayName(me?.display_name || user.email || t('common.me'))

    // Ensure a "direct DM session" exists (upsert to avoid race condition)
    const sid = directDmSessionId(user.id, peerId!)
    setSessionId(sid)

    await supabase.from('sessions').upsert({
      id: sid, host_id: user.id, title: DM_DIRECT_TITLE, status: 'open',
      description: t('chat.direct_message_desc'), approx_area: '',
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
        if (msg.sender_id !== currentUser?.id) notifyUser('message')
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
    const raw = newMessage.trim()
    const msgText = replyTo ? '> ' + replyTo.text.slice(0, 80) + '\n\n' + raw : raw
    await supabase.from('messages').insert({
      session_id: sessionId, sender_id: currentUser.id, text: msgText,
      sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
    })
    // Notify peer
    await supabase.from('notifications').insert({
      user_id: peerId, type: 'direct_dm',
      title: displayName,
      body: raw.length > 60 ? raw.slice(0, 60) + '...' : raw,
      href: '/dm/' + currentUser.id,
    })
    if (peerId) sendPushToUser(peerId, displayName, raw.length > 60 ? raw.slice(0, 60) + '...' : raw, '/dm/' + currentUser.id)
    setNewMessage('')
    setReplyTo(null)
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
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.bg2 }} />
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
      <header style={{ padding: '12px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        {peerProfile?.avatar ? (
          <img src={peerProfile.avatar} alt="" onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid ' + S.rule }} />
        ) : (
          <div onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {(peerProfile?.name || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }} onClick={() => navigate('/profile/' + peerId)}>
          <p style={{ fontSize: 15, fontWeight: 700, color: S.tx, margin: 0, cursor: 'pointer' }}>{peerProfile?.name || 'Chargement...'}</p>
          {peerProfile?.role && <span style={{ fontSize: 11, color: S.p }}>{peerProfile.role}</span>}
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowActions(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid '+S.rule, background: 'transparent', color: S.tx2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={16} strokeWidth={2} />
          </button>
          {showActions && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: S.bg1, border: '1px solid '+S.rule, borderRadius: 12, overflow: 'hidden', zIndex: 60, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { setShowActions(false); navigate('/session/create?invite=' + peerId) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid '+S.rule, color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {t('dm.create_session')}
              </button>
              <button onClick={() => { setShowActions(false); setShowAddressSheet(true) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {t('dm.share_address')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{t('chat.new_dm')}</p>
            <p style={{ fontSize: 12 }}>{t('chat.send_first')}</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} onDoubleClick={() => setReplyTo({ id: msg.id, text: msg.text, sender_name: msg.sender_name })} style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: msg.has_media ? 4 : '10px 14px', fontSize: 14, maxWidth: '78%', lineHeight: 1.45,
              borderRadius: 16, background: isMe(msg.sender_id) ? 'linear-gradient(135deg, '+S.p+', '+S.pDark+')' : S.bg2,
              borderBottomRightRadius: isMe(msg.sender_id) ? 4 : 16,
              borderBottomLeftRadius: isMe(msg.sender_id) ? 16 : 4,
              overflow: 'hidden',
            }}
            onContextMenu={(e) => { e.preventDefault(); setMenuMsg(msg) }}
            >
              {msg.has_media && msg.media_urls?.map((url: string, mi: number) => {
                const isAudio = url.endsWith('.webm') || url.includes('audio')
                const isVideo = /\.(mp4|mov)$/i.test(url) || url.includes('video')
                if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 240, height: 36 }} />
                if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 260, borderRadius: 10 }} />
                return <img key={mi} src={url} alt="" loading="lazy" onClick={() => setChatLightbox(url)} style={{ width: '100%', maxWidth: 240, borderRadius: 10, cursor: 'zoom-in' }} />
              })}
              {msg.text && msg.text !== '📷 Photo' && msg.text !== '🎤 Audio' && (
                <span style={{ color: S.tx }}>{msg.text}</span>
              )}
              <div style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 4, marginTop: 2, padding: msg.has_media ? '0 8px 4px' : 0 }}>
                <span style={{ fontSize: 10, color: S.tx4 }}>{formatMessageTime(msg.created_at)}{isMe(msg.sender_id) && (() => {
                  const peerMsgs = messages.filter(m => !isMe(m.sender_id))
                  const lastPeerTime = peerMsgs.length > 0 ? new Date(peerMsgs[peerMsgs.length - 1].created_at).getTime() : 0
                  const isSeen = lastPeerTime > new Date(msg.created_at).getTime()
                  return <span style={{ color: isSeen ? '#7DD3FC' : S.tx4, marginLeft: 3 }}>{isSeen ? '✓✓' : '✓'}</span>
                })()}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: S.tx3, fontStyle: 'italic' }}>{typingUsers.join(', ')} {t('chat.typing', { users: typingUsers.join(', ') })}</span>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && <div style={{padding:'8px 14px', background:'rgba(5,4,10,0.92)', borderTop:'1px solid '+S.rule, display:'flex', alignItems:'center', gap:8}}><div style={{flex:1,borderLeft:'3px solid '+S.p, padding:'4px 10px'}}><span style={{fontSize:10,color:S.p,fontWeight:700}}>{replyTo.sender_name}</span><p style={{fontSize:12,color:S.tx2,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{replyTo.text}</p></div><button onClick={() => setReplyTo(null)} style={{background:'none',border:'none',color:S.tx3,cursor:'pointer'}}><X size={14}/></button></div>}
      {/* Emoji bar */}
      {showEmojiBar && (
        <div style={{ padding: '6px 14px 0', background: 'rgba(5,4,10,0.92)' }}>
          <EmojiBar onSelect={e => { setNewMessage(prev => prev + e); setShowEmojiBar(false) }} />
        </div>
      )}
      {/* Input */}
      <div style={{ background: 'rgba(5,4,10,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: 12, borderTop: showEmojiBar ? 'none' : '1px solid ' + S.rule, display: 'flex', gap: 8, flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule, cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
          <Camera size={16} style={{ color: S.tx3 }} />
          <input type="file" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleSendPhoto(f); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: recording ? S.red : S.bg2, color: recording ? '#fff' : S.tx3, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: recording ? 'pulse 1s infinite' : 'none' }}>
          {recording ? '■' : '●'}
        </button>
        <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
        <button type="button" onClick={() => setShowEmojiBar(!showEmojiBar)} style={{ width: 40, height: 40, borderRadius: 12, background: showEmojiBar ? S.p3 : S.bg2, border: '1px solid ' + (showEmojiBar ? S.pbd : S.rule), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Smile size={16} style={{ color: showEmojiBar ? S.p : S.tx3 }} />
        </button>
        <input
          type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); sendTyping() }}
          onKeyDown={e => { if (e.key === 'Enter') { stopTyping(); handleSend() } }}
          placeholder={t('placeholders.message_dots')} style={{ flex: 1, padding: 12, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />
        <button onClick={handleSend} disabled={!newMessage.trim() || sending} style={{ width: 40, height: 40, borderRadius: 12, background: newMessage.trim() ? S.grad : S.bg2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={16} style={{ color: newMessage.trim() ? '#fff' : S.tx4 }} />
        </button>
      </div>
      {chatLightbox && <ImageLightbox images={[chatLightbox]} onClose={() => setChatLightbox(null)} />}
      {menuMsg && <ChatMessageMenu message={menuMsg} isOwn={menuMsg.sender_id === currentUser?.id} onCopy={() => showToast(t('chat.copied'), 'success')} onReply={() => setReplyTo({ id: menuMsg.id, text: menuMsg.text, sender_name: menuMsg.sender_name })} onDelete={menuMsg.sender_id === currentUser?.id ? () => { supabase.from('messages').delete().eq('id', menuMsg.id); setMessages(prev => prev.filter(m => m.id !== menuMsg.id)) } : undefined} onClose={() => setMenuMsg(null)} labels={{ copy: t('chat.copy_text'), reply: t('chat.reply'), delete: t('chat.delete_msg') }} />}
    </div>
  )
}
