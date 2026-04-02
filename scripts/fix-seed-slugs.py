#!/usr/bin/env python3
"""Fix slugs in seed-demo-explore.mjs to match i18n keys."""

import re

with open('scripts/seed-demo-explore.mjs', 'r', encoding='utf-8') as f:
    src = f.read()

# ── Ethnicity slugs → i18n slugs ────────────────────────────────────────────
eth_map = {
    "caucasian":      "blanc",
    "middle_eastern": "moyen_oriental",
    "black_african":  "noir",
    "east_asian":     "asiatique",
    "southeast_asian":"asiatique",
    "south_asian":    "sud_asiatique",
    "mixed":          "metis",
    # latino stays as-is, metis stays as-is
}
for old, new in eth_map.items():
    src = src.replace(f"eth: '{old}'", f"eth: '{new}'")

# ── Tribe slugs ──────────────────────────────────────────────────────────────
src = src.replace("'muscle'", "'muscle_bear'")
src = src.replace("'drag'",   "'drag_queen'")

# ── Kinks: english → French display values ───────────────────────────────────
kink_map = {
    "'kissing'":    "'Câlins'",
    "'cuddling'":   "'Câlins'",
    "'oral'":       "'Rimming'",
    "'domination'": "'Dominant'",
    "'bondage'":    "'Menottes'",
    "'role_play'":  "'Jeux de rôle'",
    "'massage'":    "'Massage'",
    "'leather'":    "'Cuir'",
    "'fisting'":    "'Fist'",
    "'spanking'":   "'Spanking'",
    "'group'":      "'Groupe'",
    "'puppy_play'": "'Switch'",
    "'toys'":       "'Exhib'",
}
for old, new in kink_map.items():
    src = src.replace(old, new)

# ── Deduplicate Câlins (kissing+cuddling both mapped to Câlins) ──────────────
# Pattern: ['Câlins','Câlins',...] → ['Câlins',...]
src = re.sub(r"'Câlins',\s*'Câlins'", "'Câlins'", src)

with open('scripts/seed-demo-explore.mjs', 'w', encoding='utf-8') as f:
    f.write(src)

print("Done — slugs corrected:")
print("  - Ethnicities: caucasian→blanc, middle_eastern→moyen_oriental, black_african→noir,")
print("                 east_asian→asiatique, southeast_asian→asiatique, south_asian→sud_asiatique")
print("  - Tribes: muscle→muscle_bear, drag→drag_queen")
print("  - Kinks: all english slugs → French display values")
