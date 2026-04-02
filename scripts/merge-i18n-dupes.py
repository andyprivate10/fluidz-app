#!/usr/bin/env python3
"""
Merge duplicate top-level blocks in fr.json and en.json.
JSON parsers use the LAST occurrence, but we want ONE clean block
with ALL keys merged (first block keys + second block keys, second wins on conflict).
"""
import json, sys

for fname in ['src/i18n/fr.json', 'src/i18n/en.json']:
    with open(fname, 'r', encoding='utf-8') as f:
        raw = f.read()

    # Parse normally — Python uses last duplicate
    d = json.loads(raw)

    # Find duplicate keys by scanning raw JSON
    import re
    top_keys = re.findall(r'^\s+"([^"]+)"\s*:', raw, re.MULTILINE)
    seen = {}
    dupes = set()
    for k in top_keys:
        if k in seen:
            dupes.add(k)
        seen[k] = True

    if not dupes:
        print(f'{fname}: no duplicates found')
        continue

    print(f'{fname}: duplicate keys found: {dupes}')

    # For each duplicate key, we need to merge both occurrences
    # Strategy: parse JSON twice manually to get both versions
    # Use a custom approach: load with object_pairs_hook to collect all
    class MergeLoader:
        def __init__(self):
            self.all_blocks = {}

        def handler(self, pairs):
            result = {}
            for k, v in pairs:
                if k in result and isinstance(result[k], dict) and isinstance(v, dict):
                    # Merge dicts — second wins on conflict
                    merged = {**result[k], **v}
                    result[k] = merged
                else:
                    result[k] = v
            return result

    loader = MergeLoader()
    merged = json.loads(raw, object_pairs_hook=loader.handler)

    with open(fname, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f'{fname}: merged successfully. onboarding keys: {len(merged.get("onboarding", {}))}')

print('Done.')
