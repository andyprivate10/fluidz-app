import { Copy, Eye, EyeOff, Bookmark, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Confetti from '../Confetti'
import { colors } from '../../brand'
import OrbLayer from '../OrbLayer'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'

const S = colors

interface CreatedSessionData {
  id: string
  title: string
  approx_area: string
  invite_code: string
}

interface CreateSessionSharingProps {
  createdSession: CreatedSessionData
  isPublic: boolean
  setIsPublic: (v: boolean) => void
  copyFeedback: 'grindr'|'whatsapp'|'telegram'|'message'|null
  setCopyFeedback: (v: 'grindr'|'whatsapp'|'telegram'|'message'|null) => void
  groups: { id: string; name: string; members: string[] }[]
  notifiedGroups: Set<string>
  setNotifiedGroups: (v: Set<string>) => void
  templateSaved: boolean
  copyShareMessage: (app: 'grindr'|'whatsapp'|'telegram') => void
  saveAsTemplate: () => void
  navigate: (path: string) => void
}

export default function CreateSessionSharing({
  createdSession,
  isPublic,
  setIsPublic,
  copyFeedback,
  setCopyFeedback,
  groups,
  notifiedGroups,
  setNotifiedGroups,
  templateSaved,
  copyShareMessage,
  saveAsTemplate,
  navigate,
}: CreateSessionSharingProps) {
  const { t } = useTranslation()
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/join/' + createdSession.invite_code : ''
  const shareText = createdSession.title + (createdSession.approx_area ? ' – ' + createdSession.approx_area : '') + '\n\n' + shareUrl

  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,maxWidth:480,margin:'0 auto',position:'relative' as const}}>
      <OrbLayer />
      <Confetti />
      <div style={{position:'relative',zIndex:1,padding:'40px 20px 24px'}}>
        <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 8px'}}>{t('session.created_title')}</h1>
        <p style={{fontSize:13,color:S.tx3,margin:'0 0 20px'}}>{t('session.share_instructions')}</p>

        {/* VISIBILITY: Publier / Garder Secret */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:10,fontWeight:700,color:S.lav,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>{t('session.visibility_label')}</p>
          <div style={{display:'flex',gap:8}}>
            <button onClick={async () => { setIsPublic(true); await supabase.from('sessions').update({ is_public: true }).eq('id', createdSession.id) }} style={{
              flex:1,padding:'16px 12px',borderRadius:16,cursor:'pointer',textAlign:'center',
              background: isPublic ? 'linear-gradient(135deg, '+S.sage+', '+S.emerald+')' : 'rgba(22,20,31,0.85)',
              border: '1px solid '+(isPublic ? S.sage : S.rule2),
              boxShadow: isPublic ? '0 4px 20px rgba(74,222,128,0.2)' : 'none',
            }}>
              <Eye size={20} strokeWidth={1.5} style={{color: isPublic ? '#fff' : S.tx3, margin:'0 auto 6px', display:'block'}} />
              <p style={{fontSize:14,fontWeight:700,color: isPublic ? '#fff' : S.tx2,margin:0}}>{t('session.publish_in_app')}</p>
              <p style={{fontSize:11,color: isPublic ? 'rgba(255,255,255,0.7)' : S.tx3,margin:'4px 0 0'}}>{t('session.publish_in_app_desc')}</p>
            </button>
            <button onClick={async () => { setIsPublic(false); await supabase.from('sessions').update({ is_public: false }).eq('id', createdSession.id) }} style={{
              flex:1,padding:'16px 12px',borderRadius:16,cursor:'pointer',textAlign:'center',
              background: !isPublic ? 'rgba(22,20,31,0.85)' : 'rgba(22,20,31,0.85)',
              border: '1px solid '+(!isPublic ? S.pbd : S.rule2),
              boxShadow: !isPublic ? '0 4px 20px '+S.pbd : 'none',
            }}>
              <EyeOff size={20} strokeWidth={1.5} style={{color: !isPublic ? S.p : S.tx3, margin:'0 auto 6px', display:'block'}} />
              <p style={{fontSize:14,fontWeight:700,color: !isPublic ? S.p : S.tx2,margin:0}}>{t('session.keep_secret')}</p>
              <p style={{fontSize:11,color: !isPublic ? S.tx2 : S.tx3,margin:'4px 0 0'}}>{t('session.keep_secret_desc')}</p>
            </button>
          </div>
        </div>

        {/* INVITER */}
        <p style={{fontSize:10,fontWeight:700,color:S.p,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>{t('session.invite_options')}</p>

        {/* Message preview + copy */}
        <div style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:16,padding:16,marginBottom:16}}>
          <p style={{fontSize:10,fontWeight:700,color:S.p,textTransform:'uppercase' as const,letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.share_message')}</p>
          <p style={{fontSize:13,color:S.tx,whiteSpace:'pre-wrap',lineHeight:1.6,margin:'0 0 12px'}}>{shareText}</p>
          <button onClick={() => { navigator.clipboard?.writeText(shareText); setCopyFeedback('message') }} style={{
            width:'100%',padding:12,borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',
            border:'1px solid '+(copyFeedback==='message'?S.sage:S.pbd),
            background:copyFeedback==='message'?S.sagebg:S.p2,
            color:copyFeedback==='message'?S.sage:S.p,
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          }}>
            <Copy size={14} strokeWidth={1.5} /> {copyFeedback==='message' ? t('session.copied') : t('session.share_link')}
          </button>
        </div>

        {/* QR Code */}
        <div style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:16,padding:20,marginBottom:16,textAlign:'center'}}>
          <p style={{fontSize:10,fontWeight:700,color:S.lav,textTransform:'uppercase' as const,letterSpacing:'0.08em',margin:'0 0 12px'}}>QR Code</p>
          <div style={{background:'#fff',borderRadius:12,padding:16,display:'inline-block'}}>
            <QRCodeSVG value={shareUrl} size={160} level="M" fgColor="#0C0A14" bgColor="#ffffff" />
          </div>
          <p style={{fontSize:11,color:S.tx3,margin:'10px 0 0'}}>{t('session.qr_hint')}</p>
        </div>

        {/* Share buttons */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank')} style={{
            flex:1,padding:'12px 8px',borderRadius:12,fontSize:12,fontWeight:600,cursor:'pointer',
            border:'1px solid '+S.rule2,background:'rgba(22,20,31,0.85)',color:S.tx2,
            display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4,
          }}>
            <span style={{fontSize:16}}>WhatsApp</span>
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={() => navigator.share({ title: createdSession.title, text: shareText, url: shareUrl }).catch(() => {})} style={{
              flex:1,padding:'12px 8px',borderRadius:12,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid '+S.rule2,background:'rgba(22,20,31,0.85)',color:S.tx2,
              display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4,
            }}>
              <span style={{fontSize:16}}>{t('session.share_native')}</span>
            </button>
          )}
        </div>

        {/* Platform copy buttons */}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          {([
            { app: 'grindr' as const, label: 'Grindr', color: '#FCC70A', bg: 'rgba(252,199,10,0.08)', border: 'rgba(252,199,10,0.25)' },
            { app: 'whatsapp' as const, label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.25)' },
            { app: 'telegram' as const, label: 'Telegram', color: '#26A5E4', bg: 'rgba(38,165,228,0.08)', border: 'rgba(38,165,228,0.25)' },
          ]).map(({ app, label, color, bg, border }) => (
            <button key={app} onClick={() => copyShareMessage(app)} style={{
              padding:'14px 16px',borderRadius:14,fontSize:13,fontWeight:700,
              border:'1px solid '+(copyFeedback === app ? S.sage : border),
              background: copyFeedback === app ? S.sagebg : bg,
              color: copyFeedback === app ? S.sage : color,
              cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10,
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: color, flexShrink:0 }} />
              {copyFeedback === app ? t('session.copied') : t('session.copy_for', { app: label })}
            </button>
          ))}
        </div>

        {/* Group invite */}
        {groups.length > 0 && (
          <div style={{background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid '+S.rule2,borderRadius:16,padding:16,marginBottom:16}}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.lav, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 8px' }}>
              {t('session.invite_group')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {groups.map(g => {
                const done = notifiedGroups.has(g.id)
                return (
                  <button key={g.id} disabled={done} onClick={async () => {
                    const notifs = g.members.map(uid => ({
                      user_id: uid, type: 'session_invite' as const,
                      title: createdSession.title,
                      body: t('session.invite_body'),
                      href: '/join/' + createdSession.invite_code,
                    }))
                    if (notifs.length > 0) await supabase.from('notifications').insert(notifs)
                    setNotifiedGroups(new Set([...notifiedGroups, g.id]))
                  }} style={{
                    padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: '1px solid ' + (done ? S.sagebd : S.rule),
                    background: done ? S.sagebg : 'transparent',
                    color: done ? S.sage : S.tx2, cursor: done ? 'default' : 'pointer',
                    textAlign: 'left',
                  }}>
                    {done ? t('session.invite_sent') + ' — ' : ''}{g.name} ({g.members.length})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* B17: Save as template */}
        <button
          onClick={saveAsTemplate}
          disabled={templateSaved}
          style={{
            width: '100%', padding: 14, borderRadius: 14, marginBottom: 10,
            border: '1px solid ' + (templateSaved ? S.sagebd : S.lavbd || 'rgba(184,178,204,0.25)'),
            background: templateSaved ? S.sagebg : 'transparent',
            color: templateSaved ? S.sage : S.lav,
            fontSize: 14, fontWeight: 600, cursor: templateSaved ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {templateSaved ? <><Check size={14} strokeWidth={2.5} /> {t('session.template_saved')}</> : <><Bookmark size={14} strokeWidth={1.5} /> {t('session.save_as_template')}</>}
        </button>

        <button onClick={() => navigate('/session/' + createdSession.id)} className="btn-shimmer" style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:'pointer',boxShadow:'0 4px 20px '+S.pbd}}>
          {t('session.go_to_session')}
        </button>
      </div>
    </div>
  )
}
