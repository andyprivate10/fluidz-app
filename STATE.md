# FLUIDZ — STATE.md
## Derniere mise a jour : 6 Mars 2026

## OBJECTIF ACTUEL
Flow Marcus->Karim fonctionnel end-to-end. Tester en conditions reelles.

## STACK
- React + TypeScript + Vite + Tailwind (inline styles avec S = {} color tokens)
- Supabase : project kxbrfjqxufvskcxmliak (fluidz)
- Netlify : stalwart-lamington-4d8649.netlify.app -> fluidz.app
- Repo : https://github.com/andyprivate10/fluidz-app

## DERNIER COMMIT
da24143 — feat: sessionpage lineup + checkin flow + status candidat

## CE QUI EST FAIT (Launch 0)
- Auth magic link + session persistence
- HomePage, SessionsPage, CreateSessionPage (3 etapes: template/details/adresse)
- SessionPage (vue host + vue candidat + lineup membres acceptes)
- ApplyPage 3 etapes : basics / physique+role+kinks+PrEP+limites / note session
- HostDashboard : voir candidatures, accepter/rejeter, toggle open/closed, profil candidat
- DMPage : chat realtime, banniere status (pending/rejected), adresse revelee si accepted
- JoinPage (via invite_code), NotFoundPage, ErrorBoundary
- BottomNav (Home/Sessions/Moi) — masquee sur DMPage
- CandidateProfilePage (vue profil candidat depuis HostDashboard)
- PWA manifest + OG tags
- user_profiles table + persistence pseudo
- Check-in flow + status candidat

## DB SCHEMA
- sessions: id, host_id, title, description, approx_area, exact_address, status, tags (text[]), invite_code (unique), created_at
- applications: id, session_id, applicant_id (FK -> user_profiles.id), status, eps_json, created_at
- user_profiles: id, display_name, profile_json
- messages: id, session_id, sender_id, text, sender_name, created_at
- notifications: id, user_id, session_id, type, title, body, read_at, created_at

## RLS POLICIES
- sessions SELECT: tous les authenticated
- sessions INSERT/UPDATE: host_id = auth.uid()
- applications SELECT: applicant_id ou host de la session
- applications INSERT: applicant_id = auth.uid()
- applications UPDATE: host de la session
- user_profiles SELECT: tous les authenticated
- user_profiles INSERT/UPDATE: id = auth.uid()
- messages: session participants

## BUGS FIXES (session 6 mars)
- CreateSessionPage: bouton "Creer" ne faisait rien (colonne tags manquante, erreur avalee)
- ApplyPage/JoinPage: user_id -> applicant_id (colonne DB)
- JoinPage route: /join -> /join/:code
- HostDashboard: navigation profil candidat corrigee
- DMPage: rewrite complet (input toujours visible, bannieres status, adresse revelee)
- BottomNav: masquee sur /dm pour ne pas couvrir l'input chat
- RLS: sessions SELECT ouvert aux authenticated, user_profiles SELECT ouvert
- FK: applications.applicant_id -> user_profiles.id (pour joins PostgREST)

## DONNEES DE TEST
- Session "Dark Room": id 778fcea6-ca82-41e3-84a6-f59ad5da5764, invite_code qrirmbz4, exact_address "14 rue de la Roquette, code 4521"
- Application Andy: id cb69277d-b33c-4670-9147-ae6587b35fb7, status pending

## POUR REPRENDRE UNE CONVERSATION
1. Dis "Lis STATE.md et reprends"
2. Dev server: npm run dev (localhost:5173)
3. Supabase Management API: voir CLAUDE.md pour tokens

## PROCHAINS CHANTIERS (Phase 2)
- ProfilePage complete (lecture du profil public)
- Ghost flow (postuler sans compte)
- Notifications badge in-app
- Photos profil
- Rate limiting / anti-spam
