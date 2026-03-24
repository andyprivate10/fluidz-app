import { Link } from 'react-router-dom'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Eye, Share2, Heart, Check, Mail } from 'lucide-react'
import { showToast } from '../components/Toast'
import ImageCropModal from '../components/ImageCropModal'
import { VibeScoreCard } from '../components/VibeScoreBadge'
import ProfileAdultMedia from '../components/profile/ProfileAdultMedia'
import LinkedProfiles from '../components/LinkedProfiles'
import PlatformProfiles from '../components/profile/LinkedProfiles'
import MultiChipSelector from '../components/MultiChipSelector'
import { TRIBES, TRIBE_CATEGORIES } from '../lib/tribeTypes'
import { ETHNICITIES, ETHNICITY_REGIONS } from '../lib/ethnicityTypes'
import { useMeData, PREP_OPTIONS, inputStyleResolved as inputStyle } from '../hooks/useMeData'
import { monthsAgoCount } from '../lib/timing'
import MeSettings from '../components/me/MeSettings'

const S = colors

function Chip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:600,
      border: active ? 'none' : `1px solid ${S.rule}`,
      background: active ? S.grad : S.bg2,
      color: active ? '#fff' : S.tx3,
      cursor:'pointer', transition:'all 0.15s',
      boxShadow: active ? `0 2px 12px ${S.p}44` : 'none',
    }}>
      {label}
    </button>
  )
}

