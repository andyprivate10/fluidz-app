import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
      border: active ? 'none' : `1px solid ${S.rule}`,
      background: active ? S.grad : S.bg2,
      color: active ? S.tx : S.tx3,
      cursor: 'pointer', transition: 'all 0.15s',
      boxShadow: active ? `0 2px 12px ${S.p}44` : 'none',
    }}>
      {label}
    </button>
  )
}

interface MePreferencesProps {
  roles: { label: string }[]
  kinkOptions: { label: string }[]
  morphologies: { label: string }[]
  prefRoles: string[]
  setPrefRoles: (v: string[]) => void
  prefAgeMin: string
  setPrefAgeMin: (v: string) => void
  prefAgeMax: string
  setPrefAgeMax: (v: string) => void
  prefKinks: string[]
  setPrefKinks: (v: string[]) => void
  prefMorphologies: string[]
  setPrefMorphologies: (v: string[]) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: S.bg2, color: S.tx, borderRadius: 14,
  padding: '12px 16px', border: `1px solid ${S.rule}`, outline: 'none',
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function MePreferences({
  roles, kinkOptions, morphologies,
  prefRoles, setPrefRoles,
  prefAgeMin, setPrefAgeMin,
  prefAgeMax, setPrefAgeMax,
  prefKinks, setPrefKinks,
  prefMorphologies, setPrefMorphologies,
}: MePreferencesProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  function togglePrefRole(r: string) {
    setPrefRoles(prefRoles.includes(r) ? prefRoles.filter(x => x !== r) : [...prefRoles, r])
  }

  function togglePrefKink(k: string) {
    setPrefKinks(prefKinks.includes(k) ? prefKinks.filter(x => x !== k) : [...prefKinks, k])
  }

  function togglePrefMorphology(m: string) {
    setPrefMorphologies(prefMorphologies.includes(m) ? prefMorphologies.filter(x => x !== m) : [...prefMorphologies, m])
  }

  return (
    <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, border: `1px solid ${S.rule2}`, marginBottom: 12, overflow: 'hidden' }}>
      {/* Header - lavender */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('me.my_preferences')}
        </span>
        {open ? <ChevronUp size={14} style={{ color: S.lav }} /> : <ChevronDown size={14} style={{ color: S.lav }} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>{t('me.preferences_desc')}</p>

          {/* Preferred roles */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.lav, display: 'block', marginBottom: 6 }}>{t('me.preferred_roles')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map(r => (
                <Chip key={r.label} label={r.label} active={prefRoles.includes(r.label)} onClick={() => togglePrefRole(r.label)} />
              ))}
            </div>
          </div>

          {/* Age range */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.lav, display: 'block', marginBottom: 6 }}>{t('me.age_range')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={prefAgeMin} onChange={e => setPrefAgeMin(e.target.value)} placeholder="Min" type="number" style={inputStyle} />
              <input value={prefAgeMax} onChange={e => setPrefAgeMax(e.target.value)} placeholder="Max" type="number" style={inputStyle} />
            </div>
          </div>

          {/* Preferred kinks */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.lav, display: 'block', marginBottom: 6 }}>{t('me.preferred_kinks')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {kinkOptions.map(k => (
                <Chip key={k.label} label={k.label} active={prefKinks.includes(k.label)} onClick={() => togglePrefKink(k.label)} />
              ))}
            </div>
          </div>

          {/* Preferred morphologies */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.lav, display: 'block', marginBottom: 6 }}>{t('me.preferred_morphologies')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {morphologies.map(m => (
                <Chip key={m.label} label={m.label} active={prefMorphologies.includes(m.label)} onClick={() => togglePrefMorphology(m.label)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
