import { colors } from '../../brand'
import HostCandidateCard from '../host/HostCandidateCard'
import HostSessionStats from '../host/HostSessionStats'
import { useTranslation } from 'react-i18next'

const S = colors

interface HostApplicationListProps {
  apps: any[]
  filtered: any[]
  tab: 'pending' | 'accepted' | 'rejected'
  sessionId: string
  sessionTitle?: string
  votes: { applicant_id: string; vote: string }[]
  actionLoading: string | null
  broadcastText: string
  setBroadcastText: (text: string) => void
  broadcastSending: boolean
  sendBroadcast: () => void
  myGroups: { id: string; name: string; color: string; member_ids: string[] }[]
  inviteGroup: (groupId: string) => void
  onDecide: (appId: string, status: 'accepted' | 'rejected') => void
  onConfirmCheckIn: (appId: string) => void
  onEject: (appId: string) => void
}

export default function HostApplicationList({
  apps,
  filtered,
  tab,
  sessionId,
  sessionTitle,
  votes,
  actionLoading,
  broadcastText,
  setBroadcastText,
  broadcastSending,
  sendBroadcast,
  myGroups,
  inviteGroup,
  onDecide,
  onConfirmCheckIn,
  onEject,
}: HostApplicationListProps) {
  const { t } = useTranslation()

  return (
    <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
        <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>{t('host.broadcast')}</div>
        <textarea value={broadcastText} onChange={e=>setBroadcastText(e.target.value)} placeholder={t('host.broadcast_placeholder')} rows={2} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid '+S.rule,background:S.bg1,color:S.tx,fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:8}} />
        <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastText.trim()} style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'none',background:S.grad,color:'#fff',cursor: broadcastSending || !broadcastText.trim() ? 'not-allowed' : 'pointer',opacity: broadcastSending || !broadcastText.trim() ? 0.7 : 1}}>
          {broadcastSending ? t('host_actions.sending') : t('host_actions.send_to_all')}
        </button>
      </div>
      {/* Group invite */}
      {myGroups.length > 0 && (
        <div style={{padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,marginBottom:8}}>{t('host.invite_group')}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {myGroups.map(g => (
              <button key={g.id} onClick={() => inviteGroup(g.id)} style={{
                padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                border:'1px solid '+g.color+'44',background:g.color+'14',color:g.color,
                display:'flex',alignItems:'center',gap:4,
              }}>
                <div style={{width:8,height:8,borderRadius:3,background:g.color}} />
                {g.name} ({g.member_ids.length})
              </button>
            ))}
          </div>
        </div>
      )}
      <HostSessionStats apps={apps} />

      {filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'40px 20px',color:S.tx3,fontSize:14}}>
          {tab==='pending' ? t('host.no_pending') : tab==='accepted' ? t('host.no_accepted') : t('host.no_rejected')}
        </div>
      )}

      {filtered.map(app => (
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
      ))}
    </div>
  )
}
