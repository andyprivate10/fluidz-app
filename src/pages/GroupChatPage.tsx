import { useState, useEffect, useRef } from 'react'
import { SkeletonChatPage } from '../components/Skeleton'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { ArrowLeft, Send, Users, Shield, Camera } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
  has_media?: boolean
  media_urls?: string[]
}

type Member = {
  applicant_id: string
  display_name: string
  avatar_url?: string
  role?: string
  status: string
}

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `${diffMin} min`
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ title: string; host_id: string; group_chat_enabled: boolean } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [myAcceptedAt, setMyAcceptedAt] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [canChat, setCanChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    init()
  }, [id])

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/me?next=/session/' + id + '/chat'); return }
    setCurrentUser(user)

    // Fetch user display name
    const { data: prof } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle()
    if (prof?.display_name) setDisplayName(prof.display_name)

    // Fetch session
    const { data: sess } = await supabase.from('sessions').select('title,host_id,group_chat_enabled').eq('id', id).single()
    if (!sess) { setLoading(false); return }
    setSession(sess)
    setIsHost(user.id === sess.host_id)

    // Check if user is accepted member or host
    const hostAccess = user.id === sess.host_id
    if (!hostAccess) {
      const { data: app } = await supabase.from('applications')
        .select('status,created_at,checked_in_at')
        .eq('session_id', id).eq('applicant_id', user.id)
        .eq('status', 'checked_in')
        .maybeSingle()
      if (!app) {
        showToast('Accès réservé aux membres après check-in', 'error')
        navigate('/session/' + id)
        return
      }
      // No-history: use check-in time as cutoff (not candidature date)
      setMyAcceptedAt(app.checked_in_at || new Date().toISOString())
      setCanChat(true)
    } else {
      setCanChat(true)
      // Host joined "since the beginning"
      setMyAcceptedAt(null)
    }

    // Fetch members
    const { data: apps } = await supabase.from('applications')
      .select('applicant_id,status')
      .eq('session_id', id)
      .in('status', ['accepted', 'checked_in'])
    if (apps && apps.length > 0) {
      const ids = apps.map((a: { applicant_id: string }) => a.applicant_id)
      const { data: profiles } = await supabase.from('user_profiles').select('id,display_name,profile_json').in('id', ids)
      const memberList = apps.map((a: { applicant_id: string; status: string }) => {
        const p = (profiles || []).find((pr: { id: string }) => pr.id === a.applicant_id)
        const pj = p?.profile_json || {}
        return {
          applicant_id: a.applicant_id,
          display_name: p?.display_name || 'Anonyme',
          avatar_url: pj.avatar_url,
          role: pj.role,
          status: a.status,
        }
      })
      setMembers(memberList)
    }

    // Fetch messages (no-history: only after user's accept time)
    let acceptedAt: string | null = null
    if (!hostAccess) {
      // Try with checked_in_at first, fall back to created_at if column doesn't exist
      let appForTime: { checked_in_at?: string; created_at?: string } | null = null
      const { data: d1, error: e1 } = await supabase.from('applications')
        .select('created_at,checked_in_at')
        .eq('session_id', id).eq('applicant_id', user.id)
        .eq('status', 'checked_in')
        .maybeSingle()
      if (!e1 && d1) {
        appForTime = d1 as { checked_in_at?: string; created_at?: string }
      } else {
        // Fallback without checked_in_at column
        const { data: d2 } = await supabase.from('applications')
          .select('created_at')
          .eq('session_id', id).eq('applicant_id', user.id)
          .eq('status', 'checked_in')
          .maybeSingle()
        appForTime = d2 as { created_at?: string } | null
      }
      acceptedAt = appForTime?.checked_in_at || appForTime?.created_at || null
      setMyAcceptedAt(acceptedAt)
    }
    await loadMessages(id!, acceptedAt)

    // Realtime subscription
    const channel = supabase
      .channel('group-chat-' + id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `session_id=eq.${id}`,
      }, (payload) => {
        const msg = payload.new as Message & { room_type?: string }
        if (msg.room_type === 'group') {
          setMessages(prev => [...prev, { id: msg.id, text: msg.text, sender_id: msg.sender_id, created_at: msg.created_at, sender_name: msg.sender_name, has_media: msg.has_media, media_urls: msg.media_urls }])
        }
      })
      .subscribe()

    setLoading(false)

    return () => { supabase.removeChannel(channel) }
  }

  async function loadMessages(sessionId: string, acceptedAt: string | null) {
    let query = supabase.from('messages')
      .select('id,text,sender_id,created_at,sender_name,has_media,media_urls')
      .eq('session_id', sessionId)
      .eq('room_type', 'group')
      .order('created_at', { ascending: true })

    // No-history: only show messages after user was accepted
    if (acceptedAt) {
      query = query.gte('created_at', acceptedAt)
    }

    const { data } = await query
    setMessages(data || [])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendPhoto(file: File) {
    if (!currentUser || !id) return
    setUploading(true)
    try {
      const { compressImage } = await import('../lib/media')
      const c = await compressImage(file)
      const path = currentUser.id + '/gchat_' + Date.now() + '.jpg'
      const { error } = await supabase.storage.from('avatars').upload(path, c)
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('messages').insert({
        session_id: id, sender_id: currentUser.id, text: '📷 Photo',
        sender_name: displayName || 'Anonyme', room_type: 'group',
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
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { setUploading(false); return }
        const path = u.id + '/audio_' + Date.now() + '.webm'
        const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'audio/webm' })
        if (error) { setUploading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '🎤 Audio', sender_name: displayName || 'Anonyme', room_type: 'group', has_media: true, media_urls: [publicUrl] })
        setUploading(false)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch { /* mic permission denied */ }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    setRecording(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentUser || !id || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      session_id: id,
      sender_id: currentUser.id,
      text: newMessage.trim(),
      sender_name: displayName || 'Anonyme',
      room_type: 'group',
    })
    if (error) {
      showToast('Erreur: ' + error.message, 'error')
    } else {
      setNewMessage('')
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function toggleGroupChat() {
    if (!session || !id) return
    const newVal = !session.group_chat_enabled
    await supabase.from('sessions').update({ group_chat_enabled: newVal }).eq('id', id)
    setSession({ ...session, group_chat_enabled: newVal })
    showToast(newVal ? 'Group chat activé' : 'Group chat désactivé', 'info')
  }

  if (loading) return <SkeletonChatPage />

  if (!session) {
    return (
      <div style={{ minHeight:'100vh', background:S.bg0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <p style={{ color:S.tx3, fontSize:14 }}>Session introuvable</p>
        <button onClick={() => navigate(-1)} style={{ padding:'10px 20px', borderRadius:12, background:S.grad, color:'#fff', border:'none', fontWeight:600, cursor:'pointer' }}>Retour</button>
      </div>
    )
  }

  if (!session.group_chat_enabled && !isHost) {
    return (
      <div style={{ minHeight:'100vh', background:S.bg0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, padding:24 }}>
        <Shield size={32} style={{ color:S.tx3 }} />
        <p style={{ color:S.tx, fontSize:16, fontWeight:600, textAlign:'center' }}>Group chat pas encore activé</p>
        <p style={{ color:S.tx3, fontSize:13, textAlign:'center' }}>Le host doit activer le group chat pour cette session.</p>
        <button onClick={() => navigate('/session/' + id)} style={{ padding:'10px 20px', borderRadius:12, background:S.grad, color:'#fff', border:'none', fontWeight:600, cursor:'pointer' }}>Retour à la session</button>
      </div>
    )
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', minHeight:'100vh',
      background:S.bg0, maxWidth:480, margin:'0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding:'12px 16px', display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid '+S.border, background:S.bg1,
        paddingTop:'calc(12px + env(safe-area-inset-top, 0px))',
      }}>
        <button onClick={() => navigate('/session/' + id)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
          <ArrowLeft size={20} style={{ color:S.tx2 }} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:S.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {session.title}
          </p>
          <p style={{ margin:0, fontSize:11, color:S.tx3 }}>
            {members.length + (isHost ? 1 : 0)} membres
          </p>
        </div>
        <button onClick={() => setShowMembers(!showMembers)} style={{
          background:'none', border:'1px solid '+S.border, borderRadius:10, padding:'6px 10px',
          cursor:'pointer', display:'flex', alignItems:'center', gap:4,
        }}>
          <Users size={14} style={{ color:S.tx3 }} />
          <span style={{ fontSize:11, color:S.tx3 }}>{members.length + (isHost ? 1 : 0)}</span>
        </button>
        {isHost && (
          <button onClick={toggleGroupChat} style={{
            padding:'6px 10px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer',
            background: session.group_chat_enabled ? S.green+'18' : S.p400+'18',
            color: session.group_chat_enabled ? S.green : S.p400,
            border:'1px solid ' + (session.group_chat_enabled ? S.green+'44' : S.p400+'44'),
          }}>
            {session.group_chat_enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* Members panel */}
      {showMembers && (
        <div style={{ padding:'12px 16px', background:S.bg1, borderBottom:'1px solid '+S.border }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {/* Host */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:S.bg2, borderRadius:99 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:S.p300 }} />
              <span style={{ fontSize:12, color:S.tx2 }}>Host</span>
            </div>
            {members.map(m => (
              <button key={m.applicant_id} onClick={() => navigate('/profile/' + m.applicant_id)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
                background:S.bg2, borderRadius:99, border:'none', cursor:'pointer',
              }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" style={{ width:18, height:18, borderRadius:'28%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:18, height:18, borderRadius:'28%', background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff' }}>
                    {m.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize:12, color:S.tx2 }}>{m.display_name}</span>
                {m.status === 'checked_in' && <div style={{ width:6, height:6, borderRadius:'50%', background:S.green }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not enabled banner for host */}
      {isHost && !session.group_chat_enabled && (
        <div style={{ padding:'10px 16px', background:S.p400+'12', borderBottom:'1px solid '+S.p400+'33' }}>
          <p style={{ margin:0, fontSize:12, color:S.p300 }}>
            Le group chat est désactivé. Clique "ON" pour l'activer pour les membres.
          </p>
        </div>
      )}

      {/* No-history notice */}
      {myAcceptedAt && messages.length === 0 && (
        <div style={{ padding:16, textAlign:'center' }}>
          <p style={{ color:S.tx3, fontSize:13 }}>Pas de messages depuis ton arrivée.</p>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:2 }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser?.id
          const isSystem = msg.sender_name?.startsWith('🛡️') || msg.sender_name === 'Fluidz'
          const showName = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)

          if (isSystem) {
            return (
              <div key={msg.id} style={{ padding:'8px 12px', margin:'8px 0', background:S.bg2, borderRadius:12, textAlign:'center' }}>
                <p style={{ margin:0, fontSize:12, color:S.tx3, lineHeight:1.4 }}>{msg.text}</p>
              </div>
            )
          }

          return (
            <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: showName ? 8 : 0 }}>
              {showName && (
                <button type="button" onClick={() => navigate('/profile/' + msg.sender_id)} style={{ margin:'0 0 2px 8px', fontSize:11, color:S.p300, fontWeight:600, background:'none', border:'none', padding:0, cursor:'pointer', textDecoration:'underline', textDecorationColor:S.p300+'44' }}>{msg.sender_name}</button>
              )}
              <div style={{
                maxWidth:'80%', padding: msg.has_media ? 4 : '8px 12px', borderRadius:16,
                background: isMe ? S.p300+'22' : S.bg2,
                borderBottomRightRadius: isMe ? 4 : 16,
                borderBottomLeftRadius: isMe ? 16 : 4,
                overflow:'hidden',
              }}>
                {msg.has_media && msg.media_urls?.map((url: string, mi: number) => {
                  const isAudio = url.endsWith('.webm') || url.includes('audio')
                  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(url) || url.includes('video')
                  if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 220, height: 36 }} />
                  if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 240, borderRadius: 10, display: 'block' }} />
                  return <img key={mi} src={url} alt="" style={{ width:'100%', maxWidth:240, borderRadius:12, display:'block' }} />
                })}
                {msg.text !== '📷 Photo' && msg.text !== '🎤 Audio' && msg.text !== '🎬 Vidéo' && <p style={{ margin:0, fontSize:14, color:S.tx, lineHeight:1.4, padding: msg.has_media ? '4px 8px 6px' : 0 }}>{msg.text}</p>}
                <p style={{ margin:'2px 0 0', fontSize:10, color:S.tx4, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canChat && (session.group_chat_enabled || isHost) && (
        <div style={{
          padding:'10px 16px', borderTop:'1px solid '+S.border, background:S.bg1,
          paddingBottom:'calc(10px + env(safe-area-inset-bottom, 0px))',
          display:'flex', gap:8, alignItems:'center',
        }}>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:'50%', background:S.bg2, border:'1px solid '+S.border, cursor: uploading?'not-allowed':'pointer', flexShrink:0, opacity: uploading?0.5:1 }}>
            <Camera size={16} style={{ color:S.tx3 }} />
            <input type="file" accept="image/*,video/*" onChange={e => { const f=e.target.files?.[0]; if(f) sendPhoto(f); e.target.value='' }} style={{ display:'none' }} disabled={uploading} />
          </label>
          <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ width:38, height:38, borderRadius:10, border:'none', background: recording ? '#F87171' : S.bg2, color: recording ? '#fff' : S.tx3, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', animation: recording ? 'pulse 1s infinite' : 'none' }}>
            {recording ? '⏹' : '🎤'}
          </button>
          <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
          <input
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Message au groupe..."
            style={{
              flex:1, padding:'10px 14px', borderRadius:99, border:'1px solid '+S.border,
              background:S.bg2, color:S.tx, fontSize:14, outline:'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={{
              width:40, height:40, borderRadius:'50%', background:S.grad, border:'none',
              cursor: newMessage.trim() ? 'pointer' : 'default',
              opacity: newMessage.trim() ? 1 : 0.4,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}
          >
            <Send size={18} style={{ color:'#fff', marginLeft:2 }} />
          </button>
        </div>
      )}
    </div>
  )
}
