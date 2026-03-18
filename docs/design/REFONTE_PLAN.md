# FLUIDZ — PLAN REFONTE DESIGN SYSTEM V1
## Fichier de suivi — mis à jour à chaque commit

### STATUT GLOBAL: En cours (18 Mars 2026)
Last commit: 74717df

---

## PHASE 1: FONDATIONS ✅ DONE
- [x] brand.ts — peach #E0887A, fonts Plus Jakarta Sans + Bricolage Grotesque
- [x] index.css — CSS variables, keyframes orbDrift1/2/3, shimmer, blink
- [x] OrbLayer.tsx — 3 orbs peach/lav/sage, blur 60px
- [x] BottomNav.tsx — 4 tabs (Plans/Discover/Book/Moi), SVG icons, 64px, blur
- [x] Google Fonts loaded in index.html
- [x] Design brief saved: docs/design/DESIGN_SYSTEM_V1.md

## PHASE 2: NAV CONTEXTUELLE 🔄 IN PROGRESS
- [x] EventContextNav.tsx — composant créé
- [x] **P2.1** SessionPage — intégrer EventContextNav (role detection done)
- [x] **P2.2** HostDashboard — remplacer le ← Retour par EventContextNav(role=host)
- [x] **P2.3** DMPage — ajouter EventContextNav en haut (quand dans session context)
- [x] **P2.4** GroupChatPage — ajouter EventContextNav
- [x] **P2.5** ApplyPage — ajouter EventContextNav(role=candidate)
- [x] **P2.6** CandidateProfilePage — ajouter EventContextNav(role=host)
- [x] **P2.7** ReviewPage — ajouter EventContextNav
- [x] **P2.8** EditSessionPage — ajouter EventContextNav(role=host)
- [x] **P2.9** BottomNav — s'assurer qu'il se cache sur /session/:id/*

## PHASE 3: REFONTE PAGES PRIORITAIRES
- [ ] **P3.1** SessionPage — hero 330px, story bars, membres avatars ring, CTA fixe shimmer
- [ ] **P3.2** JoinPage — landing recrutement: hero orbs, host row, lieu avec cadenas, CTA fixe blur
- [ ] **P3.3** HostDashboard — event banner compact, cards candidats avec tags/votes
- [ ] **P3.4** HomePage — hero Bricolage, quick nav SVG, shimmer CTA, templates
- [ ] **P3.5** LoginPage — card centré, shimmer CTA, ghost lav
- [ ] **P3.6** ApplyPage — candidate pack toggle flow

## PHASE 4: REFONTE PAGES SECONDAIRES
- [ ] **P4.1** MePage — profil view, VibeScore, sections
- [ ] **P4.2** ExplorePage (Discover) — grille profils, tabs
- [ ] **P4.3** ContactsPage (Book) — liste contacts
- [ ] **P4.4** ChatsHubPage — threads, tabs
- [ ] **P4.5** NotificationsPage — types, icons
- [ ] **P4.6** OnboardingPage — wizard flow
- [ ] **P4.7** PublicProfile — profil lecture
- [ ] **P4.8** ContactDetailPage — fiche contact
- [ ] **P4.9** CandidateProfilePage — profil candidat review

## PHASE 5: POLISH GLOBAL
- [ ] **P5.1** Shimmer animation sur tous les CTA principaux
- [ ] **P5.2** Inputs uniformes: fond bg2, border rule, placeholder tx4
- [ ] **P5.3** Message bubbles: gradient peach mine, bordered bg2 peer
- [ ] **P5.4** Gradient fade 180px sur tous les heroes
- [ ] **P5.5** Supprimer les derniers emoji data-strings (📷🎤🎬 dans labels)
- [ ] **P5.6** Skeleton loaders avec brand tokens
- [ ] **P5.7** Toast component avec brand tokens

---

## NOTES POUR LA PROCHAINE SESSION
- Faire Cmd+Shift+R pour voir les changements (cache browser)
- Vérifier Netlify deploys: app.netlify.com > fluidz-app > Deploys
- Le brief complet est dans docs/design/DESIGN_SYSTEM_V1.md
- brand.ts est la source de vérité pour les couleurs/fonts
- EventContextNav.tsx est créé mais pas encore intégré partout
