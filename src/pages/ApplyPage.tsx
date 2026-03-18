import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { User, Drama, Dumbbell, Flame, Heart, ShieldOff, Camera, Zap, Eye, ArrowLeft } from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'

const S = colors

const ROLE_OPTIONS = ['Top', 'Bottom', 'Versa', 'Side']

type Section = { id: string; label: string; icon: typeof Camera; desc: string }

const BLOC_PROFIL: Section[] = [
  {id:'photos_profil',label:'Photos profil',icon:Camera,desc:'visage, corps'},
  {id:'basics',label:'Pseudo, âge, location',icon:User,desc:'qui tu es en bref'},
  {id:'physique',label:'Physique',icon:Dumbbell,desc:'taille, poids, morphologie'},
]

const BLOC_ADULTE: Section[] = [
  {id:'photos_adulte',label:'Photos & vidéos adultes',icon:Eye,desc:'contenu NSFW'},
  {id:'role',label:'Rôle',icon:Drama,desc:'top, bottom, versa, side'},
  {id:'pratiques',label:'Pratiques',icon:Flame,desc:'kinks & pratiques'},
  {id:'limites',label:'Limites',icon:ShieldOff,desc:'hard limits, no-go'},
  {id:'sante',label:'Santé / PrEP',icon:Heart,desc:'PrEP, dernier test'},
]

const SECTION_OCCASION: Section = {id:'occasion',label:'Note pour la session',icon:Zap,desc:'message au host, dispo...'}

const ALL_SECTIONS = [...BLOC_PROFIL, ...BLOC_ADULTE, SECTION_OCCASION]

const GUEST_TOKEN_KEY = 'guest_token'
const GUEST_SESSION_KEY = 'guest_session_id'

