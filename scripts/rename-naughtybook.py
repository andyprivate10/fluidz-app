#!/usr/bin/env python3
"""
Renommer NaughtyBook → Contacts partout dans l'app Fluidz.
- Clés i18n: naughty_book → contacts_section (dans fr.json/en.json)
- Labels texte: "NaughtyBook" → "Contacts", "Naughty Book" → "Contacts"
- Clés t(): 'drawer.naughty_book' → 'drawer.contacts_section'
             'home.naughty_book' → 'home.contacts_section'
             etc.
- NaughtyBookButton reste le nom du composant (interne, pas visible)
- Route /contacts inchangée
"""
import os, re, json

ROOT = '/Users/sidneyrubinsztejn/fluidz-app/src'

# 1. i18n JSON: renommer les clés naughty_book
for lang in ['fr', 'en']:
    path = f'/Users/sidneyrubinsztejn/fluidz-app/src/i18n/{lang}.json'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Renommer les clés JSON
    replacements = [
        ('"naughty_book"', '"contacts_section"'),
        ("naughty_book", "contacts_section"),
    ]
    for old, new in replacements:
        content = content.replace(old, new)

    # Mettre à jour les valeurs
    if lang == 'fr':
        val_replacements = [
            ('"NaughtyBook"', '"Contacts"'),
            ('"Mon NaughtyBook"', '"Mes Contacts"'),
            ('"Naughty Book"', '"Contacts"'),
            ('"naughtybook"', '"contacts"'),
        ]
    else:
        val_replacements = [
            ('"NaughtyBook"', '"Contacts"'),
            ('"My NaughtyBook"', '"My Contacts"'),
            ('"Naughty Book"', '"Contacts"'),
            ('"naughtybook"', '"contacts"'),
        ]
    for old, new in val_replacements:
        content = content.replace(old, new)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {lang}.json')

# 2. TSX/TS files: renommer les références t() et textes
ext_list = ['.tsx', '.ts']
skip_dirs = {'node_modules', '.git', 'dist'}

replacements_code = [
    # clés t()
    ("'home.naughty_book'", "'home.contacts_section'"),
    ('"home.naughty_book"', '"home.contacts_section"'),
    ("'drawer.naughty_book'", "'drawer.contacts_section'"),
    ('"drawer.naughty_book"', '"drawer.contacts_section"'),
    ("'contacts.naughty_book'", "'contacts.contacts_section'"),
    ("'tips.naughtybook_title'", "'tips.contacts_title'"),
    ("'tips.naughtybook_desc'", "'tips.contacts_desc'"),
    ("'naughtybook.", "'contacts_section."),
    ('"naughtybook.', '"contacts_section.'),
    # Textes visibles hardcodés (si restants)
    ('NaughtyBook', 'Contacts'),
    ('Naughty Book', 'Contacts'),
    ('naughtybook', 'contacts_section'),
    # Navigation labels
    ("t('drawer.naughty_book')", "t('drawer.contacts_section')"),
]

files_updated = []
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    for fname in files:
        if not any(fname.endswith(ext) for ext in ext_list):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        original = content
        for old, new in replacements_code:
            content = content.replace(old, new)
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            files_updated.append(fpath.replace(ROOT, 'src'))

print(f'Updated {len(files_updated)} source files:')
for f in files_updated:
    print(' ', f)

print('Done.')
