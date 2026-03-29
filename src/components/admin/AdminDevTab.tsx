import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { Plus, ChevronDown, ChevronRight, GripVertical, ArrowUp, ArrowDown, Trash2, Edit3, Check, X, Clock, PlayCircle, CheckCircle2, Circle, Ban } from 'lucide-react'

const S = colors

type BacklogItem = {
  id: string
  type: 'epic' | 'story'
  epic_id: string | null
  title: string
  description: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: number
  tags: string[]
  assigned_to: string | null
  estimated_hours: number | null
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; bd: string; icon: typeof Circle }> = {
  backlog:     { label: 'admin.status_backlog',  color: S.tx3,    bg: S.bg2,     bd: S.rule,    icon: Circle },
  todo:        { label: 'admin.status_todo',    color: S.blue,   bg: S.bluebg,  bd: S.bluebd,  icon: Clock },
  in_progress: { label: 'admin.status_in_progress', color: S.orange, bg: S.orangebg,bd: S.orangebd,icon: PlayCircle },
  done:        { label: 'admin.status_done',        color: S.sage,   bg: S.sagebg,  bd: S.sagebd,  icon: CheckCircle2 },
  cancelled:   { label: 'admin.status_cancelled',   color: S.red,    bg: S.redbg,   bd: S.redbd,   icon: Ban },
}

const STATUS_ORDER: string[] = ['backlog', 'todo', 'in_progress', 'done', 'cancelled']

