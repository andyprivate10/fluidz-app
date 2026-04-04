#!/usr/bin/env python3
"""Fix all remaining head: true queries in Supabase calls."""
import re, os, glob

# Pattern: .select('X', { count: 'exact', head: true }) → .select('id').limit(N)
# Also handles .select("X", { count: "exact", head: true })

files_to_fix = [
    '/Users/sidneyrubinsztejn/fluidz-app/src/hooks/useHomeData.ts',
]
# Find admin files
admin_files = glob.glob('/Users/sidneyrubinsztejn/fluidz-app/src/components/admin/*.tsx')
files_to_fix.extend(admin_files)

total_fixed = 0

for fpath in files_to_fix:
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: .select('*', { count: 'exact', head: true }) → .select('id').limit(200)
    content = re.sub(
        r"\.select\(['\"]?\*['\"]?,\s*\{\s*count:\s*['\"]exact['\"],\s*head:\s*true\s*\}\)",
        ".select('id').limit(200)",
        content
    )
    
    # Pattern 2: .select('id', { count: 'exact', head: true }) → .select('id').limit(200)
    content = re.sub(
        r"\.select\(['\"]id['\"],\s*\{\s*count:\s*['\"]exact['\"],\s*head:\s*true\s*\}\)",
        ".select('id').limit(200)",
        content
    )
    
    # Pattern 3: { count: 'exact', head: true } inline variant
    content = re.sub(
        r"\.select\(['\"]([^'\"]*)['\"],\s*\{\s*head:\s*true,\s*count:\s*['\"]exact['\"]?\s*\}\)",
        ".select('id').limit(200)",
        content
    )
    
    # Fix count usage: ({ count }) → ({ data }) and count ?? 0 → data?.length ?? 0
    # This is trickier — do targeted replacements
    if content != original:
        # Replace .then(({ count }) with .then(({ data })
        content = re.sub(r'\.then\(\(\{\s*count\s*\}\)', '.then(({ data })', content)
        # Replace count ?? 0 → data?.length ?? 0 (only in then chains)  
        # Be careful not to replace all count references
        content = re.sub(r'\(count\s*\?\?\s*0\)', '(data?.length ?? 0)', content)
        content = re.sub(r'\bcount\s*\?\?\s*0\b', 'data?.length ?? 0', content)
        content = re.sub(r'\(count\s*\|\|\s*0\)', '(data?.length ?? 0)', content)
        content = re.sub(r'\bcount\s*\|\|\s*0\b', 'data?.length ?? 0', content)
        # count > 0 → (data?.length ?? 0) > 0
        content = re.sub(r'(?<!\w)count\s*>', '(data?.length ?? 0) >', content)
        # !count → !data?.length
        content = re.sub(r'!count\b', '!data?.length', content)
        # count === 0 → (data?.length ?? 0) === 0
        content = re.sub(r'(?<!\w)count\s*===\s*0', '(data?.length ?? 0) === 0', content)

        fixed = sum(1 for a, b in zip(original, content) if a != b)
        print(f'Fixed {fpath.split("/")[-1]} ({original.count("head: true")} → 0 head queries)')
        total_fixed += 1
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f'No changes: {fpath.split("/")[-1]}')

print(f'\nTotal files fixed: {total_fixed}')
