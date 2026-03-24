import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { formatElapsed, formatRemaining } from '../lib/timing'
import { useCopyFeedback } from './useCopyFeedback'
import { useTranslation } from 'react-i18next'
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
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [voteLoadingId, setVoteLoadingId] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<{ avg: number; count: number; topVibes: string[] } | null>(null)
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

  const statusLabel = session ? (session.status === 'open' ? t('session.status_open') : session.status === 'ended' ? t('session.status_ended') : t('session.status_draft')) : ''

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)

      const { data: sess, error: sessErr } = await supabase.from('sessions').select('*').eq('id', id).single()
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
        if (hp) setHostProfile({ name: hp.display_name || 'Host', avatar: (hp.profile_json as any)?.avatar_url })
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

      const { data: voteRows } = await supabase
        .from('votes')
        .select('id, applicant_id, voter_id, vote, session_id')
        .eq('session_id', id)
      setVotes((voteRows as VoteRow[]) || [])

      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('status,checked_in')
          .eq('session_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle()
        setMyApp(app)
        if (app?.status === 'checked_in') setCheckInDone(true)
        // If checked_in flag is true but status still accepted → check-in request pending
        if (app?.checked_in && app?.status === 'accepted') setCheckInDone(true)
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
  }, [id])

  useEffect(() => {
    setLoadError(false)
    setLoading(true)
    loadData().finally(() => setLoading(false))

    // Realtime: auto-refresh when my application status changes
    const channel = supabase
      .channel('session-page-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { loadData() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications', filter: `session_id=eq.${id}` }, () => { loadData() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

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
      .update({ checked_in: true })
      .eq('session_id', id)
      .eq('applicant_id', currentUser.id)
    if (error) {
      showToast(t('errors.checkin_error') + ': ' + error.message, 'error')
      console.error('Check-in error:', error)
    } else {
      setCheckInDone(true)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
    }
    setCheckInLoading(false)
  }

  const cancelApplication = async () => {
    if (!await confirm({ title: t('session.cancel_confirm') })) return
    await supabase.from('applications').delete().eq('session_id', id).eq('applicant_id', currentUser!.id)
    showToast(t('session.cancelled'), 'info')
    setMyApp(null)
    loadData()
  }

  const leaveSession = async () => {
    if (!await confirm({ title: t('session.leave_confirm') })) return
    await supabase.from('applications').update({ status: 'left' }).eq('session_id', id).eq('applicant_id', currentUser!.id)
    showToast(t('session.left_session'), 'info')
    setMyApp(null)
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
    pendingApps, voteLoadingId, reviewSummary,
    elapsed, remaining,
    isHost, eventRole, statusLabel,
    handleTouchStart, handleTouchEnd,
    getVoteStats, handleVote, handleCheckIn,
    cancelApplication, leaveSession, loadData,
    confirmDialogProps,
  }
}
