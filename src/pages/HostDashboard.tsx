import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',red:'#F87171',green:'#4ADE80',yellow:'#FBBF24',orange:'#F97316',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

export default function HostDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [tab, setTab] = useState<'pending'|'accepted'|'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string|null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState(false)
  const [grinderCopied, setGrinderCopied] = useState(false)
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [hostDisplayName, setHostDisplayName] = useState<string>('')

  const [votes, setVotes] = useState<{ applicant_id: string; vote: string }[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) load(u)
      else setLoading(false)
    })

    // Realtime: auto-refresh when applications or votes change
    const channel = supabase
      .channel('host-dashboard-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `session_id=eq.${id}` }, () => { load() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function load(currentUser?: { id: string }) {
    setLoading(true)
    setLoadError(false)
    const uid = currentUser?.id ?? user?.id
    try {
      const [{ data: s }, { data: a }, { data: prof }, { data: v }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).maybeSingle(),
        supabase.from('applications').select('*, user_profiles(display_name, profile_json)').eq('session_id', id).order('created_at', { ascending: false }),
        uid ? supabase.from('user_profiles').select('display_name').eq('id', uid).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('votes').select('applicant_id, vote').eq('session_id', id),
      ])
      setSess(s)
      setApps(a || [])
      setVotes((v as { applicant_id: string; vote: string }[]) || [])
      if (prof?.display_name) setHostDisplayName(prof.display_name)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  async function decide(appId: string, status: 'accepted'|'rejected') {
    setActionLoading(appId)
    await supabase.from('applications').update({ status }).eq('id', appId)
    const app = apps.find(a => a.id === appId)
    if (app && sess) {
      // Notification
      const title = status === 'accepted'
        ? `Accepté pour "${sess.title}" ✓`
        : `Non retenu pour "${sess.title}"`
      const body = status === 'accepted'
        ? "Tu peux maintenant accéder au DM et à l'adresse."
        : ''
      const href = status === 'accepted'
        ? `/session/${id}/dm/${app.applicant_id}`
        : `/session/${id}`
      await supabase.from('notifications').insert({
        user_id: app.applicant_id,
        session_id: id,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        message: title,
        title,
        body,
        href,
      })

      // Safety tip DM on acceptance (1 per candidate)
      if (status === 'accepted' && user) {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', id)
          .eq('sender_name', '🛡️ Fluidz')
          .eq('dm_peer_id', app.applicant_id)
        if (!count || count === 0) {
          await supabase.from('messages').insert({
            session_id: id,
            sender_id: user.id,
            text: '⚠️ Rappel sécurité : Partage ta localisation avec un ami de confiance. Tu peux quitter à tout moment, sans justification. En cas de problème, contacte le host via ce DM.',
            sender_name: '🛡️ Fluidz',
            room_type: 'dm',
            dm_peer_id: app.applicant_id,
          })
        }
      }
    }
    setApps(prev => prev.map(a => a.id === appId ? {...a, status} : a))
    setActionLoading(null)
  }

  async function confirmCheckIn(appId: string) {
    setActionLoading(appId)
    await supabase.from('applications').update({ checked_in: true, status: 'checked_in', checked_in_at: new Date().toISOString() }).eq('id', appId)
    const app = apps.find(a => a.id === appId)
    if (app && sess) {
      // Notify the guest
      await supabase.from('notifications').insert({
        user_id: app.applicant_id,
        session_id: id,
        type: 'check_in_confirmed',
        message: `Check-in confirmé pour "${sess.title}" ✓`,
        title: `Check-in confirmé pour "${sess.title}" ✓`,
        body: "Tu peux maintenant partager le lien d'invitation.",
        href: `/session/${id}`,
      })
      // Auto-track co_event interactions with all other checked-in members
      const otherCheckedIn = apps.filter(a => a.id !== appId && a.status === 'checked_in')
      const interactions = otherCheckedIn.map(other => ({
        user_id: app.applicant_id,
        target_user_id: other.applicant_id,
        type: 'co_event',
        meta: { session_id: id, session_title: sess.title },
      }))
      // Also log reverse (other → new member)
      const reverseInteractions = otherCheckedIn.map(other => ({
        user_id: other.applicant_id,
        target_user_id: app.applicant_id,
        type: 'co_event',
        meta: { session_id: id, session_title: sess.title },
      }))
      if (interactions.length > 0) {
        try { await supabase.from('interaction_log').insert([...interactions, ...reverseInteractions]) } catch (_) {}
      }
    }
    setApps(prev => prev.map(a => a.id === appId ? {...a, checked_in: true, status: 'checked_in', checked_in_at: new Date().toISOString()} : a))
    setActionLoading(null)
  }

  async function toggleStatus() {
    const newStatus = sess.status === 'open' ? 'closed' : 'open'
    await supabase.from('sessions').update({ status: newStatus }).eq('id', id)
    setSess((s: any) => ({...s, status: newStatus}))
  }

  async function closeSession() {
    if (!window.confirm('Fermer définitivement cette session ? Elle ne sera plus modifiable.')) return
    await supabase.from('sessions').update({ status: 'ended' }).eq('id', id)
    setSess((s: any) => ({...s, status: 'ended'}))
    // Send review notification to all accepted/checked_in participants
    const participants = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    if (participants.length > 0 && sess) {
      const notifs = participants.map(p => ({
        user_id: p.applicant_id,
        session_id: id,
        type: 'review_request',
        title: `⭐ Comment c'était "${sess.title}" ?`,
        body: 'Laisse un avis anonyme pour aider la communauté',
        href: `/session/${id}/review`,
      }))
      try { await supabase.from('notifications').insert(notifs) } catch (_) {}
    }
  }

  async function sendBroadcast() {
    const text = broadcastText.trim()
    if (!text || !user || !id) return
    setBroadcastSending(true)
    // Send 1 DM per accepted/checked_in member
    const acceptedApps = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    const senderName = hostDisplayName || (user as any).email || 'Host'
    const inserts = acceptedApps.map(a => ({
      session_id: id,
      sender_id: user!.id,
      text,
      sender_name: senderName,
      room_type: 'dm',
      dm_peer_id: a.applicant_id,
    }))
    if (inserts.length > 0) {
      await supabase.from('messages').insert(inserts)
    }
    setBroadcastText('')
    setBroadcastSending(false)
  }

  const filtered = tab === 'accepted'
    ? apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    : apps.filter(a => a.status === tab)
  const counts = {
    pending: apps.filter(a=>a.status==='pending').length,
    accepted: apps.filter(a=>a.status==='accepted'||a.status==='checked_in').length,
    rejected: apps.filter(a=>a.status==='rejected').length,
  }
  const arrivedCount = apps.filter(a => a.status === 'checked_in').length
  const waitingCount = apps.filter(a => a.status === 'accepted' && a.checked_in).length
  const totalAccepted = counts.accepted

  if (loading) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80}}>
      <div className="w-8 h-8 border-4 border-peach300 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg0,display:'flex',justifyContent:'center',paddingTop:80}}>
      <p style={{color:S.red,textAlign:'center'}}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:S.bg0,paddingBottom:96}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.border}}>
        <button onClick={() => navigate(-1)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}>← Retour</button>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:S.tx,margin:'0 0 4px'}}>{sess?.title}</h1>
            <p style={{fontSize:13,color:S.tx3,margin:0}}>{sess?.approx_area}</p>
          </div>
          <button onClick={toggleStatus} style={{
            padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
            background: sess?.status==='open' ? S.green+'22' : S.bg3,
            color: sess?.status==='open' ? S.green : S.tx3,
          }}>
            {sess?.status==='open' ? 'Ouvert' : 'Fermé'}
          </button>
        </div>
        {sess?.status !== 'ended' && (
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={() => navigate('/session/' + id + '/edit')} style={{flex:1,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.border,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              Modifier
            </button>
            <button onClick={closeSession} style={{flex:1,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.red,background:'transparent',color:S.red,cursor:'pointer'}}>
              Fermer la session
            </button>
          </div>
        )}

        <button onClick={() => navigate('/session/' + id + '/chat')} style={{marginTop:8,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:'transparent',color:S.p300,cursor:'pointer',width:'100%'}}>
          Group Chat
        </button>

        {sess?.invite_code && (
          <>
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code
                navigator.clipboard.writeText(url).then(() => {
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                })
              }}
              style={{marginTop:12,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:linkCopied ? S.green+'22' : 'transparent',color:linkCopied ? S.green : S.p300,cursor:'pointer',width:'100%'}}
            >
              {linkCopied ? 'Lien copié' : 'Partager'}
            </button>
            <div style={{marginTop:12,padding:12,borderRadius:10,border:'1px solid '+S.border,background:S.bg2}}>
              <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>Partager sur Grindr / WhatsApp</div>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + sess.invite_code
                  const text = '🔥 Plan ce soir – ' + (sess.title || '') + ' – ' + (sess.approx_area || '') + ' – Postule : ' + url
                  navigator.clipboard.writeText(text).then(() => {
                    setGrinderCopied(true)
                    setTimeout(() => setGrinderCopied(false), 2000)
                  })
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:grinderCopied ? S.green+'22' : 'transparent',color:grinderCopied ? S.green : S.p300,cursor:'pointer',marginBottom:8}}
              >
                {grinderCopied ? 'Copié !' : 'Copier message Grindr'}
              </button>
              <button
                onClick={() => {
                  const lines = [sess.title, sess.description || '', 'Postule ici : ' + window.location.origin + '/join/' + sess.invite_code].filter(Boolean)
                  navigator.clipboard.writeText(lines.join('\n')).then(() => {
                    setMessageCopied(true)
                    setTimeout(() => setMessageCopied(false), 2000)
                  })
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p300,background:messageCopied ? S.green+'22' : 'transparent',color:messageCopied ? S.green : S.p300,cursor:'pointer'}}
              >
                {messageCopied ? 'Copié ✓' : 'Copier le message'}
              </button>
            </div>
          </>
        )}
        {/* Arrival stats */}
        {totalAccepted > 0 && (
          <div style={{marginTop:16,padding:14,borderRadius:12,background:S.bg2,border:'1px solid '+S.border,display:'flex',justifyContent:'space-around',textAlign:'center'}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.green}}>{arrivedCount}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>Arrivés</div>
            </div>
            {waitingCount > 0 && (
              <div>
                <div style={{fontSize:20,fontWeight:800,color:S.orange}}>{waitingCount}</div>
                <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>À confirmer</div>
              </div>
            )}
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.tx2}}>{totalAccepted - arrivedCount}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>En route</div>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.p300}}>{totalAccepted}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>Total</div>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,marginTop:16}}>
          {([['pending','En attente',S.yellow],['accepted','Acceptés',S.green],['rejected','Refusés',S.red]] as const).map(([t,l,c]) => (
            <button key={t} onClick={() => setTab(t as any)} style={{
              flex:1,padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid '+(tab===t ? c+'55' : S.border),
              background: tab===t ? c+'14' : S.bg2,
              color: tab===t ? c : S.tx3,
            }}>
              {l} {counts[t as keyof typeof counts] > 0 && <span style={{fontWeight:800}}>({counts[t as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{padding:12,borderRadius:10,border:'1px solid '+S.border,background:S.bg2}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>Broadcast</div>
          <textarea value={broadcastText} onChange={e=>setBroadcastText(e.target.value)} placeholder="Message à envoyer à tous les membres..." rows={2} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid '+S.border,background:S.bg1,color:S.tx,fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:8}} />
          <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastText.trim()} style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:S.grad,color:'#fff',cursor: broadcastSending || !broadcastText.trim() ? 'not-allowed' : 'pointer',opacity: broadcastSending || !broadcastText.trim() ? 0.7 : 1}}>
            {broadcastSending ? 'Envoi...' : 'Envoyer à tous'}
          </button>
        </div>
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 20px',color:S.tx3,fontSize:14}}>
            {tab==='pending' ? 'Aucune candidature en attente' : tab==='accepted' ? 'Aucun membre accepté' : 'Aucun refus'}
          </div>
        )}

        {filtered.map(app => {
          const prof = app.user_profiles
          const pj = prof?.profile_json || {}
          const snapshot = app.eps_json?.profile_snapshot || {}
          const isGhost = !!app.eps_json?.is_phantom || prof?.display_name === 'Invité'
          const displayName = prof?.display_name || snapshot?.display_name || 'Anonyme'
          const displayRole = pj.role || snapshot?.role
          return (
            <div key={app.id} style={{background:S.bg1,borderRadius:18,border:'1px solid '+S.border,overflow:'hidden'}}>
              <div style={{padding:'16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <p style={{margin:'0 0 2px',fontSize:16,fontWeight:800,color:S.tx}}>
                      <Link to={'/profile/' + app.applicant_id} style={{color:S.tx,textDecoration:'none'}}>{displayName}</Link>
                    </p>
                    {isGhost && <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.tx4,color:S.tx2,border:'1px solid '+S.border}}>Ghost</span>}
                    {displayRole && <span style={{fontSize:12,fontWeight:600,padding:'2px 10px',borderRadius:99,background:S.p300+'18',color:S.p300,border:'1px solid '+S.p300+'33'}}>{displayRole}</span>}
                  </div>
                  <button onClick={() => navigate('/session/'+id+'/candidate/'+app.applicant_id)} style={{padding:'6px 12px',borderRadius:10,fontSize:12,color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>Voir profil</button>
                </div>

                {(pj.age || snapshot?.age) && <p style={{fontSize:13,color:S.tx3,margin:'0 0 4px'}}>{(pj.age || snapshot.age)} ans{pj.location || snapshot?.location ? ' · ' + (pj.location || snapshot.location) : ''}</p>}
                {(pj.bio || snapshot?.bio) && <p style={{fontSize:13,color:S.tx2,margin:'0 0 8px',lineHeight:1.4}}>{pj.bio || snapshot.bio}</p>}

                {(pj.morphology || (isGhost && snapshot?.morphology)) && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {[pj.morphology || snapshot?.morphology, ...(pj.kinks||snapshot?.kinks||[]).slice(0,3)].filter(Boolean).map((t:string,i:number) => (
                      <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:S.bg2,color:S.tx3,border:'1px solid '+S.border}}>{t}</span>
                    ))}
                    {(pj.kinks||snapshot?.kinks||[]).length > 3 && <span style={{fontSize:11,color:S.tx4}}>+{(pj.kinks||snapshot?.kinks).length-3}</span>}
                  </div>
                )}

                {app.eps_json?.occasion_note && (
                  <div style={{padding:'10px 12px',background:S.bg2,borderRadius:10,border:'1px solid '+S.p300+'33',marginBottom:8}}>
                    <p style={{fontSize:11,color:S.p300,fontWeight:700,margin:'0 0 2px'}}>Note pour cette session</p>
                    <p style={{fontSize:13,color:S.tx2,margin:0}}>{app.eps_json.occasion_note}</p>
                  </div>
                )}

                {(pj.limits || (isGhost && snapshot?.limits)) && (
                  <div style={{padding:'8px 12px',background:S.red+'10',borderRadius:10,border:'1px solid '+S.red+'33',marginBottom:8}}>
                    <p style={{fontSize:11,color:S.red,fontWeight:700,margin:'0 0 2px'}}>Limites</p>
                    <p style={{fontSize:12,color:S.tx3,margin:0}}>{pj.limits || snapshot?.limits}</p>
                  </div>
                )}

                {app.status === 'pending' && (
                  <div style={{marginTop:10}}>
                    {(() => {
                      const appVotes = votes.filter(v => v.applicant_id === app.applicant_id)
                      const yes = appVotes.filter(v => v.vote === 'yes').length
                      const no = appVotes.filter(v => v.vote === 'no').length
                      if (yes + no === 0) return null
                      return (
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:S.bg2,borderRadius:10,border:'1px solid '+S.border}}>
                          <span style={{fontSize:12,color:S.tx3}}>Votes :</span>
                          <span style={{fontSize:13,fontWeight:700,color:S.green,display:'flex',alignItems:'center',gap:4}}><ThumbsUp size={14} /> {yes}</span>
                          <span style={{fontSize:13,fontWeight:700,color:S.red,display:'flex',alignItems:'center',gap:4}}><ThumbsDown size={14} /> {no}</span>
                        </div>
                      )
                    })()}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => decide(app.id, 'rejected')} disabled={actionLoading===app.id} style={{flex:1,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:S.red,border:'1px solid '+S.red+'44',background:S.red+'10',cursor:'pointer'}}>
                        ✕ Refuser
                      </button>
                      <button onClick={() => decide(app.id, 'accepted')} disabled={actionLoading===app.id} style={{flex:2,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',cursor:'pointer',boxShadow:'0 4px 16px '+S.p400+'44'}}>
                        {actionLoading===app.id ? '...' : '✓ Accepter'}
                      </button>
                    </div>
                  </div>
                )}

                {(app.status === 'accepted' || app.status === 'checked_in') && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10,alignItems:'center'}}>
                    {app.status === 'accepted' && app.checked_in === true && (
                      <>
                        <span style={{fontSize:12,color:S.orange,fontWeight:600,padding:'4px 10px',borderRadius:99,background:S.orange+'22',border:'1px solid '+S.orange+'44'}}>Arrivée à confirmer</span>
                        <button onClick={() => confirmCheckIn(app.id)} disabled={actionLoading===app.id} style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,color:S.green,border:'1px solid '+S.green,background:S.green+'22',cursor:'pointer'}}>
                          {actionLoading===app.id ? '...' : 'Confirmer ✓'}
                        </button>
                      </>
                    )}
                    {app.status === 'checked_in' && (
                      <span style={{fontSize:12,color:S.green,fontWeight:600}}>Arrivé ✓</span>
                    )}
                    {app.status === 'accepted' && !app.checked_in && (
                      <span style={{fontSize:12,color:S.green,fontWeight:600}}>Accepté — adresse débloquée</span>
                    )}
                    <button onClick={() => navigate('/session/' + id + '/dm/' + app.applicant_id)} style={{padding:'4px 10px',borderRadius:8,fontSize:11,color:S.p300,border:'1px solid '+S.p300+'55',background:'transparent',cursor:'pointer'}}>DM</button>
                    <button onClick={() => decide(app.id, 'rejected')} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:8,fontSize:11,color:S.tx3,border:'1px solid '+S.border,background:'transparent',cursor:'pointer'}}>Annuler</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}