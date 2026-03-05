import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const inputStyle = {
  width: '100%',
  padding: 14,
  background: '#1F1D2B',
  border: '1px solid #2A2740',
  borderRadius: 12,
  color: '#F0EDFF',
  fontSize: 16,
  outline: 'none',
} as const

export default function CreateSessionPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  async function handleCreate() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Tu dois être connecté')
      setLoading(false)
      return
    }
    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert({
        host_id: user.id,
        title,
        description,
        approx_area: approxArea,
        exact_address: exactAddress,
        status: 'draft',
      })
      .select()
    if (insertError) {
      setError(insertError.message)
    } else if (data?.[0]) {
      navigate('/session/' + data[0].id)
    }
    setLoading(false)
  }

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
        gap: 16,
        paddingTop: 48,
        paddingBottom: 80,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#F0EDFF',
          margin: 0,
        }}
      >
        Nouvelle session
      </h1>
      <p style={{ color: '#B8B2CC', fontSize: 14, margin: 0 }}>
        Remplis les infos de base
      </p>
      <input
        type="text"
        placeholder="Titre de la session (ex: Plan ce soir 🔥)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Description (ex: Ce qu'on cherche ce soir...)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ ...inputStyle, height: 100, resize: 'vertical' }}
        rows={4}
      />
      <input
        type="text"
        placeholder="Zone approximative (ex: Paris 4ème, Métro Saint-Paul)"
        value={approxArea}
        onChange={(e) => setApproxArea(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Visible uniquement après acceptation"
        value={exactAddress}
        onChange={(e) => setExactAddress(e.target.value)}
        style={inputStyle}
      />
      {error && (
        <p style={{ color: '#F87171', fontSize: 14, margin: 0 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-primary"
        onClick={handleCreate}
        disabled={loading}
        style={{ padding: 14, borderRadius: 12 }}
      >
        {loading ? 'Création…' : 'Créer la session'}
      </button>
    </div>
  )
}
