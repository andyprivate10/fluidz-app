import { colors } from '../../brand'
import { supabase } from '../../lib/supabase'
import { showToast } from '../Toast'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

const S = colors

function Section({ title, badge, children, color }: { title:string; badge?:string; children:React.ReactNode; color?:string }) {
  const c = color || S.tx3
  return (
    <div style={{ background:'rgba(22,20,31,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:20, padding:'16px', border:`1px solid ${S.rule2}`, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99,
            background:S.p2, color:S.p, border:`1px solid ${S.pbd}` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

interface MeSettingsProps {
  user: User
  dmPrivacy: 'open' | 'profile_required' | 'full_access'
  setDmPrivacy: (v: 'open' | 'profile_required' | 'full_access') => void
  savedMsgs: { id: string; label: string; text: string }[]
  setSavedMsgs: React.Dispatch<React.SetStateAction<{ id: string; label: string; text: string }[]>>
  newMsgText: string
  setNewMsgText: (v: string) => void
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (v: boolean) => void
  deleteInput: string
  setDeleteInput: (v: string) => void
  deleting: boolean
  setDeleting: (v: boolean) => void
}

export default function MeSettings({
  user,
  dmPrivacy, setDmPrivacy,
  savedMsgs, setSavedMsgs,
  newMsgText, setNewMsgText,
  showDeleteConfirm, setShowDeleteConfirm,
  deleteInput, setDeleteInput,
  deleting, setDeleting,
}: MeSettingsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      {/* DM Privacy */}
      <Section title={t('dm_privacy.title')} color={S.p}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {([
            { level: 'open' as const, label: t('dm_privacy.open'), desc: t('dm_privacy.open_desc'), color: '#4ADE80' },
            { level: 'profile_required' as const, label: t('dm_privacy.profile_required'), desc: t('dm_privacy.profile_required_desc'), color: '#7DD3FC' },
            { level: 'full_access' as const, label: t('dm_privacy.full_access'), desc: t('dm_privacy.full_access_desc'), color: '#F9A8A8' },
          ]).map(opt => {
            const on = dmPrivacy === opt.level
            return (
              <button key={opt.level} onClick={() => setDmPrivacy(opt.level)} style={{
                padding:'12px 14px', borderRadius:14, border:'1px solid '+(on ? opt.color+'66' : S.rule),
                background: on ? opt.color+'14' : S.bg2, cursor:'pointer', textAlign:'left',
                display:'flex', flexDirection:'column', gap:2,
              }}>
                <span style={{ fontSize:13, fontWeight:700, color: on ? opt.color : S.tx2 }}>{opt.label}</span>
                <span style={{ fontSize:11, color:S.tx3 }}>{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Saved messages */}
      <Section title={t('saved_messages.title')} color={S.lav}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {savedMsgs.map(msg => (
            <div key={msg.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, background:S.bg2, border:'1px solid '+S.rule }}>
              <span style={{ flex:1, fontSize:12, color:S.tx2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.text}</span>
              <button onClick={async () => { await supabase.from('saved_messages').delete().eq('id', msg.id); setSavedMsgs(prev => prev.filter(m => m.id !== msg.id)); showToast(t('saved_messages.deleted'), 'info') }} style={{ background:'none', border:'none', color:S.red, cursor:'pointer', fontSize:11, fontWeight:600, padding:4 }}>✕</button>
            </div>
          ))}
          {savedMsgs.length < 5 ? (
            <div style={{ display:'flex', gap:6 }}>
              <input value={newMsgText} onChange={e => setNewMsgText(e.target.value)} placeholder={t('saved_messages.placeholder')} style={{ flex:1, padding:'8px 10px', borderRadius:10, background:S.bg2, border:'1px solid '+S.rule, color:S.tx, fontSize:12, outline:'none' }} />
              <button onClick={async () => {
                if (!newMsgText.trim() || !user) return
                const { data } = await supabase.from('saved_messages').insert({ user_id: user.id, label: newMsgText.trim().slice(0,30), text: newMsgText.trim(), sort_order: savedMsgs.length }).select('id, label, text').single()
                if (data) { setSavedMsgs(prev => [...prev, data]); setNewMsgText('') }
              }} style={{ padding:'8px 14px', borderRadius:10, background:S.p2, border:'1px solid '+S.pbd, color:S.p, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {t('saved_messages.add')}
              </button>
            </div>
          ) : (
            <p style={{ fontSize:11, color:S.tx4, margin:0 }}>{t('saved_messages.max_reached')}</p>
          )}
        </div>
      </Section>

      {/* Delete account — danger zone */}
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
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid ' + S.redbd, background: S.bg2, color: S.tx, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('common.cancel')}
              </button>
              <button
                disabled={deleteInput !== 'DELETE' || deleting}
                onClick={async () => {
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
                }}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: deleteInput === 'DELETE' ? S.red : S.bg3, color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleteInput === 'DELETE' && !deleting ? 'pointer' : 'not-allowed', opacity: deleteInput === 'DELETE' && !deleting ? 1 : 0.5 }}
              >
                {deleting ? t('common.loading') : t('settings.delete_button')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
