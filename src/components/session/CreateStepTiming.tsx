import { Clock, Zap } from 'lucide-react'
import { colors } from '../../brand'
import { inp } from '../../hooks/useCreateSession'
import type { useCreateSession } from '../../hooks/useCreateSession'

const S = colors

type Props = { h: ReturnType<typeof useCreateSession> }

export default function CreateStepTiming({ h }: Props) {
  return (
    <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Timing */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.timing_label')}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => { h.setStartsNow(true); h.setStartsAt('') }} style={{
            flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            border: h.startsNow ? 'none' : '1px solid ' + S.rule,
            background: h.startsNow ? S.grad : S.bg2, color: h.startsNow ? '#fff' : S.tx3,
          }}>
            <Zap size={14} /> {h.t('session.start_now')}
          </button>
          <button onClick={() => {
            h.setStartsNow(false)
            if (!h.startsAt) {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              tomorrow.setHours(20, 0, 0, 0)
              h.setStartsAt(tomorrow.toISOString().slice(0, 16))
            }
          }} style={{
            flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            border: !h.startsNow ? 'none' : '1px solid ' + S.rule,
            background: !h.startsNow ? S.grad : S.bg2, color: !h.startsNow ? '#fff' : S.tx3,
          }}>
            <Clock size={14} /> {h.t('session.start_later')}
          </button>
        </div>
        {!h.startsNow && (
          <input type="datetime-local" value={h.startsAt} onChange={e => h.setStartsAt(e.target.value)} style={{ ...inp, marginBottom: 8, colorScheme: 'dark' }} />
        )}
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px' }}>{h.t('session.duration_label')}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 6, 8].map(hr => (
            <button key={hr} onClick={() => h.setDurationHours(hr)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: h.durationHours === hr ? 'none' : '1px solid ' + S.rule,
              background: h.durationHours === hr ? S.p2 : S.bg2, color: h.durationHours === hr ? S.p : S.tx3,
            }}>
              {hr}h
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.capacity_label')}</p>
        <input type="number" value={h.maxCapacity} onChange={e => h.setMaxCapacity(e.target.value ? parseInt(e.target.value) : '')} placeholder={h.t('session.capacity_placeholder')} min={2} max={50} style={inp} />
      </div>

      {/* Roles */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.tx3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{h.t('session.roles_label')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {h.roles.map(r => {
            const count = h.rolesWanted[r.label] || 0
            return (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: count > 0 ? S.p2 : S.bg2, border: '1px solid ' + (count > 0 ? S.pbd : S.rule) }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: count > 0 ? S.p : S.tx3 }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => h.setRolesWanted(prev => { const n = { ...prev }; if ((n[r.label] || 0) > 0) n[r.label] = (n[r.label] || 0) - 1; if (n[r.label] === 0) delete n[r.label]; return n })} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid ' + S.rule, background: S.bg, color: S.tx3, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>-</button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.tx, minWidth: 16, textAlign: 'center' }}>{count}</span>
                  <button onClick={() => h.setRolesWanted(prev => ({ ...prev, [r.label]: (prev[r.label] || 0) + 1 }))} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid ' + S.pbd, background: S.p2, color: S.p, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
                </div>
              </div>
            )
          })}
        </div>
        {Object.keys(h.rolesWanted).length > 0 && (
          <p style={{ fontSize: 11, color: S.tx3, margin: '6px 0 0' }}>
            {h.t('share.searching')} : {Object.entries(h.rolesWanted).map(([r, c]) => `${c} ${r}${Number(c) > 1 ? 's' : ''}`).join(', ')}
          </p>
        )}
      </div>

      <button
        onClick={() => h.setStep('visibility')}
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
