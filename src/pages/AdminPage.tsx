import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, radius } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { ArrowLeft, Zap, Users, Calendar, LayoutTemplate, Settings, FolderOpen, Database, BarChart3 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

// Lazy-loaded tabs
import AdminAuthTab from '../components/admin/AdminAuthTab'
import AdminUsersTab from '../components/admin/AdminUsersTab'
import AdminSessionsTab from '../components/admin/AdminSessionsTab'
import AdminTemplatesTab from '../components/admin/AdminTemplatesTab'
import AdminConfigTab from '../components/admin/AdminConfigTab'
import AdminMediaTab from '../components/admin/AdminMediaTab'
import AdminSeedTab from '../components/admin/AdminSeedTab'
import AdminStatsTab from '../components/admin/AdminStatsTab'

const S = colors
const R = radius

const TABS = [
  { id: 'auth', label: 'Auth', icon: Zap, color: S.p },
  { id: 'users', label: 'Comptes', icon: Users, color: S.lav },
  { id: 'sessions', label: 'Sessions', icon: Calendar, color: S.sage },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, color: S.amber },
  { id: 'config', label: 'Options', icon: Settings, color: S.blue },
  { id: 'media', label: 'Media', icon: FolderOpen, color: S.violet },
  { id: 'seed', label: 'Seed', icon: Database, color: S.red },
  { id: 'stats', label: 'Stats', icon: BarChart3, color: S.emerald },
] as const

type TabId = typeof TABS[number]['id']

// Shared styles for admin sub-components
export const adminStyles = {
  card: { background: S.bg1, borderRadius: R.card, border: '1px solid ' + S.rule, padding: 16 } as React.CSSProperties,
  input: { width: '100%', background: S.bg2, color: S.tx, borderRadius: 12, padding: '10px 14px', border: '1px solid ' + S.rule, outline: 'none', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' as const } as React.CSSProperties,
  btnPrimary: { padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, border: 'none', background: S.grad, color: '#fff', cursor: 'pointer', position: 'relative' as const, overflow: 'hidden' as const } as React.CSSProperties,
  btnSecondary: { padding: '10px 16px', borderRadius: 12, fontWeight: 600, fontSize: 13, border: '1px solid ' + S.rule, background: S.bg2, color: S.tx2, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { padding: '10px 16px', borderRadius: 12, fontWeight: 600, fontSize: 13, border: '1px solid ' + S.redbd, background: S.redbg, color: S.red, cursor: 'pointer' } as React.CSSProperties,
  sectionLabel: (color: string) => ({ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color, margin: '0 0 8px' } as React.CSSProperties),
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('auth')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { setIsAdmin(false); return }
      setUser(u)
      supabase.from('user_profiles').select('is_admin').eq('id', u.id).maybeSingle().then(({ data }) => {
        setIsAdmin(data?.is_admin === true)
      })
    })
  }, [])

  if (isAdmin === null) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + S.pbd, borderTopColor: S.p, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!isAdmin) {
    // Show Auth Express even when not logged in / not admin
    return (
      <div style={{ minHeight: '100vh', background: S.bg, position: 'relative', maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        <OrbLayer />
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, margin: '0 0 8px' }}>Admin Dashboard</h1>
        <p style={{ color: S.tx3, fontSize: 13, marginBottom: 20 }}>Connecte-toi avec un compte admin pour accéder au dashboard.</p>
        <AdminAuthTab user={user} setUser={(u) => {
          setUser(u)
          if (u) {
            supabase.from('user_profiles').select('is_admin').eq('id', u.id).maybeSingle().then(({ data }) => {
              setIsAdmin(data?.is_admin === true)
            })
          }
        }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, position: 'relative', maxWidth: 480, margin: '0 auto', paddingBottom: 20 }}>
      <OrbLayer />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '40px 20px 12px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} strokeWidth={1.5} /> Retour
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: S.tx, margin: 0 }}>Admin</h1>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: S.sage }} />
              <span style={{ fontSize: 11, color: S.tx3 }}>{user.email?.split('@')[0]}</span>
            </div>
          )}
        </div>

        {/* Tab bar — scrollable */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '6px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                border: '1px solid ' + (active ? tab.color + '44' : S.rule),
                background: active ? tab.color + '18' : 'transparent',
                color: active ? tab.color : S.tx3,
              }}>
                <tab.icon size={12} strokeWidth={1.5} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 20px' }}>
        {activeTab === 'auth' && <AdminAuthTab user={user} setUser={setUser} />}
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'sessions' && <AdminSessionsTab />}
        {activeTab === 'templates' && <AdminTemplatesTab />}
        {activeTab === 'config' && <AdminConfigTab />}
        {activeTab === 'media' && <AdminMediaTab />}
        {activeTab === 'seed' && <AdminSeedTab />}
        {activeTab === 'stats' && <AdminStatsTab />}
      </div>
    </div>
  )
}
