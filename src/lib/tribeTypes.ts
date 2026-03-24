export const TRIBE_CATEGORIES = ['build_body','physique_style','maturity','expression_identity','vibe_scene'] as const
export type TribeCategory = typeof TRIBE_CATEGORIES[number]

export type TribeType = {
  slug: string
  category: TribeCategory
  color: string
}

export const TRIBES: TribeType[] = [
  // Build & body
  { slug: 'bear', category: 'build_body', color: '#C8A064' },
  { slug: 'cub', category: 'build_body', color: '#C8A064' },
  { slug: 'otter', category: 'build_body', color: '#6BA888' },
  { slug: 'wolf', category: 'build_body', color: '#7E7694' },
  { slug: 'chub', category: 'build_body', color: '#C8A064' },
  { slug: 'muscle_bear', category: 'build_body', color: '#C8A064' },
  // Physique & style
  { slug: 'twink', category: 'physique_style', color: '#7DD3FC' },
  { slug: 'twunk', category: 'physique_style', color: '#7DD3FC' },
  { slug: 'jock', category: 'physique_style', color: '#4ADE80' },
  { slug: 'gym_bunny', category: 'physique_style', color: '#4ADE80' },
  { slug: 'hunk', category: 'physique_style', color: '#F9A8A8' },
  { slug: 'stud', category: 'physique_style', color: '#F47272' },
  { slug: 'bull', category: 'physique_style', color: '#F47272' },
  // Maturity
  { slug: 'daddy', category: 'maturity', color: '#E0887A' },
  { slug: 'silver_fox', category: 'maturity', color: '#B8B2CC' },
  { slug: 'dilf', category: 'maturity', color: '#E0887A' },
  // Expression & identity
  { slug: 'femboy', category: 'expression_identity', color: '#ED93B1' },
  { slug: 'androgyne', category: 'expression_identity', color: '#AFA9EC' },
  { slug: 'drag_queen', category: 'expression_identity', color: '#ED93B1' },
  { slug: 'queen', category: 'expression_identity', color: '#ED93B1' },
  { slug: 'trans', category: 'expression_identity', color: '#7DD3FC' },
  { slug: 'non_binary', category: 'expression_identity', color: '#AFA9EC' },
  // Vibe & scene
  { slug: 'leather', category: 'vibe_scene', color: '#7E7694' },
  { slug: 'rubberman', category: 'vibe_scene', color: '#7E7694' },
  { slug: 'pup', category: 'vibe_scene', color: '#C8A064' },
  { slug: 'handler', category: 'vibe_scene', color: '#6BA888' },
  { slug: 'geek_nerd', category: 'vibe_scene', color: '#9080BA' },
  { slug: 'circuit_boy', category: 'vibe_scene', color: '#F9A8A8' },
  { slug: 'discreet', category: 'vibe_scene', color: '#7E7694' },
]
