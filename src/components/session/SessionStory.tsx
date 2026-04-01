import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { X, Camera } from 'lucide-react'
import { stripHtml } from '../../lib/sanitize'

const S = colors
const SLIDE_DURATION = 5000 // ms per slide

type Member = {
  id: string
  name: string
  role: string
  age: string
  photos: string[]
}

interface Props {
  sessionId: string
}

export default function SessionStory({ sessionId }: Props) {
  const { t } = useTranslation()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  // Flat index into all slides across all members
  const [globalIdx, setGlobalIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0Ref = useRef(Date.now())
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const membersRef = useRef<Member[]>([])
  const globalIdxRef = useRef(0)

  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { globalIdxRef.current = globalIdx }, [globalIdx])

  // ─── Build flat slides list ──────────────────────────
  const slides = members.flatMap((m, mi) => m.photos.map((photo, si) => ({ mi, si, photo, member: m })))

  // ─── Data Loading ────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: apps } = await supabase
        .from('applications')
        .select('applicant_id, eps_json')
        .eq('session_id', sessionId)
        .in('status', ['accepted', 'checked_in'])

      if (!apps || apps.length === 0) { setMembers([]); setLoading(false); return }

      const ids = apps.map(a => a.applicant_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_json')
        .in('id', ids)
      const profileMap = new Map((profiles || []).map(p => [p.id, p]))

      const result: Member[] = []
      for (const app of apps) {
        const eps = app.eps_json as Record<string, unknown> | null
        if (!eps) continue
        const snapshot = (eps.profile_snapshot || {}) as Record<string, unknown>
        const sections = (eps.shared_sections || []) as string[]
        const prof = profileMap.get(app.applicant_id)
        const pj = (prof?.profile_json || {}) as Record<string, unknown>
        const name = prof?.display_name || '?'

        const photos: string[] = []
        if (sections.includes('photos_profil')) {
          const p = (snapshot.photos_profil || snapshot.photos || []) as string[]
          photos.push(...p)
        }
        if (sections.includes('photos_adulte')) {
          const a = (snapshot.photos_intime || []) as string[]
          photos.push(...a)
        }

        if (photos.length > 0) {
          result.push({
            id: app.applicant_id,
            name: stripHtml(String(name)),
            role: String(pj.role || snapshot.role || ''),
            age: String(pj.age || snapshot.age || ''),
            photos,
          })
        }
      }

      setMembers(result)
      setLoading(false)
    }
    load()
  }, [sessionId])

  // ─── Timer ───────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const goNext = useCallback(() => {
    const total = membersRef.current.flatMap(m => m.photos).length
    const next = globalIdxRef.current + 1
    if (next >= total) {
      clearTimer()
      setVisible(false)
      return
    }
    setGlobalIdx(next)
    setFadeKey(k => k + 1)
    setProgress(0)
    t0Ref.current = Date.now()
  }, [clearTimer])

  const startTimer = useCallback(() => {
    clearTimer()
    t0Ref.current = Date.now()
    setProgress(0)
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - t0Ref.current) / SLIDE_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) { clearTimer(); goNext() }
    }, 50)
  }, [clearTimer, goNext])

  useEffect(() => () => clearTimer(), [clearTimer])

  // Restart timer when slide or visibility changes
  useEffect(() => {
    if (visible) startTimer()
    else clearTimer()
  }, [visible, globalIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Open / Close ────────────────────────────────────
  const open = useCallback((startMi: number) => {
    const mems = membersRef.current
    const startGlobal = mems.slice(0, startMi).reduce((acc, m) => acc + m.photos.length, 0)
    setGlobalIdx(startGlobal)
    setFadeKey(k => k + 1)
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    clearTimer()
    setVisible(false)
  }, [clearTimer])

  // ─── Navigation ──────────────────────────────────────
  const goPrev = useCallback(() => {
    const prev = globalIdxRef.current - 1
    if (prev < 0) return
    setGlobalIdx(prev)
    setFadeKey(k => k + 1)
    setProgress(0)
    t0Ref.current = Date.now()
  }, [])

  // ─── Touch / Swipe ───────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeRef.current) return
    const dx = e.changedTouches[0].clientX - swipeRef.current.x
    const dy = e.changedTouches[0].clientY - swipeRef.current.y
    swipeRef.current = null

    // Horizontal swipe between members
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      const mems = membersRef.current
      const curSlide = slides[globalIdxRef.current]
      if (!curSlide) return
      if (dx < 0 && curSlide.mi < mems.length - 1) {
        // Swipe left → jump to next member's first slide
        const nextMi = curSlide.mi + 1
        const nextGlobal = mems.slice(0, nextMi).reduce((acc, m) => acc + m.photos.length, 0)
        setGlobalIdx(nextGlobal)
        setFadeKey(k => k + 1)
        setProgress(0)
        t0Ref.current = Date.now()
      } else if (dx > 0 && curSlide.mi > 0) {
        // Swipe right → jump to prev member's first slide
        const prevMi = curSlide.mi - 1
        const prevGlobal = mems.slice(0, prevMi).reduce((acc, m) => acc + m.photos.length, 0)
        setGlobalIdx(prevGlobal)
        setFadeKey(k => k + 1)
        setProgress(0)
        t0Ref.current = Date.now()
      }
    }
  }, [slides])

  // ─── Loading / Empty ─────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 20, display: 'flex', gap: 12, overflowX: 'auto' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: 72, height: 72, borderRadius: '50%', background: S.bg2, flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Camera size={40} strokeWidth={1} style={{ color: S.tx4, marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: S.tx3, margin: 0 }}>{t('session.story_empty')}</p>
      </div>
    )
  }

  const curSlide = slides[globalIdx] || null
  const curMember = curSlide?.member || null

  // Build per-member segments for the progress bar
  let runningIdx = 0
  const memberSegments = members.map(m => {
    const start = runningIdx
    runningIdx += m.photos.length
    return { member: m, start, end: runningIdx - 1 }
  })

  return (
    <>
      {/* ─── Story Avatars Row ───────────────────────── */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 14, overflowX: 'auto' }}>
        {members.map((m, mi) => (
          <div key={m.id} onClick={() => open(mi)} style={{ cursor: 'pointer', textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              padding: 3,
              background: `linear-gradient(135deg, ${S.p}, ${S.violet})`,
            }}>
              <img
                src={m.photos[0]}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${S.bg}` }}
              />
            </div>
            <p style={{
              fontSize: 11, fontWeight: 600, color: S.tx2,
              fontFamily: fonts.body,
              margin: '6px 0 0', maxWidth: 68,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{m.name}</p>
          </div>
        ))}
      </div>

      {/* ─── Fullscreen Story Viewer ─────────────────── */}
      {visible && curMember && curSlide && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}
        >
          {/* Photo — full viewport cover */}
          <div
            key={fadeKey}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${curSlide.photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'storyFadeIn 0.25s ease',
            }}
          />

          {/* Gradient top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)', zIndex: 15, pointerEvents: 'none' }} />

          {/* Progress bars — one group per member, segments within */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '14px 12px 0', display: 'flex', gap: 3 }}>
            {memberSegments.map(({ member, start, end }) => (
              <div key={member.id} style={{ flex: end - start + 1, display: 'flex', gap: 2 }}>
                {member.photos.map((_, localSi) => {
                  const absIdx = start + localSi
                  const filled = absIdx < globalIdx
                  const active = absIdx === globalIdx
                  return (
                    <div key={localSi} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.28)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, background: '#fff',
                        width: filled ? '100%' : active ? `${progress}%` : '0%',
                        transition: active ? 'width 0.05s linear' : 'none',
                      }} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* X close */}
          <button
            aria-label={t('common.close')}
            onClick={close}
            style={{
              position: 'absolute', top: 28, right: 14, zIndex: 30,
              background: 'rgba(0,0,0,0.5)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: '#fff' }} />
          </button>

          {/* Tap zones */}
          <div
            role="button"
            aria-label="previous"
            tabIndex={0}
            onClick={goPrev}
            onKeyDown={e => e.key === 'Enter' && goPrev()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 10 }}
          />
          <div
            role="button"
            aria-label="next"
            tabIndex={0}
            onClick={goNext}
            onKeyDown={e => e.key === 'Enter' && goNext()}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%', zIndex: 10 }}
          />

          {/* Bottom overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
            padding: '80px 20px 40px', pointerEvents: 'none',
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: fonts.hero, margin: '0 0 4px', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              {curMember.name}
            </p>
            {(curMember.role || curMember.age) && (
              <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.82)', fontFamily: fonts.body, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {[curMember.role, curMember.age ? `${curMember.age} ${t('profile.age_years')}` : ''].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <style>{`@keyframes storyFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>
      )}
    </>
  )
}
