# Flowtym PMS — Guide de Déploiement

## Architecture

```
Flowtym PMS v2.3
├── Frontend React/Vite (Port 3000)
│   ├── Flowboard (Dashboard KPIs)
│   ├── Housekeeping (Realtime Supabase)
│   ├── PMS Standalone (iframe, Bridge Supabase)
│   ├── CRM, Staff, RMS, Finance, Config
│   └── Notifications Realtime (NotificationBell)
├── Backend FastAPI (Port 8001)
│   ├── Auth (Supabase Auth)
│   ├── PMS API (/api/pms/*) — CRUD Supabase
│   ├── Legacy API (/api/*) — MongoDB
│   └── Static PMS HTML (/api/pms-app)
├── Supabase PostgreSQL
│   ├── 37+ tables avec RLS
│   ├── Realtime activé (rooms, reservations, tasks)
│   └── Auth (JWT natif)
└── NestJS Backend (Port 8002) — Legacy Housekeeping
```

## Prérequis

- Node.js 18+
- Python 3.11+
- Compte Supabase (https://supabase.com)

## Déploiement Supabase

### 1. Créer un projet Supabase

1. Allez sur https://supabase.com/dashboard
2. Créez un nouveau projet
3. Notez l'URL et les clés API (anon + service_role)

### 2. Exécuter le script SQL

1. Dashboard Supabase → **SQL Editor**
2. Collez le contenu de `/app/flowtym-final.sql`
3. Cliquez **Run**
4. Vérifiez : `SELECT COUNT(*) FROM hotels;` → 1

### 3. Créer les utilisateurs Auth

```bash
cd /app/backend
python seed_supabase.py
```

Utilisateurs créés :
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@flowtym.com | admin123 | direction |
| reception@hotel.com | reception123 | reception |
| gouvernante@hotel.com | gouv123 | gouvernante |
| femme1@hotel.com | femme123 | femme_de_chambre |
| maintenance@hotel.com | maint123 | maintenance |

### 4. Configurer les variables d'environnement

**Backend** (`/app/backend/.env`) :
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Frontend** (`/app/frontend/.env`) :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Démarrer les services

```bash
# Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd /app/frontend
yarn install
yarn dev
```

## API Endpoints

### PMS
- `GET /api/pms/dashboard/{hotel_id}` — KPIs temps réel
- `GET /api/pms/rooms/{hotel_id}` — Liste chambres
- `PATCH /api/pms/rooms/{room_id}/status` — Changer statut chambre
- `GET /api/pms/reservations/{hotel_id}` — Liste réservations
- `POST /api/pms/reservations` — Créer réservation
- `PATCH /api/pms/reservations/{id}` — Modifier réservation
- `POST /api/pms/reservations/{id}/checkin` — Check-in
- `POST /api/pms/reservations/{id}/checkout` — Check-out
- `GET /api/pms/guests/{hotel_id}` — Liste clients
- `POST /api/pms/guests` — Créer client
- `GET /api/pms/housekeeping/{hotel_id}` — Tâches ménage
- `PATCH /api/pms/housekeeping/{id}/start` — Démarrer nettoyage
- `PATCH /api/pms/housekeeping/{id}/complete` — Terminer nettoyage

### Auth
- Login via `supabase.auth.signInWithPassword()`
- Logout via `supabase.auth.signOut()`

## Raccourcis Clavier (PMS Standalone)

| Raccourci | Action |
|-----------|--------|
| Ctrl+H | Raccourcis |
| F4 | Calendrier |
| Ctrl+G | Recherche |
| Ctrl+Shift+R | Rapport |
| Esc | Fermer |

## Supabase Realtime

Les tables suivantes sont en écoute temps réel :
- `rooms` → Changements de statut
- `reservations` → Nouvelles résa, check-in/out
- `room_cleaning_tasks` → Progression ménage
- `inspections` → Validations
- `maintenance_tasks` → Tickets maintenance
- `guests` → Nouveaux clients

## Sécurité

- **RLS activé** sur toutes les tables (isolation par hotel_id)
- **Supabase Auth** avec JWT natif
- **Rate limiting** sur les routes sensibles
- **Validation** des entrées via Pydantic
