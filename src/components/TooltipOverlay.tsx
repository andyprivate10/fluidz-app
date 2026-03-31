import React, { useEffect, useState } from 'react'
import { colors } from '../brand'

const S = colors

interface TooltipOverlayProps {
  text: string
  targetRef: React.RefObject<HTMLElement>
  onDismiss: () => void
  position?: 'top' | 'bottom'
}

export default function TooltipOverlay({ text, targetRef, onDismiss, position = 'bottom' }: TooltipOverlayProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; arrowLeft: number } | null>(null)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tooltipMaxW = 260
    const gap = 10

    let top: number
    if (position === 'bottom') {
      top = rect.bottom + gap
    } else {
      top = rect.top - gap - 44 // approximate tooltip height
    }

    let left = rect.left + rect.width / 2 - tooltipMaxW / 2
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipMaxW - 12))

    const arrowLeft = rect.left + rect.width / 2 - left

    setCoords({ top, left, arrowLeft })
  }, [targetRef, position])

  if (!coords) return null

  const arrowSize = 7

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: coords.arrowLeft - arrowSize,
    width: 0,
    height: 0,
    borderLeft: `${arrowSize}px solid transparent`,
    borderRight: `${arrowSize}px solid transparent`,
    ...(position === 'bottom'
      ? { top: -arrowSize, borderBottom: `${arrowSize}px solid ${S.bg1}` }
      : { bottom: -arrowSize, borderTop: `${arrowSize}px solid ${S.bg1}` }),
  }

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: coords.top,
          left: coords.left,
          maxWidth: 260,
          padding: '10px 16px',
          background: S.bg1,
          border: `1px solid ${S.pbd}`,
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          color: S.tx,
        }}
      >
        <div style={arrowStyle} />
        {text}
      </div>
    </div>
  )
}
