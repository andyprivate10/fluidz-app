import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage } from '../lib/media'
import {User as UserIcon, Camera, Sparkles, ChevronRight, ArrowLeft} from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors

const ROLES = ['Top', 'Bottom', 'Versa', 'Side']
const MORPHOS = ['Mince', 'Sportif', 'Athlétique', 'Moyen', 'Costaud', 'Musclé']

const inp: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'14px 16px', border:'1px solid '+S.rule, outline:'none',
  fontSize:15, fontFamily:'inherit', boxSizing:'border-box',
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: basics, 2: role, 3: photo
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [role, setRole] = useState('')
  const [morpho, setMorpho] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { navigate('/login'); return }
      setUser(u)
      // Load existing profile if any
      supabase.from('user_profiles').select('display_name,profile_json').eq('id', u.id).maybeSingle().then(({ data: prof }) => {
        // Skip if onboarding already done
        if (prof?.profile_json?.onboarding_done) { navigate('/'); return }
        if (prof?.display_name && prof.display_name !== 'Anonymous') setDisplayName(prof.display_name)
        const pj = prof?.profile_json || {}
        if (pj.age) setAge(String(pj.age))
        if (pj.location) setLocation(pj.location)
        if (pj.role) setRole(pj.role)
        if (pj.morphology) setMorpho(pj.morphology)
        if (pj.avatar_url) setAvatarUrl(pj.avatar_url)
      })
    })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: false })
      if (error) { showToast('Erreur upload: ' + error.message, 'error'); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
      showToast('Photo ajoutée', 'success')
    } catch (err) {
      showToast('Erreur: ' + String(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!user || !displayName.trim()) return
    setSaving(true)
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      profile_json: {
        age: age ? Number(age) : undefined,
        location: location || undefined,
        role: role || undefined,
        morphology: morpho || undefined,
        avatar_url: avatarUrl || undefined,
        photos_profil: avatarUrl ? [avatarUrl] : [],
        onboarding_done: true,
      },
    })
    setSaving(false)
    showToast('Profil sauvegardé !', 'success')
    navigate('/')
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100
  const completeness = [displayName.trim(), age, role, avatarUrl].filter(Boolean).length
  const completenessLabel = completeness <= 1 ? 'Débutant' : completeness <= 2 ? 'En route' : completeness <= 3 ? 'Presque complet' : 'Complet ✓'
  const completenessColor = completeness <= 1 ? S.tx4 : completeness <= 2 ? S.p : completeness <= 3 ? S.blue : S.sage

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
      <OrbLayer />

      {/* Progress bar */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: S.tx3, fontWeight: 600 }}>Étape {step}/3</span>
          <span style={{ fontSize: 11, color: completenessColor, fontWeight: 600 }}>{completenessLabel}</span>
        </div>
        <div style={{ background: S.bg2, borderRadius: 6, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, background: S.grad, height: '100%', borderRadius: 6, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <UserIcon size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 4px' }}>Dis-nous qui tu es</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>Les bases pour ton profil</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>PSEUDO *</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Comment tu veux qu'on t'appelle" maxLength={30} autoFocus style={inp} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>ÂGE</label>
              <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="25" inputMode="numeric" maxLength={2} style={inp} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>LOCALISATION</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris 4ème, Métro..." maxLength={50} style={inp} />
            </div>
          </div>

          <button onClick={() => { if (!displayName.trim()) { showToast('Choisis un pseudo', 'error'); return }; setStep(2) }}
            style={{ width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.grad, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Suivant <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2: Role & Morpho */}
      {step === 2 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <Sparkles size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 4px' }}>Tes préférences</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>Optionnel mais augmente tes chances</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>RÔLE</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(role === r ? '' : r)} style={{
                  padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: role === r ? 'none' : '1px solid ' + S.rule,
                  background: role === r ? S.grad : S.bg2,
                  color: role === r ? '#fff' : S.tx3,
                }}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>MORPHOLOGIE</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MORPHOS.map(m => (
                <button key={m} onClick={() => setMorpho(morpho === m ? '' : m)} style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: morpho === m ? 'none' : '1px solid ' + S.rule,
                  background: morpho === m ? S.p2 : S.bg2,
                  color: morpho === m ? S.p : S.tx3,
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ padding: '14px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.tx3, background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} /></button>
            <button onClick={() => setStep(3)} style={{ flex: 1, padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.grad, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Suivant <ChevronRight size={18} />
            </button>
          </div>

          <button onClick={() => { setStep(3) }} style={{ background: 'none', border: 'none', color: S.tx4, fontSize: 12, cursor: 'pointer' }}>
            Passer cette étape →
          </button>
        </div>
      )}

      {/* Step 3: Photo */}
      {step === 3 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Camera size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 4px' }}>Ajoute une photo</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>Les profils avec photo ont 5x plus de chances</p>
          </div>

          {/* Avatar preview */}
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.p }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: S.bg2, border: '2px dashed ' + S.rule, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={40} style={{ color: S.tx4 }} />
              </div>
            )}
            <label style={{ position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <Camera size={18} style={{ color: '#fff' }} />
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
          {uploading && <p style={{ fontSize: 12, color: S.p }}>Upload en cours...</p>}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: '14px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.tx3, background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} /></button>
              <button onClick={save} disabled={saving || !displayName.trim()} style={{
                flex: 1, padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff',
                background: S.grad, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving || !displayName.trim() ? 0.6 : 1,
                boxShadow: '0 4px 20px ' + S.pbd,
              }}>
                {saving ? 'Sauvegarde...' : avatarUrl ? 'Terminer ✓' : 'Terminer sans photo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
