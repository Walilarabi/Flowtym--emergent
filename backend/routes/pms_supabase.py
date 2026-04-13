"""
Flowtym PMS API Routes — Supabase
CRUD for reservations, rooms, guests, housekeeping via Supabase
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import os
import httpx

router = APIRouter(prefix="/api/pms", tags=["PMS"])

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HEADERS = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}


async def supa_request(method: str, table: str, data=None, params: str = ""):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, url, headers=HEADERS, json=data)
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        try:
            return r.json()
        except Exception:
            return None


# ─── RESERVATIONS ───

class ReservationCreate(BaseModel):
    hotel_id: str
    room_id: Optional[str] = None
    guest_name: str
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_count: int = 1
    check_in: date
    check_out: date
    source: str = "Direct"
    notes: Optional[str] = None


class ReservationUpdate(BaseModel):
    status: Optional[str] = None
    room_id: Optional[str] = None
    notes: Optional[str] = None


@router.get("/reservations/{hotel_id}")
async def get_reservations(hotel_id: str, status: Optional[str] = None):
    params = f"hotel_id=eq.{hotel_id}&order=check_in.desc&select=*,rooms(room_number,room_type)"
    if status:
        params += f"&status=eq.{status}"
    return await supa_request("GET", "reservations", params=params)


@router.post("/reservations")
async def create_reservation(resa: ReservationCreate):
    data = resa.model_dump()
    data["check_in"] = str(data["check_in"])
    data["check_out"] = str(data["check_out"])
    result = await supa_request("POST", "reservations", data)
    return result[0] if isinstance(result, list) else result


@router.patch("/reservations/{resa_id}")
async def update_reservation(resa_id: str, update: ReservationUpdate):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    data["updated_at"] = datetime.utcnow().isoformat()
    return await supa_request("PATCH", "reservations", data, params=f"id=eq.{resa_id}")


@router.post("/reservations/{resa_id}/checkin")
async def checkin_reservation(resa_id: str):
    await supa_request("PATCH", "reservations", {"status": "en_cours", "updated_at": datetime.utcnow().isoformat()}, params=f"id=eq.{resa_id}")
    resa = await supa_request("GET", "reservations", params=f"id=eq.{resa_id}&select=room_id")
    if resa and resa[0].get("room_id"):
        await supa_request("PATCH", "rooms", {"status": "occupee"}, params=f"id=eq.{resa[0]['room_id']}")
    return {"status": "checked_in"}


@router.post("/reservations/{resa_id}/checkout")
async def checkout_reservation(resa_id: str):
    await supa_request("PATCH", "reservations", {"status": "check_out", "updated_at": datetime.utcnow().isoformat()}, params=f"id=eq.{resa_id}")
    resa = await supa_request("GET", "reservations", params=f"id=eq.{resa_id}&select=room_id,hotel_id")
    if resa and resa[0].get("room_id"):
        room_id = resa[0]["room_id"]
        hotel_id = resa[0]["hotel_id"]
        await supa_request("PATCH", "rooms", {"status": "en_nettoyage"}, params=f"id=eq.{room_id}")
        await supa_request("POST", "room_cleaning_tasks", {
            "hotel_id": hotel_id, "room_id": room_id,
            "cleaning_type": "depart", "status": "a_faire", "priority": 3,
            "scheduled_date": str(date.today()),
            "notes": "Nettoyage post-checkout automatique"
        })
    return {"status": "checked_out"}


@router.delete("/reservations/{resa_id}")
async def cancel_reservation(resa_id: str):
    await supa_request("PATCH", "reservations", {"status": "annulee", "updated_at": datetime.utcnow().isoformat()}, params=f"id=eq.{resa_id}")
    return {"status": "cancelled"}


# ─── ROOMS ───

@router.get("/rooms/{hotel_id}")
async def get_rooms(hotel_id: str):
    return await supa_request("GET", "rooms", params=f"hotel_id=eq.{hotel_id}&is_active=eq.true&order=room_number&select=*,hotel_floors(floor_number,name)")


@router.patch("/rooms/{room_id}/status")
async def update_room_status(room_id: str, request: Request):
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ("libre", "occupee", "en_nettoyage", "inspectee", "bloquee", "maintenance"):
        raise HTTPException(400, "Invalid room status")
    return await supa_request("PATCH", "rooms", {"status": new_status, "updated_at": datetime.utcnow().isoformat()}, params=f"id=eq.{room_id}")


# ─── GUESTS ───

@router.get("/guests/{hotel_id}")
async def get_guests(hotel_id: str, search: Optional[str] = None):
    params = f"hotel_id=eq.{hotel_id}&order=created_at.desc&limit=100"
    if search:
        params += f"&or=(first_name.ilike.%25{search}%25,last_name.ilike.%25{search}%25,email.ilike.%25{search}%25)"
    return await supa_request("GET", "guests", params=params)


class GuestCreate(BaseModel):
    hotel_id: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    nationality: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None


@router.post("/guests")
async def create_guest(guest: GuestCreate):
    result = await supa_request("POST", "guests", guest.model_dump())
    return result[0] if isinstance(result, list) else result


# ─── HOUSEKEEPING ───

@router.get("/housekeeping/{hotel_id}")
async def get_housekeeping_tasks(hotel_id: str, date_filter: Optional[str] = None):
    params = f"hotel_id=eq.{hotel_id}&order=priority.desc&select=*,rooms(room_number,room_type),users!room_cleaning_tasks_assigned_to_fkey(first_name,last_name)"
    if date_filter:
        params += f"&scheduled_date=eq.{date_filter}"
    else:
        params += f"&scheduled_date=eq.{date.today()}"
    return await supa_request("GET", "room_cleaning_tasks", params=params)


@router.patch("/housekeeping/{task_id}/start")
async def start_cleaning_task(task_id: str):
    return await supa_request("PATCH", "room_cleaning_tasks", {
        "status": "en_cours", "started_at": datetime.utcnow().isoformat()
    }, params=f"id=eq.{task_id}")


@router.patch("/housekeeping/{task_id}/complete")
async def complete_cleaning_task(task_id: str):
    task = await supa_request("GET", "room_cleaning_tasks", params=f"id=eq.{task_id}&select=room_id")
    await supa_request("PATCH", "room_cleaning_tasks", {
        "status": "termine", "completed_at": datetime.utcnow().isoformat()
    }, params=f"id=eq.{task_id}")
    if task and task[0].get("room_id"):
        await supa_request("PATCH", "rooms", {"status": "inspectee"}, params=f"id=eq.{task[0]['room_id']}")
    return {"status": "completed"}


@router.patch("/housekeeping/{task_id}/assign")
async def assign_cleaning_task(task_id: str, request: Request):
    body = await request.json()
    staff_id = body.get("staff_id")
    if not staff_id:
        raise HTTPException(400, "staff_id required")
    return await supa_request("PATCH", "room_cleaning_tasks", {"assigned_to": staff_id}, params=f"id=eq.{task_id}")


# ─── DASHBOARD KPIs ───

@router.get("/dashboard/{hotel_id}")
async def get_dashboard(hotel_id: str):
    today = str(date.today())
    rooms, resas, tasks = await asyncio.gather(
        supa_request("GET", "rooms", params=f"hotel_id=eq.{hotel_id}&is_active=eq.true&select=id,status"),
        supa_request("GET", "reservations", params=f"hotel_id=eq.{hotel_id}&select=id,check_in,check_out,status"),
        supa_request("GET", "room_cleaning_tasks", params=f"hotel_id=eq.{hotel_id}&scheduled_date=eq.{today}&select=id,status"),
    )

    total = len(rooms)
    occupied = sum(1 for r in rooms if r["status"] == "occupee")
    arrivals = sum(1 for r in resas if r["check_in"] == today and r["status"] in ("confirmee", "check_in"))
    departures = sum(1 for r in resas if r["check_out"] == today and r["status"] in ("en_cours", "check_out"))
    in_house = sum(1 for r in resas if r["check_in"] <= today and r["check_out"] > today and r["status"] not in ("annulee", "no_show"))

    return {
        "to_percent": round(occupied / max(total, 1) * 100),
        "adr": 120,
        "revpar": round(120 * occupied / max(total, 1)),
        "rooms_total": total,
        "rooms_free": total - occupied,
        "arrivals": arrivals,
        "departures": departures,
        "in_house": in_house,
        "cleaning_done": sum(1 for t in tasks if t["status"] == "termine"),
        "cleaning_total": len(tasks),
    }


import asyncio
