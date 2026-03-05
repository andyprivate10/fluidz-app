import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function JoinPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleJoin() {
    const trimmed = input.trim()
    if (!trimmed) return
    // Extract session ID from URL or use raw ID
    const urlMatch = trimmed.match(/\/session\/([a-zA-Z0-9-]+)/)
    const sessionId = urlMatch ? urlMatch[1] : trimmed
    if (!sessionId || sessionId.length < 4) {
      setError('Lien ou ID invalide')
      return
    }
    navigate(`/session/${sessionId}`)
  }

  return (
    <div
      style={{
        background: '#0C0A14',
        padding: 24,
        maxWidth: 390,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: '100vh',
        justifyContent: 'center',
        paddingBottom: 80,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0EDFF', margin: 0 }}>
        Rejoindre une session
      </h1>
      <p style={{ color: '#7E7694', fontSize: 14, margin: 0 }}>
        Colle le lien ou l'ID de la session
      </p>
      <input
        type="text"
        placeholder="https://fluidz.app/session/xxx ou ID"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError('') }}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        style={{
          background: '#16141F',
          border: '1px solid #2A2740',
          borderRadius: 12,
          padding: 14,
          color: '#F0EDFF',
          fontSize: 16,
          width: '100%',
        }}
      />
      {error && <p style={{ color: '#F87171', fontSize: 14, margin: 0 }}>{error}</p>}
      <button
        type="button"
        className="btn-primary"
        style={{ padding: 14, borderRadius: 12 }}
        onClick={handleJoin}
      >
        Rejoindre
      </button>
    </div>
  )
}
