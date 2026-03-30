# FLUIDZ — MEGA UX FEEDBACK (30 Mars user testing)
# Execute ALL items. Read .claude/CLAUDE.md first for project rules.

## ═══ A. HOME PAGE ═══

### A1. Add "Créer une session" button on HomePage
- Prominent CTA button, gradient peach, always visible
- Should be near the top or floating at bottom
- Navigate to /sessions/create

### A2. Restore "Activity" section showing recent interactions
- Show recent notifications/activity summary
- Not just "Nouvelle candidature" repeated — use i18n type keys

### A3. "Compléter mon profil" → navigate directly to editable profile
- Should go to /me in EDIT mode, not a read-only view
- No need to re-click "voir mon profil" — land directly on editable sections

## ═══ B. PROFILE (MePage) — MAJOR RESTRUCTURE ═══

### B1. Two tabs: "Profil" (non-adult) and "Adulte" (adult/intimate)
- Add tab switcher at top of MePage
- Non-adult tab: Basics, Physique, Morphologie, Ethnicité, Profils liés
- Adult tab: Rôle, Pratiques/Kinks, Photos intimes, Santé, Limites

### B2. Remove sections from profile → relocate
- "Mes types" + "Mes préférences" → become SAVED FILTERS in Explore search
- "Confidentialité DM" → move to new Settings/Privacy page (with "visible dans galerie")
- "Messages sauvegardés" → move to a "Templates" page/menu
- "Supprimer mon compte" → move to Settings/Privacy page
- "Profils liés" → move to NaughtyBook page
- VibeScore detail → move to its own page in menu (explanations + how to improve)

### B3. VibeScore at top of profile
- Show ONLY the final score number at top (no breakdown)
- VibeScore detail becomes a separate page accessible from menu

### B4. Pseudo appears FIRST
- display_name is the minimum required field
- Show it prominently at top before any other section

### B5. Section visibility slider
- Each section gets a toggle: "Visible par tous" vs "NaughtyBook seulement"
- Visual slider/switch on each section header

## ═══ C. SPECIFIC SECTION FIXES ═══

### C1. Morphologie: buttons with icons instead of dropdown
- Replace select/dropdown with clickable button grid
- Each morphology option has an icon: Mince, Sportif, Athlétique, Moyen, Costaud, Musclé
- Single select (only one active at a time)

### C2. Ethnicités: multi-select with ALL ethnicities
- Make clear visually that multiple can be selected (checkboxes or multi-select pills)
- Ensure comprehensive list of ethnicities is represented
- Show "Plusieurs choix possibles" hint

### C3. Kinks: remove 3-max limit
- Allow unlimited kink selection
- No cap on number of selected kinks

### C4. Santé section redesign
- "Ajouter un test récent" CTA button
- Upload photo of test result as proof
- Date picker for test date
- Multi-select list of diseases tested: Chlamydia, VIH/HIV, Syphilis, Gonorrhée, Hépatite B, Hépatite C, HPV, etc.
- Status per pathology: Négatif / Positif / En attente
- PrEP status remains

### C5. Photos intimes (adult zone) redesign
- Add "Dos" (back) body part — currently missing
- Add icons in the middle of each body zone section
- Drop zone for photo should fill the ENTIRE card/case
- All expected body parts: Face, Torse, Dos, Fesses, Pénis, Corps entier

### C6. Limites section → moves to Adult tab
- Currently in general profile, should be in Adult tab

### C7. Profils liés redesign
- REMOVE: Grindr, Scruff, and all gay-specific apps
- KEEP ONLY: Instagram, TikTok, X/Twitter, OnlyFans, Autre
- Include platform LOGOS (use lucide-react icons or SVG)
- Include URL input field for each platform linking to user's profile page
- This section moves to NaughtyBook (not profile)

## ═══ EXECUTION ORDER ═══
1. Fix HomePage (A1, A2, A3)
2. Add profile tabs (B1)
3. Relocate sections (B2)
4. Fix VibeScore display (B3)
5. Fix pseudo first (B4)
6. Add visibility toggles (B5)
7. Fix morphologie buttons (C1)
8. Fix ethnicités multi-select (C2)
9. Remove kinks limit (C3)
10. Redesign santé (C4)
11. Redesign photos intimes (C5)
12. Move limites (C6)
13. Redesign profils liés (C7)
14. Build with 0 errors
15. Push

## RULES
- Use i18n for ALL text
- Use S.xxx color tokens from brand.ts
- Mobile-first (390px width)
- Don't break existing functionality
