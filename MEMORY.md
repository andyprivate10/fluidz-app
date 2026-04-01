# Fluidz Project Memory

## Stack
React + TypeScript + Vite + Tailwind + Supabase, hosted on Vercel

## Key files
- src/lib/sessionCover.ts — cover system
- src/contexts/AuthContext.tsx — shared auth
- vercel.json — routing (NO _redirects file!)
- public/covers/*.svg — 24 template covers

## Rules
- NEVER create public/_redirects
- NEVER filter templates in useCreateSession
- ALL session queries must include template_slug
- Use useAuth() context, not supabase.auth.getUser()
- 0 hardcoded French outside i18n
- 0 chem/drug references

## Test accounts
marcus/karim/yann @fluidz.test — testpass123

## Supabase
Project ref: kxbrfjqxufvskcxmliak
