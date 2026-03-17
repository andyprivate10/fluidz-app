import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Users, Search, Heart } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

type Contact = {
  id: string
  contact_user_id: string
  relation_level: 'connaissance' | 'close' | 'favori'
  notes: string | null
  created_at: string
  // Joined from user_profiles
  display_name?: string
  avatar_url?: string
  role?: string
  last_event?: string
}

const RELATION_STYLES = {
  connaissance: { label: 'Connaissance', color: S.tx3, icon: '👋' },
  close: { label: 'Close', color: S.green, icon: '🤝' },
  favori: { label: 'Favori', color: S.p300, icon: '⭐' },
}

export default function ContactsPage() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'connaissance' | 'close' | 'favori'>('all')

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: raw } = await supabase
      .from('contacts')
      .select('id, contact_user_id, relation_level, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!raw || raw.length === 0) { setContacts([]); setLoading(false); return }

    // Fetch profiles for contacts
    const ids = raw.map(c => c.contact_user_id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, profile_json')
      .in('id', ids)

    const profileMap = new Map<string, { display_name: string; avatar_url?: string; role?: string }>()
    ;(profiles || []).forEach((p: any) => {
      profileMap.set(p.id, {
        display_name: p.display_name || 'Anonyme',
        avatar_url: p.profile_json?.avatar_url,
        role: p.profile_json?.role,
      })
    })

    const enriched: Contact[] = raw.map(c => ({
      ...c,
      display_name: profileMap.get(c.contact_user_id)?.display_name || 'Anonyme',
      avatar_url: profileMap.get(c.contact_user_id)?.avatar_url,
      role: profileMap.get(c.contact_user_id)?.role,
    }))

    setContacts(enriched)
    setLoading(false)
  }

  async function updateRelation(contactId: string, level: 'connaissance' | 'close' | 'favori') {
    await supabase.from('contacts').update({ relation_level: level }).eq('id', contactId)
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, relation_level: level } : c))
    showToast('Relation mise à jour', 'success')
  }


  const filtered = contacts
    .filter(c => filter === 'all' || c.relation_level === filter)
    .filter(c => !search || (c.display_name || '').toLowerCase().includes(search.toLowerCase()))

  const counts = {
    all: contacts.length,
    connaissance: contacts.filter(c => c.relation_level === 'connaissance').length,
    close: contacts.filter(c => c.relation_level === 'close').length,
    favori: contacts.filter(c => c.relation_level === 'favori').length,
  }

  return (
    <div style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.border }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 2px' }}>Naughty Book</h1>
            <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
          <Heart size={24} style={{ color: S.p300 }} />
        </div>

        {/* Search */}
        <div style={{ marginTop: 12, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: S.tx4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: S.bg2, border: '1px solid ' + S.border, borderRadius: 12, color: S.tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {(['all', 'favori', 'close', 'connaissance'] as const).map(f => {
            const active = filter === f
            const label = f === 'all' ? `Tous (${counts.all})` : `${RELATION_STYLES[f].icon} ${RELATION_STYLES[f].label} (${counts[f]})`
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: '1px solid ' + (active ? S.p300 + '55' : S.border),
                background: active ? S.p300 + '14' : 'transparent',
                color: active ? S.p300 : S.tx3,
                whiteSpace: 'nowrap',
              }}>{label}</button>
            )
          })}
        </div>
      </div>

      {/* Contact list */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <p style={{ color: S.tx3, textAlign: 'center', padding: 24 }}>Chargement...</p>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            {contacts.length === 0 ? (
              <>
                <Users size={40} style={{ color: S.tx4, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Ton carnet est vide</p>
                <p style={{ fontSize: 13 }}>Ajoute des contacts depuis les profils ou après un event</p>
              </>
            ) : (
              <p style={{ fontSize: 14 }}>Aucun contact dans ce filtre</p>
            )}
          </div>
        )}

        {filtered.map(contact => {
          const rel = RELATION_STYLES[contact.relation_level]
          return (
            <div key={contact.id} style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div onClick={() => navigate('/profile/' + contact.contact_user_id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '28%', objectFit: 'cover', border: '1px solid ' + S.border }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {(contact.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/profile/' + contact.contact_user_id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>{contact.display_name}</span>
                  <span style={{ fontSize: 10, color: rel.color, fontWeight: 600 }}>{rel.icon}</span>
                </div>
                {contact.role && <p style={{ fontSize: 12, color: S.p300, margin: '2px 0 0' }}>{contact.role}</p>}
                {contact.notes && <p style={{ fontSize: 11, color: S.tx4, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.notes}</p>}
              </div>

              {/* Relation selector */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {(['connaissance', 'close', 'favori'] as const).map(lvl => {
                  const rs = RELATION_STYLES[lvl]
                  const active = contact.relation_level === lvl
                  return (
                    <button key={lvl} onClick={() => updateRelation(contact.id, lvl)} title={rs.label} style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                      background: active ? rs.color + '22' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: active ? 1 : 0.4,
                    }}>{rs.icon}</button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
