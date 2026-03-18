import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, Clock, Lock } from 'lucide-react'
import { colors } from '../brand'

const S = colors

type EphemeralMedia = {
  id: string
  media_url: string
  max_views: number
  max_duration_sec: number
  views_count: number
  expires_at: string
}

/**
 * Viewer for ephemeral (self-destructing) media
 * - Shows media for max_duration_sec seconds
 * - Increments views_count on open
 * - Locks when views_count >= max_views or expired
 */
export default function EphemeralMediaViewer({ mediaId, onClose }: { mediaId: string; onClose: () => void }) {
  const [media, setMedia] = useState<EphemeralMedia | null>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [lockReason, setLockReason] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [viewing, setViewing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadMedia()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [mediaId])

  async function loadMedia() {
    const { data, error } = await supabase.from('ephemeral_media')
      .select('*').eq('id', mediaId).maybeSingle()

    if (error || !data) {
      setLocked(true)
      setLockReason('Contenu introuvable')
      setLoading(false)
      return
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      setLocked(true)
      setLockReason('Contenu expiré')
      setLoading(false)
      return
    }

    // Check views
    if (data.views_count >= data.max_views) {
      setLocked(true)
      setLockReason(`Nombre de vues atteint (${data.max_views}/${data.max_views})`)
      setLoading(false)
      return
    }

    setMedia(data)
    setTimeLeft(data.max_duration_sec)
    setLoading(false)
  }

  async function startViewing() {
    if (!media) return

    // Increment view count
    await supabase.from('ephemeral_media')
      .update({ views_count: media.views_count + 1 })
      .eq('id', media.id)

    setViewing(true)

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setViewing(false)
          setLocked(true)
          setLockReason('Temps écoulé')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  if (loading) return (
    <div style={overlay}>
      <div style={{ color: S.tx3, fontSize: 14 }}>Chargement...</div>
    </div>
  )

  if (locked) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Lock size={48} style={{ color: S.tx4, marginBottom: 16 }} />
        <p style={{ color: S.tx3, fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>{lockReason}</p>
        <p style={{ color: S.tx4, fontSize: 12 }}>Tap pour fermer</p>
      </div>
    </div>
  )

  if (!viewing && media) return (
    <div style={overlay}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Eye size={40} style={{ color: S.p, marginBottom: 12 }} />
        <p style={{ color: S.tx, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Contenu éphémère</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: S.orange }}>{media.max_views - media.views_count}</div>
            <div style={{ fontSize: 11, color: S.tx3 }}>vues restantes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: S.p }}>{media.max_duration_sec}s</div>
            <div style={{ fontSize: 11, color: S.tx3 }}>durée max</div>
          </div>
        </div>
        <button onClick={startViewing} style={{
          padding: '14px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15,
          color: '#fff', background: S.p,
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px #F4727244',
        }}>
          Voir le contenu
        </button>
        <button onClick={onClose} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </div>
  )

  // Viewing state
  return (
    <div style={overlay} onClick={onClose}>
      {/* Timer bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: S.bg2, zIndex: 2 }}>
        <div style={{
          height: '100%', background: timeLeft > 5 ? S.p : S.red,
          width: `${(timeLeft / (media?.max_duration_sec || 30)) * 100}%`,
          transition: 'width 1s linear',
          borderRadius: 2,
        }} />
      </div>

      {/* Timer label */}
      <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
        <Clock size={14} style={{ color: timeLeft > 5 ? S.tx3 : S.red }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: timeLeft > 5 ? S.tx : S.red }}>{timeLeft}s</span>
      </div>

      {/* Views remaining */}
      <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
        <Eye size={14} style={{ color: S.tx3 }} />
        <span style={{ fontSize: 12, color: S.tx3 }}>{(media?.max_views || 0) - (media?.views_count || 0) - 1} vues restantes</span>
      </div>

      {/* Media */}
      {media && (
        media.media_url.match(/\.(mp4|webm|mov)/i) ? (
          <video src={media.media_url} autoPlay controls={false} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }} />
        ) : (
          <img src={media.media_url} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
        )
      )}

      {/* Screenshot deterrent overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(45deg, transparent, transparent 200px, rgba(249,168,168,0.03) 200px, rgba(249,168,168,0.03) 202px)',
      }} />
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(12,10,20,0.95)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
