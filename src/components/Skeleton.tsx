const S = {
  bg2: '#1F1D2B',
  border: '#2A2740',
}

export function SkeletonLine({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height, borderRadius: 6, background: S.bg2,
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '28%', background: S.bg2,
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
      flexShrink: 0,
    }} />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ background: '#16141F', border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
      <SkeletonLine width="60%" height={16} style={{ marginBottom: 10 }} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 30}%`} style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <SkeletonCircle size={40} />
      <div style={{ flex: 1 }}>
        <SkeletonLine width="40%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonLine width="25%" height={11} />
      </div>
    </div>
  )
}

export function SkeletonSessionPage() {
  return (
    <div style={{ background: '#0C0A14', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid ' + S.border, background: '#16141F' }}>
        <SkeletonLine width="70%" height={22} style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonLine width={60} height={24} style={{ borderRadius: 99 }} />
          <SkeletonLine width={60} height={24} style={{ borderRadius: 99 }} />
        </div>
        <SkeletonLine width="50%" height={13} style={{ marginTop: 8 }} />
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonCard lines={2} />
        <div style={{ background: '#16141F', border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
          <SkeletonLine width="30%" height={12} style={{ marginBottom: 12 }} />
          <SkeletonProfile />
          <SkeletonProfile />
          <SkeletonProfile />
        </div>
      </div>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

export function SkeletonChatPage() {
  return (
    <div style={{ background: '#0C0A14', height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid ' + S.border, background: '#16141F' }}>
        <SkeletonLine width="50%" height={18} style={{ marginBottom: 6 }} />
        <SkeletonLine width="30%" height={12} />
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
          <SkeletonLine width={200} height={50} style={{ borderRadius: 16 }} />
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
          <SkeletonLine width={160} height={40} style={{ borderRadius: 16 }} />
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
          <SkeletonLine width={240} height={50} style={{ borderRadius: 16 }} />
        </div>
      </div>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
