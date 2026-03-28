import { ArrowLeft } from 'lucide-react'
import { colors, fonts } from '../../brand'
import { useTranslation } from 'react-i18next'
import type { Section } from './applySections'

const S = colors

interface NoteStepProps {
  profile: any
  guestMode: boolean
  guestDisplayName: string
  enabled: string[]
  selectedRole: string
  selectedPhotosProfil: string[]
  note: string
  setNote: (v: string) => void
  messageToHost: string
  setMessageToHost: (v: string) => void
  ALL_SECTIONS: Section[]
  loading: boolean
  isRateLimited: boolean
  onBack: () => void
  onSubmit: () => void
}

export default function NoteStep({
  profile, guestMode, guestDisplayName, enabled, selectedRole,
  selectedPhotosProfil, note, setNote, messageToHost, setMessageToHost,
  ALL_SECTIONS, loading, isRateLimited, onBack, onSubmit,
}: NoteStepProps) {
  const { t } = useTranslation()
  const disabled = loading || isRateLimited || (guestMode && guestDisplayName.trim().length < 2)

  // Recap computed values
  const totalPhotos = (enabled.includes('photos_profil') ? selectedPhotosProfil.length : 0)
  const hasRole = enabled.includes('role') && !!selectedRole
  const hasKinks = enabled.includes('pratiques') && (profile?.profile_json?.kinks?.length > 0)

  return (
    <div style={{padding:'16px 20px'}}>
      <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>{t('session.for_this_session')}</h2>
      <p style={{fontSize:13,color:S.tx3,margin:'0 0 8px'}}>{t('apply.note_hint')}</p>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('apply.note_placeholder')} rows={3} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:14,padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',fontSize:14,fontFamily:fonts.body,resize:'none',boxSizing:'border-box',lineHeight:1.5,marginBottom:12}} />
      <div style={{marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 6px'}}>{t('session.message_to_host')}</p>
        <textarea value={messageToHost} onChange={e => setMessageToHost(e.target.value)} placeholder={t('apply.message_placeholder')} rows={2} style={{width:'100%',background:S.bg2,color:S.tx,borderRadius:14,padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',fontSize:14,fontFamily:fonts.body,resize:'none',boxSizing:'border-box',lineHeight:1.5}} />
      </div>

      {/* Visual preview */}
      <div style={{padding:'14px',background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:14,border:'1px solid '+S.rule2,marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:700,color:S.p,margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('session.what_host_sees')}</p>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
          {profile?.profile_json?.avatar_url ? (
            <img src={profile.profile_json.avatar_url} alt="" style={{width:40,height:40,borderRadius:'28%',objectFit:'cover',border:'1px solid '+S.rule}} />
          ) : (
            <div style={{width:40,height:40,borderRadius:'28%',background:S.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>{(profile?.display_name || '?')[0].toUpperCase()}</div>
          )}
          <div>
            <p style={{margin:0,fontSize:14,fontWeight:700,color:S.tx}}>{guestMode ? guestDisplayName || t('common.guest') : profile?.display_name || t('common.anonymous')}</p>
            <div style={{display:'flex',gap:6,marginTop:2}}>
              {selectedRole && <span style={{fontSize:11,color:S.p,fontWeight:600}}>{selectedRole}</span>}
              {profile?.profile_json?.age && enabled.includes('basics') && <span style={{fontSize:11,color:S.tx3}}>{t('apply.years_old', { age: profile.profile_json.age })}</span>}
            </div>
          </div>
        </div>
        {selectedPhotosProfil.length > 0 && enabled.includes('photos_profil') && (
          <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:8}}>
            {selectedPhotosProfil.slice(0,3).map((url: string, i: number) => (
              <img key={i} src={url} alt="" loading="lazy" style={{width:56,height:72,borderRadius:10,objectFit:'cover',border:'1px solid '+S.rule,flexShrink:0}} />
            ))}
            {selectedPhotosProfil.length > 3 && <span style={{fontSize:11,color:S.tx4,alignSelf:'center'}}>+{selectedPhotosProfil.length-3}</span>}
          </div>
        )}
        <p style={{fontSize:12,color:S.tx3,margin:0}}>{enabled.length} section{enabled.length > 1 ? 's' : ''} : {enabled.map(sid => ALL_SECTIONS.find(s => s.id === sid)?.label).filter(Boolean).join(', ') || '—'}</p>
      </div>

      {/* Recap section */}
      <div style={{padding:'14px',background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:14,border:'1px solid '+S.rule2,marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:700,color:S.lav,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('apply.preview_title')}</p>
        <p style={{fontSize:13,color:S.tx2,margin:'0 0 6px'}}>{t('apply.you_share')}</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {totalPhotos > 0 && (
            <span style={{fontSize:11,fontWeight:600,color:S.sage,background:S.sagebg,padding:'3px 10px',borderRadius:99,border:'1px solid '+S.sagebd}}>
              {t('apply.photos_count', { count: totalPhotos })}
            </span>
          )}
          {hasRole && (
            <span style={{fontSize:11,fontWeight:600,color:S.p,background:S.p2,padding:'3px 10px',borderRadius:99,border:'1px solid '+S.pbd}}>
              {t('apply.your_role')}
            </span>
          )}
          {hasKinks && (
            <span style={{fontSize:11,fontWeight:600,color:S.lav,background:S.lavbg,padding:'3px 10px',borderRadius:99,border:'1px solid '+S.lavbd}}>
              {t('apply.your_kinks')}
            </span>
          )}
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button onClick={onBack} style={{flex:1,padding:'13px',borderRadius:14,fontWeight:600,fontSize:14,color:S.tx2,border:'1px solid '+S.rule,background:S.bg2,cursor:'pointer'}}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('apply.modify')}</button>
        <button onClick={onSubmit} disabled={disabled} className='btn-shimmer' style={{flex:2,padding:'13px',borderRadius:14,fontWeight:700,fontSize:14,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          {loading ? <><span style={{display:'inline-block',width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /> {t('apply.sending')}</> : isRateLimited ? t('apply.rate_limited') : t('apply.send')}
        </button>
      </div>
    </div>
  )
}

