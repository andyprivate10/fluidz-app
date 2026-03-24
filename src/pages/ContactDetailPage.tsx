import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import {ChevronRight, Edit3, Trash2, MessageCircle, ArrowLeft, Heart} from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { timeAgo } from '../lib/timing'
import { useTranslation } from 'react-i18next'
import IntentSelector from '../components/IntentSelector'

const S = colors

type Interaction = {
  id: string
  type: string
  meta: Record<string, string>
  created_at: string
}

export default function ContactDetailPage() {
  const { t } = useTranslation()

  const RELATIONS = [
    { level: 'connaissance', label: t('contacts.connaissance'), icon: '○', color: S.tx3 },
    { level: 'close', label: t('contacts.close'), icon: '◉', color: S.sage },
    { level: 'favori', label: t('contacts.favori'), icon: '★', color: S.p },
  ] as const

  const TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    co_event: { icon: '◎', label: t('interactions.co_event'), color: S.p },
    dm: { icon: '↗', label: 'DM', color: S.blue },
    added_contact: { icon: '+', label: t('interactions.added_contact'), color: S.sage },
    relation_change: { icon: '⟳', label: t('interactions.relation_change'), color: S.orange },
    voted: { icon: '▣', label: t('interactions.vote_label'), color: S.tx3 },
  }

  const { contactUserId } = useParams<{ contactUserId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ display_name: string; profile_json: Record<string, unknown> } | null>(null)
  const [contact, setContact] = useState<{ id: string; relation_level: string; notes: string | null; created_at: string } | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [commonSessions, setCommonSessions] = useState<{ id: string; title: string; status: string }[]>([])
  const [activeSessions, setActiveSessions] = useState<{ id: string; title: string }[]>([])
  const [inviting, setInviting] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [myIntents, setMyIntents] = useState<string[]>([])
  const [matchedIntents, setMatchedIntents] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!contactUserId) return
    loadData()
  }, [contactUserId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    setMyUserId(user.id)

    const [{ data: prof }, { data: ct }, { data: interactions }] = await Promise.all([
      supabase.from('user_profiles').select('display_name, profile_json').eq('id', contactUserId).maybeSingle(),
      supabase.from('contacts').select('id, relation_level, notes, created_at').eq('user_id', user.id).eq('contact_user_id', contactUserId).maybeSingle(),
      supabase.from('interaction_log').select('id, type, meta, created_at').eq('user_id', user.id).eq('target_user_id', contactUserId).order('created_at', { ascending: false }).limit(50),
    ])

    setProfile(prof ? { display_name: prof.display_name, profile_json: (prof.profile_json || {}) as Record<string, unknown> } : null)
    setContact(ct)
    setNotesText(ct?.notes || '')
    setInteractions(interactions || [])

    // Load common sessions (both users were accepted)
    const { data: myApps } = await supabase.from('applications').select('session_id').eq('applicant_id', user.id).in('status', ['accepted', 'checked_in'])
    const { data: theirApps } = await supabase.from('applications').select('session_id').eq('applicant_id', contactUserId).in('status', ['accepted', 'checked_in'])
    // Also check sessions I host
    const { data: myHosted } = await supabase.from('sessions').select('id').eq('host_id', user.id)
    const { data: theyHosted } = await supabase.from('sessions').select('id').eq('host_id', contactUserId)

    const mySessionIds = new Set([...(myApps || []).map(a => a.session_id), ...(myHosted || []).map(s => s.id)])
    const theirSessionIds = new Set([...(theirApps || []).map(a => a.session_id), ...(theyHosted || []).map(s => s.id)])
    const commonIds = [...mySessionIds].filter(id => theirSessionIds.has(id))

    if (commonIds.length > 0) {
      const { data: sessions } = await supabase.from('sessions').select('id, title, status').in('id', commonIds).order('created_at', { ascending: false })
      setCommonSessions(sessions || [])
    }
    // Load my active sessions for invite
    const { data: mySessions } = await supabase.from('sessions').select('id, title').eq('host_id', user.id).eq('status', 'open')
    setActiveSessions(mySessions || [])

    // Load intents
    const { data: intentRow } = await supabase.from('intents').select('intents').eq('user_id', user.id).eq('target_user_id', contactUserId).maybeSingle()
    setMyIntents(intentRow?.intents || [])

    // Load intent matches
    const a = user.id < contactUserId! ? user.id : contactUserId!
    const b = user.id < contactUserId! ? contactUserId! : user.id
    const { data: matchRow } = await supabase.from('intent_matches').select('matched_intents').eq('user_a', a).eq('user_b', b).maybeSingle()
    setMatchedIntents(matchRow?.matched_intents || [])

    // Load favorite
    const { data: favRow } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('target_user_id', contactUserId).maybeSingle()
    setIsFavorite(!!favRow)

    setLoading(false)
  }

  async function updateRelation(level: string) {
    if (!contact) return
    await supabase.from('contacts').update({ relation_level: level }).eq('id', contact.id)
    setContact({ ...contact, relation_level: level })
    // Log relation change
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('interaction_log').insert({ user_id: user.id, target_user_id: contactUserId, type: 'relation_change', meta: { new_level: level } })
    }
    showToast(t('contacts.notes_saved'), 'success')
  }

  async function saveNotes() {
    if (!contact) return
    await supabase.from('contacts').update({ notes: notesText.trim() || null }).eq('id', contact.id)
    setContact({ ...contact, notes: notesText.trim() || null })
    setEditingNotes(false)
    showToast(t('contacts.notes_saved'), 'success')
  }

  async function inviteToSession(sessionId: string) {
    setInviting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !contactUserId) { setInviting(false); return }
    const sess = activeSessions.find(s => s.id === sessionId)
    await supabase.from('notifications').insert({
      user_id: contactUserId,
      session_id: sessionId,
      type: 'session_invite',
      title: t('notifications.invite_title'),
      body: t('notifications.invite_body', { name: profile?.display_name || t('common.someone'), title: sess?.title || t('common.a_session') }),
      href: '/session/' + sessionId,
    })
    showToast(t('session.invite_sent'), 'success')
    setInviting(false)
  }

  async function removeContact() {
    if (!contact || !window.confirm(t('host.confirm_remove_contact'))) return
    await supabase.from('contacts').delete().eq('id', contact.id)
    navigate('/contacts')
  }

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid '+S.pbd, borderTopColor: S.p, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!profile) return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back_label')}</button>
      <p style={{ color: S.red, marginTop: 16 }}>{t('profile.not_found')}</p>
    </div>
  )

  const pj = profile.profile_json
  

  return (
    <div style={{ background: S.bg, minHeight: '100vh', position: 'relative' as const, maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '40px 20px 20px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back_label')}</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {pj.avatar_url ? (
            <img src={pj.avatar_url as string} alt="" loading="lazy" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + S.rule }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {profile.display_name[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx, margin: 0 }}>{profile.display_name}</h1>
              <VibeScoreBadge userId={contactUserId!} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {pj.age ? <span style={{ fontSize: 12, color: S.tx3 }}>{`${pj.age}`} ans</span> : null}
              {pj.role ? <span style={{ fontSize: 12, color: S.p, fontWeight: 600 }}>{`${pj.role}`}</span> : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={async () => {
              if (!myUserId) return
              if (isFavorite) {
                await supabase.from('favorites').delete().eq('user_id', myUserId).eq('target_user_id', contactUserId)
                setIsFavorite(false)
              } else {
                await supabase.from('favorites').upsert({ user_id: myUserId, target_user_id: contactUserId }, { onConflict: 'user_id,target_user_id' })
                setIsFavorite(true)
              }
            }} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid ' + (isFavorite ? S.pbd : S.rule), background: isFavorite ? S.p2 : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Heart size={16} strokeWidth={1.5} fill={isFavorite ? S.p : 'none'} style={{ color: isFavorite ? S.p : S.tx3 }} />
            </button>
            <button onClick={() => navigate('/profile/' + contactUserId)} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, color: S.tx3, border: '1px solid ' + S.rule, background: 'transparent', cursor: 'pointer' }}>
              Profil <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>

        {/* Relation selector */}
        {contact && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {RELATIONS.map(r => {
              const active = contact.relation_level === r.level
              return (
                <button key={r.level} onClick={() => updateRelation(r.level)} style={{
                  flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid ' + (active ? r.color + '55' : S.rule),
                  background: active ? r.color + '14' : 'transparent',
                  color: active ? r.color : S.tx4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {r.icon} {r.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Notes */}
        <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('contacts.notes_label')}</span>
            <button onClick={() => setEditingNotes(!editingNotes)} style={{ background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 2 }}>
              <Edit3 size={14} />
            </button>
          </div>
          {editingNotes ? (
            <div>
              <textarea value={notesText} onChange={e => setNotesText(e.target.value)} onBlur={saveNotes} placeholder={t('contacts.notes_placeholder')} maxLength={500} rows={3} style={{ width: '100%', padding: 10, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 10, color: S.tx, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              <button onClick={saveNotes} style={{ marginTop: 6, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: S.sagebg, color: S.sage, border: '1px solid ' + S.sagebd, cursor: 'pointer' }}>{t('contacts.save_btn')}</button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: contact?.notes ? S.tx2 : S.tx4, margin: 0, lineHeight: 1.5 }}>
              {contact?.notes || t('contacts.no_notes')}
            </p>
          )}
        </div>

        {/* Intent match card */}
        {matchedIntents.length > 0 && (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid ' + S.sagebd, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.sage, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{t('intents.match_title')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {matchedIntents.map(slug => (
                <span key={slug} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: S.sage, background: S.sagebg, border: '1px solid ' + S.sagebd }}>{t('intents.' + slug)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Intentions */}
        <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.p, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t('intents.title')}</div>
          <p style={{ fontSize: 11, color: S.tx4, margin: '0 0 10px' }}>{t('intents.select_hint')}</p>
          <IntentSelector
            selected={myIntents}
            compact
            onChange={async (slugs) => {
              setMyIntents(slugs)
              if (!myUserId) return
              await supabase.from('intents').upsert(
                { user_id: myUserId, target_user_id: contactUserId!, intents: slugs, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,target_user_id' }
              )
              showToast(t('intents.updated'), 'success')
              // Reload matches
              const a = myUserId < contactUserId! ? myUserId : contactUserId!
              const b = myUserId < contactUserId! ? contactUserId! : myUserId
              const { data: matchRow } = await supabase.from('intent_matches').select('matched_intents').eq('user_a', a).eq('user_b', b).maybeSingle()
              setMatchedIntents(matchRow?.matched_intents || [])
            }}
          />
        </div>

        {/* Stats */}
        {contact && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{interactions.filter(i => i.type === 'co_event').length}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Events ensemble</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{interactions.filter(i => i.type === 'dm').length}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>DMs</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{timeAgo(contact.created_at)}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Ajouté</div>
            </div>
          </div>
        )}

        {/* Common sessions */}
        {commonSessions.length > 0 && (
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions en commun ({commonSessions.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {commonSessions.map(s => (
                <button key={s.id} onClick={() => navigate('/session/' + s.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10, background: S.bg2, border: '1px solid ' + S.rule,
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.tx }}>{s.title}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    color: s.status === 'open' ? S.sage : s.status === 'ended' ? S.red : S.tx4,
                    background: s.status === 'open' ? S.sagebg : s.status === 'ended' ? S.redbg : S.bg3,
                  }}>{t('status.' + s.status)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historique</span>

          {interactions.length === 0 ? (
            <p style={{ fontSize: 13, color: S.tx4, margin: '12px 0 0' }}>{t('contacts.no_interactions')}</p>
          ) : (
            <div style={{ marginTop: 12, position: 'relative', paddingLeft: 20 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 2, background: S.rule, borderRadius: 1 }} />

              {interactions.slice(0, 20).map((inter, i) => {
                const t = TYPE_LABELS[inter.type] || { icon: '•', label: inter.type, color: S.tx3 }
                return (
                  <div key={inter.id} style={{ display: 'flex', gap: 10, marginBottom: i < interactions.length - 1 ? 14 : 0, position: 'relative' }}>
      <OrbLayer />
                    {/* Dot */}
                    <div style={{ position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%', background: S.bg1, border: '2px solid ' + t.color, zIndex: 1 }} />
                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{t.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: S.tx }}>{t.label}</span>
                      </div>
                      {inter.meta?.session_title && (
                        <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>{inter.meta.session_title}</p>
                      )}
                      {inter.meta?.new_level && (
                        <p style={{ fontSize: 11, color: S.tx3, margin: '2px 0 0' }}>→ {RELATIONS.find(r => r.level === inter.meta.new_level)?.label || inter.meta.new_level}</p>
                      )}
                      <p style={{ fontSize: 10, color: S.tx4, margin: '2px 0 0' }}>{timeAgo(inter.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Direct DM */}
        <button onClick={() => navigate('/dm/' + contactUserId)} style={{ width: '100%', padding: '12px', borderRadius: 12, background: S.bg1, border: '1px solid '+S.pbd, color: S.p, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MessageCircle size={15} strokeWidth={1.5} /> {t('contacts.send_dm')}
        </button>

        {/* Invite to session */}
        {activeSessions.length > 0 && (
          <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2, borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inviter à une session</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {activeSessions.map(s => (
                <button key={s.id} onClick={() => inviteToSession(s.id)} disabled={inviting} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: '1px solid ' + S.pbd, background: S.p2, color: S.p,
                  cursor: inviting ? 'not-allowed' : 'pointer', textAlign: 'left',
                }}>
                  Inviter à "{s.title}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Remove */}
        {contact && (
          <button onClick={removeContact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid ' + S.redbd, color: S.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: 0.7 }}>
            <Trash2 size={14} /> {t('contacts.remove_contact')}
          </button>
        )}
      </div>
    </div>
  )
}
