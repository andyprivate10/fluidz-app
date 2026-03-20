import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import {Star, Send, ArrowLeft} from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { useTranslation } from 'react-i18next'

const S = colors

const VIBE_TAGS = [
  { id: 'fun', label: 'Fun', color: S.sage },
  { id: 'safe', label: 'Safe', color: S.blue },
  { id: 'intense', label: 'Intense', color: S.p },
  { id: 'chill', label: 'Chill', color: S.p },
  { id: 'respectful', label: 'Respectueux', color: S.sage },
  { id: 'awkward', label: 'Awkward', color: S.red },
  { id: 'hot', label: 'Hot', color: S.p },
  { id: 'welcoming', label: 'Accueillant', color: S.blue },
]

type Participant = { applicant_id: string; display_name: string; avatar_url?: string; role?: string }

export default function ReviewPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<{ title: string } | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  // Session review
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Peer reviews
  const [peerRatings, setPeerRatings] = useState<Record<string, number>>({})
  const [peerTags, setPeerTags] = useState<Record<string, string[]>>({})
  const [peerReviewedIds, setPeerReviewedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { navigate('/login'); return }
      setUser(u)

      const { data: sess } = await supabase.from('sessions').select('title,status').eq('id', id).maybeSingle()
      if (!sess) { navigate('/'); return }
      setSession(sess)

      // Check if already reviewed
      const { data: existing } = await supabase.from('reviews')
        .select('id').eq('session_id', id).eq('reviewer_id', u.id).is('target_id', null).maybeSingle()
      if (existing) { setAlreadyReviewed(true) }

      // Get participants (exclude self)
      const { data: apps } = await supabase.from('applications')
        .select('applicant_id').eq('session_id', id).in('status', ['checked_in', 'accepted'])
      const ids = (apps || []).map(a => a.applicant_id).filter(aid => aid !== u.id)
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, profile_json').in('id', ids)
        setParticipants((profiles || []).map((p: any) => ({
          applicant_id: p.id,
          display_name: p.display_name || 'Anonyme',
          avatar_url: p.profile_json?.avatar_url,
          role: p.profile_json?.role,
        })))
      }

      // Check existing peer reviews
      const { data: existingPeer } = await supabase.from('reviews')
        .select('target_id').eq('session_id', id).eq('reviewer_id', u.id).not('target_id', 'is', null)
      if (existingPeer) setPeerReviewedIds(new Set(existingPeer.map((r: any) => r.target_id)))

      setLoading(false)
    }
    load()
  }, [id])

  async function submitReview() {
    if (!user || !id || rating === 0) { showToast('Donne au moins une note', 'error'); return }
    setSubmitting(true)

    const { error } = await supabase.from('reviews').insert({
      session_id: id,
      reviewer_id: user.id,
      target_id: null, // session review
      rating,
      vibe_tags: selectedTags,
      comment: comment.trim() || null,
      is_anonymous: true,
    })

    if (error) {
      if (error.code === '23505') showToast('Tu as déjà laissé un avis', 'error')
      else showToast('Erreur: ' + error.message, 'error')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
    showToast('Merci pour ton avis !', 'success')
  }

  async function submitPeerReview(targetId: string) {
    const r = peerRatings[targetId]
    if (!r || !user || !id) return
    const { error } = await supabase.from('reviews').insert({
      session_id: id, reviewer_id: user.id, target_id: targetId,
      rating: r, vibe_tags: peerTags[targetId] || [], is_anonymous: true,
    })
    if (error) {
      if (error.code === '23505') showToast('Déjà noté', 'error')
      else showToast('Erreur', 'error')
      return
    }
    setPeerReviewedIds(prev => new Set([...prev, targetId]))
    showToast('Avis envoye', 'success')
  }

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: "3px solid "+S.pbd, borderTopColor: S.p, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  )

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      <OrbLayer />
      <EventContextNav role='member' />
      <div style={{ padding: '40px 20px 20px' }}>
        <button onClick={() => navigate('/session/' + id)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('review.back_session')}</button>

        <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: '0 0 4px' }}>{t('review.title')}</h1>
        <p style={{ color: S.tx3, fontSize: 13, margin: 0 }}>{session?.title || 'Session'}</p>
      </div>

      {alreadyReviewed && !submitted ? (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: S.bg1, borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid ' + S.sagebd }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: S.sage, margin: 0 }}>{t('review.already')}</p>
            <p style={{ fontSize: 13, color: S.tx3, margin: '8px 0 0' }}>{t('review.already_desc')}</p>
          </div>
        </div>
      ) : submitted ? (
        <div style={{ padding: '0 20px' }}>
          <div className="animate-slide-up" style={{ background: S.bg1, borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid ' + S.sagebd }}>
            
            <p style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: '0 0 8px' }}>{t('review.thanks')}</p>
            <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 16px' }}>{t('review.thanks_desc')}</p>
            <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: 12, background: S.grad, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {t('review.back_home')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Star rating */}
          <div style={{ background: S.bg1, borderRadius: 16, padding: 20, border: '1px solid ' + S.rule }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 12px' }}>{t('review.overall')}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  transform: rating >= n ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.2s',
                }}>
                  <Star size={36} fill={rating >= n ? S.p : 'none'} stroke={rating >= n ? S.p : S.tx4} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: S.orange, marginTop: 8 }}>
                {rating === 1 ? t('review.rating_1') : rating === 2 ? t('review.rating_2') : rating === 3 ? t('review.rating_3') : rating === 4 ? t('review.rating_4') : t('review.rating_5')}
              </p>
            )}
          </div>

          {/* Vibe tags */}
          <div style={{ background: S.bg1, borderRadius: 16, padding: 20, border: '1px solid ' + S.rule }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 12px' }}>{t('review.vibes')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VIBE_TAGS.map(tag => {
                const on = selectedTags.includes(tag.id)
                return (
                  <button key={tag.id} onClick={() => setSelectedTags(prev => on ? prev.filter(t => t !== tag.id) : [...prev, tag.id])} style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: on ? 'none' : '1px solid ' + S.rule,
                    background: on ? tag.color + '22' : S.bg2,
                    color: on ? tag.color : S.tx3,
                  }}>{tag.label}</button>
                )
              })}
            </div>
          </div>

          {/* Comment */}
          <div style={{ background: S.bg1, borderRadius: 16, padding: 20, border: '1px solid ' + S.rule }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 12px' }}>{t('review.comment')}</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('review.comment_placeholder')}
              maxLength={500}
              rows={3}
              style={{ width: '100%', padding: 12, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 12, color: S.tx, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          {/* Submit */}
          <button onClick={submitReview} disabled={submitting || rating === 0} style={{
            width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15,
            color: '#fff', background: rating > 0 ? S.grad : S.bg3, border: 'none',
            cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
            opacity: submitting || rating === 0 ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: rating > 0 ? '0 4px 20px ' + S.pbd : 'none',
          }}>
            <Send size={16} />
            {submitting ? t('review.submitting') : t('review.submit')}
          </button>

          <p style={{ fontSize: 11, color: S.tx4, textAlign: 'center' }}>
            {t('review.anonymous_note')}
          </p>

          {/* Peer reviews */}
          {participants.length > 0 && (
            <>
              <div style={{ height: 1, background: S.rule, margin: '8px 0' }} />
              <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, margin: '0 0 4px' }}>{t('review.rate_participants')}</p>
              <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 12px' }}>{t('review.optional_anon')}</p>

              {participants.map(p => {
                const reviewed = peerReviewedIds.has(p.applicant_id)
                const pr = peerRatings[p.applicant_id] || 0
                const pt = peerTags[p.applicant_id] || []
                return (
                  <div key={p.applicant_id} style={{ background: S.bg1, borderRadius: 16, padding: 16, border: '1px solid ' + S.rule, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + S.rule }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: S.tx3 }}>
                          {p.display_name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{p.display_name}</p>
                        {p.role && <span style={{ fontSize: 11, color: S.p }}>{p.role}</span>}
                      </div>
                      {reviewed && <span style={{ marginLeft: 'auto', fontSize: 11, color: S.sage, fontWeight: 600 }}>{t('review.review_sent')}</span>}
                    </div>

                    {reviewed ? null : (
                      <>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} onClick={() => setPeerRatings(prev => ({ ...prev, [p.applicant_id]: n }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              <Star size={24} fill={pr >= n ? S.p : 'none'} stroke={pr >= n ? S.p : S.tx4} strokeWidth={1.5} />
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {VIBE_TAGS.slice(0, 5).map(tag => {
                            const on = pt.includes(tag.id)
                            return (
                              <button key={tag.id} onClick={() => setPeerTags(prev => ({ ...prev, [p.applicant_id]: on ? pt.filter(t => t !== tag.id) : [...pt, tag.id] }))} style={{
                                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                border: on ? 'none' : '1px solid ' + S.rule, background: on ? tag.color + '22' : S.bg2, color: on ? tag.color : S.tx3,
                              }}>{tag.label}</button>
                            )
                          })}
                        </div>
                        {pr > 0 && (
                          <button onClick={() => submitPeerReview(p.applicant_id)} style={{
                            width: '100%', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: S.grad, color: '#fff', border: 'none', cursor: 'pointer',
                          }}>Envoyer</button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
