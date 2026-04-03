import PageFadeIn from '../components/PageFadeIn'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { MapPin, Filter, Eye, EyeOff, BookOpen, Map as MapIcon, LayoutGrid, Save, Download, RefreshCw } from 'lucide-react'
import MapView from '../components/MapView'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { useTranslation } from 'react-i18next'
import { TRIBES } from '../lib/tribeTypes'
import { stripHtml } from '../lib/sanitize'

const S = colors


type NearbyProfile = {
  id: string
  display_name: string
  avatar_url?: string
  role?: string
  orientation?: string
  age?: number
  morphology?: string
  distance?: number
  lastSeen?: string
  home_country?: string
  home_city?: string
  languages?: string[]
  prep?: string
  created_at?: string
  tribes?: string[]
  kinks?: string[]
  photos_profil?: string[]
  proxyScore?: number
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

function ExploreCard({ p, onClick, isTopProfile, isNew }: {
  p: NearbyProfile,
  onClick: () => void,
  isTopProfile?: boolean,
  isNew?: boolean,
}) {
  const photos = p.photos_profil && p.photos_profil.length > 0 ? p.photos_profil : p.avatar_url ? [p.avatar_url] : []
  const [photoIdx, setPhotoIdx] = useState(0)
  const randomOffset = useMemo(() => Math.floor(Math.random() * 3500), [])

  useEffect(() => {
    if (photos.length <= 1) return
    const iv = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 3000 + randomOffset)
    return () => clearInterval(iv)
  }, [photos.length, randomOffset])

  return (
    <div onClick={onClick} style={{
      background: 'rgba(22,20,31,0.85)', borderRadius: 12, overflow: 'hidden',
      cursor: 'pointer', position: 'relative',
      border: isTopProfile ? '1.5px solid rgba(224,136,122,0.5)' : '1px solid rgba(255,255,255,0.09)',
      boxShadow: isTopProfile ? '0 0 12px rgba(224,136,122,0.12)' : 'none',
    }}>
      {/* Top profile accent bar */}
      {isTopProfile && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #E0887A, transparent)', zIndex: 4, borderRadius: '12px 12px 0 0' }} />
      )}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden' }}>
        {photos.length > 0 ? (
          <img key={photoIdx} src={photos[photoIdx]} alt="" loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'smoothFadeIn 0.8s ease-in-out' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: S.p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: S.tx }}>
            {stripHtml(p.display_name)[0]?.toUpperCase()}
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(5,4,10,0.92) 0%, rgba(5,4,10,0.6) 50%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Name + age + role */}
        <div style={{ position: 'absolute', bottom: 6, left: 7, right: 28, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EDE8F5', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {stripHtml(p.display_name).slice(0, 10)}
            </span>
            {p.age && <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(237,232,245,0.85)' }}>{p.age}</span>}
          </div>
          {p.role && <span style={{ fontSize: 9, fontWeight: 600, color: S.p, lineHeight: 1 }}>{p.role}</span>}
        </div>
        {/* Photo dots */}
        {photos.length > 1 && (
          <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
            {photos.map((_, i) => (
              <div key={i} style={{ width: i === photoIdx ? 12 : 4, height: 3, borderRadius: 99, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.4s ease' }} />
            ))}
          </div>
        )}
        {/* Online dot */}
        {p.lastSeen && (Date.now() - new Date(p.lastSeen).getTime()) < 900000 && (
          <div style={{ position: 'absolute', top: 6, left: 6, width: 7, height: 7, borderRadius: '50%', background: S.sage, border: '1.5px solid rgba(0,0,0,0.5)', zIndex: 3 }} />
        )}
        {/* VibeScore circle */}
        {p.proxyScore !== undefined && (
          <div style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(5,4,10,0.7)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: p.proxyScore >= 80 ? '#E0887A' : p.proxyScore >= 50 ? 'rgba(237,232,245,0.85)' : 'rgba(237,232,245,0.5)' }}>{p.proxyScore}</span>
          </div>
        )}
        {/* New badge */}
        {isNew && (
          <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 3, padding: '2px 6px', borderRadius: 99, background: 'rgba(107,168,136,0.85)', fontSize: 8, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            New
          </div>
        )}
      </div>
    </div>
  )
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
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [myViewCount, setMyViewCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [savedFilters, setSavedFilters] = useState<{ role?: string } | null>(null)
  const [selectedTribes, setSelectedTribes] = useState<string[]>([])
  const [selectedKinks, setSelectedKinks] = useState<string[]>([])

  useEffect(() => {
    if (!authUser) { navigate('/login?next=/explore'); return }
    const user = authUser
    setUserId(user.id)
    // Load blocked user IDs
    supabase.from('contacts').select('contact_user_id').eq('user_id', user.id).eq('relation_level', 'blocked').then(({ data }) => {
      if (data) setBlockedIds(new Set(data.map(d => d.contact_user_id)))
    })
    // Load current visibility setting
    supabase.from('user_profiles').select('location_visible, approx_lat, approx_lng, profile_json').eq('id', user.id).maybeSingle().then(async (res) => {
      // Also load profile view count
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data: viewData } = await supabase.from('interaction_log').select('id').eq('target_user_id', user.id).eq('type', 'profile_view').gte('created_at', weekAgo).limit(99)
      setMyViewCount(viewData?.length ?? 0)
      return res
    }).then(({ data }) => {
      if (data) {
        setVisible(!!data.location_visible)
        if (data.approx_lat && data.approx_lng) { setMyLat(data.approx_lat); setMyLng(data.approx_lng) }
        else {
          // No saved coords — request geo immediately with known userId
          requestLocation(user.id)
        }
        const pj = (data as any).profile_json || {}
        if (pj.search_filters) setSavedFilters(pj.search_filters)
      } else {
        // No profile at all — request geo
        requestLocation(user.id)
      }
    })
  }, [authUser])

  // Load profiles without geo coords — fallback when geo is denied or unavailable
  const loadFallback = useCallback(async (uid?: string | null) => {
    setLoading(true)
    const resolvedUid = uid ?? userId
    const { data: fallback } = await supabase.from('user_profiles')
      .select('id, display_name, profile_json, approx_lat, approx_lng, location_updated_at')
      .eq('location_visible', true)
      .neq('id', resolvedUid)
      .limit(60)
    const mapped: NearbyProfile[] = (fallback || []).map((p: any) => {
      const pj = p.profile_json || {}
      return {
        id: p.id,
        display_name: p.display_name || t('common.anonymous'),
        avatar_url: pj.avatar_url,
        role: pj.role,
        orientation: pj.orientation,
        age: pj.age,
        morphology: pj.morphology,
        distance: undefined,
        lastSeen: pj.last_seen || p.location_updated_at,
        home_country: pj.home_country,
        home_city: pj.home_city,
        languages: Array.isArray(pj.languages) ? pj.languages : undefined,
        prep: pj.health?.prep_status || pj.prep,
        tribes: Array.isArray(pj.tribes) ? pj.tribes : undefined,
        kinks: Array.isArray(pj.kinks) ? pj.kinks : undefined,
        photos_profil: Array.isArray(pj.photos_profil) && pj.photos_profil.length > 0 ? pj.photos_profil : pj.avatar_url ? [pj.avatar_url] : [],
        created_at: p.created_at,
        proxyScore: (() => {
          let s = 0
          if (pj.avatar_url || (Array.isArray(pj.photos_profil) && pj.photos_profil.length > 0)) s += 25
          if (pj.role) s += 20
          if (pj.age) s += 10
          if (pj.bio) s += 15
          if (Array.isArray(pj.tribes) && pj.tribes.length > 0) s += 10
          if (Array.isArray(pj.kinks) && pj.kinks.length > 0) s += 10
          if (pj.morphology) s += 10
          return Math.min(s, 100)
        })(),
      }
    })
    setProfiles(mapped)
    setLoading(false)
  }, [userId, t])

  const requestLocation = useCallback((resolvedUserId?: string | null) => {
    const uid = resolvedUserId ?? userId
    if (!navigator.geolocation) { setGeoError(true); loadFallback(uid); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = roundCoord(pos.coords.latitude)
        const lng = roundCoord(pos.coords.longitude)
        setMyLat(lat); setMyLng(lng); setGeoError(false)
        if (uid) {
          await supabase.from('user_profiles').update({
            approx_lat: lat, approx_lng: lng, location_visible: true, location_updated_at: new Date().toISOString(),
          }).eq('id', uid)
          setVisible(true)
        }
        loadNearby(lat, lng)
      },
      () => {
        // Geo denied or failed — still show profiles without distance
        setGeoError(true)
        loadFallback(uid)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [userId, loadFallback])

  useEffect(() => {
    if (myLat && myLng) {
      loadNearby(myLat, myLng)
      loadNearbySessions(myLat, myLng)
    }
    // Don't auto-request here — handled after userId is resolved below
  }, [myLat, myLng])

  // Trigger location request only after userId is known (fix race condition)
  useEffect(() => {
    if (!userId) return
    if (myLat && myLng) return // already have coords from DB
    requestLocation(userId)
  }, [userId])

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
    // Approximate bounding box (~55km)
    const delta = 0.5
    let { data } = await supabase.from('user_profiles')
      .select('id, display_name, profile_json, approx_lat, approx_lng, location_updated_at')
      .eq('location_visible', true)
      .gte('approx_lat', lat - delta).lte('approx_lat', lat + delta)
      .gte('approx_lng', lng - delta).lte('approx_lng', lng + delta)
      .neq('id', userId)
      .limit(60)

    // Fallback: if geo query returns few results, load any visible profiles
    if (!data || data.length < 3) {
      const { data: fallback } = await supabase.from('user_profiles')
        .select('id, display_name, profile_json, approx_lat, approx_lng, location_updated_at')
        .eq('location_visible', true)
        .neq('id', userId)
        .limit(60)
      if (fallback && fallback.length > (data?.length || 0)) data = fallback
    }

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
        lastSeen: pj.last_seen && (!p.location_updated_at || new Date(pj.last_seen) > new Date(p.location_updated_at)) ? pj.last_seen : p.location_updated_at,
        home_country: pj.home_country,
        home_city: pj.home_city,
        languages: Array.isArray(pj.languages) ? pj.languages : undefined,
        prep: pj.health?.prep_status || pj.prep,
        tribes: Array.isArray(pj.tribes) ? pj.tribes : undefined,
        kinks: Array.isArray(pj.kinks) ? pj.kinks : undefined,
        photos_profil: Array.isArray(pj.photos_profil) && pj.photos_profil.length > 0 ? pj.photos_profil : pj.avatar_url ? [pj.avatar_url] : [],
        created_at: p.created_at,
        proxyScore: (() => {
          let s = 0
          if (pj.avatar_url || (Array.isArray(pj.photos_profil) && pj.photos_profil.length > 0)) s += 25
          if (pj.role) s += 20
          if (pj.age) s += 10
          if (pj.bio) s += 15
          if (Array.isArray(pj.tribes) && pj.tribes.length > 0) s += 10
          if (Array.isArray(pj.kinks) && pj.kinks.length > 0) s += 10
          if (pj.morphology) s += 10
          return Math.min(s, 100)
        })(),
      }
    })
    mapped.sort((a, b) => {
      const aOnline = a.lastSeen && (Date.now() - new Date(a.lastSeen).getTime()) < 300000 ? 0 : 1
      const bOnline = b.lastSeen && (Date.now() - new Date(b.lastSeen).getTime()) < 300000 ? 0 : 1
      if (aOnline !== bOnline) return aOnline - bOnline
      return (a.distance ?? 999) - (b.distance ?? 999)
    })

    // Pad with a few demo profiles if very few results
    if (mapped.length < 3) {
      const demoNames = ['Alex', 'Jordan', 'Sam']
      const demoRoles = ['Top', 'Bottom', 'Versa']
      for (let i = 0; i < 3 - mapped.length; i++) {
        mapped.push({ id: `demo-${i}`, display_name: demoNames[i], role: demoRoles[i], age: 25 + i * 3 })
      }
    }

    setProfiles(mapped)
    setLoading(false)
  }

  async function saveCurrentFilters() {
    if (!userId) return
    const filters = { role: roleFilter !== t('common.all') ? roleFilter : undefined }
    const { data: current } = await supabase.from('user_profiles').select('profile_json').eq('id', userId).maybeSingle()
    const pj = { ...((current?.profile_json || {}) as Record<string, unknown>), search_filters: filters }
    await supabase.from('user_profiles').update({ profile_json: pj }).eq('id', userId)
    setSavedFilters(filters)
    showToast(t('explore.filters_saved'), 'success')
  }

  function loadSavedFilters() {
    if (!savedFilters) return
    if (savedFilters.role) setRoleFilter(savedFilters.role)
    else setRoleFilter(t('common.all'))
    showToast(t('explore.filters_loaded'), 'success')
  }

  async function toggleVisibility() {
    if (!userId) return
    const newVal = !visible
    await supabase.from('user_profiles').update({ location_visible: newVal }).eq('id', userId)
    setVisible(newVal)
    showToast(newVal ? t('explore.visible_toast') : t('explore.hidden_toast'), newVal ? 'success' : 'info')
  }

  const filtered = profiles.filter(p => {
    if (blockedIds.has(p.id)) return false
    if (roleFilter !== t('common.all') && p.role !== roleFilter) return false
    if (selectedTribes.length > 0 && !selectedTribes.some(s => p.tribes?.includes(s))) return false
    if (selectedKinks.length > 0 && !selectedKinks.some(k => p.kinks?.includes(k))) return false
    if (searchText && !p.display_name.toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  })
  const { pullHandlers, pullIndicator } = usePullToRefresh(async () => { if (myLat && myLng) await loadNearby(myLat, myLng) })

  return (
    <PageFadeIn>
    <div {...pullHandlers} style={{ background: S.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {pullIndicator}
      <OrbLayer />
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 12px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin: '0 0 2px' }}>{t('explore.title')}</h1>
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
        {showFilters && (<>
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
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
            {['bear','cub','otter','wolf','muscle_bear','twink','jock','daddy','leather','pup','femboy','circuit_boy'].map(slug => {
              const tr = TRIBES.find(t => t.slug === slug)
              const color = tr?.color || S.tx3
              const selected = selectedTribes.includes(slug)
              return (
                <button key={slug} onClick={() => {
                  if (selected) setSelectedTribes(prev => prev.filter(s => s !== slug))
                  else if (selectedTribes.length < 3) setSelectedTribes(prev => [...prev, slug])
                }} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: '1px solid ' + (selected ? color + '44' : S.rule),
                  background: selected ? color + '18' : 'transparent',
                  color: selected ? color : S.tx3,
                }}>{t('tribes.' + slug, {defaultValue: slug})}</button>
              )
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: S.tx3, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{t('explore.filter_kinks')}</span>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {['Câlins','Rimming','Dominant','Soumis','Menottes','Cuir','Fist','SM léger','Groupe','Jeux de rôle','Massage','Exhib','Switch','Spanking'].map(k => {
                const selected = selectedKinks.includes(k)
                return (
                  <button key={k} onClick={() => {
                    if (selected) setSelectedKinks(prev => prev.filter(s => s !== k))
                    else if (selectedKinks.length < 3) setSelectedKinks(prev => [...prev, k])
                  }} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: '1px solid ' + (selected ? S.pbd : S.rule),
                    background: selected ? S.p2 : 'transparent',
                    color: selected ? S.p : S.tx3,
                  }}>{k}</button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={saveCurrentFilters} style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + S.lavbd, background: S.lavbg, color: S.lav, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Save size={12} /> {t('explore.save_filters')}
            </button>
            {savedFilters && (
              <button onClick={loadSavedFilters} style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + S.sagebd, background: S.sagebg, color: S.sage, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={12} /> {t('explore.load_filters')}
              </button>
            )}
          </div></>
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
              fontFamily: fonts.body, boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 12 }}>
      <>
        {geoError && (
          <div style={{ margin: '8px 0 4px', padding: '10px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={14} style={{ color: '#FBBF24', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#FBBF24', margin: '0 0 1px' }}>{t('explore.geo_needed')}</p>
              <p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>{t('explore.geo_desc')}</p>
            </div>
            <button onClick={() => requestLocation(userId)} style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t('explore.enable_geo')}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '0 0 20px' }}>
            {[1,2,3,4,5,6,7,8,9].map(i => (
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

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: S.tx3 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: S.p2, border: '1px solid '+S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MapPin size={28} strokeWidth={1.5} style={{ color: S.p }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: '0 0 6px' }}>{t('explore.nobody')}</p>
            <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 20px', lineHeight: 1.5 }}>{t('explore.nobody_desc')}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => requestLocation(userId)} style={{ padding: '12px 24px', borderRadius: 14, background: S.p, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} strokeWidth={1.5} />{t('explore.refresh')}
              </button>
              <button onClick={() => setViewMode('map')} style={{ padding: '12px 24px', borderRadius: 14, background: S.p2, border: '1px solid ' + S.pbd, color: S.p, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('explore.try_map')}
              </button>
            </div>
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
        {!loading && filtered.length > 0 && viewMode === 'grid' && (() => {
          const scores = filtered.map(p => p.proxyScore ?? 0)
          const sortedScores = [...scores].sort((a, b) => b - a)
          const top20Threshold = sortedScores[Math.floor(sortedScores.length * 0.2)] ?? 80
          const isNewUser = (p: NearbyProfile) => !!p.created_at && Date.now() - new Date(p.created_at).getTime() < 30 * 86400000
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {filtered.map(p => (
                <ExploreCard
                  key={p.id}
                  p={p}
                  isTopProfile={(p.proxyScore ?? 0) >= top20Threshold}
                  isNew={isNewUser(p)}
                  onClick={() => navigate('/profile/' + p.id)}
                />
              ))}
            </div>
          )
        })()}
      </>
      </div>
    </div>
    </PageFadeIn>
  )
}
