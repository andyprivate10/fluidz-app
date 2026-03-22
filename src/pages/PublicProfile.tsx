import LazyImage from '../components/LazyImage'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import AddContactButton from '../components/AddContactButton'
import ProfileStory from '../components/ProfileStory'
import { VibeScoreBadge, VibeScoreCard } from '../components/VibeScoreBadge'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { MessageCircle, Sparkles, ArrowLeft, Play, Heart, MapPin, Shield } from 'lucide-react'
import { monthsAgoCount } from '../lib/timing'

const S = colors
const card: React.CSSProperties = { background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: 16, border: '1px solid ' + S.rule2, marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)' }
const sLabel = (c: string): React.CSSProperties => ({ fontSize: 10, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 })

/* ═══ Sub-components ═══ */

function ContactRequestButton({ targetUserId, myProfile }: { targetUserId: string; myProfile: Record<string,unknown> | null }) {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  async function sendRequest() {
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }
    const name = (myProfile as any)?.display_name || user.email || 'Quelqu\'un'
    const role = (myProfile as any)?.role || ''
    await supabase.from('notifications').insert({ user_id: targetUserId, type: 'contact_request', title: name + ' s\'intéresse à toi', body: role ? role + ' · Veut en voir plus' : 'Veut entrer en contact', href: '/profile/' + user.id })
    await supabase.from('contacts').upsert({ user_id: user.id, contact_user_id: targetUserId, relation_level: 'connaissance' }, { onConflict: 'user_id,contact_user_id' })
    await supabase.from('contacts').upsert({ user_id: targetUserId, contact_user_id: user.id, relation_level: 'connaissance' }, { onConflict: 'user_id,contact_user_id' })
    await supabase.from('interaction_log').insert({ user_id: user.id, target_user_id: targetUserId, type: 'contact_request', meta: { role } })
    setSent(true); setSending(false)
  }
  if (sent) return (
    <button onClick={() => nav('/dm/' + targetUserId)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: S.sagebg, border: '1px solid '+S.sagebd, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: S.sage }}>{t('profile.request_sent')}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: S.blue }}>→ DM</span>
    </button>
  )
  return (
    <button onClick={sendRequest} disabled={sending} className="btn-shimmer" style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${S.p}, #c06868)`, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px ' + S.pbd, opacity: sending ? 0.7 : 1, position: 'relative' as const, overflow: 'hidden' }}>
      <Heart size={15} strokeWidth={2} fill="white" style={{ marginRight: 6, display: 'inline' }} />
      {sending ? t('profile.sending') : t('profile.interested')}
    </button>
  )
}

function Create1to1Button({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const nav = useNavigate()
  const [creating, setCreating] = useState(false)
  async function create() {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }
    const { data: myProf } = await supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle()
    const myName = myProf?.display_name || 'Quelqu\'un'
    const code = Math.random().toString(36).slice(2, 8)
    const { data: sess, error } = await supabase.from('sessions').insert({ host_id: user.id, title: myName + ' & ' + targetName, description: 'Session privée 1-to-1', status: 'open', tags: [], invite_code: code, group_chat_enabled: false }).select('id').single()
    if (error || !sess) { setCreating(false); return }
    await supabase.from('applications').insert({ session_id: sess.id, applicant_id: targetUserId, status: 'accepted', eps_json: { direct_invite: true, role: '' } })
    await supabase.from('notifications').insert({ user_id: targetUserId, session_id: sess.id, type: 'session_invite', title: 'Session privée avec ' + myName, body: myName + ' veut te rencontrer en privé', href: '/session/' + sess.id })
    setCreating(false)
    nav('/session/' + sess.id + '/dm/' + targetUserId)
  }
  return (
    <button onClick={create} disabled={creating} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'transparent', border: '1px solid ' + S.lavbd, color: S.lav, fontSize: 12, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Sparkles size={12} strokeWidth={1.5} />{creating ? '...' : '1-to-1'}
    </button>
  )
}

