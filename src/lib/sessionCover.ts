// Session cover gradient based on tags
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
  'Chemical': {
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
}

// Default fallback
const DEFAULT_GRADIENT = {
  bg: 'linear-gradient(135deg, #0C0A14 0%, #1F1D2B 50%, #0C0A14 100%)',
  overlay: 'rgba(224,136,122,0.06)',
}

export function getSessionCover(tags?: string[]): { bg: string; overlay: string } {
  if (!tags || tags.length === 0) return DEFAULT_GRADIENT
  // Priority: first matching tag
  for (const tag of tags) {
    if (TAG_GRADIENTS[tag]) return TAG_GRADIENTS[tag]
  }
  return DEFAULT_GRADIENT
}

// For session cards: returns inline style object
export function sessionCardCoverStyle(tags?: string[]): React.CSSProperties {
  const cover = getSessionCover(tags)
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
    'Chemical': '#9080BA',
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
