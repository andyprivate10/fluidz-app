import { useTranslation } from 'react-i18next'
import { Phone, MapPin, Sliders, MessageSquare } from 'lucide-react'
import { colors, fonts, glassCard } from '../../brand'

const S = colors
const MAX = 960

const stepColors = [S.p, S.lav, S.sage, S.p]
const stepBgs = [S.p2, 'rgba(144,128,186,0.08)', 'rgba(107,168,136,0.08)', S.p2]
const stepBds = [S.pbd, 'rgba(144,128,186,0.18)', 'rgba(107,168,136,0.16)', S.pbd]

const diffs = [
  { icon: Phone, key: 'no_phone' },
  { icon: MapPin, key: 'address' },
  { icon: Sliders, key: 'profile' },
  { icon: MessageSquare, key: 'no_whatsapp' },
]

interface RevealRef {
  (el: HTMLElement | null): void
}

export default function LandingHowItWorks({ rv }: { rv: RevealRef }) {
  const { t } = useTranslation()

  return (
    <>
      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" ref={rv} className="l-rv" style={{ padding: '120px 24px', maxWidth: MAX, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.lav, marginBottom: 14 }}>{t('landing.how_it_works')}</p>
        <h2 style={{ fontFamily: fonts.hero, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
          {t('landing.how_title')}
        </h2>
        <p style={{ fontSize: 15, color: S.tx2, lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          {t('landing.how_subtitle')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
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
      <section ref={rv} className="l-rv" style={{ padding: '80px 24px', maxWidth: MAX, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.sage, marginBottom: 14, textAlign: 'center' }}>{t('landing.diff_label')}</p>
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
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.p, textAlign: 'center', marginBottom: 14 }}>{t('landing.preview_label')}</p>
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
              <div style={{ fontFamily: fonts.hero, fontSize: 14, fontWeight: 800, marginBottom: 5 }}>Dark Room Tonight</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 7, padding: '2px 6px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, color: S.sage, fontWeight: 700 }}>OPEN</span>
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
              <div style={{ fontSize: 8, color: S.tx2, lineHeight: 1.4 }}>Private session. PrEP required.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
