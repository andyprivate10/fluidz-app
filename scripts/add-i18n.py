#!/usr/bin/env python3
"""Add missing i18n keys to fr.json and en.json."""
import json, sys

KEYS = {
    "fr": {
        "me": {
            "tab_profil": "Profil",
            "tab_adulte": "Adulte",
            "pseudo_headline": "Ton pseudo",
            "pseudo_placeholder": "Comment on t'appelle ?",
            "avatar_label": "Avatar",
        },
        "placeholders": {
            "limits_placeholder": "Tes limites absolues : safe word, pratiques exclues...",
            "ghost_pseudo": "Comment on t'appelle ?",
        },
        "common": {
            "my_profile_short": "Mon profil",
            "share_label": "Partager",
            "photo": "Photo",
            "go": "Voir",
            "online": "En ligne",
            "someone": "Quelqu'un",
        },
        "profile": {
            "added_to_contacts_section": "Ajout\u00e9 aux contacts !",
        },
        "chats": {
            "search_placeholder": "Rechercher dans les messages...",
            "no_results": "Aucun r\u00e9sultat",
            "active_now": "En ligne",
            "active_ago": "Actif il y a {{time}}",
        },
    },
    "en": {
        "me": {
            "tab_profil": "Profile",
            "tab_adulte": "Adult",
            "pseudo_headline": "Your name",
            "pseudo_placeholder": "What should we call you?",
            "avatar_label": "Avatar",
        },
        "placeholders": {
            "limits_placeholder": "Your hard limits: safe word, excluded practices...",
            "ghost_pseudo": "What should we call you?",
        },
        "common": {
            "my_profile_short": "My profile",
            "share_label": "Share",
            "photo": "Photo",
            "go": "Go",
            "online": "Online",
            "someone": "Someone",
        },
        "profile": {
            "added_to_contacts_section": "Added to contacts!",
        },
        "chats": {
            "search_placeholder": "Search messages...",
            "no_results": "No results",
            "active_now": "Active now",
            "active_ago": "Active {{time}} ago",
        },
    },
}

added = 0
for lang, sections in KEYS.items():
    path = f"src/i18n/{lang}.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for section, keys in sections.items():
        if section not in data:
            data[section] = {}
        for k, v in keys.items():
            if k not in data[section]:
                data[section][k] = v
                print(f"  [{lang}] {section}.{k} = {v!r}")
                added += 1
            else:
                pass  # already exists
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done: {added} keys added.")
