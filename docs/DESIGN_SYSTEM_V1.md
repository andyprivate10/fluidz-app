# FLUIDZ — DESIGN SYSTEM V1 BRIEF

## 1. COULEURS

```ts
export const colors = {
  bg:   '#05040A',
  bg1:  '#0D0C16',
  bg2:  '#141222',
  bg3:  '#1D1B2E',
  rule: 'rgba(255,255,255,0.05)',
  rule2:'rgba(255,255,255,0.09)',
  tx:  '#EDE8F5',
  tx2: 'rgba(237,232,245,0.42)',
  tx3: 'rgba(237,232,245,0.18)',
  tx4: 'rgba(237,232,245,0.07)',
  p:   '#E0887A',   // PEACH ROSÉ — PAS ORANGE
  p2:  'rgba(224,136,122,0.15)',
  p3:  'rgba(224,136,122,0.06)',
  pbd: 'rgba(224,136,122,0.28)',
  sage:   '#6BA888',
  sagebg: 'rgba(107,168,136,0.08)',
  sagebd: 'rgba(107,168,136,0.16)',
  lav:   '#9080BA',
  lavbg: 'rgba(144,128,186,0.08)',
  lavbd: 'rgba(144,128,186,0.18)',
}
```

## 2. FONTS
- Titres héroïques : **Bricolage Grotesque 800**
- Tout le reste : **Plus Jakarta Sans**
- Google Fonts link in index.html

## 3. BOTTOM TAB BAR — 4 onglets
- Plans (grid icon) → /
- Discover (search icon) → /explore
- Book (users icon) → /contacts
- Moi (user icon) → /me
- Fond: rgba(5,4,10,0.92) + backdrop-filter: blur(20px)
- Hauteur: 64px + safe area
- Indicateur: barre 2px peach en haut
- ZÉRO emoji — SVG stroke 1.5px uniquement

## 4. NAV CONTEXTUELLE (dans les events)
La tab bar globale disparaît. Remplacée par:

**Back nav:**
- Chevron peach + "Plans" → retour accueil
- + titre session en tx3

**Hub tabs par rôle:**
- Candidat: Infos · DM host · Ma candidature
- Membre: Qui est là · Chat · DM host
- Host: Candidats · Membres · Partager · ···

## 5. PAGE EVENT PUBLIQUE (landing recrutement)
**Hero 330px:**
- 3 orbs animés (story-drift)
- Story bars auto-play en haut
- Bouton expand fullscreen
- Grande lettre déco opacity 0.04
- Fade bas 180px

**Membres (avatars story-style):**
- Ring gradient peach→violet = actif
- Ring fin = en attente
- Dot sage = présent, dot peach = en route
- Superposés margin-left: -8px
- "+3 autres" en dernier

**Body:**
- Host row: avatar + dot sage online + bouton "Message"
- Lieu: icône + area + "Adresse exacte après acceptation" cadenas peach
- Download banner: très discret

**CTA fixe bas:**
- "Postuler" peach + shimmer + sous-titre
- Séparateur "Préfères-tu rester anonyme?"
- Bouton ghost: lavande
- "Ton numéro ne sera jamais demandé."

## 6. HUB EVENT HOST
**Event banner compact:**
- Orbs, badge "Host" peach, titre 16/800
- Chip "Live · 3/5" dot blink

**Cards candidats:**
- bg1 + rule border + radius 16px
- Avatar 40px + dot statut
- Tags: peach=rôle, sage="Profil complet", lavande="Ghost"
- Vote consultatif: pill votants + score sage
- Actions: "Accepter" peach+shimmer, "Refuser" bg2, icône œil

## 7. RÈGLES GLOBALES
- ZÉRO emoji UI — SVG stroke 1.5px strokeLinecap round
- backdrop-filter blur sur TOUS éléments flottants
- Gradient fade 180px sur TOUS les heroes
- border-radius cards: 16-20px
- position:relative + OrbLayer z-index:0 sur toutes les pages
- Contenu z-index:1 minimum
- Animations: ease-in-out (jamais linear sauf progress)
- Shadows douces
- CTA principaux: shimmer animation
- Inputs: fond bg2, border rule, placeholder tx4
- PEACH = #E0887A — JAMAIS #F07858
