import { colors } from '../../brand'

const S = colors

interface Props {
  reactions: Record<string, string[]>
  currentUserId: string
  onToggle: (emoji: string) => void
}

export default function ReactionDisplay({ reactions, currentUserId, onToggle }: Props) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0)
  if (entries.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {entries.map(([emoji, users]) => {
        const isMine = users.includes(currentUserId)
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 99,
              background: isMine ? S.p2 : S.bg2,
              border: '1px solid ' + (isMine ? S.pbd : S.rule),
              fontSize: 12, cursor: 'pointer',
              color: S.tx,
            }}
          >
            <span>{emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: isMine ? S.p : S.tx2 }}>{users.length}</span>
          </button>
        )
      })}
    </div>
  )
}
