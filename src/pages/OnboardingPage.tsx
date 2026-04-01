import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { compressImage, readFileAsDataUrl } from '../lib/media'
import ImageCropModal from '../components/ImageCropModal'
import { Camera, ArrowLeft, MessageCircle, UserCheck, Lock } from 'lucide-react'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { useTranslation } from 'react-i18next'
import { validateMediaFile } from '../lib/sanitize'

const S = colors

const ETHNICITIES = ['caucasian', 'black', 'middle_eastern', 'asian', 'latino', 'mixed', 'other'] as const

const TOTAL_STEPS = 5

const inp: React.CSSProperties = {
  width: '100%', background: S.bg2, color: S.tx, borderRadius: 14,
  padding: '14px 16px', border: '1px solid ' + S.rule, outline: 'none',
  fontSize: 15, fontFamily: fonts.body, boxSizing: 'border-box',
}

const pillActive: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 99, background: S.p2,
  border: '1px solid ' + S.pbd, color: S.p, fontWeight: 700, fontSize: 14, cursor: 'pointer',
}

const pillInactive: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 99, background: 'transparent',
  border: '1px solid ' + S.rule, color: S.tx3, fontWeight: 700, fontSize: 14, cursor: 'pointer',
}

const ctaBtn: React.CSSProperties = {
  width: '100%', padding: '16px', borderRadius: 14, background: S.p,
  border: 'none', color: S.tx, fontSize: 16, fontWeight: 700, cursor: 'pointer',
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const { roles: roleOptions, morphologies: morphoOptions, kinks: kinkOptions } = useAdminConfig()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  const [step, setStep] = useState(1)
  const [loaded, setLoaded] = useState(false)

  // Step 1
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  // Step 2
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morpho, setMorpho] = useState('')
  const [ethnicities, setEthnicities] = useState<string[]>([])

  // Step 3
  const [role, setRole] = useState('')
  const [kinks, setKinks] = useState<string[]>([])

  // Step 4
  const [prepStatus, setPrepStatus] = useState('')
  const [dernierTest, setDernierTest] = useState('')

  // Step 5
  const [dmPrivacy, setDmPrivacy] = useState<'open' | 'profile_required' | 'full_access' | ''>('')

  const [saving, setSaving] = useState(false)

  // Swipe gesture
  const touchStartX = useRef(0)
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    if (dx < 0 && step < TOTAL_STEPS) goNext()
    if (dx > 0 && step > 1) goBack()
  }

  /* ── Redirect + Load ── */
  useEffect(() => {
    if (!authUser) { navigate('/login'); return }
    supabase.from('user_profiles').select('display_name,profile_json').eq('id', authUser.id).maybeSingle().then(({ data: prof }) => {
      if (prof?.profile_json?.onboarding_done) { navigate('/'); return }
      if (prof?.display_name && prof.display_name !== 'Anonymous') setDisplayName(prof.display_name)
      const pj = prof?.profile_json || {} as Record<string, unknown>
      if (pj.age) setAge(String(pj.age))
      if (pj.height) setHeight(String(pj.height))
      if (pj.weight) setWeight(String(pj.weight))
      if (pj.morphology) setMorpho(pj.morphology as string)
      if (pj.ethnicities) setEthnicities(pj.ethnicities as string[])
      if (pj.role) setRole(pj.role as string)
      if (pj.kinks) setKinks(pj.kinks as string[])
      if (pj.avatar_url) setAvatarUrl(pj.avatar_url as string)
      if (pj.health) {
        const h = pj.health as Record<string, string>
        if (h.prep_status) setPrepStatus(h.prep_status)
        if (h.dernier_test) setDernierTest(h.dernier_test)
      }
      if (pj.dm_privacy) setDmPrivacy(pj.dm_privacy as 'open' | 'profile_required' | 'full_access')
      setLoaded(true)
    })
  }, [authUser])

  /* ── Save helper ── */
  async function saveStep(fields: Record<string, unknown>) {
    if (!authUser) return
    const { data: existing } = await supabase.from('user_profiles')
      .select('profile_json').eq('id', authUser.id).maybeSingle()
    const currentPj = (existing?.profile_json || {}) as Record<string, unknown>
    await supabase.from('user_profiles').upsert({
      id: authUser.id,
      display_name: displayName.trim() || (currentPj.display_name as string) || undefined,
      profile_json: { ...currentPj, ...fields },
    })
  }

  /* ── Photo upload ── */
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !authUser) return
    e.target.value = ''
    const vErr = validateMediaFile(file); if (vErr) { showToast(t(vErr), 'error'); return }
    const dataUrl = await readFileAsDataUrl(file)
    setCropSrc(dataUrl)
  }

  async function handleCropConfirm(croppedFile: File) {
    setCropSrc(null)
    if (!authUser) return
    setUploading(true)
    try {
      const compressed = await compressImage(croppedFile)
      const path = `${authUser.id}/avatar_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: false })
      if (error) { showToast(t('errors.error_prefix') + ': ' + error.message, 'error'); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch (err) {
      showToast(t('errors.error_prefix') + ': ' + String(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  /* ── Step transitions ── */
  async function goNext() {
    if (step === 1) {
      if (!displayName.trim()) { showToast(t('onboarding.pseudo_required'), 'error'); return }
      await saveStep({ display_name: displayName.trim(), avatar_url: avatarUrl || undefined, photos_profil: avatarUrl ? [avatarUrl] : [] })
    } else if (step === 2) {
      await saveStep({
        age: age ? Number(age) : undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        morphology: morpho || undefined,
        ethnicities: ethnicities.length ? ethnicities : undefined,
      })
    } else if (step === 3) {
      await saveStep({ role: role || undefined, kinks: kinks.length ? kinks : undefined })
    } else if (step === 4) {
      await saveStep({ health: { prep_status: prepStatus || undefined, dernier_test: dernierTest || undefined } })
    }
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  async function goBack() {
    if (step > 1) setStep(step - 1)
  }

  async function handleFinish() {
    setSaving(true)
    await saveStep({ dm_privacy: dmPrivacy || 'open', onboarding_done: true })
    setSaving(false)
    showToast(t('me.profile_saved'), 'success')
    navigate('/welcome')
  }

  function toggleEthnicity(e: string) {
    setEthnicities(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  function toggleKink(k: string) {
    setKinks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  if (!loaded) return <div style={{ background: S.bg, minHeight: '100vh' }}><OrbLayer /></div>

  /* ── Progress dots ── */
  const dots = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 0 0' }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: i + 1 === step ? S.p : S.tx4,
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )

  /* ── Top bar ── */
  const topBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
      {step > 1 ? (
        <button onClick={goBack} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
      ) : <div style={{ width: 30 }} />}
      {step > 1 ? (
        <button onClick={goNext} style={{ background: 'none', border: 'none', color: S.tx4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {t('onboarding.skip')}
        </button>
      ) : <div style={{ width: 30 }} />}
    </div>
  )

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
      <OrbLayer />

      {topBar}
      {dots}

      {/* ════ Step 1: Pseudo + Photo ════ */}
      {step === 1 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: 0, textAlign: 'center' }}>
            {t('onboarding.step1_title')}
          </h1>
          <p style={{ color: S.tx3, fontSize: 13, margin: 0, textAlign: 'center' }}>{t('onboarding.step1_desc')}</p>

          {/* Avatar */}
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + S.p }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: S.bg2, border: '2px dashed ' + S.rule, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={40} style={{ color: S.tx4 }} />
              </div>
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, width: 42, height: 42, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <Camera size={18} style={{ color: S.tx }} />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>
          </div>
          {uploading && <p style={{ fontSize: 12, color: S.p, margin: 0 }}>{t('onboarding.uploading')}</p>}

          {/* Name input */}
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.pseudo_label')}</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('onboarding.pseudo_placeholder')} maxLength={30} autoFocus style={inp} />
          </div>

          <button onClick={goNext} style={ctaBtn}>{t('onboarding.next')}</button>
        </div>
      )}

      {/* ════ Step 2: Physique ════ */}
      {step === 2 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>{t('onboarding.step2_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step2_desc')}</p>
          </div>

          {/* Age / Height / Weight */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.age_label')}</label>
              <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="25" inputMode="numeric" maxLength={2} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.height_label')}</label>
              <input value={height} onChange={e => setHeight(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="175" inputMode="numeric" maxLength={3} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.weight_label')}</label>
              <input value={weight} onChange={e => setWeight(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="70" inputMode="numeric" maxLength={3} style={inp} />
            </div>
          </div>

          {/* Morphology pills */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.morpho_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {morphoOptions.map(m => (
                <button key={m.label} onClick={() => setMorpho(morpho === m.label ? '' : m.label)}
                  style={morpho === m.label ? pillActive : pillInactive}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* Ethnicities chips */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.ethnicities_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ETHNICITIES.map(e => (
                <button key={e} onClick={() => toggleEthnicity(e)}
                  style={ethnicities.includes(e) ? pillActive : pillInactive}>
                  {t(`onboarding.ethnicity_${e}`)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={goNext} style={ctaBtn}>{t('onboarding.next')}</button>
        </div>
      )}

      {/* ════ Step 3: Role + Kinks ════ */}
      {step === 3 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>{t('onboarding.step3_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step3_desc')}</p>
          </div>

          {/* Role pills */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.role_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roleOptions.map(r => (
                <button key={r.label} onClick={() => setRole(role === r.label ? '' : r.label)}
                  style={role === r.label ? pillActive : pillInactive}>{r.label}</button>
              ))}
            </div>
          </div>

          {/* Kinks chips */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.kinks_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {kinkOptions.map((k: { label: string; slug: string }) => (
                <button key={k.label} onClick={() => toggleKink(k.label)}
                  style={kinks.includes(k.label) ? pillActive : pillInactive}>{k.label}</button>
              ))}
            </div>
          </div>

          <button onClick={goNext} style={ctaBtn}>{t('onboarding.next')}</button>
        </div>
      )}

      {/* ════ Step 4: Sante ════ */}
      {step === 4 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>{t('onboarding.step4_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step4_desc')}</p>
          </div>

          {/* PrEP status */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 8, display: 'block' }}>{t('onboarding.prep_label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Actif', 'Non', 'Discute'].map(v => (
                <button key={v} onClick={() => setPrepStatus(prepStatus === v ? '' : v)}
                  style={prepStatus === v ? pillActive : pillInactive}>{v}</button>
              ))}
            </div>
          </div>

          {/* Dernier test */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: S.tx3, marginBottom: 6, display: 'block' }}>{t('onboarding.dernier_test_label')}</label>
            <input type="month" value={dernierTest} onChange={e => setDernierTest(e.target.value)}
              style={{ ...inp, colorScheme: 'dark' }} />
          </div>

          <p style={{ fontSize: 12, color: S.tx3, margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
            {t('onboarding.health_private_info')}
          </p>

          <button onClick={goNext} style={ctaBtn}>{t('onboarding.next')}</button>
        </div>
      )}

      {/* ════ Step 5: DM Privacy ════ */}
      {step === 5 && (
        <div className="animate-slide-up" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>{t('onboarding.step5_title')}</h1>
            <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{t('onboarding.step5_desc')}</p>
          </div>

          {/* DM privacy cards */}
          {([
            { value: 'open' as const, icon: <MessageCircle size={28} />, color: S.sage, bg: S.sagebg, bd: S.sagebd },
            { value: 'profile_required' as const, icon: <UserCheck size={28} />, color: S.blue, bg: S.bluebg, bd: S.bluebd },
            { value: 'full_access' as const, icon: <Lock size={28} />, color: S.lav, bg: S.lavbg, bd: S.lavbd },
          ]).map(opt => {
            const selected = dmPrivacy === opt.value
            return (
              <button key={opt.value} onClick={() => setDmPrivacy(opt.value)} style={{
                width: '100%', padding: '20px', borderRadius: 16, cursor: 'pointer',
                background: selected ? opt.bg : S.bg2,
                border: selected ? '2px solid ' + opt.bd : '1px solid ' + S.rule,
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: opt.color }}>
                  {opt.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: selected ? opt.color : S.tx, marginBottom: 4 }}>
                    {t(`onboarding.dm_${opt.value}_title`)}
                  </div>
                  <div style={{ fontSize: 12, color: S.tx3, lineHeight: 1.4 }}>
                    {t(`onboarding.dm_${opt.value}_desc`)}
                  </div>
                </div>
              </button>
            )
          })}

          <button onClick={handleFinish} disabled={saving} style={{ ...ctaBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? t('onboarding.saving') : t('onboarding.finish')}
          </button>
        </div>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={1}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  )
}
