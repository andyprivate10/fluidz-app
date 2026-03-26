import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendPushToUser } from '../lib/pushSender'
import { useTypingIndicator } from './useTypingIndicator'
import { useTranslation } from 'react-i18next'
import { notifyUser } from '../lib/feedback'
import { encodeAddressMessage } from '../components/AddressShareSheet'
import type { User } from '@supabase/supabase-js'

export type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
  has_media?: boolean
  media_urls?: string[]
}

export function useDMData() {
  const { t } = useTranslation()
  const { id, peerId: peerIdParam } = useParams<{ id: string; peerId?: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatLightbox, setChatLightbox] = useState<string | null>(null)
  const [showEmojiBar, setShowEmojiBar] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ title: string; exact_address: string | null; host_id: string; lineup_json?: { directions?: string[] }; status?: string } | null>(null)
  const [appStatus, setAppStatus] = useState<string | null>(null)
  const [peerId, setPeerId] = useState<string | null>(peerIdParam || null)
  const [peerName, setPeerName] = useState<string>('')
  const [peerAvatar, setPeerAvatar] = useState<string>('')
  const [peerRole, setPeerRole] = useState<string>('')
  const [showCheckInConfirmed, setShowCheckInConfirmed] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; sender_name: string } | null>(null)
  const [menuMsg, setMenuMsg] = useState<Message | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [showAddressSheet, setShowAddressSheet] = useState(false)
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
          .select('title,exact_address,host_id,lineup_json,status')
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
              navigate('/session/' + id + '?tab=chat')
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
        const effectivePeerId = peerIdParam || (sess?.host_id !== user?.id ? sess?.host_id : null)
        let query = supabase
          .from('messages')
          .select('*')
          .eq('session_id', id)
          .eq('room_type', 'dm')
          .order('created_at')

        if (effectivePeerId && user) {
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
        if (effectivePeer && currentUser) {
          const isMyMsg = msg.sender_id === currentUser.id && msg.dm_peer_id === effectivePeer
          const isPeerMsg = msg.sender_id === effectivePeer && msg.dm_peer_id === currentUser.id
          const isLegacy = !msg.dm_peer_id && (msg.sender_id === currentUser.id || msg.sender_id === effectivePeer)
          if (!isMyMsg && !isPeerMsg && !isLegacy) return
        }
        setMessages((prev) => [...prev, { id: msg.id, text: msg.text, sender_id: msg.sender_id, created_at: msg.created_at, sender_name: msg.sender_name, has_media: msg.has_media, media_urls: msg.media_urls }])
        if (msg.sender_id !== currentUser?.id) notifyUser('message')
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
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '\u{1F3A4} Audio', sender_name: name, room_type: 'dm', dm_peer_id: peerIdParam || session?.host_id, has_media: true, media_urls: [publicUrl] })
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
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '\u{1F4CD} Partage de position termin\u00e9', sender_name: name, room_type: 'dm', dm_peer_id: peerIdParam || session?.host_id })
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
        text: `\u{1F4CD} Ma position\n${mapUrl}`,
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
          text: `\u{1F4CD} Position mise \u00e0 jour\n${mapUrl}`,
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
      let label = isVideo ? '\u{1F3AC} Vid\u00e9o' : '\u{1F4F7} Photo'

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
    const fullText = replyTo ? '> ' + replyTo.text.slice(0, 80) + '\n\n' + text : text
    setNewMessage('')
    setReplyTo(null)
    await supabase.from('messages').insert({
      session_id: id,
      sender_id: currentUser.id,
      text: fullText,
      sender_name: displayName || currentUser.email || '',
      room_type: 'dm',
      dm_peer_id: peerId || undefined,
    })
    // Notify the peer about new DM
    if (peerId && session) {
      const senderLabel = displayName || t('common.someone')
      await supabase.from('notifications').insert({
        user_id: peerId,
        session_id: id,
        type: 'new_dm',
        title: `\u{1F4AC} ${senderLabel}`,
        body: text.length > 60 ? text.slice(0, 60) + '\u2026' : text,
        href: `/session/${id}/dm/${currentUser.id}`,
      })
      sendPushToUser(peerId, senderLabel, text.length > 60 ? text.slice(0, 60) + '\u2026' : text, `/session/${id}/dm/${currentUser.id}`)
    }
  }

  async function handleAddressShare(addr: { label?: string; exact_address?: string; approx_area?: string }) {
    if (!id || !currentUser) return
    await supabase.from('messages').insert({
      session_id: id, sender_id: currentUser.id,
      text: encodeAddressMessage(addr),
      sender_name: displayName || currentUser.email || '',
      room_type: 'dm', dm_peer_id: peerId || undefined,
    })
  }

  function handleDeleteMessage(msgId: string) {
    supabase.from('messages').delete().eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  return {
    t,
    id,
    navigate,
    messages,
    setMessages,
    chatLightbox,
    setChatLightbox,
    showEmojiBar,
    setShowEmojiBar,
    newMessage,
    setNewMessage,
    loading,
    loadError,
    currentUser,
    session,
    appStatus,
    peerId,
    peerName,
    peerAvatar,
    peerRole,
    showCheckInConfirmed,
    replyTo,
    setReplyTo,
    menuMsg,
    setMenuMsg,
    showActions,
    setShowActions,
    showAddressSheet,
    setShowAddressSheet,
    messagesEndRef,
    uploading,
    recording,
    sharingLocation,
    isHost,
    isAccepted,
    showCheckInBanner,
    typingUsers,
    sendTyping,
    stopTyping,
    startRecording,
    stopRecording,
    shareLocation,
    handleCheckIn,
    handleSendPhoto,
    handleSend,
    handleAddressShare,
    handleDeleteMessage,
    displayName,
  }
}
