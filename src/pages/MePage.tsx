import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageFadeIn from '../components/PageFadeIn'
import { Link } from 'react-router-dom'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Eye, Share2 } from 'lucide-react'
import { showToast } from '../components/Toast'
import ImageCropModal from '../components/ImageCropModal'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import ProfileAdultMedia from '../components/profile/ProfileAdultMedia'
import PlatformProfiles from '../components/profile/LinkedProfiles'
import MultiChipSelector from '../components/MultiChipSelector'
import { TRIBES, TRIBE_CATEGORIES } from '../lib/tribeTypes'
import { ETHNICITIES, ETHNICITY_REGIONS } from '../lib/ethnicityTypes'
import { useMeData, PREP_OPTIONS, inputStyleResolved as inputStyle } from '../hooks/useMeData'
import { monthsAgoCount } from '../lib/timing'
// MeSettings and MePreferences relocated — removed from profile
import MeProfileCompleteness from '../components/me/MeProfileCompleteness'
import MeLoginForm from '../components/me/MeLoginForm'
import { validateMediaFile } from '../lib/sanitize'

const S = colors

function Chip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:600,
      border: active ? 'none' : `1px solid ${S.rule}`,
      background: active ? S.grad : S.bg2,
      color: active ? S.tx : S.tx3,
      cursor:'pointer', transition:'all 0.15s',
      boxShadow: active ? `0 2px 12px ${S.p}44` : 'none',
    }}>
      {label}
    </button>
  )
}

function VisibilityToggle({ value, onChange }: { value: 'all' | 'naughtybook'; onChange: (v: 'all' | 'naughtybook') => void }) {
  const { t } = useTranslation()
  const isNaughty = value === 'naughtybook'
  return (
    <button onClick={() => onChange(isNaughty ? 'all' : 'naughtybook')} style={{
      display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99,
      background: isNaughty ? S.lavbg : S.sagebg, border:'1px solid '+(isNaughty ? S.lavbd : S.sagebd),
      cursor:'pointer', fontSize:9, fontWeight:600, color: isNaughty ? S.lav : S.sage,
      whiteSpace:'nowrap',
    }}>
      {isNaughty ? t('naughtybook.mutual_badge') : t('profile.visibility_all')}
    </button>
  )
}

function Section({ title, badge, children, color, sectionKey, visibility, onVisibilityChange }: { title:string; badge?:string; children:React.ReactNode; color?:string; sectionKey?:string; visibility?:'all'|'naughtybook'; onVisibilityChange?:(key:string, v:'all'|'naughtybook')=>void }) {
  const c = color || S.tx3
  return (
    <div style={{ background:'rgba(22,20,31,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:20, padding:'16px', border:`1px solid ${S.rule2}`, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.08em', flex:1 }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99,
            background:S.p2, color:S.p, border:`1px solid ${S.pbd}` }}>
            {badge}
          </span>
        )}
        {sectionKey && onVisibilityChange && (
          <VisibilityToggle value={visibility || 'all'} onChange={(v) => onVisibilityChange(sectionKey, v)} />
        )}
      </div>
      {children}
    </div>
  )
}

