// FLUIDZ — Profile Configuration
// Source of truth for all profile field options
// These will eventually be editable via Admin interface (Phase 7)

export const ROLES = ['Top', 'Bottom', 'Versa', 'Side'] as const
export const SUB_ROLES = ['Actif', 'Passif', 'Dominant', 'Soumis'] as const
export const MORPHOLOGIES = ['Mince', 'Sportif', 'Athlétique', 'Moyen', 'Costaud', 'Musclé', 'Gros'] as const
export const ETHNICITIES = ['Blanc', 'Rebeu/Maghrébin', 'Black/Africain', 'Latino', 'Asiatique', 'Métis', 'Autre'] as const
export const PREP_OPTIONS = ['Actif', 'Inactif', 'Non'] as const

export type KinkCategory = 'Pratiques' | 'SM' | 'Rôles' | 'Fétichisme' | 'Autre'

export interface KinkOption {
  slug: string
  label: string
  category: KinkCategory
  intensity?: 'soft' | 'medium' | 'hard'
}

export const KINKS: KinkOption[] = [
  // Pratiques
  { slug: 'group', label: 'Group', category: 'Pratiques' },
  { slug: 'bareback', label: 'Bareback', category: 'Pratiques', intensity: 'hard' },
  { slug: 'fist', label: 'Fist', category: 'Pratiques', intensity: 'hard' },
  { slug: 'oral', label: 'Oral', category: 'Pratiques', intensity: 'soft' },
  // SM
  { slug: 'sm_leger', label: 'SM léger', category: 'SM', intensity: 'soft' },
  { slug: 'sm_hard', label: 'SM hard', category: 'SM', intensity: 'hard' },
  { slug: 'bondage', label: 'Bondage', category: 'SM', intensity: 'medium' },
  // Rôles
  { slug: 'dominant', label: 'Dominant', category: 'Rôles' },
  { slug: 'soumis', label: 'Soumis', category: 'Rôles' },
  { slug: 'jeux_role', label: 'Jeux de rôle', category: 'Rôles' },
  // Fétichisme
  { slug: 'fetichisme', label: 'Fétichisme', category: 'Fétichisme' },
  { slug: 'exhib', label: 'Exhib', category: 'Fétichisme' },
  { slug: 'voyeur', label: 'Voyeur', category: 'Fétichisme' },
  { slug: 'bears', label: 'Bears welcome', category: 'Fétichisme' },
  { slug: 'cuir', label: 'Cuir/Leather', category: 'Fétichisme' },
  { slug: 'sportswear', label: 'Sportswear', category: 'Fétichisme' },
  { slug: 'pieds', label: 'Pieds', category: 'Fétichisme' },
  // Autre
  { slug: 'poppers', label: 'Poppers', category: 'Autre' },
  { slug: 'massage', label: 'Massage', category: 'Autre', intensity: 'soft' },
]

export const KINK_CATEGORIES: KinkCategory[] = ['Pratiques', 'SM', 'Rôles', 'Fétichisme', 'Autre']

// Intensity colors
export const INTENSITY_COLORS = {
  soft: { bg: 'rgba(107,168,136,0.12)', border: 'rgba(107,168,136,0.24)', text: '#6BA888' },
  medium: { bg: 'rgba(224,136,122,0.12)', border: 'rgba(224,136,122,0.24)', text: '#E0887A' },
  hard: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.24)', text: '#F87171' },
} as const

// Adult photo body part slots
export interface BodyPartSlot {
  id: string
  label: string
  icon: string  // SVG path or text char
}

export const BODY_PART_SLOTS: BodyPartSlot[] = [
  { id: 'torse', label: 'Torse', icon: 'T' },
  { id: 'dos', label: 'Dos', icon: 'D' },
  { id: 'jambes', label: 'Jambes', icon: 'J' },
  { id: 'sexe', label: 'Sexe', icon: 'S' },
  { id: 'fesses', label: 'Fesses', icon: 'F' },
  { id: 'mains', label: 'Mains', icon: 'M' },
  { id: 'pieds', label: 'Pieds', icon: 'P' },
  { id: 'autre', label: 'Autre', icon: '+' },
]

// Profile section structure for Candidate Pack toggles
export const PROFILE_SECTIONS = {
  public: {
    label: 'Infos publiques',
    description: 'Pseudo, bio, âge, physique, rôle, photos profil',
    alwaysShared: true,  // Cannot be toggled off
  },
  adult: {
    label: 'Infos adultes',
    description: 'Pratiques, limites, photos intimes',
    alwaysShared: false,
  },
  health: {
    label: 'Santé',
    description: 'PrEP, dépistage, statut',
    alwaysShared: false,
  },
  occasion: {
    label: 'Note pour cette session',
    description: 'Message au host, dispo...',
    alwaysShared: false,
  },
} as const

// Session tag categories (for admin)
export type TagCategory = 'Vibes' | 'Rôles' | 'Pratiques' | 'Lieu'

export interface SessionTag {
  slug: string
  label: string
  category: TagCategory
}

export const SESSION_TAGS: SessionTag[] = [
  // Vibes
  { slug: 'dark_room', label: 'Dark Room', category: 'Vibes' },
  { slug: 'chemical', label: 'Chemical', category: 'Vibes' },
  { slug: 'techno', label: 'Techno', category: 'Vibes' },
  { slug: 'chill', label: 'Chill', category: 'Vibes' },
  // Rôles
  { slug: 'top', label: 'Top', category: 'Rôles' },
  { slug: 'bottom', label: 'Bottom', category: 'Rôles' },
  { slug: 'versa', label: 'Versa', category: 'Rôles' },
  // Pratiques
  { slug: 'group', label: 'Group', category: 'Pratiques' },
  { slug: 'bears', label: 'Bears', category: 'Pratiques' },
  { slug: 'muscles', label: 'Musclés', category: 'Pratiques' },
  { slug: 'jeunes', label: 'Jeunes', category: 'Pratiques' },
  // Lieu
  { slug: 'paris', label: 'Paris', category: 'Lieu' },
  { slug: 'exterieur', label: 'Extérieur', category: 'Lieu' },
]
