"""
Seed Housekeeping cleaning tasks into Supabase
"""
import os, json, httpx
from pathlib import Path
from dotenv import load_dotenv
from datetime import date

load_dotenv(Path(__file__).parent / '.env')

SUPA_URL = os.environ['SUPABASE_URL']
SUPA_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

client = httpx.Client(timeout=30)

def api(method, table, data=None, params=None):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    r = client.request(method, url, headers=HEADERS, json=data)
    if r.status_code >= 400:
        print(f"  ERROR {method} {table}: {r.status_code} {r.text}")
        return None
    try:
        return r.json()
    except:
        return r.text

# Get hotel
hotels = api("GET", "hotels", params={"select": "id", "limit": "1"})
hotel_id = hotels[0]["id"]
print(f"Hotel: {hotel_id}")

# Get rooms
rooms = api("GET", "rooms", params={"select": "id,room_number,status", "hotel_id": f"eq.{hotel_id}", "order": "room_number"})
room_map = {r["room_number"]: r["id"] for r in rooms}
print(f"Rooms: {len(room_map)}")

# Get staff
users = api("GET", "users", params={"select": "id,first_name,last_name,role", "hotel_id": f"eq.{hotel_id}"})
femme = next((u for u in users if u["role"] == "femme_de_chambre"), None)
gouvernante = next((u for u in users if u["role"] == "gouvernante"), None)
print(f"Femme de chambre: {femme['first_name'] if femme else 'N/A'}")
print(f"Gouvernante: {gouvernante['first_name'] if gouvernante else 'N/A'}")

# Delete existing tasks for today
today = date.today().isoformat()
api("DELETE", "room_cleaning_tasks", params={"hotel_id": f"eq.{hotel_id}", "scheduled_date": f"eq.{today}"})
print(f"\nCleaned existing tasks for {today}")

# Create cleaning tasks
tasks = [
    # Départs (check-out) - priorité haute
    {"room": "102", "type": "depart", "status": "a_faire", "priority": 3, "notes": "Départ Sophie Laurent - nettoyage complet"},
    {"room": "201", "type": "depart", "status": "a_faire", "priority": 3, "notes": "Départ Marc Dubois - nettoyage complet"},
    {"room": "301", "type": "depart", "status": "termine", "priority": 3, "notes": "Départ Jean-Pierre Moreau - FAIT"},
    # Recouches (en séjour)
    {"room": "202", "type": "recouche", "status": "en_cours", "priority": 2, "notes": "Recouche Elena Rossi - en cours"},
    # Chambres libres - nettoyage préventif
    {"room": "101", "type": "recouche", "status": "a_faire", "priority": 1, "notes": "Nettoyage préventif"},
    {"room": "103", "type": "recouche", "status": "a_faire", "priority": 1, "notes": "Arrivée Yuki Tanaka prévue le 14/04"},
    {"room": "203", "type": "recouche", "status": "a_faire", "priority": 1, "notes": "Chambre libre"},
    {"room": "302", "type": "recouche", "status": "termine", "priority": 1, "notes": "Nettoyage fait ce matin"},
    {"room": "303", "type": "recouche", "status": "a_faire", "priority": 2, "notes": "Arrivée Ahmed Belkacem prévue le 13/04"},
    {"room": "304", "type": "recouche", "status": "a_faire", "priority": 1, "notes": "Chambre libre"},
    {"room": "204", "type": "recouche", "status": "a_faire", "priority": 1, "notes": "Arrivée Maria Schmidt le 01/05"},
]

print(f"\nSeeding {len(tasks)} cleaning tasks...")
for t in tasks:
    room_id = room_map.get(t["room"])
    if not room_id:
        print(f"  SKIP {t['room']}: room not found")
        continue
    task_data = {
        "hotel_id": hotel_id,
        "room_id": room_id,
        "assigned_to": femme["id"] if femme and t["status"] != "a_faire" else None,
        "cleaning_type": t["type"],
        "status": t["status"],
        "priority": t["priority"],
        "scheduled_date": today,
        "notes": t["notes"],
        "duration_minutes": 30 if t["type"] == "depart" else 20,
    }
    # Remove None values
    task_data = {k: v for k, v in task_data.items() if v is not None}
    result = api("POST", "room_cleaning_tasks", task_data)
    if result:
        row = result[0] if isinstance(result, list) else result
        print(f"  Ch.{t['room']} ({t['type']}): {t['status']} ✓")
    else:
        print(f"  Ch.{t['room']}: FAILED")

print(f"\nDone! {len(tasks)} tasks seeded for {today}")
