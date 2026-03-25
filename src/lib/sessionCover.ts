// Session cover gradient + image based on tags
// Returns a CSS background string for session cards/heroes

const TAG_GRADIENTS: Record<string, { bg: string; overlay: string }> = {
  'Dark Room': {
    bg: 'linear-gradient(135deg, #1a0a0f 0%, #2d1520 40%, #0f0a14 100%)',
    overlay: 'rgba(224,136,122,0.12)',
  },
  'Techno': {
    bg: 'linear-gradient(135deg, #0a1410 0%, #102820 40%, #0a0f14 100%)',
    overlay: 'rgba(107,168,136,0.12)',
  },
  'Powder Room': {
    bg: 'linear-gradient(135deg, #100a18 0%, #1a1030 40%, #0a0a14 100%)',
    overlay: 'rgba(144,128,186,0.12)',
  },
  'Party': {
    bg: 'linear-gradient(135deg, #180a10 0%, #2a1020 40%, #0f0a14 100%)',
    overlay: 'rgba(249,168,168,0.10)',
  },
  'Bears': {
    bg: 'linear-gradient(135deg, #14100a 0%, #28200f 40%, #0f0a0a 100%)',
    overlay: 'rgba(200,160,100,0.10)',
  },
  'Musclés': {
    bg: 'linear-gradient(135deg, #0a0f14 0%, #102030 40%, #0a0a14 100%)',
    overlay: 'rgba(125,211,252,0.08)',
  },
  'Hot': {
    bg: 'linear-gradient(135deg, #1a0a08 0%, #2d1510 40%, #14080a 100%)',
    overlay: 'rgba(244,114,114,0.10)',
  },
  'Fetish': {
    bg: 'linear-gradient(135deg, #0a0a0f 0%, #1a1520 40%, #0a0a0f 100%)',
    overlay: 'rgba(168,85,247,0.08)',
  },
  'Chill': {
    bg: 'linear-gradient(135deg, #0a1014 0%, #0f2028 40%, #0a0f14 100%)',
    overlay: 'rgba(14,165,233,0.08)',
  },
}

// Template slug → gradient (for templates without a matching tag)
const TEMPLATE_GRADIENTS: Record<string, { bg: string; overlay: string }> = {
  after:          { bg: 'linear-gradient(135deg, #1a1028 0%, #0f0a18 40%, #06040c 100%)', overlay: 'rgba(139,92,246,0.10)' },
  artsy:          { bg: 'linear-gradient(135deg, #180a14 0%, #2a1028 40%, #0f0a14 100%)', overlay: 'rgba(236,72,153,0.10)' },
  basement:       { bg: 'linear-gradient(135deg, #0a0a0f 0%, #14121a 40%, #0a0a0f 100%)', overlay: 'rgba(107,114,128,0.10)' },
  champagne_bath: { bg: 'linear-gradient(135deg, #14100a 0%, #28200f 40%, #0f0a0a 100%)', overlay: 'rgba(245,158,11,0.10)' },
  drag:           { bg: 'linear-gradient(135deg, #100a18 0%, #201030 40%, #0a0a14 100%)', overlay: 'rgba(168,85,247,0.10)' },
  euphoria:       { bg: 'linear-gradient(135deg, #180a14 0%, #2a1028 40%, #0f0a14 100%)', overlay: 'rgba(244,114,182,0.10)' },
  jacuzzi:        { bg: 'linear-gradient(135deg, #0a1014 0%, #0f2028 40%, #0a0f14 100%)', overlay: 'rgba(6,182,212,0.10)' },
  latex:          { bg: 'linear-gradient(135deg, #0a0a0f 0%, #14121a 40%, #0a0a0f 100%)', overlay: 'rgba(31,41,55,0.12)' },
  leather:        { bg: 'linear-gradient(135deg, #14100a 0%, #28180a 40%, #0f0a0a 100%)', overlay: 'rgba(146,64,14,0.10)' },
  nature:         { bg: 'linear-gradient(135deg, #0a140a 0%, #0f280f 40%, #0a140a 100%)', overlay: 'rgba(5,150,105,0.10)' },
  pump:           { bg: 'linear-gradient(135deg, #1a0a0a 0%, #2d1010 40%, #140808 100%)', overlay: 'rgba(220,38,38,0.10)' },
  puppy:          { bg: 'linear-gradient(135deg, #14100a 0%, #28180a 40%, #0f0a0a 100%)', overlay: 'rgba(249,115,22,0.10)' },
  reggae:         { bg: 'linear-gradient(135deg, #0a140a 0%, #0f280f 40%, #0a140a 100%)', overlay: 'rgba(22,163,74,0.10)' },
  rooftop:        { bg: 'linear-gradient(135deg, #0a1014 0%, #0f2030 40%, #0a0f14 100%)', overlay: 'rgba(14,165,233,0.10)' },
  rush:           { bg: 'linear-gradient(135deg, #1a0a0a 0%, #2d1010 40%, #140808 100%)', overlay: 'rgba(239,68,68,0.10)' },
  sauna:          { bg: 'linear-gradient(135deg, #14100a 0%, #281a0a 40%, #0f0a08 100%)', overlay: 'rgba(234,88,12,0.10)' },
  secret_garden:  { bg: 'linear-gradient(135deg, #0a140a 0%, #0f280f 40%, #0a140a 100%)', overlay: 'rgba(16,185,129,0.10)' },
  spectrum:       { bg: 'linear-gradient(135deg, #100a18 0%, #1a1030 40%, #0a0a14 100%)', overlay: 'rgba(124,58,237,0.10)' },
  vinyl:          { bg: 'linear-gradient(135deg, #0a0a0f 0%, #14141a 40%, #0a0a0f 100%)', overlay: 'rgba(55,65,81,0.10)' },
}

