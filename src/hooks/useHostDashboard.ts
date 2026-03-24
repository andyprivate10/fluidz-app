import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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

export type HostTab = 'activite' | 'recruit' | 'candidats' | 'membres'
export type CandidateSubTab = 'pending' | 'accepted' | 'rejected'

export type ActivityEvent = {
  id: string
  type: 'applied' | 'accepted' | 'rejected' | 'checked_in' | 'ejected'
  name: string
  time: string
}

export function useHostDashboard() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { confirm, dialogProps: confirmDialogProps } = useConfirmDialog()
  const [user, setUser] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string|null>(null)
  const { copied: linkCopied, copy: copyLink } = useCopyFeedback()
  const [elapsed, setElapsed] = useState('')
  const { copied: messageCopied, copy: copyMessageText } = useCopyFeedback()
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [hostDisplayName, setHostDisplayName] = useState<string>('')
  const [myGroups, setMyGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])
  const [myContacts, setMyContacts] = useState<{ user_id: string; contact_user_id: string; display_name: string }[]>([])
  const [votes, setVotes] = useState<{ applicant_id: string; vote: string }[]>([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [remaining, setRemaining] = useState('')

  // Tab state from URL
  const rawTab = searchParams.get('tab')
  const tab: HostTab = (['activite','recruit','candidats','membres'].includes(rawTab || '') ? rawTab as HostTab : 'activite')
  const setTab = (t: HostTab) => {
    setSearchParams({ tab: t }, { replace: true })
  }

  // Candidate sub-tab
  const [candidateSubTab, setCandidateSubTab] = useState<CandidateSubTab>('pending')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) load(u)
      else setLoading(false)
    })

    const channel = supabase
      .channel('host-dashboard-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `session_id=eq.${id}` }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `session_id=eq.${id}` }, () => { loadUnreadCount() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

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

  async function loadUnreadCount() {
    if (!id || !user) return
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id)
        .eq('room_type', 'group')
        .neq('sender_id', user.id)
      setUnreadChatCount(count || 0)
    } catch { /* ignore */ }
  }

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
      if (s && uid && s.host_id !== uid) { navigate('/session/' + id); return }
      setSess(s)
      setApps(a || [])
      setVotes((v as { applicant_id: string; vote: string }[]) || [])
      if (prof?.display_name) setHostDisplayName(prof.display_name)

      // Load groups
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

        // Load contacts for NaughtyBook section
        const { data: contacts } = await supabase
          .from('contacts')
          .select('user_id, contact_user_id, contact:user_profiles!contacts_contact_user_id_fkey(display_name)')
          .eq('user_id', uid)
        if (contacts) {
          setMyContacts(contacts.map((c: any) => ({
            user_id: c.user_id,
            contact_user_id: c.contact_user_id,
            display_name: c.contact?.display_name || 'Anonyme',
          })))
        }
      }

      // Load unread count
      if (uid) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', id)
          .eq('room_type', 'group')
          .neq('sender_id', uid)
        setUnreadChatCount(count || 0)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  // Activity feed derived from apps
  const activityFeed: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = []
    apps.forEach(a => {
      const name = a.user_profiles?.display_name || 'Anonyme'
      // Always show the application event
      events.push({
        id: a.id + '-applied',
        type: 'applied',
        name,
        time: a.created_at,
      })
      if (a.status === 'accepted' || a.status === 'checked_in') {
        events.push({ id: a.id + '-accepted', type: 'accepted', name, time: a.created_at })
      }
      if (a.status === 'rejected') {
        events.push({ id: a.id + '-rejected', type: 'rejected', name, time: a.created_at })
      }
      if (a.status === 'checked_in') {
        events.push({ id: a.id + '-checked_in', type: 'checked_in', name, time: a.checked_in_at || a.created_at })
      }
      if (a.status === 'ejected') {
        events.push({ id: a.id + '-ejected', type: 'ejected', name, time: a.created_at })
      }
    })
    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20)
  }, [apps])

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
      const title = status === 'accepted'
        ? t('host.accepted_for', { title: sess.title })
        : t('host.rejected_for', { title: sess.title })
      const body = status === 'accepted' ? t('host.accepted_body') : ''
      const href = status === 'accepted' ? `/session/${id}/dm/${app.applicant_id}` : `/session/${id}`
      await supabase.from('notifications').insert({
        user_id: app.applicant_id, session_id: id,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        message: title, title, body, href,
      })
      sendPushToUser(app.applicant_id, title, body, href)

      if (status === 'accepted' && user) {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', id)
          .eq('sender_name', SYSTEM_SENDER)
          .eq('dm_peer_id', app.applicant_id)
        if (!count || count === 0) {
          await supabase.from('messages').insert({
            session_id: id, sender_id: user.id,
            text: t('safety.tip'), sender_name: SYSTEM_SENDER,
            room_type: 'dm', dm_peer_id: app.applicant_id,
          })
        }
      }
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
      await supabase.from('notifications').insert({
        user_id: app.applicant_id, session_id: id, type: 'check_in_confirmed',
        message: `Check-in confirme pour "${sess.title}" `,
        title: `Check-in confirme pour "${sess.title}" `,
        body: sess.exact_address ? t('host.checkin_body_address', { address: sess.exact_address }) : t('host.checkin_body_no_address'),
        href: `/session/${id}`,
      })
      const otherCheckedIn = apps.filter(a => a.id !== appId && a.status === 'checked_in')
      const interactions = otherCheckedIn.map(other => ({
        user_id: app.applicant_id, target_user_id: other.applicant_id,
        type: 'co_event', meta: { session_id: id, session_title: sess.title },
      }))
      const reverseInteractions = otherCheckedIn.map(other => ({
        user_id: other.applicant_id, target_user_id: app.applicant_id,
        type: 'co_event', meta: { session_id: id, session_title: sess.title },
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

    if (destroyMedia) {
      try {
        await supabase.from('ephemeral_media')
          .update({ expires_at: new Date().toISOString() })
          .eq('context_id', id)
      } catch (_) {}
    }

    const participants = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    if (participants.length > 0 && sess) {
      const notifs = participants.map(p => ({
        user_id: p.applicant_id, session_id: id, type: 'review_request',
        title: '\u2B50 ' + t('notifications.review_title', { title: sess.title }),
        body: t('notifications.review_body'), href: `/session/${id}/review`,
      }))
      try { await supabase.from('notifications').insert(notifs) } catch (_) {}

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
    const acceptedApps = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    const senderName = hostDisplayName || (user as any).email || 'Host'
    const inserts = acceptedApps.map(a => ({
      session_id: id, sender_id: user!.id, text,
      sender_name: senderName, room_type: 'dm', dm_peer_id: a.applicant_id,
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

    const existingIds = new Set(apps.map(a => a.applicant_id))
    const newMembers = group.member_ids.filter(uid => !existingIds.has(uid) && uid !== user.id)
    if (newMembers.length === 0) {
      showToast(t('host.already_in_session'), 'info')
      return
    }
    const notifs = newMembers.map(uid => ({
      user_id: uid, session_id: id, type: 'group_invite',
      title: `Tu es invit\u00E9 \u00E0 "${sess.title}"`,
      body: t('notifications.group_invite_body', { host: hostDisplayName || t('common.a_host'), group: group.name }),
      href: `/session/${id}`,
    }))
    await supabase.from('notifications').insert(notifs)
    showToast(t('host.invites_sent', { count: newMembers.length }), 'success')
  }

  async function inviteContact(contactUserId: string) {
    if (!user || !id || !sess) return
    const existingIds = new Set(apps.map(a => a.applicant_id))
    if (existingIds.has(contactUserId)) {
      showToast(t('host.already_in_session'), 'info')
      return
    }
    await supabase.from('notifications').insert({
      user_id: contactUserId, session_id: id, type: 'group_invite',
      title: `Tu es invit\u00E9 \u00E0 "${sess.title}"`,
      body: t('notifications.group_invite_body', { host: hostDisplayName || t('common.a_host'), group: 'Contact' }),
      href: `/session/${id}`,
    })
    showToast(t('host.invites_sent', { count: 1 }), 'success')
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

  // Candidate sub-tab filters
  const filteredCandidates = candidateSubTab === 'accepted'
    ? apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')
    : apps.filter(a => a.status === candidateSubTab)

  // Members = accepted + checked_in
  const members = apps.filter(a => a.status === 'accepted' || a.status === 'checked_in')

  const counts = {
    pending: apps.filter(a=>a.status==='pending').length,
    accepted: apps.filter(a=>a.status==='accepted'||a.status==='checked_in').length,
    rejected: apps.filter(a=>a.status==='rejected').length,
  }
  const arrivedCount = apps.filter(a => a.status === 'checked_in').length
  const waitingCount = apps.filter(a => a.status === 'accepted' && a.checked_in).length
  const totalAccepted = counts.accepted

  // Prepared message for sharing
  const getPreparedMessage = () => {
    if (!sess) return ''
    const url = window.location.origin + '/join/' + sess.invite_code
    const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
    const rolesLine = rolesWanted && Object.keys(rolesWanted).length > 0
      ? t('session.searching_roles', { roles: Object.entries(rolesWanted).map(([r, c]) => `${c} ${r}`).join(', ') })
      : ''
    const lines = [
      sess.title,
      sess.description || '',
      rolesLine,
      sess.approx_area ? '\uD83D\uDCCD ' + sess.approx_area : '',
      counts.accepted > 0 ? `\uD83D\uDC65 ${counts.accepted} membres` : '',
      '',
      t('share.apply_here') + ' : ' + url,
    ].filter(Boolean)
    return lines.join('\n')
  }

  const getInviteUrl = () => {
    if (!sess?.invite_code) return ''
    return window.location.origin + '/join/' + sess.invite_code
  }

  const getDirectInviteUrl = () => {
    if (!sess?.invite_code) return ''
    return window.location.origin + '/join/' + sess.invite_code + '?direct=1'
  }

  const shareSession = async () => {
    if (!sess || !navigator.share) return
    const url = getInviteUrl()
    const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
    const rolesText = rolesWanted && Object.keys(rolesWanted).length > 0 ? '\n' + t('share.searching') + ' : ' + Object.entries(rolesWanted).map(([r, c]) => c + ' ' + r).join(', ') : ''
    const text = '\uD83D\uDD25 ' + (sess.title || '') + (sess.approx_area ? ' \u2013 ' + sess.approx_area : '') + rolesText + (counts.accepted > 0 ? '\n\uD83D\uDC65 ' + counts.accepted + ' ' + t('share.already_here') : '') + '\n' + t('share.apply_here') + ' !'
    navigator.share({ title: sess.title || t('share.session_fluidz'), text, url }).catch(() => {})
  }

  return {
    t,
    id,
    navigate,
    sess,
    apps,
    tab,
    setTab,
    candidateSubTab,
    setCandidateSubTab,
    loading,
    loadError,
    actionLoading,
    linkCopied,
    copyLink,
    elapsed,
    messageCopied,
    copyMessageText,
    broadcastText,
    setBroadcastText,
    broadcastSending,
    hostDisplayName,
    myGroups,
    myContacts,
    votes,
    remaining,
    filteredCandidates,
    members,
    counts,
    arrivedCount,
    waitingCount,
    totalAccepted,
    activityFeed,
    unreadChatCount,
    decide,
    confirmCheckIn,
    toggleStatus,
    closeSession,
    sendBroadcast,
    inviteGroup,
    inviteContact,
    ejectMember,
    pullHandlers,
    pullIndicator,
    getSessionCover,
    confirmDialogProps,
    getPreparedMessage,
    getInviteUrl,
    getDirectInviteUrl,
    shareSession,
  }
}
