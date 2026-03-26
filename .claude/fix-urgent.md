# URGENT FIXES — Login + Ghost i18n + Bottom Nav duplication
# Read .claude/CLAUDE.md first.

## BUG 1: Ghost page shows raw i18n keys
The GhostSetupPage shows "ghost.title", "ghost.subtitle", "ghost.next_button", 
"GHOST.YOUR_PSEUDO", "ghost.temp_access_warning", "ghost.prefer_real_account", 
"ghost.real_account_benefit", "ghost.create_account_cta", "ghost.have_code_recover"
instead of translated text.

FIX: Check src/i18n/en.json and src/i18n/fr.json — the ghost keys are probably 
nested wrong or missing. The GhostSetupPage uses t('ghost.title') etc.
Verify the JSON structure has: { "ghost": { "title": "...", "subtitle": "...", ... } }
If keys exist but are at root level like "ghost_title" instead of nested "ghost.title",
fix either the JSON or the t() calls to match.

## BUG 2: Login flow broken
- Homepage refreshes/flashes when not logged in
- "Se connecter" button leads to error
- "Creer une session" button visible when NOT logged in (makes no sense)

FIX:
- Homepage when NOT logged in should show: invite code input + "Se connecter" + "Creer un compte" buttons ONLY
- NO "Creer une session" button for unauthenticated users
- "Se connecter" must navigate to /login (verify this route works)
- /login page must work: email+password form, Google OAuth if configured, link to ghost mode
- Check AuthContext for redirect loops or race conditions causing refresh flicker

## BUG 3: Bottom nav duplicates page content
When SessionBottomNav has a Chat tab, the session page STILL shows chat buttons/links.
When SessionBottomNav has Candidats tab, the page STILL shows candidate cards inline.

FIX: The SessionPage content for each tab must ONLY show what belongs to that tab.
- "Session" tab: cover, title, address, lineup, rules, stats. NO chat buttons, NO vote cards, NO candidate list
- "Candidats" tab (host): ONLY candidate cards with accept/reject. Nothing else
- "Vote" tab (member): ONLY vote cards. Nothing else  
- "Chat" tab: ONLY the chat interface (DM list + group chat toggle). Nothing else
- "Candidature" tab (candidate): ONLY application status/form. Nothing else

Remove ALL redundant navigation buttons, quick action buttons, and inline content 
that duplicates what's in the bottom nav tabs.

## BUG 4: Homepage for unauthenticated users
When not logged in, the homepage should be a SIMPLE welcome screen:
- fluidz logo
- "Organise tes soirees privees" tagline  
- Invite code input (join with code)
- "Se connecter" button → /login
- "Creer un compte" button → /login?signup=1
- "Mode ghost" small link → /ghost
- NO session cards, NO naughty book, NO activity feed
- These appear ONLY after login

## VERIFY after fixes:
1. Go to / when logged out → see welcome + login buttons
2. Click "Se connecter" → lands on /login with working form
3. Login with marcus@fluidz.test / testpass123 → lands on home with sessions
4. Open a session → see SessionBottomNav, NO duplicate buttons on page
5. Go to /ghost → see translated text (not raw keys)

npm run build && git add -A && git commit -m "fix: login flow + ghost i18n + remove nav duplication" && git push
