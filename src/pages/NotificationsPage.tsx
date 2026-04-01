import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, fonts, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import {Bell, CheckCheck, ArrowLeft, UserPlus, CheckCircle2, XCircle, Send, MapPin, Heart, MessageCircle, Star, BookOpen, Ban} from 'lucide-react'
import SwipeableRow from '../components/SwipeableRow'
import { showToast } from '../components/Toast'
import { timeAgo } from '../lib/timing'

const S = colors
const R = radius

type Notif = { id: string; type: string; title: string; body: string; href: string; read_at: string | null; created_at: string }

function NotifIcon({ type }: { type: string }) {
  const size = 14
  const sw = 1.5
  switch (type) {
    case 'new_application': return <UserPlus size={size} strokeWidth={sw} />
    case 'application_accepted': case 'accepted': return <CheckCircle2 size={size} strokeWidth={sw} />
    case 'application_rejected': case 'rejected': return <XCircle size={size} strokeWidth={sw} />
    case 'session_invite': case 'group_invite': case 'invite': return <Send size={size} strokeWidth={sw} />
    case 'check_in': case 'check_in_confirmed': return <MapPin size={size} strokeWidth={sw} />
    case 'intent_match': return <Heart size={size} strokeWidth={sw} />
    case 'dm_request': case 'direct_dm': return <MessageCircle size={size} strokeWidth={sw} />
    case 'review_request': case 'review': case 'review_reminder': return <Star size={size} strokeWidth={sw} />
    case 'naughtybook_added': case 'naughtybook': return <BookOpen size={size} strokeWidth={sw} />
    case 'ejected': return <Ban size={size} strokeWidth={sw} />
    default: return <Bell size={size} strokeWidth={sw} />
  }
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setNotifs(data || [])
    setLoading(false)
  }, [navigate, user])

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
            border: 'none', background: n.type === 'intent_match' ? 'rgba(74,222,128,0.06)' : S.bg, cursor: 'pointer', fontFamily: fonts.body,
            borderBottom: `1px solid ${n.type === 'intent_match' ? S.sagebd : S.rule}`, position: 'relative',
            borderLeft: n.read_at ? 'none' : `3px solid ${n.type === 'intent_match' ? S.sage : S.p}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: R.icon, flexShrink: 0, marginTop: 1,
                background: n.read_at ? S.bg2 : S.p3, border: `1px solid ${n.read_at ? S.rule : S.pbd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...typeStyle('meta'), color: n.read_at ? S.tx3 : S.p,
              }}>
                <NotifIcon type={n.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...typeStyle('label'), color: n.read_at ? S.tx2 : S.tx, margin: 0 }}>{n.title}</p>
                {n.body && <p style={{ ...typeStyle('body'), color: S.tx3, margin: '3px 0 0' }}>{n.body}</p>}
                {n.type === 'dm_request' && !n.read_at && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                    <button onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return
                      // Find sender from href or title
                      const { data: req } = await supabase.from('dm_requests').select('id, sender_id, message').eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()
                      if (!req) return
                      await supabase.from('dm_requests').update({ status: 'accepted' }).eq('id', req.id)
                      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
                      await supabase.from('notifications').insert({ user_id: req.sender_id, type: 'dm_request_accepted', title: t('dm_request.accepted'), href: '/dm/' + user.id })
                      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                      showToast(t('dm_request.accepted'), 'success')
                      navigate('/dm/' + req.sender_id)
                    }} style={{ flex: 1, padding: '8px', borderRadius: 10, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t('dm_request.accept')}
                    </button>
                    <button onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return
                      await supabase.from('dm_requests').update({ status: 'declined' }).eq('receiver_id', user.id).eq('status', 'pending')
                      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
                      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                      showToast(t('dm_request.declined'), 'info')
                    }} style={{ padding: '8px 12px', borderRadius: 10, background: 'transparent', border: '1px solid ' + S.rule, color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t('dm_request.decline')}
                    </button>
                  </div>
                )}
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
