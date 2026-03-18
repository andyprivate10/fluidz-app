import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage } from '../lib/media'
import { VibeScoreCard } from '../components/VibeScoreBadge'
import type { User } from '@supabase/supabase-js'

const MORPHOLOGIES = ['Mince','Sportif','Athlétique','Moyen','Costaud','Musclé','Gros']
const ROLES = ['Top','Bottom','Versa','Side']
const PREP_OPTIONS = ['Actif','Inactif','Non']
const KINKS_LIST = ['Fist', 'SM léger', 'SM hard', 'Bareback', 'Group', 'Exhib', 'Voyeur', 'Fétichisme', 'Jeux de rôle']

const S = {
  bg0:'#0C0A14', bg1:'#16141F', bg2:'#1F1D2B', bg3:'#2A2740',
  tx:'#F0EDFF', tx2:'#B8B2CC', tx3:'#7E7694', tx4:'#453F5C',
  border:'#2A2740', p300:'#F9A8A8', p400:'#F47272', red:'#F87171', green:'#4ADE80', blue:'#3B82F6',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

function monthsAgo(isoDate: string): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
}

const inputStyle: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'12px 16px', border:`1px solid ${S.border}`, outline:'none',
  fontSize:14, fontFamily:'inherit', boxSizing:'border-box',
}

function Chip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:600,
      border: active ? 'none' : `1px solid ${S.border}`,
      background: active ? S.grad : S.bg2,
      color: active ? '#fff' : S.tx3,
      cursor:'pointer', transition:'all 0.15s',
      boxShadow: active ? `0 2px 12px ${S.p400}44` : 'none',
    }}>
      {label}
    </button>
  )
}

