import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage } from '../lib/media'
import {User as UserIcon, Camera, Sparkles, ChevronRight, ArrowLeft} from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { useTranslation } from 'react-i18next'

const S = colors

const inp: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'14px 16px', border:'1px solid '+S.rule, outline:'none',
  fontSize:15, fontFamily:"'Plus Jakarta Sans', sans-serif", boxSizing:'border-box',
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const { roles: roleOptions, morphologies: morphoOptions } = useAdminConfig()
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

  // Swipe gesture
  const touchStartX = useRef(0)
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    if (dx < 0 && step < 3) setStep((step + 1) as 1 | 2 | 3) // swipe left → next
    if (dx > 0 && step > 1) setStep((step - 1) as 1 | 2 | 3) // swipe right → prev
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100
  const completeness = [displayName.trim(), age, role, avatarUrl].filter(Boolean).length
  const completenessLabel = completeness <= 1 ? t('onboarding.level_beginner') : completeness <= 2 ? t('onboarding.level_on_way') : completeness <= 3 ? t('onboarding.level_almost') : t('onboarding.level_complete')
  const completenessColor = completeness <= 1 ? S.tx4 : completeness <= 2 ? S.p : completeness <= 3 ? S.blue : S.sage

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
      <OrbLayer />

      {/* Progress bar */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: S.tx3, fontWeight: 600 }}>{t('onboarding.step_label', { step })}</span>
          <span style={{ fontSize: 11, color: completenessColor, fontWeight: 600 }}>{completenessLabel}</span>
        </div>
        <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, background: S.grad, height: '100%', borderRadius: 6, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <UserIcon size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 4px' }}>{t('onboarding.step1_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step1_desc')}</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.pseudo_label')}</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('onboarding.pseudo_placeholder')} maxLength={30} autoFocus style={inp} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.age_label')}</label>
              <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="25" inputMode="numeric" maxLength={2} style={inp} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.location_label')}</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t('onboarding.location_placeholder')} maxLength={50} style={inp} />
            </div>
          </div>

          <button onClick={() => { if (!displayName.trim()) { showToast(t('onboarding.pseudo_required'), 'error'); return }; setStep(2) }}
            style={{ width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {t('onboarding.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2: Role & Morpho */}
      {step === 2 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <Sparkles size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 4px' }}>{t('onboarding.step2_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step2_desc')}</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.role_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roleOptions.map(r => (
                <button key={r.label} onClick={() => setRole(role === r.label ? '' : r.label)} style={{
                  padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: role === r.label ? 'none' : '1px solid ' + S.rule,
                  background: role === r.label ? S.grad : S.bg2,
                  color: role === r.label ? '#fff' : S.tx3,
                }}>{r.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.morpho_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {morphoOptions.map(m => (
                <button key={m.label} onClick={() => setMorpho(morpho === m.label ? '' : m.label)} style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: morpho === m.label ? 'none' : '1px solid ' + S.rule,
                  background: morpho === m.label ? S.p2 : S.bg2,
                  color: morpho === m.label ? S.p : S.tx3,
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ padding: '14px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.tx3, background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} /></button>
            <button onClick={() => setStep(3)} style={{ flex: 1, padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {t('onboarding.next')} <ChevronRight size={18} />
            </button>
          </div>

          <button onClick={() => { setStep(3) }} style={{ background: 'none', border: 'none', color: S.tx4, fontSize: 12, cursor: 'pointer' }}>
            {t('onboarding.skip')} →
          </button>
        </div>
      )}

      {/* Step 3: Photo */}
      {step === 3 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Camera size={32} style={{ color: S.p, marginBottom: 8 }} />
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 4px' }}>{t('onboarding.step3_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step3_desc')}</p>
          </div>

          {/* Avatar preview */}
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.p }} />
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
          {uploading && <p style={{ fontSize: 12, color: S.p }}>{t('onboarding.uploading')}</p>}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: '14px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14, color: S.tx3, background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} /></button>
              <button onClick={save} disabled={saving || !displayName.trim()} style={{
                flex: 1, padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff',
                background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving || !displayName.trim() ? 0.6 : 1,
                boxShadow: '0 4px 20px ' + S.pbd,
              }}>
                {saving ? t('onboarding.saving') : avatarUrl ? t('onboarding.finish') : t('onboarding.finish_no_photo')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
