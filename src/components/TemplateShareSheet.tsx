import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from './Toast'
import { X } from 'lucide-react'
import { colors, fonts } from '../brand'
import { useTranslation } from 'react-i18next'

const S = colors

type TemplateItem = { id: string; title: string; tags: string[]; description: string }

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  onSelect: (session: TemplateItem) => void
}

export default function TemplateShareSheet({ open, onClose, userId, onSelect }: Props) {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || sessions.length > 0) return
    setLoading(true)
    supabase
      .from('sessions')
      .select('id, title, tags, description')
      .eq('host_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions(
          (data || []).map((s: any) => ({
            id: s.id,
            title: s.title || '',
            tags: s.tags || [],
            description: s.description || '',
          })),
        )
        setLoading(false)
      })
  }, [open, userId])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '70vh', background: S.bg1, borderRadius: '20px 20px 0 0', overflow: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: S.tx, margin: 0, fontFamily: fonts.hero }}>
            {t('dm.past_sessions')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: S.tx3, fontSize: 13 }}>...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: S.tx3, fontSize: 13 }}>{t('templates.empty')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s)
                  onClose()
                  showToast(t('dm.template_shared'), 'success')
                }}
                style={{ padding: '12px 14px', borderRadius: 14, background: S.bg2, border: '1px solid ' + S.rule, cursor: 'pointer', textAlign: 'left' }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{s.title}</p>
                {s.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.tags.map((tag: string) => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: S.lavbg, color: S.lav, border: '1px solid ' + S.lavbd }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
