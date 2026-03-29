import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { colors } from '../brand'

const S = colors

type Props = {
  images: string[]
  startIndex?: number
  onClose: () => void
}

export default function ImageLightbox({ images, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [images.length, onClose])

  const src = images[index]
  const isVideo = /\.(mp4|mov|webm)$/i.test(src) || src.includes('video')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
          {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button aria-label={zoomed ? 'Zoom out' : 'Zoom in'} onClick={() => setZoomed(!zoomed)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {zoomed ? <ZoomOut size={18} style={{ color: S.tx }} /> : <ZoomIn size={18} style={{ color: S.tx }} />}
          </button>
          <button aria-label="Close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} style={{ color: S.tx }} />
          </button>
        </div>
      </div>

      {/* Media */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '60px 20px', overflow: zoomed ? 'auto' : 'hidden' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {isVideo ? (
          <video src={src} controls autoPlay playsInline style={{ maxWidth: zoomed ? 'none' : '100%', maxHeight: zoomed ? 'none' : '80vh', borderRadius: 12 }} />
        ) : (
          <img src={src} alt="" loading="lazy" style={{
            maxWidth: zoomed ? 'none' : '100%', maxHeight: zoomed ? 'none' : '80vh',
            borderRadius: 12, objectFit: 'contain',
            transform: zoomed ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            cursor: zoomed ? 'zoom-out' : 'zoom-in',
          }}
          onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
          />
        )}
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          {index > 0 && (
            <button aria-label="Previous image" onClick={() => setIndex(i => i - 1)} style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99,
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <ChevronLeft size={24} style={{ color: S.tx }} />
            </button>
          )}
          {index < images.length - 1 && (
            <button aria-label="Next image" onClick={() => setIndex(i => i + 1)} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99,
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <ChevronRight size={24} style={{ color: S.tx }} />
            </button>
          )}
        </>
      )}

      {/* Dots */}
      {images.length > 1 && images.length <= 12 && (
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 6 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} style={{
              width: i === index ? 16 : 6, height: 6, borderRadius: 3,
              background: i === index ? '#fff' : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: 'pointer', transition: 'width 0.2s, background 0.2s',
              padding: 0,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
