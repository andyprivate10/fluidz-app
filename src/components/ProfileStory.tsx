import { useState, useEffect, useRef } from 'react'
import { X, Flame } from 'lucide-react'
import { colors } from '../brand'
import { useTranslation } from 'react-i18next'
import { stripHtml } from '../lib/sanitize'

const S = colors
const AUTO_DURATION = 4000

type ProfileData = { display_name: string; profile_json: Record<string, unknown> }
type Slide = { type: string; duration: number; data: Record<string, unknown> }

function v(x: unknown): string { return x == null ? '' : String(x) }

function buildSlides(p: ProfileData): Slide[] {
  const j = p.profile_json
  const slides: Slide[] = []
  slides.push({ type: 'intro', duration: AUTO_DURATION, data: { name: p.display_name, age: j.age, location: j.location, avatar: j.avatar_url, role: j.role, tribes: j.tribes } })
  const photos = [...(Array.isArray(j.photos_profil) ? j.photos_profil : j.avatar_url ? [j.avatar_url] : [])]
  const intime = Array.isArray(j.photos_intime) ? j.photos_intime : []
  ;[...photos, ...intime].slice(0, 5).forEach(url => slides.push({ type: 'photo', duration: AUTO_DURATION, data: { url } }))
  if (j.height || j.weight || j.morphology) slides.push({ type: 'stats', duration: AUTO_DURATION, data: { height: j.height, weight: j.weight, morphology: j.morphology } })
  if (j.role) slides.push({ type: 'role', duration: AUTO_DURATION, data: { role: j.role, bio: j.bio } })
  const kinks = Array.isArray(j.kinks) ? j.kinks : []
  if (kinks.length > 0) slides.push({ type: 'kinks', duration: AUTO_DURATION, data: { kinks } })
  slides.push({ type: 'outro', duration: AUTO_DURATION, data: { name: p.display_name, role: j.role, bio: j.bio } })
  return slides
}

