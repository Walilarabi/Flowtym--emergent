# Structure de données — FLOWTYM PMS

## Chambres (`ROOMS_NUMBERED`)

```json
[
  {
    "id": "rm_101",
    "num": "101",
    "floor": 1,
    "typeId": "DBL_CLASS",
    "typeName": "Double Classique",
    "view": "Cour",
    "status": "available",
    "width": 1
  },
  {
    "id": "rm_107",
    "num": "107",
    "floor": 1,
    "typeId": "FAM_4P",
    "typeName": "Adjacentes 4p",
    "view": "Rue",
    "status": "available",
    "width": 2
  }
]
```

### Statuts disponibles
| Valeur | Libellé | Usage |
|--------|---------|-------|
| `available` | Libre | Chambre propre et disponible |
| `occupied` | Occupée | Client en séjour |
| `departure` | Départ | Check-out prévu aujourd'hui |
| `arrival` | Arrivée | Check-in prévu aujourd'hui |
| `cleaning` | Ménage | En cours de nettoyage |
| `maintenance` | Maintenance | Hors service |

---

## Clients (`clients[]`)

```json
{
  "id": 1,
  "name": "Dupont",
  "firstName": "Jean",
  "civilite": "M.",
  "email": "jean.dupont@email.fr",
  "phone": "+33698765432",
  "city": "Lyon",
  "country": "France",
  "company": "BNP Paribas",
  "tag": "Affaires",
  "visits": 3,
  "ca": 1240,
  "hasVisited": true,
  "idVerified": true,
  "status": "checked_in",
  "room": "102",
  "checkin": "2026-04-07",
  "checkout": "2026-04-10",
  "loyalty": "Argent",
  "preferences": {
    "floor": "Élevé",
    "bedType": "Ferme",
    "smoking": false,
    "equipment": ["Fer à repasser", "Connexion haut débit"],
    "accessibility": false
  },
  "allergies": "Aucune",
  "specialRequests": "Chambre calme côté jardin.",
  "notes": "Client régulier VIP.",
  "history": [
    {
      "dates": "07–10 avr. 2026",
      "room": "102",
      "category": "double_classic",
      "nights": 3,
      "amount": 360
    }
  ]
}
```

---

## Réservations (`reservations[]`)

```json
{
  "id": "RES-001",
  "clientId": 1,
  "status": "checked_in",
  "dates": "07 avr. – 10 avr. 2026",
  "nights": 3,
  "room": "102",
  "canal": "Booking.com",
  "montant": 360,
  "solde": 360,
  "paymentStatus": "confirmed",
  "paymentLink": null,
  "paymentLinkExpiry": null,
  "paymentLinkVersion": 1,
  "reminderCount": 0,
  "isDummyRoom": false
}
```

### Statuts réservation
| Valeur | Libellé |
|--------|---------|
| `Confirmee` | Confirmée |
| `En attente` | En attente |
| `Annulee` | Annulée |
| `checked_in` | Checked-in |
| `checked_out` | Checked-out |
| `No-show` | No-show |

---

## Rate Plans (`TR_RATE_PLANS`)

```json
{
  "id": "BAR_STANDARD",
  "name": "BAR Standard",
  "type": "BAR",
  "description": "Best Available Rate",
  "derivedFrom": null,
  "derivationType": null,
  "derivationValue": 0,
  "prices": {
    "DBL_CLASS": 180,
    "DBL_DELUXE": 220,
    "TWIN": 175,
    "SUITE": 380,
    "SINGLE": 130
  },
  "active": true
}
```

---

## Plan hôtel — Export JSON

```json
{
  "hotel": {
    "name": "Mas Provencal Aix",
    "floors": 3,
    "basements": 0,
    "sideA": "Cour",
    "sideB": "Rue",
    "corridor": true,
    "corridorW": 1.8,
    "elevators": 1,
    "stairs": 2
  },
  "floors": {
    "rdc": {
      "label": "RDC",
      "ceil": 2.8,
      "roomsA": 4,
      "roomsB": 4,
      "rooms": [
        {
          "id": "rdc_A0",
          "num": 101,
          "type": "DBL_CLASS",
          "typeName": "Double Classique",
          "view": "Cour",
          "status": "occupied",
          "side": "A",
          "si": 0,
          "width": 1
        }
      ]
    },
    "e1": {
      "label": "1er",
      "ceil": 2.8,
      "roomsA": 4,
      "roomsB": 4,
      "rooms": []
    }
  },
  "exportedAt": "2026-04-12T10:30:00.000Z"
}
```
