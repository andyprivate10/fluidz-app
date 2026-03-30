import { useState } from 'react'
import PageFadeIn from '../components/PageFadeIn'
import { colors, fonts, radius, typeStyle, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { Plus, ArrowRight, Flame, Clock, CheckCircle2, Ghost, Bell, MessageCircle, UserPlus, Search, BookOpen, X } from 'lucide-react'
import { useHomeData } from '../hooks/useHomeData'
import { useAuth } from '../contexts/AuthContext'
import GhostConvertModal from '../components/GhostConvertModal'
import SessionInfoCard from '../components/SessionInfoCard'
import CyclingAvatar from '../components/CyclingAvatar'
import { SkeletonHomePage } from '../components/Skeleton'

const S = colors
const R = radius

export default function HomePage() {
  const {
    navigate,
    t,
    loading,
    sessionTemplates,
    userId,
    displayName,
    latestHost,
    pendingApps,
    inviteCode,
    setInviteCode,
    activeApps,
    profilePct,
    recentContacts,
    recentNotifs,
    dismissedTips,
    showTips,
    sessionSuggestions,
    pendingReviews,
    pullHandlers,
    pullIndicator,
    handleJoinCode,
    handleAddSuggestion,
    dismissTip,
    timeAgo,
  } = useHomeData()

  const { isGhost } = useAuth()
  const [showConvert, setShowConvert] = useState(false)

  // ─── Shared styles ────────────────────────────────────
  const card = glassCard

  if (loading) return <SkeletonHomePage />

  return (
    <PageFadeIn>
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
                <CyclingAvatar
                  photos={c.avatar ? [c.avatar] : []}
                  size={40}
                  fallbackLetter={(c.name || '?')[0]}
                  border={'1px solid ' + S.rule}
                />
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
            const text = n.title || n.body || n.type
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
        {/* Pending reviews */}
        {pendingReviews.length > 0 && (
          <div style={{ ...card, border: '1px solid ' + S.pbd }}>
            <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 8px' }}>{t('home.pending_reviews')}</p>
            {pendingReviews.map(r => (
              <div key={r.session_id} onClick={() => navigate('/session/' + r.session_id + '/review')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid ' + S.rule }}>
                <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{r.title}</p>
                <span style={{ fontSize: 11, fontWeight: 600, color: S.p }}>{t('home.review_now')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Contact suggestions from recent sessions */}
        {sessionSuggestions.length > 0 && (
          <div style={{ ...card, border: '1px solid ' + S.sagebd }}>
            <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 4px' }}>{t('home.add_from_session')}</p>
            <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '0 0 10px' }}>{t('home.add_from_session_desc')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sessionSuggestions.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: '1px solid ' + S.rule, background: S.bg2 }}>
                  {s.avatar ? (
                    <img src={s.avatar} alt="" loading="lazy" style={{ width: 22, height: 22, borderRadius: '28%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: '28%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: S.tx }}>{(s.name || '?')[0].toUpperCase()}</div>
                  )}
                  <span style={{ fontSize: 11, color: S.tx2, fontWeight: 600 }}>{s.name}</span>
                  <button onClick={(e) => {
                    e.stopPropagation()
                    handleAddSuggestion(s)
                  }} style={{ padding: '3px 8px', borderRadius: 6, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ghost → create real account CTA */}
        {userId && isGhost && (
          <div style={{ ...card, border: '1px solid ' + S.lavbd, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Ghost size={20} strokeWidth={1.5} style={{ color: S.lav, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>{t('ghost.create_account_title')}</p>
              <p style={{ ...typeStyle('meta'), color: S.tx3, margin: '2px 0 0' }}>{t('ghost.create_account_desc')}</p>
            </div>
            <button onClick={() => setShowConvert(true)} style={{ padding: '6px 12px', borderRadius: 8, background: S.lavbg, border: '1px solid ' + S.lavbd, color: S.lav, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              {t('common.go')}
            </button>
          </div>
        )}

        {/* Feature discovery tips */}
        {userId && showTips && (() => {
          const tips = [
            { id: 'explore', icon: <Search size={18} strokeWidth={1.5} style={{ color: S.p }} />, title: t('tips.explore_title'), desc: t('tips.explore_desc'), href: '/explore' },
            { id: 'naughtybook', icon: <BookOpen size={18} strokeWidth={1.5} style={{ color: S.sage }} />, title: t('tips.naughtybook_title'), desc: t('tips.naughtybook_desc'), href: '/contacts' },
            { id: 'ghost', icon: <Ghost size={18} strokeWidth={1.5} style={{ color: S.lav }} />, title: t('tips.ghost_title'), desc: t('tips.ghost_desc'), href: '/ghost/setup' },
          ].filter(tip => !dismissedTips.includes(tip.id))
          .filter(tip => !(tip.id === 'ghost' && isGhost))
          if (tips.length === 0) return null
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
        {latestHost && (
          <SessionInfoCard
            session={{ id: latestHost.id, title: latestHost.title, status: latestHost.status, approx_area: latestHost.approx_area, tags: latestHost.tags, cover_url: latestHost.cover_url, template_slug: latestHost.template_slug }}
            memberCount={latestHost.member_count ? latestHost.member_count - 1 : undefined}
            onClick={() => navigate('/session/' + latestHost.id)}
            label={t('home.your_session')}
            labelColor={S.p}
          />
        )}

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
                borderRadius: R.icon, color: S.tx, fontSize: 13, outline: 'none', fontFamily: fonts.body,
                letterSpacing: '-0.02em',
              }}
            />
            <button onClick={handleJoinCode} style={{
              padding: '10px 16px', borderRadius: R.icon, background: S.p, border: 'none',
              color: S.tx, fontWeight: 700, fontSize: 14, cursor: 'pointer',
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
              background: S.p, border: 'none', borderRadius: R.btn, color: S.tx,
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
              {[
                { label: 'Custom', slug: 'custom', color: S.p, bg: S.p2, border: S.pbd },
                ...sessionTemplates.slice(0, 3).map(tpl => {
                  const meta = (tpl.meta || {}) as Record<string, string>
                  const color = meta.color || S.tx2
                  return { label: tpl.label, slug: tpl.slug, color, bg: color + '18', border: color + '44' }
                }),
              ].slice(0, 4).map(tpl => (
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
            <button onClick={() => navigate('/login')} style={{
              position: 'relative', overflow: 'hidden', width: '100%', padding: 16,
              background: S.p, border: 'none', borderRadius: R.btn, color: S.tx,
              ...typeStyle('section'), cursor: 'pointer', boxShadow: `0 4px 24px ${S.pbd}`,
            }}>
              {t('home.login')}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />
            </button>
            <button onClick={() => navigate('/login?signup=1')} style={{
              width: '100%', padding: 14, borderRadius: R.btn, ...typeStyle('label'),
              color: S.tx2, border: `1px solid ${S.rule}`, background: 'transparent', cursor: 'pointer',
            }}>
              {t('home.create_account')}
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
    <GhostConvertModal open={showConvert} onClose={() => setShowConvert(false)} />
    </PageFadeIn>
  )
}
