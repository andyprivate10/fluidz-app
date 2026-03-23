import { useState, useEffect, useRef } from 'react'
import { SkeletonChatPage, SkeletonLine } from '../components/Skeleton'
import { showToast } from '../components/Toast'
import { Camera, ArrowLeft, Copy, Map, MapPin } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendPushToUser } from '../lib/pushSender'
import type { User } from '@supabase/supabase-js'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { formatMessageTime } from '../lib/timing'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { useTranslation } from 'react-i18next'

type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
  has_media?: boolean
  media_urls?: string[]
}

const S = colors

export default function DMPage() {
  const { t } = useTranslation()
  const { id, peerId: peerIdParam } = useParams<{ id: string; peerId?: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ title: string; exact_address: string | null; host_id: string; lineup_json?: { directions?: string[] } } | null>(null)
  const [appStatus, setAppStatus] = useState<string | null>(null)
  const [peerId, setPeerId] = useState<string | null>(peerIdParam || null)
  const [peerName, setPeerName] = useState<string>('')
  const [peerAvatar, setPeerAvatar] = useState<string>('')
  const [peerRole, setPeerRole] = useState<string>('')
  const [showCheckInConfirmed, setShowCheckInConfirmed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [displayName, setDisplayName] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [sharingLocation, setSharingLocation] = useState(false)
  const locationWatchRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const isHost = currentUser?.id === session?.host_id
  const isAccepted = appStatus === 'accepted' || appStatus === 'checked_in'
  const showCheckInBanner = !isHost && appStatus === 'accepted'

  const { typingUsers, sendTyping, stopTyping } = useTypingIndicator(
    id && peerId ? `typing:dm:${id}:${[currentUser?.id, peerId].sort().join(':')}` : '',
    currentUser?.id,
    displayName || t('common.anonymous'),
  )

  useEffect(() => {
    if (!id) { setLoading(false); return }

    const init = async () => {
      setLoadError(false)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user ?? null)

        // Fetch display name for messages
        if (user) {
          const { data: prof } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle()
          if (prof?.display_name) setDisplayName(prof.display_name)
        }

        const { data: sess, error: sessErr } = await supabase
          .from('sessions')
          .select('title,exact_address,host_id,lineup_json')
          .eq('id', id)
          .single()
        if (sessErr) throw sessErr
        setSession(sess)

        if (user) {
          const { data: app } = await supabase
            .from('applications')
            .select('status')
            .eq('session_id', id)
            .eq('applicant_id', user.id)
            .maybeSingle()
          if (app) setAppStatus(app.status)
        }

        if (sess) {
          let pid: string | null = peerIdParam || null
          if (user?.id === sess.host_id) {
            // Host: peerId must come from URL params
            if (!pid) {
              // Redirect to host dashboard if no peer specified
              navigate('/session/' + id + '/host')
              return
            }
          } else {
            // Candidate: peer is always the host
            pid = sess.host_id
          }
          setPeerId(pid)
          // Fetch peer display name
          if (pid) {
            const { data: peerProf } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', pid).maybeSingle()
            if (peerProf?.display_name) setPeerName(peerProf.display_name)
            if ((peerProf as any)?.profile_json?.avatar_url) setPeerAvatar((peerProf as any).profile_json.avatar_url)
            if ((peerProf as any)?.profile_json?.role) setPeerRole((peerProf as any).profile_json.role)
          }
        }

        // Fetch DM messages for this peer pair
        // Filter: messages between current user and peer (backward compat: include messages without dm_peer_id)
        const effectivePeerId = peerIdParam || (sess?.host_id !== user?.id ? sess?.host_id : null)
        let query = supabase
          .from('messages')
          .select('*')
          .eq('session_id', id)
          .eq('room_type', 'dm')
          .order('created_at')
        
        if (effectivePeerId && user) {
          // Only show messages in this specific DM thread
          query = query.or(`and(sender_id.eq.${user.id},dm_peer_id.eq.${effectivePeerId}),and(sender_id.eq.${effectivePeerId},dm_peer_id.eq.${user.id}),and(sender_id.eq.${user.id},dm_peer_id.is.null),and(sender_id.eq.${effectivePeerId},dm_peer_id.is.null)`)
        }

        const { data: msgs } = await query
        setMessages((msgs as Message[]) ?? [])
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
      // Mark DM notifications as read for this session
      if (currentUser) {
        const hrefPattern = '/session/' + id + '/dm'
        await supabase.from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', currentUser.id)
          .like('href', hrefPattern + '%')
          .is('read_at', null)
      }
    }
    init()

    const effectivePeer = peerIdParam || null
    const channel = supabase
      .channel('dm:' + id + ':' + (effectivePeer || 'all'))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'session_id=eq.' + id,
      }, (payload) => {
        const msg = payload.new as Message & { room_type?: string; dm_peer_id?: string }
        if (msg.room_type !== 'dm') return
        // Only show messages in this DM thread
        if (effectivePeer && currentUser) {
          const isMyMsg = msg.sender_id === currentUser.id && msg.dm_peer_id === effectivePeer
          const isPeerMsg = msg.sender_id === effectivePeer && msg.dm_peer_id === currentUser.id
          const isLegacy = !msg.dm_peer_id && (msg.sender_id === currentUser.id || msg.sender_id === effectivePeer)
          if (!isMyMsg && !isPeerMsg && !isLegacy) return
        }
        setMessages((prev) => [...prev, { id: msg.id, text: msg.text, sender_id: msg.sender_id, created_at: msg.created_at, sender_name: msg.sender_name, has_media: msg.has_media, media_urls: msg.media_urls }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, peerIdParam])

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
        const path = `${u.id}/audio_${Date.now()}.webm`
        const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'audio/webm' })
        if (error) { setUploading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        const name = displayName || u.email || 'Moi'
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '🎤 Audio', sender_name: name, room_type: 'dm', dm_peer_id: peerIdParam || session?.host_id, has_media: true, media_urls: [publicUrl] })
        setUploading(false)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch { /* mic permission denied */ }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  async function shareLocation() {
    if (sharingLocation) {
      if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current)
      locationWatchRef.current = null
      setSharingLocation(false)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        const name = displayName || u.email || 'Moi'
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '📍 Partage de position terminé', sender_name: name, room_type: 'dm', dm_peer_id: peerIdParam || session?.host_id })
      }
      return
    }
    if (!navigator.geolocation) return
    setSharingLocation(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setSharingLocation(false); return }
    const name = displayName || u.email || 'Moi'
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
      await supabase.from('messages').insert({
        session_id: id, sender_id: u.id,
        text: `📍 Ma position\n${mapUrl}`,
        sender_name: name, room_type: 'dm',
        dm_peer_id: peerIdParam || session?.host_id,
      })
    }, () => { setSharingLocation(false) })
    locationWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
        await supabase.from('messages').insert({
          session_id: id, sender_id: u.id,
          text: `📍 Position mise à jour\n${mapUrl}`,
          sender_name: name, room_type: 'dm',
          dm_peer_id: peerIdParam || session?.host_id,
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    )
  }

  useEffect(() => {
    return () => { if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current) }
  }, [])

  // Auto-scroll to bottom when a new message is sent or received
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleCheckIn() {
    if (!id || !currentUser) return
    // Request check-in (flag only), host must confirm to change status
    await supabase
      .from('applications')
      .update({ checked_in: true })
      .eq('session_id', id)
      .eq('applicant_id', currentUser.id)
    setShowCheckInConfirmed(true)
    setTimeout(() => setShowCheckInConfirmed(false), 3000)
  }

  async function handleSendPhoto(file: File) {
    if (!id || !currentUser) return
    setUploading(true)
    try {
      const isVideo = file.type.startsWith('video/')
      let uploadFile: Blob = file
      let ext = isVideo ? (file.name.split('.').pop() || 'mp4') : 'jpg'
      let label = isVideo ? '🎬 Vidéo' : '📷 Photo'

      if (!isVideo) {
        const { compressImage } = await import('../lib/media')
        uploadFile = await compressImage(file)
      }

      const path = currentUser.id + '/chat_' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('avatars').upload(path, uploadFile, {
        contentType: isVideo ? file.type : 'image/jpeg',
      })
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('messages').insert({
        session_id: id, sender_id: currentUser.id, text: label,
        sender_name: displayName || currentUser.email || '',
        room_type: 'dm', dm_peer_id: peerId || undefined,
        has_media: true, media_urls: [publicUrl],
      })
    } catch { /* ignore */ }
    setUploading(false)
  }

  async function handleSend() {
    if (!newMessage.trim() || !id || !currentUser) return
    const text = newMessage.trim()
    setNewMessage('')
    await supabase.from('messages').insert({
      session_id: id,
      sender_id: currentUser.id,
      text,
      sender_name: displayName || currentUser.email || '',
      room_type: 'dm',
      dm_peer_id: peerId || undefined,
    })
    // Notify the peer about new DM (debounced: only if no recent notif)
    if (peerId && session) {
      const senderLabel = displayName || 'Quelqu\'un'
      await supabase.from('notifications').insert({
        user_id: peerId,
        session_id: id,
        type: 'new_dm',
        title: `💬 ${senderLabel}`,
        body: text.length > 60 ? text.slice(0, 60) + '…' : text,
        href: `/session/${id}/dm/${currentUser.id}`,
      })
      sendPushToUser(peerId, senderLabel, text.length > 60 ? text.slice(0, 60) + '…' : text, `/session/${id}/dm/${currentUser.id}`)
    }
  }

  if (loading) return <SkeletonChatPage />

  return (
    <div style={{
      background: S.bg, height: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column',
      padding: 0, maxWidth: 480, margin: '0 auto',
    }}>
      <OrbLayer />
      <EventContextNav role={isHost ? 'host' : isAccepted ? 'member' : 'candidate'} sessionTitle={session?.title} />
      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid '+S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/session/'+id)} style={{ background:'none', border:'none', color: S.tx3, fontSize: 16, cursor:'pointer', padding: 0 }}><ArrowLeft size={18} strokeWidth={1.5} /></button>
          {peerAvatar ? (
            <img src={peerAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid '+S.rule, flexShrink: 0 }} />
          ) : peerName ? (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{peerName[0].toUpperCase()}</div>
          ) : null}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: 0 }}>
              {peerName || (session?.title ?? 'DM')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {peerRole && <span style={{ fontSize: 11, color: S.p, fontWeight: 600 }}>{peerRole}</span>}
              {peerRole && <span style={{ fontSize: 11, color: S.tx4 }}>·</span>}
              <span style={{ fontSize: 11, color: S.tx3 }}>{session?.title ?? ''}</span>
            </div>
          </div>
        </div>
        {peerId && (
          <button onClick={() => navigate(isHost ? '/session/' + id + '/candidate/' + peerId : '/profile/' + peerId)} style={{ padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: S.tx2, border: '1px solid '+S.rule, background: 'transparent', cursor: 'pointer' }}>
            {t('profile.see_profile')}
          </button>
        )}
      </header>

      {/* Status banner */}
      {!isHost && appStatus === 'pending' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.orangebg, border: '1px solid '+S.orangebd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.orange, fontWeight: 600, textAlign: 'center' }}>
            Candidature en attente...
          </div>
        </div>
      )}

      {showCheckInBanner && !showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.sagebg, border: '1px solid '+S.sage, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.sage, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>
            Tu as été accepté(e) ! Clique quand tu arrives.
          </div>
          <button onClick={handleCheckIn} style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'white', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer' }}>
            Je suis là
          </button>
        </div>
      )}

      {showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.p2, border: '1px solid '+S.amberbd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.p, fontWeight: 600, textAlign: 'center' }}>{t('session.checkin_sent_waiting')}</div>
        </div>
      )}

      {!isHost && appStatus === 'rejected' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.redbg, border: '1px solid '+S.redbd, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.red, fontWeight: 600, textAlign: 'center' }}>
            Candidature refusee
          </div>
        </div>
      )}

      {/* Address revealed */}
      {isAccepted && session?.exact_address && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.sagebg, border: '1px solid '+S.sage, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: S.sage, marginBottom: 4 }}>
            Adresse revelee
          </div>
          <div style={{ fontSize: 14, color: S.tx, fontWeight: 600 }}>
            {session.exact_address}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(session.exact_address || ''); showToast('Adresse copiée', 'success') }} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: S.sage, border: '1px solid ' + S.sagebd, background: 'transparent', cursor: 'pointer' }}>
              <Copy size={11} strokeWidth={1.5} style={{marginRight:2}} />{t('common.copy_label')}
            </button>
            <button onClick={() => { window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(session.exact_address || ''), '_blank') }} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: S.blue, border: '1px solid '+S.bluebd, background: 'transparent', cursor: 'pointer' }}>
              <Map size={11} strokeWidth={1.5} style={{marginRight:2}} /> Maps
            </button>
          </div>
          {session.lineup_json?.directions && session.lineup_json.directions.length > 0 && (
            <div style={{ padding: '8px 16px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx2, margin: '0 0 4px' }}>ACCÈS</p>
              {session.lineup_json.directions.map((step: any, i: number) => {
                const text = typeof step === 'string' ? step : step.text
                const photo = typeof step === 'string' ? undefined : step.photo_url
                return (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 12, color: S.tx2, margin: 0, lineHeight: 1.4 }}>{i + 1}. {text}</p>
                    {photo && <img src={photo} alt="" loading="lazy" style={{ width: '100%', maxWidth: 180, height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 4, border: '1px solid '+S.rule }} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 24px', width: '100%', paddingTop: 20 }}>
            <div style={{ alignSelf: 'flex-start' }}><SkeletonLine width={200} height={44} style={{ borderRadius: 16 }} /></div>
            <div style={{ alignSelf: 'flex-end' }}><SkeletonLine width={160} height={36} style={{ borderRadius: 16 }} /></div>
            <div style={{ alignSelf: 'flex-start' }}><SkeletonLine width={240} height={44} style={{ borderRadius: 16 }} /></div>
          </div>
        ) : loadError ? (
          <p style={{ color: S.red, margin: 0, padding: '0 24px', textAlign: 'center', paddingTop: 80 }}>{t('chat.load_error')}</p>
        ) : messages.length === 0 ? (
          <p style={{ color: S.tx3, margin: 0, padding: '0 24px', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            {t('chat.send_first')}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUser?.id
            return (
              <div key={message.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
                padding: '0 24px',
              }}>
                {!isMine && (
                  <span style={{ color: S.tx3, fontSize: 11, marginBottom: 2 }}>
                    {message.sender_name}
                  </span>
                )}
                <div style={{
                  padding: message.has_media ? 4 : '10px 14px', fontSize: 14, maxWidth: '78%', lineHeight: 1.45,
                  background: isMine ? 'linear-gradient(135deg, '+S.p+', '+S.pDark+')' : S.bg2,
                  color: isMine ? 'white' : S.tx,
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  border: isMine ? 'none' : '1px solid ' + S.rule,
                  boxShadow: isMine ? '0 2px 8px rgba(224,136,122,0.2)' : 'none',
                  overflow: 'hidden',
                }}
                onContextMenu={(e) => {
                  if (message.sender_id !== currentUser?.id) return
                  e.preventDefault()
                  if (window.confirm(t('chat.delete_msg'))) {
                    supabase.from('messages').delete().eq('id', message.id).then(() => {
                      setMessages(prev => prev.filter(m => m.id !== message.id))
                    })
                  }
                }}
                >
                  {message.has_media && message.media_urls?.map((url: string, mi: number) => {
                    const isAudio = url.endsWith('.webm') || url.includes('audio')
                    const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(url) || url.includes('video')
                    if (isAudio) return <audio key={mi} controls src={url} style={{ width: '100%', maxWidth: 240, height: 36 }} />
                    if (isVideo) return <video key={mi} controls playsInline src={url} style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block' }} />
                    return <img key={mi} src={url} alt="" loading="lazy" style={{ width: '100%', maxWidth: 240, borderRadius: 12, display: 'block' }} />
                  })}
                  {message.text && message.text !== '📷 Photo' && message.text !== '🎤 Audio' && message.text !== '🎬 Vidéo' && (
                    message.text.includes('google.com/maps') ? (
                      <a href={message.text.split('\n').find((l: string) => l.includes('google.com/maps')) || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '6px 10px', background: S.sagebg, borderRadius: 8, color: S.sage, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        {message.text.split('\n')[0]} 
                      </a>
                    ) : <span>{message.text}</span>
                  )}
                </div>
                <span style={{ color: S.tx3, fontSize: 10, marginTop: 2 }}>
                  {formatMessageTime(message.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 24px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: S.tx3, fontStyle: 'italic' }}>
            {t('chat.typing', { users: typingUsers.join(', ') })}
          </span>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        background: 'rgba(5,4,10,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: 14, borderTop: '1px solid '+S.rule,
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: S.bg2, border: '1px solid '+S.rule, cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
          <Camera size={18} style={{ color: S.tx3 }} />
          <input type="file" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleSendPhoto(f); e.target.value = '' }} style={{ display: 'none' }} disabled={uploading} />
        </label>
        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploading} style={{ padding: '10px 12px', borderRadius: 12, border: 'none', background: recording ? S.red : S.bg2, color: recording ? '#fff' : S.tx3, cursor: 'pointer', fontSize: 16, animation: recording ? 'pulse 1s infinite' : 'none' }}>
          {recording ? '■' : '●'}
        </button>
        <button type="button" onClick={shareLocation} style={{ padding: '10px', borderRadius: 12, background: sharingLocation ? S.sagebg : S.bg2, color: sharingLocation ? S.sage : S.tx3, cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, border: sharingLocation ? '1px solid '+S.sagebd : '1px solid ' + S.rule }}>
          {sharingLocation ? <MapPin size={16} strokeWidth={1.5} /> : <MapPin size={16} strokeWidth={1.5} />}
        </button>
        <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); sendTyping() }}
          onKeyDown={(e) => { if (e.key === 'Enter') { stopTyping(); handleSend() } }}
          placeholder={uploading ? t('chat.sending_photo') : t('chat.send')}
          style={{
            flex: 1, padding: 12, background: S.bg2, border: '1px solid '+S.rule,
            borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          style={{
            padding: '12px 16px', background: S.grad, color: 'white',
            border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
            fontSize: 16,
          }}
        >
          &rarr;
        </button>
      </div>
    </div>
  )
}
