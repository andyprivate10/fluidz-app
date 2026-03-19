# FLUIDZ — PLAN DE DEVELOPPEMENT COMPLET
## Mis a jour : 19 Mars 2026

---

## PHASE 1-4: DESIGN SYSTEM V1 ✅ DONE
Voir historique dans les transcripts. Tout est applique :
brand.ts, OrbLayer, BottomNav 4 tabs, EventContextNav, Bricolage/Jakarta fonts, blur headers, shimmer CTAs.

---

## PHASE 6: PROFIL — RESTRUCTURATION COMPLETE ✅ SPRINT 1 DONE

### P6.1 — Architecture profil 3 blocs ✅ DONE
- [x] MePage restructure en 3 onglets (Compte / Profil / Adulte)
- [x] bodyPartPhotos state + sauvegarde dans profile_json.body_part_photos

### P6.2 — MePage : formulaire 3 onglets ✅ DONE
- [x] Tab "Compte" : email, deco, visibilite galerie, notifs, liens rapides
- [x] Tab "Profil" : VibeScore, photos profil, infos (pseudo/bio/age/loc/physique/role)
- [x] Tab "Adulte" : body part photos grid, photos/videos intimes, kinks, sante, limites

### P6.3 — Photos adultes par body part ✅ DONE
- [x] Grid 3x2 : Torse, Bite, Cul, Pieds, Full body, Autre
- [x] Upload direct par zone avec compression
- [x] Affichage dans CandidateProfilePage bloc Adulte

### P6.4 — Candidate Pack : refonte toggle par bloc
- [x] ApplyPage body_part_photos inclus via profile_snapshot
- [ ] Toggle ON/OFF par bloc avec sub-selection photo par photo
- [ ] Preview visuelle des body part photos dans apercu

### P6.5 — CandidateProfilePage : affichage 3 blocs ✅ DONE
- [x] Bloc 1 PROFIL (bio, physique) — label sage
- [x] Bloc 2 ADULTE (body part photos grid, pratiques, limites, sante) — label peach
- [x] Bloc 3 SESSION (message host, occasion note) — label lav
- [x] Cleanup: retire OrbLayer/EventContextNav mal places dans kinks/votes/profil cards

---

## PHASE 7: ADMIN INTERFACE

### P7.1 — AdminPage route /admin
- [ ] Page accessible uniquement par les admins (check user_id dans une table admins ou flag)

### P7.2 — Gestion des kinks
- [ ] Liste de kinks avec CRUD
- [ ] Categories : SM, Pratiques, Roles, Fetichisme, Autre
- [ ] Chaque kink : slug, label, categorie, ordre
- [ ] Stocke dans table profile_options ou admin_config

### P7.3 — Gestion des tags sessions
- [ ] Tags par categorie (Vibes, Roles, Pratiques, Lieu)
- [ ] Activation/desactivation
- [ ] Ordre d'affichage

### P7.4 — Gestion des options profil
- [ ] Liste des morphologies, roles, ethnies
- [ ] Ajout/suppression dynamique
- [ ] Reflected immediatement dans les formulaires

---

## PHASE 8: BOTTOM NAV — SPLIT DISCOVER
### P8.1 — BottomNav 5 tabs
- [ ] Plans (grid) -> /
- [ ] Profiles (users) -> /explore/profiles
- [ ] Chats (message) -> /chats
- [ ] Book (contacts) -> /contacts
- [ ] Moi (user) -> /me

### P8.2 — Header Profiles avec acces Book
- [ ] Icone Book, Chats, Notifications dans header /explore/profiles

---

## PHASE 9: TIMING SESSIONS
### P9.1 — Schema DB (starts_at, ends_at, max_capacity)
### P9.2 — CreateSessionPage (date picker, "Now" button, duree)
### P9.3 — SessionPage (countdown, duree restante)

---

## PHASE 10: DIDACTICIEL / ONBOARDING (app finalisee)
### P10.1 — Onboarding wizard swipable
### P10.2 — Progressive profile completion

---

## PHASE 5 RESTANT: POLISH UX
### P5.A — ChatsHub ameliorations (badges unread, apercu media)
### P5.B — Notifications (badge header, groupees, mark all read)
### P5.C — DM per-candidat (verifier filtrage DM)

---

## NOTES
- Peach = #E0887A (JAMAIS #F07858)
- Font titres = Bricolage Grotesque 800
- ZERO emoji dans UI — SVG icons stroke 1.5px
- npm run build AVANT chaque commit
- Netlify auto-deploy sur push
