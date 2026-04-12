# Changelog — FLOWTYM PMS

Toutes les modifications notables sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [2.3] — 2026-04-12

### Ajouté
- **Module Plan 2D → 3D** dans Configuration → Plan hôtel
  - Vue 2D canvas avec esthétique blueprint architectural
  - Vue 3D Three.js r128 avec chambres individuelles (mesh par chambre)
  - Labels CSS2DObject permanents au-dessus de chaque chambre en 3D
  - Modale chambre : client, dates, canal, actions réception
  - Sync automatique avec ROOMS_NUMBERED (données PMS réelles)
  - Export JSON structuré
- **Plan 3D standalone** (`plan3d.html`) — application indépendante complète
  - ESM importmap + OrbitControls + CSS2DRenderer
  - Sidebar Configuration + Chambres avec tableau éditable inline
  - Switcher Vue 2D / Vue 3D avec fallback automatique
  - Persistance localStorage `flowtym_plan_v5`

### Modifié
- `cfgSetTab()` étendu pour gérer les 7 sous-onglets de Configuration
- Module FP refactorisé en IIFE encapsulé (4 couches : Data, Business, Render2D, Render3D)

---

## [2.2] — 2026-04-10

### Ajouté
- **Module Pools** : types composites (Adjacentes 4p, etc.)
- **Module Numérotation** : génération automatique, édition inline, export CSV, toggle maintenance
- **Sous-onglet RACK Cascade** : référentiel RACK par type chambre, écarts configurables

### Modifié
- Configuration réorganisée en 7 sous-onglets

---

## [2.1] — 2026-04-08

### Ajouté
- **Rate Plans** : wizard création (BAR / Dérivé / Promo / Négocié), dérivation % ou €
- **Grille tarifaire enrichie** : filtres, tri, mass actions, logs
- Module Tarifs complet (5 sous-onglets)

---

## [2.0] — 2026-04-05

### Ajouté
- **Configuration hôtel** : Général, Chambres (CRUD + photos), Rate Plans
- Tooltips équipements avec hover violet
- Chips équipements (Piscine, Spa, Fitness, Séminaire)
- WebSocket hooks (useRealtime, useNotifications)
- Système webhook HMAC-SHA256

### Modifié
- Ordre des onglets : Configuration déplacé après Rapports
- Compact config panel

---

## [1.5] — 2026-03-30

### Ajouté
- **Rapports** : FIN-12, Taxe de séjour, EXP/STA/FIN (35+ rapports)
- Export PDF portrait/paysage automatique
- Sélecteur période avec recherche

---

## [1.4] — 2026-03-25

### Ajouté
- **Simulations** : simulateur RevPAR/ADR, comparaison scénarios
- **Groups & Séminaires** : gestion blocs chambres multi-participants

---

## [1.3] — 2026-03-20

### Ajouté
- **Planning** : grille multi-vues (semaine, mois, 3 mois), drag & drop
- Indicateurs taux d'occupation en temps réel

---

## [1.2] — 2026-03-15

### Ajouté
- **Réservations** : tableau enrichi, filtres, liens paiement avec expiration
- **Check-in/Check-out** : interface réception, scan documents

---

## [1.1] — 2026-03-10

### Ajouté
- **Clients** : fiche complète, historique, fidélité, préférences
- Tags et notes internes

---

## [1.0] — 2026-03-01

### Initial
- PMS standalone HTML/CSS/JS
- Navigation 9 modules
- Données mockées pour démonstration
