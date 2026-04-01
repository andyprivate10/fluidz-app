# FLUIDZ — ÉTAT DES LIEUX COMPLET + ROADMAP ÉTENDUE
## Mis à jour : 17 Mars 2026

---

# A. CE QUI EST FAIT (Launch 0 — 95% complet)

## Epic 1 : Fondations ✅
- [x] F1 — Repo + Vite + TS + Tailwind + Plus Jakarta Sans
- [x] F2 — Supabase client + RLS policies
- [x] F3 — Design tokens (brand.ts centralisé peach raffiné)
- [x] F4 — Router + BottomNav (Lucide icons, safe area iOS, blur)
- [x] F5 — Vercel deploy (auto sur push)

## Epic 2 : Auth + Ghost (partiel) ✅
- [x] A1 — Magic link + OTP email
- [x] A2 — DevTestMenu (personas Marcus/Karim/Yann/Ghost)
- [x] A3 — Auto-create profile on login
- [ ] A4 — Ghost token flow complet (voir section Ghost ci-dessous)

## Epic 3 : Profil modulaire ✅
- [x] P1 — Système sections JSON (profile_json)
- [x] P2 — Basics (pseudo, bio, âge, location)
- [x] P3 — Physique (taille, poids, morphologie)
- [x] P4 — Rôle sexuel (Top/Bottom/Versa/Side)
- [x] P5 — Pratiques/kinks (checklist)
- [x] P6 — Santé/PrEP (statut, dernier test)
- [x] P7 — Limites (texte libre, bordure rouge)
- [x] P8 — Upload photos profil + photos/vidéos adultes (2 albums)
- [x] P9 — Page profil lecture (PublicProfile)
- [x] P10 — Auto-save profil (debounce 1.5s)

## Epic 4 : Session ✅
- [x] S1 — Créer session (titre, description, templates)
- [x] S2 — Tags session (Top, Bottom, Versa, Dark Room, etc.)
- [x] S3 — Adresse approx + adresse exacte masquée
- [x] S4 — Directions step-by-step
- [x] S5 — Sauvegarde adresses réutilisables
- [x] S6 — Lien apply (invite_code)
- [x] S7 — EditSessionPage
- [ ] S8 — Lien invite directe (bypass vote) — NON FAIT
- [ ] S9 — Rôles recherchés/manquants sur la session — NON FAIT

## Epic 5 : Candidature ✅
- [x] C1 — Candidate pack : blocs Profil/Adulte avec toggle
- [x] C2 — Sub-sélection photos/vidéos par album
- [x] C3 — Ghost apply (pseudo + role + occasion uniquement)
- [ ] C4 — 1-tap apply (pas bloquant)

## Epic 6 : Host + Vote ✅
- [x] H1 — Host Dashboard (candidatures, accepter/rejeter)
- [x] H2 — Voir candidate pack (CandidateProfilePage)
- [x] H3 — Accepter/Rejeter + notifications
- [x] H4 — Vote consultatif (3+ membres)
- [x] H5 — Message pré-formaté Grindr/WhatsApp
- [x] H6 — Broadcast per-peer DMs
- [x] H7 — Realtime auto-refresh (candidatures, votes, check-ins)
- [x] H8 — Arrival stats

## Epic 7 : DM + Check-in ✅
- [x] D1 — DM realtime per-candidat (dm_peer_id)
- [x] D2 — Safety tip automatique 🛡️
- [x] D3 — Check-in (candidat demande → host confirme)
- [x] D4 — DM notification au peer
- [x] D5 — Adresse révélée après acceptation (cadenas avant)
- [x] D6 — Host profil affiché (avatar + nom)

## Epic 8 : Group Chat (Phase 2) ✅
- [x] G1 — Chat temps réel pour checked_in uniquement
- [x] G2 — No-history (checked_in_at)
- [x] G3 — Host toggle ON/OFF
- [x] G4 — Liste membres cliquable
- [x] G5 — BottomNav masqué sur /chat

## Epic 9 : Notifications ✅
- [x] N1 — Badge + compteur dans BottomNav
- [x] N2 — NotificationsPage (liste, marquer comme lu)
- [x] N3 — Notifs : candidature acceptée/rejetée, check-in confirmé, nouveau DM

## Epic 10 : UX Polish ✅
- [x] U1 — Font Plus Jakarta Sans
- [x] U2 — Lucide React icons partout
- [x] U3 — Toast system (showToast)
- [x] U4 — Animations fadeIn, slideUp, stagger
- [x] U5 — Safe areas iOS
- [x] U6 — Responsive maxWidth 480
- [x] U7 — 404 page redesignée
- [x] U8 — SessionPage realtime

