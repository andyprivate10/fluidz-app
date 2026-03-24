import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ImagePlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { compressImage, readFileAsDataUrl } from '../../lib/media'
import { showToast } from '../Toast'
import { colors } from '../../brand'
import ImageCropModal from '../ImageCropModal'

const S = colors

// Zone icons inline
import { User as UserIcon, Flame, Circle, Footprints } from 'lucide-react'
const ZONE_ICONS: Record<string, React.ReactNode> = {
  torso: <UserIcon size={18} strokeWidth={1.5} />,
  sex: <Flame size={18} strokeWidth={1.5} />,
  butt: <Circle size={18} strokeWidth={1.5} />,
  feet: <Footprints size={18} strokeWidth={1.5} />,
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: 16, border: '1px solid ' + S.rule2, marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

type Props = {
  userId: string
  bodyPartPhotos: Record<string, string[]>
  setBodyPartPhotos: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  photosIntime: string[]
  videosIntime: string[]
  removePhotoIntime: (url: string) => void
  removeVideoIntime: (url: string) => void
  uploadMedia: (file: File, album: 'profil' | 'intime', mediaType: 'photo' | 'video') => Promise<void>
  mediaUploading: boolean
}

export default function ProfileAdultMedia({ userId, bodyPartPhotos, setBodyPartPhotos, photosIntime, videosIntime, removePhotoIntime, removeVideoIntime, uploadMedia, mediaUploading }: Props) {
  const { t } = useTranslation()
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropCallback, setCropCallback] = useState<((file: File) => void) | null>(null)

  const BODY_ZONES = [
    { id: 'torso', label: t('zones.torso') },
    { id: 'sex', label: t('zones.sex') },
    { id: 'butt', label: t('zones.butt') },
    { id: 'feet', label: t('zones.feet') },
  ]

  return (
    <>
      {/* Zones intimes — 2×2 grid, max 4 per zone */}
      <Section title={t('profile.adult_zones')} color={S.p}>
        <p style={{ fontSize: 11, color: S.tx3, margin: '0 0 12px' }}>{t('profile.adult_zones_desc')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {BODY_ZONES.map(zone => {
            const files = bodyPartPhotos[zone.id] || []
            const canAdd = files.length < 4
            return (
              <div key={zone.id} style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid ' + S.rule2, padding: 12, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ color: S.p, opacity: 0.7 }}>{ZONE_ICONS[zone.id]}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.tx, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{zone.label}</span>
                  <span style={{ fontSize: 10, color: S.tx4, marginLeft: 'auto' }}>{files.length}/4</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {files.map((url, i) => {
                    const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
                    return (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                        {isVideo ? (
                          <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button onClick={() => setBodyPartPhotos(prev => {
                          const arr = [...(prev[zone.id] || [])]; arr.splice(i, 1)
                          return { ...prev, [zone.id]: arr }
                        })} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 99, background: S.red, border: '1.5px solid ' + S.bg, color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                        {isVideo && <div style={{ position: 'absolute', bottom: 2, right: 2, padding: '1px 4px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 8, fontWeight: 600 }}>vid</div>}
                      </div>
                    )
                  })}
                  {canAdd && (
                    <label style={{ aspectRatio: '1', borderRadius: 10, border: '1px dashed ' + S.pbd, background: S.p3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                      <input type="file" accept="image/*,video/*" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return; e.target.value = ''
                        const isVid = f.type.startsWith('video/')
                        if (isVid) {
                          // Skip crop for videos
                          const ext = f.name.split('.').pop() || 'mp4'
                          const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
                          const path = `${userId}/zone_${zone.id}_${ts}.${ext}`
                          const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: false })
                          if (error) { showToast(t('errors.upload_error'), 'error'); return }
                          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                          setBodyPartPhotos(prev => ({ ...prev, [zone.id]: [...(prev[zone.id] || []), publicUrl] }))
                        } else {
                          // Show crop for images (4:5 portrait)
                          const dataUrl = await readFileAsDataUrl(f)
                          setCropSrc(dataUrl)
                          const zoneId = zone.id
                          setCropCallback(() => async (croppedFile: File) => {
                            setCropSrc(null); setCropCallback(null)
                            const compressed = await compressImage(croppedFile)
                            const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
                            const path = `${userId}/zone_${zoneId}_${ts}.jpg`
                            const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: false })
                            if (error) { showToast(t('errors.upload_error'), 'error'); return }
                            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
                            setBodyPartPhotos(prev => ({ ...prev, [zoneId]: [...(prev[zoneId] || []), publicUrl] }))
                          })
                        }
                      }} disabled={mediaUploading} style={{ display: 'none' }} />
                      <Plus size={16} strokeWidth={1.5} style={{ color: S.p }} />
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: S.tx3, margin: '10px 0 0' }}>{t('profile.zones_filled', { count: Object.keys(bodyPartPhotos).filter(k => (bodyPartPhotos[k]?.length || 0) > 0).length, total: BODY_ZONES.length })}</p>
      </Section>

      {/* Photos & vidéos adultes — Libre */}
      <Section title={t('profile.adult_free')} color={S.p}>
        <p style={{ fontSize: 11, color: S.tx3, margin: '0 0 8px' }}>{t('profile.adult_free_desc')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {[...photosIntime, ...videosIntime].map((url) => {
            const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
            return (
              <div key={url} style={{ position: 'relative', width: 80, height: 80 }}>
                {isVideo ? (
                  <video src={url} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid ' + S.pbd }} />
                ) : (
                  <img src={url} alt="" loading="lazy" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid ' + S.pbd }} />
                )}
                <button onClick={() => { removePhotoIntime(url); removeVideoIntime(url) }} style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: 99, background: S.red, border: '2px solid ' + S.bg1, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}>×</button>
                {isVideo && <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 600 }}>video</div>}
              </div>
            )
          })}
          <label style={{ width: 80, height: 80, borderRadius: 12, border: '1px dashed ' + S.pbd, background: S.p3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
            <input type="file" accept="image/*,video/*" multiple onChange={async (e) => {
              const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
              for (const f of captured) {
                if (f.type.startsWith('video/')) {
                  await uploadMedia(f, 'intime', 'video')
                } else {
                  // Show crop for images (4:5 portrait)
                  const dataUrl = await readFileAsDataUrl(f)
                  setCropSrc(dataUrl)
                  await new Promise<void>((resolve) => {
                    setCropCallback(() => async (croppedFile: File) => {
                      setCropSrc(null); setCropCallback(null)
                      await uploadMedia(croppedFile, 'intime', 'photo')
                      resolve()
                    })
                  })
                }
              }
            }} disabled={mediaUploading} style={{ display: 'none' }} />
            <ImagePlus size={18} strokeWidth={1.5} style={{ color: S.p }} />
          </label>
        </div>
        <p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>{t('profile.media_count', { photos: photosIntime.length, videos: videosIntime.length })}</p>
        {mediaUploading && <p style={{ fontSize: 12, color: S.p, marginTop: 8 }}>{t('profile.upload_in_progress')}</p>}
      </Section>

      {/* Crop Modal */}
      {cropSrc && cropCallback && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={4 / 5}
          onConfirm={cropCallback}
          onCancel={() => { setCropSrc(null); setCropCallback(null) }}
        />
      )}
    </>
  )
}
