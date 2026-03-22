import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'
import SideDrawer from './SideDrawer'

const S = colors

const tabs = [
  {
    id: 'home',
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'profiles',
    path: '/explore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'sessions',
    path: '/sessions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    id: 'chats',
    path: '/chats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [hasNewApplication, setHasNewApplication] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
  if (/\/(dm|chat)/.test(location.pathname) && !location.pathname.startsWith('/chats')) return null
  if (/^\/session\/[a-f0-9-]+/.test(location.pathname)) return null
  if (location.pathname.startsWith('/join/')) return null

  const active = tabs.find(t => {
    if (t.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(t.path)
  })?.id || (location.pathname === '/' ? 'home' : '')

  const showMenuDot = unreadNotifCount > 0

  return (
    <>
      <nav aria-label="Main navigation" style={{
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
            const showDot = (tab.id === 'sessions' && hasNewApplication) ||
                            (tab.id === 'chats' && unreadChatCount > 0)

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                aria-label={t(`nav.${tab.id}`)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: 'pointer',
                  position: 'relative', padding: '10px 0',
                }}
              >
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
                  {showDot && (
                    <div style={{
                      position: 'absolute', top: -2, right: -4,
                      width: 7, height: 7, borderRadius: '50%',
                      background: S.p, border: `2px solid ${S.bg}`,
                    }} />
                  )}
                </div>

                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 600,
                  letterSpacing: '-0.01em',
                  color: isActive ? S.p : S.tx3,
                  transition: 'color 0.2s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {t(`nav.${tab.id}`)}
                </span>
              </button>
            )
          })}

          {/* Hamburger menu button */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
            aria-expanded={drawerOpen}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative', padding: '10px 0',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{ width: 20, height: 20, color: drawerOpen ? S.p : S.tx3, transition: 'color 0.2s' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </div>
              {showMenuDot && (
                <div style={{
                  position: 'absolute', top: -2, right: -4,
                  width: 7, height: 7, borderRadius: '50%',
                  background: S.p, border: `2px solid ${S.bg}`,
                }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: '-0.01em',
              color: drawerOpen ? S.p : S.tx3,
              transition: 'color 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Menu
            </span>
          </button>
        </div>
      </nav>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
