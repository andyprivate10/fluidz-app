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

  // Accent principal — peach
  p:   '#F07858',
  p2:  'rgba(240,120,88,0.15)',
  p3:  'rgba(240,120,88,0.06)',
  pbd: 'rgba(240,120,88,0.28)',

  // Statuts
  sage:    '#6BA888',
  sagebg:  'rgba(107,168,136,0.08)',
  sagebd:  'rgba(107,168,136,0.16)',
  lav:     '#9080BA',
  lavbg:   'rgba(144,128,186,0.08)',
  lavbd:   'rgba(144,128,186,0.18)',
} as const

// ─── Typography ───────────────────────────────────────
export const type = {
  hero:    { size: 30,  weight: 900, tracking: '-0.06em', lineHeight: 0.88 },
  title:   { size: 22,  weight: 800, tracking: '-0.04em' },
  section: { size: 16,  weight: 700, tracking: '-0.03em' },
  body:    { size: 13,  weight: 400, tracking: '-0.02em' },
  label:   { size: 12,  weight: 600, tracking: '-0.02em' },
  meta:    { size: 10,  weight: 500, tracking: '-0.01em' },
  micro:   { size: 9,   weight: 600, tracking: '0.06em',  transform: 'uppercase' as const },
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
    blur: '55px',
    colors: ['rgba(240,120,88,0.10)', 'rgba(144,128,186,0.08)', 'rgba(107,168,136,0.06)'],
    durations: ['11s', '14s', '17s'],
  },
} as const

// ─── All keyframes (injected once via CSS) ────────────
export const keyframes = `
  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(22px,-16px) scale(1.1); }
    66%     { transform: translate(-14px,20px) scale(0.92); }
  }
  @keyframes story-drift {
    0%   { transform: translate(0,0) scale(1); }
    25%  { transform: translate(28px,-18px) scale(1.14); }
    50%  { transform: translate(-14px,24px) scale(0.91); }
    75%  { transform: translate(18px,10px) scale(1.09); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes story-progress { from { width: 0% } to { width: 100% } }
  @keyframes shimmer { 0% { left: -180% } 100% { left: 200% } }
  @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
`

// ─── Style helpers ────────────────────────────────────
export function typeStyle(variant: keyof typeof type): React.CSSProperties {
  const t = type[variant]
  return {
    fontSize: t.size,
    fontWeight: t.weight,
    letterSpacing: t.tracking,
    ...(('lineHeight' in t) ? { lineHeight: t.lineHeight } : {}),
    ...(('transform' in t) ? { textTransform: (t as any).transform } : {}),
  }
}