function Section({ title, badge, children, color }: { title:string; badge?:string; children:React.ReactNode; color?:string }) {
  const c = color || S.tx3
  return (
    <div style={{ background:'rgba(22,20,31,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:20, padding:'16px', border:`1px solid ${S.rule2}`, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99,
            background:S.p2, color:S.p, border:`1px solid ${S.pbd}` }}>
            {badge}
          </span>
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
    kinks, prep, setPrep, dernierTest, setDernierTest, seroStatus, setSeroStatus,
    limits, setLimits,
    dmPrivacy, setDmPrivacy, savedMsgs, setSavedMsgs, newMsgText, setNewMsgText,
    linkedProfiles, setLinkedProfiles, platformProfiles, setPlatformProfiles,
    avatarUrl, photosProfil, photosIntime, videosIntime,
    mediaUploading, cropSrc, setCropSrc, cropCallback, setCropCallback, cropAspect, setCropAspect,
    bodyPartPhotos, setBodyPartPhotos,
    profileViews, contactRequests,
    showDeleteConfirm, setShowDeleteConfirm, deleteInput, setDeleteInput, deleting, setDeleting,
    autoSaveStatus,
    toggleKink, uploadMedia, removePhotoProfil, removePhotoIntime, removeVideoIntime, setAsAvatar,
    readFileAsDataUrl,
  } = d

  // ── Non connecté ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        minHeight:'100vh', background:S.bg, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px 96px',

      }}>
        {hasGuestToken && (
          <div style={{ marginBottom:20, padding:14, borderRadius:14, background:S.p2, border:'1px solid '+S.pbd, maxWidth:360, width:'100%' }}>
            <p style={{ margin:0, fontSize:13, color:S.tx, fontWeight:600 }}>{t('me.guest_warning')}</p>
            <p style={{ margin:'8px 0 0', fontSize:12, color:S.tx2 }}>{t('me.guest_warning_desc')}</p>
          </div>
        )}
        <div style={{ marginBottom:32, textAlign:'center' }}>
          <h1 style={{ fontSize:32, fontWeight:800, background:S.grad,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px' }}>
            fluidz
          </h1>
          <p style={{ color:S.tx3, fontSize:14 }}>{t('me.login_prompt')}</p>
        </div>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('profile.placeholder_email')}
          style={{ ...inputStyle, maxWidth:360, marginBottom:12 }}
          onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
        />
        <button
          onClick={sendMagicLink} disabled={loading}
          style={{
            width:'100%', maxWidth:360, padding:'14px', borderRadius:14,
            fontWeight:700, fontSize:15, color:'#fff', background:S.grad,
            border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1,
            boxShadow:`0 4px 20px ${S.p}44`,
          }}>
          {loading ? t('me.sending') : hasGuestToken ? t('me.create_account') : <><Mail size={16} strokeWidth={2} style={{display:'inline',verticalAlign:'middle',marginRight:6}} />{t('me.send_magic_link')}</>}
        </button>
        {msg && <p style={{ marginTop:16, fontSize:13, color:S.tx2, textAlign:'center' }}>{msg}</p>}
      </div>
    )
  }

  // ── Connecté ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:S.bg, paddingBottom:96, position:'relative', maxWidth:480, margin:'0 auto' }}>
      <OrbLayer />

      {/* Header */}
      <div style={{
        padding:'40px 20px 16px', borderBottom:`1px solid ${S.rule}`,
        background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin:0 }}>
              {displayName || t('common.my_profile_short')}
            </h1>
            <p style={{ fontSize:12, color:S.tx3, marginTop:3 }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button onClick={() => navigate('/profile/' + user.id)} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.pbd, color:S.p, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Eye size={14} strokeWidth={1.5} /> Voir profil
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/profile/' + user.id); showToast(t('session.link_copied'), 'success') }} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.rule, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Share2 size={14} strokeWidth={1.5} />{t('common.share_label')}
          </button>
        </div>
      </div>

      {/* ── Profil ── */}
      {/* ── Profil ── */}
      <div style={{ padding:'16px 20px' }}>

          {/* Vibe Score */}
          {user && (
            <div style={{ marginBottom: 16 }}>
              <VibeScoreCard userId={user.id} />
            </div>
          )}

          {/* Preview button */}
          {user && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => navigate('/profile/' + user.id)} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.pbd, color: S.p, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Eye size={13} strokeWidth={1.5} style={{marginRight:3}} /> {t('profile.see_profile')}
              </button>
              <button onClick={() => {
                const url = window.location.origin + '/profile/' + user.id
                if (navigator.share) {
                  navigator.share({ title: displayName || t('share.my_profile'), url }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(url)
                }
              }} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: S.bg1, border: '1px solid '+S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Share2 size={13} strokeWidth={1.5} style={{marginRight:3}} />{t('common.share_label')}
              </button>
            </div>
          )}

          {/* Profile views */}
          {profileViews > 0 && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: S.tx2 }}><Eye size={12} strokeWidth={1.5} style={{marginRight:3}} /> Vu par <strong style={{ color: S.tx }}>{profileViews}</strong> personne{profileViews > 1 ? 's' : ''} cette semaine</span>
            </div>
          )}

          {/* Contact requests */}
          {contactRequests > 0 && (
            <button onClick={() => navigate('/notifications')} style={{ width: '100%', marginBottom: 12, padding: '12px 14px', background: S.p2, border: '1px solid ' + S.pbd, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: S.p, fontWeight: 600, display:'flex', alignItems:'center', gap:4 }}><Heart size={13} strokeWidth={1.5} /> {contactRequests} personne{contactRequests > 1 ? 's' : ''} s'intéresse{contactRequests > 1 ? 'nt' : ''} à toi</span>
              <span style={{ fontSize: 11, color: S.tx2 }}>{t('common.view_arrow')}</span>
            </button>
          )}

          {/* Profile completeness */}
          {(() => {
            const checks = [
              { label: t('profile.step_pseudo'), done: !!displayName && displayName !== 'Anonymous' },
              { label: t('profile.step_photo'), done: !!avatarUrl },
              { label: t('profile.step_age'), done: !!age },
              { label: t('profile.step_role'), done: !!role },
              { label: t('profile.step_bio'), done: !!bio },
              { label: t('profile.step_physique'), done: !!height || !!weight || !!morphology },
              { label: t('profile.step_pratiques'), done: kinks.length > 0 },
            ]
            const done = checks.filter(c => c.done).length
            const pct = Math.round((done / checks.length) * 100)
            return (
              <div style={{ marginBottom: 16, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2 }}>{t('profile.completion_label', { pct })}</span>
                  <span style={{ fontSize: 11, color: pct === 100 ? S.sage : S.p, fontWeight: 600 }}>{done}/{checks.length}</span>
                </div>
                <div style={{ background: S.bg2, borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, background: pct === 100 ? S.sage : 'linear-gradient(90deg,'+S.p+','+S.pDark+')', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {checks.map(c => (
                    <span key={c.label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: c.done ? S.sagebg : S.bg2, color: c.done ? S.sage : S.tx3, fontWeight: 600, border: '1px solid ' + (c.done ? S.sagebd : S.rule) }}>
                      {c.done ? <Check size={11} strokeWidth={2.5} style={{display:'inline',color:S.sage}} /> : <span style={{opacity:0.3}}>○</span>} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          <Section title={t('profile.public_photos')} color={S.sage}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 4px' }}>{t('profile.public_photos_desc')}</p>
            <p style={{ fontSize:10, color:S.tx4, margin:'0 0 10px' }}>{t('profile.public_photos_rules')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {photosProfil.map((url) => (
                <div key={url} style={{ position:'relative', width:80, height:80 }}>
                  <img src={url} alt="" loading="lazy" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border: avatarUrl === url ? '2px solid ' + S.p : '1px solid ' + S.rule }} />
                  {avatarUrl === url && (
                    <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:99, background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700, border:'2px solid ' + S.bg1 }}>1</div>
                  )}
                  <button onClick={() => removePhotoProfil(url)} style={{ position:'absolute', top:-6, left:-6, width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}>×</button>
                  {avatarUrl !== url && (
                    <button onClick={() => setAsAvatar(url)} style={{ position:'absolute', bottom:4, right:4, padding:'2px 6px', borderRadius:6, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:600, cursor:'pointer', border:'none' }}>avatar</button>
                  )}
                </div>
              ))}
              <label style={{ width:80, height:80, borderRadius:12, border:'1px dashed ' + S.rule, background:S.bg2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
                  for (const f of captured) {
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
                <span style={{ fontSize:10, color:S.tx4, marginTop:2 }}>Photo</span>
              </label>
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:0 }}>{photosProfil.length} photo{photosProfil.length !== 1 ? 's' : ''}</p>
          </Section>

          <Section title={t('profile.infos')} color={S.lav}>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>{t('profile.label_pseudo')}</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('profile.placeholder_pseudo')} style={inputStyle} />
              </div>
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
                <select value={morphology} onChange={e => setMorphology(e.target.value)} style={inputStyle}>
                  <option value="">{t('profile.label_choose')}</option>
                  {morphologies.map(m => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>
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

          <MeSettings
            user={user}
            dmPrivacy={dmPrivacy} setDmPrivacy={setDmPrivacy}
            savedMsgs={savedMsgs} setSavedMsgs={setSavedMsgs}
            newMsgText={newMsgText} setNewMsgText={setNewMsgText}
            showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm}
            deleteInput={deleteInput} setDeleteInput={setDeleteInput}
            deleting={deleting} setDeleting={setDeleting}
          />

          {/* Auto-save status */}
          <div style={{
            textAlign:'center', padding:'12px 0', fontSize:12, fontWeight:600,
            color: autoSaveStatus === 'saving' ? S.p : autoSaveStatus === 'saved' ? S.sage : S.tx4,
            transition:'color 0.3s',
          }}>
            {autoSaveStatus === 'saving' ? t('profile.autosave_saving') : autoSaveStatus === 'saved' ? t('profile.autosave_saved') : t('profile.autosave_idle')}
          </div>

          {devMode && (
            <Link to="/dev/test?dev=1" style={{ display: 'block', marginTop: 24, fontSize: 12, color: S.tx3, textDecoration: 'none' }}>Test menu</Link>
          )}
        </div>

      {/* ── MÉDIAS ADULTES ── */}
        <div style={{ padding:'16px 20px' }}>

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

          <Section title={t('profile.kinks')} color={S.p} badge={kinks.length > 0 ? t('profile.kinks_badge', { count: kinks.length }) : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {kinkOptions.map(k => (
                <Chip key={k.label} label={k.label} active={kinks.includes(k.label)} onClick={() => toggleKink(k.label)} />
              ))}
            </div>
          </Section>

          <Section title={t('profile.health')} color={S.sage} badge={prep === 'Actif' ? t('profile.health_badge_prep') : dernierTest ? t('profile.health_badge_test', { months: monthsAgoCount(dernierTest) }) : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {prep === 'Actif' && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.sagebg, color:S.sage, border:'1px solid '+S.sagebd }}>{t('profile.prep_active_badge')}</span>}
              {dernierTest && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.bluebg, color:S.blue, border:'1px solid '+S.bluebd }}>Test il y a {monthsAgoCount(dernierTest)} mois</span>}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              {PREP_OPTIONS.map(p => (
                <Chip key={p} label={p} active={prep===p} onClick={() => setPrep(prep===p?'':p)} />
              ))}
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Date dernier test</label>
              <input type="date" value={dernierTest} onChange={e => setDernierTest(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Statut sero (optionnel)</label>
              <input value={seroStatus} onChange={e => setSeroStatus(e.target.value)} placeholder={t('placeholders.optional')} style={inputStyle} />
            </div>
          </Section>

          <Section title={t('profile.limits')} color={S.red}>
            <textarea
              value={limits} onChange={e => setLimits(e.target.value)}
              placeholder={t('placeholders.limits_placeholder')} rows={3}
              style={{ ...inputStyle, resize:'none', lineHeight:1.5, borderColor:S.red }}
            />
            <p style={{ fontSize:11, color:S.red, marginTop:6, opacity:0.7 }}>
              {t('profile.visible_host_voters')}
            </p>
          </Section>

          <Section title={t('profile.linked_profiles')} color={S.p}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 10px' }}>{t('profile.linked_desc')}</p>
            <LinkedProfiles userId={user.id} linkedProfiles={linkedProfiles} onChange={setLinkedProfiles} />
          </Section>

          <Section title={t('profile.platform_profiles')} color={S.p}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 10px' }}>{t('profile.platform_desc')}</p>
            <PlatformProfiles userId={user.id} linkedProfiles={platformProfiles} onChange={setPlatformProfiles} />
          </Section>

          {/* Auto-save status */}
          <div style={{
            textAlign:'center', padding:'12px 0', fontSize:12, fontWeight:600,
            color: autoSaveStatus === 'saving' ? S.p : autoSaveStatus === 'saved' ? S.sage : S.tx4,
            transition:'color 0.3s',
          }}>
            {autoSaveStatus === 'saving' ? t('profile.autosave_saving') : autoSaveStatus === 'saved' ? t('profile.autosave_saved') : t('profile.autosave_active')}
          </div>
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
  )
}
