import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import ReviewQuestion from '../components/review/ReviewQuestion'
import ReviewIntents from '../components/review/ReviewIntents'
import ReviewVibeScore from '../components/review/ReviewVibeScore'
import ReviewSummary from '../components/review/ReviewSummary'
import { useTranslation } from 'react-i18next'

const S = colors

type Participant = { id: string; name: string; avatar?: string }
type ReviewData = {
  rating: number
  tags: string[]
  intents: string[]
  addToBook: boolean
  interested: boolean
}

// Steps for each participant
type ParticipantStep = 'question' | 'intents' | 'vibe'

export default function SessionReviewFlow() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  const [user, setUser] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [step, setStep] = useState<ParticipantStep>('question')
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasHosted, setHasHosted] = useState(false)

  useEffect(() => {
    async function load() {
      if (!authUser) { navigate('/login'); return }
      const u = authUser
      setUser(u)

      const { data: sess } = await supabase
        .from('sessions').select('title,status').eq('id', id).maybeSingle()
      if (!sess) { navigate('/'); return }

      // Check if user has ever hosted a session (for co_host question)
      const { count } = await supabase
        .from('sessions').select('id', { count: 'exact', head: true })
        .eq('host_id', u.id)
      setHasHosted((count ?? 0) > 0)

      // Get participants (excluding self)
      const { data: apps } = await supabase
        .from('applications').select('applicant_id')
        .eq('session_id', id).in('status', ['checked_in', 'accepted'])
      const ids = (apps || []).map(a => a.applicant_id).filter(aid => aid !== u.id)

      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles').select('id, display_name, profile_json').in('id', ids)
        setParticipants((profiles || []).map((p: any) => ({
          id: p.id,
          name: p.display_name || t('common.anonymous'),
          avatar: p.profile_json?.avatar_url,
        })))
      }
      setLoading(false)
    }
    load()
  }, [id, navigate, t])

  const getReview = useCallback((pid: string): ReviewData => {
    return reviews[pid] || { rating: 0, tags: [], intents: [], addToBook: false, interested: false }
  }, [reviews])

  function updateReview(pid: string, patch: Partial<ReviewData>) {
    setReviews(prev => ({ ...prev, [pid]: { ...getReview(pid), ...patch } }))
  }

  function goToNextPerson() {
    if (currentIdx < participants.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setStep('question')
    } else {
      submitAll()
    }
  }

  async function submitAll() {
    if (!user || !id) return
    setSubmitting(true)

    for (const p of participants) {
      const r = getReview(p.id)

      // Save review (rating + vibe_tags)
      if (r.rating > 0) {
        await supabase.from('reviews').upsert({
          session_id: id, reviewer_id: user.id, target_id: p.id,
          rating: r.rating, vibe_tags: r.tags, is_anonymous: true,
        }, { onConflict: 'session_id,reviewer_id,target_id' })
      }

      // Save intents
      const allIntents = r.interested ? r.intents : ['not_interested']
      if (allIntents.length > 0) {
        await supabase.from('intents').upsert(
          { user_id: user.id, target_user_id: p.id, session_id: id, intents: allIntents, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,target_user_id' }
        )
      }

      // Add to contacts if addToBook
      if (r.addToBook) {
        await supabase.from('contacts').upsert(
          { user_id: user.id, contact_user_id: p.id, relation_level: 'connaissance' },
          { onConflict: 'user_id,contact_user_id' }
        )
      }
    }

    // Mark review queue as done
    await supabase.from('review_queue').update({ status: 'done' })
      .eq('user_id', user.id).eq('session_id', id)

    setSubmitting(false)
    setDone(true)
  }

  // --- Loading ---
  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '3px solid ' + S.pbd, borderTopColor: S.p,
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  // --- Summary screen ---
  if (done) {
    const reviewedCount = participants.filter(p => getReview(p.id).rating > 0).length
    const addedCount = participants.filter(p => getReview(p.id).addToBook).length
    return (
      <ReviewSummary
        reviewedCount={reviewedCount}
        addedToBookCount={addedCount}
        onFinish={() => navigate('/')}
      />
    )
  }

  // --- Submitting ---
  if (submitting) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '3px solid ' + S.pbd, borderTopColor: S.p,
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  // --- No participants ---
  if (participants.length === 0) {
    return (
      <ReviewSummary
        reviewedCount={0}
        addedToBookCount={0}
        onFinish={() => navigate('/')}
      />
    )
  }

  const p = participants[currentIdx]
  const isLast = currentIdx >= participants.length - 1
  const progressTotal = participants.length
  const progressCurrent = currentIdx

  // --- Q1: Would you recross? ---
  if (step === 'question') {
    return (
      <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />
        <ReviewQuestion
          name={p.name}
          avatar={p.avatar}
          question={t('review.would_you_recross', { name: p.name })}
          yesLabel={t('review.yes_interested')}
          noLabel={t('review.no_not_really')}
          onYes={() => {
            updateReview(p.id, { interested: true, addToBook: true })
            setStep('intents')
          }}
          onNo={() => {
            updateReview(p.id, { interested: false, addToBook: false })
            setStep('vibe')
          }}
          onSkip={goToNextPerson}
          progress={{ current: progressCurrent, total: progressTotal }}
        />
      </div>
    )
  }

  // --- Intent questions (only if interested) ---
  if (step === 'intents') {
    return (
      <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />
        <ReviewIntents
          key={p.id}
          name={p.name}
          avatar={p.avatar}
          showCoHost={hasHosted}
          onComplete={(intents) => {
            updateReview(p.id, { intents })
            setStep('vibe')
          }}
          onSkip={() => setStep('vibe')}
          progress={{ current: progressCurrent, total: progressTotal }}
        />
      </div>
    )
  }

  // --- Vibe score ---
  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <OrbLayer />
      <ReviewVibeScore
        key={p.id + '-vibe'}
        name={p.name}
        avatar={p.avatar}
        defaultAddToBook={getReview(p.id).interested}
        onComplete={(data) => {
          updateReview(p.id, { rating: data.rating, tags: data.tags, addToBook: data.addToBook })
          goToNextPerson()
        }}
        onSkip={goToNextPerson}
        isLast={isLast}
        progress={{ current: progressCurrent, total: progressTotal }}
      />
    </div>
  )
}
