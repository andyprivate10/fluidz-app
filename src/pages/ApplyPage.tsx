import { colors, fonts } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { ArrowLeft } from 'lucide-react'
import PackStep from '../components/apply/PackStep'
import NoteStep from '../components/apply/NoteStep'
import { useApplyData } from '../hooks/useApplyData'

const S = colors

export default function ApplyPage() {
  const d = useApplyData()

  if (!d.user && !d.guestMode) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:24}}>
        <p style={{color:S.tx3,marginBottom:16}}>{d.t('session.login_to_apply')}</p>
        <button onClick={() => d.navigate('/login?next=' + encodeURIComponent('/session/' + d.id + '/apply'))} style={{padding:'12px 24px',borderRadius:12,background:S.grad,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>{d.t('home.login')}</button>
      </div>
    </div>
  )
  if (d.dataLoading) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <div style={{ width: 32, height: 32, border: "3px solid "+S.pbd, borderTopColor: S.p, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  )
  if (d.loadError) return (
    <div style={{minHeight:'100vh',background:S.bg,display:'flex',justifyContent:'center',paddingTop:80}}>
      <p style={{color:S.red,textAlign:'center'}}>{d.t('common.load_error')}</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,position:'relative',maxWidth:480,margin:'0 auto'}}>
      <OrbLayer />
      <div style={{padding:'12px 20px 16px',borderBottom:'1px solid ' + S.rule, background:'rgba(13,12,22,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => d.navigate('/session/' + d.id)} style={{ background:'none', border:'none', color:S.p, fontSize:13, cursor:'pointer', padding:0, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
          <ArrowLeft size={16} strokeWidth={1.5} />{d.session?.title || d.t('common.back')}
        </button>
        <h1 style={{fontSize:22,fontWeight:800,fontFamily:fonts.body,color:S.tx,margin:'0 0 4px'}}>{d.t('session.my_application')}</h1>
        {d.session && <p style={{fontSize:13,color:S.tx3,margin:0}}>{d.session.approx_area}</p>}
      </div>

      {d.sessionEnded && (
        <div style={{margin:'12px 20px',padding:14,borderRadius:14,background:S.redbg,border:'1px solid '+S.redbd}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:S.red}}>{d.t('session.ended_title')}</p>
          <p style={{margin:'4px 0 0',fontSize:13,color:S.tx2}}>{d.t('session.ended_apply_blocked')}</p>
          <button onClick={() => d.navigate('/session/' + d.id)} style={{marginTop:12,padding:'10px 24px',borderRadius:12,background:S.p2,border:'1px solid '+S.pbd,color:S.p,fontSize:13,fontWeight:700,cursor:'pointer'}}>{d.t('common.back')}</button>
        </div>
      )}

      {d.capacityFull && !d.sessionEnded && (
        <div style={{margin:'12px 20px',padding:14,borderRadius:14,background:S.redbg,border:'1px solid '+S.redbd}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:S.red}}>{d.t('session.full')}</p>
          <p style={{margin:'4px 0 0',fontSize:13,color:S.tx2}}>{d.t('session.session_full_desc')}</p>
        </div>
      )}

      {!d.sessionEnded && (d.profile || d.guestMode) && (
        <div style={{margin:'12px 20px',padding:12,borderRadius:14,background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2}}>
          <div style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{d.t('session.profile_preview')}</div>
          {d.guestMode ? (
            <input value={d.guestDisplayName} onChange={e=>d.setGuestDisplayName(e.target.value)} placeholder={d.t('placeholders.your_pseudo_required')} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:10,padding:'10px 14px',border:'1px solid '+S.rule,fontSize:14,marginBottom:8,boxSizing:'border-box'}} />
          ) : (
            <div style={{fontSize:14,fontWeight:600,color:S.tx,marginBottom:4}}>{d.profile?.display_name || d.t('common.anonymous')}</div>
          )}
          {(d.selectedRole || (d.profile?.profile_json as any)?.role || (d.profile?.profile_json as any)?.bio) && !d.guestMode && (
            <div style={{fontSize:13,color:S.tx2,lineHeight:1.4}}>
              {(d.selectedRole || (d.profile?.profile_json as any)?.role) && (
                <span style={{color:S.p,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.p2,border:'1px solid '+S.pbd,marginRight:6}}>
                  {d.selectedRole || (d.profile?.profile_json as any)?.role}
                </span>
              )}
              {(d.profile?.profile_json as any)?.bio && ((d.profile?.profile_json as any).bio as string).slice(0, 80)}{((d.profile?.profile_json as any)?.bio as string)?.length > 80 ? '…' : ''}
            </div>
          )}
          {d.guestMode && (d.selectedRole || d.guestDisplayName) && (
            <div style={{fontSize:13,color:S.tx2}}>
              {d.guestDisplayName && <span style={{fontWeight:600,color:S.tx}}>{d.guestDisplayName}</span>}
              {d.selectedRole && <span style={{color:S.p,fontWeight:600,padding:'2px 8px',borderRadius:99,background:S.p2,marginLeft:6}}>{d.selectedRole}</span>}
            </div>
          )}
        </div>
      )}

      {d.isRateLimited && d.rateLimitedUntil && (
        <div style={{margin:'12px 20px',padding:14,borderRadius:14,background:S.redbg,border:'1px solid '+S.redbd}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:S.red}}>{d.t('session.already_applied')}</p>
          <p style={{margin:'4px 0 0',fontSize:13,color:S.tx2}}>{d.t('apply.rate_limit_wait', { minutes: Math.ceil((d.rateLimitedUntil.getTime() - Date.now()) / 60000) })}</p>
        </div>
      )}

      {!d.sessionEnded && <div style={{display:'flex',padding:'12px 20px',gap:6}}>
        {(['pack','note','done'] as const).map((s, i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:(['pack','note','done'].indexOf(d.step) >= i) ? S.p : S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>}

      {!d.sessionEnded && d.step === 'pack' && (
        <PackStep
          profile={d.profile} guestMode={d.guestMode}
          guestDisplayName={d.guestDisplayName}
          enabled={d.enabled} setEnabled={d.setEnabled} toggle={d.toggle}
          selectedRole={d.selectedRole} setSelectedRole={d.setSelectedRole}
          selectedPhotosProfil={d.selectedPhotosProfil} setSelectedPhotosProfil={d.setSelectedPhotosProfil}
          selectedPhotosAdulte={d.selectedPhotosAdulte} setSelectedPhotosAdulte={d.setSelectedPhotosAdulte}
          selectedVideosAdulte={d.selectedVideosAdulte} setSelectedVideosAdulte={d.setSelectedVideosAdulte}
          selectedBodyParts={d.selectedBodyParts} setSelectedBodyParts={d.setSelectedBodyParts}
          roles={d.roles} BLOC_PROFIL={d.BLOC_PROFIL} BLOC_ADULTE={d.BLOC_ADULTE}
          SECTION_OCCASION={d.SECTION_OCCASION} ALL_SECTIONS={d.ALL_SECTIONS}
          capacityFull={d.capacityFull} isRateLimited={d.isRateLimited} invalidPseudo={d.invalidPseudo}
          onContinue={() => d.setStep('note')} navigate={d.navigate}
        />
      )}

      {!d.sessionEnded && d.step === 'note' && (
        <NoteStep
          profile={d.profile} guestMode={d.guestMode} guestDisplayName={d.guestDisplayName}
          enabled={d.enabled} selectedRole={d.selectedRole}
          selectedPhotosProfil={d.selectedPhotosProfil}
          note={d.note} setNote={d.setNote}
          messageToHost={d.messageToHost} setMessageToHost={d.setMessageToHost}
          ALL_SECTIONS={d.ALL_SECTIONS}
          loading={d.loading} isRateLimited={d.isRateLimited}
          onBack={() => d.setStep('pack')} onSubmit={d.submit}
          occasionPhotos={d.occasionPhotos} setOccasionPhotos={d.setOccasionPhotos}
          mediaUploading={d.mediaUploading}
          onPickOccasionFile={d.onPickOccasionFile}
          occasionFileRef={d.occasionFileRef}
          onOccasionFileChange={d.onOccasionFileChange}
        />
      )}
    </div>
  )
}

