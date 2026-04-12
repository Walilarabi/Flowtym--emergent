# Guide d'intégration — Module Plan 2D → 3D

## Intégration dans `flowtym-pms.html`

Le module Plan 2D → 3D est encapsulé dans un IIFE (`const FP = (() => { ... })()`).
Il s'active via `Configuration → Plan hôtel`.

### Points d'entrée

```javascript
// Initialisation (appelé automatiquement au chargement)
FP.init()

// Activation quand l'onglet est ouvert
FP.activate()

// Actions UI exposées globalement
FP.setView('2d' | '3d')
FP.build3D()
FP.ctrl('reset' | 'rot' | 'floor-up' | 'floor-dn')
FP.genFloor()
FP.saveFloor()
FP.exportJSON()
```

### Sync avec les données PMS existantes

```javascript
// ROOMS_NUMBERED est lu automatiquement au démarrage
// Format attendu :
let ROOMS_NUMBERED = [
  {
    id: 'rm_101',
    num: '101',
    floor: 1,           // numéro d'étage (1-based)
    typeId: 'DBL_CLASS',
    typeName: 'Double Classique',
    view: 'Cour',
    status: 'available' | 'occupied' | 'departure' | 'arrival' | 'cleaning' | 'maintenance',
    width: 1            // optionnel, pour chambres doubles (Adjacentes)
  }
]
```

### Structure localStorage

```javascript
// Clé : flowtym_fp_v7
{
  hotel: {
    name: 'Mas Provencal Aix',
    floors: 3,
    basements: 0,
    sideA: 'Cour',
    sideB: 'Rue',
    corridor: true,
    corridorW: 1.8,
    elevators: 1,
    stairs: 2
  },
  floors: {
    'rdc': {
      roomsA: 4,
      roomsB: 4,
      ceil: 2.8,
      rooms: [
        {
          id: 'rdc_A0',
          num: 101,
          type: 'DBL_CLASS',
          typeName: 'Double Classique',
          view: 'Cour',
          status: 'available',
          side: 'A',
          si: 0,
          width: 1
        }
      ]
    }
  },
  activeFloor: 'rdc',
  view: '2d',
  autoRot: false
}
```

---

## `plan3d.html` — Standalone

Ce fichier fonctionne de manière complètement indépendante.
Données stockées dans `localStorage` clé `flowtym_plan_v5`.

### Architecture ESM

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.128.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.128.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
// ...
</script>
```

### Connexion réseau requise
- Google Fonts (Rajdhani, JetBrains Mono)
- unpkg.com (Three.js r128)

Pour une utilisation **hors ligne**, télécharger Three.js et remplacer les URLs :
```bash
# Télécharger Three.js
mkdir vendor
curl -o vendor/three.module.js https://unpkg.com/three@0.128.0/build/three.module.js
# (+ OrbitControls.js et CSS2DRenderer.js depuis les exemples jsm/)
```

Puis remplacer dans l'importmap :
```json
{
  "imports": {
    "three": "./vendor/three.module.js",
    "three/addons/": "./vendor/jsm/"
  }
}
```
