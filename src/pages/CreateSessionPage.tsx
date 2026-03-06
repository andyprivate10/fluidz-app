import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const TEMPLATES = [
  { id:'darkroom', label:'Dark Room', emoji:'🌑', tags:['Dark Room'], desc:'Ambiance sombre, discret' },
  { id:'chemical', label:'Chemical', emoji:'💊', tags:['Chemical'], desc:'Plan chem, entre adultes consentants' },
  { id:'techno', label:'Techno', emoji:'🎧', tags:['Techno'], desc:'Après club, énergie haute' },
  { id:'custom', label:'Custom', emoji:'✨', tags:[], desc:'Crée ton propre vibe' },
]

const SESSION_TAGS = ['Top', 'Bottom', 'Versa', 'Dark Room', 'Chemical', 'Techno', 'Bears', 'Jeunes', 'Musclés']

const QUICK_TEMPLATES = [
  { label: 'Dark Room', emoji: '🖤', title: 'Dark Room ce soir', tags: ['Dark Room', 'Top', 'Bottom'] },
  { label: 'Chemical', emoji: '⚗️', title: 'Chemical ce soir', tags: ['Chemical', 'Top', 'Bottom'] },
  { label: 'Techno', emoji: '🎵', title: 'Techno ce soir', tags: ['Techno', 'Top', 'Bottom'] },
]

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.border,outline:'none',
  fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as const,
}

