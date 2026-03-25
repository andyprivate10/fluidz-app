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

// ── Helper: relative timestamps ──
function daysAgo(days: number, offsetHours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() + offsetHours)
  return d.toISOString()
}

function hoursAgo(hours: number): string {
  return daysAgo(0, -hours)
}

// ── Helper: deterministic DM session ID (must match DirectDMPage) ──
function directDmSessionId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort()
  const combined = sorted.join('-')
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `dddd0000-${hex.slice(0, 4)}-${hex.slice(4, 8)}-0000-${sorted[0].slice(0, 12)}`
}

// ── Helper: upsert session by invite_code ──
async function upsertSession(session: Record<string, unknown>): Promise<string> {
  const code = session.invite_code as string
  const { data: existing } = await supabase.from('sessions').select('id').eq('invite_code', code).maybeSingle()
  if (existing) {
    await supabase.from('sessions').update(session).eq('id', existing.id)
    return existing.id
  }
  const { data, error } = await supabase.from('sessions').insert(session).select('id').single()
  if (error) throw new Error(`Session insert (${code}): ${error.message}`)
  return data.id
}

// ── Helper: upsert application ──
async function upsertApplication(app: Record<string, unknown>): Promise<string> {
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('session_id', app.session_id)
    .eq('applicant_id', app.applicant_id)
    .maybeSingle()
  if (existing) {
    await supabase.from('applications').update(app).eq('id', existing.id)
    return existing.id
  }
  const { data, error } = await supabase.from('applications').insert(app).select('id').single()
  if (error) throw new Error(`Application insert: ${error.message}`)
  return data.id
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
    log(`  ✓ ${profile.display_name}`)
  }
  log(`✅ ${Object.keys(ids).length} users created`)

  // ════════════════════════════════════════
  // TASK 2: Create 5 sessions + applications
  // ════════════════════════════════════════
  log('Creating sessions...')
  await signIn('marcus@fluidz.test')

  const s1Id = await upsertSession({
    host_id: ids.marcus, title: 'Dark Room Bastille', status: 'ended',
    approx_area: 'Paris 11ème — Bastille', exact_address: '14 Rue de la Roquette, 75011 Paris',
    description: 'Soirée intime, max 6 personnes. Ambiance tamisée, respect obligatoire.',
    template_slug: 'dark_room', tags: ['dark_room', 'intime', 'safe'],
    max_capacity: 6, created_at: daysAgo(14), starts_at: daysAgo(14, -2), ends_at: daysAgo(14, -6),
    invite_code: 'DARK14',
    lineup_json: { roles_wanted: { Bottom: 3, Top: 2, Versatile: 1 }, directions: ['Entrée par la cour', '2ème étage gauche', 'Sonnez 2 fois'] },
  })
  log('  ✓ Session 1: Dark Room Bastille (ended)')

  const s2Id = await upsertSession({
    host_id: ids.marcus, title: 'Techno After Marais', status: 'ended',
    approx_area: 'Paris 3ème — Marais', exact_address: '42 Rue des Archives, 75003 Paris',
    description: 'After techno. Viens comme tu es. Pas de jugement.',
    template_slug: 'techno', tags: ['techno', 'after', 'chill'],
    max_capacity: 8, created_at: daysAgo(5), starts_at: daysAgo(5, -1), ends_at: daysAgo(5, -5),
    invite_code: 'TECH05',
    lineup_json: { roles_wanted: { Top: 2, Bottom: 3 } },
  })
  log('  ✓ Session 2: Techno After Marais (ended)')

  const s3Id = await upsertSession({
    host_id: ids.romain, title: 'Leather Night', status: 'ended',
    approx_area: 'Paris 18ème — Montmartre', exact_address: '8 Rue Lepic, 75018 Paris',
    description: 'Soirée cuir/latex. Dress code obligatoire. Novices bienvenus si guidés.',
    template_slug: 'leather', tags: ['leather', 'fetish', 'dresscode'],
    max_capacity: 5, created_at: daysAgo(1), starts_at: daysAgo(1, -3), ends_at: daysAgo(1, -7),
    invite_code: 'LEATH1',
    lineup_json: {},
  })
  log('  ✓ Session 3: Leather Night (ended)')

  const s4Id = await upsertSession({
    host_id: ids.marcus, title: 'Plan ce soir République', status: 'open',
    approx_area: 'Paris 10ème — République', exact_address: '23 Rue du Faubourg du Temple, 75010 Paris',
    description: 'Soirée spontanée. DM pour détails.',
    template_slug: 'after', tags: ['spontané', 'chill', 'groupe'],
    max_capacity: 6, created_at: hoursAgo(2), starts_at: new Date().toISOString(), ends_at: daysAgo(0, -4),
    invite_code: 'REPUB1',
    lineup_json: { roles_wanted: { Bottom: 2, Top: 1 }, directions: ['RDC porte verte', 'Code: 4521'] },
  })
  log('  ✓ Session 4: Plan ce soir République (open)')

  const s5Id = await upsertSession({
    host_id: ids.marcus, title: 'Weekend Chill', status: 'draft',
    approx_area: 'Paris 5ème — Quartier Latin',
    description: 'Planning pour le weekend prochain.',
    template_slug: 'nature', tags: ['weekend', 'chill'],
    max_capacity: 8,
    invite_code: 'WKEND1',
    lineup_json: {},
  })
  log('  ✓ Session 5: Weekend Chill (draft)')
  // keep s5Id referenced to avoid lint
  void s5Id

  // ── Applications ──
  log('Creating applications...')

  // Session 1 members: Karim, Yann, Lucas, Amine (all checked_in)
  const s1Members = [
    { key: 'karim', role: 'Bottom' },
    { key: 'yann', role: 'Top' },
    { key: 'lucas', role: 'Bottom' },
    { key: 'amine', role: 'Versatile' },
  ]
  for (const m of s1Members) {
    await signIn(PROFILES[m.key].email)
    await upsertApplication({
      session_id: s1Id, applicant_id: ids[m.key], status: 'accepted', checked_in: true,
      eps_json: { shared_sections: ['basics', 'role', 'physique'], profile_snapshot: PROFILES[m.key].profile_json, role: m.role },
      created_at: daysAgo(14),
    })
  }
  await signIn('marcus@fluidz.test')
  log('  ✓ Session 1: 4 members checked in')

  // Session 2 members: Karim(checked_in), Theo(checked_in), Samir(accepted), Jules(checked_in), Alex(checked_in)
  const s2Members = [
    { key: 'karim', role: 'Bottom', checked_in: true },
    { key: 'theo', role: 'Top', checked_in: true },
    { key: 'samir', role: 'Bottom', checked_in: false },
    { key: 'jules', role: 'Bottom', checked_in: true },
    { key: 'alex', role: 'Versatile', checked_in: true },
  ]
  for (const m of s2Members) {
    await signIn(PROFILES[m.key].email)
    await upsertApplication({
      session_id: s2Id, applicant_id: ids[m.key], status: 'accepted', checked_in: m.checked_in,
      eps_json: { shared_sections: ['basics', 'role', 'physique'], profile_snapshot: PROFILES[m.key].profile_json, role: m.role },
      created_at: daysAgo(5),
    })
  }
  await signIn('marcus@fluidz.test')
  log('  ✓ Session 2: 5 members')

  // Session 3 members: Marcus(checked_in), Theo(checked_in), Amine(checked_in) — host is Romain
  const s3Members = [
    { key: 'marcus', role: 'Versatile', checked_in: true },
    { key: 'theo', role: 'Top', checked_in: true },
    { key: 'amine', role: 'Versatile', checked_in: true },
  ]
  for (const m of s3Members) {
    await signIn(PROFILES[m.key].email)
    await upsertApplication({
      session_id: s3Id, applicant_id: ids[m.key], status: 'accepted', checked_in: m.checked_in,
      eps_json: { shared_sections: ['basics', 'role'], profile_snapshot: PROFILES[m.key].profile_json, role: m.role },
      created_at: daysAgo(1),
    })
  }
  log('  ✓ Session 3: 3 members')

  // Session 4 members: Karim(accepted), Yann(pending)
  await signIn('karim@fluidz.test')
  await upsertApplication({
    session_id: s4Id, applicant_id: ids.karim, status: 'accepted', checked_in: false,
    eps_json: { shared_sections: ['basics', 'role', 'physique'], profile_snapshot: PROFILES.karim.profile_json, role: 'Bottom' },
    created_at: hoursAgo(1),
  })
  await signIn('yann@fluidz.test')
  await upsertApplication({
    session_id: s4Id, applicant_id: ids.yann, status: 'pending', checked_in: false,
    eps_json: { shared_sections: ['basics', 'role'], profile_snapshot: PROFILES.yann.profile_json, role: 'Top' },
    created_at: hoursAgo(0),
  })
  log('  ✓ Session 4: Karim accepted, Yann pending')
  log('✅ 5 sessions + applications created')

  // ════════════════════════════════════════
  // TASK 3: NaughtyBook contacts + relations
  // ════════════════════════════════════════
  log('Creating contacts...')

  type Contact = { user: string; contact: string; level: string; mutual: boolean; notes: string | null; source?: string }
  const contacts: Contact[] = [
    // Marcus's contacts
    { user: 'marcus', contact: 'karim', level: 'close', mutual: true, notes: 'Super plan. Fiable et respectueux.' },
    { user: 'marcus', contact: 'yann', level: 'favori', mutual: true, notes: 'Mon top régulier. Toujours dispo.' },
    { user: 'marcus', contact: 'lucas', level: 'connaissance', mutual: true, notes: null },
    { user: 'marcus', contact: 'amine', level: 'close', mutual: true, notes: 'Bear adorable. Revient souvent.' },
    { user: 'marcus', contact: 'theo', level: 'connaissance', mutual: false, notes: null },
    { user: 'marcus', contact: 'romain', level: 'close', mutual: true, notes: 'Co-host potentiel. Fiable.' },
    // Karim's contacts
    { user: 'karim', contact: 'marcus', level: 'favori', mutual: true, notes: 'Meilleur host de Paris.' },
    { user: 'karim', contact: 'yann', level: 'close', mutual: true, notes: null },
    { user: 'karim', contact: 'lucas', level: 'connaissance', mutual: true, notes: null },
    { user: 'karim', contact: 'theo', level: 'connaissance', mutual: false, notes: 'Rencontré au Techno After.' },
    // Yann's contacts
    { user: 'yann', contact: 'marcus', level: 'close', mutual: true, notes: null },
    { user: 'yann', contact: 'karim', level: 'close', mutual: true, notes: null },
    { user: 'yann', contact: 'jules', level: 'connaissance', mutual: true, notes: null },
    // Reverse contacts where mutual=true (that aren't already listed)
    { user: 'lucas', contact: 'marcus', level: 'connaissance', mutual: true, notes: null },
    { user: 'lucas', contact: 'karim', level: 'connaissance', mutual: true, notes: null },
    { user: 'amine', contact: 'marcus', level: 'close', mutual: true, notes: null },
    { user: 'romain', contact: 'marcus', level: 'close', mutual: true, notes: null },
    { user: 'jules', contact: 'yann', level: 'connaissance', mutual: true, notes: null },
    // One-sided: Theo → Marcus (no reverse = mutual stays false)
    { user: 'theo', contact: 'marcus', level: 'connaissance', mutual: false, notes: null },
  ]

  for (const c of contacts) {
    await signIn(PROFILES[c.user].email)
    await supabase.from('contacts').upsert({
      user_id: ids[c.user],
      contact_user_id: ids[c.contact],
      relation_level: c.level,
      mutual: c.mutual,
      notes: c.notes,
    }, { onConflict: 'user_id,contact_user_id' })
  }
  log('✅ NaughtyBook contacts created')

  // ════════════════════════════════════════
  // TASK 4: Contact groups
  // ════════════════════════════════════════
  log('Creating contact groups...')

  // Marcus's groups
  await signIn('marcus@fluidz.test')
  const { data: g1 } = await supabase.from('contact_groups')
    .upsert({ owner_id: ids.marcus, name: 'Réguliers Bastille', color: '#F9A8A8' }, { onConflict: 'owner_id,name' } as never)
    .select('id').single()
  if (g1) {
    for (const member of [ids.karim, ids.yann, ids.amine]) {
      await supabase.from('contact_group_members').upsert(
        { group_id: g1.id, contact_user_id: member },
        { onConflict: 'group_id,contact_user_id' }
      )
    }
  }

  const { data: g2 } = await supabase.from('contact_groups')
    .upsert({ owner_id: ids.marcus, name: 'Leather Crew', color: '#7E7694' }, { onConflict: 'owner_id,name' } as never)
    .select('id').single()
  if (g2) {
    for (const member of [ids.romain, ids.theo, ids.amine]) {
      await supabase.from('contact_group_members').upsert(
        { group_id: g2.id, contact_user_id: member },
        { onConflict: 'group_id,contact_user_id' }
      )
    }
  }

  // Karim's groups
  await signIn('karim@fluidz.test')
  const { data: g3 } = await supabase.from('contact_groups')
    .upsert({ owner_id: ids.karim, name: 'Mes tops', color: '#4ADE80' }, { onConflict: 'owner_id,name' } as never)
    .select('id').single()
  if (g3) {
    for (const member of [ids.marcus, ids.yann, ids.theo]) {
      await supabase.from('contact_group_members').upsert(
        { group_id: g3.id, contact_user_id: member },
        { onConflict: 'group_id,contact_user_id' }
      )
    }
  }
  log('✅ Contact groups created')

  // ════════════════════════════════════════
  // TASK 5: Saved addresses
  // ════════════════════════════════════════
  log('Saving addresses...')

  await signIn('marcus@fluidz.test')
  const marcusProfile = { ...PROFILES.marcus.profile_json }
  marcusProfile.saved_addresses = [
    { label: 'Appart Bastille', exact_address: '14 Rue de la Roquette, 75011 Paris', approx_area: 'Paris 11ème', directions: ['Entrée par la cour', '2ème étage gauche', 'Sonnez 2 fois'] },
    { label: 'Studio Marais', exact_address: '42 Rue des Archives, 75003 Paris', approx_area: 'Paris 3ème', directions: ['Code porte: 4521', '3ème étage, porte droite'] },
    { label: 'Cave République', exact_address: '23 Rue du Faubourg du Temple, 75010 Paris', approx_area: 'Paris 10ème', directions: ['RDC porte verte', 'Sous-sol', 'Code: 4521'] },
  ]
  await supabase.from('user_profiles').update({ profile_json: marcusProfile }).eq('id', ids.marcus)

  await signIn('romain@fluidz.test')
  const romainProfile = { ...PROFILES.romain.profile_json }
  romainProfile.saved_addresses = [
    { label: 'Loft Montmartre', exact_address: '8 Rue Lepic, 75018 Paris', approx_area: 'Paris 18ème', directions: ['Interphone \'Dupont\'', '5ème étage sans ascenseur'] },
  ]
  await supabase.from('user_profiles').update({ profile_json: romainProfile }).eq('id', ids.romain)
  log('✅ Saved addresses added')

  // ════════════════════════════════════════
  // TASK 6: Intents + double matches
  // ════════════════════════════════════════
  log('Creating intents...')

  type IntentRow = { user: string; target: string; intents: string[] }
  const intentRows: IntentRow[] = [
    { user: 'marcus', target: 'karim', intents: ['session_adulte', 'plan_regulier'] },
    { user: 'karim', target: 'marcus', intents: ['session_adulte', 'plan_regulier', 'amitie'] },
    { user: 'marcus', target: 'yann', intents: ['session_adulte', 'plan_regulier', 'co_host'] },
    { user: 'yann', target: 'marcus', intents: ['session_adulte', 'co_host'] },
    { user: 'karim', target: 'theo', intents: ['session_adulte', 'date'] },
    { user: 'theo', target: 'karim', intents: ['session_adulte'] },
    { user: 'romain', target: 'marcus', intents: ['co_host', 'amitie'] },
    { user: 'marcus', target: 'romain', intents: ['co_host', 'amitie', 'plan_regulier'] },
    { user: 'lucas', target: 'karim', intents: ['date', 'relation_serieuse'] },
    { user: 'karim', target: 'lucas', intents: ['amitie'] },
    { user: 'amine', target: 'marcus', intents: ['plan_regulier', 'kink_partner'] },
    { user: 'marcus', target: 'amine', intents: ['plan_regulier'] },
  ]

  for (const row of intentRows) {
    await signIn(PROFILES[row.user].email)
    await supabase.from('intents').upsert({
      user_id: ids[row.user],
      target_user_id: ids[row.target],
      intents: row.intents,
    }, { onConflict: 'user_id,target_user_id' })
  }

  // The DB trigger check_intent_match auto-creates intent_matches and notifications.
  // Manually ensure matches exist for the expected pairs:
  await signIn('marcus@fluidz.test')
  type MatchRow = { a: string; b: string; matched: string[] }
  const expectedMatches: MatchRow[] = [
    { a: 'marcus', b: 'karim', matched: ['session_adulte', 'plan_regulier'] },
    { a: 'marcus', b: 'yann', matched: ['session_adulte', 'co_host'] },
    { a: 'karim', b: 'theo', matched: ['session_adulte'] },
    { a: 'marcus', b: 'romain', matched: ['co_host', 'amitie'] },
    { a: 'amine', b: 'marcus', matched: ['plan_regulier'] },
  ]
  for (const m of expectedMatches) {
    const canonical_a = ids[m.a] < ids[m.b] ? ids[m.a] : ids[m.b]
    const canonical_b = ids[m.a] < ids[m.b] ? ids[m.b] : ids[m.a]
    await supabase.from('intent_matches').upsert({
      user_a: canonical_a, user_b: canonical_b,
      matched_intents: m.matched, notified: true,
    }, { onConflict: 'user_a,user_b' })
  }
  log('✅ Intents + matches created')

  // ════════════════════════════════════════
  // TASK 7: Reviews + VibeScores
  // ════════════════════════════════════════
  log('Creating reviews...')

  type ReviewRow = { session: string; reviewer: string; rating: number; vibe_tags: string[] }
  const reviews: ReviewRow[] = [
    // Session 1
    { session: s1Id, reviewer: 'karim', rating: 5, vibe_tags: ['hot', 'safe', 'respectful'] },
    { session: s1Id, reviewer: 'yann', rating: 4, vibe_tags: ['intense', 'hot'] },
    { session: s1Id, reviewer: 'lucas', rating: 4, vibe_tags: ['fun', 'welcoming', 'safe'] },
    { session: s1Id, reviewer: 'amine', rating: 5, vibe_tags: ['hot', 'chill', 'respectful'] },
    // Session 2
    { session: s2Id, reviewer: 'karim', rating: 4, vibe_tags: ['fun', 'chill'] },
    { session: s2Id, reviewer: 'theo', rating: 3, vibe_tags: ['chill', 'awkward'] },
    { session: s2Id, reviewer: 'jules', rating: 5, vibe_tags: ['hot', 'fun', 'intense'] },
    { session: s2Id, reviewer: 'alex', rating: 4, vibe_tags: ['welcoming', 'safe', 'fun'] },
    // Session 3
    { session: s3Id, reviewer: 'marcus', rating: 5, vibe_tags: ['intense', 'hot', 'safe'] },
    { session: s3Id, reviewer: 'theo', rating: 4, vibe_tags: ['intense', 'respectful'] },
  ]

  for (const r of reviews) {
    await signIn(PROFILES[r.reviewer].email)
    await supabase.from('reviews').upsert({
      session_id: r.session, reviewer_id: ids[r.reviewer], target_id: null,
      rating: r.rating, vibe_tags: r.vibe_tags, is_anonymous: true,
    }, { onConflict: 'session_id,reviewer_id,target_id' })
    // Mark review queue as completed
    await supabase.from('review_queue').upsert({
      user_id: ids[r.reviewer], session_id: r.session, status: 'completed',
    }, { onConflict: 'user_id,session_id' })
  }

  // Amine hasn't reviewed session 3 yet → pending
  await signIn('amine@fluidz.test')
  await supabase.from('review_queue').upsert({
    user_id: ids.amine, session_id: s3Id, status: 'pending',
  }, { onConflict: 'user_id,session_id' })
  log('✅ Reviews + review queue created')

  // ════════════════════════════════════════
  // TASK 8: Favorites
  // ════════════════════════════════════════
  log('Creating favorites...')

  await signIn('marcus@fluidz.test')
  await supabase.from('favorites').upsert({ user_id: ids.marcus, target_user_id: ids.samir }, { onConflict: 'user_id,target_user_id' })
  await supabase.from('favorites').upsert({ user_id: ids.marcus, target_user_id: ids.jules }, { onConflict: 'user_id,target_user_id' })

  await signIn('karim@fluidz.test')
  await supabase.from('favorites').upsert({ user_id: ids.karim, target_user_id: ids.alex }, { onConflict: 'user_id,target_user_id' })
  await supabase.from('favorites').upsert({ user_id: ids.karim, target_user_id: ids.jules }, { onConflict: 'user_id,target_user_id' })

  await signIn('lucas@fluidz.test')
  await supabase.from('favorites').upsert({ user_id: ids.lucas, target_user_id: ids.theo }, { onConflict: 'user_id,target_user_id' })
  log('✅ Favorites created')

  // ════════════════════════════════════════
  // TASK 9: Notifications history
  // ════════════════════════════════════════
  log('Creating notifications...')

  // Sign in as Marcus (host) to insert notifications referencing his sessions
  await signIn('marcus@fluidz.test')

  // Marcus notifications (as host, can insert for session participants)
  const marcusNotifs = [
    { user_id: ids.marcus, session_id: s1Id, type: 'application', title: 'Karim a postulé', body: 'Dark Room Bastille', href: '/session/' + s1Id + '/host', created_at: daysAgo(14), read_at: daysAgo(14) },
    { user_id: ids.marcus, session_id: s1Id, type: 'application', title: 'Yann a postulé', body: 'Dark Room Bastille', href: '/session/' + s1Id + '/host', created_at: daysAgo(14), read_at: daysAgo(14) },
    { user_id: ids.marcus, session_id: s1Id, type: 'application', title: 'Lucas a postulé', body: 'Dark Room Bastille', href: '/session/' + s1Id + '/host', created_at: daysAgo(14), read_at: daysAgo(13) },
    { user_id: ids.marcus, session_id: s1Id, type: 'checkin', title: 'Karim a check-in', body: 'Dark Room Bastille', href: '/session/' + s1Id + '/host', created_at: daysAgo(13), read_at: daysAgo(13) },
    { user_id: ids.marcus, session_id: s2Id, type: 'application', title: 'Theo a postulé', body: 'Techno After Marais', href: '/session/' + s2Id + '/host', created_at: daysAgo(5), read_at: daysAgo(5) },
    { user_id: ids.marcus, session_id: s1Id, type: 'review_reminder', title: 'Évalue ta session', body: 'Dark Room Bastille', href: '/review/' + s1Id, created_at: daysAgo(5), read_at: daysAgo(4) },
    { user_id: ids.marcus, type: 'intent_match', title: 'Intérêt mutuel avec Karim', body: 'Session adulte, Plan régulier', href: '/contacts/' + ids.karim, created_at: daysAgo(2) },
    { user_id: ids.marcus, type: 'intent_match', title: 'Intérêt mutuel avec Romain', body: 'Co-host, Amitié', href: '/contacts/' + ids.romain, created_at: daysAgo(1) },
    { user_id: ids.marcus, session_id: s4Id, type: 'application', title: 'Yann a postulé', body: 'Plan ce soir République', href: '/session/' + s4Id + '/host', created_at: hoursAgo(0) },
  ]
  for (const n of marcusNotifs) {
    await supabase.from('notifications').insert({ ...n, message: n.title })
  }

  // Karim notifications
  await signIn('karim@fluidz.test')
  const karimNotifs = [
    { user_id: ids.karim, session_id: s1Id, type: 'accepted', title: 'Accepté !', body: 'Dark Room Bastille', href: '/session/' + s1Id, created_at: daysAgo(14), read_at: daysAgo(14) },
    { user_id: ids.karim, session_id: s2Id, type: 'accepted', title: 'Accepté !', body: 'Techno After Marais', href: '/session/' + s2Id, created_at: daysAgo(5), read_at: daysAgo(5) },
    { user_id: ids.karim, type: 'intent_match', title: 'Intérêt mutuel avec Marcus', body: 'Session adulte, Plan régulier', href: '/contacts/' + ids.marcus, created_at: daysAgo(2) },
    { user_id: ids.karim, session_id: s4Id, type: 'accepted', title: 'Accepté !', body: 'Plan ce soir République', href: '/session/' + s4Id, created_at: hoursAgo(1) },
  ]
  for (const n of karimNotifs) {
    await supabase.from('notifications').insert({ ...n, message: n.title })
  }

  // Yann
  await signIn('yann@fluidz.test')
  const yannNotifs = [
    { user_id: ids.yann, session_id: s1Id, type: 'accepted', title: 'Accepté !', body: 'Dark Room Bastille', href: '/session/' + s1Id, created_at: daysAgo(14), read_at: daysAgo(14) },
    { user_id: ids.yann, type: 'intent_match', title: 'Intérêt mutuel avec Marcus', body: 'Session adulte, Co-host', href: '/contacts/' + ids.marcus, created_at: daysAgo(2) },
    { user_id: ids.yann, session_id: s4Id, type: 'application', title: 'Candidature envoyée', body: 'Plan ce soir République', href: '/session/' + s4Id, created_at: hoursAgo(0) },
  ]
  for (const n of yannNotifs) {
    await supabase.from('notifications').insert({ ...n, message: n.title })
  }

  // Theo
  await signIn('theo@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: ids.theo, session_id: s2Id, type: 'accepted', title: 'Accepté !', body: 'Techno After Marais', href: '/session/' + s2Id, message: 'Accepté !', created_at: daysAgo(5), read_at: daysAgo(5) },
    { user_id: ids.theo, session_id: s3Id, type: 'accepted', title: 'Accepté !', body: 'Leather Night', href: '/session/' + s3Id, message: 'Accepté !', created_at: daysAgo(1), read_at: daysAgo(1) },
    { user_id: ids.theo, type: 'intent_match', title: 'Intérêt mutuel avec Karim', body: 'Session adulte', href: '/contacts/' + ids.karim, message: 'Intérêt mutuel', created_at: daysAgo(2) },
  ])

  // Romain
  await signIn('romain@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: ids.romain, session_id: s3Id, type: 'application', title: 'Marcus a postulé', body: 'Leather Night', href: '/session/' + s3Id + '/host', message: 'Marcus a postulé', created_at: daysAgo(1), read_at: daysAgo(1) },
    { user_id: ids.romain, type: 'intent_match', title: 'Intérêt mutuel avec Marcus', body: 'Co-host, Amitié', href: '/contacts/' + ids.marcus, message: 'Intérêt mutuel', created_at: daysAgo(1) },
  ])

  // Jules
  await signIn('jules@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: ids.jules, session_id: s2Id, type: 'accepted', title: 'Accepté !', body: 'Techno After Marais', href: '/session/' + s2Id, message: 'Accepté !', created_at: daysAgo(5), read_at: daysAgo(4) },
  ])

  // Alex
  await signIn('alex@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: ids.alex, session_id: s2Id, type: 'accepted', title: 'Accepté !', body: 'Techno After Marais', href: '/session/' + s2Id, message: 'Accepté !', created_at: daysAgo(5), read_at: daysAgo(5) },
  ])

  // Amine
  await signIn('amine@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: ids.amine, session_id: s1Id, type: 'accepted', title: 'Accepté !', body: 'Dark Room Bastille', href: '/session/' + s1Id, message: 'Accepté !', created_at: daysAgo(14), read_at: daysAgo(14) },
    { user_id: ids.amine, session_id: s3Id, type: 'review_reminder', title: 'Évalue ta session', body: 'Leather Night', href: '/review/' + s3Id, message: 'Évalue ta session', created_at: daysAgo(0) },
    { user_id: ids.amine, type: 'intent_match', title: 'Intérêt mutuel avec Marcus', body: 'Plan régulier', href: '/contacts/' + ids.marcus, message: 'Intérêt mutuel', created_at: daysAgo(1) },
  ])
  log('✅ Notifications created')

  // ════════════════════════════════════════
  // TASK 10: Saved first messages
  // ════════════════════════════════════════
  log('Creating saved messages...')

  await signIn('marcus@fluidz.test')
  const marcusMsgs = [
    { user_id: ids.marcus, label: 'Premier contact', text: 'Hey ! J\'organise régulièrement des plans sur Fluidz. Ton profil m\'intéresse, tu serais dispo ?', sort_order: 0 },
    { user_id: ids.marcus, label: 'Invitation session', text: 'Salut, j\'ai une session prévue ce soir. Ça te tenterait ? Check mon profil et DM moi.', sort_order: 1 },
    { user_id: ids.marcus, label: 'Contact post-session', text: 'C\'était cool hier ! On reste en contact ?', sort_order: 2 },
  ]
  // Delete old saved messages first for idempotency
  await supabase.from('saved_messages').delete().eq('user_id', ids.marcus)
  await supabase.from('saved_messages').insert(marcusMsgs)

  await signIn('karim@fluidz.test')
  await supabase.from('saved_messages').delete().eq('user_id', ids.karim)
  await supabase.from('saved_messages').insert([
    { user_id: ids.karim, label: 'Premier message', text: 'Hey, ton profil me plaît. T\'es sur Fluidz depuis longtemps ?', sort_order: 0 },
    { user_id: ids.karim, label: 'Dispo ce soir', text: 'Dispo ce soir si plan intéressant. Montre-moi ton profil !', sort_order: 1 },
  ])
  log('✅ Saved messages created')

  // ════════════════════════════════════════
  // TASK 11: DM message history
  // ════════════════════════════════════════
  log('Creating DM messages...')

  const dmSidMarcusKarim = directDmSessionId(ids.marcus, ids.karim)
  const dmSidMarcusYann = directDmSessionId(ids.marcus, ids.yann)
  const dmSidRomainMarcus = directDmSessionId(ids.romain, ids.marcus)

  type DmMsg = { session_id: string; sender: string; text: string; peer: string; ts: string }
  const dmMessages: DmMsg[] = [
    // Marcus ↔ Karim
    { session_id: dmSidMarcusKarim, sender: 'marcus', peer: 'karim', text: 'Bienvenue ! La session commence à 22h.', ts: daysAgo(14, -1) },
    { session_id: dmSidMarcusKarim, sender: 'karim', peer: 'marcus', text: 'Merci ! J\'arrive vers 22h15.', ts: daysAgo(14, -2) },
    { session_id: dmSidMarcusKarim, sender: 'marcus', peer: 'karim', text: 'Parfait, entre par la cour.', ts: daysAgo(14, -3) },
    { session_id: dmSidMarcusKarim, sender: 'karim', peer: 'marcus', text: 'C\'était super hier, merci pour l\'orga !', ts: daysAgo(13) },
    { session_id: dmSidMarcusKarim, sender: 'marcus', peer: 'karim', text: 'Avec plaisir ! Tu reviens quand tu veux.', ts: daysAgo(13, -1) },
    { session_id: dmSidMarcusKarim, sender: 'karim', peer: 'marcus', text: 'Tu prévois quelque chose ce weekend ?', ts: daysAgo(3) },
    { session_id: dmSidMarcusKarim, sender: 'marcus', peer: 'karim', text: 'Oui, check la session Plan ce soir !', ts: hoursAgo(1) },
    // Marcus ↔ Yann
    { session_id: dmSidMarcusYann, sender: 'marcus', peer: 'yann', text: 'Hey, j\'ai une session ce soir. Tu viens ?', ts: daysAgo(14) },
    { session_id: dmSidMarcusYann, sender: 'yann', peer: 'marcus', text: 'Carrément ! Quel est le dress code ?', ts: daysAgo(14, -1) },
    { session_id: dmSidMarcusYann, sender: 'marcus', peer: 'yann', text: 'Casual, viens comme tu es.', ts: daysAgo(14, -2) },
    { session_id: dmSidMarcusYann, sender: 'yann', peer: 'marcus', text: 'On remet ça quand ?', ts: daysAgo(5) },
    { session_id: dmSidMarcusYann, sender: 'marcus', peer: 'yann', text: 'Ce soir ! Je t\'envoie le lien.', ts: hoursAgo(1) },
    // Romain ↔ Marcus
    { session_id: dmSidRomainMarcus, sender: 'romain', peer: 'marcus', text: 'Salut Marcus, j\'ai vu que tu host souvent. On pourrait co-organiser ?', ts: daysAgo(3) },
    { session_id: dmSidRomainMarcus, sender: 'marcus', peer: 'romain', text: 'Carrément ! J\'ai un spot dans le 11ème. On en parle ?', ts: daysAgo(3, -1) },
    { session_id: dmSidRomainMarcus, sender: 'romain', peer: 'marcus', text: 'Parfait. Je propose une soirée leather le weekend prochain.', ts: daysAgo(2) },
  ]

  for (const m of dmMessages) {
    await signIn(PROFILES[m.sender].email)
    await supabase.from('messages').insert({
      session_id: m.session_id,
      sender_id: ids[m.sender],
      text: m.text,
      sender_name: PROFILES[m.sender].display_name,
      room_type: 'dm',
      dm_peer_id: ids[m.peer],
      created_at: m.ts,
    })
  }
  log('✅ DM messages created')

  // Done
  await signIn('marcus@fluidz.test')
  log('🎉 All demo data seeded successfully!')
}

