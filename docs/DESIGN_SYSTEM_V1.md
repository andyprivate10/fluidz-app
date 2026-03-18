# FLUIDZ — DESIGN SYSTEM V1 (BRIEF VALIDÉ)

## 1. COULEURS

```ts
// src/brand.ts
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

- **Titres héroïques** : Bricolage Grotesque 800
- **Tout le reste** : Plus Jakarta Sans

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

## 3. BOTTOM TAB BAR — 4 ONGLETS

```
Plans | Discover | Book | Moi
```

- Fond : rgba(5,4,10,0.92) + backdrop-filter: blur(20px)
- Border-top : 0.5px solid rgba(255,255,255,0.05)
- Hauteur : 64px + safe area bottom
- Indicateur actif : barre 2px peach (#E0887A), border-radius 2px
- Icône active : peach / Icône inactive : tx3
- Label actif : 10px, 700, peach / Label inactif : 10px, 600, tx3
- ZÉRO emoji — SVG icons stroke 1.5px

## 4. NAV CONTEXTUELLE DANS LES EVENTS

Quand l'utilisateur est dans un event, la tab bar globale disparaît → nav contextuelle en haut.

```
← Plans · [Titre session]

Candidat : Infos · DM host · Ma candidature
Membre   : Qui est là · Chat · Adresse · Voter
Host     : Candidats · Membres · Partager · ···
```

## 5. COMPOSANT OrbLayer

3 orbs animés (peach/lav/sage), position absolute, blur 60px, z-index 0.

## 6. RÈGLES GLOBALES

- ZÉRO emoji dans l'UI — SVG uniquement, stroke 1.5px, strokeLinecap round
- backdrop-filter blur sur TOUS les éléments flottants
- Gradient fade bas sur TOUS les heroes : 180px
- border-radius cards : 16-20px
- OrbLayer sur TOUTES les pages
- CTA principaux : shimmer animation
- Inputs : fond bg2, border rule, placeholder tx4
- PEACH = #E0887A — jamais #F07858 (trop orange)
- Animations : ease-in-out uniquement, jamais linear sauf progress bars
- Shadows : douces, pas de drop-shadow agressif

## 7. PAGE EVENT PUBLIQUE — Hero 330px

- 3 orbs animés (story-drift plus vive)
- Story bars auto-play en haut
- Grande lettre décorative opacity 0.04
- Fade bas 180px
- Avatars story-style : ring gradient peach→violet, dot sage=présent, dot peach=en route
- CTA fixe bas : blur 24px, bouton "Postuler" + shimmer + ghost mode lavande

## 8. HUB EVENT HOST — Candidats

- Banner compact avec orbs, badge "Host" peach, chip "Live · 3/5" avec dot blink
- Cards : bg1, border rule, avatar 40px, tags colored, vote consultatif, shimmer accept
