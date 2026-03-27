import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { MapPin, Filter, Eye, EyeOff, BookOpen, Map as MapIcon, LayoutGrid, Shield, Globe, UserPlus, CheckCircle2 } from 'lucide-react'
import MapView from '../components/MapView'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { useTranslation } from 'react-i18next'
import ProfileBadges from '../components/ProfileBadges'

const S = colors


type NearbyProfile = {
  id: string
  display_name: string
  avatar_url?: string
  role?: string
  orientation?: string
  age?: number
  morphology?: string
  distance?: number // km
  lastSeen?: string
  home_country?: string
  home_city?: string
  languages?: string[]
  prep?: string
  created_at?: string
}

// ROLE_FILTERS built dynamically from admin_config in component

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
  const { t } = useTranslation()
  const { roles: roleOptions } = useAdminConfig()
  const roleFilters = [t('common.all'), ...roleOptions.map(r => r.label)]
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [profiles, setProfiles] = useState<NearbyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [myLat, setMyLat] = useState<number | null>(null)
  const [myLng, setMyLng] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [roleFilter, setRoleFilter] = useState(t('common.all'))
  const [userId, setUserId] = useState<string | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [myViewCount, setMyViewCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [myHomeCountry, setMyHomeCountry] = useState<string | null>(null)
  const [myContactIds, setMyContactIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authUser) { navigate('/login?next=/explore'); return }
    const user = authUser
    setUserId(user.id)
    supabase.from('contacts').select('contact_user_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setMyContactIds(new Set(data.map((c: any) => c.contact_user_id)))
    })
    // Unread counts for header badges
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).is('read_at', null)
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('type', 'new_message').is('read_at', null)
    // Load current visibility setting
    supabase.from('user_profiles').select('location_visible, approx_lat, approx_lng, profile_json').eq('id', user.id).maybeSingle().then(async (res) => {
      // Also load profile view count
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { count } = await supabase.from('interaction_log').select('*', { count: 'exact', head: true }).eq('target_user_id', user.id).eq('type', 'profile_view').gte('created_at', weekAgo)
      setMyViewCount(count ?? 0)
      return res
    }).then(({ data }) => {
      if (data) {
        setVisible(!!data.location_visible)
        if (data.approx_lat && data.approx_lng) { setMyLat(data.approx_lat); setMyLng(data.approx_lng) }
        const pj = (data as any).profile_json || {}
        if (pj.home_country) setMyHomeCountry(pj.home_country)
      }
    })
  }, [authUser])

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
          .select('id, title, description, approx_area, tags, host_id, approx_lat, approx_lng, created_at, max_capacity, starts_at, ends_at, template_slug')
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
        }
      },
      () => { setGeoError(true); setLoading(false) },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [userId])

  useEffect(() => {
    if (myLat && myLng) {
      loadNearby(myLat, myLng)
      loadNearbySessions(myLat, myLng)
    }
    else requestLocation()
  }, [myLat, myLng, requestLocation])

  async function loadNearbySessions(lat: number, lng: number) {
    const delta = 0.15
    const { data: pubSess } = await supabase.from('sessions')
      .select('id, title, description, approx_area, tags, host_id, approx_lat, approx_lng, created_at, template_slug')
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
    } else {
    }
  }

  async function loadNearby(lat: number, lng: number) {
    setLoading(true)
    // Approximate bounding box (~10km)
    const delta = 0.1
    const { data } = await supabase.from('user_profiles')
      .select('id, display_name, profile_json, approx_lat, approx_lng, location_updated_at')
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
        display_name: p.display_name || t('common.anonymous'),
        avatar_url: pj.avatar_url,
        role: pj.role,
        orientation: pj.orientation,
        age: pj.age,
        morphology: pj.morphology,
        distance: dist ? Math.round(dist * 10) / 10 : undefined,
        lastSeen: p.location_updated_at,
        home_country: pj.home_country,
        home_city: pj.home_city,
        languages: Array.isArray(pj.languages) ? pj.languages : undefined,
        prep: pj.health?.prep_status || pj.prep,
        created_at: p.created_at,
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
    showToast(newVal ? t('explore.visible_toast') : t('explore.hidden_toast'), newVal ? 'success' : 'info')
  }

  const filtered = profiles.filter(p => {
    if (roleFilter !== t('common.all') && p.role !== roleFilter) return false
    if (searchText && !p.display_name.toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  })
  const { pullHandlers, pullIndicator } = usePullToRefresh(async () => { if (myLat && myLng) await loadNearby(myLat, myLng) })

  return (
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <OrbLayer />
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 12px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 2px' }}>{t('explore.title')}</h1>
            <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{t('explore.profiles_count', { count: filtered.length })} {t('explore.nearby')}{myViewCount > 0 ? ` · ${t('explore.views_week', { count: myViewCount })}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => navigate('/contacts')} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, cursor: 'pointer' }}>
              <BookOpen size={14} />
            </button>
            <button onClick={toggleVisibility} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid ' + (visible ? S.sagebd : S.rule), background: visible ? S.sagebg : 'transparent', color: visible ? S.sage : S.tx4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />} {visible ? t('explore.visible') : t('explore.hidden')}
            </button>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid ' + (viewMode === 'map' ? S.pbd : S.rule), background: viewMode === 'map' ? S.p2 : 'transparent', color: viewMode === 'map' ? S.p : S.tx3, cursor: 'pointer' }}>
              {viewMode === 'grid' ? <MapIcon size={14} /> : <LayoutGrid size={14} />}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, cursor: 'pointer' }}>
              <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
            {roleFilters.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                border: '1px solid ' + (roleFilter === r ? S.pbd : S.rule),
                background: roleFilter === r ? S.p2 : 'transparent',
                color: roleFilter === r ? S.p : S.tx3,
              }}>{r}</button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      {(
        <div style={{ padding: '8px 16px 0' }}>
          <input
            type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder={t('explore.search_profile')} style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, background: S.bg2,
              border: '1px solid '+S.rule, color: S.tx, fontSize: 13, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 12 }}>
      <>
        {geoError && (
          <div style={{ textAlign: 'center', padding: 32, color: S.tx3 }}>
            <MapPin size={32} style={{ color: S.tx4, marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>{t('explore.geo_needed')}</p>
            <p style={{ fontSize: 12, margin: '0 0 16px' }}>{t('explore.geo_desc')}</p>
            <button onClick={requestLocation} style={{ padding: '10px 20px', borderRadius: 12, background: S.p, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              {t('explore.enable_geo')}
            </button>
          </div>
        )}

        {loading && !geoError && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 0 20px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'rgba(22,20,31,0.85)', borderRadius: 14, overflow: 'hidden', border: '1px solid '+S.rule2 }}>
                <div style={{ width: '100%', aspectRatio: '3/4', background: S.bg2, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ padding: 10 }}>
                  <div style={{ width: '60%', height: 12, borderRadius: 6, background: S.bg2, animation: 'pulse 1.5s ease-in-out infinite', marginBottom: 6 }} />
                  <div style={{ width: '40%', height: 10, borderRadius: 6, background: S.bg2, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !geoError && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{t('explore.nobody')}</p>
            <p style={{ fontSize: 12 }}>{t('explore.nobody_desc')}</p>
          </div>
        )}

        {/* Map view */}
        {!loading && viewMode === 'map' && myLat && myLng && filtered.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <MapView
              center={[myLat, myLng]}
              zoom={14}
              showUserLocation
              userLat={myLat}
              userLng={myLng}
              height={320}
              pins={filtered.filter(p => {
                // Only show profiles that have approximate coordinates (from the bounding box query)
                // We use the haversine distance as a proxy — if they have distance, they have coords
                return p.distance !== undefined
              }).map(p => ({
                id: p.id,
                lat: myLat + (Math.random() - 0.5) * 0.01, // Approximate — real coords not exposed to client for privacy
                lng: myLng + (Math.random() - 0.5) * 0.01,
                label: p.display_name,
                avatar: p.avatar_url,
                type: 'profile' as const,
                onClick: () => navigate('/profile/' + p.id),
              }))}
            />
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => navigate('/profile/' + p.id)}
                style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid ' + S.rule2, position: 'relative' }}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '3/4', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                )}
                {/* Quick add to NaughtyBook */}
                <button onClick={async (e) => {
                  e.stopPropagation()
                  if (!userId) return
                  if (myContactIds.has(p.id)) {
                    showToast(t('profile.in_naughtybook'), 'info')
                    return
                  }
                  await supabase.from('contacts').insert({ user_id: userId, contact_user_id: p.id, relation_level: 'connaissance' })
                  setMyContactIds(prev => new Set([...prev, p.id]))
                  showToast(t('profile.added_to_naughtybook'), 'success')
                }} style={{
                  position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 99,
                  background: myContactIds.has(p.id) ? 'rgba(74,222,128,0.3)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
                }}>
                  {myContactIds.has(p.id) ? <CheckCircle2 size={13} strokeWidth={1.5} style={{ color: S.sage }} /> : <UserPlus size={13} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.8)' }} />}
                </button>
                <div style={{ padding: '8px 8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.display_name}</span>
                    {p.age && <span style={{ fontSize: 10, color: S.tx3 }}>{p.age}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
                    {p.role && <span style={{ fontSize: 10, fontWeight: 600, color: S.p }}>{p.role}</span>}
                    {p.orientation && <span style={{ fontSize: 10, fontWeight: 600, color: S.lav }}>{p.orientation}</span>}
                    {p.prep === 'Actif' && <Shield size={9} strokeWidth={2} style={{ color: S.sage }} />}
                    {myHomeCountry && p.home_country && p.home_country !== myHomeCountry && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: S.lav, background: S.lavbg, padding: '1px 5px', borderRadius: 99, border: '1px solid ' + S.lavbd, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <Globe size={7} strokeWidth={2} />{t('explore.visitor')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {p.lastSeen && (() => {
                      const ago = Date.now() - new Date(p.lastSeen).getTime()
                      const isOnline = ago < 900000 // 15 min
                      const isRecent = ago < 3600000 // 1h
                      if (isOnline) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: S.sage, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: S.sage }} />{t('explore.online')}</span>
                      if (isRecent) return <span style={{ fontSize: 9, color: S.tx4 }}>{Math.round(ago / 60000)}min</span>
                      return null
                    })()}
                    {p.distance !== undefined && <span style={{ fontSize: 9, color: S.tx4 }}>{p.distance < 1 ? (p.distance * 1000).toFixed(0) + 'm' : p.distance.toFixed(1) + 'km'}</span>}
                    {p.home_city && <span style={{ fontSize: 8, color: S.tx4 }}>{p.home_city}</span>}
                    <VibeScoreBadge userId={p.id} size="sm" />
                    <ProfileBadges createdAt={p.created_at} lastSeen={p.lastSeen} prepStatus={p.prep} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
      </div>
    </div>
  )
}
