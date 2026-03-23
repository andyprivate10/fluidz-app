import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ThumbsUp, ThumbsDown, Clock, Check, Copy } from 'lucide-react'
import { showToast } from '../components/Toast'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { formatElapsed, formatRemaining } from '../lib/timing'
import { useCopyFeedback } from '../hooks/useCopyFeedback'
import { SYSTEM_SENDER } from '../lib/constants'
import { useTranslation } from 'react-i18next'
import { sendPushToUser } from '../lib/pushSender'

const S = colors

export default function HostDashboard() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [tab, setTab] = useState<'pending'|'accepted'|'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string|null>(null)
  const { copied: linkCopied, copy: copyLink } = useCopyFeedback()
  const [elapsed, setElapsed] = useState('')
  const { copied: messageCopied, copy: copyMessageText } = useCopyFeedback()
  const { copied: grinderCopied, copy: copyGrindr } = useCopyFeedback()
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [hostDisplayName, setHostDisplayName] = useState<string>('')
  const [myGroups, setMyGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])
  

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

  const [remaining, setRemaining] = useState('')

  // Session timer
  useEffect(() => {
    if (sess?.status === 'ended') return
    const startRef = sess?.starts_at || sess?.created_at
    if (!startRef) return
    const update = () => {
      setElapsed(formatElapsed(startRef))
      if (sess?.ends_at) setRemaining(formatRemaining(sess.ends_at))
    }
    update()
    const iv = setInterval(update, 60000)
    return () => clearInterval(iv)
  }, [sess?.starts_at, sess?.created_at, sess?.ends_at, sess?.status])

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
      // Security: verify current user is the host
      if (s && uid && s.host_id !== uid) { navigate('/session/' + id); return }
      setSess(s)
      setApps(a || [])
      setVotes((v as { applicant_id: string; vote: string }[]) || [])
      if (prof?.display_name) setHostDisplayName(prof.display_name)

      // Load my groups for invite
      if (uid) {
        const { data: grps } = await supabase.from('contact_groups').select('id, name, color').eq('owner_id', uid)
        if (grps && grps.length > 0) {
          const gIds = grps.map(g => g.id)
          const { data: members } = await supabase.from('contact_group_members').select('group_id, contact_user_id').in('group_id', gIds)
          const memberMap: Record<string, string[]> = {}
          ;(members || []).forEach((m: any) => {
            if (!memberMap[m.group_id]) memberMap[m.group_id] = []
            memberMap[m.group_id].push(m.contact_user_id)
          })
          setMyGroups(grps.map(g => ({ ...g, member_ids: memberMap[g.id] || [] })))
        }
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  async function decide(appId: string, status: 'accepted'|'rejected') {
    if (status === 'rejected') {
      const app = apps.find(a => a.id === appId)
      const name = app?.user_profiles?.display_name || 'ce candidat'
      if (!window.confirm('Refuser ' + name + ' ?')) return
    }
    setActionLoading(appId)
    await supabase.from('applications').update({ status }).eq('id', appId)
    const app = apps.find(a => a.id === appId)
    if (app && sess) {
      // Notification
      const title = status === 'accepted'
        ? t('host.accepted_for', { title: sess.title })
        : t('host.rejected_for', { title: sess.title })
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
      sendPushToUser(app.applicant_id, title, body, href)

      // Safety tip DM on acceptance (1 per candidate)
      if (status === 'accepted' && user) {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', id)
          .eq('sender_name', SYSTEM_SENDER)
          .eq('dm_peer_id', app.applicant_id)
        if (!count || count === 0) {
          await supabase.from('messages').insert({
            session_id: id,
            sender_id: user.id,
            text: 'Rappel sécurité : Partage ta localisation avec un ami de confiance. Tu peux quitter à tout moment, sans justification. En cas de problème, contacte le host via ce DM.',
            sender_name: SYSTEM_SENDER,
            room_type: 'dm',
            dm_peer_id: app.applicant_id,
          })
        }
      }
      // Auto-add to contacts (both directions, connaissance level)
      if (status === 'accepted' && user && app.applicant_id) {
        await supabase.from('contacts').upsert({ user_id: user.id, contact_user_id: app.applicant_id, relation_level: 'connaissance' }, { onConflict: 'user_id,contact_user_id' })
        await supabase.from('contacts').upsert({ user_id: app.applicant_id, contact_user_id: user.id, relation_level: 'connaissance' }, { onConflict: 'user_id,contact_user_id' })
      }
    }
    setApps(prev => prev.map(a => a.id === appId ? {...a, status} : a))
    setActionLoading(null)
    const name = app?.user_profiles?.display_name || 'Candidat'
    showToast(status === 'accepted' ? name + ' accepté' : name + ' refusé', status === 'accepted' ? 'success' : 'info')
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
        message: `Check-in confirmé pour "${sess.title}" `,
        title: `Check-in confirmé pour "${sess.title}" `,
        body: sess.exact_address ? '📍 ' + sess.exact_address + " — Tu peux maintenant partager le lien." : "Tu peux maintenant partager le lien d'invitation.",
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
    const destroyMedia = window.confirm('Fermer définitivement cette session ?\n\nLes photos/vidéos partagées en DM seront supprimées.')
    if (!destroyMedia && !window.confirm(t('host.close_without_delete'))) return
    
    await supabase.from('sessions').update({ status: 'ended' }).eq('id', id)
    setSess((s: any) => ({...s, status: 'ended'}))

    // Mark ephemeral media as expired
    if (destroyMedia) {
      try {
        await supabase.from('ephemeral_media')
          .update({ expires_at: new Date().toISOString() })
          .eq('context_id', id)
      } catch (_) {}
    }

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

  async function inviteGroup(groupId: string) {
    const group = myGroups.find(g => g.id === groupId)
    if (!group || !user || !id || !sess) return
    
    // Create notifications for each group member that isn't already in the session
    const existingIds = new Set(apps.map(a => a.applicant_id))
    const newMembers = group.member_ids.filter(uid => !existingIds.has(uid) && uid !== user.id)
    if (newMembers.length === 0) {
      showToast('Tous les membres de ce groupe sont déjà dans la session', 'info')
      
      return
    }
    const notifs = newMembers.map(uid => ({
      user_id: uid,
      session_id: id,
      type: 'group_invite',
      title: `Tu es invité à "${sess.title}"`,
      body: `${hostDisplayName || 'Un host'} t'invite via le groupe "${group.name}"`,
      href: `/session/${id}`,
    }))
    await supabase.from('notifications').insert(notifs)
    showToast(`${newMembers.length} invitation${newMembers.length > 1 ? 's' : ''} envoyée${newMembers.length > 1 ? 's' : ''}`, 'success')
    
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
    <div style={{minHeight:'100vh',background:S.bg,maxWidth:480,margin:'0 auto',padding:'80px 20px 40px'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      {[0,1,2].map(i => (
        <div key={i} style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:18,padding:16,marginBottom:12,animation:'pulse 1.5s ease-in-out infinite',animationDelay:i*0.15+'s'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:S.bg2}} />
            <div style={{flex:1}}>
              <div style={{width:'60%',height:14,borderRadius:6,background:S.bg2,marginBottom:6}} />
              <div style={{width:'35%',height:10,borderRadius:4,background:S.bg2}} />
            </div>
          </div>
          <div style={{width:'80%',height:10,borderRadius:4,background:S.bg2,marginBottom:8}} />
          <div style={{width:'50%',height:10,borderRadius:4,background:S.bg2}} />
        </div>
      ))}
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <p style={{color:S.red,textAlign:'center'}}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,position:'relative' as const,maxWidth:480,margin:'0 auto'}}>
      <OrbLayer />
      <EventContextNav role="host" sessionTitle={sess?.title} />
      <div style={{padding:'12px 20px 16px',borderBottom:'1px solid '+S.rule,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:8,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.06em',padding:'3px 8px',borderRadius:99,background:S.p2,color:S.p,border:'1px solid '+S.pbd}}>Host</span>
              {sess?.status === 'open' && <span style={{fontSize:10,fontWeight:600,color:S.sage,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:S.sage,animation:'blink 2s ease-in-out infinite'}} />Live</span>}
            </div>
            <h1 style={{fontSize:18,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 3px',lineHeight:1.2}}>{sess?.title}</h1>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>{sess?.approx_area}</p>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-end',gap:6}}>
            {elapsed && sess?.status === 'open' && <span style={{fontSize:11,fontWeight:600,color:S.tx2,background:S.bg3,padding:'3px 10px',borderRadius:50,whiteSpace:'nowrap'}}><Clock size={10} strokeWidth={1.5} style={{marginRight:2}} />{elapsed}</span>}
            {remaining && sess?.status === 'open' && <span style={{fontSize:11,fontWeight:600,color:remaining==='terminé'?S.red:S.p,background:remaining==='terminé'?S.redbg:S.p2,padding:'3px 10px',borderRadius:50,whiteSpace:'nowrap'}}>{remaining==='terminé'?t('host.time_ended'):t('host.time_remaining', { time: remaining })}</span>}
            {totalAccepted > 0 && <span style={{fontSize:11,fontWeight:700,color:S.sage,background:S.sagebg,padding:'3px 10px',borderRadius:50}}>{arrivedCount}/{totalAccepted}</span>}
            {sess?.max_capacity && (() => { const total = totalAccepted + 1; const full = total >= sess.max_capacity; return <span style={{fontSize:11,fontWeight:700,color:full?S.red:S.tx2,background:full?S.redbg:S.bg3,padding:'3px 10px',borderRadius:50,border:'1px solid '+(full?S.redbd:S.rule)}}>{total}/{sess.max_capacity}{full?' '+t('host.capacity_full'):''}</span> })()}
          </div>
        </div>
        {sess?.status !== 'ended' && (
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={toggleStatus} style={{
              padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',
              border:'1px solid '+(sess?.status==='open' ? S.sagebd : S.rule),
              background: sess?.status==='open' ? S.sagebg : S.bg2,
              color: sess?.status==='open' ? S.sage : S.tx3,
            }}>
              {sess?.status==='open' ? t('status.open') : t('status.closed')}
            </button>
            <button onClick={() => navigate('/session/' + id + '/edit')} style={{flex:1,padding:'8px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              {t('host.edit')}
            </button>
            <button onClick={closeSession} style={{flex:1,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.red,background:'transparent',color:S.red,cursor:'pointer'}}>
              {t('host.end_session')}
            </button>
          </div>
        )}

        <button onClick={() => navigate('/session/' + id + '/chat')} style={{marginTop:8,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:'transparent',color:S.p,cursor:'pointer',width:'100%'}}>
          {t('session.group_chat')}
        </button>

        {sess?.invite_code && (
          <>
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code
                copyLink(url)
              }}
              style={{marginTop:12,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:linkCopied ? S.sagebg : 'transparent',color:linkCopied ? S.sage : S.p,cursor:'pointer',width:'100%'}}
            >
              {linkCopied ? t('session.link_copied') : t('host.share_session')}
            </button>
            <div style={{marginTop:12,padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
              <div style={{fontSize:10,fontWeight:700,color:S.p,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:8}}>Partager sur Grindr / WhatsApp</div>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + sess.invite_code
                  const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                  const rolesText = rolesWanted && Object.keys(rolesWanted).length > 0
                    ? ' – Recherche : ' + Object.entries(rolesWanted).map(([r, c]) => `${c} ${r}`).join(', ')
                    : ''
                  const membersText = counts.accepted > 0 ? ` – ${counts.accepted} déjà là` : ''
                  const text = '🔥 ' + (sess.title || 'Plan ce soir') + ' – ' + (sess.approx_area || '') + rolesText + membersText + ' – Postule : ' + url
                  copyGrindr(text)
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:grinderCopied ? S.sagebg : 'transparent',color:grinderCopied ? S.sage : S.p,cursor:'pointer',marginBottom:8}}
              >
                {grinderCopied ? t('host.copied') : t('host.copy_grindr')}
              </button>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + sess.invite_code
                  const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                  const rolesLine = rolesWanted && Object.keys(rolesWanted).length > 0
                    ? t('session.searching_roles', { roles: Object.entries(rolesWanted).map(([r, c]) => `${c} ${r}`).join(', ') })
                    : ''
                  const lines = [sess.title, sess.description || '', rolesLine, sess.approx_area ? '📍 ' + sess.approx_area : '', counts.accepted > 0 ? `👥 ${counts.accepted} membres` : '', '', 'Postule ici : ' + url].filter(Boolean)
                  copyMessageText(lines.join('\n'))
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:messageCopied ? S.sagebg : 'transparent',color:messageCopied ? S.sage : S.p,cursor:'pointer'}}
              >
                {messageCopied ? <><Check size={13} strokeWidth={2} style={{display:'inline',marginRight:2}} />Copié</> : <><Copy size={13} strokeWidth={1.5} style={{display:'inline',marginRight:3}} />Copier le message</>}
              </button>
            </div>
            {/* Native share */}
            {typeof navigator !== 'undefined' && navigator.share && sess && (
              <button onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code
                const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                const rolesText = rolesWanted && Object.keys(rolesWanted).length > 0 ? '\nRecherche : ' + Object.entries(rolesWanted).map(([r, c]) => c + ' ' + r).join(', ') : ''
                const text = '🔥 ' + (sess.title || '') + (sess.approx_area ? ' – ' + sess.approx_area : '') + rolesText + (counts.accepted > 0 ? '\n👥 ' + counts.accepted + ' déjà là' : '') + '\nPostule ici !'
                navigator.share({ title: sess.title || 'Session Fluidz', text, url }).catch(() => {})
              }} style={{marginTop:4,width:'100%',padding:'10px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.sagebd,background:'transparent',color:S.sage,cursor:'pointer'}}>
                Partager via...
              </button>
            )}
            {/* Direct invite link */}
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code + '?direct=1'
                copyLink(url)
              }}
              style={{marginTop:8,width:'100%',padding:'10px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.sagebd,background:S.sagebg,color:S.sage,cursor:'pointer'}}
            >
              Copier lien invite directe
            </button>
          </>
        )}
        {/* Roles summary */}
        {sess?.lineup_json?.roles_wanted && Object.keys(sess.lineup_json.roles_wanted).length > 0 && (() => {
          const wanted = (sess.lineup_json as any).roles_wanted as Record<string, number>
          const currentRoles: Record<string, number> = {}
          apps.filter(a => a.status === 'accepted' || a.status === 'checked_in').forEach(a => {
            const r = a.eps_json?.role || a.user_profiles?.profile_json?.role
            if (r) currentRoles[r] = (currentRoles[r] || 0) + 1
          })
          return (
            <div style={{marginTop:12,padding:14,borderRadius:12,background:S.bg2,border:'1px solid '+S.rule}}>
              <div style={{fontSize:10,fontWeight:700,color:S.lav,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:8}}>RÔLES</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {Object.entries(wanted).map(([role, count]) => {
                  const have = currentRoles[role] || 0
                  const filled = have >= Number(count)
                  return (
                    <span key={role} style={{
                      fontSize:12,fontWeight:600,padding:'4px 10px',borderRadius:99,
                      color: filled ? S.sage : S.p,
                      background: filled ? S.sagebg : S.p2,
                      border: '1px solid '+(filled ? S.sagebd : S.pbd),
                    }}>
                      {have}/{count} {role}{filled ? <Check size={11} strokeWidth={2.5} style={{display:'inline',marginLeft:3}} /> : null}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Arrival stats */}
        {totalAccepted > 0 && (
          <div style={{marginTop:16,padding:14,borderRadius:12,background:S.bg2,border:'1px solid '+S.rule,display:'flex',justifyContent:'space-around',textAlign:'center'}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.sage}}>{arrivedCount}</div>
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
              <div style={{fontSize:20,fontWeight:800,color:S.p}}>{totalAccepted}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>Total</div>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,marginTop:16}}>
          {([['pending',t('host.pending'),S.orange],['accepted',t('host.accepted_tab'),S.sage],['rejected',t('host.rejected_tab'),S.red]] as const).map(([k,l,c]) => (
            <button key={k} onClick={() => setTab(k as any)} style={{
              flex:1,padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid '+(tab===k ? c+'55' : S.rule),
              background: tab===k ? c+'14' : S.bg2,
              color: tab===k ? c : S.tx3,
            }}>
              {l} {counts[k as keyof typeof counts] > 0 && <span style={{fontWeight:800}}>({counts[k as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>{t('host.broadcast')}</div>
          <textarea value={broadcastText} onChange={e=>setBroadcastText(e.target.value)} placeholder={t('host.broadcast_placeholder')} rows={2} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid '+S.rule,background:S.bg1,color:S.tx,fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:8}} />
          <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastText.trim()} style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:S.grad,color:'#fff',cursor: broadcastSending || !broadcastText.trim() ? 'not-allowed' : 'pointer',opacity: broadcastSending || !broadcastText.trim() ? 0.7 : 1}}>
            {broadcastSending ? t('host_actions.sending') : t('host_actions.send_to_all')}
          </button>
        </div>
        {/* Group invite */}
        {myGroups.length > 0 && (
          <div style={{padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
            <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>{t('host.invite_group')}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {myGroups.map(g => (
                <button key={g.id} onClick={() => inviteGroup(g.id)} style={{
                  padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                  border:'1px solid '+g.color+'44',background:g.color+'14',color:g.color,
                  display:'flex',alignItems:'center',gap:4,
                }}>
                  <div style={{width:8,height:8,borderRadius:3,background:g.color}} />
                  {g.name} ({g.member_ids.length})
                </button>
              ))}
            </div>
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 20px',color:S.tx3,fontSize:14}}>
            {tab==='pending' ? t('host.no_pending') : tab==='accepted' ? t('host.no_accepted') : t('host.no_rejected')}
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
            <div key={app.id} style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:18,border:'1px solid '+S.rule2,overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)'}}>
              <div style={{padding:'16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <p style={{margin:'0 0 2px',fontSize:16,fontWeight:800,color:S.tx}}>
                      <Link to={'/profile/' + app.applicant_id} style={{color:S.tx,textDecoration:'none'}}>{displayName}</Link>
                    </p>
                    {isGhost && <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.tx4,color:S.tx2,border:'1px solid '+S.rule}}>Ghost</span>}
                    {displayRole && <span style={{fontSize:12,fontWeight:600,padding:'2px 10px',borderRadius:99,background:S.p2,color:S.p,border:'1px solid '+S.pbd}}>{displayRole}</span>}
                    {!isGhost && <VibeScoreBadge userId={app.applicant_id} />}
                  </div>
                  <button onClick={() => navigate('/session/'+id+'/candidate/'+app.applicant_id)} style={{padding:'6px 12px',borderRadius:10,fontSize:12,color:S.tx3,border:'1px solid '+S.rule,background:'transparent',cursor:'pointer'}}>Voir profil</button>
                </div>

                {(pj.age || snapshot?.age) && <p style={{fontSize:13,color:S.tx3,margin:'0 0 4px'}}>{(pj.age || snapshot.age)} ans{pj.location || snapshot?.location ? ' · ' + (pj.location || snapshot.location) : ''}</p>}
                {(pj.bio || snapshot?.bio) && <p style={{fontSize:13,color:S.tx2,margin:'0 0 8px',lineHeight:1.4}}>{pj.bio || snapshot.bio}</p>}

                {(pj.morphology || (isGhost && snapshot?.morphology)) && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {[pj.morphology || snapshot?.morphology, ...(pj.kinks||snapshot?.kinks||[]).slice(0,3)].filter(Boolean).map((t:string,i:number) => (
                      <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:S.bg2,color:S.tx3,border:'1px solid '+S.rule}}>{t}</span>
                    ))}
                    {(pj.kinks||snapshot?.kinks||[]).length > 3 && <span style={{fontSize:11,color:S.tx4}}>+{(pj.kinks||snapshot?.kinks).length-3}</span>}
                  </div>
                )}

                {app.eps_json?.message && (
                  <div style={{padding:'10px 12px',background:S.bg2,borderRadius:10,border:'1px solid '+S.bluebd,marginBottom:8}}>
                    <p style={{fontSize:11,color:S.blue,fontWeight:700,margin:'0 0 2px'}}>Message au host</p>
                    <p style={{fontSize:13,color:S.tx2,margin:0,lineHeight:1.4}}>{app.eps_json.message}</p>
                  </div>
                )}

                {app.eps_json?.occasion_note && (
                  <div style={{padding:'10px 12px',background:S.bg2,borderRadius:10,border:'1px solid '+S.pbd,marginBottom:8}}>
                    <p style={{fontSize:11,color:S.p,fontWeight:700,margin:'0 0 2px'}}>Note pour cette session</p>
                    <p style={{fontSize:13,color:S.tx2,margin:0}}>{app.eps_json.occasion_note}</p>
                  </div>
                )}

                {(pj.limits || (isGhost && snapshot?.limits)) && (
                  <div style={{padding:'8px 12px',background:S.redbg,borderRadius:10,border:'1px solid '+S.redbd,marginBottom:8}}>
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
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:S.bg2,borderRadius:10,border:'1px solid '+S.rule}}>
                          <span style={{fontSize:12,color:S.tx3}}>Votes :</span>
                          <span style={{fontSize:13,fontWeight:700,color:S.sage,display:'flex',alignItems:'center',gap:4}}><ThumbsUp size={14} /> {yes}</span>
                          <span style={{fontSize:13,fontWeight:700,color:S.red,display:'flex',alignItems:'center',gap:4}}><ThumbsDown size={14} /> {no}</span>
                        </div>
                      )
                    })()}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => decide(app.id, 'rejected')} disabled={actionLoading===app.id} style={{flex:1,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:S.red,border:'1px solid '+S.redbd,background:S.redbg,cursor:'pointer'}}>
                        Refuser
                      </button>
                      <button onClick={() => decide(app.id, 'accepted')} disabled={actionLoading===app.id} className="btn-shimmer" style={{flex:2,padding:'11px',borderRadius:12,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:'pointer',boxShadow:'0 4px 16px '+S.pbd}}>
                        {actionLoading===app.id ? '...' : t('host_actions.accept')}
                      </button>
                    </div>
                  </div>
                )}

                {(app.status === 'accepted' || app.status === 'checked_in') && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10,alignItems:'center'}}>
                    {app.status === 'accepted' && app.checked_in === true && (
                      <>
                        <span style={{fontSize:12,color:S.orange,fontWeight:600,padding:'4px 10px',borderRadius:99,background:S.orangebg,border:'1px solid '+S.orangebd}}>Arrivée à confirmer</span>
                        <button onClick={() => confirmCheckIn(app.id)} disabled={actionLoading===app.id} style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,color:S.sage,border:'1px solid '+S.sage,background:S.sagebg,cursor:'pointer'}}>
                          {actionLoading===app.id ? '...' : <><Check size={13} strokeWidth={2} style={{display:'inline',marginRight:2}} />Confirmer</>}
                        </button>
                      </>
                    )}
                    {app.status === 'checked_in' && (
                      <span style={{fontSize:12,color:S.sage,fontWeight:600,display:'inline-flex',alignItems:'center',gap:3}}><Check size={12} strokeWidth={2.5} />Arrivé</span>
                    )}
                    {app.status === 'accepted' && !app.checked_in && (
                      <span style={{fontSize:12,color:S.sage,fontWeight:600}}>{t('host.accepted_route')}</span>
                    )}
                    <button onClick={() => navigate('/session/' + id + '/dm/' + app.applicant_id)} style={{padding:'4px 10px',borderRadius:8,fontSize:11,color:S.p,border:'1px solid '+S.pbd,background:'transparent',cursor:'pointer'}}>DM</button>
                    {app.status === 'accepted' && !app.checked_in && (
                      <button onClick={async () => {
                        await supabase.from('notifications').insert({
                          user_id: app.applicant_id, session_id: id, type: 'nudge',
                          title: '⏰ On t\'attend !',
                          body: (sess?.title || 'La session') + ' — tu arrives bientôt ?',
                          href: '/session/' + id,
                        })
                        showToast('Relance envoyée', 'success')
                      }} style={{padding:'4px 10px',borderRadius:8,fontSize:11,color:S.p,border:'1px solid '+S.amberbd,background:'transparent',cursor:'pointer'}}>Relancer</button>
                    )}
                    <button onClick={() => decide(app.id, 'rejected')} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:8,fontSize:11,color:S.tx3,border:'1px solid '+S.rule,background:'transparent',cursor:'pointer'}}>Annuler</button>
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