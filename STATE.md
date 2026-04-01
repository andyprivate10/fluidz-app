# FLUIDZ — STATE.md
## Derniere mise a jour : 17 Mars 2026 — Session Opus (E2E tests + UX polish + photos)

## OBJECTIF ACTUEL
Launch 0 fonctionnel. Prochaine etape : Phase 2 features ou premier event reel.

## STACK
- React + TypeScript + Vite + Tailwind (inline styles avec S = {} color tokens)
- Supabase : project kxbrfjqxufvskcxmliak (fluidz)
- Vercel : fluidz-app.vercel.app
- Repo : https://github.com/andyprivate10/fluidz-app
- Font : Plus Jakarta Sans (was Inter)

## E2E TESTS — TOUS PASSES (16-17 Mars 2026)
- Seed idempotent
- Candidature (Yann via JoinPage > ApplyPage > candidate pack)
- Acceptation (Marcus accepte > notif + safety tip DM + adresse revelee)
- DM realtime (messages bidirectionnels + safety tip)
- Check-in (candidat request > host confirme > Arrive)
- Ghost (sans compte > pseudo > candidature > badge Ghost cote host)
- Vote consultatif (3+ membres > Yann vote > resultat affiche cote host)

## PHOTOS & VIDEOS (17 Mars 2026)
- MePage : galerie multi-photos + videos (add/remove, set avatar)
- Upload vers Supabase Storage bucket avatars (timestamped filenames)
- profile_json stocke photos[] et videos[] (arrays URLs)
- ApplyPage : sub-selection photo/video (thumbnail grid, tap to toggle)
- CandidateProfilePage : galerie horizontale scrollable depuis eps_json
- PublicProfile : galerie photos/videos avec controls
- Limite : 5 Mo photo, 20 Mo video

## STORIES LAUNCH 0 — 37/38 DONE
Remaining: C4 (1-tap apply)

## PROCHAINS CHANTIERS
- UX/UI refonte complete (passe dediee avec skills UI/UX)
- Phase 2 : Group chat, Ghost>Compte, Story/Play
- Premier event reel 5 personnes
