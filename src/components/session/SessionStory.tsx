import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, glassCard } from '../../brand'
import LazyImage from '../LazyImage'
import ImageLightbox from '../ImageLightbox'
import { Camera, Play } from 'lucide-react'

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
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

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

  const allPhotos = items.filter(i => i.type === 'photo').map(i => i.url)

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
            {item.type === 'video' ? (
              <div onClick={() => {}} style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <Play size={24} fill="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }} />
              </div>
            ) : (
              <LazyImage
                src={item.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onClick={() => {
                  const photoIdx = allPhotos.indexOf(item.url)
                  setLightbox({ images: allPhotos, index: photoIdx >= 0 ? photoIdx : 0 })
                }}
              />
            )}
            {/* Member name overlay */}
            <div
              onClick={(e) => { e.stopPropagation(); navigate('/profile/' + item.memberId) }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px 6px 4px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{item.memberName}</span>
            </div>
          </div>
        ))}
      </div>

      {lightbox && <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
