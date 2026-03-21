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

## PHASE 10: DIDACTICIEL / ONBOARDING ✅ DONE
### P10.1 — Onboarding wizard swipable ✅ DONE
- [x] 3 etapes : basics → role/morpho → photo
- [x] Swipe gauche/droite entre etapes (touch gesture 60px threshold)
- [x] Roles et morphologies depuis admin_config (useAdminConfig hook)
- [x] Progress bar + completeness label

### P10.2 — Progressive profile completion ✅ DONE
- [x] Completeness indicator (Debutant → En route → Presque complet → Complet)
- [x] Skip optionnel sur etape 2

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

## PHASE 11: REAL-TIME + REVIEWS + LANDING ✅ DONE

### P11.1 — Real-time ChatsHub ✅ DONE
- [x] Supabase Realtime subscription sur messages + notifications
- [x] Auto-refresh thread list quand un nouveau message arrive

### P11.2 — Typing Indicator ✅ DONE
- [x] Hook useTypingIndicator (Supabase Realtime Presence API)
- [x] DMPage : "X ecrit..." sous les messages + sendTyping sur input
- [x] DirectDMPage : meme integration
- [x] Auto-stop apres 2s inactivite

### P11.3 — Peer Reviews ✅ DONE
- [x] ReviewPage : section peer reviews sous la review session
- [x] Stars + vibe tags par participant
- [x] Soumission individuelle par participant
- [x] Detection des reviews deja envoyees (peerReviewedIds)
- [x] VibeScore integre automatiquement les peer reviews (target_id query)

### P11.4 — Landing Page amelioree ✅ DONE
- [x] HomePage non-connecte : value prop en 3 etapes (Cree / Partage / Choisis)
- [x] CTAs : Creer session, Se connecter, Mode Ghost

### P11.5 — Emoji cleanup ReviewPage ✅ DONE
- [x] Retire emojis des VIBE_TAGS (Awkward, Hot)

---

## PHASE 12: PUSH + MAP + i18n ✅ DONE

### P12.1 — Push Notifications ✅ DONE
- [x] Service Worker push handler + notificationclick
- [x] usePushNotifications hook (subscribe/unsubscribe/status)
- [x] MePage : toggle push actives/bloquees/activer
- [x] Migration push_subscription (JSONB) sur user_profiles
- [x] VAPID key via VITE_VAPID_PUBLIC_KEY env var

### P12.2 — Map Visualization (Leaflet) ✅ DONE
- [x] MapView component reutilisable (dark tiles, custom pin icons, tooltips)
- [x] ExplorePage : toggle grille/carte avec bouton
- [x] Pins profiles avec avatar + label
- [x] User location marker (point bleu)
- [x] Auto-fit bounds si plusieurs pins

### P12.3 — i18n Multilingue FR/EN ✅ DONE
- [x] react-i18next + i18next installe et configure
- [x] Fichiers de traduction fr.json / en.json (150+ cles)
- [x] BottomNav : labels traduits
- [x] HomePage : toutes les strings traduites (landing, CTAs, sections)
- [x] MePage : switcher Francais/English dans settings
- [x] Initialisation auto selon navigateur (fallback FR)
- [x] Persistance choix langue dans localStorage

---

## PHASE 13: PUSH BACKEND + i18n COMPLETE ✅ DONE

### P13.1 — Supabase Edge Function send-push ✅ DONE
- [x] supabase/functions/send-push/index.ts (Deno Edge Function)
- [x] Lit push_subscription depuis user_profiles
- [x] Envoie via Web Push API avec VAPID

### P13.2 — Push sender integration ✅ DONE
- [x] src/lib/pushSender.ts — helper sendPushToUser()
- [x] DMPage : push on new DM message
- [x] DirectDMPage : push on new direct DM
- [x] HostDashboard : push on accept/reject decision
- [x] ApplyPage : push to host on new application

### P13.3 — i18n complete (250+ cles, 29 fichiers) ✅ DONE
- [x] Toutes les 27 pages + BottomNav wirées avec useTranslation()
- [x] fr.json + en.json : 250+ cles dans 12+ namespaces
- [x] Switcher FR/EN dans MePage
- [x] Detection auto langue navigateur

---

## PHASE 14: MVP FUNCTIONAL GAPS ✅ DONE

### P14.1 — Auto-end sessions ✅ DONE
- [x] Migration auto_end_expired_sessions() RPC function
- [x] SessionPage : auto-transition open → ended quand ends_at depasse
- [x] Transparent pour le user (check au chargement)

### P14.2 — Map sur SessionPage ✅ DONE
- [x] MapView integre dans SessionPage pour membres accepted + checked_in
- [x] Affiche le pin session quand approx_lat/approx_lng disponibles
- [x] 2 blocs : accepted et checked_in voient la carte

### P14.3 — PWA Install Prompt ✅ DONE
- [x] InstallPrompt component (beforeinstallprompt API)
- [x] Banner en bas avec bouton Installer
- [x] Dismiss persiste dans localStorage
- [x] Integre dans App.tsx

### P14.4 — Group Invite to Session ✅ DONE
- [x] CreateSessionPage : charge les groupes du user apres creation
- [x] Bouton "Inviter un groupe" envoie notification a tous les membres
- [x] Feedback "Invite envoye" par groupe
- [x] Notification type session_invite avec lien vers /join/

---

## NOTES
- Peach = #E0887A (JAMAIS #F07858)
- Font titres = Bricolage Grotesque 800
- ZERO emoji dans UI — SVG icons stroke 1.5px
- npm run build AVANT chaque commit
- Netlify auto-deploy sur push

---

## BACKLOG — FUTURES FEATURES (NON PRIORISÉES)

### B1 — Paiements entre membres (Remboursement de frais)
**Phase 1 : Simple (QR codes + liens)**
- Chaque user peut ajouter ses infos de paiement dans son profil : QR code Revolut, lien Wise, IBAN
- Après une session, le host peut créer un "split" : montant total + description (location, boissons, etc.)
- Le split calcule automatiquement le montant par personne
- Chaque membre voit le montant dû + le QR code / lien du host pour payer
- Statut de paiement : en attente / payé (toggle manuel par le host)
- Historique des splits par session

**Phase 2 : Paiement in-app avec escrow**
- Session payante : le host fixe un prix d'entrée lors de la création
- Les candidats paient au moment de l'acceptation (avant de recevoir l'adresse)
- Escrow : l'argent est bloqué jusqu'à la fin de la session
- Remboursement automatique si le host annule ou si le candidat est rejeté
- Commission Fluidz : X% sur chaque transaction
- Intégration Stripe Connect pour les payouts

### B2 — Vestiaire numérique (Event B2B)
- Ticket numérique QR code
- Scan dépôt / retrait
- Dashboard vestiaire pour le staff

### B3 — Emergency / Sécurité
- Bouton panique discret
- Broadcast urgence à tous les membres
- Alerte staff en temps réel

### B4 — Discovery / Feed
- Sessions publiques découvrables par localisation
- Feed d'activité (qui a rejoint quoi)
- Recommandations basées sur les préférences

### B5 — Monetisation avancée
- Plans premium (host pro, profil vérifié)
- Tipping entre membres
- Tickets payants pour events B2B
