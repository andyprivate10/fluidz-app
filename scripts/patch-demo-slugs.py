#!/usr/bin/env python3
"""
Patch les slugs des 50 profils demo directement via SQL REST API.
Met à jour ethnicities, tribes et kinks dans profile_json.
"""
import json, re, urllib.request, urllib.error

SUPABASE_URL = "https://kxbrfjqxufvskcxmliak.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnJmanF4dWZ2c2tjeG1saWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY3ODQ2NiwiZXhwIjoyMDg4MjU0NDY2fQ.K_qpTfoA3N22k3fmgxj_SUX7yOiBjoTkMVZxmLv66Wk"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

ETH_MAP = {
    "caucasian":      "blanc",
    "middle_eastern": "moyen_oriental",
    "black_african":  "noir",
    "east_asian":     "asiatique",
    "southeast_asian":"asiatique",
    "south_asian":    "sud_asiatique",
    "mixed":          "metis",
}

TRIBE_MAP = {
    "muscle":    "muscle_bear",
    "drag":      "drag_queen",
    "gym_rat":   "jock",
    "normcore":  "geek_nerd",
    "pup":       "pup",
}

KINK_MAP = {
    "kissing":    "Câlins",
    "cuddling":   "Câlins",
    "oral":       "Rimming",
    "domination": "Dominant",
    "bondage":    "Menottes",
    "role_play":  "Jeux de rôle",
    "massage":    "Massage",
    "leather":    "Cuir",
    "fisting":    "Fist",
    "spanking":   "Spanking",
    "group":      "Groupe",
    "puppy_play": "Switch",
    "toys":       "Exhib",
}

def api_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def api_patch(endpoint, data, match_param):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}?{match_param}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method="PATCH")
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except urllib.error.HTTPError as e:
        print(f"    HTTP {e.code}: {e.read()}")
        return False

def fix_slugs(pj):
    changed = False
    # Ethnicities
    if isinstance(pj.get("ethnicities"), list):
        new_eth = [ETH_MAP.get(e, e) for e in pj["ethnicities"]]
        if new_eth != pj["ethnicities"]:
            pj["ethnicities"] = new_eth
            changed = True
    # Tribes
    if isinstance(pj.get("tribes"), list):
        new_tribes = list(dict.fromkeys(TRIBE_MAP.get(tr, tr) for tr in pj["tribes"]))
        if new_tribes != pj["tribes"]:
            pj["tribes"] = new_tribes
            changed = True
    # Kinks
    if isinstance(pj.get("kinks"), list):
        new_kinks = list(dict.fromkeys(KINK_MAP.get(k, k) for k in pj["kinks"]))
        if new_kinks != pj["kinks"]:
            pj["kinks"] = new_kinks
            changed = True
    return changed

# Fetch all demo profiles
print("\nFetching demo profiles from user_profiles...")
rows = api_get("user_profiles?display_name=like.demo*&select=id,display_name,profile_json&limit=200")

# Also fetch by checking emails via auth — get all profiles with demo_ email pattern via SQL
# Fallback: fetch ALL visible profiles and filter by display_name
if not rows:
    rows = api_get("user_profiles?select=id,display_name,profile_json&location_visible=eq.true&limit=200")

# Filter to demo profiles (those with home_city = Siquijor or display_name matches demo names)
DEMO_NAMES = {
    "Leo","Matteo","Rayan","Diego","Yuki","Theo","Alexis","Nathan","Hugo","Samir",
    "Kenji","Carlos","Felix","Amine","Luca","Brandon","Julien","Marco","Kevin","Tariq",
    "Jin","Roberto","Erwan","Milo","Serge","Noam","Axel","Sofiane","Remi","Paulo",
    "Arjun","Tristan","Sebastien","Bastien","Ryusei","Mehdi","Tom","Baptiste","Kwame",
    "Vincent","Rafael","Soren","Hamza","Cedric","Loris","TheoB","Damien","Ivan","Noa","Killian"
}

demo_rows = [r for r in rows if r.get("display_name") in DEMO_NAMES or
             (r.get("profile_json") or {}).get("home_city") == "Siquijor"]

print(f"Found {len(demo_rows)} demo profiles to patch.\n")

updated = 0
skipped = 0

for row in demo_rows:
    uid  = row["id"]
    name = row.get("display_name", "?")
    pj   = row.get("profile_json") or {}

    changed = fix_slugs(pj)

    if not changed:
        print(f"  - {name:12} (no change needed)")
        skipped += 1
        continue

    ok = api_patch("user_profiles", {"profile_json": pj}, f"id=eq.{uid}")
    if ok:
        eth = pj.get("ethnicities", [])
        tribes = pj.get("tribes", [])
        print(f"  ✓ {name:12} eth={eth} tribes={tribes}")
        updated += 1
    else:
        print(f"  ✗ {name:12} PATCH failed")
        skipped += 1

print(f"\nDone: {updated} updated, {skipped} skipped/unchanged.\n")
