import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'
import { Home, Zap, MessageCircle, Compass, User } from 'lucide-react'

const C = colors

const tabs = [
  { path: '/',         icon: Home,          label: 'Home' },
  { path: '/sessions', icon: Zap,           label: 'Sessions' },
  { path: '/chats',    icon: MessageCircle,  label: 'Chats' },
  { path: '/explore',  icon: Compass,       label: 'Explore' },
  { path: '/me',       icon: User,          label: 'Moi' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasNewApplication, setHasNewApplication] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // Unread notifications
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).is('read_at', null)
        .then(({ count }) => setUnreadNotifCount(count ?? 0))
      // Pending applications on hosted sessions
      supabase.from('sessions').select('id').eq('host_id', user.id).eq('status', 'open')
        .then(({ data: sessions }) => {
          if (!sessions || sessions.length === 0) return
          supabase.from('applications').select('id', { count: 'exact', head: true })
            .in('session_id', sessions.map(s => s.id)).eq('status', 'pending')
            .then(({ count }) => setHasNewApplication((count ?? 0) > 0))
        })
    })
  }, [location.pathname])

  // Update doc title
  useEffect(() => {
    document.title = unreadNotifCount > 0 ? `(${unreadNotifCount}) Fluidz` : 'Fluidz'
  }, [unreadNotifCount])

  // Hide on certain paths
  const hidePaths = ['/login', '/onboarding', '/ghost/setup']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null
  // Hide inside DM/chat pages (they have their own nav)
  if (/\/(dm|chat)/.test(location.pathname) && !location.pathname.startsWith('/chats')) return null

  const active = tabs.find(t => t.path === '/' ? location.pathname === '/' : location.pathname.startsWith(t.path))?.path || '/'

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,4,10,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${C.rule}`,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex', maxWidth: 480, margin: '0 auto',
        height: 56,
      }}>
        {tabs.map(tab => {
          const isActive = tab.path === active
          const Icon = tab.icon
          const showDot = (tab.path === '/chats' && unreadNotifCount > 0) ||
                          (tab.path === '/me' && hasNewApplication)

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', padding: 0,
              }}
            >
              {/* Active indicator — 2px peach line on top */}
              <div style={{
                position: 'absolute', top: 0, left: '25%', right: '25%',
                height: 2, borderRadius: 1,
                background: isActive ? C.p : 'transparent',
                transition: 'background 0.2s',
              }} />

              <div style={{ position: 'relative' }}>
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  style={{
                    color: isActive ? C.p : C.tx3,
                    transition: 'color 0.2s',
                  }}
                />
                {/* Badge dot */}
                {showDot && (
                  <div style={{
                    position: 'absolute', top: -2, right: -4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.p,
                    border: `2px solid ${C.bg}`,
                  }} />
                )}
              </div>

              <span style={{
                fontSize: 10, fontWeight: isActive ? 600 : 500,
                letterSpacing: '-0.01em',
                color: isActive ? C.tx : C.tx3,
                transition: 'color 0.2s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
