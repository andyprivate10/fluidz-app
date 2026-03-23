import { colors } from '../brand'

const S = colors

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😈', '💦', '🍑', '👀']

type Props = {
  onSelect: (emoji: string) => void
  style?: React.CSSProperties
}

export default function EmojiBar({ onSelect, style }: Props) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '6px 8px',
      background: S.bg2, borderRadius: 12, border: '1px solid ' + S.rule,
      ...style,
    }}>
      {QUICK_EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} style={{
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
          padding: '4px 6px', borderRadius: 8, lineHeight: 1,
          transition: 'transform 0.1s',
        }}
        onMouseDown={ev => (ev.currentTarget.style.transform = 'scale(1.3)')}
        onMouseUp={ev => (ev.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={ev => (ev.currentTarget.style.transform = 'scale(1)')}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
