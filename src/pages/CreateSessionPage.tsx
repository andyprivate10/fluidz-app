import { ArrowLeft, Clock, Zap, Sparkles, Bookmark } from 'lucide-react'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { supabase } from '../lib/supabase'
import { useCreateSession, inp } from '../hooks/useCreateSession'
import CreateSessionSharing from '../components/session/CreateSessionSharing'

const S = colors

export default function CreateSessionPage() {
  const h = useCreateSession()

  if (h.createdSession) {
    return (
      <CreateSessionSharing
        createdSession={h.createdSession}
        isPublic={h.isPublic}
        setIsPublic={h.setIsPublic}
        copyFeedback={h.copyFeedback}
        setCopyFeedback={h.setCopyFeedback}
        groups={h.groups}
        notifiedGroups={h.notifiedGroups}
        setNotifiedGroups={h.setNotifiedGroups}
        templateSaved={h.templateSaved}
        copyShareMessage={h.copyShareMessage}
        saveAsTemplate={h.saveAsTemplate}
        navigate={h.navigate}
      />
    )
  }

  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,maxWidth:480,margin:'0 auto',position:'relative' as const}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.rule,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => h.step==='template' ? h.navigate(-1 as any) : h.setStep(h.steps[h.stepIdx-1] as any)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{h.t('common.back')}</button>
        <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 4px'}}>{h.t('session.new_session')}</h1>
        <p style={{fontSize:13,color:S.tx3,margin:0}}>{h.t('session.create_step', { step: h.stepIdx+1 })}</p>
      </div>

      <div style={{display:'flex',padding:'12px 20px 0',gap:6}}>
        {h.steps.map((s,i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:i<=h.stepIdx?S.p:S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {h.step === 'template' && (
        <div style={{padding:'20px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>{h.t('session.choose_template')}</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 16px'}}>{h.t('session.template_help')}</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {/* Custom option — always first */}
            <div onClick={() => h.pickTemplate({ slug: 'custom', label: 'Custom', meta: { tags: [], description: '' } })} style={{
              borderRadius:14,overflow:'hidden',cursor:'pointer',
              border:'1px solid '+S.pbd,background:S.bg1,
              transition:'transform 0.15s',position:'relative' as const,
              display:'flex',flexDirection:'column',
            }}>
              <div style={{width:'100%',height:100,background:`linear-gradient(135deg, ${S.bg2}, ${S.bg3})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Sparkles size={32} style={{color:S.p,opacity:0.7}} />
              </div>
              <div style={{padding:'10px 12px'}}>
                <p style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:S.p}}>Custom</p>
                <p style={{margin:0,fontSize:11,color:S.tx3}}>{h.t('session.custom_desc')}</p>
              </div>
            </div>
            {/* B17: Saved templates */}
            {h.savedTemplates.map(tpl => (
              <div key={tpl.slug} onClick={() => h.pickTemplate(tpl)} style={{
                borderRadius:14,overflow:'hidden',cursor:'pointer',
                border:'1px solid '+S.lavbd,background:S.bg1,
                transition:'transform 0.15s',position:'relative' as const,
              }}>
                <div style={{width:'100%',height:100,background:h.getSessionCover((tpl.meta as any)?.tags || [tpl.label]).bg,position:'relative' as const}}>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)'}} />
                  <Bookmark size={16} strokeWidth={1.5} style={{position:'absolute',top:8,right:8,color:S.lav}} />
                </div>
                <div style={{padding:'10px 12px'}}>
                  <p style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:S.lav}}>{tpl.label}</p>
                  <p style={{margin:0,fontSize:11,color:S.tx3,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(tpl.meta as any)?.description || h.t('session.saved_template')}</p>
                </div>
              </div>
            ))}
            {h.sessionTemplates.filter(tpl => tpl.slug !== 'chemical').map(tpl => {
              const meta = tpl.meta as any
              const coverUrl = meta?.cover_url
              return (
                <div key={tpl.slug} onClick={() => h.pickTemplate(tpl)} style={{
                  borderRadius:14,overflow:'hidden',cursor:'pointer',
                  border:'1px solid '+S.rule2,background:S.bg1,
                  transition:'transform 0.15s',position:'relative' as const,
                }}>
                  <div style={{width:'100%',height:100,background:coverUrl ? `url(${coverUrl}) center/cover no-repeat` : h.getSessionCover(meta?.tags || [tpl.label]).bg,position:'relative' as const}}>
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)'}} />
                  </div>
                  <div style={{padding:'10px 12px'}}>
                    <p style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:S.tx}}>{tpl.label}</p>
                    <p style={{margin:0,fontSize:11,color:S.tx3,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meta?.description || ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {h.step === 'details' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.title_label')}</p>
            <input value={h.title} onChange={e=>h.setTitle(e.target.value)} placeholder={h.t('session.title_placeholder')} style={inp} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.description_label')}</p>
            <textarea value={h.description} onChange={e=>h.setDescription(e.target.value)} placeholder={h.t('session.description_placeholder')} rows={3} style={{...inp,resize:'none',lineHeight:1.5}} />
          </div>
          {/* Timing */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.timing_label')}</p>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button onClick={()=>{h.setStartsNow(true);h.setStartsAt('')}} style={{flex:1,padding:'10px',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,border:h.startsNow?'none':'1px solid '+S.rule,background:h.startsNow?S.grad:S.bg2,color:h.startsNow?'#fff':S.tx3}}>
                <Zap size={14} /> {h.t('session.start_now')}
              </button>
              <button onClick={()=>{
                h.setStartsNow(false)
                if (!h.startsAt) {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  tomorrow.setHours(20, 0, 0, 0)
                  h.setStartsAt(tomorrow.toISOString().slice(0, 16))
                }
              }} style={{flex:1,padding:'10px',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,border:!h.startsNow?'none':'1px solid '+S.rule,background:!h.startsNow?S.grad:S.bg2,color:!h.startsNow?'#fff':S.tx3}}>
                <Clock size={14} /> {h.t('session.start_later')}
              </button>
            </div>
            {!h.startsNow && (
              <input type="datetime-local" value={h.startsAt} onChange={e=>h.setStartsAt(e.target.value)} style={{...inp,marginBottom:8,colorScheme:'dark'}} />
            )}
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'8px 0 6px'}}>{h.t('session.duration_label')}</p>
            <div style={{display:'flex',gap:6}}>
              {[1,2,3,4,6,8].map(hr => (
                <button key={hr} onClick={()=>h.setDurationHours(hr)} style={{flex:1,padding:'8px 0',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',border:h.durationHours===hr?'none':'1px solid '+S.rule,background:h.durationHours===hr?S.p2:S.bg2,color:h.durationHours===hr?S.p:S.tx3}}>
                  {hr}h
                </button>
              ))}
            </div>
          </div>
          {/* Capacite max */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.capacity_label')}</p>
            <input type="number" value={h.maxCapacity} onChange={e=>h.setMaxCapacity(e.target.value ? parseInt(e.target.value) : '')} placeholder={h.t('session.capacity_placeholder')} min={2} max={50} style={inp} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.tags_label')}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {h.sessionTags.map(tag => {
                const on = h.selectedTags.includes(tag.label)
                return (
                  <button key={tag.label} onClick={()=>h.toggleTag(tag.label)} style={{
                    padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,
                    border:on?'none':'1px solid '+S.rule,
                    background:on?S.grad:S.bg2,color:on?'#fff':S.tx3,cursor:'pointer',
                  }}>{tag.label}</button>
                )
              })}
            </div>
          </div>
          {/* Roles recherches */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.roles_label')}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {h.roles.map(r => {
                const count = h.rolesWanted[r.label] || 0
                return (
                  <div key={r.label} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:12,background:count > 0 ? S.p2 : S.bg2,border:'1px solid '+(count > 0 ? S.pbd : S.rule)}}>
      <OrbLayer />
                    <span style={{fontSize:13,fontWeight:600,color:count > 0 ? S.p : S.tx3}}>{r.label}</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <button onClick={()=>h.setRolesWanted(prev => {const n={...prev}; if((n[r.label]||0)>0) n[r.label]=(n[r.label]||0)-1; if(n[r.label]===0) delete n[r.label]; return n})} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.rule,background:S.bg,color:S.tx3,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>−</button>
                      <span style={{fontSize:14,fontWeight:700,color:S.tx,minWidth:16,textAlign:'center'}}>{count}</span>
                      <button onClick={()=>h.setRolesWanted(prev => ({...prev,[r.label]:(prev[r.label]||0)+1}))} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.pbd,background:S.p2,color:S.p,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.keys(h.rolesWanted).length > 0 && (
              <p style={{fontSize:11,color:S.tx3,margin:'6px 0 0'}}>
                {h.t('share.searching')} : {Object.entries(h.rolesWanted).map(([r,c]) => `${c} ${r}${Number(c)>1?'s':''}`).join(', ')}
              </p>
            )}
          </div>
          {/* Import from group */}
          {h.allGroups.length > 0 && (
            <div>
              <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.import_from_group')}</p>
              {h.preInviteGroup ? (
                <div style={{padding:'10px 14px',borderRadius:12,background:S.sagebg,border:'1px solid '+S.sagebd,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:600,color:S.sage}}>{h.preInviteGroup.name} ({h.preInviteGroup.members.length})</span>
                  <button onClick={()=>h.setPreInviteGroup(null)} style={{padding:'4px 8px',borderRadius:6,border:'none',background:'transparent',color:S.tx3,fontSize:11,fontWeight:600,cursor:'pointer'}}>✕</button>
                </div>
              ) : (
                <div style={{position:'relative'}}>
                  <button onClick={()=>h.setShowGroupPicker(!h.showGroupPicker)} style={{width:'100%',padding:'10px 14px',borderRadius:12,fontSize:13,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer',textAlign:'left'}}>
                    {h.t('session.invite_group')}
                  </button>
                  {h.showGroupPicker && (
                    <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:4,background:S.bg1,border:'1px solid '+S.rule,borderRadius:12,overflow:'hidden',zIndex:60,boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}}>
                      {h.allGroups.map(g => (
                        <button key={g.id} onClick={()=>{h.setPreInviteGroup(g);h.setShowGroupPicker(false)}} style={{width:'100%',padding:'10px 14px',background:'transparent',border:'none',borderBottom:'1px solid '+S.rule,color:S.tx,fontSize:13,fontWeight:600,cursor:'pointer',textAlign:'left'}}>
                          {g.name} ({g.members.length})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button onClick={()=>h.setStep('address')} disabled={!h.title} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:!h.title?'not-allowed':'pointer',opacity:!h.title?0.5:1,boxShadow:'0 4px 20px '+S.pbd,marginTop:4}}>
            {h.t('session.continue_button')}
          </button>
        </div>
      )}

      {h.step === 'address' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          {h.savedAddresses.length > 0 && (
            <div>
              <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.saved_addresses')}</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {h.savedAddresses.map((addr, i) => (
                  <button key={addr.id || i} type="button" onClick={() => h.pickSavedAddress(addr)} style={{
                    padding:'6px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer',
                  }}>
                    {addr.label || addr.approx_area || h.t('session.address_label')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.approx_area_label')}</p>
            <input value={h.approxArea} onChange={e=>h.setApproxArea(e.target.value)} placeholder={h.t('session.approx_area_placeholder')} style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>{h.t('session.approx_area_note')}</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.exact_address_label')}</p>
            <input value={h.exactAddress} onChange={e=>h.setExactAddress(e.target.value)} placeholder={h.t('session.exact_address_placeholder')} style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>{h.t('session.exact_address_note')}</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{h.t('session.directions_label')}</p>
            <p style={{fontSize:12,color:S.tx4,marginBottom:8}}>{h.t('session.directions_help')}</p>
            {h.directions.map((step, i) => (
              <div key={i} style={{marginBottom:8,padding:10,background:S.bg,borderRadius:10,border:'1px solid '+S.rule}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.p}}>#{i+1}</span>
                  <input value={step.text} onChange={e=>{ const next=[...h.directions]; next[i]={...next[i],text:e.target.value}; h.setDirections(next) }} placeholder={'Ex: Rentre par le parking...'} style={{...inp,flex:1,fontSize:13}} />
                  {h.directions.length > 1 && (
                    <button type="button" onClick={()=>h.setDirections(h.directions.filter((_,j)=>j!==i))} style={{padding:'6px 10px',borderRadius:8,fontSize:11,border:'1px solid '+S.redbd,background:'transparent',color:S.red,cursor:'pointer'}}>×</button>
                  )}
                </div>
                {step.photo_url ? (
                  <div style={{marginTop:6,position:'relative',display:'inline-block'}}>
                    <img src={step.photo_url} alt="" loading="lazy" style={{width:80,height:60,objectFit:'cover',borderRadius:8,border:'1px solid '+S.rule}} />
                    <button type="button" onClick={()=>{ const next=[...h.directions]; next[i]={...next[i],photo_url:undefined}; h.setDirections(next) }} style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:S.red,border:'none',color:'#fff',fontSize:10,cursor:'pointer'}}>×</button>
                  </div>
                ) : (
                  <label style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'4px 8px',borderRadius:6,border:'1px solid '+S.rule,background:S.bg2,color:S.tx4,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                    Photo
                    <input type="file" accept="image/*" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f)return; const { compressImage: ci } = await import('../lib/media'); const c = await ci(f); const { data:{ user } } = await supabase.auth.getUser(); if(!user) return; const path=user.id+'/dir_'+Date.now()+'.jpg'; const {error}=await supabase.storage.from('avatars').upload(path,c); if(error) return; const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path); const next=[...h.directions]; next[i]={...next[i],photo_url:publicUrl}; h.setDirections(next) }} style={{display:'none'}} />
                  </label>
                )}
              </div>
            ))}
            <button type="button" onClick={()=>h.setDirections([...h.directions,{text:''}])} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              {h.t('session.add_direction')}
            </button>
          </div>

          <button onClick={h.saveAddress} disabled={h.savingAddress || (!h.approxArea && !h.exactAddress)} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:'transparent',color:S.p,cursor:h.savingAddress||(!h.approxArea&&!h.exactAddress)?'not-allowed':'pointer',opacity:h.savingAddress||(!h.approxArea&&!h.exactAddress)?0.6:1}}>
            {h.savingAddress ? h.t('common.saving') : h.t('session.save_address')}
          </button>
          <div style={{padding:'12px 14px',background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:12,border:'1px solid '+S.rule2}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>{h.t('session.address_privacy_note')}</p>
          </div>
          {h.error && <p style={{color:S.p,fontSize:13,margin:'0 0 4px',padding:'10px 14px',background:S.p3,borderRadius:10}}>{h.error}</p>}
          <button onClick={h.create} disabled={h.loading||!h.title||!h.approxArea} className='btn-shimmer' style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:h.loading||!h.title||!h.approxArea?'not-allowed':'pointer',opacity:h.loading||!h.title||!h.approxArea?0.5:1,boxShadow:'0 4px 20px '+S.pbd,marginTop:4}}>
            {h.loading ? h.t('session.creating') : h.t('session.create_button')}
          </button>
        </div>
      )}

    </div>
  )
}
