import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userId, setUserId] = useState<string | null>(null)
  const [hasNewApplication, setHasNewApplication] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null)
      setUnreadNotifCount(count ?? 0)
    }
    fetch()
    const channel = supabase.channel('notifications-count').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetch()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('applications-for-host')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
      }, async (payload: { new: { session_id: string } }) => {
        const { data } = await supabase.from('sessions').select('host_id').eq('id', payload.new.session_id).maybeSingle()
        if (data?.host_id === userId) setHasNewApplication(true)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (/\/session\/[^/]+\/host/.test(location.pathname)) setHasNewApplication(false)
  }, [location.pathname])

  // Hide on DM pages (full-screen chat)
  if (location.pathname.includes('/dm')) return null

  const tabs = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/sessions', icon: '⚡', label: 'Sessions' },
    { path: '/notifications', icon: '🔔', label: 'Notifs' },
    { path: '/me', icon: '👤', label: 'Moi' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 390,
        background: '#16141F',
        borderTop: '1px solid #2A2740',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 20px',
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const showBadge = (tab.path === '/me' && hasNewApplication) || (tab.path === '/notifications' && unreadNotifCount > 0)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              padding: '4px 20px',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 20, position: 'relative' }}>
              {tab.icon}
              {tab.path === '/notifications' && unreadNotifCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 8,
                    background: '#F87171',
                    border: '2px solid #16141F',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden
                >
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
              {tab.path === '/me' && hasNewApplication && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#F87171',
                    border: '2px solid #16141F',
                  }}
                  aria-hidden
                />
              )}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? '#F9A8A8' : '#7E7694',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
