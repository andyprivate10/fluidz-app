import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type AdminConfigItem = {
  id: string
  type: string
  slug: string
  label: string
  category: string | null
  sort_order: number
  active: boolean
  meta?: Record<string, unknown> | null
}

const FALLBACK_MORPHOLOGIES: AdminConfigItem[] = [
  'Mince','Sportif','Athlétique','Moyen','Costaud','Musclé','Gros',
].map((label, i) => ({ id: `fb-morpho-${i}`, type: 'morphology', slug: label.toLowerCase(), label, category: null, sort_order: i, active: true }))

const FALLBACK_ROLES: AdminConfigItem[] = [
  'Top','Bottom','Versa','Side',
].map((label, i) => ({ id: `fb-role-${i}`, type: 'role', slug: label.toLowerCase(), label, category: null, sort_order: i, active: true }))

const FALLBACK_KINKS: AdminConfigItem[] = [
  'Fist','SM léger','SM hard','Bareback','Group','Exhib','Voyeur','Fétichisme','Jeux de rôle',
].map((label, i) => ({ id: `fb-kink-${i}`, type: 'kink', slug: label.toLowerCase().replace(/\s+/g, '-'), label, category: null, sort_order: i, active: true }))

export function useAdminConfig() {
  const [kinks, setKinks] = useState<AdminConfigItem[]>(FALLBACK_KINKS)
  const [morphologies, setMorphologies] = useState<AdminConfigItem[]>(FALLBACK_MORPHOLOGIES)
  const [roles, setRoles] = useState<AdminConfigItem[]>(FALLBACK_ROLES)
  const [sessionTags, setSessionTags] = useState<AdminConfigItem[]>([])
  const [sessionTemplates, setSessionTemplates] = useState<AdminConfigItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from('admin_config')
      .select('id, type, slug, label, category, sort_order, active, meta')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!mounted) return
        if (error || !data || data.length === 0) {
          setLoading(false)
          return
        }
        const byType = (t: string) => data.filter((d: AdminConfigItem) => d.type === t)
        const m = byType('morphology')
        const r = byType('role')
        const k = byType('kink')
        const s = byType('session_tag')
        const t = byType('session_template')
        if (m.length > 0) setMorphologies(m)
        if (r.length > 0) setRoles(r)
        if (k.length > 0) setKinks(k)
        if (s.length > 0) setSessionTags(s)
        if (t.length > 0) setSessionTemplates(t)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  return { kinks, morphologies, roles, sessionTags, sessionTemplates, loading }
}
