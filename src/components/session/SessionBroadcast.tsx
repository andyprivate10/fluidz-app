import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, fonts } from '../../brand'
import { Megaphone, Pencil, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const S = colors

interface Props {
  sessionId: string
  broadcast: string | undefined
  isHost: boolean
}

export default function SessionBroadcast({ sessionId, broadcast, isHost }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState(broadcast || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [live, setLive] = useState(broadcast || '')

  useEffect(() => { setLive(broadcast || ''); setText(broadcast || '') }, [broadcast])

  // Realtime subscription for broadcast updates
  useEffect(() => {
    const channel = supabase.channel('broadcast-' + sessionId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: 'id=eq.' + sessionId }, (payload) => {
        const newBroadcast = (payload.new as { broadcast?: string }).broadcast || ''
        setLive(newBroadcast)
        if (!editing) setText(newBroadcast)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, editing])

  async function save() {
    setSaving(true)
    await supabase.from('sessions').update({ broadcast: text.trim() }).eq('id', sessionId)
    setLive(text.trim())
    setEditing(false)
    setSaving(false)
  }

  function cancel() { setText(live); setEditing(false) }

  // Nothing to show if empty and not host
  if (!live && !isHost) return null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${S.p}18, ${S.p}08)`,
      border: '1px solid ' + S.p + '33',
      borderRadius: 14, padding: '12px 16px', margin: '0 0 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Megaphone size={18} style={{ color: S.p, flexShrink: 0 }} />
      {editing ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={text} onChange={e => setText(e.target.value)}
            maxLength={100} autoFocus
            placeholder={t('session.broadcast_placeholder')}
            style={{ flex: 1, background: S.bg2, border: '1px solid ' + S.rule, borderRadius: 8, padding: '6px 10px', color: S.tx, fontSize: 13, outline: 'none' }}
          />
          <button onClick={save} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Check size={18} style={{ color: S.sage }} />
          </button>
          <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} style={{ color: S.tx4 }} />
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: S.tx, fontFamily: fonts.body }}>
            {live || (isHost ? t('session.broadcast_empty') : '')}
          </span>
          {isHost && (
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 'auto' }}>
              <Pencil size={14} style={{ color: S.tx4 }} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
