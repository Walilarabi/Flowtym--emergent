"""
Flowtym PMS — Moteur de Règles d'Automatisation (Yield Management)
Évalue les règles MLOS, pricing, CTA/CTD, pickup, overbooking
"""
import os
import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pms/automation", tags=["Automation"])

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HEADERS = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}


async def supa(method: str, table: str, data=None, params: str = ""):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, url, headers=HEADERS, json=data)
        if r.status_code >= 400:
            logger.error(f"Supabase {method} {table}: {r.status_code} {r.text}")
            return []
        try:
            return r.json()
        except Exception:
            return []


# ─── CONTEXT BUILDERS ───

async def get_occupation_context(hotel_id: str, target_date: date) -> Dict:
    date_str = str(target_date)
    rooms = await supa("GET", "rooms", params=f"hotel_id=eq.{hotel_id}&is_active=eq.true&select=id")
    resas = await supa("GET", "reservations", params=f"hotel_id=eq.{hotel_id}&status=neq.annulee&status=neq.no_show&select=id,check_in,check_out")
    total = len(rooms) or 1

    def occ_for_date(d: str) -> float:
        return sum(1 for r in resas if r.get("check_in","") <= d < r.get("check_out","")) / total * 100

    return {
        "occupation_rate_today": round(occ_for_date(date_str), 1),
        "occupation_rate_7d": round(occ_for_date(str(target_date + timedelta(days=7))), 1),
        "occupation_rate_14d": round(occ_for_date(str(target_date + timedelta(days=14))), 1),
        "occupation_rate_30d": round(occ_for_date(str(target_date + timedelta(days=30))), 1),
        "available_rooms": total - int(occ_for_date(date_str) * total / 100),
        "total_rooms": total,
    }


async def get_pickup_context(hotel_id: str, days: int = 30) -> Dict:
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    resas = await supa("GET", "reservations", params=f"hotel_id=eq.{hotel_id}&created_at=gte.{cutoff}&select=created_at")
    daily = {}
    for r in resas:
        d = r.get("created_at", "")[:10]
        daily[d] = daily.get(d, 0) + 1
    vals = list(daily.values())
    avg = sum(vals) / len(vals) if vals else 0
    today_p = daily.get(str(date.today()), 0)
    return {
        "avg_pickup_last_30d": round(avg, 1),
        "today_pickup": today_p,
        "pickup_trend": "low" if today_p < avg * 0.7 else ("high" if today_p > avg * 1.3 else "normal"),
    }


# ─── RULE EVALUATION ───

def evaluate_condition(cond: Dict, ctx: Dict) -> bool:
    field = cond.get("field", "")
    op = cond.get("operator", "")
    val = cond.get("value")
    cv = ctx.get(field)
    if cv is None:
        return False
    try:
        if op == ">": return float(cv) > float(val)
        if op == "<": return float(cv) < float(val)
        if op == ">=": return float(cv) >= float(val)
        if op == "<=": return float(cv) <= float(val)
        if op == "=": return cv == val
        if op == "!=": return cv != val
        if op == "between": return float(val[0]) <= float(cv) <= float(val[1])
        if op == "in": return cv in val
    except (TypeError, ValueError):
        return False
    return False


def evaluate_rule(rule: Dict, ctx: Dict) -> bool:
    conditions = rule.get("conditions", {}).get("conditions", [])
    operator = rule.get("conditions", {}).get("operator", "and")
    results = [evaluate_condition(c, ctx) for c in conditions]
    return all(results) if operator == "and" else any(results)


# ─── ACTION EXECUTION ───

async def execute_action(action: Dict, hotel_id: str, ctx: Dict) -> Dict:
    atype = action.get("type", "")

    if atype == "set_mlos":
        mlos = action.get("value", 2)
        for i in range(mlos):
            d = str(ctx["target_date"] + timedelta(days=i))
            await supa("POST", "booking_restrictions", {
                "hotel_id": hotel_id, "date": d,
                "restriction_type": "mlos", "is_active": True,
                "reason": f"MLOS {mlos} auto"
            })
        return {"type": "set_mlos", "value": mlos}

    if atype == "increase_rate":
        pct = action.get("value", 0)
        base = ctx.get("base_rate", 120)
        new_rate = round(base * (1 + pct / 100), 2)
        cap = base * (1 + action.get("max_cap", 50) / 100)
        new_rate = min(new_rate, cap)
        return {"type": "increase_rate", "pct": pct, "new_rate": new_rate}

    if atype == "decrease_rate":
        pct = action.get("value", 0)
        base = ctx.get("base_rate", 120)
        new_rate = round(base * (1 - pct / 100), 2)
        floor = base * (1 - action.get("max_reduction", 30) / 100)
        new_rate = max(new_rate, floor)
        return {"type": "decrease_rate", "pct": pct, "new_rate": new_rate}

    if atype == "activate_cta":
        d = str(ctx["target_date"])
        await supa("POST", "booking_restrictions", {
            "hotel_id": hotel_id, "date": d,
            "restriction_type": "cta", "is_active": True, "reason": "CTA auto"
        })
        return {"type": "activate_cta"}

    if atype == "activate_ctd":
        d = str(ctx["target_date"])
        await supa("POST", "booking_restrictions", {
            "hotel_id": hotel_id, "date": d,
            "restriction_type": "ctd", "is_active": True, "reason": "CTD auto"
        })
        return {"type": "activate_ctd"}

    if atype == "multiple":
        results = []
        for sub in action.get("actions", []):
            r = await execute_action(sub, hotel_id, ctx)
            results.append(r)
        return {"type": "multiple", "results": results}

    return {"type": atype, "error": "unknown action"}