// Default fallback
const DEFAULT_GRADIENT = {
  bg: 'linear-gradient(135deg, #0C0A14 0%, #1F1D2B 50%, #0C0A14 100%)',
  overlay: 'rgba(224,136,122,0.06)',
}

// Rich SVG data-URL cover images per template type
// Each is a dark, moody abstract pattern with radial gradients
const COVER_IMAGES: Record<string, string> = {
  dark_room: '/covers/dark_room.svg',
  powder_room: '/covers/powder_room.svg',
  techno: '/covers/techno.svg',
  after: '/covers/after.svg',
  artsy: '/covers/artsy.svg',
  basement: '/covers/basement.svg',
  champagne_bath: '/covers/champagne_bath.svg',
  drag: '/covers/drag.svg',
  euphoria: '/covers/euphoria.svg',
  jacuzzi: '/covers/jacuzzi.svg',
  latex: '/covers/latex.svg',
  leather: '/covers/leather.svg',
  nature: '/covers/nature.svg',
  pump: '/covers/pump.svg',
  puppy: '/covers/puppy.svg',
  reggae: '/covers/reggae.svg',
  rooftop: '/covers/rooftop.svg',
  rush: '/covers/rush.svg',
  sauna: '/covers/sauna.svg',
  secret_garden: '/covers/secret_garden.svg',
  spectrum: '/covers/spectrum.svg',
  vinyl: '/covers/vinyl.svg',
  bears: '/covers/bears.svg',
  party: '/covers/party.svg',
}

// Map template slugs to tag-based matching
const TAG_TO_TEMPLATE: Record<string, string> = {
  'Dark Room': 'dark_room',
  'Powder Room': 'powder_room',
  'Techno': 'techno',
  'Party': 'party',
  'Bears': 'bears',
}

export type SessionCoverResult = {
  bg: string
  overlay: string
  coverImage?: string
}

export function getSessionCover(tags?: string[], coverUrl?: string | null, templateSlug?: string | null): SessionCoverResult {
  // 1. Session's own cover_url
  if (coverUrl) {
    const gradient = templateSlug && TEMPLATE_GRADIENTS[templateSlug]
      ? TEMPLATE_GRADIENTS[templateSlug]
      : tags?.length ? (TAG_GRADIENTS[tags.find(t => TAG_GRADIENTS[t]) || ''] || DEFAULT_GRADIENT) : DEFAULT_GRADIENT
    return { bg: gradient.bg, overlay: gradient.overlay, coverImage: coverUrl }
  }

  // 2. Template slug match (with dash→underscore normalization)
  if (templateSlug) {
    const normalized = templateSlug.replace(/-/g, '_')
    const gradient = TEMPLATE_GRADIENTS[normalized] || TEMPLATE_GRADIENTS[templateSlug] || DEFAULT_GRADIENT
    const coverImage = COVER_IMAGES[normalized] || COVER_IMAGES[templateSlug]
    return { bg: gradient.bg, overlay: gradient.overlay, coverImage }
  }

  // 3. Template match by tags
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      if (TAG_GRADIENTS[tag]) {
        const slug = TAG_TO_TEMPLATE[tag]
        const coverImage = slug ? COVER_IMAGES[slug] : undefined
        return { bg: TAG_GRADIENTS[tag].bg, overlay: TAG_GRADIENTS[tag].overlay, coverImage }
      }
      // Tag-to-slug fallback: try converting tag to a slug
      const tagSlug = tag.toLowerCase().replace(/\s+/g, '_')
      if (COVER_IMAGES[tagSlug]) {
        const gradient = TEMPLATE_GRADIENTS[tagSlug] || DEFAULT_GRADIENT
        return { bg: gradient.bg, overlay: gradient.overlay, coverImage: COVER_IMAGES[tagSlug] }
      }
    }
  }

  // 4. Fallback to gradient only
  return { ...DEFAULT_GRADIENT }
}

// Get cover image by template slug
export function getTemplateCoverImage(slug: string): string | undefined {
  return COVER_IMAGES[slug]
}

// For session cards: returns inline style object
export function sessionCardCoverStyle(tags?: string[], coverUrl?: string | null, templateSlug?: string | null): React.CSSProperties {
  const cover = getSessionCover(tags, coverUrl, templateSlug)
  return {
    background: cover.bg,
    position: 'relative' as const,
  }
}

// Accent color from first tag
export function getSessionAccentColor(tags?: string[]): string {
  if (!tags?.length) return '#F9A8A8'
  const map: Record<string, string> = {
    'Dark Room': '#E0887A',
    'Techno': '#6BA888',
    'Powder Room': '#9080BA',
    'Party': '#F9A8A8',
    'Bears': '#C8A064',
    'Musclés': '#7DD3FC',
    'Hot': '#F47272',
  }
  for (const tag of tags) {
    if (map[tag]) return map[tag]
  }
  return '#F9A8A8'
}
