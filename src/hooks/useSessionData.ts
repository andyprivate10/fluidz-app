import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { formatElapsed, formatRemaining } from '../lib/timing'
import { useCopyFeedback } from './useCopyFeedback'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '@supabase/supabase-js'

export type Session = { id: string; title: string; description: string; approx_area: string; exact_address: string | null; status: string; host_id: string; invite_code: string | null; created_at?: string; starts_at?: string; ends_at?: string; max_capacity?: number; tags?: string[]; cover_url?: string; template_slug?: string; lineup_json?: { directions?: (string | { text: string; photo_url?: string })[]; roles_wanted?: Record<string, number>; host_rules?: string } }
export type Member = { applicant_id: string; eps_json: Record<string, string>; status: string }
export type PendingApplication = { id: string; applicant_id: string; display_name?: string | null; avatar_url?: string | null }
export type VoteRow = { id: string; applicant_id: string; voter_id: string; vote: 'yes' | 'no'; session_id: string }

export function useSessionData() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm, dialogProps: confirmDialogProps } = useConfirmDialog()
  const { user: authUser } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [myApp, setMyApp] = useState<{ status: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({})
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({})
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [hostProfile, setHostProfile] = useState<{ name: string; avatar?: string } | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInDone, setCheckInDone] = useState(false)
  const { copied, copy: copyMessage } = useCopyFeedback()
  const { copied: inviteLinkCopied, copy: copyInviteLink } = useCopyFeedback()
  const { copied: addressCopied, copy: copyAddress } = useCopyFeedback()
  const [pendingCount, setPendingCount] = useState(0)
  const [showPostulerSuccess, setShowPostulerSuccess] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pendingApps, setPendingApps] = useState<PendingApplication[]>([])
  const [rejectedApps, setRejectedApps] = useState<PendingApplication[]>([])
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [voteLoadingId, setVoteLoadingId] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<{ avg: number; count: number; topVibes: string[] } | null>(null)
  const [checkInRequests, setCheckInRequests] = useState<PendingApplication[]>([])
  const touchStartY = useRef(0)
  const [elapsed, setElapsed] = useState('')
  const [remaining, setRemaining] = useState('')

  // Session timer
  useEffect(() => {
    if (session?.status === 'ended') return
    const startRef = session?.starts_at || session?.created_at
    if (!startRef) return
    const update = () => {
      setElapsed(formatElapsed(startRef))
      if (session?.ends_at) setRemaining(formatRemaining(session.ends_at))
    }
    update()
    const iv = setInterval(update, 60000)
    return () => clearInterval(iv)
  }, [session?.starts_at, session?.created_at, session?.ends_at, session?.status])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const on = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const isHost = currentUser?.id === session?.host_id
  const eventRole: 'host' | 'member' | 'candidate' = isHost ? 'host'
    : (myApp?.status === 'accepted' || myApp?.status === 'checked_in') ? 'member'
    : 'candidate'

  const statusLabel = session ? (session.status === 'open' ? t('session.status_open') : session.status === 'ending_soon' ? t('session.ending_soon_title') : session.status === 'ended' ? t('session.status_ended') : t('session.status_draft')) : ''

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)

      const { data: sess, error: sessErr } = await supabase.from('sessions').select('id, title, description, approx_area, exact_address, status, host_id, invite_code, created_at, starts_at, ends_at, max_capacity, tags, cover_url, template_slug, lineup_json, is_public').eq('id', id).single()
      if (sessErr) throw sessErr
      // Auto-end if ends_at has passed
      if (sess.status === 'open' && sess.ends_at && new Date(sess.ends_at) < new Date()) {
        await supabase.from('sessions').update({ status: 'ended' }).eq('id', id)
        sess.status = 'ended'
        // Create review queue for all participants
        const { data: endedApps } = await supabase.from('applications').select('applicant_id').eq('session_id', id).in('status', ['accepted', 'checked_in'])
        if (endedApps && endedApps.length > 0) {
          const queueEntries = [...endedApps.map(a => a.applicant_id), sess.host_id].filter(Boolean).map(uid => ({
            user_id: uid, session_id: id, status: 'pending',
          }))
          await supabase.from('review_queue').upsert(queueEntries, { onConflict: 'user_id,session_id' })
        }
      }
      setSession(sess)

      // Fetch host profile
      if (sess?.host_id) {
        const { data: hp } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', sess.host_id).maybeSingle()
        if (hp) setHostProfile({ name: hp.display_name || 'Host', avatar: (hp.profile_json as Record<string, unknown>)?.avatar_url as string | undefined })
      }

      const { data: accepted } = await supabase
        .from('applications')
        .select('applicant_id, eps_json, status')
        .eq('session_id', id)
        .in('status', ['accepted', 'checked_in'])
      setMembers(accepted ?? [])

      const ids = (accepted ?? []).map((a: { applicant_id: string }) => a.applicant_id)
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
        const avatarMap: Record<string, string> = {}
        const roleMap: Record<string, string> = {}
        const nameMap: Record<string, string> = {}
        ;(profiles ?? []).forEach((r: { id: string; display_name?: string; profile_json?: { avatar_url?: string; role?: string } }) => {
          if (r.profile_json?.avatar_url) avatarMap[r.id] = r.profile_json.avatar_url
          if (r.profile_json?.role) roleMap[r.id] = r.profile_json.role
          if (r.display_name) nameMap[r.id] = r.display_name
        })
        setMemberAvatars(avatarMap)
        setMemberRoles(roleMap)
        setMemberNames(nameMap)
      } else { setMemberAvatars({}); setMemberRoles({}); setMemberNames({}) }

      let pendingEnriched: PendingApplication[] = []
      const { data: pending } = await supabase
        .from('applications')
        .select('id, applicant_id, status')
        .eq('session_id', id)
        .eq('status', 'pending')
      if (pending && pending.length > 0) {
        const pendingIds = pending.map((p: { applicant_id: string }) => p.applicant_id)
        const { data: pendingProfiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, profile_json')
          .in('id', pendingIds)

        const profileMap: Record<string, { display_name?: string | null; avatar_url?: string | null }> = {}
        ;(pendingProfiles ?? []).forEach((r: { id: string; display_name?: string | null; profile_json?: { avatar_url?: string | null } }) => {
          profileMap[r.id] = {
            display_name: r.display_name ?? profileMap[r.id]?.display_name ?? null,
            avatar_url: r.profile_json?.avatar_url ?? profileMap[r.id]?.avatar_url ?? null,
          }
        })

        pendingEnriched = pending.map((p: { id: string; applicant_id: string }) => ({
          id: p.id,
          applicant_id: p.applicant_id,
          display_name: profileMap[p.applicant_id]?.display_name ?? null,
          avatar_url: profileMap[p.applicant_id]?.avatar_url ?? null,
        }))
      }
      setPendingApps(pendingEnriched)

      // Fetch rejected apps (for host)
      if (user && sess?.host_id === user.id) {
        const { data: rejected } = await supabase
          .from('applications')
          .select('id, applicant_id')
          .eq('session_id', id)
          .eq('status', 'rejected')
        if (rejected && rejected.length > 0) {
          const rejIds = rejected.map(r => r.applicant_id)
          const { data: rejProfiles } = await supabase.from('user_profiles').select('id, display_name').in('id', rejIds)
          const rejMap: Record<string, string> = {}
          ;(rejProfiles ?? []).forEach((r: { id: string; display_name?: string | null }) => { if (r.display_name) rejMap[r.id] = r.display_name })
          setRejectedApps(rejected.map(r => ({ id: r.id, applicant_id: r.applicant_id, display_name: rejMap[r.applicant_id] ?? null, avatar_url: null })))
        } else { setRejectedApps([]) }
      }

      // Fetch check-in requests (for host)
      if (user && sess?.host_id === user.id) {
        const { data: ciReqs } = await supabase
          .from('applications')
          .select('id, applicant_id, status')
          .eq('session_id', id)
          .eq('check_in_requested', true)
          .eq('status', 'accepted')
        if (ciReqs && ciReqs.length > 0) {
          const ciIds = ciReqs.map(r => r.applicant_id)
          const { data: ciProfiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ciIds)
          const ciMap: Record<string, { display_name?: string | null; avatar_url?: string | null }> = {}
          ;(ciProfiles ?? []).forEach((r: { id: string; display_name?: string | null; profile_json?: Record<string, unknown> }) => {
            ciMap[r.id] = { display_name: r.display_name, avatar_url: (r.profile_json?.avatar_url as string | null) ?? null }
          })
          setCheckInRequests(ciReqs.map(r => ({
            id: r.id, applicant_id: r.applicant_id,
            display_name: ciMap[r.applicant_id]?.display_name ?? null,
            avatar_url: ciMap[r.applicant_id]?.avatar_url ?? null,
          })))
        } else { setCheckInRequests([]) }
      } else { setCheckInRequests([]) }

      const { data: voteRows } = await supabase
        .from('votes')
        .select('id, applicant_id, voter_id, vote, session_id')
        .eq('session_id', id)
      setVotes((voteRows as VoteRow[]) || [])

      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('status,checked_in,check_in_requested')
          .eq('session_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle()
        setMyApp(app)
        if (app?.status === 'checked_in') setCheckInDone(true)
        // If check_in_requested or checked_in flag is true but status still accepted → pending confirmation
        if ((app?.check_in_requested || app?.checked_in) && app?.status === 'accepted') setCheckInDone(true)
        if (app?.status === 'pending') {
          setShowPostulerSuccess(true)
          setTimeout(() => setShowPostulerSuccess(false), 2000)
        }
      }

      if (user && sess?.host_id === user.id) {
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', id).eq('status', 'pending')
        setPendingCount(count ?? 0)
      } else setPendingCount(0)

      // Load review summary for ended sessions
      if (sess?.status === 'ended') {
        const { data: reviews } = await supabase.from('reviews')
          .select('rating, vibe_tags')
          .eq('session_id', id)
          .is('target_id', null)
        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
          const tagCounts: Record<string, number> = {}
          reviews.forEach((r: { vibe_tags?: string[] }) => (r.vibe_tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
          const topVibes = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t)
          setReviewSummary({ avg: Math.round(avg * 10) / 10, count: reviews.length, topVibes })
        }
      }
    } catch {
      setLoadError(true)
    }
  }, [id, authUser?.id])

  useEffect(() => {
    setLoadError(false)
    setLoading(true)
    loadData().finally(() => setLoading(false))

    // Realtime: auto-refresh when my application status changes
    const channel = supabase
      .channel('session-page-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { loadData() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { loadData() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `session_id=eq.${id}` }, (payload: any) => {
        const newVote = payload.new as VoteRow
        if (newVote && newVote.voter_id !== currentUser?.id) {
          setVotes(prev => [...prev.filter(v => !(v.applicant_id === newVote.applicant_id && v.voter_id === newVote.voter_id)), newVote])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  // Re-fetch when auth state changes (e.g., visitor logs in and returns)
  const prevAuthId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (prevAuthId.current !== authUser?.id && prevAuthId.current !== undefined) {
      loadData()
    }
    prevAuthId.current = authUser?.id
  }, [authUser?.id, loadData])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY
    const pullDistance = touchStartY.current - endY
    const atTop = typeof window !== 'undefined' && (window.scrollY ?? document.documentElement.scrollTop) <= 5
    if (atTop && pullDistance > 60 && !isRefreshing && !loading) {
      setIsRefreshing(true)
      loadData().finally(() => setIsRefreshing(false))
    }
  }

  const getVoteStats = (applicantId: string) => {
    const appVotes = votes.filter(v => v.applicant_id === applicantId)
    const yesCount = appVotes.filter(v => v.vote === 'yes').length
    const noCount = appVotes.filter(v => v.vote === 'no').length
    const myId = currentUser?.id
    const myVote = myId ? appVotes.find(v => v.voter_id === myId)?.vote : undefined
    return { yesCount, noCount, myVote }
  }

  const handleVote = async (applicantId: string, choice: 'yes' | 'no') => {
    if (!currentUser || !id) return
    const { myVote } = getVoteStats(applicantId)
    if (myVote) return
    setVoteLoadingId(applicantId)
    try {
      const { data, error } = await supabase
        .from('votes')
        .insert({ session_id: id, applicant_id: applicantId, voter_id: currentUser.id, vote: choice })
        .select('id, applicant_id, voter_id, vote, session_id')
        .single()
      if (error) {
        console.error('Vote error:', error)
        showToast(t('errors.vote_error') + ': ' + error.message, 'error')
      } else if (data) {
        if (navigator.vibrate) navigator.vibrate(30)
        setVotes(prev => {
          const others = prev.filter(v => !(v.applicant_id === applicantId && v.voter_id === currentUser.id))
          return [...others, data as VoteRow]
        })
      }
    } finally {
      setVoteLoadingId(null)
    }
  }

  const handleCheckIn = async () => {
    if (!currentUser) return
    setCheckInLoading(true)
    const { error } = await supabase
      .from('applications')
      .update({ check_in_requested: true })
      .eq('session_id', id)
      .eq('applicant_id', currentUser.id)
    if (error) {
      showToast(t('errors.checkin_error') + ': ' + error.message, 'error')
      console.error('Check-in error:', error)
    } else {
      setCheckInDone(true)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
      // Notify host
      if (session?.host_id) {
        const name = memberNames[currentUser.id] || t('common.someone')
        await supabase.from('notifications').insert({
          user_id: session.host_id,
          session_id: id,
          type: 'check_in_request',
          title: t('session.check_in_requests'),
          body: name,
          href: `/session/${id}?tab=candidates`,
        })
      }
    }
    setCheckInLoading(false)
  }

  const confirmCheckIn = async (memberId: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ checked_in: true, status: 'checked_in', check_in_requested: false })
      .eq('session_id', id)
      .eq('applicant_id', memberId)
    if (error) {
      showToast(t('errors.error_prefix') + ': ' + error.message, 'error')
    } else {
      showToast(t('session.confirm_check_in') + ' ✓', 'success')
      // Notify member
      await supabase.from('notifications').insert({
        user_id: memberId,
        session_id: id,
        type: 'check_in_confirmed',
        title: t('session.checkin_confirmed'),
        body: session?.title || '',
        href: `/session/${id}`,
      })
      loadData()
    }
  }

  const cancelApplication = async () => {
    if (!await confirm({ title: t('session.withdraw_confirm') })) return
    await supabase.from('applications').update({ status: 'withdrawn' }).eq('session_id', id).eq('applicant_id', currentUser!.id)
    showToast(t('session.withdrawn'), 'info')
    setMyApp({ status: 'withdrawn' })
    loadData()
  }

  const leaveSession = async () => {
    if (!await confirm({ title: t('session.leave_confirm') })) return
    await supabase.from('applications').update({ status: 'left' }).eq('session_id', id).eq('applicant_id', currentUser!.id)
    showToast(t('session.left_session'), 'info')
    setMyApp(null)
    loadData()
  }

  const endSession = async () => {
    if (!await confirm({ title: t('options.end_session'), description: t('options.end_confirm'), danger: true, confirmLabel: t('options.end_session') })) return
    const { error } = await supabase.rpc('rpc_end_session', { p_session_id: id })
    if (error) { showToast(t('errors.error_prefix') + ': ' + error.message, 'error'); return }
    showToast(t('options.session_ended'), 'success')
    loadData()
  }

  return {
    t, id, navigate,
    session, currentUser, myApp, members, memberAvatars, memberRoles, memberNames,
    loading, loadError, hostProfile,
    checkInLoading, checkInDone,
    copied, copyMessage, inviteLinkCopied, copyInviteLink, addressCopied, copyAddress,
    pendingCount, showPostulerSuccess, showShareSheet, setShowShareSheet,
    isRefreshing, isMobile,
    pendingApps, rejectedApps, voteLoadingId, reviewSummary,
    elapsed, remaining,
    isHost, eventRole, statusLabel,
    handleTouchStart, handleTouchEnd,
    getVoteStats, handleVote, handleCheckIn,
    cancelApplication, withdrawApplication: cancelApplication, leaveSession, endSession, confirmCheckIn, loadData, refresh: loadData,
    checkInRequests,
    confirmDialogProps,
  }
}
