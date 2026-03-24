import { Check, Eye, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface Props {
  displayName: string
  avatarUrl: string
  age: string
  role: string
  bio: string
  height: string
  weight: string
  morphology: string
  kinks: string[]
  profileViews: number
  contactRequests: number
}

export default function MeProfileCompleteness({
  displayName, avatarUrl, age, role, bio,
  height, weight, morphology, kinks,
  profileViews, contactRequests,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const checks = [
    { label: t('profile.step_pseudo'), done: !!displayName && displayName !== 'Anonymous' },
    { label: t('profile.step_photo'), done: !!avatarUrl },
    { label: t('profile.step_age'), done: !!age },
    { label: t('profile.step_role'), done: !!role },
    { label: t('profile.step_bio'), done: !!bio },
    { label: t('profile.step_physique'), done: !!height || !!weight || !!morphology },
    { label: t('profile.step_pratiques'), done: kinks.length > 0 },
  ]
  const done = checks.filter(c => c.done).length
  const pct = Math.round((done / checks.length) * 100)

  return (
    <>
      {/* Profile views */}
      {profileViews > 0 && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: S.tx2 }}><Eye size={12} strokeWidth={1.5} style={{ marginRight: 3 }} /> Vu par <strong style={{ color: S.tx }}>{profileViews}</strong> personne{profileViews > 1 ? 's' : ''} cette semaine</span>
        </div>
      )}

      {/* Contact requests */}
      {contactRequests > 0 && (
        <button onClick={() => navigate('/notifications')} style={{ width: '100%', marginBottom: 12, padding: '12px 14px', background: S.p2, border: '1px solid ' + S.pbd, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: S.p, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={13} strokeWidth={1.5} /> {contactRequests} personne{contactRequests > 1 ? 's' : ''} s'intéresse{contactRequests > 1 ? 'nt' : ''} à toi</span>
          <span style={{ fontSize: 11, color: S.tx2 }}>{t('common.view_arrow')}</span>
        </button>
      )}

      {/* Profile completeness */}
      <div style={{ marginBottom: 16, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid ' + S.rule2, borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2 }}>{t('profile.completion_label', { pct })}</span>
          <span style={{ fontSize: 11, color: pct === 100 ? S.sage : S.p, fontWeight: 600 }}>{done}/{checks.length}</span>
        </div>
        <div style={{ background: S.bg2, borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, background: pct === 100 ? S.sage : 'linear-gradient(90deg,' + S.p + ',' + S.pDark + ')', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: c.done ? S.sagebg : S.bg2, color: c.done ? S.sage : S.tx3, fontWeight: 600, border: '1px solid ' + (c.done ? S.sagebd : S.rule) }}>
              {c.done ? <Check size={11} strokeWidth={2.5} style={{ display: 'inline', color: S.sage }} /> : <span style={{ opacity: 0.3 }}>&#9675;</span>} {c.label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
