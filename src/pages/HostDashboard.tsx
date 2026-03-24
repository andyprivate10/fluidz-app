import { Clock, Check, Copy } from 'lucide-react'
import { colors } from '../brand'
import ConfirmDialog from '../components/ConfirmDialog'
import OrbLayer from '../components/OrbLayer'
import EventContextNav from '../components/EventContextNav'
import { QRCodeSVG } from 'qrcode.react'
import { useHostDashboard } from '../hooks/useHostDashboard'
import HostApplicationList from '../components/session/HostApplicationList'

const S = colors

export default function HostDashboard() {
  const {
    t,
    id,
    navigate,
    sess,
    apps,
    tab,
    setTab,
    loading,
    loadError,
    actionLoading,
    linkCopied,
    copyLink,
    elapsed,
    messageCopied,
    copyMessageText,
    grinderCopied,
    copyGrindr,
    broadcastText,
    setBroadcastText,
    broadcastSending,
    myGroups,
    votes,
    remaining,
    filtered,
    counts,
    arrivedCount,
    waitingCount,
    totalAccepted,
    decide,
    confirmCheckIn,
    toggleStatus,
    closeSession,
    sendBroadcast,
    inviteGroup,
    ejectMember,
    pullHandlers,
    pullIndicator,
    getSessionCover,
    confirmDialogProps,
  } = useHostDashboard()

  if (loading) return (
    <div style={{minHeight:'100vh',background:S.bg,maxWidth:480,margin:'0 auto',padding:'80px 20px 40px'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
      {[0,1,2].map(i => (
        <div key={i} style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:18,padding:16,marginBottom:12,animation:'pulse 1.5s ease-in-out infinite',animationDelay:i*0.15+'s'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:S.bg2}} />
            <div style={{flex:1}}>
              <div style={{width:'60%',height:14,borderRadius:6,background:S.bg2,marginBottom:6}} />
              <div style={{width:'35%',height:10,borderRadius:4,background:S.bg2}} />
            </div>
          </div>
          <div style={{width:'80%',height:10,borderRadius:4,background:S.bg2,marginBottom:8}} />
          <div style={{width:'50%',height:10,borderRadius:4,background:S.bg2}} />
        </div>
      ))}
    </div>
  )
  if (loadError) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <p style={{color:S.red,textAlign:'center'}}>{t('common.load_error')}</p>
    </div>
  )
  return (
    <div {...pullHandlers} style={{minHeight:'100vh',background:S.bg,paddingBottom:96,position:'relative' as const,maxWidth:480,margin:'0 auto'}}>
      <OrbLayer />
      {pullIndicator}
      <EventContextNav role="host" sessionTitle={sess?.title} />
      {/* Header with cover image */}
      {(() => {
        const cover = getSessionCover(sess?.tags, sess?.cover_url)
        return (
      <div style={{position:'relative',borderBottom:'1px solid '+S.rule,overflow:'hidden'}}>
        {cover.coverImage ? (
          <>
            <div style={{position:'absolute',inset:0,backgroundImage:`url(${cover.coverImage})`,backgroundSize:'cover',backgroundPosition:'center'}} />
            <div style={{position:'absolute',inset:0,background:'rgba(5,4,10,0.65)'}} />
          </>
        ) : (
          <div style={{position:'absolute',inset:0,background:cover.bg}} />
        )}
        <div style={{position:'absolute',inset:0,background:'rgba(13,12,22,0.5)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}} />
        <div style={{position:'relative',zIndex:1,padding:'12px 20px 16px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:8,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.06em',padding:'3px 8px',borderRadius:99,background:S.p2,color:S.p,border:'1px solid '+S.pbd}}>Host</span>
              {sess?.status === 'open' && <span style={{fontSize:10,fontWeight:600,color:S.sage,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:S.sage,animation:'blink 2s ease-in-out infinite'}} />Live</span>}
            </div>
            <h1 style={{fontSize:18,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 3px',lineHeight:1.2}}>{sess?.title}</h1>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>{sess?.approx_area}</p>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-end',gap:6}}>
            {elapsed && sess?.status === 'open' && <span style={{fontSize:11,fontWeight:600,color:S.tx2,background:S.bg3,padding:'3px 10px',borderRadius:50,whiteSpace:'nowrap'}}><Clock size={10} strokeWidth={1.5} style={{marginRight:2}} />{elapsed}</span>}
            {remaining && sess?.status === 'open' && <span style={{fontSize:11,fontWeight:600,color:remaining==='terminé'?S.red:S.p,background:remaining==='terminé'?S.redbg:S.p2,padding:'3px 10px',borderRadius:50,whiteSpace:'nowrap'}}>{remaining==='terminé'?t('host.time_ended'):t('host.time_remaining', { time: remaining })}</span>}
            {totalAccepted > 0 && <span style={{fontSize:11,fontWeight:700,color:S.sage,background:S.sagebg,padding:'3px 10px',borderRadius:50}}>{arrivedCount}/{totalAccepted}</span>}
            {sess?.max_capacity && (() => { const total = totalAccepted + 1; const full = total >= sess.max_capacity; return <span style={{fontSize:11,fontWeight:700,color:full?S.red:S.tx2,background:full?S.redbg:S.bg3,padding:'3px 10px',borderRadius:50,border:'1px solid '+(full?S.redbd:S.rule)}}>{total}/{sess.max_capacity}{full?' '+t('host.capacity_full'):''}</span> })()}
          </div>
        </div>
        {sess?.status !== 'ended' && (
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={toggleStatus} style={{
              padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',
              border:'1px solid '+(sess?.status==='open' ? S.sagebd : S.rule),
              background: sess?.status==='open' ? S.sagebg : S.bg2,
              color: sess?.status==='open' ? S.sage : S.tx3,
            }}>
              {sess?.status==='open' ? t('status.open') : t('status.closed')}
            </button>
            <button onClick={() => navigate('/session/' + id + '/edit')} style={{flex:1,padding:'8px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              {t('host.edit')}
            </button>
            <button onClick={closeSession} style={{flex:1,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.red,background:'transparent',color:S.red,cursor:'pointer'}}>
              {t('host.end_session')}
            </button>
          </div>
        )}

        <button onClick={() => navigate('/session/' + id + '/chat')} style={{marginTop:8,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:'transparent',color:S.p,cursor:'pointer',width:'100%'}}>
          {t('session.group_chat')}
        </button>

        {sess?.invite_code && (
          <>
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code
                copyLink(url)
              }}
              style={{marginTop:12,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:linkCopied ? S.sagebg : 'transparent',color:linkCopied ? S.sage : S.p,cursor:'pointer',width:'100%'}}
            >
              {linkCopied ? t('session.link_copied') : t('host.share_session')}
            </button>
            <div style={{marginTop:12,padding:12,borderRadius:10,border:'1px solid '+S.rule,background:S.bg2}}>
              <div style={{fontSize:10,fontWeight:700,color:S.p,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:8}}>{t('host.share_on_platforms')}</div>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + sess.invite_code
                  const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                  const rolesText = rolesWanted && Object.keys(rolesWanted).length > 0
                    ? ' – ' + t('share.searching') + ' : ' + Object.entries(rolesWanted).map(([r, c]) => `${c} ${r}`).join(', ')
                    : ''
                  const membersText = counts.accepted > 0 ? ` – ${counts.accepted} ` + t('share.already_here') : ''
                  const text = '\uD83D\uDD25 ' + (sess.title || 'Plan ce soir') + ' – ' + (sess.approx_area || '') + rolesText + membersText + ' – ' + t('share.apply_here') + ' : ' + url
                  copyGrindr(text)
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:grinderCopied ? S.sagebg : 'transparent',color:grinderCopied ? S.sage : S.p,cursor:'pointer',marginBottom:8}}
              >
                {grinderCopied ? t('host.copied') : t('host.copy_grindr')}
              </button>
              <button
                onClick={() => {
                  const url = window.location.origin + '/join/' + sess.invite_code
                  const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                  const rolesLine = rolesWanted && Object.keys(rolesWanted).length > 0
                    ? t('session.searching_roles', { roles: Object.entries(rolesWanted).map(([r, c]) => `${c} ${r}`).join(', ') })
                    : ''
                  const lines = [sess.title, sess.description || '', rolesLine, sess.approx_area ? '\uD83D\uDCCD ' + sess.approx_area : '', counts.accepted > 0 ? `\uD83D\uDC65 ${counts.accepted} membres` : '', '', t('share.apply_here') + ' : ' + url].filter(Boolean)
                  copyMessageText(lines.join('\n'))
                }}
                style={{width:'100%',padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:messageCopied ? S.sagebg : 'transparent',color:messageCopied ? S.sage : S.p,cursor:'pointer'}}
              >
                {messageCopied ? <><Check size={13} strokeWidth={2} style={{display:'inline',marginRight:2}} />{t('session.copied')}</> : <><Copy size={13} strokeWidth={1.5} style={{display:'inline',marginRight:3}} />{t('host.copy_message')}</>}
              </button>
            </div>
            {/* Native share */}
            {typeof navigator !== 'undefined' && navigator.share && sess && (
              <button onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code
                const rolesWanted = sess.lineup_json?.roles_wanted as Record<string, number> | undefined
                const rolesText = rolesWanted && Object.keys(rolesWanted).length > 0 ? '\n' + t('share.searching') + ' : ' + Object.entries(rolesWanted).map(([r, c]) => c + ' ' + r).join(', ') : ''
                const text = '\uD83D\uDD25 ' + (sess.title || '') + (sess.approx_area ? ' – ' + sess.approx_area : '') + rolesText + (counts.accepted > 0 ? '\n\uD83D\uDC65 ' + counts.accepted + ' ' + t('share.already_here') : '') + '\n' + t('share.apply_here') + ' !'
                navigator.share({ title: sess.title || t('share.session_fluidz'), text, url }).catch(() => {})
              }} style={{marginTop:4,width:'100%',padding:'10px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.sagebd,background:'transparent',color:S.sage,cursor:'pointer'}}>
                {t('host.share_via')}
              </button>
            )}
            {/* Direct invite link */}
            <button
              onClick={() => {
                const url = window.location.origin + '/join/' + sess.invite_code + '?direct=1'
                copyLink(url)
              }}
              style={{marginTop:8,width:'100%',padding:'10px 16px',borderRadius:10,fontSize:12,fontWeight:600,border:'1px solid '+S.sagebd,background:S.sagebg,color:S.sage,cursor:'pointer'}}
            >
              {t('host.copy_direct_link')}
            </button>
            {/* QR Code */}
            <div style={{marginTop:12,textAlign:'center',padding:16,borderRadius:12,background:S.bg2,border:'1px solid '+S.rule}}>
              <div style={{background:'#fff',borderRadius:10,padding:12,display:'inline-block'}}>
                <QRCodeSVG value={window.location.origin + '/join/' + sess.invite_code} size={120} level="M" fgColor="#0C0A14" bgColor="#ffffff" />
              </div>
              <p style={{fontSize:10,color:S.tx4,margin:'8px 0 0'}}>{t('session.qr_hint')}</p>
            </div>
          </>
        )}
        {/* Roles summary */}
        {sess?.lineup_json?.roles_wanted && Object.keys(sess.lineup_json.roles_wanted).length > 0 && (() => {
          const wanted = (sess.lineup_json as any).roles_wanted as Record<string, number>
          const currentRoles: Record<string, number> = {}
          apps.filter(a => a.status === 'accepted' || a.status === 'checked_in').forEach(a => {
            const r = a.eps_json?.role || a.user_profiles?.profile_json?.role
            if (r) currentRoles[r] = (currentRoles[r] || 0) + 1
          })
          return (
            <div style={{marginTop:12,padding:14,borderRadius:12,background:S.bg2,border:'1px solid '+S.rule}}>
              <div style={{fontSize:10,fontWeight:700,color:S.lav,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:8}}>{t('host.roles_label').toUpperCase()}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {Object.entries(wanted).map(([role, count]) => {
                  const have = currentRoles[role] || 0
                  const filled = have >= Number(count)
                  return (
                    <span key={role} style={{
                      fontSize:12,fontWeight:600,padding:'4px 10px',borderRadius:99,
                      color: filled ? S.sage : S.p,
                      background: filled ? S.sagebg : S.p2,
                      border: '1px solid '+(filled ? S.sagebd : S.pbd),
                    }}>
                      {have}/{count} {role}{filled ? <Check size={11} strokeWidth={2.5} style={{display:'inline',marginLeft:3}} /> : null}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Arrival stats */}
        {totalAccepted > 0 && (
          <div style={{marginTop:16,padding:14,borderRadius:12,background:S.bg2,border:'1px solid '+S.rule,display:'flex',justifyContent:'space-around',textAlign:'center'}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.sage}}>{arrivedCount}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>{t('host.arrived')}</div>
            </div>
            {waitingCount > 0 && (
              <div>
                <div style={{fontSize:20,fontWeight:800,color:S.orange}}>{waitingCount}</div>
                <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>{t('host.to_confirm')}</div>
              </div>
            )}
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.tx2}}>{totalAccepted - arrivedCount}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>{t('host.en_route')}</div>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:S.p}}>{totalAccepted}</div>
              <div style={{fontSize:11,color:S.tx3,fontWeight:600}}>{t('host.total')}</div>
            </div>
          </div>
        )}

        {/* Stats metrics */}
        {apps.length > 0 && (
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <div style={{flex:1,background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:800,color:S.sage}}>{totalAccepted > 0 ? Math.round((arrivedCount / totalAccepted) * 100) : 0}%</div>
              <div style={{fontSize:10,color:S.tx3,fontWeight:600}}>{t('host.checkin_rate')}</div>
            </div>
            <div style={{flex:1,background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:800,color:S.p}}>{apps.length > 0 ? Math.round((counts.accepted / apps.length) * 100) : 0}%</div>
              <div style={{fontSize:10,color:S.tx3,fontWeight:600}}>{t('host.accept_rate')}</div>
            </div>
            <div style={{flex:1,background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:800,color:S.tx}}>{apps.length}</div>
              <div style={{fontSize:10,color:S.tx3,fontWeight:600}}>{t('host.total_apps')}</div>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,marginTop:16}}>
          {([['pending',t('host.pending'),S.orange],['accepted',t('host.accepted_tab'),S.sage],['rejected',t('host.rejected_tab'),S.red]] as const).map(([k,l,c]) => (
            <button key={k} onClick={() => setTab(k as any)} style={{
              flex:1,padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid '+(tab===k ? c+'55' : S.rule),
              background: tab===k ? c+'14' : S.bg2,
              color: tab===k ? c : S.tx3,
            }}>
              {l} {counts[k as keyof typeof counts] > 0 && <span style={{fontWeight:800}}>({counts[k as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>
      </div>
      )})()}

      <HostApplicationList
        apps={apps}
        filtered={filtered}
        tab={tab}
        sessionId={id!}
        sessionTitle={sess?.title}
        votes={votes}
        actionLoading={actionLoading}
        broadcastText={broadcastText}
        setBroadcastText={setBroadcastText}
        broadcastSending={broadcastSending}
        sendBroadcast={sendBroadcast}
        myGroups={myGroups}
        inviteGroup={inviteGroup}
        onDecide={decide}
        onConfirmCheckIn={confirmCheckIn}
        onEject={ejectMember}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  )
}