function InviteToSessionButton({ targetUserId }: { targetUserId: string }) {
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([])
  const [sending, setSending] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id === targetUserId) return
      Promise.all([
        supabase.from('sessions').select('id, title').eq('host_id', user.id).eq('status', 'open'),
        supabase.from('applications').select('session_id, sessions(id, title)').eq('applicant_id', user.id).in('status', ['accepted', 'checked_in']),
      ]).then(([{ data: hosted }, { data: member }]) => {
        const all = new Map<string, { id: string; title: string }>()
        ;(hosted || []).forEach((s: any) => all.set(s.id, s))
        ;(member || []).forEach((a: any) => { if (a.sessions) all.set(a.sessions.id, { id: a.sessions.id, title: a.sessions.title }) })
        setSessions([...all.values()])
      })
    })
  }, [targetUserId])
  async function invite(sessionId: string) {
    setSending(true)
    const sess = sessions.find(s => s.id === sessionId)
    await supabase.from('notifications').insert({ user_id: targetUserId, session_id: sessionId, type: 'session_invite', title: 'Tu es invité !', body: 'Invité à "' + (sess?.title || 'session') + '"', href: '/session/' + sessionId })
    setSending(false)
  }
  if (sessions.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {sessions.map(s => (
        <button key={s.id} onClick={() => invite(s.id)} disabled={sending} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', border: '1px solid ' + S.sagebd, background: S.sagebg, color: S.sage }}>
          Inviter à "{s.title}"
        </button>
      ))}
    </div>
  )
}

