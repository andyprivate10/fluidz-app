import { useState, useEffect } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { colors, fonts, radius } from '../brand'

const S = colors
const R = radius

type TooltipProps = {
  text: string
  persistKey: string
  children?: React.ReactNode
}

export default function Tooltip({ text, persistKey, children }: TooltipProps) {
  const storageKey = `fluidz_tooltip_${persistKey}_dismissed`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey)
    if (!dismissed) setVisible(true)
  }, [storageKey])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      dismiss()
    }, 8000)
    return () => clearTimeout(timer)
  }, [visible])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(storageKey, '1')
  }

  if (!visible && !children) {
    return (
      <button
        onClick={() => setVisible(true)}
        aria-label="Help"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, display: 'inline-flex', alignItems: 'center',
          color: S.tx3, verticalAlign: 'middle',
        }}
      >
        <HelpCircle size={14} strokeWidth={1.5} />
      </button>
    )
  }

  if (!visible && children) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <button
          onClick={() => setVisible(true)}
          aria-label="Help"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, display: 'inline-flex', alignItems: 'center',
            color: S.tx3,
          }}
        >
          <HelpCircle size={14} strokeWidth={1.5} />
        </button>
      </span>
    )
  }

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
      {!children && (
        <button
          onClick={() => setVisible(true)}
          aria-label="Help"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, display: 'inline-flex', alignItems: 'center',
            color: S.tx3,
          }}
        >
          <HelpCircle size={14} strokeWidth={1.5} />
        </button>
      )}
      <div
        onClick={dismiss}
        style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, zIndex: 100, minWidth: 220, maxWidth: 280,
          padding: '10px 32px 10px 12px', borderRadius: R.block,
          background: 'rgba(22,20,31,0.95)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid ' + S.pbd, color: S.tx,
          fontSize: 12, lineHeight: 1.5, fontWeight: 500,
          fontFamily: fonts.body,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {text}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss() }}
          aria-label="Close"
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: S.tx3, padding: 2, display: 'flex',
          }}
        >
          <X size={12} />
        </button>
      </div>
    </span>
  )
}
