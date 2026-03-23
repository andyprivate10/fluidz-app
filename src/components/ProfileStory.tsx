import { useState, useEffect, useRef } from 'react'
import { X, Flame } from 'lucide-react'
import { colors } from '../brand'

const S = colors

type ProfileData = { display_name: string; profile_json: Record<string, unknown> }
type Slide = { type: string; duration: number; data: Record<string, unknown> }

function v(x: unknown): string { return x == null ? '' : String(x) }

function buildSlides(p: ProfileData): Slide[] {
  const j = p.profile_json
  const slides: Slide[] = []
  slides.push({ type: 'intro', duration: 3000, data: { name: p.display_name, age: j.age, location: j.location, avatar: j.avatar_url } })
  const photos = [...(Array.isArray(j.photos_profil) ? j.photos_profil : j.avatar_url ? [j.avatar_url] : [])]
  const intime = Array.isArray(j.photos_intime) ? j.photos_intime : []
  ;[...photos, ...intime].slice(0, 5).forEach(url => slides.push({ type: 'photo', duration: 3000, data: { url } }))
  if (j.height || j.weight || j.morphology) slides.push({ type: 'stats', duration: 3000, data: { height: j.height, weight: j.weight, morphology: j.morphology } })
  if (j.role) slides.push({ type: 'role', duration: 3500, data: { role: j.role, bio: j.bio } })
  const kinks = Array.isArray(j.kinks) ? j.kinks : []
  if (kinks.length > 0) slides.push({ type: 'kinks', duration: 3000, data: { kinks } })
  slides.push({ type: 'outro', duration: 3000, data: { name: p.display_name, role: j.role } })
  return slides
}

