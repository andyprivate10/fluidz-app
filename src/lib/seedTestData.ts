import { supabase } from './supabase'

const TEST_PASSWORD = 'testpass123'
export const TEST_INVITE_CODE = 'testplan1'

const PICSUM = (seed: string, w = 200, h = 200) => `https://picsum.photos/seed/${seed}/${w}/${h}`

const HOST_PROFILE = {
  display_name: 'Marcus',
  profile_json: {
    age: '35',
    location: 'Paris 4ème',
    bio: 'Hôte habitué, bonnes vibes uniquement. PrEP et test à jour.',
    role: 'Top',
    height: '182',
    weight: '78',
    morphology: 'Athlétique',
    kinks: ['SM léger', 'Group', 'Voyeur'],
    limits: 'Rien de non consensuel.',
    avatar_url: PICSUM('marcus'),
    health: { prep_status: 'Actif', dernier_test: new Date().toISOString().slice(0, 10), sero_status: '' },
  },
}

const MEMBER_PROFILE = {
  display_name: 'Karim',
  profile_json: {
    age: '28',
    location: 'Paris 11ème',
    bio: 'Bottom, ouvert et curieux. PrEP actif.',
    role: 'Bottom',
    height: '175',
    weight: '70',
    morphology: 'Sportif',
    kinks: ['SM léger', 'Voyeur'],
    limits: '',
    avatar_url: PICSUM('karim'),
    health: { prep_status: 'Actif', dernier_test: '', sero_status: '' },
  },
}

const GUEST_PROFILE = {
  display_name: 'Yann',
  profile_json: {
    age: '25',
    location: 'Paris 3ème',
    bio: 'Curieux, premier plan de groupe. Open-minded.',
    role: 'Bottom',
    height: '178',
    weight: '72',
    morphology: 'Mince',
    kinks: ['Group', 'Voyeur'],
    limits: 'Pas de SM hard',
    avatar_url: PICSUM('yann'),
    health: { prep_status: 'Actif', dernier_test: new Date().toISOString().slice(0, 10), sero_status: '' },
  },
}

/** Sign in and return user id. Throws if account doesn't exist. */
async function getUserId(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${email}: ${error.message}. Créez le compte dans Supabase Auth (Dashboard).`)
  if (!data.user) throw new Error(`${email}: pas d'utilisateur retourné.`)
  return data.user.id
}

export async function seedAll(): Promise<{ sessionId: string; inviteCode: string }> {
  // Get user IDs (this also validates accounts exist)
  const hostId = await getUserId('marcus@fluidz.test', TEST_PASSWORD)
  const memberId = await getUserId('karim@fluidz.test', TEST_PASSWORD)
  const guestId = await getUserId('yann@fluidz.test', TEST_PASSWORD)

  // --- Sign in as host ---
  await supabase.auth.signInWithPassword({ email: 'marcus@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: hostId,
    display_name: HOST_PROFILE.display_name,
    profile_json: HOST_PROFILE.profile_json,
  })

  // Check if session already exists (idempotent)
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('invite_code', TEST_INVITE_CODE)
    .maybeSingle()

  let sessionId: string

  if (existing) {
    // Session exists — clean its children and reuse
    sessionId = existing.id
    await supabase.from('votes').delete().eq('session_id', sessionId)
    await supabase.from('applications').delete().eq('session_id', sessionId)
    await supabase.from('messages').delete().eq('session_id', sessionId)
    await supabase.from('notifications').delete().eq('session_id', sessionId)
    // Update session to ensure correct host and data
    await supabase.from('sessions').update({
      host_id: hostId,
      title: 'Plan ce soir 🔥',
      description: 'Session test pour dev.',
      approx_area: 'Paris 4ème',
      exact_address: '14 rue de la Roquette, code 4521',
      status: 'open',
      tags: ['Top', 'Bottom', 'Versa'],
      lineup_json: { directions: ['Métro Bastille sortie 3', 'Rue de la Roquette direction nord', 'Code porte: 4521', '2ème étage gauche'] },
    }).eq('id', sessionId)
  } else {
    // Create new session
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .insert({
        host_id: hostId,
        title: 'Plan ce soir 🔥',
        description: 'Session test pour dev.',
        approx_area: 'Paris 4ème',
        exact_address: '14 rue de la Roquette, code 4521',
        status: 'open',
        tags: ['Top', 'Bottom', 'Versa'],
        invite_code: TEST_INVITE_CODE,
        lineup_json: { directions: ['Métro Bastille sortie 3', 'Rue de la Roquette direction nord', 'Code porte: 4521', '2ème étage gauche'] },
      })
      .select('id')
      .single()
    if (sessErr) throw new Error(`session insert: ${sessErr.message}`)
    sessionId = session.id
  }

  // --- Sign in as member (Karim) — already accepted ---
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'karim@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: memberId,
    display_name: MEMBER_PROFILE.display_name,
    profile_json: MEMBER_PROFILE.profile_json,
  })
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .insert({
      session_id: sessionId,
      applicant_id: memberId,
      status: 'pending',
      eps_json: {
        shared_sections: ['basics', 'role', 'physique', 'pratiques', 'sante', 'photos'],
        profile_snapshot: MEMBER_PROFILE.profile_json,
        role: 'Bottom',
      },
      checked_in: false,
    })
    .select('id')
    .single()
  if (appErr) throw new Error(`application insert: ${appErr.message}`)

  // Host accepts Karim
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'marcus@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('applications').update({ status: 'accepted', checked_in: true }).eq('id', app.id)

  // --- Set up Yann profile (not applied yet — that's the test) ---
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'yann@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: guestId,
    display_name: GUEST_PROFILE.display_name,
    profile_json: GUEST_PROFILE.profile_json,
  })

  await supabase.auth.signOut()
  return { sessionId, inviteCode: TEST_INVITE_CODE }
}

export async function clearAll(): Promise<void> {
  await supabase.auth.signInWithPassword({
    email: 'marcus@fluidz.test',
    password: TEST_PASSWORD,
  })

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('invite_code', TEST_INVITE_CODE)

  if (sessions && sessions.length > 0) {
    for (const sess of sessions) {
      const sid = sess.id
      await supabase.from('votes').delete().eq('session_id', sid)
      await supabase.from('applications').delete().eq('session_id', sid)
      await supabase.from('messages').delete().eq('session_id', sid)
      await supabase.from('notifications').delete().eq('session_id', sid)
      await supabase.from('sessions').delete().eq('id', sid)
    }
  }
  await supabase.auth.signOut()
}
