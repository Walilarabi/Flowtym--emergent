from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'flowtym-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Create the main app
app = FastAPI(title="Flowtym PMS API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "receptionist"  # admin, manager, receptionist, housekeeping

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    hotel_id: Optional[str] = None
    created_at: str

class HotelCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "France"
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    stars: int = 3
    timezone: str = "Europe/Paris"

class HotelResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: str
    phone: Optional[str] = None
    email: Optional[str] = None
    stars: int
    timezone: str
    created_at: str

class RoomCreate(BaseModel):
    number: str
    room_type: str  # single, double, twin, suite, family
    floor: int = 1
    max_occupancy: int = 2
    base_price: float = 100.0
    amenities: List[str] = []
    status: str = "available"  # available, occupied, cleaning, maintenance, out_of_service

class RoomResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    number: str
    room_type: str
    floor: int
    max_occupancy: int
    base_price: float
    amenities: List[str]
    status: str
    created_at: str

class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "France"
    language: str = "fr"
    birth_date: Optional[str] = None
    id_type: Optional[str] = None  # passport, id_card, driver_license
    id_number: Optional[str] = None
    company: Optional[str] = None
    vat_number: Optional[str] = None
    tags: List[str] = []
    preferences: Dict[str, Any] = {}
    notes: Optional[str] = None

class ClientResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str
    language: str
    birth_date: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    company: Optional[str] = None
    vat_number: Optional[str] = None
    tags: List[str]
    preferences: Dict[str, Any]
    notes: Optional[str] = None
    total_stays: int = 0
    total_revenue: float = 0.0
    created_at: str

class ReservationCreate(BaseModel):
    client_id: str
    room_id: str
    check_in: str  # ISO date format
    check_out: str
    adults: int = 1
    children: int = 0
    channel: str = "direct"  # direct, booking_com, expedia, airbnb, other
    rate_type: str = "standard"  # standard, flex, non_refundable, corporate
    room_rate: float
    total_amount: float
    notes: Optional[str] = None
    special_requests: Optional[str] = None
    source: Optional[str] = None  # website, phone, walk-in, ota

class ReservationUpdate(BaseModel):
    room_id: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    status: Optional[str] = None
    room_rate: Optional[float] = None
    total_amount: Optional[float] = None
    notes: Optional[str] = None
    special_requests: Optional[str] = None

class ReservationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    client_id: str
    client_name: str
    client_email: Optional[str] = None
    room_id: str
    room_number: str
    room_type: str
    check_in: str
    check_out: str
    nights: int
    adults: int
    children: int
    status: str  # pending, confirmed, checked_in, checked_out, cancelled, no_show
    channel: str
    rate_type: str
    room_rate: float
    total_amount: float
    paid_amount: float
    balance: float
    notes: Optional[str] = None
    special_requests: Optional[str] = None
    source: Optional[str] = None
    created_at: str
    updated_at: str

class InvoiceLineCreate(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float
    vat_rate: float = 10.0
    category: str = "room"  # room, breakfast, extra, tax, discount

class InvoiceCreate(BaseModel):
    reservation_id: str
    lines: List[InvoiceLineCreate] = []

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    reservation_id: str
    client_id: str
    client_name: str
    invoice_number: str
    lines: List[Dict[str, Any]]
    subtotal: float
    vat_total: float
    total: float
    status: str  # draft, sent, paid, cancelled
    payment_method: Optional[str] = None
    paid_at: Optional[str] = None
    created_at: str

class PaymentCreate(BaseModel):
    reservation_id: str
    amount: float
    method: str = "card"  # card, cash, transfer, check
    reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    reservation_id: str
    invoice_id: Optional[str] = None
    amount: float
    method: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: str  # pending, completed, failed, refunded
    created_at: str

class NightAuditCreate(BaseModel):
    date: str  # ISO date for which audit is being done
    notes: Optional[str] = None

class NightAuditResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    date: str
    status: str  # in_progress, completed
    total_rooms: int
    occupied_rooms: int
    occupancy_rate: float
    arrivals: int
    departures: int
    no_shows: int
    revenue: float
    adr: float
    revpar: float
    completed_by: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, hotel_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "hotel_id": hotel_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "hotel_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email, user.role)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user["id"], user["email"], user["role"], user.get("hotel_id"))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
            "hotel_id": user.get("hotel_id")
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return UserResponse(**user)

# ===================== HOTELS ROUTES =====================

@api_router.post("/hotels", response_model=HotelResponse)
async def create_hotel(hotel: HotelCreate, current_user: dict = Depends(get_current_user)):
    hotel_id = str(uuid.uuid4())
    hotel_doc = {
        "id": hotel_id,
        **hotel.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.hotels.insert_one(hotel_doc)
    
    # Update user's hotel_id
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"hotel_id": hotel_id}}
    )
    
    return HotelResponse(**hotel_doc)

