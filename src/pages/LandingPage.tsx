import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { colors, radius, typeStyle, glassCard, fonts } from '../brand'
import { setLanguage } from '../i18n'
import {
  ArrowRight, Shield, Users, Lock, Eye, Star, Phone, MapPin, Sliders, MessageSquare,
  Link2, BookOpen, Clock, Menu, X, Globe, ChevronRight,
} from 'lucide-react'

const S = colors
const R = radius

/* ── CSS keyframes injected once ── */
const STYLE_ID = 'landing-kf'
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes lOrbDrift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(22px,-16px) scale(1.1)}66%{transform:translate(-14px,20px) scale(.92)}}
    @keyframes lOrbDrift2{0%,100%{transform:translate(0,0)}45%{transform:translate(-18px,14px) scale(1.08)}75%{transform:translate(15px,-10px)}}
    @keyframes lOrbDrift3{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,22px) scale(1.06)}}
    @keyframes lShimmer{0%{left:-180%}100%{left:200%}}
    @keyframes lFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    .l-rv{opacity:0;transform:translateY(24px);transition:opacity .7s,transform .7s}.l-rv.l-vis{opacity:1;transform:translateY(0)}
    .l-btn-shim{position:relative;overflow:hidden}
    .l-btn-shim::after{content:'';position:absolute;top:0;left:-180%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);animation:lShimmer 3s ease-in-out infinite}
  `
  document.head.appendChild(style)
}

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  const observed = useRef<Set<Element>>(new Set())
  const obs = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    obs.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('l-vis'); obs.current?.unobserve(e.target) } }),
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' },
    )
    observed.current.forEach(el => obs.current?.observe(el))
    return () => obs.current?.disconnect()
  }, [])

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el || observed.current.has(el)) return
    observed.current.add(el)
    obs.current?.observe(el)
  }, [])

  return ref
}

/* ── Feature / diff data ── */
const features = [
  { icon: Link2, key: 'group_sessions' },
  { icon: Shield, key: 'privacy_first' },
  { icon: Eye, key: 'trust_based' },
  { icon: Users, key: 'realtime_chat' },
  { icon: BookOpen, key: 'selective_sharing' },
  { icon: Clock, key: 'instant_matching' },
]
const diffs = [
  { icon: Phone, key: 'no_phone' },
  { icon: MapPin, key: 'address' },
  { icon: Sliders, key: 'profile' },
  { icon: MessageSquare, key: 'no_whatsapp' },
]

const stepColors = [S.p, S.lav, S.sage, S.p]
const stepBgs = [S.p2, 'rgba(144,128,186,0.08)', 'rgba(107,168,136,0.08)', S.p2]
const stepBds = [S.pbd, 'rgba(144,128,186,0.18)', 'rgba(107,168,136,0.16)', S.pbd]

/* ── Shared inline helpers ── */
const MAX = 960
const sectionStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '80px 24px', maxWidth: MAX, margin: '0 auto', position: 'relative', ...extra,
})
const labelStyle = (color: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 14,
})

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [inviteCode, setInviteCode] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const rv = useScrollReveal()

  useEffect(() => { injectKeyframes() }, [])

  function handleInvite() {
    const code = inviteCode.trim()
    if (!code) return
    const match = code.match(/\/join\/([A-Za-z0-9]+)/) || code.match(/^([A-Za-z0-9]+)$/)
    if (match) navigate('/join/' + match[1])
  }

  function toggleLang() {
    const next = i18n.language === 'fr' ? 'en' : 'fr'
    setLanguage(next as 'en' | 'fr')
  }

  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }

  const navLinks = [
    { label: t('landing.nav_features'), id: 'features' },
    { label: t('landing.nav_how'), id: 'how' },
    { label: t('landing.nav_pro'), id: 'pro' },
  ]

  return (
    <div style={{ background: S.bg, minHeight: '100vh', overflow: 'hidden', color: S.tx }}>

      {/* ═══ TOP BAR ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(5,4,10,0.72)', borderBottom: '1px solid ' + S.rule,
      }}>
        <span style={{ fontFamily: fonts.hero, fontSize: 22, fontWeight: 800, color: S.p, letterSpacing: '-0.04em', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>fluidz</span>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {navLinks.map(l => (
            <a key={l.id} onClick={() => scrollTo(l.id)} style={{
              fontSize: 12, fontWeight: 600, color: l.id === 'pro' ? S.lav : S.tx3, cursor: 'pointer',
              transition: 'color .2s', display: 'var(--nav-link-display, none)',
            }}>{l.label}</a>
          ))}

          {/* Lang toggle */}
          <button onClick={toggleLang} style={{
            background: 'transparent', border: '1px solid ' + S.rule2, color: S.tx3,
            fontSize: 10, padding: '5px 9px', borderRadius: 8, cursor: 'pointer',
            fontFamily: fonts.body, display: 'flex', alignItems: 'center', gap: 4,
          }}><Globe size={11} />{i18n.language.toUpperCase()}</button>

          {/* Open App */}
          <button onClick={() => navigate('/login')} style={{
            background: S.bg2, color: S.tx, border: '1px solid ' + S.rule2, fontSize: 12,
            fontWeight: 700, padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
            fontFamily: fonts.body, display: 'var(--nav-link-display, none)',
          }}>{t('landing.nav_open_app')}</button>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', color: S.tx, cursor: 'pointer', padding: 4,
            display: 'var(--nav-burger-display, flex)',
          }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, right: 0, bottom: 0, width: 260, zIndex: 99,
          background: S.bg1, borderLeft: '1px solid ' + S.rule, padding: '32px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
          animation: 'lFadeUp .25s ease both',
        }}>
          {navLinks.map(l => (
            <a key={l.id} onClick={() => scrollTo(l.id)} style={{
              fontSize: 16, fontWeight: 600, color: l.id === 'pro' ? S.lav : S.tx2, cursor: 'pointer',
            }}>{l.label}</a>
          ))}
          <button onClick={() => { navigate('/login'); setMenuOpen(false) }} style={{
            padding: '14px 24px', borderRadius: 14, background: S.p, border: 'none',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: fonts.body,
          }}>{t('landing.nav_open_app')}</button>
        </div>
      )}

      {/* Responsive media queries via inline style tag */}
      <style>{`
        :root{--nav-link-display:flex;--nav-burger-display:none}
        @media(max-width:768px){:root{--nav-link-display:none !important;--nav-burger-display:flex !important}}
      `}</style>

      {/* ═══ HERO ═══ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', position: 'relative', padding: '120px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(224,136,122,0.10)', top: -120, right: -160, filter: 'blur(60px)', pointerEvents: 'none', animation: 'lOrbDrift1 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(144,128,186,0.07)', bottom: -80, left: -140, filter: 'blur(60px)', pointerEvents: 'none', animation: 'lOrbDrift2 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(107,168,136,0.05)', top: '35%', left: '55%', filter: 'blur(60px)', pointerEvents: 'none', animation: 'lOrbDrift3 17s ease-in-out infinite' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
            borderRadius: 99, border: '1px solid ' + S.pbd, background: S.p2,
            fontSize: 12, fontWeight: 600, color: S.p, marginBottom: 36,
            animation: 'lFadeUp .6s ease both',
          }}>
            <Lock size={14} style={{ opacity: 0.7 }} />
            {t('landing.badge_invite_only')}
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: fonts.hero, fontSize: 'clamp(44px,9vw,78px)', fontWeight: 800,
            letterSpacing: '-0.05em', lineHeight: 0.9, margin: '0 0 16px',
            animation: 'lFadeUp .6s .1s ease both',
          }}>
            {t('landing.hero_title')}<br />
            <em style={{
              fontStyle: 'normal', color: S.p, textShadow: '0 0 60px rgba(224,136,122,0.3)',
              position: 'relative',
            }}>
              {t('landing.hero_title_em')}
              <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: S.p, borderRadius: 2, opacity: 0.5 }} />
            </em>
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: fonts.hero, fontSize: 'clamp(16px,3vw,22px)', fontWeight: 700,
            color: S.tx2, letterSpacing: '-0.03em', margin: '0 0 28px',
            animation: 'lFadeUp .6s .15s ease both',
          }}>
            {t('landing.hero_tagline').split('fluidz').map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 && <span style={{ color: S.p }}>fluidz</span>}</span>
            ))}
          </p>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(14px,2vw,17px)', color: S.tx2, maxWidth: 500,
            lineHeight: 1.65, margin: '0 auto 40px',
            animation: 'lFadeUp .6s .2s ease both',
          }}>
            {t('landing.hero_desc')}
          </p>

          {/* Invite code card */}
          <div style={{
            ...glassCard, border: '1px solid ' + S.pbd, padding: 20, marginBottom: 32,
            maxWidth: 440, marginLeft: 'auto', marginRight: 'auto',
            animation: 'lFadeUp .6s .25s ease both',
          }}>
            <p style={{ ...typeStyle('label'), color: S.p, margin: '0 0 12px' }}>{t('landing.have_invite')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                placeholder={t('landing.invite_placeholder')}
                style={{
                  flex: 1, background: S.bg2, color: S.tx, borderRadius: R.chip,
                  padding: '12px 14px', border: '1px solid ' + S.rule, outline: 'none',
                  fontSize: 14, fontFamily: fonts.body,
                }}
              />
              <button onClick={handleInvite} style={{
                padding: '12px 20px', borderRadius: R.chip, background: S.p,
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 2px 12px ' + S.pbd,
              }}>{t('landing.join')}</button>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', animation: 'lFadeUp .6s .3s ease both' }}>
            <button onClick={() => navigate('/login?signup=1')} className="l-btn-shim" style={{
              padding: '15px 36px', borderRadius: 16, background: S.p, border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body,
              boxShadow: '0 4px 20px rgba(224,136,122,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {t('landing.cta_request_access')} <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTo('how')} style={{
              padding: '15px 36px', borderRadius: 16, background: 'transparent',
              border: '1px solid ' + S.rule2, color: S.tx, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: fonts.body,
            }}>{t('landing.cta_see_how')}</button>
          </div>
        </div>
      </section>

      {/* ═══ PHILOSOPHY ═══ */}
      <section ref={rv} className="l-rv" style={{ textAlign: 'center', padding: '100px 24px', maxWidth: MAX, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 60, background: `linear-gradient(180deg, transparent, ${S.p}, transparent)` }} />
        <blockquote style={{
          fontFamily: fonts.hero, fontSize: 'clamp(20px,4vw,32px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.25, maxWidth: 640, margin: '0 auto 24px',
        }} dangerouslySetInnerHTML={{ __html: t('landing.philosophy_quote') }} />
        <p style={{ fontSize: 14, color: S.tx2, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          {t('landing.philosophy_body')}
        </p>
      </section>

      {/* ═══ PROBLEM ═══ */}
      <section style={{ padding: '80px 24px', maxWidth: 740, margin: '0 auto' }}>
        <div ref={rv} className="l-rv" style={{
          background: S.bg1, border: '1px solid ' + S.pbd, borderRadius: 24, padding: '40px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,136,122,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <p style={labelStyle(S.p)}>{t('landing.problem_label')}</p>
          <h2 style={{
            fontFamily: fonts.hero, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20,
          }} dangerouslySetInnerHTML={{ __html: t('landing.problem_title') }} />
          <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.7, marginBottom: 24 }}>
            {t('landing.problem_desc')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { x: true, strong: 'problem_wa', desc: 'problem_wa_desc' },
              { x: false, strong: 'problem_fluidz', desc: 'problem_fluidz_desc' },
              { x: true, strong: 'problem_awkward', desc: 'problem_awkward_desc' },
              { x: false, strong: 'problem_structure', desc: 'problem_structure_desc' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14,
                borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid ' + S.rule,
              }}>
                <span style={{ color: item.x ? '#F87171' : S.sage, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                  {item.x ? '\u2715' : '\u2192'}
                </span>
                <div>
                  <strong style={{ color: S.tx, fontWeight: 600 }}>{t(`landing.${item.strong}`)}</strong>
                  <p style={{ fontSize: 12, color: S.tx2, lineHeight: 1.5, margin: '4px 0 0' }}>{t(`landing.${item.desc}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ KILLER FEATURE 1 — Sessions ═══ */}
      <section ref={rv} className="l-rv" style={sectionStyle({ paddingTop: 40, paddingBottom: 40, maxWidth: 740 })}>
        <div style={{ ...glassCard, border: '1px solid ' + S.pbd, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 12px' }}>{t('landing.killer_1_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_1_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_1_desc')}</p>
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: '1px solid ' + S.rule }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>Dark Room Bastille</p>
                <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '4px 0 0' }}>Ce soir, 23h</p>
              </div>
              <div style={{ display: 'flex' }}>
                {['#E0887A', '#9080BA', '#6BA888'].map((c, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%', background: c,
                    border: '2px solid ' + S.bg2, marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: 3 - i,
                  }} />
                ))}
              </div>
            </div>
            <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '0 0 10px' }}>{t('landing.members', { count: 4 })}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['tag_private', 'tag_vote', 'tag_address'].map(k => (
                <span key={k} style={{
                  ...typeStyle('meta'), color: S.p, background: S.p3, border: '1px solid ' + S.pbd,
                  borderRadius: R.chip, padding: '4px 8px',
                }}>{t(`landing.${k}`)}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KILLER FEATURE 2 — VibeScore ═══ */}
      <section ref={rv} className="l-rv" style={sectionStyle({ paddingTop: 0, paddingBottom: 40, maxWidth: 740 })}>
        <div style={{ ...glassCard, border: '1px solid ' + S.sagebd, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 12px' }}>{t('landing.killer_2_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_2_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_2_desc')}</p>
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: '1px solid ' + S.rule }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>K</div>
              <div>
                <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>Karim</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {[1, 2, 3, 4].map(i => <Star key={i} size={12} fill={S.sage} strokeWidth={0} style={{ color: S.sage }} />)}
                  <Star size={12} fill="none" strokeWidth={1.5} style={{ color: S.sage }} />
                  <span style={{ ...typeStyle('meta'), color: S.tx2, marginLeft: 4 }}>4.2</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ ...typeStyle('meta'), color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd, borderRadius: R.chip, padding: '4px 8px' }}>{t('landing.vibe_respectful')}</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div><p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>Sessions</p><p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>12</p></div>
              <div><p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>Vibe</p><p style={{ ...typeStyle('label'), color: S.sage, margin: 0 }}>4.2</p></div>
              <div><p style={{ ...typeStyle('micro'), color: S.tx3, margin: '0 0 2px' }}>{t('landing.reliability')}</p><p style={{ ...typeStyle('label'), color: S.tx, margin: 0 }}>96%</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section id="features" ref={rv} className="l-rv" style={sectionStyle()}>
        <p style={labelStyle(S.sage)}>{t('landing.features_label')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
          {t('landing.features_title')}
        </h2>
        <p style={{ fontSize: 15, color: S.tx2, lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          {t('landing.features_subtitle')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {features.map(({ icon: Icon, key }, idx) => {
            const accent = idx % 3 === 0 ? S.p : idx % 3 === 1 ? S.lav : S.sage
            const bg = idx % 3 === 0 ? S.p2 : idx % 3 === 1 ? 'rgba(144,128,186,0.08)' : S.sagebg
            const bd = idx % 3 === 0 ? S.pbd : idx % 3 === 1 ? 'rgba(144,128,186,0.18)' : S.sagebd
            return (
              <div key={key} style={{
                background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 20,
                padding: '28px 24px', transition: 'border-color .3s, transform .3s',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: bg, border: '1px solid ' + bd }}>
                  <Icon size={22} strokeWidth={1.5} style={{ color: accent }} />
                </div>
                <h3 style={{ fontFamily: fonts.hero, fontSize: 16, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>{t(`landing.feat_${key}`)}</h3>
                <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{t(`landing.feat_${key}_desc`)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" ref={rv} className="l-rv" style={sectionStyle()}>
        <p style={labelStyle(S.lav)}>{t('landing.how_it_works')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
          {t('landing.how_title')}
        </h2>
        <p style={{ fontSize: 15, color: S.tx2, lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          {t('landing.how_subtitle')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 23, top: 28, bottom: 28, width: 2, background: `linear-gradient(180deg, ${S.p}, ${S.lav}, ${S.sage}, ${S.p})` }} />
          {[1, 2, 3, 4].map(step => (
            <div key={step} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 0' }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fonts.hero, fontWeight: 800, fontSize: 16, flexShrink: 0, zIndex: 1,
                background: stepBgs[step - 1], border: '1.5px solid ' + stepBds[step - 1], color: stepColors[step - 1],
              }}>{step}</div>
              <div>
                <h3 style={{ fontFamily: fonts.hero, fontSize: 16, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>{t(`landing.step_${step}`)}</h3>
                <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{t(`landing.step_${step}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DIFFERENTIATORS ═══ */}
      <section ref={rv} className="l-rv" style={sectionStyle()}>
        <p style={{ ...labelStyle(S.sage), textAlign: 'center' }}>{t('landing.diff_label')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, maxWidth: 740, margin: '0 auto' }}>
          {diffs.map(({ icon: Icon, key }) => (
            <div key={key} style={{
              ...glassCard, padding: '20px 16px', border: '1px solid ' + S.sagebd,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: S.sagebg, border: '1px solid ' + S.sagebd, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.5} style={{ color: S.sage }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{t(`landing.diff_${key}`)}</p>
                <p style={{ fontSize: 11, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{t(`landing.diff_${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ APP PREVIEW ═══ */}
      <section ref={rv} className="l-rv" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ ...labelStyle(S.p), textAlign: 'center' }}>{t('landing.preview_label')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 auto 8px' }}>
          {t('landing.preview_title')}
        </h2>
        <p style={{ color: S.tx2, fontSize: 14, textAlign: 'center', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {t('landing.preview_desc')}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Phone 1 — Profile */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ width: 80, height: 6, borderRadius: '0 0 8px 8px', background: S.bg, margin: '0 auto', position: 'relative', zIndex: 2 }} />
            <div style={{ background: S.bg1, border: '1px solid ' + S.rule2, borderRadius: 24, overflow: 'hidden', minHeight: 300, position: 'relative', padding: '14px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: fonts.hero, fontSize: 16, fontWeight: 800 }}>Marcus</span>
                <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 99, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontWeight: 700 }}>Profil</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: fonts.hero }}>41</span>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage }}>Starter</span>
              </div>
              {['Reviews', 'Trust', 'Profile'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 7, color: S.tx3, marginBottom: 3 }}>
                  <span style={{ width: 30 }}>{label}</span>
                  <div style={{ flex: 1, height: 2, borderRadius: 1, background: S.rule, overflow: 'hidden' }}>
                    <div style={{ width: [50, 100, 80][i] + '%', height: '100%', background: [S.sage, '#7DD3FC', S.p][i], borderRadius: 1 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                <div style={{ width: 34, height: 42, borderRadius: 6, background: S.bg3, border: '1px solid ' + S.rule }} />
                <div style={{ width: 34, height: 42, borderRadius: 6, background: S.bg3, border: '1px solid ' + S.rule }} />
                <div style={{ width: 34, height: 42, borderRadius: 6, border: '1px dashed ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: S.p }}>+</div>
              </div>
            </div>
          </div>
          {/* Phone 2 — Session */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ width: 80, height: 6, borderRadius: '0 0 8px 8px', background: S.bg, margin: '0 auto', position: 'relative', zIndex: 2 }} />
            <div style={{ background: S.bg1, border: '1px solid ' + S.rule2, borderRadius: 24, overflow: 'hidden', minHeight: 300, position: 'relative', padding: '14px 12px' }}>
              <div style={{ fontFamily: fonts.hero, fontSize: 14, fontWeight: 800, marginBottom: 5 }}>Dark Room ce soir</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, fontWeight: 700 }}>OUVERTE</span>
                <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: S.rule, color: S.tx3, fontWeight: 600 }}>5</span>
              </div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                {['Dark Room', 'Top', 'Bottom'].map(tag => (
                  <span key={tag} style={{ fontSize: 6, padding: '2px 6px', borderRadius: 99, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', marginBottom: 10 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: S.bg3, border: '2px solid ' + S.bg1, marginLeft: i > 0 ? -5 : 0 }} />
                ))}
              </div>
              <div style={{ height: 1, background: S.rule, margin: '6px 0' }} />
              <div style={{ fontSize: 8, color: S.tx2, lineHeight: 1.4 }}>Session privee. PrEP obligatoire.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRO SECTION ═══ */}
      <section id="pro" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div ref={rv} className="l-rv" style={{
          maxWidth: 700, margin: '0 auto', background: S.bg1, border: '1px solid rgba(144,128,186,0.18)',
          borderRadius: 24, padding: '40px 32px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(144,128,186,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
            borderRadius: 99, background: 'rgba(144,128,186,0.08)', border: '1px solid rgba(144,128,186,0.18)',
            fontSize: 11, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 16,
          }}>{t('landing.pro_badge')}</div>
          <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, letterSpacing: '-0.04em', textAlign: 'center', margin: '0 auto 12px' }}>
            {t('landing.pro_title')}
          </h2>
          <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 24px' }}>
            {t('landing.pro_desc')}
          </p>
          <button onClick={() => navigate('/login')} className="l-btn-shim" style={{
            padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: '#fff', background: S.lav, border: 'none', cursor: 'pointer',
            fontFamily: fonts.body, display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(144,128,186,0.3)',
          }}>
            {t('landing.pro_cta')} <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* ═══ VISION ═══ */}
      <section ref={rv} className="l-rv" style={{ textAlign: 'center', padding: '60px 24px 80px', maxWidth: MAX, margin: '0 auto' }}>
        <blockquote style={{
          fontFamily: fonts.hero, fontSize: 'clamp(20px,4vw,32px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.25, maxWidth: 640, margin: '0 auto 24px',
        }} dangerouslySetInnerHTML={{ __html: t('landing.vision_quote') }} />
        <p style={{ fontSize: 14, color: S.tx2, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          {t('landing.vision_body')}
        </p>
      </section>

      {/* ═══ EARLY ACCESS ═══ */}
      <section ref={rv} className="l-rv" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ ...labelStyle(S.p), textAlign: 'center' }}>{t('landing.early_label')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 auto 12px' }}>
          {t('landing.early_title')}
        </h2>
        <p style={{ color: S.tx2, fontSize: 14, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
          {t('landing.early_desc')}
        </p>
        <button onClick={() => navigate('/login?signup=1')} className="l-btn-shim" style={{
          padding: '15px 36px', borderRadius: 16, background: S.p, border: 'none',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body,
          boxShadow: '0 4px 20px rgba(224,136,122,0.3)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {t('landing.early_cta')} <ArrowRight size={16} />
        </button>
        <p style={{ fontSize: 11, color: S.tx3, marginTop: 12, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          {t('landing.no_ads')}
        </p>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '48px 24px 32px', borderTop: '1px solid ' + S.rule, maxWidth: MAX, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: fonts.hero, fontSize: 18, fontWeight: 800, color: S.p, marginBottom: 8 }}>fluidz</div>
            <p style={{ fontSize: 12, color: S.tx3, maxWidth: 260, lineHeight: 1.6 }}>
              {t('landing.footer')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_product')}</h4>
              <a onClick={() => scrollTo('features')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_features')}</a>
              <a onClick={() => scrollTo('how')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_how')}</a>
              <a onClick={() => scrollTo('pro')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_pro')}</a>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_app')}</h4>
              <a onClick={() => navigate('/login')} style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_open_app')}</a>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.tx3, marginBottom: 12 }}>{t('landing.footer_legal')}</h4>
              <a style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_privacy')}</a>
              <a style={{ display: 'block', fontSize: 13, color: S.tx2, marginBottom: 8, cursor: 'pointer' }}>{t('landing.footer_terms')}</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid ' + S.rule }}>
          <p style={{ fontSize: 11, color: S.tx3 }}>&copy; 2026 Fluidz &middot; {t('landing.footer_copy')}</p>
        </div>
      </footer>
    </div>
  )
}
