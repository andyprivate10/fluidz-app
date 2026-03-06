import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface EpsJson {
  displayName?: string
  age?: string
  bio?: string
  location?: string
  role?: string
  height?: string
  weight?: string
  morphology?: string
  kinks?: string[]
  prep?: string
  limits?: string
  sessionNote?: string
  message?: string
  profile_snapshot?: { display_name?: string; role?: string }
}

interface Application {
  id: string
  applicant_id: string
  status: string
  eps_json: EpsJson
  created_at: string
}

export default function CandidateProfilePage() {
  const { id: sessionId, applicantId } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId, applicantId])

  async function loadData() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Check if user is host
    if (user && sessionId) {
      const { data: sess } = await supabase.from('sessions').select('host_id').eq('id', sessionId).maybeSingle()
      setIsHost(sess?.host_id === user.id)
    }

    // Load application
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('applicant_id', applicantId)
      .maybeSingle()

    setApp(data)
    setLoading(false)
  }

  async function handleDecision(decision: 'accepted' | 'rejected') {
    if (!app || !sessionId) return
    setActioning(true)
    await supabase.from('applications').update({ status: decision }).eq('id', app.id)

    // If accepted, open DM
    if (decision === 'accepted') {
      navigate('/session/' + sessionId + '/host')
    } else {
      navigate('/session/' + sessionId + '/host')
    }
    setActioning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg0 pb-36">
        <div className="px-5 pt-10 pb-6">
          <div className="h-4 w-16 bg-[#2A2740] rounded animate-pulse mb-4" />
          <div className="h-8 w-48 bg-[#2A2740] rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-[#2A2740] rounded animate-pulse" />
        </div>
        <div className="px-5 space-y-4">
          <div className="card p-4">
            <div className="h-4 w-full max-w-[180px] bg-[#2A2740] rounded animate-pulse mb-3" />
            <div className="h-3 w-full bg-[#2A2740] rounded animate-pulse mb-2" />
            <div className="h-3 w-3/4 bg-[#2A2740] rounded animate-pulse" />
          </div>
          <div className="card p-4">
            <div className="h-4 w-28 bg-[#2A2740] rounded animate-pulse mb-3" />
            <div className="h-3 w-full bg-[#2A2740] rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-[#2A2740] rounded animate-pulse" />
          </div>
          <div className="card p-4">
            <div className="h-4 w-24 bg-[#2A2740] rounded animate-pulse mb-3" />
            <div className="h-20 w-full bg-[#2A2740] rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-bg0 flex flex-col items-center justify-center px-6">
        <p className="text-tx3">Candidature introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-peach text-sm" style={{ color: '#F9A8A8' }}>Retour</button>
      </div>
    )
  }

  const eps = app.eps_json || {}
  const kinks = eps.kinks || []
  const snapshot = eps.profile_snapshot || {}
  const p = (app.eps_json as Record<string, unknown>) || {}
  const health = ((p.health || (snapshot as Record<string, unknown>).health) as { prep_status?: string; dernier_test?: string }) || {}
  const prepStatus = health.prep_status || eps.prep
  const dernierTest = health.dernier_test
  const messageText = eps.message || eps.sessionNote || (p.occasion_note as string)

  function monthsAgo(iso: string): number {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 0
    const now = new Date()
    return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
  }

  return (
    <div className="min-h-screen bg-bg0 pb-36">
      {/* Header */}
      <div className="px-5 pt-10 pb-6">
        <button onClick={() => navigate(-1)} className="text-tx3 text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-tx">{eps.displayName || snapshot.display_name || 'Anonyme'}</h1>
            <div className="flex items-center gap-2 mt-1">
              {eps.age && <span className="text-tx3 text-sm">{eps.age} ans</span>}
              {eps.location && <span className="text-tx3 text-sm">· {eps.location}</span>}
            </div>
          </div>
          {(eps.role || snapshot.role) && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white mt-1"
              style={{ background: 'linear-gradient(135deg,#F9A8A8,#F47272)' }}>
              {eps.role || snapshot.role}
            </span>
          )}
        </div>

        <div className="mt-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            app.status === 'accepted' ? 'bg-green-900 text-green-300' :
            app.status === 'rejected' ? 'bg-red-900 text-red-300' :
            'bg-bg3 text-tx3'
          }`}>
            {app.status === 'accepted' ? '✓ Accepté' :
             app.status === 'rejected' ? '✗ Refusé' : '⏳ En attente'}
          </span>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {eps.bio && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border">
            <p className="text-tx3 text-xs uppercase tracking-wider mb-2">Bio</p>
            <p className="text-tx text-sm leading-relaxed">{eps.bio}</p>
          </div>
        )}

        {(eps.role || snapshot.role) && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border">
            <p className="text-tx3 text-xs uppercase tracking-wider mb-2">Rôle</p>
            <span className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#F9A8A8,#F47272)' }}>
              {eps.role || snapshot.role}
            </span>
          </div>
        )}

        {(eps.height || eps.weight || eps.morphology) && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border">
            <p className="text-tx3 text-xs uppercase tracking-wider mb-3">Physique</p>
            <div className="grid grid-cols-2 gap-3">
              {eps.height && (
                <div className="text-center p-2 rounded-xl bg-bg1">
                  <p className="text-lg font-bold text-tx">{eps.height}</p>
                  <p className="text-tx3 text-xs">cm</p>
                </div>
              )}
              {eps.weight && (
                <div className="text-center p-2 rounded-xl bg-bg1">
                  <p className="text-lg font-bold text-tx">{eps.weight}</p>
                  <p className="text-tx3 text-xs">kg</p>
                </div>
              )}
              {eps.morphology && (
                <div className="text-center p-2 rounded-xl bg-bg1">
                  <p className="text-sm font-semibold text-tx">{eps.morphology}</p>
                  <p className="text-tx3 text-xs">morpho</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(prepStatus || dernierTest) && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border">
            <p className="text-tx3 text-xs uppercase tracking-wider mb-2">Santé</p>
            <div className="flex flex-wrap gap-2">
              {prepStatus === 'Actif' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900/40 text-green-300 border border-green-500/40">PrEP actif ✓</span>
              )}
              {dernierTest && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-500/40">Testé il y a {monthsAgo(dernierTest)} mois</span>
              )}
              {prepStatus && prepStatus !== 'Actif' && (
                <span className="px-3 py-1 rounded-full text-xs text-tx2">PrEP {prepStatus}</span>
              )}
            </div>
          </div>
        )}

        {kinks.length > 0 && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border">
            <p className="text-tx3 text-xs uppercase tracking-wider mb-3">Kinks</p>
            <div className="flex flex-wrap gap-2">
              {kinks.map((k: string) => (
                <span key={k} className="px-3 py-1 rounded-full text-xs font-medium text-tx2 border border-border bg-bg3 inline-flex items-center gap-1">
                  <span className="text-green-400">✓</span> {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {eps.limits && (
          <div className="rounded-2xl p-4 border-2 border-red-500/60 bg-red-950/20">
            <p className="text-red-400 text-xs uppercase tracking-wider mb-2">Limites</p>
            <p className="text-tx text-sm leading-relaxed">{eps.limits}</p>
          </div>
        )}

        {messageText && (
          <div className="bg-bg2 rounded-2xl p-4 border border-border" style={{ borderColor: '#F9A8A840' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#F9A8A8' }}>Message au host</p>
            <p className="text-tx text-sm leading-relaxed">{messageText}</p>
          </div>
        )}

        <div className="text-center text-tx3 text-xs pb-2">
          Candidature reçue le {new Date(app.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
        </div>
      </div>

      {isHost && app.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg0 border-t border-border flex gap-3 max-w-md mx-auto">
          <button
            onClick={() => handleDecision('rejected')}
            disabled={actioning}
            className="flex-1 py-4 rounded-2xl font-bold text-red-400 border-2 border-red-500/60 bg-red-950/20"
          >
            Refuser ✗
          </button>
          <button
            onClick={() => handleDecision('accepted')}
            disabled={actioning}
            className="flex-1 py-4 rounded-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#F9A8A8,#F47272)' }}
          >
            {actioning ? '...' : 'Accepter ✓'}
          </button>
        </div>
      )}
    </div>
  )
}