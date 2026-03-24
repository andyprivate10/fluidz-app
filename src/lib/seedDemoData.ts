import { supabase } from './supabase'

const TEST_PASSWORD = 'testpass123'

// ── Helper: sign in and return user id ──
async function signIn(email: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (error) throw new Error(`Login ${email}: ${error.message}`)
  return data.user!.id
}

// ── Helper: sign up, return user id (no-op if exists) ──
async function ensureUser(email: string, displayName: string, profileJson: Record<string, unknown>): Promise<string> {
  // Try sign in first
  const { data: existing } = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (existing?.user) {
    await supabase.from('user_profiles').upsert({
      id: existing.user.id,
      display_name: displayName,
      profile_json: profileJson,
    })
    return existing.user.id
  }
  // Sign up
  const { data: created, error } = await supabase.auth.signUp({ email, password: TEST_PASSWORD })
  if (error) throw new Error(`SignUp ${email}: ${error.message}`)
  if (!created.user) throw new Error(`SignUp ${email}: no user returned`)
  await supabase.from('user_profiles').upsert({
    id: created.user.id,
    display_name: displayName,
    profile_json: profileJson,
  })
  return created.user.id
}


// ── User profiles ──
const PROFILES: Record<string, { email: string; display_name: string; profile_json: Record<string, unknown> }> = {
  marcus: {
    email: 'marcus@fluidz.test',
    display_name: 'Marcus',
    profile_json: {
      age: 34, role: 'Versatile', bio: 'Host régulier à Paris. Ambiance chill et respectueuse. DM open.',
      height: 182, weight: 78, morphology: 'Athletic',
      tribes: ['daddy', 'stud', 'leather'],
      ethnicities: ['white_caucasian', 'mediterranean'],
      kinks: ['group', 'sm_light', 'role_play', 'exhib'],
      prep_status: 'active', last_test: '2026-02-15',
      avatar_url: 'https://i.pravatar.cc/300?u=marcus',
      dm_privacy: 'open',
    },
  },
  karim: {
    email: 'karim@fluidz.test',
    display_name: 'Karim',
    profile_json: {
      age: 28, role: 'Bottom', bio: 'Nouveau sur Fluidz. Curieux et ouvert.',
      height: 175, weight: 72, morphology: 'Fit',
      tribes: ['jock', 'geek_nerd'],
      ethnicities: ['maghrebi', 'white_caucasian'],
      kinks: ['group', 'voyeur'],
      prep_status: 'active', last_test: '2026-01-20',
      avatar_url: 'https://i.pravatar.cc/300?u=karim',
      dm_privacy: 'profile_required',
    },
  },
  yann: {
    email: 'yann@fluidz.test',
    display_name: 'Yann',
    profile_json: {
      age: 31, role: 'Top', bio: 'Sportif, direct, pas de drama.',
      height: 188, weight: 85, morphology: 'Muscular',
      tribes: ['jock', 'hunk'],
      ethnicities: ['white_caucasian'],
      kinks: ['sm_light', 'dom'],
      prep_status: 'active', last_test: '2026-03-01',
      avatar_url: 'https://i.pravatar.cc/300?u=yann',
      dm_privacy: 'open',
    },
  },
  lucas: {
    email: 'lucas@fluidz.test',
    display_name: 'Lucas',
    profile_json: {
      age: 24, role: 'Bottom', bio: 'Twink parisien. J\'aime les soirées chill.',
      height: 170, weight: 62, morphology: 'Slim',
      tribes: ['twink', 'femboy'],
      ethnicities: ['white_caucasian', 'scandinavian'],
      kinks: ['voyeur', 'exhib'],
      prep_status: 'active', last_test: '2026-02-28',
      avatar_url: 'https://i.pravatar.cc/300?u=lucas',
      dm_privacy: 'full_access',
    },
  },
  amine: {
    email: 'amine@fluidz.test',
    display_name: 'Amine',
    profile_json: {
      age: 29, role: 'Versatile', bio: 'Bear chill, amateur de techno et de plans relax.',
      height: 178, weight: 92, morphology: 'Stocky',
      tribes: ['bear', 'cub'],
      ethnicities: ['maghrebi'],
      kinks: ['group', 'fetish', 'bears_welcome'],
      prep_status: 'active', last_test: '2026-01-10',
      avatar_url: 'https://i.pravatar.cc/300?u=amine',
      dm_privacy: 'profile_required',
    },
  },
  theo: {
    email: 'theo@fluidz.test',
    display_name: 'Théo',
    profile_json: {
      age: 26, role: 'Top', bio: 'Gym addict. Cherche plans réguliers.',
      height: 180, weight: 80, morphology: 'Athletic',
      tribes: ['gym_bunny', 'jock', 'bull'],
      ethnicities: ['white_caucasian', 'eastern_european'],
      kinks: ['dom', 'sm_light', 'group'],
      prep_status: 'active', last_test: '2026-03-10',
      avatar_url: 'https://i.pravatar.cc/300?u=theo',
      dm_privacy: 'open',
    },
  },
  romain: {
    email: 'romain@fluidz.test',
    display_name: 'Romain',
    profile_json: {
      age: 38, role: 'Top', bio: 'Daddy bienveillant. Safe, sane, consensual.',
      height: 185, weight: 88, morphology: 'Athletic',
      tribes: ['daddy', 'leather', 'handler'],
      ethnicities: ['white_caucasian'],
      kinks: ['sm_hard', 'leather', 'pup_play', 'dom'],
      prep_status: 'active', last_test: '2026-02-20',
      avatar_url: 'https://i.pravatar.cc/300?u=romain',
      dm_privacy: 'profile_required',
    },
  },
  samir: {
    email: 'samir@fluidz.test',
    display_name: 'Samir',
    profile_json: {
      age: 27, role: 'Bottom', bio: 'Discret. Premier plan de groupe.',
      height: 173, weight: 68, morphology: 'Slim',
      tribes: ['otter', 'discreet'],
      ethnicities: ['arab', 'maghrebi'],
      kinks: ['first_time', 'group'],
      prep_status: 'inactive', last_test: '2025-12-01',
      avatar_url: 'https://i.pravatar.cc/300?u=samir',
      dm_privacy: 'full_access',
    },
  },
  alex: {
    email: 'alex@fluidz.test',
    display_name: 'Alex',
    profile_json: {
      age: 32, role: 'Versatile', bio: 'Non-binary. Open to anything respectful.',
      height: 176, weight: 70, morphology: 'Average',
      tribes: ['non_binary', 'androgyne', 'geek_nerd'],
      ethnicities: ['east_asian', 'white_caucasian'],
      kinks: ['role_play', 'voyeur', 'exhib'],
      prep_status: 'active', last_test: '2026-03-05',
      avatar_url: 'https://i.pravatar.cc/300?u=alex',
      dm_privacy: 'open',
    },
  },
  jules: {
    email: 'jules@fluidz.test',
    display_name: 'Jules',
    profile_json: {
      age: 22, role: 'Bottom', bio: 'Circuit boy. Dispo le weekend.',
      height: 175, weight: 65, morphology: 'Slim',
      tribes: ['twunk', 'circuit_boy'],
      ethnicities: ['afro_caribbean', 'white_caucasian'],
      kinks: ['group', 'exhib', 'party'],
      prep_status: 'active', last_test: '2026-03-15',
      avatar_url: 'https://i.pravatar.cc/300?u=jules',
      dm_privacy: 'open',
    },
  },
}

export type SeedProgress = (msg: string) => void

export async function seedDemoData(onProgress?: SeedProgress): Promise<void> {
  const log = onProgress || (() => {})

  // ════════════════════════════════════════
  // TASK 1: Create 10 user profiles
  // ════════════════════════════════════════
  log('Creating users...')
  const ids: Record<string, string> = {}

  for (const [key, profile] of Object.entries(PROFILES)) {
    ids[key] = await ensureUser(profile.email, profile.display_name, profile.profile_json)
    log(`  ✓ ${profile.display_name} (${profile.email})`)
  }

  // Sign back in as marcus (admin/host) for the rest
  await signIn('marcus@fluidz.test')

  log(`✅ ${Object.keys(ids).length} users created`)
}
