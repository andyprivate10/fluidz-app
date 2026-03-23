import { useEffect, useState } from 'react'

const COLORS = ['#F9A8A8', '#F47272', '#7DD3FC', '#4ADE80', '#FBBF24', '#C4B5FD', '#F0ABFC']

type Particle = { id: number; x: number; color: string; delay: number; size: number; drift: number }

export default function Confetti({ duration = 3000 }: { duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const ps: Particle[] = []
    for (let i = 0; i < 50; i++) {
      ps.push({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.6,
        size: 4 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 60,
      })
    }
    setParticles(ps)
    const t = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(t)
  }, [duration])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: -10,
          width: p.size,
          height: p.size * 0.6,
          background: p.color,
          borderRadius: 1,
          animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${p.delay}s forwards`,
          marginLeft: p.drift,
        }} />
      ))}
    </div>
  )
}
