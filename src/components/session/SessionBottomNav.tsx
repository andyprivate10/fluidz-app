import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Home, Users, MessageCircle, CheckCircle, ClipboardList, Eye, Send } from 'lucide-react'
import { colors } from '../../brand'

const S = colors

type Role = 'host' | 'member' | 'candidate' | 'visitor'
type Tab = { id: string; label: string; icon: React.ReactNode; badge?: number; accent?: boolean }

interface Props {
  sessionId: string
  role: Role
  activeTab: string
  onTabChange: (tab: string) => void
  badges?: { candidates?: number; votes?: number; chat?: number }
}

export default function SessionBottomNav({ role, activeTab, onTabChange, badges }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const backTab: Tab = { id: 'back', label: t('session_nav.back'), icon: <ArrowLeft size={20} strokeWidth={1.5} /> }

  const tabsByRole: Record<Role, Tab[]> = {
    host: [
      backTab,
      { id: 'session', label: t('session_nav.session'), icon: <Home size={20} strokeWidth={1.5} /> },
      { id: 'candidates', label: t('session_nav.candidates'), icon: <Users size={20} strokeWidth={1.5} />, badge: badges?.candidates },
      { id: 'chat', label: t('session_nav.chat'), icon: <MessageCircle size={20} strokeWidth={1.5} /> },
    ],
    member: [
      backTab,
      { id: 'session', label: t('session_nav.session'), icon: <Home size={20} strokeWidth={1.5} /> },
      { id: 'vote', label: t('session_nav.vote'), icon: <CheckCircle size={20} strokeWidth={1.5} />, badge: badges?.votes },
      { id: 'chat', label: t('session_nav.chat'), icon: <MessageCircle size={20} strokeWidth={1.5} /> },
    ],
    candidate: [
      backTab,
      { id: 'session', label: t('session_nav.session'), icon: <Home size={20} strokeWidth={1.5} /> },
      { id: 'application', label: t('session_nav.application'), icon: <ClipboardList size={20} strokeWidth={1.5} /> },
      { id: 'chat', label: t('session_nav.chat'), icon: <MessageCircle size={20} strokeWidth={1.5} /> },
    ],
    visitor: [
      backTab,
      { id: 'session', label: t('session_nav.session'), icon: <Eye size={20} strokeWidth={1.5} /> },
      { id: 'apply', label: t('session_nav.apply'), icon: <Send size={20} strokeWidth={1.5} />, accent: true },
    ],
  }

  const tabs = tabsByRole[role]

  function handleClick(tab: Tab) {
    if (tab.id === 'back') {
      navigate('/')
      return
    }
    onTabChange(tab.id)
  }

  return (
    <nav aria-label="Session navigation" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,4,10,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(255,255,255,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', maxWidth: 480, margin: '0 auto', height: 56 }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          const isAccent = tab.accent && !isActive
          return (
            <button
              key={tab.id}
              onClick={() => handleClick(tab)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3,
                background: isAccent ? 'linear-gradient(135deg, ' + S.p + ', ' + S.pDark + ')' : 'none',
                border: 'none', cursor: 'pointer',
                position: 'relative', padding: '8px 0',
                borderRadius: isAccent ? 12 : 0,
                margin: isAccent ? '6px 4px' : 0,
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '30%', right: '30%',
                  height: 2, background: S.p, borderRadius: 2,
                }} />
              )}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 20, height: 20,
                  color: isAccent ? '#fff' : isActive ? S.p : S.tx3,
                  transition: 'color 0.2s',
                }}>
                  {tab.icon}
                </div>
                {tab.badge && tab.badge > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -8,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: S.red, border: '2px solid rgba(5,4,10,0.92)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px',
                  }}>
                    {tab.badge}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 600,
                letterSpacing: '-0.01em',
                color: isAccent ? '#fff' : isActive ? S.p : S.tx3,
                transition: 'color 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