export default function MePage() {
  const d = useMeData()
  const {
    t, kinkOptions, morphologies, roles, navigate, devMode,
    user, email, setEmail, loading, msg, hasGuestToken, sendMagicLink,
    displayName, setDisplayName, age, setAge, bio, setBio,
    location, setLocation, homeCountry, setHomeCountry, homeCity, setHomeCity,
    languages, setLanguages, role, setRole, orientation, setOrientation,
    height, setHeight, weight, setWeight, morphology, setMorphology,
    tribes, setTribes, ethnicities, setEthnicities,
    kinks, prep, setPrep, dernierTest, setDernierTest, healthTests, setHealthTests,
    limits, setLimits,
    sectionVisibility, setSectionVisibility,
    platformProfiles, setPlatformProfiles,
    avatarUrl, photosProfil, photosIntime, videosIntime,
    mediaUploading, cropSrc, setCropSrc, cropCallback, setCropCallback, cropAspect, setCropAspect,
    bodyPartPhotos, setBodyPartPhotos,
    profileViews, contactRequests,
    autoSaveStatus,
    toggleKink, uploadMedia, removePhotoProfil, removePhotoIntime, removeVideoIntime, setAsAvatar,
    readFileAsDataUrl,
  } = d

  const [activeTab, setActiveTab] = useState<'profil' | 'adulte'>('profil')

  function handleVisibilityChange(key: string, v: 'all' | 'naughtybook') {
    setSectionVisibility(prev => ({ ...prev, [key]: v }))
  }

  // ── Non connecté ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <MeLoginForm
        email={email} setEmail={setEmail} loading={loading} msg={msg}
        hasGuestToken={hasGuestToken} sendMagicLink={sendMagicLink} inputStyle={inputStyle}
      />
    )
  }

  // ── Connecté ─────────────────────────────────────────────────────────────
  return (
    <PageFadeIn>
    <div style={{ minHeight:'100vh', background:S.bg, paddingBottom:96, position:'relative', maxWidth:480, margin:'0 auto' }}>
      <OrbLayer />

      {/* Header */}
      <div style={{
        padding:'40px 20px 16px', borderBottom:`1px solid ${S.rule}`,
        background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin:0 }}>
              {displayName || t('common.my_profile_short')}
            </h1>
            <p style={{ fontSize:12, color:S.tx3, marginTop:3 }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button onClick={() => navigate('/profile/' + user.id)} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.pbd, color:S.p, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Eye size={14} strokeWidth={1.5} /> {d.t('profile.see_profile')}
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/profile/' + user.id); showToast(t('session.link_copied'), 'success') }} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.rule, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Share2 size={14} strokeWidth={1.5} />{t('common.share_label')}
          </button>
        </div>
      </div>

      {/* ── Pseudo (prominent, always visible) ── */}
      <div style={{ padding:'16px 20px 0' }}>
        <label style={{ fontSize:13, fontWeight:700, color:S.p, display:'block', marginBottom:8 }}>{t('me.pseudo_headline')}</label>
        <input
          value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder={t('me.pseudo_placeholder')}
          style={{ ...inputStyle, fontSize:18, fontWeight:700, padding:'14px 16px', borderColor: displayName ? S.rule : S.p, borderWidth: displayName ? 1 : 2 }}
        />
      </div>

      {/* ── Vibe Score + Completeness ── */}
      <div style={{ padding:'12px 20px' }}>
        {user && (
          <div style={{ marginBottom: 12 }}>
            <VibeScoreBadge userId={user.id} size="md" />
          </div>
        )}
        <MeProfileCompleteness
          displayName={displayName} avatarUrl={avatarUrl}
          age={age} role={role} bio={bio} height={height} weight={weight}
          morphology={morphology} kinks={kinks}
          profileViews={profileViews} contactRequests={contactRequests}
        />
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display:'flex', gap:0, margin:'0 20px 12px', borderRadius:14, overflow:'hidden', border:'1px solid '+S.rule }}>
        {(['profil', 'adulte'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex:1, padding:'12px 0', fontSize:13, fontWeight:700,
            background: activeTab === tab ? S.p : 'transparent',
            color: activeTab === tab ? S.tx : S.tx3,
            border:'none', cursor:'pointer', transition:'all 0.2s',
            letterSpacing:'0.04em',
          }}>
            {t('me.tab_' + tab)}
          </button>
        ))}
      </div>

      {/* ── Profil Tab ── */}
      {activeTab === 'profil' && (
      <div style={{ padding:'0 20px' }}>

          <Section title={t('profile.public_photos')} color={S.sage} sectionKey="public_photos" visibility={sectionVisibility.public_photos} onVisibilityChange={handleVisibilityChange}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 4px' }}>{t('profile.public_photos_desc')}</p>
            <p style={{ fontSize:10, color:S.tx4, margin:'0 0 10px' }}>{t('profile.public_photos_rules')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {photosProfil.map((url) => (
                <div key={url} style={{ position:'relative', width:80, height:80 }}>
                  <img src={url} alt="" loading="lazy" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border: avatarUrl === url ? '2px solid ' + S.p : '1px solid ' + S.rule }} />
                  {avatarUrl === url && (
                    <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:99, background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color: S.tx, fontWeight:700, border:'2px solid ' + S.bg1 }}>1</div>
                  )}
                  <button onClick={() => removePhotoProfil(url)} style={{ position:'absolute', top:-16, left:-16, width:44, height:44, borderRadius:99, background:'transparent', border:'none', color: S.tx, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}><span style={{ width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, display:'flex', alignItems:'center', justifyContent:'center' }}>×</span></button>
                  {avatarUrl !== url && (
                    <button onClick={() => setAsAvatar(url)} style={{ position:'absolute', bottom:4, right:4, padding:'2px 6px', borderRadius:6, background:'rgba(0,0,0,0.7)', color: S.tx, fontSize:9, fontWeight:600, cursor:'pointer', border:'none' }}>{t('me.avatar_label')}</button>
                  )}
                </div>
              ))}
              <label style={{ width:80, height:80, borderRadius:12, border:'1px dashed ' + S.rule, background:S.bg2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => {
                  const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
                  for (const f of captured) {
                    const vErr = validateMediaFile(f); if (vErr) { showToast(d.t(vErr), 'error'); continue }
                    const dataUrl = await readFileAsDataUrl(f)
                    setCropAspect(1)
                    setCropSrc(dataUrl)
                    setCropCallback(() => (croppedFile: File) => {
                      setCropSrc(null); setCropCallback(null)
                      uploadMedia(croppedFile, 'profil', 'photo')
                    })
                    break // crop one at a time
                  }
                }} disabled={mediaUploading} style={{ display:'none' }} />
                <span style={{ fontSize:24, color:S.tx4, lineHeight:1 }}>+</span>
                <span style={{ fontSize:10, color:S.tx4, marginTop:2 }}>{d.t('common.photo')}</span>
              </label>
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:0 }}>{d.t('profile.photo_count', { count: photosProfil.length })}</p>
          </Section>

          <Section title={t('profile.infos')} color={S.lav} sectionKey="infos" visibility={sectionVisibility.infos} onVisibilityChange={handleVisibilityChange}>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_bio')}</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t('profile.placeholder_bio')} rows={3} style={{ ...inputStyle, resize:'none', lineHeight:1.5 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_age')}</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder={t('profile.placeholder_age')} type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.location')}</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t('profile.placeholder_location')} style={inputStyle} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.home_country')}</label>
                  <input value={homeCountry} onChange={e => setHomeCountry(e.target.value)} placeholder={t('profile.placeholder_country')} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.home_city')}</label>
                  <input value={homeCity} onChange={e => setHomeCity(e.target.value)} placeholder={t('profile.placeholder_city')} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.languages')}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {['Français','English','Español','Deutsch','Português','Italiano','العربية','Nederlands','Русский','中文','日本語','한국어'].map(lang => (
                    <button key={lang} type="button" onClick={() => setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])} style={{
                      padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer',
                      border:'1px solid '+(languages.includes(lang) ? S.pbd : S.rule),
                      background: languages.includes(lang) ? S.p2 : 'transparent',
                      color: languages.includes(lang) ? S.p : S.tx3,
                    }}>{lang}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_height')}</label>
                <input value={height} onChange={e => setHeight(e.target.value)} placeholder={t('profile.placeholder_height')} type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_weight')}</label>
                <input value={weight} onChange={e => setWeight(e.target.value)} placeholder={t('profile.placeholder_weight')} type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_morphology')}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {morphologies.map(m => (
                    <Chip key={m.label} label={m.label} active={morphology===m.label} onClick={() => setMorphology(morphology===m.label?'':m.label)} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.lav, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('ethnicities.title')}</label>
                <p style={{ fontSize:11, color:S.tx4, margin:'0 0 8px' }}>{t('ethnicities.select_hint')}</p>
                <MultiChipSelector
                  items={ETHNICITIES.map(e => ({ slug: e.slug, group: e.region }))}
                  groupLabels={Object.fromEntries(ETHNICITY_REGIONS.map(r => [r, t('ethnicities.region_' + r)]))}
                  selected={ethnicities}
                  onChange={setEthnicities}
                  getLabel={slug => t('ethnicities.' + slug)}
                  mixedLabel={t('ethnicities.mixed_label')}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_role')}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {roles.map(r => (
                    <Chip key={r.label} label={r.label} active={role===r.label} onClick={() => setRole(role===r.label?'':r.label)} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.p, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('tribes.title')}</label>
                <p style={{ fontSize:11, color:S.tx4, margin:'0 0 8px' }}>{t('tribes.select_hint')}</p>
                <MultiChipSelector
                  items={TRIBES.map(tr => ({ slug: tr.slug, group: tr.category, color: tr.color }))}
                  groupLabels={Object.fromEntries(TRIBE_CATEGORIES.map(c => [c, t('tribes.category_' + c)]))}
                  selected={tribes}
                  onChange={setTribes}
                  getLabel={slug => t('tribes.' + slug)}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.orientation')}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Gay', 'Bi', 'Pan', 'Queer', 'Hétéro', 'Curieux', 'Fluid'].map(o => (
                    <Chip key={o} label={o} active={orientation===o} onClick={() => setOrientation(orientation===o?'':o)} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {devMode && (
            <Link to="/dev/test?dev=1" style={{ display: 'block', marginTop: 24, fontSize: 12, color: S.tx3, textDecoration: 'none' }}>Test menu</Link>
          )}
      </div>
      )}

      {/* ── Adulte Tab ── */}
      {activeTab === 'adulte' && (
        <div style={{ padding:'0 20px' }}>

          <Section title={t('profile.intimate_media')} color={S.p} sectionKey="adult_zones" visibility={sectionVisibility.adult_zones} onVisibilityChange={handleVisibilityChange}>
            <ProfileAdultMedia
              userId={user.id}
              bodyPartPhotos={bodyPartPhotos}
              setBodyPartPhotos={setBodyPartPhotos}
              photosIntime={photosIntime}
              videosIntime={videosIntime}
              removePhotoIntime={removePhotoIntime}
              removeVideoIntime={removeVideoIntime}
              uploadMedia={uploadMedia}
              mediaUploading={mediaUploading}
            />
          </Section>

          <Section title={t('profile.kinks')} color={S.p} badge={kinks.length > 0 ? t('profile.kinks_badge', { count: kinks.length }) : undefined} sectionKey="kinks" visibility={sectionVisibility.kinks} onVisibilityChange={handleVisibilityChange}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {kinkOptions.map(k => (
                <Chip key={k.label} label={k.label} active={kinks.includes(k.label)} onClick={() => toggleKink(k.label)} />
              ))}
            </div>
          </Section>

          <Section title={t('profile.health')} color={S.sage} badge={prep === 'Actif' ? t('profile.health_badge_prep') : dernierTest ? t('profile.health_badge_test', { months: monthsAgoCount(dernierTest) }) : undefined} sectionKey="health" visibility={sectionVisibility.health} onVisibilityChange={handleVisibilityChange}>
            {/* PrEP */}
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {PREP_OPTIONS.map(p => (
                <Chip key={p} label={p} active={prep===p} onClick={() => setPrep(prep===p?'':p)} />
              ))}
            </div>

            {/* Test date */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.health_test_date')}</label>
              <input type="date" value={dernierTest} onChange={e => setDernierTest(e.target.value)} style={inputStyle} />
            </div>

            {/* Disease test results */}
            <label style={{ fontSize:11, fontWeight:600, color:S.sage, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('profile.health_add_test')}</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['vih','chlamydia','syphilis','gonorrhee','hepatite_b','hepatite_c','hpv'].map(disease => {
                const current = healthTests[disease]?.status || ''
                const statuses = ['negatif','positif','en_attente'] as const
                return (
                  <div key={disease} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, background:S.bg2, border:'1px solid '+S.rule }}>
                    <span style={{ flex:1, fontSize:12, fontWeight:600, color:S.tx2 }}>{t('profile.health_disease_'+disease)}</span>
                    <div style={{ display:'flex', gap:4 }}>
                      {statuses.map(s => (
                        <button key={s} onClick={() => setHealthTests(prev => ({...prev, [disease]: { ...prev[disease], status: prev[disease]?.status === s ? '' : s, date: dernierTest || undefined }}))} style={{
                          padding:'3px 8px', borderRadius:8, fontSize:10, fontWeight:600, cursor:'pointer',
                          border:'1px solid '+(current===s ? (s==='negatif'?S.sagebd:s==='positif'?S.redbd:S.lavbd) : S.rule),
                          background: current===s ? (s==='negatif'?S.sagebg:s==='positif'?S.redbg:S.lavbg) : 'transparent',
                          color: current===s ? (s==='negatif'?S.sage:s==='positif'?S.red:S.lav) : S.tx4,
                        }}>
                          {t('profile.health_status_'+s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title={t('profile.limits')} color={S.red} sectionKey="limits" visibility={sectionVisibility.limits} onVisibilityChange={handleVisibilityChange}>
            <textarea
              value={limits} onChange={e => setLimits(e.target.value)}
              placeholder={t('placeholders.limits_placeholder')} rows={3}
              style={{ ...inputStyle, resize:'none', lineHeight:1.5, borderColor:S.red }}
            />
            <p style={{ fontSize:11, color:S.red, marginTop:6, opacity:0.7 }}>
              {t('profile.visible_host_voters')}
            </p>
          </Section>

          <Section title={t('profile.platform_profiles')} color={S.p} sectionKey="platform_profiles" visibility={sectionVisibility.platform_profiles} onVisibilityChange={handleVisibilityChange}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 10px' }}>{t('profile.platform_desc')}</p>
            <PlatformProfiles userId={user.id} linkedProfiles={platformProfiles} onChange={setPlatformProfiles} />
          </Section>
      </div>
      )}

      {/* Auto-save status (always visible) */}
      <div style={{
        textAlign:'center', padding:'12px 20px', fontSize:12, fontWeight:600,
        color: autoSaveStatus === 'saving' ? S.p : autoSaveStatus === 'saved' ? S.sage : S.tx4,
        transition:'color 0.3s',
      }}>
        {autoSaveStatus === 'saving' ? t('profile.autosave_saving') : autoSaveStatus === 'saved' ? t('profile.autosave_saved') : t('profile.autosave_active')}
      </div>

      {cropSrc && cropCallback && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={cropAspect}
          onConfirm={cropCallback}
          onCancel={() => { setCropSrc(null); setCropCallback(null) }}
        />
      )}
    </div>
    </PageFadeIn>
  )
}
