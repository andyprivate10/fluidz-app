import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { Heart, X, Search, Plus } from 'lucide-react'
import { colors } from '../brand'

const S = colors

type LinkedProfile = { user_id: string; type: string }
type ProfileInfo = { id: string; display_name: string; avatar_url?: string }

type Props = {
  userId: string
  linkedProfiles: LinkedProfile[]
  onChange: (linked: LinkedProfile[]) => void
  readOnly?: boolean
}

const LINK_TYPES = ['couple', 'trio', 'group', 'poly'] as const

export default function LinkedProfiles({ userId, linkedProfiles, onChange, readOnly }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map())
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ProfileInfo[]>([])
  const [selectedType, setSelectedType] = useState<string>('couple')

  useEffect(() => {
    if (linkedProfiles.length === 0) return
    const ids = linkedProfiles.map(lp => lp.user_id)
    supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids).then(({ data }) => {
      const map = new Map<string, ProfileInfo>()
      for (const p of (data || [])) {
        map.set(p.id, { id: p.id, display_name: p.display_name, avatar_url: (p.profile_json as any)?.avatar_url })
      }
      setProfiles(map)
    })
  }, [linkedProfiles])

  async function searchProfiles(q: string) {
    if (q.length < 2) { setResults([]); return }
    const { data } = await supabase.from('user_profiles').select('id, display_name, profile_json').ilike('display_name', `%${q}%`).neq('id', userId).limit(8)
    setResults((data || []).map(p => ({ id: p.id, display_name: p.display_name, avatar_url: (p.profile_json as any)?.avatar_url })))
  }

  function addLink(targetId: string) {
    if (linkedProfiles.some(lp => lp.user_id === targetId)) return
    onChange([...linkedProfiles, { user_id: targetId, type: selectedType }])
    setShowPicker(false)
    setSearch('')
    setResults([])
  }

  function removeLink(targetId: string) {
    onChange(linkedProfiles.filter(lp => lp.user_id !== targetId))
  }

  if (readOnly && linkedProfiles.length === 0) return null

  return (
    <div>
      {/* Existing links */}
      {linkedProfiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: readOnly ? 0 : 10 }}>
          {linkedProfiles.map(lp => {
            const info = profiles.get(lp.user_id)
            const typeLabel = t(`profile.link_type_${lp.type}`)
            return (
              <div key={lp.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: S.p3, border: '1px solid ' + S.pbd }}>
                <Heart size={14} strokeWidth={1.5} style={{ color: S.p, flexShrink: 0 }} />
                <button type="button" onClick={() => navigate('/profile/' + lp.user_id)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  {info?.avatar_url ? (
                    <img src={info.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {(info?.display_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.tx, margin: 0 }}>{info?.display_name || '...'}</p>
                    <p style={{ fontSize: 10, color: S.p, margin: 0 }}>{typeLabel}</p>
                  </div>
                </button>
                {!readOnly && (
                  <button onClick={() => removeLink(lp.user_id)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      {!readOnly && (
        <>
          {!showPicker ? (
            <button onClick={() => setShowPicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1px dashed ' + S.pbd, background: 'transparent', color: S.p, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} strokeWidth={1.5} /> {t('profile.add_linked_profile')}
            </button>
          ) : (
            <div style={{ padding: 12, borderRadius: 14, background: S.bg2, border: '1px solid ' + S.rule }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {LINK_TYPES.map(lt => (
                  <button key={lt} onClick={() => setSelectedType(lt)} style={{
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: selectedType === lt ? S.p : 'transparent',
                    color: selectedType === lt ? '#fff' : S.tx3,
                    border: selectedType === lt ? 'none' : '1px solid ' + S.rule,
                  }}>
                    {t(`profile.link_type_${lt}`)}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: S.tx4 }} />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); searchProfiles(e.target.value) }}
                  placeholder={t('profile.search_to_link')}
                  style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 10, border: '1px solid ' + S.rule, background: S.bg1, color: S.tx, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {/* Results */}
              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, maxHeight: 160, overflowY: 'auto' }}>
                  {results.filter(r => !linkedProfiles.some(lp => lp.user_id === r.id)).map(r => (
                    <button key={r.id} onClick={() => addLink(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'transparent', border: '1px solid ' + S.rule, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{r.display_name[0]?.toUpperCase()}</div>
                      )}
                      <span style={{ fontSize: 13, color: S.tx, fontWeight: 600 }}>{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setShowPicker(false); setSearch(''); setResults([]) }} style={{ marginTop: 8, background: 'none', border: 'none', color: S.tx3, fontSize: 11, cursor: 'pointer' }}>{t('common.cancel')}</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
