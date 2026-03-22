# CLAUDE CODE — B2C POLISH SPRINT

## CONTEXTE
Tu travailles sur Fluidz, une app React+TypeScript+Vite+Tailwind+Supabase.
Repo: andyprivate10/fluidz-app. Supabase ref: kxbrfjqxufvskcxmliak.
App live: fluidz-app.netlify.app. Test accounts: marcus/karim/yann@fluidz.test (testpass123).

## RÈGLES ABSOLUES
- `npm run build` DOIT passer AVANT chaque commit (0 erreurs TS)
- ZÉRO emoji dans l'UI (uniquement icônes lucide-react SVG stroke 1.5)
- ZÉRO inline hex/rgba pour les couleurs — utiliser les tokens de brand.ts (S.p, S.red, S.sage, S.lav, S.redbg, S.redbd, etc.)
- Tous les textes UI doivent utiliser i18n `t('key')` — pas de français hardcodé
- Glass card style sur tous les containers : `background: 'rgba(22,20,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid '+S.rule2`
- Section labels : fontSize 10, fontWeight 700, uppercase, letterSpacing 0.08em, coloré par type (peach=S.p, lavande=S.lav, sage=S.sage)
- Font titres : Bricolage Grotesque via typeStyle('hero') ou typeStyle('title')
- maxWidth 480 + OrbLayer sur TOUTES les pages
- NE PAS toucher aux pages DevTest, DevLoop, Admin

## CE QU'IL FAUT FAIRE (dans cet ordre)

### 1. i18n — Finir la traduction FR+EN
Fichiers: src/i18n/fr.json et src/i18n/en.json
- ContactDetailPage.tsx:216 — `'Aucune note'` → t('contacts.no_notes')
- HostDashboard.tsx — `'Refuser ' + name + ' ?'` dans confirm() → garder tel quel (confirm natif)
- ApplyPage.tsx:636 — `'Envoi...'`, `'Attends quelques minutes'`, `'Envoyer ma candidature'` → t() calls
- GhostSetupPage.tsx — `'Création...'`, `'Créer mon profil ghost'` → t()
- GhostRecoverPage.tsx — `'Envoi...'`, `'Envoyer le lien de confirmation'` → t()
- GroupsPage.tsx — `'Sauvegarde...'`, `'Mettre à jour'`, `'Créer le groupe'`, `'Modifier'`, `'Nouveau groupe'` → t()
- AddressesPage.tsx — `'Modifier'`, `'Nouvelle adresse'` → t()
- MePage.tsx:360 — `'Envoi...'`, `'Créer mon compte'`, `'Envoyer le lien magique'` → t()
- HostDashboard.tsx — `'Envoi...'`, `'Envoyer à tous'`, `'Accepter'` → t()

### 2. Nettoyage MePage
- MePage a encore un emoji ✉️ ligne 360 → remplacer par icône Mail de lucide-react
- Vérifier qu'il n'y a plus de référence à activeTab, locationVisible, pushStatus dans MePage

### 3. HostDashboard — loading skeleton
- Remplacer le spinner simple par 3 skeleton cards animées (pulse) pendant le chargement
- Style: glass card + animate-pulse sur les barres placeholder

### 4. ContactDetailPage — glass cards
- Toutes les cards dans ContactDetailPage doivent utiliser le glass style
- Vérifier que les interactions (notes, historique) ont le bon style

### 5. HomePage — clarifier le rôle
- HomePage = dashboard d'activité personnelle
- Garder: session active du host, candidatures en attente, sessions acceptées, rejoindre avec code, créer session
- S'assurer que le contenu ne duplique PAS le tab Sessions (SessionsPage a la liste complète)

### 6. Vérification responsive 375px
- Tous les textes doivent être lisibles à 375px
- Les tags ne doivent pas déborder horizontalement
- Les boutons CTA doivent avoir au minimum padding 14px
- Le BottomNav 5 tabs doit rester lisible (labels fontSize 10)

## CE QU'IL NE FAUT PAS FAIRE
- PAS toucher au backlog Paiements (B1/B2) — reporté
- PAS de features B2B (vestiaire, QR, staff, etc.)
- PAS de nouvelles tables Supabase
- PAS de refactor de l'architecture existante
- PAS de changement de routes dans App.tsx
- PAS toucher à brand.ts, SideDrawer.tsx, BottomNav.tsx (déjà finalisés)

## WORKFLOW
1. Lis ce fichier
2. Fais les changements par batch (i18n d'abord, puis MePage, etc.)
3. `npm run build` après chaque batch
4. `git add -A && git commit -m 'description' && git push origin main` après chaque batch réussi
5. Passe au batch suivant

## VÉRIFICATION FINALE
Après tous les changements, lance:
```bash
grep -rn "Aucun\|Envoi\.\.\.\|Création\.\.\.\|Sauvegarde\.\.\.\|Accepter\b\|Refuser\b\|Modifier\b\|Supprimer\b" src/pages/*.tsx | grep -v "DevTest\|Admin\|confirm\|t(\|import\|//\|const"
```
Le résultat doit être VIDE (0 lignes).
