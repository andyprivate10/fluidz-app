#!/usr/bin/env node
/**
 * seed-demo-explore.mjs — Seed 50 demo profiles near Siquijor, Philippines
 * for testing the Explore page geo search.
 *
 * Usage:  node scripts/seed-demo-explore.mjs
 * Idempotent: signIn first, signUp if not found, then upsert user_profiles.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kxbrfjqxufvskcxmliak.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnJmanF4dWZ2c2tjeG1saWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY3ODQ2NiwiZXhwIjoyMDg4MjU0NDY2fQ.K_qpTfoA3N22k3fmgxj_SUX7yOiBjoTkMVZxmLv66Wk'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ─── Center: Siquijor, Philippines ──────────────────────────────────────────
const CENTER_LAT = 9.2048
const CENTER_LNG = 123.5404
const RADIUS_KM = 12

// Convert km offset to degrees (approx)
function kmToDeg(km) { return km / 111.32 }

function randomInRadius() {
  const angle = Math.random() * 2 * Math.PI
  const dist = Math.random() * RADIUS_KM
  const dLat = kmToDeg(dist * Math.cos(angle))
  const dLng = kmToDeg(dist * Math.sin(angle)) / Math.cos(CENTER_LAT * Math.PI / 180)
  return {
    lat: Math.round((CENTER_LAT + dLat) * 10000) / 10000,
    lng: Math.round((CENTER_LNG + dLng) * 10000) / 10000
  }
}

const PASSWORD = 'testpass123'

// ─── 50 Profiles ────────────────────────────────────────────────────────────
const PROFILES = [
  { name: 'Leo', age: 24, role: 'Bottom', morph: 'Mince', eth: 'blanc', tribes: ['twink'], kinks: ['Câlins','Rimming'], dm: 'open' },
  { name: 'Matteo', age: 29, role: 'Top', morph: 'Athletique', eth: 'blanc', tribes: ['jock'], kinks: ['Dominant','Menottes','Jeux de rôle'], dm: 'profile_required' },
  { name: 'Rayan', age: 27, role: 'Versatile', morph: 'Sportif', eth: 'moyen_oriental', tribes: ['otter'], kinks: ['Massage','Rimming','Câlins'], dm: 'open' },
  { name: 'Diego', age: 32, role: 'Top-Versatile', morph: 'Muscle', eth: 'latino', tribes: ['muscle_bear'], kinks: ['Dominant','Spanking','Exhib'], dm: 'profile_required' },
  { name: 'Yuki', age: 26, role: 'Bottom', morph: 'Mince', eth: 'asiatique', tribes: ['twink'], kinks: ['Câlins','Rimming','Câlins'], dm: 'open' },
  { name: 'Theo', age: 35, role: 'Top', morph: 'Ours', eth: 'blanc', tribes: ['bear','Cuir','daddy'], kinks: ['Cuir','Dominant','Fist'], dm: 'profile_required' },
  { name: 'Alexis', age: 23, role: 'Versatile', morph: 'Sportif', eth: 'metis', tribes: ['jock'], kinks: ['Rimming','Massage','Câlins'], dm: 'open' },
  { name: 'Nathan', age: 31, role: 'Bottom-Versatile', morph: 'Athletique', eth: 'noir', tribes: ['jock'], kinks: ['Jeux de rôle','Câlins','Exhib'], dm: 'open' },
  { name: 'Hugo', age: 28, role: 'Top', morph: 'Moyen', eth: 'blanc', tribes: [], kinks: ['Rimming','Dominant','Câlins'], dm: 'open' },
  { name: 'Samir', age: 33, role: 'Versatile', morph: 'Costaud', eth: 'moyen_oriental', tribes: ['bear'], kinks: ['Massage','Menottes','Rimming'], dm: 'profile_required' },
  { name: 'Kenji', age: 25, role: 'Side', morph: 'Mince', eth: 'asiatique', tribes: ['twink'], kinks: ['Câlins','Massage','Câlins'], dm: 'open' },
  { name: 'Carlos', age: 30, role: 'Power-Bottom', morph: 'Sportif', eth: 'latino', tribes: ['jock'], kinks: ['Groupe','Exhib','Rimming'], dm: 'open' },
  { name: 'Felix', age: 38, role: 'Top', morph: 'Muscle', eth: 'blanc', tribes: ['Cuir','daddy'], kinks: ['Cuir','Dominant','Fist'], dm: 'profile_required' },
  { name: 'Amine', age: 26, role: 'Bottom', morph: 'Athletique', eth: 'moyen_oriental', tribes: ['otter'], kinks: ['Rimming','Câlins'], dm: 'open' },
  { name: 'Luca', age: 22, role: 'Versatile', morph: 'Mince', eth: 'blanc', tribes: ['twink'], kinks: ['Câlins','Massage'], dm: 'open' },
  { name: 'Brandon', age: 27, role: 'Top-Versatile', morph: 'Athletique', eth: 'noir', tribes: ['jock'], kinks: ['Dominant','Spanking','Rimming'], dm: 'profile_required' },
  { name: 'Julien', age: 34, role: 'Bottom', morph: 'Grassouillet', eth: 'blanc', tribes: ['bear','cub'], kinks: ['Câlins','Rimming','Groupe'], dm: 'open' },
  { name: 'Marco', age: 29, role: 'Top', morph: 'Muscle', eth: 'blanc', tribes: ['muscle_bear'], kinks: ['Dominant','Menottes','Cuir'], dm: 'profile_required' },
  { name: 'Kevin', age: 24, role: 'Versatile', morph: 'Sportif', eth: 'metis', tribes: ['jock'], kinks: ['Rimming','Câlins','Massage'], dm: 'open' },
  { name: 'Tariq', age: 31, role: 'Power-Bottom', morph: 'Athletique', eth: 'moyen_oriental', tribes: ['otter'], kinks: ['Groupe','Exhib','Jeux de rôle'], dm: 'open' },
  { name: 'Jin', age: 28, role: 'Bottom', morph: 'Mince', eth: 'asiatique', tribes: ['twink'], kinks: ['Câlins','Rimming','Câlins'], dm: 'open' },
  { name: 'Roberto', age: 36, role: 'Top', morph: 'Costaud', eth: 'latino', tribes: ['bear','daddy'], kinks: ['Dominant','Cuir','Fist'], dm: 'profile_required' },
  { name: 'Erwan', age: 25, role: 'Versatile', morph: 'Sportif', eth: 'blanc', tribes: ['jock'], kinks: ['Massage','Rimming','Câlins'], dm: 'open' },
  { name: 'Milo', age: 21, role: 'Bottom', morph: 'Mince', eth: 'blanc', tribes: ['twink'], kinks: ['Câlins','Rimming'], dm: 'open' },
  { name: 'Serge', age: 42, role: 'Top', morph: 'Ours', eth: 'blanc', tribes: ['bear','Cuir','daddy'], kinks: ['Cuir','Dominant','Fist'], dm: 'profile_required' },
  { name: 'Noam', age: 27, role: 'Versatile', morph: 'Athletique', eth: 'moyen_oriental', tribes: ['otter'], kinks: ['Rimming','Massage','Câlins'], dm: 'open' },
  { name: 'Axel', age: 33, role: 'Top-Versatile', morph: 'Muscle', eth: 'blanc', tribes: ['muscle_bear'], kinks: ['Dominant','Menottes','Spanking'], dm: 'profile_required' },
  { name: 'Sofiane', age: 29, role: 'Bottom-Versatile', morph: 'Sportif', eth: 'moyen_oriental', tribes: ['jock'], kinks: ['Rimming','Câlins','Exhib'], dm: 'open' },
  { name: 'Remi', age: 26, role: 'Bottom', morph: 'Moyen', eth: 'blanc', tribes: [], kinks: ['Câlins','Rimming'], dm: 'open' },
  { name: 'Paulo', age: 30, role: 'Top', morph: 'Athletique', eth: 'latino', tribes: ['jock'], kinks: ['Dominant','Rimming','Spanking'], dm: 'profile_required' },
  { name: 'Arjun', age: 28, role: 'Versatile', morph: 'Sportif', eth: 'sud_asiatique', tribes: ['otter'], kinks: ['Massage','Câlins','Rimming'], dm: 'open' },
  { name: 'Tristan', age: 35, role: 'Power-Bottom', morph: 'Athletique', eth: 'blanc', tribes: ['Cuir'], kinks: ['Cuir','Exhib','Groupe'], dm: 'profile_required' },
  { name: 'Sebastien', age: 40, role: 'Top', morph: 'Costaud', eth: 'blanc', tribes: ['bear','daddy'], kinks: ['Dominant','Cuir','Fist'], dm: 'profile_required' },
  { name: 'Bastien', age: 23, role: 'Bottom', morph: 'Mince', eth: 'blanc', tribes: ['twink','pup'], kinks: ['Câlins','Switch'], dm: 'open' },
  { name: 'Ryusei', age: 27, role: 'Versatile', morph: 'Athletique', eth: 'asiatique', tribes: ['jock'], kinks: ['Rimming','Massage','Câlins'], dm: 'open' },
  { name: 'Mehdi', age: 32, role: 'Top-Versatile', morph: 'Muscle', eth: 'moyen_oriental', tribes: ['muscle_bear'], kinks: ['Dominant','Menottes','Rimming'], dm: 'profile_required' },
  { name: 'Tom', age: 25, role: 'Side', morph: 'Mince', eth: 'blanc', tribes: ['twink'], kinks: ['Câlins','Massage','Câlins'], dm: 'open' },
  { name: 'Baptiste', age: 31, role: 'Versatile', morph: 'Sportif', eth: 'blanc', tribes: ['jock'], kinks: ['Rimming','Groupe','Massage'], dm: 'open' },
  { name: 'Kwame', age: 28, role: 'Top', morph: 'Athletique', eth: 'noir', tribes: ['jock'], kinks: ['Dominant','Rimming','Spanking'], dm: 'profile_required' },
  { name: 'Vincent', age: 37, role: 'Bottom-Versatile', morph: 'Moyen', eth: 'blanc', tribes: [], kinks: ['Câlins','Rimming','Exhib'], dm: 'open' },
  { name: 'Rafael', age: 26, role: 'Bottom', morph: 'Sportif', eth: 'latino', tribes: ['jock'], kinks: ['Rimming','Câlins'], dm: 'open' },
  { name: 'Soren', age: 29, role: 'Top', morph: 'Athletique', eth: 'blanc', tribes: ['jock'], kinks: ['Dominant','Menottes','Rimming'], dm: 'profile_required' },
  { name: 'Hamza', age: 24, role: 'Versatile', morph: 'Sportif', eth: 'moyen_oriental', tribes: ['otter'], kinks: ['Massage','Rimming','Câlins'], dm: 'open' },
  { name: 'Cedric', age: 33, role: 'Top', morph: 'Muscle', eth: 'metis', tribes: ['daddy'], kinks: ['Dominant','Cuir','Spanking'], dm: 'profile_required' },
  { name: 'Loris', age: 22, role: 'Bottom', morph: 'Mince', eth: 'blanc', tribes: ['twink'], kinks: ['Câlins','Rimming'], dm: 'open' },
  { name: 'TheoB', age: 30, role: 'Power-Bottom', morph: 'Athletique', eth: 'blanc', tribes: ['Cuir','pup'], kinks: ['Cuir','Switch','Exhib'], dm: 'open' },
  { name: 'Damien', age: 36, role: 'Top-Versatile', morph: 'Costaud', eth: 'blanc', tribes: ['bear','daddy'], kinks: ['Dominant','Cuir','Fist'], dm: 'profile_required' },
  { name: 'Ivan', age: 28, role: 'Versatile', morph: 'Sportif', eth: 'blanc', tribes: ['jock'], kinks: ['Rimming','Massage','Groupe'], dm: 'open' },
  { name: 'Noa', age: 25, role: 'Bottom', morph: 'Mince', eth: 'metis', tribes: ['drag_queen'], kinks: ['Câlins','Jeux de rôle'], dm: 'open' },
  { name: 'Killian', age: 27, role: 'Top', morph: 'Athletique', eth: 'blanc', tribes: ['jock'], kinks: ['Dominant','Rimming','Menottes'], dm: 'profile_required' },
]

// ─── Bio templates ──────────────────────────────────────────────────────────
const BIOS = [
  'Chill vibes, looking for real connections',
  'New to the island, open-minded & curious',
  'Here for fun and good energy',
  'Respectful & discreet, let\'s chat first',
  'Love the beach life, looking to meet cool guys',
  'Adventurous spirit, open to anything',
  'Just moved here, show me around?',
  'Good conversation > everything',
  'Spontaneous & laid-back',
  'Looking for like-minded guys nearby',
]

const LANGUAGES_POOL = ['English', 'French', 'Spanish', 'Filipino', 'Japanese', 'Arabic', 'Portuguese', 'Mandarin', 'Korean', 'German']
const SEARCHING_FOR = ['hookup', 'date', 'friends', 'relationship', 'fun', 'chat']
const OCCASIONS = ['Ce soir si le feeling est bon', 'This week', 'Whenever', 'Weekend', 'Now', 'Flexible']
const LIMITS_POOL = ['No bareback', 'Mutual respect', 'Safe only', 'No drugs', 'Condoms always', 'Ask me', 'Discuss first']
const SERO_STATUSES = ['Negatif', 'Positif indétectable', 'Negatif']
const PREP_STATUSES = ['Actif', 'Inactif', 'Non']
const HEIGHTS = [165, 168, 170, 172, 175, 178, 180, 183, 185, 188, 190]
const WEIGHTS = [58, 62, 65, 68, 72, 75, 78, 82, 85, 90, 95]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function buildProfileJson(p, idx) {
  const hasAdult = Math.random() < 0.6
  const avatarId = (idx * 7 + 3) % 70 + 1 // deterministic but varied
  const avatar_url = `https://i.pravatar.cc/300?img=${avatarId}`

  // 1-5 profile photos
  const numProfilePhotos = 1 + Math.floor(Math.random() * 5)
  const photos_profil = [avatar_url]
  for (let i = 1; i < numProfilePhotos; i++) {
    photos_profil.push(`https://picsum.photos/seed/${p.name}p${i}/400/400`)
  }

  // 1-3 intimate photos (60% of profiles)
  const photos_intime = []
  if (hasAdult) {
    const numIntime = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < numIntime; i++) {
      photos_intime.push(`https://picsum.photos/seed/${p.name}i${i}/400/400`)
    }
  }

  // Body part photos for adult profiles
  const body_part_photos = {}
  if (hasAdult) {
    body_part_photos.torso = [`https://picsum.photos/seed/${p.name}torso/400/400`]
    body_part_photos.ass = [`https://picsum.photos/seed/${p.name}ass/400/400`]
    body_part_photos.legs = [`https://picsum.photos/seed/${p.name}legs/400/400`]
  }

  // Languages: 1-3
  const languages = pickN(LANGUAGES_POOL, 1 + Math.floor(Math.random() * 3))
  if (!languages.includes('English')) languages[0] = 'English' // everyone speaks EN

  const lastTestDays = 30 + Math.floor(Math.random() * 150)
  const lastTestDate = new Date()
  lastTestDate.setDate(lastTestDate.getDate() - lastTestDays)

  return {
    age: p.age,
    bio: BIOS[idx % BIOS.length],
    role: p.role,
    orientation: 'Gay',
    morphology: p.morph,
    height: pick(HEIGHTS),
    weight: pick(WEIGHTS),
    ethnicities: [p.eth],
    tribes: p.tribes,
    languages,
    kinks: p.kinks,
    limits: pick(LIMITS_POOL),
    searching_for: pickN(SEARCHING_FOR, 1 + Math.floor(Math.random() * 3)),
    occasion: pick(OCCASIONS),
    home_country: 'Philippines',
    home_city: 'Siquijor',
    location: 'Siquijor Island',
    avatar_url,
    photos_profil,
    photos_intime,
    body_part_photos,
    health: {
      prep_status: pick(PREP_STATUSES),
      last_test: lastTestDate.toISOString().slice(0, 10),
      dernier_test: lastTestDate.toISOString().slice(0, 10),
      sero_status: pick(SERO_STATUSES),
      tested: true,
      prep: Math.random() > 0.4,
    },
    dm_privacy: p.dm,
    section_visibility: {
      photos_adulte: hasAdult ? pick(['all', 'naughtybook']) : 'naughtybook',
      body_part_photos: hasAdult ? pick(['all', 'naughtybook']) : 'naughtybook',
      kinks: pick(['all', 'naughtybook']),
      health: pick(['all', 'naughtybook']),
      limits: pick(['all', 'naughtybook']),
      public_photos: 'all',
    },
    onboarding_done: true,
    last_seen: new Date().toISOString(),
  }
}

// ─── Auth helpers (admin API — bypasses email validation & rate limits) ──────
async function getOrCreateUser(email, displayName) {
  // First try to find existing user by listing all users
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = allUsers?.users?.find(u => u.email === email)
  if (existing) return existing.id

  // Not found — create
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName }
  })

  if (createData?.user) return createData.user.id

  console.error(`  Failed to create ${email}:`, createError?.message)
  return null
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n  Seeding 50 demo profiles near Siquijor (${CENTER_LAT}, ${CENTER_LNG})...\n`)

  let success = 0
  let skipped = 0

  for (let i = 0; i < PROFILES.length; i++) {
    const p = PROFILES[i]
    const email = `demo_${p.name.toLowerCase()}_${i}@fluidz.test`
    const displayName = p.name

    process.stdout.write(`  [${i + 1}/50] ${displayName} (${email})... `)

    const userId = await getOrCreateUser(email, displayName)
    if (!userId) {
      console.log('SKIP (auth failed)')
      skipped++
      await delay(350)
      continue
    }

    const { lat, lng } = randomInRadius()
    const profileJson = buildProfileJson(p, i)

    const { error: upsertError } = await supabase.from('user_profiles').upsert({
      id: userId,
      display_name: displayName,
      profile_json: profileJson,
      approx_lat: lat,
      approx_lng: lng,
      location_visible: true,
      location_updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertError) {
      console.log(`ERROR: ${upsertError.message}`)
      skipped++
    } else {
      console.log(`OK (${lat}, ${lng})`)
      success++
    }

    await delay(350)
  }

  console.log(`\n  Done! ${success} created, ${skipped} skipped.\n`)
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
