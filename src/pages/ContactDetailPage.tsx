import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { VibeScoreBadge } from '../components/VibeScoreBadge'
import { ChevronRight, Edit3, Trash2 } from 'lucide-react'

const S = {
  bg0:'#0C0A14',bg1:'#16141F',bg2:'#1F1D2B',bg3:'#2A2740',
  tx:'#F0EDFF',tx2:'#B8B2CC',tx3:'#7E7694',tx4:'#453F5C',
  border:'#2A2740',p300:'#F9A8A8',p400:'#F47272',green:'#4ADE80',yellow:'#FBBF24',red:'#F87171',blue:'#7DD3FC',
  grad:'linear-gradient(135deg,#F9A8A8,#F47272)',
}

const RELATIONS = [
  { level: 'connaissance', label: 'Connaissance', icon: '👋', color: S.tx3 },
  { level: 'close', label: 'Close', icon: '🤝', color: S.green },
  { level: 'favori', label: 'Favori', icon: '⭐', color: S.p300 },
] as const

type Interaction = {
  id: string
  type: string
  meta: Record<string, string>
  created_at: string
}

const TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  co_event: { icon: '🎉', label: 'Même event', color: S.p300 },
  dm: { icon: '💬', label: 'DM envoyé', color: S.blue },
  added_contact: { icon: '➕', label: 'Ajouté au carnet', color: S.green },
  relation_change: { icon: '🔄', label: 'Relation modifiée', color: S.yellow },
  voted: { icon: '🗳️', label: 'Vote', color: S.tx3 },
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