/* ═══ MAIN ═══ */
export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showStory, setShowStory] = useState(false)
  const [myProfile, setMyProfile] = useState<Record<string,unknown> | null>(null)
  const [allowed, setAllowed] = useState<boolean>(false)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let c = false
    async function run() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) { setAllowed(false); setLoading(false); return }
      setAllowed(true)
      const { data: prof } = await supabase.from('user_profiles').select('display_name, profile_json, location_updated_at').eq('id', userId).maybeSingle()
      if (!c) setProfile(prof)
      setLoading(false)
      const { data: mp } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
      if (mp) setMyProfile({ display_name: mp.display_name, ...(mp.profile_json as Record<string,unknown> || {}) })
      if (user?.id && userId && user.id !== userId) supabase.from('interaction_log').insert({ user_id: user.id, target_user_id: userId, type: 'profile_view' as any, meta: {} }).then(() => {})
    }
    run()
    return () => { c = true }
  }, [userId])

  if (loading) return (<div style={{ minHeight: '100vh', background: S.bg, maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>)
  if (!allowed) return (<div style={{ minHeight: '100vh', background: S.bg, padding: 24, maxWidth: 480, margin: '0 auto' }}><button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />Retour</button><p style={{ color: S.tx2, marginTop: 24, textAlign: 'center' }}>Profil réservé aux membres connectés.</p></div>)
  if (!profile) return (<div style={{ minHeight: '100vh', background: S.bg, padding: 24, maxWidth: 480, margin: '0 auto' }}><button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />Retour</button><p style={{ color: S.red, marginTop: 16 }}>Profil introuvable.</p></div>)

  const p = profile.profile_json || {}
  const kinks: string[] = p.kinks || []
  const allPhotos: string[] = [...(Array.isArray(p.photos_profil) ? p.photos_profil : []), ...(Array.isArray(p.photos_intime) ? p.photos_intime : []), ...(Array.isArray(p.photos) ? p.photos : []), ...(!Array.isArray(p.photos_profil) && !Array.isArray(p.photos) && p.avatar_url ? [p.avatar_url] : [])].filter((v, i, a) => a.indexOf(v) === i)
  const allVideos: string[] = [...(Array.isArray(p.videos_intime) ? p.videos_intime : []), ...(Array.isArray(p.videos) ? p.videos : [])]
  const hasPhotos = allPhotos.length > 0
  const displayName = profile.display_name || 'Anonyme'

  let onlineLabel = ''; let isOnline = false
  if (profile.location_updated_at) {
    const mins = Math.floor((Date.now() - new Date(profile.location_updated_at).getTime()) / 60000)
    isOnline = mins < 30
    onlineLabel = isOnline ? 'En ligne' : mins < 60 ? mins + 'min' : mins < 1440 ? Math.floor(mins / 60) + 'h' : Math.floor(mins / 1440) + 'j'
  }

  const kinkMap: Record<string, { bg: string; color: string; border: string }> = {
    'Dominant': { bg: S.p2, color: S.p, border: S.pbd }, 'Soumis': { bg: S.p2, color: S.p, border: S.pbd },
    'SM léger': { bg: S.p2, color: S.p, border: S.pbd }, 'SM hard': { bg: S.redbg, color: S.red, border: S.redbd },
    'Fist': { bg: S.redbg, color: S.red, border: S.redbd }, 'Group': { bg: S.bluebg, color: S.blue, border: S.bluebd },
    'Voyeur': { bg: S.violetbg, color: S.violet, border: S.violetbd }, 'Exhib': { bg: S.violetbg, color: S.violet, border: S.violetbd },
    'Fétichisme': { bg: S.emeraldbg, color: S.emerald, border: S.emeraldbd }, 'Jeux de rôle': { bg: S.amberbg, color: S.amber, border: S.amberbd },
  }
  const defK = { bg: S.bg2, color: S.tx2, border: S.rule }

  function navPhoto(d: 1 | -1) { setPhotoIdx(i => Math.max(0, Math.min(allPhotos.length - 1, i + d))) }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 100, maxWidth: 480, margin: '0 auto', position: 'relative' as const }}>
      <OrbLayer />

      {/* ═══ HERO GALLERY ═══ */}
      <div style={{ position: 'relative', width: '100%', height: hasPhotos ? 440 : 200, overflow: 'hidden' }}>
        {hasPhotos ? (
          <>
            <LazyImage src={allPhotos[photoIdx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {allPhotos.length > 1 && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 3 }}>
              {allPhotos.map((_, i) => <div key={i} style={{ width: i === photoIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'width 0.2s' }} />)}
            </div>}
            {photoIdx > 0 && <div onClick={() => navPhoto(-1)} style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 2, cursor: 'pointer' }} />}
            {photoIdx < allPhotos.length - 1 && <div onClick={() => navPhoto(1)} style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', zIndex: 2, cursor: 'pointer' }} />}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${S.bg1}, ${S.bg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white' }}>{displayName[0].toUpperCase()}</div>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: `linear-gradient(to top, ${S.bg} 20%, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 14, left: 14, zIndex: 4, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} strokeWidth={2} /></button>
        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{displayName}</h1>
            <VibeScoreBadge userId={userId!} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {p.age && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{p.age} ans</span>}
            {p.location && <><span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} strokeWidth={1.5} />{p.location}</span></>}
            {isOnline && <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.sage, display: 'inline-block', marginLeft: 4, boxShadow: '0 0 8px ' + S.sage }} />}
          </div>
        </div>
      </div>

      {/* ═══ QUICK PILLS ═══ */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {p.role && <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${S.p}, #c06868)` }}>{p.role}</span>}
        {p.morphology && <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.tx2, background: S.bg2, border: '1px solid ' + S.rule }}>{p.morphology}</span>}
        {onlineLabel && !isOnline && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.tx3, background: S.bg2 }}>{onlineLabel}</span>}
        {(p.health?.prep_status || p.prep) === 'Actif' && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}><Shield size={10} strokeWidth={2} style={{display:'inline',marginRight:2}} />PrEP</span>}
      </div>

      {/* ═══ ACTIONS ═══ */}
      <div style={{ padding: '16px 20px 0' }}>
        <ContactRequestButton targetUserId={userId!} myProfile={myProfile} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => navigate('/dm/' + userId)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><MessageCircle size={13} strokeWidth={1.5} /> DM</button>
          <button onClick={() => setShowStory(true)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Play size={12} strokeWidth={2} fill={S.tx2} /> Story</button>
          <Create1to1Button targetUserId={userId!} targetName={displayName} />
        </div>
        <div style={{ marginTop: 8 }}><AddContactButton targetUserId={userId!} /></div>
      </div>

      {/* ═══ CARDS ═══ */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ marginBottom: 12 }}><VibeScoreCard userId={userId!} /></div>

        {p.bio && <div style={card}><div style={sLabel(S.p)}>Bio</div><p style={{ fontSize: 14, color: S.tx, lineHeight: 1.7, margin: 0 }}>{p.bio}</p></div>}

        {(p.height || p.weight) && (
          <div style={card}>
            <div style={sLabel(S.lav)}>Physique</div>
            <div style={{ display: 'grid', gridTemplateColumns: p.height && p.weight ? '1fr 1fr' : '1fr', gap: 10 }}>
              {p.height && <div style={{ background: S.bg2, borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1px solid ' + S.rule }}><div style={{ fontSize: 26, fontWeight: 800, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{p.height}</div><div style={{ fontSize: 11, color: S.tx3, fontWeight: 600, marginTop: 2 }}>cm</div></div>}
              {p.weight && <div style={{ background: S.bg2, borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1px solid ' + S.rule }}><div style={{ fontSize: 26, fontWeight: 800, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{p.weight}</div><div style={{ fontSize: 11, color: S.tx3, fontWeight: 600, marginTop: 2 }}>kg</div></div>}
            </div>
          </div>
        )}

        {/* Zones intimes */}
        {p.body_part_photos && Object.keys(p.body_part_photos).length > 0 && (() => {
          const labelMap: Record<string, string> = { torso: 'Torse', sex: 'Sex', butt: 'Fessier', feet: 'Pieds', torse: 'Torse', bite: 'Sex', cul: 'Fessier', pieds: 'Pieds' }
          const zones = Object.entries(p.body_part_photos as Record<string, string | string[]>).filter(([, val]) => {
            const urls = Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : [])
            return urls.length > 0
          })
          return zones.length > 0 ? (
            <div style={card}>
              <div style={sLabel(S.p)}>Zones intimes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {zones.map(([part, val]) => {
                  const urls = Array.isArray(val) ? val : [val as string]
                  return (
                    <div key={part} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid ' + S.rule2 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px 4px', margin: 0 }}>{labelMap[part] || part}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: urls.length > 1 ? '1fr 1fr' : '1fr', gap: 2, padding: '0 2px 2px' }}>
                        {urls.map((url, i) => {
                          const isVid = typeof url === 'string' && url.match(/\.(mp4|mov|webm|avi)/i)
                          return isVid ? (
                            <video key={i} src={url} controls style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            <img key={i} src={url as string} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null
        })()}

        {kinks.length > 0 && <div style={card}><div style={sLabel(S.p)}>Pratiques · {kinks.length}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{kinks.map((k: string) => { const c = kinkMap[k] || defK; return <span key={k} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, border: '1px solid ' + c.border }}>{k}</span> })}</div></div>}

        {(p.health?.prep_status || p.health?.dernier_test || p.prep) && (
          <div style={card}><div style={sLabel(S.sage)}>Santé</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(p.health?.prep_status || p.prep) === 'Actif' && <span style={{ fontSize: 13, fontWeight: 600, color: S.sage, padding: '5px 14px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={2} /> PrEP Actif</span>}
            {p.health?.dernier_test && <span style={{ fontSize: 13, fontWeight: 600, color: S.blue, padding: '5px 14px', borderRadius: 99, background: S.bluebg, border: '1px solid ' + S.bluebd }}>Testé il y a {monthsAgoCount(p.health.dernier_test)} mois</span>}
          </div></div>
        )}

        {p.limits && <div style={{ ...card, borderColor: S.redbd }}><div style={sLabel(S.red)}>Hard limits</div><p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{p.limits}</p></div>}

        {allVideos.length > 0 && <div style={card}><div style={sLabel(S.lav)}>Vidéos · {allVideos.length}</div><div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>{allVideos.map((url: string, i: number) => <div key={i} style={{ flexShrink: 0 }}><video src={url} controls style={{ width: 140, height: 180, borderRadius: 14, objectFit: 'cover', border: '1px solid ' + S.rule }} /></div>)}</div></div>}

        <InviteToSessionButton targetUserId={userId!} />
      </div>

      {showStory && profile && <ProfileStory profile={{ display_name: displayName, profile_json: p }} onClose={() => setShowStory(false)} />}
    </div>
  )
}
