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
    age: '31',
    location: 'Paris 12ème',
    bio: 'Versatile, première fois en group.',
    role: 'Versatile',
    height: '178',
    weight: '72',
    morphology: 'Mince',
    kinks: ['Voyeur', 'Group'],
    limits: 'Pas de douleur',
    avatar_url: PICSUM('yann'),
    health: { prep_status: 'Non', dernier_test: '', sero_status: '' },
  },
}

const CANDIDATE_PROFILE = {
  display_name: 'Alex',
  profile_json: {
    age: '26',
    location: 'Paris 8ème', 
    bio: 'Bottom discret, nouveau sur Paris.',
    role: 'Bottom',
    height: '170',
    weight: '65',
    morphology: 'Mince',
    kinks: ['Group'],
    limits: 'Rien d\'extrême',
    avatar_url: PICSUM('alex'),
    health: { prep_status: 'Actif', dernier_test: new Date().toISOString().slice(0, 10), sero_status: '' },
  },
}

/** Récupère l'id d'un compte existant via signIn. Ne crée pas de compte (évite rate limit). */
async function getUserId(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${email}: ${error.message}. Créez le compte dans Supabase Auth (Dashboard).`)
  if (!data.user) throw new Error(`${email}: pas d'utilisateur retourné.`)
  return data.user.id
}

export async function seedAll(): Promise<{ sessionId: string; inviteCode: string }> {
  const hostId = await getUserId('host@fluidz.test', TEST_PASSWORD)
  const memberId = await getUserId('member@fluidz.test', TEST_PASSWORD)
  const guestId = await getUserId('guest@fluidz.test', TEST_PASSWORD)
  const candidateId = await getUserId('candidate@fluidz.test', TEST_PASSWORD)

  // Set up host profile and create session
  await supabase.auth.signInWithPassword({ email: 'host@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: hostId,
    display_name: HOST_PROFILE.display_name,
    profile_json: HOST_PROFILE.profile_json,
  })

  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({
      host_id: hostId,
      title: 'Plan ce soir 🔥',
      description: 'Session test pour dev. Directions et infos dans l'app.',
      approx_area: 'Paris 4ème',
      exact_address: '42 rue de la Paix, 75004 Paris',
      status: 'open',
      tags: ['Top', 'Bottom'],
      invite_code: TEST_INVITE_CODE,
      lineup_json: { directions: ['Métro Odéon', 'Code 4521'] },
    })
    .select('id')
    .single()
  if (sessErr) throw new Error(`session insert: ${sessErr.message}`)
  const sessionId = session.id

  // Add first member (Karim) and accept him
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'member@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: memberId,
    display_name: MEMBER_PROFILE.display_name,
    profile_json: MEMBER_PROFILE.profile_json,
  })
  
  const { data: app1, error: app1Err } = await supabase
    .from('applications')
    .insert({
      session_id: sessionId,
      applicant_id: memberId,
      status: 'pending',
      eps_json: {},
    })
    .select('id')
    .single()
  if (app1Err) throw new Error(`member application insert: ${app1Err.message}`)

  // Accept Karim as host
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'host@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('applications').update({ status: 'accepted' }).eq('id', app1.id)

  // Add second member (Yann) and accept him
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'guest@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: guestId,
    display_name: GUEST_PROFILE.display_name,
    profile_json: GUEST_PROFILE.profile_json,
  })

  const { data: app2, error: app2Err } = await supabase
    .from('applications')
    .insert({
      session_id: sessionId,
      applicant_id: guestId,
      status: 'pending',
      eps_json: {},
    })
    .select('id')
    .single()
  if (app2Err) throw new Error(`guest application insert: ${app2Err.message}`)

  // Accept Yann as host
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'host@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('applications').update({ status: 'accepted' }).eq('id', app2.id)

  // Add third member as pending candidate (Alex) for voting
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'candidate@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: candidateId,
    display_name: CANDIDATE_PROFILE.display_name,
    profile_json: CANDIDATE_PROFILE.profile_json,
  })

  const { data: app3, error: app3Err } = await supabase
    .from('applications')
    .insert({
      session_id: sessionId,
      applicant_id: candidateId,
      status: 'pending',
      eps_json: {
        occasion_note: 'Très motivé pour cette première expérience en groupe !',
      },
    })
    .select('id')
    .single()
  if (app3Err) throw new Error(`candidate application insert: ${app3Err.message}`)

  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'host@fluidz.test', password: TEST_PASSWORD })
  return { sessionId, inviteCode: TEST_INVITE_CODE }
}

export async function clearAll(): Promise<void> {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'host@fluidz.test',
    password: TEST_PASSWORD,
  })
  if (!user) return
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('host_id', user.id)
    .eq('invite_code', TEST_INVITE_CODE)
  if (sessions && sessions.length > 0) {
    const sid = sessions[0].id
    await supabase.from('votes').delete().eq('session_id', sid)
    await supabase.from('applications').delete().eq('session_id', sid)
    await supabase.from('messages').delete().eq('session_id', sid)
    await supabase.from('notifications').delete().eq('session_id', sid)
    await supabase.from('sessions').delete().eq('id', sid)
  }
  await supabase.auth.signOut()
}
