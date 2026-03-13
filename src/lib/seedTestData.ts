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
    age: '',
    location: 'Paris',
    bio: '',
    role: '',
    height: '',
    weight: '',
    morphology: '',
    kinks: [] as string[],
    limits: '',
    avatar_url: undefined as string | undefined,
    health: {} as Record<string, string>,
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
  const hostId = await getUserId('marcus@fluidz.test', TEST_PASSWORD)
  const memberId = await getUserId('karim@fluidz.test', TEST_PASSWORD)
  const guestId = await getUserId('yann@fluidz.test', TEST_PASSWORD)

  await supabase.auth.signInWithPassword({ email: 'marcus@fluidz.test', password: TEST_PASSWORD })
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
      description: 'Session test pour dev. Directions et infos dans l’app.',
      approx_area: 'Paris 4ème',
      exact_address: null,
      status: 'open',
      tags: ['Top', 'Bottom'],
      invite_code: TEST_INVITE_CODE,
      lineup_json: { directions: ['Métro Odéon', 'Code 4521'] },
    })
    .select('id')
    .single()
  if (sessErr) throw new Error(`session insert: ${sessErr.message}`)
  const sessionId = session.id

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
      eps_json: {},
      checked_in: false,
    })
    .select('id')
    .single()
  if (appErr) throw new Error(`application insert: ${appErr.message}`)

  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'marcus@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('applications').update({ status: 'accepted', checked_in: true }).eq('id', app.id)

  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'yann@fluidz.test', password: TEST_PASSWORD })
  await supabase.from('user_profiles').upsert({
    id: guestId,
    display_name: GUEST_PROFILE.display_name,
    profile_json: GUEST_PROFILE.profile_json,
  })

  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'marcus@fluidz.test', password: TEST_PASSWORD })
  return { sessionId, inviteCode: TEST_INVITE_CODE }
}

export async function clearAll(): Promise<void> {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'marcus@fluidz.test',
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
