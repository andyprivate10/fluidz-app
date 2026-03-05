# FLUIDZ — STATE.md
## Dernière mise à jour : 5 Mars 2026

## OBJECTIF ACTUEL
Finir Launch 0 MVP et tester le flow complet Marcus→Karim en conditions réelles.

## STACK
- React + TypeScript + Vite + Tailwind
- Supabase : project kxbrfjqxufvskcxmliak (fluidz)
- Netlify : stalwart-lamington-4d8649.netlify.app → fluidz.app
- Bridge local : node /tmp/fluidz-bridge.mjs sur port 3333
- Repo : https://github.com/andyprivate10/fluidz-app

## DERNIER COMMIT
3a9378a — feat: applypage complet rôle+physique+kinks+prep+limites

## CE QUI EST FAIT (Launch 0)
- Auth magic link + session persistence
- HomePage, SessionsPage, CreateSessionPage
- SessionPage (vue host + vue candidat)
- ApplyPage 3 étapes : basics / physique+rôle+kinks+PrEP+limites / note session
- HostDashboard : voir candidatures, accepter/rejeter, ouvrir session, partager lien
- DMPage : chat realtime, adresse révélée si accepté
- JoinPage, NotFoundPage, ErrorBoundary
- BottomNav (Home/Sessions/Moi)
- PWA manifest + OG tags
- user_profiles table + persistence pseudo
- RLS complet : applications UPDATE par host, notifications trigger
- Build 0 erreur, pushé, Netlify auto-deploy

## PROCHAINE ACTION
Tester le flow complet end-to-end :
1. Créer une session en tant que Marcus
2. Postuler en tant que Karim (via lien)
3. Marcus accepte dans HostDashboard
4. Karim voit l'adresse dans DMPage

## BLOCAGES CONNUS
- Bridge doit être relancé si Mac redémarre : node /tmp/fluidz-bridge.mjs
- Supabase anon key dans .env (pas exposée)

## POUR REPRENDRE UNE CONVERSATION
1. Colle ce fichier ou dis "Lis STATE.md et reprends"
2. Bridge : node /tmp/fluidz-bridge.mjs (si pas déjà actif)
3. Je prends le contrôle total via Chrome

## PROCHAINS CHANTIERS (Phase 2)
- ProfilePage complète (lecture du profil)
- Lineup visible sur SessionPage (membres acceptés)
- Check-in flow (bouton "Je suis là" + confirmation host)
- Ghost flow (postuler sans compte)
- Notifications badge in-app
