#!/usr/bin/env python3
import json

for lang, vals in [
    ('src/i18n/fr.json', {'invite_to_session': 'Inviter à une session', 'invite_to': 'Inviter à "{{title}}"'}),
    ('src/i18n/en.json', {'invite_to_session': 'Invite to a session',   'invite_to': 'Invite to "{{title}}"'}),
]:
    with open(lang, 'r', encoding='utf-8') as f:
        d = json.load(f)
    for k, v in vals.items():
        d.setdefault('contacts', {})[k] = v
    with open(lang, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f'{lang}: added invite_to_session + invite_to to contacts')
