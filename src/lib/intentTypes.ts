import { colors } from '../brand'
const S = colors

export const INTENT_CATEGORIES = ['sexual', 'romantic', 'social', 'practical', 'closure'] as const
export type IntentCategory = typeof INTENT_CATEGORIES[number]

export type IntentType = {
  slug: string
  icon: string
  color: string
  colorBg: string
  colorBd: string
  category: IntentCategory
}

export const INTENTS: IntentType[] = [
  // Sexual
  { slug: 'session_adulte', icon: 'Flame', color: S.p, colorBg: S.p2, colorBd: S.pbd, category: 'sexual' },
  { slug: 'plan_regulier', icon: 'Repeat', color: '#E0887A', colorBg: 'rgba(224,136,122,0.10)', colorBd: 'rgba(224,136,122,0.25)', category: 'sexual' },
  { slug: 'kink_partner', icon: 'Zap', color: '#9080BA', colorBg: 'rgba(144,128,186,0.10)', colorBd: 'rgba(144,128,186,0.25)', category: 'sexual' },
  // Romantic
  { slug: 'date', icon: 'Heart', color: '#ED93B1', colorBg: 'rgba(237,147,177,0.10)', colorBd: 'rgba(237,147,177,0.25)', category: 'romantic' },
  { slug: 'relation_serieuse', icon: 'HeartHandshake', color: '#ED93B1', colorBg: 'rgba(237,147,177,0.10)', colorBd: 'rgba(237,147,177,0.25)', category: 'romantic' },
  { slug: 'couple_ouvert', icon: 'Users', color: '#ED93B1', colorBg: 'rgba(237,147,177,0.10)', colorBd: 'rgba(237,147,177,0.25)', category: 'romantic' },
  // Social
  { slug: 'amitie', icon: 'Smile', color: S.sage, colorBg: S.sagebg, colorBd: S.sagebd, category: 'social' },
  { slug: 'mentor_initiation', icon: 'GraduationCap', color: '#6BA888', colorBg: 'rgba(107,168,136,0.10)', colorBd: 'rgba(107,168,136,0.25)', category: 'social' },
  // Practical
  { slug: 'co_host', icon: 'Crown', color: '#C8A064', colorBg: 'rgba(200,160,100,0.10)', colorBd: 'rgba(200,160,100,0.25)', category: 'practical' },
  // Closure
  { slug: 'not_interested', icon: 'X', color: S.tx3, colorBg: S.bg2, colorBd: S.rule, category: 'closure' },
]