function Section({ title, badge, children }: { title:string; badge?:string; children:React.ReactNode }) {
  return (
    <div style={{ background:S.bg1, borderRadius:20, padding:'16px', border:`1px solid ${S.border}`, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:700, color:S.tx3, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99,
            background:`${S.p300}18`, color:S.p300, border:`1px solid ${S.p300}33` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function MePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const devMode = searchParams.get('dev') === '1'
  const nextUrl = searchParams.get('next')
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'auth'|'profil'>('auth')
  const [locationVisible, setLocationVisible] = useState(false)
  const [profileViews, setProfileViews] = useState(0)

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [role, setRole] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morphology, setMorphology] = useState('')
  const [kinks, setKinks] = useState<string[]>([])
  const [prep, setPrep] = useState('')
  const [dernierTest, setDernierTest] = useState('')
  const [seroStatus, setSeroStatus] = useState('')
  const [limits, setLimits] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [photosProfil, setPhotosProfil] = useState<string[]>([])
  const [photosIntime, setPhotosIntime] = useState<string[]>([])
  const [videosIntime, setVideosIntime] = useState<string[]>([])
  const [mediaUploading, setMediaUploading] = useState(false)
  const [hasGuestToken, setHasGuestToken] = useState(false)
  const profileLoaded = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')

  useEffect(() => {
    try {
      setHasGuestToken(!!(typeof localStorage !== 'undefined' && localStorage.getItem('guest_token')))
    } catch (_) {}
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        // Already logged in + ?next= → redirect immediately
        if (nextUrl) { navigate(nextUrl); return }
        loadProfile(u.id)
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            void supabase.rpc('claim_phantom', { p_guest_token: token }).then(() => {}, () => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id)
        // Redirect to ?next= URL if present
        if (nextUrl) {
          navigate(nextUrl)
          return
        }
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            void supabase.rpc('claim_phantom', { p_guest_token: token }).then(() => {}, () => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name,profile_json')
      .eq('id', uid)
      .maybeSingle()
    if (data) {
      setDisplayName(data.display_name || '')
        setLocationVisible(!!(data as any).location_visible)
        // Count profile views (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        supabase.from('interaction_log').select('*', { count: 'exact', head: true }).eq('target_user_id', uid).eq('type', 'profile_view').gte('created_at', weekAgo).then(({ count }) => setProfileViews(count ?? 0))
      const p = data.profile_json || {}
      const h = p.health || {}
      setAvatarUrl(p.avatar_url || '')
      // Migration: old photos[] → photos_profil[], new photos_intime[] + videos_intime[]
      const oldPhotos = Array.isArray(p.photos) ? p.photos : p.avatar_url ? [p.avatar_url] : []
      setPhotosProfil(Array.isArray(p.photos_profil) ? p.photos_profil : oldPhotos)
      setPhotosIntime(Array.isArray(p.photos_intime) ? p.photos_intime : [])
      setVideosIntime(Array.isArray(p.videos_intime) ? p.videos_intime : Array.isArray(p.videos) ? p.videos : [])
      setAge(p.age || '')
      setBio(p.bio || '')
      setLocation(p.location || '')
      setRole(p.role || '')
      setHeight(p.height || '')
      setWeight(p.weight || '')
      setMorphology(p.morphology || '')
      setKinks(p.kinks || [])
      setPrep(h.prep_status || p.prep || '')
      setDernierTest(h.dernier_test || '')
      setSeroStatus(h.sero_status || '')
      setLimits(p.limits || '')
    }
    // Allow auto-save after initial load settles
    setTimeout(() => { profileLoaded.current = true }, 500)
  }

  async function sendMagicLink() {
    if (!email) return
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/me' }
    })
    setMsg(error ? error.message : 'Lien envoyé ! Vérifie ta boîte mail.')
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setActiveTab('auth')
  }

  const doSave = useCallback(async () => {
    if (!user) return
    setAutoSaveStatus('saving')
    const profile_json = {
      age, bio, location, role, height, weight, morphology, kinks, prep, limits,
      avatar_url: photosProfil[0] || avatarUrl || undefined,
      photos_profil: photosProfil,
      photos_intime: photosIntime,
      videos_intime: videosIntime,
      photos: [...photosProfil, ...photosIntime],
      videos: videosIntime,
      health: { prep_status: prep || undefined, dernier_test: dernierTest || undefined, sero_status: seroStatus || undefined },
    }
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName || 'Anonyme',
      profile_json
    })
    setAutoSaveStatus('saved')
    setTimeout(() => setAutoSaveStatus('idle'), 2000)
  }, [user, displayName, age, bio, location, role, height, weight, morphology, kinks, prep, limits, dernierTest, seroStatus, avatarUrl, photosProfil, photosIntime, videosIntime])

  // Auto-save: debounce 1.5s after any field change
  useEffect(() => {
    if (!profileLoaded.current || !user) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [doSave])

  function toggleKink(k: string) {
    setKinks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  async function uploadMedia(file: File, album: 'profil' | 'intime', mediaType: 'photo' | 'video') {
    if (!user) return
    const maxSize = mediaType === 'photo' ? 5 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      showToast(`Fichier trop gros (max ${mediaType === 'photo' ? '5' : '20'} Mo)`, 'error')
      return
    }
    setMediaUploading(true)
    try {
      // Compress photos before upload (skip videos)
      let fileToUpload = file
      if (mediaType === 'photo') {
        fileToUpload = await compressImage(file)
      }
      const ext = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg')
      const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const path = `${user.id}/${album}_${mediaType}_${ts}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, fileToUpload, { upsert: false })
      if (error) {
        showToast('Erreur upload: ' + error.message, 'error')
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      if (album === 'profil') {
        setPhotosProfil(prev => [...prev, publicUrl])
        if (!avatarUrl) setAvatarUrl(publicUrl)
      } else if (mediaType === 'photo') {
        setPhotosIntime(prev => [...prev, publicUrl])
      } else {
        setVideosIntime(prev => [...prev, publicUrl])
      }
      showToast(mediaType === 'photo' ? 'Photo ajoutée' : 'Vidéo ajoutée', 'success')
    } catch (err) {
      showToast('Erreur: ' + String(err), 'error')
    } finally {
      setMediaUploading(false)
    }
  }

  function removePhotoProfil(url: string) {
    setPhotosProfil(prev => prev.filter(p => p !== url))
    if (avatarUrl === url) setAvatarUrl(photosProfil.find(p => p !== url) || '')
  }

  function removePhotoIntime(url: string) {
    setPhotosIntime(prev => prev.filter(p => p !== url))
  }

  function removeVideoIntime(url: string) {
    setVideosIntime(prev => prev.filter(v => v !== url))
  }

  function setAsAvatar(url: string) {
    setAvatarUrl(url)
  }

  // ── Non connecté ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        minHeight:'100vh', background:S.bg0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px 96px',
        
      }}>
        {hasGuestToken && (
          <div style={{ marginBottom:20, padding:14, borderRadius:14, background:S.p300+'18', border:'1px solid '+S.p300+'44', maxWidth:360, width:'100%' }}>
            <p style={{ margin:0, fontSize:13, color:S.tx, fontWeight:600 }}>Vous avez une candidature en attente — créer un compte pour la conserver.</p>
            <p style={{ margin:'8px 0 0', fontSize:12, color:S.tx2 }}>Connecte-toi avec ton email pour récupérer ta candidature.</p>
          </div>
        )}
        <div style={{ marginBottom:32, textAlign:'center' }}>
          <h1 style={{ fontSize:32, fontWeight:800, background:S.grad,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px' }}>
            fluidz
          </h1>
          <p style={{ color:S.tx3, fontSize:14 }}>Entre ton email pour te connecter</p>
        </div>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ton@email.com"
          style={{ ...inputStyle, maxWidth:360, marginBottom:12 }}
          onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
        />
        <button
          onClick={sendMagicLink} disabled={loading}
          style={{
            width:'100%', maxWidth:360, padding:'14px', borderRadius:14,
            fontWeight:700, fontSize:15, color:'#fff', background:S.grad,
            border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1,
            boxShadow:`0 4px 20px ${S.p400}44`,
          }}>
          {loading ? 'Envoi...' : hasGuestToken ? 'Créer mon compte (lien magique)' : '✉️ Envoyer le lien magique'}
        </button>
        {msg && <p style={{ marginTop:16, fontSize:13, color:S.tx2, textAlign:'center' }}>{msg}</p>}
      </div>
    )
  }

  // ── Connecté ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:S.bg0, paddingBottom:96,  }}>

      {/* Header */}
      <div style={{
        padding:'40px 20px 16px', borderBottom:`1px solid ${S.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:S.tx, margin:0 }}>
            {displayName || 'Mon profil'}
          </h1>
          <p style={{ fontSize:12, color:S.tx3, marginTop:3 }}>{user.email}</p>
        </div>
        <button onClick={signOut} style={{
          padding:'7px 14px', borderRadius:10, fontSize:12, color:S.tx3,
          border:`1px solid ${S.border}`, background:'transparent', cursor:'pointer',
        }}>
          Déco
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', padding:'12px 20px 0', gap:8 }}>
        {(['auth','profil'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex:1, padding:'10px', borderRadius:12, fontSize:13,
            fontWeight:600, cursor:'pointer',
            border: `1px solid ${activeTab===tab ? `${S.p300}66` : S.border}`,
            background: activeTab===tab ? `${S.p300}14` : S.bg2,
            color: activeTab===tab ? S.p300 : S.tx3,
            transition:'all 0.2s',
          }}>
            {tab === 'auth' ? 'Compte' : 'Profil'}
          </button>
        ))}
      </div>

      {/* ── Compte ── */}
      {activeTab === 'auth' && (
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:S.bg1, borderRadius:16, padding:'14px 16px', border:`1px solid ${S.border}` }}>
            <p style={{ fontSize:11, color:S.tx3, marginBottom:4, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>Email</p>
            <p style={{ fontSize:14, color:S.tx, fontWeight:500 }}>{user.email}</p>
          </div>
          <button onClick={signOut} style={{
            width:'100%', padding:'13px', borderRadius:14, fontWeight:600,
            fontSize:14, color:S.tx2, border:`1px solid ${S.border}`,
            background:S.bg2, cursor:'pointer',
          }}>
            Se déconnecter
          </button>

          {/* Gallery visibility toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '12px 14px', background: '#16141F', border: '1px solid #2A2740', borderRadius: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EDFF', margin: 0 }}>Visible dans la galerie</p>
              <p style={{ fontSize: 11, color: '#7E7694', margin: '2px 0 0' }}>Les profils à proximité te voient</p>
            </div>
            <button onClick={async () => {
              const nv = !locationVisible
              if (user) { await supabase.from('user_profiles').update({ location_visible: nv }).eq('id', user.id) }
              setLocationVisible(nv)
            }} style={{
              width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
              background: locationVisible ? '#4ADE80' : '#2A2740', transition: 'background 0.2s',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: locationVisible ? 21 : 3, transition: 'left 0.2s' }} />
            </button>
          </div>

          <button onClick={() => navigate('/notifications')} style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#FBBF24', border: '1px solid #FBBF2444', background: '#FBBF2414', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            🔔 Notifications
          </button>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={() => navigate('/contacts')} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#F9A8A8', border: '1px solid #F9A8A844', background: '#F9A8A814', cursor: 'pointer' }}>
              💕 Naughty Book
            </button>
            <button onClick={() => navigate('/groups')} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#B8B2CC', border: '1px solid #2A2740', background: 'transparent', cursor: 'pointer' }}>
              👥 Groupes
            </button>
          </div>
          <button onClick={() => navigate('/addresses')} style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#B8B2CC', border: '1px solid #2A2740', background: 'transparent', cursor: 'pointer', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            📍 Mes adresses
          </button>
        </div>
      )}

      {/* ── Profil ── */}
      {activeTab === 'profil' && (
        <div style={{ padding:'16px 20px' }}>

          {/* Vibe Score */}
          {user && (
            <div style={{ marginBottom: 16 }}>
              <VibeScoreCard userId={user.id} />
            </div>
          )}

          {/* Preview button */}
          {user && (
            <button onClick={() => navigate('/profile/' + user.id)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, background: '#16141F', border: '1px solid #F9A8A844', color: '#F9A8A8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              👁 Voir mon profil (comme les autres me voient)
            </button>
          )}

          {/* Profile views */}
          {profileViews > 0 && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#B8B2CC' }}>👁 Vu par <strong style={{ color: '#F0EDFF' }}>{profileViews}</strong> personne{profileViews > 1 ? 's' : ''} cette semaine</span>
            </div>
          )}

          {/* Profile completeness */}
          {(() => {
            const checks = [
              { label: 'Pseudo', done: !!displayName && displayName !== 'Anonymous' },
              { label: 'Photo', done: !!avatarUrl },
              { label: 'Âge', done: !!age },
              { label: 'Rôle', done: !!role },
              { label: 'Bio', done: !!bio },
              { label: 'Physique', done: !!height || !!weight || !!morphology },
              { label: 'Pratiques', done: kinks.length > 0 },
            ]
            const done = checks.filter(c => c.done).length
            const pct = Math.round((done / checks.length) * 100)
            return (
              <div style={{ marginBottom: 16, background: '#16141F', border: '1px solid #2A2740', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7E7694' }}>Profil {pct}% complet</span>
                  <span style={{ fontSize: 11, color: pct === 100 ? '#4ADE80' : '#FBBF24', fontWeight: 600 }}>{done}/{checks.length}</span>
                </div>
                <div style={{ background: '#1F1D2B', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, background: pct === 100 ? '#4ADE80' : 'linear-gradient(90deg,#F9A8A8,#F47272)', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {checks.map(c => (
                    <span key={c.label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: c.done ? '#4ADE8018' : '#1F1D2B', color: c.done ? '#4ADE80' : '#453F5C', fontWeight: 600, border: '1px solid ' + (c.done ? '#4ADE8044' : '#2A2740') }}>
                      {c.done ? '✓' : '○'} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          <Section title="Photos profil">
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 8px' }}>Visage, corps. Visible par défaut.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {photosProfil.map((url) => (
                <div key={url} style={{ position:'relative', width:80, height:80 }}>
                  <img src={url} alt="" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border: avatarUrl === url ? '2px solid ' + S.p300 : '1px solid ' + S.border }} />
                  {avatarUrl === url && (
                    <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:99, background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700, border:'2px solid ' + S.bg1 }}>1</div>
                  )}
                  <button onClick={() => removePhotoProfil(url)} style={{ position:'absolute', top:-6, left:-6, width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}>×</button>
                  {avatarUrl !== url && (
                    <button onClick={() => setAsAvatar(url)} style={{ position:'absolute', bottom:4, right:4, padding:'2px 6px', borderRadius:6, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:600, cursor:'pointer', border:'none' }}>avatar</button>
                  )}
                </div>
              ))}
              <label style={{ width:80, height:80, borderRadius:12, border:'1px dashed ' + S.border, background:S.bg2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
                  for (const f of captured) await uploadMedia(f, 'profil', 'photo')
                }} disabled={mediaUploading} style={{ display:'none' }} />
                <span style={{ fontSize:24, color:S.tx4, lineHeight:1 }}>+</span>
                <span style={{ fontSize:10, color:S.tx4, marginTop:2 }}>Photo</span>
              </label>
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:0 }}>{photosProfil.length} photo{photosProfil.length !== 1 ? 's' : ''}</p>
          </Section>

          <Section title="Photos & vidéos adultes">
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 8px' }}>NSFW. Partagé uniquement si le candidat active le bloc "Adulte".</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {photosIntime.map((url) => (
                <div key={url} style={{ position:'relative', width:80, height:80 }}>
                  <img src={url} alt="" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border:'1px solid ' + S.p400 + '55' }} />
                  <button onClick={() => removePhotoIntime(url)} style={{ position:'absolute', top:-6, left:-6, width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}>×</button>
                </div>
              ))}
              <label style={{ width:80, height:80, borderRadius:12, border:'1px dashed ' + S.p400 + '44', background:S.p400 + '08', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
                  for (const f of captured) await uploadMedia(f, 'intime', 'photo')
                }} disabled={mediaUploading} style={{ display:'none' }} />
                <span style={{ fontSize:24, color:S.p400, lineHeight:1 }}>+</span>
                <span style={{ fontSize:10, color:S.p400, marginTop:2 }}>Photo</span>
              </label>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {videosIntime.map((url) => (
                <div key={url} style={{ position:'relative', width:100, height:80 }}>
                  <video src={url} style={{ width:100, height:80, borderRadius:12, objectFit:'cover', border:'1px solid ' + S.p400 + '55' }} />
                  <button onClick={() => removeVideoIntime(url)} style={{ position:'absolute', top:-6, left:-6, width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}>×</button>
                  <div style={{ position:'absolute', bottom:4, right:4, padding:'2px 6px', borderRadius:6, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:600 }}>vidéo</div>
                </div>
              ))}
              <label style={{ width:100, height:80, borderRadius:12, border:'1px dashed ' + S.p400 + '44', background:S.p400 + '08', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="video/*" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return; e.target.value = ''
                  await uploadMedia(f, 'intime', 'video')
                }} disabled={mediaUploading} style={{ display:'none' }} />
                <span style={{ fontSize:24, color:S.p400, lineHeight:1 }}>+</span>
                <span style={{ fontSize:10, color:S.p400, marginTop:2 }}>Vidéo</span>
              </label>
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:0 }}>{photosIntime.length} photo{photosIntime.length !== 1 ? 's' : ''} · {videosIntime.length} vidéo{videosIntime.length !== 1 ? 's' : ''}</p>
            {mediaUploading && <p style={{ fontSize:12, color:S.p300, marginTop:8 }}>Upload en cours...</p>}
          </Section>

          <Section title="Profil">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Pseudo *</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ton pseudo" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio courte..." rows={3} style={{ ...inputStyle, resize:'none', lineHeight:1.5 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Âge</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="Âge" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Localisation</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris 11e, Bastille..." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Taille (cm)</label>
                <input value={height} onChange={e => setHeight(e.target.value)} placeholder="175" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Poids (kg)</label>
                <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Morphologie</label>
                <select value={morphology} onChange={e => setMorphology(e.target.value)} style={inputStyle}>
                  <option value="">— Choisir —</option>
                  {MORPHOLOGIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Rôle</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {ROLES.map(r => (
                    <Chip key={r} label={r} active={role===r} onClick={() => setRole(role===r?'':r)} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Kinks" badge={kinks.length > 0 ? `${kinks.length} pratique${kinks.length > 1 ? 's' : ''} sélectionnée${kinks.length > 1 ? 's' : ''}` : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {KINKS_LIST.map(k => (
                <Chip key={k} label={k} active={kinks.includes(k)} onClick={() => toggleKink(k)} />
              ))}
            </div>
          </Section>

          <Section title="Santé" badge={prep === 'Actif' ? 'PrEP actif' : dernierTest ? `Testé il y a ${monthsAgo(dernierTest)} mois` : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {prep === 'Actif' && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.green+'22', color:S.green, border:'1px solid '+S.green+'44' }}>PrEP actif</span>}
              {dernierTest && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.blue+'22', color:S.blue, border:'1px solid '+S.blue+'44' }}>Testé il y a {monthsAgo(dernierTest)} mois</span>}
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
              <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Statut séro (optionnel)</label>
              <input value={seroStatus} onChange={e => setSeroStatus(e.target.value)} placeholder="Optionnel" style={inputStyle} />
            </div>
          </Section>

          <Section title="Limites">
            <textarea
              value={limits} onChange={e => setLimits(e.target.value)}
              placeholder="Hard limits, no-go..." rows={3}
              style={{ ...inputStyle, resize:'none', lineHeight:1.5, borderColor:S.red }}
            />
            <p style={{ fontSize:11, color:S.red, marginTop:6, opacity:0.7 }}>
              Visible par le host et les membres votants
            </p>
          </Section>

          {/* Auto-save status */}
          <div style={{
            textAlign:'center', padding:'12px 0', fontSize:12, fontWeight:600,
            color: autoSaveStatus === 'saving' ? S.p300 : autoSaveStatus === 'saved' ? S.green : S.tx4,
            transition:'color 0.3s',
          }}>
            {autoSaveStatus === 'saving' ? 'Sauvegarde...' : autoSaveStatus === 'saved' ? '✓ Sauvegardé' : 'Les modifications sont sauvegardées automatiquement'}
          </div>

          {devMode && (
            <Link to="/dev/test?dev=1" style={{ display: 'block', marginTop: 24, fontSize: 12, color: S.tx3, textDecoration: 'none' }}>Test menu</Link>
          )}
        </div>
      )}

    </div>
  )
}
