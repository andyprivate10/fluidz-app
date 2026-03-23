import { useState, useEffect, useCallback } from 'react'

import { haptic } from '../lib/feedback'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

let toastId = 0
let addToastFn: ((msg: string, type: ToastType) => void) | null = null

export function showToast(message: string, type: ToastType = 'info') {
  addToastFn?.(message, type)
  if (type === 'success') haptic('light')
  else if (type === 'error') haptic('medium')
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} style={{ marginBottom: 8 }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
