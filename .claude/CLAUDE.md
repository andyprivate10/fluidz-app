# FLUIDZ — Project Memory

## Critical Rules (NEVER break these)
- NEVER delete or recreate public/_redirects (root cause of covers bug)
- NEVER filter templates in useCreateSession.ts — ALL admin_config must be available
- NEVER replace /covers/*.svg file paths with inline data URIs
- NEVER add empty [[redirects]] blocks to vercel.json
- NEVER reference alchemy, chemical, chemsex, chem, or drug terms
- NEVER hardcode French strings — ALL text must use i18n t()
- ALL session queries MUST include template_slug in their select
- Use AuthContext useAuth() — do NOT call supabase.auth.getUser() directly

## Stack
React + TypeScript + Vite + Tailwind + Supabase
Hosted on Vercel (auto-deploy from GitHub main)
Repo: andyprivate10/fluidz-app | Supabase: kxbrfjqxufvskcxmliak

## Auth
AuthContext in src/contexts/AuthContext.tsx
Test: marcus/karim/yann @fluidz.test (testpass123) | Marcus is admin

## Session Covers
24 SVGs in public/covers/ | COVER_IMAGES in sessionCover.ts
getSessionCover(tags, coverUrl, templateSlug) — 3 params
vercel.json SPA catch-all MUST be LAST

## Templates (22)
dark_room powder_room techno after artsy basement champagne_bath drag euphoria jacuzzi latex leather nature pump puppy reggae rooftop rush sauna secret_garden spectrum vinyl

## State (25 Mar 2026)
589+ commits | 35 pages | 78 components | 24.6K lines | 0 TS errors
