import { useState, useEffect, useRef } from 'react'
import { SkeletonChatPage, SkeletonLine } from '../components/Skeleton'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
}

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return 'hier ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffHours < 24 * 7) return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function DMPage() {
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
  const [showCheckInConfirmed, setShowCheckInConfirmed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [displayName, setDisplayName] = useState<string>('')

  const isHost = currentUser?.id === session?.host_id
  const isAccepted = appStatus === 'accepted' || appStatus === 'checked_in'
  const showCheckInBanner = !isHost && appStatus === 'accepted'

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
            const { data: peerProf } = await supabase.from('user_profiles').select('display_name').eq('id', pid).maybeSingle()
            if (peerProf?.display_name) setPeerName(peerProf.display_name)
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
        setMessages((prev) => [...prev, { id: msg.id, text: msg.text, sender_id: msg.sender_id, created_at: msg.created_at, sender_name: msg.sender_name }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, peerIdParam])

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
    }
  }

  if (loading) return <SkeletonChatPage />

  return (
    <div style={{
      background: S.bg0, height: '100vh', display: 'flex', flexDirection: 'column',
      padding: 0, maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid '+S.border, background: S.bg1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/session/'+id)} style={{ background:'none', border:'none', color: S.tx3, fontSize: 16, cursor:'pointer', padding: 0 }}>&larr;</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: S.tx, margin: 0 }}>
              {session?.title ?? 'DM'}
            </h1>
            <p style={{ color: S.tx3, fontSize: 12, margin: 0 }}>
              {isHost ? (peerName ? `DM avec ${peerName}` : 'Tu es le host') : (peerName ? `DM avec ${peerName}` : 'Message avec le host')}
            </p>
          </div>
        </div>
        {peerId && (
          <button onClick={() => navigate(isHost ? '/session/' + id + '/candidate/' + peerId : '/profile/' + peerId)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: S.tx2, border: '1px solid '+S.border, background: 'transparent', cursor: 'pointer' }}>
            Voir profil
          </button>
        )}
      </header>

      {/* Status banner */}
      {!isHost && appStatus === 'pending' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: S.yellow+'14', border: '1px solid '+S.yellow+'44', borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.yellow, fontWeight: 600, textAlign: 'center' }}>
            Candidature en attente...
          </div>
        </div>
      )}

      {showCheckInBanner && !showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: '#14532d', border: '1px solid '+S.green, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.green, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>
            Tu as été accepté(e) ! 🎉 Clique quand tu arrives.
          </div>
          <button onClick={handleCheckIn} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, color: 'white', background: S.grad, border: 'none', cursor: 'pointer' }}>
            Je suis là ✓
          </button>
        </div>
      )}

      {showCheckInConfirmed && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: '#FBBF2414', border: '1px solid #FBBF2444', borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#FBBF24', fontWeight: 600, textAlign: 'center' }}>Check-in envoyé — en attente de confirmation du host</div>
        </div>
      )}

      {!isHost && appStatus === 'rejected' && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: '#F8717114', border: '1px solid #F8717144', borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#F87171', fontWeight: 600, textAlign: 'center' }}>
            Candidature refusee
          </div>
        </div>
      )}

      {/* Address revealed */}
      {isAccepted && session?.exact_address && (
        <div style={{ margin: '12px 16px 0', padding: 14, background: '#14532d', border: '1px solid '+S.green, borderRadius: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: S.green, marginBottom: 4 }}>
            Adresse revelee
          </div>
          <div style={{ fontSize: 14, color: S.tx, fontWeight: 600 }}>
            {session.exact_address}
          </div>
          {session.lineup_json?.directions && session.lineup_json.directions.length > 0 && (
            <div style={{ padding: '8px 16px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#7E7694', margin: '0 0 4px' }}>ACCÈS</p>
              {session.lineup_json.directions.map((step: string, i: number) => (
                <p key={i} style={{ fontSize: 12, color: '#B8B2CC', margin: '2px 0', lineHeight: 1.4 }}>{i + 1}. {step}</p>
              ))}
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
          <p style={{ color: '#F87171', margin: 0, padding: '0 24px', textAlign: 'center', paddingTop: 80 }}>Impossible de charger les données. Réessaie.</p>
        ) : messages.length === 0 ? (
          <p style={{ color: S.tx3, margin: 0, padding: '0 24px', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            Aucun message. Envoie le premier !
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
                  padding: '10px 14px', fontSize: 15, maxWidth: '80%',
                  background: isMine ? S.p400 : S.bg2,
                  color: isMine ? 'white' : S.tx,
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}>
                  {message.text}
                </div>
                <span style={{ color: S.tx3, fontSize: 10, marginTop: 2 }}>
                  {formatRelative(message.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: S.bg1, padding: 16, borderTop: '1px solid '+S.border,
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ton message..."
          style={{
            flex: 1, padding: 12, background: S.bg2, border: '1px solid '+S.border,
            borderRadius: 12, color: S.tx, fontSize: 15, outline: 'none',
            fontFamily: 'inherit',
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
