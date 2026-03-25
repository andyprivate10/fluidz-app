import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { ChevronDown, ChevronUp, Upload, Trash2, Image } from 'lucide-react'

const S = colors

interface ProfileJson {
  avatar_url?: string
  photos_profil?: string[]
  photos_intime?: string[]
  body_part_photos?: Record<string, string[]>
  [key: string]: unknown
}

interface UserRow {
  id: string
  display_name: string
  profile_json: ProfileJson | null
}

export default function AdminProfilesTab() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name, profile_json')
      .order('display_name')
    setUsers((data as UserRow[]) || [])
    setLoading(false)
  }

  const toggleExpand = useCallback((uid: string) => {
    setExpanded(prev => prev === uid ? null : uid)
  }, [])

  async function uploadFile(userId: string, category: string, file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${category}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) { setUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = urlData.publicUrl

    const user = users.find(u => u.id === userId)
    const pj = { ...(user?.profile_json || {}) }

    if (category === 'avatar') {
      pj.avatar_url = url
    } else if (category === 'profil') {
      pj.photos_profil = [...(pj.photos_profil || []), url]
    } else if (category === 'intime') {
      pj.photos_intime = [...(pj.photos_intime || []), url]
    } else {
      // body part category
      const bpp = { ...(pj.body_part_photos || {}) }
      bpp[category] = [...(bpp[category] || []), url]
      pj.body_part_photos = bpp
    }

    await supabase.from('user_profiles').update({ profile_json: pj }).eq('id', userId)
    await loadUsers()
    setUploading(false)
  }

  async function removeMedia(userId: string, category: string, url: string) {
    if (deleting !== url) { setDeleting(url); return }
    const user = users.find(u => u.id === userId)
    const pj = { ...(user?.profile_json || {}) }

    if (category === 'avatar') {
      pj.avatar_url = undefined
    } else if (category === 'profil') {
      pj.photos_profil = (pj.photos_profil || []).filter(u => u !== url)
    } else if (category === 'intime') {
      pj.photos_intime = (pj.photos_intime || []).filter(u => u !== url)
    } else {
      const bpp = { ...(pj.body_part_photos || {}) }
      bpp[category] = (bpp[category] || []).filter(u => u !== url)
      pj.body_part_photos = bpp
    }

    await supabase.from('user_profiles').update({ profile_json: pj }).eq('id', userId)
    setDeleting(null)
    await loadUsers()
  }

  function MediaGrid({ urls, userId, category }: { urls: string[]; userId: string; category: string }) {
    if (urls.length === 0) return <span style={{ fontSize: 10, color: S.tx4 }}>Aucun</span>
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {urls.map(url => (
          <div key={url} style={{ position: 'relative', width: 56, height: 56 }}>
            <img src={url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid ' + S.rule }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <button onClick={() => removeMedia(userId, category, url)} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 99, background: S.red, border: '1px solid ' + S.bg, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}>
              {deleting === url ? '!' : '×'}
            </button>
          </div>
        ))}
      </div>
    )
  }

  function UploadBtn({ userId, category, label }: { userId: string; category: string; label: string }) {
    return (
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...adminStyles.btnSecondary, padding: '4px 10px', fontSize: 10, cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
        <Upload size={10} strokeWidth={1.5} />
        {label}
        <input type="file" accept="image/*" onChange={e => {
          const f = e.target.files?.[0]
          if (f) uploadFile(userId, category, f)
          e.target.value = ''
        }} disabled={uploading} style={{ display: 'none' }} />
      </label>
    )
  }

  if (loading) return <p style={{ color: S.tx3, fontSize: 12 }}>Chargement...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={adminStyles.sectionLabel(S.lav)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Image size={10} strokeWidth={2} />
          PROFILE MEDIA
        </span>
      </p>

      {users.map(u => {
        const pj = u.profile_json || {}
        const isOpen = expanded === u.id
        const photoCount = (pj.photos_profil?.length || 0) + (pj.photos_intime?.length || 0)
        return (
          <div key={u.id} style={{ ...adminStyles.card, padding: 0, overflow: 'hidden' }}>
            <button onClick={() => toggleExpand(u.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              {pj.avatar_url ? (
                <img src={pj.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.bg2, border: '1px solid ' + S.rule, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.display_name || '(sans nom)'}
                </div>
                <div style={{ fontSize: 10, color: S.tx3, marginTop: 2 }}>
                  {photoCount} media{photoCount !== 1 ? 's' : ''}
                </div>
              </div>
              {isOpen ? <ChevronUp size={14} style={{ color: S.tx3 }} /> : <ChevronDown size={14} style={{ color: S.tx3 }} />}
            </button>

            {isOpen && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid ' + S.rule }}>
                {/* Avatar */}
                <div style={{ paddingTop: 12 }}>
                  <label style={{ fontSize: 10, color: S.sage, fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avatar</label>
                  {pj.avatar_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={pj.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + S.rule }} />
                      <button onClick={() => removeMedia(u.id, 'avatar', pj.avatar_url!)} style={{ ...adminStyles.btnDanger, padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Trash2 size={10} strokeWidth={1.5} /> {deleting === pj.avatar_url ? t('common.confirm') : t('common.delete')}
                      </button>
                    </div>
                  ) : <span style={{ fontSize: 10, color: S.tx4 }}>Aucun</span>}
                  <div style={{ marginTop: 6 }}><UploadBtn userId={u.id} category="avatar" label="Upload avatar" /></div>
                </div>

                {/* Public photos */}
                <div>
                  <label style={{ fontSize: 10, color: S.sage, fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos publiques</label>
                  <MediaGrid urls={pj.photos_profil || []} userId={u.id} category="profil" />
                  <div style={{ marginTop: 6 }}><UploadBtn userId={u.id} category="profil" label="Upload photo" /></div>
                </div>

                {/* Adult free photos */}
                <div>
                  <label style={{ fontSize: 10, color: S.p, fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos adultes</label>
                  <MediaGrid urls={pj.photos_intime || []} userId={u.id} category="intime" />
                  <div style={{ marginTop: 6 }}><UploadBtn userId={u.id} category="intime" label="Upload photo adulte" /></div>
                </div>

                {/* Body part photos */}
                <div>
                  <label style={{ fontSize: 10, color: S.lav, fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zones corporelles</label>
                  {(['torso', 'sex', 'butt', 'feet'] as const).map(zone => (
                    <div key={zone} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: S.tx3, fontWeight: 600, textTransform: 'capitalize' }}>{zone}</span>
                      <div style={{ marginTop: 4 }}>
                        <MediaGrid urls={(pj.body_part_photos || {})[zone] || []} userId={u.id} category={zone} />
                      </div>
                      <div style={{ marginTop: 4 }}><UploadBtn userId={u.id} category={zone} label={`Upload ${zone}`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {users.length === 0 && <p style={{ color: S.tx3, fontSize: 12, textAlign: 'center', padding: 24 }}>Aucun utilisateur</p>}
    </div>
  )
}
