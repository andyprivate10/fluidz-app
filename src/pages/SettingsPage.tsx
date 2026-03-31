import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { colors, fonts } from '../brand'
import PageFadeIn from '../components/PageFadeIn'
import OrbLayer from '../components/OrbLayer'

const S = colors

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: 16, border: '1px solid ' + S.rule2, marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dmPrivacy, setDmPrivacy] = useState<'open' | 'profile_required' | 'full_access'>('open')
  const [locationVisible, setLocationVisible] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('user_profiles').select('profile_json, location_visible').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        const pj = (data.profile_json || {}) as Record<string, unknown>
        setDmPrivacy((pj.dm_privacy as typeof dmPrivacy) || 'open')
        setLocationVisible(!!data.location_visible)
      }
    })
  }, [user])

  async function saveDmPrivacy(v: typeof dmPrivacy) {
    if (!user) return
    setDmPrivacy(v)
    const { data: current } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
    const pj = { ...((current?.profile_json || {}) as Record<string, unknown>), dm_privacy: v }
    await supabase.from('user_profiles').update({ profile_json: pj }).eq('id', user.id)
  }

  async function toggleVisibility() {
    if (!user) return
    const newVal = !locationVisible
    setLocationVisible(newVal)
    await supabase.from('user_profiles').update({ location_visible: newVal }).eq('id', user.id)
  }

  async function deleteAccount() {
    if (!user || deleteInput !== 'DELETE') return
    setDeleting(true)
    const uid = user.id
    await Promise.allSettled([
      supabase.from('applications').delete().eq('applicant_id', uid),
      supabase.from('messages').delete().eq('sender_id', uid),
      supabase.from('contacts').delete().or(`user_id.eq.${uid},contact_user_id.eq.${uid}`),
      supabase.from('favorites').delete().or(`user_id.eq.${uid},target_user_id.eq.${uid}`),
      supabase.from('intents').delete().or(`user_id.eq.${uid},target_user_id.eq.${uid}`),
      supabase.from('notifications').delete().eq('user_id', uid),
      supabase.from('votes').delete().eq('voter_id', uid),
      supabase.from('reviews').delete().eq('reviewer_id', uid),
      supabase.from('review_queue').delete().eq('user_id', uid),
      supabase.from('ghost_sessions').delete().eq('claimed_user_id', uid),
      supabase.from('user_profiles').delete().eq('id', uid),
    ])
    showToast(t('settings.deleted_success'), 'success')
    await supabase.auth.signOut()
    navigate('/landing')
  }

  if (!user) return null

  return (
    <PageFadeIn>
      <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />

        {/* Header */}
        <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx2, cursor: 'pointer', padding: 4 }}>
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: 0 }}>
              {t('settings_page.title')}
            </h1>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* DM Privacy */}
          <Section title={t('dm_privacy.title')} color={S.p}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { level: 'open' as const, label: t('dm_privacy.open'), desc: t('dm_privacy.open_desc'), color: S.sage },
                { level: 'profile_required' as const, label: t('dm_privacy.profile_required'), desc: t('dm_privacy.profile_required_desc'), color: S.blue },
                { level: 'full_access' as const, label: t('dm_privacy.full_access'), desc: t('dm_privacy.full_access_desc'), color: S.p },
              ]).map(opt => {
                const on = dmPrivacy === opt.level
                return (
                  <button key={opt.level} onClick={() => saveDmPrivacy(opt.level)} style={{
                    padding: '12px 14px', borderRadius: 14, border: '1px solid ' + (on ? opt.color + '66' : S.rule),
                    background: on ? opt.color + '14' : S.bg2, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: on ? opt.color : S.tx2 }}>{opt.label}</span>
                    <span style={{ fontSize: 11, color: S.tx3 }}>{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Gallery Visibility */}
          <Section title={t('settings_page.visibility')} color={S.sage}>
            <button onClick={toggleVisibility} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
              background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer', width: '100%', textAlign: 'left',
            }}>
              <Eye size={18} strokeWidth={1.5} style={{ color: locationVisible ? S.sage : S.tx3 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: S.tx, display: 'block' }}>{t('drawer.gallery_visible')}</span>
                <span style={{ fontSize: 11, color: S.tx3 }}>{t('settings_page.visibility_desc')}</span>
              </div>
              <div style={{
                width: 38, height: 22, borderRadius: 11, padding: 2,
                background: locationVisible ? S.sage : S.bg3,
                border: '1px solid ' + (locationVisible ? S.sagebd : S.rule),
                transition: 'background 0.2s',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: S.white,
                  transform: locationVisible ? 'translateX(16px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                }} />
              </div>
            </button>
          </Section>

          {/* Delete account */}
          <div style={{ background: S.redbg, border: '1px solid ' + S.redbd, borderRadius: 20, padding: 16, marginTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{t('settings.delete_account')}</p>
            <p style={{ fontSize: 12, color: S.tx3, margin: '0 0 12px' }}>{t('settings.delete_warning')}</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid ' + S.red, background: 'transparent', color: S.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                {t('settings.delete_account')}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, color: S.red, fontWeight: 600, margin: 0 }}>{t('settings.delete_confirm')}</p>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid ' + S.redbd, background: S.bg2, color: S.tx, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {t('common.cancel')}
                  </button>
                  <button disabled={deleteInput !== 'DELETE' || deleting} onClick={deleteAccount} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: deleteInput === 'DELETE' ? S.red : S.bg3, color: S.tx, fontSize: 13, fontWeight: 700, cursor: deleteInput === 'DELETE' && !deleting ? 'pointer' : 'not-allowed', opacity: deleteInput === 'DELETE' && !deleting ? 1 : 0.5 }}>
                    {deleting ? t('common.loading') : t('settings.delete_button')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFadeIn>
  )
}
