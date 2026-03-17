import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',red:'#F87171',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.border,outline:'none',
  fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as const,
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
  const [directions, setDirections] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([])

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
      const dirs = sess.lineup_json?.directions || []
      setDirections(dirs.length > 0 ? dirs : [''])
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
    const directionsFiltered = directions.filter(d => (d || '').trim().length > 0)
    const { error } = await supabase.from('sessions').update({
      title: title.trim(),
      description: description.trim(),
      approx_area: approxArea.trim(),
      exact_address: exactAddress.trim() || null,
      tags,
      lineup_json: directionsFiltered.length > 0 ? { directions: directionsFiltered } : {},
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
    <div style={{ minHeight:'100vh', background:S.bg0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:S.tx3 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:S.bg0, maxWidth:480, margin:'0 auto', paddingBottom:40 }}>
      <div style={{ padding:'40px 20px 16px', borderBottom:'1px solid '+S.border }}>
        <button onClick={() => navigate('/session/' + id + '/host')} style={{ background:'none', border:'none', color:S.tx3, fontSize:13, cursor:'pointer', marginBottom:12, padding:0 }}>← Host Dashboard</button>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, margin:0 }}>Modifier la session</h1>
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
                border:'1px solid '+(tags.includes(tag) ? S.p300+'88' : S.border),
                background: tags.includes(tag) ? S.p300+'18' : S.bg2,
                color: tags.includes(tag) ? S.p300 : S.tx3,
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
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <span style={{ color:S.tx3, fontSize:13, fontWeight:600, minWidth:24, paddingTop:12 }}>{i+1}.</span>
              <input value={step} onChange={e => { const next=[...directions]; next[i]=e.target.value; setDirections(next) }} placeholder={`Étape ${i+1}`} style={{ ...inp, flex:1 }} />
              {directions.length > 1 && (
                <button onClick={() => setDirections(directions.filter((_,j)=>j!==i))} style={{ padding:'10px 12px', borderRadius:10, fontSize:11, fontWeight:600, border:'1px solid '+S.red, background:'transparent', color:S.red, cursor:'pointer' }}>×</button>
              )}
            </div>
          ))}
          <button onClick={() => setDirections([...directions,''])} style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, border:'1px solid '+S.border, background:S.bg2, color:S.tx2, cursor:'pointer' }}>
            + Ajouter une étape
          </button>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:16, background:S.grad, border:'none', borderRadius:14,
          color:'#fff', fontSize:16, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow:'0 4px 20px '+S.p400+'44', opacity: saving ? 0.7 : 1, marginTop:8,
        }}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
