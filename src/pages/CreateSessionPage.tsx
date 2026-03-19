import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {Moon, Pill, Headphones, Sparkles, ArrowLeft} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors

const TEMPLATES: { id: string; label: string; icon: LucideIcon; tags: string[]; desc: string }[] = [
  { id:'darkroom', label:'Dark Room', icon:Moon, tags:['Dark Room'], desc:'Ambiance sombre, discret' },
  { id:'chemical', label:'Chemical', icon:Pill, tags:['Chemical'], desc:'Plan chem, entre adultes consentants' },
  { id:'techno', label:'Techno', icon:Headphones, tags:['Techno'], desc:'Après club, énergie haute' },
  { id:'custom', label:'Custom', icon:Sparkles, tags:[], desc:'Crée ton propre vibe' },
]

const SESSION_TAGS = ['Top', 'Bottom', 'Versa', 'Dark Room', 'Chemical', 'Techno', 'Bears', 'Jeunes', 'Musclés']

const QUICK_TEMPLATES: { label: string; icon: LucideIcon; title: string; tags: string[]; description: string; roles: Record<string, number> }[] = [
  { label: 'Dark Room', icon: Moon, title: 'Dark Room ce soir 🌙', tags: ['Dark Room', 'Top', 'Bottom'], description: 'Soirée dark room privée. Respect et discrétion.', roles: { Top: 2, Bottom: 2 } },
  { label: 'Chemical', icon: Pill, title: 'Plan chem ce soir 💊', tags: ['Chemical'], description: 'Plan chem entre adultes consentants. Safe space.', roles: { Top: 1, Bottom: 2, Versa: 1 } },
  { label: 'Techno', icon: Headphones, title: 'After techno 🎧', tags: ['Techno', 'Musclés'], description: 'Décompression post-club. Énergie haute.', roles: {} },
]

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif",boxSizing:'border-box' as const,
}

