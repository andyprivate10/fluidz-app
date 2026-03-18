import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Plus, Clock, CheckCircle2, XCircle, Radio } from 'lucide-react'

const C = colors
const R = radius

type Session = { id: string; title: string; status: string; approx_area: string; created_at: string; host_id: string; tags?: string[] }
type AppSession = { session_id: string; status: string; title: string; approx_area: string }

const statusMap: Record<string, { text: string; color: string; Icon: typeof Clock }> = {
  pending:    { text: 'En attente',  color: C.lav,  Icon: Clock },
  accepted:   { text: 'Accepté',     color: C.sage, Icon: CheckCircle2 },
  checked_in: { text: 'Check-in',    color: C.sage, Icon: CheckCircle2 },
  rejected:   { text: 'Refusé',      color: C.red, Icon: XCircle },
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return mins + 'min'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'j'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const [hosted, setHosted] = useState<Session[]>([])
  const [applied, setApplied] = useState<AppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'hosted' | 'applied'>('hosted')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login?next=/sessions'); return }
    const { data: h } = await supabase.from('sessions').select('*').eq('host_id', user.id).neq('title', 'DM Direct').order('created_at', { ascending: false })
    setHosted(h || [])
    const { data: apps } = await supabase.from('applications').select('session_id, status, sessions(title, approx_area)').eq('applicant_id', user.id).order('created_at', { ascending: false })
    const mapped = (apps || []).map((a: any) => ({ session_id: a.session_id, status: a.status, title: a.sessions?.title || 'Session', approx_area: a.sessions?.approx_area || '' }))
    setApplied(mapped)
    if ((h || []).length === 0 && mapped.length > 0) setTab('applied')
    setLoading(false)
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  const card: React.CSSProperties = { background: C.bg1, border: `1px solid ${C.rule}`, borderRadius: R.card, padding: 16, cursor: 'pointer' }

  return (
    <div {...pullHandlers} style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 16px', borderBottom: `1px solid ${C.rule}`, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <h1 style={{ ...typeStyle('title'), color: C.tx, margin: '0 0 14px' }}>Sessions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['hosted', 'Mes sessions', hosted.length, C.p], ['applied', 'Candidatures', applied.length, C.sage]] as const).map(([k, label, count, color]) => (
            <button key={k} onClick={() => setTab(k as any)} style={{
              flex: 1, padding: '9px 8px', borderRadius: R.chip, ...typeStyle('label'), cursor: 'pointer',
              border: `1px solid ${tab === k ? color + '44' : C.rule}`,
              background: tab === k ? color + '12' : 'transparent',
              color: tab === k ? color : C.tx3,
            }}>
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="stagger-children" style={{ position: 'relative', zIndex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 96 }}>

        {tab === 'hosted' && (
          <>
            <button onClick={() => navigate('/session/create')} style={{
              width: '100%', padding: 14, background: C.p, border: 'none', borderRadius: R.btn,
              color: '#fff', ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${C.pbd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden',
            }}>
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle session
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '60%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
            </button>

            {loading && <p style={{ ...typeStyle('body'), color: C.tx3, textAlign: 'center', padding: 20 }}>Chargement...</p>}
            {!loading && hosted.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: C.tx3, ...typeStyle('body') }}>Aucune session. Crée ta première.</div>
            )}
            {hosted.map(sess => {
              const isOpen = sess.status === 'open'
              const isEnded = sess.status === 'ended'
              return (
                <div key={sess.id} onClick={() => navigate(isEnded ? '/session/' + sess.id : '/session/' + sess.id + '/host')} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ ...typeStyle('section'), color: C.tx, margin: 0, flex: 1 }}>{sess.title}</p>
                    <span style={{
                      ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.pill, marginLeft: 8,
                      color: isOpen ? C.sage : isEnded ? C.red : C.tx3,
                      background: isOpen ? C.sagebg : isEnded ? '#F8717114' : C.bg2,
                      border: `1px solid ${isOpen ? C.sagebd : isEnded ? '#F871712e' : C.rule}`,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {isOpen && <Radio size={8} />}
                      {isOpen ? 'Live' : isEnded ? 'Terminée' : 'Brouillon'}
                    </span>
                  </div>
                  {sess.approx_area && <p style={{ ...typeStyle('body'), color: C.tx2, margin: '5px 0 0' }}>{sess.approx_area}</p>}
                  {sess.tags && sess.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {sess.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{ ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.chip, background: C.p3, color: C.p, border: `1px solid ${C.pbd}` }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ ...typeStyle('meta'), color: C.tx3, margin: '8px 0 0' }}>{timeAgo(sess.created_at)}</p>
                </div>
              )
            })}
          </>
        )}

        {tab === 'applied' && (
          <>
            {loading && <p style={{ ...typeStyle('body'), color: C.tx3, textAlign: 'center', padding: 20 }}>Chargement...</p>}
            {!loading && applied.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: C.tx3, ...typeStyle('body') }}>Aucune candidature. Rejoins une session via un lien.</div>
            )}
            {applied.map(app => {
              const st = statusMap[app.status] || { text: app.status, color: C.tx3, Icon: Clock }
              return (
                <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ ...typeStyle('section'), color: C.tx, margin: 0, flex: 1 }}>{app.title}</p>
                    <span style={{
                      ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.pill, marginLeft: 8,
                      color: st.color, background: st.color + '12', border: `1px solid ${st.color}33`,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <st.Icon size={10} />
                      {st.text}
                    </span>
                  </div>
                  {app.approx_area && <p style={{ ...typeStyle('body'), color: C.tx2, margin: '6px 0 0' }}>{app.approx_area}</p>}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
