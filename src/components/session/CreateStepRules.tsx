import { colors } from '../../brand'
import { inp } from '../../hooks/useCreateSession'
import type { useCreateSession } from '../../hooks/useCreateSession'

const S = colors

type Props = { h: ReturnType<typeof useCreateSession> }

export default function CreateStepRules({ h }: Props) {
  return (
    <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
          {h.t('session.host_rules_label')}
        </p>
        <textarea
          value={h.hostRules}
          onChange={e => h.setHostRules(e.target.value)}
          placeholder={h.t('session.host_rules_placeholder')}
          rows={6}
          style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: 11, color: S.tx3, margin: '6px 0 0' }}>
          {h.t('session.host_rules_default')}
        </p>
      </div>

      <button
        onClick={() => h.setStep('address')}
        style={{
          padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff',
          background: S.grad, border: 'none', position: 'relative' as const, overflow: 'hidden',
          cursor: 'pointer', boxShadow: '0 4px 20px ' + S.pbd, marginTop: 4,
        }}
      >
        {h.t('session.continue_button')}
      </button>
    </div>
  )
}
