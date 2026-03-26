FLUIDZ — MEGA BATCH: Session BottomNav + Ghost Account + Polish
=================================================================
Read .claude/CLAUDE.md first for project rules.

This is a large batch with 3 features. Do them IN ORDER.
Build after EACH feature. Push after ALL 3 are done.

=================================================================
FEATURE 1: Session BottomNav — contextual navigation by role
=================================================================

Currently sessions use EventContextNav (top tabs) + separate pages
for DM, Chat, Apply, Host. Replace with a BOTTOM nav that adapts
per role. The role comes from useSessionData() → eventRole.

A) Create src/components/session/SessionBottomNav.tsx

Props: { sessionId: string, role: 'host' | 'member' | 'candidate' | 'visitor', activeTab: string, onTabChange: (tab: string) => void, badges?: { candidates?: number, votes?: number, chat?: number } }

Uses lucide-react icons. Same dark style as the app BottomNav.
Height: 56px fixed at bottom. Background: rgba(12,10,20,0.95) + backdrop-blur.

Tabs per role:

HOST (4 tabs):
- "Retour" (ArrowLeft) → navigate('/')
- "Session" (Home) → tab='session' — ACTIVE DEFAULT
- "Candidats" (Users) → tab='candidates' — red badge with pending count
- "Chat" (MessageCircle) → tab='chat'

MEMBER (4 tabs):
- "Retour" (ArrowLeft) → navigate('/')
- "Session" (Home) → tab='session' — ACTIVE DEFAULT
- "Vote" (CheckCircle) → tab='vote' — red badge with pending votes
- "Chat" (MessageCircle) → tab='chat'

CANDIDATE (4 tabs):
- "Retour" (ArrowLeft) → navigate('/')
- "Session" (Home) → tab='session' — ACTIVE DEFAULT
- "Candidature" (ClipboardList) → tab='application'
- "Chat" (MessageCircle) → tab='chat'

VISITOR (3 tabs):
- "Retour" (ArrowLeft) → navigate('/')
- "Session" (Eye) → tab='session' — ACTIVE DEFAULT
- "Postuler" (Send) → tab='apply' — peach gradient background

Active tab: peach color + line under icon. Inactive: tx3 color.
i18n keys: session_nav.back, session_nav.session, session_nav.candidates,
session_nav.chat, session_nav.vote, session_nav.application, session_nav.apply

B) Rewrite SessionPage.tsx as a tab container

SessionPage becomes the single entry point for /session/:id.
It renders SessionBottomNav + the active tab content.
Remove EventContextNav from SessionPage.


Tab content mapping:

tab='session' renders:
  - FOR ALL: SessionHero (cover + title + status + timing)
  - FOR HOST: address + directions + lineup (with eject) + rules (editable) + stats + actions (edit, end, share, publish toggle)
  - FOR MEMBER: address revealed + directions + lineup (no eject) + rules (read-only) + check-in button + share link (post check-in)
  - FOR CANDIDATE: approx area only (no exact address) + host info + visible lineup + tags + rules preview
  - FOR VISITOR: same as candidate

tab='candidates' (HOST only) renders:
  - Reuse HostCandidatesTab content: pending apps with candidate packs, votes, accept/reject buttons
  - Accepted/rejected history collapsed

tab='vote' (MEMBER only) renders:
  - Pending candidates to vote on (Yes/No buttons)
  - Vote results: who voted what, host decision
  - Reuse SessionVotes component logic

tab='application' (CANDIDATE only) renders:
  - If not yet applied: CTA "Postuler" → navigate to /session/:id/apply
  - If pending: status badge "En attente" + candidate pack summary + "Retirer" button
  - If accepted: auto-switch to member role (tabs change)
  - If rejected: status + re-apply option

tab='apply' (VISITOR only) renders:
  - If not logged in: redirect to /login with return URL
  - If logged in: navigate to /session/:id/apply

tab='chat' renders:
  - 2 sub-tabs at top: "DM Host" + "Groupe"
  - FOR HOST: DM list (conversations with each candidate/member) + Group Chat toggle
  - FOR MEMBER: DM Host (always active) + Group Chat (if enabled, else message "Chat groupe non actif")
  - FOR CANDIDATE: DM Host only. Group Chat greyed out "Disponible après acceptation"

C) Update BottomNav.tsx to hide on /session/:id routes (already hidden on /landing, /login, /onboarding)

