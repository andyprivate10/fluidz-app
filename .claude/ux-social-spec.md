# FLUIDZ — COMPLETE UX/SOCIAL SPEC (7 blocs validated)
# All decisions from user testing session — 31 Mars 2026

## ═══ 1. SESSION STORY (Collection cachée) ═══
- Contient: UNIQUEMENT les photos/vidéos des Candidate Packs des membres acceptés
- Accès: Candidats invités y accèdent automatiquement
- Candidats libres (sans invitation): doivent recevoir autorisation du host via le DM
- Disparaît quand la session se ferme — pas de persistance

## ═══ 2. SESSION LIFECYCLE & REVIEWS ═══
- Session a une HEURE DE FIN configurable par le host
- 30min avant la fin: notification au host → "Prolonger" ou "Terminer"
- Sans action du host: session se termine automatiquement
- Review: déclenchée 15min après clôture
- Review: OPTIONNELLE — notification rappel mais pas bloquante

## ═══ 3. VOTE & DÉCISIONS HOST ═══
- Candidat ne voit JAMAIS les votes — seulement la décision finale du host
- Host voit les votes en TEMPS RÉEL (chaque vote apparaît dès qu'il est posté)
- Si host accepte CONTRE majorité négative: AVERTISSEMENT visuel mais il peut passer outre
- Vote consultatif — host a toujours le dernier mot

## ═══ 4. NAUGHTYBOOK OPTIMISÉ ═══
- Liste PLATE sans catégories — tous au même niveau
- FILTRABLE par attributs/intents/distance (comme Explore) + options NaughtyBook
- Notes privées: texte libre visible seulement par l'utilisateur
- Historique: sessions partagées + date dernier échange/dernière session
- Bidirectionnel (type Facebook): demande → acceptation → mutuel

## ═══ 5. CANDIDATURE TIMELINE ═══
- Candidat peut RETIRER sa candidature avec cooldown 10min avant re-postuler
- Refus: notification douce (pas "refusée") + message optionnel du host
- Host peut ÉJECTER un membre accepté à tout moment
- Host configure les éléments MINIMUM requis par session pour candidater
- Avertissement au candidat: "Complète ton profil pour plus de chances"

## ═══ 6. NOTIFICATIONS ═══
### Événements déclencheurs:
- ✅ Nouvelle candidature reçue (host)
- ❌ Vote individuel (PAS notifié)
- ✅ Candidature acceptée/refusée (candidat)
- ✅ Nouveau message DM
- ✅ Demande NaughtyBook reçue
- ✅ NaughtyBook accepté
- ✅ Session commence dans 30min
- ✅ Check-in (UNIQUEMENT au host pour confirmation)

### Format:
- Mix: DM individuels, candidatures regroupées ("3 nouvelles candidatures")
- Badge: sur Chats (BottomNav) + cloche Notifications dans le header

## ═══ 7. EDGE CASES ═══
- Profil incomplet: host décide des minimum requis par session + avertissement candidat
- Candidatures multiples: pas de limite
- Sessions multiples host: pas de limite + avertissement "Tu as déjà X sessions actives"
- Contenu adulte: si candidat coche adulte → doit avoir ≥1 photo adulte + ≥1 photo profil
