# FLUIDZ — PLAN DE DEVELOPPEMENT COMPLET
## Mis a jour : 19 Mars 2026

---

## PHASE 1-4: DESIGN SYSTEM V1 ✅ DONE
Voir historique dans les transcripts. Tout est applique :
brand.ts, OrbLayer, BottomNav 5 tabs, EventContextNav, Bricolage/Jakarta fonts, blur headers, shimmer CTAs.

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

### P6.4 — Candidate Pack : refonte toggle par bloc ✅ DONE
- [x] ApplyPage body_part_photos inclus via profile_snapshot
- [x] Toggle ON/OFF par bloc avec sub-selection photo par photo
- [x] Preview visuelle des body part photos dans apercu

### P6.5 — CandidateProfilePage : affichage 3 blocs ✅ DONE
- [x] Bloc 1 PROFIL (bio, physique) — label sage
- [x] Bloc 2 ADULTE (body part photos grid, pratiques, limites, sante) — label peach
- [x] Bloc 3 SESSION (message host, occasion note) — label lav
- [x] Cleanup: retire OrbLayer/EventContextNav mal places dans kinks/votes/profil cards

---

## PHASE 7: ADMIN INTERFACE ✅ DONE

### P7.1 — AdminPage route /admin ✅ DONE
- [x] Page accessible uniquement par les admins (is_admin flag sur user_profiles)
- [x] Route /admin dans App.tsx
- [x] Check admin au chargement, page "Acces refuse" si non-admin

### P7.2 — Gestion des kinks ✅ DONE
- [x] Table admin_config avec CRUD complet
- [x] Categories : SM, Pratiques, Fetichisme, Autre
- [x] Chaque kink : slug, label, categorie, sort_order, active
- [x] Seed 9 kinks par defaut

### P7.3 — Gestion des tags sessions ✅ DONE
- [x] Tags par categorie (Vibes, Roles)
- [x] Activation/desactivation toggle
- [x] Ordre d'affichage (move up/down)
- [x] Seed 6 tags par defaut

### P7.4 — Gestion des options profil ✅ DONE
- [x] Liste des morphologies (7 options), roles (4 options)
- [x] Ajout/suppression dynamique
- [x] Vue groupee par categorie pour kinks et tags
- [x] Brancher les formulaires MePage/ApplyPage sur admin_config au lieu des constantes hardcodees

---

## PHASE 8: BOTTOM NAV — SPLIT DISCOVER
### P8.1 — BottomNav 5 tabs ✅ DONE
- [x] Plans (grid) -> /
- [x] Profiles (search) -> /explore
- [x] Chats (message) -> /chats
- [x] Book (contacts) -> /contacts
- [x] Moi (user) -> /me

### P8.2 — Header Profiles avec acces Book ✅ DONE
- [x] Icone Book, Chats, Notifications dans header /explore avec badges unread

---

## PHASE 9: TIMING SESSIONS ✅ DONE
### P9.1 — Schema DB ✅ DONE
- [x] Colonnes starts_at, ends_at (timestamptz), max_capacity (integer) ajoutees

### P9.2 — CreateSessionPage ✅ DONE
- [x] Bouton "Maintenant" / "Plus tard" avec datetime-local picker
- [x] Selecteur duree (1h, 2h, 3h, 4h, 6h, 8h)
- [x] Champ capacite max (optionnel)
- [x] starts_at, ends_at, max_capacity envoyes a la DB

### P9.3 — SessionPage ✅ DONE
- [x] Timer elapsed depuis starts_at (ou created_at fallback)
- [x] Countdown "Xh restant" depuis ends_at avec badge peach
- [x] Badge "Termine" quand ends_at depasse

---

## PHASE 10: DIDACTICIEL / ONBOARDING (app finalisee)
### P10.1 — Onboarding wizard swipable
### P10.2 — Progressive profile completion

---

## PHASE 5 RESTANT: POLISH UX ✅ DONE
### P5.A — ChatsHub ameliorations ✅ DONE
- [x] Badges unread par thread (notification-based)
- [x] Apercu media ([Photo]/[Video] → icone)

### P5.B — Notifications ✅ DONE
- [x] Groupees par jour (Aujourd'hui, Hier, Cette semaine, Plus ancien)
- [x] Mark all read (existait deja)

### P5.C — DM per-candidat ✅ DONE
- [x] Filtrage DM fonctionne via room_type + dm_peer_id (verifie)

---

## NOTES
- Peach = #E0887A (JAMAIS #F07858)
- Font titres = Bricolage Grotesque 800
- ZERO emoji dans UI — SVG icons stroke 1.5px
- npm run build AVANT chaque commit
- Netlify auto-deploy sur push
