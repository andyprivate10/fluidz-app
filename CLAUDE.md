# Fluidz - Claude Code Config

## Supabase
- SUPABASE_ACCESS_TOKEN : stocker dans ~/.zshrc ou variable d'env locale (NE PAS committer)
- Project ref: kxbrfjqxufvskcxmliak
- Pour toute migration SQL : SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase db push
- Lier le projet : SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase link --project-ref kxbrfjqxufvskcxmliak

## App
- Dev: localhost:5173
- Netlify: stalwart-lamington-4d8649.netlify.app

## Stack
- React + TypeScript + Vite + Tailwind
- Supabase (auth, db, realtime)
- Inline styles with S = {} color tokens

## DB Column Names
- sessions: id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, created_at
- applications: id, session_id, applicant_id (NOT user_id), status, eps_json, created_at
- user_profiles: id, display_name, profile_json
- messages: id, session_id, sender_id, text, sender_name, created_at
- notifications: id, user_id, session_id, type, message, read, created_at

## Loop / Bridge (CRITIQUE)
Apres chaque batch (apres les git push), appeler le bridge pour signaler la fin :
`curl -s -X POST http://localhost:3333/feedback -H 'Content-Type: application/json' -d '{"done":"RESUME_ICI","commits":"COMMITS_ICI"}'`
- RESUME_ICI = resume court de ce qui a ete fait
- COMMITS_ICI = hash des commits (separes par des virgules)