// ── Clear demo data ──
export async function clearDemoData(): Promise<void> {
  await signIn('marcus@fluidz.test')

  // Get all test user IDs
  const testEmails = Object.values(PROFILES).map(p => p.email)
  const userIds: string[] = []
  for (const email of testEmails) {
    try {
      const uid = await signIn(email)
      userIds.push(uid)
    } catch {
      // User doesn't exist, skip
    }
  }

  if (userIds.length === 0) return

  // Sign in as Marcus (admin) for cleanup
  await signIn('marcus@fluidz.test')

  // Delete in order respecting FK constraints
  const inviteCodes = ['DARK14', 'TECH05', 'LEATH1', 'REPUB1', 'WKEND1']
  const { data: sessions } = await supabase.from('sessions').select('id').in('invite_code', inviteCodes)
  const sessionIds = (sessions || []).map(s => s.id)

  if (sessionIds.length > 0) {
    await supabase.from('reviews').delete().in('session_id', sessionIds)
    await supabase.from('review_queue').delete().in('session_id', sessionIds)
    await supabase.from('votes').delete().in('session_id', sessionIds)
    await supabase.from('messages').delete().in('session_id', sessionIds)
    await supabase.from('applications').delete().in('session_id', sessionIds)
    await supabase.from('notifications').delete().in('session_id', sessionIds)
    await supabase.from('sessions').delete().in('id', sessionIds)
  }

  // Clean per-user data
  for (const uid of userIds) {
    await signIn(testEmails[userIds.indexOf(uid)])
    await supabase.from('contacts').delete().eq('user_id', uid)
    await supabase.from('contact_group_members').delete().in('group_id',
      (await supabase.from('contact_groups').select('id').eq('owner_id', uid)).data?.map(g => g.id) || []
    )
    await supabase.from('contact_groups').delete().eq('owner_id', uid)
    await supabase.from('intents').delete().eq('user_id', uid)
    await supabase.from('favorites').delete().eq('user_id', uid)
    await supabase.from('saved_messages').delete().eq('user_id', uid)
    await supabase.from('notifications').delete().eq('user_id', uid)
  }

  await supabase.auth.signOut()
}
