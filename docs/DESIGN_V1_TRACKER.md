# DESIGN V1 — TRACKER DE PROGRESSION
## Dernière mise à jour: 19 Mars 2026

---

## FONDATIONS (DONE ✅)
- [x] brand.ts: peach #E0887A, Plus Jakarta Sans + Bricolage Grotesque
- [x] index.css: CSS variables V1, keyframes, fonts
- [x] OrbLayer: 3 orbs peach/lav/sage, blur 60px
- [x] BottomNav: 4 tabs (Plans/Discover/Book/Moi), height 64px, blur, SVG icons
- [x] index.html: Google Fonts link
- [x] Tous les vieux hex remplacés (#F9A8A8, #2A2740, #F07858 → brand tokens)
- [x] Tous les borderRadius 28% → 50%
- [x] Tous les spinners Tailwind → brand tokens
- [x] Tous les ← text → ArrowLeft SVG
- [x] Blur backdrop sur tous les headers
- [x] OrbLayer sur toutes les pages (27/29, 2 dev-only)

## EN COURS
- [x] EventContextNav component créé
- [x] EventContextNav intégré dans SessionPage
- [ ] DS-01: BottomNav masqué dans les events
- [ ] DS-02: EventContextNav dans toutes les pages event

## TODO — par priorité

### P0 — Critique (change la sensation de l'app)
- [ ] DS-01: BottomNav masqué quand /session/:id/* (sauf /sessions)
- [ ] DS-02: EventContextNav dans HostDashboard, DMPage, GroupChatPage, ApplyPage
- [ ] DS-03: HomePage redesign — hero Bricolage Grotesque, quick nav révisé
- [ ] DS-09: Font Bricolage Grotesque sur TOUS les titres hero/title

### P1 — Important
- [ ] DS-04: SessionPage event landing redesign (hero 330px, story bars, avatars rings)
- [ ] DS-05: HostDashboard redesign (banner compact, cards candidats, vote pill)
- [ ] DS-06: Shimmer CTA sur boutons principaux (Postuler, Accepter, Créer, Check-in)
- [ ] DS-07: Input styling global (bg2, border rule, placeholder tx4)

### P2 — Polish
- [ ] DS-08: Gradient fade hero 180px sur SessionPage, JoinPage, PublicProfile, LoginPage
- [ ] DS-10: Audit final (0 emoji UI, 0 hardcoded hex, OrbLayer positions)
- [ ] Fix OrbLayer inside .map() in SessionPage (line ~693)
- [ ] Message bubble consistency check across 3 chat pages

---

## COMMITS RÉCENTS
- db1fef3 — BREAKING: peach #E0887A, BottomNav 4 tabs, fonts
- bac5a62 — message bubble polish + OrbLayer fixes
- b03383c — blur headers all pages + emoji cleanup
- ad84c1f — DMPage OrbLayer fix, SessionsPage S.red fix
- 259ee02 — ArrowLeft icons, spinners, HostDashboard blur
- fc9c51b — full token + emoji sweep 14 files
