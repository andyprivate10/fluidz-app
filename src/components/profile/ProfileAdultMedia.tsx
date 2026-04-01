import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ImagePlus, SmilePlus, Flame, Circle, Maximize } from 'lucide-react'
import { User as UserIcon, ArrowLeftRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { compressImage, readFileAsDataUrl } from '../../lib/media'
import { validateMediaFile } from '../../lib/sanitize'
import { showToast } from '../Toast'
import { colors } from '../../brand'
import ImageCropModal from '../ImageCropModal'

const S = colors

const ZONE_ICONS: Record<string, React.ReactNode> = {
  face: <SmilePlus size={18} strokeWidth={1.5} />,
  torso: <UserIcon size={18} strokeWidth={1.5} />,
  back: <ArrowLeftRight size={18} strokeWidth={1.5} />,
  butt: <Circle size={18} strokeWidth={1.5} />,
  sex: <Flame size={18} strokeWidth={1.5} />,
  full_body: <Maximize size={18} strokeWidth={1.5} />,
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
    { id: 'face', label: t('zones.face') },
    { id: 'torso', label: t('zones.torso') },
    { id: 'back', label: t('zones.back') },
    { id: 'butt', label: t('zones.butt') },
    { id: 'sex', label: t('zones.sex') },
    { id: 'full_body', label: t('zones.full_body') },
  ]

  function handleZoneUpload(zoneId: string) {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (!f) return; e.target.value = ''
      const vErr = validateMediaFile(f); if (vErr) { showToast(t(vErr), 'error'); return }
      const isVid = f.type.startsWith('video/')
      if (isVid) {
        const ext = f.name.split('.').pop() || 'mp4'
        const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
        const path = `${userId}/zone_${zoneId}_${ts}.${ext}`
        const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: false })
        if (error) { showToast(t('errors.upload_error'), 'error'); return }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        setBodyPartPhotos(prev => ({ ...prev, [zoneId]: [...(prev[zoneId] || []), publicUrl] }))
      } else {
        const dataUrl = await readFileAsDataUrl(f)
        setCropSrc(dataUrl)
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
    }
  }

  return (
    <>
      {/* Zones intimes — 3-col grid, max 4 per zone */}
      <Section title={t('profile.adult_zones')} color={S.p}>
        <p style={{ fontSize: 11, color: S.tx3, margin: '0 0 12px' }}>{t('profile.adult_zones_desc')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {BODY_ZONES.map(zone => {
            const files = bodyPartPhotos[zone.id] || []
            const canAdd = files.length < 4
            const hasFiles = files.length > 0
            return (
              <div key={zone.id}>
                {!hasFiles ? (
                  /* Empty card = entire card is a drop zone */
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1,
                    aspectRatio: '3/4', borderRadius: 16,
                    border: '1px dashed ' + S.pbd, background: S.p3,
                  }}>
                    <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={handleZoneUpload(zone.id)} disabled={mediaUploading} style={{ display: 'none' }} />
                    <div style={{ color: S.p, opacity: 0.7 }}>{ZONE_ICONS[zone.id]}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{zone.label}</span>
                    <Plus size={14} strokeWidth={1.5} style={{ color: S.p }} />
                  </label>
                ) : (
                  /* Card with files */
                  <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid ' + S.rule2, padding: 8, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <div style={{ color: S.p, opacity: 0.7 }}>{ZONE_ICONS[zone.id]}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: S.tx, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{zone.label}</span>
                      <span style={{ fontSize: 9, color: S.tx4, marginLeft: 'auto' }}>{files.length}/4</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      {files.map((url, i) => {
                        const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
                        return (
                          <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                            {isVideo ? (
                              <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button onClick={() => setBodyPartPhotos(prev => {
                              const arr = [...(prev[zone.id] || [])]; arr.splice(i, 1)
                              return { ...prev, [zone.id]: arr }
                            })} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 99, background: S.red, border: '1.5px solid ' + S.bg, color: S.tx, fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>x</button>
                          </div>
                        )
                      })}
                      {canAdd && (
                        <label style={{ aspectRatio: '1', borderRadius: 8, border: '1px dashed ' + S.pbd, background: S.p3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
                          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={handleZoneUpload(zone.id)} disabled={mediaUploading} style={{ display: 'none' }} />
                          <Plus size={14} strokeWidth={1.5} style={{ color: S.p }} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: S.tx3, margin: '10px 0 0' }}>{t('profile.zones_filled', { count: Object.keys(bodyPartPhotos).filter(k => (bodyPartPhotos[k]?.length || 0) > 0).length, total: BODY_ZONES.length })}</p>
      </Section>

      {/* Photos & videos adultes — Libre */}
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
                <button onClick={() => { removePhotoIntime(url); removeVideoIntime(url) }} style={{ position: 'absolute', top: -16, left: -16, width: 44, height: 44, borderRadius: 99, background: 'transparent', border: 'none', color: S.tx, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}><span style={{ width: 20, height: 20, borderRadius: 99, background: S.red, border: '2px solid ' + S.bg1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</span></button>
                {isVideo && <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', color: S.tx, fontSize: 9, fontWeight: 600 }}>video</div>}
              </div>
            )
          })}
          <label style={{ width: 80, height: 80, borderRadius: 12, border: '1px dashed ' + S.pbd, background: S.p3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: mediaUploading ? 'wait' : 'pointer', opacity: mediaUploading ? 0.5 : 1 }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={async (e) => {
              const fileList = e.target.files; if (!fileList) return; const captured = Array.from(fileList); e.target.value = ''
              for (const f of captured) {
                const vErr = validateMediaFile(f); if (vErr) { showToast(t(vErr), 'error'); continue }
                if (f.type.startsWith('video/')) {
                  await uploadMedia(f, 'intime', 'video')
                } else {
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
