import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import {ArrowLeft, Clock, Zap, Sparkles, Copy, Eye, EyeOff, Bookmark, Check} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Confetti from '../components/Confetti'
import { colors } from '../brand'
import OrbLayer from '../components/OrbLayer'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { getSessionCover, getTemplateCoverImage } from '../lib/sessionCover'
import { useTranslation } from 'react-i18next'

const S = colors

// Templates are now loaded dynamically from admin_config via useAdminConfig()
// The "custom" option is rendered inline below

const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif",boxSizing:'border-box' as const,
}

export default function CreateSessionPage() {
  const { t } = useTranslation()
  const { sessionTags, roles, sessionTemplates } = useAdminConfig()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tplParam = searchParams.get('tpl')
  const [user, setUser] = useState<any>(null)
  const [_template, setTemplate] = useState('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'template'|'details'|'address'>('template')
  const [savedAddresses, setSavedAddresses] = useState<{ id?: string; label?: string; approx_area?: string; exact_address?: string; directions?: { text: string; photo_url?: string }[] }[]>([])
  const [savingAddress, setSavingAddress] = useState(false)
  const [directions, setDirections] = useState<{ text: string; photo_url?: string }[]>([{ text: '' }])
  const [rolesWanted, setRolesWanted] = useState<Record<string, number>>({})
  const [createdSession, setCreatedSession] = useState<{ id: string; title: string; approx_area: string; invite_code: string } | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<'grindr'|'whatsapp'|'telegram'|'message'|null>(null)
  const [groups, setGroups] = useState<{ id: string; name: string; members: string[] }[]>([])
  const [notifiedGroups, setNotifiedGroups] = useState<Set<string>>(new Set())
  const [startsNow, setStartsNow] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [durationHours, setDurationHours] = useState(3)
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('')
  const [savedTemplates, setSavedTemplates] = useState<{ slug: string; label: string; meta: Record<string, unknown> }[]>([])
  const [templateSaved, setTemplateSaved] = useState(false)

  useEffect(() => {
    if (tplParam && sessionTemplates.length > 0) {
      const tpl = sessionTemplates.find(t => t.slug === tplParam || t.slug === tplParam.replace(/-/g, '_'))
      if (tpl) {
        const meta = tpl.meta as any
        setTitle(tpl.label); setDescription(meta?.description || ''); setSelectedTags(meta?.tags || [])
        setRolesWanted({}); setDirections([{ text: '' }])
        setTemplate(tpl.slug); setStep('details')
      }
    }
  }, [tplParam, sessionTemplates])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (!u) { navigate('/login?next=/session/create'); return }
      else {
        supabase.from('user_profiles').select('profile_json').eq('id', u.id).maybeSingle().then(({ data: prof }) => {
          const pj = prof?.profile_json as any
          const addrs = pj?.saved_addresses
          setSavedAddresses(Array.isArray(addrs) ? addrs : [])
          const tpls = pj?.saved_templates
          setSavedTemplates(Array.isArray(tpls) ? tpls : [])
        })
      }
    })
  }, [])

  async function saveAsTemplate() {
    if (!user || !createdSession) return
    const slug = 'saved_' + Date.now()
    const tpl = {
      slug,
      label: createdSession.title,
      meta: { tags: selectedTags, description, roles_wanted: rolesWanted },
    }
    const updated = [...savedTemplates, tpl]
    setSavedTemplates(updated)
    setTemplateSaved(true)
    // Persist to profile_json
    const { data: prof } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
    const pj = (prof?.profile_json as any) || {}
    await supabase.from('user_profiles').update({ profile_json: { ...pj, saved_templates: updated } }).eq('id', user.id)
    showToast(t('session.template_saved'), 'success')
  }

  function pickTemplate(tpl: { slug: string; label: string; meta?: Record<string, unknown> | null }) {
    const meta = tpl.meta as any
    setTemplate(tpl.slug)
    setSelectedTags(meta?.tags || [])
    if (tpl.slug !== 'custom') {
      setTitle(tpl.label)
      setDescription(meta?.description || '')
    }
    setStep('details')
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(x=>x!==tag) : [...prev, tag])
  }

  async function create() {
    if (!user || !title || !approxArea) return
    setError('')
    setLoading(true)
    const directionsFiltered = directions.filter(d => d.text.trim().length > 0 || d.photo_url)
    const now = new Date()
    const start = startsNow ? now : (startsAt ? new Date(startsAt) : now)
    const end = new Date(start.getTime() + durationHours * 3600000)
    const templateCover = _template !== 'custom' ? getTemplateCoverImage(_template) : undefined
    const { data, error: err } = await supabase.from('sessions').insert({
      host_id: user.id,
      title,
      description,
      approx_area: approxArea,
      exact_address: exactAddress,
      status: 'open',
      tags: selectedTags,
      invite_code: Math.random().toString(36).slice(2, 10),
      is_public: isPublic,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      max_capacity: maxCapacity || null,
      template_slug: _template !== 'custom' ? _template : null,
      cover_url: templateCover || null,
      lineup_json: {
        ...(directionsFiltered.length > 0 ? { directions: directionsFiltered } : {}),
        ...(Object.keys(rolesWanted).length > 0 ? { roles_wanted: rolesWanted } : {}),
      },
    }).select().single()
    setLoading(false)
    if (err) {
      console.error('Create session error:', err)
      setError(err.message)
      return
    }
    if (data) {
      setCreatedSession({ id: data.id, title: data.title, approx_area: data.approx_area, invite_code: data.invite_code })
      // Load user's groups for invite
      const { data: pData } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
      const gIds = ((pData?.profile_json as any)?.contact_groups || []).map((g: any) => g.id)
      if (gIds.length > 0) {
        const { data: groupRows } = await supabase.from('contact_groups').select('id, name').in('id', gIds)
        const { data: memberRows } = await supabase.from('contact_group_members').select('group_id, contact_user_id').in('group_id', gIds)
        setGroups((groupRows || []).map((g: any) => ({
          id: g.id, name: g.name,
          members: (memberRows || []).filter((m: any) => m.group_id === g.id).map((m: any) => m.contact_user_id),
        })))
      }
    }
  }

  function copyShareMessage(app: 'grindr'|'whatsapp'|'telegram') {
    if (!createdSession) return
    const url = typeof window !== 'undefined' ? window.location.origin + '/join/' + createdSession.invite_code : ''
    const title = createdSession.title
    const area = createdSession.approx_area
    const text = app === 'grindr'
      ? title + (area ? ' – ' + area : '') + '\n' + t('share.apply_here') + ': ' + url
      : app === 'whatsapp'
      ? '🔥 ' + title + (area ? ' – ' + area : '') + '\n\n' + t('share.join_here') + ': ' + url
      : '🔥 ' + title + (area ? ' – ' + area : '') + '\n\n' + url
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(app)
      setTimeout(() => setCopyFeedback(null), 2000)
    })
  }

  async function saveAddress() {
    if (!user || (!approxArea && !exactAddress)) return
    setSavingAddress(true)
    const { data: row } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
    const pj = (row?.profile_json as any) || {}
    const addrs = Array.isArray(pj.saved_addresses) ? [...pj.saved_addresses] : []
    addrs.push({ approx_area: approxArea || undefined, exact_address: exactAddress || undefined })
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: row?.display_name ?? '',
      profile_json: { ...pj, saved_addresses: addrs },
    })
    setSavedAddresses(addrs)
    setSavingAddress(false)
  }

  function pickSavedAddress(addr: typeof savedAddresses[0]) {
    if (addr.approx_area) setApproxArea(addr.approx_area)
    if (addr.exact_address) setExactAddress(addr.exact_address)
    if (addr.directions && addr.directions.length > 0) {
      setDirections(addr.directions.map(d => typeof d === 'string' ? { text: d } : d))
    }
  }

  const steps = ['template','details','address']
  const stepIdx = steps.indexOf(step)

  if (createdSession) {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/join/' + createdSession.invite_code : ''
    const shareText = createdSession.title + (createdSession.approx_area ? ' – ' + createdSession.approx_area : '') + '\n\n' + shareUrl
    return (
      <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,maxWidth:480,margin:'0 auto',position:'relative' as const}}>
        <OrbLayer />
        <Confetti />
        <div style={{position:'relative',zIndex:1,padding:'40px 20px 24px'}}>
          <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 8px'}}>{t('session.created_title')}</h1>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 20px'}}>{t('session.share_instructions')}</p>

          {/* ─── VISIBILITY: Publier / Garder Secret ─── */}
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

          {/* ─── INVITER ─── */}
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
                      setNotifiedGroups(prev => new Set([...prev, g.id]))
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

          <button onClick={() => navigate('/session/' + createdSession.id + '/host')} className="btn-shimmer" style={{width:'100%',padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:'pointer',boxShadow:'0 4px 20px '+S.pbd}}>
            {t('session.go_to_session')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:S.bg,paddingBottom:96,maxWidth:480,margin:'0 auto',position:'relative' as const}}>
      <div style={{padding:'40px 20px 16px',borderBottom:'1px solid '+S.rule,background:'rgba(13,12,22,0.92)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <button onClick={() => step==='template' ? navigate(-1) : setStep(steps[stepIdx-1] as any)} style={{background:'none',border:'none',color:S.tx3,fontSize:13,cursor:'pointer',marginBottom:12,padding:0}}><ArrowLeft size={16} strokeWidth={1.5} style={{display:'inline',marginRight:4}} />{t('common.back')}</button>
        <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Bricolage Grotesque', sans-serif",color:S.tx,margin:'0 0 4px'}}>{t('session.new_session')}</h1>
        <p style={{fontSize:13,color:S.tx3,margin:0}}>{t('session.create_step', { step: stepIdx+1 })}</p>
      </div>

      <div style={{display:'flex',padding:'12px 20px 0',gap:6}}>
        {steps.map((s,i) => (
          <div key={s} style={{flex:1,height:3,borderRadius:99,background:i<=stepIdx?S.p:S.bg3,transition:'background 0.3s'}} />
        ))}
      </div>

      {step === 'template' && (
        <div style={{padding:'20px 20px'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:S.tx,margin:'0 0 4px'}}>{t('session.choose_template')}</h2>
          <p style={{fontSize:13,color:S.tx3,margin:'0 0 16px'}}>{t('session.template_help')}</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {/* Custom option — always first */}
            <div onClick={() => pickTemplate({ slug: 'custom', label: 'Custom', meta: { tags: [], description: '' } })} style={{
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
                <p style={{margin:0,fontSize:11,color:S.tx3}}>{t('session.custom_desc')}</p>
              </div>
            </div>
            {/* B17: Saved templates */}
            {savedTemplates.map(tpl => (
              <div key={tpl.slug} onClick={() => pickTemplate(tpl)} style={{
                borderRadius:14,overflow:'hidden',cursor:'pointer',
                border:'1px solid '+S.lavbd,background:S.bg1,
                transition:'transform 0.15s',position:'relative' as const,
              }}>
                <div style={{width:'100%',height:100,background:getSessionCover((tpl.meta as any)?.tags || [tpl.label]).bg,position:'relative' as const}}>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)'}} />
                  <Bookmark size={16} strokeWidth={1.5} style={{position:'absolute',top:8,right:8,color:S.lav}} />
                </div>
                <div style={{padding:'10px 12px'}}>
                  <p style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:S.lav}}>{tpl.label}</p>
                  <p style={{margin:0,fontSize:11,color:S.tx3,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(tpl.meta as any)?.description || t('session.saved_template')}</p>
                </div>
              </div>
            ))}
            {sessionTemplates.filter(tpl => tpl.slug !== 'chemical').map(tpl => {
              const meta = tpl.meta as any
              const coverUrl = meta?.cover_url
              return (
                <div key={tpl.slug} onClick={() => pickTemplate(tpl)} style={{
                  borderRadius:14,overflow:'hidden',cursor:'pointer',
                  border:'1px solid '+S.rule2,background:S.bg1,
                  transition:'transform 0.15s',position:'relative' as const,
                }}>
                  <div style={{width:'100%',height:100,background:coverUrl ? `url(${coverUrl}) center/cover no-repeat` : getSessionCover(meta?.tags || [tpl.label]).bg,position:'relative' as const}}>
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

      {step === 'details' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.title_label')}</p>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t('session.title_placeholder')} style={inp} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.description_label')}</p>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder={t('session.description_placeholder')} rows={3} style={{...inp,resize:'none',lineHeight:1.5}} />
          </div>
          {/* Timing */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.timing_label')}</p>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button onClick={()=>{setStartsNow(true);setStartsAt('')}} style={{flex:1,padding:'10px',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,border:startsNow?'none':'1px solid '+S.rule,background:startsNow?S.grad:S.bg2,color:startsNow?'#fff':S.tx3}}>
                <Zap size={14} /> {t('session.start_now')}
              </button>
              <button onClick={()=>{
                setStartsNow(false)
                if (!startsAt) {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  tomorrow.setHours(20, 0, 0, 0)
                  setStartsAt(tomorrow.toISOString().slice(0, 16))
                }
              }} style={{flex:1,padding:'10px',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,border:!startsNow?'none':'1px solid '+S.rule,background:!startsNow?S.grad:S.bg2,color:!startsNow?'#fff':S.tx3}}>
                <Clock size={14} /> {t('session.start_later')}
              </button>
            </div>
            {!startsNow && (
              <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{...inp,marginBottom:8,colorScheme:'dark'}} />
            )}
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'8px 0 6px'}}>{t('session.duration_label')}</p>
            <div style={{display:'flex',gap:6}}>
              {[1,2,3,4,6,8].map(h => (
                <button key={h} onClick={()=>setDurationHours(h)} style={{flex:1,padding:'8px 0',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',border:durationHours===h?'none':'1px solid '+S.rule,background:durationHours===h?S.p2:S.bg2,color:durationHours===h?S.p:S.tx3}}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          {/* Capacité max */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.capacity_label')}</p>
            <input type="number" value={maxCapacity} onChange={e=>setMaxCapacity(e.target.value ? parseInt(e.target.value) : '')} placeholder={t('session.capacity_placeholder')} min={2} max={50} style={inp} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.tags_label')}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {sessionTags.map(tag => {
                const on = selectedTags.includes(tag.label)
                return (
                  <button key={tag.label} onClick={()=>toggleTag(tag.label)} style={{
                    padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,
                    border:on?'none':'1px solid '+S.rule,
                    background:on?S.grad:S.bg2,color:on?'#fff':S.tx3,cursor:'pointer',
                  }}>{tag.label}</button>
                )
              })}
            </div>
          </div>
          {/* Rôles recherchés */}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.roles_label')}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {roles.map(r => {
                const count = rolesWanted[r.label] || 0
                return (
                  <div key={r.label} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:12,background:count > 0 ? S.p2 : S.bg2,border:'1px solid '+(count > 0 ? S.pbd : S.rule)}}>
      <OrbLayer />
                    <span style={{fontSize:13,fontWeight:600,color:count > 0 ? S.p : S.tx3}}>{r.label}</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <button onClick={()=>setRolesWanted(prev => {const n={...prev}; if((n[r.label]||0)>0) n[r.label]=(n[r.label]||0)-1; if(n[r.label]===0) delete n[r.label]; return n})} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.rule,background:S.bg,color:S.tx3,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>−</button>
                      <span style={{fontSize:14,fontWeight:700,color:S.tx,minWidth:16,textAlign:'center'}}>{count}</span>
                      <button onClick={()=>setRolesWanted(prev => ({...prev,[r.label]:(prev[r.label]||0)+1}))} style={{width:22,height:22,borderRadius:6,border:'1px solid '+S.pbd,background:S.p2,color:S.p,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.keys(rolesWanted).length > 0 && (
              <p style={{fontSize:11,color:S.tx3,margin:'6px 0 0'}}>
                {t('share.searching')} : {Object.entries(rolesWanted).map(([r,c]) => `${c} ${r}${Number(c)>1?'s':''}`).join(', ')}
              </p>
            )}
          </div>
          <button onClick={()=>setStep('address')} disabled={!title} style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:!title?'not-allowed':'pointer',opacity:!title?0.5:1,boxShadow:'0 4px 20px '+S.pbd,marginTop:4}}>
            {t('session.continue_button')}
          </button>
        </div>
      )}

      {step === 'address' && (
        <div style={{padding:'20px 20px',display:'flex',flexDirection:'column',gap:12}}>
          {savedAddresses.length > 0 && (
            <div>
              <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.saved_addresses')}</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {savedAddresses.map((addr, i) => (
                  <button key={addr.id || i} type="button" onClick={() => pickSavedAddress(addr)} style={{
                    padding:'6px 12px',borderRadius:99,fontSize:12,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer',
                  }}>
                    {addr.label || addr.approx_area || t('session.address_label')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.approx_area_label')}</p>
            <input value={approxArea} onChange={e=>setApproxArea(e.target.value)} placeholder={t('session.approx_area_placeholder')} style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>{t('session.approx_area_note')}</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.exact_address_label')}</p>
            <input value={exactAddress} onChange={e=>setExactAddress(e.target.value)} placeholder={t('session.exact_address_placeholder')} style={inp} />
            <p style={{fontSize:11,color:S.tx4,marginTop:6}}>{t('session.exact_address_note')}</p>
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:S.tx3,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 8px'}}>{t('session.directions_label')}</p>
            <p style={{fontSize:12,color:S.tx4,marginBottom:8}}>{t('session.directions_help')}</p>
            {directions.map((step, i) => (
              <div key={i} style={{marginBottom:8,padding:10,background:S.bg,borderRadius:10,border:'1px solid '+S.rule}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.p}}>#{i+1}</span>
                  <input value={step.text} onChange={e=>{ const next=[...directions]; next[i]={...next[i],text:e.target.value}; setDirections(next) }} placeholder={'Ex: Rentre par le parking...'} style={{...inp,flex:1,fontSize:13}} />
                  {directions.length > 1 && (
                    <button type="button" onClick={()=>setDirections(directions.filter((_,j)=>j!==i))} style={{padding:'6px 10px',borderRadius:8,fontSize:11,border:'1px solid '+S.redbd,background:'transparent',color:S.red,cursor:'pointer'}}>×</button>
                  )}
                </div>
                {step.photo_url ? (
                  <div style={{marginTop:6,position:'relative',display:'inline-block'}}>
                    <img src={step.photo_url} alt="" loading="lazy" style={{width:80,height:60,objectFit:'cover',borderRadius:8,border:'1px solid '+S.rule}} />
                    <button type="button" onClick={()=>{ const next=[...directions]; next[i]={...next[i],photo_url:undefined}; setDirections(next) }} style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:S.red,border:'none',color:'#fff',fontSize:10,cursor:'pointer'}}>×</button>
                  </div>
                ) : (
                  <label style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'4px 8px',borderRadius:6,border:'1px solid '+S.rule,background:S.bg2,color:S.tx4,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                    Photo
                    <input type="file" accept="image/*" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f)return; const { compressImage: ci } = await import('../lib/media'); const c = await ci(f); const { data:{ user } } = await supabase.auth.getUser(); if(!user) return; const path=user.id+'/dir_'+Date.now()+'.jpg'; const {error}=await supabase.storage.from('avatars').upload(path,c); if(error) return; const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path); const next=[...directions]; next[i]={...next[i],photo_url:publicUrl}; setDirections(next) }} style={{display:'none'}} />
                  </label>
                )}
              </div>
            ))}
            <button type="button" onClick={()=>setDirections([...directions,{text:''}])} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.rule,background:S.bg2,color:S.tx2,cursor:'pointer'}}>
              {t('session.add_direction')}
            </button>
          </div>

          <button onClick={saveAddress} disabled={savingAddress || (!approxArea && !exactAddress)} style={{padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:'1px solid '+S.p,background:'transparent',color:S.p,cursor:savingAddress||(!approxArea&&!exactAddress)?'not-allowed':'pointer',opacity:savingAddress||(!approxArea&&!exactAddress)?0.6:1}}>
            {savingAddress ? t('common.saving') : t('session.save_address')}
          </button>
          <div style={{padding:'12px 14px',background:'rgba(22,20,31,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:12,border:'1px solid '+S.rule2}}>
            <p style={{fontSize:12,color:S.tx3,margin:0}}>{t('session.address_privacy_note')}</p>
          </div>
          {error && <p style={{color:S.p,fontSize:13,margin:'0 0 4px',padding:'10px 14px',background:S.p3,borderRadius:10}}>{error}</p>}
          <button onClick={create} disabled={loading||!title||!approxArea} className='btn-shimmer' style={{padding:'14px',borderRadius:14,fontWeight:700,fontSize:15,color:'#fff',background:S.grad,border:'none',position:'relative' as const,overflow:'hidden',cursor:loading||!title||!approxArea?'not-allowed':'pointer',opacity:loading||!title||!approxArea?0.5:1,boxShadow:'0 4px 20px '+S.pbd,marginTop:4}}>
            {loading ? t('session.creating') : t('session.create_button')}
          </button>
        </div>
      )}

    </div>
  )
}