export default function ProfileStory({ profile, onClose }: { profile: ProfileData; onClose: () => void }) {
  const slides = buildSlides(profile)
  const { t } = useTranslation()
  const [cur, setCur] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const tmr = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0 = useRef(Date.now())
  const sl = slides[cur]

  useEffect(() => {
    if (!sl) { onClose(); return }
    t0.current = Date.now(); setProgress(0); setFadeIn(true)
    tmr.current = setInterval(() => {
      const pct = Math.min(((Date.now() - t0.current) / sl.duration) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        if (tmr.current) clearInterval(tmr.current)
        if (cur < slides.length - 1) advance(1)
        else onClose()
      }
    }, 50)
    return () => { if (tmr.current) clearInterval(tmr.current) }
  }, [cur])

  function advance(dir: number) {
    if (tmr.current) clearInterval(tmr.current)
    setFadeIn(false)
    setTimeout(() => {
      const next = cur + dir
      if (next < 0) { setCur(0); t0.current = Date.now(); setProgress(0); setFadeIn(true) }
      else if (next >= slides.length) onClose()
      else setCur(next)
    }, 200)
  }

  function next() { advance(1) }
  function prev() { advance(-1) }

  const swipeStart = useRef(0)
  function onTouchStart(e: React.TouchEvent) { swipeStart.current = e.touches[0].clientY }
  function onTouchEnd(e: React.TouchEvent) {
    const dy = e.changedTouches[0].clientY - swipeStart.current
    if (dy > 80) onClose()
  }

  if (!sl) return null
  const d = sl.data
  const pj = profile.profile_json
  const name = stripHtml(profile.display_name)
  const age = v(pj.age)
  const role = v(pj.role)
  const tribes = Array.isArray(pj.tribes) ? pj.tribes : []
  const bio = stripHtml(v(pj.bio))

  const bgMap: Record<string, string> = {
    intro: 'radial-gradient(ellipse at 30% 50%, #1a0a2e 0%, '+S.bg+' 70%)',
    photo: '#000',
    stats: 'radial-gradient(ellipse at 70% 30%, #1a1025 0%, '+S.bg+' 70%)',
    role: 'radial-gradient(ellipse at 50% 50%, #2a0a1e 0%, '+S.bg+' 70%)',
    kinks: 'radial-gradient(ellipse at 50% 70%, #1a0a2e 0%, '+S.bg+' 70%)',
    outro: 'radial-gradient(ellipse at 50% 50%, #2a1020 0%, '+S.bg+' 60%)',
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: bgMap[sl.type] || '#000',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.5s ease',
    }}>
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 3, padding: '12px 12px 0', zIndex: 20 }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, background: 'rgba(255,255,255,0.2)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2, background: S.white,
              width: i < cur ? '100%' : i === cur ? `${progress}%` : '0%',
              transition: i === cur ? 'width 0.05s linear' : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        aria-label={t('common.close')}
        onClick={onClose}
        style={{
          position: 'absolute', top: 24, right: 16, zIndex: 30,
          background: 'rgba(0,0,0,0.4)', border: 'none',
          borderRadius: '50%', padding: 8, cursor: 'pointer',
        }}
      >
        <X size={20} style={{ color: S.tx }} />
      </button>

      {/* Tap zones */}
      <div role="button" aria-label={t('common.previous')} tabIndex={0} onClick={prev} onKeyDown={e => e.key === 'Enter' && prev()} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 10 }} />
      <div role="button" aria-label={t('common.next')} tabIndex={0} onClick={next} onKeyDown={e => e.key === 'Enter' && next()} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%', zIndex: 10 }} />

      {/* Content with crossfade */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, opacity: fadeIn ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        {sl.type === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'sfu 0.4s ease' }}>
            {d.avatar ? <img src={v(d.avatar)} alt="" loading="lazy" style={{ width: 120, height: 120, borderRadius: '28%', objectFit: 'cover', border: '3px solid ' + S.p, marginBottom: 20 }} /> : null}
            <h1 style={{ fontSize: 36, fontWeight: 800, color: S.tx, margin: '0 0 8px' }}>{v(d.name)}</h1>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {d.age ? <span style={{ fontSize: 18, color: S.tx2 }}>{v(d.age)} ans</span> : null}
              {d.location ? <span style={{ fontSize: 18, color: S.tx3 }}>{v(d.location)}</span> : null}
            </div>
          </div>
        )}
        {sl.type === 'photo' && <img src={v(d.url)} alt="" loading="lazy" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain' }} />}
        {sl.type === 'stats' && (
          <div style={{ textAlign: 'center', animation: 'sfu 0.4s ease' }}>
            <p style={{ fontSize: 14, color: S.tx3, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{t('profile.section_physique')}</p>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
              {d.height ? <div><div style={{ fontSize: 40, fontWeight: 800, color: S.tx }}>{v(d.height)}</div><div style={{ fontSize: 14, color: S.tx3 }}>cm</div></div> : null}
              {d.weight ? <div><div style={{ fontSize: 40, fontWeight: 800, color: S.tx }}>{v(d.weight)}</div><div style={{ fontSize: 14, color: S.tx3 }}>kg</div></div> : null}
            </div>
            {d.morphology ? <p style={{ fontSize: 20, color: S.p, fontWeight: 700, marginTop: 16 }}>{v(d.morphology)}</p> : null}
          </div>
        )}
        {sl.type === 'role' && (
          <div style={{ textAlign: 'center', animation: 'sfu 0.4s ease' }}>
            <div style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 99, background: S.grad, marginBottom: 20 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: S.tx }}>{v(d.role)}</span>
            </div>
            {d.bio ? <p style={{ fontSize: 16, color: S.tx2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{v(d.bio)}</p> : null}
          </div>
        )}
        {sl.type === 'kinks' && (() => {
          const kinkColors: Record<string, string> = {
            'Dominant': S.p, 'Soumis': S.p, 'SM léger': S.p, 'SM hard': S.red,
            'Fist': S.red, 'Group': S.blue, 'Voyeur': S.violet, 'Exhib': S.violet,
            'Fétichisme': S.emerald, 'Jeux de rôle': S.amber, 'Bears welcome': S.p,
          }
          return (
            <div style={{ textAlign: 'center', animation: 'sfu 0.4s ease' }}>
              <p style={{ fontSize: 14, color: S.tx3, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{t('profile.section_pratiques')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 340 }}>
                {(d.kinks as string[]).map((k: string, i: number) => {
                  const c = kinkColors[k] || S.p
                  return <span key={i} style={{ padding: '8px 16px', borderRadius: 99, fontSize: 15, fontWeight: 600, color: c, background: c + '22', border: '1px solid ' + c + '44', animation: `sfu 0.3s ease ${i * 0.1}s both` }}>{k}</span>
                })}
              </div>
            </div>
          )
        })()}
        {sl.type === 'outro' && (
          <div style={{ textAlign: 'center', animation: 'sfu 0.4s ease' }}>
            <Flame size={48} strokeWidth={1.5} style={{ color: S.p, marginBottom: 12 }} />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: S.tx, margin: '0 0 8px' }}>{v(d.name)}</h2>
            {d.role ? <p style={{ fontSize: 20, color: S.p, fontWeight: 700 }}>{v(d.role)}</p> : null}
          </div>
        )}
      </div>

      {/* Bottom overlay: name, age, role, tribes, bio */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
        padding: '40px 20px 24px', pointerEvents: 'none',
      }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: S.tx, margin: '0 0 2px' }}>
          {name}{age ? `, ${age}` : ''}
        </p>
        {role && <p style={{ fontSize: 13, fontWeight: 600, color: S.p, margin: '0 0 4px' }}>{role}</p>}
        {tribes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {tribes.slice(0, 3).map((tr: string) => (
              <span key={tr} style={{ fontSize: 10, fontWeight: 600, color: S.lav, background: 'rgba(144,128,186,0.2)', padding: '2px 8px', borderRadius: 99 }}>{tr}</span>
            ))}
          </div>
        )}
        {bio && sl.type !== 'role' && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bio}</p>
        )}
      </div>

      <style>{`@keyframes sfu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
