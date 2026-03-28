import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Tag, Users, Layers, Heart } from 'lucide-react'

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

type SubTab = 'kink' | 'role' | 'morphology' | 'session_tag'

const SUB_TABS: { id: SubTab; label: string; icon: typeof Tag }[] = [
  { id: 'kink', label: 'Kinks', icon: Heart },
  { id: 'role', label: 'Roles', icon: Users },
  { id: 'morphology', label: 'Morphologies', icon: Layers },
  { id: 'session_tag', label: 'Tags session', icon: Tag },
]

const HAS_CATEGORY: SubTab[] = ['kink', 'session_tag']

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminConfigTab() {
  const [subTab, setSubTab] = useState<SubTab>('kink')
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('admin_config')
      .select('*')
      .eq('type', subTab)
      .order('sort_order')
    setItems((data as ConfigItem[]) || [])
    setLoading(false)
  }, [subTab])

  const fetchUsageCounts = useCallback(async () => {
    if (subTab !== 'kink') { setUsageCounts({}); return }
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('profile_json')
    if (!profiles) return
    const counts: Record<string, number> = {}
    for (const p of profiles) {
      const kinks: string[] = (p.profile_json as Record<string, unknown>)?.kinks as string[] || []
      for (const k of kinks) {
        const s = slugify(k)
        counts[s] = (counts[s] || 0) + 1
      }
    }
    setUsageCounts(counts)
  }, [subTab])

  useEffect(() => { fetchItems(); fetchUsageCounts() }, [fetchItems, fetchUsageCounts])

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    const slug = slugify(newLabel)
    const maxOrder = items.reduce((mx, i) => Math.max(mx, i.sort_order), -1)
    const { error } = await supabase.from('admin_config').insert({
      type: subTab,
      slug,
      label: newLabel.trim(),
      category: HAS_CATEGORY.includes(subTab) && newCategory.trim() ? newCategory.trim() : null,
      sort_order: maxOrder + 1,
      active: true,
    })
    if (!error) {
      setNewLabel('')
      setNewCategory('')
      fetchItems()
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    await supabase.from('admin_config').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchItems()
  }

  const handleToggle = async (item: ConfigItem) => {
    await supabase.from('admin_config').update({ active: !item.active }).eq('id', item.id)
    fetchItems()
  }

  const handleMove = async (item: ConfigItem, direction: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    const other = items[swapIdx]
    await supabase.from('admin_config').update({ sort_order: other.sort_order }).eq('id', item.id)
    await supabase.from('admin_config').update({ sort_order: item.sort_order }).eq('id', other.id)
    fetchItems()
  }

  const handleBulkToggle = async (active: boolean) => {
    const ids = items.map(i => i.id)
    if (ids.length === 0) return
    await supabase.from('admin_config').update({ active }).in('id', ids)
    fetchItems()
  }

  const toggleCollapse = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Group by category
  const grouped: { category: string; items: ConfigItem[] }[] = []
  if (HAS_CATEGORY.includes(subTab)) {
    const catMap = new Map<string, ConfigItem[]>()
    for (const item of items) {
      const cat = item.category || 'Sans categorie'
      if (!catMap.has(cat)) catMap.set(cat, [])
      catMap.get(cat)!.push(item)
    }
    for (const [cat, catItems] of catMap) {
      grouped.push({ category: cat, items: catItems })
    }
  } else {
    grouped.push({ category: '', items })
  }

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={adminStyles.sectionLabel(S.blue)}>OPTIONS PROFIL</p>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {SUB_TABS.map(t => {
          const active = subTab === t.id
          return (
            <button key={t.id} onClick={() => { setSubTab(t.id); setDeleteConfirm(null) }} style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
              border: '1px solid ' + (active ? S.blue + '55' : S.rule),
              background: active ? S.bluebg : 'transparent',
              color: active ? S.blue : S.tx3,
            }}>
              <t.icon size={12} strokeWidth={1.5} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Add form */}
      <div style={{ ...adminStyles.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Nouveau label..."
            style={{ ...adminStyles.input, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {HAS_CATEGORY.includes(subTab) && (
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{ ...adminStyles.input, flex: 0.6, cursor: 'pointer' }}
            >
              <option value="">Categorie...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ Nouvelle</option>
            </select>
          )}
          <button onClick={handleAdd} style={{ ...adminStyles.btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} strokeWidth={2} /> Ajouter
          </button>
        </div>
        {newCategory === '__new' && HAS_CATEGORY.includes(subTab) && (
          <input
            value=""
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Nom de la nouvelle categorie..."
            style={adminStyles.input}
          />
        )}
        {newLabel.trim() && (
          <span style={{ fontSize: 10, color: S.tx3 }}>slug: {slugify(newLabel)}</span>
        )}
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => handleBulkToggle(true)} style={{ ...adminStyles.btnSecondary, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <ToggleRight size={13} strokeWidth={1.5} /> Tout activer
        </button>
        <button onClick={() => handleBulkToggle(false)} style={{ ...adminStyles.btnSecondary, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <ToggleLeft size={13} strokeWidth={1.5} /> Tout desactiver
        </button>
        <span style={{ fontSize: 11, color: S.tx3, marginLeft: 'auto', alignSelf: 'center' }}>
          {items.length} element{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Items list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: S.tx3, fontSize: 12 }}>Chargement...</div>
      ) : (
        grouped.map(group => (
          <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {group.category && (
              <button
                onClick={() => toggleCollapse(group.category)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                  display: 'flex', alignItems: 'center', gap: 4, color: S.tx2, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  style={{
                    transform: collapsedCats.has(group.category) ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.15s',
                  }}
                />
                {group.category} ({group.items.length})
              </button>
            )}
            {!collapsedCats.has(group.category) && group.items.map((item) => (
              <div key={item.id} style={{
                ...adminStyles.card,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: item.active ? 1 : 0.45,
              }}>
                {/* Reorder buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <button onClick={() => handleMove(item, 'up')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: S.tx3, lineHeight: 1 }}>
                    <ChevronUp size={13} strokeWidth={2} />
                  </button>
                  <button onClick={() => handleMove(item, 'down')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: S.tx3, lineHeight: 1 }}>
                    <ChevronDown size={13} strokeWidth={2} />
                  </button>
                </div>

                {/* Label + slug */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: S.tx, fontFamily: fonts.hero }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: S.tx3, marginTop: 1 }}>
                    {item.slug}
                    {subTab === 'kink' && usageCounts[item.slug] !== undefined && (
                      <span style={{ marginLeft: 8, color: S.lav }}>
                        {usageCounts[item.slug]} profil{usageCounts[item.slug] !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Active toggle */}
                <button onClick={() => handleToggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: item.active ? S.sage : S.tx3 }}>
                  {item.active ? <ToggleRight size={18} strokeWidth={1.5} /> : <ToggleLeft size={18} strokeWidth={1.5} />}
                </button>

                {/* Delete */}
                <button onClick={() => handleDelete(item.id)} style={{
                  ...adminStyles.btnDanger,
                  padding: '4px 8px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <Trash2 size={12} strokeWidth={1.5} />
                  {deleteConfirm === item.id ? 'Confirm' : ''}
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
