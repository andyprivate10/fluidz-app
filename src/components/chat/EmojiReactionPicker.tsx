import { colors } from '../../brand'

const S = colors
const REACTION_EMOJIS = ['👍', '🔥', '❤️', '🍆', '💦', '😂']

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
  top: number
  left: number
}

export default function EmojiReactionPicker({ onSelect, onClose, top, left }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: Math.max(8, top - 48),
          left: Math.max(16, Math.min(left, window.innerWidth - 260)),
          display: 'flex', gap: 2, padding: '6px 8px',
          background: S.bg1, borderRadius: 99,
          border: '1px solid ' + S.rule2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      >
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose() }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'transparent', border: 'none',
              fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.1s',
            }}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(1.3)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
