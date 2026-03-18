import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Zap, Bell, User, Compass } from 'lucide-react'

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, async (payload: { new: { session_id: string } }) => {
        const { data } = await supabase.from('sessions').select('host_id').eq('id', payload.new.session_id).maybeSingle()
        if (data?.host_id === userId) setHasNewApplication(true)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (/\/session\/[^/]+\/host/.test(location.pathname)) setHasNewApplication(false)
  }, [location.pathname])

  // Update document title with unread count
  useEffect(() => {
    document.title = unreadNotifCount > 0 ? `(${unreadNotifCount}) Fluidz` : 'Fluidz'
  }, [unreadNotifCount])

  // Hide on DM and dev pages
  if (location.pathname.includes('/dm') || location.pathname.includes('/chat') || location.pathname.includes('/host') || location.pathname.includes('/apply') || location.pathname.includes('/candidate') || location.pathname.includes('/ghost') || location.pathname.includes('/login') || location.pathname.includes('/onboarding') || location.pathname.includes('/review') || location.pathname.includes('/edit') || location.pathname.includes('/dev/')) return null

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/sessions', icon: Zap, label: 'Sessions' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/notifications', icon: Bell, label: 'Notifs' },
    { path: '/me', icon: User, label: 'Moi' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(22, 20, 31, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(42, 39, 64, 0.6)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '6px 0 calc(8px + env(safe-area-inset-bottom, 0px))',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const showBadge = (tab.path === '/me' && hasNewApplication) || (tab.path === '/notifications' && unreadNotifCount > 0)
        const Icon = tab.icon
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
              padding: '6px 20px',
              position: 'relative',
              transition: 'transform 0.15s',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? '#F9A8A8' : '#7E7694',
                  transition: 'color 0.2s',
                }}
              />
              {showBadge && tab.path === '/notifications' && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 8, background: '#F87171',
                  border: '2px solid #16141F',
                  fontSize: 10, fontWeight: 700, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
              {showBadge && tab.path === '/me' && (
                <span style={{
                  position: 'absolute', top: -2, right: -4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#F87171', border: '2px solid #16141F',
                }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? '#F9A8A8' : '#7E7694',
              transition: 'color 0.2s',
              letterSpacing: '0.01em',
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, borderRadius: 1,
                background: 'linear-gradient(90deg, #F9A8A8, #F47272)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
