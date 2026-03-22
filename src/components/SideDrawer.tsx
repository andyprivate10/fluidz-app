import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors } from '../brand'
import { User, BookOpen, Bell, Shield, LogOut, MapPin, Globe, Eye, ChevronRight, X } from 'lucide-react'

const S = colors

type Props = { open: boolean; onClose: () => void }

export default function SideDrawer({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; avatar_url?: string; is_admin?: boolean; location_visible?: boolean } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      supabase.from('user_profiles').select('display_name, profile_json, is_admin, location_visible').eq('id', u.id).maybeSingle()
        .then(({ data }) => {
          if (data) setProfile({
            display_name: data.display_name,
            avatar_url: (data.profile_json as any)?.photos_profil?.[0] || (data.profile_json as any)?.avatar_url,
            is_admin: data.is_admin,
            location_visible: data.location_visible,
          })
        })
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('user_id', u.id).is('read_at', null)
        .then(({ count }) => setUnreadCount(count ?? 0))
    })
  }, [open])

  function go(path: string) { onClose(); navigate(path) }
  async function logout() { await supabase.auth.signOut(); onClose(); navigate('/login') }
  function toggleLang() { i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr') }
  async function toggleVisibility() {
    if (!user) return
    const newVal = !profile?.location_visible
    setProfile(p => p ? { ...p, location_visible: newVal } : p)
    await supabase.from('user_profiles').update({ location_visible: newVal }).eq('id', user.id)
  }

  const menuItem = (icon: React.ReactNode, label: string, path: string, badge?: number) => (
    <button onClick={() => go(path)} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
      background: 'none', border: 'none', color: S.tx, cursor: 'pointer',
      width: '100%', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
      borderBottom: '1px solid ' + S.rule,
    }}>
      <div style={{ width: 20, height: 20, color: S.tx2, flexShrink: 0 }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
      {badge && badge > 0 ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: S.p, borderRadius: 99, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>{badge}</span>
      ) : (
        <ChevronRight size={14} strokeWidth={1.5} style={{ color: S.tx3 }} />
      )}
    </button>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }} />

      {/* Drawer */}
      <div role="dialog" aria-label={t('drawer.my_space')} aria-modal={open} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 300, maxWidth: '85vw',
        background: S.bg1,
        borderLeft: '1px solid ' + S.rule2,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '52px 20px 20px', borderBottom: '1px solid ' + S.rule }}>
          <button onClick={onClose} aria-label="Close menu" style={{
            position: 'absolute', top: 14, right: 14,
            width: 32, height: 32, borderRadius: '50%',
            background: S.bg2, border: '1px solid ' + S.rule,
            color: S.tx2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} strokeWidth={2} />
          </button>

          {/* Profile preview */}
          <div onClick={() => go('/me')} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.pbd }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: S.p2, border: '2px solid ' + S.pbd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: S.p }}>
                {(profile?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {profile?.display_name || t('drawer.my_profile')}
              </p>
              <p style={{ fontSize: 12, color: S.tx2, margin: '2px 0 0' }}>
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ padding: '8px 20px', flex: 1 }}>
          {/* Section: Mon espace */}
          <p style={{ fontSize: 10, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 4px' }}>{t('drawer.my_space')}</p>
          {menuItem(<User size={18} strokeWidth={1.5} />, t('drawer.my_profile'), '/me')}
          {menuItem(<Bell size={18} strokeWidth={1.5} />, t('drawer.notifications'), '/notifications', unreadCount)}
          {menuItem(<BookOpen size={18} strokeWidth={1.5} />, t('drawer.naughty_book'), '/contacts')}

          {/* Section: Settings */}
          <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 4px' }}>{t('drawer.settings')}</p>
          {menuItem(<MapPin size={18} strokeWidth={1.5} />, t('drawer.addresses'), '/addresses')}
          
          {/* Visibility toggle */}
          <button onClick={toggleVisibility} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
            background: 'none', border: 'none', color: S.tx, cursor: 'pointer',
            width: '100%', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderBottom: '1px solid ' + S.rule,
          }}>
            <div style={{ width: 20, height: 20, color: S.tx2, flexShrink: 0 }}><Eye size={18} strokeWidth={1.5} /></div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t('drawer.gallery_visible')}</span>
            <div style={{
              width: 38, height: 22, borderRadius: 11, padding: 2,
              background: profile?.location_visible ? S.sage : S.bg3,
              border: '1px solid ' + (profile?.location_visible ? S.sagebd : S.rule),
              transition: 'background 0.2s', cursor: 'pointer',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transform: profile?.location_visible ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }} />
            </div>
          </button>
          
          <button onClick={toggleLang} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
            background: 'none', border: 'none', color: S.tx, cursor: 'pointer',
            width: '100%', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderBottom: '1px solid ' + S.rule,
          }}>
            <div style={{ width: 20, height: 20, color: S.tx2, flexShrink: 0 }}><Globe size={18} strokeWidth={1.5} /></div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t('drawer.language')}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: S.p, padding: '2px 10px', borderRadius: 99, background: S.p2, border: '1px solid ' + S.pbd }}>
              {i18n.language === 'fr' ? 'FR' : 'EN'}
            </span>
          </button>

          {/* Admin */}
          {profile?.is_admin && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 4px' }}>{t('drawer.admin')}</p>
              {menuItem(<Shield size={18} strokeWidth={1.5} />, t('drawer.admin_dashboard'), '/admin')}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 32px', borderTop: '1px solid ' + S.rule }}>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: 12, borderRadius: 12,
            background: 'transparent', border: '1px solid ' + S.redbd, color: S.red,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <LogOut size={16} strokeWidth={1.5} />{` ${t('drawer.logout')}`}
          </button>
        </div>
      </div>
    </>
  )
}
