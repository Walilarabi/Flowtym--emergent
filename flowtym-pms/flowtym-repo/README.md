# 🏨 FLOWTYM PMS

**Système de gestion hôtelière standalone** — HTML/CSS/JS pur, zéro dépendance serveur, déployable en un seul fichier.

![Version](https://img.shields.io/badge/version-2.3-c6a43f?style=flat-square)
![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-1a2a4f?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-r128-purple?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 📁 Fichiers

| Fichier | Description | Taille |
|---------|-------------|--------|
| `flowtym-pms.html` | PMS complet — application principale | ~625 KB |
| `plan3d.html` | Plan des chambres 2D/3D standalone | ~44 KB |

> **Aucune installation requise.** Ouvrez directement dans Chrome / Firefox / Edge.

---

## 🗂 Modules — `flowtym-pms.html`

### Navigation principale
```
Planning → Réservations → Check-in/out → Clients → Groups → Simulations → Tarifs → Rapports → Configuration
```

### 1. 📅 Planning
- Grille planning multi-vues (semaine, mois, 3 mois)
- Drag & drop réservations
- Filtres par type de chambre et statut
- Indicateurs de taux d'occupation

### 2. 📋 Réservations
- Tableau enrichi avec recherche, filtres, tri
- Statuts : Confirmée, En attente, Annulée, Checked-in, Checked-out
- Liens de paiement avec expiration
- Actions groupées (mass actions)

### 3. 🚪 Check-in / Check-out
- Interface dédiée réception
- Scan documents (CNI, Passeport, Titre de séjour)
- Vérification identité
- Assignation automatique chambre

### 4. 👤 Clients
- Fiche client complète (historique, préférences, allergies)
- Système de fidélité (Bronze / Argent / Or)
- Tags et notes internes
- Statuts : VIP, Affaires, Loisirs

### 5. 👥 Groups & Séminaires
- Gestion de groupes multi-chambres
- Suivi participants
- Blocs chambres fictives

### 6. 📊 Simulations
- Simulateur de revenus
- Comparaison scénarios tarifaires
- Projections RevPAR / ADR / Taux d'occupation

### 7. 💶 Tarifs & Rate Plans
- 5 sous-onglets : Grille tarifaire, Rate Plans, BAR, Dérivés, Promos
- Règles de dérivation (% ou € par rapport au BAR)
- Rate Plans : Négocié, Promotionnel, Package
- Grille enrichie avec filtres et mass actions

### 8. 📈 Rapports
- **35+ rapports** : FIN-12, Taxe de séjour, EXP/STA/FIN, RevPAR, ADR
- Export PDF (portrait/paysage automatique)
- Sélecteur de période avec recherche

### 9. ⚙️ Configuration
7 sous-onglets :
- **Général** : nom hôtel, devise, TVA, taxe séjour, timezone, logo
- **Chambres** : CRUD, photos, équipements, drag & drop
- **Rate Plans** : wizard création, dérivation
- **RACK Cascade** : référentiel RACK par type chambre
- **Pools** : types composites (Adjacentes 4p, etc.)
- **Numérotation** : génération auto, édition inline, export CSV
- **Plan hôtel** : module 2D → 3D interactif

---

## 🗺 Plan des chambres — `plan3d.html`

Application standalone de visualisation et gestion des chambres.

### Vue 2D
- Canvas HTML5 avec esthétique **blueprint architectural**
- Chambres dessinées par étage (façade A / façade B)
- Couloir central configurable
- Numéros lisibles, hover glow, clic → modal complète
- Édition : client, dates arrivée/départ, canal, statut

### Vue 3D
- **Three.js r128 ESM** (importmap + OrbitControls + CSS2DRenderer)
- Bâtiment procédural multi-étages empilés
- Chaque chambre = mesh 3D individuel coloré par statut
- Labels `CSS2DObject` permanents au-dessus de chaque chambre
- Lampes de plafond pulsées, portes, fenêtres, ascenseur doré, escaliers
- Orbite, zoom, touch (OrbitControls natif)

### Couleurs statuts
| Statut | Couleur |
|--------|---------|
| Libre | `#44aa44` vert |
| Occupée | `#aa3333` rouge |
| Départ | `#dd8844` orange |
| Arrivée | `#3399ff` bleu |
| Ménage | `#c6a43f` doré |
| Maintenance | `#666688` gris |

### Configuration
- Étages (1–7) + Sous-sols (0–2)
- Chambres par étage (1–12)
- Couloir central Oui/Non
- Vue principale : Rue / Cour / Jardin / Mer
- Sidebar **Chambres** : tableau numérotation inline (N°, type, statut)

---

## 🚀 Utilisation

### Ouvrir localement
```bash
# Clone
git clone https://github.com/votre-user/flowtym-pms.git
cd flowtym-pms

# Ouvrir directement (aucun serveur requis)
open flowtym-pms.html      # macOS
start flowtym-pms.html     # Windows
xdg-open flowtym-pms.html  # Linux
```

### Déployer sur GitHub Pages
1. Aller dans **Settings → Pages**
2. Source : `main` branch, dossier `/` (root)
3. Accéder via `https://votre-user.github.io/flowtym-pms/flowtym-pms.html`

### Déployer sur Netlify / Vercel
Drag & drop du dossier → URL publique instantanée.

---

## 🏗 Architecture technique

```
flowtym-pms.html (~625 KB)
│
├── CSS inline (~15 KB)
│   ├── Variables CSS (--violet, --gold, --gray-*)
│   ├── Composants (panel, btn, finput, fsel2, field)
│   └── Responsive layout
│
├── HTML (~80 KB)
│   ├── Navigation principale (data-sp)
│   ├── 9 sections (sec-planning, sec-reservations, ...)
│   └── Configuration (7 sous-onglets cfg-tab-*)
│
└── JavaScript inline (~530 KB)
    ├── Data: clients[], reservations[], ROOMS_NUMBERED[]
    ├── Planning: renderPlanning(), renderCheckin(), saveResa()
    ├── Rapports: renderRapports(), doCheckout(), exportPDF()
    ├── Configuration: cfgRenderRooms(), poolRender(), numGenerate()
    ├── Plan 2D→3D: module FP (IIFE encapsulé)
    │   ├── Data Layer: ROOM_TYPES, STATUS_COLOR, state
    │   ├── Render 2D: draw2D(), hit detection, canvas events
    │   └── Render 3D: Three.js UMD r128, buildFloors3D()
    └── Utils: toast(), openSM(), cfgAddLog()
```

```
plan3d.html (~44 KB)
│
├── CSS inline
│   └── Variables --gold, --bg2, --sb (sidebar 320px)
│
├── HTML
│   ├── Topbar FLOWTYM
│   ├── Sidebar (Config + Chambres)
│   ├── Controls bar (2D/3D, étage, stats)
│   ├── Canvas 2D #cv2
│   ├── 3D Container #cv3-wrap
│   └── Modal chambre .mbg
│
└── JavaScript (ESM module)
    ├── importmap Three.js r128
    ├── OrbitControls (orbit + zoom + touch)
    ├── CSS2DRenderer (labels HTML en 3D)
    ├── Logique 2D: draw2D(), drawRoom(), hit detection
    ├── Logique 3D: init3D(), rebuild3D(), addRM()
    └── CRUD: openMod(), saveMod(), renderRoomsTable()
```

---

## 💾 Persistance

Les données sont sauvegardées dans `localStorage` du navigateur :

| Clé | Contenu |
|-----|---------|
| `flowtym_rooms_numbered` | Chambres et statuts |
| `flowtym_fp_v7` | Configuration plan 2D/3D |
| `flowtym_plan_v5` | Plan standalone (plan3d.html) |
| `flowtym_cfg` | Configuration générale hôtel |
| `flowtym_tarifs` | Grille tarifaire et rate plans |

---

## 📦 Structure de données JSON (plan 3D)

```json
{
  "hotel": {
    "name": "Mas Provencal Aix",
    "floors": 3,
    "basements": 0,
    "sideA": "Cour",
    "sideB": "Rue",
    "corridor": true,
    "elevators": 1,
    "stairs": 2
  },
  "floors": {
    "rdc": {
      "ceil": 2.8,
      "roomsA": 4,
      "roomsB": 4,
      "rooms": [
        {
          "id": "rdc_A0",
          "num": 101,
          "type": "Double Classique",
          "status": "occupied",
          "client": "Sophie Dubois",
          "arrival": "2026-04-07",
          "departure": "2026-04-10",
          "canal": "Booking.com"
        }
      ]
    }
  }
}
```

---

## 🧰 Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| HTML5 | — | Structure, canvas 2D |
| CSS3 | — | Variables, animations, layout |
| JavaScript ES2020 | — | Logique métier, rendu |
| Three.js | r128 | Rendu 3D (via CDN) |
| OrbitControls | r128 | Navigation 3D |
| CSS2DRenderer | r128 | Labels HTML en espace 3D |
| Chart.js | 4.x | Graphiques (rapports) |
| jsPDF | 2.x | Export PDF |
| html2canvas | 1.x | Capture PDF |
| Tesseract.js | 4.x | OCR documents |
| Font Awesome | 6.x | Icônes |
| Google Fonts | — | Rajdhani, JetBrains Mono |

**Aucune dépendance Node.js / npm / build tool.**

---

## 🎨 Design System

```css
/* Palette principale */
--violet:       #7C3AED   /* Actions primaires */
--violet-light: #EDE9FE   /* Fonds légers */
--gold:         #c6a43f   /* Accents hôtel */
--gray-50..900            /* Gamme de gris */

/* Typographie */
font-family: 'Segoe UI', system-ui (PMS)
font-family: 'Rajdhani', 'JetBrains Mono' (Plan 3D)
```

---

## 📄 Licence

MIT — libre d'utilisation, modification et distribution.

---

## 👤 Auteur

**FLOWTYM** — Solution SaaS de gestion hôtelière  
Développé avec ❤️ et assisté par [Claude (Anthropic)](https://claude.ai)
