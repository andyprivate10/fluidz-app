import { colors } from '../brand'
import { Copy, CornerUpLeft, Trash2 } from 'lucide-react'

const S = colors

type Props = {
  message: { id: string; text: string; sender_name: string }
  isOwn: boolean
  onCopy: () => void
  onReply: () => void
  onDelete?: () => void
  onClose: () => void
  labels: { copy: string; reply: string; delete: string }
}

export default function ChatMessageMenu({ message, isOwn, onCopy, onReply, onDelete, onClose, labels }: Props) {
  return (
    <>
      <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: S.bg1, borderTop: '1px solid ' + S.rule2, borderRadius: '18px 18px 0 0',
        padding: '8px 8px calc(8px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Preview */}
        <div style={{ padding: '8px 14px', marginBottom: 4, borderRadius: 12, background: S.bg2 }}>
          <p style={{ margin: 0, fontSize: 12, color: S.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.text}</p>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(message.text); onCopy(); onClose() }} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 14px', borderRadius: 10, border: 'none',
          background: 'transparent', cursor: 'pointer', color: S.tx, fontSize: 14, fontWeight: 600,
        }}>
          <Copy size={16} strokeWidth={1.5} /> {labels.copy}
        </button>
        <button onClick={() => { onReply(); onClose() }} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 14px', borderRadius: 10, border: 'none',
          background: 'transparent', cursor: 'pointer', color: S.tx, fontSize: 14, fontWeight: 600,
        }}>
          <CornerUpLeft size={16} strokeWidth={1.5} /> {labels.reply}
        </button>
        {isOwn && onDelete && (
          <button onClick={() => { onDelete(); onClose() }} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '12px 14px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer', color: S.red, fontSize: 14, fontWeight: 600,
          }}>
            <Trash2 size={16} strokeWidth={1.5} /> {labels.delete}
          </button>
        )}
      </div>
    </>
  )
}
