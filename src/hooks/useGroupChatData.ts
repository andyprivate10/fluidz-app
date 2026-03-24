import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { notifyUser } from '../lib/feedback'

export type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
  has_media?: boolean
  media_urls?: string[]
}

export type Member = {
  applicant_id: string
  display_name: string
  avatar_url?: string
  role?: string
  status: string
}

export function useGroupChatData() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiBar, setShowEmojiBar] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; sender_name: string } | null>(null)
  const [menuMsg, setMenuMsg] = useState<Message | null>(null)
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
        .select('status,created_at,checked_in_at,checked_in')
        .eq('session_id', id).eq('applicant_id', user.id)
        .maybeSingle()
      if (!app || (app.status !== 'checked_in' && !(app.status === 'accepted' && app.checked_in))) {
        showToast(t('chat.checkin_required'), 'error')
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
          display_name: p?.display_name || t('common.anonymous'),
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
      // Get the user's application for time-based filtering
      const { data: appForTime } = await supabase.from('applications')
        .select('created_at,checked_in_at,status,checked_in')
        .eq('session_id', id).eq('applicant_id', user.id)
        .in('status', ['checked_in', 'accepted'])
        .maybeSingle()
      if (appForTime) {
        acceptedAt = appForTime.checked_in_at || appForTime.created_at || null
      }
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
          if (msg.sender_id !== currentUser?.id) notifyUser('message')
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
      const isVideo = file.type.startsWith('video/')
      let uploadFile: Blob = file
      let ext = isVideo ? (file.name.split('.').pop() || 'mp4') : 'jpg'
      let label = isVideo ? '\uD83C\uDFAC Vid\u00e9o' : '\uD83D\uDCF7 Photo'

      if (!isVideo) {
        const { compressImage } = await import('../lib/media')
        uploadFile = await compressImage(file)
      }

      const path = currentUser.id + '/gchat_' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('avatars').upload(path, uploadFile, {
        contentType: isVideo ? file.type : 'image/jpeg',
      })
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('messages').insert({
        session_id: id, sender_id: currentUser.id, text: label,
        sender_name: displayName || t('common.anonymous_fallback'), room_type: 'group',
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
        await supabase.from('messages').insert({ session_id: id, sender_id: u.id, text: '\uD83C\uDFA4 Audio', sender_name: displayName || t('common.anonymous_fallback'), room_type: 'group', has_media: true, media_urls: [publicUrl] })
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
    const raw = newMessage.trim()
    const fullText = replyTo ? '> ' + replyTo.text.slice(0, 80) + '\n\n' + raw : raw
    const { error } = await supabase.from('messages').insert({
      session_id: id,
      sender_id: currentUser.id,
      text: fullText,
      sender_name: displayName || t('common.anonymous_fallback'),
      room_type: 'group',
    })
    if (error) {
      showToast(t('chat.send_error'), 'error')
    } else {
      setNewMessage('')
      setReplyTo(null)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function toggleGroupChat() {
    if (!session || !id) return
    const newVal = !session.group_chat_enabled
    await supabase.from('sessions').update({ group_chat_enabled: newVal }).eq('id', id)
    setSession({ ...session, group_chat_enabled: newVal })
    showToast(newVal ? t('chat.group_chat_on') : t('chat.group_chat_off'), 'info')
  }

  function handleDeleteMessage(msgId: string) {
    supabase.from('messages').delete().eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  return {
    // params
    id,
    navigate,
    t,
    // state
    messages,
    newMessage,
    setNewMessage,
    showEmojiBar,
    setShowEmojiBar,
    replyTo,
    setReplyTo,
    menuMsg,
    setMenuMsg,
    loading,
    sending,
    uploading,
    recording,
    currentUser,
    session,
    members,
    myAcceptedAt,
    isHost,
    showMembers,
    setShowMembers,
    canChat,
    // refs
    messagesEndRef,
    inputRef,
    // handlers
    sendPhoto,
    startRecording,
    stopRecording,
    sendMessage,
    toggleGroupChat,
    handleDeleteMessage,
  }
}
