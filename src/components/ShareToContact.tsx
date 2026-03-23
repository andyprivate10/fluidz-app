import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { Send, X, Check, Search } from 'lucide-react'
import { colors } from '../brand'
import { useTranslation } from 'react-i18next'

const S = colors

type Contact = {
  id: string
  contact_user_id: string
  display_name: string
  avatar_url?: string
  relation_level: string
}

type Props = {
  open: boolean
  onClose: () => void
  shareType: 'session' | 'profile'
  shareId: string
  shareTitle: string
  shareSubtitle?: string
}

export default function ShareToContact({ open, onClose, shareType, shareId, shareTitle, shareSubtitle }: Props) {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setSent(false)
    setSearch('')
    loadContacts()
  }, [open])

  async function loadContacts() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: raw } = await supabase.from('contacts').select('id, contact_user_id, relation_level').eq('owner_id', user.id).order('relation_level')
    if (!raw || raw.length === 0) { setContacts([]); setLoading(false); return }

    const ids = raw.map(c => c.contact_user_id)
    const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    setContacts(raw.map(c => ({
      ...c,
      display_name: profileMap.get(c.contact_user_id)?.display_name || 'Anonyme',
      avatar_url: (profileMap.get(c.contact_user_id)?.profile_json as any)?.avatar_url,
    })))
    setLoading(false)
  }

  function toggle(userId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function send() {
    if (selected.size === 0) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const href = shareType === 'session' ? '/session/' + shareId : '/profile/' + shareId
      const notifs = Array.from(selected).map(uid => ({
        user_id: uid,
        type: 'recommendation' as const,
        title: t('share.notif_title', { name: shareTitle }),
        body: shareSubtitle || '',
        href,
        session_id: shareType === 'session' ? shareId : undefined,
      }))

      await supabase.from('notifications').insert(notifs)
      setSent(true)
      showToast(t('share.sent_count', { count: selected.size }), 'success')
      setTimeout(onClose, 1200)
    } catch {
      showToast('Error', 'error')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  const filtered = search ? contacts.filter(c => c.display_name.toLowerCase().includes(search.toLowerCase())) : contacts

  return (
    <>
      <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} onClick={onClose} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        background: S.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        border: '1px solid ' + S.rule, padding: '16px 20px 28px', zIndex: 61,
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: S.tx3, margin: '0 auto 12px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: 0 }}>{t('share.recommend')}</p>
            <p style={{ fontSize: 12, color: S.tx3, margin: '2px 0 0' }}>{shareTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: S.tx4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('share.search_contacts')}
            style={{
              width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12,
              border: '1px solid ' + S.rule, background: S.bg2, color: S.tx,
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading && <p style={{ fontSize: 13, color: S.tx3, textAlign: 'center', padding: 20 }}>...</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ fontSize: 13, color: S.tx3, textAlign: 'center', padding: 20 }}>{t('share.no_contacts')}</p>
          )}
          {filtered.map(c => {
            const on = selected.has(c.contact_user_id)
            return (
              <button key={c.id} onClick={() => toggle(c.contact_user_id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
                background: on ? S.p3 : 'transparent', border: '1px solid ' + (on ? S.pbd : 'transparent'),
                cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
              }}>
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {c.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: S.tx, margin: 0 }}>{c.display_name}</p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                  background: on ? S.p : 'transparent', border: on ? 'none' : '2px solid ' + S.rule,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Check size={12} strokeWidth={3} style={{ color: '#fff' }} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Send button */}
        <button
          onClick={send}
          disabled={selected.size === 0 || sending || sent}
          style={{
            width: '100%', padding: 14, borderRadius: 14, marginTop: 12,
            background: sent ? S.sagebg : selected.size > 0 ? S.grad : S.bg2,
            border: sent ? '1px solid ' + S.sage : 'none',
            color: sent ? S.sage : selected.size > 0 ? '#fff' : S.tx3,
            fontSize: 15, fontWeight: 700, cursor: selected.size === 0 || sending || sent ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sent ? <><Check size={16} strokeWidth={2.5} /> {t('share.sent')}</> :
           sending ? '...' :
           <><Send size={16} strokeWidth={1.5} /> {t('share.send_to', { count: selected.size })}</>}
        </button>
      </div>
    </>
  )
}
