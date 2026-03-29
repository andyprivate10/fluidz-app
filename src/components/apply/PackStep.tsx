import { Check } from 'lucide-react'
import { colors } from '../../brand'
import { useTranslation } from 'react-i18next'
import type { Section } from './applySections'
import { getBodyZones } from './applySections'

const S = colors

interface PackStepProps {
  profile: any
  guestMode: boolean
  guestDisplayName: string
  enabled: string[]
  setEnabled: React.Dispatch<React.SetStateAction<string[]>>
  toggle: (sid: string) => void
  selectedRole: string
  setSelectedRole: (v: string) => void
  selectedPhotosProfil: string[]
  setSelectedPhotosProfil: React.Dispatch<React.SetStateAction<string[]>>
  selectedPhotosAdulte: string[]
  setSelectedPhotosAdulte: React.Dispatch<React.SetStateAction<string[]>>
  selectedVideosAdulte: string[]
  setSelectedVideosAdulte: React.Dispatch<React.SetStateAction<string[]>>
  selectedBodyParts: Record<string, string>
  setSelectedBodyParts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  roles: { label: string }[]
  BLOC_PROFIL: Section[]
  BLOC_ADULTE: Section[]
  SECTION_OCCASION: Section
  ALL_SECTIONS: Section[]
  capacityFull: boolean
  isRateLimited: boolean
  invalidPseudo: boolean
  onContinue: () => void
  navigate: (path: string) => void
}