---

# B. FEATURES MANQUANTES / NOUVELLES — À PLANIFIER

---

## 🔮 EPIC 11 : GHOST PROFILE SYSTEM (Sessions temporaires 24h)

### Concept
Un mec sur Grindr à 22h ne va PAS créer un compte. Il ouvre le lien, il postule en 30s. Mais il doit pouvoir :
- Remplir un profil (pseudo, photos, vidéos, rôle, kinks)
- Postuler avec ce profil
- Communiquer en DM avec le host
- Le tout SANS email, SANS téléphone

### Architecture proposée : Double Code (Code d'accès + PIN)

**Pourquoi double code et pas autre chose ?**
| Option | Avantage | Inconvénient |
|--------|----------|--------------|
| Email OTP | Universel | Friction énorme, spam box |
| SMS OTP | Rapide | Coût, vie privée (numéro) |
| Code unique seul | Zero friction | Pas sécurisé si quelqu'un le voit |
| **Code + PIN** | **Zero friction + sécurisé** | **Doit être mémorisé** |
| OAuth Grindr | Parfait match | API Grindr fermée |

**Flow proposé :**
1. Ghost ouvre le lien → choisit "Sans compte"
2. L'app génère un **Code d'accès** (8 chars, ex: `FLUIDZ-K7M9`) + demande un **PIN 4 chiffres** choisi par le ghost
3. Le ghost note/screenshot son code
4. Il remplit son profil ghost (pseudo, photos, rôle, etc.)
5. Il postule
6. Pour revenir : entre son Code + PIN → retrouve sa session ghost
7. **Après 24h** : pop-up "Convertir en compte" ou données détruites

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| GH1 | Ghost génère Code+PIN au premier accès | P0 |
| GH2 | Ghost remplit profil complet (photos, vidéos, sections) | P0 |
| GH3 | Ghost postule avec candidate pack | P0 |
| GH4 | Ghost DM avec host | P0 |
| GH5 | Ghost retrouve sa session via Code+PIN | P0 |
| GH6 | Expiration 24h avec notification avant | P1 |
| GH7 | Conversion ghost → compte (garde toutes les données) | P1 |
| GH8 | Ghost vote consultatif (si 3+ membres) | P2 |

### DB Schema
```sql
CREATE TABLE ghost_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code text UNIQUE NOT NULL,  -- "FLUIDZ-K7M9"
  pin_hash text NOT NULL,             -- bcrypt du PIN
  profile_json jsonb DEFAULT '{}',
  display_name text DEFAULT 'Ghost',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '24 hours',
  converted_user_id uuid REFERENCES auth.users(id),  -- null until conversion
  is_expired boolean DEFAULT false
);
```

---

## 🗺️ EPIC 12 : GALERIE DE PROFILS / DISCOVERY

### Concept
Comme Grindr : grille de profils autour de moi, triable/filtrable. Mais pas un mode "discover public" — c'est un outil pour le host qui veut voir qui est dans le coin.

### Flow
1. Host (ou membre checked-in) ouvre la galerie
2. Grille de thumbnails (photo profil, pseudo, rôle, distance)
3. Filtres : rôle, âge, kinks, PrEP, distance
4. Tri : distance, dernière activité, match avec la session
5. Tap → profil complet → bouton "Inviter à la session"

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| DI1 | Galerie grille profils (thumbnail, pseudo, rôle) | P1 |
| DI2 | Géolocalisation approximative (opt-in) | P1 |
| DI3 | Filtres (rôle, âge, morphologie, PrEP) | P1 |
| DI4 | Tri (distance, activité, match session) | P2 |
| DI5 | "Inviter à la session" depuis un profil | P1 |
| DI6 | Profil visible/invisible toggle | P2 |
| DI7 | Blocage/masquage profil | P2 |

### DB
```sql
ALTER TABLE user_profiles ADD COLUMN last_active_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN lat double precision;
ALTER TABLE user_profiles ADD COLUMN lng double precision;
ALTER TABLE user_profiles ADD COLUMN discovery_visible boolean DEFAULT true;
```

---

## 🎭 EPIC 13 : RÔLES RECHERCHÉS / MANQUANTS SUR SESSION

### Concept
Le host définit ce qu'il cherche (ex: "2 Tops, 1 Versa"). La session montre en live ce qui est rempli / manquant. Les candidats voient "Recherche : 1 Top" et adaptent leur candidature.

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| RO1 | Host définit slots recherchés (rôle + quantité) | P1 |
| RO2 | Compteur live rempli/manquant sur la session | P1 |
| RO3 | Candidat voit les rôles recherchés | P1 |
| RO4 | Badge "Recherché" sur les candidatures qui matchent | P2 |
| RO5 | Notification "Rôle manquant" quand un slot se libère | P3 |

