import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from './usePullToRefresh'
import { showToast } from '../components/Toast'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { getSessionCover } from '../lib/sessionCover'
import { useTranslation } from 'react-i18next'
import { useAdminConfig } from './useAdminConfig'
import { timeAgo } from '../lib/timing'

type QuickSession = { id: string; title: string; approx_area: string; status: string; tags?: string[]; member_count?: number; cover_url?: string; template_slug?: string; starts_at?: string; ends_at?: string; created_at: string }

export function useHomeData() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { sessionTemplates } = useAdminConfig()
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [latestHost, setLatestHost] = useState<QuickSession | null>(null)
  const [pendingApps, setPendingApps] = useState<{ session_id: string; title: string; tags?: string[]; cover_url?: string; template_slug?: string }[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [activeApps, setActiveApps] = useState<{ session_id: string; title: string; status: string; tags?: string[]; cover_url?: string; template_slug?: string; member_count?: number }[]>([])
  const [hostPendingCount, setHostPendingCount] = useState(0)
  const [profilePct, setProfilePct] = useState(100)
  const [recentContacts, setRecentContacts] = useState<{ id: string; name: string; avatar?: string }[]>([])
  const [recentNotifs, setRecentNotifs] = useState<{ id: string; type: string; title?: string; body?: string; href?: string; created_at: string }[]>([])
  const [dismissedTips, setDismissedTips] = useState<string[]>([])
  const [showTips, setShowTips] = useState(false)
  const [sessionSuggestions, setSessionSuggestions] = useState<{ id: string; name: string; avatar?: string }[]>([])
  const [pendingReviews, setPendingReviews] = useState<{ session_id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      try {
        const redirect = localStorage.getItem('auth_redirect')
        if (redirect) { localStorage.removeItem('auth_redirect'); navigate(redirect); return }
      } catch (_) {}

      // ── PHASE 1: Requêtes critiques en parallèle ──────────────────────
      const [
        profResult,
        hostedResult,
        pendingResult,
        activeResult,
      ] = await Promise.all([
        supabase.from('user_profiles').select('display_name,profile_json').eq('id', user.id).maybeSingle(),
        supabase.from('sessions').select('id, title, approx_area, status, tags, cover_url, template_slug, starts_at, ends_at, created_at')
          .eq('host_id', user.id).eq('status', 'open').neq('title', DM_DIRECT_TITLE)
          .order('created_at', { ascending: false }).limit(1),
        supabase.from('applications').select('session_id, status, sessions(title, template_slug, cover_url, tags)')
          .eq('applicant_id', user.id).eq('status', 'pending'),
        supabase.from('applications').select('session_id, status, sessions(title, template_slug, cover_url)')
          .eq('applicant_id', user.id).in('status', ['accepted', 'checked_in']),
      ])

      // Profil + onboarding check
      const profData = profResult.data
      if (profData?.display_name) {
        setDisplayName(profData.display_name)
        const pj = (profData.profile_json || {}) as Record<string, unknown>
        const checks = [!!pj.avatar_url, !!pj.role, !!pj.age, !!pj.bio, !!(pj.height || pj.weight || pj.morphology), !!(pj.kinks && (pj.kinks as string[]).length > 0), !!profData.display_name && profData.display_name !== 'Anonymous']
        const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100)
        setProfilePct(pct)
        const hasProfile = pj.role || pj.avatar_url || pj.bio || pj.onboarding_done || pj.onboarding_complete
        const hasName = profData.display_name && profData.display_name !== 'Anonymous'
        if (!hasProfile && !hasName) { navigate('/onboarding'); return }
        // Tips: show si profil incomplet ou aucune app (calculé sur données déjà chargées)
        const pj2 = profData.profile_json as Record<string, unknown> || {}
        setDismissedTips(Array.isArray(pj2.dismissed_tips) ? pj2.dismissed_tips as string[] : [])
        setShowTips(pct < 50)
      }

      // Session hébergée
      const hosted = hostedResult.data
      const hostSession = Array.isArray(hosted) ? hosted[0] ?? null : null
      setLatestHost(hostSession)

      // Apps pending
      const pending = pendingResult.data || []
      setPendingApps(pending.map(a => ({ session_id: a.session_id, title: (a.sessions as any)?.title || 'Session', tags: (a.sessions as any)?.tags, cover_url: (a.sessions as any)?.cover_url, template_slug: (a.sessions as any)?.template_slug })))

      // Apps actives
      const active = activeResult.data || []
      setActiveApps(active.map(a => ({ session_id: a.session_id, status: a.status || '', title: (a.sessions as any)?.title || 'Session', tags: (a.sessions as any)?.tags, cover_url: (a.sessions as any)?.cover_url, template_slug: (a.sessions as any)?.template_slug })))

      // ── RENDER IMMÉDIAT ───────────────────────────────────────────────
      setLoading(false)

      // ── PHASE 2: Données secondaires en parallèle (non-bloquantes) ────
      const sessionIds = active.map(a => a.session_id)
      const [
        contactsResult,
        reviewResult,
        notifsResult,
        endedAppsResult,
        hostCountsResult,
      ] = await Promise.all([
        supabase.from('contacts').select('contact_user_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('review_queue').select('session_id, sessions!inner(title)').eq('user_id', user.id).eq('status', 'pending').gte('expires_at', new Date().toISOString()),
        supabase.from('notifications').select('id, type, title, body, href, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('session_id, sessions!inner(status, ends_at)').eq('applicant_id', user.id).in('status', ['accepted', 'checked_in']),
        hostSession ? Promise.all([
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('session_id', hostSession.id).eq('status', 'pending'),
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('session_id', hostSession.id).in('status', ['accepted', 'checked_in']),
          ...(sessionIds.length > 0 ? [Promise.all(sessionIds.map(sid =>
            supabase.from('applications').select('id', { count: 'exact', head: true }).eq('session_id', sid).in('status', ['accepted', 'checked_in'])
              .then(r => ({ sid, count: r.count || 0 }))
          ))] : [Promise.resolve([])]),
        ]) : Promise.resolve(null),
      ])

      // Contacts récents
      const contacts = contactsResult.data || []
      if (contacts.length > 0) {
        const cIds = contacts.map((c: { contact_user_id: string }) => c.contact_user_id)
        const { data: cProfiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', cIds)
        const ordered = cIds.map(cid => {
          const p = (cProfiles || []).find((pr: any) => pr.id === cid)
          return { id: cid, name: p?.display_name || '?', avatar: (p?.profile_json as any)?.avatar_url as string | undefined }
        })
        setRecentContacts(ordered)
      }

      // Reviews + notifications
      setPendingReviews((reviewResult.data || []).map((r: any) => ({ session_id: r.session_id, title: (r.sessions as any)?.title || 'Session' })))
      setRecentNotifs(notifsResult.data || [])

      // Counts host session
      if (hostCountsResult && hostSession) {
        const [pendingCnt, memberCnt, memberCounts] = hostCountsResult as any
        setHostPendingCount(pendingCnt?.count ?? 0)
        setLatestHost(prev => prev ? { ...prev, member_count: (memberCnt?.count || 0) + 1 } : prev)
        if (memberCounts && sessionIds.length > 0) {
          setActiveApps(prev => prev.map(a => {
            const c = (memberCounts as any[]).find((x: any) => x.sid === a.session_id)
            return c ? { ...a, member_count: c.count } : a
          }))
        }
      }

      // Suggestions de contacts depuis sessions récentes
      const cutoff48h = new Date(Date.now() - 48 * 3600000).toISOString()
      const endedApps = endedAppsResult.data || []
      const recentSessionIds = endedApps
        .filter(a => (a.sessions as any)?.status === 'ended' && (a.sessions as any)?.ends_at > cutoff48h)
        .map(a => a.session_id)

      if (recentSessionIds.length > 0) {
        const [coParticipantsResult, myContactsResult] = await Promise.all([
          supabase.from('applications').select('applicant_id').in('session_id', recentSessionIds).in('status', ['accepted', 'checked_in']).neq('applicant_id', user.id),
          supabase.from('contacts').select('contact_user_id').eq('user_id', user.id),
        ])
        const contactSet = new Set((myContactsResult.data || []).map((c: any) => c.contact_user_id))
        const suggestions = [...new Set((coParticipantsResult.data || []).map((c: any) => c.applicant_id))].filter(id => !contactSet.has(id))
        if (suggestions.length > 0) {
          const { data: sProfiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', suggestions.slice(0, 6))
          setSessionSuggestions((sProfiles || []).map((p: any) => ({ id: p.id, name: p.display_name || '?', avatar: (p.profile_json?.avatar_url as string | undefined) })))
        }
      }

    } catch (err) {
      console.error('[useHomeData] loadData error:', err)
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])
  const { pullHandlers, pullIndicator } = usePullToRefresh(loadData)

  function handleJoinCode() {
    const code = inviteCode.trim()
    if (!code) return
    const match = code.match(/\/join\/([a-zA-Z0-9]+)(\?.*)?/)
    if (match) navigate('/join/' + match[1] + (match[2] || ''))
    else navigate('/join/' + code)
  }

  const handleAddSuggestion = async (s: { id: string; name: string; avatar?: string }) => {
    if (!userId) return
    await supabase.from('contacts').insert({ user_id: userId, contact_user_id: s.id, relation_level: 'connaissance' })
    setSessionSuggestions(prev => prev.filter(x => x.id !== s.id))
    showToast(t('profile.added_to_naughtybook'), 'success')
  }

  const dismissTip = async (tipId: string) => {
    const updated = [...dismissedTips, tipId]
    setDismissedTips(updated)
    if (userId) {
      const { data: pData } = await supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
      const pj = (pData?.profile_json || {}) as Record<string, unknown>
      await supabase.from('user_profiles').update({ profile_json: { ...pj, dismissed_tips: updated } }).eq('id', userId)
    }
  }

  return {
    navigate, t, loading, sessionTemplates, userId, displayName,
    latestHost, pendingApps, inviteCode, setInviteCode, activeApps,
    hostPendingCount, profilePct, recentContacts, recentNotifs,
    dismissedTips, showTips, sessionSuggestions, pendingReviews,
    pullHandlers, pullIndicator, handleJoinCode, handleAddSuggestion,
    dismissTip, getSessionCover, timeAgo,
  }
}