export default function ApplyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const guestTokenParam = searchParams.get('guest_token')
  const ghostIdParam = searchParams.get('ghost_id') || (typeof localStorage !== 'undefined' ? localStorage.getItem('ghost_id') : null)
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [enabled, setEnabled] = useState<string[]>(ALL_SECTIONS.map(s => s.id))
  const [selectedPhotosProfil, setSelectedPhotosProfil] = useState<string[]>([])
  const [selectedPhotosAdulte, setSelectedPhotosAdulte] = useState<string[]>([])
  const [selectedVideosAdulte, setSelectedVideosAdulte] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [note, setNote] = useState('')
  const [messageToHost, setMessageToHost] = useState('')
  const [step, setStep] = useState<'pack'|'note'|'done'>('pack')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null)
  const [guestMode, setGuestMode] = useState(false)
  const [guestDisplayName, setGuestDisplayName] = useState('')
  const [ghostSessionId, setGhostSessionId] = useState<string | null>(null)

  const RATE_LIMIT_MIN = 5
  const isRateLimited = rateLimitedUntil ? new Date() < rateLimitedUntil : false
  const invalidPseudo = guestMode ? (guestDisplayName.trim().length < 2) : (!profile?.display_name || (profile.display_name as string).trim().length < 2)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        setDataLoading(true)
        load(u.id)
      } else if (ghostIdParam) {
        // Ghost 24h mode — load profile from ghost_sessions
        setGuestMode(true)
        setGhostSessionId(ghostIdParam)
        setDataLoading(true)
        Promise.all([
          supabase.from('ghost_sessions').select('display_name, profile_json').eq('id', ghostIdParam).maybeSingle(),
          supabase.from('sessions').select('title,approx_area').eq('id', id).maybeSingle(),
        ]).then(([{ data: ghost }, { data: sess }]) => {
          if (ghost) {
            setGuestDisplayName(ghost.display_name || '')
            const pj = ghost.profile_json || {}
            setProfile({ display_name: ghost.display_name, profile_json: pj })
            if (pj.role) setSelectedRole(pj.role)
            // Pre-check sections that have data
            const hasSections: string[] = ['basics', 'occasion']
            if (pj.role) hasSections.push('role')
            if (pj.height || pj.weight || pj.morphology) hasSections.push('physique')
            if (pj.kinks?.length) hasSections.push('pratiques')
            if (pj.prep_status || pj.health?.prep_status) hasSections.push('sante')
            if (pj.limits) hasSections.push('limites')
            if (pj.photos_profil?.length) hasSections.push('photos_profil')
            if (pj.photos_intime?.length || pj.videos_intime?.length) hasSections.push('photos_adulte')
            setEnabled(hasSections)
          } else {
            setEnabled(['basics', 'role', 'occasion'])
          }
          setSession(sess ?? null)
          setDataLoading(false)
        })
      } else {
        try {
          const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_TOKEN_KEY) : null
          const storedSession = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_SESSION_KEY) : null
          if (guestTokenParam && stored === guestTokenParam && storedSession === id) {
            setGuestMode(true)
            setEnabled(['basics', 'role', 'occasion'])
            setDataLoading(true)
            supabase.from('sessions').select('title,approx_area').eq('id', id).maybeSingle().then(({ data: sess }) => {
              setSession(sess ?? null)
              setDataLoading(false)
            })
          } else setDataLoading(false)
        } catch {
          setDataLoading(false)
        }
      }
    })
  }, [id, guestTokenParam, ghostIdParam])

  async function load(uid: string) {
    setLoadError(false)
    try {
      const [{ data: prof }, { data: sess }, { data: lastApp }, { data: existingApp }] = await Promise.all([
        supabase.from('user_profiles').select('display_name,profile_json').eq('id', uid).maybeSingle(),
        supabase.from('sessions').select('title,approx_area').eq('id', id).maybeSingle(),
        supabase.from('applications').select('created_at').eq('applicant_id', uid).order('created_at', { ascending: false }).limit(1),
        supabase.from('applications').select('status').eq('applicant_id', uid).eq('session_id', id).maybeSingle(),
      ])
      // Already applied to this session → redirect
      if (existingApp) {
        navigate('/session/' + id)
        return
      }
      if (prof) {
        setProfile(prof)
        // Pre-fill role from profile
        if (prof.profile_json?.role && !selectedRole) {
          setSelectedRole(prof.profile_json.role)
        }
        // Smart pre-check: only enable sections with actual data
        const pj = prof.profile_json || {}
        const filled: string[] = ['occasion']
        if (prof.display_name || pj.age || pj.bio || pj.location) filled.push('basics')
        if (pj.role) filled.push('role')
        if (pj.height || pj.weight || pj.morphology) filled.push('physique')
        if (Array.isArray(pj.kinks) && pj.kinks.length > 0) filled.push('pratiques')
        if (pj.health?.prep_status || pj.health?.dernier_test) filled.push('sante')
        if (pj.limits) filled.push('limites')
        // Photos profil
        const pprofil = Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : [])
        if (pprofil.length > 0) filled.push('photos_profil')
        // Photos adulte
        const padulte = Array.isArray(pj.photos_intime) ? pj.photos_intime : []
        const vadulte = Array.isArray(pj.videos_intime) ? pj.videos_intime : (Array.isArray(pj.videos) ? pj.videos : [])
        if (padulte.length > 0 || vadulte.length > 0) filled.push('photos_adulte')
        setEnabled(filled)
        // Pre-select all media
        setSelectedPhotosProfil(pprofil)
        setSelectedPhotosAdulte(padulte)
        setSelectedVideosAdulte(vadulte)
      }
      if (sess) setSession(sess)
      const lastRow = Array.isArray(lastApp) ? lastApp?.[0] : lastApp
      if (lastRow?.created_at) {
        const created = new Date(lastRow.created_at)
        const until = new Date(created.getTime() + RATE_LIMIT_MIN * 60 * 1000)
        if (until > new Date()) setRateLimitedUntil(until)
      }
    } catch {
      setLoadError(true)
    } finally {
      setDataLoading(false)
    }
  }

  function toggle(sid: string) {
    setEnabled(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  async function submit() {
    if (isRateLimited) return
    if (guestMode) {
      if (guestDisplayName.trim().length < 2) return
      setLoading(true)

      // Save ghost profile data to ghost_sessions (if ghost 24h mode)
      const ghostProfile = profile?.profile_json || {}
      if (ghostSessionId) {
        await supabase.from('ghost_sessions').update({
          display_name: guestDisplayName.trim(),
          profile_json: { ...ghostProfile, role: selectedRole || undefined },
        }).eq('id', ghostSessionId)
      }

      const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
      if (anonErr) { setLoading(false); return }
      const anonUser = anonData?.user
      if (!anonUser) { setLoading(false); return }
      await supabase.from('user_profiles').upsert({
        id: anonUser.id,
        display_name: guestDisplayName.trim(),
        profile_json: { role: selectedRole || undefined, ...ghostProfile },
      })
      const snapshot = ghostProfile.role || ghostProfile.age ? ghostProfile : { display_name: guestDisplayName.trim(), role: selectedRole || undefined }
      await supabase.from('applications').upsert({
        session_id: id,
        applicant_id: anonUser.id,
        status: 'pending',
        ghost_session_id: ghostSessionId || undefined,
        eps_json: {
          shared_sections: enabled,
          occasion_note: note,
          message: messageToHost.trim() || undefined,
          profile_snapshot: snapshot,
          role: selectedRole || undefined,
          is_phantom: true,
          selected_photos_profil: enabled.includes('photos_profil') ? selectedPhotosProfil : [],
          selected_photos_adulte: enabled.includes('photos_adulte') ? selectedPhotosAdulte : [],
          selected_videos_adulte: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
          selected_photos: [...(enabled.includes('photos_profil') ? selectedPhotosProfil : []), ...(enabled.includes('photos_adulte') ? selectedPhotosAdulte : [])],
          selected_videos: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
        },
      })
      try { localStorage.removeItem(GUEST_TOKEN_KEY); localStorage.removeItem(GUEST_SESSION_KEY) } catch (_) {}
      setLoading(false)
      navigate('/session/' + id)
      return
    }
    if (!user) return
    setLoading(true)
    await supabase.from('applications').upsert({
      session_id: id, applicant_id: user.id, status: 'pending',
      eps_json: {
        shared_sections: enabled,
        occasion_note: note,
        message: messageToHost.trim() || undefined,
        profile_snapshot: profile?.profile_json || {},
        role: selectedRole || undefined,
        selected_photos_profil: enabled.includes('photos_profil') ? selectedPhotosProfil : [],
        selected_photos_adulte: enabled.includes('photos_adulte') ? selectedPhotosAdulte : [],
        selected_videos_adulte: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
        // Backward compat
        selected_photos: [...(enabled.includes('photos_profil') ? selectedPhotosProfil : []), ...(enabled.includes('photos_adulte') ? selectedPhotosAdulte : [])],
        selected_videos: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
      }
    })
    setLoading(false)
    // Notify the host
    if (id) {
      const { data: sess } = await supabase.from('sessions').select('host_id, title').eq('id', id).maybeSingle()
      if (sess?.host_id && user) {
        const name = profile?.display_name || user.email || 'Quelqu\'un'
        await supabase.from('notifications').insert({
          user_id: sess.host_id,
          session_id: id,
          type: 'new_application',
          title: '📩 Nouvelle candidature',
          body: name + ' a postulé pour "' + (sess.title || 'ta session') + '"',
          href: '/session/' + id + '/host',
        })
      }
    }
    showToast('Candidature envoyée !', 'success')
    navigate('/session/' + id)
  }

  if (!user && !guestMode) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:24}}>
        <p style={{color:S.tx3,marginBottom:16}}>Connecte-toi pour postuler</p>
        <button onClick={() => navigate('/login?next=' + encodeURIComponent('/session/' + id + '/apply'))} style={{padding:'12px 24px',borderRadius:12,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>Se connecter</button>
      </div>
    </div>
  )
  if (dataLoading) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <div style={{ width: 32, height: 32, border: "3px solid "+S.pbd, borderTopColor: S.p, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <p style={{color:S.red,textAlign:'center'}}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,position:'relative'}}>
      <OrbLayer />
      <EventContextNav role="candidate" sessionTitle={session?.title} />
      <div style={{padding:'12px 20px 16px',borderBottom:'1px solid ' + S.rule, background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)'}}>
        <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 4px',fontFamily:"'Bricolage Grotesque', sans-serif"}}>Ma candidature</h1>
        {session && <p style={{fontSize:13,color:S.tx3,margin:0}}>{session.approx_area}</p>}
      </div>

      {(profile || guestMode) && (
        <div style={{margin:'12px 20px',padding:12,borderRadius:14,background:S.bg1,border:'1px solid '+S.rule}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Aperçu de ton profil (ce qui sera partagé)</div>
          {guestMode ? (
            <input value={guestDisplayName} onChange={e=>setGuestDisplayName(e.target.value)} placeholder="Ton pseudo *" style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:10,padding:'10px 14px',border:'1px solid '+S.rule,fontSize:14,marginBottom:8,boxSizing:'border-box'}} />
          ) : (
            <div style={{fontSize:14,fontWeight:600,color:S.tx,marginBottom:4}}>{profile?.display_name || 'Anonyme'}</div>
          )}
          {(selectedRole || (profile?.profile_json as any)?.role || (profile?.profile_json as any)?.bio) && !guestMode && (
            <div style={{fontSize:13,color:S.tx2,lineHeight:1.4}}>
              {(selectedRole || (profile?.profile_json as any)?.role) && (
                <span style={{color:S.p,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.p+'22',border:'1px solid '+S.p+'44',marginRight:6}}>
                  {selectedRole || (profile?.profile_json as any)?.role}
                </span>
              )}
              {(profile?.profile_json as any)?.bio && ((profile?.profile_json as any).bio as string).slice(0, 80)}{((profile?.profile_json as any)?.bio as string)?.length > 80 ? '…' : ''}
            </div>
          )}
          {guestMode && (selectedRole || guestDisplayName) && (
            <div style={{fontSize:13,color:S.tx2}}>
              {guestDisplayName && <span style={{fontWeight:600,color:S.tx}}>{guestDisplayName}</span>}
              {selectedRole && <span style={{color:S.p,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.p+'22',marginLeft:6}}>{selectedRole}</span>}
            </div>
          )}
        </div>
      )}

      {isRateLimited && rateLimitedUntil && (
        <div style={{margin:'12px 20px',padding:14,borderRadius:14,background:S.red+'18',border:'1px solid '+S.red+'44'}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:S.red}}>Tu as déjà postulé récemment.</p>
          <p style={{margin:'4px 0 0',fontSize:13,color:S.tx2}}>Réessaye dans {Math.ceil((rateLimitedUntil.getTime() - Date.now()) / 60000)} min.</p>
        </div>
      )}

      <div style={{display:'flex',padding:'12px 20px',gap:6}}>
        {(['pack','note','done'] as const).map((s, i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:(['pack','note','done'].indexOf(step) >= i) ? S.p : S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {step === 'pack' && (
        <div style={{padding:'8px 20px 24px'}}>
          <div style={{marginBottom:16}}>
            <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Ton Candidate Pack</h2>
            <p style={{fontSize:13,color:S.tx3,margin:0}}>Choisis ce que tu partages avec le host</p>
          </div>
          {!guestMode && profile && (() => {
            const pj = profile.profile_json || {}
            const missing: string[] = []
            if (!pj.avatar_url) missing.push('photo')
            if (!pj.role) missing.push('rôle')
            if (!pj.age && !pj.bio) missing.push('bio/âge')
            if (!pj.height && !pj.weight) missing.push('physique')
            if (missing.length === 0) return null
            return (
              <button type="button" onClick={() => navigate('/me')} style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, marginBottom: 14,
                background: S.p2, border: '1px solid #FBBF2444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, color: S.orange }}>!</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: S.p }}>Profil incomplet</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: S.tx2 }}>Manque : {missing.join(', ')}. Complète-le pour plus de chances !</p>
                </div>
              </button>
            )
          })()}
          <div style={{marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Votre rôle</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {ROLE_OPTIONS.map(role => {
                const on = selectedRole === role
                return (
                  <button key={role} type="button" onClick={() => setSelectedRole(on ? '' : role)} style={{
                    padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,
                    border:on?'none':'1px solid '+S.rule,
                    background:on?S.grad:S.bg2,color:on?'#fff':S.tx3,cursor:'pointer',
                  }}>{role}</button>
                )
              })}
            </div>
          </div>
          {/* Helper: render a section row */}
          {(() => {
            const pj = profile?.profile_json || {}
            function getPreview(secId: string) {
              if (guestMode || !pj) return ''
              switch (secId) {
                case 'basics': return [pj.age ? pj.age + ' ans' : '', pj.location].filter(Boolean).join(' · ')
                case 'role': return pj.role || selectedRole || ''
                case 'physique': return [pj.height ? pj.height + 'cm' : '', pj.weight ? pj.weight + 'kg' : '', pj.morphology].filter(Boolean).join(' · ')
                case 'pratiques': return Array.isArray(pj.kinks) && pj.kinks.length > 0 ? pj.kinks.slice(0, 3).join(', ') + (pj.kinks.length > 3 ? ' +' + (pj.kinks.length - 3) : '') : ''
                case 'sante': return pj.health?.prep_status ? 'PrEP ' + pj.health.prep_status : ''
                case 'limites': return pj.limits ? pj.limits.slice(0, 40) + (pj.limits.length > 40 ? '…' : '') : ''
                case 'photos_profil': { const pp = Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : []); return pp.length > 0 ? `${selectedPhotosProfil.length}/${pp.length}` : '' }
                case 'photos_adulte': { const pa = Array.isArray(pj.photos_intime) ? pj.photos_intime : []; const va = Array.isArray(pj.videos_intime) ? pj.videos_intime : []; const t = selectedPhotosAdulte.length + selectedVideosAdulte.length; return (pa.length + va.length) > 0 ? `${t}/${pa.length + va.length}` : '' }
                default: return ''
              }
            }

            function renderSection(sec: Section) {
              const on = enabled.includes(sec.id)
              const preview = getPreview(sec.id)
              return (
                <div key={sec.id} onClick={() => toggle(sec.id)} style={{
                  background: on ? S.p + '10' : S.bg1,
                  border: '1px solid ' + (on ? S.p + '55' : S.rule),
                  borderRadius:14,padding:'12px 14px',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.2s',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                    <sec.icon size={18} style={{color:on?S.p:S.tx4,flexShrink:0}} />
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:14,fontWeight:600,color:on?S.tx:S.tx3}}>{sec.label}</p>
                      {on && preview ? (
                        <p style={{margin:0,fontSize:12,color:S.p,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{preview}</p>
                      ) : (
                        <p style={{margin:0,fontSize:11,color:S.tx4}}>{sec.desc}</p>
                      )}
                    </div>
                  </div>
                  <div style={{width:20,height:20,borderRadius:99,background:on?S.grad:'transparent',border:on?'none':'2px solid '+S.rule,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {on && <span style={{color:'#fff',fontSize:11,fontWeight:800}}>✓</span>}
                  </div>
                </div>
              )
            }

            function renderBlocToggle(label: string, sections: Section[], color: string) {
              const allOn = sections.every(s => enabled.includes(s.id))
              const someOn = sections.some(s => enabled.includes(s.id))
              return (
                <button type="button" onClick={() => {
                  const ids = sections.map(s => s.id)
                  if (allOn) setEnabled(prev => prev.filter(x => !ids.includes(x)))
                  else setEnabled(prev => [...new Set([...prev, ...ids])])
                }} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',
                  padding:'10px 14px',borderRadius:12,cursor:'pointer',border:'none',
                  background: someOn ? color + '14' : S.bg2,
                }}>
                  <span style={{fontSize:13,fontWeight:700,color: someOn ? color : S.tx3}}>{label}</span>
                  <span style={{fontSize:11,fontWeight:600,color: someOn ? color : S.tx4}}>
                    {allOn ? 'Tout activé' : someOn ? 'Partiel' : 'Désactivé'}
                  </span>
                </button>
              )
            }

            // Sub-selection for photos profil
            function renderPhotoSubSelection(albumKey: 'profil' | 'adulte') {
              const enabledKey = albumKey === 'profil' ? 'photos_profil' : 'photos_adulte'
              if (!enabled.includes(enabledKey) || guestMode) return null
              const allP: string[] = albumKey === 'profil'
                ? (Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : []))
                : (Array.isArray(pj.photos_intime) ? pj.photos_intime : [])
              const allV: string[] = albumKey === 'adulte' ? (Array.isArray(pj.videos_intime) ? pj.videos_intime : (Array.isArray(pj.videos) ? pj.videos : [])) : []
              if (allP.length + allV.length === 0) return null
              const selP = albumKey === 'profil' ? selectedPhotosProfil : selectedPhotosAdulte
              const setSelP = albumKey === 'profil' ? setSelectedPhotosProfil : setSelectedPhotosAdulte
              const selV = selectedVideosAdulte
              const setSelV = setSelectedVideosAdulte
              const accentColor = albumKey === 'profil' ? S.p : S.p
              return (
                <div style={{marginTop:6,marginLeft:28,padding:10,background:S.bg1,borderRadius:12,border:'1px solid '+accentColor+'33'}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {allP.map((url: string) => {
                      const on = selP.includes(url)
                      return (
                        <button key={url} type="button" onClick={() => setSelP((prev: string[]) => on ? prev.filter(p => p !== url) : [...prev, url])} style={{position:'relative',width:52,height:52,padding:0,border:on ? '2px solid '+accentColor : '1px solid '+S.rule,borderRadius:8,overflow:'hidden',cursor:'pointer',background:'none',opacity:on?1:0.35,transition:'opacity 0.15s'}}>
                          <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                          {on && <div style={{position:'absolute',top:1,right:1,width:14,height:14,borderRadius:99,background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',fontWeight:800}}>✓</div>}
                        </button>
                      )
                    })}
                    {allV.map((url: string) => {
                      const on = selV.includes(url)
                      return (
                        <button key={url} type="button" onClick={() => setSelV((prev: string[]) => on ? prev.filter(v => v !== url) : [...prev, url])} style={{position:'relative',width:66,height:52,padding:0,border:on ? '2px solid '+accentColor : '1px solid '+S.rule,borderRadius:8,overflow:'hidden',cursor:'pointer',background:'none',opacity:on?1:0.35,transition:'opacity 0.15s'}}>
                          <video src={url} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                          {on && <div style={{position:'absolute',top:1,right:1,width:14,height:14,borderRadius:99,background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',fontWeight:800}}>✓</div>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return (
              <>
                {/* BLOC PROFIL */}
                {renderBlocToggle('Profil', BLOC_PROFIL, S.sage)}
                <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6,marginBottom:16}}>
      <OrbLayer />
                  {BLOC_PROFIL.map(sec => (
                    <div key={sec.id}>
                      {renderSection(sec)}
                      {sec.id === 'photos_profil' && renderPhotoSubSelection('profil')}
                    </div>
                  ))}
                </div>

                {/* BLOC ADULTE */}
                {renderBlocToggle('Adulte', BLOC_ADULTE, S.p)}
                <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6,marginBottom:16}}>
                  {BLOC_ADULTE.map(sec => (
                    <div key={sec.id}>
                      {renderSection(sec)}
                      {sec.id === 'photos_adulte' && renderPhotoSubSelection('adulte')}
                    </div>
                  ))}
                </div>

                {/* OCCASION (hors bloc) */}
                {renderSection(SECTION_OCCASION)}
              </>
            )
          })()}

          {invalidPseudo && <p style={{fontSize:13,color:S.red,marginTop:8,marginBottom:0}}>Ton pseudo est requis</p>}
          <div style={{marginTop:12,padding:'10px 14px',background:S.bg1,borderRadius:12,border:'1px solid '+S.rule}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}><span style={{color:S.p,fontWeight:700}}>{enabled.length}/{ALL_SECTIONS.length}</span> sections partagées</p>
          </div>
          <button onClick={() => setStep('note')} disabled={isRateLimited || invalidPseudo || (guestMode && guestDisplayName.trim().length < 2)} style={{width:'100%',marginTop:14,padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:isRateLimited||invalidPseudo?'not-allowed':'pointer',opacity:isRateLimited||invalidPseudo?0.5:1,boxShadow:'0 4px 20px ' + S.pbd}}>
            Continuer →
          </button>
        </div>
      )}

      {step === 'note' && (
        <div style={{padding:'16px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Pour cette session</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 8px'}}>Un mot pour le host ? Dispo, ambiance...</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder='Dispo à partir de 22h30...' rows={3} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:14,padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',fontSize:14,fontFamily:'inherit',resize:'none',boxSizing:'border-box',lineHeight:1.5,marginBottom:12}} />
          <div style={{marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 6px'}}>Message au host (optionnel)</p>
            <textarea value={messageToHost} onChange={e => setMessageToHost(e.target.value)} placeholder='Un message pour le host...' rows={2} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:14,padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',fontSize:14,fontFamily:'inherit',resize:'none',boxSizing:'border-box',lineHeight:1.5}} />
          </div>
          {/* Visual preview */}
          <div style={{padding:'14px',background:S.bg1,borderRadius:14,border:'1px solid '+S.rule,marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:S.p,margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Ce que le host verra</p>
            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
              {profile?.profile_json?.avatar_url ? (
                <img src={profile.profile_json.avatar_url} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',border:'1px solid '+S.rule}} />
              ) : (
                <div style={{width:40,height:40,borderRadius:'50%',background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>{(profile?.display_name || '?')[0].toUpperCase()}</div>
              )}
              <div>
                <p style={{margin:0,fontSize:14,fontWeight:700,color:S.tx}}>{guestMode ? guestDisplayName || 'Invité' : profile?.display_name || 'Anonyme'}</p>
                <div style={{display:'flex',gap:6,marginTop:2}}>
                  {selectedRole && <span style={{fontSize:11,color:S.p,fontWeight:600}}>{selectedRole}</span>}
                  {profile?.profile_json?.age && enabled.includes('basics') && <span style={{fontSize:11,color:S.tx3}}>{profile.profile_json.age} ans</span>}
                </div>
              </div>
            </div>
            {selectedPhotosProfil.length > 0 && enabled.includes('photos_profil') && (
              <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:8}}>
                {selectedPhotosProfil.slice(0,3).map((url: string, i: number) => (
                  <img key={i} src={url} alt="" style={{width:56,height:72,borderRadius:10,objectFit:'cover',border:'1px solid '+S.rule,flexShrink:0}} />
                ))}
                {selectedPhotosProfil.length > 3 && <span style={{fontSize:11,color:S.tx4,alignSelf:'center'}}>+{selectedPhotosProfil.length-3}</span>}
              </div>
            )}
            <p style={{fontSize:12,color:S.tx3,margin:0}}>{enabled.length} section{enabled.length > 1 ? 's' : ''} : {enabled.map(sid => ALL_SECTIONS.find(s => s.id === sid)?.label).filter(Boolean).join(', ') || '—'}</p>
          </div>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <button onClick={() => setStep('pack')} style={{flex:1,padding:'13px',borderRadius:14,fontWeight:600,fontSize:14,color:S.tx2,border:'1px solid '+S.rule,background:S.bg2,cursor:'pointer'}}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
            <button onClick={submit} disabled={loading || isRateLimited || (guestMode && guestDisplayName.trim().length < 2)} style={{flex:2,padding:'13px',borderRadius:14,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',cursor:loading||isRateLimited?'not-allowed':'pointer',opacity:loading||isRateLimited?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {loading ? <><span style={{display:'inline-block',width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /> Envoi...</> : isRateLimited ? 'Attends quelques minutes' : 'Envoyer ma candidature'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}