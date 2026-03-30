import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { useAdminConfig } from './useAdminConfig'
import { useTranslation } from 'react-i18next'
import { sendPushToUser } from '../lib/pushSender'
import { compressImage, isVideo } from '../lib/media'
import { getSections, GUEST_TOKEN_KEY, GUEST_SESSION_KEY, RATE_LIMIT_MIN } from '../components/apply/applySections'

export function useApplyData() {
  const { t } = useTranslation()
  const { BLOC_PROFIL, BLOC_ADULTE, SECTION_OCCASION, ALL_SECTIONS } = getSections(t)
  const { roles } = useAdminConfig()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const guestTokenParam = searchParams.get('guest_token')
  const ghostIdParam = searchParams.get('ghost_id') || (typeof localStorage !== 'undefined' ? localStorage.getItem('ghost_id') : null)

  const [user, setUser] = useState<{ id: string; email?: string; is_anonymous?: boolean } | null>(null)
  const [session, setSession] = useState<{ id?: string; title?: string; approx_area?: string; max_capacity?: number; template_slug?: string; cover_url?: string; status?: string; host_id?: string; lineup_json?: Record<string, unknown>; tags?: string[] } | null>(null)
  const [profile, setProfile] = useState<{ display_name?: string; profile_json?: Record<string, unknown> } | null>(null)
  const [enabled, setEnabled] = useState<string[]>(() => [...BLOC_PROFIL, ...BLOC_ADULTE, SECTION_OCCASION].map(s => s.id))
  const [selectedPhotosProfil, setSelectedPhotosProfil] = useState<string[]>([])
  const [selectedPhotosAdulte, setSelectedPhotosAdulte] = useState<string[]>([])
  const [selectedVideosAdulte, setSelectedVideosAdulte] = useState<string[]>([])
  const [selectedBodyParts, setSelectedBodyParts] = useState<Record<string, string>>({})
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [note, setNote] = useState('')
  const [messageToHost, setMessageToHost] = useState('')
  const [step, setStep] = useState<'pack'|'note'|'done'>('pack')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null)
  const [capacityFull, setCapacityFull] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [guestDisplayName, setGuestDisplayName] = useState('')
  const [ghostSessionId, setGhostSessionId] = useState<string | null>(null)
  const [occasionPhotos, setOccasionPhotos] = useState<string[]>([])
  const [mediaUploading, setMediaUploading] = useState(false)
  const occasionFileRef = useRef<HTMLInputElement | null>(null)

  const isRateLimited = rateLimitedUntil ? new Date() < rateLimitedUntil : false
  const invalidPseudo = guestMode ? (guestDisplayName.trim().length < 2) : (!profile?.display_name || (profile.display_name as string).trim().length < 2)
  const sessionEnded = session?.status === 'ended'

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        setDataLoading(true)
        load(u.id)
      } else if (ghostIdParam) {
        // Ghost 24h mode — load profile from ghost_sessions
        setGuestMode(true)
        setGhostSessionId(ghostIdParam)
        setDataLoading(true)
        Promise.all([
          supabase.from('ghost_sessions').select('display_name, profile_json').eq('id', ghostIdParam).maybeSingle(),
          supabase.from('sessions').select('title,approx_area,max_capacity,template_slug,cover_url,status').eq('id', id).maybeSingle(),
        ]).then(async ([{ data: ghost }, { data: sess }]) => {
          if (!mounted) return
          if (ghost) {
            setGuestDisplayName(ghost.display_name || '')
            const pj = ghost.profile_json || {}
            setProfile({ display_name: ghost.display_name, profile_json: pj })
            if (pj.role) setSelectedRole(pj.role)
            // Pre-check sections that have data
            const hasSections: string[] = ['basics', 'occasion']
            if (pj.role) hasSections.push('role')
            if (pj.height || pj.weight || pj.morphology) hasSections.push('physique')
            if (pj.kinks?.length) hasSections.push('pratiques')
            if (pj.prep_status || pj.health?.prep_status) hasSections.push('sante')
            if (pj.limits) hasSections.push('limites')
            if (pj.photos_profil?.length) hasSections.push('photos_profil')
            if (pj.photos_intime?.length || pj.videos_intime?.length) hasSections.push('photos_adulte')
            if (pj.body_part_photos && Object.keys(pj.body_part_photos).length) { hasSections.push('body_part_photos'); setSelectedBodyParts(pj.body_part_photos) }
            setEnabled(hasSections)
          } else {
            setEnabled(['basics', 'role', 'occasion'])
          }
          setSession(sess ?? null)
          if (sess?.max_capacity) {
            const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', id).in('status', ['accepted', 'checked_in'])
            if ((count ?? 0) >= sess.max_capacity) setCapacityFull(true)
          }
          setDataLoading(false)
        })
      } else {
        try {
          const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_TOKEN_KEY) : null
          const storedSession = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_SESSION_KEY) : null
          if (guestTokenParam && stored === guestTokenParam && storedSession === id) {
            setGuestMode(true)
            setEnabled(['basics', 'role', 'occasion'])
            setDataLoading(true)
            supabase.from('sessions').select('title,approx_area,max_capacity,template_slug,cover_url,status').eq('id', id).maybeSingle().then(async ({ data: sess }) => {
              if (!mounted) return
              setSession(sess ?? null)
              if (sess?.max_capacity) {
                const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', id).in('status', ['accepted', 'checked_in'])
                if ((count ?? 0) >= sess.max_capacity) setCapacityFull(true)
              }
              setDataLoading(false)
            })
          } else setDataLoading(false)
        } catch {
          setDataLoading(false)
        }
      }
    })
    return () => { mounted = false }
  }, [id, guestTokenParam, ghostIdParam])

  async function load(uid: string) {
    setLoadError(false)
    try {
      const [{ data: prof }, { data: sess }, { data: lastApp }, { data: existingApp }] = await Promise.all([
        supabase.from('user_profiles').select('display_name,profile_json').eq('id', uid).maybeSingle(),
        supabase.from('sessions').select('title,approx_area,max_capacity,template_slug,cover_url,status').eq('id', id).maybeSingle(),
        supabase.from('applications').select('created_at').eq('applicant_id', uid).order('created_at', { ascending: false }).limit(1),
        supabase.from('applications').select('status').eq('applicant_id', uid).eq('session_id', id).maybeSingle(),
      ])
      // Already applied to this session → redirect
      if (existingApp) {
        navigate('/session/' + id)
        return
      }
      if (prof) {
        setProfile(prof)
        if (prof.profile_json?.role && !selectedRole) {
          setSelectedRole(prof.profile_json.role)
        }
        const pj = prof.profile_json || {}
        const filled: string[] = ['occasion']
        if (prof.display_name || pj.age || pj.bio || pj.location) filled.push('basics')
        if (pj.role) filled.push('role')
        if (pj.height || pj.weight || pj.morphology) filled.push('physique')
        if (Array.isArray(pj.kinks) && pj.kinks.length > 0) filled.push('pratiques')
        if (pj.health?.prep_status || pj.health?.dernier_test) filled.push('sante')
        if (pj.limits) filled.push('limites')
        const pprofil = Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : [])
        if (pprofil.length > 0) filled.push('photos_profil')
        const padulte = Array.isArray(pj.photos_intime) ? pj.photos_intime : []
        const vadulte = Array.isArray(pj.videos_intime) ? pj.videos_intime : (Array.isArray(pj.videos) ? pj.videos : [])
        if (padulte.length > 0 || vadulte.length > 0) filled.push('photos_adulte')
        if (pj.body_part_photos && Object.keys(pj.body_part_photos).length > 0) { filled.push('body_part_photos'); setSelectedBodyParts(pj.body_part_photos) }
        setEnabled(filled)
        setSelectedPhotosProfil(pprofil)
        setSelectedPhotosAdulte(padulte)
        setSelectedVideosAdulte(vadulte)
      }
      if (sess) setSession(sess)
      if (sess?.max_capacity) {
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('session_id', id).in('status', ['accepted', 'checked_in'])
        if ((count ?? 0) >= sess.max_capacity) setCapacityFull(true)
      }
      const lastRow = Array.isArray(lastApp) ? lastApp?.[0] : lastApp
      if (lastRow?.created_at) {
        const created = new Date(lastRow.created_at)
        const until = new Date(created.getTime() + RATE_LIMIT_MIN * 60 * 1000)
        if (until > new Date()) setRateLimitedUntil(until)
      }
    } catch {
      setLoadError(true)
    } finally {
      setDataLoading(false)
    }
  }

  function onPickOccasionFile() {
    occasionFileRef.current?.click()
  }

  async function onOccasionFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (occasionPhotos.length >= 3) return
    const uid = user?.id || ghostSessionId || 'anon'
    setMediaUploading(true)
    try {
      let toUpload = file
      if (!isVideo(file)) {
        toUpload = await compressImage(file)
      }
      const ext = file.name.split('.').pop() || (isVideo(file) ? 'mp4' : 'jpg')
      const path = `${uid}/occasion_${id}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, toUpload, { upsert: true })
      if (error) { console.error('[occasion] upload error', error); setMediaUploading(false); return }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setOccasionPhotos(prev => [...prev, urlData.publicUrl])
    } catch (err) {
      console.error('[occasion] upload failed', err)
    } finally {
      setMediaUploading(false)
      if (occasionFileRef.current) occasionFileRef.current.value = ''
    }
  }

  function toggle(sid: string) {
    setEnabled(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  async function submit() {
    if (isRateLimited) return
    if (guestMode) {
      if (guestDisplayName.trim().length < 2) return
      setLoading(true)

      const ghostProfile = profile?.profile_json || {}
      if (ghostSessionId) {
        await supabase.from('ghost_sessions').update({
          display_name: guestDisplayName.trim(),
          profile_json: { ...ghostProfile, role: selectedRole || undefined },
        }).eq('id', ghostSessionId)
      }

      const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
      if (anonErr) { setLoading(false); return }
      const anonUser = anonData?.user
      if (!anonUser) { setLoading(false); return }
      await supabase.from('user_profiles').upsert({
        id: anonUser.id,
        display_name: guestDisplayName.trim(),
        profile_json: { role: selectedRole || undefined, ...ghostProfile },
      })
      const snapshot = ghostProfile.role || ghostProfile.age ? ghostProfile : { display_name: guestDisplayName.trim(), role: selectedRole || undefined }
      await supabase.from('applications').upsert({
        session_id: id,
        applicant_id: anonUser.id,
        status: 'pending',
        ghost_session_id: ghostSessionId || undefined,
        eps_json: {
          shared_sections: enabled,
          occasion_note: note,
          message: messageToHost.trim() || undefined,
          profile_snapshot: snapshot,
          role: selectedRole || undefined,
          is_phantom: true,
          selected_photos_profil: enabled.includes('photos_profil') ? selectedPhotosProfil : [],
          selected_photos_adulte: enabled.includes('photos_adulte') ? selectedPhotosAdulte : [],
          selected_videos_adulte: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
          selected_body_part_photos: enabled.includes('body_part_photos') ? selectedBodyParts : {},
          selected_photos: [...(enabled.includes('photos_profil') ? selectedPhotosProfil : []), ...(enabled.includes('photos_adulte') ? selectedPhotosAdulte : [])],
          selected_videos: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
          occasion_photos: occasionPhotos.length > 0 ? occasionPhotos : undefined,
        },
      })
      try { localStorage.removeItem(GUEST_TOKEN_KEY); localStorage.removeItem(GUEST_SESSION_KEY) } catch (_) {}
      setLoading(false)
      navigate('/session/' + id)
      return
    }
    if (!user) return
    setLoading(true)
    const { error: upsertError } = await supabase.from('applications').upsert({
      session_id: id, applicant_id: user.id, status: 'pending',
      eps_json: {
        shared_sections: enabled,
        occasion_note: note,
        message: messageToHost.trim() || undefined,
        profile_snapshot: profile?.profile_json || {},
        role: selectedRole || undefined,
        selected_photos_profil: enabled.includes('photos_profil') ? selectedPhotosProfil : [],
        selected_photos_adulte: enabled.includes('photos_adulte') ? selectedPhotosAdulte : [],
        selected_videos_adulte: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
        selected_body_part_photos: enabled.includes('body_part_photos') ? selectedBodyParts : {},
        selected_photos: [...(enabled.includes('photos_profil') ? selectedPhotosProfil : []), ...(enabled.includes('photos_adulte') ? selectedPhotosAdulte : [])],
        selected_videos: enabled.includes('photos_adulte') ? selectedVideosAdulte : [],
        occasion_photos: occasionPhotos.length > 0 ? occasionPhotos : undefined,
      }
    })
    if (upsertError) {
      setLoading(false)
      showToast(t('errors.error_prefix') + ': ' + upsertError.message, 'error')
      return
    }
    setLoading(false)
    // Notify the host
    if (id) {
      const { data: sess } = await supabase.from('sessions').select('host_id, title').eq('id', id).maybeSingle()
      if (sess?.host_id && user) {
        const name = profile?.display_name || user.email || t('common.someone')
        await supabase.from('notifications').insert({
          user_id: sess.host_id,
          session_id: id,
          type: 'new_application',
          title: t('notifications.applied_title', { name }),
          body: t('notifications.apply_body', { title: sess.title || t('common.your_session') }),
          href: '/session/' + id + '/host',
        })
        sendPushToUser(sess.host_id, t('notifications.applied_title', { name }), t('push.applied_body', { title: sess.title || 'Session' }), '/session/' + id + '/host')
      }
    }
    showToast(t('apply.toast_sent'), 'success')
    navigate('/session/' + id)
  }

  return {
    t, id, navigate, roles,
    BLOC_PROFIL, BLOC_ADULTE, SECTION_OCCASION, ALL_SECTIONS,
    user, session, profile,
    enabled, setEnabled, toggle,
    selectedPhotosProfil, setSelectedPhotosProfil,
    selectedPhotosAdulte, setSelectedPhotosAdulte,
    selectedVideosAdulte, setSelectedVideosAdulte,
    selectedBodyParts, setSelectedBodyParts,
    selectedRole, setSelectedRole,
    note, setNote,
    messageToHost, setMessageToHost,
    step, setStep,
    loading, dataLoading, loadError,
    isRateLimited, rateLimitedUntil,
    capacityFull, invalidPseudo, sessionEnded,
    guestMode, guestDisplayName, setGuestDisplayName,
    occasionPhotos, setOccasionPhotos, mediaUploading,
    onPickOccasionFile, occasionFileRef, onOccasionFileChange,
    submit,
  }
}

