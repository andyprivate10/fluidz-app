{\rtf1\ansi\ansicpg1252\cocoartf2759
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 ---\
name: oiloil-ui-ux-guide\
description: Modern, clean UI/UX guidance and design review for web/app interfaces. Use when you need UX recommendations, design principles, or reviewing existing UI (screenshots, mockups, HTML). Focus on visual hierarchy, task-first UX, feedback states, consistency, and error prevention. Enforce minimal style (spacious, typography-led) and forbid emoji as icons.\
---\
\
# OilOil UI/UX Guide (Modern Minimal)\
\
Use this skill in two modes:\
\
- `guide`: Provide compact principles and concrete do/don't rules for modern clean UI/UX.\
- `review`: Review an existing UI (screenshot / mock / HTML / PR) and output prioritized, actionable fixes.\
\
Keep outputs concise. Prefer bullets, not long paragraphs.\
\
## Workflow (pick one)\
\
### 1) `guide` workflow\
1. Identify the surface: marketing page / dashboard / settings / creation flow / list-detail / form.\
2. Identify the primary user task and primary CTA.\
3. Apply the system-level guiding principles first (mental model and interaction logic).\
4. Then apply the core principles below (start from UX, then refine with CRAP).\
5. If icons are involved: apply `references/icons.md`.\
\
### 2) `review` workflow\
1. State assumptions (platform, target user, primary task).\
2. List findings as `P0/P1/P2` (blocker / important / polish) with short evidence.\
3. For each major issue, label the diagnosis: execution vs evaluation gulf; slip vs mistake (see `references/design-psych.md`).\
4. Propose fixes that are implementable (layout, hierarchy, components, copy, states).\
5. End with a short checklist to verify changes.\
\
Use `references/review-template.md` when you need a stable output format.\
\
## Non-negotiables (hard rules)\
- No emoji used as icons (or as UI decoration). If an emoji appears, replace it with a proper icon.\
- Icons must be intuitive and refined. Use a single consistent icon set for the product (avoid mixing styles).\
- Minimize copy by default. Add explanatory text only when it prevents errors, reduces ambiguity, or improves trust.\
\
## System-Level Guiding Principles\
\
Apply these as first-order constraints before choosing components or page patterns.\
Full definitions and review questions: `references/system-principles.md`.\
\
Key principles: concept constancy \'b7 primary task focus \'b7 UI copy source discipline \'b7 state perceptibility \'b7 help text layering (L0\'96L3) \'b7 feedback loop closure \'b7 prevention + recoverability \'b7 progressive complexity \'b7 action perceptibility \'b7 cognitive load budget \'b7 evolution with semantic continuity.\
\
## Core Principles (minimal set)\
\
### A) Task-first UX\
- Make the primary task obvious in <3 seconds.\
- Allow exactly one primary CTA per screen/section.\
- Optimize the happy path; hide advanced controls behind progressive disclosure.\
\
### B) Information architecture (grouping & findability)\
- Group by user mental model (goal/object/time/status), not by backend fields.\
- Use clear section titles; keep navigation patterns stable across similar screens.\
- When item count grows: add search/filter/sort early, not late.\
\
### C) Feedback & system status\
- Cover all states: loading, empty, error, success, permission. Details in `references/checklists.md`.\
- After any action, answer: "did it work?" + "what changed?" + "what can I do next?"\
- Prefer inline, contextual feedback over global toasts (except for cross-page actions).\
\
### D) Consistency & predictability\
- Same interaction = same component + same wording + same placement.\
- Use a small, stable set of component variants; avoid one-off styles.\
\
### E) Affordance + Signifiers (make actions obvious)\
- Clickable things must look clickable (button/link styling + hover/focus + cursor). On web, custom clickable elements need `cursor: pointer` and focus styles.\
- Primary actions need a label; icon-only is reserved for universally-known actions.\
- Show constraints before submit (format, units, required), not only after errors.\
- For deeper theory (affordances, signifiers, mapping, constraints): see `references/design-psych.md`.\
\
### F) Error prevention & recovery\
- Prevent errors with constraints, defaults, and inline validation.\
- Make destructive actions reversible when possible; otherwise require deliberate confirmation.\
- Error messages must be actionable (what happened + how to fix).\
\
### G) Cognitive load control\
- Reduce choices: sensible defaults, presets, and progressive disclosure.\
- Break long tasks into steps only when it reduces thinking (not just to look "enterprise").\
- Keep visual noise low: fewer borders, fewer colors, fewer competing highlights.\
\
### H) CRAP (visual hierarchy & layout)\
- Contrast: emphasize the few things that matter (CTA, current state, key numbers).\
- Repetition: tokens/components/spacing follow a scale; avoid "almost the same" styles.\
- Alignment: align to a clear grid; fix 2px drift; align baselines where text matters.\
- Proximity: tight within a group, loose between groups; spacing is the primary grouping tool.\
\
## Spacing & layout discipline (compact rule set)\
\
Use this when implementing or reviewing layouts. Keep it short, but enforce it strictly.\
\
- Rule 1 - One spacing scale:\
  - Base unit: 4px.\
  - Allowed spacing set (recommended): 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48.\
  - New gaps/padding should use this set; off-scale values need a clear reason.\
- Rule 2 - Repetition first:\
  - Same component type keeps the same internal spacing (cards, list rows, form groups, section blocks).\
  - Components with the same visual role should not have different spacing patterns.\
- Rule 3 - Alignment + grouping:\
  - Align to one grid and fix 1-2px drift.\
  - Tight spacing within a group, looser spacing between groups.\
- Rule 4 - No decorative nesting:\
  - Extra wrappers must add real function (grouping, state, scroll, affordance).\
  - If a wrapper only adds border/background, remove it and group with spacing instead.\
- Quick review pass:\
  - Any off-scale spacing values?\
  - Any baseline/edge misalignment?\
  - Any wrapper layer removable without losing meaning?\
\
## Modern minimal style guidance (taste with rules)\
- Use whitespace + typography to create hierarchy; avoid decoration-first design.\
- Prefer subtle surfaces (light elevation, low-contrast borders). Avoid heavy shadows.\
- Keep color palette small; use one accent color for primary actions and key states.\
- Copy: short, direct labels; add helper text only when it reduces mistakes or increases trust.\
\
## Motion (animation) guidance (content/creator-friendly, not flashy)\
- Motion explains **hierarchy** (what is a layer/panel) and **state change** (what just happened). Avoid motion as decoration.\
- Default motion vocabulary: fade; then small translate+fade; allow tiny scale+fade for overlays. Avoid big bouncy motion.\
- Keep the canvas/content area stable. Panels/overlays can move; the work surface should not "float."\
- Prefer consistency over variety: same component type uses the same motion pattern.\
- Avoid layout jumps. Use placeholders/skeletons to keep layout stable while loading.\
\
## Anti-AI Defaults (\uc0\u24378 \u21046 \u32422 \u26463 )\
\
AI \uc0\u29983 \u25104  UI \u26102 \u26377 \u22266 \u23450 \u20542 \u21521 \u12290 \u20197 \u19979 \u26159 \u21453 \u27169 \u24335 \u28165 \u21333 \u65292 \u36829 \u21453 \u24517 \u39035 \u20462 \u22797 \u12290 \
\
### \uc0\u23383 \u20307 \
- \uc0\u10060  **\u31105 \u27490 **: Inter, Roboto, Arial, Open Sans, system-ui\
- \uc0\u9989  **\u25512 \u33616 **: Plus Jakarta Sans, Outfit, Manrope, DM Sans, Geist\
\
### \uc0\u39068 \u33394 \
- \uc0\u10060  **\u31105 \u27490 **:\
  - \uc0\u32431 \u40657  `#000`, \u32431 \u30333  `#fff`, \u32431 \u28784  `#888`\
  - \uc0\u22312 \u26377 \u33394 \u32972 \u26223 \u19978 \u20351 \u29992 \u28784 \u33394 \u25991 \u23383 \
  - purple-to-blue \uc0\u28176 \u21464 , cyan-on-dark\
  - `#6366f1` (generic indigo)\
- \uc0\u9989  **\u25512 \u33616 **:\
  - **Tinted neutrals**: \uc0\u32473 \u25152 \u26377 \u28784 \u33394 \u28155 \u21152 \u21697 \u29260 \u33394 \u35843  (\u20363 : \u21697 \u29260 \u33394  `#0066cc` \u8594  \u28784 \u33394 \u29992  `#1a2a3a` \u32780 \u38750  `#333`)\
  - **OKLCH \uc0\u33394 \u24425 \u31354 \u38388 **: \u26367 \u20195  HSL\u65292 \u24863 \u30693 \u22343 \u21248 \u65292 \u35843 \u25972 \u26126 \u24230 /\u24425 \u24230 \u26102 \u26356 \u33258 \u28982 \
  - \uc0\u28145 \u33394 \u27169 \u24335 \u38656 \u35201 \u26356 \u39640 \u30340 \u23545 \u27604 \u24230 \u21644 \u24425 \u24230 \u65292 \u19981 \u26159 \u31616 \u21333 \u21453 \u36716 \
\
### \uc0\u24067 \u23616 \
- \uc0\u10060  **\u31105 \u27490 **:\
  - \uc0\u25152 \u26377 \u20869 \u23481 \u21253 \u22312 \u21345 \u29255 \u37324 \
  - \uc0\u21345 \u29255 \u23884 \u22871 \u21345 \u29255 \
  - \uc0\u30456 \u21516 \u30340  3 \u21015 \u21345 \u29255 \u32593 \u26684 \
  - \uc0\u22278 \u35282 \u36807 \u22823  (>12px) \u30340  "pill" \u39118 \u26684 \
- \uc0\u9989  **\u25512 \u33616 **:\
  - \uc0\u29992 \u30041 \u30333 \u21644 \u25490 \u29256 \u24314 \u31435 \u23618 \u27425 \u65292 \u32780 \u38750 \u36793 \u26694 /\u21345 \u29255 \
  - \uc0\u21345 \u29255 \u21482 \u29992 \u20110 \u30495 \u27491 \u38656 \u35201 \u20998 \u32452 \u30340 \u20869 \u23481 \
  - \uc0\u32593 \u26684 \u24067 \u23616 \u20351 \u29992  `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`\
\
### \uc0\u21160 \u25928 \
- \uc0\u10060  **\u31105 \u27490 **: bounce/easing, \u20837 \u22330 \u21160 \u30011 \u36807 \u22810 , \u35013 \u39280 \u24615 \u25345 \u32493 \u21160 \u30011 \
- \uc0\u9989  **\u25512 \u33616 **: fade \u8594  translate+fade \u8594  scale+fade (\u20165  overlay)\
\
### \uc0\u22270 \u26631 \
- \uc0\u10060  **\u31105 \u27490 **: emoji \u20316 \u20026 \u22270 \u26631 , \u28151 \u21512 \u22810 \u31181 \u22270 \u26631 \u39118 \u26684 \
- \uc0\u9989  **\u25512 \u33616 **: Lucide, Phosphor, Heroicons \u31561 \u29616 \u20195 \u22270 \u26631 \u24211 \
\
---\
\
## Bold Typography (\uc0\u22823 \u32966 \u25490 \u29256 )\
\
AI \uc0\u29983 \u25104 \u30340  UI \u20542 \u21521 \u20110 "\u23433 \u20840 "\u30340 \u24067 \u23616 \'97\'97\u23621 \u20013 \u23545 \u40784 \u12289 \u22343 \u21248 \u32593 \u26684 \u12289 \u21487 \u39044 \u27979 \u30340 \u23618 \u27425 \u12290 \u40723 \u21169 \u25506 \u32034 \u26356 \u26377 \u20010 \u24615 \u30340 \u25490 \u29256 \u26041 \u21521 \u12290 \
\
### \uc0\u21407 \u21017 \
- **\uc0\u25490 \u29256 \u21363 \u35013 \u39280 **: \u29992 \u23383 \u20307 \u22823 \u23567 /\u31895 \u32454 /\u20301 \u32622 \u30340 \u23545 \u27604 \u20195 \u26367 \u36793 \u26694 /\u38452 \u24433 /\u21345 \u29255 \
- **\uc0\u30041 \u30333 \u26159 \u35774 \u35745 \u20803 \u32032 **: \u22823 \u38754 \u31215 \u30041 \u30333 \u26412 \u36523 \u23601 \u26159 \u35270 \u35273 \u35821 \u35328 \
- **\uc0\u19981 \u23545 \u31216 \u21487 \u20197 \u21019 \u36896 \u21160 \u24577 \u24863 **: \u20445 \u25345 \u35270 \u35273 \u37325 \u37327 \u24179 \u34913 \u30340 \u21069 \u25552 \u19979 \
- **\uc0\u19968 \u20010 \u28966 \u28857 \u23601 \u22815 \u20102 **: \u35753 \u20851 \u38190 \u20803 \u32032 \u31361 \u20986 \u65292 \u20854 \u20182 \u33258 \u28982 \u36864 \u21518 \
- **\uc0\u32593 \u26684 \u26159 \u24037 \u20855 \u19981 \u26159 \u35268 \u21017 **: \u24517 \u35201 \u26102 \u25171 \u30772 \u65292 \u20294 \u35201 \u26377 \u24847 \u22270 \
\
### \uc0\u20309 \u26102 \u22823 \u32966 \
Marketing \uc0\u39029 \u38754 \u12289 \u20135 \u21697 \u20171 \u32461 \u12289 Landing page\u12289 Hero \u21306 \u22495 \u12289 \u20316 \u21697 \u23637 \u31034 \'97\'97\u38656 \u35201 \u21560 \u24341 \u27880 \u24847 \u21147 \u12289 \u20256 \u36882 \u21697 \u29260 \u20010 \u24615 \u30340 \u22330 \u26223 \u12290 \
\
### \uc0\u20309 \u26102 \u20811 \u21046 \
\uc0\u34920 \u21333 \u22635 \u20889 \u12289 \u25968 \u25454 \u24405 \u20837 \u12289 \u22797 \u26434 \u25805 \u20316 \u27969 \u31243 \u12289 \u38656 \u35201 \u24555 \u36895 \u25195 \u25551 \u30340 \u21015 \u34920 \'97\'97\u25928 \u29575 \u21644 \u28165 \u26224 \u24230 \u20248 \u20808 \u30340 \u22330 \u26223 \u12290 \
\
---\
\
## Anti-AI Self-Check (\uc0\u29983 \u25104 \u21518 \u24517 \u26597 )\
\
- **Gradient restraint** \'97 \uc0\u35013 \u39280 \u24615 \u28176 \u21464 \u27599 \u39029 \u26368 \u22810  1 \u20010 \u12290 \u32972 \u26223 \u12289 \u25353 \u38062 \u12289 \u36793 \u26694 \u21516 \u26102 \u29992 \u28176 \u21464  = \u36807 \u24230 \u12290 \
- **No emoji as UI** \'97 \uc0\u26816 \u26597  section icons\u12289 \u29366 \u24577 \u25351 \u31034 \u12289 \u25353 \u38062 \u26631 \u31614 \u26159 \u21542 \u28151 \u20837  emoji\u12290 \
- **Copy necessity** \'97 \uc0\u21024 \u38500 \u36825 \u27573 \u25991 \u23383 \u21518 \u65292 \u29992 \u25143 \u33021 \u36890 \u36807 \u24067 \u23616 /\u22270 \u26631 /\u20301 \u32622 \u29702 \u35299 \u21527 \u65311 \u33021  \u8594  \u21024 \u38500 \u12290 \
- **Decoration justification** \'97 \uc0\u27599 \u20010 \u35270 \u35273 \u29305 \u25928  (blur/glow/\u21160 \u30011 ) \u24517 \u39035 \u22238 \u31572 \u65306 "\u24110 \u21161 \u29992 \u25143 \u29702 \u35299 \u20160 \u20040 \u65311 " \u26080 \u31572 \u26696  \u8594  \u21024 \u38500 \u12290 \
- **Font check** \'97 \uc0\u26159 \u21542 \u20351 \u29992 \u20102  Inter/Roboto\u65311 \u26367 \u25442 \u20026  Plus Jakarta Sans/Outfit/Manrope\u12290 \
- **Color check** \'97 \uc0\u26159 \u21542 \u26377 \u32431 \u40657 \u32431 \u30333 \u32431 \u28784 \u65311 \u26159 \u21542 \u22312 \u24425 \u33394 \u32972 \u26223 \u19978 \u29992 \u28784 \u33394 \u25991 \u23383 \u65311 \u28155 \u21152 \u33394 \u35843 \u12290 \
\
## References\
- System-level guiding principles (concept constancy, copy discipline, state perceptibility, etc.): `references/system-principles.md`\
- Interaction psychology (Fitts/Hick/Miller, cognitive biases, flow, attention): `references/interaction-psychology.md`\
- Design psychology (affordances, signifiers, mapping, constraints, gulfs, slips vs mistakes): `references/design-psych.md`\
- Icon rules and "intuitive refined" guidance: `references/icons.md`\
- Review output template and scoring: `references/review-template.md`\
- Expanded checklists (states, affordance, lists, forms, settings, motion, dashboards, copy): `references/checklists.md`\
}