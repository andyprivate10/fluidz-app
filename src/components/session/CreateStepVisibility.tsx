import { Eye, EyeOff, Bookmark } from 'lucide-react'
import { colors } from '../../brand'
import type { useCreateSession } from '../../hooks/useCreateSession'

const S = colors

type Props = { h: ReturnType<typeof useCreateSession> }

export default function CreateStepVisibility({ h }: Props) {
  return (
    <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Public / Private toggle */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
          {h.t('session.visibility_label')}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => h.setIsPublic(true)}
            style={{
              flex: 1, padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
              border: h.isPublic ? '2px solid ' + S.p : '1px solid ' + S.rule,
              background: h.isPublic ? S.p2 : S.bg2, textAlign: 'left',
            }}
          >
            <Eye size={20} style={{ color: h.isPublic ? S.p : S.tx3, marginBottom: 8 }} />
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: h.isPublic ? S.p : S.tx }}>{h.t('session.public_session')}</p>
            <p style={{ margin: 0, fontSize: 12, color: S.tx3, lineHeight: 1.4 }}>{h.t('session.publish_help')}</p>
          </button>
          <button
            onClick={() => h.setIsPublic(false)}
            style={{
              flex: 1, padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
              border: !h.isPublic ? '2px solid ' + S.lav : '1px solid ' + S.rule,
              background: !h.isPublic ? S.lavbg : S.bg2, textAlign: 'left',
            }}
          >
            <EyeOff size={20} style={{ color: !h.isPublic ? S.lav : S.tx3, marginBottom: 8 }} />
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: !h.isPublic ? S.lav : S.tx }}>{h.t('session.private_session')}</p>
            <p style={{ margin: 0, fontSize: 12, color: S.tx3, lineHeight: 1.4 }}>{h.t('session.keep_secret_desc')}</p>
          </button>
        </div>
      </div>

      {h.error && <p style={{ color: S.p, fontSize: 13, margin: '0 0 4px', padding: '10px 14px', background: S.p3, borderRadius: 10 }}>{h.error}</p>}

      {/* Publish button */}
      <button
        onClick={h.create}
        disabled={h.loading || !h.title || !h.approxArea}
        className="btn-shimmer"
        style={{
          padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: S.tx,
          background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden',
          cursor: h.loading || !h.title || !h.approxArea ? 'not-allowed' : 'pointer',
          opacity: h.loading || !h.title || !h.approxArea ? 0.5 : 1,
          boxShadow: '0 4px 20px ' + S.pbd, marginTop: 4,
        }}
      >
        {h.loading ? h.t('session.creating') : h.t('session.publish')}
      </button>

      {/* Save as template */}
      <button
        onClick={h.saveAsTemplate}
        disabled={!h.title}
        style={{
          padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 13,
          border: '1px solid ' + S.lavbd, background: 'transparent', color: S.lav,
          cursor: !h.title ? 'not-allowed' : 'pointer', opacity: !h.title ? 0.5 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Bookmark size={14} />
        {h.t('session.save_as_template')}
      </button>
    </div>
  )
}