export default function CreateSessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tplParam = searchParams.get('tpl')
  const [user, setUser] = useState<any>(null)
  const [_template, setTemplate] = useState('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'template'|'details'|'address'>('template')
  const [savedAddresses, setSavedAddresses] = useState<{ id?: string; label?: string; approx_area?: string; exact_address?: string; directions?: { text: string; photo_url?: string }[] }[]>([])
  const [savingAddress, setSavingAddress] = useState(false)
  const [directions, setDirections] = useState<{ text: string; photo_url?: string }[]>([{ text: '' }])
  const [rolesWanted, setRolesWanted] = useState<Record<string, number>>({})
  const [createdSession, setCreatedSession] = useState<{ id: string; title: string; approx_area: string; invite_code: string } | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<'grindr'|'whatsapp'|'telegram'|null>(null)

  useEffect(() => {
    if (tplParam) {
      const qt = QUICK_TEMPLATES.find(t => t.label.toLowerCase().replace(' ', '') === tplParam)
      if (qt) {
        setTitle(qt.title); setDescription(qt.description); setSelectedTags(qt.tags)
        setRolesWanted(qt.roles); setDirections([{ text: '' }])
        setTemplate(tplParam as any); setStep('details')
      }
    }
  }, [tplParam])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (!u) { navigate('/login?next=/session/create'); return }
      else {
        supabase.from('user_profiles').select('profile_json').eq('id', u.id).maybeSingle().then(({ data: prof }) => {
          const addrs = (prof?.profile_json as any)?.saved_addresses
          setSavedAddresses(Array.isArray(addrs) ? addrs : [])
        })
      }
    })
  }, [])

  function pickTemplate(t: typeof TEMPLATES[0]) {
    setTemplate(t.id)
    setSelectedTags(t.tags)
    if (t.id !== 'custom') setTitle(t.label)
    setStep('details')
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(x=>x!==tag) : [...prev, tag])
  }

  async function create() {
    if (!user || !title || !approxArea) return
    setError('')
    setLoading(true)
    const directionsFiltered = directions.filter(d => d.text.trim().length > 0 || d.photo_url)
    const { data, error: err } = await supabase.from('sessions').insert({
      host_id: user.id,
      title,
      description,
      approx_area: approxArea,
      exact_address: exactAddress,
      status: 'open',
      tags: selectedTags,
      invite_code: Math.random().toString(36).slice(2, 10),
      lineup_json: {
        ...(directionsFiltered.length > 0 ? { directions: directionsFiltered } : {}),
        ...(Object.keys(rolesWanted).length > 0 ? { roles_wanted: rolesWanted } : {}),
      },
    }).select().single()
    setLoading(false)
    if (err) {
      console.error('Create session error:', err)
      setError(err.message)
      return
    }
    if (data) setCreatedSession({ id: data.id, title: data.title, approx_area: data.approx_area, invite_code: data.invite_code })
  }

  function copyShareMessage(app: 'grindr'|'whatsapp'|'telegram') {
    if (!createdSession) return
    const url = typeof window !== 'undefined' ? window.location.origin + '/join/' + createdSession.invite_code : ''
    const text = '🔥 ' + createdSession.title + ' – ' + createdSession.approx_area + ' – Postule: ' + url
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(app)
      setTimeout(() => setCopyFeedback(null), 2000)
    })
  }

  async function saveAddress() {
    if (!user || (!approxArea && !exactAddress)) return
    setSavingAddress(true)
    const { data: row } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
    const pj = (row?.profile_json as any) || {}
    const addrs = Array.isArray(pj.saved_addresses) ? [...pj.saved_addresses] : []
    addrs.push({ approx_area: approxArea || undefined, exact_address: exactAddress || undefined })
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: row?.display_name ?? '',
      profile_json: { ...pj, saved_addresses: addrs },
    })
    setSavedAddresses(addrs)
    setSavingAddress(false)
  }

  function pickSavedAddress(addr: typeof savedAddresses[0]) {
    if (addr.approx_area) setApproxArea(addr.approx_area)
    if (addr.exact_address) setExactAddress(addr.exact_address)
    if (addr.directions && addr.directions.length > 0) {
      setDirections(addr.directions.map(d => typeof d === 'string' ? { text: d } : d))
    }
  }

  const steps = ['template','details','address']
  const stepIdx = steps.indexOf(step)

  if (createdSession) {
    return (
      <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96}}>
        <div style={{padding:'40px 20px 24px'}}>
          <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 8px'}}>Session créée !</h1>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 20px'}}>Partage le lien avec ton message</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {(['grindr','whatsapp','telegram'] as const).map(app => (
              <button key={app} onClick={() => copyShareMessage(app)} style={{
                padding:'14px 16px',borderRadius:14,fontSize:14,fontWeight:600,border:'1px solid '+S.rule,
                background: copyFeedback === app ? S.p+'22' : S.bg1, color: copyFeedback === app ? S.p : S.tx2,
                cursor:'pointer',textAlign:'left',
              }}>
                {copyFeedback === app ? 'Copié !' : (app === 'grindr' ? 'Copier pour Grindr' : app === 'whatsapp' ? 'Copier pour WhatsApp' : 'Copier pour Telegram')}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/session/' + createdSession.id + '/host')} style={{marginTop:20,width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:'pointer',boxShadow:'0 4px 20px '+S.p+'44'}}>
            Aller à la session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.rule,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => step==='template' ? navigate(-1) : setStep(steps[stepIdx-1] as any)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
        <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 4px'}}>Nouvelle session</h1>
        <p style={{fontSize:13,color:S.tx3,margin:0}}>Étape {stepIdx+1}/3</p>
      </div>

      <div style={{display:'flex',padding:'12px 20px 0',gap:6}}>
        {steps.map((s,i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:i<=stepIdx?S.p:S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {step === 'template' && (
        <div style={{padding:'20px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Choisis un template</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 16px'}}>Il pré-remplira les tags et le titre</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            {QUICK_TEMPLATES.map(qt => (
              <button key={qt.label} type="button" onClick={() => { setTitle(qt.title); setDescription(qt.description); setSelectedTags(qt.tags); setRolesWanted(qt.roles); setDirections([{ text: '' }]); setTemplate(qt.label.toLowerCase().replace(' ','') as any); setStep('details') }} style={{
                padding:'12px 16px',borderRadius:14,fontSize:14,fontWeight:600,border:'1px solid '+S.rule,background:S.bg1,color:S.tx,cursor:'pointer',display:'flex',alignItems:'center',gap:8,
              }}>
                <span><qt.icon size={16} /></span>
                <span>{qt.label}</span>
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => pickTemplate(t)} style={{
                background:S.bg1,border:'1px solid '+S.rule,borderRadius:16,
                padding:'16px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,
                transition:'all 0.2s',
              }}>
                <span><t.icon size={28} style={{color:S.p}} /></span>
                <div>
                  <p style={{margin:'0 0 2px',fontSize:15,fontWeight:700,color:S.tx}}>{t.label}</p>
                  <p style={{margin:0,fontSize:12,color:S.tx3}}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Titre de la session</p>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder='Plan ce soir' style={inp} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Description</p>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder='Cherche 2-3 mecs pour ce soir. Ambiance détendue...' rows={3} style={{...inp,resize:'none',lineHeight:1.5}} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Tags de session</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {SESSION_TAGS.map(tag => {
                const on = selectedTags.includes(tag)
                return (
                  <button key={tag} onClick={()=>toggleTag(tag)} style={{
                    padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,
                    border:on?'none':'1px solid '+S.rule,
                    background:on?S.grad:S.bg2,color:on?'#fff':S.tx3,cursor:'pointer',
                  }}>{tag}</button>
                )
              })}
            </div>
          </div>
          {/* Rôles recherchés */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Rôles recherchés (optionnel)</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {['Top', 'Bottom', 'Versa', 'Side'].map(role => {
                const count = rolesWanted[role] || 0
                return (
                  <div key={role} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:12,background:count > 0 ? S.p+'18' : S.bg2,border:'1px solid '+(count > 0 ? S.p+'44' : S.rule)}}>
      <OrbLayer />
                    <span style={{fontSize:13,fontWeight:600,color:count > 0 ? S.p : S.tx3}}>{role}</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <button onClick={()=>setRolesWanted(prev => {const n={...prev}; if((n[role]||0)>0) n[role]=(n[role]||0)-1; if(n[role]===0) delete n[role]; return n})} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.rule,background:S.bg,color:S.tx3,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>−</button>
                      <span style={{fontSize:14,fontWeight:700,color:S.tx,minWidth:16,textAlign:'center'}}>{count}</span>
                      <button onClick={()=>setRolesWanted(prev => ({...prev,[role]:(prev[role]||0)+1}))} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.p+'44',background:S.p+'18',color:S.p,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.keys(rolesWanted).length > 0 && (
              <p style={{fontSize:11,color:S.tx3,margin:'6px 0 0'}}>
                Recherche : {Object.entries(rolesWanted).map(([r,c]) => `${c} ${r}${Number(c)>1?'s':''}`).join(', ')}
              </p>
            )}
          </div>
          <button onClick={()=>setStep('address')} disabled={!title} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:!title?'not-allowed':'pointer',opacity:!title?0.5:1,boxShadow:'0 4px 20px '+S.p+'44',marginTop:4}}>
            Continuer →
          </button>
        </div>
      )}

      {step === 'address' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          {savedAddresses.length > 0 && (
            <div>
              <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Adresses sauvegardées</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {savedAddresses.map((addr, i) => (
                  <button key={addr.id || i} type="button" onClick={() => pickSavedAddress(addr)} style={{
                    padding:'6px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer',
                  }}>
                    {addr.label || addr.approx_area || 'Adresse'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Zone approximative <span style={{color:S.p}}>*</span></p>
            <input value={approxArea} onChange={e=>setApproxArea(e.target.value)} placeholder='Paris 11ème, Métro Bastille' style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>Visible par tous les candidats</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Adresse exacte</p>
            <input value={exactAddress} onChange={e=>setExactAddress(e.target.value)} placeholder='14 rue de la Roquette, code 1234' style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>Révélée uniquement après ton acceptation</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Accès</p>
            <p style={{fontSize:12,color:S.tx4,marginBottom:8}}>Étapes pour arriver (visibles par les membres acceptés)</p>
            {directions.map((step, i) => (
              <div key={i} style={{marginBottom:8,padding:10,background:S.bg,borderRadius:10,border:'1px solid '+S.rule}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.p}}>#{i+1}</span>
                  <input value={step.text} onChange={e=>{ const next=[...directions]; next[i]={...next[i],text:e.target.value}; setDirections(next) }} placeholder={'Ex: Rentre par le parking...'} style={{...inp,flex:1,fontSize:13}} />
                  {directions.length > 1 && (
                    <button type="button" onClick={()=>setDirections(directions.filter((_,j)=>j!==i))} style={{padding:'6px 10px',borderRadius:8,fontSize:11,border:'1px solid '+S.red+'44',background:'transparent',color:S.red,cursor:'pointer'}}>×</button>
                  )}
                </div>
                {step.photo_url ? (
                  <div style={{marginTop:6,position:'relative',display:'inline-block'}}>
                    <img src={step.photo_url} alt="" style={{width:80,height:60,objectFit:'cover',borderRadius:8,border:'1px solid '+S.rule}} />
                    <button type="button" onClick={()=>{ const next=[...directions]; next[i]={...next[i],photo_url:undefined}; setDirections(next) }} style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:S.red,border:'none',color:'#fff',fontSize:10,cursor:'pointer'}}>×</button>
                  </div>
                ) : (
                  <label style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'4px 8px',borderRadius:6,border:'1px solid '+S.rule,background:S.bg2,color:S.tx4,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                    Photo
                    <input type="file" accept="image/*" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f)return; const { compressImage: ci } = await import('../lib/media'); const c = await ci(f); const { data:{ user } } = await supabase.auth.getUser(); if(!user) return; const path=user.id+'/dir_'+Date.now()+'.jpg'; const {error}=await supabase.storage.from('avatars').upload(path,c); if(error) return; const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path); const next=[...directions]; next[i]={...next[i],photo_url:publicUrl}; setDirections(next) }} style={{display:'none'}} />
                  </label>
                )}
              </div>
            ))}
            <button type="button" onClick={()=>setDirections([...directions,{text:''}])} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              Ajouter une étape
            </button>
          </div>
          {/* Public toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '12px 14px', background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: S.tx, margin: 0 }}>Publier dans l'app</p>
              <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>Visible dans Explore pour les profils à proximité</p>
            </div>
            <button type="button" onClick={() => setIsPublic(!isPublic)} style={{
              width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
              background: isPublic ? S.sage : S.rule, transition: 'background 0.2s',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublic ? 21 : 3, transition: 'left 0.2s' }} />
            </button>
          </div>

          <button onClick={saveAddress} disabled={savingAddress || (!approxArea && !exactAddress)} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:'transparent',color:S.p,cursor:savingAddress||(!approxArea&&!exactAddress)?'not-allowed':'pointer',opacity:savingAddress||(!approxArea&&!exactAddress)?0.6:1}}>
            {savingAddress ? 'Sauvegarde...' : 'Sauvegarder cette adresse'}
          </button>
          <div style={{padding:'12px 14px',background:S.bg1,borderRadius:12,border:'1px solid '+S.rule}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>L'adresse exacte n'est jamais visible avant acceptation</p>
          </div>
          {error && <p style={{color:S.p,fontSize:13,margin:'0 0 4px',padding:'10px 14px',background:'#F4727215',borderRadius:10}}>{error}</p>}
          <button onClick={create} disabled={loading||!title||!approxArea} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:loading||!title||!approxArea?'not-allowed':'pointer',opacity:loading||!title||!approxArea?0.5:1,boxShadow:'0 4px 20px '+S.p+'44',marginTop:4}}>
            {loading ? 'Création...' : 'Créer la session'}
          </button>
        </div>
      )}

    </div>
  )
}