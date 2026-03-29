import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, Menu, X } from 'lucide-react'
import { colors, fonts } from '../../brand'
import { setLanguage } from '../../i18n'

const S = colors

export default function LandingNav() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  function toggleLang() {
    const next = i18n.language === 'fr' ? 'en' : 'fr'
    setLanguage(next as 'en' | 'fr')
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const navLinks = [
    { label: t('landing.nav_features'), id: 'features' },
    { label: t('landing.nav_how'), id: 'how' },
    { label: t('landing.nav_pro'), id: 'pro', accent: true },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(5,4,10,0.72)', borderBottom: '1px solid ' + S.rule,
      }}>
        <span style={{ fontFamily: fonts.hero, fontSize: 22, fontWeight: 800, color: S.p, letterSpacing: '-0.04em', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>fluidz</span>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {navLinks.map(l => (
            <a key={l.id} onClick={() => scrollTo(l.id)} style={{
              fontSize: 12, fontWeight: 600, color: l.accent ? S.lav : S.tx3, cursor: 'pointer',
              transition: 'color .2s', display: 'var(--nav-link-display, none)',
            }}>{l.label}</a>
          ))}

          <button onClick={toggleLang} style={{
            background: 'transparent', border: '1px solid ' + S.rule2, color: S.tx3,
            fontSize: 10, padding: '5px 9px', borderRadius: 8, cursor: 'pointer',
            fontFamily: fonts.body, display: 'flex', alignItems: 'center', gap: 4,
          }}><Globe size={11} />{i18n.language.toUpperCase()}</button>

          <button onClick={() => navigate('/login')} style={{
            background: S.bg2, color: S.tx, border: '1px solid ' + S.rule2, fontSize: 12,
            fontWeight: 700, padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
            fontFamily: fonts.body, display: 'var(--nav-link-display, none)',
          }}>{t('landing.nav_open_app')}</button>

          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', color: S.tx, cursor: 'pointer', padding: 4,
            display: 'var(--nav-burger-display, flex)',
          }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, right: 0, bottom: 0, width: 260, zIndex: 99,
          background: S.bg1, borderLeft: '1px solid ' + S.rule, padding: '32px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
          animation: 'lFadeUp .25s ease both',
        }}>
          {navLinks.map(l => (
            <a key={l.id} onClick={() => scrollTo(l.id)} style={{
              fontSize: 16, fontWeight: 600, color: l.accent ? S.lav : S.tx2, cursor: 'pointer',
            }}>{l.label}</a>
          ))}
          <button onClick={() => { navigate('/login'); setMenuOpen(false) }} style={{
            padding: '14px 24px', borderRadius: 14, background: S.p, border: 'none',
            color: S.tx, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: fonts.body,
          }}>{t('landing.nav_open_app')}</button>
        </div>
      )}

      <style>{`
        :root{--nav-link-display:flex;--nav-burger-display:none}
        @media(max-width:768px){:root{--nav-link-display:none !important;--nav-burger-display:flex !important}}
      `}</style>
    </>
  )
}
