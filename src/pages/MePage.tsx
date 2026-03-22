import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage } from '../lib/media'
import { VibeScoreCard } from '../components/VibeScoreBadge'
import type { User } from '@supabase/supabase-js'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Eye, Share2, Heart, Check, Mail, User as UserIcon, Flame, Circle, Footprints, Plus, ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { monthsAgoCount } from '../lib/timing'

const PREP_OPTIONS = ['Actif','Inactif','Non']

const BODY_ZONES = [
  { id: 'torso', label: 'Torse', icon: 'User' },
  { id: 'sex', label: 'Sex', icon: 'Flame' },
  { id: 'butt', label: 'Fessier', icon: 'Circle' },
  { id: 'feet', label: 'Pieds', icon: 'Footprints' },
] as const

const ZONE_ICONS: Record<string, React.ReactNode> = {
  torso: <UserIcon size={18} strokeWidth={1.5} />,
  sex: <Flame size={18} strokeWidth={1.5} />,
  butt: <Circle size={18} strokeWidth={1.5} />,
  feet: <Footprints size={18} strokeWidth={1.5} />,
}

const S = colors

const inputStyle: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'12px 16px', border:`1px solid ${S.rule}`, outline:'none',
  fontSize:14, fontFamily:'inherit', boxSizing:'border-box',
}

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
  const { t } = useTranslation()
  const { kinks: kinkOptions, morphologies, roles } = useAdminConfig()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const devMode = searchParams.get('dev') === '1'
  const nextUrl = searchParams.get('next')
  const ghostMergeId = searchParams.get('ghost_merge')
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [bodyPartPhotos, setBodyPartPhotos] = useState<Record<string, string[]>>({})
  const [profileViews, setProfileViews] = useState(0)
  const [contactRequests, setContactRequests] = useState(0)

  async function mergeGhost(mergeId: string, userId: string) {
    const { data: ghost } = await supabase.from('ghost_sessions').select('id, display_name, profile_json').eq('id', mergeId).maybeSingle()
    if (!ghost || !ghost.profile_json) return
    const gp = (ghost.profile_json || {}) as Record<string, unknown>
    const { data: existing } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', userId).maybeSingle()
    const ep = ((existing?.profile_json || {}) as Record<string, unknown>)
    const merged = { ...gp, ...ep }
    if (!ep.avatar_url && gp.avatar_url) merged.avatar_url = gp.avatar_url
    await supabase.from('user_profiles').upsert({
      id: userId,
      display_name: existing?.display_name || ghost.display_name || 'Anonyme',
      profile_json: merged,
    })
    await supabase.from('applications').update({ applicant_id: userId }).eq('ghost_session_id', mergeId)
    await supabase.from('ghost_sessions').update({ claimed_user_id: userId }).eq('id', mergeId)
    try { localStorage.removeItem('ghost_merge_id') } catch (_e) {}
    showToast('Compte créé ! Profil ghost importé.', 'success')
  }

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
        // Ghost → account merge
        const mergeId = ghostMergeId || localStorage.getItem('ghost_merge_id')
        if (mergeId && u) {
          mergeGhost(mergeId, u.id)
        }

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
        // Count profile views (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        supabase.from('interaction_log').select('*', { count: 'exact', head: true }).eq('target_user_id', uid).eq('type', 'profile_view').gte('created_at', weekAgo).then(({ count }) => setProfileViews(count ?? 0))
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('type', 'contact_request').is('read_at', null).then(({ count }) => setContactRequests(count ?? 0))
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
      setBodyPartPhotos(() => {
        const raw = p.body_part_photos || {}
        const keyMap: Record<string, string> = { torse: 'torso', bite: 'sex', cul: 'butt', pieds: 'feet' }
        const migrated: Record<string, string[]> = {}
        for (const [k, v] of Object.entries(raw)) {
          const newKey = keyMap[k] || k
          if (Array.isArray(v)) migrated[newKey] = v as string[]
          else if (typeof v === 'string' && v) migrated[newKey] = [v]
        }
        return migrated
      })
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
      body_part_photos: bodyPartPhotos,
      health: { prep_status: prep || undefined, dernier_test: dernierTest || undefined, sero_status: seroStatus || undefined },
    }
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName || 'Anonyme',
      profile_json
    })
    setAutoSaveStatus('saved')
    setTimeout(() => setAutoSaveStatus('idle'), 2000)
  }, [user, displayName, age, bio, location, role, height, weight, morphology, kinks, prep, limits, dernierTest, seroStatus, avatarUrl, photosProfil, photosIntime, videosIntime, bodyPartPhotos])

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
        minHeight:'100vh', background:S.bg, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px 96px',
        
      }}>
        {hasGuestToken && (
          <div style={{ marginBottom:20, padding:14, borderRadius:14, background:S.p2, border:'1px solid '+S.pbd, maxWidth:360, width:'100%' }}>
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
              {displayName || 'Mon profil'}
            </h1>
            <p style={{ fontSize:12, color:S.tx3, marginTop:3 }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button onClick={() => navigate('/profile/' + user.id)} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.pbd, color:S.p, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Eye size={14} strokeWidth={1.5} /> Voir profil
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/profile/' + user.id); showToast('Lien copié', 'success') }} style={{ flex:1, padding:'10px 14px', borderRadius:12, background:S.bg1, border:'1px solid '+S.rule, color:S.tx2, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <Share2 size={14} strokeWidth={1.5} /> Partager
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
                  navigator.share({ title: displayName || 'Mon profil Fluidz', url }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(url)
                }
              }} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: S.bg1, border: '1px solid '+S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Share2 size={13} strokeWidth={1.5} style={{marginRight:3}} /> Partager
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
              <span style={{ fontSize: 11, color: S.tx2 }}>Voir →</span>
            </button>
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
              <div style={{ marginBottom: 16, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2 }}>Profil {pct}% complet</span>
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
                  <img src={url} alt="" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border: avatarUrl === url ? '2px solid ' + S.p : '1px solid ' + S.rule }} />
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
                  for (const f of captured) await uploadMedia(f, 'profil', 'photo')
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
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Pseudo *</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ton pseudo" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio courte..." rows={3} style={{ ...inputStyle, resize:'none', lineHeight:1.5 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Age</label>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="Age" type="number" style={inputStyle} />
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
                  <option value="">-- Choisir --</option>
                  {morphologies.map(m => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:S.tx3, display:'block', marginBottom:6 }}>Role</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {roles.map(r => (
                    <Chip key={r.label} label={r.label} active={role===r.label} onClick={() => setRole(role===r.label?'':r.label)} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

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

          {/* Zones intimes — 2×2 grid, max 4 per zone, photo+video */}
          <Section title={t('profile.adult_zones')} color={S.p}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 12px' }}>{t('profile.adult_zones_desc')}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {BODY_ZONES.map(zone => {
                const files = bodyPartPhotos[zone.id] || []
                const canAdd = files.length < 4
                return (
                  <div key={zone.id} style={{ background:'rgba(22,20,31,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:16, border:'1px solid '+S.rule2, padding:12, position:'relative' }}>
                    {/* Zone header with icon */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <div style={{ color: S.p, opacity: 0.7 }}>{ZONE_ICONS[zone.id]}</div>
                      <span style={{ fontSize:12, fontWeight:700, color:S.tx, textTransform:'uppercase', letterSpacing:'0.04em' }}>{zone.label}</span>
                      <span style={{ fontSize:10, color:S.tx4, marginLeft:'auto' }}>{files.length}/4</span>
                    </div>
                    {/* Thumbnails grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                      {files.map((url, i) => {
                        const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
                        return (
                          <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:10, overflow:'hidden' }}>
                            {isVideo ? (
                              <video src={url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            ) : (
                              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            )}
                            <button onClick={() => setBodyPartPhotos(prev => {
                              const arr = [...(prev[zone.id] || [])]; arr.splice(i, 1)
                              return { ...prev, [zone.id]: arr }
                            })} style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:99, background:S.red, border:'1.5px solid '+S.bg, color:'#fff', fontSize:9, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>×</button>
                            {isVideo && <div style={{ position:'absolute', bottom:2, right:2, padding:'1px 4px', borderRadius:4, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:8, fontWeight:600 }}>vid</div>}
                          </div>
                        )
                      })}
                      {canAdd && (
                        <label style={{ aspectRatio:'1', borderRadius:10, border:'1px dashed '+S.pbd, background:S.p3, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                          <input type="file" accept="image/*,video/*" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f || !user) return; e.target.value = ''
                            const isVid = f.type.startsWith('video/')
                            const fileToUpload = isVid ? f : await compressImage(f)
                            const ext = f.name.split('.').pop() || 'jpg'
                            const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
                            const path = `${user.id}/zone_${zone.id}_${ts}.${ext}`
                            const { error } = await supabase.storage.from('avatars').upload(path, fileToUpload, { upsert: false })
                            if (error) { showToast('Upload error', 'error'); return }
                            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                            setBodyPartPhotos(prev => ({ ...prev, [zone.id]: [...(prev[zone.id] || []), publicUrl] }))
                          }} disabled={mediaUploading} style={{ display:'none' }} />
                          <Plus size={16} strokeWidth={1.5} style={{ color:S.p }} />
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:'10px 0 0' }}>{t('profile.zones_filled', { count: Object.keys(bodyPartPhotos).filter(k => (bodyPartPhotos[k]?.length || 0) > 0).length, total: BODY_ZONES.length })}</p>
          </Section>

          {/* Photos & vidéos adultes — Libre (mixed upload) */}
          <Section title={t('profile.adult_free')} color={S.p}>
            <p style={{ fontSize:11, color:S.tx3, margin:'0 0 8px' }}>{t('profile.adult_free_desc')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {[...photosIntime, ...videosIntime].map((url) => {
                const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
                return (
                  <div key={url} style={{ position:'relative', width:80, height:80 }}>
                    {isVideo ? (
                      <video src={url} style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border:'1px solid ' + S.pbd }} />
                    ) : (
                      <img src={url} alt="" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', border:'1px solid ' + S.pbd }} />
                    )}
                    <button onClick={() => { removePhotoIntime(url); removeVideoIntime(url) }} style={{ position:'absolute', top:-6, left:-6, width:20, height:20, borderRadius:99, background:S.red, border:'2px solid ' + S.bg1, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1 }}>×</button>
                    {isVideo && <div style={{ position:'absolute', bottom:4, right:4, padding:'2px 6px', borderRadius:6, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:9, fontWeight:600 }}>video</div>}
                  </div>
                )
              })}
              <label style={{ width:80, height:80, borderRadius:12, border:'1px dashed ' + S.pbd, background:S.p3, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                <input type="file" accept="image/*,video/*" multiple onChange={async (e) => {
                  const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
                  for (const f of captured) {
                    if (f.type.startsWith('video/')) await uploadMedia(f, 'intime', 'video')
                    else await uploadMedia(f, 'intime', 'photo')
                  }
                }} disabled={mediaUploading} style={{ display:'none' }} />
                <ImagePlus size={18} strokeWidth={1.5} style={{ color:S.p }} />
              </label>
            </div>
            <p style={{ fontSize:11, color:S.tx3, margin:0 }}>{t('profile.media_count', { photos: photosIntime.length, videos: videosIntime.length })}</p>
            {mediaUploading && <p style={{ fontSize:12, color:S.p, marginTop:8 }}>{t('profile.upload_in_progress')}</p>}
          </Section>

          <Section title={t('profile.kinks')} color={S.p} badge={kinks.length > 0 ? t('profile.kinks_badge', { count: kinks.length }) : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {kinkOptions.map(k => (
                <Chip key={k.label} label={k.label} active={kinks.includes(k.label)} onClick={() => toggleKink(k.label)} />
              ))}
            </div>
          </Section>

          <Section title={t('profile.health')} color={S.sage} badge={prep === 'Actif' ? t('profile.health_badge_prep') : dernierTest ? t('profile.health_badge_test', { months: monthsAgoCount(dernierTest) }) : undefined}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {prep === 'Actif' && <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:99, background:S.sagebg, color:S.sage, border:'1px solid '+S.sagebd }}>PrEP actif</span>}
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
              <input value={seroStatus} onChange={e => setSeroStatus(e.target.value)} placeholder="Optionnel" style={inputStyle} />
            </div>
          </Section>

          <Section title={t('profile.limits')} color={S.red}>
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
            color: autoSaveStatus === 'saving' ? S.p : autoSaveStatus === 'saved' ? S.sage : S.tx4,
            transition:'color 0.3s',
          }}>
            {autoSaveStatus === 'saving' ? t('profile.autosave_saving') : autoSaveStatus === 'saved' ? t('profile.autosave_saved') : t('profile.autosave_active')}
          </div>
        </div>

    </div>
  )
}
