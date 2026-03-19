import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'

const S = colors

const tabs = [
  {
    id: 'plans',
    path: '/',
    label: 'Plans',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    id: 'profiles',
    path: '/explore',
    label: 'Profiles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'chats',
    path: '/chats',
    label: 'Chats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'book',
    path: '/contacts',
    label: 'Book',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'me',
    path: '/me',
    label: 'Moi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [hasNewApplication, setHasNewApplication] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).is('read_at', null)
        .then(({ count }) => setUnreadNotifCount(count ?? 0))
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('type', 'new_message').is('read_at', null)
        .then(({ count }) => setUnreadChatCount(count ?? 0))
      supabase.from('sessions').select('id').eq('host_id', user.id).eq('status', 'open')
        .then(({ data: sessions }) => {
          if (!sessions || sessions.length === 0) return
          supabase.from('applications').select('id', { count: 'exact', head: true })
            .in('session_id', sessions.map(s => s.id)).eq('status', 'pending')
            .then(({ count }) => setHasNewApplication((count ?? 0) > 0))
        })
    })
  }, [location.pathname])

  useEffect(() => {
    document.title = unreadNotifCount > 0 ? `(${unreadNotifCount}) Fluidz` : 'Fluidz'
  }, [unreadNotifCount])

  // Hide on certain paths
  const hidePaths = ['/login', '/onboarding', '/ghost/setup']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null
  // Hide inside DM/chat pages (they have their own nav)
  if (/\/(dm|chat)/.test(location.pathname) && !location.pathname.startsWith('/chats')) return null
  // Hide inside ANY session context (contextual nav takes over)
  if (/^\/session\/[a-f0-9-]+/.test(location.pathname)) return null
  // Hide on join pages too
  if (location.pathname.startsWith('/join/')) return null

  const active = tabs.find(t => {
    if (t.path === '/') return location.pathname === '/' || location.pathname.startsWith('/sessions')
    return location.pathname.startsWith(t.path)
  })?.id || 'plans'

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,4,10,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(255,255,255,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex', maxWidth: 480, margin: '0 auto',
        height: 64,
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === active
          const showDot = (tab.id === 'plans' && hasNewApplication) ||
                          (tab.id === 'chats' && unreadChatCount > 0) ||
                          (tab.id === 'me' && unreadNotifCount > 0)

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', padding: '10px 0',
              }}
            >
              {/* Active indicator — 2px peach line on top */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '30%', right: '30%',
                  height: 2, background: S.p, borderRadius: 2,
                }} />
              )}

              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 20, height: 20,
                  color: isActive ? S.p : S.tx3,
                  transition: 'color 0.2s',
                }}>
                  {tab.icon}
                </div>
                {/* Badge dot */}
                {showDot && (
                  <div style={{
                    position: 'absolute', top: -2, right: -4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: S.p,
                    border: `2px solid ${S.bg}`,
                  }} />
                )}
              </div>

              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '-0.01em',
                color: isActive ? S.p : S.tx3,
                transition: 'color 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
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
