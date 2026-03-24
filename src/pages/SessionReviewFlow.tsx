import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Star, ArrowRight, SkipForward } from 'lucide-react'
import { colors, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import Confetti from '../components/Confetti'
import IntentSelector from '../components/IntentSelector'
import { useTranslation } from 'react-i18next'

const S = colors

type Participant = { id: string; name: string; avatar?: string; role?: string }
type ReviewData = { rating: number; tags: string[]; intents: string[]; addToBook: boolean }

const VIBE_TAGS = ['fun', 'safe', 'intense', 'chill', 'respectful', 'hot', 'welcoming']

export default function SessionReviewFlow() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<{ title: string } | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Session-level review
  const [sessionRating, setSessionRating] = useState(0)
  const [sessionTags, setSessionTags] = useState<string[]>([])
  const [sessionStep, setSessionStep] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { navigate('/login'); return }
      setUser(u)
      const { data: sess } = await supabase.from('sessions').select('title,status').eq('id', id).maybeSingle()
      if (!sess) { navigate('/'); return }
      setSession(sess)
      const { data: apps } = await supabase.from('applications').select('applicant_id').eq('session_id', id).in('status', ['checked_in', 'accepted'])
      const ids = (apps || []).map(a => a.applicant_id).filter(aid => aid !== u.id)
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
        setParticipants((profiles || []).map((p: any) => ({
          id: p.id, name: p.display_name || t('common.anonymous'),
          avatar: p.profile_json?.avatar_url, role: p.profile_json?.role,
        })))
      }
      setLoading(false)
    }
    load()
  }, [id])

  function getReview(pid: string): ReviewData {
    return reviews[pid] || { rating: 0, tags: [], intents: [], addToBook: true }
  }

  function updateReview(pid: string, patch: Partial<ReviewData>) {
    setReviews(prev => ({ ...prev, [pid]: { ...getReview(pid), ...patch } }))
  }

  async function submitAll() {
    if (!user || !id) return
    setSubmitting(true)

    // Session review
    if (sessionRating > 0) {
      await supabase.from('reviews').upsert({
        session_id: id, reviewer_id: user.id, target_id: null,
        rating: sessionRating, vibe_tags: sessionTags, is_anonymous: true,
      }, { onConflict: 'session_id,reviewer_id,target_id' })
    }

    // Per-participant reviews + intents + contacts
    for (const p of participants) {
      const r = getReview(p.id)
      if (r.rating > 0) {
        await supabase.from('reviews').upsert({
          session_id: id, reviewer_id: user.id, target_id: p.id,
          rating: r.rating, vibe_tags: r.tags, is_anonymous: true,
        }, { onConflict: 'session_id,reviewer_id,target_id' })
      }
      if (r.intents.length > 0) {
        await supabase.from('intents').upsert(
          { user_id: user.id, target_user_id: p.id, session_id: id, intents: r.intents, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,target_user_id' }
        )
      }
      if (r.addToBook && r.rating >= 3) {
        await supabase.from('contacts').upsert(
          { user_id: user.id, contact_user_id: p.id, relation_level: 'connaissance' },
          { onConflict: 'user_id,contact_user_id' }
        )
      }
    }

    // Mark review queue as done
    await supabase.from('review_queue').update({ status: 'done' }).eq('user_id', user.id).eq('session_id', id)

    setDone(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid ' + S.pbd, borderTopColor: S.p, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  // Done screen
  if (done) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <OrbLayer />
      <Confetti />
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", margin: '0 0 8px' }}>{t('review.done_title')}</h2>
      <p style={{ fontSize: 14, color: S.tx2, textAlign: 'center', margin: '0 0 24px' }}>{t('review.done_desc')}</p>
      <button onClick={() => navigate('/')} style={{ padding: '14px 32px', borderRadius: 14, background: S.p, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        {t('common.back_home')}
      </button>
    </div>
  )

  // Session-level rating step
  if (sessionStep) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', padding: '60px 24px 24px' }}>
      <OrbLayer />
      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: S.p }} />
        {participants.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: S.bg2 }} />
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('review.session_review')}</p>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", margin: '0 0 20px' }}>{session?.title}</h2>

      <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 8px' }}>{t('review.how_was_it')}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setSessionRating(n)} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid ' + (sessionRating >= n ? S.pbd : S.rule), background: sessionRating >= n ? S.p2 : S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Star size={20} fill={sessionRating >= n ? S.p : 'none'} style={{ color: sessionRating >= n ? S.p : S.tx4 }} />
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, color: S.tx2, margin: '0 0 8px' }}>{t('review.vibe_tags')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {VIBE_TAGS.map(tag => {
          const on = sessionTags.includes(tag)
          return (
            <button key={tag} onClick={() => setSessionTags(prev => on ? prev.filter(t => t !== tag) : [...prev, tag])} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (on ? S.pbd : S.rule), background: on ? S.p2 : S.bg2, color: on ? S.p : S.tx3 }}>
              {t('review.tag_' + tag)}
            </button>
          )
        })}
      </div>

      <button onClick={() => setSessionStep(false)} disabled={sessionRating === 0} style={{ width: '100%', padding: 14, borderRadius: 14, background: sessionRating > 0 ? S.p : S.bg2, border: 'none', color: sessionRating > 0 ? '#fff' : S.tx4, fontSize: 15, fontWeight: 700, cursor: sessionRating > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {participants.length > 0 ? t('review.next') : t('review.finish')} <ArrowRight size={16} />
      </button>
    </div>
  )

  // No participants → submit directly
  if (participants.length === 0) {
    submitAll()
    return null
  }

  const p = participants[currentIdx]
  const r = getReview(p.id)
  const isLast = currentIdx >= participants.length - 1

  function next() {
    if (isLast) { submitAll() }
    else { setCurrentIdx(prev => prev + 1) }
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', padding: '60px 24px 24px' }}>
      <OrbLayer />

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: S.sage }} />
        {participants.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= currentIdx ? S.p : S.bg2 }} />
        ))}
      </div>

      {/* Participant card */}
      <div style={{ ...glassCard, padding: 20, textAlign: 'center', marginBottom: 16 }}>
        {p.avatar ? (
          <img src={p.avatar} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.rule, margin: '0 auto 12px', display: 'block' }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 12px' }}>{p.name[0]?.toUpperCase()}</div>
        )}
        <h3 style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 4px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{p.name}</h3>
        {p.role && <span style={{ fontSize: 12, color: S.p, fontWeight: 600 }}>{p.role}</span>}
      </div>

      {/* Star rating */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => updateReview(p.id, { rating: n, addToBook: n >= 3 })} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid ' + (r.rating >= n ? S.pbd : S.rule), background: r.rating >= n ? S.p2 : S.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Star size={20} fill={r.rating >= n ? S.p : 'none'} style={{ color: r.rating >= n ? S.p : S.tx4 }} />
          </button>
        ))}
      </div>

      {/* Vibe tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
        {VIBE_TAGS.map(tag => {
          const on = r.tags.includes(tag)
          return (
            <button key={tag} onClick={() => updateReview(p.id, { tags: on ? r.tags.filter(t => t !== tag) : [...r.tags, tag] })} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (on ? S.pbd : S.rule), background: on ? S.p2 : S.bg2, color: on ? S.p : S.tx3 }}>
              {t('review.tag_' + tag)}
            </button>
          )
        })}
      </div>

      {/* Intents (compact) */}
      <div style={{ ...glassCard, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{t('intents.title')}</p>
        <IntentSelector selected={r.intents} onChange={intents => updateReview(p.id, { intents })} compact />
      </div>

      {/* Add to NaughtyBook toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: r.addToBook ? S.sagebg : S.bg2, borderRadius: 12, border: '1px solid ' + (r.addToBook ? S.sagebd : S.rule), marginBottom: 20, cursor: 'pointer' }} onClick={() => updateReview(p.id, { addToBook: !r.addToBook })}>
        <span style={{ fontSize: 13, fontWeight: 600, color: r.addToBook ? S.sage : S.tx3 }}>{t('review.add_to_book')}</span>
        <div style={{ width: 36, height: 20, borderRadius: 10, background: r.addToBook ? S.sage : S.tx4, position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: r.addToBook ? 18 : 2, transition: 'left 0.2s' }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={next} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <SkipForward size={14} /> {t('review.skip')}
        </button>
        <button onClick={next} disabled={submitting} style={{ flex: 1, padding: 14, borderRadius: 14, background: S.p, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? '...' : isLast ? t('review.finish') : t('review.next')} {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
