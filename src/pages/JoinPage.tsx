import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MapPin, Lock, Users, ChevronRight, Ghost } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',red:'#F87171',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

export default function JoinPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [lineup, setLineup] = useState<{ applicant_id: string; avatar_url?: string; display_name?: string; role?: string }[]>([])
  const [hostName, setHostName] = useState<string>('')
  const [hostAvatar, setHostAvatar] = useState<string>('')
  const [myAppStatus, setMyAppStatus] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading'|'found'|'error'>('loading')
  const [profileComplete, setProfileComplete] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [quickApplying, setQuickApplying] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    if (code) lookupSession()
  }, [code])

  async function lookupSession() {
    const { data: sess } = await supabase.from('sessions').select('id,title,description,approx_area,status,host_id,tags').eq('invite_code', code).maybeSingle()
    if (!sess) { setStatus('error'); return }
    setSession(sess)

    if (sess.host_id) {
      const { data: hostProf } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', sess.host_id).maybeSingle()
      if (hostProf?.display_name) setHostName(hostProf.display_name)
      const hAvatar = hostProf?.profile_json ? (hostProf.profile_json as Record<string, unknown>).avatar_url as string : ''
      if (hAvatar) setHostAvatar(hAvatar)
    }

    const { data: accepted } = await supabase.from('applications').select('applicant_id').eq('session_id', sess.id).in('status', ['accepted', 'checked_in'])
    const ids = (accepted || []).map((a: { applicant_id: string }) => a.applicant_id)
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
      setLineup((profiles || []).map((p: { id: string; display_name?: string; profile_json?: { avatar_url?: string; role?: string } }) => ({
        applicant_id: p.id, display_name: p.display_name, avatar_url: p.profile_json?.avatar_url, role: p.profile_json?.role,
      })))
    }

    // Check if current user already applied
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: app } = await supabase.from('applications').select('status').eq('session_id', sess.id).eq('applicant_id', u.id).maybeSingle()
      if (app) setMyAppStatus(app.status)

      // Check if profile is complete enough for 1-tap apply
      const { data: prof } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', u.id).maybeSingle()
      if (prof) {
        setUserProfile(prof)
        const pj = (prof.profile_json || {}) as Record<string, unknown>
        const hasBasics = !!prof.display_name && prof.display_name !== 'Anonymous'
        const hasRole = !!pj.role
        const hasAnyData = hasBasics && (hasRole || !!pj.age || !!pj.bio)
        setProfileComplete(hasAnyData)
      }
    }

    setStatus('found')
  }

  async function quickApply() {
    if (!user || !session || quickApplying) return
    setQuickApplying(true)
    const pj = (userProfile?.profile_json || {}) as Record<string, unknown>
    const allSections = ['photos_profil', 'basics', 'physique', 'photos_adulte', 'role', 'pratiques', 'limites', 'sante', 'occasion']
    const photosProfil = Array.isArray(pj.photos_profil) ? pj.photos_profil : (pj.avatar_url ? [pj.avatar_url] : [])
    const photosAdulte = Array.isArray(pj.photos_intime) ? pj.photos_intime : []
    const videosAdulte = Array.isArray(pj.videos_intime) ? pj.videos_intime : []
    await supabase.from('applications').upsert({
      session_id: session.id, applicant_id: user.id, status: 'pending',
      eps_json: {
        shared_sections: allSections,
        occasion_note: '',
        profile_snapshot: pj,
        role: pj.role || undefined,
        selected_photos_profil: photosProfil,
        selected_photos_adulte: photosAdulte,
        selected_videos_adulte: videosAdulte,
        selected_photos: [...photosProfil, ...photosAdulte],
        selected_videos: videosAdulte,
      }
    })
    setQuickApplying(false)
    navigate('/session/' + session.id)
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: 'Candidature en attente...', color: S.yellow },
    accepted: { text: 'Tu es accepté !', color: S.green },
    checked_in: { text: 'Check-in confirmé', color: S.green },
    rejected: { text: 'Non retenu', color: S.red },
  }

  return (
    <div style={{
      minHeight:'100vh', background:S.bg0,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'24px', 
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle glow background */}
      <div style={{
        position:'absolute', top:'-30%', left:'50%', transform:'translateX(-50%)',
        width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(249,168,168,0.06) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      {status === 'loading' && (
        <div className="animate-fade-in" style={{textAlign:'center'}}>
          <div style={{width:32,height:32,border:'3px solid '+S.p300,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}} />
          <p style={{color:S.tx3,fontSize:14}}>Vérification du lien...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="animate-fade-in" style={{textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:S.red+'14',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Lock size={28} style={{color:S.red}} />
          </div>
          <p style={{color:S.tx,fontWeight:700,fontSize:20,marginBottom:8}}>Lien invalide</p>
          <p style={{color:S.tx3,fontSize:14,marginBottom:24,lineHeight:1.5}}>Ce lien d'invitation n'existe pas ou a expiré</p>
          <button onClick={()=>navigate('/')} style={{padding:'12px 28px',borderRadius:14,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontSize:15}}>Retour</button>
        </div>
      )}

      {status === 'found' && session && (
        <div className="animate-slide-up" style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
          {/* Main card */}
          <div style={{background:S.bg1,borderRadius:24,padding:'28px 24px',border:'1px solid '+S.border,marginBottom:16,boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
            <h1 style={{fontSize:24,fontWeight:800,color:S.tx,textAlign:'center',margin:'0 0 6px',lineHeight:1.2}}>{session.title}</h1>

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:4}}>
              <MapPin size={14} style={{color:S.p300}} />
              <span style={{fontSize:13,color:S.tx3}}>{session.approx_area}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:8}}>
              <Lock size={11} style={{color:'#453F5C'}} />
              <span style={{fontSize:11,color:'#453F5C'}}>Adresse exacte révélée après acceptation</span>
            </div>

            {hostName && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,margin:'0 0 12px'}}>
                {hostAvatar ? (
                  <img src={hostAvatar} alt="" style={{width:22,height:22,borderRadius:'28%',objectFit:'cover',border:'1px solid #2A2740'}} />
                ) : (
                  <div style={{width:22,height:22,borderRadius:'28%',background:'#F9A8A822',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#F9A8A8',fontWeight:700}}>{hostName[0]}</div>
                )}
                <span style={{fontSize:12,color:S.tx3}}>par <span style={{color:S.p300,fontWeight:600}}>{hostName}</span></span>
              </div>
            )}

            {session.description && (
              <p style={{fontSize:13,color:S.tx2,textAlign:'center',margin:'0 0 16px',lineHeight:1.5}}>{session.description}</p>
            )}

            {session.tags && session.tags.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:16}}>
                {session.tags.map((tag: string) => (
                  <span key={tag} style={{fontSize:12,fontWeight:600,color:S.p300,padding:'4px 12px',borderRadius:99,background:S.p300+'14',border:'1px solid '+S.p300+'33'}}>{tag}</span>
                ))}
              </div>
            )}

            {/* Lineup */}
            {lineup.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:10}}>
                  <Users size={14} style={{color:S.tx3}} />
                  <span style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Lineup · {lineup.length}</span>
                </div>
                <div className="stagger-children" style={{display:'flex',flexDirection:'column',gap:6}}>
                  {lineup.slice(0, 5).map((m) => (
                    <div key={m.applicant_id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:S.bg0+'cc',borderRadius:12,border:'1px solid '+S.border}}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" style={{width:36,height:36,borderRadius:'28%',objectFit:'cover',border:'1px solid '+S.border,flexShrink:0}} />
                      ) : (
                        <div style={{width:36,height:36,borderRadius:'28%',background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                          {(m.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:13,fontWeight:600,color:S.tx}}>{m.display_name || 'Anonyme'}</p>
                        {m.role && <p style={{margin:0,fontSize:11,color:S.p300}}>{m.role}</p>}
                      </div>
                      <ChevronRight size={14} style={{color:S.tx4,flexShrink:0}} />
                    </div>
                  ))}
                  {lineup.length > 5 && <p style={{fontSize:12,color:S.tx3,textAlign:'center',margin:'4px 0 0'}}>+{lineup.length - 5} autres</p>}
                </div>
              </div>
            )}

            {/* Locked address */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:S.bg0+'cc',borderRadius:12,border:'1px solid '+S.border}}>
              <Lock size={14} style={{color:S.tx4,flexShrink:0}} />
              <p style={{fontSize:12,color:S.tx3,margin:0}}>Adresse révélée après acceptation</p>
            </div>
          </div>

          {/* CTAs */}
          {myAppStatus ? (
            <div style={{textAlign:'center'}}>
              <div style={{
                padding:'14px 20px', borderRadius:14, marginBottom:10,
                background: statusLabels[myAppStatus]?.color + '14',
                border: '1px solid ' + (statusLabels[myAppStatus]?.color || S.border) + '44',
              }}>
                <p style={{margin:0,fontSize:15,fontWeight:700,color:statusLabels[myAppStatus]?.color || S.tx}}>
                  {statusLabels[myAppStatus]?.text || myAppStatus}
                </p>
              </div>
              <button onClick={() => navigate('/session/' + session.id)} style={{
                width:'100%',padding:'14px',borderRadius:14,fontWeight:600,fontSize:14,
                color:S.tx2,border:'1px solid '+S.border,background:'transparent',cursor:'pointer',
              }}>
                Voir la session
              </button>
            </div>
          ) : !user ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={() => navigate('/me?next=/join/' + code)} style={{
                width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
                color:'#fff',background:S.grad,border:'none',cursor:'pointer',
                boxShadow:'0 4px 24px rgba(244,114,114,0.3)',
              }}>
                Postuler →
              </button>
              <button onClick={() => {
                navigate('/ghost/setup?session_id=' + session.id + (code ? '&invite_code=' + code : ''))
              }} style={{
                width:'100%',padding:'14px',borderRadius:14,fontWeight:600,fontSize:14,
                color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              }}>
                <Ghost size={16} /> Sans compte (24h)
              </button>
            </div>
          ) : profileComplete ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={quickApply} disabled={quickApplying} style={{
                width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
                color:'#fff',background:S.grad,border:'none',cursor:quickApplying?'not-allowed':'pointer',
                boxShadow:'0 4px 24px rgba(244,114,114,0.3)',opacity:quickApplying?0.7:1,
              }}>
                {quickApplying ? 'Envoi...' : 'Postuler →'}
              </button>
              <button onClick={() => navigate('/session/' + session.id + '/apply')} style={{
                width:'100%',padding:'12px',borderRadius:14,fontWeight:600,fontSize:13,
                color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer',
              }}>
                Personnaliser ma candidature
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/session/' + session.id + '/apply')} style={{
              width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
              color:'#fff',background:S.grad,border:'none',cursor:'pointer',
              boxShadow:'0 4px 24px rgba(244,114,114,0.3)',
            }}>
              Postuler →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
