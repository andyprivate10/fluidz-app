import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Users, Search } from 'lucide-react'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { SkeletonProfile } from '../components/Skeleton'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'


const S = colors

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
  connaissance: { label: 'Connaissance', color: S.tx3, icon: '○' },
  close: { label: 'Close', color: S.sage, icon: '◉' },
  favori: { label: 'Favori', color: S.p, icon: '★' },
}

export default function ContactsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'connaissance' | 'close' | 'favori'>('all')

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = useCallback(async () => {
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
  }, [navigate])


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

  const { pullHandlers, pullIndicator } = usePullToRefresh(loadContacts)

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <OrbLayer />
      {/* Header */}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 2px' }}>{t('contacts.title')}</h1>
            <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/groups')} style={{ padding: '6px 12px', borderRadius: 10, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} /> {t('contacts.groups')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 12, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: S.tx4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('contacts.search')}
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
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
                border: '1px solid ' + (active ? S.pbd : S.rule),
                background: active ? S.p2 : 'transparent',
                color: active ? S.p : S.tx3,
                whiteSpace: 'nowrap',
              }}>{label}</button>
            )
          })}
        </div>
      </div>

      {/* Contact list */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <>{[1,2,3,4].map(i => <SkeletonProfile key={i} />)}</>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            {contacts.length === 0 ? (
              <>
                <Users size={40} style={{ color: S.tx4, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{t('contacts.no_contacts')}</p>
                <p style={{ fontSize: 13 }}>{t('contacts.no_contacts_desc')}</p>
              </>
            ) : (
              <p style={{ fontSize: 14 }}>{t('contacts.empty_filter')}</p>
            )}
          </div>
        )}

        {filtered.map(contact => {
          const rel = RELATION_STYLES[contact.relation_level]
          return (
            <div key={contact.id} style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
              {/* Avatar */}
              <div onClick={() => navigate('/contacts/' + contact.contact_user_id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + S.rule }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {(contact.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/contacts/' + contact.contact_user_id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>{contact.display_name}</span>
                  <span style={{ fontSize: 10, color: rel.color, fontWeight: 600 }}>{rel.icon}</span>
                  <VibeScoreBadge userId={contact.contact_user_id} />
                </div>
                {contact.role && <p style={{ fontSize: 12, color: S.p, margin: '2px 0 0' }}>{contact.role}</p>}
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
