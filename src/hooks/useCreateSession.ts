import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useAdminConfig } from './useAdminConfig'
import { getSessionCover, getTemplateCoverImage } from '../lib/sessionCover'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '../brand'
import { useAuth } from '../contexts/AuthContext'

const S = colors

export const inp: React.CSSProperties = {
  width:'100%',background:S.bg2,color:S.tx,borderRadius:14,
  padding:'12px 16px',border:'1px solid '+S.rule,outline:'none',
  fontSize:14,fontFamily:fonts.body,boxSizing:'border-box' as const,
}

export type StepName = 'basics' | 'rules' | 'address' | 'timing' | 'visibility'
const STEPS: StepName[] = ['basics', 'rules', 'address', 'timing', 'visibility']

export function useCreateSession() {
  const { t } = useTranslation()
  const { sessionTags, roles, sessionTemplates: rawTemplates } = useAdminConfig()
  const sessionTemplates = rawTemplates
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tplParam = searchParams.get('tpl')
  const inviteParam = searchParams.get('invite')
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [_template, setTemplate] = useState('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [approxArea, setApproxArea] = useState('')
  const [exactAddress, setExactAddress] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('France')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<StepName>('basics')
  const [savedAddresses, setSavedAddresses] = useState<{ id?: string; label?: string; approx_area?: string; exact_address?: string; directions?: { text: string; photo_url?: string }[]; last_used?: string; street_address?: string; postal_code?: string; city?: string; country?: string }[]>([])
  const [savingAddress, setSavingAddress] = useState(false)
  const [directions, setDirections] = useState<{ text: string; photo_url?: string }[]>([{ text: '' }])
  const [rolesWanted, setRolesWanted] = useState<Record<string, number>>({})
  const [isPublic, setIsPublic] = useState(false)
  const [startsNow, setStartsNow] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [durationHours, setDurationHours] = useState(3)
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('')
  const [savedTemplates, setSavedTemplates] = useState<{ slug: string; label: string; meta: Record<string, unknown> }[]>([])
  const [hostRules, setHostRules] = useState(t('session.default_host_rules'))
  const [addressMode, setAddressMode] = useState<'last'|'list'|'new'>('last')

  useEffect(() => {
    if (tplParam && sessionTemplates.length > 0) {
      const tpl = sessionTemplates.find(t => t.slug === tplParam || t.slug === tplParam.replace(/-/g, '_'))
      if (tpl) {
        const meta = tpl.meta as Record<string, unknown>
        setTitle(tpl.label); setDescription((meta?.description as string) || ''); setSelectedTags((meta?.tags as string[]) || [])
        setRolesWanted({}); setDirections([{ text: '' }])
        setTemplate(tpl.slug); setStep('rules')
      }
    }
  }, [tplParam, sessionTemplates])

  useEffect(() => {
    if (!authUser) { navigate('/login?next=/session/create'); return }
    setUser({ id: authUser.id, email: authUser.email })
    let mounted = true
    supabase.from('user_profiles').select('profile_json').eq('id', authUser.id).maybeSingle().then(({ data: prof }) => {
      if (!mounted) return
      const pj = prof?.profile_json as Record<string, unknown>
      const addrs = pj?.saved_addresses
      const addrList = Array.isArray(addrs) ? addrs : []
      setSavedAddresses(addrList)
      // Pre-select last used address
      if (addrList.length > 0) {
        const sorted = [...addrList].sort((a: { last_used?: string }, b: { last_used?: string }) => {
          const ta = a.last_used ? new Date(a.last_used).getTime() : 0
          const tb = b.last_used ? new Date(b.last_used).getTime() : 0
          return tb - ta
        })
        const lastAddr = sorted[0]
        if (lastAddr.approx_area) setApproxArea(lastAddr.approx_area)
        if (lastAddr.exact_address) setExactAddress(lastAddr.exact_address)
        if (lastAddr.directions && lastAddr.directions.length > 0) {
          setDirections(lastAddr.directions.map((d: string | { text: string; photo_url?: string }) => typeof d === 'string' ? { text: d } : d))
        }
        setAddressMode('last')
      }
      const tpls = (pj as Record<string, unknown>)?.saved_templates
      setSavedTemplates(Array.isArray(tpls) ? tpls : [])
    })
    return () => { mounted = false }
  }, [authUser])

  async function saveAsTemplate() {
    if (!user || !title) return
    const slug = 'saved_' + Date.now()
    const tpl = {
      slug,
      label: title,
      meta: { tags: selectedTags, description, roles_wanted: rolesWanted, host_rules: hostRules },
    }
    const updated = [...savedTemplates, tpl]
    setSavedTemplates(updated)
    const { data: prof } = await supabase.from('user_profiles').select('profile_json').eq('id', user.id).maybeSingle()
    const pj = (prof?.profile_json as Record<string, unknown>) || {}
    await supabase.from('user_profiles').update({ profile_json: { ...pj, saved_templates: updated } }).eq('id', user.id)
    showToast(t('session.template_saved'), 'success')
  }

  function pickTemplate(tpl: { slug: string; label: string; meta?: Record<string, unknown> | null }) {
    const meta = (tpl.meta as Record<string, unknown> | null) ?? {}
    setTemplate(tpl.slug)
    setSelectedTags((meta?.tags as string[]) || [])
    if (tpl.slug !== 'custom') {
      setTitle(tpl.label)
      setDescription((meta?.description as string) || '')
    }
    if (meta?.host_rules) setHostRules(meta.host_rules as string)
    setStep('rules')
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(x=>x!==tag) : [...prev, tag])
  }

  function clearAddress() {
    setApproxArea('')
    setExactAddress('')
    setStreetAddress('')
    setPostalCode('')
    setCity('')
    setCountry('France')
    setDirections([{ text: '' }])
  }

  function switchAddressMode(mode: 'last'|'list'|'new') {
    setAddressMode(mode)
    if (mode === 'new') clearAddress()
  }

  async function create() {
    if (!user || !title || !approxArea) return
    setError('')
    setLoading(true)
    // Combine structured address fields into exact_address
    const combinedExact = [streetAddress, postalCode && city ? `${postalCode} ${city}` : city, country].filter(Boolean).join(', ')
    if (combinedExact && !exactAddress) setExactAddress(combinedExact)
    const finalExactAddress = exactAddress || combinedExact
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
      exact_address: finalExactAddress,
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
        host_rules: hostRules,
      },
    }).select().single()
    setLoading(false)
    if (err) {
      console.error('Create session error:', err)
      setError(err.message)
      return
    }
    if (data) {
      // Mark address as last used
      if (approxArea || exactAddress) {
        const { data: profRow } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
        const pj = (profRow?.profile_json as Record<string, unknown>) || {}
        const addrs = Array.isArray(pj.saved_addresses) ? [...pj.saved_addresses] : []
        const existing = addrs.findIndex((a: { approx_area?: string; exact_address?: string }) => a.approx_area === approxArea && a.exact_address === exactAddress)
        if (existing >= 0) {
          addrs[existing] = { ...addrs[existing], last_used: new Date().toISOString() }
        }
        await supabase.from('user_profiles').upsert({
          id: user.id,
          display_name: profRow?.display_name ?? '',
          profile_json: { ...pj, saved_addresses: addrs },
        })
      }
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
          title: t('session.invite_body'),
          body: '',
          href: '/join/' + data.invite_code,
        })
      }
      // Navigate directly to host dashboard recruit tab
      navigate(`/session/${data.id}`)
    }
  }

  async function saveAddress() {
    if (!user || (!approxArea && !exactAddress)) return
    setSavingAddress(true)
    const { data: row } = await supabase.from('user_profiles').select('display_name, profile_json').eq('id', user.id).maybeSingle()
    const pj = (row?.profile_json as Record<string, unknown>) || {}
    const addrs = Array.isArray(pj.saved_addresses) ? [...pj.saved_addresses] : []
    addrs.push({ approx_area: approxArea || undefined, exact_address: exactAddress || undefined, last_used: new Date().toISOString() })
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
    if (addr.street_address) setStreetAddress(addr.street_address)
    if (addr.postal_code) setPostalCode(addr.postal_code)
    if (addr.city) setCity(addr.city)
    if (addr.country) setCountry(addr.country)
    if (addr.directions && addr.directions.length > 0) {
      setDirections(addr.directions.map(d => typeof d === 'string' ? { text: d } : d))
    }
  }

  const steps = STEPS
  const stepIdx = steps.indexOf(step)

  return {
    t,
    sessionTags, roles, sessionTemplates,
    navigate,
    user,
    _template,
    title, setTitle,
    description, setDescription,
    approxArea, setApproxArea,
    exactAddress, setExactAddress,
    streetAddress, setStreetAddress,
    postalCode, setPostalCode,
    city, setCity,
    country, setCountry,
    selectedTags,
    loading,
    error,
    step, setStep,
    savedAddresses,
    savingAddress,
    directions, setDirections,
    rolesWanted, setRolesWanted,
    isPublic, setIsPublic,
    startsNow, setStartsNow,
    startsAt, setStartsAt,
    durationHours, setDurationHours,
    maxCapacity, setMaxCapacity,
    savedTemplates,
    hostRules, setHostRules,
    addressMode, switchAddressMode,
    steps,
    stepIdx,
    pickTemplate,
    toggleTag,
    create,
    saveAddress,
    pickSavedAddress,
    saveAsTemplate,
    clearAddress,
    getSessionCover,
  }
}
