import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Plus, Users, Trash2, ChevronRight, X } from 'lucide-react'
import { colors } from '../brand'

const S = {
  ...colors,
  red: '#F87171', orange: '#FBBF24', blue: '#7DD3FC',
  grad: colors.p,
}

const GROUP_COLORS = ['#F9A8A8', '#4ADE80', '#7DD3FC', '#FBBF24', '#A78BFA', '#F87171', '#34D399', '#FB923C']

type Group = {
  id: string
  name: string
  description: string | null
  color: string
  member_count: number
  members: { contact_user_id: string; display_name: string; avatar_url?: string }[]
}

type Contact = { id: string; contact_user_id: string; display_name: string; avatar_url?: string }

export default function GroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('#F9A8A8')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    // Load groups
    const { data: grps } = await supabase.from('contact_groups').select('id, name, description, color').eq('owner_id', user.id).order('created_at', { ascending: false })

    // Load group members
    const groupIds = (grps || []).map(g => g.id)
    let memberMap: Record<string, { contact_user_id: string }[]> = {}
    if (groupIds.length > 0) {
      const { data: members } = await supabase.from('contact_group_members').select('group_id, contact_user_id').in('group_id', groupIds)
      ;(members || []).forEach((m: any) => {
        if (!memberMap[m.group_id]) memberMap[m.group_id] = []
        memberMap[m.group_id].push(m)
      })
    }

    // Load all contacts for member selection
    const { data: cts } = await supabase.from('contacts').select('id, contact_user_id').eq('user_id', user.id)
    const contactIds = (cts || []).map(c => c.contact_user_id)
    let profileMap: Record<string, { display_name: string; avatar_url?: string }> = {}
    if (contactIds.length > 0) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', contactIds)
      ;(profiles || []).forEach((p: any) => {
        profileMap[p.id] = { display_name: p.display_name || 'Anonyme', avatar_url: p.profile_json?.avatar_url }
      })
    }

    setContacts((cts || []).map(c => ({
      id: c.id,
      contact_user_id: c.contact_user_id,
      display_name: profileMap[c.contact_user_id]?.display_name || 'Anonyme',
      avatar_url: profileMap[c.contact_user_id]?.avatar_url,
    })))

    setGroups((grps || []).map(g => ({
      ...g,
      member_count: (memberMap[g.id] || []).length,
      members: (memberMap[g.id] || []).map(m => ({
        contact_user_id: m.contact_user_id,
        display_name: profileMap[m.contact_user_id]?.display_name || 'Anonyme',
        avatar_url: profileMap[m.contact_user_id]?.avatar_url,
      })),
    })))
    setLoading(false)
  }

  function openCreate() {
    setNewName(''); setNewDesc(''); setNewColor('#F9A8A8'); setSelectedMembers([]); setEditGroup(null); setShowCreate(true)
  }

  function openEdit(group: Group) {
    setNewName(group.name); setNewDesc(group.description || ''); setNewColor(group.color); setSelectedMembers(group.members.map(m => m.contact_user_id)); setEditGroup(group); setShowCreate(true)
  }

  async function saveGroup() {
    if (!newName.trim()) { showToast('Donne un nom au groupe', 'error'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editGroup) {
      // Update
      await supabase.from('contact_groups').update({ name: newName.trim(), description: newDesc.trim() || null, color: newColor }).eq('id', editGroup.id)
      // Sync members: delete all, re-insert
      await supabase.from('contact_group_members').delete().eq('group_id', editGroup.id)
      if (selectedMembers.length > 0) {
        await supabase.from('contact_group_members').insert(selectedMembers.map(uid => ({ group_id: editGroup.id, contact_user_id: uid })))
      }
      showToast('Groupe mis à jour', 'success')
    } else {
      // Create
      const { data: newGroup, error } = await supabase.from('contact_groups').insert({ owner_id: user.id, name: newName.trim(), description: newDesc.trim() || null, color: newColor }).select('id').single()
      if (error) { showToast('Erreur: ' + error.message, 'error'); setSaving(false); return }
      if (selectedMembers.length > 0) {
        await supabase.from('contact_group_members').insert(selectedMembers.map(uid => ({ group_id: newGroup.id, contact_user_id: uid })))
      }
      showToast('Groupe créé !', 'success')
    }

    setSaving(false); setShowCreate(false); loadAll()
  }

  async function deleteGroup(groupId: string) {
    if (!window.confirm('Supprimer ce groupe ?')) return
    await supabase.from('contact_group_members').delete().eq('group_id', groupId)
    await supabase.from('contact_groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    showToast('Groupe supprimé', 'info')
  }

  function toggleMember(uid: string) {
    setSelectedMembers(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])
  }

  const inp: React.CSSProperties = { width:'100%', background:S.bg2, color:S.tx, borderRadius:12, padding:'12px 14px', border:'1px solid '+S.rule, outline:'none', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <div style={{ background:S.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:96 }}>
      {/* Header */}
      <div style={{ padding:'40px 20px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:S.tx3, fontSize:13, cursor:'pointer', padding:0, marginBottom:8 }}>← Retour</button>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, margin:0 }}>Mes Groupes</h1>
          <p style={{ fontSize:12, color:S.tx3, margin:'2px 0 0' }}>{groups.length} groupe{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} style={{ width:40, height:40, borderRadius:12, background:S.grad, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Plus size={20} style={{ color:'#fff' }} />
        </button>
      </div>

      {/* Groups list */}
      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading && <p style={{ color:S.tx3, textAlign:'center', padding:24 }}>Chargement...</p>}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:S.tx3 }}>
            <Users size={40} style={{ color:S.tx4, marginBottom:12 }} />
            <p style={{ fontSize:15, fontWeight:600, margin:'0 0 6px' }}>Pas encore de groupes</p>
            <p style={{ fontSize:13 }}>Crée un groupe pour inviter facilement</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.id} style={{ background:S.bg1, border:'1px solid '+S.rule, borderRadius:16, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }} onClick={() => openEdit(group)}>
                <div style={{ width:12, height:12, borderRadius:4, background:group.color, flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:S.tx, margin:0, cursor:'pointer' }}>{group.name}</p>
                  {group.description && <p style={{ fontSize:12, color:S.tx3, margin:'2px 0 0' }}>{group.description}</p>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => openEdit(group)} style={{ background:'none', border:'none', color:S.tx3, cursor:'pointer', padding:4 }}>
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => deleteGroup(group.id)} style={{ background:'none', border:'none', color:S.red, cursor:'pointer', padding:4, opacity:0.6 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Member avatars */}
            {group.members.length > 0 && (
              <div style={{ display:'flex', gap:-4, marginTop:10 }}>
                {group.members.slice(0, 6).map((m, i) => (
                  m.avatar_url ? (
                    <img key={m.contact_user_id} src={m.avatar_url} alt="" style={{ width:28, height:28, borderRadius:'28%', objectFit:'cover', border:'2px solid '+S.bg1, marginLeft: i > 0 ? -6 : 0 }} />
                  ) : (
                    <div key={m.contact_user_id} style={{ width:28, height:28, borderRadius:'28%', background:group.color+'33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:group.color, border:'2px solid '+S.bg1, marginLeft: i > 0 ? -6 : 0 }}>
                      {m.display_name[0]?.toUpperCase()}
                    </div>
                  )
                ))}
                {group.members.length > 6 && <span style={{ fontSize:11, color:S.tx3, marginLeft:6, alignSelf:'center' }}>+{group.members.length - 6}</span>}
                <span style={{ fontSize:11, color:S.tx3, marginLeft:8, alignSelf:'center' }}>{group.member_count} membre{group.member_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit sheet */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div onClick={() => setShowCreate(false)} style={{ flex:1, background:'rgba(0,0,0,0.6)' }} />
          <div style={{ background:S.bg1, borderRadius:'24px 24px 0 0', padding:'20px 20px 40px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:S.tx, margin:0 }}>{editGroup ? 'Modifier' : 'Nouveau groupe'}</h2>
              <button onClick={() => setShowCreate(false)} style={{ background:'none', border:'none', color:S.tx3, cursor:'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:S.tx3, marginBottom:4, display:'block' }}>NOM</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Les Habituels, Top Squad..." maxLength={40} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:S.tx3, marginBottom:4, display:'block' }}>DESCRIPTION</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optionnel" maxLength={100} style={inp} />
              </div>

              {/* Color picker */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:S.tx3, marginBottom:6, display:'block' }}>COULEUR</label>
                <div style={{ display:'flex', gap:8 }}>
                  {GROUP_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} style={{
                      width:28, height:28, borderRadius:8, background:c, border: newColor === c ? '2px solid #fff' : '2px solid transparent', cursor:'pointer',
                    }} />
                  ))}
                </div>
              </div>

              {/* Member selection */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:S.tx3, marginBottom:6, display:'block' }}>
                  MEMBRES ({selectedMembers.length} sélectionné{selectedMembers.length !== 1 ? 's' : ''})
                </label>
                {contacts.length === 0 ? (
                  <p style={{ fontSize:12, color:S.tx4 }}>Ajoute des contacts d'abord dans le Naughty Book</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                    {contacts.map(c => {
                      const on = selectedMembers.includes(c.contact_user_id)
                      return (
                        <button key={c.contact_user_id} onClick={() => toggleMember(c.contact_user_id)} style={{
                          display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', textAlign:'left',
                          background: on ? newColor + '18' : S.bg2,
                          outline: on ? `1px solid ${newColor}44` : 'none',
                        }}>
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt="" style={{ width:28, height:28, borderRadius:'28%', objectFit:'cover' }} />
                          ) : (
                            <div style={{ width:28, height:28, borderRadius:'28%', background:S.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>{c.display_name[0]?.toUpperCase()}</div>
                          )}
                          <span style={{ fontSize:13, fontWeight:600, color: on ? S.tx : S.tx3 }}>{c.display_name}</span>
                          {on && <span style={{ marginLeft:'auto', fontSize:14, color:newColor }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button onClick={saveGroup} disabled={saving || !newName.trim()} style={{
                width:'100%', padding:14, borderRadius:14, fontWeight:700, fontSize:15, color:'#fff', background:S.grad, border:'none',
                cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer', opacity: saving || !newName.trim() ? 0.6 : 1,
              }}>
                {saving ? 'Sauvegarde...' : editGroup ? 'Mettre à jour' : 'Créer le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
