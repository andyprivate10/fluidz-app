import { Check, Users, AlertCircle } from 'lucide-react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface GroupStepProps {
  mutualContacts: { id: string; name: string; avatar?: string }[]
  groupPartners: string[]
  setGroupPartners: React.Dispatch<React.SetStateAction<string[]>>
  onContinue: () => void
  onBack: () => void
}

export default function GroupStep({ mutualContacts, groupPartners, setGroupPartners, onContinue, onBack }: GroupStepProps) {
  const { t } = useTranslation()

  function togglePartner(id: string) {
    setGroupPartners(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 4px' }}>{t('session.group_apply')}</h2>
      <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 20px', lineHeight: 1.5 }}>{t('session.add_partners_desc')}</p>

      {mutualContacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <Users size={32} strokeWidth={1.5} style={{ color: S.tx4, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: S.tx2, margin: '0 0 6px' }}>{t('session.no_mutual_contacts')}</p>
          <p style={{ fontSize: 13, color: S.tx3, margin: 0, lineHeight: 1.5 }}>{t('session.no_mutual_contacts_desc')}</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
              {t('session.add_partners')}
            </p>
            {mutualContacts.map(c => {
              const selected = groupPartners.includes(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => togglePartner(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                    background: selected ? S.p2 : S.bg1,
                    border: '1px solid ' + (selected ? S.pbd : S.rule),
                    borderRadius: 14, marginBottom: 8, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {c.avatar ? (
                    <img src={c.avatar} alt="" loading="lazy" style={{ width: 36, height: 36, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + (selected ? S.pbd : S.rule) }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '28%', background: S.bg2, border: '2px solid ' + (selected ? S.pbd : S.rule), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.tx2 }}>
                      {c.name[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{c.name}</p>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: selected ? S.p : 'transparent',
                    border: '2px solid ' + (selected ? S.p : S.rule),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {selected && <Check size={14} strokeWidth={3} style={{ color: S.tx }} />}
                  </div>
                </div>
              )
            })}
          </div>

          {groupPartners.length > 0 && (
            <div style={{ padding: 12, background: S.p2, border: '1px solid ' + S.pbd, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} strokeWidth={2} style={{ color: S.p, flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: S.p, margin: 0 }}>{t('session.group_size', { count: groupPartners.length + 1 })}</p>
            </div>
          )}

          <div style={{ padding: 10, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={14} strokeWidth={2} style={{ color: S.tx3, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: S.tx3, margin: 0, lineHeight: 1.5 }}>{t('session.group_mutual_check')}</p>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: 14, borderRadius: 14, background: 'transparent',
          border: '1px solid ' + S.rule, color: S.tx2, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>{t('common.back')}</button>
        <button onClick={onContinue} style={{
          flex: 2, padding: 14, borderRadius: 14, background: S.p, border: 'none',
          color: S.tx, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px ' + S.pbd,
        }}>{t('common.continue')}</button>
      </div>
    </div>
  )
}
