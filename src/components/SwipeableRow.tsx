import { useRef, useState } from 'react'
import { colors } from '../brand'
import { Trash2 } from 'lucide-react'

const S = colors

type Props = {
  children: React.ReactNode
  onDelete: () => void
}

export default function SwipeableRow({ children, onDelete }: Props) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const threshold = 80

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return
    currentX.current = e.touches[0].clientX
    const dx = currentX.current - startX.current
    // Only allow swipe left
    if (dx < 0) {
      setOffset(Math.max(dx, -120))
    }
  }

  function handleTouchEnd() {
    setSwiping(false)
    if (offset < -threshold) {
      // Swipe past threshold → animate out and delete
      setOffset(-300)
      setTimeout(onDelete, 250)
    } else {
      // Snap back
      setOffset(0)
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 2 }}>
      {/* Delete background */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 100,
        background: S.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '0 12px 12px 0',
        opacity: Math.min(Math.abs(offset) / threshold, 1),
      }}>
        <Trash2 size={18} style={{ color: '#fff' }} />
      </div>
      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease',
          position: 'relative',
          zIndex: 1,
          background: S.bg,
        }}
      >
        {children}
      </div>
    </div>
  )
}
