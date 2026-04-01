import PageFadeIn from '../components/PageFadeIn'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { Users, Search } from 'lucide-react'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { SkeletonProfile } from '../components/Skeleton'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import CyclingAvatar from '../components/CyclingAvatar'
import { useTranslation } from 'react-i18next'
import LinkedProfiles from '../components/LinkedProfiles'


const S = colors

type Contact = {
  id: string
  contact_user_id: string
  relation_level: 'connaissance' | 'close' | 'favori'
  notes: string | null
  mutual?: boolean
  created_at: string
  // Joined from user_profiles
  display_name?: string
  avatar_url?: string
  role?: string
  last_event?: string
  tribes?: string[]
  kinks?: string[]
  last_seen?: string
  shared_sessions?: number
}

export default function ContactsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const RELATION_STYLES = {
    connaissance: { label: t('contacts.connaissance'), color: S.tx3, stars: 1 },
    close: { label: t('contacts.close'), color: S.sage, stars: 2 },
    favori: { label: t('contacts.favori'), color: S.p, stars: 3 },
  }
  const starIcon = (filled: boolean, color: string) => <span style={{ fontSize: 10, color: filled ? color : S.tx4 }}>★</span>

  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'mutual' | 'connaissance' | 'close' | 'favori'>('all')
  const [linkedProfiles, setLinkedProfiles] = useState<{ user_id: string; type: string }[]>([])
  const [pendingNbRequests, setPendingNbRequests] = useState<{ id: string; sender_id: string; display_name: string; avatar_url?: string; role?: string; created_at: string }[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('')


  useEffect(() => {
    if (user) {
      loadContacts()
      supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle().then(({ data }) => {
        const pj = (data?.profile_json || {}) as Record<string, unknown>
        if (Array.isArray(pj.linked_profiles)) setLinkedProfiles(pj.linked_profiles as { user_id: string; type: string }[])
      })
      // Load pending naughtybook requests where I'm the receiver
      supabase.from('naughtybook_requests').select('id, sender_id, created_at').eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).then(async ({ data }) => {
        if (!data || data.length === 0) { setPendingNbRequests([]); return }
        const senderIds = data.map(r => r.sender_id)
        const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', senderIds)
        const profMap = new Map((profiles || []).map(p => [p.id, p]))
        setPendingNbRequests(data.map(r => {
          const prof = profMap.get(r.sender_id)
          const pj = (prof?.profile_json || {}) as Record<string, unknown>
          return { id: r.id, sender_id: r.sender_id, display_name: prof?.display_name || '?', avatar_url: (pj.avatar_url as string) || undefined, role: (pj.role as string) || undefined, created_at: r.created_at }
        }))
      })
    }
  }, [user])

  const loadContacts = useCallback(async () => {
    if (!user) { navigate('/login?next=/contacts'); return }

    const { data: raw } = await supabase
      .from('contacts')
      .select('id, contact_user_id, relation_level, notes, mutual, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!raw || raw.length === 0) { setContacts([]); setLoading(false); return }

    // Fetch profiles for contacts
    const ids = raw.map(c => c.contact_user_id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, profile_json')
      .in('id', ids)

    const profileMap = new Map<string, { display_name: string; avatar_url?: string; role?: string; tribes?: string[]; kinks?: string[]; last_seen?: string }>()
    ;(profiles || []).forEach((p: any) => {
      const pj = p.profile_json || {}
      profileMap.set(p.id, {
        display_name: p.display_name || t('common.anonymous'),
        avatar_url: pj.avatar_url || (Array.isArray(pj.photos_profil) ? pj.photos_profil[0] : undefined),
        role: pj.role,
        tribes: Array.isArray(pj.tribes) ? pj.tribes : [],
        kinks: Array.isArray(pj.kinks) ? pj.kinks : [],
        last_seen: pj.last_seen,
      })
    })

    const enriched: Contact[] = raw.map(c => {
      const prof = profileMap.get(c.contact_user_id)
      return {
        ...c,
        display_name: prof?.display_name || t('common.anonymous'),
        avatar_url: prof?.avatar_url,
        role: prof?.role,
        tribes: prof?.tribes,
        kinks: prof?.kinks,
        last_seen: prof?.last_seen,
      }
    })

    setContacts(enriched)
    setLoading(false)
  }, [navigate])


  async function acceptNbRequest(requestId: string, _senderId: string) {
    const { error } = await supabase.rpc('rpc_respond_naughtybook', { p_request_id: requestId, p_action: 'accepted' })
    if (error) { showToast(error.message, 'error'); return }
    setPendingNbRequests(prev => prev.filter(r => r.id !== requestId))
    showToast(t('naughtybook.accepted_toast'), 'success')
    loadContacts() // Refresh contacts to show new mutual
  }

  async function rejectNbRequest(requestId: string) {
    const { error } = await supabase.rpc('rpc_respond_naughtybook', { p_request_id: requestId, p_action: 'rejected' })
    if (error) { showToast(error.message, 'error'); return }
    setPendingNbRequests(prev => prev.filter(r => r.id !== requestId))
    showToast(t('naughtybook.rejected_toast'), 'info')
  }

  async function updateRelation(contactId: string, level: 'connaissance' | 'close' | 'favori') {
    await supabase.from('contacts').update({ relation_level: level }).eq('id', contactId)
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, relation_level: level } : c))
    showToast(t('contacts.relation_updated'), 'success')
  }


  const filtered = contacts
    .filter(c => filter === 'all' ? true : filter === 'mutual' ? c.mutual : c.relation_level === filter)
    .filter(c => !search || (c.display_name || '').toLowerCase().includes(search.toLowerCase()))
    .filter(c => !roleFilter || c.role === roleFilter)

  const availableRoles = [...new Set(contacts.map(c => c.role).filter(Boolean))] as string[]

  const counts = {
    all: contacts.length,
    mutual: contacts.filter(c => c.mutual).length,
    connaissance: contacts.filter(c => c.relation_level === 'connaissance').length,
    close: contacts.filter(c => c.relation_level === 'close').length,
    favori: contacts.filter(c => c.relation_level === 'favori').length,
  }

  const { pullHandlers, pullIndicator } = usePullToRefresh(loadContacts)

  return (
    <PageFadeIn>
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <OrbLayer />
      {/* Header */}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin: '0 0 2px' }}>{t('contacts.title')}</h1>
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
          {(['all', 'mutual', 'favori', 'close', 'connaissance'] as const).map(f => {
            const active = filter === f
            const label = f === 'all' ? `${t('common.all')} (${counts.all})` : f === 'mutual' ? `♡ ${t('naughtybook.mutual')} (${counts.mutual})` : `${'★'.repeat(RELATION_STYLES[f].stars)} ${RELATION_STYLES[f].label} (${counts[f]})`
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

        {/* Role filter */}
        {availableRoles.length > 1 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setRoleFilter('')} style={{
              padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              border: '1px solid ' + (!roleFilter ? S.pbd : S.rule),
              background: !roleFilter ? S.p2 : 'transparent',
              color: !roleFilter ? S.p : S.tx3,
            }}>{t('common.all')}</button>
            {availableRoles.map(r => (
              <button key={r} onClick={() => setRoleFilter(roleFilter === r ? '' : r)} style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: '1px solid ' + (roleFilter === r ? S.pbd : S.rule),
                background: roleFilter === r ? S.p2 : 'transparent',
                color: roleFilter === r ? S.p : S.tx3,
              }}>{r}</button>
            ))}
          </div>
        )}
      </div>

      {/* Pending NaughtyBook requests */}
      {pendingNbRequests.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('naughtybook.pending_requests')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingNbRequests.map(req => (
              <div key={req.id} style={{ background: S.bg1, border: '1px solid ' + S.pbd, borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => navigate('/profile/' + req.sender_id)} style={{ width: 40, height: 40, borderRadius: '28%', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: S.bg2 }}>
                  {req.avatar_url ? <img src={req.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: S.tx3 }}>{req.display_name[0]}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: S.tx }}>{req.display_name}</p>
                  {req.role && <p style={{ margin: 0, fontSize: 11, color: S.p }}>{req.role}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => acceptNbRequest(req.id, req.sender_id)} style={{ padding: '6px 12px', borderRadius: 10, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('naughtybook.accept')}</button>
                  <button onClick={() => rejectNbRequest(req.id)} style={{ padding: '6px 12px', borderRadius: 10, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t('naughtybook.reject')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="stagger-children" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <>{[1,2,3,4].map(i => <SkeletonProfile key={i} />)}</>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            {contacts.length === 0 ? (
              <>
                <Users size={36} style={{ color: S.p, marginBottom: 12 }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: '0 0 6px' }}>{t('contacts.empty_title')}</p>
                <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 20px', lineHeight: 1.5 }}>{t('contacts.empty_desc')}</p>
                <button onClick={() => navigate('/explore')} style={{ padding: '12px 24px', borderRadius: 14, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {t('contacts.empty_cta')}
                </button>
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
              {/* Avatar + online dot */}
              <div onClick={() => navigate('/contacts/' + contact.contact_user_id)} style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                <CyclingAvatar
                  photos={contact.avatar_url ? [contact.avatar_url] : []}
                  size={44}
                  fallbackLetter={(contact.display_name || '?')[0]}
                  border={'1px solid ' + S.rule}
                />
                {contact.last_seen && (Date.now() - new Date(contact.last_seen).getTime()) < 300000 && (
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: S.sage, border: '2px solid ' + S.bg1, boxShadow: '0 0 6px ' + S.sage }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/contacts/' + contact.contact_user_id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.tx }}>{contact.display_name}</span>
                  <span style={{ display: 'inline-flex', gap: 1 }}>{[1,2,3].map(n => starIcon(n <= rel.stars, rel.color))}</span>
                  {contact.mutual && <span style={{ fontSize: 9, fontWeight: 700, color: S.sage, background: S.sagebg, padding: '1px 6px', borderRadius: 99, border: '1px solid ' + S.sagebd }}>{t('naughtybook.mutual')}</span>}
                  <VibeScoreBadge userId={contact.contact_user_id} />
                </div>
                {contact.role && <p style={{ fontSize: 12, color: S.p, margin: '2px 0 0' }}>{contact.role}</p>}
                {contact.last_seen && (() => {
                  const mins = Math.floor((Date.now() - new Date(contact.last_seen).getTime()) / 60000)
                  const label = mins < 5 ? t('common.online') : mins < 60 ? mins + 'min' : mins < 1440 ? Math.floor(mins / 60) + 'h' : Math.floor(mins / 1440) + 'j'
                  return <p style={{ fontSize: 10, color: mins < 5 ? S.sage : S.tx4, margin: '2px 0 0' }}>{mins < 5 ? '● ' : ''}{label}</p>
                })()}
                {contact.notes && <p style={{ fontSize: 11, color: S.tx4, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.notes}</p>}
              </div>

              {/* Star cycle */}
              <button onClick={() => {
                const cycle: ('connaissance' | 'close' | 'favori')[] = ['connaissance', 'close', 'favori']
                const idx = cycle.indexOf(contact.relation_level)
                const next = cycle[(idx + 1) % cycle.length]
                updateRelation(contact.id, next)
              }} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', gap: 2, flexShrink: 0 }}>
                {[1,2,3].map(n => <span key={n} style={{ fontSize: 14, color: n <= rel.stars ? rel.color : S.tx4 }}>★</span>)}
              </button>
            </div>
          )
        })}
      </div>

      {/* Linked profiles (couples, groups) */}
      {user && (
        <div style={{ padding: '12px 20px 20px' }}>
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: 16, border: '1px solid ' + S.rule2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{t('profile.linked_profiles')}</div>
            <p style={{ fontSize: 11, color: S.tx3, margin: '0 0 10px' }}>{t('profile.linked_desc')}</p>
            <LinkedProfiles userId={user.id} linkedProfiles={linkedProfiles} onChange={async (profiles) => {
              setLinkedProfiles(profiles)
              const { data: current } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
              const pj = { ...((current?.profile_json || {}) as Record<string, unknown>), linked_profiles: profiles }
              await supabase.from('user_profiles').update({ profile_json: pj }).eq('id', user.id)
            }} />
          </div>
        </div>
      )}
    </div>
    </PageFadeIn>
  )
}
