import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'

const S = colors

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif",boxSizing:'border-box' as const,
}

export default function EditSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [directions, setDirections] = useState<{text:string;photo_url?:string}[]>([{text:''}])
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [lineupBase, setLineupBase] = useState<Record<string,unknown>>({})

  const SESSION_TAGS = ['Top', 'Bottom', 'Versa', 'Dark Room', 'Chemical', 'Techno', 'Bears', 'Jeunes', 'Musclés']

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login?next=/session/' + id + '/edit'); return }

      const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single()
      if (!sess || sess.host_id !== user.id) { navigate('/'); return }

      setTitle(sess.title || '')
      setDescription(sess.description || '')
      setApproxArea(sess.approx_area || '')
      setExactAddress(sess.exact_address || '')
      setTags(sess.tags || [])
      setLineupBase(sess.lineup_json || {})
      setIsPublic(!!sess.is_public)
      const dirs = (sess.lineup_json?.directions || []).map((d: any) => typeof d === 'string' ? {text:d} : d)
      setDirections(dirs.length > 0 ? dirs : [{text:''}])
      setLoading(false)
    }
    load()
  }, [id])

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSave = async () => {
    if (!title.trim()) { showToast('Titre requis', 'error'); return }
    setSaving(true)
    const directionsFiltered = directions.filter(d => d.text.trim().length > 0 || d.photo_url)
    const { error } = await supabase.from('sessions').update({
      title: title.trim(),
      description: description.trim(),
      approx_area: approxArea.trim(),
      exact_address: exactAddress.trim() || null,
      tags,
      is_public: isPublic,
      lineup_json: { ...lineupBase, directions: directionsFiltered },
    }).eq('id', id)

    if (error) {
      showToast('Erreur: ' + error.message, 'error')
    } else {
      showToast('Session mise à jour ✓', 'success')
      navigate('/session/' + id + '/host')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:S.tx3 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:S.bg, maxWidth:480, margin:'0 auto', paddingBottom:40 }}>
      <OrbLayer />
      <EventContextNav role='host' />
      <div style={{ padding:'40px 20px 16px', borderBottom:'1px solid '+S.rule ,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => navigate('/session/' + id + '/host')} style={{ background:'none', border:'none', color:S.tx3, fontSize:13, cursor:'pointer', marginBottom:12, padding:0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Host Dashboard</button>
        <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin:0 }}>Modifier la session</h1>
      </div>

      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Title */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>Titre</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan ce soir 🔥" style={inp} />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Session test pour dev." rows={3} style={{ ...inp, resize:'vertical' }} />
        </div>

        {/* Tags */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:8 }}>Tags</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SESSION_TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding:'6px 14px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
                border:'1px solid '+(tags.includes(tag) ? S.pbd : S.rule),
                background: tags.includes(tag) ? S.p2 : S.bg2,
                color: tags.includes(tag) ? S.p : S.tx3,
              }}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Approx area */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>Zone approximative</label>
          <input value={approxArea} onChange={e => setApproxArea(e.target.value)} placeholder="Paris 4ème" style={inp} />
        </div>

        {/* Exact address */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>Adresse exacte (révélée après acceptation)</label>
          <input value={exactAddress} onChange={e => setExactAddress(e.target.value)} placeholder="14 rue de la Roquette, code 4521" style={inp} />
        </div>

        {/* Directions */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:8 }}>Directions (étapes d'accès)</label>
          {directions.map((step, i) => (
            <div key={i} style={{ marginBottom:8, padding:10, background:S.bg, borderRadius:10, border:'1px solid '+S.rule }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:S.p }}>#{i+1}</span>
                <input value={step.text} onChange={e => { const next=[...directions]; next[i]={...next[i],text:e.target.value}; setDirections(next) }} placeholder="Ex: Rentre par le parking..." style={{ ...inp, flex:1, fontSize:13 }} />
                {directions.length > 1 && (
                  <button type="button" onClick={() => setDirections(directions.filter((_,j)=>j!==i))} style={{ padding:'6px 10px', borderRadius:8, fontSize:11, border:'1px solid '+S.red+'44', background:'transparent', color:S.red, cursor:'pointer' }}>×</button>
                )}
              </div>
              {step.photo_url ? (
                <div style={{ marginTop:6, position:'relative', display:'inline-block' }}>
                  <img src={step.photo_url} alt="" style={{ width:80, height:60, objectFit:'cover', borderRadius:8, border:'1px solid '+S.rule }} />
                  <button type="button" onClick={() => { const next=[...directions]; next[i]={...next[i],photo_url:undefined}; setDirections(next) }} style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:S.red, border:'none', color:'#fff', fontSize:10, cursor:'pointer' }}>×</button>
                </div>
              ) : (
                <label style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:6, padding:'4px 8px', borderRadius:6, border:'1px solid '+S.rule, background:S.bg2, color:S.tx4, fontSize:10, fontWeight:600, cursor:'pointer' }}>
                  📷 Photo
                  <input type="file" accept="image/*" onChange={async (e) => { const f=e.target.files?.[0]; if(!f)return; const{compressImage:ci}=await import('../lib/media'); const c=await ci(f); const{data:{user}}=await supabase.auth.getUser(); if(!user)return; const path=user.id+'/dir_'+Date.now()+'.jpg'; const{error}=await supabase.storage.from('avatars').upload(path,c); if(error)return; const{data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path); const next=[...directions]; next[i]={...next[i],photo_url:publicUrl}; setDirections(next) }} style={{ display:'none' }} />
                </label>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setDirections([...directions,{text:''}])} style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, border:'1px solid '+S.rule, background:S.bg2, color:S.tx2, cursor:'pointer' }}>
            + Ajouter une étape
          </button>
        </div>

        {/* Public toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: S.tx, margin: 0 }}>Publier dans l'app</p>
            <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>Visible dans Explore</p>
          </div>
          <button type="button" onClick={() => setIsPublic(!isPublic)} style={{
            width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
            background: isPublic ? S.sage : S.rule, transition: 'background 0.2s',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublic ? 21 : 3, transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:16, background:S.grad, border:'none', borderRadius:14,
          color:'#fff', fontSize:16, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow:'0 4px 20px '+S.pbd, opacity: saving ? 0.7 : 1, marginTop:8,
        }}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
