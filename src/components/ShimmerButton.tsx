import { colors } from '../brand'

const S = colors

interface Props {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit'
  secondary?: boolean
}

export default function ShimmerButton({ children, onClick, disabled, style, type = 'button', secondary }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-shimmer"
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: 14,
        fontWeight: 700,
        fontSize: 15,
        color: secondary ? S.p : '#fff',
        background: secondary ? S.p2 : S.p,
        border: secondary ? `1px solid ${S.pbd}` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        transition: 'opacity 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
