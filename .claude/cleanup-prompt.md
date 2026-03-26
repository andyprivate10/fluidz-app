# FLUIDZ — UI/UX CLEANUP BATCH
# Read .claude/CLAUDE.md first.

## 1. Remove EventContextNav from ALL sub-pages
EventContextNav (old top tab bar) is still used on 7 pages. It's been replaced by SessionBottomNav.
Replace it with a simple back button (same style as the back in SessionBottomNav).

Files to fix — replace EventContextNav with a simple back header:
- src/pages/DMPage.tsx — remove EventContextNav, add back button to /session/:id?tab=chat
- src/pages/GroupChatPage.tsx — remove EventContextNav, add back button to /session/:id?tab=chat
- src/pages/ApplyPage.tsx — remove EventContextNav, add back button to /session/:id
- src/pages/CandidateProfilePage.tsx — remove EventContextNav, add back button to /session/:id?tab=candidates
- src/pages/ReviewPage.tsx — remove EventContextNav, add back button to /session/:id
- src/pages/EditSessionPage.tsx — remove EventContextNav, add back button to /session/:id
- src/pages/HostDashboard.tsx — add redirect: if user navigates to /session/:id/host, redirect to /session/:id

The back button should be: ArrowLeft icon (lucide-react, size=18, strokeWidth=1.5) + session title, peach color, small text, same style across all pages.

## 2. Harmonize BottomNav backgrounds
- BottomNav.tsx: background 'rgba(5,4,10,0.92)'
- SessionBottomNav.tsx: background 'rgba(5,4,10,0.95)'
Make both 0.92 for consistency.

## 3. Fix font inconsistency
SessionPage.tsx uses "Bricolage Grotesque" for tab headers.
The app brand font is "Plus Jakarta Sans" (from brand.ts).
Replace all 'Bricolage Grotesque' references in SessionPage.tsx with the brand font.

## 4. Redirect old routes
In App.tsx, add redirects for old routes:
- /session/:id/host → /session/:id (host dashboard merged into SessionPage)

## 5. Host candidates tab — add accept/reject buttons
The candidates tab in SessionPage shows candidate cards but is MISSING accept/reject buttons.
Look at how HostCandidatesTab.tsx (src/components/host/HostCandidatesTab.tsx) does it.
Add two buttons per candidate card:
- "Accept" — green background, calls the accept RPC
- "Reject" — red border outline, calls the reject RPC
These should use the same logic as HostCandidatesTab.

## 6. Clean up EventContextNav component
After removing all imports, check if EventContextNav.tsx is still imported anywhere.
If not, delete src/components/EventContextNav.tsx.

## 7. HostDashboard redirect
Change the /session/:id/host route in App.tsx to redirect to /session/:id instead of rendering HostDashboard.
Import Navigate from react-router-dom and use:
{ path: '/session/:id/host', element: <Navigate to="/session/:id" replace /> }
Actually this won't work with params. Instead, create a small HostRedirect component:
function HostRedirect() { const { id } = useParams(); return <Navigate to={`/session/${id}`} replace /> }

## 8. Verify covers on SessionPage hero
When clicking a session from Home, the SessionHero should show the cover photo.
Verify that SessionHero receives the template_slug and passes it to getSessionCover.

## Build & Push
npm run build && git add -A && git commit -m "fix: UI/UX cleanup — remove old top nav, harmonize styles, add accept/reject, redirect old routes" && git push
