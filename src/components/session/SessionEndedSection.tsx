import { useNavigate } from 'react-router-dom'
import { Users, Save } from 'lucide-react'
import { colors } from '../../brand'
import { supabase } from '../../lib/supabase'
import { showToast } from '../Toast'
import { useTranslation } from 'react-i18next'
import type { Session, Member } from '../../hooks/useSessionData'
import type { User } from '@supabase/supabase-js'

const S = colors

interface Props {
  session: Session
  sessionId: string
  isHost: boolean
  currentUser: User | null
  myApp: { status: string } | null
  members: Member[]
  reviewSummary: { avg: number; count: number; topVibes: string[] } | null
}

export default function SessionEndedSection({ session, sessionId, isHost, currentUser, myApp, members, reviewSummary }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (session.status !== 'ended') return null

  return (
    <>
      {/* Review summary */}
      {reviewSummary && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: S.tx2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('session.reviews_title')}</span>
              <span style={{ fontSize: 11, color: S.tx2 }}>{reviewSummary.count} avis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: S.p }}>{reviewSummary.avg}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 18, color: n <= Math.round(reviewSummary.avg) ? S.p : S.tx3 }}>★</span>
                ))}
              </div>
            </div>
            {reviewSummary.topVibes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {reviewSummary.topVibes.map(v => {
                  const vibeMap: Record<string, string> = { fun: 'Fun', safe: 'Safe', intense: 'Intense', chill: 'Chill', respectful: 'Respectueux', awkward: 'Awkward', hot: 'Hot', welcoming: 'Accueillant' }
                  return <span key={v} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: S.bg2, color: S.tx2, border: '1px solid '+S.rule }}>{vibeMap[v] || v}</span>
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review CTA */}
      {(isHost || (myApp && (myApp.status === 'accepted' || myApp.status === 'checked_in'))) && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.amberbd, borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: S.tx, margin: '0 0 6px' }}>{t('session.how_was_it')}</p>
            <p style={{ fontSize: 12, color: S.tx2, margin: '0 0 14px' }}>{t('session.review_anonymous_help')}</p>
            <button onClick={() => navigate('/session/' + sessionId + '/review')} style={{ width: '100%', padding: 14, background: S.p, border: 'none', borderRadius: 12, color: S.tx, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px '+S.pbd }}>
              {t('session.leave_review')}
            </button>
          </div>
        </div>
      )}

      {/* Save as custom template (host only) */}
      {isHost && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={async () => {
              if (!currentUser) return
              const { data: pj } = await supabase.from('user_profiles').select('profile_json').eq('id', currentUser.id).maybeSingle()
              const profileJson = (pj?.profile_json || {}) as Record<string, unknown>
              const savedTemplates = Array.isArray(profileJson.saved_templates) ? [...profileJson.saved_templates] : []
              const tpl = {
                id: sessionId,
                title: session.title,
                description: session.description,
                tags: session.tags || [],
                approx_area: session.approx_area,
                lineup_json: session.lineup_json,
                saved_at: new Date().toISOString(),
              }
              // Avoid duplicates
              if (savedTemplates.some((t: any) => t.id === sessionId)) {
                showToast(t('templates.already_saved'), 'info')
                return
              }
              savedTemplates.push(tpl)
              await supabase.from('user_profiles').update({ profile_json: { ...profileJson, saved_templates: savedTemplates } }).eq('id', currentUser.id)
              showToast(t('templates.saved_toast'), 'success')
            }}
            style={{
              width: '100%', padding: 14, borderRadius: 14, cursor: 'pointer',
              background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid ' + S.lavbd, color: S.lav,
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Save size={16} strokeWidth={1.5} />
            {t('templates.save_as_template')}
          </button>
        </div>
      )}

      {/* Create group from session (host only) */}
      {isHost && members.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={async () => {
              try {
                const memberIds = members.map(m => m.applicant_id)
                const { data: newGroup, error } = await supabase.from('contact_groups').insert({
                  owner_id: currentUser!.id,
                  name: session.title || 'Session group',
                  description: session.approx_area || '',
                  color: S.p,
                }).select('id').single()
                if (error || !newGroup) { showToast('Error', 'error'); return }
                await supabase.from('contact_group_members').insert(
                  memberIds.map(uid => ({ group_id: newGroup.id, contact_user_id: uid }))
                )
                showToast(t('session.group_created'), 'success')
                navigate('/groups')
              } catch { showToast('Error', 'error') }
            }}
            style={{
              width: '100%', padding: 16, borderRadius: 14, cursor: 'pointer',
              background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid ' + S.sagebd, color: S.sage,
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Users size={16} strokeWidth={1.5} />
            {t('session.create_group_from_session')}
          </button>
          <p style={{ fontSize: 11, color: S.tx3, textAlign: 'center', margin: '6px 0 0' }}>
            {t('session.create_group_desc', { count: members.length })}
          </p>
        </div>
      )}
    </>
  )
}
