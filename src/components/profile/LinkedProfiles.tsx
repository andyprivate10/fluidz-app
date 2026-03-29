import { useState } from 'react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'
import { Plus, X, ExternalLink } from 'lucide-react'

const S = colors

const PLATFORMS = [
  { key: 'grindr', label: 'Grindr', color: '#FCC419' },
  { key: 'scruff', label: 'Scruff', color: '#F06543' },
  { key: 'recon', label: 'Recon', color: '#E03131' },
  { key: 'twitter', label: 'X / Twitter', color: '#1D9BF0' },
  { key: 'telegram', label: 'Telegram', color: '#26A5E4' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'other', label: 'Autre', color: S.tx3 },
]

export type LinkedProfile = { platform: string; handle: string }

interface Props {
  userId: string
  linkedProfiles: LinkedProfile[]
  onChange: (profiles: LinkedProfile[]) => void
  readOnly?: boolean
}

export default function LinkedProfiles({ linkedProfiles, onChange, readOnly }: Props) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [platform, setPlatform] = useState('')
  const [handle, setHandle] = useState('')

  function add() {
    if (!platform || !handle.trim()) return
    onChange([...linkedProfiles, { platform, handle: handle.trim() }])
    setPlatform('')
    setHandle('')
    setAdding(false)
  }

  function remove(idx: number) {
    onChange(linkedProfiles.filter((_, i) => i !== idx))
  }

  const getPlatformInfo = (key: string) => PLATFORMS.find(p => p.key === key) || { label: key, color: S.tx3 }

  // Read-only compact display
  if (readOnly) {
    if (linkedProfiles.length === 0) return null
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {linkedProfiles.map((lp, i) => {
          const info = getPlatformInfo(lp.platform)
          return (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              color: info.color, background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${info.color}33`,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <ExternalLink size={10} strokeWidth={1.5} />
              {info.label}: {lp.handle}
            </span>
          )
        })}
      </div>
    )
  }

  // Editable display
  return (
    <div>
      {linkedProfiles.map((lp, i) => {
        const info = getPlatformInfo(lp.platform)
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            padding: '8px 12px', borderRadius: 12, background: S.bg2, border: `1px solid ${S.rule}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: info.color, minWidth: 70 }}>{info.label}</span>
            <span style={{ fontSize: 13, color: S.tx, flex: 1 }}>{lp.handle}</span>
            <button onClick={() => remove(i)} style={{
              background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 2,
            }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )
      })}

      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={platform} onChange={e => setPlatform(e.target.value)}
            style={{
              width: '100%', background: S.bg2, color: S.tx, borderRadius: 12,
              padding: '10px 14px', border: `1px solid ${S.rule}`, outline: 'none',
              fontSize: 13, fontFamily: 'inherit',
            }}
          >
            <option value="">{t('profile.linked_choose_platform')}</option>
            {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <input
            value={handle} onChange={e => setHandle(e.target.value)}
            placeholder={t('profile.linked_handle_placeholder')}
            style={{
              width: '100%', background: S.bg2, color: S.tx, borderRadius: 12,
              padding: '10px 14px', border: `1px solid ${S.rule}`, outline: 'none',
              fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} disabled={!platform || !handle.trim()} style={{
              flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: platform && handle.trim() ? S.grad : S.bg2,
              color: platform && handle.trim() ? S.tx : S.tx4,
              border: 'none', cursor: platform && handle.trim() ? 'pointer' : 'not-allowed',
            }}>
              {t('common.save')}
            </button>
            <button onClick={() => { setAdding(false); setPlatform(''); setHandle('') }} style={{
              padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'transparent', color: S.tx3, border: `1px solid ${S.rule}`, cursor: 'pointer',
            }}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
          borderRadius: 12, fontSize: 12, fontWeight: 600, color: S.p,
          background: 'transparent', border: `1px dashed ${S.pbd}`, cursor: 'pointer', width: '100%',
          justifyContent: 'center',
        }}>
          <Plus size={14} strokeWidth={2} /> {t('profile.linked_add')}
        </button>
      )}
    </div>
  )
}
