FLUIDZ — LANDING PAGE REBUILD (MARKETING + i18n)
==================================================
Read .claude/CLAUDE.md first for project rules.

The landing page needs to be rebuilt with the ORIGINAL marketing content
from the old landing.html. Run this to get it:
git show c672c95:public/landing.html > /tmp/old_landing.html

Read /tmp/old_landing.html COMPLETELY. Extract ALL marketing copy.

Then rebuild src/pages/LandingPage.tsx with:

1. ENGLISH PRIMARY — all text in i18n (en.json primary, fr.json translated)
2. Language switcher (globe icon in top bar, toggles EN/FR)
3. Sticky top bar: "fluidz" logo, menu links (Features, How it works, Pro), language switcher, "Open App" button
4. Mobile: hamburger menu with slide-out drawer

SECTIONS (merge old + new):
A. Hero — badge "Currently invite-only", H1 "Manage adult relationships",
   subtitle "Let's exchange fluidz", invite code input, CTA buttons
B. Philosophy — "Because modern relationships are fluid..."
C. Killer Feature 1 — Sessions (keep current mini preview card)
D. Killer Feature 2 — VibeScore (keep current mini profile card)
E. What Fluidz Does — 6 feature cards from old landing
F. How It Works — 4 steps with timeline
G. Differentiators — 4 cards (no phone, protected address, modular profile, no WhatsApp)
H. Preview — "Designed for intimacy" + app mockup cards
I. Pro section — "Organizing events?" + Fluidz Pro CTA
J. Early access — email input + "Request your invite"
K. Footer — links + "Made for the queer community. Paris, 2026."

STANDALONE PAGE — no bottom nav bar, no OrbLayer, no app shell.
Own design with animated orb backgrounds, scroll reveal animations.
Mobile-first responsive. Dark theme from brand.ts.

Split into components:
- src/pages/LandingPage.tsx (main)
- src/components/landing/LandingNav.tsx (sticky top bar + mobile menu)
- src/components/landing/LandingHero.tsx
- src/components/landing/LandingFeatures.tsx
- src/components/landing/LandingHowItWorks.tsx
- src/components/landing/LandingPro.tsx
- src/components/landing/LandingFooter.tsx

Add ALL i18n keys under "landing" namespace in both en.json and fr.json.

Keep existing invite code handling (handleInvite function).
Keep existing CTA routes (/login, /login?signup=1).

npm run build && git add -A && git commit -m "feat: landing page — full marketing + i18n + language switcher" && git push
