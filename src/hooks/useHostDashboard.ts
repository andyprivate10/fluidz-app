import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useTranslation } from 'react-i18next'
import { usePullToRefresh } from './usePullToRefresh'
import { useCopyFeedback } from './useCopyFeedback'
import { formatElapsed, formatRemaining } from '../lib/timing'
import { getSessionCover } from '../lib/sessionCover'
import { sendPushToUser } from '../lib/pushSender'
import { SYSTEM_SENDER } from '../lib/constants'

export function useHostDashboard() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirm, dialogProps: confirmDialogProps } = useConfirmDialog()
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
      const name = app?.user_profiles?.display_name || t('host.candidate_fallback')
      if (!await confirm({ title: t('host.confirm_refuse', { name }), danger: true })) return
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
        ? t('host.accepted_body')
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
            text: t('safety.tip'),
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
    const name = app?.user_profiles?.display_name || t('host.candidate_fallback')
    showToast(status === 'accepted' ? t('host.accepted_toast', { name }) : t('host.rejected_toast', { name }), status === 'accepted' ? 'success' : 'info')
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
        message: `Check-in confirme pour "${sess.title}" `,
        title: `Check-in confirme pour "${sess.title}" `,
        body: sess.exact_address ? t('host.checkin_body_address', { address: sess.exact_address }) : t('host.checkin_body_no_address'),
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
      // Also log reverse (other -> new member)
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
    const destroyMedia = await confirm({ title: t('host.close_confirm'), danger: true })
    if (!destroyMedia && !await confirm({ title: t('host.close_without_delete') })) return

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
        title: '\u2B50 ' + t('notifications.review_title', { title: sess.title }),
        body: t('notifications.review_body'),
        href: `/session/${id}/review`,
      }))
      try { await supabase.from('notifications').insert(notifs) } catch (_) {}

      // Populate review queue
      const queueEntries = [...participants.map(p => p.applicant_id), user?.id].filter(Boolean).map(uid => ({
        user_id: uid!, session_id: id!, status: 'pending',
      }))
      try { await supabase.from('review_queue').upsert(queueEntries, { onConflict: 'user_id,session_id' }) } catch (_) {}
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
      showToast(t('host.already_in_session'), 'info')

      return
    }
    const notifs = newMembers.map(uid => ({
      user_id: uid,
      session_id: id,
      type: 'group_invite',
      title: `Tu es invit\u00E9 \u00E0 "${sess.title}"`,
      body: t('notifications.group_invite_body', { host: hostDisplayName || t('common.a_host'), group: group.name }),
      href: `/session/${id}`,
    }))
    await supabase.from('notifications').insert(notifs)
    showToast(t('host.invites_sent', { count: newMembers.length }), 'success')

  }

  async function ejectMember(appId: string) {
    const app = apps.find(a => a.id === appId)
    const name = app?.user_profiles?.display_name || t('host.candidate_fallback')
    if (!await confirm({ title: t('host.eject_confirm', { name }), danger: true })) return
    setActionLoading(appId)
    await supabase.from('applications').update({ status: 'ejected' }).eq('id', appId)
    if (app && sess) {
      await supabase.from('notifications').insert({
        user_id: app.applicant_id, session_id: id, type: 'ejected',
        title: t('host.ejected_from', { title: sess.title }),
        body: '', href: '/',
      })
    }
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'ejected' } : a))
    setActionLoading(null)
    showToast(t('host.ejected'), 'info')
  }

  const { pullHandlers, pullIndicator } = usePullToRefresh(() => load(user || undefined))

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

  return {
    t,
    id,
    navigate,
    sess,
    apps,
    tab,
    setTab,
    loading,
    loadError,
    actionLoading,
    linkCopied,
    copyLink,
    elapsed,
    messageCopied,
    copyMessageText,
    grinderCopied,
    copyGrindr,
    broadcastText,
    setBroadcastText,
    broadcastSending,
    hostDisplayName,
    myGroups,
    votes,
    remaining,
    filtered,
    counts,
    arrivedCount,
    waitingCount,
    totalAccepted,
    decide,
    confirmCheckIn,
    toggleStatus,
    closeSession,
    sendBroadcast,
    inviteGroup,
    ejectMember,
    pullHandlers,
    pullIndicator,
    getSessionCover,
    confirmDialogProps,
  }
}
