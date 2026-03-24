import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { colors, radius, typeStyle, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { DM_DIRECT_TITLE } from '../lib/constants'
import { getSessionCover } from '../lib/sessionCover'
import { Plus, ArrowRight, Flame, Clock, CheckCircle2, Ghost, Bell, MessageCircle, UserPlus, Search, BookOpen, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { timeAgo } from '../lib/timing'

const S = colors
const R = radius

type QuickSession = { id: string; title: string; approx_area: string; status: string; tags?: string[]; member_count?: number; cover_url?: string }

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [latestHost, setLatestHost] = useState<QuickSession | null>(null)
  const [pendingApps, setPendingApps] = useState<{ session_id: string; title: string }[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [activeApps, setActiveApps] = useState<{ session_id: string; title: string; status: string }[]>([])
  const [hostPendingCount, setHostPendingCount] = useState(0)
  const [profilePct, setProfilePct] = useState(100)
  const [recentContacts, setRecentContacts] = useState<{ id: string; name: string; avatar?: string }[]>([])
  const [recentNotifs, setRecentNotifs] = useState<{ id: string; type: string; message?: string; title?: string; body?: string; href?: string; created_at: string }[]>([])
  const [dismissedTips, setDismissedTips] = useState<string[]>([])
  const [showTips, setShowTips] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    try {
      const redirect = localStorage.getItem('auth_redirect')
      if (redirect) { localStorage.removeItem('auth_redirect'); navigate(redirect); return }
    } catch (_) {}

    const { data: profData } = await supabase.from('user_profiles').select('display_name,profile_json').eq('id', user.id).maybeSingle()
    if (profData?.display_name) {
      setDisplayName(profData.display_name)
      const pj = (profData.profile_json || {}) as Record<string, unknown>
      const checks = [!!pj.avatar_url, !!pj.role, !!pj.age, !!pj.bio, !!(pj.height || pj.weight || pj.morphology), !!((pj as any).kinks && (pj as any).kinks.length > 0), !!profData.display_name && profData.display_name !== 'Anonymous']
      setProfilePct(Math.round((checks.filter(Boolean).length / checks.length) * 100))
      const isNewUser = !pj.role && !pj.avatar_url && !pj.onboarding_done
      if (isNewUser) {
        navigate('/onboarding'); return
      }
    }

    const { data: hosted } = await supabase.from('sessions').select('id, title, approx_area, status, tags')
      .eq('host_id', user.id).eq('status', 'open').neq('title', DM_DIRECT_TITLE)
      .order('created_at', { ascending: false }).limit(1)
    const hostSession = Array.isArray(hosted) ? hosted[0] ?? null : hosted ?? null
    setLatestHost(hostSession)
    if (hostSession) {
      const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', hostSession.id).eq('status', 'pending')
      setHostPendingCount(count ?? 0)
      const { count: mc } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', hostSession.id).in('status', ['accepted', 'checked_in'])
      if (hostSession) (hostSession as any).member_count = (mc || 0) + 1
    }

    const { data: pending } = await supabase.from('applications').select('session_id, status, sessions(title)')
      .eq('applicant_id', user.id).eq('status', 'pending')
    setPendingApps((pending || []).map((a: any) => ({ session_id: a.session_id, title: a.sessions?.title || 'Session' })))

    const { data: active } = await supabase.from('applications').select('session_id, status, sessions(title)')
      .eq('applicant_id', user.id).in('status', ['accepted', 'checked_in'])
    setActiveApps((active || []).map((a: any) => ({ session_id: a.session_id, status: a.status, title: a.sessions?.title || 'Session' })))

    // Recent contacts
    const { data: contacts } = await supabase.from('contacts').select('contact_user_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
    if (contacts && contacts.length > 0) {
      const cIds = contacts.map((c: any) => c.contact_user_id)
      const { data: cProfiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', cIds)
      const ordered = cIds.map(cid => {
        const p = (cProfiles || []).find((pr: any) => pr.id === cid)
        return { id: cid, name: p?.display_name || '?', avatar: (p?.profile_json as any)?.avatar_url }
      })
      setRecentContacts(ordered)
    } else { setRecentContacts([]) }

    // Recent notifications
    const { data: notifs } = await supabase.from('notifications').select('id, type, message, title, body, href, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    setRecentNotifs(notifs || [])

    // Tips eligibility
    const { count: cCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: sCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('applicant_id', user.id).in('status', ['accepted', 'checked_in', 'pending'])
    const pj2 = (profData?.profile_json || {}) as Record<string, unknown>
    setDismissedTips(Array.isArray(pj2.dismissed_tips) ? pj2.dismissed_tips as string[] : [])
    setShowTips(((cCount ?? 0) === 0 && (sCount ?? 0) === 0) || profilePct < 50)
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

  // ─── Shared styles ────────────────────────────────────
  const card = glassCard
  const chip: React.CSSProperties = {
    ...typeStyle('meta'), padding: '3px 10px', borderRadius: R.chip,
    background: S.p3, color: S.p, border: `1px solid ${S.pbd}`,
  }

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {pullIndicator}

      {/* ─── Header ──────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '52px 24px 20px' }}>
        <h1 style={{ ...typeStyle('hero'), color: S.p, margin: '0 0 6px' }}>fluidz</h1>
        {userId && displayName ? (
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: 0 }}>{t('home.hey', { name: displayName })}</p>
        ) : !userId ? (
          <div style={{ marginTop: 8 }}>
            <p style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 8px', lineHeight: 1.2 }}>
              {t('home.tagline')}
            </p>
            <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('home.subtitle')}
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              {[
                { n: '1', t: t('home.step1'), d: t('home.step1_desc') },
                { n: '2', t: t('home.step2'), d: t('home.step2_desc') },
                { n: '3', t: t('home.step3'), d: t('home.step3_desc') },
              ].map(step => (
                <div key={step.n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.p2, border: '1px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', ...typeStyle('label'), color: S.p }}>{step.n}</div>
                  <p style={{ ...typeStyle('label'), color: S.tx, margin: '0 0 2px' }}>{step.t}</p>
                  <p style={{ ...typeStyle('meta'), color: S.tx3, margin: 0 }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

      {/* ─── Recent Contacts ─────────────────────────── */}
      {recentContacts.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ ...typeStyle('micro'), color: S.p }}>{t('home.naughty_book')}</span>
            <span onClick={() => navigate('/contacts')} style={{ ...typeStyle('meta'), color: S.tx3, cursor: 'pointer' }}>{t('home.see_all_contacts')}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {recentContacts.map(c => (
              <div key={c.id} onClick={() => navigate('/contacts/' + c.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0, width: 52 }}>
                {c.avatar ? (
                  <img src={c.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + S.rule }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{(c.name || '?')[0].toUpperCase()}</div>
                )}
                <span style={{ fontSize: 10, color: S.tx2, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{c.name.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Mini Activity Feed ────────────────────────── */}
      {recentNotifs.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 8px' }}>
          <span style={{ ...typeStyle('micro'), color: S.tx3, display: 'block', marginBottom: 8 }}>{t('home.recent_activity')}</span>
          {recentNotifs.map(n => {
            const icon = n.type === 'new_dm' || n.type === 'new_message' || n.type === 'direct_dm' ? <MessageCircle size={14} strokeWidth={1.5} /> : n.type === 'application_accepted' || n.type === 'new_application' ? <UserPlus size={14} strokeWidth={1.5} /> : <Bell size={14} strokeWidth={1.5} />
            const text = n.title || n.body || n.message || n.type
            return (
              <div key={n.id} onClick={() => n.href && navigate(n.href)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: n.href ? 'pointer' : 'default', borderBottom: '1px solid ' + S.rule }}>
                <div style={{ color: S.tx3, flexShrink: 0 }}>{icon}</div>
                <span style={{ flex: 1, fontSize: 12, color: S.tx2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                <span style={{ fontSize: 10, color: S.tx4, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Content ─────────────────────────────────── */}
      <div className="stagger-children" style={{ position: 'relative', zIndex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 96 }}>

        {/* Profile completion nudge */}
        {profilePct < 100 && userId && (
          <div onClick={() => navigate('/me')} style={{ ...card, cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke={S.bg2} strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={profilePct >= 70 ? S.sage : S.p} strokeWidth="3" strokeDasharray={`${(profilePct / 100) * 94.2} 94.2`} strokeLinecap="round" />
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: profilePct >= 70 ? S.sage : S.p }}>{profilePct}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{t('home.complete_profile')}</p>
              <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '2px 0 0' }}>{t('home.complete_profile_desc')}</p>
            </div>
            <ArrowRight size={16} style={{ color: S.tx3, flexShrink: 0 }} />
          </div>
        )}
        {/* Feature discovery tips */}
        {userId && showTips && (() => {
          const tips = [
            { id: 'explore', icon: <Search size={18} strokeWidth={1.5} style={{ color: S.p }} />, title: t('tips.explore_title'), desc: t('tips.explore_desc'), href: '/explore' },
            { id: 'naughtybook', icon: <BookOpen size={18} strokeWidth={1.5} style={{ color: S.sage }} />, title: t('tips.naughtybook_title'), desc: t('tips.naughtybook_desc'), href: '/contacts' },
            { id: 'ghost', icon: <Ghost size={18} strokeWidth={1.5} style={{ color: S.lav }} />, title: t('tips.ghost_title'), desc: t('tips.ghost_desc'), href: '/ghost/setup' },
          ].filter(tip => !dismissedTips.includes(tip.id))
          if (tips.length === 0) return null
          const dismissTip = async (tipId: string) => {
            const updated = [...dismissedTips, tipId]
            setDismissedTips(updated)
            if (userId) {
              const { data: pData } = await supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
              const pj = (pData?.profile_json || {}) as Record<string, unknown>
              await supabase.from('user_profiles').update({ profile_json: { ...pj, dismissed_tips: updated } }).eq('id', userId)
            }
          }
          return tips.map(tip => (
            <div key={tip.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{ flexShrink: 0 }}>{tip.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{tip.title}</p>
                <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '2px 0 0' }}>{tip.desc}</p>
              </div>
              <button onClick={() => navigate(tip.href)} style={{ padding: '6px 12px', borderRadius: 8, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                {t('common.go')}
              </button>
              <button onClick={(e) => { e.stopPropagation(); dismissTip(tip.id) }} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 2 }}>
                <X size={12} />
              </button>
            </div>
          ))
        })()}

        {/* Host active session */}
        {latestHost && (() => {
          const cover = getSessionCover(latestHost.tags, latestHost.cover_url)
          return (
          <div onClick={() => navigate('/session/' + latestHost.id + '/host')} style={{ ...card, background: cover.bg, border: `1px solid ${S.pbd}`, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
            {cover.coverImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,20,31,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 8px' }}>{t('home.your_session')}</p>
            <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>{latestHost.title}</p>
            {latestHost.approx_area && <p style={{ ...typeStyle('body'), color: S.tx2, margin: '4px 0 0' }}>{latestHost.approx_area}</p>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {latestHost.member_count && latestHost.member_count > 1 && (
                <span style={{ ...typeStyle('meta'), color: S.sage, fontWeight: 600 }}>{t('session.member_count', { count: latestHost.member_count })}</span>
              )}
              {latestHost.tags?.slice(0, 3).map(t => <span key={t} style={chip}>{t}</span>)}
            </div>
            {hostPendingCount > 0 && (
              <p style={{ ...typeStyle('label'), color: S.p, margin: '8px 0 0' }}>{t('home.pending_count', { count: hostPendingCount })}</p>
            )}
            </div>
          </div>
          )})()}

        {/* Pending applications */}
        {pendingApps.length > 0 && (
          <div style={{ ...card, border: `1px solid ${S.lavbd}` }}>
            <p style={{ ...typeStyle('micro'), color: S.lav, margin: '0 0 10px' }}>{t('home.pending_apps')}</p>
            {pendingApps.map(app => (
              <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${S.rule}` }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{app.title}</p>
                <Clock size={14} style={{ color: S.lav }} />
              </div>
            ))}
          </div>
        )}

        {/* Active sessions */}
        {activeApps.length > 0 && (
          <div style={{ ...card, border: `1px solid ${S.sagebd}` }}>
            <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 10px' }}>{t('home.active_sessions')}</p>
            {activeApps.map(app => (
              <div key={app.session_id} onClick={() => navigate('/session/' + app.session_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${S.rule}` }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{app.title}</p>
                <CheckCircle2 size={14} style={{ color: app.status === 'checked_in' ? S.sage : S.tx3 }} />
              </div>
            ))}
          </div>
        )}

        {/* Join code */}
        <div style={card}>
          <p style={{ ...typeStyle('label'), color: S.tx2, margin: '0 0 10px' }}>{t('home.join_link')}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
              placeholder={t('home.join_placeholder')}
              style={{
                flex: 1, padding: '10px 14px', background: S.bg2, border: `1px solid ${S.rule}`,
                borderRadius: R.icon, color: S.tx, fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '-0.02em',
              }}
            />
            <button onClick={handleJoinCode} style={{
              padding: '10px 16px', borderRadius: R.icon, background: S.p, border: 'none',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {userId && !latestHost && pendingApps.length === 0 && activeApps.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
            <Flame size={28} style={{ color: S.p, margin: '0 auto 10px', display: 'block' }} strokeWidth={1.5} />
            <p style={{ ...typeStyle('section'), color: S.tx, margin: '0 0 6px' }}>{t('home.ready')}</p>
            <p style={{ ...typeStyle('body'), color: S.tx2, lineHeight: 1.6 }}>
              {t('home.ready_desc')}
            </p>
          </div>
        )}

        {/* CTA — Create session */}
        {userId && (
          <>
            <button onClick={() => navigate('/session/create')} style={{
              position: 'relative', overflow: 'hidden', width: '100%', padding: 16,
              background: S.p, border: 'none', borderRadius: R.btn, color: '#fff',
              ...typeStyle('section'), cursor: 'pointer',
              boxShadow: `0 4px 24px ${S.pbd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Plus size={18} strokeWidth={2.5} />
              {t('home.create_session')}
              {/* Shimmer */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { label: 'Custom', slug: 'custom', color: S.p, bg: S.p2, border: S.pbd },
                { label: 'Dark Room', slug: 'darkroom', color: '#E0887A', bg: 'rgba(224,136,122,0.10)', border: 'rgba(224,136,122,0.25)' },
                { label: 'Techno', slug: 'techno', color: '#6BA888', bg: 'rgba(107,168,136,0.10)', border: 'rgba(107,168,136,0.25)' },
              ]).map(tpl => (
                <button key={tpl.slug} onClick={() => navigate('/session/create?tpl=' + tpl.slug)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: R.chip, ...typeStyle('meta'),
                    color: tpl.color, border: `1px solid ${tpl.border}`, background: tpl.bg, cursor: 'pointer',
                    fontWeight: 600,
                  }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Logged out CTAs */}
        {!userId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate('/login?next=/session/create')} style={{
              position: 'relative', overflow: 'hidden', width: '100%', padding: 16,
              background: S.p, border: 'none', borderRadius: R.btn, color: '#fff',
              ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${S.pbd}`,
            }}>
              {t('home.create_session')}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
              color: S.tx2, border: `1px solid ${S.rule}`, background: 'transparent', cursor: 'pointer',
            }}>
              {t('home.login')}
            </button>
            <button onClick={() => navigate('/ghost/setup')} style={{
              width: '100%', padding: 12, borderRadius: R.btn, ...typeStyle('meta'),
              color: S.lav, border: 'none', background: S.lavbg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Ghost size={14} strokeWidth={1.5} />
              {t('home.ghost_mode')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
