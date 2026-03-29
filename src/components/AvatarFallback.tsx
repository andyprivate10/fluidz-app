import { colors, radius } from '../brand'

const S = colors

const GRADIENT_PAIRS = [
  ['#E0887A', '#C0706A'],
  ['#9080BA', '#7060A0'],
  ['#6BA888', '#4A8868'],
  ['#7DD3FC', '#5AB3DC'],
  ['#A78BFA', '#8B6BDA'],
  ['#FB923C', '#D97A2C'],
]

function getGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length] as [string, string]
}

interface Props {
  name: string
  size?: number
  style?: React.CSSProperties
  onClick?: () => void
}

export default function AvatarFallback({ name, size = 40, style, onClick }: Props) {
  const [c1, c2] = getGradient(name || '?')
  const letter = (name || '?')[0].toUpperCase()

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: radius.avatar,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 800,
        color: S.tx,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {letter}
    </div>
  )
}

/** onError handler for img tags — hides the img and shows nothing (use with a fallback sibling) */
export function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget
  img.style.display = 'none'
}

/** onError handler that replaces src with a 1x1 transparent pixel */
export function imgFallbackPixel(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget
  img.onerror = null
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  img.style.opacity = '0.3'
  img.style.background = S.bg2
}
