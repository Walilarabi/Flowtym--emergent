"""
Flowtym - Supabase Seed Script
Seeds hotel, floors, users (via Auth), rooms, settings, and sample reservations.
"""
import os
import sys
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

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
    except Exception:
        return r.text


def auth_create_user(email, password, user_metadata=None):
    """Create a user via Supabase Auth Admin API"""
    url = f"{SUPA_URL}/auth/v1/admin/users"
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": user_metadata or {}
    }
    r = client.post(url, headers=HEADERS, json=payload)
    if r.status_code >= 400:
        print(f"  ERROR auth create {email}: {r.status_code} {r.text}")
        return None
    return r.json()


def seed():
    print("=" * 60)
    print("  FLOWTYM - SUPABASE SEED")
    print("=" * 60)

    # ─── 1. HOTEL ───
    print("\n[1/7] Hotel...")
    hotel_data = {
        "name": "Flowtym Paris",
        "address": "123 Avenue des Champs-Élysées",
        "city": "Paris",
        "postal_code": "75008",
        "country": "France",
        "phone": "+33 1 23 45 67 89",
        "email": "contact@flowtym.com",
        "stars": 4,
        "total_rooms": 12,
        "is_active": True
    }
    hotels = api("POST", "hotels", hotel_data)
    if not hotels:
        print("  FAILED to create hotel. Aborting.")
        sys.exit(1)
    hotel = hotels[0] if isinstance(hotels, list) else hotels
    hotel_id = hotel["id"]
    print(f"  Hotel created: {hotel['name']} (id: {hotel_id})")

    # ─── 2. FLOORS ───
    print("\n[2/7] Floors...")
    floors = {}
    for i in range(1, 4):
        floor_data = {
            "hotel_id": hotel_id,
            "floor_number": i,
            "name": f"Étage {i}",
            "total_rooms": 4 if i >= 2 else 3
        }
        result = api("POST", "hotel_floors", floor_data)
        if result:
            f = result[0] if isinstance(result, list) else result
            floors[i] = f["id"]
            print(f"  Floor {i}: {f['id']}")

    # ─── 3. USERS (via Supabase Auth) ───
    print("\n[3/7] Users (Supabase Auth)...")
    users_spec = [
        {
            "email": "admin@flowtym.com",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "Flowtym",
            "role": "direction",
            "phone": "+33 6 00 00 00 01"
        },
        {
            "email": "reception@hotel.com",
            "password": "reception123",
            "first_name": "Marie",
            "last_name": "Dupont",
            "role": "reception",
            "phone": "+33 6 00 00 00 02"
        },
        {
            "email": "gouvernante@hotel.com",
            "password": "gouv123",
            "first_name": "Fatima",
            "last_name": "Benali",
            "role": "gouvernante",
            "phone": "+33 6 00 00 00 03"
        },
        {
            "email": "femme1@hotel.com",
            "password": "femme123",
            "first_name": "Amina",
            "last_name": "Kone",
            "role": "femme_de_chambre",
            "phone": "+33 6 00 00 00 04"
        },
        {
            "email": "maintenance@hotel.com",
            "password": "maint123",
            "first_name": "Pierre",
            "last_name": "Martin",
            "role": "maintenance",
            "phone": "+33 6 00 00 00 05"
        }
    ]

    user_ids = {}
    for u in users_spec:
        metadata = {"first_name": u["first_name"], "last_name": u["last_name"], "role": u["role"]}
        auth_user = auth_create_user(u["email"], u["password"], metadata)
        if auth_user:
            auth_id = auth_user["id"]
            # Create public.users row
            pub_user = {
                "auth_id": auth_id,
                "hotel_id": hotel_id,
                "email": u["email"],
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "phone": u.get("phone", ""),
                "role": u["role"],
                "is_active": True
            }
            result = api("POST", "users", pub_user)
            if result:
                row = result[0] if isinstance(result, list) else result
                user_ids[u["email"]] = row["id"]
                print(f"  {u['email']} ({u['role']}): auth={auth_id[:8]}... user={row['id'][:8]}...")
            else:
                print(f"  {u['email']}: Auth OK but public.users insert FAILED")
        else:
            print(f"  {u['email']}: Auth creation FAILED")

    # ─── 4. ROOMS ───
    print("\n[4/7] Rooms (12 chambres)...")
    rooms_spec = [
        {"number": "101", "floor": 1, "type": "Twin",   "bed": "2 lits simples", "cap": 2, "area": 15, "notes": "Douche, Vue Rue"},
        {"number": "102", "floor": 1, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 22, "notes": "Baignoire, Vue Cour"},
        {"number": "103", "floor": 1, "type": "Twin",   "bed": "2 lits simples", "cap": 2, "area": 15, "notes": "Douche, Vue Rue"},
        {"number": "201", "floor": 2, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 16, "notes": "Baignoire, Vue Rue"},
        {"number": "202", "floor": 2, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 25, "notes": "Baignoire, Vue Cour, Deluxe"},
        {"number": "203", "floor": 2, "type": "Twin",   "bed": "2 lits simples", "cap": 2, "area": 16, "notes": "Douche, Vue Rue"},
        {"number": "204", "floor": 2, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 16, "notes": "Baignoire, Vue Cour"},
        {"number": "301", "floor": 3, "type": "Double", "bed": "1 lit king",      "cap": 2, "area": 25, "notes": "Baignoire, Vue Rue, Deluxe"},
        {"number": "302", "floor": 3, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 16, "notes": "Douche, Vue Cour"},
        {"number": "303", "floor": 3, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 16, "notes": "Baignoire, Vue Rue"},
        {"number": "304", "floor": 3, "type": "Double", "bed": "1 lit double",    "cap": 2, "area": 16, "notes": "Douche, Vue Cour"},
    ]

    room_ids = {}
    for rm in rooms_spec:
        room_data = {
            "hotel_id": hotel_id,
            "floor_id": floors.get(rm["floor"]),
            "room_number": rm["number"],
            "room_type": rm["type"],
            "status": "libre",
            "capacity": rm["cap"],
            "bed_type": rm["bed"],
            "surface_area": rm["area"],
            "equipments": json.dumps(["TV", "WiFi", "Minibar", "Coffre"]),
            "notes": rm["notes"],
            "is_active": True
        }
        result = api("POST", "rooms", room_data)
        if result:
            row = result[0] if isinstance(result, list) else result
            room_ids[rm["number"]] = row["id"]
            print(f"  Chambre {rm['number']} ({rm['type']}): {row['id'][:8]}...")

    # ─── 5. HOTEL SETTINGS ───
    print("\n[5/7] Hotel Settings...")
    settings = {
        "hotel_id": hotel_id,
        "checkout_time": "11:00",
        "checkin_time": "15:00",
        "default_cleaning_duration": 30,
        "inspection_required": True,
        "lost_found_retention_days": 90,
        "breakfast_start_time": "07:00",
        "breakfast_end_time": "10:30",
        "timezone": "Europe/Paris"
    }
    result = api("POST", "hotel_settings", settings)
    if result:
        print(f"  Settings created (check-in: 15h, check-out: 11h, cleaning: 30min)")

    # ─── 6. SAMPLE RESERVATIONS ───
    print("\n[6/7] Sample Reservations...")
    reservations = [
        {"guest": "Sophie Laurent", "email": "sophie.l@email.com", "phone": "+33 6 11 22 33 44", "room": "102", "cin": "2026-04-10", "cout": "2026-04-14", "status": "confirmee", "src": "Booking.com", "cnt": 2},
        {"guest": "Marc Dubois", "email": "m.dubois@email.com", "phone": "+33 6 22 33 44 55", "room": "201", "cin": "2026-04-12", "cout": "2026-04-15", "status": "confirmee", "src": "Direct", "cnt": 1},
        {"guest": "Elena Rossi", "email": "elena.r@email.com", "phone": "+39 3 12 34 56 78", "room": "202", "cin": "2026-04-11", "cout": "2026-04-16", "status": "en_cours", "src": "Expedia", "cnt": 2},
        {"guest": "Jean-Pierre Moreau", "email": "jp.moreau@email.com", "phone": "+33 6 33 44 55 66", "room": "301", "cin": "2026-04-08", "cout": "2026-04-12", "status": "check_out", "src": "Direct", "cnt": 2},
        {"guest": "Yuki Tanaka", "email": "yuki.t@email.com", "phone": "+81 90 1234 5678", "room": "103", "cin": "2026-04-14", "cout": "2026-04-18", "status": "confirmee", "src": "Hotels.com", "cnt": 1},
        {"guest": "Ahmed Belkacem", "email": "a.belkacem@email.com", "phone": "+33 6 44 55 66 77", "room": "303", "cin": "2026-04-13", "cout": "2026-04-15", "status": "confirmee", "src": "Booking.com", "cnt": 2},
        {"guest": "Maria Schmidt", "email": "m.schmidt@email.com", "phone": "+49 170 123 4567", "room": "204", "cin": "2026-05-01", "cout": "2026-05-05", "status": "confirmee", "src": "Direct", "cnt": 1},
    ]
    for resa in reservations:
        resa_data = {
            "hotel_id": hotel_id,
            "room_id": room_ids.get(resa["room"]),
            "guest_name": resa["guest"],
            "guest_email": resa["email"],
            "guest_phone": resa["phone"],
            "guest_count": resa["cnt"],
            "check_in": resa["cin"],
            "check_out": resa["cout"],
            "status": resa["status"],
            "source": resa["src"]
        }
        result = api("POST", "reservations", resa_data)
        if result:
            row = result[0] if isinstance(result, list) else result
            print(f"  {resa['guest']} → Ch.{resa['room']} ({resa['cin']} - {resa['cout']}): {resa['status']}")

    # ─── 7. Update room statuses for active reservations ───
    print("\n[7/7] Updating room statuses...")
    occupied_rooms = {"102": "occupee", "201": "occupee", "202": "occupee", "301": "libre"}
    for rnum, status in occupied_rooms.items():
        if rnum in room_ids:
            api("PATCH", "rooms", {"status": status}, {"id": f"eq.{room_ids[rnum]}"})
            print(f"  Chambre {rnum} → {status}")

    print("\n" + "=" * 60)
    print("  SEED TERMINÉ !")
    print(f"  Hotel ID: {hotel_id}")
    print(f"  Users: {len(user_ids)}")
    print(f"  Rooms: {len(room_ids)}")
    print(f"  Reservations: {len(reservations)}")
    print("=" * 60)

    # Save hotel_id for later use
    with open(Path(__file__).parent / '.hotel_id', 'w') as f:
        f.write(hotel_id)


if __name__ == "__main__":
    seed()
