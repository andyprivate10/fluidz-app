# Scénarios de test — Fluidz

Documentation des 4 personas de test (seed via Dev Test Menu `/dev/test?dev=1`).

**Comptes test :**
- **HOST** : Marcus — `host@fluidz.test` / `testpass123`
- **MEMBER** : Karim — `member@fluidz.test` / `testpass123` (déjà accepté + check-in)
- **GUEST** : Yann — `guest@fluidz.test` / `testpass123` (profil partiel, pas dans la session)
- **GHOST** : sans compte — utiliser le lien d’invitation

**Session test :** invite_code `testplan1`, titre « Plan ce soir 🔥 », zone Paris 4ème. L’`event_id_test` (session id) s’affiche dans le Dev Test Menu après avoir seedé les données.

---

## Scénario 1 — HOST (Marcus)

1. Aller sur `/dev/test?dev=1`.
2. Cliquer sur **« Se connecter en HOST (Marcus) »** → redirection vers `/session/[event_id_test]/host`.
3. **Voir le dashboard host** : onglets Session / Candidatures / Membres.
4. **Session** : modifier titre/description, copier le lien d’invitation, partager (Grindr/WhatsApp), fermer la session si besoin.
5. **Candidatures** : voir la liste (pending / acceptés), ouvrir une candidature (profil candidat), **accepter** ou **refuser**.
6. **Membres** : pour les acceptés, **confirmer le check-in** (« Confirmer ✓ ») si le membre a cliqué « Je suis là ».
7. **Broadcast** : saisir un message, cliquer **« Envoyer à tous »** pour envoyer un message à tous les membres acceptés.
8. Vérifier les notifications (nouvelle candidature, etc.).

---

## Scénario 2 — MEMBER invité (Karim, compte existant)

1. Aller sur `/dev/test?dev=1`.
2. Cliquer sur **« Se connecter en MEMBER (Karim) »** → redirection vers `/session/[event_id_test]`.
3. **Voir la page session** : titre, zone, tags, description.
4. **Lineup** : voir les avatars et noms des membres acceptés/check-in (dont soi-même). Cliquer sur un membre → bottom sheet (mobile) ou profil public (desktop).
5. **Accès aux directions** : en tant que membre accepté, voir la carte **ACCÈS** avec les étapes (ex. Métro Odéon, Code 4521).
6. **Adresse exacte** : visible car statut accepté/check-in.
7. **Vote consultatif** : visible dès 3 membres acceptés.
8. Si check-in pas encore confirmé par le host : bouton **« Je suis là ✓ »** (check-in candidat). Après check-in : bouton **« Partager le lien d’invitation »**.
9. **Ouvrir le DM** : accéder au chat avec le host.

---

## Scénario 3 — GUEST (Yann, compte mais pas encore dans la session)

1. Aller sur `/dev/test?dev=1`.
2. Cliquer sur **« Se connecter en GUEST (Yann) »** → redirection vers `/session/[event_id_test]`.
3. **Voir la page publique de la session** : titre, zone, tags, description (sans adresse exacte ni directions, sans lineup détaillé des membres).
4. **Postuler** : cliquer sur **« Postuler à cette session »** → `/session/[event_id_test]/apply`.
5. **Préparer le candidate pack** : remplir les 3 étapes (pack : sections partagées, rôle, message au host ; note ; envoi).
6. **Envoyer la candidature** : cliquer **« Envoyer ma candidature »**.
7. Vérifier la redirection / message de succès et l’apparition de la candidature côté HOST (Marcus).

---

## Scénario 4 — GHOST (sans compte)

1. Aller sur `/dev/test?dev=1`.
2. Cliquer sur **« Mode GHOST (sans compte) »** → redirection vers `/join/testplan1` (ou ouvrir directement `/join/[invite_code]` avec l’invite_code de la session test).
3. **Voir la page d’invitation** : titre session, zone, tags, lineup (avatars) si présents. Deux boutons : **« Postuler → »** (redirige vers `/me?next=...` pour se connecter) et **« Sans compte »**.
4. Cliquer **« Sans compte »** → stockage d’un token ghost et redirection vers la page de candidature (`/session/[id]/apply?guest_token=...`).
5. **Préparer le pack ghost** : pseudo obligatoire, sections partagées, rôle, message au host, etc.
6. **Envoyer la candidature** → création d’un utilisateur anonyme et d’une candidature marquée ghost (badge « Ghost » côté host).
7. Optionnel : aller sur `/me` pour voir la bannière « Créer un compte pour conserver la candidature », puis créer un compte (magic link) et réclamer la candidature ghost.
