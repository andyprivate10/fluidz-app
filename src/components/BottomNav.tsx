import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const tabs = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/sessions', icon: '⚡', label: 'Sessions' },
    { path: '/me', icon: '👤', label: 'Moi' },
  ]
  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 390,
    background: '#16141F',
    borderTop: '1px solid #2A2740',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 20px',
    zIndex: 100,
  }
  return (
    <nav style={navStyle}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{ background: 'none', border: 'noneplay: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', padding: '4px 20px' }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#F9A8A8' : '#7E7694' }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
