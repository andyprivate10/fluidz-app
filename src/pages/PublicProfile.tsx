import LazyImage from '../components/LazyImage'
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import AddContactButton from '../components/AddContactButton'
import ProfileStory from '../components/ProfileStory'
import { VibeScoreBadge, VibeScoreCard } from '../components/VibeScoreBadge'
import { colors, glassCard } from '../brand'
import { showToast } from '../components/Toast'
import OrbLayer from '../components/OrbLayer'
import { MessageCircle, ArrowLeft, Play, Heart, MapPin, Shield, Share2, Ban, Flag, BookOpen, Clock } from 'lucide-react'
import DmRequestSheet from '../components/DmRequestSheet'
import type { DmPrivacyLevel } from '../lib/dmPrivacy'
import ShareToContact from '../components/ShareToContact'
import LinkedProfiles from '../components/LinkedProfiles'
import PlatformProfiles from '../components/profile/LinkedProfiles'
import { monthsAgoCount } from '../lib/timing'
import ImageLightbox from '../components/ImageLightbox'
import ProfileBadges from '../components/ProfileBadges'
import { TRIBES } from '../lib/tribeTypes'

const S = colors
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
    const name = (myProfile as any)?.display_name || user.email || t('common.someone')
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


/* ═══ MAIN ═══ */
export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showStory, setShowStory] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [myProfile, setMyProfile] = useState<Record<string,unknown> | null>(null)
  const [allowed, setAllowed] = useState<boolean>(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [isInNaughtyBook, setIsInNaughtyBook] = useState(false)
  const [dmStatus, setDmStatus] = useState<'direct' | 'need_request' | 'pending' | 'blocked'>('direct')
  const [peerPrivacy, setPeerPrivacy] = useState<DmPrivacyLevel>('open')
  const [showDmRequest, setShowDmRequest] = useState(false)
  const { confirm, dialogProps } = useConfirmDialog()

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
      setMyUserId(user.id)
      if (user.id !== userId) {
        supabase.from('interaction_log').insert({ user_id: user.id, target_user_id: userId, type: 'profile_view' as any, meta: {} }).then(() => {})
        supabase.from('favorites').select('id').eq('user_id', user.id).eq('target_user_id', userId).maybeSingle().then(({ data }) => setIsFavorite(!!data))
        // Check NaughtyBook contact
        supabase.from('contacts').select('id').eq('user_id', user.id).eq('contact_user_id', userId).maybeSingle().then(({ data }) => setIsInNaughtyBook(!!data))
        // Check DM privacy for this peer
        const peerPj = (prof?.profile_json || {}) as Record<string, unknown>
        const privacy = (peerPj.dm_privacy as DmPrivacyLevel) || 'open'
        setPeerPrivacy(privacy)
        if (privacy === 'open') {
          setDmStatus('direct')
        } else {
          // Check if already in contacts (bypass privacy)
          supabase.from('contacts').select('id').eq('user_id', user.id).eq('contact_user_id', userId).maybeSingle().then(async ({ data: isContact }) => {
            if (isContact) { setDmStatus('direct'); return }
            // Check for existing DM request
            const { data: req } = await supabase.from('dm_requests').select('status').eq('sender_id', user.id).eq('receiver_id', userId).maybeSingle()
            if (!req) { setDmStatus('need_request'); return }
            if (req.status === 'pending') { setDmStatus('pending'); return }
            if (req.status === 'accepted') { setDmStatus('direct'); return }
            setDmStatus('need_request')
          })
        }
      }
    }
    run()
    return () => { c = true }
  }, [userId])

  if (loading) return (<div style={{ minHeight: '100vh', background: S.bg, maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}><OrbLayer /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ width: 80, height: 80, borderRadius: '50%', background: S.bg2, margin: '0 auto 16px', animation: 'pulse 1.5s ease-in-out infinite' }} /><div style={{ width: '50%', height: 22, borderRadius: 8, background: S.bg2, margin: '0 auto 10px', animation: 'pulse 1.5s ease-in-out infinite' }} /><div style={{ width: '30%', height: 14, borderRadius: 8, background: S.bg2, margin: '0 auto 24px', animation: 'pulse 1.5s ease-in-out infinite' }} />{[1,2,3].map(i => <div key={i} style={{ ...glassCard, marginBottom: 12, height: 80, animation: 'pulse 1.5s ease-in-out infinite' }} />)}</div></div>)
  if (!allowed) return (<div style={{ minHeight: '100vh', background: S.bg, padding: 24, maxWidth: 480, margin: '0 auto' }}><button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />{t('common.back_label')}</button><p style={{ color: S.tx2, marginTop: 24, textAlign: 'center' }}>{t('profile.members_only')}</p></div>)
  if (!profile) return (<div style={{ minHeight: '100vh', background: S.bg, padding: 24, maxWidth: 480, margin: '0 auto' }}><button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0 }}><ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />{t('common.back_label')}</button><p style={{ color: S.red, marginTop: 16 }}>{t('profile.not_found')}</p></div>)

  const p = profile.profile_json || {}
  const kinkNorm: Record<string, string> = { 'SM leger': 'SM léger', 'Fetichisme': 'Fétichisme', 'Jeux de role': 'Jeux de rôle' }
  const kinks: string[] = Array.from(new Set((p.kinks || []).map((k: string) => kinkNorm[k] || k))) as string[]
  const allPhotos: string[] = [...(Array.isArray(p.photos_profil) ? p.photos_profil : []), ...(Array.isArray(p.photos_intime) ? p.photos_intime : []), ...(Array.isArray(p.photos) ? p.photos : []), ...(!Array.isArray(p.photos_profil) && !Array.isArray(p.photos) && p.avatar_url ? [p.avatar_url] : [])].filter((v, i, a) => a.indexOf(v) === i)
  const allVideos: string[] = [...(Array.isArray(p.videos_intime) ? p.videos_intime : []), ...(Array.isArray(p.videos) ? p.videos : [])]
  const hasPhotos = allPhotos.length > 0
  const displayName = profile.display_name || t('common.anonymous')

  let onlineLabel = ''; let isOnline = false
  if (profile.location_updated_at) {
    const mins = Math.floor((Date.now() - new Date(profile.location_updated_at).getTime()) / 60000)
    isOnline = mins < 30
    onlineLabel = isOnline ? t('common.online') : mins < 60 ? mins + 'min' : mins < 1440 ? Math.floor(mins / 60) + 'h' : Math.floor(mins / 1440) + 'j'
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
            {photoIdx > 0 && <div onClick={() => navPhoto(-1)} style={{ position: 'absolute', left: 0, top: 0, width: '25%', height: '100%', zIndex: 2, cursor: 'pointer' }} />}
            <div onClick={() => setLightbox({ images: allPhotos, index: photoIdx })} style={{ position: 'absolute', left: '25%', top: 0, width: '50%', height: '100%', zIndex: 2, cursor: 'zoom-in' }} />
            {photoIdx < allPhotos.length - 1 && <div onClick={() => navPhoto(1)} style={{ position: 'absolute', right: 0, top: 0, width: '25%', height: '100%', zIndex: 2, cursor: 'pointer' }} />}
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
        {p.orientation && <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.lav, background: S.lavbg || 'rgba(184,178,204,0.12)', border: '1px solid ' + (S.lavbd || 'rgba(184,178,204,0.25)') }}>{p.orientation}</span>}
        {Array.isArray(p.tribes) && p.tribes.length > 0 && p.tribes.map((slug: string) => {
          const tr = TRIBES.find(t => t.slug === slug)
          const color = tr?.color || S.tx2
          return <span key={slug} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color, background: color + '18', border: '1px solid ' + color + '44' }}>{t('tribes.' + slug)}</span>
        })}
        {Array.isArray(p.ethnicities) && p.ethnicities.length > 0 && (
          p.ethnicities.length >= 2
            ? <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.lav, background: S.lavbg, border: '1px solid ' + S.lavbd }}>{t('ethnicities.mixed_label')}</span>
            : <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.tx2, background: S.bg2, border: '1px solid ' + S.rule }}>{t('ethnicities.' + p.ethnicities[0])}</span>
        )}
        <ProfileBadges createdAt={profile?.created_at} lastSeen={(p as any).last_seen} prepStatus={p.health?.prep_status || p.prep} />
        {p.morphology && <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: S.tx2, background: S.bg2, border: '1px solid ' + S.rule }}>{p.morphology}</span>}
        {p.home_country && p.home_city && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.lav, background: S.lavbg, border: '1px solid ' + S.lavbd, display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={10} strokeWidth={1.5} />{p.home_city}, {p.home_country}</span>}
        {onlineLabel && !isOnline && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.tx3, background: S.bg2 }}>{onlineLabel}</span>}
        {(p.health?.prep_status || p.prep) === 'Actif' && <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}><Shield size={10} strokeWidth={2} style={{display:'inline',marginRight:2}} />PrEP</span>}
      </div>
      {Array.isArray(p.linked_profiles) && p.linked_profiles.length > 0 && (
        <div style={{ padding: '4px 20px 0' }}>
          <LinkedProfiles userId={userId!} linkedProfiles={p.linked_profiles} onChange={() => {}} readOnly />
        </div>
      )}

      {/* Languages */}
      {Array.isArray(p.languages) && p.languages.length > 0 && (
        <div style={{ padding: '8px 20px 0', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {p.languages.map((lang: string) => (
            <span key={lang} style={{ fontSize: 10, fontWeight: 600, color: S.tx3, padding: '3px 8px', borderRadius: 99, background: S.bg2, border: '1px solid ' + S.rule }}>{lang}</span>
          ))}
        </div>
      )}

      {/* Platform profiles */}
      {Array.isArray(p.platform_profiles) && p.platform_profiles.length > 0 && (
        <div style={{ padding: '4px 20px 0' }}>
          <PlatformProfiles userId={userId!} linkedProfiles={p.platform_profiles} onChange={() => {}} readOnly />
        </div>
      )}

      {/* ═══ ACTIONS ═══ */}
      <div style={{ padding: '16px 20px 0' }}>
        {/* NaughtyBook badge */}
        {isInNaughtyBook && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, marginBottom: 10 }}>
            <BookOpen size={12} strokeWidth={1.5} style={{ color: S.sage }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: S.sage }}>{t('profile.in_naughtybook_badge')}</span>
          </div>
        )}

        <ContactRequestButton targetUserId={userId!} myProfile={myProfile} />

        {/* DM + Story + Favorite row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {/* Smart DM button */}
          {dmStatus === 'direct' || isInNaughtyBook ? (
            <button onClick={() => navigate('/dm/' + userId)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <MessageCircle size={13} strokeWidth={1.5} /> {t('profile.dm_direct')}
            </button>
          ) : dmStatus === 'pending' ? (
            <button disabled style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg2, border: '1px solid ' + S.rule, color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: 0.6 }}>
              <Clock size={13} strokeWidth={1.5} /> {t('profile.dm_pending')}
            </button>
          ) : (
            <button onClick={() => setShowDmRequest(true)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.lavbd, color: S.lav, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <MessageCircle size={13} strokeWidth={1.5} /> {t('profile.dm_request')}
            </button>
          )}
          <button onClick={() => setShowStory(true)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: S.bg1, border: '1px solid ' + S.rule, color: S.tx2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Play size={12} strokeWidth={2} fill={S.tx2} /> Story
          </button>
        </div>

        {/* Favorite + NaughtyBook row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}><AddContactButton targetUserId={userId!} /></div>
          {myUserId && myUserId !== userId && (
            <button onClick={async () => {
              if (!myUserId) return
              if (isFavorite) {
                await supabase.from('favorites').delete().eq('user_id', myUserId).eq('target_user_id', userId)
                setIsFavorite(false)
              } else {
                await supabase.from('favorites').upsert({ user_id: myUserId, target_user_id: userId }, { onConflict: 'user_id,target_user_id' })
                setIsFavorite(true)
              }
            }} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid ' + (isFavorite ? S.pbd : S.rule), background: isFavorite ? S.p2 : 'transparent', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
              <Heart size={16} strokeWidth={1.5} fill={isFavorite ? S.p : 'none'} style={{ color: isFavorite ? S.p : S.tx3 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: isFavorite ? S.p : S.tx3 }}>{isFavorite ? t('profile.unfavorite') : t('profile.favorite')}</span>
            </button>
          )}
        </div>

        <button onClick={() => setShowShareSheet(true)} style={{ marginTop: 8, width: '100%', padding: 10, borderRadius: 12, border: '1px solid ' + (S.lavbd || 'rgba(184,178,204,0.25)'), background: 'transparent', color: S.lav, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Share2 size={13} strokeWidth={1.5} /> {t('share.recommend_profile')}
        </button>
      </div>

      {/* ═══ CARDS ═══ */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ marginBottom: 12 }}><VibeScoreCard userId={userId!} /></div>

        {p.bio && <div style={{ ...glassCard, marginBottom: 12 }}><div style={sLabel(S.p)}>{t('profile.section_bio')}</div><p style={{ fontSize: 14, color: S.tx, lineHeight: 1.7, margin: 0 }}>{p.bio}</p></div>}

        {(p.height || p.weight) && (
          <div style={{ ...glassCard, marginBottom: 12 }}>
            <div style={sLabel(S.lav)}>{t('profile.section_physique')}</div>
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
            <div style={{ ...glassCard, marginBottom: 12 }}>
              <div style={sLabel(S.p)}>{t('profile.section_zones')}</div>
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
                            <img key={i} src={url as string} alt="" loading="lazy" onClick={() => setLightbox({ images: urls.map(String), index: i })} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }} />
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

        {kinks.length > 0 && <div style={{ ...glassCard, marginBottom: 12 }}><div style={sLabel(S.p)}>{t('profile.pratiques_count', { count: kinks.length })}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{kinks.map((k: string) => { const c = kinkMap[k] || defK; return <span key={k} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, border: '1px solid ' + c.border }}>{k}</span> })}</div></div>}

        {(p.health?.prep_status || p.health?.dernier_test || p.prep) && (
          <div style={{ ...glassCard, marginBottom: 12 }}><div style={sLabel(S.sage)}>{t('profile.section_sante')}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(p.health?.prep_status || p.prep) === 'Actif' && <span style={{ fontSize: 13, fontWeight: 600, color: S.sage, padding: '5px 14px', borderRadius: 99, background: S.sagebg, border: '1px solid ' + S.sagebd, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={2} />{t('profile.prep_active_badge')}</span>}
            {p.health?.dernier_test && <span style={{ fontSize: 13, fontWeight: 600, color: S.blue, padding: '5px 14px', borderRadius: 99, background: S.bluebg, border: '1px solid ' + S.bluebd }}>Testé il y a {monthsAgoCount(p.health.dernier_test)} mois</span>}
          </div></div>
        )}

        {p.limits && <div style={{ ...glassCard, borderColor: S.redbd }}><div style={sLabel(S.red)}>{t('profile.section_limits')}</div><p style={{ fontSize: 14, color: S.tx2, lineHeight: 1.6, margin: 0 }}>{p.limits}</p></div>}

        {allVideos.length > 0 && <div style={{ ...glassCard, marginBottom: 12 }}><div style={sLabel(S.lav)}>{t('profile.videos_label')} · {allVideos.length}</div><div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>{allVideos.map((url: string, i: number) => <div key={i} style={{ flexShrink: 0 }}><video src={url} controls style={{ width: 140, height: 180, borderRadius: 14, objectFit: 'cover', border: '1px solid ' + S.rule }} /></div>)}</div></div>}

        {/* Block / Report */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingBottom: 20 }}>
          <button onClick={async () => {
            if (!await confirm({ title: t('profile.block_confirm'), danger: true })) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await supabase.from('contacts').upsert({ owner_id: user.id, contact_user_id: userId, relation_level: 'blocked' }, { onConflict: 'owner_id,contact_user_id' })
            showToast(t('profile.blocked_toast'), 'success')
            navigate(-1)
          }} style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid ' + S.redbd, background: 'transparent', color: S.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Ban size={13} strokeWidth={1.5} /> {t('profile.block_user')}
          </button>
          <button onClick={async () => {
            if (!await confirm({ title: t('profile.report_confirm') })) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await supabase.from('notifications').insert({ user_id: user.id, type: 'report', title: 'Report: ' + displayName, body: 'User ' + userId + ' reported', href: '/profile/' + userId })
            showToast(t('profile.reported_toast'), 'info')
          }} style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Flag size={13} strokeWidth={1.5} /> {t('profile.report_user')}
          </button>
        </div>
      </div>

      {showStory && profile && <ProfileStory profile={{ display_name: displayName, profile_json: p }} onClose={() => setShowStory(false)} />}
      <ShareToContact
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shareType="profile"
        shareId={userId || ''}
        shareTitle={displayName}
      />
      {lightbox && <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      <ConfirmDialog {...dialogProps} />
      {userId && myUserId && myUserId !== userId && (
        <DmRequestSheet
          open={showDmRequest}
          onClose={() => setShowDmRequest(false)}
          targetUserId={userId}
          targetName={displayName}
          targetAvatar={allPhotos[0]}
          privacyLevel={peerPrivacy}
          onSent={() => { setDmStatus('pending'); setShowDmRequest(false) }}
        />
      )}
    </div>
  )
}
