import { useState } from 'react'
import { colors } from '../brand'
import { useTranslation } from 'react-i18next'

const S = colors

interface Item {
  slug: string
  group: string
  color?: string
}

interface Props {
  items: Item[]
  groupLabels: Record<string, string>
  selected: string[]
  onChange: (slugs: string[]) => void
  getLabel: (slug: string) => string
  compact?: boolean
  maxVisible?: number
  mixedLabel?: string
  mixedThreshold?: number
}

export default function MultiChipSelector({ items, groupLabels, selected, onChange, getLabel, compact, maxVisible, mixedLabel, mixedThreshold = 2 }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const groups = [...new Set(items.map(i => i.group))]

  const toggle = (slug: string) => {
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug])
  }

  const chipSize = compact ? { fontSize: 11, padding: '3px 8px' } : { fontSize: 12, padding: '5px 12px' }

  const visibleItems = maxVisible && !expanded ? items.slice(0, maxVisible) : items
  const hiddenCount = maxVisible && !expanded ? Math.max(0, items.length - maxVisible) : 0
  const visibleSlugs = new Set(visibleItems.map(i => i.slug))

  return (
    <div>
      {mixedLabel && selected.length >= mixedThreshold && (
        <span style={{ display: 'inline-block', ...chipSize, borderRadius: 99, background: S.lavbg, color: S.lav, border: '1px solid ' + S.lavbd, fontWeight: 700, marginBottom: 8 }}>
          {mixedLabel}
        </span>
      )}
      {groups.map(group => {
        const groupItems = visibleItems.filter(i => i.group === group)
        if (groupItems.length === 0) return null
        return (
          <div key={group} style={{ marginBottom: compact ? 6 : 10 }}>
            {groupLabels[group] ? (
              <div style={{ fontSize: 10, fontWeight: 700, color: S.tx4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {groupLabels[group]}
              </div>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
              {groupItems.map(item => {
                const on = selected.includes(item.slug)
                const color = item.color || S.p
                return (
                  <button
                    key={item.slug}
                    onClick={() => toggle(item.slug)}
                    style={{
                      ...chipSize,
                      borderRadius: 99,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid ' + (on ? color + '66' : S.rule),
                      background: on ? color + '18' : S.bg2,
                      color: on ? color : S.tx3,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {getLabel(item.slug)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {hiddenCount > 0 && (
        <button onClick={() => setExpanded(true)} style={{ ...chipSize, borderRadius: 99, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx3, fontWeight: 600, cursor: 'pointer' }}>
          +{hiddenCount} {t('common.more') || 'more'}
        </button>
      )}
      {/* Show selected items from hidden groups */}
      {maxVisible && !expanded && selected.filter(s => !visibleSlugs.has(s)).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6, marginTop: 4 }}>
          {selected.filter(s => !visibleSlugs.has(s)).map(slug => {
            const item = items.find(i => i.slug === slug)
            const color = item?.color || S.p
            return (
              <button key={slug} onClick={() => toggle(slug)} style={{ ...chipSize, borderRadius: 99, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + color + '66', background: color + '18', color }}>
                {getLabel(slug)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
