import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',red:'#F87171',green:'#4ADE80',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const SECTIONS = [
  {id:'basics',label:'Basics',emoji:'👤',desc:'pseudo, âge, bio, location'},
  {id:'role',label:'Rôle',emoji:'🎭',desc:'top, bottom, versa, side'},
  {id:'physique',label:'Physique',emoji:'💪',desc:'taille, poids, morphologie'},
  {id:'pratiques',label:'Pratiques',emoji:'🔥',desc:'kinks & pratiques'},
  {id:'sante',label:'Santé / PrEP',emoji:'💊',desc:'statut PrEP, dernier test'},
  {id:'limites',label:'Limites',emoji:'🚫',desc:'hard limits, no-go'},
  {id:'photos',label:'Photos',emoji:'📸',desc:'photos de profil'},
  {id:'occasion',label:'Pour cette session',emoji:'⚡',desc:'message + contenu spécifique'},
]

export default function ApplyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [enabled, setEnabled] = useState<string[]>(SECTIONS.map(s => s.id))
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'pack'|'note'|'done'>('pack')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null)

  const RATE_LIMIT_MIN = 5
  const isRateLimited = rateLimitedUntil ? new Date() < rateLimitedUntil : false
  const invalidPseudo = !profile?.display_name || (profile.display_name as string).trim().length < 2

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        setDataLoading(true)
        load(u.id)
      } else setDataLoading(false)
    })
  }, [])

  async function load(uid: string) {
    setLoadError(false)
    try {
      const [{ data: prof }, { data: sess }, { data: lastApp }] = await Promise.all([
        supabase.from('user_profiles').select('display_name,profile_json').eq('id', uid).maybeSingle(),
        supabase.from('sessions').select('title,approx_area').eq('id', id).maybeSingle(),
        supabase.from('applications').select('created_at').eq('applicant_id', uid).order('created_at', { ascending: false }).limit(1),
      ])
      if (prof) setProfile(prof)
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
    if (!user || isRateLimited) return
    setLoading(true)
    await supabase.from('applications').upsert({
      session_id: id, applicant_id: user.id, status: 'pending',
      eps_json: { shared_sections: enabled, occasion_note: note, profile_snapshot: profile?.profile_json || {} }
    })
    setLoading(false)
    navigate('/session/' + id + '/dm')
  }

  if (!user) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
      <div style={{textAlign:'center',padding:24}}>
        <p style={{color:S.tx3,marginBottom:16}}>Connecte-toi pour postuler</p>
        <button onClick={() => navigate('/me')} style={{padding:'12px 24px',borderRadius:12,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>Se connecter</button>
      </div>
    </div>
  )
  if (dataLoading) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div className="spinner-loading" />
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80,fontFamily:'Inter,system-ui,sans-serif'}}>
      <p style={{color:S.red,textAlign:'center'}}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:S.bg0,paddingBottom:96,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid ' + S.border}}>
        <button onClick={() => navigate(-1)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}>← Retour</button>
        <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 4px'}}>Postuler</h1>
        {session && <p style={{fontSize:13,color:S.tx3,margin:0}}>{session.title} · {session.approx_area}</p>}
      </div>

      {profile && (
        <div style={{margin:'12px 20px',padding:12,borderRadius:14,background:S.bg1,border:'1px solid '+S.border}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Aperçu de ton profil (ce qui sera partagé)</div>
          <div style={{fontSize:14,fontWeight:600,color:S.tx,marginBottom:4}}>{profile.display_name || 'Anonyme'}</div>
          {(profile.profile_json?.role || profile.profile_json?.bio) && (
            <div style={{fontSize:13,color:S.tx2,lineHeight:1.4}}>
              {profile.profile_json?.role && <span style={{color:S.p300,fontWeight:600}}>{profile.profile_json.role}</span>}
              {profile.profile_json?.role && profile.profile_json?.bio && ' · '}
              {profile.profile_json?.bio && (profile.profile_json.bio as string).slice(0, 80)}{(profile.profile_json?.bio as string)?.length > 80 ? '…' : ''}
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
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:(['pack','note','done'].indexOf(step) >= i) ? S.p300 : S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {step === 'pack' && (
        <div style={{padding:'8px 20px 24px'}}>
          <div style={{marginBottom:16}}>
            <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Ton Candidate Pack</h2>
            <p style={{fontSize:13,color:S.tx3,margin:0}}>Choisis ce que tu partages avec le host</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {SECTIONS.map(sec => {
              const on = enabled.includes(sec.id)
              return (
                <div key={sec.id} onClick={() => toggle(sec.id)} style={{
                  background: on ? S.p300 + '10' : S.bg1,
                  border: '1px solid ' + (on ? S.p300 + '55' : S.border),
                  borderRadius:14,padding:'12px 14px',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.2s',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:18}}>{sec.emoji}</span>
                    <div>
                      <p style={{margin:0,fontSize:14,fontWeight:600,color:on?S.tx:S.tx3}}>{sec.label}</p>
                      <p style={{margin:0,fontSize:11,color:S.tx4}}>{sec.desc}</p>
                    </div>
                  </div>
                  <div style={{width:20,height:20,borderRadius:99,background:on?S.grad:'transparent',border:on?'none':'2px solid '+S.border,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {on && <span style={{color:'#fff',fontSize:11,fontWeight:800}}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {invalidPseudo && <p style={{fontSize:13,color:S.red,marginTop:8,marginBottom:0}}>Ton pseudo est requis</p>}
          <div style={{marginTop:12,padding:'10px 14px',background:S.bg1,borderRadius:12,border:'1px solid '+S.border}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}><span style={{color:S.p300,fontWeight:700}}>{enabled.length}/{SECTIONS.length}</span> sections partagées</p>
          </div>
          <button onClick={() => setStep('note')} disabled={isRateLimited || invalidPseudo} style={{width:'100%',marginTop:14,padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:isRateLimited||invalidPseudo?'not-allowed':'pointer',opacity:isRateLimited||invalidPseudo?0.5:1,boxShadow:'0 4px 20px ' + S.p400 + '44'}}>
            Continuer →
          </button>
        </div>
      )}

      {step === 'note' && (
        <div style={{padding:'16px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Pour cette session</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 16px'}}>Un mot pour le host ? Dispo, ambiance...</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder='Dispo à partir de 22h30, je connais le quartier...' rows={4} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:14,padding:'12px 16px',border:'1px solid '+S.border,outline:'none',fontSize:14,fontFamily:'inherit',resize:'none',boxSizing:'border-box',lineHeight:1.5}} />
          <div style={{display:'flex',gap:10,marginTop:12}}>
            <button onClick={() => setStep('pack')} style={{flex:1,padding:'13px',borderRadius:14,fontWeight:600,fontSize:14,color:S.tx2,border:'1px solid '+S.border,background:S.bg2,cursor:'pointer'}}>← Retour</button>
            <button onClick={submit} disabled={loading || isRateLimited} style={{flex:2,padding:'13px',borderRadius:14,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',cursor:loading||isRateLimited?'not-allowed':'pointer',opacity:loading||isRateLimited?0.7:1}}>
              {loading ? 'Envoi...' : isRateLimited ? 'Attends quelques minutes' : 'Envoyer ma candidature 🔥'}
            </button>
          </div>
        </div>
      )}

      <BottomNav active='sessions' />
    </div>
  )
}