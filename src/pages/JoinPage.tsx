import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MapPin, Lock, Users, ChevronRight, Ghost, Shield } from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'
import { getSessionCover } from '../lib/sessionCover'

const S = colors

export default function JoinPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDirect = searchParams.get('direct') === '1'
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [lineup, setLineup] = useState<{ applicant_id: string; avatar_url?: string; display_name?: string; role?: string; photos?: string[]; bio?: string; kinks_count?: number; prep?: string }[]>([])
  const [hostName, setHostName] = useState<string>('')
  const [hostAvatar, setHostAvatar] = useState<string>('')
  const [myAppStatus, setMyAppStatus] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading'|'found'|'error'>('loading')
  const [profileComplete, setProfileComplete] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [quickApplying, setQuickApplying] = useState(false)
  const [directJoining, setDirectJoining] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    if (code) lookupSession()
  }, [code])

  async function lookupSession() {
    const { data: sess } = await supabase.from('sessions').select('id,title,description,approx_area,status,host_id,tags,max_capacity').eq('invite_code', code).maybeSingle()
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
      setLineup((profiles || []).map((p: { id: string; display_name?: string; profile_json?: { avatar_url?: string; role?: string; photos_profil?: string[]; photos?: string[]; bio?: string; kinks?: string[]; prep?: string } }) => ({
        applicant_id: p.id, display_name: p.display_name, avatar_url: p.profile_json?.avatar_url, role: p.profile_json?.role,
        photos: Array.isArray(p.profile_json?.photos_profil) ? p.profile_json!.photos_profil : Array.isArray(p.profile_json?.photos) ? p.profile_json!.photos : p.profile_json?.avatar_url ? [p.profile_json.avatar_url] : [],
        bio: p.profile_json?.bio, kinks_count: Array.isArray(p.profile_json?.kinks) ? p.profile_json!.kinks.length : 0,
        prep: p.profile_json?.prep,
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

  // Invite directe — auto-accept sans vote
  async function directJoin() {
    if (!user || !session || directJoining) return
    setDirectJoining(true)
    const pj = (userProfile?.profile_json || {}) as Record<string, unknown>
    const allSections = ['photos_profil', 'basics', 'physique', 'photos_adulte', 'role', 'pratiques', 'limites', 'sante', 'occasion']
    await supabase.from('applications').upsert({
      session_id: session.id, applicant_id: user.id, status: 'accepted',
      eps_json: {
        shared_sections: allSections,
        profile_snapshot: pj,
        role: pj.role || undefined,
        direct_invite: true,
      }
    })
    // Notify host
    if (session.host_id) {
      const name = userProfile?.display_name || user.email || 'Quelqu\'un'
      await supabase.from('notifications').insert({
        user_id: session.host_id,
        session_id: session.id,
        type: 'direct_join',
        title: `${name} a rejoint (invite directe)`,
        body: t('host.auto_accepted'),
        href: `/session/${session.id}/host`,
      })
    }
    setDirectJoining(false)
    navigate('/session/' + session.id)
  }

  // Auto-trigger direct join when ready
  useEffect(() => {
    if (isDirect && user && session && !myAppStatus && !directJoining) {
      directJoin()
    }
  }, [isDirect, user, session, myAppStatus])

  // Direct join loading screen
  if (isDirect && directJoining) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid '+S.pbd, borderTopColor: S.p, animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
      <p style={{ color: S.tx2, fontSize: 15, fontWeight: 600 }}>{t('join.joining')}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // Direct invite but not logged in → redirect to login
  if (isDirect && !user && status === 'found') {
    navigate('/login?next=/join/' + code + '%3Fdirect%3D1')
    return null
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: t('join.status_pending'), color: S.orange },
    accepted: { text: t('join.status_accepted'), color: S.sage },
    checked_in: { text: 'check_in_confirmed', color: S.sage },
    rejected: { text: t('status.not_retained'), color: S.red },
  }

  return (
    <div style={{
      minHeight:'100vh', background:S.bg,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'24px', maxWidth:480, margin:'0 auto',
      position: 'relative', overflow: 'hidden',
    }}>
      <OrbLayer />
      {/* Subtle glow background */}
      <div style={{
        position:'absolute', top:'-30%', left:'50%', transform:'translateX(-50%)',
        width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(224,136,122,0.04) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      {status === 'loading' && (
        <div className="animate-fade-in" style={{textAlign:'center'}}>
          <div style={{width:32,height:32,border:'3px solid '+S.p,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}} />
          <p style={{color:S.tx3,fontSize:14}}>{t('session.verifying_link')}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="animate-fade-in" style={{textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:S.redbg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Lock size={28} style={{color:S.red}} />
          </div>
          <p style={{color:S.tx,fontWeight:700,fontSize:20,marginBottom:8}}>{t('session.invalid_link')}</p>
          <p style={{color:S.tx3,fontSize:14,marginBottom:24,lineHeight:1.5}}>{t('session.invalid_link_desc')}</p>
          <button onClick={()=>navigate('/')} style={{padding:'12px 28px',borderRadius:14,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontSize:15}}>{t('common.back')}</button>
        </div>
      )}

      {status === 'found' && session && (
        <div className="animate-slide-up" style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
          {/* Cover gradient */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:180,borderRadius:'24px 24px 0 0',overflow:'hidden',zIndex:0}}>
            <div style={{position:'absolute',inset:0,background:getSessionCover(session.tags).bg}} />
            <div style={{position:'absolute',width:200,height:200,top:-80,right:-40,borderRadius:'50%',filter:'blur(60px)',background:getSessionCover(session.tags).overlay}} />
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:120,background:`linear-gradient(to top, rgba(22,20,31,0.95) 10%, transparent)`}} />
          </div>

          {/* Photo strip of members */}
          {lineup.some(m => m.photos && m.photos.length > 0) && (
            <div style={{position:'relative',zIndex:1,padding:'16px 16px 0',display:'flex',gap:6,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
              {lineup.filter(m => m.photos && m.photos.length > 0).flatMap(m => (m.photos || []).slice(0, 2).map((url, i) => (
                <div key={m.applicant_id + '-' + i} onClick={() => navigate('/profile/' + m.applicant_id)} style={{flexShrink:0,cursor:'pointer'}}>
                  <img src={url} alt="" loading="lazy" style={{width:56,height:72,borderRadius:12,objectFit:'cover',border:'1.5px solid '+S.rule2}} />
                </div>
              )))}
            </div>
          )}

          {/* Main card */}
          <div style={{position:'relative',zIndex:1,background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:24,padding:'28px 24px',border:'1px solid '+S.rule2,marginBottom:16,boxShadow:'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',marginTop: lineup.some(m => m.photos && m.photos.length > 0) ? 0 : 0}}>
            <h1 style={{fontSize:24,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,textAlign:'center',margin:'0 0 6px',lineHeight:1.2}}>{session.title}</h1>

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:4}}>
              <MapPin size={14} style={{color:S.p}} />
              <span style={{fontSize:13,color:S.tx3}}>{session.approx_area}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:8}}>
              <Lock size={11} style={{color:S.tx3}} />
              <span style={{fontSize:11,color:S.tx3}}>{t('session.address_revealed_later')}</span>
            </div>

            {hostName && session.host_id && (
              <button type="button" onClick={() => navigate('/profile/' + session.host_id)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,margin:'0 0 12px',background:'none',border:'none',cursor:'pointer',padding:0}}>
                {hostAvatar ? (
                  <div style={{position:'relative'}}><img src={hostAvatar} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',border:'2px solid '+S.bg,outline:'1.5px solid '+S.pbd}} /><div style={{position:'absolute',bottom:-1,right:-1,width:8,height:8,borderRadius:'50%',background:S.sage,border:'2px solid '+S.bg}} /></div>
                ) : (
                  <div style={{width:28,height:28,borderRadius:'50%',background:S.p2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:S.p,fontWeight:700}}>{hostName[0]}</div>
                )}
                <span style={{fontSize:13,color:S.tx3}}>par <span style={{color:S.p,fontWeight:600,textDecoration:'underline',textDecorationColor:S.pbd}}>{hostName}</span></span>
              </button>
            )}

            {session.description && (
              <p style={{fontSize:13,color:S.tx2,textAlign:'center',margin:'0 0 16px',lineHeight:1.5}}>{session.description}</p>
            )}

            {session.tags && session.tags.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:16}}>
                {session.tags.map((tag: string) => (
                  <span key={tag} style={{fontSize:12,fontWeight:600,color:S.p,padding:'4px 12px',borderRadius:99,background:S.p2,border:'1px solid '+S.pbd}}>{tag}</span>
                ))}
              </div>
            )}

            {/* Lineup */}
            {lineup.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:10}}>
                  <Users size={14} style={{color:S.tx3}} />
                  <span style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em'}}>{t('session.lineup_label')} · {lineup.length + 1}{session.max_capacity ? '/' + session.max_capacity : ''}</span>
                </div>
                <div className="stagger-children" style={{display:'flex',flexDirection:'column',gap:6}}>
                  {lineup.slice(0, 8).map((m) => (
                    <div key={m.applicant_id} onClick={() => navigate('/profile/' + m.applicant_id)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(5,4,10,0.80)',borderRadius:12,border:'1px solid '+S.rule,cursor:'pointer',transition:'border-color 0.2s'}}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',border:'2px solid '+S.rule2,flexShrink:0}} />
                      ) : (
                        <div style={{width:40,height:40,borderRadius:'50%',background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                          {(m.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:13,fontWeight:600,color:S.tx}}>{m.display_name || t('common.anonymous')}</p>
                        <div style={{display:'flex',gap:4,alignItems:'center',marginTop:2,flexWrap:'wrap'}}>
                          {m.role && <span style={{fontSize:10,fontWeight:600,color:S.p,background:S.p2,padding:'1px 6px',borderRadius:99,border:'1px solid '+S.pbd}}>{m.role}</span>}
                          {m.prep === 'Actif' && <Shield size={10} strokeWidth={2} style={{color:S.sage}} />}
                          {m.kinks_count && m.kinks_count > 0 ? <span style={{fontSize:9,color:S.tx4}}>{m.kinks_count} pratiques</span> : null}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{color:S.tx4,flexShrink:0}} />
                    </div>
                  ))}
                  {lineup.length > 8 && <p style={{fontSize:12,color:S.tx3,textAlign:'center',margin:'4px 0 0'}}>{t('session.lineup_more', { count: lineup.length - 8 })}</p>}
                </div>
              </div>
            )}

            {/* Role distribution */}
            {lineup.length > 0 && (() => {
              const roles: Record<string, number> = {}
              lineup.forEach(m => { if (m.role) roles[m.role] = (roles[m.role] || 0) + 1 })
              const prepCount = lineup.filter(m => m.prep === 'Actif').length
              return Object.keys(roles).length > 0 ? (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:12}}>
                  {Object.entries(roles).map(([role, count]) => (
                    <span key={role} style={{fontSize:11,fontWeight:600,color:S.tx2,background:'rgba(5,4,10,0.80)',padding:'4px 10px',borderRadius:99,border:'1px solid '+S.rule}}>
                      {count}× {role}
                    </span>
                  ))}
                  {prepCount > 0 && (
                    <span style={{fontSize:11,fontWeight:600,color:S.sage,background:S.sagebg,padding:'4px 10px',borderRadius:99,border:'1px solid '+S.sagebd,display:'flex',alignItems:'center',gap:3}}>
                      <Shield size={10} strokeWidth={2} /> {prepCount} PrEP
                    </span>
                  )}
                </div>
              ) : null
            })()}

            {/* Locked address */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(5,4,10,0.80)',borderRadius:12,border:'1px solid '+S.rule}}>
              <Lock size={14} style={{color:S.tx4,flexShrink:0}} />
              <p style={{fontSize:12,color:S.tx3,margin:0}}>{t('session.address_locked_note')}</p>
            </div>
          </div>

          {/* CTAs — Fixed bottom bar */}
          {myAppStatus ? (
            <div style={{marginTop:16}}>
              <div style={{
                padding:'14px 20px', borderRadius:14, marginBottom:10,
                background: statusLabels[myAppStatus]?.color + '14',
                border: '1px solid ' + (statusLabels[myAppStatus]?.color || S.rule) + '44',
              }}>
                <p style={{margin:0,fontSize:15,fontWeight:700,color:statusLabels[myAppStatus]?.color || S.tx}}>
                  {t('status.' + (statusLabels[myAppStatus]?.text || myAppStatus))}
                </p>
              </div>
              <button onClick={() => navigate('/session/' + session.id)} style={{
                width:'100%',padding:'14px',borderRadius:14,fontWeight:600,fontSize:14,
                color:S.tx2,border:'1px solid '+S.rule,background:'transparent',cursor:'pointer',
              }}>
                {t('session.view_session')}
              </button>
            </div>
          ) : session.max_capacity && (lineup.length + 1) >= session.max_capacity ? (
            <div style={{
              position:'fixed', bottom:0, left:0, right:0, zIndex:50,
              background:'rgba(5,4,10,0.92)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
              borderTop:'0.5px solid '+S.rule,
              padding:'16px 20px', paddingBottom:'calc(16px + env(safe-area-inset-bottom, 0px))',
              maxWidth:420, margin:'0 auto',
            }}>
              <button disabled style={{ width:'100%', padding:'16px', borderRadius:16, fontWeight:700, fontSize:16, color:S.red, background:S.redbg, border:'1px solid '+S.redbd }}>
                {t('session.full')}
              </button>
              {!user && (
                <>
                  <div style={{display:'flex',alignItems:'center',gap:12,margin:'12px 0 0'}}>
                    <div style={{flex:1,height:1,background:S.rule}} />
                    <span style={{fontSize:10,color:S.tx3}}>{t('session.ghost_question')}</span>
                    <div style={{flex:1,height:1,background:S.rule}} />
                  </div>
                  <button onClick={() => {
                    navigate('/ghost/setup?session_id=' + session.id + (code ? '&invite_code=' + code : ''))
                  }} style={{
                    width:'100%',marginTop:8,padding:'12px',borderRadius:14,fontWeight:600,fontSize:13,
                    color:S.lav,border:'1px solid '+S.lavbd,background:S.lavbg,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  }}>
                    <Ghost size={14} /> {t('home.ghost_mode')}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{
              position:'fixed', bottom:0, left:0, right:0, zIndex:50,
              background:'rgba(5,4,10,0.92)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
              borderTop:'0.5px solid '+S.rule,
              padding:'16px 20px', paddingBottom:'calc(16px + env(safe-area-inset-bottom, 0px))',
              maxWidth:420, margin:'0 auto',
            }}>
              {!user ? (
                <>
                  <button onClick={() => navigate('/login?next=/join/' + code)} className="btn-shimmer" style={{
                    width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
                    color:'#fff',background:S.grad,border:'none',cursor:'pointer',
                    boxShadow:'0 4px 24px '+S.pbd, position:'relative', overflow:'hidden',
                  }}>
                    {t('session.apply')}
                  </button>
                  <p style={{fontSize:10,color:S.tx3,textAlign:'center',margin:'8px 0 6px',fontFamily:"'Plus Jakarta Sans', sans-serif"}}>{t('session.profile_choice_note')}</p>
                  <div style={{display:'flex',alignItems:'center',gap:12,margin:'4px 0 0'}}>
                    <div style={{flex:1,height:1,background:S.rule}} />
                    <span style={{fontSize:10,color:S.tx3}}>{t('session.ghost_question')}</span>
                    <div style={{flex:1,height:1,background:S.rule}} />
                  </div>
                  <button onClick={() => {
                    navigate('/ghost/setup?session_id=' + session.id + (code ? '&invite_code=' + code : ''))
                  }} style={{
                    width:'100%',marginTop:8,padding:'12px',borderRadius:14,fontWeight:600,fontSize:13,
                    color:S.lav,border:'1px solid '+S.lavbd,background:S.lavbg,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  }}>
                    <Ghost size={14} /> {t('home.ghost_mode')}
                  </button>
                  <p style={{fontSize:9,color:S.tx4,textAlign:'center',margin:'8px 0 0'}}>{t('session.phone_never_asked')}</p>
                </>
              ) : profileComplete ? (
                <>
                  <button onClick={quickApply} disabled={quickApplying} className="btn-shimmer" style={{
                    width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
                    color:'#fff',background:S.grad,border:'none',cursor:quickApplying?'not-allowed':'pointer',
                    boxShadow:'0 4px 24px '+S.pbd,opacity:quickApplying?0.7:1,
                    position:'relative', overflow:'hidden',
                  }}>
                    {quickApplying ? t('session.applying') : t('session.apply')}
                  </button>
                  <p style={{fontSize:10,color:S.tx3,textAlign:'center',margin:'8px 0 0'}}>{t('session.profile_choice_note')}</p>
                  <button onClick={() => navigate('/session/' + session.id + '/apply')} style={{
                    width:'100%',marginTop:6,padding:'10px',borderRadius:12,fontWeight:600,fontSize:12,
                    color:S.tx3,border:'1px solid '+S.rule,background:'transparent',cursor:'pointer',
                  }}>
                    {t('session.customize_application')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/session/' + session.id + '/apply')} className="btn-shimmer" style={{
                    width:'100%',padding:'16px',borderRadius:16,fontWeight:700,fontSize:16,
                    color:'#fff',background:S.grad,border:'none',cursor:'pointer',
                    boxShadow:'0 4px 24px '+S.pbd,
                    position:'relative', overflow:'hidden',
                  }}>
                    {t('session.apply')}
                  </button>
                  <p style={{fontSize:10,color:S.tx3,textAlign:'center',margin:'8px 0 0'}}>{t('session.profile_choice_note')}</p>
                </>
              )}
            </div>
          )}
          {/* Spacer for fixed CTA */}
          {!myAppStatus && <div style={{height:180}} />}
        </div>
      )}
    </div>
  )
}
