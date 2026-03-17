import { useState, useRef, useCallback } from 'react'

/**
 * usePullToRefresh — adds pull-to-refresh behavior
 * Returns handlers + a visual indicator component
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const threshold = 80

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 10) return
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return
    if (window.scrollY > 10) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPulling(true)
      setPullDistance(Math.min(delta * 0.5, 120))
    }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!pulling) return
    if (pullDistance >= threshold) {
      setRefreshing(true)
      setPullDistance(threshold)
      try { await onRefresh() } catch (_) {}
      setRefreshing(false)
    }
    setPulling(false)
    setPullDistance(0)
  }, [pulling, pullDistance, onRefresh])

  return {
    pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    pullIndicator: pulling || refreshing ? (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: pullDistance, overflow: 'hidden', transition: pulling ? 'none' : 'height 0.3s ease',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '3px solid #F9A8A822', borderTopColor: '#F9A8A8',
          animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
          transform: `rotate(${pullDistance * 3}deg)`,
          opacity: Math.min(pullDistance / threshold, 1),
        }} />
        <style>{`@keyframes ptr-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    ) : null,
  }
}
