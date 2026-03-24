import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { colors, glassCard } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { ArrowLeft, Repeat, FileText } from 'lucide-react'
import { getSessionAccentColor } from '../lib/sessionCover'

const S = colors

type TemplateSession = {
  id: string
  title: string
  description: string
  tags: string[]
  created_at: string
}

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<TemplateSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('sessions')
      .select('id, title, description, tags, created_at')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSessions(
          (data || []).map((s: any) => ({
            id: s.id,
            title: s.title || t('common.anonymous'),
            description: s.description || '',
            tags: s.tags || [],
            created_at: s.created_at,
          })),
        )
        setLoading(false)
      })
  }, [user])

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <OrbLayer />
      {/* Header */}
      <header style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid ' + S.rule, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: S.tx3, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: S.tx, margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {t('templates.title')}
        </h1>
      </header>

      <div style={{ padding: '16px 16px 80px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ ...glassCard, height: 80 }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FileText size={40} strokeWidth={1} style={{ color: S.tx3, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: S.tx2 }}>{t('templates.empty')}</p>
            <p style={{ fontSize: 13, color: S.tx3, marginTop: 4 }}>{t('templates.empty_desc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => {
              const accent = getSessionAccentColor(s.tags)
              return (
                <div key={s.id} style={{ ...glassCard, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: S.tx, margin: 0 }}>{s.title}</p>
                      {s.description && (
                        <p style={{ fontSize: 12, color: S.tx2, margin: '4px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, color: accent, background: accent + '18', border: '1px solid ' + accent + '44', fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/session/create?tpl=' + s.id)}
                    style={{ alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 10, border: '1px solid ' + S.lavbd, background: S.lavbg, color: S.lav, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Repeat size={12} /> {t('templates.reuse')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
