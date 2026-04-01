# FLUIDZ — SESSION HANDOFF — 1 Avril 2026

## PROJET
**Fluidz** — App mobile-first social-sexual networking pour adultes (hommes gays/bi/queer).
Use case MVP : "Recruter un groupe depuis Grindr pour ce soir" — le host crée une session, partage un lien, les candidats postulent, les membres votent, le host accepte/rejette, l'adresse se révèle.

## INFRA
- **Repo** : `andyprivate10/fluidz-app` (GitHub)
- **Stack** : React + TypeScript + Vite + Tailwind + Supabase
- **Prod** : `https://fluidz-app.vercel.app` (auto-deploy on push to main)
- **Supabase** : ref `kxbrfjqxufvskcxmliak` (projet "fluidz")
- **Google Cloud** : projet `fluidz-492010` — OAuth **In Production**
- **Test accounts** : `marcus@fluidz.test`, `karim@fluidz.test`, `yann@fluidz.test` (all `testpass123`)
- **User IDs** : Marcus `0b8ab966`, Karim `10aed3e9`, Yann `c803eb14`
- **Anon key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnJmanF4dWZ2c2tjeG1saWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Nzg0NjYsImV4cCI6MjA4ODI1NDQ2Nn0.twnxJsGtpfTbXLTCOzIlGMpggXIuClZMZISIftp2btE`

## ÉTAT ACTUEL (1 Avril 2026)
- **701 commits** | **38 pages** | **97 composants** | **14 hooks** | **1799 i18n keys** (FR+EN)
- **Build** : 2.13s, 0 erreurs TS
- **Vercel** : 200 OK, live
- **Netlify** : 100% éliminé (0 références)
- **Google OAuth** : En production, fonctionnel (302 → accounts.google.com)

## SUPABASE AUTH CONFIG
- **Site URL** : `https://fluidz-app.vercel.app`
- **Redirect URLs** : `https://fluidz-app.vercel.app/**`
- **Google Provider** : Enabled, Client ID `620872201784-7ii1c3tdgf3othj7652e7o3qv31u4nsq.apps.googleusercontent.com`
- **Google Cloud redirect URI** : `https://kxbrfjqxufvskcxmliak.supabase.co/auth/v1/callback`
- **Technique Supabase Management API** : SQL exécutable via `api.supabase.com/v1/projects/{ref}/database/query` avec le dashboard auth token depuis `localStorage['supabase.dashboard.auth.token']`

## FEATURES IMPLÉMENTÉES (8 WAVES)

### Wave 1: Onboarding
- `OnboardingPage.tsx` — 5-step wizard (Pseudo+Photo, Physique, Rôle+Kinks, Santé, DM Privacy)
- `WelcomeTutorial.tsx` — 4-screen carousel
- `useCoachMarks.ts` + `TooltipOverlay.tsx` — coach marks system
- Route guards: new user → wizard → tutorial → home

### Wave 2: Session lifecycle
- `end_time` field + extend UI, 30min warning notification, auto-close

### Wave 3: Story + Vote
- `SessionStory.tsx` — Instagram-style fullscreen viewer
- Vote real-time tally for host, majority warning on override

### Wave 4: Candidature
- `GroupStep.tsx` — group candidature
- Withdrawal with 10min cooldown, soft rejection wording

### Wave 5: Chat riche
- `EmojiReactionPicker.tsx` — 6 emoji reactions on long press
- `MediaPreviewModal.tsx` — photo/video send in chat
- Reply/quote via swipe right

### Wave 6: Social
- Online status (last_seen_at + green dot)
- Heartbeat system

### Wave 7: Safety
- `ReportSheet.tsx` — signalement + auto screenshot
- `PanicButton.tsx` — bouton panique en session live
- Block = invisible + éjecté

### Wave 8: Polish
- `HostBadge.tsx` — badge réputation host
- Seed data, i18n polish

## FEATURES AJOUTÉES SESSION 1 AVRIL

### Broadcast Announcement ✅
- `SessionBroadcast.tsx` — texte live éditable par le host pendant la session
- Realtime Supabase subscription
- Migration appliquée : `broadcast text` column sur `sessions`
- Max 100 chars, exemples : "On est chaud !" "Il manque un bottom"

### Participant Count ✅
- X/max affiché sur SessionPage (public)
- i18n : `participants_display`, `participants_display_no_max`

### Lineup Privacy ✅
- Non-membres voient seulement "X participants" (pas noms/photos/rôles)
- Membres/host voient le lineup complet

### Auth Fixes ✅
- Homepage (`/`) protégée par RequireAuth
- Redirect loop `/login?next=...` corrigée
- Google OAuth configuré et en production

### Netlify → Vercel Migration ✅
- 14 fichiers nettoyés, site/netlify.toml supprimé
- Supabase auth config migrée (Site URL + redirects)
- 0 référence Netlify restante

## SECURITY AUDIT
Fichier : `.claude/security-audit.md` — 9 failles documentées

| # | Sévérité | Faille | Status |
|---|---|---|---|
| 1 | CRITIQUE | Clé anon hardcodée | ✅ FIXÉ |
| 2 | CRITIQUE | 3 XSS dangerouslySetInnerHTML | ✅ FIXÉ |
| 3 | CRITIQUE | Routes sans auth | ✅ FIXÉ |
| 4 | IMPORTANT | Input sanitization | ✅ FIXÉ |
| 5 | IMPORTANT | Media upload validation | ✅ FIXÉ |
| 6 | IMPORTANT | Security headers | ✅ FIXÉ |
| 7 | RECOMMANDÉ | Rate limiting RPC | PENDING |
| 8 | RECOMMANDÉ | Logging actions sensibles | PENDING |
| 9 | RECOMMANDÉ | Session JWT timeout | PENDING |