export default function PackStep({
  profile, guestMode, guestDisplayName,
  enabled, setEnabled, toggle, selectedRole, setSelectedRole,
  selectedPhotosProfil, setSelectedPhotosProfil,
  selectedPhotosAdulte, setSelectedPhotosAdulte,
  selectedVideosAdulte, setSelectedVideosAdulte,
  selectedBodyParts, setSelectedBodyParts,
  roles, BLOC_PROFIL, BLOC_ADULTE, SECTION_OCCASION, ALL_SECTIONS,
  capacityFull, isRateLimited, invalidPseudo,
  onContinue, navigate,
}: PackStepProps) {
  const { t } = useTranslation()
  const BODY_ZONES = getBodyZones(t)
  const pj = profile?.profile_json || {}

  function getPreview(secId: string) {
    if (guestMode || !pj) return ''
    switch (secId) {
      case 'basics': return [pj.age ? t('apply.years_old', { age: pj.age }) : '', pj.location].filter(Boolean).join(' · ')
      case 'role': return pj.role || selectedRole || ''
      case 'physique': return [pj.height ? pj.height + 'cm' : '', pj.weight ? pj.weight + 'kg' : '', pj.morphology].filter(Boolean).join(' · ')
      case 'pratiques': return Array.isArray(pj.kinks) && pj.kinks.length > 0 ? pj.kinks.slice(0, 3).join(', ') + (pj.kinks.length > 3 ? ' +' + (pj.kinks.length - 3) : '') : ''
      case 'sante': return pj.health?.prep_status ? 'PrEP ' + pj.health.prep_status : ''
      case 'limites': return pj.limits ? pj.limits.slice(0, 40) + (pj.limits.length > 40 ? '…' : '') : ''
      case 'photos_profil': { const pp = Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : []); return pp.length > 0 ? `${selectedPhotosProfil.length}/${pp.length}` : '' }
      case 'photos_adulte': { const pa = Array.isArray(pj.photos_intime) ? pj.photos_intime : []; const va = Array.isArray(pj.videos_intime) ? pj.videos_intime : []; const total = selectedPhotosAdulte.length + selectedVideosAdulte.length; return (pa.length + va.length) > 0 ? `${total}/${pa.length + va.length}` : '' }
      case 'body_part_photos': { const bp = pj.body_part_photos || {}; const totalBp = Object.keys(bp).filter(k => bp[k]).length; const sel = Object.keys(selectedBodyParts).filter(k => selectedBodyParts[k]).length; return totalBp > 0 ? `${sel}/${totalBp} zones` : '' }
      default: return ''
    }
  }

  function renderSection(sec: Section) {
    const on = enabled.includes(sec.id)
    const preview = getPreview(sec.id)
    return (
      <div key={sec.id} onClick={() => toggle(sec.id)} style={{
        background: on ? S.p3 : S.bg1,
        border: '1px solid ' + (on ? S.pbd : S.rule),
        borderRadius:14,padding:'12px 14px',cursor:'pointer',
        display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.2s',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
          <sec.icon size={18} style={{color:on?S.p:S.tx4,flexShrink:0}} />
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:14,fontWeight:600,color:on?S.tx:S.tx3}}>{sec.label}</p>
            {on && preview ? (
              <p style={{margin:0,fontSize:12,color:S.p,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{preview}</p>
            ) : (
              <p style={{margin:0,fontSize:11,color:S.tx4}}>{sec.desc}</p>
            )}
          </div>
        </div>
        <div style={{width:20,height:20,borderRadius:99,background:on?S.grad:'transparent',border:on?'none':'2px solid '+S.rule,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {on && <Check size={11} strokeWidth={3} style={{color: S.tx}} />}
        </div>
      </div>
    )
  }

  function renderBlocToggle(label: string, sections: Section[], color: string) {
    const allOn = sections.every(s => enabled.includes(s.id))
    const someOn = sections.some(s => enabled.includes(s.id))
    return (
      <button type="button" onClick={() => {
        const ids = sections.map(s => s.id)
        if (allOn) setEnabled(prev => prev.filter(x => !ids.includes(x)))
        else setEnabled(prev => [...new Set([...prev, ...ids])])
      }} style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',
        padding:'10px 14px',borderRadius:12,cursor:'pointer',border:'none',
        background: someOn ? color + '14' : S.bg2,
      }}>
        <span style={{fontSize:13,fontWeight:700,color: someOn ? color : S.tx3}}>{label}</span>
        <span style={{fontSize:11,fontWeight:600,color: someOn ? color : S.tx4}}>
          {allOn ? t('apply.all_enabled') : someOn ? t('apply.partial') : t('apply.disabled_state')}
        </span>
      </button>
    )
  }

  function renderPhotoSubSelection(albumKey: 'profil' | 'adulte') {
    const enabledKey = albumKey === 'profil' ? 'photos_profil' : 'photos_adulte'
    if (!enabled.includes(enabledKey) || guestMode) return null
    const allP: string[] = albumKey === 'profil'
      ? (Array.isArray(pj.photos_profil) ? pj.photos_profil : (Array.isArray(pj.photos) ? pj.photos : pj.avatar_url ? [pj.avatar_url] : []))
      : (Array.isArray(pj.photos_intime) ? pj.photos_intime : [])
    const allV: string[] = albumKey === 'adulte' ? (Array.isArray(pj.videos_intime) ? pj.videos_intime : (Array.isArray(pj.videos) ? pj.videos : [])) : []
    if (allP.length + allV.length === 0) return null
    const selP = albumKey === 'profil' ? selectedPhotosProfil : selectedPhotosAdulte
    const setSelP = albumKey === 'profil' ? setSelectedPhotosProfil : setSelectedPhotosAdulte
    const selV = selectedVideosAdulte
    const setSelV = setSelectedVideosAdulte
    const accentColor = S.p
    return (
      <div style={{marginTop:6,marginLeft:28,padding:10,background:S.bg1,borderRadius:12,border:'1px solid '+accentColor+'33'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {allP.map((url: string) => {
            const on = selP.includes(url)
            return (
              <button key={url} type="button" onClick={() => setSelP((prev: string[]) => on ? prev.filter(p => p !== url) : [...prev, url])} style={{position:'relative',width:52,height:52,padding:0,border:on ? '2px solid '+accentColor : '1px solid '+S.rule,borderRadius:8,overflow:'hidden',cursor:'pointer',background:'none',opacity:on?1:0.35,transition:'opacity 0.15s'}}>
                <img src={url} alt="" loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                {on && <div style={{position:'absolute',top:1,right:1,width:14,height:14,borderRadius:99,background:S.grad,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={8} strokeWidth={3} style={{color: S.tx}} /></div>}
              </button>
            )
          })}
          {allV.map((url: string) => {
            const on = selV.includes(url)
            return (
              <button key={url} type="button" onClick={() => setSelV((prev: string[]) => on ? prev.filter(v => v !== url) : [...prev, url])} style={{position:'relative',width:66,height:52,padding:0,border:on ? '2px solid '+accentColor : '1px solid '+S.rule,borderRadius:8,overflow:'hidden',cursor:'pointer',background:'none',opacity:on?1:0.35,transition:'opacity 0.15s'}}>
                <video src={url} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                {on && <div style={{position:'absolute',top:1,right:1,width:14,height:14,borderRadius:99,background:S.grad,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={8} strokeWidth={3} style={{color: S.tx}} /></div>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function renderBodyPartSubSelection() {
    if (!enabled.includes('body_part_photos') || guestMode) return null
    const rawBp = pj.body_part_photos || {}
    const keyMap: Record<string,string> = { torse:'torso', bite:'sex', cul:'butt', pieds:'feet' }
    const bp: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawBp)) {
      const nk = keyMap[k] || k
      bp[nk] = Array.isArray(v) ? (v as string[])[0] || '' : (v as string)
    }
    const entries = Object.entries(bp).filter(([, url]) => url)
    if (entries.length === 0) return null
    return (
      <div style={{marginTop:6,marginLeft:28,padding:10,background:S.bg1,borderRadius:12,border:'1px solid '+S.pbd}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {entries.map(([partId, url]) => {
            const on = !!selectedBodyParts[partId]
            const partLabel = BODY_ZONES.find(b => b.id === partId)?.label || partId
            return (
              <button key={partId} type="button" onClick={() => setSelectedBodyParts(prev => {
                const next = { ...prev }
                if (on) delete next[partId]; else next[partId] = url
                return next
              })} style={{position:'relative',width:52,height:52,padding:0,border:on ? '2px solid '+S.p : '1px solid '+S.rule,borderRadius:8,overflow:'hidden',cursor:'pointer',background:'none',opacity:on?1:0.35,transition:'opacity 0.15s'}}>
                <img src={url} alt={partLabel} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                {on && <div style={{position:'absolute',top:1,right:1,width:14,height:14,borderRadius:99,background:S.grad,display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={8} strokeWidth={3} style={{color: S.tx}} /></div>}
                <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.6)',fontSize:8,color: S.tx,textAlign:'center',padding:'1px 0'}}>{partLabel}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const disabled = capacityFull || isRateLimited || invalidPseudo || (guestMode && guestDisplayName.trim().length < 2)

  return (
    <div style={{padding:'8px 20px 24px'}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>{t('profile.your_candidate_pack')}</h2>
        <p style={{fontSize:13,color:S.tx3,margin:0}}>{t('session.choose_share_sections')}</p>
      </div>

      {/* Profile incomplete nudge */}
      {!guestMode && profile && (() => {
        const missing: string[] = []
        if (!pj.avatar_url) missing.push('photo')
        if (!pj.role) missing.push('rôle')
        if (!pj.age && !pj.bio) missing.push('bio/âge')
        if (!pj.height && !pj.weight) missing.push('physique')
        if (missing.length === 0) return null
        return (
          <button type="button" onClick={() => navigate('/me')} style={{
            width: '100%', padding: '10px 14px', borderRadius: 12, marginBottom: 14,
            background: S.p2, border: '1px solid '+S.amberbd, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
          }}>
            <span style={{ fontSize: 14, color: S.orange }}>!</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: S.p }}>{t('session.profile_incomplete')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: S.tx2 }}>{t('apply.missing_label', { missing: missing.join(', ') })}</p>
            </div>
          </button>
        )
      })()}

      {/* Role picker */}
      <div style={{marginBottom:16}}>
        <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.your_role')}</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {roles.map(r => {
            const on = selectedRole === r.label
            return (
              <button key={r.label} type="button" onClick={() => setSelectedRole(on ? '' : r.label)} style={{
                padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,
                border:on?'none':'1px solid '+S.rule,
                background:on?S.grad:S.bg2,color:on? S.tx:S.tx3,cursor:'pointer',
              }}>{r.label}</button>
            )
          })}
        </div>
      </div>

      {/* BLOC PROFIL */}
      {renderBlocToggle(t('profile.profile_label'), BLOC_PROFIL, S.sage)}
      <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6,marginBottom:16}}>
        {BLOC_PROFIL.map(sec => (
          <div key={sec.id}>
            {renderSection(sec)}
            {sec.id === 'photos_profil' && renderPhotoSubSelection('profil')}
          </div>
        ))}
      </div>

      {/* BLOC ADULTE */}
      {renderBlocToggle(t('apply.adult_label'), BLOC_ADULTE, S.p)}
      <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6,marginBottom:16}}>
        {BLOC_ADULTE.map(sec => (
          <div key={sec.id}>
            {renderSection(sec)}
            {sec.id === 'photos_adulte' && renderPhotoSubSelection('adulte')}
            {sec.id === 'body_part_photos' && renderBodyPartSubSelection()}
          </div>
        ))}
      </div>

      {/* OCCASION (standalone) */}
      {renderSection(SECTION_OCCASION)}

      {invalidPseudo && <p style={{fontSize:13,color:S.red,marginTop:8,marginBottom:0}}>{t('session.pseudo_required')}</p>}
      <div style={{marginTop:12,padding:'10px 14px',background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:12,border:'1px solid '+S.rule2}}>
        <p style={{fontSize:12,color:S.tx3,margin:0}}>{t('apply.sections_shared', { count: enabled.length, total: ALL_SECTIONS.length })}</p>
      </div>
      <button onClick={onContinue} disabled={disabled} className='btn-shimmer' style={{width:'100%',marginTop:14,padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color: S.tx,background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,boxShadow:'0 4px 20px ' + S.pbd}}>
        {capacityFull ? t('session.full') : t('session.continue_button')}
      </button>
    </div>
  )
}

