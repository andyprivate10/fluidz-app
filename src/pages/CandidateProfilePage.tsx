import { ArrowLeft, Flag, Ban, Link2, XCircle } from 'lucide-react'
import OptionsMenu from '../components/OptionsMenu'
import { showToast } from '../components/Toast'
import LazyImage from '../components/LazyImage'
import ProfileStory from '../components/ProfileStory'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AddContactButton from '../components/AddContactButton'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { colors, fonts, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { monthsAgoLabel } from '../lib/timing'
import ImageLightbox from '../components/ImageLightbox'
import { SYSTEM_SENDER } from '../lib/constants'
import { useTranslation } from 'react-i18next'
import { stripHtml } from '../lib/sanitize'

const S = colors

export default function CandidateProfilePage() {
  const { t } = useTranslation()
  const { id: sessionId, applicantId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [app, setApp] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [showStory, setShowStory] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [sessionId, applicantId])

  async function loadData() {
    setLoading(true)
    const user = authUser

    // Session + host check
    const { data: sessData } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle()
    setSess(sessData)
    if (user && sessData) setIsHost(sessData.host_id === user.id)

    // Application
    const { data: appData } = await supabase
      .from('applications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('applicant_id', applicantId)
      .maybeSingle()
    setApp(appData)

    // User profile (actual data, not just snapshot)
    const { data: profData } = await supabase
      .from('user_profiles')
      .select('display_name, profile_json')
      .eq('id', applicantId)
      .maybeSingle()
    setProfile(profData)

    setLoading(false)
  }

  async function handleDecision(decision: 'accepted' | 'rejected') {
    if (!app || !sessionId || !sess) return
    setActioning(true)
    await supabase.from('applications').update({ status: decision }).eq('id', app.id)

    // Notification
    const title = decision === 'accepted'
      ? t('host.accepted_for', { title: sess.title })
      : t('host.rejected_for', { title: sess.title })
    await supabase.from('notifications').insert({
      user_id: app.applicant_id,
      session_id: sessionId,
      type: decision === 'accepted' ? 'application_accepted' : 'application_rejected',
      message: title,
      title,
      body: decision === 'accepted' ? t('host.accepted_body') : '',
      href: decision === 'accepted' ? `/session/${sessionId}/dm` : `/session/${sessionId}`,
    })

    // Safety tip on accept (only once per session)
    if (decision === 'accepted') {
      if (authUser) {
        const user = authUser
        const { data: systemMsgs } = await supabase.from('messages')
          .select('id')
          .eq('session_id', sessionId)
          .eq('sender_name', SYSTEM_SENDER)
          .limit(1)
        if (!systemMsgs || systemMsgs.length === 0) {
          await supabase.from('messages').insert({
            session_id: sessionId,
            sender_id: user.id,
            text: t('safety.tip'),
            sender_name: SYSTEM_SENDER,
          })
        }
      }
    }

    navigate('/session/' + sessionId + '?tab=candidates')
    setActioning(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
        <OrbLayer />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '28%', background: S.bg2, animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '60%', height: 18, borderRadius: 8, background: S.bg2, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ width: '35%', height: 12, borderRadius: 8, background: S.bg2, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          {[1,2,3].map(i => <div key={i} style={{ background: 'rgba(22,20,31,0.85)', borderRadius: 20, border: '1px solid '+S.rule2, height: 72, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      </div>
    )
  }

  if (!app) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: S.tx3 }}>{t('candidate.not_found')}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, color: S.p, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back_label')}</button>
      </div>
    )
  }

  // Merge data: prefer actual profile, fall back to eps_json snapshot
  const pj = profile?.profile_json || {}
  const eps = app.eps_json || {}
  const snapshot = eps.profile_snapshot || {}
  const shared = eps.shared_sections || []

  const displayName = stripHtml(profile?.display_name || snapshot.display_name) || t('common.anonymous_fallback')
  const role = eps.role || pj.role || snapshot.role || ''
  const orientation = pj.orientation || snapshot.orientation || ''
  const age = pj.age || snapshot.age || ''
  const location = pj.location || snapshot.location || ''
  const bio = stripHtml(pj.bio || snapshot.bio) || ''
  const homeCountry = pj.home_country || snapshot.home_country || ''
  const homeCity = pj.home_city || snapshot.home_city || ''
  const languages: string[] = Array.isArray(pj.languages) ? pj.languages : Array.isArray(snapshot.languages) ? snapshot.languages : []
  const height = pj.height || snapshot.height || ''
  const weight = pj.weight || snapshot.weight || ''
  const morphology = pj.morphology || snapshot.morphology || ''
  const kinks = pj.kinks || snapshot.kinks || []
  const limits = pj.limits || snapshot.limits || ''
  const health = pj.health || snapshot.health || {}
  const avatarUrl = pj.avatar_url || snapshot.avatar_url || ''
  const messageText = stripHtml(eps.message || eps.occasion_note) || ''
  // New split albums (backward compat with old selected_photos)
  const photosProfil: string[] = eps.selected_photos_profil || (Array.isArray(pj.photos_profil) ? pj.photos_profil : [])
  const photosAdulte: string[] = eps.selected_photos_adulte || []
  const videosAdulte: string[] = eps.selected_videos_adulte || []
  // Fallback: old combined format
  const candidatePhotos: string[] = photosProfil.length > 0 || photosAdulte.length > 0
    ? [...photosProfil, ...photosAdulte]
    : (eps.selected_photos || (Array.isArray(pj.photos) ? pj.photos : avatarUrl ? [avatarUrl] : []))
  const candidateVideos: string[] = videosAdulte.length > 0
    ? videosAdulte
    : (eps.selected_videos || (Array.isArray(pj.videos) ? pj.videos : []))
  const hasAdulteMedia = photosAdulte.length > 0 || videosAdulte.length > 0
  const occasionPhotos: string[] = Array.isArray(eps.occasion_photos) ? eps.occasion_photos : []


  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: isHost && app.status === 'pending' ? 100 : 24, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {/* Photo gallery */}
      {candidatePhotos.length > 0 && (
        <div style={{ padding: '40px 20px 0' }}>
          <button onClick={() => navigate('/session/' + sessionId + '?tab=candidates')} style={{ background: 'none', border: 'none', color: S.p, fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={16} strokeWidth={1.5} />{sess?.title || t('common.back_label')}</button>
          {/* Profil photos */}
          {photosProfil.length > 0 && (
            <>
              {hasAdulteMedia && <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{t('profile.profile')}</p>}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {photosProfil.map((url: string, i: number) => (
                  <LazyImage key={i} src={url} style={{ width: photosProfil.length === 1 && !hasAdulteMedia ? '100%' : 140, height: 180, borderRadius: 20, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.rule }} />
                ))}
              </div>
            </>
          )}
          {/* Adulte photos/videos */}
          {hasAdulteMedia && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 6px' }}>{t('profile.adult')}</p>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {photosAdulte.map((url: string, i: number) => (
                  <img key={'a' + i} src={url} alt="" loading="lazy" onClick={() => setLightbox({ images: photosAdulte, index: i })} style={{ width: 140, height: 180, borderRadius: 20, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.pbd, cursor: 'zoom-in' }} />
                ))}
                {videosAdulte.map((url: string, i: number) => (
                  <div key={'va' + i} style={{ position: 'relative', flexShrink: 0 }}>
                    <video src={url} style={{ width: 140, height: 180, borderRadius: 20, objectFit: 'cover', border: '1px solid ' + S.pbd }} />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: S.tx, fontSize: 10, fontWeight: 600 }}>{t('chat.video')}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Fallback: old combined format (no album labels) */}
          {photosProfil.length === 0 && !hasAdulteMedia && candidatePhotos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {candidatePhotos.map((url: string, i: number) => (
                <img key={i} src={url} alt="" loading="lazy" onClick={() => setLightbox({ images: candidatePhotos, index: i })} style={{ width: candidatePhotos.length === 1 ? '100%' : 140, height: 180, borderRadius: 20, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.rule, cursor: 'zoom-in' }} />
              ))}
              {candidateVideos.map((url: string, i: number) => (
                <div key={'v' + i} style={{ position: 'relative', flexShrink: 0 }}>
                  <video src={url} style={{ width: 140, height: 180, borderRadius: 20, objectFit: 'cover', border: '1px solid ' + S.rule }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: S.tx, fontSize: 10, fontWeight: 600 }}>{t('chat.video')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: candidatePhotos.length > 0 ? '16px 20px 20px' : '40px 20px 20px' }}>
        {candidatePhotos.length === 0 && (
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back_label')}</button>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <OptionsMenu options={[
            { label: t('options.report'), icon: <Flag size={15} strokeWidth={1.5} />, onClick: () => {}, danger: true },
            { label: t('options.block'), icon: <Ban size={15} strokeWidth={1.5} />, onClick: () => {}, danger: true },
            { label: t('options.copy_link'), icon: <Link2 size={15} strokeWidth={1.5} />, onClick: () => { navigator.clipboard?.writeText(window.location.href); showToast(t('session.link_copied'), 'success') } },
            ...(isHost && app.status === 'pending' ? [{ label: t('options.reject'), icon: <XCircle size={15} strokeWidth={1.5} />, onClick: () => handleDecision('rejected'), danger: true }] : []),
          ]} />
        </div>

        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" loading="lazy" style={{ width: 64, height: 64, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + S.rule }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: S.tx }}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize:24,fontWeight:800,fontFamily:fonts.hero,color:S.tx, margin: 0 }}>{displayName}</h1>
              {!eps.is_phantom && <VibeScoreBadge userId={app.applicant_id} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {age && <span style={{ fontSize: 13, color: S.tx3 }}>{age} {t('profile.age_years')}</span>}
              {location && <span style={{ fontSize: 13, color: S.tx3 }}>· {location}</span>}
            </div>
            {role && (
              <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600, color: S.tx, background: S.grad }}>{role}</span>
            )}
            {orientation && (
              <span style={{ display: 'inline-block', marginTop: 6, marginLeft: role ? 6 : 0, padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.lav, background: 'rgba(184,178,204,0.12)', border: '1px solid rgba(184,178,204,0.25)' }}>{orientation}</span>
            )}
            {(homeCity || languages.length > 0) && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {homeCity && <span style={{ fontSize: 10, fontWeight: 600, color: S.lav, background: S.lavbg, padding: '2px 8px', borderRadius: 99, border: '1px solid ' + S.lavbd }}>{homeCity}{homeCountry ? ', ' + homeCountry : ''}</span>}
                {languages.slice(0, 3).map(l => <span key={l} style={{ fontSize: 9, color: S.tx4, padding: '2px 6px', borderRadius: 99, background: S.bg2, border: '1px solid ' + S.rule }}>{l}</span>)}
                {languages.length > 3 && <span style={{ fontSize: 9, color: S.tx4 }}>+{languages.length - 3}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div style={{ marginTop: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
            color: app.status === 'accepted' || app.status === 'checked_in' ? S.sage : app.status === 'rejected' ? S.red : S.orange,
            background: app.status === 'accepted' || app.status === 'checked_in' ? S.sagebg : app.status === 'rejected' ? S.redbg : S.orangebg,
            border: '1px solid ' + (app.status === 'accepted' || app.status === 'checked_in' ? S.sagebd : app.status === 'rejected' ? S.redbd : S.orangebd),
          }}>
            {t('status.' + (app.status || 'pending'))}
          </span>
          <button onClick={() => setShowStory(true)} style={{ padding: '4px 10px', borderRadius: 8, background: S.p, border: 'none', color: S.tx, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{t('profile.story')}</button>
          {eps.is_phantom && <span style={{ marginLeft: 8, fontSize: 11, color: S.tx3, padding: '2px 8px', borderRadius: 99, background: S.bg3 }}>{t('common.ghost')}</span>}
          {!eps.is_phantom && <AddContactButton targetUserId={app.applicant_id} />}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── BLOC 1: PROFIL ── */}
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>{t('profile.profile')}</p>

          {/* Bio */}
          {bio && (
            <div style={{ ...glassCard, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('profile.bio')}</p>
              <p style={{ fontSize: 14, color: S.tx, lineHeight: 1.5, margin: 0 }}>{bio}</p>
            </div>
          )}

          {/* Physique */}
          {(height || weight || morphology) && (
            <div style={{ ...glassCard, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>{t('profile.section_physique')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {height && <div style={{ textAlign: 'center', padding: 8, background: S.bg2, borderRadius: 10 }}><p style={{ fontSize: 18, fontWeight: 700, color: S.tx, margin: 0 }}>{height}</p><p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>cm</p></div>}
                {weight && <div style={{ textAlign: 'center', padding: 8, background: S.bg2, borderRadius: 10 }}><p style={{ fontSize: 18, fontWeight: 700, color: S.tx, margin: 0 }}>{weight}</p><p style={{ fontSize: 11, color: S.tx3, margin: 0 }}>kg</p></div>}
                {morphology && <div style={{ textAlign: 'center', padding: 8, background: S.bg2, borderRadius: 10, gridColumn: height && weight ? 'span 2' : undefined }}><p style={{ fontSize: 14, fontWeight: 600, color: S.tx, margin: 0 }}>{morphology}</p></div>}
              </div>
            </div>
          )}
        </div>

        {/* ── BLOC 2: ADULTE ── */}
        {(kinks.length > 0 || limits || hasAdulteMedia || (health.prep_status || health.dernier_test)) && (
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>{t('profile.adult')}</p>

            {/* Body part photos grid */}
            {pj.body_part_photos && Object.keys(pj.body_part_photos).length > 0 && (
              <div style={{ ...glassCard, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('profile.body_parts')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(pj.body_part_photos as Record<string, string | string[]>).map(([part, val]) => {
                    const urls = Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : [])
                    if (urls.length === 0) return null
                    const labelMap: Record<string, string> = { torso: t('body_parts.torso'), sex: t('body_parts.sex'), butt: t('body_parts.butt'), feet: t('body_parts.feet'), torse: t('body_parts.torso'), bite: t('body_parts.sex'), cul: t('body_parts.butt'), pieds: t('body_parts.feet') }
                    return (
                      <div key={part} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid ' + S.rule2, background: 'rgba(22,20,31,0.85)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 10px 4px', margin: 0 }}>{labelMap[part] || part}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: urls.length > 1 ? '1fr 1fr' : '1fr', gap: 2, padding: '0 2px 2px' }}>
                          {urls.map((url, i) => {
                            const isVideo = url.match(/\.(mp4|mov|webm|avi)/i)
                            return isVideo ? (
                              <video key={i} src={url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
                            ) : (
                              <img key={i} src={url} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pratiques */}
            {kinks.length > 0 && (() => {
              const kinkColors: Record<string, { bg: string; color: string; border: string }> = {
                'Dominant': { bg: S.p2, color: S.p, border: S.pbd },
                'Soumis': { bg: S.p2, color: S.p, border: S.pbd },
                'SM leger': { bg: S.p2, color: S.p, border: S.pbd },
                'SM hard': { bg: S.redbg, color: S.red, border: S.redbd },
                'Fist': { bg: S.redbg, color: S.red, border: S.redbd },
                'Group': { bg: S.bluebg, color: S.blue, border: S.bluebd },
                'Voyeur': { bg: S.violetbg, color: S.violet, border: S.violetbd },
                'Exhib': { bg: S.violetbg, color: S.violet, border: S.violetbd },
                'Fetichisme': { bg: S.emeraldbg, color: S.emerald, border: S.emeraldbd },
                'Jeux de role': { bg: S.amberbg, color: S.amber, border: S.amberbd },
                'Bears welcome': { bg: S.p2, color: S.p, border: S.pbd },
              }
              const def = { bg: S.bg2, color: S.tx2, border: S.rule }
              return (
                <div style={{ ...glassCard, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('profile.pratiques_count', { count: kinks.length })}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {kinks.map((k: string) => {
                      const c = kinkColors[k] || def
                      return <span key={k} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, border: '1px solid ' + c.border }}>{k}</span>
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Limites */}
            {limits && (
              <div style={{ ...glassCard, borderColor: S.redbd, background: S.redbg }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{t('profile.limits')}</p>
                <p style={{ fontSize: 13, color: S.tx, lineHeight: 1.5, margin: 0 }}>{limits}</p>
              </div>
            )}

            {/* Sante */}
            {(health.prep_status || health.dernier_test) && (
              <div style={{ ...glassCard, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('profile.health')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {health.prep_status === 'Actif' && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}>{t('profile.prep_active_badge')}</span>
                  )}
                  {health.prep_status && health.prep_status !== 'Actif' && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, color: S.tx3 }}>PrEP {health.prep_status}</span>
                  )}
                  {health.dernier_test && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.blue, background: S.bluebg, border: '1px solid ' + S.bluebd }}>Test {monthsAgoLabel(health.dernier_test)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BLOC 3: SESSION ── */}
        {(messageText || eps.occasion_note || occasionPhotos.length > 0) && (
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>{t('nav.sessions')}</p>

            {/* Message au host */}
            {messageText && (
              <div style={{ ...glassCard, borderColor: S.pbd }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{t('host.message_to_host')}</p>
                <p style={{ fontSize: 13, color: S.tx, lineHeight: 1.5, margin: 0 }}>{messageText}</p>
              </div>
            )}

            {/* Occasion note */}
            {eps.occasion_note && eps.occasion_note !== messageText && (
              <div style={{ ...glassCard, borderColor: S.pbd }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{t('host.session_note')}</p>
                <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{stripHtml(eps.occasion_note)}</p>
              </div>
            )}

            {/* Occasion photos/videos */}
            {occasionPhotos.length > 0 && (
              <div style={{ ...glassCard, borderColor: S.pbd, marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('candidate.occasion_title')}</p>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  {occasionPhotos.map((url: string, i: number) => {
                    const isVid = /\.(mp4|mov|webm|avi)/i.test(url)
                    return isVid ? (
                      <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                        <video src={url} controls style={{ width: 140, height: 180, borderRadius: 14, objectFit: 'cover', border: '1px solid ' + S.pbd }} />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: S.tx, fontSize: 10, fontWeight: 600 }}>{t('chat.video')}</div>
                      </div>
                    ) : (
                      <img key={i} src={url} alt="" loading="lazy" onClick={() => setLightbox({ images: occasionPhotos.filter(u => !/\.(mp4|mov|webm|avi)/i.test(u)), index: occasionPhotos.filter(u => !/\.(mp4|mov|webm|avi)/i.test(u)).indexOf(url) })} style={{ width: 140, height: 180, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.pbd, cursor: 'zoom-in' }} />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shared sections info */}
        {shared.length > 0 && (
          <p style={{ fontSize: 11, color: S.tx4, margin: '8px 0 0', textAlign: 'center' }}>
            {t('candidate.sections_shared_date', { count: shared.length, plural: shared.length > 1 ? 's' : '', date: new Date(app.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) })}
          </p>
        )}
      </div>

      {/* Accept/Reject bar */}
      {isHost && app.status === 'pending' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 20px 28px',
          background: 'linear-gradient(to top, ' + S.bg + ' 70%, transparent)', display: 'flex', gap: 10,
        }}>
          <button onClick={() => handleDecision('rejected')} disabled={actioning} style={{
            flex: 1, padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15,
            color: S.red, border: '1px solid ' + S.redbd, background: S.redbg, cursor: 'pointer',
          }}>
            {t('host.reject')}
          </button>
          <button onClick={() => handleDecision('accepted')} disabled={actioning} style={{
            flex: 2, padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15,
            color: S.tx, background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer',
            boxShadow: '0 4px 16px ' + S.pbd,
          }}>
            {actioning ? '...' : t('host.accept')}
          </button>
        </div>
      )}
      {showStory && (
        <ProfileStory profile={{ display_name: displayName, profile_json: { ...pj, ...snapshot } }} onClose={() => setShowStory(false)} />
      )}
      {lightbox && <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}
