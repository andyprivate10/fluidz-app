import { User, Drama, Dumbbell, Flame, Heart, ShieldOff, Camera, Zap, Eye, Grid3X3 } from 'lucide-react'

export type Section = { id: string; label: string; icon: typeof Camera; desc: string }

export function getBodyZones(t: (k: string) => string) {
  return [
    { id: 'torso', label: t('zones.torso') },
    { id: 'sex', label: t('zones.sex') },
    { id: 'butt', label: t('zones.butt') },
    { id: 'feet', label: t('zones.feet') },
  ]
}

export function getSections(t: (k: string) => string) {
  const BLOC_PROFIL: Section[] = [
    {id:'photos_profil',label:t('sections.photos_profil'),icon:Camera,desc:t('sections.photos_profil_desc')},
    {id:'basics',label:t('sections.basics'),icon:User,desc:t('sections.basics_desc')},
    {id:'physique',label:t('sections.physique'),icon:Dumbbell,desc:t('sections.physique_desc')},
  ]
  const BLOC_ADULTE: Section[] = [
    {id:'photos_adulte',label:t('sections.photos_adulte'),icon:Eye,desc:t('sections.photos_adulte_desc')},
    {id:'body_part_photos',label:t('sections.body_part_photos'),icon:Grid3X3,desc:t('sections.body_part_photos_desc')},
    {id:'role',label:t('sections.role'),icon:Drama,desc:t('sections.role_desc')},
    {id:'pratiques',label:t('sections.pratiques'),icon:Flame,desc:t('sections.pratiques_desc')},
    {id:'limites',label:t('sections.limites'),icon:ShieldOff,desc:t('sections.limites_desc')},
    {id:'sante',label:t('sections.sante'),icon:Heart,desc:t('sections.sante_desc')},
  ]
  const SECTION_OCCASION: Section = {id:'occasion',label:t('sections.occasion'),icon:Zap,desc:t('sections.occasion_desc')}
  const ALL_SECTIONS = [...BLOC_PROFIL, ...BLOC_ADULTE, SECTION_OCCASION]
  return { BLOC_PROFIL, BLOC_ADULTE, SECTION_OCCASION, ALL_SECTIONS }
}

export const GUEST_TOKEN_KEY = 'guest_token'
export const GUEST_SESSION_KEY = 'guest_session_id'
export const RATE_LIMIT_MIN = 5

