import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { X, Camera } from 'lucide-react'
import { stripHtml } from '../../lib/sanitize'

const S = colors
const SLIDE_DURATION = 5000

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

  // Active member index + slide index within that member
  const [memberIdx, setMemberIdx] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [fadeKey, setFadeKey] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0Ref = useRef(Date.now())
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  // ─── Data Loading ───────────────────────────────────
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

  // ─── Timer Logic ────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    t0Ref.current = Date.now()
    setProgress(0)
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - t0Ref.current) / SLIDE_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearTimer()
        goNextSlide()
      }
    }, 50)
  }, [clearTimer])

  useEffect(() => { return clearTimer }, [clearTimer])

  // ─── Navigation ─────────────────────────────────────
  const open = useCallback((mi: number) => {
    setMemberIdx(mi)
    setSlideIdx(0)
    setFadeKey(k => k + 1)
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    clearTimer()
    setVisible(false)
  }, [clearTimer])

  const goToSlide = useCallback((mi: number, si: number) => {
    if (mi < 0 || mi >= members.length) { close(); return }
    const m = members[mi]
    if (si < 0) {
      // Go to previous member's last slide
      if (mi > 0) {
        const prevM = members[mi - 1]
        setMemberIdx(mi - 1)
        setSlideIdx(prevM.photos.length - 1)
      } else {
        setSlideIdx(0)
        t0Ref.current = Date.now()
        setProgress(0)
      }
    } else if (si >= m.photos.length) {
      // Go to next member
      if (mi < members.length - 1) {
        setMemberIdx(mi + 1)
        setSlideIdx(0)
      } else {
        close()
        return
      }
    } else {
      setMemberIdx(mi)
      setSlideIdx(si)
    }
    setFadeKey(k => k + 1)
  }, [members, close])

  // Exposed for timer callback
  const goNextSlide = useCallback(() => {
    setMemberIdx(mi => {
      setSlideIdx(si => {
        const m = members[mi]
        if (!m) return si
        if (si < m.photos.length - 1) {
          setFadeKey(k => k + 1)
          return si + 1
        } else if (mi < members.length - 1) {
          setMemberIdx(mi + 1)
          setFadeKey(k => k + 1)
          return 0
        } else {
          close()
          return si
        }
        return si
      })
      return mi
    })
  }, [members, close])

  // Restart timer on slide change
  useEffect(() => {
    if (visible) startTimer()
  }, [memberIdx, slideIdx, visible, startTimer])

  // ─── Touch / Swipe ──────────────────────────────────
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
      if (dx < 0 && memberIdx < members.length - 1) {
        // Swipe left → next member
        setMemberIdx(memberIdx + 1)
        setSlideIdx(0)
        setFadeKey(k => k + 1)
      } else if (dx > 0 && memberIdx > 0) {
        // Swipe right → prev member
        setMemberIdx(memberIdx - 1)
        setSlideIdx(0)
        setFadeKey(k => k + 1)
      }
    }
  }, [memberIdx, members.length])

  const handleTapLeft = useCallback(() => {
    goToSlide(memberIdx, slideIdx - 1)
  }, [memberIdx, slideIdx, goToSlide])

  const handleTapRight = useCallback(() => {
    goToSlide(memberIdx, slideIdx + 1)
  }, [memberIdx, slideIdx, goToSlide])

  // ─── Loading / Empty ────────────────────────────────
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

  const curMember = members[memberIdx] || null
  const curPhoto = curMember ? curMember.photos[slideIdx] : null

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
      {visible && curMember && curPhoto && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
          }}
        >
          {/* Photo — full viewport cover */}
          <div
            key={fadeKey}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${curPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'storyFadeIn 0.3s ease',
            }}
          />

          {/* Progress bars — segments per member */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            zIndex: 20, padding: '14px 12px 0',
          }}>
            {/* Member-level segments */}
            <div style={{ display: 'flex', gap: 4 }}>
              {curMember.photos.map((_, si) => (
                <div key={si} style={{
                  flex: 1, height: 2.5,
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: '#fff',
                    width: si < slideIdx ? '100%' : si === slideIdx ? `${progress}%` : '0%',
                    transition: si === slideIdx ? 'width 0.05s linear' : 'none',
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* X close button */}
          <button
            aria-label={t('common.close')}
            onClick={close}
            style={{
              position: 'absolute', top: 28, right: 14, zIndex: 30,
              background: 'rgba(0,0,0,0.45)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: '#fff' }} />
          </button>

          {/* Tap zones — left prev, right next */}
          <div
            role="button"
            aria-label={t('common.previous')}
            tabIndex={0}
            onClick={handleTapLeft}
            onKeyDown={e => e.key === 'Enter' && handleTapLeft()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 10 }}
          />
          <div
            role="button"
            aria-label={t('common.next')}
            tabIndex={0}
            onClick={handleTapRight}
            onKeyDown={e => e.key === 'Enter' && handleTapRight()}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%', zIndex: 10 }}
          />

          {/* Bottom overlay — gradient noir 50%, pseudo + role/age */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
            background: 'linear-gradient(to top, rgba(0,0,0,0.50) 0%, transparent 100%)',
            padding: '80px 20px 36px',
            pointerEvents: 'none',
          }}>
            <p style={{
              fontSize: 22, fontWeight: 800, color: '#fff',
              fontFamily: fonts.hero,
              margin: '0 0 4px',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}>
              {curMember.name}
            </p>
            {(curMember.role || curMember.age) && (
              <p style={{
                fontSize: 14, fontWeight: 500, color: S.tx2,
                fontFamily: fonts.body,
                margin: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}>
                {[curMember.role, curMember.age ? `${curMember.age} ${t('profile.age_years')}` : ''].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Keyframes */}
          <style>{`
            @keyframes storyFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
