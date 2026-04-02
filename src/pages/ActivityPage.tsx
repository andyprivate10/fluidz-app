import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { colors, fonts } from '../brand'
import { useTranslation } from 'react-i18next'
import { Users, CheckCircle, X, MapPin, MessageCircle, Star, Heart, Eye, Bell, Clock, Flame } from 'lucide-react'
import PageFadeIn from '../components/PageFadeIn'
import OrbLayer from '../components/OrbLayer'
import { showToast } from '../components/Toast'
import { timeAgo } from '../lib/timing'

const S = colors

type ActivityItem = {
  id: string
  type: string
  title: string
  body?: string
  href?: string
  created_at: string
  read_at?: string | null
  actor_id?: string
  actor_name?: string
  actor_avatar?: string
}

function getIcon(type: string) {
  switch (type) {
    case 'new_application': return { icon: Users, color: S.sage }
    case 'application_accepted': case 'check_in_confirmed': return { icon: CheckCircle, color: S.sage }
    case 'application_not_selected': return { icon: X, color: S.red }
    case 'check_in_request': return { icon: MapPin, color: S.amber }
    case 'new_dm': case 'new_message': return { icon: MessageCircle, color: S.lav }
    case 'review_reminder': return { icon: Star, color: S.amber }
    case 'contact_request': return { icon: Heart, color: S.p }
    case 'interest': case 'interest_sent': return { icon: Flame, color: S.p }
    case 'profile_view': return { icon: Eye, color: S.tx3 }
    default: return { icon: Bell, color: S.tx3 }
  }
}

function groupByTime(items: ActivityItem[], t: (k: string) => string): { label: string; items: ActivityItem[] }[] {
  const now = Date.now()
  const day = 86400000
  const groups: Record<string, ActivityItem[]> = { today: [], week: [], month: [], older: [] }
  for (const item of items) {
    const age = now - new Date(item.created_at).getTime()
    if (age < day) groups.today.push(item)
    else if (age < 7 * day) groups.week.push(item)
    else if (age < 30 * day) groups.month.push(item)
    else groups.older.push(item)
  }
  return [
    { label: t('activity.today'), items: groups.today },
    { label: t('activity.this_week'), items: groups.week },
    { label: t('activity.this_month'), items: groups.month },
    { label: t('activity.older'), items: groups.older },
  ].filter(g => g.items.length > 0)
}

export default function ActivityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'interactions' | 'notifications'>('all')

  useEffect(() => {
    if (!user) return
    loadActivity()
  }, [user])

  async function loadActivity() {
    if (!user) return
    setLoading(true)
    const cutoff90 = new Date(Date.now() - 90 * 86400000).toISOString()
    const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString()

    const [notifsRes, interRes] = await Promise.all([
      supabase.from('notifications').select('id, type, title, body, href, read_at, created_at')
        .eq('user_id', user.id).gte('created_at', cutoff90).order('created_at', { ascending: false }).limit(100),
      supabase.from('interaction_log').select('id, type, user_id, meta, created_at')
        .eq('target_user_id', user.id).gte('created_at', cutoff30).order('created_at', { ascending: false }).limit(60),
    ])

    const notifItems: ActivityItem[] = (notifsRes.data || []).map((n: any) => ({
      id: 'n-' + n.id, type: n.type, title: n.title || '', body: n.body, href: n.href,
      created_at: n.created_at, read_at: n.read_at, source: 'notification',
    }))

    const interactions = interRes.data || []
    let interItems: ActivityItem[] = []
    if (interactions.length > 0) {
      const actorIds = [...new Set(interactions.map((i: any) => i.user_id).filter(Boolean))]
      const { data: profiles } = actorIds.length > 0
        ? await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', actorIds)
        : { data: [] }
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, { name: p.display_name, avatar: p.profile_json?.avatar_url }]))

      interItems = interactions.map((i: any) => {
        const actor = profileMap.get(i.user_id)
        const label = i.type === 'profile_view' ? t('activity.profile_view')
          : i.type === 'interest_sent' ? t('activity.interest_received')
          : i.type
        return {
          id: 'i-' + i.id, type: i.type, title: label, body: undefined,
          href: i.user_id ? '/profile/' + i.user_id : undefined,
          created_at: i.created_at, read_at: null,
          actor_id: i.user_id, actor_name: actor?.name, actor_avatar: actor?.avatar,
          source: 'interaction',
        }
      })
    }

    const merged = [...notifItems, ...interItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setItems(merged)
    setLoading(false)
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })))
    showToast(t('activity.mark_all_read'), 'success')
  }

  const filteredItems = tab === 'all' ? items
    : tab === 'notifications' ? items.filter(i => i.id.startsWith('n-'))
    : items.filter(i => i.id.startsWith('i-'))

  const unreadCount = items.filter(i => !i.read_at && i.id.startsWith('n-')).length
  const groups = groupByTime(filteredItems, t)

  return (
    <PageFadeIn>
      <div style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
        <OrbLayer />
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 12px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 2px' }}>{t('activity.title')}</h1>
              {unreadCount > 0 && <span style={{ fontSize: 11, color: S.p, fontWeight: 600 }}>{unreadCount} {t('notifications.unread')}</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + S.pbd, background: S.p2, color: S.p, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {t('activity.mark_all_read')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {(['all', 'interactions', 'notifications'] as const).map(t2 => (
              <button key={t2} onClick={() => setTab(t2)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid ' + (tab === t2 ? S.pbd : S.rule),
                background: tab === t2 ? S.p2 : 'transparent',
                color: tab === t2 ? S.p : S.tx3,
              }}>{t(`activity.tab_${t2}`)}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 56, borderRadius: 12, background: S.bg2, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: S.tx3 }}>
              <Clock size={32} strokeWidth={1.5} style={{ color: S.tx3, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t('activity.empty')}</p>
              <p style={{ fontSize: 12, color: S.tx3 }}>{t('activity.empty_desc')}</p>
            </div>
          )}

          {!loading && groups.map(group => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{group.label}</p>
              {group.items.map(item => {
                const { icon: Icon, color } = getIcon(item.type)
                const isUnread = !item.read_at && item.id.startsWith('n-')
                return (
                  <div key={item.id} onClick={() => item.href && navigate(item.href)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 12, marginBottom: 4, cursor: item.href ? 'pointer' : 'default',
                    background: isUnread ? 'rgba(224,136,122,0.06)' : 'transparent',
                    border: '1px solid ' + (isUnread ? 'rgba(224,136,122,0.15)' : 'transparent'),
                  }}>
                    {item.actor_avatar ? (
                      <img src={item.actor_avatar} alt="" loading="lazy" style={{ width: 32, height: 32, borderRadius: '28%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '28%', background: S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} strokeWidth={1.5} style={{ color }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: S.tx, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.actor_name ? `${item.actor_name} — ` : ''}{item.title}
                      </p>
                      {item.body && <p style={{ fontSize: 11, color: S.tx3, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: S.tx3 }}>{timeAgo(item.created_at)}</span>
                      {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: S.p }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </PageFadeIn>
  )
}
