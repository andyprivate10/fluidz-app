import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { compressImage, readFileAsDataUrl } from '../lib/media'
import { useAdminConfig } from './useAdminConfig'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'
import type { User } from '@supabase/supabase-js'
import type { LinkedProfile as PlatformProfile } from '../components/profile/LinkedProfiles'

const S = colors

export const PREP_OPTIONS = ['Actif','Inactif','Non']

export const inputStyleResolved: React.CSSProperties = {
  width:'100%', background:S.bg2, color:S.tx, borderRadius:14,
  padding:'12px 16px', border:`1px solid ${S.rule}`, outline:'none',
  fontSize:14, fontFamily:'inherit', boxSizing:'border-box',
}

export function useMeData() {
  const { t } = useTranslation()
  const { kinks: kinkOptions, morphologies, roles } = useAdminConfig()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const devMode = searchParams.get('dev') === '1'
  const nextUrl = searchParams.get('next')
  const ghostMergeId = searchParams.get('ghost_merge')
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [bodyPartPhotos, setBodyPartPhotos] = useState<Record<string, string[]>>({})
  const [profileViews, setProfileViews] = useState(0)
  const [contactRequests, setContactRequests] = useState(0)

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [homeCountry, setHomeCountry] = useState('')
  const [homeCity, setHomeCity] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [role, setRole] = useState('')
  const [orientation, setOrientation] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [morphology, setMorphology] = useState('')
  const [tribes, setTribes] = useState<string[]>([])
  const [ethnicities, setEthnicities] = useState<string[]>([])
  const [kinks, setKinks] = useState<string[]>([])
  const [prep, setPrep] = useState('')
  const [dernierTest, setDernierTest] = useState('')
  const [seroStatus, setSeroStatus] = useState('')
  const [healthTests, setHealthTests] = useState<Record<string, { status: string; date?: string }>>({})
  const [limits, setLimits] = useState('')
  const [dmPrivacy, setDmPrivacy] = useState<'open' | 'profile_required' | 'full_access'>('open')
  const [savedMsgs, setSavedMsgs] = useState<{ id: string; label: string; text: string }[]>([])
  const [newMsgText, setNewMsgText] = useState('')
  const [linkedProfiles, setLinkedProfiles] = useState<{ user_id: string; type: string }[]>([])
  const [platformProfiles, setPlatformProfiles] = useState<PlatformProfile[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [photosProfil, setPhotosProfil] = useState<string[]>([])
  const [photosIntime, setPhotosIntime] = useState<string[]>([])
  const [videosIntime, setVideosIntime] = useState<string[]>([])
  const [mediaUploading, setMediaUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropCallback, setCropCallback] = useState<((file: File) => void) | null>(null)
  const [cropAspect, setCropAspect] = useState(1)
  // Preferences (what I search for)
  const [prefRoles, setPrefRoles] = useState<string[]>([])
  const [prefAgeMin, setPrefAgeMin] = useState('')
  const [prefAgeMax, setPrefAgeMax] = useState('')
  const [prefKinks, setPrefKinks] = useState<string[]>([])
  const [prefMorphologies, setPrefMorphologies] = useState<string[]>([])

  const [hasGuestToken, setHasGuestToken] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const profileLoaded = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')

  useEffect(() => {
    try {
      setHasGuestToken(!!(typeof localStorage !== 'undefined' && localStorage.getItem('guest_token')))
    } catch (_) {}
  }, [])

  async function mergeGhost(mergeId: string, userId: string) {
    const { data: ghost } = await supabase.from('ghost_sessions').select('id, display_name, profile_json').eq('id', mergeId).maybeSingle()
    if (!ghost || !ghost.profile_json) return
    const gp = (ghost.profile_json || {}) as Record<string, unknown>
    const { data: existing } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', userId).maybeSingle()
    const ep = ((existing?.profile_json || {}) as Record<string, unknown>)
    const merged = { ...gp, ...ep }
    if (!ep.avatar_url && gp.avatar_url) merged.avatar_url = gp.avatar_url
    await supabase.from('user_profiles').upsert({
      id: userId,
      display_name: existing?.display_name || ghost.display_name || t('common.anonymous'),
      profile_json: merged,
    })
    await supabase.from('applications').update({ applicant_id: userId }).eq('ghost_session_id', mergeId)
    await supabase.from('ghost_sessions').update({ claimed_user_id: userId }).eq('id', mergeId)
    try { localStorage.removeItem('ghost_merge_id') } catch (_e) {}
    showToast(t('me.ghost_merged'), 'success')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        // Ghost → account merge
        const mergeId = ghostMergeId || localStorage.getItem('ghost_merge_id')
        if (mergeId && u) {
          mergeGhost(mergeId, u.id)
        }

        // Already logged in + ?next= → redirect immediately
        if (nextUrl) { navigate(nextUrl); return }
        loadProfile(u.id)
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            void supabase.rpc('claim_phantom', { p_guest_token: token }).then(() => {}, () => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id)
        // Redirect to ?next= URL if present
        if (nextUrl) {
          navigate(nextUrl)
          return
        }
        try {
          const token = localStorage.getItem('guest_token')
          if (token) {
            void supabase.rpc('claim_phantom', { p_guest_token: token }).then(() => {}, () => {})
            localStorage.removeItem('guest_token')
            localStorage.removeItem('guest_session_id')
            setHasGuestToken(false)
          }
        } catch (_) {}
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name,profile_json')
      .eq('id', uid)
      .maybeSingle()
    if (data) {
      setDisplayName(data.display_name || '')
        // Count profile views (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        supabase.from('interaction_log').select('*', { count: 'exact', head: true }).eq('target_user_id', uid).eq('type', 'profile_view').gte('created_at', weekAgo).then(({ count }) => setProfileViews(count ?? 0))
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('type', 'contact_request').is('read_at', null).then(({ count }) => setContactRequests(count ?? 0))
      const p = data.profile_json || {} as Record<string, any>
      const h = p.health || {}
      setAvatarUrl(p.avatar_url || '')
      // Migration: old photos[] → photos_profil[], new photos_intime[] + videos_intime[]
      const oldPhotos = Array.isArray(p.photos) ? p.photos : p.avatar_url ? [p.avatar_url] : []
      setPhotosProfil(Array.isArray(p.photos_profil) ? p.photos_profil : oldPhotos)
      setPhotosIntime(Array.isArray(p.photos_intime) ? p.photos_intime : [])
      setVideosIntime(Array.isArray(p.videos_intime) ? p.videos_intime : Array.isArray(p.videos) ? p.videos : [])
      setAge(p.age || '')
      setBio(p.bio || '')
      setLocation(p.location || '')
      setHomeCountry(p.home_country || '')
      setHomeCity(p.home_city || '')
      setLanguages(Array.isArray(p.languages) ? p.languages : [])
      setRole(p.role || '')
      setOrientation(p.orientation || '')
      setHeight(p.height || '')
      setWeight(p.weight || '')
      setMorphology(p.morphology || '')
      setTribes(Array.isArray(p.tribes) ? p.tribes : [])
      setEthnicities(Array.isArray(p.ethnicities) ? p.ethnicities : [])
      setDmPrivacy(p.dm_privacy || 'open')
      // Load saved messages
      supabase.from('saved_messages').select('id, label, text').eq('user_id', uid).order('sort_order').then(({ data }) => setSavedMsgs(data || []))
      // Normalize old kink names to current accented versions
      const kinkNorm: Record<string, string> = { 'SM leger': 'SM léger', 'Fetichisme': 'Fétichisme', 'Jeux de role': 'Jeux de rôle' }
      const rawKinks: string[] = p.kinks || []
      const normalized = [...new Set(rawKinks.map((k: string) => kinkNorm[k] || k))]
      setKinks(normalized)
      setPrep(h.prep_status || p.prep || '')
      setDernierTest(h.dernier_test || '')
      setSeroStatus(h.sero_status || '')
      setHealthTests(h.tests || {})
      setLimits(p.limits || '')
      setLinkedProfiles(Array.isArray(p.linked_profiles) ? p.linked_profiles : [])
      setPlatformProfiles(Array.isArray(p.platform_profiles) ? p.platform_profiles : [])
      // Load preferences
      const prefs = p.preferences || {}
      setPrefRoles(Array.isArray(prefs.roles) ? prefs.roles : [])
      setPrefAgeMin(prefs.age_min || '')
      setPrefAgeMax(prefs.age_max || '')
      setPrefKinks(Array.isArray(prefs.kinks) ? prefs.kinks : [])
      setPrefMorphologies(Array.isArray(prefs.morphologies) ? prefs.morphologies : [])
      setBodyPartPhotos(() => {
        const raw = p.body_part_photos || {}
        const keyMap: Record<string, string> = { torse: 'torso', bite: 'sex', cul: 'butt', pieds: 'feet' }
        const migrated: Record<string, string[]> = {}
        for (const [k, v] of Object.entries(raw)) {
          const newKey = keyMap[k] || k
          if (Array.isArray(v)) migrated[newKey] = v as string[]
          else if (typeof v === 'string' && v) migrated[newKey] = [v]
        }
        return migrated
      })
    }
    // Allow auto-save after initial load settles
    setTimeout(() => { profileLoaded.current = true }, 500)
  }

  async function sendMagicLink() {
    if (!email) return
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/me' }
    })
    setMsg(error ? error.message : t('auth.magic_link_sent'))
    setLoading(false)
  }

  const doSave = useCallback(async () => {
    if (!user) return
    setAutoSaveStatus('saving')
    const profile_json = {
      age, bio, location, home_country: homeCountry, home_city: homeCity, languages, role, orientation, height, weight, morphology, tribes, ethnicities, kinks, prep, limits, dm_privacy: dmPrivacy, linked_profiles: linkedProfiles, platform_profiles: platformProfiles,
      avatar_url: photosProfil[0] || avatarUrl || undefined,
      photos_profil: photosProfil,
      photos_intime: photosIntime,
      videos_intime: videosIntime,
      photos: [...photosProfil, ...photosIntime],
      videos: videosIntime,
      body_part_photos: bodyPartPhotos,
      health: { prep_status: prep || undefined, dernier_test: dernierTest || undefined, sero_status: seroStatus || undefined, tests: Object.keys(healthTests).length > 0 ? healthTests : undefined },
      preferences: { roles: prefRoles, age_min: prefAgeMin || undefined, age_max: prefAgeMax || undefined, kinks: prefKinks, morphologies: prefMorphologies },
    }
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName || t('common.anonymous_fallback'),
      profile_json
    })
    setAutoSaveStatus('saved')
    setTimeout(() => setAutoSaveStatus('idle'), 2000)
  }, [user, displayName, age, bio, location, homeCountry, homeCity, languages, role, orientation, height, weight, morphology, tribes, ethnicities, kinks, prep, limits, dmPrivacy, linkedProfiles, platformProfiles, dernierTest, seroStatus, healthTests, avatarUrl, photosProfil, photosIntime, videosIntime, bodyPartPhotos, prefRoles, prefAgeMin, prefAgeMax, prefKinks, prefMorphologies])

  // Auto-save: debounce 1.5s after any field change
  useEffect(() => {
    if (!profileLoaded.current || !user) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [doSave])

  function toggleKink(k: string) {
    setKinks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  async function uploadMedia(file: File, album: 'profil' | 'intime', mediaType: 'photo' | 'video') {
    if (!user) return
    const maxSize = mediaType === 'photo' ? 5 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      showToast(t('me.file_too_large', { max: mediaType === 'photo' ? '5' : '20' }), 'error')
      return
    }
    setMediaUploading(true)
    try {
      // Compress photos before upload (skip videos)
      let fileToUpload = file
      if (mediaType === 'photo') {
        fileToUpload = await compressImage(file)
      }
      const ext = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg')
      const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const path = `${user.id}/${album}_${mediaType}_${ts}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, fileToUpload, { upsert: false })
      if (error) {
        showToast(t('errors.upload_error') + ': ' + error.message, 'error')
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      if (album === 'profil') {
        setPhotosProfil(prev => [...prev, publicUrl])
        if (!avatarUrl) setAvatarUrl(publicUrl)
      } else if (mediaType === 'photo') {
        setPhotosIntime(prev => [...prev, publicUrl])
      } else {
        setVideosIntime(prev => [...prev, publicUrl])
      }
      showToast(mediaType === 'photo' ? t('me.photo_added') : t('me.video_added'), 'success')
    } catch (err) {
      showToast('Erreur: ' + String(err), 'error')
    } finally {
      setMediaUploading(false)
    }
  }

  function removePhotoProfil(url: string) {
    setPhotosProfil(prev => prev.filter(p => p !== url))
    if (avatarUrl === url) setAvatarUrl(photosProfil.find(p => p !== url) || '')
  }

  function removePhotoIntime(url: string) {
    setPhotosIntime(prev => prev.filter(p => p !== url))
  }

  function removeVideoIntime(url: string) {
    setVideosIntime(prev => prev.filter(v => v !== url))
  }

  function setAsAvatar(url: string) {
    setAvatarUrl(url)
  }

  return {
    // translation & config
    t,
    kinkOptions,
    morphologies,
    roles,
    // navigation
    navigate,
    devMode,
    // auth state
    user,
    email, setEmail,
    loading,
    msg,
    hasGuestToken,
    sendMagicLink,
    // profile fields
    displayName, setDisplayName,
    age, setAge,
    bio, setBio,
    location, setLocation,
    homeCountry, setHomeCountry,
    homeCity, setHomeCity,
    languages, setLanguages,
    role, setRole,
    orientation, setOrientation,
    height, setHeight,
    weight, setWeight,
    morphology, setMorphology,
    tribes, setTribes,
    ethnicities, setEthnicities,
    kinks, setKinks,
    prep, setPrep,
    dernierTest, setDernierTest,
    seroStatus, setSeroStatus,
    healthTests, setHealthTests,
    limits, setLimits,
    // dm privacy
    dmPrivacy, setDmPrivacy,
    // saved messages
    savedMsgs, setSavedMsgs,
    newMsgText, setNewMsgText,
    // linked profiles
    linkedProfiles, setLinkedProfiles,
    platformProfiles, setPlatformProfiles,
    // photos & media
    avatarUrl, setAvatarUrl,
    photosProfil, setPhotosProfil,
    photosIntime, setPhotosIntime,
    videosIntime, setVideosIntime,
    mediaUploading,
    cropSrc, setCropSrc,
    cropCallback, setCropCallback,
    cropAspect, setCropAspect,
    bodyPartPhotos, setBodyPartPhotos,
    // profile stats
    profileViews,
    contactRequests,
    // delete account
    showDeleteConfirm, setShowDeleteConfirm,
    deleteInput, setDeleteInput,
    deleting, setDeleting,
    // preferences
    prefRoles, setPrefRoles,
    prefAgeMin, setPrefAgeMin,
    prefAgeMax, setPrefAgeMax,
    prefKinks, setPrefKinks,
    prefMorphologies, setPrefMorphologies,
    // auto-save
    autoSaveStatus,
    // handlers
    toggleKink,
    uploadMedia,
    removePhotoProfil,
    removePhotoIntime,
    removeVideoIntime,
    setAsAvatar,
    doSave,
    // utils
    readFileAsDataUrl,
  }
}
