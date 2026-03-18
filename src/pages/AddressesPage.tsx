import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage } from '../lib/media'
import {MapPin, Plus, Trash2, Camera, ChevronDown, ChevronUp, X, ArrowLeft} from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'

const S = colors

type DirectionStep = { text: string; photo_url?: string }
type SavedAddress = {
  id: string
  label: string
  approx_area: string
  exact_address: string
  directions: DirectionStep[]
  created_at: string
}

const inp: React.CSSProperties = { width:'100%',background:S.bg2,color:S.tx,borderRadius:12,padding:'12px 14px',border:'1px solid '+S.rule,outline:'none',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' }

export default function AddressesPage() {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [label, setLabel] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [directions, setDirections] = useState<DirectionStep[]>([{ text: '' }])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUserId(user.id)
      loadAddresses(user.id)
    })
  }, [])

  async function loadAddresses(uid: string) {
    const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', uid).maybeSingle()
    const pj = (data?.profile_json || {}) as Record<string, unknown>
    const addrs = Array.isArray(pj.saved_addresses) ? pj.saved_addresses as SavedAddress[] : []
    // Migration: convert old format to new
    const migrated = addrs.map((a: any, i: number) => ({
      id: a.id || `addr_${i}`,
      label: a.label || a.approx_area || `Adresse ${i + 1}`,
      approx_area: a.approx_area || '',
      exact_address: a.exact_address || '',
      directions: Array.isArray(a.directions) ? a.directions.map((d: any) => typeof d === 'string' ? { text: d } : d) : [],
      created_at: a.created_at || new Date().toISOString(),
    }))
    setAddresses(migrated)
    setLoading(false)
  }

  function openCreate() {
    setEditId(null); setLabel(''); setApproxArea(''); setExactAddress(''); setDirections([{ text: '' }]); setShowForm(true)
  }

  function openEdit(addr: SavedAddress) {
    setEditId(addr.id); setLabel(addr.label); setApproxArea(addr.approx_area); setExactAddress(addr.exact_address)
    setDirections(addr.directions.length > 0 ? addr.directions : [{ text: '' }]); setShowForm(true)
  }

  async function save() {
    if (!userId || !label.trim() || !exactAddress.trim()) { showToast('Nom et adresse requis', 'error'); return }
    setSaving(true)

    const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
    const pj = (data?.profile_json || {}) as Record<string, unknown>
    const existing = Array.isArray(pj.saved_addresses) ? [...pj.saved_addresses as SavedAddress[]] : []

    const dirFiltered = directions.filter(d => d.text.trim() || d.photo_url)
    const newAddr: SavedAddress = {
      id: editId || `addr_${Date.now()}`,
      label: label.trim(),
      approx_area: approxArea.trim(),
      exact_address: exactAddress.trim(),
      directions: dirFiltered,
      created_at: editId ? (existing.find((a: any) => a.id === editId) as any)?.created_at || new Date().toISOString() : new Date().toISOString(),
    }

    let updated: SavedAddress[]
    if (editId) {
      updated = existing.map((a: any) => a.id === editId ? newAddr : a)
    } else {
      updated = [...existing, newAddr]
    }

    await supabase.from('user_profiles').update({ profile_json: { ...pj, saved_addresses: updated } }).eq('id', userId)
    setAddresses(updated)
    setShowForm(false)
    setSaving(false)
    showToast(editId ? 'Adresse mise à jour' : 'Adresse sauvegardée', 'success')
  }

  async function deleteAddress(addrId: string) {
    if (!userId || !window.confirm('Supprimer cette adresse ?')) return
    const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
    const pj = (data?.profile_json || {}) as Record<string, unknown>
    const existing = Array.isArray(pj.saved_addresses) ? pj.saved_addresses as SavedAddress[] : []
    const updated = existing.filter((a: any) => a.id !== addrId)
    await supabase.from('user_profiles').update({ profile_json: { ...pj, saved_addresses: updated } }).eq('id', userId)
    setAddresses(updated)
    showToast('Adresse supprimée', 'info')
  }

  async function uploadStepPhoto(stepIndex: number, file: File) {
    if (!userId) return
    setUploading(stepIndex)
    try {
      const compressed = await compressImage(file)
      const path = `${userId}/addr_step_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: false })
      if (error) { showToast('Erreur upload', 'error'); setUploading(null); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setDirections(prev => prev.map((d, i) => i === stepIndex ? { ...d, photo_url: publicUrl } : d))
    } catch { showToast('Erreur upload', 'error') }
    setUploading(null)
  }

  function updateStep(index: number, text: string) {
    setDirections(prev => prev.map((d, i) => i === index ? { ...d, text } : d))
  }
  function addStep() { setDirections(prev => [...prev, { text: '' }]) }
  function removeStep(index: number) { setDirections(prev => prev.filter((_, i) => i !== index)) }

  return (
    <div style={{ background:S.bg, minHeight:'100vh', position: 'relative' as const, maxWidth:480, margin:'0 auto', paddingBottom:40 }}>
      <div style={{ padding:'40px 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',padding:0,marginBottom:12 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 2px' }}>Mes adresses</h1>
            <p style={{ fontSize:12,color:S.tx3,margin:0 }}>{addresses.length} adresse{addresses.length !== 1 ? 's' : ''} sauvegardée{addresses.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} style={{ width:36,height:36,borderRadius:10,background:S.grad,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Plus size={18} style={{ color:'#fff' }} />
          </button>
        </div>
      </div>

      <div style={{ padding:'0 20px',display:'flex',flexDirection:'column',gap:10 }}>
        {loading && <p style={{ color:S.tx3,textAlign:'center',padding:24 }}>Chargement...</p>}
        {!loading && addresses.length === 0 && (
          <div style={{ textAlign:'center',padding:40,color:S.tx3 }}>
            <MapPin size={32} style={{ color:S.tx4,marginBottom:8 }} />
            <p style={{ fontSize:14,fontWeight:600,margin:'0 0 6px' }}>Aucune adresse</p>
            <p style={{ fontSize:12 }}>Sauvegarde tes adresses pour les réutiliser</p>
          </div>
        )}

        {addresses.map(addr => {
          const isExpanded = expandedId === addr.id
          return (
            <div key={addr.id} style={{ background:S.bg1,border:'1px solid '+S.rule,borderRadius:16,overflow:'hidden' }}>
      <OrbLayer />
              <div onClick={() => setExpandedId(isExpanded ? null : addr.id)} style={{ padding:16,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:15,fontWeight:700,color:S.tx,margin:0 }}>{addr.label}</p>
                  <p style={{ fontSize:12,color:S.tx3,margin:'2px 0 0' }}>{addr.approx_area}</p>
                </div>
                {isExpanded ? <ChevronUp size={16} style={{ color:S.tx3 }} /> : <ChevronDown size={16} style={{ color:S.tx3 }} />}
              </div>
              {isExpanded && (
                <div style={{ padding:'0 16px 16px',borderTop:'1px solid '+S.rule }}>
                  <p style={{ fontSize:13,color:S.tx,fontWeight:600,margin:'12px 0 4px' }}>{addr.exact_address}</p>
                  {addr.directions.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      <p style={{ fontSize:11,fontWeight:700,color:S.tx3,margin:'0 0 6px' }}>ÉTAPES D'ACCÈS</p>
                      {addr.directions.map((step, i) => (
                        <div key={i} style={{ display:'flex',gap:8,marginBottom:8,alignItems:'flex-start' }}>
                          <span style={{ fontSize:12,fontWeight:700,color:S.p,minWidth:20 }}>{i+1}.</span>
                          <div style={{ flex:1 }}>
                            <p style={{ fontSize:13,color:S.tx2,margin:0,lineHeight:1.4 }}>{step.text}</p>
                            {step.photo_url && <img src={step.photo_url} alt="" style={{ width:'100%',maxWidth:200,height:120,objectFit:'cover',borderRadius:10,marginTop:4,border:'1px solid '+S.rule }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex',gap:8,marginTop:12 }}>
                    <button onClick={() => openEdit(addr)} style={{ flex:1,padding:'8px',borderRadius:10,fontSize:12,fontWeight:600,color:S.p,border:'1px solid '+S.p+'44',background:S.p+'14',cursor:'pointer' }}>Modifier</button>
                    <button onClick={() => deleteAddress(addr.id)} style={{ padding:'8px 12px',borderRadius:10,fontSize:12,color:S.red,border:'1px solid '+S.red+'33',background:'transparent',cursor:'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create/Edit sheet */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',flexDirection:'column',justifyContent:'flex-end' }}>
          <div onClick={() => setShowForm(false)} style={{ flex:1,background:'rgba(0,0,0,0.6)' }} />
          <div style={{ background:S.bg1,borderRadius:'24px 24px 0 0',padding:'20px 20px 40px',maxHeight:'85vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <h2 style={{ fontSize:18,fontWeight:800,color:S.tx,margin:0 }}>{editId ? 'Modifier' : 'Nouvelle adresse'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none',border:'none',color:S.tx3,cursor:'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:S.tx3,marginBottom:4,display:'block' }}>NOM</label>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Chez moi, Le studio..." maxLength={40} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:S.tx3,marginBottom:4,display:'block' }}>ZONE APPROXIMATIVE</label>
                <input value={approxArea} onChange={e => setApproxArea(e.target.value)} placeholder="Paris 4ème, Métro Saint-Paul..." maxLength={60} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:S.tx3,marginBottom:4,display:'block' }}>ADRESSE EXACTE</label>
                <input value={exactAddress} onChange={e => setExactAddress(e.target.value)} placeholder="14 rue de la Roquette, code 4521" maxLength={100} style={inp} />
              </div>

              {/* Directions */}
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8,display:'block' }}>ÉTAPES D'ACCÈS (optionnel)</label>
                {directions.map((step, i) => (
                  <div key={i} style={{ marginBottom:10,padding:12,background:S.bg,borderRadius:12,border:'1px solid '+S.rule }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                      <span style={{ fontSize:12,fontWeight:700,color:S.p }}>Étape {i+1}</span>
                      {directions.length > 1 && <button onClick={() => removeStep(i)} style={{ marginLeft:'auto',background:'none',border:'none',color:S.red,cursor:'pointer',padding:2,opacity:0.6 }}><Trash2 size={12} /></button>}
                    </div>
                    <input value={step.text} onChange={e => updateStep(i, e.target.value)} placeholder="Rentre par le parking, 2ème sous-sol..." maxLength={150} style={{ ...inp,fontSize:13 }} />
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:6 }}>
                      {step.photo_url ? (
                        <div style={{ position:'relative' }}>
                          <img src={step.photo_url} alt="" style={{ width:60,height:60,borderRadius:8,objectFit:'cover',border:'1px solid '+S.rule }} />
                          <button onClick={() => setDirections(prev => prev.map((d,j) => j === i ? { ...d, photo_url: undefined } : d))} style={{ position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:S.red,border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
                        </div>
                      ) : (
                        <label style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:8,border:'1px solid '+S.rule,background:S.bg2,color:S.tx3,fontSize:11,fontWeight:600,cursor:'pointer' }}>
                          <Camera size={12} /> {uploading === i ? 'Upload...' : 'Photo'}
                          <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadStepPhoto(i, f) }} style={{ display:'none' }} />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addStep} style={{ width:'100%',padding:'8px',borderRadius:10,fontSize:12,fontWeight:600,color:S.tx3,border:'1px dashed '+S.rule,background:'transparent',cursor:'pointer' }}>
                  + Ajouter une étape
                </button>
              </div>

              <button onClick={save} disabled={saving || !label.trim() || !exactAddress.trim()} style={{
                width:'100%',padding:14,borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',
                cursor: saving ? 'not-allowed' : 'pointer',opacity: saving || !label.trim() || !exactAddress.trim() ? 0.6 : 1,
              }}>
                {saving ? 'Sauvegarde...' : editId ? 'Mettre à jour' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
