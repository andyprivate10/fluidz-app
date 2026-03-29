import { useTranslation } from 'react-i18next'
import {
  Link2, Shield, Eye, Users, BookOpen, Clock, Star,
} from 'lucide-react'
import { colors, fonts, glassCard, typeStyle, radius } from '../../brand'

const S = colors
const R = radius
const MAX = 960

const features = [
  { icon: Link2, key: 'group_sessions' },
  { icon: Shield, key: 'privacy_first' },
  { icon: Eye, key: 'trust_based' },
  { icon: Users, key: 'realtime_chat' },
  { icon: BookOpen, key: 'selective_sharing' },
  { icon: Clock, key: 'instant_matching' },
]

interface RevealRef {
  (el: HTMLElement | null): void
}

export default function LandingFeatures({ rv }: { rv: RevealRef }) {
  const { t } = useTranslation()

  return (
    <>
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
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.p, marginBottom: 14 }}>{t('landing.problem_label')}</p>
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
      <section ref={rv} className="l-rv" style={{ padding: '40px 24px', maxWidth: 740, margin: '0 auto', position: 'relative' }}>
        <div style={{ ...glassCard, border: '1px solid ' + S.pbd, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.p, margin: '0 0 12px' }}>{t('landing.killer_1_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_1_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_1_desc')}</p>
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: '1px solid ' + S.rule }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ ...typeStyle('section'), color: S.tx, margin: 0 }}>Dark Room Bastille</p>
                <p style={{ ...typeStyle('meta'), color: S.tx2, margin: '4px 0 0' }}>Tonight, 11pm</p>
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
      <section ref={rv} className="l-rv" style={{ padding: '0 24px 40px', maxWidth: 740, margin: '0 auto', position: 'relative' }}>
        <div style={{ ...glassCard, border: '1px solid ' + S.sagebd, padding: 24 }}>
          <p style={{ ...typeStyle('micro'), color: S.sage, margin: '0 0 12px' }}>{t('landing.killer_2_label')}</p>
          <h2 style={{ ...typeStyle('title'), color: S.tx, margin: '0 0 10px', fontSize: 20 }}>{t('landing.killer_2_title')}</h2>
          <p style={{ ...typeStyle('body'), color: S.tx2, margin: '0 0 20px', lineHeight: 1.6 }}>{t('landing.killer_2_desc')}</p>
          <div style={{ background: S.bg2, borderRadius: R.block, padding: 16, border: '1px solid ' + S.rule }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '28%', background: S.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: S.tx }}>K</div>
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
      <section id="features" ref={rv} className="l-rv" style={{ padding: '120px 24px', maxWidth: MAX, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.sage, marginBottom: 14 }}>{t('landing.features_label')}</p>
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
    </>
  )
}
