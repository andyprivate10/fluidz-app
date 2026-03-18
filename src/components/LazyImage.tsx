import { useState, useRef, useEffect } from 'react'
import { colors } from '../brand'
const S = colors

/**
 * LazyImage — loads image only when visible in viewport
 * Uses IntersectionObserver for efficient lazy loading
 * Shows a gradient placeholder while loading
 */
export default function LazyImage({
  src, alt = '', style, className, onClick,
}: {
  src: string
  alt?: string
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px' } // preload 200px before visible
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: loaded ? 'transparent' : 'linear-gradient(135deg, '+S.bg2+' 0%, '+S.bg3+' 100%)',
        ...style,
      }}
      className={className}
      onClick={onClick}
    >
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: (style?.objectFit || 'cover') as React.CSSProperties['objectFit'],
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </div>
  )
}
