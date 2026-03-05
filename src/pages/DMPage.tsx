import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Message = {
  id: string
  text: string
  sender_id: string
  created_at: string
  sender_name: string
}

type Session = { title: string }

export default function DMPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user ?? null)
    })
    supabase
      .from('sessions')
      .select('title')
      .eq('id', id)
      .single()
      .then(({ data }) => setSession(data as Session | null))
    supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at')
      .then(({ data }) => setMessages((data as Message[]) ?? []))
      .finally(() => setLoading(false))

    const channel = supabase
      .channel('messages:' + id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'session_id=eq.' + id,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

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
    <div
      style={{
        background: '#0C0A14',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        maxWidth: 390,
        margin: '0 auto',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2A2740',
          background: '#16141F',
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#F0EDFF',
            margin: '0 0 2px 0',
          }}
        >
          {session?.title ?? 'DM'}
        </h1>
        <p style={{ color: '#7E7694', fontSize: 12, margin: 0 }}>
          Message privé
        </p>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '16px 0',
        }}
      >
        {loading ? (
          <p style={{ color: '#B8B2CC', margin: 0, padding: '0 24px' }}>
            Chargement...
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUser?.id
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                  padding: '0 24px',
                }}
              >
                {!isMine && (
                  <span
                    style={{
                      color: '#7E7694',
                      fontSize: 11,
                      marginBottom: 2,
                    }}
                  >
                    {message.sender_name}
                  </span>
                )}
                <div
                  style={{
                    padding: '10px 14px',
                    fontSize: 15,
                    maxWidth: '80%',
                    background: isMine ? '#F47272' : '#1F1D2B',
                    color: isMine ? 'white' : '#F0EDFF',
                    borderRadius: isMine
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                  }}
                >
                  {message.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          background: '#16141F',
          padding: 16,
          borderTop: '1px solid #2A2740',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ton message..."
          style={{
            flex: 1,
            padding: 12,
            background: '#1F1D2B',
            border: '1px solid #2A2740',
            borderRadius: 12,
            color: '#F0EDFF',
            fontSize: 15,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #F9A8A8, #F47272)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
