import { supabase } from './supabase'

/**
 * Vibe Score — 0 to 100
 * 
 * Criteria:
 * - Reviews positives (30%): average rating from received reviews
 * - Participation events (20%): number of checked_in events
 * - Zero signalements (15%): no reports = full score, each report = -10
 * - Taux check-in (15%): % of accepted events where user actually checked in
 * - Profil complet (10%): photos, bio, role, kinks filled
 * - Ancienneté (10%): days since account creation (capped at 90 days)
 */

export type VibeScoreData = {
  score: number
  level: 'new' | 'beginner' | 'reliable' | 'regular' | 'vip'
  label: string
  color: string
  breakdown: {
    reviews: number
    participation: number
    noReports: number
    checkInRate: number
    profileComplete: number
    seniority: number
  }
}

const LEVELS: { min: number; level: VibeScoreData['level']; label: string; color: string }[] = [
  { min: 90, level: 'vip', label: 'VIP', color: '#F9A8A8' },
  { min: 70, level: 'regular', label: 'Regular', color: '#FBBF24' },
  { min: 50, level: 'reliable', label: 'Fiable', color: '#4ADE80' },
  { min: 30, level: 'beginner', label: 'Débutant', color: '#7DD3FC' },
  { min: 0, level: 'new', label: 'Nouveau', color: '#7E7694' },
]

function getLevel(score: number) {
  return LEVELS.find(l => score >= l.min) || LEVELS[LEVELS.length - 1]
}

export async function calculateVibeScore(userId: string): Promise<VibeScoreData> {
  // 1. Reviews received (30%) — average rating normalized to 0-30
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('target_id', userId)
  
  let reviewScore = 15 // default: neutral (half of 30)
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    reviewScore = Math.round((avg / 5) * 30)
  }

  // 2. Participation (20%) — number of checked_in events, capped at 10
  const { count: checkedInCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('applicant_id', userId)
    .eq('status', 'checked_in')
  
  const participationScore = Math.min(20, Math.round(((checkedInCount || 0) / 10) * 20))

  // 3. No reports (15%) — full score if no reports
  // For now, assume no report system yet = full score
  const noReportsScore = 15

  // 4. Check-in rate (15%) — % of accepted where user checked in
  const { count: acceptedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('applicant_id', userId)
    .in('status', ['accepted', 'checked_in'])
  
  let checkInRateScore = 8 // default for new users
  if (acceptedCount && acceptedCount > 0) {
    const rate = (checkedInCount || 0) / acceptedCount
    checkInRateScore = Math.round(rate * 15)
  }

  // 5. Profile complete (10%)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, profile_json')
    .eq('id', userId)
    .maybeSingle()
  
  let profileScore = 0
  if (profile) {
    const pj = (profile.profile_json || {}) as Record<string, unknown>
    if (profile.display_name && profile.display_name !== 'Anonymous') profileScore += 2
    if (pj.avatar_url || (Array.isArray(pj.photos_profil) && (pj.photos_profil as string[]).length > 0)) profileScore += 3
    if (pj.role) profileScore += 2
    if (pj.bio) profileScore += 1
    if (Array.isArray(pj.kinks) && (pj.kinks as string[]).length > 0) profileScore += 1
    if (pj.age) profileScore += 1
  }
  profileScore = Math.min(10, profileScore)

  // 6. Seniority (10%) — days since creation, capped at 90
  const { data: authUser } = await supabase.auth.getUser()
  let seniorityScore = 0
  if (authUser?.user?.created_at) {
    const daysSince = Math.floor((Date.now() - new Date(authUser.user.created_at).getTime()) / (24 * 60 * 60 * 1000))
    seniorityScore = Math.min(10, Math.round((daysSince / 90) * 10))
  }

  const total = Math.min(100, reviewScore + participationScore + noReportsScore + checkInRateScore + profileScore + seniorityScore)
  const level = getLevel(total)

  return {
    score: total,
    level: level.level,
    label: level.label,
    color: level.color,
    breakdown: {
      reviews: reviewScore,
      participation: participationScore,
      noReports: noReportsScore,
      checkInRate: checkInRateScore,
      profileComplete: profileScore,
      seniority: seniorityScore,
    },
  }
}

/**
 * Vibe Score badge component helper
 */
export function vibeScoreBadge(score: number): { label: string; color: string; bg: string } {
  const level = getLevel(score)
  return {
    label: `${score} · ${level.label}`,
    color: level.color,
    bg: level.color + '18',
  }
}
