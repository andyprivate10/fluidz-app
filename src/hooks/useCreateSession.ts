import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useAdminConfig } from './useAdminConfig'
import { getSessionCover, getTemplateCoverImage } from '../lib/sessionCover'
import { useTranslation } from 'react-i18next'
import { colors } from '../brand'

const S = colors

export const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif",boxSizing:'border-box' as const,
}

export function useCreateSession() {
  const { t } = useTranslation()
  const { sessionTags, roles, sessionTemplates } = useAdminConfig()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tplParam = searchParams.get('tpl')
  const inviteParam = searchParams.get('invite')
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
  const [preInviteGroup, setPreInviteGroup] = useState<{ id: string; name: string; members: string[] } | null>(null)
  const [showGroupPicker, setShowGroupPicker] = useState(false)
  const [allGroups, setAllGroups] = useState<{ id: string; name: string; members: string[] }[]>([])
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
        // Load user's groups for pre-invite
        supabase.from('contact_groups').select('id, name').eq('owner_id', u.id).then(({ data: gRows }) => {
          if (gRows && gRows.length > 0) {
            supabase.from('contact_group_members').select('group_id, contact_user_id').in('group_id', gRows.map(g => g.id)).then(({ data: mRows }) => {
              const groups = gRows.map(g => ({
                id: g.id, name: g.name,
                members: (mRows || []).filter((m: any) => m.group_id === g.id).map((m: any) => m.contact_user_id),
              }))
              setAllGroups(groups)
              // Auto-select group from ?group= param
              const groupParam = searchParams.get('group')
              if (groupParam) {
                const found = groups.find(g => g.id === groupParam)
                if (found) setPreInviteGroup(found)
              }
            })
          }
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
      // Auto-invite peer from DM if ?invite= param present
      if (inviteParam) {
        await supabase.from('applications').insert({
          session_id: data.id,
          applicant_id: inviteParam,
          status: 'accepted',
          eps_json: {},
        })
        await supabase.from('notifications').insert({
          user_id: inviteParam,
          session_id: data.id,
          type: 'session_invite',
          message: t('session.invite_body'),
          href: '/join/' + data.invite_code,
        })
      }
      // Auto-invite pre-selected group members
      if (preInviteGroup && preInviteGroup.members.length > 0) {
        const apps = preInviteGroup.members.map(uid => ({
          session_id: data.id, applicant_id: uid, status: 'accepted', eps_json: {},
        }))
        await supabase.from('applications').insert(apps)
        const notifs = preInviteGroup.members.map(uid => ({
          user_id: uid, session_id: data.id, type: 'session_invite',
          message: t('session.invite_body'), href: '/join/' + data.invite_code,
        }))
        await supabase.from('notifications').insert(notifs)
      }
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

  return {
    // translation
    t,
    // admin config
    sessionTags, roles, sessionTemplates,
    // navigation
    navigate,
    // state
    user,
    _template,
    title, setTitle,
    description, setDescription,
    approxArea, setApproxArea,
    exactAddress, setExactAddress,
    selectedTags,
    loading,
    error,
    step, setStep,
    savedAddresses,
    savingAddress,
    directions, setDirections,
    rolesWanted, setRolesWanted,
    createdSession,
    isPublic, setIsPublic,
    copyFeedback, setCopyFeedback,
    groups,
    notifiedGroups, setNotifiedGroups,
    startsNow, setStartsNow,
    startsAt, setStartsAt,
    durationHours, setDurationHours,
    maxCapacity, setMaxCapacity,
    savedTemplates,
    preInviteGroup, setPreInviteGroup,
    showGroupPicker, setShowGroupPicker,
    allGroups,
    templateSaved,
    // derived
    steps,
    stepIdx,
    // handlers
    pickTemplate,
    toggleTag,
    create,
    copyShareMessage,
    saveAddress,
    pickSavedAddress,
    saveAsTemplate,
    // lib re-exports needed by UI
    getSessionCover,
  }
}
