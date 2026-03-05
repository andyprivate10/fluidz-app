import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const inputStyle = {
  width: '100%',
  padding: 14,
  background: '#1F1D2B',
  border: '1px solid #2A2740',
  borderRadius: 12,
  color: '#F0EDFF',
  fontSize: 16,
  outline: 'none',
  marginTop: 4,
} as const

const ROLES = ['Top', 'Bottom', 'Versa', 'Side'] as const
const MORPHOLOGIES = ['Mince', 'Sportif', 'Athlétique', 'Moyen', 'Costaud', 'Musclé'] as const

function Chip({
  label,
  selected,
  onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 50,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        border: selected ? '1px solid #F47272' : '1px solid #2A2740',
        background: selected ? '#F47272' : '#1F1D2B',
        color: selected ? 'white' : '#B8B2CC',
      }}
    >
      {label}
    </button>
  )
}

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')

  const [role, setRole] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morphology, setMorphology] = useState('')

  const [sessionNote, setSessionNote] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user ?? null)
      if (!user) navigate('/me')
    })
  }, [navigate])

  async function handleSubmit() {
    if (!id || !currentUser) return
    setLoading(true)
    setError('')
    const epsJson = {
      displayName,
      age,
      bio,
      location,
      role,
      height,
      weight,
      morphology,
      sessionNote,
    }
    const { error: insertError } = await supabase.from('applications').insert({
      session_id: id,
      applicant_id: currentUser.id,
      eps_json: epsJson,
      status: 'pending',
    })
    if (insertError) {
      setError(insertError.message)
    } else {
      // Upsert display name to user_profiles
      if (displayName && currentUser) {
        await supabase.from('user_profiles').upsert(
          { id: currentUser.id, display_name: displayName },
          { onConflict: 'id' }
        ).then(() => {}) // graceful — ignore errors
      }
      navigate('/session/' + id + '/dm')
    }
    setLoading(false)
  }

  if (!currentUser) {
    return null
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
        gap: 20,
        paddingTop: 48,
        paddingBottom: 80,
      }}
    >
      <header style={{ marginBottom: 0 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#F0EDFF',
            margin: '0 0 4px 0',
          }}
        >
          Postuler
        </h1>
        <p style={{ color: '#7E7694', fontSize: 14, margin: '0 0 12px 0' }}>
          Étape {step} sur 3
        </p>
        <div
          style={{
            background: '#2A2740',
            height: 4,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#F47272',
              width: `${(step / 3) * 100}%`,
              height: '100%',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </header>

      {step === 1 && (
        <>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Pseudo
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Âge
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Bio courte
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Localisation
            </label>
            <input
              type="text"
              placeholder="Paris 11, Métro Voltaire"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={() => setStep(2)}
          >
            Continuer →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block', marginBottom: 8 }}>
              Ton rôle
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {ROLES.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={role === r}
                  onClick={() => setRole(r)}
                />
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Taille (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Poids (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block', marginBottom: 8 }}>
              Morphologie
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {MORPHOLOGIES.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  selected={morphology === m}
                  onClick={() => setMorphology(m)}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={() => setStep(3)}
          >
            Continuer →
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={() => setStep(1)}
          >
            ← Retour
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <label style={{ color: '#B8B2CC', fontSize: 14, display: 'block' }}>
              Un mot pour le host
            </label>
            <textarea
              placeholder="Dispo maintenant, j'apporte..."
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              style={{ ...inputStyle, height: 120, resize: 'vertical' }}
            />
          </div>
          {error && (
            <p style={{ color: '#F87171', fontSize: 14, margin: 0 }}>
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{ padding: 14, borderRadius: 12 }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Envoi…' : 'Envoyer ma candidature 🔥'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={() => setStep(2)}
          >
            ← Retour
          </button>
        </>
      )}
    </div>
  )
}
