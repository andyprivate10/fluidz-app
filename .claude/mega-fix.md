# FLUIDZ — MEGA IMPLEMENTATION: Social flows + Seed + E2E
# Read .claude/CLAUDE.md, .claude/ux-social-spec.md, .claude/social-interactions.md

## ═══ PHASE 1: SEED COMPLETE TEST DATA ═══

### Create 10 test users with complete profiles via Node script:
- Marcus (Host, Versatile, 32) — ALREADY SEEDED
- Karim (Bottom, 28) — ALREADY SEEDED  
- Yann (Top, 25) — ALREADY SEEDED
- Create 7 more auth users: lucas@, amine@, theo@, romain@, samir@, alex@, jules@fluidz.test
- All password: testpass123
- Each with: role, bio, photos (picsum), kinks, health, dm_privacy

### Create test sessions in various states:
- Session 1: "Plan ce soir" by Marcus — status OPEN, 3 members accepted, 2 pending candidates
- Session 2: "After chill" by Marcus — status ENDED, 4 members, reviews pending
- Session 3: "Session Cuddle" by Karim — status OPEN, 1 member, template cuddle

### Create test applications in all statuses:
- pending, under_review, accepted, rejected, checked_in

### Create test contacts (NaughtyBook):
- Marcus ↔ Karim: mutual (NaughtyBook bidirectionnel)
- Marcus → Yann: pending NB request
- Karim has notes on Marcus: "Super host, toujours safe"

### Create test notifications:
- Marcus: 3 unread (new application, check-in, DM)
- Karim: 2 unread (accepted, NB request)

### Create test DM threads:
- Marcus ↔ Karim: 5 messages (with safety tip)
- Marcus ↔ Yann: 2 messages (locked — interest sent but not accepted)

## ═══ PHASE 2: SESSION LIFECYCLE ═══

### Session end_time field:
- Add end_time timestamptz to sessions table if missing
- Host can modify end_time (extend session)
- 30min before end: create notification for host "Prolonger ou terminer ?"
- Auto-close at end_time if no action
- Status transitions: open → ending_soon → ended

### Post-session review:
- Create review_queue entries 15min after session ends
- Review page: swipe through each member, rate VibeScore, select intents
- Optional — can skip, notification reminder after 24h

## ═══ PHASE 3: SESSION STORY ═══

### Story collection:
- When member is accepted, their shared_sections content feeds into session story
- Story = aggregation of all accepted members' Candidate Pack photos/videos
- Invited candidates see Story automatically
- Non-invited candidates: host grants access via DM toggle button

### UI:
- Session page: "Story" tab in SessionBottomNav (between Participants and Share)
- Gallery view: grid of all shared photos/videos from members
- Each photo links to the member's profile

## ═══ PHASE 4: VOTE UX ═══

### Vote flow for members:
- New candidate notification → member sees Candidate Pack
- Vote: thumbs up / thumbs down (no text, just vote)
- Votes appear in real-time for host
- Host sees vote tally: "3 ✓ / 1 ✗"
- If host accepts against majority: orange warning "La majorité a voté contre"
- Candidate NEVER sees individual votes — only final decision

## ═══ PHASE 5: NOTIFICATION SYSTEM ═══

### Header bell icon:
- Add bell icon in top-right of all pages (next to menu hamburger)
- Badge count of unread notifications
- Tapping opens /notifications page
- Grouped: "3 nouvelles candidatures sur Plan ce soir"
- Individual: DMs, NB requests

### Badge on BottomNav Chats:
- Count of unread DM messages
- Red dot, not number (keep it subtle)

## ═══ PHASE 6: NAUGHTYBOOK COMPLETE ═══

### ContactsPage redesign:
- Pending NB requests section at top (accept/reject)
- Contact list with: avatar, name, role, last seen, mutual badge
- Notes privées: tap to add/edit (textarea)
- History: "2 sessions partagées · Dernier échange il y a 3j"
- Filters: role, distance, tribes, kinks (same as Explore)

### Interaction from NaughtyBook:
- Tap contact → profile view with NB-only sections visible
- "Envoyer un message" button (DM libre for mutual)
- "Inviter en session" button → list open sessions
- "Retirer du NaughtyBook" in menu ⋮

## ═══ EXECUTION ═══
1. Phase 1 (Seed) — create Node script, run, verify
2. Phase 2 (Session lifecycle) — end_time, auto-close, review
3. Phase 3 (Story) — collection, UI tab, access control
4. Phase 4 (Vote UX) — real-time, tally, warning
5. Phase 5 (Notifications) — bell icon, badges, grouping
6. Phase 6 (NaughtyBook) — pending requests, notes, filters, history

Build and push after each phase. Go.