## PAGES (38)
AddressesPage, AdminPage, ApplyPage, AuthCallbackPage, CandidateProfilePage, ChatsHubPage, ContactDetailPage, ContactsPage, CreateSessionPage, DMPage, DevLoopPage, DevTestMenu, DirectDMPage, EditSessionPage, ExplorePage, FavoritesPage, GhostRecoverPage, GhostSetupPage, GroupChatPage, GroupsPage, HomePage, JoinPage, LandingPage, LoginPage, MePage, MessageTemplatesPage, NotFoundPage, NotificationsPage, OnboardingPage, PublicProfile, ReviewPage, SessionPage, SessionReviewFlow, SessionsPage, SettingsPage, TemplatesPage, VibeScorePage, WelcomeTutorial

## HOOKS (14)
useAdminConfig, useApplyData, useCoachMarks, useCopyFeedback, useCreateSession, useDMData, useGhostGuard, useGroupChatData, useHomeData, useMeData, usePushNotifications, useReactions, useSessionData, useTypingIndicator

## KEY SPEC FILES
- `.claude/complete-ux-spec.md` — 391 lignes, 23 sections, toutes les décisions UX verrouillées
- `.claude/social-interactions.md` — 144 lignes, système social (intents, NaughtyBook, tribes, etc.)
- `.claude/security-audit.md` — 9 failles documentées
- `.claude/CLAUDE.md` — règles projet pour Claude Code
- `scripts/seed-e2e.mjs` — seed E2E complet (1009 lignes, 10 users, 5 sessions)

## SOCIAL SYSTEM (landed ~late March)
- 10 intents avec double-match reveal mechanic
- NaughtyBook : mutuellement visible
- Favorites : one-sided
- 27 tribes across 5 categories (multi-select composable)
- 28 ethnicities across 7 regions (multi-select composable)
- DM privacy : 3 levels (open/request/closed)
- Post-session review : swipe flow (VibeScore + intents + NaughtyBook)

## BRANDING RULES
- Peach = `#E0887A` (JAMAIS orange)
- Bricolage Grotesque 800 pour hero titles
- Plus Jakarta Sans pour body text
- ZÉRO emoji dans l'UI — icônes SVG Lucide stroke 1.5px
- Bottom tab bar : SVG icons, 1.5px peach indicator, hidden inside events
- Shimmer sur tous les CTA primaires
- Backdrop-blur sur éléments flottants

## OUTILS & TECHNIQUES
- **Claude Code** via Terminal osascript (oh-my-claude plugin, `ultrawork` keyword)
- **Supabase Management API** : `api.supabase.com/v1/projects/{ref}/database/query` avec dashboard token pour exécuter SQL (contourne le SQL Editor buggé)
- **Supabase Management API auth config** : `api.supabase.com/v1/projects/{ref}/config/auth` PATCH pour modifier Site URL, redirect URLs, providers
- **Chrome browser MCP** : pour visual verification et interaction avec dashboards
- **Local dev** : `cd ~/fluidz-app && git pull && npm run dev` → `http://localhost:5173`

## PENDING / TODO
1. **Security** — Rate limiting on RPC functions, logging of sensitive actions, JWT session timeout
2. **Session story** needs polish (auto-advance, smooth transitions)
3. **Homepage session cards** — show participant count X/max next to each card (useHomeData already has member_count)
4. **i18n** — 1799 keys, potentially some hardcoded strings remaining
5. **E2E testing** — seed script exists but automated tests not yet
6. **B2B features** (Phase 3) — Event 150 personnes le 6 Juin
7. **Google OAuth** — App en production mais si scopes sensibles demandés, un avertissement "unverified app" peut apparaître. Pour le retirer : soumettre à Google verification.

## COMMITS RÉCENTS
```
df49c71 fix: homepage requires auth + fix login redirect infinite loop
2c79738 feat: broadcast announcement + participant count + purge all Netlify refs
fec0aab privacy: hide participant names/photos/roles from non-members — show count only
076cb5a fix: onboarding guard — don't redirect users with existing profile data
add72c7 feat: comprehensive E2E seed script — 10 users, 5 sessions, all states
```

## ROUTES PUBLIQUES (pas de RequireAuth)
- `/login` — page de connexion
- `/landing` — page marketing
- `/session/:id` — page session (nécessaire pour liens d'invitation)
- `/join/:code` — rejoindre via code
- `/auth/callback` — callback OAuth
- `/session/:id/candidate/:applicantId` — profil candidat

## ROUTES PROTÉGÉES (RequireAuth)
Toutes les autres routes dont : `/`, `/sessions`, `/session/create`, `/me`, `/contacts`, `/explore`, `/chats`, `/settings`, `/onboarding`, etc.

## WORKFLOW DÉVELOPPEUR
Sidney est non-technique. Le workflow est :
1. Sidney donne des instructions (souvent en français, voice-transcribed, dense)
2. Claude fait TOUT : code, build, commit, push, config Supabase, config Google Cloud
3. Claude utilise Claude Code via Terminal pour les gros sprints (`ultrawork` keyword)
4. Vercel auto-deploy sur push to main
5. Claude vérifie visuellement via Chrome MCP tools

**Règle absolue : Ne JAMAIS demander à Sidney de faire quelque chose que Claude peut faire lui-même.**

---
FIN DU HANDOFF — 1 Avril 2026, 701 commits
