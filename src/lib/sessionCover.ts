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
  dark_room: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="30%" cy="40%" r="60%"><stop offset="0%" stop-color="#3d1525" stop-opacity=".9"/><stop offset="50%" stop-color="#1a0a0f" stop-opacity=".95"/><stop offset="100%" stop-color="#0a0508" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="75%" cy="70%" r="45%"><stop offset="0%" stop-color="#E0887A" stop-opacity=".12"/><stop offset="100%" stop-color="#0a0508" stop-opacity="0"/></radialGradient><radialGradient id="c" cx="50%" cy="20%" r="50%"><stop offset="0%" stop-color="#9080BA" stop-opacity=".06"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".5"/><circle cx="200" cy="180" r="120" fill="#E0887A" opacity=".04" /><circle cx="600" cy="280" r="80" fill="#9080BA" opacity=".03"/></svg>`)}`,

  powder_room: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="60%" cy="50%" r="65%"><stop offset="0%" stop-color="#1a1030" stop-opacity=".9"/><stop offset="50%" stop-color="#100a18" stop-opacity=".95"/><stop offset="100%" stop-color="#05030a" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="25%" cy="30%" r="50%"><stop offset="0%" stop-color="#9080BA" stop-opacity=".15"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="c" cx="80%" cy="75%" r="40%"><stop offset="0%" stop-color="#A78BFA" stop-opacity=".08"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".4"/><circle cx="180" cy="150" r="100" fill="#9080BA" opacity=".05"/><circle cx="650" cy="300" r="60" fill="#A78BFA" opacity=".04"/></svg>`)}`,

  techno: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="40%" cy="60%" r="60%"><stop offset="0%" stop-color="#102820" stop-opacity=".9"/><stop offset="50%" stop-color="#0a1410" stop-opacity=".95"/><stop offset="100%" stop-color="#050a08" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="70%" cy="25%" r="50%"><stop offset="0%" stop-color="#6BA888" stop-opacity=".12"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="c" cx="20%" cy="80%" r="45%"><stop offset="0%" stop-color="#34D399" stop-opacity=".06"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".45"/><circle cx="550" cy="120" r="90" fill="#6BA888" opacity=".05"/><circle cx="150" cy="320" r="70" fill="#34D399" opacity=".03"/></svg>`)}`,

  party: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="50%" cy="45%" r="65%"><stop offset="0%" stop-color="#2a1020" stop-opacity=".9"/><stop offset="50%" stop-color="#180a10" stop-opacity=".95"/><stop offset="100%" stop-color="#0a0508" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="35%" cy="65%" r="45%"><stop offset="0%" stop-color="#F9A8A8" stop-opacity=".1"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="c" cx="75%" cy="30%" r="40%"><stop offset="0%" stop-color="#FB923C" stop-opacity=".07"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".45"/><circle cx="300" cy="250" r="100" fill="#F9A8A8" opacity=".04"/><circle cx="600" cy="150" r="70" fill="#FB923C" opacity=".03"/></svg>`)}`,

  bears: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="45%" cy="55%" r="60%"><stop offset="0%" stop-color="#28200f" stop-opacity=".9"/><stop offset="50%" stop-color="#14100a" stop-opacity=".95"/><stop offset="100%" stop-color="#0a0805" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="65%" cy="35%" r="50%"><stop offset="0%" stop-color="#C8A064" stop-opacity=".1"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="c" cx="25%" cy="75%" r="40%"><stop offset="0%" stop-color="#FBBF24" stop-opacity=".05"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".5"/><circle cx="500" cy="200" r="110" fill="#C8A064" opacity=".04"/><circle cx="200" cy="320" r="60" fill="#FBBF24" opacity=".03"/></svg>`)}`,

  after: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><radialGradient id="a" cx="55%" cy="50%" r="65%"><stop offset="0%" stop-color="#1a1028" stop-opacity=".9"/><stop offset="50%" stop-color="#0f0a18" stop-opacity=".95"/><stop offset="100%" stop-color="#06040c" stop-opacity="1"/></radialGradient><radialGradient id="b" cx="30%" cy="40%" r="50%"><stop offset="0%" stop-color="#E0887A" stop-opacity=".08"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="c" cx="80%" cy="65%" r="40%"><stop offset="0%" stop-color="#7DD3FC" stop-opacity=".06"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer></filter></defs><rect fill="url(#a)" width="800" height="400"/><rect fill="url(#b)" width="800" height="400"/><rect fill="url(#c)" width="800" height="400"/><rect filter="url(#n)" width="800" height="400" opacity=".4"/><circle cx="400" cy="180" r="130" fill="#E0887A" opacity=".03"/><circle cx="650" cy="300" r="50" fill="#7DD3FC" opacity=".04"/></svg>`)}`,
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

  // 2. Template slug match
  if (templateSlug) {
    const gradient = TEMPLATE_GRADIENTS[templateSlug] || DEFAULT_GRADIENT
    const coverImage = COVER_IMAGES[templateSlug]
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
