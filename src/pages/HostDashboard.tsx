import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
type Application = { id: string; applicant_id: string; eps_json: Record<string, string>; status: string; created_at: string }
const statusColor = (s: string) => s === 'accepted' ? '#4ADE80' : s === 'rejected' ? '#F87171' : '#B8B2CC'
const statusLabel = (s: string) => s === 'accepted' ? 'Accepté ✓' : s === 'rejected' ? 'Refusé ✗' : 'En attente'
export default function HostDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [session, setSession] = useState<{ title: string; status: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Application | null>(null)
  const [actionLoading, setActionLoading] = useState)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/me'); return }
      const { data: sess } = await supabase.from('sessions').select('title,status').eq('id', id).single()
      if (!sess) { setLoading(false); return }
      setSession(sess)
      const { data: apps } = await supabase.from('applications').select('*').eq('session_id', id).order('created_at', { ascending: false })
      setApplications(apps || [])
      setLoading(false)
    }
    load()
  }, [id])
  const handleAction = async (appId: string, newStatus: 'accepted' | 'rejected') => {
    setActionLoading(true)
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
    if (selected?.id === appId) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    setActionLoading(false)
  }
  const handleOpenSession = async () => {
    await supabase.from('sessions').update({ status: 'open' }).eq('id', id)
    setSession(prev => prev ? { ...prev, status: 'open' } : null)
  }
  const shareLink = window.location.origin + '/session/' + id
  const copyLink = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const s: React.CSSProperties = { background: '#0C0A14', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 80 }
  const hdr: React.CSSProperties = { padding: '16px 24px', borderBottom: '1px solid #2A2740', background: '#16141F' }
  const card: React.CSSProperties = { background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 16, cursor: 'pointer' }
  if (loading) return <div style={{ ...s, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p style={{ color: '#B8B2CC' }}>Chargement...</p></div>
  if (selected) {
    const eps = selected.eps_json || {}
    return (
      <div style={s}>
        <div style={hdr}>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#B8B2CC', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 4 }}>← Retour</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDFF' }}>{eps.displayName || 'Candidat'}{eps.age ? ', ' + eps.age + ' ans' : ''}</div>
          <div style={{ fontSize: 12, color: statusColor(selected.status) }}>{statusLabel(selected.status)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
          <div style={{ ...card, cursor: 'default' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>BASICS</div>
            {eps.location && <div style={{ fontSize: 13, color: '#7E7694', marginBottom: 6 }}>📍 {eps.location}</div>}
            {eps.bio && <div style={{ fontSize: 14, color: '#B8B2CC', lineHeight: 1.5 }}>{eps.bio}</div>}
          </div>
      <div style={{ ...card, cursor: 'default' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>PHYSIQUE & RÔLE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {eps.role && <span style={{ fontSize: 13, color: '#F9A8A8', background: '#3D1A1A', border: '1px solid #F9A8A8', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>{eps.role}</span>}
              {eps.morphology && <span style={{ fontSize: 13, color: '#B8B2CC', background: '#2A2740', padding: '4px 12px', borderRadius: 50 }}>{eps.morphology}</span>}
              {eps.height && <span style={{ fontSize: 13, color: '#B8B2CC', background: '#2A2740', padding: '4px 12px', borderRadius: 50 }}>{eps.height} cm</span>}
              {eps.weight && <span style={{ fontSize: 13, color: '#B8B2CC', background: '#2A2740', padding: '4px 12px', borderRadius: 50 }}>{eps.weight} kg</span>}
            </div>
          </div>
          {eps.sessionNote && (
            <div stye={{ ...card, cursor: 'default' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>POUR CETTE SESSION</div>
              <div style={{ fontSize: 14, color: '#F0EDFF', lineHeight: 1.5, fontStyle: 'italic' }}>"{eps.sessionNote}"</div>
            </div>
          )}
          {selected.status === 'pending' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleAction(selected.id, 'rejected')} disabled={actionLoading} style={{ flex: 1, padding: 14, background: '#1F1D2B', border: '1px solid #F87171', borderRadius: 12, color: '#F87171', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Refuser ✗</button>
              <button onClick={() => handleAction(selected.id, 'accepted')} disabled={actionLoading} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg, #F9A8A8, #F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Accepter ✓</button>
        </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div style={s}>
      <div style={hdr}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDFF' }}>{session?.title}</div>
        <div style={{ fontSize: 12, color: '#7E7694', marginTop: 2 }}>{applications.length} candidature{applications.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        {session?.status === 'draft' && (
          <div style={{ background: '#16141F', border: '1px solid #F47272', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#B8B2CC', marginBottom: 12 }}>Session en brouillon. Ouvre-la pour recevoir des candidatures.</div>
            <button onClick={handleOpenSession} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #F9A8A8, #F47272)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Ouvrir la session 🚀</button>
          </div>
        )}
        <div style={{ background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', marginBottom: 8 }}>LIEN GRINDR</div>
          <div style={{ fontSize: 12, color: '#B8B2CC', marginBottom: 10, wordBreak: 'break-all' }}>{shareLink}</div>
          <button onClick={copyLink} style={{ width: '100%', padding: 12, background: copied ? '#14532d' : '#2A2740', border: '1px solid #453F5C', borderRadius: 12, color: copied ? '#4ADE80' : '#F0EDFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{copied ? '✓ Copié !' : '📋 Copier le lien'}</button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#7E7694', padding: '4px 0' }}>CANDIDATURES</div>
        {applications.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#7E7694', fontSize: 14 }}>Aucune candidature.<br/>Partage le lien !</div>}
        {applications.map(app =       const eps = app.eps_json || {}
          return (
            <div key={app.id} style={card} onClick={() => setSelected(app)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EDFF' }}>{eps.displayName || 'Anonyme'}{eps.age ? ', ' + eps.age + ' ans' : ''}</div>
                  {eps.role && <div style={{ fontSize: 13, color: '#F9A8A8', marginTop: 2 }}>{eps.role}</div>}
                  {eps.location && <div style={{ fontSize: 12, color: '#7E7694', marginTop: 2 }}>📍 {eps.location}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(app.status), background: '#2A2740', padding: '2px 10px', borderRadius: 50 }}>{statusLabel(app.status)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
