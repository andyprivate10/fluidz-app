import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageSquare, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { colors, fonts } from '../brand'
import PageFadeIn from '../components/PageFadeIn'
import OrbLayer from '../components/OrbLayer'

const S = colors

type SavedMsg = { id: string; label: string; text: string }

export default function MessageTemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [msgs, setMsgs] = useState<SavedMsg[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('saved_messages').select('id, label, text').eq('user_id', user.id).order('sort_order').then(({ data }) => {
      setMsgs(data || [])
      setLoading(false)
    })
  }, [user])

  async function addMsg() {
    if (!newText.trim() || !user || msgs.length >= 10) return
    const { data } = await supabase.from('saved_messages').insert({
      user_id: user.id,
      label: newText.trim().slice(0, 30),
      text: newText.trim(),
      sort_order: msgs.length,
    }).select('id, label, text').single()
    if (data) {
      setMsgs(prev => [...prev, data])
      setNewText('')
      showToast(t('msg_templates.added'), 'success')
    }
  }

  async function deleteMsg(id: string) {
    await supabase.from('saved_messages').delete().eq('id', id)
    setMsgs(prev => prev.filter(m => m.id !== id))
    showToast(t('saved_messages.deleted'), 'info')
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    await supabase.from('saved_messages').update({
      text: editText.trim(),
      label: editText.trim().slice(0, 30),
    }).eq('id', id)
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, text: editText.trim(), label: editText.trim().slice(0, 30) } : m))
    setEditingId(null)
    setEditText('')
  }

  if (!user) return null

  return (
    <PageFadeIn>
      <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, position: 'relative', maxWidth: 480, margin: '0 auto' }}>
        <OrbLayer />

        <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx2, cursor: 'pointer', padding: 4 }}>
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: 0 }}>
              {t('msg_templates.title')}
            </h1>
          </div>
          <p style={{ fontSize: 12, color: S.tx3, margin: '8px 0 0 32px' }}>{t('msg_templates.desc')}</p>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: S.tx3 }}>{t('common.loading')}</div>
          ) : (
            <>
              {/* Message list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {msgs.map(msg => (
                  <div key={msg.id} style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: 14, border: '1px solid ' + S.rule2 }}>
                    {editingId === msg.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} style={{ width: '100%', background: S.bg2, color: S.tx, border: '1px solid ' + S.pbd, borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(null); setEditText('') }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + S.rule, background: 'transparent', color: S.tx3, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={12} /> {t('common.cancel')}
                          </button>
                          <button onClick={() => saveEdit(msg.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + S.sagebd, background: S.sagebg, color: S.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> {t('common.save')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <MessageSquare size={14} strokeWidth={1.5} style={{ color: S.lav, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ flex: 1, fontSize: 13, color: S.tx2, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => { setEditingId(msg.id); setEditText(msg.text) }} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
                            <Edit3 size={14} strokeWidth={1.5} />
                          </button>
                          <button onClick={() => deleteMsg(msg.id)} style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', padding: 4 }}>
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {msgs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <MessageSquare size={36} strokeWidth={1} style={{ color: S.tx3, marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: S.tx2, margin: '0 0 4px' }}>{t('msg_templates.empty')}</p>
                    <p style={{ fontSize: 12, color: S.tx3, margin: 0 }}>{t('msg_templates.empty_desc')}</p>
                  </div>
                )}
              </div>

              {/* Add new */}
              {msgs.length < 10 && (
                <div style={{ background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: 14, border: '1px solid ' + S.rule2 }}>
                  <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder={t('msg_templates.placeholder')} rows={3} style={{ width: '100%', background: S.bg2, color: S.tx, border: '1px solid ' + S.rule, borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                  <button onClick={addMsg} disabled={!newText.trim()} style={{ padding: '10px 16px', borderRadius: 10, background: newText.trim() ? S.p2 : S.bg3, border: '1px solid ' + (newText.trim() ? S.pbd : S.rule), color: newText.trim() ? S.p : S.tx4, fontSize: 13, fontWeight: 700, cursor: newText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
                    <Plus size={14} /> {t('msg_templates.add')}
                  </button>
                </div>
              )}
              {msgs.length >= 10 && (
                <p style={{ fontSize: 11, color: S.tx4, textAlign: 'center' }}>{t('msg_templates.max_reached')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </PageFadeIn>
  )
}
