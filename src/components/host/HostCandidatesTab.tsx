import { useTranslation } from 'react-i18next'
import { colors } from '../../brand'
import HostCandidateCard from './HostCandidateCard'
import type { CandidateSubTab } from '../../hooks/useHostDashboard'

const S = colors

type Props = {
  candidateSubTab: CandidateSubTab
  setCandidateSubTab: (tab: CandidateSubTab) => void
  filteredCandidates: any[]
  sessionId: string
  sessionTitle?: string
  votes: { applicant_id: string; vote: string }[]
  actionLoading: string | null
  counts: { pending: number; accepted: number; rejected: number }
  onDecide: (appId: string, status: 'accepted' | 'rejected') => void
  onConfirmCheckIn: (appId: string) => void
  onEject: (appId: string) => void
}

export default function HostCandidatesTab({
  candidateSubTab, setCandidateSubTab, filteredCandidates,
  sessionId, sessionTitle, votes, actionLoading, counts,
  onDecide, onConfirmCheckIn, onEject,
}: Props) {
  const { t } = useTranslation()

  const subTabs: { key: CandidateSubTab; label: string; color: string; count: number }[] = [
    { key: 'pending', label: t('host.sub_pending'), color: S.orange, count: counts.pending },
    { key: 'accepted', label: t('host.sub_accepted'), color: S.sage, count: counts.accepted },
    { key: 'rejected', label: t('host.sub_rejected'), color: S.red, count: counts.rejected },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
      {/* Sub-filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {subTabs.map(({ key, label, color, count }) => (
          <button
            key={key}
            onClick={() => setCandidateSubTab(key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid ' + (candidateSubTab === key ? color + '55' : S.rule),
              background: candidateSubTab === key ? color + '14' : S.bg2,
              color: candidateSubTab === key ? color : S.tx3,
            }}
          >
            {label} {count > 0 && <span style={{ fontWeight: 800 }}>({count})</span>}
          </button>
        ))}
      </div>

      {/* Candidate cards or empty state */}
      {filteredCandidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: S.tx3, fontSize: 14 }}>
          {t('host.no_candidates')}
        </div>
      ) : (
        filteredCandidates.map(app => (
          <HostCandidateCard
            key={app.id}
            app={app}
            sessionId={sessionId}
            sessionTitle={sessionTitle}
            votes={votes}
            actionLoading={actionLoading}
            onDecide={onDecide}
            onConfirmCheckIn={onConfirmCheckIn}
            onEject={onEject}
          />
        ))
      )}
    </div>
  )
}
