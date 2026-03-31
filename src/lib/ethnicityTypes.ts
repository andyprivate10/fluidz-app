export const ETHNICITY_REGIONS = ['all'] as const
export type EthnicityRegion = typeof ETHNICITY_REGIONS[number]

export type EthnicityType = {
  slug: string
  region: EthnicityRegion
}

export const ETHNICITIES: EthnicityType[] = [
  { slug: 'blanc', region: 'all' },
  { slug: 'noir', region: 'all' },
  { slug: 'maghrebin', region: 'all' },
  { slug: 'latino', region: 'all' },
  { slug: 'asiatique', region: 'all' },
  { slug: 'sud_asiatique', region: 'all' },
  { slug: 'moyen_oriental', region: 'all' },
  { slug: 'metis', region: 'all' },
  { slug: 'autochtone', region: 'all' },
  { slug: 'autre', region: 'all' },
]
