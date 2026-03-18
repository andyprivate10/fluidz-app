import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { MapPin, Filter, Eye, EyeOff } from 'lucide-react'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

type NearbyProfile = {
  id: string
  display_name: string
  avatar_url?: string
  role?: string
  age?: number
  morphology?: string
  distance?: number // km
}

const ROLE_FILTERS = ['Tous', 'Top', 'Bottom', 'Versa', 'Side']

function roundCoord(val: number, precision = 0.005): number {
  return Math.round(val / precision) * precision
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function ExplorePage() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<NearbyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [myLat, setMyLat] = useState<number | null>(null)
  const [myLng, setMyLng] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [userId, setUserId] = useState<string | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [exploreTab, setExploreTab] = useState<'profils'|'sessions'>('profils')
  const [nearbySessions, setNearbySessions] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login?next=/explore'); return }
      setUserId(user.id)
      // Load current visibility setting
      supabase.from('user_profiles').select('location_visible, approx_lat, approx_lng').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setVisible(!!data.location_visible)
          if (data.approx_lat && data.approx_lng) { setMyLat(data.approx_lat); setMyLng(data.approx_lng) }
        }
      })
    })
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = roundCoord(pos.coords.latitude)
        const lng = roundCoord(pos.coords.longitude)
        setMyLat(lat); setMyLng(lng); setGeoError(false)
        if (userId) {
          await supabase.from('user_profiles').update({
            approx_lat: lat, approx_lng: lng, location_visible: true, location_updated_at: new Date().toISOString(),
          }).eq('id', userId)
          setVisible(true)
        }
        loadNearby(lat, lng)
        // Load public sessions nearby
        const delta = 0.15
        const { data: pubSess } = await supabase.from('sessions')
          .select('id, title, approx_area, tags, host_id, approx_lat, approx_lng, created_at')
          .eq('is_public', true).eq('status', 'open')
          .gte('approx_lat', lat - delta).lte('approx_lat', lat + delta)
          .gte('approx_lng', lng - delta).lte('approx_lng', lng + delta)
          .limit(20)
        if (pubSess && pubSess.length > 0) {
          const hIds = [...new Set(pubSess.map((s: any) => s.host_id))]
          const sIds = pubSess.map((s: any) => s.id)
          const [{ data: hProfs }, { data: appCounts }] = await Promise.all([
            supabase.from('user_profiles').select('id, display_name, profile_json').in('id', hIds),
            supabase.from('applications').select('session_id').in('session_id', sIds).in('status', ['accepted', 'checked_in']),
          ])
          const hMap = new Map<string, { name: string; avatar?: string }>()
          ;(hProfs || []).forEach((p: any) => hMap.set(p.id, { name: p.display_name, avatar: p.profile_json?.avatar_url }))
          const countMap = new Map<string, number>()
          ;(appCounts || []).forEach((a: any) => countMap.set(a.session_id, (countMap.get(a.session_id) || 0) + 1))
          setNearbySessions(pubSess.map((s: any) => ({ ...s, host_name: hMap.get(s.host_id)?.name || 'Host', host_avatar: hMap.get(s.host_id)?.avatar, member_count: (countMap.get(s.id) || 0) + 1 })))
        }
      },
      () => { setGeoError(true); setLoading(false) },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [userId])

  useEffect(() => {
    if (myLat && myLng) loadNearby(myLat, myLng)
    else requestLocation()
  }, [myLat, myLng, requestLocation])

  async function loadNearby(lat: number, lng: number) {
    setLoading(true)
    // Approximate bounding box (~10km)
    const delta = 0.1
    const { data } = await supabase.from('user_profiles')
      .select('id, display_name, profile_json, approx_lat, approx_lng')
      .eq('location_visible', true)
      .gte('approx_lat', lat - delta).lte('approx_lat', lat + delta)
      .gte('approx_lng', lng - delta).lte('approx_lng', lng + delta)
      .neq('id', userId)
      .limit(50)

    const mapped: NearbyProfile[] = (data || []).map((p: any) => {
      const pj = p.profile_json || {}
      const dist = p.approx_lat && p.approx_lng ? haversine(lat, lng, p.approx_lat, p.approx_lng) : undefined
      return {
        id: p.id,
        display_name: p.display_name || 'Anonyme',
        avatar_url: pj.avatar_url,
        role: pj.role,
        age: pj.age,
        morphology: pj.morphology,
        distance: dist ? Math.round(dist * 10) / 10 : undefined,
      }
    })
    mapped.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    setProfiles(mapped)
    setLoading(false)
  }

  async function toggleVisibility() {
    if (!userId) return
    const newVal = !visible
    await supabase.from('user_profiles').update({ location_visible: newVal }).eq('id', userId)
    setVisible(newVal)
    showToast(newVal ? 'Tu es visible dans la galerie' : 'Tu es masqué', newVal ? 'success' : 'info')
  }

  const filtered = roleFilter === 'Tous' ? profiles : profiles.filter(p => p.role === roleFilter)
  const { pullHandlers, pullIndicator } = usePullToRefresh(async () => { if (myLat && myLng) await loadNearby(myLat, myLng) })

  return (
    <div {...pullHandlers} style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      {/* Header */}
      <div style={{ padding: '40px 20px 12px', borderBottom: '1px solid ' + S.border }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: '0 0 2px' }}>Autour de moi</h1>
            <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{exploreTab === 'profils' ? `${filtered.length} profils` : `${nearbySessions.length} sessions`} à proximité</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleVisibility} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid ' + (visible ? S.green + '44' : S.border), background: visible ? S.green + '14' : 'transparent', color: visible ? S.green : S.tx4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />} {visible ? 'Visible' : 'Masqué'}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid ' + S.border, background: 'transparent', color: S.tx3, cursor: 'pointer' }}>
              <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
            {ROLE_FILTERS.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                border: '1px solid ' + (roleFilter === r ? S.p300 + '55' : S.border),
                background: roleFilter === r ? S.p300 + '14' : 'transparent',
                color: roleFilter === r ? S.p300 : S.tx3,
              }}>{r}</button>
            ))}
          </div>
        )}

        {/* Explore tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {(['profils', 'sessions'] as const).map(t => (
            <button key={t} onClick={() => setExploreTab(t)} style={{
              flex: 1, padding: '7px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1px solid ' + (exploreTab === t ? '#F9A8A855' : '#2A2740'),
              background: exploreTab === t ? '#F9A8A814' : 'transparent',
              color: exploreTab === t ? '#F9A8A8' : '#7E7694',
            }}>{t === 'profils' ? '👤 Profils' : '🎉 Sessions'}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
      {exploreTab === 'profils' ? (<>
        {geoError && (
          <div style={{ textAlign: 'center', padding: 32, color: S.tx3 }}>
            <MapPin size={32} style={{ color: S.tx4, marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Localisation nécessaire</p>
            <p style={{ fontSize: 12, margin: '0 0 16px' }}>Active la géolocalisation pour voir les profils à proximité</p>
            <button onClick={requestLocation} style={{ padding: '10px 20px', borderRadius: 12, background: S.grad, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Activer la localisation
            </button>
          </div>
        )}

        {loading && !geoError && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #F9A8A844', borderTopColor: '#F9A8A8', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: S.tx3, fontSize: 13 }}>Recherche de profils...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {!loading && !geoError && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Personne à proximité</p>
            <p style={{ fontSize: 12 }}>Reviens plus tard ou élargis ta zone</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => navigate('/profile/' + p.id)}
                style={{ background: S.bg1, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid ' + S.border }}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '3/4', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ padding: '8px 8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.display_name}</span>
                    {p.age && <span style={{ fontSize: 10, color: S.tx3 }}>{p.age}</span>}
                  </div>
                  {p.role && <span style={{ fontSize: 10, fontWeight: 600, color: S.p300 }}>{p.role}</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {p.distance !== undefined && <span style={{ fontSize: 9, color: S.tx4 }}>{p.distance < 1 ? (p.distance * 1000).toFixed(0) + 'm' : p.distance.toFixed(1) + 'km'}</span>}
                    <VibeScoreBadge userId={p.id} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>) : (
        <>
          {nearbySessions.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#7E7694' }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Pas de sessions publiques</p>
              <p style={{ fontSize: 12 }}>Les sessions publiques à proximité apparaîtront ici</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nearbySessions.map((s: any) => (
              <div key={s.id} onClick={() => navigate('/session/' + s.id)} style={{ background: '#16141F', border: '1px solid #2A2740', borderRadius: 16, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {s.host_avatar ? (
                    <img src={s.host_avatar} alt="" style={{ width: 32, height: 32, borderRadius: '28%', objectFit: 'cover', border: '1px solid #2A2740' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '28%', background: 'linear-gradient(135deg,#F9A8A8,#F47272)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{(s.host_name || 'H')[0]}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#F0EDFF', margin: 0 }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: '#7E7694', margin: '2px 0 0' }}>par {s.host_name}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  {s.approx_area && <span style={{ fontSize: 12, color: '#B8B2CC' }}>📍 {s.approx_area}</span>}
                  {s.member_count > 0 && <span style={{ fontSize: 11, color: '#7E7694' }}>👥 {s.member_count}</span>}
                  {s.created_at && <span style={{ fontSize: 10, color: '#453F5C' }}>{(() => { const m = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 60000); return m < 60 ? m + 'min' : Math.floor(m / 60) + 'h' })()}</span>}
                </div>
                {s.tags && s.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.tags.slice(0, 5).map((tag: string) => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#F9A8A818', color: '#F9A8A8', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); navigate('/session/' + s.id + '/apply') }} style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: 10, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Postuler →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  )
}
