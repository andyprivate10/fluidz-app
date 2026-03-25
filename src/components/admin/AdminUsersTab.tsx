import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { Users, ChevronDown, ChevronUp, Save, ExternalLink, RotateCcw, ShieldCheck } from 'lucide-react'

const S = colors

interface ProfileJson {
  avatar_url?: string
  role?: string
  bio?: string
  age?: number
  location?: string
  morphology?: string
  kinks?: string[]
  limits?: string
  health_status?: string
  last_test_date?: string
  [key: string]: unknown
}

interface UserProfile {
  id: string
  display_name: string
  profile_json: ProfileJson | null
  is_admin: boolean
}

interface ConfigOption {
  id: string
  type: string
  label: string
  value: string
}

export default function AdminUsersTab() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, ProfileJson & { display_name: string }>>({})
  const [saving, setSaving] = useState(false)
  const [configOptions, setConfigOptions] = useState<{ morphology: ConfigOption[]; role: ConfigOption[]; kink: ConfigOption[] }>({ morphology: [], role: [], kink: [] })

  useEffect(() => { loadUsers(); loadConfig() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('user_profiles').select('id, display_name, profile_json, is_admin').order('display_name')
    setUsers((data as UserProfile[]) || [])
    setLoading(false)
  }

  async function loadConfig() {
    const { data } = await supabase.from('admin_config').select('id, type, label, value').in('type', ['morphology', 'role', 'kink']).order('sort_order')
    const opts = { morphology: [] as ConfigOption[], role: [] as ConfigOption[], kink: [] as ConfigOption[] }
    for (const row of (data || []) as ConfigOption[]) {
      if (row.type in opts) opts[row.type as keyof typeof opts].push(row)
    }
    setConfigOptions(opts)
  }

  function toggleExpand(userId: string) {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    const u = users.find(x => x.id === userId)
    if (u) {
      const pj = u.profile_json || {}
      setEditData(prev => ({
        ...prev,
        [userId]: {
          display_name: u.display_name || '',
          bio: pj.bio || '',
          age: pj.age || undefined,
          location: pj.location || '',
          morphology: pj.morphology || '',
          role: pj.role || '',
          kinks: pj.kinks || [],
          limits: pj.limits || '',
          health_status: pj.health_status || '',
          last_test_date: pj.last_test_date || '',
        },
      }))
    }
  }

  function updateField(userId: string, field: string, value: unknown) {
    setEditData(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }))
  }

  function toggleKink(userId: string, kinkValue: string) {
    const current = (editData[userId]?.kinks as string[]) || []
    const next = current.includes(kinkValue) ? current.filter(k => k !== kinkValue) : [...current, kinkValue]
    updateField(userId, 'kinks', next)
  }

  async function saveUser(userId: string) {
    setSaving(true)
    const d = editData[userId]
    if (!d) { setSaving(false); return }
    const { display_name, ...rest } = d
    const existing = users.find(u => u.id === userId)?.profile_json || {}
    const profile_json = { ...existing, ...rest }
    await supabase.from('user_profiles').update({ display_name, profile_json }).eq('id', userId)
    await loadUsers()
    setSaving(false)
  }

  async function resetProfile(userId: string) {
    if (!confirm(t('admin.confirm_reset_profile'))) return
    const u = users.find(x => x.id === userId)
    await supabase.from('user_profiles').update({ profile_json: {} }).eq('id', userId)
    if (u) setEditData(prev => ({ ...prev, [userId]: { display_name: u.display_name } }))
    await loadUsers()
  }

  if (loading) return <p style={{ color: S.tx3, fontSize: 12 }}>Chargement...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={adminStyles.sectionLabel(S.lav)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Users size={10} strokeWidth={2} />
          COMPTES
        </span>
      </p>

      {users.map(u => {
        const pj = u.profile_json || {}
        const isOpen = expanded === u.id
        return (
          <div key={u.id} style={{ ...adminStyles.card, padding: 0, overflow: 'hidden' }}>
            {/* Row header */}
            <button
              onClick={() => toggleExpand(u.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {pj.avatar_url ? (
                <img src={pj.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.bg2, border: '1px solid ' + S.rule, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.display_name || '(sans nom)'}
                </div>
                {pj.role && <div style={{ fontSize: 10, color: S.tx3, marginTop: 2 }}>{pj.role}</div>}
              </div>
              {u.is_admin && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.amber, background: S.amberbg, border: '1px solid ' + S.amberbd, borderRadius: 6, padding: '2px 6px' }}>
                  <ShieldCheck size={10} strokeWidth={2} />
                  Admin
                </span>
              )}
              {isOpen ? <ChevronUp size={14} style={{ color: S.tx3 }} /> : <ChevronDown size={14} style={{ color: S.tx3 }} />}
            </button>

            {/* Expanded edit form */}
            {isOpen && editData[u.id] && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid ' + S.rule }}>
                <div style={{ paddingTop: 12 }}>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Display Name</label>
                  <input style={adminStyles.input} value={editData[u.id].display_name || ''} onChange={e => updateField(u.id, 'display_name', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Bio</label>
                  <textarea style={{ ...adminStyles.input, minHeight: 60, resize: 'vertical' }} value={(editData[u.id].bio as string) || ''} onChange={e => updateField(u.id, 'bio', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Age</label>
                    <input type="number" style={adminStyles.input} value={(editData[u.id].age as number) || ''} onChange={e => updateField(u.id, 'age', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Location</label>
                    <input style={adminStyles.input} value={(editData[u.id].location as string) || ''} onChange={e => updateField(u.id, 'location', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Morphology</label>
                    <select style={{ ...adminStyles.input, appearance: 'auto' as const }} value={(editData[u.id].morphology as string) || ''} onChange={e => updateField(u.id, 'morphology', e.target.value)}>
                      <option value="">--</option>
                      {configOptions.morphology.map(o => <option key={o.id} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Role</label>
                    <select style={{ ...adminStyles.input, appearance: 'auto' as const }} value={(editData[u.id].role as string) || ''} onChange={e => updateField(u.id, 'role', e.target.value)}>
                      <option value="">--</option>
                      {configOptions.role.map(o => <option key={o.id} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {configOptions.kink.length > 0 && (
                  <div>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 6, display: 'block' }}>Kinks</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {configOptions.kink.map(k => {
                        const checked = ((editData[u.id].kinks as string[]) || []).includes(k.value)
                        return (
                          <label key={k.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: checked ? S.lav : S.tx3,
                            background: checked ? S.lavbg : S.bg2, border: '1px solid ' + (checked ? S.lavbd : S.rule),
                            borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontWeight: checked ? 600 : 400,
                          }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleKink(u.id, k.value)} style={{ display: 'none' }} />
                            {k.label}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Limits</label>
                  <textarea style={{ ...adminStyles.input, minHeight: 48, resize: 'vertical' }} value={(editData[u.id].limits as string) || ''} onChange={e => updateField(u.id, 'limits', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Health Status</label>
                    <input style={adminStyles.input} value={(editData[u.id].health_status as string) || ''} onChange={e => updateField(u.id, 'health_status', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: S.tx3, fontWeight: 600, marginBottom: 4, display: 'block' }}>Last Test Date</label>
                    <input style={adminStyles.input} value={(editData[u.id].last_test_date as string) || ''} onChange={e => updateField(u.id, 'last_test_date', e.target.value)} placeholder="YYYY-MM-DD" />
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => saveUser(u.id)} disabled={saving} style={{ ...adminStyles.btnPrimary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: saving ? 0.6 : 1 }}>
                    <Save size={12} strokeWidth={2} />
                    Sauvegarder
                  </button>
                  <button onClick={() => window.open('/profile/' + u.id, '_blank')} style={{ ...adminStyles.btnSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={12} strokeWidth={1.5} />
                    Voir profil
                  </button>
                  <button onClick={() => resetProfile(u.id)} style={{ ...adminStyles.btnDanger, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RotateCcw size={12} strokeWidth={1.5} />
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {users.length === 0 && <p style={{ color: S.tx3, fontSize: 12, textAlign: 'center', padding: 24 }}>Aucun utilisateur</p>}
    </div>
  )
}
