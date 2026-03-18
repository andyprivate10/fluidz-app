# FLUIDZ — DESIGN SYSTEM V1 BRIEF
## Reference document — DO NOT DELETE

### 1. COULEURS
```
bg:    #05040A    bg1:   #0D0C16    bg2:   #141222    bg3:   #1D1B2E
rule:  rgba(255,255,255,0.05)       rule2: rgba(255,255,255,0.09)
tx:    #EDE8F5    tx2: rgba(237,232,245,0.42)    tx3: rgba(237,232,245,0.18)    tx4: rgba(237,232,245,0.07)
p:     #E0887A    p2: rgba(224,136,122,0.15)     p3: rgba(224,136,122,0.06)     pbd: rgba(224,136,122,0.28)
sage:  #6BA888    sagebg: rgba(107,168,136,0.08) sagebd: rgba(107,168,136,0.16)
lav:   #9080BA    lavbg: rgba(144,128,186,0.08)  lavbd: rgba(144,128,186,0.18)
```
**PEACH = #E0887A — JAMAIS #F07858 (trop orange)**

### 2. FONTS
- Titres héroïques : **Bricolage Grotesque 800**
- Tout le reste : **Plus Jakarta Sans**

### 3. BOTTOM TAB BAR — 4 onglets
- Plans (grid icon) → /
- Discover (search icon) → /explore
- Book (users icon) → /contacts
- Moi (user icon) → /me
- Fond: rgba(5,4,10,0.92) + backdrop-filter: blur(20px)
- Hauteur: 64px + safe area
- Indicateur actif: barre 2px peach, border-radius 2px
- ZÉRO emoji — SVG icons stroke 1.5px

### 4. NAV CONTEXTUELLE — dans les events
Quand l'utilisateur est dans un event, la tab bar globale disparaît.
Back nav: chevron peach + "Plans" + titre session

Tabs par rôle:
- Candidat: Infos · DM host · Ma candidature
- Membre: Qui est là · Chat · Adresse · Voter
- Host: Candidats · Membres · Partager · ···

### 5. OrbLayer — sur chaque page
3 orbs animés: peach rgba(224,136,122,0.10), lav rgba(144,128,186,0.08), sage rgba(107,168,136,0.06)
filter: blur(60px), animations orbDrift1/2/3

### 6. RÈGLES GLOBALES
- ZÉRO emoji dans l'UI — SVG uniquement, stroke 1.5px, strokeLinecap round
- backdrop-filter blur sur TOUS éléments flottants
- Gradient fade bas sur TOUS les heroes: 180px
- border-radius cards: 16-20px
- position:relative + OrbLayer z-index:0 sur toutes les pages
- Animations: ease-in-out uniquement
- Shadows douces
- CTA principaux: shimmer animation
- Inputs: fond bg2, border rule, placeholder tx4
