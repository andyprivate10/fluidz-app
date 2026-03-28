import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import { colors, radius, glassCard } from '../brand'

const S = colors
const R = radius

type Option = {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
}

type Props = {
  options: Option[]
}

export default function OptionsMenu({ options }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Options"
        style={{
          width: 36, height: 36, borderRadius: R.icon,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: 'none', color: S.tx2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MoreVertical size={20} strokeWidth={1.5} />
      </button>
      {open && (
        <div style={{
          ...glassCard,
          position: 'absolute', top: 40, right: 0, zIndex: 50,
          minWidth: 190, padding: 6,
          borderRadius: R.card,
          opacity: 1, transition: 'opacity 0.15s',
        }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { opt.onClick(); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: R.chip,
                background: 'transparent', border: 'none',
                color: opt.danger ? S.red : S.tx,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
