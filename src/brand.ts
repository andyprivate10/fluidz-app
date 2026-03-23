// FLUIDZ — DESIGN SYSTEM V1
// Single source of truth for all visual tokens

// ─── Colors ───────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg:    '#05040A',
  bg1:   '#0D0C16',
  bg2:   '#141222',
  bg3:   '#1D1B2E',

  // Borders
  rule:  'rgba(255,255,255,0.05)',
  rule2: 'rgba(255,255,255,0.09)',

  // Text
  tx:  '#EDE8F5',
  tx2: 'rgba(237,232,245,0.42)',
  tx3: 'rgba(237,232,245,0.18)',
  tx4: 'rgba(237,232,245,0.07)',

  // Accent principal — peach rosé (PAS orange)
  p:   '#E0887A',
  p2:  'rgba(224,136,122,0.15)',
  p3:  'rgba(224,136,122,0.06)',
  pbd: 'rgba(224,136,122,0.28)',
  pDark: '#C0706A',

  // Statuts
  sage:    '#6BA888',
  sagebg:  'rgba(107,168,136,0.08)',
  sagebd:  'rgba(107,168,136,0.16)',
  lav:     '#9080BA',
  lavbg:   'rgba(144,128,186,0.08)',
  lavbd:   'rgba(144,128,186,0.18)',

  // Secondary accents
  violet:  '#A78BFA',
  violetbg: 'rgba(167,139,250,0.10)',
  violetbd: 'rgba(167,139,250,0.22)',
  emerald: '#34D399',
  emeraldbg: 'rgba(52,211,153,0.10)',
  emeraldbd: 'rgba(52,211,153,0.22)',
  amber:   '#FB923C',
  amberbg: 'rgba(251,146,60,0.10)',
  amberbd: 'rgba(251,146,60,0.22)',

  // Semantic
  red:    '#F87171',
  redbg:  'rgba(248,113,113,0.08)',
  redbd:  'rgba(248,113,113,0.22)',
  orange: '#FBBF24',
  orangebg: 'rgba(251,191,36,0.10)',
  orangebd: 'rgba(251,191,36,0.25)',
  blue:   '#7DD3FC',
  bluebg: 'rgba(125,211,252,0.10)',
  bluebd: 'rgba(125,211,252,0.25)',
  grad:   '#E0887A',

  // Spinner / pull-to-refresh
  spinner:   '#F9A8A8',
  spinnerbg: 'rgba(249,168,168,0.13)',
} as const

// ─── Typography ───────────────────────────────────────
export const fonts = {
  hero: "'Bricolage Grotesque', sans-serif",
  body: "'Plus Jakarta Sans', sans-serif",
} as const

export const type = {
  hero:    { size: 30,  weight: 800, tracking: '-0.04em', lineHeight: 0.92, family: fonts.hero },
  title:   { size: 22,  weight: 800, tracking: '-0.03em', family: fonts.hero },
  section: { size: 16,  weight: 700, tracking: '-0.02em', family: fonts.body },
  body:    { size: 13,  weight: 400, tracking: '-0.01em', family: fonts.body },
  label:   { size: 12,  weight: 600, tracking: '-0.01em', family: fonts.body },
  meta:    { size: 10,  weight: 500, tracking: '-0.01em', family: fonts.body },
  micro:   { size: 9,   weight: 600, tracking: '0.06em',  transform: 'uppercase' as const, family: fonts.body },
} as const

// ─── Border Radius ────────────────────────────────────
export const radius = {
  phone:  '48px',
  card:   '20px',
  block:  '16px',
  btn:    '16px',
  pill:   '20px',
  avatar: '50%',
  icon:   '10px',
  chip:   '8px',
} as const

// ─── Animations ───────────────────────────────────────
export const animations = {
  orb: {
    blur: '60px',
    colors: ['rgba(224,136,122,0.10)', 'rgba(144,128,186,0.08)', 'rgba(107,168,136,0.06)'],
    durations: ['11s', '14s', '17s'],
  },
} as const

// ─── All keyframes (injected once via CSS) ────────────
export const keyframes = `
  @keyframes orbDrift1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(22px,-16px) scale(1.1); }
    66%     { transform: translate(-14px,20px) scale(0.92); }
  }
  @keyframes orbDrift2 {
    0%,100% { transform: translate(0,0); }
    45%     { transform: translate(-18px,14px) scale(1.08); }
    75%     { transform: translate(15px,-10px); }
  }
  @keyframes orbDrift3 {
    0%,100% { transform: translate(0,0); }
    50%     { transform: translate(10px,22px) scale(1.06); }
  }
  @keyframes shimmer { 0% { left: -180% } 100% { left: 200% } }
  @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
`

// ─── Shared card styles ──────────────────────────────
export const glassCard: React.CSSProperties = {
  background: 'rgba(22,20,31,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid ' + colors.rule2,
  borderRadius: 20,
  padding: 16,
  boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
}

// ─── Style helpers ────────────────────────────────────
export function typeStyle(variant: keyof typeof type): React.CSSProperties {
  const t = type[variant]
  return {
    fontSize: t.size,
    fontWeight: t.weight,
    letterSpacing: t.tracking,
    fontFamily: t.family,
    ...(('lineHeight' in t) ? { lineHeight: t.lineHeight } : {}),
    ...(('transform' in t) ? { textTransform: (t as any).transform } : {}),
  }
}
