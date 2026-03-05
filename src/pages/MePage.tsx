import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function MePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        supabase.from('user_profiles').select('display_name').eq('id', u.id).maybeSingle()
          .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name) })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSendLink() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/me' },
    })
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Lien envoyé ! Vérifie ta boîte mail.')
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div
      style={{
        background: '#0C0A14',
        padding: 24,
        maxWidth: 390,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: '100vh',
        justifyContent: 'center',
        paddingBottom: 80,
      }}
    >
      {user ? (
        <>
          <p style={{ color: '#B8B2CC', margin: 0 }}>
            Connect&eacute; en tant que {user.email}
          </p>
          <input
            type="text"
            placeholder="Ton pseudo"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setProfileSaved(false) }}
            style={{
              background: '#16141F',
              border: '1px solid #2A2740',
              borderRadius: 12,
              padding: 14,
              color: '#F0EDFF',
              fontSize: 16,
              width: '100%',
            }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={async () => {
              if (!displayName.trim()) return
              await supabase.from('user_profiles').upsert(
                { id: user.id, display_name: displayName.trim() },
                { onConflict: 'id' }
              )
              setProfileSaved(true)
            }}
          >
            {profileSaved ? 'Enregistr\u00e9 !' : 'Enregistrer le pseudo'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleSignOut}>
            Se d&eacute;connecter
          </button>
        </>
      ) : (
        <>
          <input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              background: '#16141F',
              border: '1px solid #2A2740',
              borderRadius: 12,
              padding: 14,
              color: '#F0EDFF',
              fontSize: 16,
              width: '100%',
            }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleSendLink}
            disabled={loading}
            style={{ padding: 14, borderRadius: 12 }}
          >
            {loading ? 'Envoi…' : 'Envoyer le lien magique'}
          </button>
          {message && (
            <p style={{ color: '#B8B2CC', fontSize: 14, margin: 0 }}>
              {message}
            </p>
          )}
        </>
      )}
    </div>
  )
}
