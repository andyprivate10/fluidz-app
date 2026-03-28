import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { LayoutTemplate, Plus, Save, Trash2, ChevronUp as MoveUp, ChevronDown as MoveDown, ToggleLeft, ToggleRight } from 'lucide-react'

const S = colors

interface TemplateRow {
  id: string
  type: string
  label: string
  slug: string
  value: string
  sort_order: number
  is_active: boolean
  tags?: string
}

function toSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminTemplatesTab() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ label: string; tags: string; sort_order: number }>({ label: '', tags: '', sort_order: 0 })
  const [showAdd, setShowAdd] = useState(false)
  const [addData, setAddData] = useState<{ label: string; tags: string; sort_order: number }>({ label: '', tags: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true)
    const { data } = await supabase.from('admin_config').select('*').eq('type', 'session_template').order('sort_order')
    const rows: TemplateRow[] = (data || []).map(r => {
      let parsed: Record<string, unknown> = {}
      try { parsed = typeof r.value === 'string' ? JSON.parse(r.value) : (r.value || {}) } catch { /* ignore */ }
      return {
        id: r.id,
        type: r.type,
        label: r.label || '',
        slug: r.slug || '',
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value || ''),
        sort_order: r.sort_order ?? 0,
        is_active: (parsed as Record<string, unknown>).is_active !== false,
        tags: (parsed as Record<string, unknown>).tags as string || '',
      }
    })
    setTemplates(rows)
    setLoading(false)
  }

  function startEdit(t: TemplateRow) {
    setEditingId(t.id)
    setEditData({ label: t.label, tags: t.tags || '', sort_order: t.sort_order })
    setShowAdd(false)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const t = templates.find(x => x.id === editingId)
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(t?.value || '{}') } catch { /* ignore */ }
    parsed.tags = editData.tags
    parsed.is_active = (parsed as Record<string, unknown>).is_active !== false
    await supabase.from('admin_config').update({
      label: editData.label,
      slug: toSlug(editData.label),
      sort_order: editData.sort_order,
      value: JSON.stringify(parsed),
    }).eq('id', editingId)
    setEditingId(null)
    await loadTemplates()
    setSaving(false)
  }

  async function addTemplate() {
    if (!addData.label.trim()) return
    setSaving(true)
    const value = JSON.stringify({ tags: addData.tags, is_active: true })
    await supabase.from('admin_config').insert({
      type: 'session_template',
      label: addData.label.trim(),
      slug: toSlug(addData.label),
      value,
      sort_order: addData.sort_order,
    })
    setShowAdd(false)
    setAddData({ label: '', tags: '', sort_order: 0 })
    await loadTemplates()
    setSaving(false)
  }

  async function deleteTemplate(id: string) {
    if (!confirm(t('admin.confirm_delete_template'))) return
    await supabase.from('admin_config').delete().eq('id', id)
    if (editingId === id) setEditingId(null)
    await loadTemplates()
  }

  async function toggleActive(t: TemplateRow) {
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(t.value || '{}') } catch { /* ignore */ }
    parsed.is_active = !t.is_active
    await supabase.from('admin_config').update({ value: JSON.stringify(parsed) }).eq('id', t.id)
    await loadTemplates()
  }

  async function moveOrder(t: TemplateRow, direction: -1 | 1) {
    const idx = templates.findIndex(x => x.id === t.id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= templates.length) return
    const other = templates[swapIdx]
    await supabase.from('admin_config').update({ sort_order: other.sort_order }).eq('id', t.id)
    await supabase.from('admin_config').update({ sort_order: t.sort_order }).eq('id', other.id)
    await loadTemplates()
  }

  if (loading) return <p style={{ color: S.tx3, fontSize: 12 }}>Chargement...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ ...adminStyles.sectionLabel(S.amber), margin: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <LayoutTemplate size={10} strokeWidth={2} />
            TEMPLATES
          </span>
        </p>
        <button onClick={() => { setShowAdd(!showAdd); setEditingId(null) }} style={{ ...adminStyles.btnSecondary, padding: '4px 10px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={11} strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ ...adminStyles.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Label</label>
            <input style={adminStyles.input} value={addData.label} onChange={e => setAddData(prev => ({ ...prev, label: e.target.value }))} placeholder="Nom du template" />
          </div>
          {addData.label && (
            <div style={{ fontSize: 10, color: S.tx3 }}>Slug: {toSlug(addData.label)}</div>
          )}
          <div>
            <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Tags (virgule-sep)</label>
            <input style={adminStyles.input} value={addData.tags} onChange={e => setAddData(prev => ({ ...prev, tags: e.target.value }))} placeholder="tag1, tag2" />
          </div>
          <div>
            <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Sort Order</label>
            <input type="number" style={adminStyles.input} value={addData.sort_order} onChange={e => setAddData(prev => ({ ...prev, sort_order: Number(e.target.value) }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addTemplate} disabled={saving || !addData.label.trim()} style={{ ...adminStyles.btnPrimary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: saving || !addData.label.trim() ? 0.5 : 1 }}>
              <Save size={12} strokeWidth={2} /> Creer
            </button>
            <button onClick={() => setShowAdd(false)} style={adminStyles.btnSecondary}>Annuler</button>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !showAdd && (
        <p style={{ color: S.tx3, fontSize: 12, textAlign: 'center', padding: 24 }}>Aucun template</p>
      )}

      {templates.map((t, idx) => {
        const isEditing = editingId === t.id
        return (
          <div key={t.id} style={{ ...adminStyles.card, padding: 0, overflow: 'hidden' }}>
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => moveOrder(t, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: 0, color: idx === 0 ? S.tx4 : S.tx3, lineHeight: 1 }}>
                  <MoveUp size={12} strokeWidth={2} />
                </button>
                <button onClick={() => moveOrder(t, 1)} disabled={idx === templates.length - 1} style={{ background: 'none', border: 'none', cursor: idx === templates.length - 1 ? 'default' : 'pointer', padding: 0, color: idx === templates.length - 1 ? S.tx4 : S.tx3, lineHeight: 1 }}>
                  <MoveDown size={12} strokeWidth={2} />
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => startEdit(t)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.tx, fontFamily: fonts.hero }}>{t.label}</div>
                <div style={{ fontSize: 10, color: S.tx3, marginTop: 2 }}>
                  {t.tags && <span>{t.tags}</span>}
                  {t.tags && ' · '}
                  order: {t.sort_order}
                </div>
              </div>
              <button onClick={() => toggleActive(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: t.is_active ? S.sage : S.tx3, lineHeight: 1 }}>
                {t.is_active ? <ToggleRight size={22} strokeWidth={1.5} /> : <ToggleLeft size={22} strokeWidth={1.5} />}
              </button>
              <button onClick={() => deleteTemplate(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: S.red, lineHeight: 1 }}>
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid ' + S.rule }}>
                <div style={{ paddingTop: 10 }}>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Label</label>
                  <input style={adminStyles.input} value={editData.label} onChange={e => setEditData(prev => ({ ...prev, label: e.target.value }))} />
                </div>
                {editData.label && (
                  <div style={{ fontSize: 10, color: S.tx3 }}>Slug: {toSlug(editData.label)}</div>
                )}
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Tags (virgule-sep)</label>
                  <input style={adminStyles.input} value={editData.tags} onChange={e => setEditData(prev => ({ ...prev, tags: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Sort Order</label>
                  <input type="number" style={adminStyles.input} value={editData.sort_order} onChange={e => setEditData(prev => ({ ...prev, sort_order: Number(e.target.value) }))} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} disabled={saving} style={{ ...adminStyles.btnPrimary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: saving ? 0.6 : 1 }}>
                    <Save size={12} strokeWidth={2} /> Sauvegarder
                  </button>
                  <button onClick={() => setEditingId(null)} style={adminStyles.btnSecondary}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
