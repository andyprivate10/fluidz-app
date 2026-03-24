import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'

const S = colors

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handle() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { navigate('/login'); return }

      // Ensure user_profiles row exists
      const { data: existing } = await supabase.from('user_profiles').select('id').eq('id', session.user.id).maybeSingle()
      if (!existing) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        const avatar = session.user.user_metadata?.avatar_url || null
        await supabase.from('user_profiles').insert({
          id: session.user.id,
          display_name: name,
          profile_json: avatar ? { avatar_url: avatar } : {},
        })
      }

      // Check for stored redirect
      try {
        const redirect = localStorage.getItem('auth_redirect')
        if (redirect) { localStorage.removeItem('auth_redirect'); navigate(redirect); return }
      } catch {}

      navigate('/')
    }
    handle()
  }, [navigate])

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
