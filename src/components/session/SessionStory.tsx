import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, glassCard } from '../../brand'
import LazyImage from '../LazyImage'
import { Camera, Play, X } from 'lucide-react'
import { stripHtml } from '../../lib/sanitize'

const S = colors

type StoryItem = {
  url: string
  type: 'photo' | 'video'
  memberId: string
  memberName: string
}

interface Props {
  sessionId: string
}

export default function SessionStory({ sessionId }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Get all accepted/checked_in applications with eps_json
      const { data: apps } = await supabase
        .from('applications')
        .select('applicant_id, eps_json')
        .eq('session_id', sessionId)
        .in('status', ['accepted', 'checked_in'])

      if (!apps || apps.length === 0) { setItems([]); setLoading(false); return }

      // Get member names
      const ids = apps.map(a => a.applicant_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', ids)
      const nameMap = new Map((profiles || []).map(p => [p.id, p.display_name || '?']))

      // Extract photos/videos from eps_json profile_snapshot
      const storyItems: StoryItem[] = []
      for (const app of apps) {
        const eps = app.eps_json as Record<string, unknown> | null
        if (!eps) continue
        const snapshot = (eps.profile_snapshot || {}) as Record<string, unknown>
        const sections = (eps.shared_sections || []) as string[]
        const name = nameMap.get(app.applicant_id) || '?'

        // Profile photos
        if (sections.includes('photos_profil')) {
          const photos = (snapshot.photos_profil || snapshot.photos || []) as string[]
          for (const url of photos) {
            storyItems.push({ url, type: 'photo', memberId: app.applicant_id, memberName: name })
          }
        }
        // Adult photos
        if (sections.includes('photos_adulte')) {
          const adulte = (snapshot.photos_intime || []) as string[]
          for (const url of adulte) {
            storyItems.push({ url, type: 'photo', memberId: app.applicant_id, memberName: name })
          }
          const videos = (snapshot.videos_intime || []) as string[]
          for (const url of videos) {
            storyItems.push({ url, type: 'video', memberId: app.applicant_id, memberName: name })
          }
        }
      }

      setItems(storyItems)
      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ ...glassCard, marginBottom: 12, height: 120, animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Camera size={40} strokeWidth={1} style={{ color: S.tx4, marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: S.tx3, margin: 0 }}>{t('session.story_empty')}</p>
      </div>
    )
  }

  const [fullscreen, setFullscreen] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0Ref = useRef(Date.now())
  const SLIDE_DURATION = 4000

  const closeFullscreen = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFullscreen(null)
    setProgress(0)
  }, [])

  const goTo = useCallback((idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (idx < 0 || idx >= items.length) { closeFullscreen(); return }
    setFullscreen(idx)
    setProgress(0)
    t0Ref.current = Date.now()
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - t0Ref.current) / SLIDE_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (idx < items.length - 1) goTo(idx + 1)
        else closeFullscreen()
      }
    }, 50)
  }, [items.length, closeFullscreen])

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  const cur = fullscreen !== null ? items[fullscreen] : null

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {items.map((item, idx) => (
          <div key={idx} onClick={() => goTo(idx)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
            {item.type === 'video' ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <Play size={24} fill="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }} />
              </div>
            ) : (
              <LazyImage src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 6px 4px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{stripHtml(item.memberName)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      {fullscreen !== null && cur && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
          {/* Progress bars */}
          <div style={{ display: 'flex', gap: 3, padding: '12px 12px 0', zIndex: 20 }}>
            {items.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#fff', width: i < fullscreen ? '100%' : i === fullscreen ? `${progress}%` : '0%', transition: i === fullscreen ? 'width 0.05s linear' : 'none' }} />
              </div>
            ))}
          </div>
          {/* Close */}
          <button onClick={closeFullscreen} style={{ position: 'absolute', top: 24, right: 16, zIndex: 30, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}>
            <X size={20} style={{ color: '#fff' }} />
          </button>
          {/* Tap zones */}
          <div onClick={() => goTo(fullscreen - 1)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 10 }} />
          <div onClick={() => goTo(fullscreen + 1)} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%', zIndex: 10 }} />
          {/* Media */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cur.type === 'video' ? (
              <video src={cur.url} autoPlay playsInline controls style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />
            ) : (
              <img src={cur.url} alt="" style={{ width: '100%', height: '100vh', objectFit: 'cover' }} />
            )}
          </div>
          {/* Gradient overlay with member info */}
          <div onClick={() => navigate('/profile/' + cur.memberId)} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', padding: '60px 20px 32px', cursor: 'pointer', pointerEvents: 'auto' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>{stripHtml(cur.memberName)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