### DB
```sql
ALTER TABLE sessions ADD COLUMN wanted_roles jsonb;
-- Format: [{"role": "Top", "count": 2}, {"role": "Bottom", "count": 1}]
```

---

## 👥 EPIC 14 : GROUPES / LISTES DE CONTACTS

### Concept
Le host gère ses contacts indépendamment des sessions. Il crée des listes (ex: "Réguliers", "Tops Paris", "Event Juin") et peut inviter toute une liste à une session en 1 tap.

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| GL1 | Créer/modifier/supprimer un groupe | P1 |
| GL2 | Ajouter/retirer des contacts d'un groupe | P1 |
| GL3 | Inviter tout un groupe à une session | P1 |
| GL4 | Voir les groupes depuis le profil d'un contact | P2 |
| GL5 | Groupe partagé (co-gestion avec un autre user) | P3 |
| GL6 | Smart lists (auto-générées : "Vu récemment", "Même event") | P3 |

### DB
```sql
CREATE TABLE contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  emoji text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE contact_group_members (
  group_id uuid NOT NULL REFERENCES contact_groups(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

---

## 📊 EPIC 15 : TRACKING INTERACTIONS + HISTORIQUE RELATION

### Concept
Chaque profil a un historique de toutes les interactions : events partagés, DMs échangés, votes donnés/reçus. Évolution de la relation : inconnu → rencontré → connaissance → contact → ami.

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| TR1 | Historique des events en commun | P1 |
| TR2 | Compteur DMs échangés | P2 |
| TR3 | Historique des votes donnés/reçus | P2 |
| TR4 | Date de première rencontre | P1 |
| TR5 | Notes privées sur un profil | P1 |
| TR6 | Timeline relation (events, DMs, ajout contact) | P2 |

### DB
```sql
CREATE TABLE interaction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,      -- qui regarde
  target_id uuid NOT NULL,     -- qui est regardé
  type text NOT NULL,          -- 'event_shared', 'dm_sent', 'vote_given', 'contact_added'
  session_id uuid,
  created_at timestamptz DEFAULT now()
);
```

---

## 🤝 EPIC 16 : FEATURES SOCIALES — CONTACT BOOK COQUIN

### Concept
**Wording proposé :** "Contacts" (neutre et universel). Pas "ami" (trop social), pas "connaissance" (trop distant). Le contact book est un carnet de rencontres coquines.

**Niveaux de relation :**
| Niveau | Label | Signification |
|--------|-------|---------------|
| 0 | — | Inconnu |
| 1 | **Contact** | Ajouté mutuellement |
| 2 | **Régulier** | 2+ events ensemble |
| 3 | **Favori** | Marqué manuellement ⭐ |
| -1 | **Bloqué** | Invisible mutuellement |

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| SO1 | Ajouter comme Contact (demande mutuelle) | P0 |
| SO2 | Contact Book (grille de contacts, filtrable) | P0 |
| SO3 | Statut relation : Contact / Régulier / Favori / Bloqué | P1 |
| SO4 | Bloquer un profil (invisible mutuellement) | P0 |
| SO5 | "Régulier" auto-badge après 2+ events | P2 |
| SO6 | "Favori" ⭐ toggle manuel | P1 |
| SO7 | Inviter un Contact à une session | P1 |
| SO8 | Voir "contacts en commun" sur un profil | P3 |
| SO9 | DNI (Do Not Invite) — le host marque un profil | P2 |

### DB
```sql
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status text DEFAULT 'pending',  -- pending, accepted, blocked
  level text DEFAULT 'contact',   -- contact, regular, favorite
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
```

---

## 🔒 EPIC 17 : PRIVACY — CONTENU ÉPHÉMÈRE + DESTRUCTION

### Concept
Le contenu sexuel/intime a une durée de vie. Les photos/vidéos partagées en candidature, DM ou group chat sont éphémères.

### Règles
| Contexte | Durée | Vues max | Auto-destruction |
|----------|-------|----------|------------------|
| Photo profil candidature | Durée de la session + 24h | Illimité membres | Oui |
| Photo/vidéo DM host | 24h après envoi | 1 vue (sauf screenshot) | Oui |
| Photo/vidéo Group Chat | Durée session + 24h | Illimité membres | Oui |
| Contenu profil permanent | Pas de limite | — | Non |
| Review photo post-session | 7 jours | Illimité | Oui |

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| PR1 | Média éphémère : durée configurable | P1 |
| PR2 | Compteur de vues sur média | P1 |
| PR3 | Auto-destruction après expiration | P1 |
| PR4 | "Vu 1 fois" badge sur les médias | P2 |
| PR5 | Destruction contenus à la clôture de session (+24h buffer) | P0 |
| PR6 | Screenshot deterrence (notification si screenshot) | P3 |
| PR7 | Watermark invisible sur médias partagés | P3 |

### DB
```sql
CREATE TABLE ephemeral_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  storage_path text NOT NULL,
  context text NOT NULL,       -- 'application', 'dm', 'group_chat', 'review'
  session_id uuid,
  max_views integer,           -- null = illimité
  view_count integer DEFAULT 0,
  expires_at timestamptz,
  destroyed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE media_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES ephemeral_media(id),
  viewer_id uuid NOT NULL,
  viewed_at timestamptz DEFAULT now()
);
```

---

## ⭐ EPIC 18 : REVIEWS POST-SESSION + VIBE SCORE

### Concept
Après une session, les participants laissent un avis anonyme. Le "Vibe Score" est la réputation d'un profil.

### Vibe Score — Critères
| Critère | Poids | Source |
|---------|-------|--------|
| Ponctualité (check-in vs heure prévue) | 15% | Auto (timestamps) |
| Respect des limites | 20% | Review pairs |
| Communication (réactivité DM) | 15% | Auto (temps de réponse) |
| Ambiance / énergie | 20% | Review pairs |
| Confiance (PrEP à jour, profil complet) | 15% | Auto (profil) |
| Retour (revient aux events) | 15% | Auto (historique) |

**Score affiché :** 0-100, avec badge couleur
- 🟢 80-100 : Excellent
- 🟡 60-79 : Bon
- 🟠 40-59 : Moyen
- 🔴 0-39 : À risque

### User Stories
| ID | Story | Priorité |
|----|-------|----------|
| VS1 | Review anonyme post-session (note 1-5 + texte) | P1 |
| VS2 | Review par critère (limites, ambiance, communication) | P2 |
| VS3 | Vibe Score calculé et affiché sur le profil | P1 |
| VS4 | Badge Vibe Score dans le candidate pack | P2 |
| VS5 | Host vibe score séparé (qualité d'organisation) | P2 |
| VS6 | Signalement post-session (incident grave) | P0 |
| VS7 | Période de review : 48h après session fermée | P1 |

### DB
```sql
CREATE TABLE session_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  target_id uuid NOT NULL,     -- reviewed person
  is_host_review boolean DEFAULT false,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  criteria jsonb,              -- {"limits": 4, "vibe": 5, "communication": 3}
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, reviewer_id, target_id)
);