D) Remove EventContextNav from SessionPage (it's replaced by SessionBottomNav)

E) Keep existing routes /session/:id/apply, /session/:id/dm, /session/:id/chat working
   They should redirect to SessionPage with the appropriate tab active.

F) Update .claude/CLAUDE.md with the new architecture.


=================================================================
FEATURE 2: Ghost Account System
=================================================================

Ghost accounts (anonymous Supabase auth) need restrictions and
a conversion path to real accounts.

A) Ghost restrictions — in relevant pages, check if user is anonymous:
   const isGhost = user?.is_anonymous === true

   BLOCKED for ghosts (show conversion prompt instead):
   - Creating a session (CreateSessionPage)
   - Accessing admin (AdminPage)
   - Creating groups (GroupsPage)
   - Saving addresses (AddressesPage)

   When a ghost tries a blocked action, show a modal:
   "Crée ton compte pour débloquer cette fonctionnalité"
   with 2 buttons: "Continuer avec email" → email/password signup
                   "Continuer avec Google" → Google OAuth
   Both should LINK the anonymous account (not create a new one)
   using supabase.auth.updateUser({ email, password }) or
   supabase.auth.linkIdentity({ provider: 'google' })

B) Ghost timer — visible countdown in the Menu drawer (right side)
   ONLY for ghost accounts.

   Create src/components/GhostTimer.tsx:
   - Shows remaining time (ghost sessions expire after 24h)
   - Format: "Compte temporaire · 23h 45min restantes"
   - Style: small peach text, warning icon, in the Menu/drawer
   - When < 1h remaining: red text, pulsing animation
   - When expired: redirect to /ghost/recover

   Calculate from user.created_at + 24h.

   Add GhostTimer to the Menu drawer (the "Menu" tab in BottomNav).
   Only render if isGhost.

C) Ghost → Real account conversion
   When ghost converts (via email or Google):
   - Keep all data: profile, applications, contacts, messages, votes
   - The Supabase user ID stays the same (linkIdentity preserves it)
   - Show success toast: "Compte créé ! Tes données sont conservées."
   - Remove ghost timer
   - Unlock blocked features

   Create src/components/GhostConvertModal.tsx:
   - Title: "Crée ton vrai compte"
   - Subtitle: "Garde ton profil, tes messages et tes contacts"
   - Email input + password input + "Créer" button
   - Divider "ou"
   - Google OAuth button
   - All text in i18n (ghost.convert_title, ghost.convert_subtitle, etc.)

D) Update GhostSetupPage.tsx:
   - Show the 24h limit clearly
   - Explain what happens when it expires
   - CTA to convert anytime


=================================================================
FEATURE 3: Design Polish + Consistency
=================================================================

A) Session covers — verify they show on ALL session views:
   - HomePage SessionInfoCard ✓ (just fixed)
   - SessionsPage cards ✓
   - SessionPage hero (tab='session')
   - HostDashboard header → now part of SessionPage
   - JoinPage hero
   - ChatsHubPage session threads
   All must pass template_slug to getSessionCover.

B) Bottom nav consistency:
   - App BottomNav (Home/Profils/Sessions/Chats/Menu): already styled
   - Session BottomNav: SAME visual style (height, bg, blur, font, spacing)
   - Landing page: NO bottom nav (already done)
   - Login/Onboarding: NO bottom nav (already done)

C) Icons: all lucide-react, consistent sizing:
   - Bottom nav icons: size={20} strokeWidth={1.5}
   - Session bottom nav: same size and weight
   - Badge dots: 6px red circles, positioned top-right of icon

D) Session cover in SessionHero — reduce overlay if cover photo exists:
   Find the overlay div and reduce opacity when coverImage is present.
   Same pattern as SessionInfoCard (0.35 instead of 0.55).

=================================================================
RULES:
=================================================================
- Read .claude/CLAUDE.md before starting
- ALL text in i18n (en.json + fr.json)
- Use lucide-react for ALL icons
- Use brand.ts colors, never hardcode
- Use useAuth() from AuthContext, not supabase.auth.getUser()
- NEVER recreate public/_redirects
- NEVER filter templates
- Session covers use Supabase Storage URLs (COVER_IMAGES in sessionCover.ts)
- npm run build must pass after each feature
- git add -A && git commit -m "feat: session bottom nav + ghost account + polish" && git push

=================================================================
ORDER OF EXECUTION:
1. Feature 1 (Session BottomNav) — build test
2. Feature 2 (Ghost Account) — build test
3. Feature 3 (Polish) — build test
4. Final build + push
=================================================================
