import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const ROLES = ['Top', 'Bottom', 'Versa', 'Side']
const MORPHOS = ['Mince', 'Sportif', 'Athletique', 'Moyen', 'Costaud', 'Muscle', 'Gros']
const KINKS = ['Fist', 'SM leger', 'SM hard', 'Jeux de role', 'Fetichisme', 'Exhib', 'Voyeur', 'Bareback', 'Gang bang', 'Cuir', 'Latex', 'Groupe']
const PREP_OPTIONS = ['Actif', 'Inactif', 'Non']

const inp: React.CSSProperties = { background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, padding: '12px 14px', color: '#F0EDFF', fontSize: 15, width: '100%', outline: 'none', boxSizing: 'border-box' as const }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 6, display: 'block' }

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 50, border: active ? '1px solid #F9A8A8' : '1px solid #2A2740', background: active ? '#3D1A1A' : '#16141F', color: active ? '#F9A8A8' : '#B8B2CC', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </button>
  )
}

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [role, setRole] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morpho, setMorpho] = useState('')
  const [kinks, setKinks] = useState<string[]>([])
  const [prep, setPrep] = useState('')
  const [limits, setLimits] = useState('')
  const [sessionNote, setSessionNote] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user ?? null))
  }, [])

  const toggleKink = (k: string) => setKinks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])

  const handleSubmit = async () => {
    if (!currentUser) { navigate('/me'); return }
    setLoading(true)
    setError('')
    const eps_json = { displayName, age, bio, location, role, height, weight, morphology: morpho, kinks, prep, limits, sessionNote }
    const { error: insertError } = await supabase.from('applications').upsert(
      { session_id: id, applicant_id: currentUser.id, eps_json, status: 'pending' },
      { onConflict: 'session_id,applicant_id' }
    )
    if (insertError) { setError(insertError.message); setLoading(false); return }
    await supabase.from('user_profiles').upsert({ id: currentUser.id, display_name: displayName }, { onConflict: 'id' })
    navigate('/session/' + id + '/dm')
    setLoading(false)
  }

  const progress = (step / 3) * 100
  const st: React.CSSProperties = { background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: 'Inter, sans-serif' }

  return (
    <div style={st}>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EDFF', marginBottom: 4 }}>Postuler</div>
        <div style={{ fontSize: 13, color: '#7E7694', marginBottom: 12 }}>Etape {step} sur 3</div>
        <div style={{ height: 3, background: '#2A2740', borderRadius: 99, marginBottom: 24 }}>
          <div style={{ height: 3, width: progress + '%', background: 'linear-gradient(90deg,#F9A8A8,#F47272)', borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {step === 1 && <>
          <div><span style={lbl}>Pseudo *</span><input style={inp} placeholder="Karim" value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          <div><span style={lbl}>Age</span><input style={inp} type="number" placeholder="28" value={age} onChange={e => setAge(e.target.value)} /></div>
          <div><span style={lbl}>Bio courte</span><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} placeholder="Quelques mots sur toi..." value={bio} onChange={e => setBio(e.target.value)} /></div>
          <div><span style={lbl}>Localisation</span><input style={inp} placeholder="Paris 11, Metro Voltaire" value={location} onChange={e => setLocation(e.target.value)} /></div>
        </>}

        {step === 2 && <>
          <div>
            <span style={lbl}>Role principal</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROLES.map(r => <Chip key={r} label={r} active={role === r} onClick={() => setRole(r)} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><span style={lbl}>Taille (cm)</span><input style={inp} type="number" placeholder="178" value={height} onChange={e => setHeight(e.target.value)} /></div>
            <div style={{ flex: 1 }}><span style={lbl}>Poids (kg)</span><input style={inp} type="number" placeholder="72" value={weight} onChange={e => setWeight(e.target.value)} /></div>
          </div>
          <div>
            <span style={lbl}>Morphologie</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MORPHOS.map(m => <Chip key={m} label={m} active={morpho === m} onClick={() => setMorpho(m)} />)}
            </div>
          </div>
          <div>
            <span style={lbl}>Pratiques ({kinks.length} selectionnees)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {KINKS.map(k => <Chip key={k} label={k} active={kinks.includes(k)} onClick={() => toggleKink(k)} />)}
            </div>
          </div>
          <div>
            <span style={lbl}>PrEP</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {PREP_OPTIONS.map(p => <Chip key={p} label={p} active={prep === p} onClick={() => setPrep(p)} />)}
            </div>
          </div>
          <div><span style={lbl}>Limites / hard limits</span><textarea style={{ ...inp, minHeight: 70, resize: 'vertical', borderColor: limits ? '#F87171' : '#2A2740' }} placeholder="Ce que tu ne veux pas..." value={limits} onChange={e => setLimits(e.target.value)} /></div>
        </>}

        {step === 3 && <>
          <div><span style={lbl}>Message pour cette session</span><textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} placeholder="Dispo a partir de 22h30..." value={sessionNote} onChange={e => setSessionNote(e.target.value)} /></div>
          <div style={{ background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>RESUME</div>
            <div style={{ fontSize: 14, color: '#F0EDFF', fontWeight: 600 }}>{displayName || 'Anonyme'}{age ? ', ' + age + ' ans' : ''}</div>
            {role && <div style={{ fontSize: 13, color: '#F9A8A8', marginTop: 4 }}>{role}{morpho ? ' · ' + morpho : ''}</div>}
            {kinks.length > 0 && <div style={{ fontSize: 12, color: '#B8B2CC', marginTop: 4 }}>{kinks.length} pratique{kinks.length > 1 ? 's' : ''}</div>}
          </div>
          {error && <div style={{ color: '#F87171', fontSize: 13 }}>{error}</div>}
        </>}
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', gap: 12 }}>
        {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 14, background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, color: '#B8B2CC', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Retour</button>}
        {step < 3
          ? <button onClick={() => { if (step === 1 && !displayName.trim()) { setError('Pseudo requis'); return } setError(''); setStep(s => s + 1) }} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Continuer</button>
          : <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: 14, background: loading ? '#2A2740' : 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Envoi...' : 'Envoyer 🔥'}</button>
        }
      </div>
    </div>
  )
}