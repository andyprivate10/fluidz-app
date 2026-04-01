import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5 minutes

type AuthContextType = {
  user: User | null
  loading: boolean
  isGhost: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGhost: false })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Heartbeat: update last_seen in profile_json every 5 min
  useEffect(() => {
    if (!user || user.is_anonymous) return

    const updateLastSeen = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
      const pj = (data?.profile_json || {}) as Record<string, unknown>
      await supabase.from('user_profiles').update({ profile_json: { ...pj, last_seen: now } }).eq('id', user.id)
    }

    updateLastSeen()
    heartbeatRef.current = setInterval(updateLastSeen, HEARTBEAT_INTERVAL)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [user])

  const isGhost = user?.is_anonymous === true

  return (
    <AuthContext.Provider value={{ user, loading, isGhost }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
