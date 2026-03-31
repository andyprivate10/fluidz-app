# FLUIDZ — COMPLETE UX SPEC (from user testing 31 Mars)
# All decisions locked. Execute everything.

## ═══ 1. SESSION STORY ═══
- Content: ONLY photos/videos from Candidate Packs of ACCEPTED members
- Visibility: Invited candidates see it auto. Non-invited candidates need host authorization (from DM)
- Persistence: Disappears when session closes
- UI: Gallery/carousel view accessible from session detail page

## ═══ 2. SESSION LIFECYCLE ═══
- Session has an END TIME set by host (editable anytime to extend)
- 30min before end: notification to host → "Prolonger" or "Terminer"
- No host action → session auto-closes at end time
- 15min after close → review notification sent to all checked-in members
- Review is OPTIONAL — notification reminder but not blocking

## ═══ 3. VOTE SYSTEM ═══
- Candidate NEVER sees individual votes — only final host decision
- Host sees votes in REAL-TIME as they come in
- If host accepts against majority negative → visual warning but host can override
- Vote is consultative, host has final word

## ═══ 4. NAUGHTYBOOK ═══
- Flat list (no categories/levels) — filterable by attributes/intents/distance
- Private notes: free text visible only to owner
- Shows: history of shared sessions + date of last exchange/session
- Bidirectional: request → accept → mutual (both added to each other's NB)
- Reject: silent (no notification to requester), cooldown before re-request
- Remove: unilateral, other loses NB-only section access

## ═══ 5. CANDIDATURE TIMELINE ═══
- Candidate can WITHDRAW with 10min cooldown before re-applying
- Rejection: soft notification (not "rejected" — gentler wording) + optional host message
- Host can EJECT accepted member at any moment (before AND after check-in)

## ═══ 6. NOTIFICATIONS ═══
### Events that trigger in-app notification:
- New application received (host)
- Application accepted/refused (candidate)
- New DM message
- NaughtyBook request received
- NaughtyBook accepted
- Session starts in 30min
- Someone checked in (HOST ONLY — for confirmation)
### NOT notified: individual votes
### Grouping: Mix — DMs individual, applications grouped
### Badge: Chats icon + bell icon in header

## ═══ 7. EDGE CASES ═══
- Incomplete profile CAN apply but with encouragement to complete
- No limit on simultaneous applications
- No limit on host active sessions (with warning if many)

## ═══ 8. SIGNUP WIZARD (5 steps) ═══
### Minimum required: Pseudo only (rest encouraged but not blocking)
### Format: Full-page screens in sequence with Suivant button
### Progress: 4-5 dots bar at top
### Skip: "Passer" button top-right on every step (except pseudo)
### Steps:
1. **Pseudo + Photo** — display_name required, photo encouraged
2. **Physique** — age, height, weight, morphology (pills), ethnicities (multi-select)
3. **Rôle + Kinks** — role selector, kinks checklist (unlimited)
4. **Santé** — PrEP, dernier test, pathologies
5. **Qui peut te contacter ?** — DM privacy: open / sur demande / fermé

## ═══ 9. WELCOME TUTORIAL (post-wizard) ═══
### 3-4 illustrated carousel screens before landing on Home:
1. "Crée une session ou rejoins-en une" — session flow overview
2. "Ton profil, tes règles" — visibility controls + sections
3. "Le NaughtyBook" — bidirectional contacts explained
4. "Prêt ?" — CTA to Home
### Coach marks: Tooltips on first visit of each page (key elements)
### Profile completion: Pastille on Menu/Profile icon until complete

## ═══ 10. "TU M'INTÉRESSES" FLOW ═══
- Click "Tu m'intéresses" on unknown profile
- Popup: select sections to share (like Candidate Pack)
- RULE: if adult content selected → must have 1+ adult photo + 1+ profile photo
- Chat thread created IMMEDIATELY
- System message shows shared profile sections
- Receiver gets notification
- Receiver sees chat but CANNOT reply until they "unlock"
- Receiver can: view profile, unlock (accept DM), ignore, block

## ═══ 11. DM PRIVACY LEVELS ═══
- open: anyone can DM directly
- request: "Tu m'intéresses" required (chat locked until unlock)
- closed: no DM outside session/NaughtyBook
- NaughtyBook mutual: always free DM (bypasses setting)

## ═══ SEED DATA REQUIREMENTS ═══
### Create complete test scenarios:
- Marcus (host) with 2 open sessions, 1 ended
- Karim applied to Marcus session, accepted, checked in
- Yann applied to Marcus session, pending vote
- 3 demo profiles applied to sessions in various states
- NaughtyBook: Marcus ↔ Karim mutual, Yann pending request to Marcus
- DMs between Marcus-Karim (5+ messages), Marcus-Yann (locked)
- Reviews from ended session
- Notifications for each type

## ═══ EXECUTION ORDER ═══
1. Write wizard pages (OnboardingWizard.tsx, 5 steps)
2. Write welcome tutorial (WelcomeTutorial.tsx, carousel)
3. Add coach marks system (useCoachMarks hook + TooltipOverlay)
4. Profile completion badge on Menu
5. Session end time + auto-close + 30min warning
6. Review flow (15min after close, optional)
7. Session Story (gallery from accepted packs)
8. Vote real-time + warning on override
9. Soft rejection notification + host message
10. Candidature withdrawal + cooldown
11. Seed ALL test scenarios
12. Build 0 errors, push after each major feature

## ═══ 12. GROUP CANDIDATURE ═══
- Requirement: ALL members must be MUTUAL in each other's NaughtyBook
- Formation: During apply flow, step "Ajouter des partenaires" before sending
  - User sees list of mutual NB contacts, selects who to invite
  - Each invited member gets notification to confirm + select their own Candidate Pack
  - Candidature only sent when ALL members have confirmed
- Host view: Single candidature card with profiles side by side
  - Accept or refuse the GROUP as a whole (not individual)
  - All Candidate Packs visible in the group card
- Ejection: Host can eject individual member → others stay
- Size: No limit (as many as NB allows)
- Withdrawal: If one member withdraws, others are notified and can choose to continue or withdraw too

## ═══ UPDATED SEED DATA ═══
### Full test scenarios needed:
- Marcus (host): 2 open sessions (1 with end_time in 2h, 1 ended)
- Karim: applied to session 1, ACCEPTED, checked in
- Yann: applied to session 1, PENDING vote (2 members voted yes, waiting)
- Demo profile "Alex": applied to session 1, REJECTED
- Demo profile "Romain": applied as GROUP with "Samir" to session 1, PENDING
- NaughtyBook: Marcus ↔ Karim MUTUAL, Yann pending request to Marcus
- DMs: Marcus↔Karim 5+ messages, Marcus↔Yann locked (interest sent, not unlocked)
- Reviews: 1 ended session with reviews from Marcus + Karim
- Notifications: 1 of each type for Marcus
- Session Story: session 1 has packs from Karim (accepted member)

## ═══ EXECUTION ORDER (FULL) ═══
### Wave 1: Onboarding (can run in parallel)
1. OnboardingWizard.tsx (5 steps: Pseudo+Photo, Physique, Rôle+Kinks, Santé, DM Privacy)
2. WelcomeTutorial.tsx (4-screen carousel)
3. useCoachMarks.ts hook + TooltipOverlay component
4. Profile completion badge on Menu icon

### Wave 2: Session lifecycle
5. Session end_time field + UI for host to set/extend
6. 30min warning notification to host (prolonger/terminer)
7. Auto-close at end_time if no host action
8. Review flow 15min after close (ReviewPage already exists, wire timing)

### Wave 3: Session Story
9. Session Story gallery (accepted member packs aggregated)
10. Story visibility: auto for invited, host-authorized for non-invited
11. Story disappears on session close

### Wave 4: Vote & Candidature
12. Real-time vote tally for host
13. Warning overlay when accepting against majority
14. Soft rejection notification wording
15. Host optional message on rejection
16. Candidature withdrawal with 10min cooldown
17. Host eject member at any time

### Wave 5: Group candidature
18. "Ajouter des partenaires" step in apply flow
19. NB mutual check for group eligibility
20. Individual pack confirmation per member
21. Group card display for host
22. Accept/refuse group as whole
23. Individual ejection from group

### Wave 6: Social polish
24. "Tu m'intéresses" locked chat flow complete
25. NaughtyBook bidirectional complete (request/accept/reject/remove)
26. NaughtyBook filters (attributes, intents, distance)
27. NaughtyBook notes + session history
28. DM privacy enforcement across all flows

### Wave 7: Notifications
29. Bell icon in header with unread count
30. Notification grouping (DM individual, candidatures grouped)
31. All notification types wired
32. Check-in notification to host only

### Wave 8: Seed everything
33. Complete seed script covering ALL states
34. Build 0 errors, push


## ═══ 13. SÉCURITÉ & MODÉRATION ═══
- Signalement: bouton "Signaler" sur chaque profil + capture d'écran auto du profil/chat
  - Raisons prédéfinies: Faux profil, Comportement inapproprié, Harcèlement, Contenu illégal, Autre
  - Envoyé à file admin avec screenshot auto
- Bouton panique en session live: discret, alerte host + staff immédiatement
  - Pas visible en mode normal, accessible via menu ⋮ ou long press
- Blocage: invisible mutuellement PARTOUT + éjecté des sessions communes
  - Bloqué ne voit plus le bloqueur nulle part (explore, sessions, search)
  - Si dans une session commune → éjecté silencieusement

## ═══ 14. MÉDIAS ═══
- Formats acceptés: Photos (jpg/png/webp) + vidéos courtes (mp4, max 30s)
- Compression côté client avant upload (quality 80%, max 1920px)
- Limite: 10 photos profil, 6 photos intimes (1 par body zone), 3 vidéos

## ═══ 15. DEEP LINKS & PREVIEW ═══
- Lien de session partagé = preview OG riche (titre + cover + host name)
- OG image = cover de la session ou template cover
- URL format: fluidz-app.vercel.app/join/:code
- Meta tags dynamiques par session (title, description, image)

## ═══ 16. TEMPLATES HOST ═══
- Host peut sauvegarder une session terminée comme template personnalisé
- Template = titre, description, tags, adresse, timing, rules — réutilisable
- Templates prédéfinis restent (Dark Room, Cuddle, etc.)
- Templates perso visibles dans "Mes Templates" (menu)

## ═══ 17. STATS & RÉPUTATION ═══
- Host stats MVP: juste nombre de sessions créées (pas de dashboard)
- Réputation host visible par candidats: nombre sessions hostées + note moyenne reviews
- Badge host affiché sur profil si 3+ sessions hostées

## ═══ 18. ONBOARDING WIZARD (5 étapes) ═══
### Flow post-signup:
1. Pseudo + Photo (pseudo required, photo encouraged, skip available)
2. Physique (age, height, weight, morphology pills, ethnicities multi-select)
3. Rôle + Kinks (role selector, kinks unlimited checklist)
4. Santé (PrEP, dernier test, pathologies list)
5. Qui peut te contacter? (DM privacy: open / sur demande / fermé)
### UX:
- Full-page screens with Suivant button
- 5 dots progress bar at top
- Skip "Passer" top-right on every step (except pseudo)
- Auto-save each step to profile_json
- Redirect to WelcomeTutorial after last step

## ═══ 19. WELCOME TUTORIAL (post-wizard) ═══
### 4 illustrated carousel screens:
1. "Crée ou rejoins une session" — session flow overview with illustration
2. "Ton profil, tes règles" — visibility controls + what others see
3. "Le NaughtyBook" — bidirectional contacts + mutual benefits
4. "C'est parti!" — CTA button → Home
### UX:
- Swipeable carousel with dots indicator
- Skip button available
- Shown only once (flag in profile_json: onboarding_complete)

## ═══ 20. COACH MARKS ═══
- Tooltips on first visit of key pages:
  - Home: "Crée ta première session" pointing at CTA
  - Explore: "Découvre les profils autour de toi" pointing at grid
  - NaughtyBook: "Ajoute tes contacts pour voir plus" on first empty visit
  - Session detail: "Vote sur les candidats" pointing at vote cards
- Flag per tooltip in localStorage (seen_tooltip_home, etc.)
- Dismiss on tap anywhere
- Profile completion pastille on Menu icon until 80%+ complete

## ═══ UPDATED EXECUTION ORDER ═══
### Wave 1: Onboarding
1. OnboardingWizard.tsx (5 full-page steps)
2. WelcomeTutorial.tsx (4-screen carousel)
3. useCoachMarks.ts hook + TooltipOverlay component
4. Profile completion badge on Menu icon
5. Route guards: new user → wizard → tutorial → home

### Wave 2: Session lifecycle complete
6. end_time field + extend UI
7. 30min warning notification
8. Auto-close logic
9. Review trigger 15min after close

### Wave 3: Session Story + Vote
10. Story gallery from accepted packs
11. Story visibility control (host authorizes for non-invited)
12. Vote real-time tally for host
13. Warning on override against majority

### Wave 4: Candidature complete
14. Withdrawal + 10min cooldown
15. Soft rejection + host message
16. Group candidature (add partners step)
17. Group NB mutual check
18. Individual pack confirmation
19. Group card for host (accept/refuse whole)

### Wave 5: Social
20. "Tu m'intéresses" complete flow
21. NaughtyBook bidirectional complete
22. NaughtyBook filters + notes + history
23. DM privacy enforcement

### Wave 6: Safety
24. Report button + screenshot
25. Panic button in session
26. Block = invisible + eject

### Wave 7: Polish
27. Host reputation badge
28. Deep link OG preview
29. Custom templates save
30. Notifications bell + grouping
31. Media format validation

### Wave 8: Seed + Test
32. Complete seed: all states, all scenarios
33. Build 0 errors
34. Push


## ═══ 21. STORY IMMERSIVE ═══
- Format: Instagram Stories plein écran (full-viewport)
- Photo/vidéo en background, texte overlay en bas avec gradient sombre
- Overlay info: Pseudo + rôle + âge (gradient noir 50% en bas)
- Slides par membre: AUTO — autant de slides que de photos dans le Candidate Pack du membre
- Navigation: swipe gauche/droite pour changer de membre, tap pour slide suivante
- Barre de progression en haut (segments par membre, dots par slide)
- Bouton close (X) en haut à droite

## ═══ 22. STATUT EN LIGNE ═══
- Pastille verte sur avatar si en ligne (actif dans les 5 dernières minutes)
- Grisé + "il y a Xh" ou "il y a Xj" si hors ligne
- Visible partout: Explore cards, NaughtyBook, profil, session participants
- Stocké via last_seen_at dans user_profiles (updated on auth state change + heartbeat)

## ═══ 23. CHAT RICHE ═══
- Texte: messages classiques
- Réactions emoji: tap long sur un message → picker (pouce, feu, coeur, aubergine, splash, rire)
- Envoi photos/vidéos: bouton appareil photo dans le chat input bar
  - Photos: jpg/png/webp, compressées côté client
  - Vidéos: mp4, max 30s, compressées
  - Preview thumbnail avant envoi
  - S'affiche comme bulle media dans le chat
- Reply: swipe droit sur un message pour répondre (quote)

## ═══ FINAL EXECUTION WAVES ═══

### Wave 1: Onboarding (PRIORITY)
1. OnboardingWizard.tsx (5 steps)
2. WelcomeTutorial.tsx (4 carousel screens)
3. useCoachMarks hook + TooltipOverlay
4. Profile completion badge
5. Route guards (new user → wizard → tutorial → home)

### Wave 2: Story immersive
6. SessionStory.tsx — fullscreen Instagram-style viewer
7. Story data aggregation from accepted member packs
8. Overlay: pseudo + rôle + âge + gradient sombre
9. Navigation: swipe between members, tap for next slide
10. Story access control (invited auto, non-invited host-authorized)

### Wave 3: Session lifecycle
11. end_time + extend UI
12. 30min warning to host
13. Auto-close
14. Review 15min after close

### Wave 4: Vote & candidature complete
15. Real-time vote tally for host
16. Warning on majority override
17. Soft rejection + host message
18. Withdrawal + 10min cooldown
19. Group candidature (add partners, NB mutual check, individual packs)

### Wave 5: Chat riche
20. Reactions emoji on messages (long press)
21. Photo/video send in chat
22. Reply/quote (swipe right)
23. Media preview before send

### Wave 6: Social complete
24. "Tu m'intéresses" locked chat flow
25. NaughtyBook bidirectional complete
26. NaughtyBook filters + notes + session history
27. Online status (last_seen_at + heartbeat)
28. DM privacy enforcement

### Wave 7: Safety & moderation
29. Report button + auto screenshot
30. Panic button in session
31. Block = invisible + eject from common sessions
32. Host reputation badge (sessions count + avg review score)

### Wave 8: Polish & seed
33. Deep link OG preview (title + cover + host)
34. Custom session templates (save as template)
35. Notification bell + grouping + all types
36. Complete seed: ALL states, ALL scenarios, ALL test data
37. Build 0 errors, push
