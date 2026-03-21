import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { UserPlus, UserCheck, Star, Heart, Check } from 'lucide-react'
import { colors } from '../brand'

const S = colors

type RelationLevel = 'connaissance' | 'close' | 'favori'

const RELATIONS: { level: RelationLevel; label: string; icon: typeof UserPlus; color: string }[] = [
  { level: 'connaissance', label: 'Connaissance', icon: UserPlus, color: S.tx3 },
  { level: 'close', label: 'Close', icon: Heart, color: S.sage },
  { level: 'favori', label: 'Favori', icon: Star, color: S.p },
]

export default function AddContactButton({ targetUserId }: { targetUserId: string }) {
  const [currentRelation, setCurrentRelation] = useState<RelationLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id === targetUserId) { setLoading(false); return }
      setMyUserId(user.id)
      supabase.from('contacts')
        .select('relation_level')
        .eq('user_id', user.id)
        .eq('contact_user_id', targetUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCurrentRelation(data.relation_level as RelationLevel)
          setLoading(false)
        })
    })
  }, [targetUserId])

  async function setRelation(level: RelationLevel) {
    if (!myUserId) return
    if (currentRelation) {
      await supabase.from('contacts').update({ relation_level: level }).eq('user_id', myUserId).eq('contact_user_id', targetUserId)
    } else {
      await supabase.from('contacts').insert({ user_id: myUserId, contact_user_id: targetUserId, relation_level: level })
      // Log interaction
      await supabase.from('interaction_log').insert({ user_id: myUserId, target_user_id: targetUserId, type: 'added_contact', meta: { level } })
    }
    setCurrentRelation(level)
    setShowSelector(false)
    showToast(currentRelation ? 'Relation mise à jour' : 'Ajouté au carnet !', 'success')
  }

  async function removeFromContacts() {
    if (!myUserId) return
    await supabase.from('contacts').delete().eq('user_id', myUserId).eq('contact_user_id', targetUserId)
    setCurrentRelation(null)
    setShowSelector(false)
    showToast('Retiré du carnet', 'info')
  }

  if (loading || !myUserId) return null

  return (
    <div style={{ marginTop: 12, position: 'relative' }}>
      <button
        onClick={() => setShowSelector(!showSelector)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          border: '1px solid ' + (currentRelation ? S.sage + '44' : S.rule),
          background: currentRelation ? S.sage + '14' : S.bg2,
          color: currentRelation ? S.sage : S.tx3,
        }}
      >
        {currentRelation ? <UserCheck size={14} /> : <UserPlus size={14} />}
        {currentRelation ? RELATIONS.find(r => r.level === currentRelation)?.label || 'Contact' : 'Ajouter au carnet'}
      </button>

      {showSelector && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 50,
          background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 14,
          padding: 8, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {RELATIONS.map(r => {
            const Icon = r.icon
            const active = currentRelation === r.level
            return (
              <button key={r.level} onClick={() => setRelation(r.level)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? r.color + '18' : 'transparent',
                color: active ? r.color : S.tx2,
              }}>
                <Icon size={14} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                {active && <Check size={12} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />}
              </button>
            )
          })}
          {currentRelation && (
            <button onClick={removeFromContacts} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: 'transparent', color: S.red, marginTop: 4,
              borderTop: '1px solid ' + S.rule, paddingTop: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Retirer du carnet</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
