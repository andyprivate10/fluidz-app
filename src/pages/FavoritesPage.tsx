import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Heart, ArrowLeft } from 'lucide-react'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useTranslation } from 'react-i18next'

const S = colors

type Favorite = { id: string; target_user_id: string; name: string; avatar?: string; role?: string }

export default function FavoritesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadFavorites()
  }, [user])

  async function loadFavorites() {
    if (!user) { navigate('/login'); return }
    const { data: favs } = await supabase.from('favorites').select('id, target_user_id').eq('user_id', user.id).order('created_at', { ascending: false })
    if (!favs || favs.length === 0) { setFavorites([]); setLoading(false); return }
    const ids = favs.map(f => f.target_user_id)
    const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    setFavorites(favs.map(f => {
      const p = pMap.get(f.target_user_id)
      return { id: f.id, target_user_id: f.target_user_id, name: p?.display_name || '?', avatar: (p?.profile_json as any)?.avatar_url, role: (p?.profile_json as any)?.role }
    }))
    setLoading(false)
  }

  async function removeFavorite(favId: string) {
    await supabase.from('favorites').delete().eq('id', favId)
    setFavorites(prev => prev.filter(f => f.id !== favId))
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      <OrbLayer />
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          <ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />{t('common.back_label')}
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: 0 }}>{t('favorites.title')}</h1>
        <p style={{ fontSize: 12, color: S.tx3, margin: '2px 0 0' }}>{favorites.length} {t('favorites.count')}</p>
      </div>

      <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 160, borderRadius: 14, background: S.bg2, animation: 'pulse 1.5s infinite' }} />
        ))}

        {!loading && favorites.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: S.tx3 }}>
            <Heart size={32} style={{ color: S.tx4, marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>{t('favorites.empty')}</p>
            <p style={{ fontSize: 12 }}>{t('favorites.empty_desc')}</p>
          </div>
        )}

        {favorites.map(fav => (
          <div key={fav.id} style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, overflow: 'hidden', border: '1px solid ' + S.rule2, position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/profile/' + fav.target_user_id)}>
            {fav.avatar ? (
              <img src={fav.avatar} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '3/4', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                {fav.name[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id) }} style={{
              position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 99,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
            }}>
              <Heart size={13} strokeWidth={1.5} fill={S.p} style={{ color: S.p }} />
            </button>
            <div style={{ padding: '8px 10px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.tx }}>{fav.name}</span>
              {fav.role && <span style={{ display: 'block', fontSize: 11, color: S.p, fontWeight: 600, marginTop: 2 }}>{fav.role}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
