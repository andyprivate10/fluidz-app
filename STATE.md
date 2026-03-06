# FLUIDZ — STATE.md
## Derniere mise a jour : 6 Mars 2026

## OBJECTIF ACTUEL
Phase 2 features en cours. Flow Marcus->Karim valide end-to-end.

## STACK
- React + TypeScript + Vite + Tailwind (inline styles avec S = {} color tokens)
- Supabase : project kxbrfjqxufvskcxmliak (fluidz)
- Netlify : stalwart-lamington-4d8649.netlify.app -> fluidz.app
- Repo : https://github.com/andyprivate10/fluidz-app

## DERNIER COMMIT
5f1be9f — feat: add public ProfilePage at /profile/:userId

## CE QUI EST FAIT (Launch 0 + Phase 2)
- Auth magic link + session persistence
- HomePage, SessionsPage, CreateSessionPage (3 etapes: template/details/adresse)
- SessionPage (vue host + vue candidat + lineup + bouton Partager le lien)
- ApplyPage 3 etapes : basics / physique+role+kinks+PrEP+limites / note session
- HostDashboard : voir candidatures, accepter/rejeter, toggle open/closed, profil candidat
- DMPage : chat realtime, banniere status (pending/rejected), adresse revelee si accepted
- JoinPage (via invite_code), NotFoundPage, ErrorBoundary
- BottomNav (Home/Sessions/Moi) — masquee sur DMPage
- CandidateProfilePage (vue profil candidat depuis HostDashboard)
- ProfilePage /profile/:userId (lecture profil public: bio, physique, role, pratiques, sante, limites)
- MePage : auth magic link + edition complete profil (basics, role, physique, pratiques, PrEP, limites)
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

## ROUTES
- / : HomePage
- /sessions : SessionsPage
- /session/create : CreateSessionPage
- /session/:id : SessionPage
- /session/:id/apply : ApplyPage
- /session/:id/dm : DMPage
- /session/:id/host : HostDashboard
- /session/:id/candidate/:applicantId : CandidateProfilePage
- /join/:code : JoinPage
- /me : MePage (auth + edit profil)
- /profile/:userId : ProfilePage (lecture profil public)

## DONNEES DE TEST
- Session "Dark Room": id 778fcea6-ca82-41e3-84a6-f59ad5da5764, invite_code qrirmbz4, exact_address "14 rue de la Roquette, code 4521"
- Application Andy: id cb69277d-b33c-4670-9147-ae6587b35fb7, status pending

## POUR REPRENDRE UNE CONVERSATION
1. Dis "Lis STATE.md et reprends"
2. Dev server: npm run dev (localhost:5173)
3. Supabase Management API: voir CLAUDE.md pour tokens

## PROCHAINS CHANTIERS
- Ghost flow (postuler sans compte)
- Notifications badge in-app
- Photos profil
- Rate limiting / anti-spam
- Liens vers ProfilePage depuis lineup/candidatures
