export const ETHNICITY_REGIONS = ['european','middle_east_north_africa','sub_saharan_africa','caribbean_diaspora','americas','asia','oceania'] as const
export type EthnicityRegion = typeof ETHNICITY_REGIONS[number]

export type EthnicityType = {
  slug: string
  region: EthnicityRegion
}

export const ETHNICITIES: EthnicityType[] = [
  // European
  { slug: 'white_caucasian', region: 'european' },
  { slug: 'mediterranean', region: 'european' },
  { slug: 'eastern_european', region: 'european' },
  { slug: 'scandinavian', region: 'european' },
  // Middle East & North Africa
  { slug: 'arab', region: 'middle_east_north_africa' },
  { slug: 'maghrebi', region: 'middle_east_north_africa' },
  { slug: 'persian_iranian', region: 'middle_east_north_africa' },
  { slug: 'turkish', region: 'middle_east_north_africa' },
  { slug: 'kurdish', region: 'middle_east_north_africa' },
  // Sub-Saharan Africa
  { slug: 'black_african', region: 'sub_saharan_africa' },
  { slug: 'west_african', region: 'sub_saharan_africa' },
  { slug: 'east_african', region: 'sub_saharan_africa' },
  { slug: 'south_african', region: 'sub_saharan_africa' },
  // Caribbean & Diaspora
  { slug: 'afro_caribbean', region: 'caribbean_diaspora' },
  { slug: 'afro_latino', region: 'caribbean_diaspora' },
  // Americas
  { slug: 'latino_hispanic', region: 'americas' },
  { slug: 'brazilian', region: 'americas' },
  { slug: 'indigenous_native', region: 'americas' },
  // Asia
  { slug: 'east_asian', region: 'asia' },
  { slug: 'southeast_asian', region: 'asia' },
  { slug: 'south_asian', region: 'asia' },
  { slug: 'central_asian', region: 'asia' },
  // Oceania
  { slug: 'pacific_islander', region: 'oceania' },
  { slug: 'aboriginal_torres', region: 'oceania' },
]
