import LazyImage from '../components/LazyImage'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AddContactButton from '../components/AddContactButton'
import ProfileStory from '../components/ProfileStory'
import { VibeScoreBadge, VibeScoreCard } from '../components/VibeScoreBadge'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { MessageCircle, Sparkles } from 'lucide-react'

const S = {
  ...colors,
  red: '#F87171', orange: '#FBBF24', blue: '#7DD3FC',
  grad: colors.p,
}

function monthsAgo(isoDate: string): number {
  const d = new Date(isoDate)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
}

const card: React.CSSProperties = { background: S.bg1, borderRadius: 20, padding: 16, border: '1px solid ' + S.rule, marginBottom: 12 }
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }

function ContactRequestButton({ targetUserId, myProfile }: { targetUserId: string; myProfile: Record<string,unknown> | null }) {
  const nav = useNavigate()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function sendRequest() {
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }
    const name = (myProfile as any)?.display_name || user.email || 'Quelqu\'un'
    const role = (myProfile as any)?.role || ''
    const avatar = (myProfile as any)?.avatar_url || ''
    // Send notification with profile preview
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'contact_request',
      title: '💕 ' + name + ' s\'intéresse à toi',
      body: role ? role + ' · Veut en voir plus' : 'Veut entrer en contact',
      href: '/profile/' + user.id,
    })
    // Auto-add to contacts (both directions)
    await supabase.from('contacts').upsert(
      { user_id: user.id, contact_user_id: targetUserId, relation_level: 'connaissance' },
      { onConflict: 'user_id,contact_user_id' }
    )
    await supabase.from('contacts').upsert(
      { user_id: targetUserId, contact_user_id: user.id, relation_level: 'connaissance' },
      { onConflict: 'user_id,contact_user_id' }
    )
    // Log interaction
    await supabase.from('interaction_log').insert({
      user_id: user.id, target_user_id: targetUserId,
      type: 'contact_request', meta: { role, avatar },
    })
    setSent(true); setSending(false)
  }

  if (sent) return (
    <button onClick={() => nav('/dm/' + targetUserId)} style={{ marginTop: 8, width: '100%', padding: '12px 16px', borderRadius: 12, background: '#4ADE8014', border: '1px solid #4ADE8044', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>✓ Demande envoyée</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#7DD3FC' }}>→ Ouvrir le DM</span>
    </button>
  )

  return (
    <button onClick={sendRequest} disabled={sending} style={{
      marginTop: 8, width: '100%', padding: '12px 16px', borderRadius: 12,
      background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none',
      color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
      boxShadow: '0 2px 12px rgba(244,114,114,0.3)', opacity: sending ? 0.7 : 1,
    }}>
      {sending ? 'Envoi...' : '💕 Tu m\'intéresses · Entrer en contact'}
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

    // Create session
    const code = Math.random().toString(36).slice(2, 8)
    const { data: sess, error } = await supabase.from('sessions').insert({
      host_id: user.id,
      title: myName + ' & ' + targetName,
      description: 'Session privée 1-to-1',
      status: 'open',
      tags: [],
      invite_code: code,
      group_chat_enabled: false,
    }).select('id').single()

    if (error || !sess) { setCreating(false); return }

    // Auto-accept target as member
    await supabase.from('applications').insert({
      session_id: sess.id, applicant_id: targetUserId, status: 'accepted',
      eps_json: { direct_invite: true, role: '' },
    })

    // Notify target
    await supabase.from('notifications').insert({
      user_id: targetUserId, session_id: sess.id,
      type: 'session_invite',
      title: '💫 Session privée avec ' + myName,
      body: myName + ' veut te rencontrer en privé',
      href: '/session/' + sess.id,
    })

    setCreating(false)
    nav('/session/' + sess.id + '/dm/' + targetUserId)
  }

  return (
    <button onClick={create} disabled={creating} style={{
      marginTop: 6, width: '100%', padding: '10px 16px', borderRadius: 12,
      background: 'transparent', border: '1px solid #7DD3FC44', color: '#7DD3FC',
      fontSize: 13, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
      opacity: creating ? 0.6 : 1,
    }}>
      {creating ? 'Création...' : <><Sparkles size={13} strokeWidth={1.5} style={{marginRight:3}} /> Session 1-to-1</>}
    </button>
  )
}

function InviteToSessionButton({ targetUserId }: { targetUserId: string }) {
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id === targetUserId) return
      // Load sessions where user is host OR accepted member
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
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      session_id: sessionId,
      type: 'session_invite',
      title: '📩 Tu es invité !',
      body: 'Tu es invité à "' + (sess?.title || 'une session') + '"',
      href: '/session/' + sessionId,
    })
    setSending(false)
  }

  if (sessions.length === 0) return null
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {sessions.map(s => (
        <button key={s.id} onClick={() => invite(s.id)} disabled={sending} style={{
          padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
          border: '1px solid #4ADE8044', background: '#4ADE8014', color: '#4ADE80',
        }}>
          📩 Inviter à "{s.title}"
        </button>
      ))}
    </div>
  )
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showStory, setShowStory] = useState(false)
  const [myProfile, setMyProfile] = useState<Record<string,unknown> | null>(null)
  const [allowed, setAllowed] = useState<boolean>(false)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false

    async function run() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        setAllowed(false)
        setLoading(false)
        return
      }
      // All logged-in users can see profiles (discoverable via Explore, contacts, links)
      const canSee = true
      setAllowed(canSee)

      if (canSee) {
        const { data: prof } = await supabase.from('user_profiles').select('display_name, profile_json, location_updated_at').eq('id', userId).maybeSingle()
        if (!cancelled) setProfile(prof)
      }
      setLoading(false)
      // Load my profile for contact request button
      const { data: mp } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
      if (mp) setMyProfile({ display_name: mp.display_name, ...(mp.profile_json as Record<string,unknown> || {}) })
      // Log profile view
      if (user?.id && userId && user.id !== userId) {
        supabase.from('interaction_log').insert({
          user_id: user.id,
          target_user_id: userId,
          type: 'profile_view' as any,
          meta: {},
        }).then(() => {})
      }
    }
    run()
    return () => { cancelled = true }
  }, [userId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: S.tx3 }}>Chargement...</p>
    </div>
  )

  if (allowed === false) return (
    <div style={{ minHeight: '100vh', background: S.bg, padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Retour</button>
      <p style={{ color: S.tx2, marginTop: 24, textAlign: 'center' }}>Ce profil est réservé aux membres d&apos;une même session.</p>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: S.bg, padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Retour</button>
      <p style={{ color: S.red, marginTop: 16 }}>Profil introuvable.</p>
    </div>
  )

  const p = profile.profile_json || {}
  const kinks: string[] = p.kinks || []
  const allPhotos: string[] = [
    ...(Array.isArray(p.photos_profil) ? p.photos_profil : []),
    ...(Array.isArray(p.photos_intime) ? p.photos_intime : []),
    ...(Array.isArray(p.photos) ? p.photos : []),
    ...(!Array.isArray(p.photos_profil) && !Array.isArray(p.photos) && p.avatar_url ? [p.avatar_url] : []),
  ].filter((v, i, a) => a.indexOf(v) === i) as string[]
  const allVideos: string[] = [
    ...(Array.isArray(p.videos_intime) ? p.videos_intime : []),
    ...(Array.isArray(p.videos) ? p.videos : []),
  ] as string[]
  const hasMedia = allPhotos.length > 0 || allVideos.length > 0

  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96 }}>
      <div style={{ padding: '40px 20px 20px', borderBottom: '1px solid ' + S.rule }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>← Retour</button>

        {hasMedia && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
            {allPhotos.map((url: string, i: number) => (
              <LazyImage key={i} src={url} style={{ width: allPhotos.length === 1 && allVideos.length === 0 ? '100%' : 120, height: 160, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid ' + S.rule }} />
            ))}
            {allVideos.map((url: string, i: number) => (
              <div key={'v' + i} style={{ position: 'relative', flexShrink: 0 }}>
                <video src={url} controls style={{ width: 120, height: 160, borderRadius: 14, objectFit: 'cover', border: '1px solid ' + S.rule }} />
                <div style={{ position: 'absolute', bottom: 6, right: 6, padding: '2px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 600 }}>vidéo</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!hasMedia && (
            p.avatar_url ? (
              <img src={p.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '28%', objectFit: 'cover', flexShrink: 0, border: '2px solid ' + S.rule }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {(profile.display_name || '?')[0].toUpperCase()}
              </div>
            )
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: S.tx }}>{profile.display_name || 'Anonyme'}</h1>
              <VibeScoreBadge userId={userId!} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {p.age && <span style={{ fontSize: 13, color: S.tx3 }}>{p.age} ans</span>}
              {p.age && p.location && <span style={{ fontSize: 13, color: S.tx3 }}>·</span>}
              {p.location && <span style={{ fontSize: 13, color: S.tx3 }}>{p.location}</span>}
            </div>
          </div>
        </div>
        {p.role && (
          <span style={{ display: 'inline-block', marginTop: 12, padding: '4px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, color: 'white', background: S.grad }}>
            {p.role}
          </span>
        )}
        {/* Last seen */}
        {profile.location_updated_at && (() => {
          const ms = Date.now() - new Date(profile.location_updated_at).getTime()
          const mins = Math.floor(ms / 60000)
          const isOnline = mins < 30
          const label = isOnline ? 'En ligne' : mins < 60 ? `Vu il y a ${mins}min` : mins < 1440 ? `Vu il y a ${Math.floor(mins/60)}h` : `Vu il y a ${Math.floor(mins/1440)}j`
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#4ADE80' : '#7E7694', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: isOnline ? '#4ADE80' : '#7E7694', fontWeight: 600 }}>{label}</span>
            </div>
          )
        })()}

        {/* Story button */}
        <button onClick={() => setShowStory(true)} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#F9A8A8,#F47272)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px rgba(244,114,114,0.3)' }}>
          <span style={{marginRight:4}}>▶</span> Voir la Story
        </button>
        {/* Add to contacts button */}
        {/* Direct DM button */}
        <button onClick={() => navigate('/dm/' + userId)} style={{ marginTop: 8, width: '100%', padding: '10px 16px', borderRadius: 12, background: S.bg1, border: '1px solid #2A2740', color: '#B8B2CC', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MessageCircle size={13} strokeWidth={1.5} style={{marginRight:3}} /> DM direct
        </button>
        <ContactRequestButton targetUserId={userId!} myProfile={myProfile} />
        <AddContactButton targetUserId={userId!} />
        <InviteToSessionButton targetUserId={userId!} />
        <Create1to1Button targetUserId={userId!} targetName={profile.display_name || 'Anonyme'} />
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Vibe Score card */}
        <div style={{ marginBottom: 12 }}>
          <VibeScoreCard userId={userId!} />
        </div>

        {(p.height || p.weight || p.morphology) && (
          <div style={card}>
            <div style={label}>Physique</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {p.height && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: S.tx }}>{p.height}</div><div style={{ fontSize: 11, color: S.tx3 }}>cm</div></div>}
              {p.weight && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: S.tx }}>{p.weight}</div><div style={{ fontSize: 11, color: S.tx3 }}>kg</div></div>}
              {p.morphology && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 600, color: S.tx }}>{p.morphology}</div><div style={{ fontSize: 11, color: S.tx3 }}>morpho</div></div>}
            </div>
          </div>
        )}

        {kinks.length > 0 && (() => {
          const kinkColors: Record<string, { bg: string; color: string; border: string }> = {
            'Dominant': { bg: '#F4727222', color: S.p, border: '#F4727244' },
            'Soumis': { bg: '#F9A8A822', color: S.p, border: '#F9A8A844' },
            'SM léger': { bg: '#FBBF2422', color: '#FBBF24', border: '#FBBF2444' },
            'SM hard': { bg: '#F8717122', color: '#F87171', border: '#F8717144' },
            'Fist': { bg: '#F8717122', color: '#F87171', border: '#F8717144' },
            'Group': { bg: '#7DD3FC22', color: '#7DD3FC', border: '#7DD3FC44' },
            'Voyeur': { bg: '#A78BFA22', color: '#A78BFA', border: '#A78BFA44' },
            'Exhib': { bg: '#A78BFA22', color: '#A78BFA', border: '#A78BFA44' },
            'Fétichisme': { bg: '#34D39922', color: '#34D399', border: '#34D39944' },
            'Jeux de rôle': { bg: '#FB923C22', color: '#FB923C', border: '#FB923C44' },
            'Bears welcome': { bg: '#FBBF2422', color: '#FBBF24', border: '#FBBF2444' },
          }
          const defaultStyle = { bg: S.bg2, color: S.tx2, border: S.rule }
          return (
            <div style={card}>
      <OrbLayer />
              <div style={label}>Pratiques ({kinks.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {kinks.map((k: string) => {
                  const c = kinkColors[k] || defaultStyle
                  return <span key={k} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, border: '1px solid ' + c.border }}>{k}</span>
                })}
              </div>
            </div>
          )
        })()}

        {p.limits && (
          <div style={{ ...card, borderColor: S.red + '55' }}>
            <div style={{ ...label, color: S.red }}>Hard limits</div>
            <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{p.limits}</p>
          </div>
        )}

        {(p.health?.prep_status || p.health?.dernier_test || p.prep) && (
          <div style={card}>
            <div style={label}>Santé</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {(p.health?.prep_status || p.prep) === 'Actif' && (
                <span style={{ fontSize: 13, fontWeight: 600, color: S.sage, padding: '4px 12px', borderRadius: 99, background: S.sage + '22', border: '1px solid ' + S.sage + '44' }}>PrEP Actif ✓</span>
              )}
              {p.health?.dernier_test && (
                <span style={{ fontSize: 13, fontWeight: 600, color: S.blue, padding: '4px 12px', borderRadius: 99, background: S.blue + '22', border: '1px solid ' + S.blue + '44' }}>
                  Testé il y a {monthsAgo(p.health.dernier_test)} mois
                </span>
              )}
            </div>
          </div>
        )}

        {p.bio && (
          <div style={card}>
            <div style={label}>Bio</div>
            <p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{p.bio}</p>
          </div>
        )}
      </div>

      {/* Story overlay */}
      {showStory && profile && (
        <ProfileStory profile={{ display_name: profile.display_name, profile_json: p }} onClose={() => setShowStory(false)} />
      )}
    </div>
  )
}
