# FLUIDZ — PLAN REFONTE DESIGN SYSTEM V1
## Fichier de suivi — mis a jour a chaque commit

### STATUT GLOBAL: Sprint 1 en cours (19 Mars 2026)
Last commit: en cours

---

## PHASE 1: FONDATIONS ✅ DONE
- [x] brand.ts — peach #E0887A, fonts Plus Jakarta Sans + Bricolage Grotesque
- [x] index.css — CSS variables, keyframes orbDrift1/2/3, shimmer, blink
- [x] OrbLayer.tsx — 3 orbs peach/lav/sage, blur 60px
- [x] BottomNav.tsx — 4 tabs (Plans/Discover/Book/Moi), SVG icons, 64px, blur
- [x] Google Fonts loaded in index.html
- [x] Design brief saved: docs/design/DESIGN_SYSTEM_V1.md

## PHASE 2: NAV CONTEXTUELLE ✅ DONE
- [x] EventContextNav.tsx — composant cree
- [x] **P2.1** SessionPage — integrer EventContextNav (role detection done)
- [x] **P2.2** HostDashboard — remplacer le Retour par EventContextNav(role=host)
- [x] **P2.3** DMPage — ajouter EventContextNav en haut (quand dans session context)
- [x] **P2.4** GroupChatPage — ajouter EventContextNav
- [x] **P2.5** ApplyPage — ajouter EventContextNav(role=candidate)
- [x] **P2.6** CandidateProfilePage — ajouter EventContextNav(role=host)
- [x] **P2.7** ReviewPage — ajouter EventContextNav
- [x] **P2.8** EditSessionPage — ajouter EventContextNav(role=host)
- [x] **P2.9** BottomNav — se cache sur /session/:id/*

## PHASE 3-5: REFONTE PAGES (backlog)
- [ ] **P3.1** SessionPage — hero 330px, story bars, membres avatars ring, CTA fixe shimmer
- [ ] **P3.2** JoinPage — landing recrutement
- [ ] **P3.3** HostDashboard — event banner compact, cards candidats
- [ ] **P3.4** HomePage — hero Bricolage, quick nav SVG, shimmer CTA
- [ ] **P3.5** LoginPage — card centre, shimmer CTA
- [ ] **P3.6** ApplyPage — candidate pack toggle flow
- [ ] **P4.x** Pages secondaires (MePage, Explore, Contacts, etc.)
- [ ] **P5.x** Polish global (shimmer, inputs, bubbles, gradients)

---

## SPRINT 1 — PHASE 6: RESTRUCTURATION PROFIL

### P6.1 MePage 3 onglets ✅ DONE
- [x] Onglet Compte (ex-Auth) — email, deco, visibilite, notifs, liens
- [x] Onglet Profil — VibeScore, photos profil, infos (pseudo/bio/age/loc/physique/role)
- [x] Onglet Adulte — body part photos grid, photos/videos intimes, kinks, sante, limites

### P6.2 Body Part Photos Grid ✅ DONE
- [x] State bodyPartPhotos: Record<string, string> dans MePage
- [x] BODY_PARTS constant: torse, bite, cul, pieds, full body, autre
- [x] Grid 3x2 avec upload direct par zone
- [x] Sauvegarde auto dans profile_json.body_part_photos
- [x] Chargement depuis loadProfile

### P6.3 Cleanup OrbLayer/EventContextNav mal places ✅ DONE
- [x] Retire OrbLayer du card kinks dans CandidateProfilePage
- [x] Retire EventContextNav du card kinks dans CandidateProfilePage
- [x] Retire OrbLayer du bloc profil dans ApplyPage
- [x] Retire OrbLayer du card votes dans HostDashboard
- [x] Supprime imports inutilises (OrbLayer, EventContextNav)

### P6.4 Candidate Pack refonte
- [x] ApplyPage — body_part_photos inclus dans eps_json (deja via profile_snapshot)
- [ ] ApplyPage — toggle pour inclure/exclure body part photos
- [ ] ApplyPage — preview visuelle des body part photos dans apercu

### P6.5 CandidateProfilePage 3 blocs ✅ DONE
- [x] Bloc 1: PROFIL (bio, physique) — label sage
- [x] Bloc 2: ADULTE (body part photos, pratiques, limites, sante) — label peach
- [x] Bloc 3: SESSION (message host, occasion note) — label lav
- [x] Affichage body_part_photos grid dans bloc Adulte

---

## SPRINT 2 — PHASE 7: ADMIN INTERFACE (TODO)

### P7.1 HostDashboard refonte
- [ ] Header compact avec banner session
- [ ] Cards candidats redesign: photo + role + tags + votes inline
- [ ] Quick actions: accept/reject swipe ou buttons
- [ ] Filtres par role, status

### P7.2 Session management
- [ ] Timeline view des candidatures
- [ ] Broadcast amliore avec templates
- [ ] Stats en temps reel (arrivals, no-shows)

### P7.3 Host tools
- [ ] Check-in QR code
- [ ] Lineup builder (drag & drop roles)
- [ ] Post-session review dashboard

---

## NOTES
- Peach = #E0887A (JAMAIS #F07858)
- Font titres = Bricolage Grotesque 800
- ZERO emoji dans UI — SVG icons stroke 1.5px
- npm run build AVANT chaque commit
- Netlify auto-deploy sur push
