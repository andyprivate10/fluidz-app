import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Lock } from 'lucide-react'
import { colors, fonts, glassCard, typeStyle, radius } from '../../brand'

const S = colors
const R = radius

export default function LandingHero({ scrollTo }: { scrollTo: (id: string) => void }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [inviteCode, setInviteCode] = useState('')

  function handleInvite() {
    const code = inviteCode.trim()
    if (!code) return
    const match = code.match(/\/join\/([A-Za-z0-9]+)/) || code.match(/^([A-Za-z0-9]+)$/)
    if (match) navigate('/join/' + match[1])
  }

  return (
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
  )
}
