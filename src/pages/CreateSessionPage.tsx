import { ArrowLeft } from 'lucide-react'
import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useCreateSession } from '../hooks/useCreateSession'
import { useAuth } from '../contexts/AuthContext'
import GhostBlockedModal from '../components/GhostBlockedModal'
import CreateStepBasics from '../components/session/CreateStepBasics'
import CreateStepRules from '../components/session/CreateStepRules'
import CreateStepAddress from '../components/session/CreateStepAddress'
import CreateStepTiming from '../components/session/CreateStepTiming'
import CreateStepVisibility from '../components/session/CreateStepVisibility'

const S = colors

export default function CreateSessionPage() {
  const h = useCreateSession()
  const { user } = useAuth()
  const isGhost = user?.is_anonymous === true

  if (isGhost) {
    return (
      <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 480, margin: '0 auto', position: 'relative' as const }}>
        <OrbLayer />
        <GhostBlockedModal open={true} onClose={() => h.navigate(-1 as any)} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, paddingBottom: 96, maxWidth: 480, margin: '0 auto', position: 'relative' as const }}>
      <OrbLayer />
      <div style={{ padding: '40px 20px 16px', borderBottom: '1px solid ' + S.rule, background: 'rgba(13,12,22,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <button
          onClick={() => h.stepIdx === 0 ? h.navigate(-1 as any) : h.setStep(h.steps[h.stepIdx - 1] as any)}
          style={{ background: 'none', border: 'none', color: S.tx3, fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />
          {h.t('common.back')}
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: fonts.hero, color: S.tx, margin: '0 0 4px' }}>
          {h.t('session.new_session')}
        </h1>
        <p style={{ fontSize: 13, color: S.tx3, margin: 0 }}>
          {h.t('session.create_step', { step: h.stepIdx + 1 })}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', padding: '12px 20px 0', gap: 6 }}>
        {h.steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= h.stepIdx ? S.p : S.bg3, transition: 'background 0.3s' }} />
        ))}
      </div>

      {h.step === 'basics' && <CreateStepBasics h={h} />}
      {h.step === 'rules' && <CreateStepRules h={h} />}
      {h.step === 'address' && <CreateStepAddress h={h} />}
      {h.step === 'timing' && <CreateStepTiming h={h} />}
      {h.step === 'visibility' && <CreateStepVisibility h={h} />}
    </div>
  )
}
