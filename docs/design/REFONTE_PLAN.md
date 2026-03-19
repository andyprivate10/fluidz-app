# FLUIDZ — PLAN DE DÉVELOPPEMENT COMPLET
## Mis à jour : 19 Mars 2026
## Last commit: 7f07deb

---

## PHASE 1-4: DESIGN SYSTEM V1 ✅ DONE
Voir historique dans les transcripts. Tout est appliqué :
brand.ts, OrbLayer, BottomNav 4 tabs, EventContextNav, Bricolage/Jakarta fonts, blur headers, shimmer CTAs.

---

## PHASE 6: PROFIL — RESTRUCTURATION COMPLÈTE 🔴 PRIORITÉ HAUTE
Sidney demande une refonte des catégories de profil.

### P6.1 — Architecture profil 3 blocs
Structure profile_json dans Supabase :
```
{
  "public": {        // Visible par tous
    display_name, bio, age, location, avatar_url,
    photos_profil: string[],
    role, sub_roles, morphology, height, weight, ethnicity
  },
  "adult": {         // Visible seulement via Candidate Pack
    kinks: string[],
    limits: string,
    photos_intime: { slot: string, url: string }[],  // slots: torse, dos, jambes, sexe, fesses, mains, pieds, autre
    videos_intime: string[]
  },
  "health": {        // Visible seulement via Candidate Pack
    prep_status: "Actif" | "Inactif" | "Non",
    dernier_test: date,
    sero_status: string,
    autres: string    // champ libre pour infos complémentaires
  }
}
```

### P6.2 — MePage : formulaire 3 onglets
- Tab "Public" : basics + photos profil + physique + rôle
- Tab "Adulte" : kinks checklist + limites texte + photos par body part + vidéos
- Tab "Santé" : PrEP + dépistage + sérologie

### P6.3 — Photos adultes par body part
Upload slots prédéfinis (non obligatoires) :
- Torse, Dos, Jambes, Sexe, Fesses, Mains, Pieds, Autre
- Chaque slot = 1 photo optionnelle avec label
- L'utilisateur peut aussi ajouter des photos libres
- Affiché dans le profil comme grille labellisée

### P6.4 — Candidate Pack : refonte toggle par bloc
- Bloc "Public" : toujours partagé (pseudo, bio, age)
- Bloc "Adulte" : toggle ON/OFF avec sub-sélection photo par photo
- Bloc "Santé" : toggle ON/OFF
- Bloc "Note pour cette session" : texte libre

### P6.5 — CandidateProfilePage : affichage 3 blocs
- Section Public en haut (toujours visible)
- Section Adulte (si partagée) avec photos labellisées
- Section Santé (si partagée) avec badges PrEP/test

---

## PHASE 7: ADMIN INTERFACE 🔴 PRIORITÉ HAUTE
Interface admin pour gérer les options dynamiques du profil.

### P7.1 — AdminPage route /admin
Page accessible uniquement par les admins (check user_id dans une table admins ou flag).

### P7.2 — Gestion des kinks
- Liste de kinks avec CRUD
- Catégories : SM, Pratiques, Rôles, Fétichisme, Autre
- Chaque kink : slug, label, emoji optionnel, catégorie, ordre
- Stocké dans table `profile_options` ou `admin_config`

### P7.3 — Gestion des tags sessions
- Tags par catégorie (Vibes, Rôles, Pratiques, Lieu)
- Activation/désactivation
- Ordre d'affichage

### P7.4 — Gestion des options profil
- Liste des morphologies, rôles, ethnies
- Ajout/suppression dynamique
- Reflected immédiatement dans les formulaires

---

## PHASE 8: BOTTOM NAV — SPLIT DISCOVER 🟡 MOYEN
Sidney veut séparer Plans et Profiles en 2 tabs niveau 1.