export default function CreateSessionPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [template, setTemplate] = useState('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'template'|'details'|'address'>('template')
  const [savedAddresses, setSavedAddresses] = useState<{ approx_area?: string; exact_address?: string }[]>([])
  const [savingAddress, setSavingAddress] = useState(false)
  const [directions, setDirections] = useState<string[]>([''])
  const [createdSession, setCreatedSession] = useState<{ id: string; title: string; approx_area: string; invite_code: string } | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<'grindr'|'whatsapp'|'telegram'|null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (!u) navigate('/me')
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
    const directionsFiltered = directions.filter(d => (d || '').trim().length > 0)
    const { data, error: err } = await supabase.from('sessions').insert({
      host_id: user.id,
      title,
      description,
      approx_area: approxArea,
      exact_address: exactAddress,
      status: 'open',
      tags: selectedTags,
      invite_code: Math.random().toString(36).slice(2, 10),
      lineup_json: directionsFiltered.length > 0 ? { directions: directionsFiltered } : {},
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

  function pickSavedAddress(addr: { approx_area?: string; exact_address?: string }) {
    if (addr.approx_area) setApproxArea(addr.approx_area)
    if (addr.exact_address) setExactAddress(addr.exact_address)
  }

  const steps = ['template','details','address']
  const stepIdx = steps.indexOf(step)

  if (createdSession) {
    return (
      <div style={{minHeight:'100vh',background:S.bg0,paddingBottom:96,fontFamily:'Inter,system-ui,sans-serif'}}>
        <div style={{padding:'40px 20px 24px'}}>
          <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 8px'}}>Session créée !</h1>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 20px'}}>Partage le lien avec ton message</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {(['grindr','whatsapp','telegram'] as const).map(app => (
              <button key={app} onClick={() => copyShareMessage(app)} style={{
                padding:'14px 16px',borderRadius:14,fontSize:14,fontWeight:600,border:'1px solid '+S.border,
                background: copyFeedback === app ? S.p300+'22' : S.bg1, color: copyFeedback === app ? S.p300 : S.tx2,
                cursor:'pointer',textAlign:'left',
              }}>
                {copyFeedback === app ? 'Copié !' : (app === 'grindr' ? 'Copier pour Grindr' : app === 'whatsapp' ? 'Copier pour WhatsApp' : 'Copier pour Telegram')}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/session/' + createdSession.id + '/host')} style={{marginTop:20,width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 20px '+S.p400+'44'}}>
            Aller à la session
          </button>
        </div>
        <BottomNav active='sessions' />
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:S.bg0,paddingBottom:96,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.border}}>
        <button onClick={() => step==='template' ? navigate(-1) : setStep(steps[stepIdx-1] as any)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}>← Retour</button>
        <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 4px'}}>Nouvelle session</h1>
        <p style={{fontSize:13,color:S.tx3,margin:0}}>Étape {stepIdx+1}/3</p>
      </div>

      <div style={{display:'flex',padding:'12px 20px 0',gap:6}}>
        {steps.map((s,i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:i<=stepIdx?S.p300:S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {step === 'template' && (
        <div style={{padding:'20px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>Choisis un template</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 16px'}}>Il pré-remplira les tags et le titre</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            {QUICK_TEMPLATES.map(qt => (
              <button key={qt.label} type="button" onClick={() => { setTitle(qt.title); setSelectedTags(qt.tags); setTemplate(qt.label.toLowerCase().replace(' ','') as any); setStep('details') }} style={{
                padding:'12px 16px',borderRadius:14,fontSize:14,fontWeight:600,border:'1px solid '+S.border,background:S.bg1,color:S.tx,cursor:'pointer',display:'flex',alignItems:'center',gap:8,
              }}>
                <span>{qt.emoji}</span>
                <span>{qt.label}</span>
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => pickTemplate(t)} style={{
                background:S.bg1,border:'1px solid '+S.border,borderRadius:16,
                padding:'16px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,
                transition:'all 0.2s',
              }}>
                <span style={{fontSize:28}}>{t.emoji}</span>
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
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder='Plan ce soir 🔥' style={inp} />
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
                    border:on?'none':'1px solid '+S.border,
                    background:on?S.grad:S.bg2,color:on?'#fff':S.tx3,cursor:'pointer',
                  }}>{tag}</button>
                )
              })}
            </div>
          </div>
          <button onClick={()=>setStep('address')} disabled={!title} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:!title?'not-allowed':'pointer',opacity:!title?0.5:1,boxShadow:'0 4px 20px '+S.p400+'44',marginTop:4}}>
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
                  <button key={i} type="button" onClick={() => pickSavedAddress(addr)} style={{
                    padding:'6px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'1px solid '+S.border,background:S.bg2,color:S.tx2,cursor:'pointer',
                  }}>
                    {(addr.exact_address || addr.approx_area || 'Adresse').slice(0, 24)}{(addr.exact_address || addr.approx_area || '').length > 24 ? '…' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Zone approximative <span style={{color:S.p300}}>*</span></p>
            <input value={approxArea} onChange={e=>setApproxArea(e.target.value)} placeholder='Paris 11ème, Métro Bastille' style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>Visible par tous les candidats</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Adresse exacte 🔒</p>
            <input value={exactAddress} onChange={e=>setExactAddress(e.target.value)} placeholder='14 rue de la Roquette, code 1234' style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>Révélée uniquement après ton acceptation</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>Accès</p>
            <p style={{fontSize:12,color:S.tx4,marginBottom:8}}>Étapes pour arriver (visibles par les membres acceptés)</p>
            {directions.map((step, i) => (
              <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                <input value={step} onChange={e=>{ const next=[...directions]; next[i]=e.target.value; setDirections(next) }} placeholder={'Étape ' + (i+1)} style={{...inp,flex:1}} />
                {directions.length > 1 && (
                  <button type="button" onClick={()=>setDirections(directions.filter((_,j)=>j!==i))} style={{padding:'10px 14px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.red,background:'transparent',color:S.red,cursor:'pointer'}}>Suppr</button>
                )}
              </div>
            ))}
            <button type="button" onClick={()=>setDirections([...directions,''])} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.border,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              Ajouter une étape
            </button>
          </div>
          <button onClick={saveAddress} disabled={savingAddress || (!approxArea && !exactAddress)} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:'transparent',color:S.p300,cursor:savingAddress||(!approxArea&&!exactAddress)?'not-allowed':'pointer',opacity:savingAddress||(!approxArea&&!exactAddress)?0.6:1}}>
            {savingAddress ? 'Sauvegarde...' : 'Sauvegarder cette adresse'}
          </button>
          <div style={{padding:'12px 14px',background:S.bg1,borderRadius:12,border:'1px solid '+S.border}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>🔒 L'adresse exacte n'est jamais visible avant acceptation</p>
          </div>
          {error && <p style={{color:'#F47272',fontSize:13,margin:'0 0 4px',padding:'10px 14px',background:'#F4727215',borderRadius:10}}>{error}</p>}
          <button onClick={create} disabled={loading||!title||!approxArea} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',cursor:loading||!title||!approxArea?'not-allowed':'pointer',opacity:loading||!title||!approxArea?0.5:1,boxShadow:'0 4px 20px '+S.p400+'44',marginTop:4}}>
            {loading ? 'Création...' : 'Créer la session 🔥'}
          </button>
        </div>
      )}

      <BottomNav active='sessions' />
    </div>
  )
}