@api_router.get("/hotels", response_model=List[HotelResponse])
async def get_hotels(current_user: dict = Depends(get_current_user)):
    hotels = await db.hotels.find({}, {"_id": 0}).to_list(100)
    return [HotelResponse(**h) for h in hotels]

@api_router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    hotel = await db.hotels.find_one({"id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hôtel non trouvé")
    return HotelResponse(**hotel)

# ===================== ROOMS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/rooms", response_model=RoomResponse)
async def create_room(hotel_id: str, room: RoomCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.rooms.find_one({"hotel_id": hotel_id, "number": room.number})
    if existing:
        raise HTTPException(status_code=400, detail="Numéro de chambre déjà utilisé")
    
    room_id = str(uuid.uuid4())
    room_doc = {
        "id": room_id,
        "hotel_id": hotel_id,
        **room.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.rooms.insert_one(room_doc)
    return RoomResponse(**room_doc)

@api_router.get("/hotels/{hotel_id}/rooms", response_model=List[RoomResponse])
async def get_rooms(hotel_id: str, current_user: dict = Depends(get_current_user)):
    rooms = await db.rooms.find({"hotel_id": hotel_id}, {"_id": 0}).sort("number", 1).to_list(500)
    return [RoomResponse(**r) for r in rooms]

@api_router.put("/hotels/{hotel_id}/rooms/{room_id}", response_model=RoomResponse)
async def update_room(hotel_id: str, room_id: str, room: RoomCreate, current_user: dict = Depends(get_current_user)):
    result = await db.rooms.update_one(
        {"id": room_id, "hotel_id": hotel_id},
        {"$set": room.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chambre non trouvée")
    
    updated = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    return RoomResponse(**updated)

@api_router.patch("/hotels/{hotel_id}/rooms/{room_id}/status", response_model=RoomResponse)
async def update_room_status(hotel_id: str, room_id: str, status: str, current_user: dict = Depends(get_current_user)):
    result = await db.rooms.update_one(
        {"id": room_id, "hotel_id": hotel_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chambre non trouvée")
    
    updated = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    return RoomResponse(**updated)

# ===================== CLIENTS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/clients", response_model=ClientResponse)
async def create_client(hotel_id: str, client: ClientCreate, current_user: dict = Depends(get_current_user)):
    client_id = str(uuid.uuid4())
    client_doc = {
        "id": client_id,
        "hotel_id": hotel_id,
        **client.model_dump(),
        "total_stays": 0,
        "total_revenue": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clients.insert_one(client_doc)
    return ClientResponse(**client_doc)

@api_router.get("/hotels/{hotel_id}/clients", response_model=List[ClientResponse])
async def get_clients(
    hotel_id: str, 
    search: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"hotel_id": hotel_id}
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if tag:
        query["tags"] = tag
    
    clients = await db.clients.find(query, {"_id": 0}).sort("last_name", 1).to_list(1000)
    return [ClientResponse(**c) for c in clients]

@api_router.get("/hotels/{hotel_id}/clients/{client_id}", response_model=ClientResponse)
async def get_client(hotel_id: str, client_id: str, current_user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "hotel_id": hotel_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return ClientResponse(**client)

@api_router.put("/hotels/{hotel_id}/clients/{client_id}", response_model=ClientResponse)
async def update_client(hotel_id: str, client_id: str, client: ClientCreate, current_user: dict = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"id": client_id, "hotel_id": hotel_id},
        {"$set": client.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return ClientResponse(**updated)

# ===================== RESERVATIONS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/reservations", response_model=ReservationResponse)
async def create_reservation(hotel_id: str, reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    # Validate client exists
    client = await db.clients.find_one({"id": reservation.client_id, "hotel_id": hotel_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    # Validate room exists
    room = await db.rooms.find_one({"id": reservation.room_id, "hotel_id": hotel_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chambre non trouvée")
    
    # Check availability
    check_in = datetime.fromisoformat(reservation.check_in.replace('Z', '+00:00'))
    check_out = datetime.fromisoformat(reservation.check_out.replace('Z', '+00:00'))
    nights = (check_out - check_in).days
    
    conflict = await db.reservations.find_one({
        "room_id": reservation.room_id,
        "status": {"$nin": ["cancelled", "no_show"]},
        "$or": [
            {"check_in": {"$lt": reservation.check_out, "$gte": reservation.check_in}},
            {"check_out": {"$gt": reservation.check_in, "$lte": reservation.check_out}},
            {"$and": [{"check_in": {"$lte": reservation.check_in}}, {"check_out": {"$gte": reservation.check_out}}]}
        ]
    })
    if conflict:
        raise HTTPException(status_code=400, detail="La chambre n'est pas disponible pour ces dates")
    
    reservation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    reservation_doc = {
        "id": reservation_id,
        "hotel_id": hotel_id,
        **reservation.model_dump(),
        "client_name": f"{client['first_name']} {client['last_name']}",
        "client_email": client.get("email"),
        "room_number": room["number"],
        "room_type": room["room_type"],
        "nights": nights,
        "status": "confirmed",
        "paid_amount": 0.0,
        "balance": reservation.total_amount,
        "created_at": now,
        "updated_at": now
    }
    await db.reservations.insert_one(reservation_doc)
    
    # Update client stats
    await db.clients.update_one(
        {"id": reservation.client_id},
        {"$inc": {"total_stays": 1, "total_revenue": reservation.total_amount}}
    )
    
    return ReservationResponse(**reservation_doc)

@api_router.get("/hotels/{hotel_id}/reservations", response_model=List[ReservationResponse])
async def get_reservations(
    hotel_id: str,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"hotel_id": hotel_id}
    if status:
        query["status"] = status
    if channel:
        query["channel"] = channel
    if from_date and to_date:
        query["$or"] = [
            {"check_in": {"$gte": from_date, "$lte": to_date}},
            {"check_out": {"$gte": from_date, "$lte": to_date}},
            {"$and": [{"check_in": {"$lte": from_date}}, {"check_out": {"$gte": to_date}}]}
        ]
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("check_in", 1).to_list(1000)
    return [ReservationResponse(**r) for r in reservations]

@api_router.get("/hotels/{hotel_id}/reservations/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(hotel_id: str, reservation_id: str, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": reservation_id, "hotel_id": hotel_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    return ReservationResponse(**reservation)

@api_router.put("/hotels/{hotel_id}/reservations/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(hotel_id: str, reservation_id: str, update: ReservationUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.reservations.update_one(
        {"id": reservation_id, "hotel_id": hotel_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    updated = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    return ReservationResponse(**updated)

@api_router.patch("/hotels/{hotel_id}/reservations/{reservation_id}/status", response_model=ReservationResponse)
async def update_reservation_status(hotel_id: str, reservation_id: str, status: str, current_user: dict = Depends(get_current_user)):
    valid_statuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs acceptées: {valid_statuses}")
    
    result = await db.reservations.update_one(
        {"id": reservation_id, "hotel_id": hotel_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    updated = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    return ReservationResponse(**updated)

# ===================== ARRIVALS/DEPARTURES =====================

@api_router.get("/hotels/{hotel_id}/arrivals", response_model=List[ReservationResponse])
async def get_arrivals(hotel_id: str, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    reservations = await db.reservations.find({
        "hotel_id": hotel_id,
        "check_in": {"$regex": f"^{target_date}"},
        "status": {"$in": ["confirmed", "pending"]}
    }, {"_id": 0}).to_list(100)
    return [ReservationResponse(**r) for r in reservations]

@api_router.get("/hotels/{hotel_id}/departures", response_model=List[ReservationResponse])
async def get_departures(hotel_id: str, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    reservations = await db.reservations.find({
        "hotel_id": hotel_id,
        "check_out": {"$regex": f"^{target_date}"},
        "status": "checked_in"
    }, {"_id": 0}).to_list(100)
    return [ReservationResponse(**r) for r in reservations]

# ===================== INVOICES ROUTES =====================

@api_router.post("/hotels/{hotel_id}/invoices", response_model=InvoiceResponse)
async def create_invoice(hotel_id: str, invoice: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": invoice.reservation_id, "hotel_id": hotel_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    # Generate invoice number
    count = await db.invoices.count_documents({"hotel_id": hotel_id})
    invoice_number = f"FAC-{datetime.now().strftime('%Y%m')}-{str(count + 1).zfill(5)}"
    
    # Calculate totals
    lines = []
    subtotal = 0.0
    vat_total = 0.0
    
    for line in invoice.lines:
        line_total = line.quantity * line.unit_price
        line_vat = line_total * (line.vat_rate / 100)
        lines.append({
            "description": line.description,
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "vat_rate": line.vat_rate,
            "vat_amount": round(line_vat, 2),
            "total": round(line_total + line_vat, 2),
            "category": line.category
        })
        subtotal += line_total
        vat_total += line_vat
    
    invoice_id = str(uuid.uuid4())
    invoice_doc = {
        "id": invoice_id,
        "hotel_id": hotel_id,
        "reservation_id": invoice.reservation_id,
        "client_id": reservation["client_id"],
        "client_name": reservation["client_name"],
        "invoice_number": invoice_number,
        "lines": lines,
        "subtotal": round(subtotal, 2),
        "vat_total": round(vat_total, 2),
        "total": round(subtotal + vat_total, 2),
        "status": "draft",
        "payment_method": None,
        "paid_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(invoice_doc)
    return InvoiceResponse(**invoice_doc)

@api_router.get("/hotels/{hotel_id}/invoices", response_model=List[InvoiceResponse])
async def get_invoices(hotel_id: str, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if status:
        query["status"] = status
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [InvoiceResponse(**i) for i in invoices]

@api_router.get("/hotels/{hotel_id}/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(hotel_id: str, invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id, "hotel_id": hotel_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return InvoiceResponse(**invoice)

# ===================== PAYMENTS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/payments", response_model=PaymentResponse)
async def create_payment(hotel_id: str, payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": payment.reservation_id, "hotel_id": hotel_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    payment_id = str(uuid.uuid4())
    payment_doc = {
        "id": payment_id,
        "hotel_id": hotel_id,
        **payment.model_dump(),
        "invoice_id": None,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    # Update reservation balance
    new_paid = reservation["paid_amount"] + payment.amount
    new_balance = reservation["total_amount"] - new_paid
    await db.reservations.update_one(
        {"id": payment.reservation_id},
        {"$set": {"paid_amount": new_paid, "balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return PaymentResponse(**payment_doc)

@api_router.get("/hotels/{hotel_id}/payments", response_model=List[PaymentResponse])
async def get_payments(hotel_id: str, reservation_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if reservation_id:
        query["reservation_id"] = reservation_id
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [PaymentResponse(**p) for p in payments]

# ===================== NIGHT AUDIT ROUTES =====================

@api_router.post("/hotels/{hotel_id}/night-audit", response_model=NightAuditResponse)
async def create_night_audit(hotel_id: str, audit: NightAuditCreate, current_user: dict = Depends(get_current_user)):
    # Check if audit already exists for this date
    existing = await db.night_audits.find_one({"hotel_id": hotel_id, "date": audit.date})
    if existing:
        raise HTTPException(status_code=400, detail="La clôture existe déjà pour cette date")
    
    # Get statistics for the date
    total_rooms = await db.rooms.count_documents({"hotel_id": hotel_id, "status": {"$ne": "out_of_service"}})
    
    # Count occupied rooms (reservations that span this date)
    occupied_reservations = await db.reservations.find({
        "hotel_id": hotel_id,
        "check_in": {"$lte": audit.date},
        "check_out": {"$gt": audit.date},
        "status": {"$in": ["checked_in", "confirmed"]}
    }, {"_id": 0}).to_list(1000)
    occupied_rooms = len(occupied_reservations)
    
    # Count arrivals
    arrivals = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_in": {"$regex": f"^{audit.date}"},
        "status": {"$in": ["checked_in", "confirmed"]}
    })
    
    # Count departures
    departures = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_out": {"$regex": f"^{audit.date}"},
        "status": "checked_out"
    })
    
    # Count no-shows
    no_shows = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_in": {"$regex": f"^{audit.date}"},
        "status": "no_show"
    })
    
    # Calculate revenue
    revenue = sum(r.get("room_rate", 0) for r in occupied_reservations)
    
    # Calculate metrics
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    adr = (revenue / occupied_rooms) if occupied_rooms > 0 else 0
    revpar = (revenue / total_rooms) if total_rooms > 0 else 0
    
    audit_id = str(uuid.uuid4())
    audit_doc = {
        "id": audit_id,
        "hotel_id": hotel_id,
        "date": audit.date,
        "status": "completed",
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "occupancy_rate": round(occupancy_rate, 2),
        "arrivals": arrivals,
        "departures": departures,
        "no_shows": no_shows,
        "revenue": round(revenue, 2),
        "adr": round(adr, 2),
        "revpar": round(revpar, 2),
        "completed_by": current_user["user_id"],
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "notes": audit.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.night_audits.insert_one(audit_doc)
    return NightAuditResponse(**audit_doc)

@api_router.get("/hotels/{hotel_id}/night-audit", response_model=List[NightAuditResponse])
async def get_night_audits(hotel_id: str, current_user: dict = Depends(get_current_user)):
    audits = await db.night_audits.find({"hotel_id": hotel_id}, {"_id": 0}).sort("date", -1).to_list(365)
    return [NightAuditResponse(**a) for a in audits]

@api_router.get("/hotels/{hotel_id}/night-audit/{date}", response_model=NightAuditResponse)
async def get_night_audit(hotel_id: str, date: str, current_user: dict = Depends(get_current_user)):
    audit = await db.night_audits.find_one({"hotel_id": hotel_id, "date": date}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Clôture non trouvée")
    return NightAuditResponse(**audit)

# ===================== DASHBOARD/KPIs ROUTES =====================

@api_router.get("/hotels/{hotel_id}/dashboard")
async def get_dashboard(hotel_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get total rooms
    total_rooms = await db.rooms.count_documents({"hotel_id": hotel_id, "status": {"$ne": "out_of_service"}})
    
    # Get today's occupied rooms
    occupied = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_in": {"$lte": today},
        "check_out": {"$gt": today},
        "status": {"$in": ["checked_in", "confirmed"]}
    })
    
    # Get today's arrivals
    arrivals = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_in": {"$regex": f"^{today}"},
        "status": {"$in": ["confirmed", "pending"]}
    })
    
    # Get today's departures
    departures = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_out": {"$regex": f"^{today}"},
        "status": "checked_in"
    })
    
    # Get today's revenue
    today_reservations = await db.reservations.find({
        "hotel_id": hotel_id,
        "check_in": {"$lte": today},
        "check_out": {"$gt": today},
        "status": {"$in": ["checked_in", "confirmed"]}
    }, {"_id": 0, "room_rate": 1}).to_list(1000)
    revenue = sum(r.get("room_rate", 0) for r in today_reservations)
    
    # Calculate metrics
    occupancy_rate = (occupied / total_rooms * 100) if total_rooms > 0 else 0
    adr = (revenue / occupied) if occupied > 0 else 0
    revpar = (revenue / total_rooms) if total_rooms > 0 else 0
    
    # Get reservations count
    total_reservations = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "status": {"$nin": ["cancelled"]}
    })
    
    return {
        "date": today,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied,
        "available_rooms": total_rooms - occupied,
        "occupancy_rate": round(occupancy_rate, 1),
        "arrivals": arrivals,
        "departures": departures,
        "revenue": round(revenue, 2),
        "adr": round(adr, 2),
        "revpar": round(revpar, 2),
        "total_reservations": total_reservations
    }

# ===================== REPORTS ROUTES =====================

@api_router.get("/hotels/{hotel_id}/reports/occupancy")
async def get_occupancy_report(hotel_id: str, from_date: str, to_date: str, current_user: dict = Depends(get_current_user)):
    # Get daily occupancy for date range
    total_rooms = await db.rooms.count_documents({"hotel_id": hotel_id, "status": {"$ne": "out_of_service"}})
    
    data = []
    current = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        occupied = await db.reservations.count_documents({
            "hotel_id": hotel_id,
            "check_in": {"$lte": date_str},
            "check_out": {"$gt": date_str},
            "status": {"$in": ["checked_in", "confirmed", "checked_out"]}
        })
        
        occupancy = (occupied / total_rooms * 100) if total_rooms > 0 else 0
        data.append({
            "date": date_str,
            "occupied": occupied,
            "available": total_rooms - occupied,
            "occupancy_rate": round(occupancy, 1)
        })
        current += timedelta(days=1)
    
    return {"total_rooms": total_rooms, "data": data}

@api_router.get("/hotels/{hotel_id}/reports/revenue")
async def get_revenue_report(hotel_id: str, from_date: str, to_date: str, current_user: dict = Depends(get_current_user)):
    # Get revenue by channel
    pipeline = [
        {
            "$match": {
                "hotel_id": hotel_id,
                "check_in": {"$gte": from_date, "$lte": to_date},
                "status": {"$nin": ["cancelled"]}
            }
        },
        {
            "$group": {
                "_id": "$channel",
                "count": {"$sum": 1},
                "revenue": {"$sum": "$total_amount"}
            }
        }
    ]
    
    results = await db.reservations.aggregate(pipeline).to_list(100)
    
    by_channel = []
    total_revenue = 0
    total_count = 0
    for r in results:
        by_channel.append({
            "channel": r["_id"],
            "count": r["count"],
            "revenue": round(r["revenue"], 2)
        })
        total_revenue += r["revenue"]
        total_count += r["count"]
    
    return {
        "from_date": from_date,
        "to_date": to_date,
        "total_revenue": round(total_revenue, 2),
        "total_reservations": total_count,
        "by_channel": by_channel
    }

@api_router.get("/hotels/{hotel_id}/reports/payments")
async def get_payments_report(hotel_id: str, from_date: str, to_date: str, current_user: dict = Depends(get_current_user)):
    pipeline = [
        {
            "$match": {
                "hotel_id": hotel_id,
                "created_at": {"$gte": from_date, "$lte": to_date + "T23:59:59"},
                "status": "completed"
            }
        },
        {
            "$group": {
                "_id": "$method",
                "count": {"$sum": 1},
                "total": {"$sum": "$amount"}
            }
        }
    ]
    
    results = await db.payments.aggregate(pipeline).to_list(100)
    
    by_method = []
    total = 0
    for r in results:
        by_method.append({
            "method": r["_id"],
            "count": r["count"],
            "total": round(r["total"], 2)
        })
        total += r["total"]
    
    return {
        "from_date": from_date,
        "to_date": to_date,
        "total": round(total, 2),
        "by_method": by_method
    }

# ===================== PLANNING DATA =====================

@api_router.get("/hotels/{hotel_id}/planning")
async def get_planning_data(hotel_id: str, from_date: str, to_date: str, current_user: dict = Depends(get_current_user)):
    # Get all rooms
    rooms = await db.rooms.find({"hotel_id": hotel_id}, {"_id": 0}).sort([("floor", 1), ("number", 1)]).to_list(500)
    
    # Get all reservations in date range
    reservations = await db.reservations.find({
        "hotel_id": hotel_id,
        "status": {"$nin": ["cancelled"]},
        "$or": [
            {"check_in": {"$gte": from_date, "$lte": to_date}},
            {"check_out": {"$gte": from_date, "$lte": to_date}},
            {"$and": [{"check_in": {"$lte": from_date}}, {"check_out": {"$gte": to_date}}]}
        ]
    }, {"_id": 0}).to_list(1000)
    
    # Calculate daily availability
    total_rooms = len([r for r in rooms if r["status"] != "out_of_service"])
    daily_stats = []
    current = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        occupied = sum(1 for r in reservations 
                      if r["check_in"][:10] <= date_str and r["check_out"][:10] > date_str)
        revenue = sum(r.get("room_rate", 0) for r in reservations 
                     if r["check_in"][:10] <= date_str and r["check_out"][:10] > date_str)
        
        daily_stats.append({
            "date": date_str,
            "available": total_rooms - occupied,
            "occupied": occupied,
            "occupancy_rate": round((occupied / total_rooms * 100) if total_rooms > 0 else 0, 1),
            "adr": round((revenue / occupied) if occupied > 0 else 0, 2)
        })
        current += timedelta(days=1)
    
    return {
        "rooms": rooms,
        "reservations": reservations,
        "daily_stats": daily_stats
    }

# ===================== ROOT & HEALTH =====================

@api_router.get("/")
async def root():
    return {"message": "Flowtym PMS API v1.0", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
