# Flowtym PMS — Moteur de Règles d'Automatisation

## Architecture

```
Configuration (UI) → Règles (Supabase) → Moteur (FastAPI) → Actions (Pricing/MLOS/CTA)
```

## Déploiement

### Étape 1 : Créer les tables

1. Ouvrez **Supabase Dashboard → SQL Editor**
2. Collez le contenu de `/app/flowtym-automation.sql`
3. Cliquez **Run**
4. Vérifiez : `SELECT COUNT(*) FROM automation_rules;` → 7 règles

### Étape 2 : Redémarrer le backend

```bash
sudo supervisorctl restart backend
```

### Étape 3 : Tester les API

```bash
# Lister les règles
curl $API_URL/api/pms/automation/rules/HOTEL_ID

# Exécuter manuellement le moteur
curl -X POST $API_URL/api/pms/automation/run/HOTEL_ID

# Voir les logs d'exécution
curl $API_URL/api/pms/automation/logs/HOTEL_ID

# Voir les restrictions actives
curl $API_URL/api/pms/automation/restrictions/HOTEL_ID
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/pms/automation/rules/{hotel_id}` | Lister les règles |
| POST | `/api/pms/automation/rules` | Créer une règle |
| PATCH | `/api/pms/automation/rules/{rule_id}` | Modifier une règle |
| DELETE | `/api/pms/automation/rules/{rule_id}` | Supprimer une règle |
| POST | `/api/pms/automation/rules/{rule_id}/toggle` | Activer/désactiver |
| GET | `/api/pms/automation/settings/{hotel_id}` | Paramètres globaux |
| PATCH | `/api/pms/automation/settings/{hotel_id}` | Modifier paramètres |
| GET | `/api/pms/automation/logs/{hotel_id}` | Historique d'exécution |
| POST | `/api/pms/automation/run/{hotel_id}` | Lancer le moteur |
| GET | `/api/pms/automation/restrictions/{hotel_id}` | Restrictions actives |

## Règles par défaut (7)

| Règle | Catégorie | Condition | Action |
|-------|-----------|-----------|--------|
| MLOS 2 nuits si forte occupation | mlos | TO% > 70% à 30j | MLOS = 2 |
| Augmentation tarif +15% | pricing | TO% > 85% à 14j | +15% |
| Réduction progressive J-1 | lastminute | TO% < 60% à J-1 | -5% |
| CTA si occupation > 95% | cta_ctd | TO% > 95% | Fermer arrivées |
| Week-end chargé | composite | WE + TO% > 80% | MLOS 3 + tarif +10% |
| Dernières chambres +20% | pricing | < 3 dispo | +20% |
| Dernière minute J-3 | lastminute | TO% < 50% à J-3 | -15% |

## Format des conditions (JSON)

```json
{
  "operator": "and",
  "conditions": [
    {"field": "occupation_rate_30d", "operator": ">", "value": 70},
    {"field": "days_before_arrival", "operator": ">", "value": 7}
  ]
}
```

### Champs disponibles

| Champ | Description |
|-------|-------------|
| `occupation_rate_today` | TO% du jour |
| `occupation_rate_7d/14d/30d` | TO% à +7/14/30 jours |
| `available_rooms` | Chambres disponibles |
| `days_before_arrival` | Jours avant arrivée |
| `current_hour` | Heure actuelle (0-23) |
| `is_weekend` | true/false |
| `today_pickup` | Réservations du jour |
| `avg_pickup_last_30d` | Moyenne pickup 30j |

## Cron Job (production)

Pour exécuter le moteur toutes les heures :

```bash
# crontab -e
0 * * * * curl -X POST http://localhost:8001/api/pms/automation/run/HOTEL_ID
```
