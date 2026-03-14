# FLUIDZ — STATE.md
## Derniere mise a jour : 14 Mars 2026 — Session Opus (fixes E2E + features)

## OBJECTIF ACTUEL
Tester les 5 flows E2E (candidature, acceptation, DM, check-in, ghost, vote). Issues GitHub #1-#5.

## STACK
- React + TypeScript + Vite + Tailwind (inline styles avec S = {} color tokens)
- Supabase : project kxbrfjqxufvskcxmliak (fluidz)
- Netlify : fluidz-app.netlify.app
- Repo : https://github.com/andyprivate10/fluidz-app

## URL DE TEST
- Production : https://fluidz-app.netlify.app
- Local : npm run dev -> http://localhost:5173
- Menu dev : /dev/test?dev=1 — seed idempotent, personas avec navigation directe, session ID partageable via URL (?sid=xxx)

## DERNIER COMMIT
a8d1c81 — feat: idempotent seed, safety tip DM, apply pack profile preview

## CE QUI A ETE FAIT DANS CETTE SESSION (14 Mars 2026)

### Fixes critiques
- DevTestMenu: seed appelle vraiment seedAll() (était un fake wait 1s)
- seedTestData: emails corrigées (host@ → marcus@, member@ → karim@, guest@ → yann@)
- seedTestData: seed idempotent (si session testplan1 existe, clean + reuse au lieu de crash duplicate key)
- Yann a maintenant un profil complet (age, bio, role, kinks, PrEP, avatar)
- JoinPage: "Postuler" redirige vers /apply (était un insert direct qui bypassait le candidate pack)
- JoinPage: lineup affiche noms + rôles + avatars squircle (pas juste des cercles empilés)
- Build fix: variables inutilisées (TS6133) corrigées

### Check-in flow corrigé
- SessionPage: check-in = candidat demande (checked_in=true), host doit confirmer (status=checked_in)
- SessionPage: état "⏳ En attente de confirmation du host" après demande
- DMPage: même correction check-in
- HostDashboard: confirmCheckIn set checked_in=true ET status=checked_in
- HostDashboard: bouton "Confirmer" visible quand checked_in=true + status=accepted

### Notifications
- HostDashboard: notification envoyée au candidat quand accepté/rejeté
- HostDashboard: notification envoyée au candidat quand check-in confirmé
- DMPage: sender_name utilise display_name du profil (pas l'email)

### Features
- Safety tip DM automatique quand candidat accepté (message de 🛡️ Fluidz)
- ApplyPage: sections montrent un preview des données réelles du profil (age, rôle, kinks, PrEP)
- ApplyPage: rôle pré-rempli depuis le profil
- DevTestMenu: session ID partageable via URL + bouton "Copier URL dev"
- DevTestMenu: bouton Ghost (sans compte)

### RLS / Supabase
- user_profiles SELECT ouvert à tous les authenticated (needed for lineup)
- notifications INSERT policy pour host → applicant
- applications SELECT pour les membres acceptés (lineup visible)
- applications DELETE policy pour le host
- sessions DELETE policy pour le host

## DB SCHEMA
- sessions: id, host_id, title, description, approx_area, exact_address, status, tags (text[]), invite_code (unique), lineup_json (jsonb), created_at
- applications: id, session_id, applicant_id (FK -> user_profiles.id), status, eps_json, checked_in (boolean), created_at
- user_profiles: id, display_name, profile_json
- messages: id, session_id, sender_id, text, sender_name, created_at
- notifications: id, user_id, session_id, type, message, title, body, href, read_at, created_at
- votes: id, session_id, application_id, voter_id, vote (yes/no), created_at, UNIQUE(application_id, voter_id)
- Storage: bucket avatars (public)

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
- /me : MePage
- /notifications : NotificationsPage
- /profile/:userId : PublicProfile
- /dev/test : DevTestMenu (?dev=1&sid=xxx)

## DONNEES DE TEST
- Comptes : marcus@fluidz.test / karim@fluidz.test / yann@fluidz.test (password: testpass123)
- Session seed: invite_code testplan1, titre "Plan ce soir 🔥"
- Seed idempotent: peut être relancé sans erreur

## PROCHAINS CHANTIERS
- Tester flow E2E complet (issues #1-#5) quand Sidney revient
- Profil sections détaillées (sous-sélection photos/vidéos dans le pack)
- Ghost token flow complet
- Vote consultatif (3+ membres)
