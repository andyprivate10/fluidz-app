# FLUIDZ — PLAN REFONTE DESIGN SYSTEM V1
## Fichier de suivi — mis à jour à chaque commit

### STATUT GLOBAL: Phase 3-4 en cours (19 Mars 2026)
Last commit: b6d3d47

---

## PHASE 1: FONDATIONS ✅ DONE
- [x] brand.ts — peach #E0887A, fonts Plus Jakarta Sans + Bricolage Grotesque
- [x] index.css — CSS variables, keyframes, .btn-shimmer, .input-v1
- [x] OrbLayer.tsx — 3 orbs peach/lav/sage, blur 60px
- [x] BottomNav.tsx — 4 tabs (Plans/Discover/Book/Moi), SVG icons, 64px, blur
- [x] Google Fonts loaded in index.html
- [x] docs/design/DESIGN_SYSTEM_V1.md reference

## PHASE 2: NAV CONTEXTUELLE ✅ DONE
- [x] EventContextNav.tsx — composant créé
- [x] Intégré dans: SessionPage, HostDashboard, DMPage, GroupChatPage, ApplyPage, CandidateProfilePage, ReviewPage, EditSessionPage
- [x] BottomNav se cache sur /session/:id/* + /join/*

## PHASE 3: REFONTE PAGES PRIORITAIRES ✅ DONE
- [x] P3.1 SessionPage — hero, EventContextNav, colored badges
- [x] P3.2 JoinPage — CTA fixe en bas per brief
- [x] P3.3 HostDashboard — Host badge, Live chip, OrbLayer fix, shimmer Accept
- [x] P3.4 HomePage — Bricolage hero, quick nav SVG, shimmer CTA, templates
- [x] P3.5 LoginPage — already using typeStyle('hero'), shimmer, ghost lav
- [x] P3.6 ApplyPage — EventContextNav, shimmer CTAs

## PHASE 4: REFONTE PAGES SECONDAIRES ✅ DONE (tokens applied)
All pages have: OrbLayer, blur headers, Bricolage h1, brand tokens, Plus Jakarta Sans inputs
- [x] P4.1 MePage — Bricolage title, brand tokens, blur header
- [x] P4.2 ExplorePage (Discover) — Bricolage title, brand tokens, blur
- [x] P4.3 ContactsPage (Book) — Bricolage title, brand tokens, blur
- [x] P4.4 ChatsHubPage — typeStyle('title'), blur, tabs
- [x] P4.5 NotificationsPage — typeStyle('title'), blur, icon circles
- [x] P4.6 OnboardingPage — Bricolage, brand tokens
- [x] P4.7 PublicProfile — Bricolage, brand tokens, blur
- [x] P4.8 ContactDetailPage — Bricolage, brand tokens, blur
- [x] P4.9 CandidateProfilePage — brand tokens, EventContextNav

## PHASE 5: POLISH GLOBAL 🔄 IN PROGRESS
- [x] P5.1 Shimmer: .btn-shimmer CSS, on HomePage/HostDashboard/ApplyPage/CreateSession/JoinPage CTAs
- [x] P5.2 Inputs: Plus Jakarta Sans on all 17 pages, .input-v1 CSS class
- [x] P5.3 Message bubbles: peach gradient mine, bordered bg2 peer (DM, DirectDM, GroupChat)
- [ ] P5.4 Gradient fade 180px on heroes (SessionPage, JoinPage)
- [x] P5.5 OrbLayer fixes: removed from inside .map() loops (SessionPage, GroupChat, HostDashboard)
- [x] P5.6 ArrowLeft SVG on all back buttons
- [x] P5.7 Avatar radius: all 50% (circular)
- [x] P5.8 All old hex colors replaced with brand tokens
- [ ] P5.9 Skeleton loaders with brand tokens
- [ ] P5.10 Hero font sizes: ensure Bricolage Grotesque 800 on all h1

## REMAINING NICE-TO-HAVES
- [ ] SessionPage: story bars in hero, member avatar rings
- [ ] JoinPage: host row with online dot, download banner
- [ ] HostDashboard: arrival stats redesign
- [ ] MePage: VibeScore card redesign
- [ ] ExplorePage: profile card redesign
- [ ] All pages: gradient fade on heroes (180px)
