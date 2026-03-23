import { useState, useRef, useCallback } from 'react'
import { colors } from '../brand'

const S = colors

type Action = { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }

type Props = {
  children: React.ReactNode
  actions: Action[]
}

export default function LongPressMenu({ children, actions }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moved = useRef(false)

  const startPress = useCallback((clientX: number, clientY: number) => {
    moved.current = false
    timerRef.current = setTimeout(() => {
      if (!moved.current) {
        setPos({ x: clientX, y: clientY })
        setOpen(true)
        // Haptic
        try { navigator.vibrate?.(15) } catch {}
      }
    }, 500)
  }, [])

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleMove = useCallback(() => {
    moved.current = true
    cancelPress()
  }, [cancelPress])

  return (
    <>
      <div
        onTouchStart={e => startPress(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={handleMove}
        onTouchEnd={cancelPress}
        onMouseDown={e => startPress(e.clientX, e.clientY)}
        onMouseMove={handleMove}
        onMouseUp={cancelPress}
        onContextMenu={e => {
          e.preventDefault()
          setPos({ x: e.clientX, y: e.clientY })
          setOpen(true)
        }}
      >
        {children}
      </div>

      {open && (
        <>
          <div role="presentation" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{
            position: 'fixed',
            left: Math.min(pos.x, window.innerWidth - 180),
            top: Math.min(pos.y - 10, window.innerHeight - 200),
            zIndex: 101, minWidth: 160,
            background: S.bg1, border: '1px solid ' + S.rule2, borderRadius: 14,
            padding: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
            {actions.map((a, i) => (
              <button key={i} onClick={() => { a.onClick(); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                color: a.danger ? S.red : S.tx, fontSize: 13, fontWeight: 600,
              }}>
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// Helper to copy text to clipboard
export function useChatMessageActions() {
  const copyText = useCallback((text: string) => {
    navigator.clipboard?.writeText(text)
  }, [])

  return { copyText }
}
