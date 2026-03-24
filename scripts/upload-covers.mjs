#!/usr/bin/env node
/**
 * Upload session template covers to Supabase Storage + update admin_config.
 * Usage: node scripts/upload-covers.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://kxbrfjqxufvskcxmliak.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnJmanF4dWZ2c2tjeG1saWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY3ODQ2NiwiZXhwIjoyMDg4MjU0NDY2fQ.K_qpTfoA3N22k3fmgxj_SUX7yOiBjoTkMVZxmLv66Wk'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const COVERS_DIR = join(import.meta.dirname, '..', 'Sessions Templates Covers', 'cropped')
const BUCKET = 'templates'

// Map image slug (hyphenated) → template metadata
const TEMPLATE_META = {
  'after':          { label: 'After',          color: '#8B5CF6', tags: ['Party'],                   description: 'L\'after qui prolonge la nuit' },
  'alchemy':        { label: 'Alchemy',        color: '#D97706', tags: ['Fetish'],                  description: 'Transmutation des desirs' },
  'artsy':          { label: 'Artsy',          color: '#EC4899', tags: ['Chill'],                   description: 'Quand l\'art rencontre le désir' },
  'basement':       { label: 'Basement',       color: '#6B7280', tags: ['Dark Room', 'Fetish'],     description: 'Dans les profondeurs, tout est permis' },
  'champagne-bath': { label: 'Champagne Bath', color: '#F59E0B', tags: ['Chill', 'Hot'],            description: 'Luxe, bulles et plaisir' },
  'dark-room':      { label: 'Dark Room',      color: '#E0887A', tags: ['Dark Room', 'Hot'],        description: 'Ambiance sombre, discrétion totale' },
  'drag':           { label: 'Drag',           color: '#A855F7', tags: ['Party'],                   description: 'Glam, fierce et libéré' },
  'euphoria':       { label: 'Euphoria',       color: '#F472B6', tags: ['Party', 'Hot'],            description: 'Extase collective' },
  'jacuzzi':        { label: 'Jacuzzi',        color: '#06B6D4', tags: ['Chill', 'Hot'],            description: 'Bulles chaudes, rencontres brûlantes' },
  'latex':          { label: 'Latex',          color: '#1F2937', tags: ['Fetish'],                  description: 'Seconde peau, première sensation' },
  'leather':        { label: 'Leather',        color: '#92400E', tags: ['Fetish'],                  description: 'Cuir et attitude' },
  'nature':         { label: 'Nature',         color: '#059669', tags: ['Chill'],                   description: 'En plein air, en pleine liberté' },
  'powder':         { label: 'Powder Room',    color: '#9080BA', tags: ['Powder Room', 'Hot', 'Party'], description: 'Ambiance mysterieuse, entre inities' },
  'pump':           { label: 'Pump',           color: '#DC2626', tags: ['Hot'],                     description: 'Énergie brute, intensité max' },
  'puppy':          { label: 'Puppy',          color: '#F97316', tags: ['Fetish'],                  description: 'Jeux de rôle canins, tail wags' },
  'reggae':         { label: 'Reggae',         color: '#16A34A', tags: ['Chill', 'Party'],          description: 'Good vibes, rythme lent' },
  'rooftop':        { label: 'Rooftop',        color: '#0EA5E9', tags: ['Chill', 'Party'],          description: 'Vue sur la ville, plans en hauteur' },
  'rush':           { label: 'Rush',           color: '#EF4444', tags: ['Hot', 'Party'],            description: 'Montée d\'adrénaline' },
  'sauna':          { label: 'Sauna',          color: '#EA580C', tags: ['Hot'],                     description: 'Vapeur et chaleur humaine' },
  'secret-garden':  { label: 'Secret Garden',  color: '#10B981', tags: ['Chill'],                   description: 'Un jardin secret pour initiés' },
  'spectrum':       { label: 'Spectrum',       color: '#7C3AED', tags: ['Party'],                   description: 'Toutes les couleurs du désir' },
  'techno':         { label: 'Techno',         color: '#6BA888', tags: ['Techno', 'Party'],         description: 'Beats + plans, combo gagnant' },
  'vinyl':          { label: 'Vinyl',          color: '#374151', tags: ['Chill', 'Party'],          description: 'Son analogique, plaisirs réels' },
}

async function main() {
  const files = readdirSync(COVERS_DIR).filter(f => f.endsWith('.jpg'))
  console.log(`Found ${files.length} covers to upload\n`)

  for (const file of files) {
    const slug = file.replace('.jpg', '')        // e.g. "dark-room"
    const dbSlug = slug.replace(/-/g, '_')       // e.g. "dark_room"
    const storagePath = `covers/${slug}.jpg`
    const filePath = join(COVERS_DIR, file)
    const buffer = readFileSync(filePath)

    // 1. Upload to storage (upsert)
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`✗ Upload ${slug}: ${uploadErr.message}`)
      continue
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)
    const coverUrl = urlData.publicUrl

    // 3. Upsert admin_config row
    const meta = TEMPLATE_META[slug]
    if (!meta) {
      console.warn(`⚠ No metadata for ${slug}, skipping DB update`)
      continue
    }

    const metaJson = {
      cover_url: coverUrl,
      tags: meta.tags,
      color: meta.color,
      description: meta.description,
    }

    const { error: dbErr } = await supabase
      .from('admin_config')
      .upsert({
        type: 'session_template',
        slug: dbSlug,
        label: meta.label,
        category: null,
        sort_order: Object.keys(TEMPLATE_META).indexOf(slug) + 1,
        active: true,
        meta: metaJson,
      }, { onConflict: 'type,slug' })

    if (dbErr) {
      console.error(`✗ DB upsert ${dbSlug}: ${dbErr.message}`)
      continue
    }

    console.log(`✓ ${slug.padEnd(16)} → ${coverUrl}`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
