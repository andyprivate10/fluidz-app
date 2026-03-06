import { useState, useEffect, useRef } from 'react'
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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<{ title: string; exact_address: string | null; host_id: string } | null>(null)
  const [appStatus, setAppStatus] = useState<string | null>(null)
  const [peerId, setPeerId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isHost = currentUser?.id === session?.host_id
  const isAccepted = appStatus === 'accepted' || appStatus === 'checked_in'

  useEffect(() => {
    if (!id) { setLoading(false); return }

    const init = async () => {
      setLoadError(false)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user ?? null)

        const { data: sess, error: sessErr } = await supabase
          .from('sessions')
          .select('title,exact_address,host_id')
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
          if (user?.id === sess.host_id) {
            const { data: appRow } = await supabase.from('applications').select('applicant_id').eq('session_id', id).limit(1)
            const row = Array.isArray(appRow) ? appRow[0] : appRow
            if (row?.applicant_id) setPeerId(row.applicant_id)
          } else setPeerId(sess.host_id)
        }

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', id)
          .order('created_at')
        setMessages((msgs as Message[]) ?? [])
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    init()

    const channel = supabase
      .channel('messages:' + id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'session_id=eq.' + id,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // Auto-scroll to bottom when a new message is sent or received
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!newMessage.trim() || !id || !currentUser) return
    const text = newMessage.trim()
    setNewMessage('')
    await supabase.from('messages').insert({
      session_id: id,
      sender_id: currentUser.id,
      text,
      sender_name: currentUser.email ?? '',
    })
  }

  return (
    <div style={{
      background: S.bg0, height: '100vh', display: 'flex', flexDirection: 'column',
      padding: 0, maxWidth: 390, margin: '0 auto', fontFamily: 'Inter,system-ui,sans-serif',
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
              {isHost ? 'Tu es le host' : 'Message avec le host'}
            </p>
          </div>
        </div>
        {peerId && (
          <button onClick={() => navigate('/profile/' + peerId)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: S.tx2, border: '1px solid '+S.border, background: 'transparent', cursor: 'pointer' }}>
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
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="spinner-loading" />
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
