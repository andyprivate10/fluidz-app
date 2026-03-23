import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import {Bell, CheckCheck, ArrowLeft} from 'lucide-react'
import SwipeableRow from '../components/SwipeableRow'
import { showToast } from '../components/Toast'
import { timeAgo } from '../lib/timing'

const S = colors
const R = radius

type Notif = { id: string; type: string; title: string; body: string; href: string; read_at: string | null; created_at: string }

const TYPE_ICONS: Record<string, string> = {
  new_application: '→', application_accepted: '●', application_rejected: '—',
  session_invite: '→', group_invite: '⊕', direct_dm: '↗',
  direct_join: '→', contact_request: '♡', check_in: '◎',
  check_in_confirmed: '◉', review_request: '★', nudge: '⏱',
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setNotifs(data || [])
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])
  const { pullHandlers, pullIndicator } = usePullToRefresh(load)

  async function handleClick(n: Notif) {
    if (!n.read_at) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    if (n.href?.trim()) navigate(n.href)
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read_at)
    if (unread.length === 0) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread.map(n => n.id))
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  async function deleteNotif(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    showToast(t('notifications.deleted'), 'info')
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 14px', borderBottom: `1px solid ${S.rule}`, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', ...typeStyle('body'), color: S.tx2, cursor: 'pointer', padding: 0, marginBottom: 8 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back')}</button>
          <h1 style={{ ...typeStyle('title'), color: S.tx, margin: 0 }}>{t('notifications.title')}</h1>
        </div>
        {notifs.some(n => !n.read_at) && (
          <button onClick={markAllRead} style={{
            padding: '6px 12px', borderRadius: R.chip, ...typeStyle('meta'),
            color: S.sage, background: S.sagebg, border: `1px solid ${S.sagebd}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <CheckCheck size={12} /> {t('notifications.mark_all')}
          </button>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 16px', paddingBottom: 96 }}>
        {loading && <p style={{ ...typeStyle('body'), color: S.tx3, textAlign: 'center', padding: 24 }}>{t('notifications.loading')}</p>}

        {!loading && notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <Bell size={28} strokeWidth={1.5} style={{ color: S.tx3, marginBottom: 10 }} />
            <p style={{ ...typeStyle('section'), color: S.tx3, margin: '0 0 4px' }}>{t('notifications.empty')}</p>
            <p style={{ ...typeStyle('body'), color: S.tx3 }}>{t('notifications.empty_desc')}</p>
          </div>
        )}

        {(() => {
          function dateGroup(d: string): string {
            const now = new Date()
            const date = new Date(d)
            const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
            if (diff === 0 && now.getDate() === date.getDate()) return t('notifications.today')
            if (diff <= 1 && now.getDate() - date.getDate() === 1) return t('notifications.yesterday')
            if (diff < 7) return t('notifications.this_week')
            return t('notifications.older')
          }
          let lastGroup = ''
          return notifs.map(n => {
            const group = dateGroup(n.created_at)
            const showHeader = group !== lastGroup
            lastGroup = group
            return (
              <div key={n.id}>
                {showHeader && (
                  <p style={{ ...typeStyle('meta'), color: S.sage, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '18px 0 6px', padding: '0 4px' }}>{group}</p>
                )}
          <SwipeableRow onDelete={() => deleteNotif(n.id)}>
          <button onClick={() => handleClick(n)} style={{
            width: '100%', textAlign: 'left', padding: '14px 12px', borderRadius: R.block,
            border: 'none', background: S.bg, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderBottom: `1px solid ${S.rule}`, position: 'relative',
            borderLeft: n.read_at ? 'none' : `3px solid ${S.p}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: R.icon, flexShrink: 0, marginTop: 1,
                background: n.read_at ? S.bg2 : S.p3, border: `1px solid ${n.read_at ? S.rule : S.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...typeStyle('meta'), color: n.read_at ? S.tx3 : S.p,
              }}>
                {TYPE_ICONS[n.type] || '•'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...typeStyle('label'), color: n.read_at ? S.tx2 : S.tx, margin: 0 }}>{n.title}</p>
                {n.body && <p style={{ ...typeStyle('body'), color: S.tx3, margin: '3px 0 0' }}>{n.body}</p>}
                <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '6px 0 0', textAlign: 'right' }}>{timeAgo(n.created_at)}</p>
              </div>
            </div>
          </button>
          </SwipeableRow>
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}
