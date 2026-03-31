# FLUIDZ — AUTONOMOUS MEGA PASS
# Read .claude/CLAUDE.md first. Execute ALL items. Build 0 errors after each batch. Push.
# This is meant to run unattended. Fix everything, verify, push.

## ═══ BATCH 1: CRITICAL BUG FIXES ═══

### 1.1 Fix any remaining TS build errors
- Run tsc --noEmit, fix ALL errors
- Run npm run build, fix ALL errors
- Remove any unused imports or variables

### 1.2 Verify all 37+ routes load
- Check App.tsx — every lazy import must match an actual file
- Verify no circular dependencies
- Verify RequireAuth wrapper on protected routes

### 1.3 Fix navigation dead-ends
- Every page must have a back button or way to navigate away
- SessionPage, CandidateProfilePage, DirectDMPage, JoinPage, ApplyPage
- VibeScorePage, SettingsPage, MessageTemplatesPage need back buttons

## ═══ BATCH 2: HOMEPAGE POLISH ═══

### 2.1 HomePage layout
- CTA "Créer une session" button must be prominent (gradient peach)
- NaughtyBook horizontal scroll with contact avatars
- Session cards with cover images from sessionCover.ts
- Activity feed with i18n notification translations
- Ghost card when isGhost (create real account CTA)

### 2.2 Session cards on HomePage
- Each card shows: cover image, title, time, member count, status badge
- Clicking navigates to /session/:id
- If no sessions, show welcoming empty state

## ═══ BATCH 3: SESSION FLOW E2E ═══

### 3.1 Create Session flow
- Template selection (Cuddle cover loads from cuddles.jpg)
- All form fields work: title, description, tags, address, timing
- Submit creates session in Supabase and navigates to session detail

### 3.2 Session detail page
- Hero with cover image + gradient overlay
- Back button in hero
- SessionBottomNav tabs: Session / Participants / Share / Chat
- Each tab renders correct content
- OptionsMenu (⋮) works

### 3.3 Apply flow (as non-host user)
- Pack selection (toggle sections to share)
- Note step (optional message)
- Submit creates application in Supabase
- Shows confirmation

### 3.4 Share tab
- Invite link generation works
- Copy to clipboard
- QR code if implemented

## ═══ BATCH 4: PROFILE E2E ═══

### 4.1 MePage tabs verification
- Profil tab: avatar, display_name, bio, age, location, physique, morphologie (pills), ethnicités (multi-select), orientation
- Adulte tab: rôle, kinks (unlimited), photos intimes (6 zones with Dos), santé (disease list), limites
- Section visibility toggles on each section header
- Auto-save works (debounced)

### 4.2 Profile view (other users)
- PublicProfile and CandidateProfilePage render correctly
- Show only sections the user has toggled visible
- VibeScore badge at top (just the number)

## ═══ BATCH 5: CONTACTS & EXPLORE ═══

### 5.1 ContactsPage (NaughtyBook)
- List of contacts with avatars, names, relation level
- Linked profiles section (Instagram, TikTok, X, OnlyFans)
- Tap navigates to contact detail
- Filters work (if implemented)

### 5.2 ExplorePage
- Grid of profile cards (2 columns)
- Each card: avatar/initial, name, role badge, vibe score
- Tap navigates to profile
- Search/filter bar
- Saved filters (save/load from profile_json)
- Shows 9+ demo profiles (fallback when geo < 3)

## ═══ BATCH 6: CHATS ═══

### 6.1 ChatsHubPage
- List of chat threads
- Each thread: avatar, name, last message, time, unread badge
- Tap navigates to DM
- Empty state when no chats

### 6.2 DM pages
- DMPage and DirectDMPage render messages
- Send message works
- Safety tip shown on first DM
- Back button to chats

## ═══ BATCH 7: MENU & SETTINGS ═══

### 7.1 SideDrawer menu
- All links work: Home, Sessions, Explore, Contacts, Chats
- VibeScore link → /vibe-score
- Settings link → /settings
- Templates link → /me/messages
- Notifications, Addresses, Preferences links
- Ghost convert card when isGhost
- Sign out button

### 7.2 SettingsPage
- DM privacy toggle (3 levels)
- Visible in gallery toggle
- Delete account with confirmation
- Back button

### 7.3 MessageTemplatesPage
- Add/edit/delete message templates
- Max 10 templates
- Back button

### 7.4 VibeScorePage
- Score display with breakdown
- Tips to improve score
- Back button

## ═══ BATCH 8: FINAL QUALITY ═══

### 8.1 i18n completeness
- Run: grep -rn 'hardcoded French' across all tsx files
- ALL user-facing text must use t() from i18n
- EN and FR keys must be synced (same count)

### 8.2 Design tokens
- No inline #fff — use S.tx or S.white
- No inline colors — use S.xxx tokens
- All fonts use brand tokens

### 8.3 Mobile optimization
- viewport meta: maximum-scale=1, user-scalable=no
- Touch targets minimum 44px
- Safe area insets on BottomNav and SessionBottomNav
- -webkit-tap-highlight-color: transparent
- -webkit-overflow-scrolling: touch

### 8.4 Performance
- All pages use React.lazy
- Images have loading="lazy"
- No console.log in production code

## ═══ EXECUTION ═══
1. Fix batch 1 (bugs), build, push
2. Fix batch 2 (home), build, push
3. Fix batch 3 (sessions), build, push
4. Fix batch 4 (profile), build, push
5. Fix batch 5 (contacts/explore), build, push
6. Fix batch 6 (chats), build, push
7. Fix batch 7 (menu/settings), build, push
8. Fix batch 8 (quality), build, push

## RULES
- Use i18n for ALL text
- Use S.xxx tokens from brand.ts
- Mobile-first (390px)
- Don't break existing functionality
- Build must pass with 0 errors after each batch
- Push after each batch
