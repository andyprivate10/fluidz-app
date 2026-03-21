import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { colors } from '../brand'

const S = colors

type Role = 'candidate' | 'member' | 'host'

interface Props {
  role: Role
  sessionTitle?: string
}

export default function EventContextNav({ role, sessionTitle }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()

  const backLabel = 'Sessions'
  const backPath = '/sessions'

  // Tabs per role
  const candidateTabs = [
    { id: 'info',  label: 'Infos',          path: `/session/${id}` },
    { id: 'dm',    label: 'DM host',        path: `/session/${id}/dm` },
    { id: 'apply', label: 'Ma candidature', path: `/session/${id}/apply` },
  ]
  const memberTabs = [
    { id: 'info',  label: 'Qui est là', path: `/session/${id}` },
    { id: 'chat',  label: 'Chat',       path: `/session/${id}/chat` },
    { id: 'dm',    label: 'DM host',    path: `/session/${id}/dm` },
  ]
  const hostTabs = [
    { id: 'candidates', label: 'Candidats', path: `/session/${id}/host` },
    { id: 'members',    label: 'Membres',   path: `/session/${id}` },
    { id: 'share',      label: 'Partager',  path: `/session/${id}/host#share` },
    { id: 'settings',   label: '···',       path: `/session/${id}/edit` },
  ]

  const tabs = role === 'host' ? hostTabs : role === 'member' ? memberTabs : candidateTabs

  const activeTab = tabs.find(t => {
    if (t.path.includes('#')) return location.pathname === t.path.split('#')[0]
    return location.pathname === t.path
  })?.id || tabs[0].id

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      {/* Back nav */}
      <div style={{
        padding: '4px 18px 8px', display: 'flex', alignItems: 'center', gap: 5,
        cursor: 'pointer',
      }} onClick={() => navigate(backPath)}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
          stroke={S.p} strokeWidth="2" strokeLinecap="round">
          <polyline points="9 2 4 7 9 12"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: S.p }}>{backLabel}</span>
        {sessionTitle && (
          <span style={{ fontSize: 12, fontWeight: 500, color: S.tx3, marginLeft: 4 }}>
            · {sessionTitle}
          </span>
        )}
      </div>

      {/* Hub tabs */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 16px 10px',
        borderBottom: `0.5px solid ${S.rule}`,
        background: 'rgba(13,12,22,0.92)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1, padding: '8px 4px', background: 'none', border: 'none',
                cursor: 'pointer', position: 'relative',
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? S.p : S.tx3,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: -1, left: '20%', right: '20%',
                  height: 2, background: S.p, borderRadius: 2,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
