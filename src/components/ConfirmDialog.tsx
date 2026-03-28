import { useEffect, useRef } from 'react'
import { colors, fonts } from '../brand'
import { useTranslation } from 'react-i18next'

const S = colors

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const confirmColor = danger ? S.red : S.p
  const confirmBg = danger ? S.redbg : S.p2
  const confirmBorder = danger ? S.redbd : S.pbd

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480, padding: 20,
        background: 'rgba(22,20,31,0.97)', borderRadius: '20px 20px 0 0',
        border: '1px solid ' + S.rule2, borderBottom: 'none',
        animation: 'slideUp 0.2s ease-out',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: S.tx, margin: '0 0 6px', fontFamily: fonts.hero }}>{title}</h3>
        {description && <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 20px', lineHeight: 1.5 }}>{description}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx3, cursor: 'pointer' }}
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: '1px solid ' + confirmBorder, background: confirmBg, color: confirmColor, cursor: 'pointer' }}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage — returns state + trigger + dialog props
import { useState, useCallback } from 'react'

type ConfirmState = {
  open: boolean
  title: string
  description?: string
  danger?: boolean
  confirmLabel?: string
  resolve: ((v: boolean) => void) | null
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '', resolve: null })

  const confirm = useCallback((opts: { title: string; description?: string; danger?: boolean; confirmLabel?: string }): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, ...opts, resolve })
    })
  }, [])

  const dialogProps = {
    open: state.open,
    title: state.title,
    description: state.description,
    danger: state.danger,
    confirmLabel: state.confirmLabel,
    onConfirm: () => { state.resolve?.(true); setState(s => ({ ...s, open: false })) },
    onCancel: () => { state.resolve?.(false); setState(s => ({ ...s, open: false })) },
  }

  return { confirm, dialogProps }
}
