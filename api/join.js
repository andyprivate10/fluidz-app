// Vercel Serverless Function: Dynamic OG meta tags for /join/:code
// Rewrite: /join/:code → /api/join?code=:code (in vercel.json)
// Returns built index.html with dynamic OG tags injected

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kxbrfjqxufvskcxmliak.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const BASE = 'https://fluidz-app.vercel.app'

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Read the built index.html once at cold start
let indexHtml = ''
try {
  indexHtml = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
} catch {
  try {
    indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8')
  } catch {
    indexHtml = ''
  }
}

export default async function handler(req, res) {
  const code = req.query.code
  if (!code) return res.redirect(302, '/')

  // Fetch session data for OG tags
  let title = 'Fluidz — Organise tes soirées privées'
  let desc = 'Crée une session, partage le lien, les candidats postulent avec leur profil. Tu choisis qui vient.'
  let img = `${BASE}/og.png`

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { data: session } = await supabase
      .from('sessions')
      .select('title, description, approx_area, host_id, cover_url, template_slug')
      .eq('invite_code', code)
      .maybeSingle()

    if (session) {
      if (session.title) title = `${session.title} — Fluidz`
      if (session.description) desc = session.description
      else if (session.approx_area) desc = session.approx_area

      if (session.cover_url) {
        img = session.cover_url
      } else if (session.template_slug) {
        img = `https://kxbrfjqxufvskcxmliak.supabase.co/storage/v1/object/public/templates/covers/${session.template_slug}.jpg`
      }

      if (session.host_id) {
        const { data: h } = await supabase.from('user_profiles').select('display_name').eq('id', session.host_id).maybeSingle()
        if (h?.display_name && !session.description) desc = `Session by ${h.display_name}`
      }
    }
  } catch (e) {
    console.error('OG fetch error:', e)
  }

  // If we have the built index.html, inject dynamic OG tags
  if (indexHtml) {
    const ogUrl = `${BASE}/join/${esc(code)}`
    const html = indexHtml
      .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`)
      .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(img)}" />`)
      .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${ogUrl}" />`)
      .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`)
      .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).send(html)
  }

  // Fallback: redirect to home
  return res.redirect(302, '/')
}
