import { Sparkles, Bookmark } from 'lucide-react'
import { colors } from '../../brand'
import { inp } from '../../hooks/useCreateSession'
import type { useCreateSession } from '../../hooks/useCreateSession'

const S = colors

type Props = { h: ReturnType<typeof useCreateSession> }

export default function CreateStepBasics({ h }: Props) {
  return (
    <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Template selector */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: S.tx, margin: '0 0 4px' }}>{h.t('session.choose_template')}</h2>
        <p style={{ fontSize: 13, color: S.tx3, margin: '0 0 12px' }}>{h.t('session.template_help')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Custom option */}
          <div
            onClick={() => h.pickTemplate({ slug: 'custom', label: 'Custom', meta: { tags: [], description: '' } })}
            style={{
              borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              border: '1px solid ' + (h._template === 'custom' ? S.pbd : S.rule2), background: S.bg1,
              transition: 'transform 0.15s', position: 'relative' as const,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ width: '100%', height: 80, background: `linear-gradient(135deg, ${S.bg2}, ${S.bg3})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={28} style={{ color: S.p, opacity: 0.7 }} />
            </div>
            <div style={{ padding: '8px 12px' }}>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: S.p }}>Custom</p>
              <p style={{ margin: 0, fontSize: 11, color: S.tx3 }}>{h.t('session.custom_desc')}</p>
            </div>
          </div>
          {/* Saved templates */}
          {h.savedTemplates.map(tpl => (
            <div key={tpl.slug} onClick={() => h.pickTemplate(tpl)} style={{
              borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              border: '1px solid ' + S.lavbd, background: S.bg1,
              transition: 'transform 0.15s', position: 'relative' as const,
            }}>
              <div style={{ width: '100%', height: 80, background: h.getSessionCover((tpl.meta as any)?.tags || [tpl.label]).bg, position: 'relative' as const }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <Bookmark size={16} strokeWidth={1.5} style={{ position: 'absolute', top: 8, right: 8, color: S.lav }} />
              </div>
              <div style={{ padding: '8px 12px' }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: S.lav }}>{tpl.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: S.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(tpl.meta as any)?.description || h.t('session.saved_template')}</p>
              </div>
            </div>
          ))}
          {/* Built-in templates (Dark Room, Powder Room, Techno) */}
          {h.sessionTemplates.map(tpl => {
            const meta = tpl.meta as any
            const coverUrl = meta?.cover_url
            return (
              <div key={tpl.slug} onClick={() => h.pickTemplate(tpl)} style={{
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                border: '1px solid ' + S.rule2, background: S.bg1,
                transition: 'transform 0.15s', position: 'relative' as const,
              }}>
                <div style={{ width: '100%', height: 80, background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : h.getSessionCover(meta?.tags || [tpl.label]).bg, position: 'relative' as const }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: S.tx }}>{tpl.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: S.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta?.description || ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.title_label')}</p>
        <input value={h.title} onChange={e => h.setTitle(e.target.value)} placeholder={h.t('session.title_placeholder')} style={inp} />
      </div>

      {/* Description */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.description_label')}</p>
        <textarea value={h.description} onChange={e => h.setDescription(e.target.value)} placeholder={h.t('session.description_placeholder')} rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
      </div>

      {/* Tags */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.tags_label')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {h.sessionTags.map(tag => {
            const on = h.selectedTags.includes(tag.label)
            return (
              <button key={tag.label} onClick={() => h.toggleTag(tag.label)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                border: on ? 'none' : '1px solid ' + S.rule,
                background: on ? S.grad : S.bg2, color: on ? S.tx : S.tx3, cursor: 'pointer',
              }}>{tag.label}</button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => h.setStep('rules')}
        disabled={!h.title}
        style={{
          padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: S.tx,
          background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden',
          cursor: !h.title ? 'not-allowed' : 'pointer', opacity: !h.title ? 0.5 : 1,
          boxShadow: '0 4px 20px ' + S.pbd, marginTop: 4,
        }}
      >
        {h.t('session.continue_button')}
      </button>
    </div>
  )
}
