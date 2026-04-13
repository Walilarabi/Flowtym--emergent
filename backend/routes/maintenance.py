"""
Flowtym PMS — Maintenance Routes (Supabase)
CRUD for maintenance tickets, connected to Supabase.
"""
import os
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPA_HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


async def supa(method, table, data=None, params=""):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, url, headers=SUPA_HEADERS, json=data)
        if r.status_code >= 400:
            logger.error(f"Supabase {method} {table}: {r.status_code} {r.text}")
            return []
        try:
            return r.json()
        except Exception:
            return []


class TicketCreate(BaseModel):
    hotel_id: str
    title: str
    description: Optional[str] = ""
    room_number: Optional[str] = None
    priority: str = "normal"  # urgent, high, normal, low
    category: str = "general"  # plumbing, electrical, hvac, furniture, general
    assigned_to: Optional[str] = None
    reported_by: Optional[str] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None


@router.get("/{hotel_id}/tickets")
async def list_tickets(hotel_id: str, status: Optional[str] = None, priority: Optional[str] = None):
    params = f"hotel_id=eq.{hotel_id}&order=created_at.desc"
    if status:
        params += f"&status=eq.{status}"
    if priority:
        params += f"&priority=eq.{priority}"

    # Try Supabase maintenance_tickets table first
    tickets = await supa("GET", "maintenance_tickets", params=params + "&select=*")

    # Fallback: check if table doesn't exist, use reports table
    if not isinstance(tickets, list):
        tickets = []

    # If empty, also check housekeeping reports for maintenance items
    if len(tickets) == 0:
        reports = await supa("GET", "reports",
                            params=f"hotel_id=eq.{hotel_id}&category=ilike.%maintenance%&order=created_at.desc&select=*")
        if isinstance(reports, list) and len(reports) > 0:
            tickets = [{
                "id": r.get("id"),
                "hotel_id": hotel_id,
                "title": r.get("title", r.get("description", "")[:50]),
                "description": r.get("description", ""),
                "room_number": r.get("room_number", r.get("location", "")),
                "priority": r.get("priority", "normal"),
                "status": r.get("status", "open"),
                "category": r.get("category", "general"),
                "assigned_to": r.get("assigned_to"),
                "reported_by": r.get("reported_by"),
                "created_at": r.get("created_at"),
                "updated_at": r.get("updated_at"),
            } for r in reports]

    return {"tickets": tickets, "total": len(tickets)}


@router.get("/{hotel_id}/stats")
async def get_maintenance_stats(hotel_id: str):
    tickets_res = await list_tickets(hotel_id)
    tickets = tickets_res.get("tickets", [])

    open_count = sum(1 for t in tickets if t.get("status") in ("open", "new"))
    in_progress = sum(1 for t in tickets if t.get("status") == "in_progress")
    resolved = sum(1 for t in tickets if t.get("status") in ("resolved", "closed"))
    urgent = sum(1 for t in tickets if t.get("priority") == "urgent")

    return {
        "total": len(tickets),
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "urgent": urgent,
    }


@router.post("/{hotel_id}/tickets")
async def create_ticket(hotel_id: str, ticket: TicketCreate):
    data = {
        "hotel_id": hotel_id,
        "title": ticket.title,
        "description": ticket.description or "",
        "room_number": ticket.room_number,
        "priority": ticket.priority,
        "category": ticket.category,
        "status": "open",
        "assigned_to": ticket.assigned_to,
        "reported_by": ticket.reported_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await supa("POST", "maintenance_tickets", data)
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]

    # Fallback: create in reports table
    report_data = {
        "hotel_id": hotel_id,
        "title": ticket.title,
        "description": ticket.description or "",
        "location": ticket.room_number or "",
        "category": ticket.category,
        "priority": ticket.priority,
        "status": "open",
        "reported_by": ticket.reported_by,
    }
    result = await supa("POST", "reports", report_data)
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]

    return {"id": "temp", **data, "message": "Table maintenance_tickets non trouvee. Creez-la dans Supabase."}


@router.patch("/{hotel_id}/tickets/{ticket_id}")
async def update_ticket(hotel_id: str, ticket_id: str, update: TicketUpdate):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if update.status == "resolved" and not data.get("resolved_at"):
        data["resolved_at"] = datetime.now(timezone.utc).isoformat()

    result = await supa("PATCH", "maintenance_tickets", data, params=f"id=eq.{ticket_id}&hotel_id=eq.{hotel_id}")
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]

    # Try reports table
    result = await supa("PATCH", "reports", data, params=f"id=eq.{ticket_id}&hotel_id=eq.{hotel_id}")
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]

    raise HTTPException(status_code=404, detail="Ticket non trouve")


@router.delete("/{hotel_id}/tickets/{ticket_id}")
async def delete_ticket(hotel_id: str, ticket_id: str):
    await supa("DELETE", "maintenance_tickets", params=f"id=eq.{ticket_id}&hotel_id=eq.{hotel_id}")
    return {"deleted": True}
