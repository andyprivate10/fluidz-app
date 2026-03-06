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
6cf4e86 — feat: CandidateProfilePage all eps_json sections in cards; SessionPage Gerer (N en attente); DMPage dates relatives

## CE QUI EST FAIT (Launch 0 + Phase 2)
- Auth magic link + session persistence
- HomePage, SessionsPage, CreateSessionPage (3 etapes: template/details/adresse)
- SessionPage : vue host/candidat, lineup, Partager le lien, Postuler fixe en bas ; bouton Gerer affiche (N en attente) si candidatures pending
- ApplyPage : apercu profil candidat (display_name, bio, role) en haut avant les 3 etapes ; 3 etapes pack/note/done
- HostDashboard : voir candidatures, accepter/rejeter, toggle open/closed, profil candidat
- DMPage : chat realtime, banniere status, adresse si accepted, Voir profil header ; dates relatives sur messages (il y a 2 min, hier, 12h30)
- JoinPage (via invite_code), NotFoundPage, ErrorBoundary
- BottomNav (Home/Sessions/Notifs/Moi) — masquee sur DMPage ; onglet Notifs (cloche) vers /notifications avec badge si non lues ; badge Moi si nouvelle candidature (realtime)
- CandidateProfilePage : toutes les sections eps_json en cards (physique, role, pratiques, sante, limites)
- ProfilePage /profile/:userId (lecture profil public) ; liens depuis lineup SessionPage et noms HostDashboard vers /profile/:userId
- MePage : auth magic link + edition complete profil (basics, role, physique, pratiques, PrEP, limites)
- PWA manifest + OG tags
- user_profiles table + persistence pseudo
- Check-in flow + status candidat
- Ghost flow : postuler sans compte via /join/:code (auth anonyme Supabase + profil « Invité », puis redirect DM)
- Photos profil : MePage upload vers bucket Storage « avatars » (public), affichage sur ProfilePage et lineup SessionPage (cercle 32px)
- Page Notifications /notifications : liste des notifs (table notifications), marquer lu au clic
- Rate limiting ApplyPage : blocage si postulation dans les 5 dernières minutes
- HomePage : si connecté et host d’au moins une session, lien rapide vers la plus récente ; si pas connecté, message de bienvenue Fluidz

## DB SCHEMA
- sessions: id, host_id, title, description, approx_area, exact_address, status, tags (text[]), invite_code (unique), created_at
- applications: id, session_id, applicant_id (FK -> user_profiles.id), status, eps_json, created_at
- user_profiles: id, display_name, profile_json
- messages: id, session_id, sender_id, text, sender_name, created_at
- notifications: id, user_id, session_id, type, message, read, created_at
- Storage: bucket avatars (public), policy upload par user (avatars/{user_id}/*)

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
- /notifications : NotificationsPage (liste notifs, marquer lu)
- /profile/:userId : ProfilePage (lecture profil public)

## DONNEES DE TEST
- Session "Dark Room": id 778fcea6-ca82-41e3-84a6-f59ad5da5764, invite_code qrirmbz4, exact_address "14 rue de la Roquette, code 4521"
- Application Andy: id cb69277d-b33c-4670-9147-ae6587b35fb7, status pending

## POUR REPRENDRE UNE CONVERSATION
1. Dis "Lis STATE.md et reprends"
2. Dev server: npm run dev (localhost:5173)
3. Supabase Management API: voir CLAUDE.md pour tokens

## PROCHAINS CHANTIERS
- (à définir)
