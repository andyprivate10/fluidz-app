import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { calculateVibeScore, vibeScoreBadge } from '../lib/vibeScore'
import type { VibeScoreData } from '../lib/vibeScore'
import { colors, fonts } from '../brand'
import PageFadeIn from '../components/PageFadeIn'
import OrbLayer from '../components/OrbLayer'

const S = colors

export default function VibeScorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<VibeScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    calculateVibeScore(user.id).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [user])

  if (!user) return null

  const badge = data ? vibeScoreBadge(data.score) : null

  const criteria = data ? [
    { key: 'reviews', label: t('vibe.reviews'), value: data.breakdown.reviews, max: 30, color: S.sage, desc: t('vibe.desc_reviews') },
    { key: 'participation', label: t('vibe.participation'), value: data.breakdown.participation, max: 20, color: S.p, desc: t('vibe.desc_participation') },
    { key: 'reliability', label: t('vibe.reliability'), value: data.breakdown.noReports, max: 15, color: S.blue, desc: t('vibe.desc_reliability') },
    { key: 'checkin', label: t('vibe.checkin_rate'), value: data.breakdown.checkInRate, max: 15, color: S.p, desc: t('vibe.desc_checkin') },
    { key: 'profile', label: t('vibe.profile_label'), value: data.breakdown.profileComplete, max: 10, color: S.tx2, desc: t('vibe.desc_profile') },
    { key: 'seniority', label: t('vibe.seniority'), value: data.breakdown.seniority, max: 10, color: S.tx2, desc: t('vibe.desc_seniority') },
  ] : []

  return (
    <PageFadeIn>
      <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />

        {/* Header */}
        <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx2, cursor: 'pointer', padding: 4 }}>
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: 0 }}>
              {t('vibe.menu_label')}
            </h1>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>{t('common.loading')}</div>
        ) : data && badge ? (
          <div style={{ padding: '24px 20px' }}>
            {/* Score display */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 48, fontWeight: 800, color: badge.color }}>
                <Zap size={36} strokeWidth={2} fill={badge.color} />
                {data.score}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: badge.color, background: badge.bg, padding: '4px 14px', borderRadius: 99 }}>
                  {data.label}
                </span>
              </div>
              <p style={{ fontSize: 12, color: S.tx3, marginTop: 12 }}>{t('vibe.page_subtitle')}</p>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {criteria.map(c => (
                <div key={c.key} style={{ background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.tx }}>{c.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.value}/{c.max}</span>
                  </div>
                  <div style={{ background: S.bg2, borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${(c.value / c.max) * 100}%`, background: c.color, height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>{c.desc}</p>
                </div>
              ))}
            </div>

            {/* How to improve */}
            <div style={{ marginTop: 24, background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: S.p, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('vibe.how_to_improve')}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 12, color: S.tx2 }}>{t('vibe.tip_participate')}</li>
                <li style={{ fontSize: 12, color: S.tx2 }}>{t('vibe.tip_checkin')}</li>
                <li style={{ fontSize: 12, color: S.tx2 }}>{t('vibe.tip_profile')}</li>
                <li style={{ fontSize: 12, color: S.tx2 }}>{t('vibe.tip_reviews')}</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </PageFadeIn>
  )
}