ALTER TABLE user_profiles ADD COLUMN vibe_score integer;
ALTER TABLE user_profiles ADD COLUMN vibe_count integer DEFAULT 0;
```

---

# C. ROADMAP ÉTENDUE — PHASES

## Phase 1 (ACTUEL) : Launch 0 — 95% ✅
Stories restantes : S8 (invite directe), C4 (1-tap apply), A4 (ghost basic)

## Phase 2 (3-4 semaines) : Ghost + Social + Privacy
- **GH1-GH7** : Ghost profile complet (Code+PIN, 24h, conversion)
- **SO1-SO4** : Contact Book + Bloquer
- **PR5** : Destruction contenus post-session
- **RO1-RO3** : Rôles recherchés sur session

## Phase 3 (2-3 semaines) : Discovery + Groupes + Reviews
- **DI1-DI5** : Galerie discovery
- **GL1-GL3** : Groupes/listes de contacts
- **VS1-VS3** : Reviews + Vibe Score
- **TR1-TR5** : Tracking interactions

## Phase 4 (2 semaines) : Privacy avancée + Polish
- **PR1-PR4** : Média éphémère (durée, vues, destruction)
- **SO5-SO9** : Social avancé (régulier auto, favoris, contacts en commun)
- **VS4-VS7** : Vibe Score avancé
- **GL4-GL6** : Smart lists

## Phase 5 (Event 6 Juin) : B2B
- Event 150 personnes
- QR Code + Check-in en masse
- Vestiaire numérique
- Attestation juridique
- Staff/bénévoles

---

# D. COMPTEURS

| Métrique | Valeur |
|----------|--------|
| Stories Launch 0 | 38/40 (95%) |
| Stories Phase 2 | 0/22 |
| Stories Phase 3 | 0/18 |
| Stories Phase 4 | 0/15 |
| Stories Phase 5 | TBD |
| **Total stories identifiées** | **~95** |
| Commits cette session | 14 |
| Tables DB actuelles | 7 |
| Tables DB à ajouter | 6 |
| Routes actuelles | 16 |