export default function ProfileStory({ profile, onClose }: { profile: ProfileData; onClose: () => void }) {
  const slides = buildSlides(profile)
  const [cur, setCur] = useState(0)
  const [progress, setProgress] = useState(0)
  const tmr = useRef<ReturnType<typeof setInterval> | null>(null)
  const t0 = useRef(Date.now())
  const sl = slides[cur]

  useEffect(() => {
    if (!sl) { onClose(); return }
    t0.current = Date.now(); setProgress(0)
    tmr.current = setInterval(() => {
      const pct = Math.min(((Date.now() - t0.current) / sl.duration) * 100, 100)
      setProgress(pct)
      if (pct >= 100) { if (tmr.current) clearInterval(tmr.current); if (cur < slides.length - 1) setCur(c => c + 1); else onClose() }
    }, 50)
    return () => { if (tmr.current) clearInterval(tmr.current) }
  }, [cur])

  function next() { if (tmr.current) clearInterval(tmr.current); if (cur < slides.length - 1) setCur(c => c + 1); else onClose() }
  function prev() { if (tmr.current) clearInterval(tmr.current); if (cur > 0) setCur(c => c - 1); else { t0.current = Date.now(); setProgress(0) } }

  // Swipe down to close
  const swipeStart = useRef(0)
  function onTouchStart(e: React.TouchEvent) { swipeStart.current = e.touches[0].clientY }
  function onTouchEnd(e: React.TouchEvent) {
    const dy = e.changedTouches[0].clientY - swipeStart.current
    if (dy > 80) onClose()
  }

  if (!sl) return null
  const d = sl.data
  const anim: React.CSSProperties = { animation: 'sfu 0.4s ease' }
  const bgMap: Record<string, string> = {
    intro: 'radial-gradient(ellipse at 30% 50%, #1a0a2e 0%, '+S.bg+' 70%)',
    photo: '#000',
    stats: 'radial-gradient(ellipse at 70% 30%, #1a1025 0%, '+S.bg+' 70%)',
    role: 'radial-gradient(ellipse at 50% 50%, #2a0a1e 0%, '+S.bg+' 70%)',
    kinks: 'radial-gradient(ellipse at 50% 70%, #1a0a2e 0%, '+S.bg+' 70%)',
    outro: 'radial-gradient(ellipse at 50% 50%, #2a1020 0%, '+S.bg+' 60%)',
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ position:'fixed',inset:0,zIndex:9999,background:bgMap[sl.type]||'#000',display:'flex',flexDirection:'column',transition:'background 0.5s ease' }}>
      <div style={{ display:'flex',gap:3,padding:'12px 12px 0',zIndex:20 }}>
        {slides.map((_,i) => (
          <div key={i} style={{ flex:1,height:3,background:'rgba(255,255,255,0.2)',borderRadius:2,overflow:'hidden' }}>
            <div style={{ height:'100%',borderRadius:2,background:'#fff',width: i<cur?'100%':i===cur?`${progress}%`:'0%',transition:'width 0.05s linear' }} />
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ position:'absolute',top:24,right:16,zIndex:30,background:'rgba(0,0,0,0.4)',border:'none',borderRadius:'50%',padding:8,cursor:'pointer' }}><X size={20} style={{color:'#fff'}} /></button>
      <div onClick={prev} style={{ position:'absolute',top:0,bottom:0,left:0,width:'30%',zIndex:10 }} />
      <div onClick={next} style={{ position:'absolute',top:0,bottom:0,right:0,width:'70%',zIndex:10 }} />

      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
        {sl.type === 'intro' && (
          <div style={{ textAlign:'center',...anim }}>
            {d.avatar ? <img src={v(d.avatar)} alt="" loading="lazy" style={{ width:120,height:120,borderRadius:'50%',objectFit:'cover',border:'3px solid '+S.p,marginBottom:20 }} /> : null}
            <h1 style={{ fontSize:36,fontWeight:800,color:S.tx,margin:'0 0 8px' }}>{v(d.name)}</h1>
            <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
              {d.age ? <span style={{ fontSize:18,color:S.tx2 }}>{v(d.age)} ans</span> : null}
              {d.location ? <span style={{ fontSize:18,color:S.tx3 }}>{v(d.location)}</span> : null}
            </div>
          </div>
        )}
        {sl.type === 'photo' && <img src={v(d.url)} alt="" loading="lazy" style={{ maxWidth:'100%',maxHeight:'80vh',borderRadius:16,objectFit:'contain' }} />}
        {sl.type === 'stats' && (
          <div style={{ textAlign:'center',...anim }}>
            <p style={{ fontSize:14,color:S.tx3,marginBottom:20,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:700 }}>Physique</p>
            <div style={{ display:'flex',gap:24,justifyContent:'center' }}>
              {d.height ? <div><div style={{ fontSize:40,fontWeight:800,color:S.tx }}>{v(d.height)}</div><div style={{ fontSize:14,color:S.tx3 }}>cm</div></div> : null}
              {d.weight ? <div><div style={{ fontSize:40,fontWeight:800,color:S.tx }}>{v(d.weight)}</div><div style={{ fontSize:14,color:S.tx3 }}>kg</div></div> : null}
            </div>
            {d.morphology ? <p style={{ fontSize:20,color:S.p,fontWeight:700,marginTop:16 }}>{v(d.morphology)}</p> : null}
          </div>
        )}
        {sl.type === 'role' && (
          <div style={{ textAlign:'center',...anim }}>
            <div style={{ display:'inline-block',padding:'12px 32px',borderRadius:99,background:S.grad,marginBottom:20 }}>
              <span style={{ fontSize:28,fontWeight:800,color:'#fff' }}>{v(d.role)}</span>
            </div>
            {d.bio ? <p style={{ fontSize:16,color:S.tx2,lineHeight:1.6,maxWidth:320,margin:'0 auto' }}>{v(d.bio)}</p> : null}
          </div>
        )}
        {sl.type === 'kinks' && (() => {
          const kinkColors: Record<string, string> = {
            'Dominant':S.p,'Soumis':S.p,'SM léger':S.p,'SM hard':S.red,
            'Fist':S.red,'Group':S.blue,'Voyeur':S.violet,'Exhib':S.violet,
            'Fétichisme':S.emerald,'Jeux de rôle':S.amber,'Bears welcome':S.p,
          }
          return (
          <div style={{ textAlign:'center',...anim }}>
            <p style={{ fontSize:14,color:S.tx3,marginBottom:20,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:700 }}>Pratiques</p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',maxWidth:340 }}>
              {(d.kinks as string[]).map((k: string, i: number) => {
                const c = kinkColors[k] || S.p
                return <span key={i} style={{ padding:'8px 16px',borderRadius:99,fontSize:15,fontWeight:600,color:c,background:c+'22',border:'1px solid '+c+'44',animation:`sfu 0.3s ease ${i*0.1}s both` }}>{k}</span>
              })}
            </div>
          </div>
          )
        })()}
        {sl.type === 'outro' && (
          <div style={{ textAlign:'center',...anim }}>
            <Flame size={48} strokeWidth={1.5} style={{ color: S.p, marginBottom: 12 }} />
            <h2 style={{ fontSize:28,fontWeight:800,color:S.tx,margin:'0 0 8px' }}>{v(d.name)}</h2>
            {d.role ? <p style={{ fontSize:20,color:S.p,fontWeight:700 }}>{v(d.role)}</p> : null}
          </div>
        )}
      </div>
      <style>{`@keyframes sfu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
