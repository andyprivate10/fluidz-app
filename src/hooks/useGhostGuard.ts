import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useGhostGuard() {
  const { isGhost } = useAuth()
  const [showConvertModal, setShowConvertModal] = useState(false)

  const guardAction = useCallback((action: () => void) => {
    if (isGhost) {
      setShowConvertModal(true)
      return
    }
    action()
  }, [isGhost])

  return {
    isGhost,
    showConvertModal,
    setShowConvertModal,
    guardAction,
  }
}