# ─── MAIN ENGINE ───

async def run_engine(hotel_id: str, target_date: date) -> Dict:
    result = {"hotel_id": hotel_id, "date": str(target_date), "evaluated": 0, "triggered": 0, "actions": [], "errors": []}

    rules = await supa("GET", "automation_rules", params=f"hotel_id=eq.{hotel_id}&is_active=eq.true&order=priority")
    if not rules:
        return result

    occ = await get_occupation_context(hotel_id, target_date)
    pickup = await get_pickup_context(hotel_id)

    ctx = {
        "target_date": target_date,
        "days_before_arrival": (target_date - date.today()).days,
        "current_hour": datetime.utcnow().hour,
        "is_weekend": target_date.weekday() >= 5,
        "base_rate": 120,
        **occ, **pickup,
    }

    for rule in rules:
        result["evaluated"] += 1
        try:
            if evaluate_rule(rule, ctx):
                result["triggered"] += 1
                action_result = await execute_action(rule.get("actions", {}), hotel_id, ctx)
                result["actions"].append({"rule": rule["name"], "result": action_result})
                await supa("POST", "automation_logs", {
                    "hotel_id": hotel_id, "rule_id": rule["id"], "rule_name": rule["name"],
                    "trigger_date": str(target_date), "conditions_met": True,
                    "actions_taken": action_result
                })
        except Exception as e:
            result["errors"].append({"rule": rule.get("name"), "error": str(e)})

    return result


# ─── API ROUTES ───

@router.get("/rules/{hotel_id}")
async def get_rules(hotel_id: str):
    return await supa("GET", "automation_rules", params=f"hotel_id=eq.{hotel_id}&order=priority")


class RuleCreate(BaseModel):
    hotel_id: str
    name: str
    description: Optional[str] = None
    category: str
    priority: int = 0
    conditions: dict
    actions: dict
    is_active: bool = True


@router.post("/rules")
async def create_rule(rule: RuleCreate):
    result = await supa("POST", "automation_rules", rule.model_dump())
    return result[0] if isinstance(result, list) and result else result


@router.patch("/rules/{rule_id}")
async def update_rule(rule_id: str, request: Request):
    body = await request.json()
    body["updated_at"] = datetime.utcnow().isoformat()
    return await supa("PATCH", "automation_rules", body, params=f"id=eq.{rule_id}")


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    await supa("DELETE", "automation_rules", params=f"id=eq.{rule_id}")
    return {"deleted": True}


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str):
    rule = await supa("GET", "automation_rules", params=f"id=eq.{rule_id}&select=is_active")
    if not rule:
        raise HTTPException(404, "Rule not found")
    new_state = not rule[0]["is_active"]
    await supa("PATCH", "automation_rules", {"is_active": new_state}, params=f"id=eq.{rule_id}")
    return {"is_active": new_state}


@router.get("/settings/{hotel_id}")
async def get_settings(hotel_id: str):
    result = await supa("GET", "automation_settings", params=f"hotel_id=eq.{hotel_id}")
    return result[0] if result else {"hotel_id": hotel_id, "execution_frequency": "hourly", "max_price_increase_pct": 50, "max_price_decrease_pct": 30}


@router.patch("/settings/{hotel_id}")
async def update_settings(hotel_id: str, request: Request):
    body = await request.json()
    body["updated_at"] = datetime.utcnow().isoformat()
    await supa("PATCH", "automation_settings", body, params=f"hotel_id=eq.{hotel_id}")
    return {"updated": True}


@router.get("/logs/{hotel_id}")
async def get_logs(hotel_id: str, limit: int = 50):
    return await supa("GET", "automation_logs", params=f"hotel_id=eq.{hotel_id}&order=created_at.desc&limit={limit}")


@router.post("/run/{hotel_id}")
async def run_now(hotel_id: str, background_tasks: BackgroundTasks):
    """Exécuter manuellement le moteur pour aujourd'hui + 30 jours"""
    async def _run():
        results = []
        for i in range(30):
            d = date.today() + timedelta(days=i)
            r = await run_engine(hotel_id, d)
            results.append(r)
        logger.info(f"Automation run: {sum(r['triggered'] for r in results)} rules triggered over 30 days")

    background_tasks.add_task(_run)
    return {"status": "running", "message": "Moteur lancé pour 30 jours"}


@router.get("/restrictions/{hotel_id}")
async def get_restrictions(hotel_id: str, start: Optional[str] = None, end: Optional[str] = None):
    params = f"hotel_id=eq.{hotel_id}&is_active=eq.true&order=date"
    if start:
        params += f"&date=gte.{start}"
    if end:
        params += f"&date=lte.{end}"
    return await supa("GET", "booking_restrictions", params=params)
