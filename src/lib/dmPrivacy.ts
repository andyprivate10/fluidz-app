export type DmPrivacyLevel = 'open' | 'profile_required' | 'full_access'

export const DM_PRIVACY_LEVELS: { level: DmPrivacyLevel; icon: string; color: string }[] = [
  { level: 'open', icon: 'MessageCircle', color: '#4ADE80' },
  { level: 'profile_required', icon: 'UserCheck', color: '#7DD3FC' },
  { level: 'full_access', icon: 'ShieldCheck', color: '#F9A8A8' },
]
