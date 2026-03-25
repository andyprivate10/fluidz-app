import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { Calendar, ChevronDown, ChevronUp, Save, Trash2, MessageSquare, UserCheck } from 'lucide-react'

const S = colors

interface SessionRow {
  id: string
  title: string
  status: string
  host_id: string
  created_at: string
  starts_at: string | null
  ends_at: string | null
  max_capacity: number | null
  tags: string[] | null
  description: string | null
  host_name: string
  app_count: number
  is_published: boolean
}

interface ApplicationRow {
  id: string
  applicant_id: string
  status: string
  applicant_name: string
}

type FilterType = 'all' | 'open' | 'ended'

export default function AdminSessionsTab() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, { title: string; description: string; tags: string }>>({})
  const [apps, setApps] = useState<Record<string, ApplicationRow[]>>({})
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)
    const { data: sessData } = await supabase.from('sessions').select('id, title, status, host_id, created_at, starts_at, ends_at, max_capacity, tags, description, is_published').order('created_at', { ascending: false })

    if (!sessData || sessData.length === 0) { setSessions([]); setLoading(false); return }

    // Get host names
    const hostIds = [...new Set(sessData.map(s => s.host_id))]
    const { data: profiles } = await supabase.from('user_profiles').select('id, display_name').in('id', hostIds)
    const hostMap: Record<string, string> = {}
    for (const p of profiles || []) hostMap[p.id] = p.display_name || '(inconnu)'

    // Count applications per session
    const sessionIds = sessData.map(s => s.id)
    const { data: appData } = await supabase.from('applications').select('session_id').in('session_id', sessionIds)
    const appCountMap: Record<string, number> = {}
    for (const a of appData || []) appCountMap[a.session_id] = (appCountMap[a.session_id] || 0) + 1

    const rows: SessionRow[] = sessData.map(s => ({
      ...s,
      host_name: hostMap[s.host_id] || '(inconnu)',
      app_count: appCountMap[s.id] || 0,
    }))

    setSessions(rows)
    setLoading(false)
  }

  async function toggleExpand(sessionId: string) {
    if (expanded === sessionId) { setExpanded(null); return }
    setExpanded(sessionId)
    const s = sessions.find(x => x.id === sessionId)
    if (s) {
      setEditData(prev => ({ ...prev, [sessionId]: { title: s.title || '', description: s.description || '', tags: (s.tags || []).join(', ') } }))
    }
    // Load applications
    const { data: appData } = await supabase.from('applications').select('id, applicant_id, status').eq('session_id', sessionId)
    if (appData && appData.length > 0) {
      const applicantIds = appData.map(a => a.applicant_id)
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name').in('id', applicantIds)
      const nameMap: Record<string, string> = {}
      for (const p of profiles || []) nameMap[p.id] = p.display_name || '(inconnu)'
      setApps(prev => ({ ...prev, [sessionId]: appData.map(a => ({ ...a, applicant_name: nameMap[a.applicant_id] || '(inconnu)' })) }))
    } else {
      setApps(prev => ({ ...prev, [sessionId]: [] }))
    }
    // Message count
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('session_id', sessionId)
    setMsgCounts(prev => ({ ...prev, [sessionId]: count || 0 }))
  }

  async function saveSession(sessionId: string) {
    setSaving(true)
    const d = editData[sessionId]
    if (!d) { setSaving(false); return }
    const tags = d.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('sessions').update({ title: d.title, description: d.description, tags }).eq('id', sessionId)
    await loadSessions()
    setSaving(false)
  }

  async function setStatus(sessionId: string, status: string) {
    await supabase.from('sessions').update({ status }).eq('id', sessionId)
    await loadSessions()
  }

  async function togglePublish(sessionId: string) {
    const s = sessions.find(x => x.id === sessionId)
    const newVal = s?.is_published === false ? true : false
    await supabase.from('sessions').update({ is_published: newVal }).eq('id', sessionId)
    setSessions(prev => prev.map(x => x.id === sessionId ? { ...x, is_published: newVal } : x))
  }

  async function deleteSession(sessionId: string) {
    if (!confirm(t('admin.confirm_delete_session'))) return
    await supabase.from('sessions').delete().eq('id', sessionId)
    setExpanded(null)
    await loadSessions()
  }

  function statusBadge(status: string) {
    let color: string = S.tx3
    let bg: string = S.bg2
    let bd: string = S.rule
    if (status === 'open' || status === 'live') { color = S.sage; bg = S.sagebg; bd = S.sagebd }
    else if (status === 'ended' || status === 'closed') { color = S.red; bg = S.redbg; bd = S.redbd }
    return { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color, background: bg, border: '1px solid ' + bd, borderRadius: 6, padding: '2px 8px' }
  }

  const filtered = sessions.filter(s => {
    if (filter === 'open') return s.status === 'open' || s.status === 'live'
    if (filter === 'ended') return s.status === 'ended' || s.status === 'closed'
    return true
  })

  if (loading) return <p style={{ color: S.tx3, fontSize: 12 }}>Chargement...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={adminStyles.sectionLabel(S.sage)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={10} strokeWidth={2} />
          SESSIONS
        </span>
      </p>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['all', 'open', 'ended'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...adminStyles.btnSecondary,
            padding: '6px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            borderColor: filter === f ? S.sage + '44' : S.rule,
            background: filter === f ? S.sagebg : S.bg2,
            color: filter === f ? S.sage : S.tx3,
          }}>
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Ended'}
          </button>
        ))}
      </div>

      {filtered.map(s => {
        const isOpen = expanded === s.id
        return (
          <div key={s.id} style={{ ...adminStyles.card, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => toggleExpand(s.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title || '(sans titre)'}
                </div>
                <div style={{ fontSize: 10, color: S.tx3, marginTop: 2 }}>
                  {s.host_name} &middot; {s.app_count} membre{s.app_count !== 1 ? 's' : ''} &middot; {new Date(s.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span style={statusBadge(s.status)}>{s.status}</span>
              {isOpen ? <ChevronUp size={14} style={{ color: S.tx3 }} /> : <ChevronDown size={14} style={{ color: S.tx3 }} />}
            </button>

            {isOpen && editData[s.id] && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid ' + S.rule }}>
                <div style={{ paddingTop: 12 }}>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Titre</label>
                  <input style={adminStyles.input} value={editData[s.id].title} onChange={e => setEditData(prev => ({ ...prev, [s.id]: { ...prev[s.id], title: e.target.value } }))} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Description</label>
                  <textarea style={{ ...adminStyles.input, minHeight: 60, resize: 'vertical' }} value={editData[s.id].description} onChange={e => setEditData(prev => ({ ...prev, [s.id]: { ...prev[s.id], description: e.target.value } }))} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Tags (virgule-sep)</label>
                  <input style={adminStyles.input} value={editData[s.id].tags} onChange={e => setEditData(prev => ({ ...prev, [s.id]: { ...prev[s.id], tags: e.target.value } }))} />
                </div>

                {/* Status actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => setStatus(s.id, 'open')} style={{ ...adminStyles.btnSecondary, fontSize: 11, padding: '6px 12px' }}>Set Open</button>
                  <button onClick={() => setStatus(s.id, 'ended')} style={{ ...adminStyles.btnSecondary, fontSize: 11, padding: '6px 12px' }}>Set Ended</button>
                  <button onClick={() => deleteSession(s.id)} style={{ ...adminStyles.btnDanger, fontSize: 11, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={11} strokeWidth={1.5} /> {t('common.delete')}
                  </button>
                </div>

                {/* Published toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.is_published !== false ? S.sage : S.tx3 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.is_published !== false ? S.sage : S.tx3, flex: 1 }}>
                    {s.is_published !== false ? 'Published' : 'Unpublished'}
                  </span>
                  <button onClick={() => togglePublish(s.id)} style={{ ...adminStyles.btnSecondary, fontSize: 10, padding: '4px 10px' }}>
                    Toggle
                  </button>
                </div>

                {/* Applications list */}
                {(apps[s.id] || []).length > 0 && (
                  <div>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserCheck size={10} strokeWidth={2} /> Applications ({apps[s.id].length})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {apps[s.id].map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: S.bg2, borderRadius: 8, border: '1px solid ' + S.rule }}>
                          <span style={{ fontSize: 12, color: S.tx }}>{a.applicant_name}</span>
                          <span style={statusBadge(a.status)}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: S.tx3 }}>
                  <MessageSquare size={11} strokeWidth={1.5} />
                  {msgCounts[s.id] ?? 0} message{(msgCounts[s.id] ?? 0) !== 1 ? 's' : ''}
                </div>

                {/* Save */}
                <button onClick={() => saveSession(s.id)} disabled={saving} style={{ ...adminStyles.btnPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: saving ? 0.6 : 1 }}>
                  <Save size={12} strokeWidth={2} /> Sauvegarder
                </button>
              </div>
            )}
          </div>
        )
      })}

      {filtered.length === 0 && <p style={{ color: S.tx3, fontSize: 12, textAlign: 'center', padding: 24 }}>Aucune session</p>}
    </div>
  )
}
