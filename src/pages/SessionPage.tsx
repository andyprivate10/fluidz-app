import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Session = { id: string; title: string; description: string; approx_area: string; exact_address: string | null; status: string; host_id: string; invite_code: string | null; tags?: string[] }
type Member = { applicant_id: string; eps_json: Record<string, string>; status: string }

const st: React.CSSProperties = { background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 96, fontFamily: 'Inter, sans-serif' }
const card: React.CSSProperties = { background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 16 }

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [myApp, setMyApp] = useState<{ status: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({})
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInDone, setCheckInDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [showPostulerSuccess, setShowPostulerSuccess] = useState(false)

  const isHost = currentUser?.id === session?.host_id

  useEffect(() => {
    setLoadError(false)
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user ?? null)

        const { data: sess, error: sessErr } = await supabase.from('sessions').select('*').eq('id', id).single()
        if (sessErr) throw sessErr
        setSession(sess)

      const { data: accepted } = await supabase
        .from('applications')
        .select('applicant_id, eps_json, status')
        .eq('session_id', id)
        .eq('status', 'accepted')
      setMembers(accepted ?? [])

      const ids = (accepted ?? []).map((a: { applicant_id: string }) => a.applicant_id)
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, profile_json').in('id', ids)
        const avatarMap: Record<string, string> = {}
        const roleMap: Record<string, string> = {}
        ;(profiles ?? []).forEach((r: { id: string; profile_json?: { avatar_url?: string; role?: string } }) => {
          if (r.profile_json?.avatar_url) avatarMap[r.id] = r.profile_json.avatar_url
          if (r.profile_json?.role) roleMap[r.id] = r.profile_json.role
        })
        setMemberAvatars(avatarMap)
        setMemberRoles(roleMap)
      } else { setMemberAvatars({}); setMemberRoles({}) }

      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('status')
          .eq('session_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle()
        setMyApp(app)
        if (app?.status === 'checked_in') setCheckInDone(true)
        if (app?.status === 'pending') {
          setShowPostulerSuccess(true)
          setTimeout(() => setShowPostulerSuccess(false), 2000)
        }
      }

      if (user && sess?.host_id === user.id) {
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', id).eq('status', 'pending')
        setPendingCount(count ?? 0)
      } else setPendingCount(0)
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleCheckIn = async () => {
    if (!currentUser) return
    setCheckInLoading(true)
    await supabase
      .from('applications')
      .update({ status: 'checked_in' })
      .eq('session_id', id)
      .eq('applicant_id', currentUser.id)
    setMyApp(prev => prev ? { ...prev, status: 'checked_in' } : null)
    setCheckInDone(true)
    setCheckInLoading(false)
  }

  if (loading) return (
    <div style={{ ...st, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="w-8 h-8 border-4 border-peach300 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (loadError) return (
    <div style={{ ...st, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: '#F87171', textAlign: 'center' }}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  if (!session) return <div style={{ ...st, padding: 24, color: '#F87171' }}>Session introuvable.</div>

  const statusLabel = session.status === 'open' ? 'Ouverte' : 'Brouillon'
  const statusColor = session.status === 'open' ? '#4ADE80' : '#7E7694'

  return (
    <div style={st}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #2A2740', background: '#16141F' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F0EDFF', flex: 1 }}>{session.title}</h1>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: '#2A2740', padding: '3px 10px', borderRadius: 50, marginLeft: 8, whiteSpace: 'nowrap' }}>{statusLabel}</span>
        </div>
        {session.tags && session.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {session.tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: '#F9A8A8', padding: '4px 10px', borderRadius: 99, background: '#F9A8A818', border: '1px solid #F9A8A844' }}>{tag}</span>
            ))}
          </div>
        )}
        {session.approx_area && <div style={{ fontSize: 13, color: '#7E7694', marginTop: 6 }}>Autour de {session.approx_area}</div>}
        {isHost && <div style={{ fontSize: 12, color: '#F9A8A8', marginTop: 4, fontWeight: 600 }}>Tu es le host</div>}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {session.description && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>DESCRIPTION</div>
            <div style={{ fontSize: 14, color: '#B8B2CC', lineHeight: 1.6 }}>{session.description}</div>
          </div>
        )}

        {members.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7E7694', marginBottom: 12 }}>LINEUP ({members.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => {
                const eps = m.eps_json || {}
                const avatarUrl = memberAvatars[m.applicant_id]
                const role = memberRoles[m.applicant_id] || eps.role
                return (
                  <Link key={m.applicant_id} to={'/profile/' + m.applicant_id} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F9A8A8,#F47272)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {(eps.displayName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EDFF' }}>{eps.displayName || 'Anonyme'}{eps.age ? ', ' + eps.age : ''}</div>
                      {role && <div style={{ fontSize: 11, color: '#7E7694' }}>{role}</div>}
                    </div>
                    {m.status === 'checked_in' && <div style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>Check-in</div>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {myApp?.status === 'accepted' && !checkInDone && (
          <button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#4ADE80,#16a34a)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            {checkInLoading ? 'Enregistrement...' : 'Je suis arrive ! Check-in'}
          </button>
        )}

        {checkInDone && (
          <div style={{ ...card, background: '#14532d', borderColor: '#4ADE80', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>Bienvenue !</div>
            <div style={{ fontSize: 14, color: '#4ADE80', marginTop: 4 }}>Check-in confirme</div>
            {session.exact_address && <div style={{ fontSize: 14, color: '#F0EDFF', marginTop: 8, fontWeight: 600 }}>{session.exact_address}</div>}
          </div>
        )}

        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/session/' + id + '/host')} style={{ width: '100%', padding: 14, background: '#16141F', border: '1px solid #2A2740', borderRadius: 12, color: '#F0EDFF', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {pendingCount > 0 ? `Gerer (${pendingCount} en attente)` : 'Gerer la session'}
            </button>
            {session.invite_code && (
              <button onClick={() => {
                const url = window.location.origin + '/join/' + session.invite_code
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
              }} style={{ width: '100%', padding: 14, background: copied ? '#14532d' : '#16141F', border: '1px solid ' + (copied ? '#4ADE80' : '#F9A8A8'), borderRadius: 12, color: copied ? '#4ADE80' : '#F9A8A8', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {copied ? 'Lien copie !' : 'Partager le lien'}
              </button>
            )}
          </div>
        )}

        {myApp && (
          <div style={{ ...card }}>
            {myApp.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', padding: '6px 12px', borderRadius: 99, background: '#FBBF2418', border: '1px solid #FBBF2444' }}>En attente de réponse...</span>
              </div>
            )}
            {myApp.status === 'accepted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#4ADE80', padding: '6px 12px', borderRadius: 99, background: '#4ADE8018', border: '1px solid #4ADE8044' }}>Accepté ✓</span>
                <button onClick={() => navigate('/session/' + id + '/dm')} style={{ width: '100%', padding: 14, background: '#16141F', border: '1px solid #4ADE80', borderRadius: 12, color: '#4ADE80', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Ouvrir le DM
                </button>
              </div>
            )}
            {myApp.status === 'rejected' && (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F87171', padding: '6px 12px', borderRadius: 99, background: '#F8717118', border: '1px solid #F8717144' }}>Non retenu</span>
            )}
            {myApp.status === 'checked_in' && (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4ADE80', padding: '6px 12px', borderRadius: 99, background: '#4ADE8018', border: '1px solid #4ADE8044' }}>Check-in confirmé ✓</span>
            )}
          </div>
        )}

      </div>

      {(!isHost && (showPostulerSuccess || (!myApp && session.status === 'open'))) && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '12px 20px 24px', background: 'linear-gradient(to top, #0C0A14 60%, transparent)', zIndex: 50 }}>
          {showPostulerSuccess ? (
            <button disabled style={{ width: '100%', padding: 16, background: '#14532d', border: '1px solid #4ADE80', borderRadius: 14, color: '#4ADE80', fontSize: 16, fontWeight: 700 }}>
              Candidature envoyee ✓
            </button>
          ) : (
            <button onClick={() => currentUser ? navigate('/session/' + id + '/apply') : (session.invite_code ? navigate('/join/' + session.invite_code) : navigate('/me'))} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Postuler a cette session
            </button>
          )}
        </div>
      )}
    </div>
  )
}