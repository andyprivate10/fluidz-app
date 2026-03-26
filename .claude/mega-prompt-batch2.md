# FLUIDZ MEGA BATCH — Session BottomNav + Ghost Account + Covers
# Read .claude/CLAUDE.md first for project rules.

## FEATURE 1: SessionBottomNav — contextual navigation by role
Replace EventContextNav (top tabs) with a bottom nav bar on all /session/:id/* routes.
The global BottomNav is already hidden on these routes.

### Architecture
Create `src/components/session/SessionBottomNav.tsx`
It receives `eventRole` from useSessionData() and renders different tabs per role.
Each tab shows inline content (no page navigation) — content swaps in the same page.

### Tab configs per role:

**HOST (4 tabs):**
- Retour (ArrowLeft icon) → navigate back to /sessions
- Session (Home icon, ACTIVE by default) → cover+title+status, address+directions, lineup (with eject button), host rules, stats, share link, edit/end buttons
- Candidats (Users icon + red badge count) → pending applications with accept/reject, vote results from members, history
- Chat (MessageCircle icon) → 2 sub-tabs: DM list (individual convos) + Group Chat (toggle on/off)

**MEMBER (4 tabs):**
- Retour → /sessions
- Session (Home icon, ACTIVE) → cover+title+status, revealed address+directions, lineup (no eject), host rules (read-only), check-in button, share link (post check-in)
- Vote (CheckCircle icon + red badge) → pending votes on candidates, vote yes/no, results history
- Chat (MessageCircle icon) → DM Host + Group Chat (if enabled by host, else greyed message)

**CANDIDATE (4 tabs):**
- Retour → /sessions
- Session (Home icon, ACTIVE) → cover+title, approx area (NO exact address), host info, visible lineup, tags+rules preview
- Candidature (ClipboardList icon) → if not applied: CTA "Postuler" gradient peach. If pending: status + pack summary + "Retirer". If accepted: auto-switch to member role. If rejected: status + re-apply option
- Chat (MessageCircle icon) → DM Host only, safety tip on first message

**VISITOR (3 tabs):**
- Retour → /sessions or /landing
- Session (Home icon, ACTIVE) → public info same as candidate
- Postuler (ArrowRight icon, gradient peach background) → redirects to /session/:id/apply (or login first if not authenticated)

### Design specs:
- Same style as global BottomNav: fixed bottom, maxWidth 480, glass background
- Icons: lucide-react, size={20}, strokeWidth={1.5}
- Active tab: color peach (brand.ts S.p), inactive: S.tx3
- Badge: small red dot with count, position absolute top-right of icon
- Smooth tab transition (no page reload)
- All text via i18n t() keys under "session_nav" namespace

### Implementation:
1. Create SessionBottomNav.tsx
2. Modify SessionPage.tsx to use tab-based content rendering instead of showing everything
3. Move HostDashboard content into Session tab (host role) — merge, don't duplicate
4. Keep existing sub-pages (DMPage, GroupChatPage, ApplyPage) as the content rendered in tabs
5. Add tab state management via useState
6. Hide global BottomNav on /session/:id routes (already done)
7. Update .claude/CLAUDE.md with SessionBottomNav rules


## FEATURE 2: Ghost Account System

### Ghost restrictions (check isGhost flag on profile or auth metadata):
Block these actions for ghost accounts:
- Creating sessions (show GhostConvertModal instead)
- Accessing admin panel
- Joining group chat
- Seeing exact addresses (only approx)
- Sharing invite links

### GhostConvertModal (src/components/GhostConvertModal.tsx):
A modal that prompts ghost users to convert to a real account.
- Shows: "Create your account to unlock all features"
- Options: Email + password signup, OR Google OAuth
- Uses supabase.auth.updateUser() to add email/password to existing ghost session
- OR supabase.auth.linkIdentity() for Google OAuth
- Preserves all ghost data (profile, applications, messages, votes)
- After conversion: dismiss modal, refresh auth state, show success toast
- Trigger: whenever a ghost tries a blocked action

### GhostTimer (src/components/GhostTimer.tsx):
- Shows countdown of remaining time (24h from ghost creation)
- Visible in Menu drawer ONLY for ghost accounts
- Format: "23h 45m remaining" or "< 1h remaining" (red when < 1h)
- When expired: auto-redirect to login page, clear session
- Small pill badge style, peach text on dark bg

### GhostSetupPage updates:
- Show "24h temporary access" warning
- Add "Create account" CTA below ghost setup
- Timer visible at top

### Auth flow updates:
- In AuthContext: add `isGhost` boolean derived from user metadata or profile
- Ghost detection: check if user.email contains '@ghost.' or user.app_metadata.is_ghost === true
- Add ghost check wrapper: `useGhostGuard()` hook that returns { isGhost, showConvertModal }

## FEATURE 3: Covers Consistency
Verify and fix covers display on ALL session views:
- SessionPage hero (SessionHero.tsx) — must show cover photo as background
- HostDashboard header — must show cover photo
- SessionInfoCard on SessionsPage — already working
- SessionInfoCard on HomePage — already fixed
- ChatsHubPage session cards — check if template_slug is passed
- ContactDetailPage session references — check

For each: ensure template_slug is in the query select AND passed to the cover component.

## Build & Push
After ALL features are implemented:
```
npm run build && git add -A && git commit -m "feat: session bottom nav + ghost account + covers consistency" && git push
```

If build fails, fix errors and retry. Do NOT leave broken code.
