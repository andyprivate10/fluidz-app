import { ArrowLeft, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { useTranslation } from 'react-i18next'

const S = colors

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:fonts.body,boxSizing:'border-box' as const,
}

export default function EditSessionPage() {
  const { t } = useTranslation()
  const { sessionTags } = useAdminConfig()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
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
      if (sess.starts_at) setStartsAt(new Date(sess.starts_at).toISOString().slice(0, 16))
      if (sess.ends_at) setEndsAt(new Date(sess.ends_at).toISOString().slice(0, 16))
      if (sess.max_capacity) setMaxCapacity(sess.max_capacity)
      const dirs = (sess.lineup_json?.directions || []).map((d: any) => typeof d === 'string' ? {text:d} : d)
      setDirections(dirs.length > 0 ? dirs : [{text:''}])
      setLoading(false)
    }
    load()
  }, [id, user])

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
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      max_capacity: maxCapacity || null,
      lineup_json: { ...lineupBase, directions: directionsFiltered },
    }).eq('id', id)

    if (error) {
      showToast(t('errors.error_prefix') + ': ' + error.message, 'error')
    } else {
      showToast(t('common.saved') || 'Saved', 'success')
      navigate('/session/' + id)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:S.tx3 }}>{t('common.loading')}</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:S.bg, maxWidth:480, margin:'0 auto', paddingBottom:40 }}>
      <OrbLayer />
      <div style={{ padding:'40px 20px 16px', borderBottom:'1px solid '+S.rule ,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => navigate('/session/' + id)} style={{ background:'none', border:'none', color:S.p, fontSize:13, cursor:'pointer', marginBottom:12, padding:0, display:'flex', alignItems:'center', gap:4 }}><ArrowLeft size={16} strokeWidth={1.5} />{t('common.back')}</button>
        <h1 style={{ fontSize:22,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin:0 }}>{t('session.edit_title')}</h1>
      </div>

      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Title */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>{t('session.title_label')}</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('session.title_placeholder')} style={inp} />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>{t('session.description_label')}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('placeholders.session_desc')} rows={3} style={{ ...inp, resize:'vertical' }} />
        </div>

        {/* Tags */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:8 }}>{t('session.tags_label')}</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {sessionTags.map(tag => (
              <button key={tag.label} onClick={() => toggleTag(tag.label)} style={{
                padding:'6px 14px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
                border:'1px solid '+(tags.includes(tag.label) ? S.pbd : S.rule),
                background: tags.includes(tag.label) ? S.p2 : S.bg2,
                color: tags.includes(tag.label) ? S.p : S.tx3,
              }}>{tag.label}</button>
            ))}
          </div>
        </div>

        {/* Approx area */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>{t('session.approx_area_label')}</label>
          <input value={approxArea} onChange={e => setApproxArea(e.target.value)} placeholder={t('placeholders.approx_area')} style={inp} />
        </div>

        {/* Exact address */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>{t('session.exact_address_label')}</label>
          <input value={exactAddress} onChange={e => setExactAddress(e.target.value)} placeholder="14 rue de la Roquette, code 4521" style={inp} />
        </div>

        {/* Directions */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:8 }}>Directions (étapes d'accès)</label>
          {directions.map((step, i) => (
            <div key={i} style={{ marginBottom:8, padding:10, background:S.bg, borderRadius:10, border:'1px solid '+S.rule }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:S.p }}>#{i+1}</span>
                <input value={step.text} onChange={e => { const next=[...directions]; next[i]={...next[i],text:e.target.value}; setDirections(next) }} placeholder={t('placeholders.direction_step')} style={{ ...inp, flex:1, fontSize:13 }} />
                {directions.length > 1 && (
                  <button type="button" onClick={() => setDirections(directions.filter((_,j)=>j!==i))} style={{ padding:'6px 10px', borderRadius:8, fontSize:11, border:'1px solid '+S.redbd, background:'transparent', color:S.red, cursor:'pointer' }}>×</button>
                )}
              </div>
              {step.photo_url ? (
                <div style={{ marginTop:6, position:'relative', display:'inline-block' }}>
                  <img src={step.photo_url} alt="" loading="lazy" style={{ width:80, height:60, objectFit:'cover', borderRadius:8, border:'1px solid '+S.rule }} />
                  <button type="button" onClick={() => { const next=[...directions]; next[i]={...next[i],photo_url:undefined}; setDirections(next) }} style={{ position:'absolute', top:-12, right:-12, width:44, height:44, borderRadius:'50%', background:'transparent', border:'none', color: S.tx, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ width:16, height:16, borderRadius:'50%', background:S.red, display:'flex', alignItems:'center', justifyContent:'center' }}>×</span></button>
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
            {t('session.add_direction')}
          </button>
        </div>

        {/* Timing */}
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}><Clock size={12} style={{display:'inline',marginRight:4}} />Début</label>
          <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={{...inp, colorScheme:'dark'}} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>Fin</label>
          <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} style={{...inp, colorScheme:'dark'}} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:S.tx3, display:'block', marginBottom:6 }}>{t('session.capacity_label')}</label>
          <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value ? parseInt(e.target.value) : '')} placeholder="Ex: 8" min={2} max={50} style={inp} />
        </div>

        {/* Public toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: S.tx, margin: 0 }}>{t('session.publish_label')}</p>
            <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>Visible dans Explore</p>
          </div>
          <button type="button" onClick={() => setIsPublic(!isPublic)} style={{
            width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
            background: isPublic ? S.sage : S.rule, transition: 'background 0.2s',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: S.white, position: 'absolute', top: 3, left: isPublic ? 21 : 3, transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:16, background:S.grad, border:'none', borderRadius:14,
          color: S.tx, fontSize:16, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow:'0 4px 20px '+S.pbd, opacity: saving ? 0.7 : 1, marginTop:8,
        }}>
          {saving ? t('edit.saving') : t('edit.save_changes')}
        </button>
      </div>
    </div>
  )
}
