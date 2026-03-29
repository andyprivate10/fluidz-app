import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { ArrowLeft, Send, Camera, Smile, X, Plus, MapPin, FileText, Repeat } from 'lucide-react'
import { compressImage } from '../lib/media'
import { colors, fonts } from '../brand'
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
import AddressShareSheet, { encodeAddressMessage, isAddressMessage, parseAddressMessage } from '../components/AddressShareSheet'
import TemplateShareSheet from '../components/TemplateShareSheet'
import DmRequestSheet from '../components/DmRequestSheet'
import type { DmPrivacyLevel } from '../lib/dmPrivacy'

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
  const { user: authUser } = useAuth()
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
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [showTemplateSheet, setShowTemplateSheet] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [dmBlocked, setDmBlocked] = useState<{ level: DmPrivacyLevel; status: 'need_request' | 'pending' | 'declined' } | null>(null)
  const [showDmRequest, setShowDmRequest] = useState(false)
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
    if (!authUser) { navigate('/login'); return }
    const user = authUser
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

    // Check DM privacy — bypass if already in contacts
    const pj = (peer?.profile_json || {}) as Record<string, unknown>
    const peerPrivacy = (pj.dm_privacy as DmPrivacyLevel) || 'open'
    if (peerPrivacy !== 'open') {
      const { data: isContact } = await supabase.from('contacts').select('id').eq('user_id', user.id).eq('contact_user_id', peerId).maybeSingle()
      if (!isContact) {
        const { data: req } = await supabase.from('dm_requests').select('status').eq('sender_id', user.id).eq('receiver_id', peerId).maybeSingle()
        if (!req) { setDmBlocked({ level: peerPrivacy, status: 'need_request' }); setLoading(false); return }
        if (req.status === 'pending') { setDmBlocked({ level: peerPrivacy, status: 'pending' }); setLoading(false); return }
        if (req.status === 'declined') { setDmBlocked({ level: peerPrivacy, status: 'declined' }); setLoading(false); return }
      }
    }

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

  // DM privacy gate
  if (dmBlocked) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 8px', fontFamily: fonts.hero, textAlign: 'center' }}>
        {dmBlocked.status === 'pending' ? t('dm_request.waiting') : dmBlocked.status === 'declined' ? t('dm_request.declined_info') : t('dm_privacy.' + dmBlocked.level)}
      </h2>
      <p style={{ fontSize: 13, color: S.tx3, textAlign: 'center', margin: '0 0 20px' }}>
        {dmBlocked.level === 'profile_required' ? t('dm_request.profile_required_desc') : t('dm_request.full_access_desc')}
      </p>
      {dmBlocked.status === 'need_request' && (
        <button onClick={() => setShowDmRequest(true)} style={{ padding: '14px 28px', borderRadius: 14, background: S.p, border: 'none', color: S.tx, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {t('dm_request.send')}
        </button>
      )}
      <button onClick={() => navigate(-1)} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 12, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        {t('common.back_label')}
      </button>
      {peerId && peerProfile && (
        <DmRequestSheet
          open={showDmRequest}
          onClose={() => setShowDmRequest(false)}
          targetUserId={peerId}
          targetName={peerProfile.name}
          targetAvatar={peerProfile.avatar}
          privacyLevel={dmBlocked.level}
          onSent={() => setDmBlocked({ ...dmBlocked, status: 'pending' })}
        />
      )}
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
          <img src={peerProfile.avatar} alt="" onClick={() => navigate('/profile/' + peerId)} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', cursor: 'pointer', border: '1px solid ' + S.rule }} />
        ) : (
          <div onClick={() => navigate('/profile/' + peerId)} style={{ width: 36, height: 36, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.tx, cursor: 'pointer' }}>
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
              <button onClick={() => { setShowActions(false); setShowAddressSheet(true) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid '+S.rule, color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {t('dm.share_address')}
              </button>
              <button onClick={() => { setShowActions(false); setShowTemplateSheet(true) }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: S.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                {t('dm.share_template')}
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
                msg.text.startsWith('[INTENT_MATCH]') ? (() => {
                  try {
                    const data = JSON.parse(msg.text.slice(14))
                    return (
                      <div style={{ padding: '8px 10px', background: 'rgba(74,222,128,0.08)', borderRadius: 10, border: '1px solid ' + S.sagebd }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: S.sage, marginBottom: 4 }}>{t('intents.match_title')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(data.intents || []).map((slug: string) => (
                            <span key={slug} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}>{t('intents.' + slug)}</span>
                          ))}
                        </div>
                      </div>
                    )
                  } catch { return <span style={{ color: S.tx }}>{msg.text}</span> }
                })() :
                isAddressMessage(msg.text) ? (() => {
                  const addr = parseAddressMessage(msg.text)
                  if (!addr) return <span style={{ color: S.tx }}>{msg.text}</span>
                  return (
                    <div style={{ padding: '8px 10px', background: S.sagebg, borderRadius: 10, border: '1px solid '+S.sagebd }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <MapPin size={14} style={{ color: S.sage }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: S.tx }}>{addr.label || t('address.shared_label')}</span>
                      </div>
                      {addr.exact_address && <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 6px' }}>{addr.exact_address}</p>}
                      <a href={'https://maps.google.com/?q=' + encodeURIComponent(addr.exact_address || addr.approx_area)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: S.sage, textDecoration: 'none' }}>
                        {t('address.open_maps')}
                      </a>
                    </div>
                  )
                })() :
                msg.text.startsWith('[TPL_SHARE]') ? (() => {
                  try {
                    const tpl = JSON.parse(msg.text.slice(11))
                    return (
                      <div style={{ padding: '10px 12px', background: S.lavbg, borderRadius: 10, border: '1px solid '+S.lavbd }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <FileText size={14} style={{ color: S.lav }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: S.tx }}>{tpl.title}</span>
                        </div>
                        {tpl.tags?.length > 0 && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>{tpl.tags.map((tag: string) => <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: S.bg2, color: S.tx2, border: '1px solid '+S.rule }}>{tag}</span>)}</div>}
                        <a href={'/session/create?template='+tpl.id+'&invite='+(peerId || '')} style={{ fontSize: 11, fontWeight: 700, color: S.lav, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Repeat size={11} /> {t('dm.use_template')}
                        </a>
                      </div>
                    )
                  } catch { return <span style={{ color: S.tx }}>{msg.text}</span> }
                })() :
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
        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: recording ? S.red : S.bg2, color: recording ? S.tx : S.tx3, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: recording ? 'pulse 1s infinite' : 'none' }}>
          {recording ? '■' : '●'}
        </button>
        <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
        <button type="button" onClick={() => setShowEmojiBar(!showEmojiBar)} style={{ width: 40, height: 40, borderRadius: 12, background: showEmojiBar ? S.p3 : S.bg2, border: '1px solid ' + (showEmojiBar ? S.pbd : S.rule), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Smile size={16} style={{ color: showEmojiBar ? S.p : S.tx3 }} />
        </button>
        <input
          type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); sendTyping() }}
          onKeyDown={e => { if (e.key === 'Enter') { stopTyping(); handleSend() } }}
          placeholder={t('placeholders.message_dots')} style={{ flex: 1, padding: 12, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none', fontFamily: fonts.body }}
        />
        <button onClick={handleSend} disabled={!newMessage.trim() || sending} style={{ width: 40, height: 40, borderRadius: 12, background: newMessage.trim() ? S.grad : S.bg2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={16} style={{ color: newMessage.trim() ? S.tx : S.tx4 }} />
        </button>
      </div>
      {chatLightbox && <ImageLightbox images={[chatLightbox]} onClose={() => setChatLightbox(null)} />}
      {menuMsg && <ChatMessageMenu message={menuMsg} isOwn={menuMsg.sender_id === currentUser?.id} onCopy={() => showToast(t('chat.copied'), 'success')} onReply={() => setReplyTo({ id: menuMsg.id, text: menuMsg.text, sender_name: menuMsg.sender_name })} onDelete={menuMsg.sender_id === currentUser?.id ? () => { supabase.from('messages').delete().eq('id', menuMsg.id); setMessages(prev => prev.filter(m => m.id !== menuMsg.id)) } : undefined} onClose={() => setMenuMsg(null)} labels={{ copy: t('chat.copy_text'), reply: t('chat.reply'), delete: t('chat.delete_msg') }} />}
      {currentUser && (
        <AddressShareSheet
          open={showAddressSheet}
          onClose={() => setShowAddressSheet(false)}
          userId={currentUser.id}
          onSelect={async (addr) => {
            if (!sessionId || !currentUser) return
            await supabase.from('messages').insert({
              session_id: sessionId, sender_id: currentUser.id,
              text: encodeAddressMessage(addr),
              sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
            })
          }}
        />
      )}
      {currentUser && (
        <TemplateShareSheet
          open={showTemplateSheet}
          onClose={() => setShowTemplateSheet(false)}
          userId={currentUser.id}
          onSelect={async (s) => {
            if (!sessionId || !currentUser) return
            const encoded = '[TPL_SHARE]' + JSON.stringify({ id: s.id, title: s.title, tags: s.tags })
            await supabase.from('messages').insert({
              session_id: sessionId, sender_id: currentUser.id,
              text: encoded, sender_name: displayName, room_type: 'dm', dm_peer_id: peerId,
            })
          }}
        />
      )}
    </div>
  )
}
