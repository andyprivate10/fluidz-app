import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',red:'#F87171',green:'#4ADE80',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

export default function HostDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [tab, setTab] = useState<'pending'|'accepted'|'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string|null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) load()
      else setLoading(false)
    })
  }, [id])

  async function load() {
    setLoading(true)
    setLoadError(false)
    try {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).maybeSingle(),
        supabase.from('applications').select('*, user_profiles(display_name, profile_json)').eq('session_id', id).order('created_at', { ascending: false }),
      ])
      setSess(s)
      setApps(a || [])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  async function decide(appId: string, status: 'accepted'|'rejected') {
    setActionLoading(appId)
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApps(prev => prev.map(a => a.id === appId ? {...a, status} : a))
    setActionLoading(null)
  }

  async function toggleStatus() {
    const newStatus = sess.status === 'open' ? 'closed' : 'open'
    await supabase.from('sessions').update({ status: newStatus }).eq('id', id)
    setSess((s: any) => ({...s, status: newStatus}))
  }

  const filtered = apps.filter(a => a.status === tab)
  const counts = { pending: apps.filter(a=>a.status==='pending').length, accepted: apps.filter(a=>a.status==='accepted').length, rejected: apps.filter(a=>a.status==='rejected').length }

  if (loading) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div className="w-8 h-8 border-4 border-peach300 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80,fontFamily:'Inter,system-ui,sans-serif'}}>
      <p style={{color:S.red,textAlign:'center'}}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:S.bg0,paddingBottom:96,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.border}}>
        <button onClick={() => navigate(-1)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}>← Retour</button>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 4px'}}>{sess?.title}</h1>
            <p style={{fontSize:13,color:S.tx3,margin:0}}>📍 {sess?.approx_area}</p>
          </div>
          <button onClick={toggleStatus} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
            background: sess?.status==='open' ? S.green+'22' : S.bg3,
            color: sess?.status==='open' ? S.green : S.tx3,
          }}>
            {sess?.status==='open' ? '🟢 Ouvert' : '⚫ Fermé'}
          </button>
        </div>

        {sess?.invite_code && (
          <button
            onClick={() => {
              const url = window.location.origin + '/join/' + sess.invite_code
              navigator.clipboard.writeText(url).then(() => {
                setLinkCopied(true)
                setTimeout(() => setLinkCopied(false), 2000)
              })
            }}
            style={{marginTop:12,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:linkCopied ? S.green+'22' : 'transparent',color:linkCopied ? S.green : S.p300,cursor:'pointer',width:'100%'}}
          >
            {linkCopied ? 'Lien copié' : 'Partager'}
          </button>
        )}
        <div style={{display:'flex',gap:8,marginTop:16}}>
          {([['pending','⏳ En attente',S.yellow],['accepted','✅ Acceptés',S.green],['rejected','❌ Refusés',S.red]] as const).map(([t,l,c]) => (
            <button key={t} onClick={() => setTab(t as any)} style={{
              flex:1,padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid '+(tab===t ? c+'55' : S.border),
              background: tab===t ? c+'14' : S.bg2,
              color: tab===t ? c : S.tx3,
            }}>
              {l} {counts[t as keyof typeof counts] > 0 && <span style={{fontWeight:800}}>({counts[t as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 20px',color:S.tx3,fontSize:14}}>
            {tab==='pending' ? 'Aucune candidature en attente' : tab==='accepted' ? 'Aucun membre accepté' : 'Aucun refus'}
          </div>
        )}

        {filtered.map(app => {
          const prof = app.user_profiles
          const pj = prof?.profile_json || {}
          const sections = app.eps_json?.shared_sections || []
          return (
            <div key={app.id} style={{background:S.bg1,borderRadius:18,border:'1px solid '+S.border,overflow:'hidden'}}>
              <div style={{padding:'16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div>
                    <p style={{margin:'0 0 2px',fontSize:16,fontWeight:800,color:S.tx}}>
                      <Link to={'/profile/' + app.applicant_id} style={{color:S.tx,textDecoration:'none'}}>{prof?.display_name || 'Anonyme'}</Link>
                    </p>
                    {pj.role && <span style={{fontSize:12,fontWeight:600,padding:'2px 10px',borderRadius:99,background:S.p300+'18',color:S.p300,border:'1px solid '+S.p300+'33'}}>{pj.role}</span>}
                  </div>
                  <button onClick={() => navigate('/session/'+id+'/candidate/'+app.applicant_id)} style={{padding:'6px 12px',borderRadius:10,fontSize:12,color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>Voir profil</button>
                </div>

                {pj.age && <p style={{fontSize:13,color:S.tx3,margin:'0 0 4px'}}>{pj.age} ans · {pj.location}</p>}
                {pj.bio && <p style={{fontSize:13,color:S.tx2,margin:'0 0 8px',lineHeight:1.4}}>{pj.bio}</p>}

                {pj.morphology && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {[pj.morphology, ...(pj.kinks||[]).slice(0,3)].filter(Boolean).map((t:string,i:number) => (
                      <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:S.bg2,color:S.tx3,border:'1px solid '+S.border}}>{t}</span>
                    ))}
                    {(pj.kinks||[]).length > 3 && <span style={{fontSize:11,color:S.tx4}}>+{pj.kinks.length-3}</span>}
                  </div>
                )}

                {app.eps_json?.occasion_note && (
                  <div style={{padding:'10px 12px',background:S.bg2,borderRadius:10,border:'1px solid '+S.p300+'33',marginBottom:8}}>
                    <p style={{fontSize:11,color:S.p300,fontWeight:700,margin:'0 0 2px'}}>⚡ Note pour cette session</p>
                    <p style={{fontSize:13,color:S.tx2,margin:0}}>{app.eps_json.occasion_note}</p>
                  </div>
                )}

                {pj.limits && (
                  <div style={{padding:'8px 12px',background:S.red+'10',borderRadius:10,border:'1px solid '+S.red+'33',marginBottom:8}}>
                    <p style={{fontSize:11,color:S.red,fontWeight:700,margin:'0 0 2px'}}>🚫 Limites</p>
                    <p style={{fontSize:12,color:S.tx3,margin:0}}>{pj.limits}</p>
                  </div>
                )}

                {app.status === 'pending' && (
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    <button onClick={() => decide(app.id, 'rejected')} disabled={actionLoading===app.id} style={{flex:1,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:S.red,border:'1px solid '+S.red+'44',background:S.red+'10',cursor:'pointer'}}>
                      ✕ Refuser
                    </button>
                    <button onClick={() => decide(app.id, 'accepted')} disabled={actionLoading===app.id} style={{flex:2,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 16px '+S.p400+'44'}}>
                      {actionLoading===app.id ? '...' : '✓ Accepter'}
                    </button>
                  </div>
                )}

                {app.status === 'accepted' && (
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    <span style={{fontSize:12,color:S.green,fontWeight:600}}>✅ Accepté — adresse débloquée</span>
                    <button onClick={() => decide(app.id, 'rejected')} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:8,fontSize:11,color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>Annuler</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav active='sessions' />
    </div>
  )
}