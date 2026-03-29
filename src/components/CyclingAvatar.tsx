import { useState, useEffect, useRef } from 'react'
import { colors, radius } from '../brand'

const R = radius

const S = colors

interface Props {
  photos: string[]
  size: number
  fallbackLetter: string
  border?: string
}

export default function CyclingAvatar({ photos, size, fallbackLetter, border }: Props) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(1)
  const hovered = useRef(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (photos.length < 2) return
    timer.current = setInterval(() => {
      if (hovered.current) return
      setFade(0)
      setTimeout(() => {
        setIdx(prev => (prev + 1) % photos.length)
        setFade(1)
      }, 400)
    }, 5000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [photos.length])

  const brd = border || `2px solid ${S.rule2}`

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        width: size, height: size, borderRadius: R.avatar,
        background: S.p,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: S.tx,
        border: brd, flexShrink: 0,
      }}>
        {(fallbackLetter || '?')[0].toUpperCase()}
      </div>
    )
  }

  if (photos.length === 1) {
    return (
      <img
        src={photos[0]} alt=""
        style={{
          width: size, height: size, borderRadius: R.avatar,
          objectFit: 'cover', border: brd, flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      onMouseEnter={() => { hovered.current = true }}
      onMouseLeave={() => { hovered.current = false }}
      style={{
        width: size, height: size, borderRadius: R.avatar,
        overflow: 'hidden', position: 'relative',
        border: brd, flexShrink: 0,
      }}
    >
      <img
        src={photos[idx]}
        alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: fade,
          transition: 'opacity 0.4s ease-in-out',
        }}
      />
    </div>
  )
}
