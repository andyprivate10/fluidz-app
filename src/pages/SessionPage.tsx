import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Session = {
  id: string
  title: string
  description: string
  approx_area: string
  status: string
  host_id: string
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('Session introuvable')
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)
      const { data, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()
      if (sessionError) {
        setError('Session introuvable')
      } else if (data) {
        setSession(data as Session)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div
        style={{
          background: '#0C0A14',
          padding: 24,
          maxWidth: 390,
          margin: '0 auto',
          minHeight: '100vh',
          paddingTop: 48,
        }}
      >
        <p style={{ color: '#B8B2CC', margin: 0 }}>Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: '#0C0A14',
          padding: 24,
          maxWidth: 390,
          margin: '0 auto',
          minHeight: '100vh',
          paddingTop: 48,
        }}
      >
        <p style={{ color: '#F87171', margin: 0 }}>{error}</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isHost = currentUser?.id === session.host_id

  return (
    <div
      style={{
        background: '#0C0A14',
        padding: 24,
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        paddingTop: 48,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          borderRadius: 50,
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 600,
          ...(session.status === 'draft'
            ? { background: '#2A2740', color: '#B8B2CC' }
            : session.status === 'open'
              ? { background: '#14532d', color: '#4ADE80' }
              : { background: '#2A2740', color: '#B8B2CC' }),
        }}
      >
        {session.status === 'draft' ? 'Brouillon' : session.status === 'open' ? 'Ouverte' : session.status}
      </span>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#F0EDFF',
          margin: 0,
        }}
      >
        {session.title}
      </h1>

      <p style={{ color: '#B8B2CC', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
        {session.description}
      </p>

      <div
        style={{
          background: '#16141F',
          border: '1px solid #2A2740',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <p style={{ color: '#7E7694', fontSize: 12, fontWeight: 600, margin: '0 0 4px 0' }}>
          📍 Zone
        </p>
        <p style={{ color: '#F0EDFF', fontSize: 15, margin: '0 0 4px 0' }}>
          {session.approx_area}
        </p>
        <p style={{ color: '#7E7694', fontSize: 12, margin: 0 }}>
          Adresse exacte révélée après acceptation
        </p>
      </div>

      {currentUser && !isHost && (
        <button
          type="button"
          className="btn-primary"
          style={{ padding: 14, borderRadius: 12 }}
          onClick={() => navigate('/session/' + id + '/apply')}
        >
          Postuler à cette session
        </button>
      )}

      {currentUser && isHost && (
        <>
          <p style={{ color: '#B8B2CC', fontSize: 14, margin: 0 }}>
            Tu es le host de cette session
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: 14, borderRadius: 12 }}
          >
            Gérer la session
          </button>
        </>
      )}

      {!currentUser && (
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: 14, borderRadius: 12 }}
          onClick={() => navigate('/me')}
        >
          Se connecter pour postuler
        </button>
      )}
    </div>
  )
}
