import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'

const S = colors

type ConfigItem = {
  id: string
  type: string
  slug: string
  label: string
  category: string | null
  sort_order: number
  active: boolean
}

type ConfigType = 'kink' | 'morphology' | 'role' | 'session_tag'

const TYPE_META: Record<ConfigType, { title: string; hasCategory: boolean; categories?: string[] }> = {
  kink: { title: 'Kinks / Pratiques', hasCategory: true, categories: ['SM', 'Pratiques', 'Fetichisme', 'Autre'] },
  morphology: { title: 'Morphologies', hasCategory: false },
  role: { title: 'Roles', hasCategory: false },
  session_tag: { title: 'Tags session', hasCategory: true, categories: ['Vibes', 'Roles', 'Pratiques', 'Lieu'] },
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: S.bg2, color: S.tx, borderRadius: 10,
  padding: '10px 14px', border: `1px solid ${S.rule}`, outline: 'none',
  fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<ConfigType>('kink')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // New item form
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    checkAdmin()
    loadItems()
  }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsAdmin(false); return }
    const { data } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle()
    setIsAdmin(data?.is_admin === true)
  }

  async function loadItems() {
    setLoading(true)
    const { data } = await supabase.from('admin_config').select('*').order('sort_order', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!newLabel.trim()) return
    const slug = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const maxOrder = Math.max(0, ...filtered.map(i => i.sort_order))
    const { error } = await supabase.from('admin_config').insert({
      type: activeType,
      slug,
      label: newLabel.trim(),
      category: TYPE_META[activeType].hasCategory ? (newCategory || null) : null,
      sort_order: maxOrder + 1,
      active: true,
    })
    if (error) return
    setNewLabel('')
    setNewCategory('')
    setShowAdd(false)
    loadItems()
  }

  async function toggleActive(item: ConfigItem) {
    await supabase.from('admin_config').update({ active: !item.active }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i))
  }

  async function deleteItem(item: ConfigItem) {
    if (!window.confirm(`Supprimer "${item.label}" ?`)) return
    await supabase.from('admin_config').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  async function moveItem(item: ConfigItem, direction: 'up' | 'down') {
    const list = filtered.sort((a, b) => a.sort_order - b.sort_order)
    const idx = list.findIndex(i => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= list.length) return
    const other = list[swapIdx]
    await Promise.all([
      supabase.from('admin_config').update({ sort_order: other.sort_order }).eq('id', item.id),
      supabase.from('admin_config').update({ sort_order: item.sort_order }).eq('id', other.id),
    ])
    loadItems()
  }

  const filtered = items.filter(i => i.type === activeType).sort((a, b) => a.sort_order - b.sort_order)
  const meta = TYPE_META[activeType]

  // Group by category if applicable
  const grouped: Record<string, ConfigItem[]> = {}
  if (meta.hasCategory) {
    filtered.forEach(item => {
      const cat = item.category || 'Sans categorie'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(item)
    })
  }

  if (isAdmin === null) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <p style={{ color: S.red, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Acces refuse</p>
      <p style={{ color: S.tx3, fontSize: 13, marginBottom: 24 }}>Cette page est reservee aux administrateurs.</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Retour
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />

      {/* Header */}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={16} strokeWidth={1.5} /> Retour
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, margin: 0 }}>
          Admin
        </h1>
        <p style={{ fontSize: 12, color: S.tx3, marginTop: 4 }}>Gestion des options profil et sessions</p>
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px', overflowX: 'auto' }}>
        {(Object.keys(TYPE_META) as ConfigType[]).map(type => (
          <button key={type} onClick={() => { setActiveType(type); setShowAdd(false) }} style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            border: '1px solid ' + (activeType === type ? S.pbd : S.rule),
            background: activeType === type ? S.p2 : S.bg2,
            color: activeType === type ? S.p : S.tx3,
          }}>
            {TYPE_META[type].title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: S.tx3 }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} — {filtered.filter(i => i.active).length} actif{filtered.filter(i => i.active).length !== 1 ? 's' : ''}
          </span>
          <button onClick={() => setShowAdd(!showAdd)} style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: 'none', background: S.p, color: '#fff', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Plus size={14} strokeWidth={2} /> Ajouter
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: S.bg1, borderRadius: 14, padding: 14, border: '1px solid ' + S.pbd, marginBottom: 12 }}>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" style={{ ...inputStyle, marginBottom: 8 }} onKeyDown={e => e.key === 'Enter' && addItem()} />
            {meta.hasCategory && meta.categories && (
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }}>
                <option value="">-- Categorie --</option>
                {meta.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx3, cursor: 'pointer' }}>Annuler</button>
              <button onClick={addItem} disabled={!newLabel.trim()} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: S.p, color: '#fff', cursor: 'pointer', opacity: newLabel.trim() ? 1 : 0.5 }}>Ajouter</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: '3px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : meta.hasCategory ? (
          /* Grouped view */
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <button onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '10px 12px',
                borderRadius: 12, background: S.bg1, border: '1px solid ' + S.rule, cursor: 'pointer',
                marginBottom: 4,
              }}>
                {expandedCategory === cat ? <ChevronDown size={14} color={S.tx3} strokeWidth={1.5} /> : <ChevronRight size={14} color={S.tx3} strokeWidth={1.5} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat}</span>
                <span style={{ fontSize: 11, color: S.tx4, marginLeft: 'auto' }}>{catItems.length}</span>
              </button>
              {expandedCategory === cat && catItems.map(item => renderItem(item))}
            </div>
          ))
        ) : (
          /* Flat list */
          filtered.map(item => renderItem(item))
        )}
      </div>
    </div>
  )

  function renderItem(item: ConfigItem) {
    return (
      <div key={item.id} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
        background: S.bg1, borderRadius: 12, border: '1px solid ' + (item.active ? S.rule : S.red + '33'),
        marginBottom: 4, opacity: item.active ? 1 : 0.5,
      }}>
        <GripVertical size={14} color={S.tx4} strokeWidth={1.5} style={{ flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: item.active ? S.tx : S.tx3 }}>{item.label}</span>
          {item.category && <span style={{ fontSize: 10, color: S.tx4, marginLeft: 6 }}>{item.category}</span>}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {/* Move up/down */}
          <button onClick={() => moveItem(item, 'up')} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 14 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button onClick={() => moveItem(item, 'down')} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 14 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {/* Toggle active */}
          <button onClick={() => toggleActive(item)} style={{
            width: 28, height: 28, borderRadius: 8,
            border: '1px solid ' + (item.active ? S.sagebd : S.rule),
            background: item.active ? S.sagebg : S.bg2,
            color: item.active ? S.sage : S.tx4,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 12, fontWeight: 700,
          }}>
            {item.active ? '●' : '○'}
          </button>

          {/* Delete */}
          <button onClick={() => deleteItem(item)} style={{
            width: 28, height: 28, borderRadius: 8, border: '1px solid ' + S.red + '33',
            background: 'transparent', color: S.red, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    )
  }
}
