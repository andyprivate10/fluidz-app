import { useState, useEffect, useRef, useCallback } from "react";

// Project started: 2026-03-07 = Jour 1 (date de démarrage de cette conversation)
const PROJECT_START = new Date("2026-03-07T00:00:00");
const MILESTONES = [
  { label: "🚀 J1",     day: 0  },
  { label: "🏁 L0",     day: 21 },
  { label: "🔄 P2",     day: 42 },
  { label: "🏢 B2B",    day: 70 },
  { label: "🎉 6 Juin", day: 91 },
];
const TOTAL_DAYS = 91;

const PRD_CONTEXT = `Tu es l'assistant IA embarqué dans le Fluidz Command Center.
Tu vois l'état du projet en temps réel. Réponds en français, direct, pas corporate.
Quand tu proposes du code : "→ Cursor : [instruction précise en 1 ligne]"

PROJET : Fluidz — "Recruter un groupe depuis Grindr pour ce soir"
Stack : React + TS + Vite + Tailwind + Supabase. Domaine : fluidz.app
Audience : Hommes gays/bi/queer, Paris, 20-45 ans.

13 DÉCISIONS VERROUILLÉES : use case Grindr 1-2h · tap en trop = mec perdu · host invite direct | membres via apply+vote+host · vote consultatif host tranche · adresse révélée à acceptation · ghost MVP · DM uniquement NO group chat L0 · profil JSON modulaire · candidate pack togglable · visibilité à la carte · lien partagé seulement · rôles cosmétiques · <90min recrutement

TU ES SOLO AI AGENT — estimations en MINUTES (réalistes) :
Simple (1 fichier, 1 query) : 8-15min
Moyen (2-3 fichiers, logique) : 18-32min
Complexe (schema+RLS+UI) : 35-55min

COMPTES TEST : host@fluidz.test / member@fluidz.test / guest@fluidz.test — testpass123
SESSION TEST : code pzb3hoiw · ID 7523efb6-d0c3-4f3d-96ea-ec3deba62814
Supabase : kxbrfjqxufvskcxmliak.supabase.co

AGENTS MULTIPLES : NON maintenant. P0 séquentiel. Reprendre après L0 avec 5 personnes.`;

export default DevTestMenu;
