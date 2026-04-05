import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'
import { Calendar, User, BookOpen, Rocket } from 'lucide-react'

const S = colors

const screens = [
  { icon: Calendar, color: S.p, key: 'sessions' },
  { icon: User, color: S.lav, key: 'profile' },
  { icon: BookOpen, color: S.sage, key: 'contacts_section' },
  { icon: Rocket, color: S.p, key: 'ready' },
] as const

export default function WelcomeTutorial() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Redirect logic on mount
  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }

    supabase
      .from('user_profiles')
      .select('profile_json')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const pj = (data?.profile_json || {}) as Record<string, unknown>
        if (pj.onboarding_complete === true) navigate('/home')
      })
  }, [user, loading, navigate])

  const handleFinish = async () => {
    if (!user || saving) return
    setSaving(true)
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('profile_json')
      .eq('id', user.id)
      .maybeSingle()
    const pj = (existing?.profile_json || {}) as Record<string, unknown>
    await supabase.from('user_profiles').upsert({
      id: user.id,
      profile_json: { ...pj, onboarding_complete: true },
    })
    navigate('/home')
  }

  const handleSkip = () => {
    handleFinish()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 60) {
      if (diff > 0 && current < screens.length - 1) setCurrent(current + 1)
      if (diff < 0 && current > 0) setCurrent(current - 1)
    }
  }

  if (loading) return null

  const screen = screens[current]
  const Icon = screen.icon

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: S.bg,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <OrbLayer />

      {/* Skip button — screens 1-3 only */}
      {current < 3 && (
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: S.tx2,
            fontSize: 14,
            fontFamily: fonts.body,
            cursor: 'pointer',
            zIndex: 10,
            padding: '8px 12px',
          }}
        >
          {t('welcome.skip')}
        </button>
      )}

      {/* Content */}
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <Icon size={48} color={screen.color} style={{ marginBottom: 24 }} />

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: fonts.hero,
            color: S.tx,
            letterSpacing: '-0.03em',
            margin: '0 0 12px',
          }}
        >
          {t(`welcome.${screen.key}_title`)}
        </h1>

        <p
          style={{
            fontSize: 14,
            fontFamily: fonts.body,
            color: S.tx2,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {t(`welcome.${screen.key}_desc`)}
        </p>

        {/* Screen 4 button */}
        {current === 3 && (
          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              marginTop: 32,
              padding: '14px 40px',
              background: `linear-gradient(135deg, ${S.p}, #c06868)`,
              border: 'none',
              borderRadius: 16,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: fonts.body,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {t('welcome.go_button')}
          </button>
        )}
      </div>

      {/* Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          zIndex: 2,
        }}
      >
        {screens.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? S.p : S.tx4,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  )
}
