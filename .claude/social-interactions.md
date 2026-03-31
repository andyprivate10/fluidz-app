# FLUIDZ — SOCIAL INTERACTIONS SYSTEM
# Read .claude/CLAUDE.md first for project rules.

## ═══ ARCHITECTURE DES INTERACTIONS ═══

### 3 NIVEAUX DE RELATION
| Niveau | Accès profil | DM | Invite session |
|--------|-------------|-----|----------------|
| Inconnu | Sections "tous" seulement | Selon paramètre DM du profil | Non |
| NaughtyBook mutuel | Sections "tous" + "NaughtyBook only" | DM libre | Oui, invite directe |
| Bloqué | Rien, invisible mutuellement | Non | Non |

### DM PRIVACY LEVELS (sur chaque profil)
- `open`: Accepte les DM directs de tout le monde
- `request`: DM uniquement via "Tu m'intéresses" (candidature obligatoire)
- `closed`: Pas de DM hors session/NaughtyBook

## ═══ INTERACTION 1: "TU M'INTÉRESSES" ═══

### Flow complet:
1. User A voit profil B sur Explore/Session
2. A clique "Tu m'intéresses"
3. **Popup de sélection** : A choisit quelles sections partager (comme Candidate Pack)
4. **RÈGLE BLOQUANTE** : Si A coche du contenu adulte → doit avoir au moins 1 photo adulte + 1 photo profil, sinon erreur "Ajoute au moins une photo adulte et une photo de profil"
5. **Un chat/thread est créé immédiatement** entre A et B
6. **Dans le chat** : message système affichant le profil partagé de A avec les sections sélectionnées
7. **B reçoit une notification** : "X veut te montrer son profil"
8. **B voit le chat MAIS ne peut PAS répondre** tant qu'il n'a pas "déverrouillé"
9. B peut : consulter le profil, **déverrouiller** (accepter le DM), ignorer, ou bloquer
10. Si B déverrouille → conversation libre entre A et B

### DB Changes needed:
- Table `interest_requests`: id, sender_id, receiver_id, shared_sections jsonb, status (pending/accepted/rejected/blocked), created_at
- Add `locked` boolean on the DM room for the receiver
- Notification type: `interest_received`

## ═══ INTERACTION 2: NAUGHTYBOOK BIDIRECTIONNEL ═══

### Flow complet (type Facebook):
1. User A clique "Ajouter au NaughtyBook" sur profil B
2. **B reçoit notification** : "A veut t'ajouter à son NaughtyBook"
3. B voit le profil public de A
4. **B accepte** → les DEUX sont ajoutés mutuellement :
   - A dans le NaughtyBook de B
   - B dans le NaughtyBook de A
   - Les sections "NaughtyBook only" deviennent visibles entre eux
   - DM libre entre eux (bypass la config DM)
   - A peut inviter B directement en session (bypass vote)
5. **B refuse** → A n'est PAS notifié (silencieux), cooldown avant re-demande
6. **Retrait** : chacun peut retirer l'autre unilatéralement → perte accès NB-only

### DB Changes needed:
- Table `naughtybook_requests`: id, sender_id, receiver_id, status (pending/accepted/rejected), created_at
- Modify `contacts` table: add `mutual` boolean, `request_status` text
- Current contacts table has: user_id, contact_user_id, relation_level, notes, created_at

### SÉPARATION AVEC "TU M'INTÉRESSES":
- "Tu m'intéresses" = candidature sociale (partage profil + ouvre chat verrouillé)
- "Ajouter au NaughtyBook" = demande de relation (accès mutuel + DM libre + invite session)
- Les deux sont INDÉPENDANTS : je peux faire l'un sans l'autre
- Suggestion auto après échange : si A et B ont échangé 5+ messages → notification "Ajouter au NaughtyBook ?"

## ═══ INTERACTION 3: DM SELON CONTEXTE ═══

### Règles:
- **DM open** : n'importe qui peut écrire directement
- **DM request** : "Tu m'intéresses" obligatoire, chat verrouillé jusqu'à acceptation
- **DM closed** : pas de contact hors session ou NaughtyBook
- **NaughtyBook mutuel** : DM toujours libre, bypass la config
- **Session** : DM host ↔ candidat/membre toujours possible dans contexte session

## ═══ INTERACTION 4: PROFIL INCONNU — BOUTONS D'ACTION ═══

### Sur un profil inconnu, afficher:
1. Badge DM status : "Accepte les DM" / "DM sur demande" / "DM fermé"
2. Bouton "Tu m'intéresses" → popup sélection sections → envoi
3. Bouton "Ajouter au NaughtyBook" → envoie demande
4. Bouton "DM direct" (seulement si DM = open)
5. Bouton "Bloquer" (dans menu ⋮)

### Sur un profil NaughtyBook mutuel:
1. Badge "NaughtyBook" vert
2. Bouton "Envoyer un message" (DM libre)
3. Bouton "Inviter en session" → liste mes sessions ouvertes
4. Bouton "Retirer du NaughtyBook"
5. Sections NB-only visibles

## ═══ SEED DATA POUR TESTS ═══

### Photos de profil pour Marcus, Karim, Yann:
- Upload 2-3 photos de profil par compte test dans Supabase Storage avatars/
- Upload 1-2 photos adultes par compte test dans Supabase Storage media/
- Set avatar_url dans profile_json
- Set photosProfil et photosIntime dans profile_json

### Profils complets:
- Marcus: Host, Top, 32 ans, Paris 11e, PrEP actif, 5 kinks, bio complète
- Karim: Bottom, 28 ans, Paris 3e, test récent, 4 kinks, bio complète
- Yann: Versatile, 25 ans, Paris 18e, 3 kinks, bio complète

## ═══ IMPLEMENTATION ORDER ═══

### Phase A: DB + Backend (Supabase migrations)
1. Create interest_requests table
2. Create naughtybook_requests table
3. Add columns to contacts table (mutual, request_status)
4. RLS policies for all new tables
5. RPC functions: rpc_send_interest, rpc_respond_interest, rpc_request_naughtybook, rpc_respond_naughtybook

### Phase B: Profile view actions
1. Add DM status badge on PublicProfile/CandidateProfilePage
2. Add "Tu m'intéresses" button + section selection popup
3. Add "Ajouter au NaughtyBook" button
4. Add "DM direct" button (conditional on DM setting)
5. Conditional rendering based on relation level

### Phase C: Interest flow
1. InterestPopup component (section selection like Candidate Pack)
2. Photo validation (adulte content requires adulte photo)
3. Create chat thread with locked state
4. System message with shared profile
5. Receiver notification
6. Unlock/accept/reject/block actions

### Phase D: NaughtyBook bidirectionnel
1. Request notification
2. Accept → mutual add (both directions)
3. Reject → silent, cooldown
4. Remove → unilateral
5. UI: pending requests list on ContactsPage
6. Auto-suggest after 5+ messages

### Phase E: Seed with photos
1. Upload test photos to Supabase Storage
2. Update seed migration with complete profiles
3. Set avatar_url, photos, kinks, bio for all 3 test accounts

## RULES
- Use i18n for ALL text
- Use S.xxx tokens from brand.ts
- Mobile-first (390px)
- Build 0 errors after each phase
- Push after each phase
