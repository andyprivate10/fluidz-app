# FLUIDZ — SECURITY AUDIT
# Date: 1 Avril 2026
# Status: 9 failles identifiées

## ═══ CRITIQUE (à fixer immédiatement) ═══

### FAILLE 1: Clé Supabase anon hardcodée en fallback
- Fichier: src/lib/supabase.ts ligne 3
- Problème: La clé anon est hardcodée en fallback dans le code source
- Risque: Exposée dans le bundle JS minifié, visible par n'importe qui
- Fix: Supprimer le fallback, utiliser UNIQUEMENT import.meta.env.VITE_SUPABASE_ANON_KEY
- Si env var manquante → afficher erreur "Configuration manquante" au lieu de fallback
- Note: La clé anon est conçue pour être publique MAIS couplée avec RLS.
  Le vrai danger est si RLS a des trous.

### FAILLE 2: 3 XSS via dangerouslySetInnerHTML
- Fichiers: LandingFeatures.tsx (lignes 35, 52), LandingPro.tsx (ligne 54)
- Problème: Injection HTML depuis les traductions i18n
- Risque: Si un traducteur ou une clé i18n est compromise → XSS
- Fix: Remplacer dangerouslySetInnerHTML par du rendu React safe
  Utiliser <Trans> de react-i18next ou découper les segments HTML

### FAILLE 3: Routes non protégées par auth
- Routes exposées sans RequireAuth:
  - /explore (profils visibles sans compte)
  - /session/:id (détails session accessibles)
  - /onboarding (wizard accessible sans auth)
- Risque: Scraping de profils, accès à des données sans compte
- Fix: Ajouter RequireAuth sur /explore et /session/:id
  /onboarding doit vérifier que l'user est auth mais pas onboarded

## ═══ IMPORTANT (à fixer avant production) ═══

### FAILLE 4: Aucune sanitization des inputs utilisateur
- Problème: bio, notes NaughtyBook, messages chat, display_name
  sont stockés et affichés sans sanitization
- Risque: XSS stocké si un user met du HTML/JS dans sa bio
- Fix: Installer DOMPurify, sanitizer tous les inputs:
  - display_name: max 50 chars, strip HTML
  - bio: max 500 chars, strip HTML
  - messages: max 5000 chars, strip HTML
  - notes NB: max 1000 chars, strip HTML

### FAILLE 5: Aucune validation des uploads médias côté client
- Problème: Pas de vérification de type MIME, taille, dimensions
- Risque: Upload de fichiers malveillants (.exe, .svg avec JS)
- Fix: Valider côté client ET côté Supabase Storage:
  - Types acceptés: image/jpeg, image/png, image/webp, video/mp4
  - Taille max: 10MB photos, 50MB vidéos
  - Dimensions max: 4096x4096 photos
  - Vérifier magic bytes (pas juste l'extension)

### FAILLE 6: Pas de security headers sur Vercel
- Problème: vercel.json n'a aucun header de sécurité
- Risque: Clickjacking, MIME sniffing, data leaks
- Fix: Ajouter dans vercel.json:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy: default-src 'self'; etc.
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

## ═══ RECOMMANDÉ (avant lancement public) ═══

### FAILLE 7: Pas de rate limiting côté Supabase
- Problème: Les RPC functions n'ont pas de rate limit
  Seulement le cooldown NB de 7 jours
- Risque: Spam de candidatures, flood de messages, brute force
- Fix: Ajouter dans les RPC functions:
  - rpc_send_interest: max 20/heure par user
  - rpc_send_message: max 100/heure par user
  - rpc_apply_to_event: max 10/heure par user
  - Login attempts: Supabase gère déjà (rate limit email)

### FAILLE 8: Pas de logging/audit des actions sensibles
- Problème: Pas de trace pour les actions critiques
- Risque: Impossible de tracer un abus ou un signalement
- Fix: La table interaction_log existe mais manque:
  - Log des signalements
  - Log des blocages
  - Log des éjections
  - Log des accès Story (qui a vu quoi)

### FAILLE 9: Session Supabase pas de timeout
- Problème: autoRefreshToken: true mais pas de session max lifetime
- Risque: Token volé = accès permanent
- Fix: Configurer dans Supabase Dashboard:
  - JWT expiry: 1h (au lieu de 1 semaine par défaut)
  - Refresh token rotation: activé
  - Refresh token reuse detection: activé