export default function ContactDetailPage() {
  const { contactUserId } = useParams<{ contactUserId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ display_name: string; profile_json: Record<string, unknown> } | null>(null)
  const [contact, setContact] = useState<{ id: string; relation_level: string; notes: string | null; created_at: string } | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [activeSessions, setActiveSessions] = useState<{ id: string; title: string }[]>([])
  const [inviting, setInviting] = useState(false)
  const [notesText, setNotesText] = useState('')

  useEffect(() => {
    if (!contactUserId) return
    loadData()
  }, [contactUserId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const [{ data: prof }, { data: ct }, { data: interactions }] = await Promise.all([
      supabase.from('user_profiles').select('display_name, profile_json').eq('id', contactUserId).maybeSingle(),
      supabase.from('contacts').select('id, relation_level, notes, created_at').eq('user_id', user.id).eq('contact_user_id', contactUserId).maybeSingle(),
      supabase.from('interaction_log').select('id, type, meta, created_at').eq('user_id', user.id).eq('target_user_id', contactUserId).order('created_at', { ascending: false }).limit(50),
    ])

    setProfile(prof ? { display_name: prof.display_name, profile_json: (prof.profile_json || {}) as Record<string, unknown> } : null)
    setContact(ct)
    setNotesText(ct?.notes || '')
    setInteractions(interactions || [])
    // Load my active sessions for invite
    const { data: mySessions } = await supabase.from('sessions').select('id, title').eq('host_id', user.id).eq('status', 'open')
    setActiveSessions(mySessions || [])
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
    showToast('Relation mise à jour', 'success')
  }

  async function saveNotes() {
    if (!contact) return
    await supabase.from('contacts').update({ notes: notesText.trim() || null }).eq('id', contact.id)
    setContact({ ...contact, notes: notesText.trim() || null })
    setEditingNotes(false)
    showToast('Notes sauvegardées', 'success')
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
      title: '📩 Tu es invité !',
      body: (profile?.display_name || 'Quelqu\'un') + ' t\'invite à "' + (sess?.title || 'une session') + '"',
      href: '/session/' + sessionId,
    })
    showToast('Invitation envoyée !', 'success')
    setInviting(false)
  }

  async function removeContact() {
    if (!contact || !window.confirm('Retirer du carnet ?')) return
    await supabase.from('contacts').delete().eq('id', contact.id)
    navigate('/contacts')
  }

  if (loading) return (
    <div style={{ background: S.bg0, minHeight: '100vh', display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #F9A8A844', borderTopColor: '#F9A8A8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!profile) return (
    <div style={{ background: S.bg0, minHeight: '100vh', padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer' }}>← Retour</button>
      <p style={{ color: S.red, marginTop: 16 }}>Profil introuvable.</p>
    </div>
  )

  const pj = profile.profile_json
  

  return (
    <div style={{ background: S.bg0, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '40px 20px 20px', borderBottom: '1px solid ' + S.border }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>← Retour</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {pj.avatar_url ? (
            <img src={pj.avatar_url as string} alt="" style={{ width: 56, height: 56, borderRadius: '28%', objectFit: 'cover', border: '2px solid ' + S.border }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '28%', background: S.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {profile.display_name[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: S.tx, margin: 0 }}>{profile.display_name}</h1>
              <VibeScoreBadge userId={contactUserId!} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {pj.age ? <span style={{ fontSize: 12, color: S.tx3 }}>{`${pj.age}`} ans</span> : null}
              {pj.role ? <span style={{ fontSize: 12, color: S.p300, fontWeight: 600 }}>{`${pj.role}`}</span> : null}
            </div>
          </div>
          <button onClick={() => navigate('/profile/' + contactUserId)} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, color: S.tx3, border: '1px solid ' + S.border, background: 'transparent', cursor: 'pointer' }}>
            Profil <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
          </button>
        </div>

        {/* Relation selector */}
        {contact && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {RELATIONS.map(r => {
              const active = contact.relation_level === r.level
              return (
                <button key={r.level} onClick={() => updateRelation(r.level)} style={{
                  flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid ' + (active ? r.color + '55' : S.border),
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
        <div style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes privées</span>
            <button onClick={() => setEditingNotes(!editingNotes)} style={{ background: 'none', border: 'none', color: S.tx4, cursor: 'pointer', padding: 2 }}>
              <Edit3 size={14} />
            </button>
          </div>
          {editingNotes ? (
            <div>
              <textarea value={notesText} onChange={e => setNotesText(e.target.value)} placeholder="Notes perso (privées)..." maxLength={500} rows={3} style={{ width: '100%', padding: 10, background: S.bg2, border: '1px solid ' + S.border, borderRadius: 10, color: S.tx, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={saveNotes} style={{ marginTop: 6, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: S.green + '22', color: S.green, border: '1px solid ' + S.green + '44', cursor: 'pointer' }}>Sauvegarder</button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: contact?.notes ? S.tx2 : S.tx4, margin: 0, lineHeight: 1.5 }}>
              {contact?.notes || 'Aucune note'}
            </p>
          )}
        </div>

        {/* Stats */}
        {contact && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: S.bg1, border: '1px solid ' + S.border, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{interactions.filter(i => i.type === 'co_event').length}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Events ensemble</div>
            </div>
            <div style={{ flex: 1, background: S.bg1, border: '1px solid ' + S.border, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{interactions.filter(i => i.type === 'dm').length}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>DMs</div>
            </div>
            <div style={{ flex: 1, background: S.bg1, border: '1px solid ' + S.border, borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.tx }}>{timeAgo(contact.created_at)}</div>
              <div style={{ fontSize: 10, color: S.tx3, fontWeight: 600 }}>Ajouté</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historique</span>

          {interactions.length === 0 ? (
            <p style={{ fontSize: 13, color: S.tx4, margin: '12px 0 0' }}>Aucune interaction enregistrée</p>
          ) : (
            <div style={{ marginTop: 12, position: 'relative', paddingLeft: 20 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 2, background: S.border, borderRadius: 1 }} />

              {interactions.slice(0, 20).map((inter, i) => {
                const t = TYPE_LABELS[inter.type] || { icon: '•', label: inter.type, color: S.tx3 }
                return (
                  <div key={inter.id} style={{ display: 'flex', gap: 10, marginBottom: i < interactions.length - 1 ? 14 : 0, position: 'relative' }}>
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

        {/* Invite to session */}
        {activeSessions.length > 0 && (
          <div style={{ background: S.bg1, border: '1px solid ' + S.border, borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inviter à une session</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {activeSessions.map(s => (
                <button key={s.id} onClick={() => inviteToSession(s.id)} disabled={inviting} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: '1px solid ' + S.p300 + '44', background: S.p300 + '14', color: S.p300,
                  cursor: inviting ? 'not-allowed' : 'pointer', textAlign: 'left',
                }}>
                  📩 Inviter à "{s.title}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Remove */}
        {contact && (
          <button onClick={removeContact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid ' + S.red + '33', color: S.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: 0.7 }}>
            <Trash2 size={14} /> Retirer du carnet
          </button>
        )}
      </div>
    </div>
  )
}
