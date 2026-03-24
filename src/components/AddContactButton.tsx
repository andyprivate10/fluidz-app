import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { UserPlus, UserCheck, Star, Heart, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'

const S = colors

type RelationLevel = 'connaissance' | 'close' | 'favori'

export default function AddContactButton({ targetUserId }: { targetUserId: string }) {
  const { t } = useTranslation()

  const RELATIONS: { level: RelationLevel; label: string; icon: typeof UserPlus; color: string }[] = [
    { level: 'connaissance', label: t('contacts.connaissance'), icon: UserPlus, color: S.tx3 },
    { level: 'close', label: t('contacts.close'), icon: Heart, color: S.sage },
    { level: 'favori', label: t('contacts.favori'), icon: Star, color: S.p },
  ]

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
      // Check mutual: does target have me?
      const { data: reverse } = await supabase.from('contacts').select('id').eq('user_id', targetUserId).eq('contact_user_id', myUserId).maybeSingle()
      if (reverse) {
        // Set mutual flag on both
        await supabase.from('contacts').update({ mutual: true }).eq('user_id', myUserId).eq('contact_user_id', targetUserId)
        await supabase.from('contacts').update({ mutual: true }).eq('user_id', targetUserId).eq('contact_user_id', myUserId)
      }
      // Notify target
      const { data: myProf } = await supabase.from('user_profiles').select('display_name').eq('id', myUserId).maybeSingle()
      await supabase.from('notifications').insert({
        user_id: targetUserId, type: 'naughtybook_added',
        title: (myProf?.display_name || t('common.someone')) + ' ' + t('naughtybook.added_you_notif'),
        href: '/contacts/' + myUserId,
      })
    }
    setCurrentRelation(level)
    setShowSelector(false)
    showToast(currentRelation ? t('contacts.relation_updated') : t('contacts.added_to_book'), 'success')
  }

  async function removeFromContacts() {
    if (!myUserId) return
    await supabase.from('contacts').delete().eq('user_id', myUserId).eq('contact_user_id', targetUserId)
    setCurrentRelation(null)
    setShowSelector(false)
    showToast(t('contacts.removed_from_book'), 'info')
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
        {currentRelation ? RELATIONS.find(r => r.level === currentRelation)?.label || 'Contact' : t('contacts.add_to_book')}
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('contacts.remove_from_book')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