### P8.1 — BottomNav 5 tabs
```
Plans (grid) → /          # Sessions, home dashboard
Profiles (users) → /explore/profiles  # Grille profils
Chats (message) → /chats  # Hub conversations (existant)
Book (contacts) → /contacts  # Naughty Book
Moi (user) → /me
```
Note: "Book" aussi accessible depuis le header de /explore/profiles

### P8.2 — Header Profiles avec accès Book
Sur /explore/profiles, ajouter en haut à droite :
- Icône Book (contacts)
- Icône Chats (messages)
- Icône Notifications (cloche)

---

## PHASE 9: TIMING SESSIONS 🟡 MOYEN
Ajouter le planning temporel aux sessions.

### P9.1 — Schema DB
```sql
ALTER TABLE sessions ADD COLUMN starts_at timestamptz;
ALTER TABLE sessions ADD COLUMN ends_at timestamptz;
ALTER TABLE sessions ADD COLUMN max_capacity integer;
```

### P9.2 — CreateSessionPage
- Date/heure de début (picker)
- Bouton rapide "Now" (set starts_at = now)
- Durée optionnelle → calcule ends_at
- Max places optionnel (informatif, pas limitant)
- Affiché à côté des rôles recherchés

### P9.3 — SessionPage affichage
- Heure prévue de début
- Heure prévue de fin
- Countdown si pas encore commencé
- Durée restante si en cours
- "Terminée depuis Xmin" si finie

---

## PHASE 10: DIDACTICIEL / ONBOARDING 🔵 LATER (app finalisée)
À faire UNIQUEMENT quand l'app a une version stable.
Sidney m'interrogera sur la séquence.

### P10.1 — Onboarding wizard swipable
- Slides swipables avec barre de progression
- Montrer les features principales de l'app
- Boutons rapides de réponse (pas de texte libre)
- Aider à compléter le profil petit à petit
- Expliquer le VibeScore

### P10.2 — Progressive profile completion
- Après chaque session, proposer de compléter 1 section
- Gamification : VibeScore augmente avec le profil complet
- Badges visuels pour chaque section remplie

---

## PHASE 5 RESTANT: POLISH UX (décisions sessions précédentes)
Items des transcripts pas encore appliqués dans la refonte design :

### P5.A — ChatsHub améliorations
- [ ] Badge unread sur tab Chats dans BottomNav (existait, vérifié cassé par refonte nav)
- [ ] Unread count par thread (point peach sur les conversations non lues)
- [ ] Aperçu dernière photo/audio dans le thread preview

### P5.B — Notifications
- [ ] Badge cloche dans le header des pages principales (pas juste dans /me)
- [ ] Notifications groupées par session
- [ ] Mark all as read

### P5.C — DM per-candidat
- [x] dm_peer_id sur messages (fait dans sessions précédentes)
- [ ] Vérifier que la refonte design n'a pas cassé le filtrage DM

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

### Sprint 1 (maintenant) — Fondations profil
1. P6.1 Architecture profil 3 blocs (schema + migration MePage)
2. P6.2 MePage 3 onglets
3. P6.3 Photos adultes par body part

### Sprint 2 — Admin + Candidate Pack
4. P7.1-P7.4 Admin interface
5. P6.4 Candidate Pack refonte
6. P6.5 CandidateProfilePage 3 blocs

### Sprint 3 — Nav + Timing
7. P8.1 BottomNav 5 tabs
8. P8.2 Header avec accès rapide
9. P9.1-P9.3 Timing sessions

### Sprint 4 — Polish UX
10. P5.A ChatsHub badges
11. P5.B Notifications header
12. P5.C DM vérification

### Sprint 5 (app finalisée)
13. P10 Didacticiel / Onboarding

---

## NOTES
- Le design system V1 est en place (peach #E0887A, Plus Jakarta Sans, Bricolage Grotesque)
- EventContextNav fonctionne sur toutes les pages session
- Référence design : docs/design/DESIGN_SYSTEM_V1.md
- Pas de emoji dans l'UI — SVG icons uniquement
