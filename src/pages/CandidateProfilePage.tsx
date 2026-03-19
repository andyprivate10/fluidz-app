import { ArrowLeft } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import ProfileStory from '../components/ProfileStory'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AddContactButton from '../components/AddContactButton'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { colors } from '../brand'

const S = colors

function monthsAgo(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const months = Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
  if (months === 0) return 'ce mois-ci'
  return `il y a ${months} mois`
}

export default function CandidateProfilePage() {
  const { id: sessionId, applicantId } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sess, setSess] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [showStory, setShowStory] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId, applicantId])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

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
      ? `Accepté pour "${sess.title}" `
      : `Non retenu pour "${sess.title}"`
    await supabase.from('notifications').insert({
      user_id: app.applicant_id,
      session_id: sessionId,
      type: decision === 'accepted' ? 'application_accepted' : 'application_rejected',
      message: title,
      title,
      body: decision === 'accepted' ? "Tu peux maintenant accéder au DM et à l'adresse." : '',
      href: decision === 'accepted' ? `/session/${sessionId}/dm` : `/session/${sessionId}`,
    })

    // Safety tip on accept (only once per session)
    if (decision === 'accepted') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .eq('sender_name', ' Fluidz')
        if (!count || count === 0) {
          await supabase.from('messages').insert({
            session_id: sessionId,
            sender_id: user.id,
            text: '⚠️ Rappel sécurité : Partage ta localisation avec un ami de confiance. Tu peux quitter à tout moment, sans justification. En cas de problème, contacte le host via ce DM.',
            sender_name: ' Fluidz',
          })
        }
      }
    }

    navigate('/session/' + sessionId + '/host')
    setActioning(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div style={{ width: 32, height: 32, border: '3px solid ' + S.p, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!app) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: S.tx3 }}>Candidature introuvable</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, color: S.p, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
      </div>
    )
  }

  // Merge data: prefer actual profile, fall back to eps_json snapshot
  const pj = profile?.profile_json || {}
  const eps = app.eps_json || {}
  const snapshot = eps.profile_snapshot || {}
  const shared = eps.shared_sections || []

  const displayName = profile?.display_name || snapshot.display_name || 'Anonyme'
  const role = eps.role || pj.role || snapshot.role || ''
  const age = pj.age || snapshot.age || ''
  const location = pj.location || snapshot.location || ''
  const bio = pj.bio || snapshot.bio || ''
  const height = pj.height || snapshot.height || ''
  const weight = pj.weight || snapshot.weight || ''
  const morphology = pj.morphology || snapshot.morphology || ''
  const kinks = pj.kinks || snapshot.kinks || []
  const limits = pj.limits || snapshot.limits || ''
  const health = pj.health || snapshot.health || {}
  const avatarUrl = pj.avatar_url || snapshot.avatar_url || ''
  const messageText = eps.message || eps.occasion_note || ''
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

  const card: React.CSSProperties = { background: S.bg1, border: '1px solid ' + S.rule, borderRadius: 16, padding: 16, marginBottom: 12 }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: isHost && app.status === 'pending' ? 100 : 24, maxWidth: 480, margin: '0 auto' }}>

      {/* Photo gallery */}
      {candidatePhotos.length > 0 && (
        <div style={{ padding: '40px 20px 0' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
          {/* Profil photos */}
          {photosProfil.length > 0 && (
            <>
              {hasAdulteMedia && <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Profil</p>}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {photosProfil.map((url: string, i: number) => (
                  <LazyImage key={i} src={url} style={{ width: photosProfil.length === 1 && !hasAdulteMedia ? '100%' : 140, height: 180, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.rule }} />
                ))}
              </div>
            </>
          )}
          {/* Adulte photos/videos */}
          {hasAdulteMedia && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 6px' }}>Adulte</p>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {photosAdulte.map((url: string, i: number) => (
                  <img key={'a' + i} src={url} alt="" style={{ width: 140, height: 180, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.p + '55' }} />
                ))}
                {videosAdulte.map((url: string, i: number) => (
                  <div key={'va' + i} style={{ position: 'relative', flexShrink: 0 }}>
                    <video src={url} style={{ width: 140, height: 180, borderRadius: 16, objectFit: 'cover', border: '1px solid ' + S.p + '55' }} />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 600 }}>vidéo</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Fallback: old combined format (no album labels) */}
          {photosProfil.length === 0 && !hasAdulteMedia && candidatePhotos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {candidatePhotos.map((url: string, i: number) => (
                <img key={i} src={url} alt="" style={{ width: candidatePhotos.length === 1 ? '100%' : 140, height: 180, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.rule }} />
              ))}
              {candidateVideos.map((url: string, i: number) => (
                <div key={'v' + i} style={{ position: 'relative', flexShrink: 0 }}>
                  <video src={url} style={{ width: 140, height: 180, borderRadius: 16, objectFit: 'cover', border: '1px solid ' + S.rule }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 600 }}>vidéo</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: candidatePhotos.length > 0 ? '16px 20px 20px' : '40px 20px 20px' }}>
        {candidatePhotos.length === 0 && (
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />Retour</button>
        )}

        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.rule }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize:24,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: 0 }}>{displayName}</h1>
              {!eps.is_phantom && <VibeScoreBadge userId={app.applicant_id} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {age && <span style={{ fontSize: 13, color: S.tx3 }}>{age} ans</span>}
              {location && <span style={{ fontSize: 13, color: S.tx3 }}>· {location}</span>}
            </div>
            {role && (
              <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600, color: '#fff', background: S.grad }}>{role}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div style={{ marginTop: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
            color: app.status === 'accepted' || app.status === 'checked_in' ? S.sage : app.status === 'rejected' ? S.red : S.orange,
            background: (app.status === 'accepted' || app.status === 'checked_in' ? S.sage : app.status === 'rejected' ? S.red : S.orange) + '18',
            border: '1px solid ' + (app.status === 'accepted' || app.status === 'checked_in' ? S.sage : app.status === 'rejected' ? S.red : S.orange) + '44',
          }}>
            {app.status === 'accepted' ? 'Accepté' : app.status === 'checked_in' ? 'Check-in' : app.status === 'rejected' ? 'Refusé' : 'En attente'}
          </span>
          <button onClick={() => setShowStory(true)} style={{ padding: '4px 10px', borderRadius: 8, background: S.p, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▶ Story</button>
          {eps.is_phantom && <span style={{ marginLeft: 8, fontSize: 11, color: S.tx3, padding: '2px 8px', borderRadius: 99, background: S.bg3 }}>Ghost</span>}
          {!eps.is_phantom && <AddContactButton targetUserId={app.applicant_id} />}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── BLOC 1: PROFIL ── */}
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>Profil</p>

          {/* Bio */}
          {bio && (
            <div style={card}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Bio</p>
              <p style={{ fontSize: 14, color: S.tx, lineHeight: 1.5, margin: 0 }}>{bio}</p>
            </div>
          )}

          {/* Physique */}
          {(height || weight || morphology) && (
            <div style={card}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Physique</p>
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
            <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>Adulte</p>

            {/* Body part photos grid */}
            {pj.body_part_photos && Object.keys(pj.body_part_photos).length > 0 && (
              <div style={card}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Photos par zone</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {Object.entries(pj.body_part_photos as Record<string, string>).map(([part, url]) => (
                    <div key={part} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1' }}>
                      <img src={url} alt={part} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pratiques */}
            {kinks.length > 0 && (() => {
              const kinkColors: Record<string, { bg: string; color: string; border: string }> = {
                'Dominant': { bg: '#F4727222', color: S.p, border: '#F4727244' },
                'Soumis': { bg: S.p2, color: S.p, border: S.pbd },
                'SM leger': { bg: S.p2, color: S.p, border: S.pbd },
                'SM hard': { bg: S.red+'22', color: S.red, border: S.red+'44' },
                'Fist': { bg: S.red+'22', color: S.red, border: S.red+'44' },
                'Group': { bg: S.blue+'22', color: S.blue, border: S.blue+'44' },
                'Voyeur': { bg: S.violet+'14', color: S.violet, border: S.violet+'33' },
                'Exhib': { bg: S.violet+'14', color: S.violet, border: S.violet+'33' },
                'Fetichisme': { bg: S.emerald+'14', color: S.emerald, border: S.emerald+'33' },
                'Jeux de role': { bg: S.amber+'14', color: S.amber, border: S.amber+'33' },
                'Bears welcome': { bg: S.p2, color: S.p, border: S.pbd },
              }
              const def = { bg: S.bg2, color: S.tx2, border: S.rule }
              return (
                <div style={card}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Pratiques ({kinks.length})</p>
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
              <div style={{ ...card, borderColor: S.red + '44', background: S.red + '08' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Limites</p>
                <p style={{ fontSize: 13, color: S.tx, lineHeight: 1.5, margin: 0 }}>{limits}</p>
              </div>
            )}

            {/* Sante */}
            {(health.prep_status || health.dernier_test) && (
              <div style={card}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Sante</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {health.prep_status === 'Actif' && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.sage, background: S.sage + '18', border: '1px solid ' + S.sage + '44' }}>PrEP actif</span>
                  )}
                  {health.prep_status && health.prep_status !== 'Actif' && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, color: S.tx3 }}>PrEP {health.prep_status}</span>
                  )}
                  {health.dernier_test && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.blue, background: S.blue + '18', border: '1px solid ' + S.blue + '44' }}>Test {monthsAgo(health.dernier_test)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BLOC 3: SESSION ── */}
        {(messageText || eps.occasion_note) && (
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', paddingLeft: 4 }}>Session</p>

            {/* Message au host */}
            {messageText && (
              <div style={{ ...card, borderColor: S.pbd }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Message au host</p>
                <p style={{ fontSize: 13, color: S.tx, lineHeight: 1.5, margin: 0 }}>{messageText}</p>
              </div>
            )}

            {/* Occasion note */}
            {eps.occasion_note && eps.occasion_note !== messageText && (
              <div style={{ ...card, borderColor: S.p + '33' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Note pour cette session</p>
                <p style={{ fontSize: 13, color: S.tx2, lineHeight: 1.5, margin: 0 }}>{eps.occasion_note}</p>
              </div>
            )}
          </div>
        )}

        {/* Shared sections info */}
        {shared.length > 0 && (
          <p style={{ fontSize: 11, color: S.tx4, margin: '8px 0 0', textAlign: 'center' }}>
            {shared.length} section{shared.length > 1 ? 's' : ''} partagee{shared.length > 1 ? 's' : ''} -- Candidature recue le {new Date(app.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
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
            color: S.red, border: '1px solid ' + S.red + '44', background: S.red + '10', cursor: 'pointer',
          }}>
            Refuser
          </button>
          <button onClick={() => handleDecision('accepted')} disabled={actioning} style={{
            flex: 2, padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15,
            color: '#fff', background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden', cursor: 'pointer',
            boxShadow: '0 4px 16px ' + S.pbd,
          }}>
            {actioning ? '...' : 'Accepter'}
          </button>
        </div>
      )}
      {showStory && (
        <ProfileStory profile={{ display_name: displayName, profile_json: { ...pj, ...snapshot } }} onClose={() => setShowStory(false)} />
      )}
    </div>
  )
}
