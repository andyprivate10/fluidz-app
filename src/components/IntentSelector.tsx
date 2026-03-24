import { Lock } from 'lucide-react'
import { colors } from '../brand'
import { INTENTS, INTENT_CATEGORIES } from '../lib/intentTypes'
import { useTranslation } from 'react-i18next'

const S = colors

interface Props {
  selected: string[]
  onChange: (slugs: string[]) => void
  compact?: boolean
}

export default function IntentSelector({ selected, onChange, compact }: Props) {
  const { t } = useTranslation()

  const toggle = (slug: string) => {
    if (slug === 'not_interested') {
      onChange(selected.includes(slug) ? [] : ['not_interested'])
      return
    }
    const without = selected.filter(s => s !== 'not_interested')
    onChange(without.includes(slug) ? without.filter(s => s !== slug) : [...without, slug])
  }

  const chipSize = compact ? { fontSize: 11, padding: '3px 8px' } : { fontSize: 12, padding: '5px 12px' }
  const categories = INTENT_CATEGORIES.filter(c => c !== 'closure')

  return (
    <div>
      {categories.map(cat => {
        const items = INTENTS.filter(i => i.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat} style={{ marginBottom: compact ? 6 : 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.tx4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {t('intents.category_' + cat)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
              {items.map(intent => {
                const on = selected.includes(intent.slug)
                return (
                  <button key={intent.slug} onClick={() => toggle(intent.slug)} style={{
                    ...chipSize, borderRadius: 99, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid ' + (on ? intent.colorBd : S.rule),
                    background: on ? intent.colorBg : S.bg2,
                    color: on ? intent.color : S.tx3,
                    transition: 'all 0.15s ease',
                  }}>
                    {t('intents.' + intent.slug)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Divider + not_interested */}
      <div style={{ borderTop: '1px solid ' + S.rule, paddingTop: compact ? 6 : 10, marginTop: compact ? 4 : 8 }}>
        {(() => {
          const ni = INTENTS.find(i => i.slug === 'not_interested')!
          const on = selected.includes('not_interested')
          return (
            <button onClick={() => toggle('not_interested')} style={{
              ...chipSize, borderRadius: 99, fontWeight: 600, cursor: 'pointer',
              border: '1px solid ' + (on ? ni.colorBd : S.rule),
              background: on ? ni.colorBg : S.bg2,
              color: on ? ni.color : S.tx3,
            }}>
              {t('intents.not_interested')}
            </button>
          )
        })()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: compact ? 6 : 10 }}>
        <Lock size={11} strokeWidth={1.5} style={{ color: S.tx4 }} />
        <span style={{ fontSize: 11, color: S.tx4 }}>{t('intents.hidden_until_match')}</span>
      </div>
    </div>
  )
}
