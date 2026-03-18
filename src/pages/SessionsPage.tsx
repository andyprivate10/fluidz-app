import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

type Session = { id: string; title: string; status: string; approx_area: string; created_at: string; host_id: string; tags?: string[] }
type AppSession = { session_id: string; status: string; title: string; approx_area: string }

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',red:'#F87171',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const statusLabel: Record<string, { text: string; color: string }> = {
  pending: { text: 'En attente', color: S.yellow },
  accepted: { text: 'Accepté', color: S.green },
  checked_in: { text: 'Check-in', color: S.green },
  rejected: { text: 'Refusé', color: S.red },
}


function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "à l\'instant"
  if (mins < 60) return 'il y a ' + mins + 'min'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return 'il y a ' + hours + 'h'
  const days = Math.floor(hours / 24)
  if (days < 7) return 'il y a ' + days + 'j'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const [hosted, setHosted] = useState<Session[]>([])
  const [applied, setApplied] = useState<AppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'hosted'|'applied'>('hosted')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login?next=/sessions'); return }
    const { data: h } = await supabase.from('sessions').select('*').eq('host_id', user.id).neq('title', 'DM Direct').order('created_at', { ascending: false })
    setHosted(h || [])
    const { data: apps } = await supabase
      .from('applications')
      .select('session_id, status, sessions(title, approx_area)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })
    const mapped = (apps || []).map((a: any) => ({
      session_id: a.session_id, status: a.status,
      title: a.sessions?.title || 'Session', approx_area: a.sessions?.approx_area || '',
    }))
    setApplied(mapped)
    if ((h || []).length === 0 && mapped.length > 0) setTab('applied')
    setLoading(false)
  }, [navigate])

  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  useEffect(() => { loadData() }, [loadData])

  return (
    <div {...pullHandlers} style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.border }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 12px' }}>Sessions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('hosted')} style={{
            flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid ' + (tab === 'hosted' ? S.p300 + '55' : S.border),
            background: tab === 'hosted' ? S.p300 + '14' : S.bg2,
            color: tab === 'hosted' ? S.p300 : S.tx3,
          }}>
            Mes sessions {hosted.length > 0 && `(${hosted.length})`}
          </button>
          <button onClick={() => setTab('applied')} style={{
            flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid ' + (tab === 'applied' ? S.green + '55' : S.border),
            background: tab === 'applied' ? S.green + '14' : S.bg2,
            color: tab === 'applied' ? S.green : S.tx3,
          }}>
            Candidatures {applied.length > 0 && `(${applied.length})`}
          </button>
        </div>
      </div>

      <div className="stagger-children" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'hosted' && (
          <>
            <button
              onClick={() => navigate('/session/create')}
              style={{ width: '100%', padding: 14, background: S.grad, border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px ' + S.p400 + '44' }}
            >
              + Nouvelle session
            </button>
            {loading && <p style={{ color: S.tx3, textAlign: 'center' }}>Chargement...</p>}
            {!loading && hosted.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: S.tx3, fontSize: 14 }}>
                Aucune session. Crée ta première !
              </div>
            )}
            {hosted.map(sess => (
              <div
                key={sess.id}
                onClick={() => navigate(sess.status === 'ended' ? '/session/' + sess.id : '/session/' + sess.id + '/host')}
                style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16, cursor: 'pointer', }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: S.tx, flex: 1 }}>{sess.title}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: sess.status === 'open' ? S.green : sess.status === 'ended' ? S.red : S.tx3,
                    background: S.bg2, padding: '2px 8px', borderRadius: 50, marginLeft: 8,
                  }}>
                    {sess.status === 'open' ? 'Ouverte' : sess.status === 'ended' ? 'Terminée' : 'Brouillon'}
                  </span>
                </div>
                {sess.approx_area && <div style={{ fontSize: 12, color: S.tx3, marginTop: 4 }}>{sess.approx_area}</div>}
                {sess.tags && sess.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {sess.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: S.p300 + '14', color: S.p300, fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: S.tx4, marginTop: 4 }}>{timeAgo(sess.created_at)}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'applied' && (
          <>
            {loading && <p style={{ color: S.tx3, textAlign: 'center' }}>Chargement...</p>}
            {!loading && applied.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: S.tx3, fontSize: 14 }}>
                Aucune candidature. Rejoins une session via un lien d'invitation !
              </div>
            )}
            {applied.map(app => {
              const st = statusLabel[app.status] || { text: app.status, color: S.tx3 }
              return (
                <div
                  key={app.session_id}
                  onClick={() => navigate('/session/' + app.session_id)}
                  style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16, cursor: 'pointer', }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: S.tx, flex: 1 }}>{app.title}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: st.color,
                      background: st.color + '18', padding: '2px 8px', borderRadius: 50, marginLeft: 8,
                      border: '1px solid ' + st.color + '44',
                    }}>
                      {st.text}
                    </span>
                  </div>
                  {app.approx_area && <div style={{ fontSize: 12, color: S.tx3, marginTop: 6 }}>{app.approx_area}</div>}
                </div>
              )
            })}
          </>
        )}
      </div>

    </div>
  )
}
