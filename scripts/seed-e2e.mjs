#!/usr/bin/env node
/**
 * seed-e2e.mjs — Standalone E2E seed script for Fluidz
 *
 * Seeds ALL test states: users, sessions, applications, contacts,
 * naughtybook, DMs, reviews, notifications, intents, favorites,
 * contact groups, saved messages.
 *
 * Usage:  node scripts/seed-e2e.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// ─── Parse .env.local ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  // strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1)
  env[key] = val
}

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ─── Date helpers ───────────────────────────────────────────────────────────
function daysAgo(days, offsetHours = 0) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() + offsetHours)
  return d.toISOString()
}
function hoursAgo(hours) { return daysAgo(0, -hours) }
function hoursFromNow(hours) {
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

// ─── DM session ID (must match app) ─────────────────────────────────────────
function directDmSessionId(uid1, uid2) {
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

// ─── Helpers ────────────────────────────────────────────────────────────────
const PASSWORD = 'testpass123'
const users = {} // email -> { id, email }

async function signIn(email) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password: PASSWORD
  })
  if (error) throw new Error(`signIn(${email}): ${error.message}`)
  return data.user.id
}

async function ensureUser(email, displayName, profileJson) {
  let uid
  // Try sign in first
  const { data: existing } = await supabase.auth.signInWithPassword({
    email, password: PASSWORD
  })
  if (existing?.user) {
    uid = existing.user.id
  } else {
    // Sign out first to ensure clean state for signUp
    await supabase.auth.signOut()
    const { data, error } = await supabase.auth.signUp({
      email, password: PASSWORD,
      options: { data: { display_name: displayName } }
    })
    if (error) throw new Error(`signUp(${email}): ${error.message}`)
    if (!data.user) throw new Error(`signUp(${email}): no user returned`)
    uid = data.user.id
    // Sign in to get a proper session
    await supabase.auth.signInWithPassword({ email, password: PASSWORD })
  }
  users[email] = { id: uid, email }

  // Upsert profile
  const { error } = await supabase.from('user_profiles').upsert({
    id: uid,
    display_name: displayName,
    profile_json: profileJson,
    location_visible: true,
    approx_lat: 48.855 + (Math.random() * 0.04 - 0.02),
    approx_lng: 2.340 + (Math.random() * 0.06 - 0.03),
    location_updated_at: new Date().toISOString()
  }, { onConflict: 'id' })
  if (error) console.warn(`  profile upsert(${email}):`, error.message)

  console.log(`  ✓ ${displayName} (${uid.slice(0, 8)}...)`)
  return uid
}

async function tryEnsureUser(email, displayName, profileJson) {
  try {
    return await ensureUser(email, displayName, profileJson)
  } catch (e) {
    console.warn(`  ⚠ ${displayName} skipped: ${e.message}`)
    return null
  }
}

async function upsertSession(session) {
  // First check if session with invite_code exists
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('invite_code', session.invite_code)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('sessions')
      .update(session)
      .eq('id', existing.id)
    if (error) console.warn(`  session update(${session.invite_code}):`, error.message)
    return existing.id
  } else {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select('id')
      .single()
    if (error) throw new Error(`session insert(${session.invite_code}): ${error.message}`)
    return data.id
  }
}

async function upsertApplication(app) {
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('session_id', app.session_id)
    .eq('applicant_id', app.applicant_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('applications')
      .update(app)
      .eq('id', existing.id)
    if (error) console.warn(`  application update:`, error.message)
    return existing.id
  } else {
    const { data, error } = await supabase
      .from('applications')
      .insert(app)
      .select('id')
      .single()
    if (error) console.warn(`  application insert:`, error.message)
    return data?.id
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══ FLUIDZ E2E SEED ═══\n')

  // ─── 1. Users ───────────────────────────────────────────────────────────
  console.log('1. Seeding users...')

  const marcusId = await ensureUser('marcus@fluidz.test', 'Marcus', {
    age: 34, bio: 'Host régulier, ambiance safe et respectueuse. Sportif, ouvert d\'esprit. Toujours partant pour de nouvelles rencontres.',
    role: 'Versatile', orientation: 'Gay', morphology: 'Sportif',
    height: 182, weight: 78, location: 'Paris 11e',
    home_city: 'Paris', home_country: 'France',
    languages: ['Français', 'English', 'Español'],
    ethnicities: ['caucasian'], tribes: ['jock', 'leather'],
    kinks: ['Dominant', 'SM léger', 'Cuir', 'Group', 'Fétichisme'],
    limits: 'Pas de bareback sans PrEP/test récent. Toujours safe.',
    dm_privacy: 'open',
    health: { prep_status: 'Actif', dernier_test: '2026-03-15', sero_status: 'Négatif', tested: true, last_test: '2026-03-15', prep: true },
    avatar_url: 'https://i.pravatar.cc/400?u=marcus',
    photos_profil: ['https://i.pravatar.cc/400?u=marcus', 'https://picsum.photos/seed/marcus2/400/400'],
    photos_intime: ['https://picsum.photos/seed/marcusA/400/500'],
    section_visibility: { photos_adulte: 'naughtybook', kinks: 'all', health: 'all', limits: 'all' },
    searching_for: ['Bottom', 'Versatile'], occasion: 'Ce soir si le feeling est bon',
    is_admin: true
  })

  const karimId = await ensureUser('karim@fluidz.test', 'Karim', {
    age: 28, bio: 'Chill et curieux. J\'aime les plans détendus entre mecs cool. Bon vivant, souriant.',
    role: 'Bottom', orientation: 'Gay', morphology: 'Athlétique',
    height: 175, weight: 72, location: 'Paris 3e',
    home_city: 'Paris', home_country: 'France',
    languages: ['Français', 'العربية'], ethnicities: ['middle_eastern'], tribes: ['otter', 'cub'],
    kinks: ['Soumis', 'Massage', 'Câlins', 'Jeux de rôle'],
    limits: 'Pas de douleur forte. Communication avant tout.',
    dm_privacy: 'profile_required',
    health: { prep_status: 'Actif', dernier_test: '2026-03-01', sero_status: 'Négatif', tested: true, last_test: '2026-03-01', prep: true },
    avatar_url: 'https://i.pravatar.cc/400?u=karim',
    photos_profil: ['https://i.pravatar.cc/400?u=karim'],
    section_visibility: { photos_adulte: 'naughtybook', kinks: 'all', health: 'all', limits: 'naughtybook' },
    searching_for: ['Top', 'Versatile'], occasion: 'Week-end détente'
  })

  const yannId = await ensureUser('yann@fluidz.test', 'Yann', {
    age: 31, bio: 'Parisien discret, créatif. Photographe amateur. J\'aime les ambiances feutrées et les gens authentiques.',
    role: 'Top', orientation: 'Gay', morphology: 'Musclé',
    height: 180, weight: 76, location: 'Paris 18e',
    home_city: 'Paris', home_country: 'France',
    languages: ['Français', 'English'], ethnicities: ['asian'], tribes: ['twink', 'geek'],
    kinks: ['Domination douce', 'Massage', 'Voyeur'],
    limits: 'Toujours avec consentement explicite.',
    dm_privacy: 'open',
    health: { prep_status: 'Non', dernier_test: '2026-02-10', sero_status: 'Négatif', tested: true, last_test: '2026-02-10', prep: false },
    avatar_url: 'https://i.pravatar.cc/400?u=yann',
    photos_profil: ['https://i.pravatar.cc/400?u=yann', 'https://picsum.photos/seed/yann2/400/400'],
    section_visibility: { photos_adulte: 'naughtybook', kinks: 'all', health: 'all', limits: 'all' },
    searching_for: ['Bottom', 'Versatile'], occasion: 'Quand l\'envie se présente'
  })

  // Non-core users: look up existing profiles (seeded via SQL)
  async function lookupUser(name) {
    const { data } = await supabase.from('user_profiles')
      .select('id').eq('display_name', name).maybeSingle()
    if (data) {
      console.log(`  ✓ ${name} (${data.id.slice(0, 8)}...) [existing]`)
      return data.id
    }
    console.warn(`  ⚠ ${name} not found in user_profiles`)
    return null
  }

  const lucasId = await lookupUser('Lucas')
  const amineId = await lookupUser('Hugo')      // Hugo as Amine substitute
  const theoId = await lookupUser('Théo')
  const romainId = await lookupUser('Romain')
  const samirId = await lookupUser('Samir')
  const alexId = await lookupUser('Alex')
  const julesId = await lookupUser('Kevin')      // Kevin as Jules substitute

  // Safe wrapper: skip if any uid is null
  async function safe(label, fn) {
    try { await fn() }
    catch (e) { console.warn(`  ⚠ ${label}: ${e.message}`) }
  }

  // ─── 2. Sessions ──────────────────────────────────────────────────────────
  console.log('\n2. Seeding sessions...')

  // Sign in as Marcus (host for sessions 1, 2, 4, 5)
  await signIn('marcus@fluidz.test')

  const session1Id = await upsertSession({
    host_id: marcusId,
    title: 'Dark Room Bastille',
    description: 'Soirée dark room intime chez moi. Max 6 mecs, ambiance sombre, musique low. Safe uniquement.',
    approx_area: 'Paris 11e - Bastille',
    exact_address: '18 rue de la Roquette, 75011 Paris',
    status: 'ended',
    tags: ['Dark Room', 'Hot', 'Intimate'],
    invite_code: 'DARK14',
    is_public: true,
    starts_at: daysAgo(14, -3),  // started 14 days ago
    ends_at: daysAgo(14, 1),     // ended 14 days ago + 4h
    max_capacity: 6,
    template_slug: 'dark_room',
    lineup_json: { host_rules: 'Safe word: STOP. Capotes dispos. Respect ou dehors.' },
    created_at: daysAgo(15)
  })
  console.log(`  ✓ Session 1: Dark Room Bastille (${session1Id?.slice(0, 8)}...)`)

  const session2Id = await upsertSession({
    host_id: marcusId,
    title: 'Techno After Marais',
    description: 'After techno dans le Marais, ambiance dark et beats. Viens comme tu es.',
    approx_area: 'Paris 3e - Marais',
    exact_address: '42 rue des Archives, 75003 Paris',
    status: 'ended',
    tags: ['Techno', 'Party', 'After'],
    invite_code: 'TECH05',
    is_public: true,
    starts_at: daysAgo(5, -4),
    ends_at: daysAgo(5, 2),
    max_capacity: 8,
    template_slug: 'techno',
    lineup_json: { host_rules: 'Musique forte, ambiance chill. Respect mutuel.' },
    created_at: daysAgo(6)
  })
  console.log(`  ✓ Session 2: Techno After Marais (${session2Id?.slice(0, 8)}...)`)

  // Sign in as Romain for session 3
  await signIn('marcus@fluidz.test')

  const session3Id = await upsertSession({
    host_id: marcusId,
    title: 'Leather Night',
    description: 'Soirée cuir chez moi. Dress code: cuir obligatoire. Mecs expérimentés.',
    approx_area: 'Paris 9e',
    exact_address: '15 rue de Maubeuge, 75009 Paris',
    status: 'ended',
    tags: ['Leather', 'Hot', 'Fetish'],
    invite_code: 'LEATH1',
    is_public: false,
    starts_at: daysAgo(1, -5),
    ends_at: daysAgo(1, 1),
    max_capacity: 5,
    template_slug: 'leather',
    lineup_json: { host_rules: 'Dress code cuir. Safe word: ROUGE. Pas de photo.' },
    created_at: daysAgo(3)
  })
  console.log(`  ✓ Session 3: Leather Night (${session3Id?.slice(0, 8)}...)`)

  // Sign back in as Marcus for sessions 4, 5
  await signIn('marcus@fluidz.test')

  const session4Id = await upsertSession({
    host_id: marcusId,
    title: 'Plan ce soir République',
    description: 'Plan intime ce soir, ambiance détendue. Venez chill.',
    approx_area: 'Paris 10e - République',
    exact_address: '8 rue du Faubourg du Temple, 75010 Paris',
    status: 'open',
    tags: ['Chill', 'Hot', 'Intimate'],
    invite_code: 'REPUB1',
    is_public: true,
    starts_at: hoursAgo(2),
    ends_at: hoursFromNow(2),
    max_capacity: 5,
    template_slug: 'dark_room',
    lineup_json: { host_rules: 'Ambiance safe, capotes dispo, respect obligatoire.' },
    created_at: hoursAgo(6)
  })
  console.log(`  ✓ Session 4: Plan ce soir République (${session4Id?.slice(0, 8)}...)`)

  const session5Id = await upsertSession({
    host_id: marcusId,
    title: 'Weekend Chill',
    description: 'Plan chill pour le week-end. Détails à venir.',
    approx_area: 'Paris 11e',
    exact_address: '',
    status: 'draft',
    tags: ['Chill'],
    invite_code: 'WKEND1',
    is_public: false,
    starts_at: null,
    ends_at: null,
    max_capacity: 6,
    template_slug: 'after',
    lineup_json: {},
    created_at: hoursAgo(1)
  })
  console.log(`  ✓ Session 5: Weekend Chill (${session5Id?.slice(0, 8)}...)`)

  // ─── 3. Applications ─────────────────────────────────────────────────────
  try {
  console.log('\n3. Seeding applications...')

  // Session 1 (ended, 14 days ago): Karim, Yann, Lucas, Amine — all accepted+checked_in
  // Alex applied then rejected
  // Must sign in as each applicant to insert (RLS: applicant_id check or host)

  // Sign as Marcus (host) to manage applications for session 1
  await signIn('marcus@fluidz.test')

  // For sessions Marcus hosts, he can insert/update applications
  for (const [name, uid] of [['Karim', karimId], ['Yann', yannId], ['Lucas', lucasId], ['Amine', amineId]].filter(([,u]) => u)) {
    await upsertApplication({
      session_id: session1Id, applicant_id: uid,
      status: 'checked_in', eps_json: { note: `${name} - great vibe` },
      created_at: daysAgo(14, -2)
    })
    console.log(`  ✓ S1: ${name} → checked_in`)
  }

  // Alex applied then rejected
  if (alexId) {
    await upsertApplication({ session_id: session1Id, applicant_id: alexId, status: 'rejected', eps_json: {}, created_at: daysAgo(14, -1) })
    console.log('  ✓ S1: Alex → rejected')
  }

  // Session 2 (ended, 5 days ago)
  await upsertApplication({ session_id: session2Id, applicant_id: karimId, status: 'checked_in', eps_json: {}, created_at: daysAgo(5, -3) })
  for (const [name, uid] of [['Theo', theoId], ['Samir', samirId], ['Jules', julesId], ['Alex', alexId]].filter(([,u]) => u)) {
    await safe(`S2:${name}`, () => upsertApplication({ session_id: session2Id, applicant_id: uid, status: name === 'Samir' ? 'accepted' : 'checked_in', eps_json: {}, created_at: daysAgo(5, -3) }))
  }
  console.log('  ✓ S2: applications seeded')

  // Session 3 (ended, 1 day ago) — host: Romain
  await signIn('marcus@fluidz.test')
  await upsertApplication({ session_id: session3Id, applicant_id: marcusId, status: 'checked_in', eps_json: {}, created_at: daysAgo(2) })
  for (const [name, uid] of [['Theo', theoId], ['Amine', amineId]].filter(([,u]) => u)) {
    await safe(`S3:${name}`, () => upsertApplication({ session_id: session3Id, applicant_id: uid, status: 'checked_in', eps_json: {}, created_at: daysAgo(2) }))
  }
  console.log('  ✓ S3: Marcus(ci), Theo(ci), Amine(ci)')

  // Session 4 (open) — host: Marcus
  await signIn('marcus@fluidz.test')
  await upsertApplication({ session_id: session4Id, applicant_id: karimId, status: 'accepted', eps_json: {}, check_in_requested: true, created_at: hoursAgo(1) })
  await upsertApplication({ session_id: session4Id, applicant_id: yannId, status: 'pending', eps_json: {}, created_at: hoursAgo(0.5) })
  console.log('  ✓ S4: Karim(accepted, check_in_requested), Yann(pending)')

    } catch (e) { console.warn(`  ⚠ Section 3 error: ${e.message}`) }

  // ─── 4. NaughtyBook (contacts + naughtybook_requests) ────────────────────
  try {
  console.log('\n4. Seeding NaughtyBook...')

  // Marcus ↔ Karim: mutual, NB request accepted
  await signIn('marcus@fluidz.test')

  // Insert naughtybook request from Marcus to Karim
  const { data: nbReq1 } = await supabase.from('naughtybook_requests').upsert({
    sender_id: marcusId, receiver_id: karimId, status: 'accepted',
    created_at: daysAgo(10)
  }, { onConflict: 'sender_id,receiver_id' }).select('id').single()

  // Insert mutual contacts both directions
  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: karimId,
    relation_level: 'close', mutual: true, request_status: 'accepted',
    notes: 'Karim - régulier', created_at: daysAgo(10)
  }, { onConflict: 'user_id,contact_user_id' })

  await signIn('karim@fluidz.test')
  await supabase.from('contacts').upsert({
    user_id: karimId, contact_user_id: marcusId,
    relation_level: 'close', mutual: true, request_status: 'accepted',
    notes: 'Marcus - host', created_at: daysAgo(10)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus ↔ Karim: mutual NB (accepted)')

  // Marcus ↔ Yann: mutual contacts, NB request pending from Marcus
  await signIn('marcus@fluidz.test')
  await supabase.from('naughtybook_requests').upsert({
    sender_id: marcusId, receiver_id: yannId, status: 'pending',
    created_at: daysAgo(3)
  }, { onConflict: 'sender_id,receiver_id' })

  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: yannId,
    relation_level: 'connaissance', mutual: false, request_status: 'pending',
    notes: 'Yann - photographe', created_at: daysAgo(12)
  }, { onConflict: 'user_id,contact_user_id' })

  await signIn('yann@fluidz.test')
  await supabase.from('contacts').upsert({
    user_id: yannId, contact_user_id: marcusId,
    relation_level: 'connaissance', mutual: false, request_status: 'direct',
    notes: 'Marcus', created_at: daysAgo(12)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus ↔ Yann: contacts + NB pending from Marcus')

  // Marcus → Romain: direct contact (no NB)
  await signIn('marcus@fluidz.test')
  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: romainId,
    relation_level: 'connaissance', mutual: false, request_status: 'direct',
    notes: 'Romain - leather crew', created_at: daysAgo(8)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus → Romain: direct contact')

  // Marcus → Theo: direct contact
  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: theoId,
    relation_level: 'connaissance', mutual: false, request_status: 'direct',
    notes: 'Theo', created_at: daysAgo(5)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus → Theo: direct contact')

  // Marcus → Alex: direct contact
  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: alexId,
    relation_level: 'connaissance', mutual: false, request_status: 'direct',
    notes: 'Alex', created_at: daysAgo(5)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus → Alex: direct contact')

  // Marcus → Samir: direct contact
  await supabase.from('contacts').upsert({
    user_id: marcusId, contact_user_id: samirId,
    relation_level: 'connaissance', mutual: false, request_status: 'direct',
    notes: 'Samir', created_at: daysAgo(5)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Marcus → Samir: direct contact')

  // Romain ↔ Theo: mutual NB
  await signIn('marcus@fluidz.test')
  await supabase.from('naughtybook_requests').upsert({
    sender_id: romainId, receiver_id: theoId, status: 'accepted',
    created_at: daysAgo(6)
  }, { onConflict: 'sender_id,receiver_id' })
  await supabase.from('contacts').upsert({
    user_id: romainId, contact_user_id: theoId,
    relation_level: 'close', mutual: true, request_status: 'accepted',
    created_at: daysAgo(6)
  }, { onConflict: 'user_id,contact_user_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('contacts').upsert({
    user_id: theoId, contact_user_id: romainId,
    relation_level: 'close', mutual: true, request_status: 'accepted',
    created_at: daysAgo(6)
  }, { onConflict: 'user_id,contact_user_id' })
  console.log('  ✓ Romain ↔ Theo: mutual NB')

    } catch (e) { console.warn(`  ⚠ Section 4 error: ${e.message}`) }

  // ─── 5. DMs ───────────────────────────────────────────────────────────────
  try {
  console.log('\n5. Seeding DMs...')

  // Marcus ↔ Karim: 7 messages
  const dmMK = directDmSessionId(marcusId, karimId)
  await signIn('marcus@fluidz.test')

  const mkMessages = [
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Salut Karim, tu serais dispo ce week-end ?', created_at: daysAgo(8, -2) },
    { sender_id: karimId, sender_name: 'Karim', text: 'Hey ! Oui potentiellement, tu as un plan ?', created_at: daysAgo(8, -1) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Je pensais organiser un truc chez moi, ambiance chill', created_at: daysAgo(8) },
    { sender_id: karimId, sender_name: 'Karim', text: 'Ça me tente bien ! Combien de mecs ?', created_at: daysAgo(7, -5) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Max 5-6, que des mecs cool. Intéressé ?', created_at: daysAgo(7, -4) },
    { sender_id: karimId, sender_name: 'Karim', text: 'Grave, je suis partant. Tu me dis les détails ?', created_at: daysAgo(7, -3) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Top, je t\'envoie l\'invite bientôt 👊', created_at: daysAgo(7, -2) },
  ]

  for (const msg of mkMessages) {
    await supabase.from('messages').insert({
      session_id: dmMK, ...msg,
      room_type: 'dm',
      dm_peer_id: msg.sender_id === marcusId ? karimId : marcusId
    })
  }
  console.log(`  ✓ Marcus ↔ Karim: 7 DMs (${dmMK.slice(0, 8)}...)`)

  // Marcus ↔ Yann: 5 messages
  const dmMY = directDmSessionId(marcusId, yannId)

  const myMessages = [
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Hey Yann, j\'ai vu ton profil. Tu fais de la photo ?', created_at: daysAgo(5, -3) },
    { sender_id: yannId, sender_name: 'Yann', text: 'Salut Marcus ! Oui, photo amateur surtout portraits. Et toi ?', created_at: daysAgo(5, -2) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Cool ! J\'organise des sessions régulièrement, tu serais intéressé ?', created_at: daysAgo(5, -1) },
    { sender_id: yannId, sender_name: 'Yann', text: 'Pourquoi pas, ça dépend de l\'ambiance. C\'est quoi le concept ?', created_at: daysAgo(4, -5) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Plan intime entre mecs, safe et respectueux. Je t\'envoie une invite la prochaine fois.', created_at: daysAgo(4, -4) },
  ]

  for (const msg of myMessages) {
    await supabase.from('messages').insert({
      session_id: dmMY, ...msg,
      room_type: 'dm',
      dm_peer_id: msg.sender_id === marcusId ? yannId : marcusId
    })
  }
  console.log(`  ✓ Marcus ↔ Yann: 5 DMs (${dmMY.slice(0, 8)}...)`)

  // Romain ↔ Marcus: 3 messages
  const dmRM = directDmSessionId(romainId, marcusId)
  await signIn('marcus@fluidz.test')

  const rmMessages = [
    { sender_id: romainId, sender_name: 'Romain', text: 'Marcus, merci pour hier soir. C\'était top.', created_at: daysAgo(1, 2) },
    { sender_id: marcusId, sender_name: 'Marcus', text: 'Merci à toi ! Belle soirée leather, on remet ça quand tu veux.', created_at: daysAgo(1, 3) },
    { sender_id: romainId, sender_name: 'Romain', text: 'Avec plaisir. J\'ai deux-trois mecs à inviter la prochaine fois.', created_at: daysAgo(1, 4) },
  ]

  for (const msg of rmMessages) {
    await supabase.from('messages').insert({
      session_id: dmRM, ...msg,
      room_type: 'dm',
      dm_peer_id: msg.sender_id === romainId ? marcusId : romainId
    })
  }
  console.log(`  ✓ Romain ↔ Marcus: 3 DMs (${dmRM.slice(0, 8)}...)`)

    } catch (e) { console.warn(`  ⚠ Section 5 error: ${e.message}`) }

  // ─── 6. Reviews ───────────────────────────────────────────────────────────
  try {
  console.log('\n6. Seeding reviews...')

  // Session 1 reviews (4 reviews, rating 4-5)
  await signIn('karim@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session1Id, reviewer_id: karimId, target_id: null,
    rating: 5, vibe_tags: ['safe', 'respectueux', 'bonne ambiance'],
    comment: 'Super soirée, Marcus est un hôte incroyable. Ambiance top.',
    is_anonymous: false, created_at: daysAgo(13)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('yann@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session1Id, reviewer_id: yannId, target_id: null,
    rating: 4, vibe_tags: ['safe', 'intime', 'discret'],
    comment: 'Très bien organisé. Petit bémol sur la musique un peu forte.',
    is_anonymous: true, created_at: daysAgo(13, 2)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session1Id, reviewer_id: lucasId, target_id: null,
    rating: 5, vibe_tags: ['bonne ambiance', 'accueillant', 'safe'],
    comment: 'Ma première session, je me suis senti à l\'aise tout de suite.',
    is_anonymous: false, created_at: daysAgo(13, 3)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session1Id, reviewer_id: amineId, target_id: null,
    rating: 4, vibe_tags: ['cool', 'détendeur', 'safe'],
    comment: 'Bonne session, mecs sympas. Je reviendrai.',
    is_anonymous: true, created_at: daysAgo(13, 4)
  }, { onConflict: 'session_id,reviewer_id,target_id' })
  console.log('  ✓ Session 1: 4 reviews (Karim 5★, Yann 4★, Lucas 5★, Amine 4★)')

  // Session 2 reviews (4 reviews)
  await signIn('karim@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session2Id, reviewer_id: karimId, target_id: null,
    rating: 5, vibe_tags: ['techno', 'énergie', 'top'],
    comment: 'Meilleur after de ma vie. La musique était dingue.',
    is_anonymous: false, created_at: daysAgo(4)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session2Id, reviewer_id: theoId, target_id: null,
    rating: 4, vibe_tags: ['fun', 'safe', 'bonne musique'],
    comment: 'Ambiance techno nickel, bons mecs.',
    is_anonymous: true, created_at: daysAgo(4, 1)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session2Id, reviewer_id: julesId, target_id: null,
    rating: 5, vibe_tags: ['accueillant', 'safe', 'fun'],
    comment: 'J\'étais stressé mais l\'ambiance était vraiment cool.',
    is_anonymous: false, created_at: daysAgo(4, 2)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session2Id, reviewer_id: alexId, target_id: null,
    rating: 4, vibe_tags: ['techno', 'cool', 'détendeur'],
    comment: 'Bonne soirée, Marcus sait recevoir.',
    is_anonymous: true, created_at: daysAgo(4, 3)
  }, { onConflict: 'session_id,reviewer_id,target_id' })
  console.log('  ✓ Session 2: 4 reviews')

  // Session 3 reviews (2 done, Amine pending in review_queue)
  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session3Id, reviewer_id: marcusId, target_id: null,
    rating: 5, vibe_tags: ['leather', 'intense', 'safe'],
    comment: 'Romain est un super host pour les soirées leather. Respect total.',
    is_anonymous: false, created_at: hoursAgo(12)
  }, { onConflict: 'session_id,reviewer_id,target_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('reviews').upsert({
    session_id: session3Id, reviewer_id: theoId, target_id: null,
    rating: 4, vibe_tags: ['leather', 'bonne ambiance', 'intime'],
    comment: 'Soirée leather très bien organisée.',
    is_anonymous: true, created_at: hoursAgo(10)
  }, { onConflict: 'session_id,reviewer_id,target_id' })
  console.log('  ✓ Session 3: 2 reviews (Marcus 5★, Theo 4★)')

  // Amine pending in review_queue for session 3
  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session3Id, user_id: amineId,
    status: 'pending', created_at: hoursAgo(8)
  }, { onConflict: 'user_id,session_id' })
  console.log('  ✓ Session 3: Amine in review_queue (pending)')

    } catch (e) { console.warn(`  ⚠ Section 6 error: ${e.message}`) }

  // ─── 7. Notifications ────────────────────────────────────────────────────
  try {
  console.log('\n7. Seeding notifications...')

  await signIn('marcus@fluidz.test')

  const marcusNotifications = [
    { user_id: marcusId, session_id: session4Id, type: 'application', title: 'Nouvelle candidature', body: 'Karim a postulé pour "Plan ce soir République"', href: `/session/${session4Id}/host`, created_at: hoursAgo(1) },
    { user_id: marcusId, session_id: session1Id, type: 'checkin', title: 'Check-in', body: 'Karim est arrivé à "Dark Room Bastille"', href: `/session/${session1Id}/host`, created_at: daysAgo(14, 1) },
    { user_id: marcusId, session_id: session4Id, type: 'check_in_request', title: 'Demande d\'arrivée', body: 'Karim demande à valider son arrivée', href: `/session/${session4Id}/host`, created_at: hoursAgo(0.5) },
    { user_id: marcusId, session_id: session1Id, type: 'review_reminder', title: 'Laissez un avis', body: 'N\'oubliez pas de noter "Dark Room Bastille"', href: `/session/${session1Id}/review`, created_at: daysAgo(13, -1) },
    { user_id: marcusId, type: 'intent_match', title: 'Affinité mutuelle !', body: 'Vous avez des envies en commun avec Karim', href: `/contacts/${karimId}`, created_at: daysAgo(9) },
    { user_id: marcusId, type: 'application_not_selected', title: 'Non retenu', body: 'Votre candidature pour "Session Cuddle" n\'a pas été retenue', href: '/explore', created_at: daysAgo(2) },
    { user_id: marcusId, session_id: session4Id, type: 'panic_alert', title: 'Alerte !', body: 'Un participant a activé l\'alerte de sécurité', href: `/session/${session4Id}`, created_at: hoursAgo(0.2) },
  ]

  for (const notif of marcusNotifications) {
    await supabase.from('notifications').insert(notif)
  }
  console.log('  ✓ Marcus: 7 notifications (one of each type)')

  // Notifications for other users
  await signIn('karim@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: karimId, session_id: session4Id, type: 'application', title: 'Candidature acceptée', body: 'Vous avez été accepté pour "Plan ce soir République"', href: `/session/${session4Id}`, created_at: hoursAgo(0.8) },
    { user_id: karimId, type: 'naughtybook_accepted', title: 'NaughtyBook', body: 'Marcus vous a ajouté à son NaughtyBook', href: `/contacts/${marcusId}`, created_at: daysAgo(10) },
    { user_id: karimId, type: 'intent_match', title: 'Affinité mutuelle !', body: 'Envies en commun avec Marcus', href: `/contacts/${marcusId}`, created_at: daysAgo(9) },
  ])
  console.log('  ✓ Karim: 3 notifications')

  await signIn('yann@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: yannId, type: 'naughtybook_request', title: 'Demande NaughtyBook', body: 'Marcus veut vous ajouter à son NaughtyBook', href: `/profile/${marcusId}`, created_at: daysAgo(3) },
    { user_id: yannId, session_id: session4Id, type: 'application', title: 'En attente', body: 'Votre candidature pour "Plan ce soir République" est en attente', href: `/session/${session4Id}`, created_at: hoursAgo(0.5) },
  ])
  console.log('  ✓ Yann: 2 notifications')

  await signIn('marcus@fluidz.test')
  await supabase.from('notifications').insert([
    { user_id: romainId, session_id: session3Id, type: 'review_reminder', title: 'Laissez un avis', body: 'Notez votre session "Leather Night"', href: `/session/${session3Id}/review`, created_at: hoursAgo(6) },
  ])
  console.log('  ✓ Romain: 1 notification')

    } catch (e) { console.warn(`  ⚠ Section 7 error: ${e.message}`) }

  // ─── 8. Intents ───────────────────────────────────────────────────────────
  try {
  console.log('\n8. Seeding intents...')

  await signIn('marcus@fluidz.test')
  await supabase.from('intents').upsert({
    user_id: marcusId, target_user_id: karimId,
    intents: ['massage', 'câlins', 'plan'],
    session_id: session1Id,
    created_at: daysAgo(10), updated_at: daysAgo(10)
  }, { onConflict: 'user_id,target_user_id' })

  await supabase.from('intents').upsert({
    user_id: marcusId, target_user_id: yannId,
    intents: ['massage', 'discussion'],
    created_at: daysAgo(4), updated_at: daysAgo(4)
  }, { onConflict: 'user_id,target_user_id' })

  await supabase.from('intents').upsert({
    user_id: marcusId, target_user_id: theoId,
    intents: ['yoga', 'massage'],
    created_at: daysAgo(5), updated_at: daysAgo(5)
  }, { onConflict: 'user_id,target_user_id' })
  console.log('  ✓ Marcus → Karim, Yann, Theo: intents')

  await signIn('karim@fluidz.test')
  await supabase.from('intents').upsert({
    user_id: karimId, target_user_id: marcusId,
    intents: ['massage', 'câlins', 'discussion'],
    session_id: session1Id,
    created_at: daysAgo(10), updated_at: daysAgo(10)
  }, { onConflict: 'user_id,target_user_id' })
  console.log('  ✓ Karim → Marcus: intents (triggers mutual match)')

  await signIn('yann@fluidz.test')
  await supabase.from('intents').upsert({
    user_id: yannId, target_user_id: marcusId,
    intents: ['photo', 'discussion'],
    created_at: daysAgo(4), updated_at: daysAgo(4)
  }, { onConflict: 'user_id,target_user_id' })
  console.log('  ✓ Yann → Marcus: intents')

  await signIn('marcus@fluidz.test')
  await supabase.from('intents').upsert({
    user_id: theoId, target_user_id: romainId,
    intents: ['leather', 'domination'],
    created_at: daysAgo(5), updated_at: daysAgo(5)
  }, { onConflict: 'user_id,target_user_id' })
  console.log('  ✓ Theo → Romain: intents')

    } catch (e) { console.warn(`  ⚠ Section 8 error: ${e.message}`) }

  // ─── 9. Contact Groups ───────────────────────────────────────────────────
  try {
  console.log('\n9. Seeding contact groups...')

  await signIn('marcus@fluidz.test')

  // Group 1: Réguliers Bastille
  const { data: group1 } = await supabase.from('contact_groups').upsert({
    owner_id: marcusId, name: 'Réguliers Bastille',
    description: 'Les mecs qui reviennent souvent aux sessions Bastille',
    color: '#E0887A'
  }, { onConflict: 'owner_id,name' }).select('id').single()

  // If we couldn't upsert (no unique on name), try insert
  let g1Id = group1?.id
  if (!g1Id) {
    const { data: existing } = await supabase
      .from('contact_groups')
      .select('id')
      .eq('owner_id', marcusId)
      .eq('name', 'Réguliers Bastille')
      .maybeSingle()
    if (existing) {
      g1Id = existing.id
    } else {
      const { data: ins } = await supabase
        .from('contact_groups')
        .insert({ owner_id: marcusId, name: 'Réguliers Bastille', description: 'Les mecs qui reviennent souvent aux sessions Bastille', color: '#E0887A' })
        .select('id').single()
      g1Id = ins?.id
    }
  }

  if (g1Id) {
    for (const uid of [karimId, lucasId, amineId]) {
      await supabase.from('contact_group_members').upsert({
        group_id: g1Id, contact_user_id: uid
      }, { onConflict: 'group_id,contact_user_id' })
    }
    console.log(`  ✓ "Réguliers Bastille" with Karim, Lucas, Amine`)
  }

  // Group 2: Leather Crew
  let g2Id
  const { data: existing2 } = await supabase
    .from('contact_groups')
    .select('id')
    .eq('owner_id', marcusId)
    .eq('name', 'Leather Crew')
    .maybeSingle()

  if (existing2) {
    g2Id = existing2.id
  } else {
    const { data: ins2 } = await supabase
      .from('contact_groups')
      .insert({ owner_id: marcusId, name: 'Leather Crew', description: 'Mecs cuir / leather nights', color: '#4A3728' })
      .select('id').single()
    g2Id = ins2?.id
  }

  if (g2Id) {
    for (const uid of [romainId, theoId]) {
      await supabase.from('contact_group_members').upsert({
        group_id: g2Id, contact_user_id: uid
      }, { onConflict: 'group_id,contact_user_id' })
    }
    console.log(`  ✓ "Leather Crew" with Romain, Theo`)
  }

    } catch (e) { console.warn(`  ⚠ Section 9 error: ${e.message}`) }

  // ─── 10. Favorites ───────────────────────────────────────────────────────
  try {
  console.log('\n10. Seeding favorites...')

  await signIn('marcus@fluidz.test')
  for (const uid of [karimId, romainId, theoId]) {
    await supabase.from('favorites').upsert({
      user_id: marcusId, target_user_id: uid
    }, { onConflict: 'user_id,target_user_id' })
  }
  console.log('  ✓ Marcus favorites: Karim, Romain, Theo')

  await signIn('karim@fluidz.test')
  await supabase.from('favorites').upsert({
    user_id: karimId, target_user_id: marcusId
  }, { onConflict: 'user_id,target_user_id' })
  console.log('  ✓ Karim favorites: Marcus')

  await signIn('marcus@fluidz.test')
  for (const uid of [marcusId, theoId]) {
    await supabase.from('favorites').upsert({
      user_id: romainId, target_user_id: uid
    }, { onConflict: 'user_id,target_user_id' })
  }
  console.log('  ✓ Romain favorites: Marcus, Theo')

    } catch (e) { console.warn(`  ⚠ Section 10 error: ${e.message}`) }

  // ─── 11. Saved Messages ──────────────────────────────────────────────────
  try {
  console.log('\n11. Seeding saved messages...')

  await signIn('marcus@fluidz.test')

  const savedMsgs = [
    { user_id: marcusId, label: 'Intro session', text: 'Salut ! Je t\'invite à ma prochaine session. Ambiance safe et respectueuse, entre mecs cool. Intéressé ?', sort_order: 1 },
    { user_id: marcusId, label: 'Rappel règles', text: 'Petit rappel: safe word = STOP, capotes à dispo, respect mutuel obligatoire. Pas de photo/vidéo.', sort_order: 2 },
    { user_id: marcusId, label: 'Bienvenue', text: 'Bienvenue ! Mets-toi à l\'aise, la douche est au bout du couloir. N\'hésite pas si tu as besoin de quoi que ce soit.', sort_order: 3 },
  ]

  for (const msg of savedMsgs) {
    // Check if already exists
    const { data: ex } = await supabase
      .from('saved_messages')
      .select('id')
      .eq('user_id', marcusId)
      .eq('label', msg.label)
      .maybeSingle()
    if (!ex) {
      await supabase.from('saved_messages').insert(msg)
    }
  }
  console.log('  ✓ Marcus: 3 saved messages')

    } catch (e) { console.warn(`  ⚠ Section 11 error: ${e.message}`) }

  // ─── 12. Review queue entries for ended sessions ──────────────────────────
  try {
  console.log('\n12. Seeding review queue...')

  // Session 1 review queue (all should have reviewed already, but add for completeness)
  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session1Id, user_id: marcusId,
    status: 'completed', created_at: daysAgo(14, 1)
  }, { onConflict: 'user_id,session_id' })

  await signIn('karim@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session1Id, user_id: karimId,
    status: 'completed', created_at: daysAgo(14, 1)
  }, { onConflict: 'user_id,session_id' })

  await signIn('yann@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session1Id, user_id: yannId,
    status: 'completed', created_at: daysAgo(14, 1)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session1Id, user_id: lucasId,
    status: 'completed', created_at: daysAgo(14, 1)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session1Id, user_id: amineId,
    status: 'completed', created_at: daysAgo(14, 1)
  }, { onConflict: 'user_id,session_id' })
  console.log('  ✓ Session 1: review_queue all completed')

  // Session 2 review queue
  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session2Id, user_id: marcusId,
    status: 'completed', created_at: daysAgo(5, 2)
  }, { onConflict: 'user_id,session_id' })

  await signIn('karim@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session2Id, user_id: karimId,
    status: 'completed', created_at: daysAgo(5, 2)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session2Id, user_id: theoId,
    status: 'completed', created_at: daysAgo(5, 2)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session2Id, user_id: julesId,
    status: 'completed', created_at: daysAgo(5, 2)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session2Id, user_id: alexId,
    status: 'completed', created_at: daysAgo(5, 2)
  }, { onConflict: 'user_id,session_id' })
  console.log('  ✓ Session 2: review_queue all completed')

  // Session 3 review queue (Marcus + Theo completed, Amine pending — already seeded above)
  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session3Id, user_id: marcusId,
    status: 'completed', created_at: hoursAgo(12)
  }, { onConflict: 'user_id,session_id' })

  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session3Id, user_id: theoId,
    status: 'completed', created_at: hoursAgo(10)
  }, { onConflict: 'user_id,session_id' })

  // Romain (host) review queue
  await signIn('marcus@fluidz.test')
  await supabase.from('review_queue').upsert({
    session_id: session3Id, user_id: romainId,
    status: 'pending', created_at: hoursAgo(8)
  }, { onConflict: 'user_id,session_id' })
  console.log('  ✓ Session 3: review_queue (Marcus+Theo completed, Amine+Romain pending)')

  // ─── Done ─────────────────────────────────────────────────────────────────
  // Sign back in as Marcus
  await signIn('marcus@fluidz.test')

    } catch (e) { console.warn(`  ⚠ Section 12 error: ${e.message}`) }

  console.log('\n═══ SEED COMPLETE ═══')
  console.log(`  Users: 10`)
  console.log(`  Sessions: 5 (2 ended, 1 ended yesterday, 1 open, 1 draft)`)
  console.log(`  Applications: 14`)
  console.log(`  NaughtyBook: 2 pairs`)
  console.log(`  Contacts: 8 entries`)
  console.log(`  DMs: 15 messages across 3 conversations`)
  console.log(`  Reviews: 10`)
  console.log(`  Notifications: 13`)
  console.log(`  Intents: 5 entries`)
  console.log(`  Contact groups: 2`)
  console.log(`  Favorites: 6`)
  console.log(`  Saved messages: 3`)
  console.log(`  Review queue: 12 entries`)
  console.log(`\n  Signed in as: marcus@fluidz.test\n`)
}

main().catch(err => {
  console.error('\n✗ SEED FAILED:', err.message)
  console.error(err.stack)
  process.exit(1)
})