export default function AdminDevTab() {
  const { t } = useTranslation()
  const [items, setItems] = useState<BacklogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [newEpicTitle, setNewEpicTitle] = useState('')
  const [newStoryTitle, setNewStoryTitle] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'backlog' | 'done'>('active')
  const [showAddEpic, setShowAddEpic] = useState(false)
  const [showAddStory, setShowAddStory] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('dev_backlog').select('*').order('priority', { ascending: true })
    if (data) setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const epics = items.filter(i => i.type === 'epic')
  const storiesOf = (epicId: string) => items.filter(i => i.type === 'story' && i.epic_id === epicId).sort((a, b) => a.priority - b.priority)

  const filteredEpics = epics.filter(e => {
    if (filter === 'all') return true
    if (filter === 'active') return e.status === 'todo' || e.status === 'in_progress'
    if (filter === 'backlog') return e.status === 'backlog'
    if (filter === 'done') return e.status === 'done' || e.status === 'cancelled'
    return true
  }).sort((a, b) => a.priority - b.priority)

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  async function updateStatus(id: string, status: string) {
    await supabase.from('dev_backlog').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: status as any, updated_at: new Date().toISOString() } : i))
  }

  async function updatePriority(id: string, direction: 'up' | 'down') {
    const item = items.find(i => i.id === id)
    if (!item) return
    const siblings = item.type === 'epic' ? epics : storiesOf(item.epic_id!)
    const idx = siblings.findIndex(s => s.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const other = siblings[swapIdx]
    await supabase.from('dev_backlog').update({ priority: other.priority }).eq('id', id)
    await supabase.from('dev_backlog').update({ priority: item.priority }).eq('id', other.id)
    setItems(prev => prev.map(i => {
      if (i.id === id) return { ...i, priority: other.priority }
      if (i.id === other.id) return { ...i, priority: item.priority }
      return i
    }))
  }

  async function addEpic() {
    if (!newEpicTitle.trim()) return
    const maxP = Math.max(0, ...epics.map(e => e.priority))
    const { data } = await supabase.from('dev_backlog').insert({
      type: 'epic', title: newEpicTitle.trim(), status: 'backlog', priority: maxP + 10, tags: []
    }).select().single()
    if (data) { setItems(prev => [...prev, data]); setNewEpicTitle(''); setShowAddEpic(false) }
  }

  async function addStory(epicId: string) {
    if (!newStoryTitle.trim()) return
    const stories = storiesOf(epicId)
    const maxP = Math.max(0, ...stories.map(s => s.priority))
    const { data } = await supabase.from('dev_backlog').insert({
      type: 'story', epic_id: epicId, title: newStoryTitle.trim(), status: 'backlog', priority: maxP + 1, tags: []
    }).select().single()
    if (data) { setItems(prev => [...prev, data]); setNewStoryTitle(''); setShowAddStory(null) }
  }

  async function saveEdit(id: string) {
    await supabase.from('dev_backlog').update({ title: editTitle, description: editDesc || null, updated_at: new Date().toISOString() }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, title: editTitle, description: editDesc || null } : i))
    setEditingId(null)
  }

  async function deleteItem(id: string) {
    await supabase.from('dev_backlog').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id && i.epic_id !== id))
  }

  function epicProgress(epicId: string): { done: number; total: number } {
    const stories = storiesOf(epicId)
    return { done: stories.filter(s => s.status === 'done').length, total: stories.length }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const totalStories = items.filter(i => i.type === 'story').length
  const doneStories = items.filter(i => i.type === 'story' && i.status === 'done').length
  const inProgressStories = items.filter(i => i.type === 'story' && i.status === 'in_progress').length

  return (
    <div>
      {/* Header stats */}
      <div style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>DEV BACKLOG</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: S.bg1, borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid ' + S.rule }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: S.tx, fontFamily: fonts.hero }}>{totalStories}</div>
          <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Stories</div>
        </div>
        <div style={{ background: S.bg1, borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid ' + S.sagebd }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: S.sage, fontFamily: fonts.hero }}>{doneStories}</div>
          <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Done</div>
        </div>
        <div style={{ background: S.bg1, borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid ' + S.orangebd }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: S.orange, fontFamily: fonts.hero }}>{inProgressStories}</div>
          <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>{t('admin.status_in_progress')}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: S.rule, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: totalStories > 0 ? (doneStories / totalStories * 100) + '%' : '0%', background: S.sage, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'active', 'backlog', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (filter === f ? S.pbd : S.rule),
            background: filter === f ? S.p2 : 'transparent', color: filter === f ? S.p : S.tx3,
          }}>
            {f === 'all' ? t('admin.filter_all') : f === 'active' ? t('admin.filter_active') : f === 'backlog' ? t('admin.status_backlog') : t('admin.filter_done')}
          </button>
        ))}
        <button onClick={() => setShowAddEpic(!showAddEpic)} style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          border: '1px solid ' + S.pbd, background: S.p2, color: S.p, display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Plus size={12} strokeWidth={2.5} /> Epic
        </button>
      </div>

      {/* Add Epic form */}
      {showAddEpic && (
        <div style={{ background: S.bg1, borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid ' + S.pbd }}>
          <input value={newEpicTitle} onChange={e => setNewEpicTitle(e.target.value)} placeholder={t('admin.epic_placeholder')} onKeyDown={e => e.key === 'Enter' && addEpic()}
            style={{ width: '100%', padding: 10, borderRadius: 10, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addEpic} style={{ flex: 1, padding: 8, borderRadius: 10, background: S.p, border: 'none', color: S.tx, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('admin.add')}</button>
            <button onClick={() => setShowAddEpic(false)} style={{ padding: 8, borderRadius: 10, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx3, fontSize: 12, cursor: 'pointer' }}>{t('admin.cancel')}</button>
          </div>
        </div>
      )}

      {/* Epics list */}
      {filteredEpics.map((epic) => {
        const stories = storiesOf(epic.id)
        const isExpanded = expanded.has(epic.id)
        const prog = epicProgress(epic.id)
        const sc = STATUS_CONFIG[epic.status]
        const Icon = sc.icon

        return (
          <div key={epic.id} style={{ marginBottom: 10 }}>
            {/* Epic header */}
            <div style={{ background: S.bg1, borderRadius: 16, border: '1px solid ' + sc.bd, overflow: 'hidden' }}>
              <div onClick={() => toggle(epic.id)} style={{ padding: '14px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                {isExpanded ? <ChevronDown size={16} strokeWidth={2} style={{ color: S.tx3, flexShrink: 0 }} /> : <ChevronRight size={16} strokeWidth={2} style={{ color: S.tx3, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    {editingId === epic.id ? (
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => e.key === 'Enter' && saveEdit(epic.id)}
                        style={{ flex: 1, padding: 4, borderRadius: 6, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx, fontSize: 14, fontWeight: 700 }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>{epic.title}</span>
                    )}
                  </div>
                  {epic.description && !editingId && <div style={{ fontSize: 11, color: S.tx3, marginTop: 2 }}>{epic.description}</div>}
                  {/* Tags */}
                  {epic.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {epic.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: S.lavbg, color: S.lav, fontWeight: 600, border: '1px solid ' + S.lavbd }}>{t}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, border: '1px solid ' + sc.bd, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Icon size={9} strokeWidth={2} /> {t(sc.label)}
                  </span>
                  {prog.total > 0 && <span style={{ fontSize: 9, color: S.tx3 }}>{prog.done}/{prog.total}</span>}
                </div>
              </div>

              {/* Epic actions bar */}
              {isExpanded && (
                <div style={{ padding: '0 14px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map(s => {
                    const c = STATUS_CONFIG[s]
                    return (
                      <button key={s} onClick={() => updateStatus(epic.id, s)} style={{
                        padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                        background: epic.status === s ? c.bg : 'transparent', color: epic.status === s ? c.color : S.tx4,
                        border: '1px solid ' + (epic.status === s ? c.bd : S.rule),
                      }}>{t(c.label)}</button>
                    )
                  })}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    <button onClick={() => updatePriority(epic.id, 'up')} style={{ padding: 3, borderRadius: 6, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3, cursor: 'pointer' }}><ArrowUp size={11} /></button>
                    <button onClick={() => updatePriority(epic.id, 'down')} style={{ padding: 3, borderRadius: 6, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3, cursor: 'pointer' }}><ArrowDown size={11} /></button>
                    <button onClick={() => { setEditingId(epic.id); setEditTitle(epic.title); setEditDesc(epic.description || '') }} style={{ padding: 3, borderRadius: 6, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3, cursor: 'pointer' }}><Edit3 size={11} /></button>
                    {editingId === epic.id && <>
                      <button onClick={() => saveEdit(epic.id)} style={{ padding: 3, borderRadius: 6, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, cursor: 'pointer' }}><Check size={11} /></button>
                      <button onClick={() => setEditingId(null)} style={{ padding: 3, borderRadius: 6, background: S.redbg, border: '1px solid ' + S.redbd, color: S.red, cursor: 'pointer' }}><X size={11} /></button>
                    </>}
                    <button onClick={() => { if (confirm(t('admin.confirm_delete_epic'))) deleteItem(epic.id) }} style={{ padding: 3, borderRadius: 6, background: S.redbg, border: '1px solid ' + S.redbd, color: S.red, cursor: 'pointer' }}><Trash2 size={11} /></button>
                  </div>
                </div>
              )}

              {/* Stories */}
              {isExpanded && (
                <div style={{ padding: '0 10px 10px' }}>
                  {stories.map((story) => {
                    const stc = STATUS_CONFIG[story.status]
                    const SIcon = stc.icon
                    return (
                      <div key={story.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4, borderRadius: 10, background: S.bg2, border: '1px solid ' + S.rule }}>
                        <GripVertical size={12} style={{ color: S.tx4, flexShrink: 0 }} />
                        <button onClick={() => {
                          const nextIdx = (STATUS_ORDER.indexOf(story.status) + 1) % STATUS_ORDER.length
                          updateStatus(story.id, STATUS_ORDER[nextIdx])
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                          <SIcon size={16} strokeWidth={2} style={{ color: stc.color }} />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editingId === story.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(story.id)}
                                style={{ flex: 1, padding: 4, borderRadius: 6, background: S.bg, border: '1px solid ' + S.rule, color: S.tx, fontSize: 12 }} />
                              <button onClick={() => saveEdit(story.id)} style={{ padding: '2px 6px', borderRadius: 6, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, cursor: 'pointer', fontSize: 10 }}><Check size={10} /></button>
                              <button onClick={() => setEditingId(null)} style={{ padding: '2px 6px', borderRadius: 6, background: S.redbg, border: '1px solid ' + S.redbd, color: S.red, cursor: 'pointer', fontSize: 10 }}><X size={10} /></button>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 12, fontWeight: 600, color: story.status === 'done' ? S.tx3 : S.tx, textDecoration: story.status === 'done' ? 'line-through' : 'none' }}>{story.title}</div>
                              {story.description && <div style={{ fontSize: 10, color: S.tx4, marginTop: 1 }}>{story.description}</div>}
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => updatePriority(story.id, 'up')} style={{ padding: 2, background: 'none', border: 'none', color: S.tx4, cursor: 'pointer' }}><ArrowUp size={10} /></button>
                          <button onClick={() => updatePriority(story.id, 'down')} style={{ padding: 2, background: 'none', border: 'none', color: S.tx4, cursor: 'pointer' }}><ArrowDown size={10} /></button>
                          <button onClick={() => { setEditingId(story.id); setEditTitle(story.title); setEditDesc(story.description || '') }} style={{ padding: 2, background: 'none', border: 'none', color: S.tx4, cursor: 'pointer' }}><Edit3 size={10} /></button>
                          <button onClick={() => deleteItem(story.id)} style={{ padding: 2, background: 'none', border: 'none', color: S.red, cursor: 'pointer' }}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add story */}
                  {showAddStory === epic.id ? (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input value={newStoryTitle} onChange={e => setNewStoryTitle(e.target.value)} placeholder={t('admin.story_placeholder')} onKeyDown={e => e.key === 'Enter' && addStory(epic.id)}
                        style={{ flex: 1, padding: 8, borderRadius: 8, background: S.bg, border: '1px solid ' + S.rule, color: S.tx, fontSize: 12, boxSizing: 'border-box' }} autoFocus />
                      <button onClick={() => addStory(epic.id)} style={{ padding: '6px 12px', borderRadius: 8, background: S.p, border: 'none', color: S.tx, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{t('admin.add')}</button>
                      <button onClick={() => { setShowAddStory(null); setNewStoryTitle('') }} style={{ padding: '6px 8px', borderRadius: 8, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx3, fontSize: 11, cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddStory(epic.id)} style={{
                      marginTop: 6, width: '100%', padding: 8, borderRadius: 8, background: 'transparent', border: '1px dashed ' + S.rule,
                      color: S.tx4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <Plus size={12} strokeWidth={2} /> Story
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {filteredEpics.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: S.tx3, fontSize: 13 }}>
          {t('admin.no_epic')}
        </div>
      )}
    </div>
  )
}
