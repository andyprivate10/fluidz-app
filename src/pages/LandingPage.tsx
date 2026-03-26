import { useEffect, useRef, useCallback } from 'react'
import { colors } from '../brand'
import LandingNav from '../components/landing/LandingNav'
import LandingHero from '../components/landing/LandingHero'
import LandingFeatures from '../components/landing/LandingFeatures'
import LandingHowItWorks from '../components/landing/LandingHowItWorks'
import LandingPro from '../components/landing/LandingPro'
import LandingFooter from '../components/landing/LandingFooter'

const S = colors

/* ── CSS keyframes injected once ── */
const STYLE_ID = 'landing-kf'
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes lOrbDrift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(22px,-16px) scale(1.1)}66%{transform:translate(-14px,20px) scale(.92)}}
    @keyframes lOrbDrift2{0%,100%{transform:translate(0,0)}45%{transform:translate(-18px,14px) scale(1.08)}75%{transform:translate(15px,-10px)}}
    @keyframes lOrbDrift3{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,22px) scale(1.06)}}
    @keyframes lShimmer{0%{left:-180%}100%{left:200%}}
    @keyframes lFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    .l-rv{opacity:0;transform:translateY(24px);transition:opacity .7s,transform .7s}.l-rv.l-vis{opacity:1;transform:translateY(0)}
    .l-btn-shim{position:relative;overflow:hidden}
    .l-btn-shim::after{content:'';position:absolute;top:0;left:-180%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);animation:lShimmer 3s ease-in-out infinite}
  `
  document.head.appendChild(style)
}

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  const observed = useRef<Set<Element>>(new Set())
  const obs = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    obs.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('l-vis'); obs.current?.unobserve(e.target) } }),
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' },
    )
    observed.current.forEach(el => obs.current?.observe(el))
    return () => obs.current?.disconnect()
  }, [])

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el || observed.current.has(el)) return
    observed.current.add(el)
    obs.current?.observe(el)
  }, [])

  return ref
}

export default function LandingPage() {
  const rv = useScrollReveal()

  useEffect(() => { injectKeyframes() }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', overflow: 'hidden', color: S.tx }}>
      <LandingNav />
      <LandingHero scrollTo={scrollTo} />
      <LandingFeatures rv={rv} />
      <LandingHowItWorks rv={rv} />
      <LandingPro rv={rv} />
      <LandingFooter scrollTo={scrollTo} />
    </div>
  )
}
