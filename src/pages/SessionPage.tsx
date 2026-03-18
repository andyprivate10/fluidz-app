import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Clock, ThumbsUp, ThumbsDown, Users, Star, Share2, MessageCircle } from 'lucide-react'
import { SkeletonSessionPage } from '../components/Skeleton'
import type { User } from '@supabase/supabase-js'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
const S = { ...colors, red: "#F87171", orange: "#FBBF24", blue: "#7DD3FC", grad: colors.p }

type Session = { id: string; title: string; description: string; approx_area: string; exact_address: string | null; status: string; host_id: string; invite_code: string | null; created_at?: string; tags?: string[]; lineup_json?: { directions?: (string | { text: string; photo_url?: string })[]; roles_wanted?: Record<string, number> } }
type Member = { applicant_id: string; eps_json: Record<string, string>; status: string }
type PendingApplication = { id: string; applicant_id: string; display_name?: string | null; avatar_url?: string | null }
type VoteRow = { id: string; applicant_id: string; voter_id: string; vote: 'yes' | 'no'; session_id: string }

const st: React.CSSProperties = { background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 96,  }
const card: React.CSSProperties = { background: S.bg1, border: '1px solid '+S.rule, borderRadius: 16, padding: 16 }

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
  const [copied, setCopied] = useState(false)
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [showPostulerSuccess, setShowPostulerSuccess] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sheetMember, setSheetMember] = useState<Member | null>(null)
  const [pendingApps, setPendingApps] = useState<PendingApplication[]>([])
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [voteLoadingId, setVoteLoadingId] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<{ avg: number; count: number; topVibes: string[] } | null>(null)
  const touchStartY = useRef(0)
  const [elapsed, setElapsed] = useState('')

  // Session timer
  useEffect(() => {
    if (!session?.created_at || session.status === 'ended') return
    const update = () => {
      const ms = Date.now() - new Date(session.created_at!).getTime()
      const mins = Math.floor(ms / 60000)
      if (mins < 60) setElapsed(mins + 'min')
      else { const h = Math.floor(mins / 60); const m = mins % 60; setElapsed(h + 'h' + (m > 0 ? m.toString().padStart(2, '0') : '')) }
    }
    update()
    const iv = setInterval(update, 60000)
    return () => clearInterval(iv)
  }, [session?.created_at, session?.status])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const on = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const isHost = currentUser?.id === session?.host_id

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)

      const { data: sess, error: sessErr } = await supabase.from('sessions').select('*').eq('id', id).single()
      if (sessErr) throw sessErr
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
        showToast('Erreur vote: ' + error.message, 'error')
      } else if (data) {
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
      showToast('Erreur check-in: ' + error.message, 'error')
      console.error('Check-in error:', error)
    } else {
      setCheckInDone(true)
    }
    setCheckInLoading(false)
  }

  if (loading) return <SkeletonSessionPage />
  if (loadError) return (
    <div style={{ ...st, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <p style={{ color: S.red, textAlign: 'center' }}>Impossible de charger les données. Réessaie.</p>
    </div>
  )
  if (!session) return <div style={{ ...st, padding: 24, color: S.red }}>Session introuvable.</div>

  const statusLabel = session.status === 'open' ? 'Ouverte' : session.status === 'ended' ? 'Terminée' : 'Brouillon'
  const statusColor = session.status === 'open' ? S.sage : session.status === 'ended' ? S.red : S.tx2

  return (
    <div style={st} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {isRefreshing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: S.bg1, borderBottom: '1px solid '+S.rule }}>
          <div className="w-6 h-6 border-2 border-peach300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid '+S.rule, background: S.bg1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: S.tx, flex: 1 }}>{session.title}</h1>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: S.rule, padding: '3px 10px', borderRadius: 50, marginLeft: 8, whiteSpace: 'nowrap' }}>{statusLabel}</span>
          {members.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: S.tx2, background: S.rule, padding: '3px 10px', borderRadius: 50, marginLeft: 4, whiteSpace: 'nowrap' }}><Users size={11} strokeWidth={1.5} style={{marginRight:3, display:'inline'}} /> {members.length}</span>}
          {members.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: S.sage, background: S.sagebg, padding: '3px 10px', borderRadius: 50, marginLeft: 4, whiteSpace: 'nowrap' }}><Users size={11} strokeWidth={1.5} style={{marginRight:3, display:'inline'}} /> {members.length + 1}</span>}
          {elapsed && session.status === 'open' && <span style={{ fontSize: 11, fontWeight: 600, color: S.tx2, background: S.rule, padding: '3px 10px', borderRadius: 50, marginLeft: 4, whiteSpace: 'nowrap' }}><Clock size={10} strokeWidth={1.5} style={{marginRight:2}} />{elapsed}</span>}
          {session.status === 'open' && session.created_at && (() => {
            const mins = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 60000)
            const label = mins < 60 ? mins + 'min' : Math.floor(mins / 60) + 'h' + (mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : '')
            return <span style={{ fontSize: 11, fontWeight: 600, color: S.tx2, background: S.rule, padding: '3px 10px', borderRadius: 50, marginLeft: 4, whiteSpace: 'nowrap' }}><Clock size={10} strokeWidth={1.5} style={{marginRight:2}} />{label}</span>
          })()}
        </div>
        {session.tags && session.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {session.tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: S.p, padding: '4px 10px', borderRadius: 99, background: S.p2, border: '1px solid #F9A8A844' }}>{tag}</span>
            ))}
          </div>
        )}
        {(myApp?.status === 'accepted' || myApp?.status === 'checked_in') && session.exact_address ? (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 13, color: S.tx, fontWeight: 600 }}>{session.exact_address}</div>
            <button onClick={() => {
              const dirs = (session.lineup_json?.directions || []).map((d, i) => {
                const txt = typeof d === 'string' ? d : d.text
                return (i+1) + '. ' + txt
              }).join('\n')
              const full = session.exact_address + (dirs ? '\n\n' + dirs : '')
              navigator.clipboard.writeText(full).then(() => { setAddressCopied(true); setTimeout(() => setAddressCopied(false), 2000) })
            }} style={{ marginTop: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (addressCopied ? S.sagebd : S.rule), background: addressCopied ? '#4ADE8014' : 'transparent', color: addressCopied ? S.sage : S.tx2 }}>
              {addressCopied ? '✓ Copié' : 'Copier adresse + directions'}
            </button>
          </div>
        ) : session.approx_area ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: S.tx2 }}>Autour de {session.approx_area}</span>
            {!isHost && <span style={{ fontSize: 11, color: S.tx3 }}>Adresse révélée après acceptation</span>}
          </div>
        ) : null}
        {isHost && <div style={{ fontSize: 12, color: S.p, marginTop: 4, fontWeight: 600 }}>Tu es le host</div>}
        {!isHost && hostProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }} onClick={() => navigate('/profile/' + session.host_id)}>
            {hostProfile.avatar ? (
              <img src={hostProfile.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid '+S.rule }} />
            ) : (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: S.p2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: S.p, fontWeight: 700 }}>{hostProfile.name[0]}</div>
            )}
            <span style={{ fontSize: 12, color: S.tx2, fontWeight: 600, cursor: 'pointer' }}>Host : {hostProfile.name}</span>
          </div>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {session.description && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.tx2, marginBottom: 8 }}>DESCRIPTION</div>
            <div style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6 }}>{session.description}</div>
          </div>
        )}

        {/* Rôles recherchés */}
        {session.lineup_json?.roles_wanted && Object.keys(session.lineup_json.roles_wanted).length > 0 && (() => {
          const wanted = session.lineup_json.roles_wanted as Record<string, number>
          // Count current roles in lineup
          const currentRoles: Record<string, number> = {}
          members.forEach(m => {
            const role = m.eps_json?.role || memberRoles[m.applicant_id]
            if (role) currentRoles[role] = (currentRoles[role] || 0) + 1
          })
          const missing: { role: string; need: number }[] = []
          Object.entries(wanted).forEach(([role, count]) => {
            const have = currentRoles[role] || 0
            if (have < Number(count)) missing.push({ role, need: Number(count) - have })
          })
          return (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: S.tx2, marginBottom: 8 }}>RÔLES RECHERCHÉS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(wanted).map(([role, count]) => {
                  const have = currentRoles[role] || 0
                  const filled = have >= Number(count)
                  return (
                    <span key={role} style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                      color: filled ? S.sage : S.p,
                      background: filled ? S.sagebg : S.p2,
                      border: '1px solid ' + (filled ? S.sagebd : S.pbd),
                    }}>
                      {filled ? '✓' : `${Number(count) - have}×`} {role}
                    </span>
                  )
                })}
              </div>
              {missing.length > 0 && (
                <p style={{ fontSize: 11, color: S.p, margin: '8px 0 0' }}>
                  Recherche : {missing.map(m => `${m.need} ${m.role}${m.need > 1 ? 's' : ''}`).join(', ')}
                </p>
              )}
            </div>
          )
        })()}

        {(myApp?.status === 'accepted' || myApp?.status === 'checked_in') && session.lineup_json?.directions?.length ? (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.tx2, marginBottom: 8 }}>ACCÈS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {session.lineup_json.directions.map((step, i) => {
                const text = typeof step === 'string' ? step : step.text
                const photo = typeof step === 'string' ? undefined : step.photo_url
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.p, minWidth: 22 }}>{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: S.tx2, margin: 0, lineHeight: 1.5 }}>{text}</p>
                      {photo && <img src={photo} alt="" style={{ width: '100%', maxWidth: 240, height: 140, objectFit: 'cover', borderRadius: 10, marginTop: 6, border: '1px solid '+S.rule }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {members.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.tx2, marginBottom: 12 }}>LINEUP · {members.length + 1}</div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Host first */}
                {hostProfile && (
                  <button type="button" onClick={() => navigate('/profile/' + session.host_id)} style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
                    {hostProfile.avatar ? (
                      <img src={hostProfile.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #F9A8A8', boxSizing: 'border-box' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', border: '2px solid #F9A8A8', boxSizing: 'border-box' }}>
                        {hostProfile.name[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: -4, right: -4 }}><Star size={10} strokeWidth={1.5} fill={S.p} color={S.p} /></span>
                  </button>
                )}
                {members.slice(0, 5).map((m, i) => {
                  const avatarUrl = memberAvatars[m.applicant_id]
                  return (
                    <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ marginLeft: i === 0 ? 0 : -8, display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #16141F', boxSizing: 'border-box' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', border: '2px solid #16141F', boxSizing: 'border-box' }}>
                          {(memberNames[m.applicant_id] || (m.eps_json as any)?.profile_snapshot?.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </button>
                  )
                })}
                {members.length > 5 && (
                  <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 600, color: S.tx2 }}>+{members.length - 5}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {members.slice(0, 5).map(m => {
                  const name = memberNames[m.applicant_id] || (m.eps_json as any)?.profile_snapshot?.display_name || 'Anonyme'
                  return (
                    <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ fontSize: 13, color: S.tx2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{name}{m.status === 'checked_in' && <span style={{ color: S.sage, fontSize: 10 }}>✓</span>}{memberRoles[m.applicant_id] && <span style={{ fontSize: 10, color: S.p, marginLeft: 2 }}>{memberRoles[m.applicant_id]}</span>}</button>
                  )
                })}
                {members.length > 5 && <span style={{ fontSize: 12, color: S.tx2 }}>+{members.length - 5}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {members.map(m => {
                const eps = m.eps_json || {}
                const avatarUrl = memberAvatars[m.applicant_id]
                const role = memberRoles[m.applicant_id] || eps.role
                const name = memberNames[m.applicant_id] || (eps as any).profile_snapshot?.display_name || eps.displayName || 'Anonyme'
                return (
                  <button key={m.applicant_id} type="button" onClick={() => isMobile ? setSheetMember(m) : navigate('/profile/' + m.applicant_id)} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {(name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>{name}{(eps as any).age ? ', ' + (eps as any).age : ''}</div>
                      {role && <div style={{ fontSize: 11, color: S.tx2 }}>{role}</div>}
                    </div>
                    {m.status === 'checked_in' && <div style={{ fontSize: 11, color: S.sage, fontWeight: 600 }}>Check-in</div>}
                  </button>
                )
              })}
            </div>
            {sheetMember && isMobile && (
              <>
                <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setSheetMember(null)} />
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: S.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: '1px solid '+S.rule, padding: '20px 20px 24px', zIndex: 50 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: S.tx2, margin: '0 auto 16px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    {memberAvatars[sheetMember.applicant_id] ? (
                      <img src={memberAvatars[sheetMember.applicant_id]} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>
                        {(memberNames[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.profile_snapshot?.display_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: S.tx }}>{memberNames[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.profile_snapshot?.display_name || 'Anonyme'}</div>
                      {(memberRoles[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.role) && (
                        <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'white', background: S.p }}>
                          {memberRoles[sheetMember.applicant_id] || (sheetMember.eps_json as any)?.role}
                        </span>
                      )}
                    </div>
                  </div>
                  {((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio) && (
                    <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.5, margin: '0 0 16px' }}>
                      {String((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio || '').slice(0, 120)}
                      {String((sheetMember.eps_json as any)?.profile_snapshot?.bio || (sheetMember.eps_json as any)?.bio || '').length > 120 ? '…' : ''}
                    </p>
                  )}
                  <button onClick={() => { navigate('/profile/' + sheetMember.applicant_id); setSheetMember(null) }} style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff', background: S.p, border: 'none', cursor: 'pointer' }}>
                    Voir le profil complet
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {members.length >= 3 ? (
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.tx2, marginBottom: 8 }}>VOTE CONSULTATIF</div>
            {pendingApps.filter(p => !currentUser || p.applicant_id !== currentUser.id).length === 0 ? (
              <p style={{ fontSize: 13, color: S.tx2, margin: '4px 0 0' }}>Aucune candidature en attente de vote pour le moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingApps
                  .filter(p => !currentUser || p.applicant_id !== currentUser.id)
                  .map(p => {
                    const { yesCount, noCount, myVote } = getVoteStats(p.applicant_id)
                    const disabled = !!myVote || voteLoadingId === p.applicant_id
                    const name = p.display_name || 'Anonyme'
                    return (
                      <div key={p.id} style={{ padding: 10, borderRadius: 12, background: S.bg, border: '1px solid '+S.rule, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                              {name[0].toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>{name}</div>
                            <div style={{ fontSize: 11, color: S.tx2 }}>Candidature en attente</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleVote(p.applicant_id, 'yes')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: 999,
                              border: '1px solid ' + (myVote === 'yes' ? S.p : S.pbd),
                              background: myVote === 'yes' ? S.p : 'transparent',
                              color: myVote === 'yes' ? S.bg : S.p,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: disabled ? 'default' : 'pointer',
                              opacity: disabled && myVote !== 'yes' ? 0.5 : 1,
                            }}
                          >
                            <span style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}><ThumbsUp size={14} /> Oui</span>
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleVote(p.applicant_id, 'no')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: 999,
                              border: '1px solid ' + (myVote === 'no' ? S.p : S.rule),
                              background: myVote === 'no' ? S.rule : 'transparent',
                              color: myVote === 'no' ? S.p : S.tx2,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: disabled ? 'default' : 'pointer',
                              opacity: disabled && myVote !== 'no' ? 0.5 : 1,
                            }}
                          >
                            <span style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}><ThumbsDown size={14} /> Non</span>
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: S.tx2, textAlign: 'right' }}>
                          {yesCount} oui · {noCount} non
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
            <p style={{ fontSize: 11, color: S.tx2, marginTop: 8 }}>
              Vote consultatif : visible par tous les membres. Le host tranche la décision finale.
            </p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ fontSize: 13, color: S.tx2, margin: 0 }}>Vote disponible dès 3 membres</p>
          </div>
        )}

        {myApp?.status === 'accepted' && !checkInDone && (
          <button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#4ADE80,#16a34a)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            {checkInLoading ? 'Enregistrement...' : 'Je suis arrive ! Check-in'}
          </button>
        )}

        {checkInDone && myApp?.status !== 'checked_in' && (
          <div style={{ ...card, background: '#FBBF2414', borderColor: S.p, textAlign: 'center' }}>
            <Clock size={24} style={{color:S.p,margin:'0 auto'}} />
            <div style={{ fontSize: 14, color: S.p, marginTop: 4, fontWeight: 600 }}>En attente de confirmation du host</div>
            <p style={{ fontSize: 12, color: S.tx2, marginTop: 6, margin: '6px 0 0' }}>Le host doit confirmer ton arrivée</p>
          </div>
        )}

        {myApp?.status === 'checked_in' && (
          <div style={{ ...card, background: 'rgba(107,168,136,0.12)', borderColor: S.sage, textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>Bienvenue !</div>
            <div style={{ fontSize: 14, color: S.sage, marginTop: 4 }}>Check-in confirme</div>
            {session.exact_address && <div style={{ fontSize: 14, color: S.tx, marginTop: 8, fontWeight: 600 }}>{session.exact_address}</div>}
            {session.invite_code && (
              <>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + session.invite_code
                  navigator.clipboard.writeText(url).then(() => {
                    setInviteLinkCopied(true)
                    setTimeout(() => setInviteLinkCopied(false), 2000)
                  })
                }}
                style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 12, border: '1px solid '+S.sage, background: inviteLinkCopied ? 'rgba(107,168,136,0.12)' : 'transparent', color: S.sage, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {inviteLinkCopied ? 'Lien copié !' : 'Partager le lien d\'invitation'}
              </button>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + session.invite_code
                  const rolesW = session.lineup_json?.roles_wanted as Record<string,number> | undefined
                  const rolesText = rolesW && Object.keys(rolesW).length > 0 ? ' – Recherche ' + Object.entries(rolesW).map(([r,c]) => c+' '+r).join(', ') : ''
                  const text = '🔥 ' + session.title + (session.approx_area ? ' – ' + session.approx_area : '') + rolesText + ' – ' + (members.length+1) + ' déjà là – Rejoins-nous : ' + url
                  navigator.clipboard.writeText(text).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+S.rule, background: copied ? 'rgba(107,168,136,0.12)' : 'transparent', color: copied ? S.sage : S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {copied ? 'Message copié !' : 'Copier message pour Grindr / WhatsApp'}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => {
                    const url = window.location.origin + '/join/' + session.invite_code
                    navigator.share({ title: session.title, text: '🔥 ' + session.title + ' – Rejoins-nous !', url }).catch(() => {})
                  }}
                  style={{ marginTop: 6, width: '100%', padding: 10, borderRadius: 12, border: '1px solid '+S.sage, background: 'transparent', color: S.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Share2 size={13} strokeWidth={1.5} style={{marginRight:4}} /> Partager
                </button>
              )}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => navigate('/session/' + id + '/chat')} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #F9A8A844', background: S.p2, color: S.p, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <MessageCircle size={13} strokeWidth={1.5} style={{marginRight:4}} /> Group Chat
              </button>
              <button onClick={() => navigate('/session/' + id + '/dm')} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid '+S.rule, background: S.bg1, color: S.tx2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                DM Host
              </button>
            </div>
          </div>
        )}

        {/* Suggest adding co-participants to Naughty Book */}
        {myApp?.status === 'checked_in' && members.length > 0 && (
          <div style={{ ...card, borderColor: S.pbd }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.tx2, margin: '0 0 8px' }}>AJOUTER AU CARNET ?</p>
            <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 10px' }}>Tu peux ajouter les membres de cette session à ton Naughty Book</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.filter(m => m.applicant_id !== currentUser?.id).slice(0, 6).map(m => {
                const name = memberNames[m.applicant_id] || 'Anonyme'
                const avatar = memberAvatars[m.applicant_id]
                return (
                  <button key={m.applicant_id} onClick={() => navigate('/contacts/' + m.applicant_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid '+S.rule, background: S.bg2, cursor: 'pointer' }}>
      <OrbLayer />
                    {avatar ? (
                      <img src={avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{name[0].toUpperCase()}</div>
                    )}
                    <span style={{ fontSize: 12, color: S.tx2, fontWeight: 600 }}>{name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/session/' + id + '/host')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.rule, borderRadius: 12, color: S.tx, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {pendingCount > 0 ? `Gerer (${pendingCount} en attente)` : 'Gerer la session'}
            </button>
            {session.invite_code && (
              <button onClick={() => {
                const url = window.location.origin + '/join/' + session.invite_code
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
              }} style={{ width: '100%', padding: 14, background: copied ? 'rgba(107,168,136,0.12)' : S.bg1, border: '1px solid ' + (copied ? S.sage : S.p), borderRadius: 12, color: copied ? S.sage : S.p, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {copied ? 'Lien copie !' : 'Partager le lien'}
              </button>
            )}
          </div>
        )}

        {myApp && (
          <div style={{ ...card }}>
            {myApp.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: S.p, padding: '6px 12px', borderRadius: 99, background: '#FBBF2418', border: '1px solid #FBBF2444' }}>En attente de réponse...</span>
              </div>
            )}
            {myApp.status === 'accepted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: S.sage, padding: '6px 12px', borderRadius: 99, background: S.sagebg, border: '1px solid #4ADE8044' }}>Accepté ✓</span>
                {session.exact_address && (
                  <div style={{ padding: '10px 12px', background: 'rgba(107,168,136,0.12)', borderRadius: 10, border: '1px solid #4ADE8044' }}>
                    <p style={{ fontSize: 11, color: S.sage, fontWeight: 700, margin: '0 0 2px' }}>Adresse</p>
                    <p style={{ fontSize: 14, color: S.tx, fontWeight: 600, margin: 0 }}>{session.exact_address}</p>
                  </div>
                )}
                <button onClick={() => navigate('/session/' + id + '/dm')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.sage, borderRadius: 12, color: S.sage, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Ouvrir le DM
                </button>
              </div>
            )}
            {myApp.status === 'rejected' && (
              <span style={{ fontSize: 14, fontWeight: 600, color: S.red, padding: '6px 12px', borderRadius: 99, background: '#F8717118', border: '1px solid #F8717144' }}>Non retenu</span>
            )}
            {myApp.status === 'checked_in' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: S.sage, padding: '6px 12px', borderRadius: 99, background: S.sagebg, border: '1px solid #4ADE8044' }}>Check-in confirmé ✓</span>
                {session.exact_address && (
                  <div style={{ padding: '10px 12px', background: 'rgba(107,168,136,0.12)', borderRadius: 10, border: '1px solid #4ADE8044' }}>
                    <p style={{ fontSize: 11, color: S.sage, fontWeight: 700, margin: '0 0 2px' }}>Adresse</p>
                    <p style={{ fontSize: 14, color: S.tx, fontWeight: 600, margin: 0 }}>{session.exact_address}</p>
                  </div>
                )}
                <button onClick={() => navigate('/session/' + id + '/dm')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid '+S.sage, borderRadius: 12, color: S.sage, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Ouvrir le DM
                </button>
                <button onClick={() => navigate('/session/' + id + '/chat')} style={{ width: '100%', padding: 14, background: S.bg1, border: '1px solid #F9A8A8', borderRadius: 12, color: S.p, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Group Chat
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Review summary for ended sessions */}
      {session.status === 'ended' && reviewSummary && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: S.bg1, border: '1px solid '+S.rule, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avis des participants</span>
              <span style={{ fontSize: 11, color: S.tx2 }}>{reviewSummary.count} avis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: S.p }}>{reviewSummary.avg}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 18, color: n <= Math.round(reviewSummary.avg) ? S.p : S.tx3 }}>★</span>
                ))}
              </div>
            </div>
            {reviewSummary.topVibes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {reviewSummary.topVibes.map(v => {
                  const vibeMap: Record<string, string> = { fun: 'Fun', safe: 'Safe', intense: 'Intense', chill: 'Chill', respectful: 'Respectueux', awkward: 'Awkward', hot: 'Hot', welcoming: 'Accueillant' }
                  return <span key={v} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: S.bg2, color: S.tx2, border: '1px solid '+S.rule }}>{vibeMap[v] || v}</span>
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review CTA for ended sessions */}
      {session.status === 'ended' && myApp && (myApp.status === 'accepted' || myApp.status === 'checked_in') && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: S.bg1, border: '1px solid #FBBF2444', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: S.tx, margin: '0 0 6px' }}>Comment c'était ?</p>
            <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 14px' }}>Ton avis anonyme aide la communauté</p>
            <button onClick={() => navigate('/session/' + id + '/review')} style={{ width: '100%', padding: 14, background: S.p, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px #F4727244' }}>
              ⭐ Laisser un avis
            </button>
          </div>
        </div>
      )}

      {(!isHost && (showPostulerSuccess || (!myApp && session.status === 'open'))) && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 20px 24px', background: 'linear-gradient(to top, #0C0A14 60%, transparent)', zIndex: 50 }}>
          {showPostulerSuccess ? (
            <button disabled style={{ width: '100%', padding: 16, background: 'rgba(107,168,136,0.12)', border: '1px solid '+S.sage, borderRadius: 14, color: S.sage, fontSize: 16, fontWeight: 700 }}>
              Candidature envoyee ✓
            </button>
          ) : (
            <button onClick={() => currentUser ? navigate('/session/' + id + '/apply') : (session.invite_code ? navigate('/join/' + session.invite_code) : navigate('/me'))} style={{ width: '100%', padding: 16, background: S.p, border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Postuler a cette session
            </button>
          )}
        </div>
      )}
    </div>
  )
}