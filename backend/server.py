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

# ===================== STAFF MODELS =====================

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: str  # receptionist, housekeeper, maintenance, manager, chef, waiter
    department: str  # front_office, housekeeping, maintenance, food_beverage, administration
    contract_type: str = "cdi"  # cdi, cdd, interim, stage, apprentissage
    hire_date: str
    birth_date: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    social_security_number: Optional[str] = None
    hourly_rate: float = 11.65  # SMIC horaire
    weekly_hours: float = 35.0
    bank_iban: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class EmployeeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: str
    department: str
    contract_type: str
    hire_date: str
    birth_date: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    social_security_number: Optional[str] = None
    hourly_rate: float
    weekly_hours: float
    bank_iban: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    total_hours_month: float = 0.0
    created_at: str

class ShiftCreate(BaseModel):
    employee_id: str
    date: str
    start_time: str  # HH:MM format
    end_time: str
    break_duration: int = 60  # minutes
    shift_type: str = "regular"  # regular, overtime, holiday, sick, vacation
    notes: Optional[str] = None

class ShiftResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    date: str
    start_time: str
    end_time: str
    break_duration: int
    worked_hours: float
    shift_type: str
    status: str  # scheduled, in_progress, completed, cancelled
    notes: Optional[str] = None
    created_at: str

class TimeEntryCreate(BaseModel):
    employee_id: str
    date: str
    clock_in: str  # ISO datetime
    clock_out: Optional[str] = None
    notes: Optional[str] = None

class TimeEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    date: str
    clock_in: str
    clock_out: Optional[str] = None
    worked_hours: Optional[float] = None
    status: str  # clocked_in, clocked_out, validated
    notes: Optional[str] = None
    created_at: str

class ContractCreate(BaseModel):
    employee_id: str
    contract_type: str  # cdi, cdd, interim, stage, apprentissage
    start_date: str
    end_date: Optional[str] = None  # For CDD
    position: str
    department: str
    hourly_rate: float
    weekly_hours: float
    trial_period_days: int = 60
    notes: Optional[str] = None

class ContractResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    contract_type: str
    start_date: str
    end_date: Optional[str] = None
    position: str
    department: str
    hourly_rate: float
    weekly_hours: float
    monthly_gross: float
    trial_period_days: int
    status: str  # draft, active, ended, terminated
    document_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

class PayrollPeriod(BaseModel):
    employee_id: str
    month: int
    year: int

class PayrollResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    month: int
    year: int
    worked_hours: float
    overtime_hours: float
    gross_salary: float
    social_charges_employee: float
    social_charges_employer: float
    net_salary: float
    urssaf_declarations: Dict[str, float]
    status: str  # draft, validated, paid
    paid_at: Optional[str] = None
    created_at: str

# ===================== LEAVE (CP) MODELS =====================

class LeaveConfigCreate(BaseModel):
    """Configuration des règles de congés payés pour un hôtel"""
    accrual_rate_monthly: float = 2.08  # Jours acquis par mois (25/12)
    max_days_per_year: float = 25.0  # Maximum CP annuel
    reference_period_start_month: int = 6  # 1er juin
    reference_period_start_day: int = 1
    n1_deadline_month: int = 5  # 31 mai pour utiliser N-1
    n1_deadline_day: int = 31
    allow_n1_rollover: bool = True  # Autoriser le report N-1
    max_n1_rollover_days: float = 10.0  # Maximum jours N-1 reportables
    seniority_bonus_years: int = 5  # Années d'ancienneté pour bonus
    seniority_bonus_days: float = 1.0  # Jours bonus par tranche

class LeaveConfigResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    accrual_rate_monthly: float
    max_days_per_year: float
    reference_period_start_month: int
    reference_period_start_day: int
    n1_deadline_month: int
    n1_deadline_day: int
    allow_n1_rollover: bool
    max_n1_rollover_days: float
    seniority_bonus_years: int
    seniority_bonus_days: float
    created_at: str
    updated_at: str

class LeaveBalanceResponse(BaseModel):
    """Solde CP d'un employé pour une année de référence"""
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    reference_year: int  # Année de référence (ex: 2025 pour période juin 2025 - mai 2026)
    cp_acquis: float  # CP acquis dans l'année
    cp_pris: float  # CP pris dans l'année
    cp_restant: float  # CP restant (acquis - pris)
    cp_n1: float  # CP reportés de l'année précédente
    cp_n1_pris: float  # CP N-1 utilisés
    cp_n1_restant: float  # CP N-1 restants
    cp_total_disponible: float  # Total disponible (restant + N-1 restant)
    last_accrual_date: Optional[str] = None
    created_at: str
    updated_at: str

class LeaveTransactionCreate(BaseModel):
    """Création d'une transaction de congé (prise ou acquisition)"""
    employee_id: str
    transaction_type: str  # accrual, taken, adjustment, rollover_in, rollover_out, expiry
    leave_type: str  # cp_n, cp_n1 (congé année N ou N-1)
    date_start: Optional[str] = None  # Pour les prises de congé
    date_end: Optional[str] = None
    days_count: float
    reason: Optional[str] = None
    notes: Optional[str] = None

class LeaveTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    transaction_type: str
    leave_type: str
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    days_count: float
    balance_before: float
    balance_after: float
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: str

class LeaveRequestCreate(BaseModel):
    """Demande de congé par un employé"""
    employee_id: str
    date_start: str
    date_end: str
    leave_type: str = "cp"  # cp, rtt, maladie, sans_solde, evenement_familial
    use_n1_first: bool = True  # Utiliser les CP N-1 en priorité
    reason: Optional[str] = None
    notes: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    date_start: str
    date_end: str
    days_count: float
    leave_type: str
    use_n1_first: bool
    cp_n1_used: float  # Jours N-1 utilisés
    cp_n_used: float  # Jours N utilisés
    status: str  # pending, approved, rejected, cancelled
    reason: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str

# ===================== PUBLIC HOLIDAYS MODELS =====================

class PublicHolidayCreate(BaseModel):
    """Création d'un jour férié"""
    date: str  # Format YYYY-MM-DD
    name: str  # Ex: "Jour de l'An", "Fête du Travail"
    holiday_type: str = "national"  # national, regional, custom
    is_mandatory: bool = True  # Jour férié obligatoire (chômé)
    compensation_type: str = "off"  # off (repos), recovery (récupération), bonus (majoration)
    bonus_rate: float = 1.0  # Taux de majoration si travaillé (1.0 = 100%, 2.0 = 200%)
    applies_to_all: bool = True  # S'applique à tous les employés
    department_restrictions: List[str] = []  # Départements concernés si pas tous

class PublicHolidayResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    date: str
    name: str
    holiday_type: str
    is_mandatory: bool
    compensation_type: str
    bonus_rate: float
    applies_to_all: bool
    department_restrictions: List[str]
    created_at: str

class PublicHolidayWorkedCreate(BaseModel):
    """Enregistrement d'un jour férié travaillé"""
    employee_id: str
    holiday_id: str
    hours_worked: float
    compensation_choice: str  # recovery, bonus
    recovery_date: Optional[str] = None  # Date de récupération si choisi
    notes: Optional[str] = None

class PublicHolidayWorkedResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hotel_id: str
    employee_id: str
    employee_name: str
    holiday_id: str
    holiday_name: str
    holiday_date: str
    hours_worked: float
    compensation_choice: str
    bonus_amount: Optional[float] = None
    recovery_date: Optional[str] = None
    recovery_used: bool = False
    notes: Optional[str] = None
    created_at: str

# ===================== STAFF EMPLOYEES ROUTES =====================

@api_router.post("/hotels/{hotel_id}/staff/employees", response_model=EmployeeResponse)
async def create_employee(hotel_id: str, employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    employee_id = str(uuid.uuid4())
    employee_doc = {
        "id": employee_id,
        "hotel_id": hotel_id,
        **employee.model_dump(),
        "total_hours_month": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.staff_employees.insert_one(employee_doc)
    return EmployeeResponse(**employee_doc)

@api_router.get("/hotels/{hotel_id}/staff/employees", response_model=List[EmployeeResponse])
async def get_employees(hotel_id: str, department: Optional[str] = None, is_active: Optional[bool] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if department:
        query["department"] = department
    if is_active is not None:
        query["is_active"] = is_active
    employees = await db.staff_employees.find(query, {"_id": 0}).sort("last_name", 1).to_list(500)
    return [EmployeeResponse(**e) for e in employees]

@api_router.get("/hotels/{hotel_id}/staff/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(hotel_id: str, employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.staff_employees.find_one({"id": employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    return EmployeeResponse(**employee)

@api_router.put("/hotels/{hotel_id}/staff/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(hotel_id: str, employee_id: str, employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    result = await db.staff_employees.update_one(
        {"id": employee_id, "hotel_id": hotel_id},
        {"$set": employee.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    updated = await db.staff_employees.find_one({"id": employee_id}, {"_id": 0})
    return EmployeeResponse(**updated)

@api_router.delete("/hotels/{hotel_id}/staff/employees/{employee_id}")
async def delete_employee(hotel_id: str, employee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff_employees.update_one(
        {"id": employee_id, "hotel_id": hotel_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    return {"message": "Employe desactive"}

# ===================== STAFF SHIFTS/PLANNING ROUTES =====================

@api_router.post("/hotels/{hotel_id}/staff/shifts", response_model=ShiftResponse)
async def create_shift(hotel_id: str, shift: ShiftCreate, current_user: dict = Depends(get_current_user)):
    employee = await db.staff_employees.find_one({"id": shift.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    
    # Calculate worked hours
    start_parts = shift.start_time.split(":")
    end_parts = shift.end_time.split(":")
    start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
    end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
    if end_minutes < start_minutes:
        end_minutes += 24 * 60  # Next day
    worked_minutes = end_minutes - start_minutes - shift.break_duration
    worked_hours = max(0, worked_minutes / 60)
    
    shift_id = str(uuid.uuid4())
    shift_doc = {
        "id": shift_id,
        "hotel_id": hotel_id,
        **shift.model_dump(),
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "worked_hours": round(worked_hours, 2),
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.staff_shifts.insert_one(shift_doc)
    return ShiftResponse(**shift_doc)

@api_router.get("/hotels/{hotel_id}/staff/shifts", response_model=List[ShiftResponse])
async def get_shifts(hotel_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None, employee_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}
    if employee_id:
        query["employee_id"] = employee_id
    shifts = await db.staff_shifts.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    return [ShiftResponse(**s) for s in shifts]

@api_router.put("/hotels/{hotel_id}/staff/shifts/{shift_id}", response_model=ShiftResponse)
async def update_shift(hotel_id: str, shift_id: str, shift: ShiftCreate, current_user: dict = Depends(get_current_user)):
    # Recalculate worked hours
    start_parts = shift.start_time.split(":")
    end_parts = shift.end_time.split(":")
    start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
    end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
    if end_minutes < start_minutes:
        end_minutes += 24 * 60
    worked_minutes = end_minutes - start_minutes - shift.break_duration
    worked_hours = max(0, worked_minutes / 60)
    
    update_data = shift.model_dump()
    update_data["worked_hours"] = round(worked_hours, 2)
    
    result = await db.staff_shifts.update_one(
        {"id": shift_id, "hotel_id": hotel_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift non trouve")
    updated = await db.staff_shifts.find_one({"id": shift_id}, {"_id": 0})
    return ShiftResponse(**updated)

@api_router.delete("/hotels/{hotel_id}/staff/shifts/{shift_id}")
async def delete_shift(hotel_id: str, shift_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff_shifts.delete_one({"id": shift_id, "hotel_id": hotel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift non trouve")
    return {"message": "Shift supprime"}

# ===================== STAFF TIME TRACKING ROUTES =====================

@api_router.post("/hotels/{hotel_id}/staff/time-entries", response_model=TimeEntryResponse)
async def create_time_entry(hotel_id: str, entry: TimeEntryCreate, current_user: dict = Depends(get_current_user)):
    employee = await db.staff_employees.find_one({"id": entry.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    
    entry_id = str(uuid.uuid4())
    entry_doc = {
        "id": entry_id,
        "hotel_id": hotel_id,
        **entry.model_dump(),
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "worked_hours": None,
        "status": "clocked_in" if not entry.clock_out else "clocked_out",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate worked hours if clock_out provided
    if entry.clock_out:
        clock_in = datetime.fromisoformat(entry.clock_in.replace('Z', '+00:00'))
        clock_out = datetime.fromisoformat(entry.clock_out.replace('Z', '+00:00'))
        worked_hours = (clock_out - clock_in).total_seconds() / 3600
        entry_doc["worked_hours"] = round(worked_hours, 2)
    
    await db.staff_time_entries.insert_one(entry_doc)
    return TimeEntryResponse(**entry_doc)

@api_router.get("/hotels/{hotel_id}/staff/time-entries", response_model=List[TimeEntryResponse])
async def get_time_entries(hotel_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None, employee_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}
    if employee_id:
        query["employee_id"] = employee_id
    entries = await db.staff_time_entries.find(query, {"_id": 0}).sort([("date", -1), ("clock_in", -1)]).to_list(1000)
    return [TimeEntryResponse(**e) for e in entries]

@api_router.patch("/hotels/{hotel_id}/staff/time-entries/{entry_id}/clock-out")
async def clock_out(hotel_id: str, entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.staff_time_entries.find_one({"id": entry_id, "hotel_id": hotel_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Pointage non trouve")
    
    if entry.get("clock_out"):
        raise HTTPException(status_code=400, detail="Deja pointe")
    
    clock_out_time = datetime.now(timezone.utc)
    clock_in = datetime.fromisoformat(entry["clock_in"].replace('Z', '+00:00'))
    worked_hours = (clock_out_time - clock_in).total_seconds() / 3600
    
    await db.staff_time_entries.update_one(
        {"id": entry_id},
        {"$set": {
            "clock_out": clock_out_time.isoformat(),
            "worked_hours": round(worked_hours, 2),
            "status": "clocked_out"
        }}
    )
    
    return {"message": "Pointage de sortie enregistre", "worked_hours": round(worked_hours, 2)}

# ===================== STAFF CONTRACTS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/staff/contracts", response_model=ContractResponse)
async def create_contract(hotel_id: str, contract: ContractCreate, current_user: dict = Depends(get_current_user)):
    employee = await db.staff_employees.find_one({"id": contract.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    
    # Calculate monthly gross salary (based on 4.33 weeks per month average)
    monthly_gross = contract.hourly_rate * contract.weekly_hours * 4.33
    
    contract_id = str(uuid.uuid4())
    contract_doc = {
        "id": contract_id,
        "hotel_id": hotel_id,
        **contract.model_dump(),
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "monthly_gross": round(monthly_gross, 2),
        "status": "active",
        "document_url": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.staff_contracts.insert_one(contract_doc)
    
    # Update employee with contract info
    await db.staff_employees.update_one(
        {"id": contract.employee_id},
        {"$set": {
            "contract_type": contract.contract_type,
            "position": contract.position,
            "department": contract.department,
            "hourly_rate": contract.hourly_rate,
            "weekly_hours": contract.weekly_hours
        }}
    )
    
    return ContractResponse(**contract_doc)

@api_router.get("/hotels/{hotel_id}/staff/contracts", response_model=List[ContractResponse])
async def get_contracts(hotel_id: str, employee_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    contracts = await db.staff_contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [ContractResponse(**c) for c in contracts]

@api_router.get("/hotels/{hotel_id}/staff/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(hotel_id: str, contract_id: str, current_user: dict = Depends(get_current_user)):
    contract = await db.staff_contracts.find_one({"id": contract_id, "hotel_id": hotel_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouve")
    return ContractResponse(**contract)

# ===================== STAFF PAYROLL ROUTES =====================

@api_router.post("/hotels/{hotel_id}/staff/payroll/calculate", response_model=PayrollResponse)
async def calculate_payroll(hotel_id: str, period: PayrollPeriod, current_user: dict = Depends(get_current_user)):
    employee = await db.staff_employees.find_one({"id": period.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employe non trouve")
    
    # Get time entries for the month
    start_date = f"{period.year}-{str(period.month).zfill(2)}-01"
    if period.month == 12:
        end_date = f"{period.year + 1}-01-01"
    else:
        end_date = f"{period.year}-{str(period.month + 1).zfill(2)}-01"
    
    entries = await db.staff_time_entries.find({
        "hotel_id": hotel_id,
        "employee_id": period.employee_id,
        "date": {"$gte": start_date, "$lt": end_date},
        "status": {"$in": ["clocked_out", "validated"]}
    }, {"_id": 0}).to_list(100)
    
    # Calculate total hours
    worked_hours = sum(e.get("worked_hours", 0) or 0 for e in entries)
    
    # Calculate expected hours (weekly_hours * 4.33)
    expected_hours = employee.get("weekly_hours", 35) * 4.33
    
    # Overtime (heures supplementaires)
    overtime_hours = max(0, worked_hours - expected_hours)
    
    # Calculate gross salary
    hourly_rate = employee.get("hourly_rate", 11.65)
    base_salary = min(worked_hours, expected_hours) * hourly_rate
    overtime_salary = overtime_hours * hourly_rate * 1.25  # 25% premium for overtime
    gross_salary = base_salary + overtime_salary
    
    # French social charges (simplified rates)
    # Employee charges ~22%
    social_charges_employee = gross_salary * 0.22
    # Employer charges ~42% (URSSAF, etc.)
    social_charges_employer = gross_salary * 0.42
    
    # Net salary
    net_salary = gross_salary - social_charges_employee
    
    # URSSAF declarations breakdown (simplified)
    urssaf_declarations = {
        "securite_sociale": round(gross_salary * 0.157, 2),
        "assurance_chomage": round(gross_salary * 0.0405, 2),
        "retraite_complementaire": round(gross_salary * 0.077, 2),
        "csg_crds": round(gross_salary * 0.097, 2),
        "formation_professionnelle": round(gross_salary * 0.0055, 2),
        "taxe_apprentissage": round(gross_salary * 0.0068, 2),
    }
    
    # Check if payroll already exists
    existing = await db.staff_payroll.find_one({
        "hotel_id": hotel_id,
        "employee_id": period.employee_id,
        "month": period.month,
        "year": period.year
    })
    
    payroll_id = existing["id"] if existing else str(uuid.uuid4())
    payroll_doc = {
        "id": payroll_id,
        "hotel_id": hotel_id,
        "employee_id": period.employee_id,
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "month": period.month,
        "year": period.year,
        "worked_hours": round(worked_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "gross_salary": round(gross_salary, 2),
        "social_charges_employee": round(social_charges_employee, 2),
        "social_charges_employer": round(social_charges_employer, 2),
        "net_salary": round(net_salary, 2),
        "urssaf_declarations": urssaf_declarations,
        "status": "draft",
        "paid_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.staff_payroll.update_one({"id": payroll_id}, {"$set": payroll_doc})
    else:
        await db.staff_payroll.insert_one(payroll_doc)
    
    return PayrollResponse(**payroll_doc)

@api_router.get("/hotels/{hotel_id}/staff/payroll", response_model=List[PayrollResponse])
async def get_payrolls(hotel_id: str, month: Optional[int] = None, year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    payrolls = await db.staff_payroll.find(query, {"_id": 0}).sort([("year", -1), ("month", -1)]).to_list(500)
    return [PayrollResponse(**p) for p in payrolls]

@api_router.patch("/hotels/{hotel_id}/staff/payroll/{payroll_id}/validate")
async def validate_payroll(hotel_id: str, payroll_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff_payroll.update_one(
        {"id": payroll_id, "hotel_id": hotel_id},
        {"$set": {"status": "validated"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bulletin non trouve")
    return {"message": "Bulletin valide"}

@api_router.patch("/hotels/{hotel_id}/staff/payroll/{payroll_id}/mark-paid")
async def mark_payroll_paid(hotel_id: str, payroll_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff_payroll.update_one(
        {"id": payroll_id, "hotel_id": hotel_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bulletin non trouve")
    return {"message": "Bulletin marque comme paye"}

# ===================== STAFF DASHBOARD =====================

@api_router.get("/hotels/{hotel_id}/staff/dashboard")
async def get_staff_dashboard(hotel_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Count active employees
    total_employees = await db.staff_employees.count_documents({"hotel_id": hotel_id, "is_active": True})
    
    # Employees by department
    pipeline = [
        {"$match": {"hotel_id": hotel_id, "is_active": True}},
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]
    by_department = await db.staff_employees.aggregate(pipeline).to_list(20)
    
    # Today's shifts
    today_shifts = await db.staff_shifts.count_documents({"hotel_id": hotel_id, "date": today})
    
    # Currently clocked in
    clocked_in = await db.staff_time_entries.count_documents({
        "hotel_id": hotel_id,
        "date": today,
        "status": "clocked_in"
    })
    
    # Contracts expiring soon (30 days)
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    expiring_contracts = await db.staff_contracts.count_documents({
        "hotel_id": hotel_id,
        "contract_type": "cdd",
        "end_date": {"$lte": future_date, "$gte": today},
        "status": "active"
    })
    
    # This month's payroll total
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    payrolls = await db.staff_payroll.find({
        "hotel_id": hotel_id,
        "month": current_month,
        "year": current_year
    }, {"_id": 0, "gross_salary": 1, "net_salary": 1}).to_list(500)
    
    total_gross = sum(p.get("gross_salary", 0) for p in payrolls)
    total_net = sum(p.get("net_salary", 0) for p in payrolls)
    
    return {
        "total_employees": total_employees,
        "by_department": {d["_id"]: d["count"] for d in by_department},
        "today_shifts": today_shifts,
        "clocked_in_now": clocked_in,
        "expiring_contracts": expiring_contracts,
        "month_gross_salary": round(total_gross, 2),
        "month_net_salary": round(total_net, 2)
    }

# ===================== LEAVE CONFIGURATION ROUTES =====================

@api_router.get("/hotels/{hotel_id}/leave/config", response_model=LeaveConfigResponse)
async def get_leave_config(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Récupérer la configuration des CP pour un hôtel"""
    config = await db.leave_config.find_one({"hotel_id": hotel_id}, {"_id": 0})
    if not config:
        # Créer une config par défaut
        config_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        config = {
            "id": config_id,
            "hotel_id": hotel_id,
            "accrual_rate_monthly": 2.08,
            "max_days_per_year": 25.0,
            "reference_period_start_month": 6,
            "reference_period_start_day": 1,
            "n1_deadline_month": 5,
            "n1_deadline_day": 31,
            "allow_n1_rollover": True,
            "max_n1_rollover_days": 10.0,
            "seniority_bonus_years": 5,
            "seniority_bonus_days": 1.0,
            "created_at": now,
            "updated_at": now
        }
        await db.leave_config.insert_one(config)
    return LeaveConfigResponse(**config)

@api_router.put("/hotels/{hotel_id}/leave/config", response_model=LeaveConfigResponse)
async def update_leave_config(hotel_id: str, config: LeaveConfigCreate, current_user: dict = Depends(get_current_user)):
    """Mettre à jour la configuration des CP"""
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.leave_config.find_one({"hotel_id": hotel_id})
    
    if existing:
        await db.leave_config.update_one(
            {"hotel_id": hotel_id},
            {"$set": {**config.model_dump(), "updated_at": now}}
        )
        updated = await db.leave_config.find_one({"hotel_id": hotel_id}, {"_id": 0})
    else:
        config_id = str(uuid.uuid4())
        config_doc = {
            "id": config_id,
            "hotel_id": hotel_id,
            **config.model_dump(),
            "created_at": now,
            "updated_at": now
        }
        await db.leave_config.insert_one(config_doc)
        updated = config_doc
    
    return LeaveConfigResponse(**updated)

# ===================== LEAVE BALANCE ROUTES =====================

def get_current_reference_year() -> int:
    """Retourne l'année de référence actuelle (basée sur période juin-mai)"""
    now = datetime.now(timezone.utc)
    if now.month >= 6:  # Juin ou après
        return now.year
    else:  # Avant juin
        return now.year - 1

@api_router.get("/hotels/{hotel_id}/leave/balances", response_model=List[LeaveBalanceResponse])
async def get_leave_balances(hotel_id: str, reference_year: Optional[int] = None, employee_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer les soldes CP de tous les employés ou d'un employé spécifique"""
    if reference_year is None:
        reference_year = get_current_reference_year()
    
    query = {"hotel_id": hotel_id, "reference_year": reference_year}
    if employee_id:
        query["employee_id"] = employee_id
    
    balances = await db.leave_balances.find(query, {"_id": 0}).to_list(500)
    return [LeaveBalanceResponse(**b) for b in balances]

@api_router.get("/hotels/{hotel_id}/leave/balances/{employee_id}", response_model=LeaveBalanceResponse)
async def get_employee_leave_balance(hotel_id: str, employee_id: str, reference_year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer le solde CP d'un employé pour une année de référence"""
    if reference_year is None:
        reference_year = get_current_reference_year()
    
    balance = await db.leave_balances.find_one({
        "hotel_id": hotel_id,
        "employee_id": employee_id,
        "reference_year": reference_year
    }, {"_id": 0})
    
    if not balance:
        # Créer un solde initial pour cet employé
        employee = await db.staff_employees.find_one({"id": employee_id, "hotel_id": hotel_id}, {"_id": 0})
        if not employee:
            raise HTTPException(status_code=404, detail="Employé non trouvé")
        
        balance_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        balance = {
            "id": balance_id,
            "hotel_id": hotel_id,
            "employee_id": employee_id,
            "employee_name": f"{employee['first_name']} {employee['last_name']}",
            "reference_year": reference_year,
            "cp_acquis": 0.0,
            "cp_pris": 0.0,
            "cp_restant": 0.0,
            "cp_n1": 0.0,
            "cp_n1_pris": 0.0,
            "cp_n1_restant": 0.0,
            "cp_total_disponible": 0.0,
            "last_accrual_date": None,
            "created_at": now,
            "updated_at": now
        }
        await db.leave_balances.insert_one(balance)
    
    return LeaveBalanceResponse(**balance)

@api_router.post("/hotels/{hotel_id}/leave/balances/initialize")
async def initialize_leave_balances(hotel_id: str, reference_year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    """Initialiser les soldes CP pour tous les employés actifs"""
    if reference_year is None:
        reference_year = get_current_reference_year()
    
    employees = await db.staff_employees.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(500)
    created_count = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for employee in employees:
        existing = await db.leave_balances.find_one({
            "hotel_id": hotel_id,
            "employee_id": employee["id"],
            "reference_year": reference_year
        })
        
        if not existing:
            balance_id = str(uuid.uuid4())
            balance = {
                "id": balance_id,
                "hotel_id": hotel_id,
                "employee_id": employee["id"],
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "reference_year": reference_year,
                "cp_acquis": 0.0,
                "cp_pris": 0.0,
                "cp_restant": 0.0,
                "cp_n1": 0.0,
                "cp_n1_pris": 0.0,
                "cp_n1_restant": 0.0,
                "cp_total_disponible": 0.0,
                "last_accrual_date": None,
                "created_at": now,
                "updated_at": now
            }
            await db.leave_balances.insert_one(balance)
            created_count += 1
    
    return {"message": f"{created_count} soldes créés pour l'année {reference_year}"}

# ===================== LEAVE TRANSACTIONS ROUTES =====================

@api_router.get("/hotels/{hotel_id}/leave/transactions", response_model=List[LeaveTransactionResponse])
async def get_leave_transactions(hotel_id: str, employee_id: Optional[str] = None, transaction_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer l'historique des transactions de congés"""
    query = {"hotel_id": hotel_id}
    if employee_id:
        query["employee_id"] = employee_id
    if transaction_type:
        query["transaction_type"] = transaction_type
    
    transactions = await db.leave_transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [LeaveTransactionResponse(**t) for t in transactions]

@api_router.post("/hotels/{hotel_id}/leave/transactions", response_model=LeaveTransactionResponse)
async def create_leave_transaction(hotel_id: str, transaction: LeaveTransactionCreate, current_user: dict = Depends(get_current_user)):
    """Créer une transaction de congé (acquisition, prise, ajustement)"""
    employee = await db.staff_employees.find_one({"id": transaction.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    
    reference_year = get_current_reference_year()
    balance = await db.leave_balances.find_one({
        "hotel_id": hotel_id,
        "employee_id": transaction.employee_id,
        "reference_year": reference_year
    }, {"_id": 0})
    
    if not balance:
        raise HTTPException(status_code=404, detail="Solde CP non initialisé pour cet employé")
    
    # Calculer le solde avant et après selon le type de transaction et de congé
    if transaction.leave_type == "cp_n1":
        balance_before = balance["cp_n1_restant"]
    else:
        balance_before = balance["cp_restant"]
    
    if transaction.transaction_type in ["accrual", "adjustment", "rollover_in"]:
        balance_after = balance_before + transaction.days_count
    elif transaction.transaction_type in ["taken", "rollover_out", "expiry"]:
        balance_after = balance_before - transaction.days_count
    else:
        balance_after = balance_before
    
    # Créer la transaction
    transaction_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    transaction_doc = {
        "id": transaction_id,
        "hotel_id": hotel_id,
        "employee_id": transaction.employee_id,
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        **transaction.model_dump(),
        "balance_before": balance_before,
        "balance_after": balance_after,
        "created_by": current_user["user_id"],
        "created_at": now
    }
    await db.leave_transactions.insert_one(transaction_doc)
    
    # Mettre à jour le solde
    if transaction.leave_type == "cp_n1":
        if transaction.transaction_type in ["taken"]:
            new_cp_n1_pris = balance["cp_n1_pris"] + transaction.days_count
            new_cp_n1_restant = balance["cp_n1"] - new_cp_n1_pris
            await db.leave_balances.update_one(
                {"id": balance["id"]},
                {"$set": {
                    "cp_n1_pris": new_cp_n1_pris,
                    "cp_n1_restant": new_cp_n1_restant,
                    "cp_total_disponible": balance["cp_restant"] + new_cp_n1_restant,
                    "updated_at": now
                }}
            )
    else:  # cp_n
        if transaction.transaction_type == "accrual":
            new_cp_acquis = balance["cp_acquis"] + transaction.days_count
            new_cp_restant = new_cp_acquis - balance["cp_pris"]
            await db.leave_balances.update_one(
                {"id": balance["id"]},
                {"$set": {
                    "cp_acquis": new_cp_acquis,
                    "cp_restant": new_cp_restant,
                    "cp_total_disponible": new_cp_restant + balance["cp_n1_restant"],
                    "last_accrual_date": now,
                    "updated_at": now
                }}
            )
        elif transaction.transaction_type == "taken":
            new_cp_pris = balance["cp_pris"] + transaction.days_count
            new_cp_restant = balance["cp_acquis"] - new_cp_pris
            await db.leave_balances.update_one(
                {"id": balance["id"]},
                {"$set": {
                    "cp_pris": new_cp_pris,
                    "cp_restant": new_cp_restant,
                    "cp_total_disponible": new_cp_restant + balance["cp_n1_restant"],
                    "updated_at": now
                }}
            )
    
    return LeaveTransactionResponse(**transaction_doc)

# ===================== LEAVE ACCRUAL (CRON) ROUTES =====================

@api_router.post("/hotels/{hotel_id}/leave/accrual/run")
async def run_monthly_accrual(hotel_id: str, month: Optional[int] = None, year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    """Exécuter l'acquisition mensuelle des CP pour tous les employés actifs"""
    now = datetime.now(timezone.utc)
    if month is None:
        month = now.month
    if year is None:
        year = now.year
    
    # Déterminer l'année de référence
    if month >= 6:
        reference_year = year
    else:
        reference_year = year - 1
    
    # Récupérer la config
    config = await db.leave_config.find_one({"hotel_id": hotel_id}, {"_id": 0})
    accrual_rate = config["accrual_rate_monthly"] if config else 2.08
    
    # Récupérer tous les employés actifs
    employees = await db.staff_employees.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(500)
    
    accrued_count = 0
    for employee in employees:
        # Vérifier si l'acquisition a déjà été faite ce mois
        accrual_key = f"{year}-{str(month).zfill(2)}"
        existing_accrual = await db.leave_transactions.find_one({
            "hotel_id": hotel_id,
            "employee_id": employee["id"],
            "transaction_type": "accrual",
            "created_at": {"$regex": f"^{accrual_key}"}
        })
        
        if existing_accrual:
            continue
        
        # S'assurer que le solde existe
        balance = await db.leave_balances.find_one({
            "hotel_id": hotel_id,
            "employee_id": employee["id"],
            "reference_year": reference_year
        }, {"_id": 0})
        
        if not balance:
            balance_id = str(uuid.uuid4())
            balance = {
                "id": balance_id,
                "hotel_id": hotel_id,
                "employee_id": employee["id"],
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "reference_year": reference_year,
                "cp_acquis": 0.0,
                "cp_pris": 0.0,
                "cp_restant": 0.0,
                "cp_n1": 0.0,
                "cp_n1_pris": 0.0,
                "cp_n1_restant": 0.0,
                "cp_total_disponible": 0.0,
                "last_accrual_date": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.leave_balances.insert_one(balance)
        
        # Créer la transaction d'acquisition
        transaction_id = str(uuid.uuid4())
        new_cp_acquis = balance["cp_acquis"] + accrual_rate
        new_cp_restant = new_cp_acquis - balance["cp_pris"]
        
        transaction_doc = {
            "id": transaction_id,
            "hotel_id": hotel_id,
            "employee_id": employee["id"],
            "employee_name": f"{employee['first_name']} {employee['last_name']}",
            "transaction_type": "accrual",
            "leave_type": "cp_n",
            "date_start": None,
            "date_end": None,
            "days_count": accrual_rate,
            "balance_before": balance["cp_restant"],
            "balance_after": new_cp_restant,
            "reason": f"Acquisition mensuelle {month}/{year}",
            "notes": None,
            "created_by": "system",
            "created_at": now.isoformat()
        }
        await db.leave_transactions.insert_one(transaction_doc)
        
        # Mettre à jour le solde
        await db.leave_balances.update_one(
            {"id": balance["id"]},
            {"$set": {
                "cp_acquis": new_cp_acquis,
                "cp_restant": new_cp_restant,
                "cp_total_disponible": new_cp_restant + balance["cp_n1_restant"],
                "last_accrual_date": now.isoformat(),
                "updated_at": now.isoformat()
            }}
        )
        accrued_count += 1
    
    return {
        "message": f"Acquisition effectuée pour {accrued_count} employés",
        "month": month,
        "year": year,
        "accrual_rate": accrual_rate
    }

@api_router.post("/hotels/{hotel_id}/leave/rollover/run")
async def run_annual_rollover(hotel_id: str, from_year: int, current_user: dict = Depends(get_current_user)):
    """Exécuter le report annuel N vers N-1 (à faire au 1er juin)"""
    to_year = from_year + 1
    now = datetime.now(timezone.utc).isoformat()
    
    # Récupérer la config
    config = await db.leave_config.find_one({"hotel_id": hotel_id}, {"_id": 0})
    allow_rollover = config["allow_n1_rollover"] if config else True
    max_rollover = config["max_n1_rollover_days"] if config else 10.0
    
    if not allow_rollover:
        return {"message": "Le report N-1 est désactivé dans la configuration"}
    
    # Récupérer tous les soldes de l'année précédente
    old_balances = await db.leave_balances.find({
        "hotel_id": hotel_id,
        "reference_year": from_year
    }, {"_id": 0}).to_list(500)
    
    rollover_count = 0
    for old_balance in old_balances:
        # Calculer le montant à reporter (max = config)
        rollover_amount = min(old_balance["cp_restant"], max_rollover)
        
        if rollover_amount <= 0:
            continue
        
        # Vérifier/créer le solde de la nouvelle année
        new_balance = await db.leave_balances.find_one({
            "hotel_id": hotel_id,
            "employee_id": old_balance["employee_id"],
            "reference_year": to_year
        }, {"_id": 0})
        
        if not new_balance:
            balance_id = str(uuid.uuid4())
            new_balance = {
                "id": balance_id,
                "hotel_id": hotel_id,
                "employee_id": old_balance["employee_id"],
                "employee_name": old_balance["employee_name"],
                "reference_year": to_year,
                "cp_acquis": 0.0,
                "cp_pris": 0.0,
                "cp_restant": 0.0,
                "cp_n1": rollover_amount,
                "cp_n1_pris": 0.0,
                "cp_n1_restant": rollover_amount,
                "cp_total_disponible": rollover_amount,
                "last_accrual_date": None,
                "created_at": now,
                "updated_at": now
            }
            await db.leave_balances.insert_one(new_balance)
        else:
            await db.leave_balances.update_one(
                {"id": new_balance["id"]},
                {"$set": {
                    "cp_n1": rollover_amount,
                    "cp_n1_restant": rollover_amount,
                    "cp_total_disponible": new_balance["cp_restant"] + rollover_amount,
                    "updated_at": now
                }}
            )
        
        # Créer les transactions de rollover
        await db.leave_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "hotel_id": hotel_id,
            "employee_id": old_balance["employee_id"],
            "employee_name": old_balance["employee_name"],
            "transaction_type": "rollover_out",
            "leave_type": "cp_n",
            "days_count": rollover_amount,
            "balance_before": old_balance["cp_restant"],
            "balance_after": old_balance["cp_restant"] - rollover_amount,
            "reason": f"Report vers N-1 ({to_year})",
            "created_by": "system",
            "created_at": now
        })
        
        await db.leave_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "hotel_id": hotel_id,
            "employee_id": old_balance["employee_id"],
            "employee_name": old_balance["employee_name"],
            "transaction_type": "rollover_in",
            "leave_type": "cp_n1",
            "days_count": rollover_amount,
            "balance_before": 0,
            "balance_after": rollover_amount,
            "reason": f"Report depuis N ({from_year})",
            "created_by": "system",
            "created_at": now
        })
        
        rollover_count += 1
    
    return {
        "message": f"Report effectué pour {rollover_count} employés",
        "from_year": from_year,
        "to_year": to_year,
        "max_rollover_days": max_rollover
    }

# ===================== LEAVE REQUESTS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/leave/requests", response_model=LeaveRequestResponse)
async def create_leave_request(hotel_id: str, request: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    """Créer une demande de congé"""
    employee = await db.staff_employees.find_one({"id": request.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    
    # Calculer le nombre de jours
    start = datetime.strptime(request.date_start, "%Y-%m-%d")
    end = datetime.strptime(request.date_end, "%Y-%m-%d")
    days_count = (end - start).days + 1
    
    # Exclure les week-ends (simplification)
    working_days = 0
    current = start
    while current <= end:
        if current.weekday() < 5:  # Lundi = 0, Vendredi = 4
            working_days += 1
        current += timedelta(days=1)
    days_count = working_days
    
    # Récupérer le solde
    reference_year = get_current_reference_year()
    balance = await db.leave_balances.find_one({
        "hotel_id": hotel_id,
        "employee_id": request.employee_id,
        "reference_year": reference_year
    }, {"_id": 0})
    
    if not balance:
        raise HTTPException(status_code=400, detail="Solde CP non initialisé")
    
    # Vérifier le solde disponible
    if days_count > balance["cp_total_disponible"]:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant. Disponible: {balance['cp_total_disponible']} jours")
    
    # Calculer la répartition N-1 / N
    cp_n1_used = 0.0
    cp_n_used = 0.0
    
    if request.use_n1_first and balance["cp_n1_restant"] > 0:
        cp_n1_used = min(days_count, balance["cp_n1_restant"])
        cp_n_used = days_count - cp_n1_used
    else:
        cp_n_used = min(days_count, balance["cp_restant"])
        cp_n1_used = days_count - cp_n_used
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    request_doc = {
        "id": request_id,
        "hotel_id": hotel_id,
        "employee_id": request.employee_id,
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "date_start": request.date_start,
        "date_end": request.date_end,
        "days_count": days_count,
        "leave_type": request.leave_type,
        "use_n1_first": request.use_n1_first,
        "cp_n1_used": cp_n1_used,
        "cp_n_used": cp_n_used,
        "status": "pending",
        "reason": request.reason,
        "notes": request.notes,
        "approved_by": None,
        "approved_at": None,
        "rejection_reason": None,
        "created_at": now
    }
    await db.leave_requests.insert_one(request_doc)
    
    return LeaveRequestResponse(**request_doc)

@api_router.get("/hotels/{hotel_id}/leave/requests", response_model=List[LeaveRequestResponse])
async def get_leave_requests(hotel_id: str, employee_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer les demandes de congés"""
    query = {"hotel_id": hotel_id}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    requests = await db.leave_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [LeaveRequestResponse(**r) for r in requests]

@api_router.patch("/hotels/{hotel_id}/leave/requests/{request_id}/approve")
async def approve_leave_request(hotel_id: str, request_id: str, current_user: dict = Depends(get_current_user)):
    """Approuver une demande de congé"""
    leave_request = await db.leave_requests.find_one({"id": request_id, "hotel_id": hotel_id}, {"_id": 0})
    if not leave_request:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    if leave_request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Mettre à jour la demande
    await db.leave_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["user_id"],
            "approved_at": now
        }}
    )
    
    # Créer les transactions de prise de congé
    reference_year = get_current_reference_year()
    balance = await db.leave_balances.find_one({
        "hotel_id": hotel_id,
        "employee_id": leave_request["employee_id"],
        "reference_year": reference_year
    }, {"_id": 0})
    
    if leave_request["cp_n1_used"] > 0:
        await db.leave_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "hotel_id": hotel_id,
            "employee_id": leave_request["employee_id"],
            "employee_name": leave_request["employee_name"],
            "transaction_type": "taken",
            "leave_type": "cp_n1",
            "date_start": leave_request["date_start"],
            "date_end": leave_request["date_end"],
            "days_count": leave_request["cp_n1_used"],
            "balance_before": balance["cp_n1_restant"],
            "balance_after": balance["cp_n1_restant"] - leave_request["cp_n1_used"],
            "reason": leave_request.get("reason"),
            "created_by": current_user["user_id"],
            "created_at": now
        })
        
        new_cp_n1_pris = balance["cp_n1_pris"] + leave_request["cp_n1_used"]
        new_cp_n1_restant = balance["cp_n1"] - new_cp_n1_pris
        await db.leave_balances.update_one(
            {"id": balance["id"]},
            {"$set": {
                "cp_n1_pris": new_cp_n1_pris,
                "cp_n1_restant": new_cp_n1_restant,
                "updated_at": now
            }}
        )
        # Refresh balance for N calculation
        balance = await db.leave_balances.find_one({"id": balance["id"]}, {"_id": 0})
    
    if leave_request["cp_n_used"] > 0:
        await db.leave_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "hotel_id": hotel_id,
            "employee_id": leave_request["employee_id"],
            "employee_name": leave_request["employee_name"],
            "transaction_type": "taken",
            "leave_type": "cp_n",
            "date_start": leave_request["date_start"],
            "date_end": leave_request["date_end"],
            "days_count": leave_request["cp_n_used"],
            "balance_before": balance["cp_restant"],
            "balance_after": balance["cp_restant"] - leave_request["cp_n_used"],
            "reason": leave_request.get("reason"),
            "created_by": current_user["user_id"],
            "created_at": now
        })
        
        new_cp_pris = balance["cp_pris"] + leave_request["cp_n_used"]
        new_cp_restant = balance["cp_acquis"] - new_cp_pris
        await db.leave_balances.update_one(
            {"id": balance["id"]},
            {"$set": {
                "cp_pris": new_cp_pris,
                "cp_restant": new_cp_restant,
                "cp_total_disponible": new_cp_restant + balance["cp_n1_restant"],
                "updated_at": now
            }}
        )
    
    return {"message": "Demande approuvée"}

@api_router.patch("/hotels/{hotel_id}/leave/requests/{request_id}/reject")
async def reject_leave_request(hotel_id: str, request_id: str, rejection_reason: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Rejeter une demande de congé"""
    result = await db.leave_requests.update_one(
        {"id": request_id, "hotel_id": hotel_id, "status": "pending"},
        {"$set": {
            "status": "rejected",
            "rejection_reason": rejection_reason,
            "approved_by": current_user["user_id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Demande non trouvée ou déjà traitée")
    return {"message": "Demande rejetée"}

# ===================== PUBLIC HOLIDAYS ROUTES =====================

@api_router.post("/hotels/{hotel_id}/holidays", response_model=PublicHolidayResponse)
async def create_public_holiday(hotel_id: str, holiday: PublicHolidayCreate, current_user: dict = Depends(get_current_user)):
    """Créer un jour férié"""
    holiday_id = str(uuid.uuid4())
    holiday_doc = {
        "id": holiday_id,
        "hotel_id": hotel_id,
        **holiday.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.public_holidays.insert_one(holiday_doc)
    return PublicHolidayResponse(**holiday_doc)

@api_router.get("/hotels/{hotel_id}/holidays", response_model=List[PublicHolidayResponse])
async def get_public_holidays(hotel_id: str, year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer les jours fériés"""
    query = {"hotel_id": hotel_id}
    if year:
        query["date"] = {"$regex": f"^{year}"}
    
    holidays = await db.public_holidays.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return [PublicHolidayResponse(**h) for h in holidays]

@api_router.post("/hotels/{hotel_id}/holidays/initialize/{year}")
async def initialize_french_holidays(hotel_id: str, year: int, current_user: dict = Depends(get_current_user)):
    """Initialiser les jours fériés français pour une année"""
    french_holidays = [
        {"date": f"{year}-01-01", "name": "Jour de l'An", "holiday_type": "national"},
        {"date": f"{year}-05-01", "name": "Fête du Travail", "holiday_type": "national"},
        {"date": f"{year}-05-08", "name": "Victoire 1945", "holiday_type": "national"},
        {"date": f"{year}-07-14", "name": "Fête Nationale", "holiday_type": "national"},
        {"date": f"{year}-08-15", "name": "Assomption", "holiday_type": "national"},
        {"date": f"{year}-11-01", "name": "Toussaint", "holiday_type": "national"},
        {"date": f"{year}-11-11", "name": "Armistice", "holiday_type": "national"},
        {"date": f"{year}-12-25", "name": "Noël", "holiday_type": "national"},
    ]
    
    # Calculer Pâques (algorithme de Meeus/Jones/Butcher)
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    
    easter = datetime(year, month, day)
    french_holidays.extend([
        {"date": (easter + timedelta(days=1)).strftime("%Y-%m-%d"), "name": "Lundi de Pâques", "holiday_type": "national"},
        {"date": (easter + timedelta(days=39)).strftime("%Y-%m-%d"), "name": "Ascension", "holiday_type": "national"},
        {"date": (easter + timedelta(days=50)).strftime("%Y-%m-%d"), "name": "Lundi de Pentecôte", "holiday_type": "national"},
    ])
    
    created_count = 0
    for h in french_holidays:
        existing = await db.public_holidays.find_one({"hotel_id": hotel_id, "date": h["date"]})
        if not existing:
            holiday_id = str(uuid.uuid4())
            await db.public_holidays.insert_one({
                "id": holiday_id,
                "hotel_id": hotel_id,
                **h,
                "is_mandatory": True,
                "compensation_type": "off",
                "bonus_rate": 1.0,
                "applies_to_all": True,
                "department_restrictions": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            created_count += 1
    
    return {"message": f"{created_count} jours fériés créés pour {year}"}

@api_router.delete("/hotels/{hotel_id}/holidays/{holiday_id}")
async def delete_public_holiday(hotel_id: str, holiday_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer un jour férié"""
    result = await db.public_holidays.delete_one({"id": holiday_id, "hotel_id": hotel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")
    return {"message": "Jour férié supprimé"}

# ===================== PUBLIC HOLIDAYS WORKED ROUTES =====================

@api_router.post("/hotels/{hotel_id}/holidays/worked", response_model=PublicHolidayWorkedResponse)
async def record_holiday_worked(hotel_id: str, worked: PublicHolidayWorkedCreate, current_user: dict = Depends(get_current_user)):
    """Enregistrer qu'un employé a travaillé un jour férié"""
    employee = await db.staff_employees.find_one({"id": worked.employee_id, "hotel_id": hotel_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    
    holiday = await db.public_holidays.find_one({"id": worked.holiday_id, "hotel_id": hotel_id}, {"_id": 0})
    if not holiday:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")
    
    # Calculer le bonus si applicable
    bonus_amount = None
    if worked.compensation_choice == "bonus":
        hourly_rate = employee.get("hourly_rate", 11.65)
        bonus_amount = worked.hours_worked * hourly_rate * holiday.get("bonus_rate", 1.0)
    
    worked_id = str(uuid.uuid4())
    worked_doc = {
        "id": worked_id,
        "hotel_id": hotel_id,
        "employee_id": worked.employee_id,
        "employee_name": f"{employee['first_name']} {employee['last_name']}",
        "holiday_id": worked.holiday_id,
        "holiday_name": holiday["name"],
        "holiday_date": holiday["date"],
        "hours_worked": worked.hours_worked,
        "compensation_choice": worked.compensation_choice,
        "bonus_amount": round(bonus_amount, 2) if bonus_amount else None,
        "recovery_date": worked.recovery_date,
        "recovery_used": False,
        "notes": worked.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.holidays_worked.insert_one(worked_doc)
    
    return PublicHolidayWorkedResponse(**worked_doc)

@api_router.get("/hotels/{hotel_id}/holidays/worked", response_model=List[PublicHolidayWorkedResponse])
async def get_holidays_worked(hotel_id: str, employee_id: Optional[str] = None, year: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    """Récupérer les jours fériés travaillés"""
    query = {"hotel_id": hotel_id}
    if employee_id:
        query["employee_id"] = employee_id
    if year:
        query["holiday_date"] = {"$regex": f"^{year}"}
    
    worked = await db.holidays_worked.find(query, {"_id": 0}).sort("holiday_date", -1).to_list(500)
    return [PublicHolidayWorkedResponse(**w) for w in worked]

@api_router.patch("/hotels/{hotel_id}/holidays/worked/{worked_id}/use-recovery")
async def mark_recovery_used(hotel_id: str, worked_id: str, current_user: dict = Depends(get_current_user)):
    """Marquer la récupération comme utilisée"""
    result = await db.holidays_worked.update_one(
        {"id": worked_id, "hotel_id": hotel_id},
        {"$set": {"recovery_used": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enregistrement non trouvé")
    return {"message": "Récupération marquée comme utilisée"}

# ===================== STAFF PLANNING SUMMARY (for UI) =====================

@api_router.get("/hotels/{hotel_id}/staff/planning-summary")
async def get_staff_planning_summary(hotel_id: str, from_date: str, to_date: str, current_user: dict = Depends(get_current_user)):
    """Récupérer un résumé pour l'affichage dans le planning (CP, jours fériés, etc.)"""
    reference_year = get_current_reference_year()
    
    # Récupérer tous les employés actifs
    employees = await db.staff_employees.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(500)
    
    # Récupérer les soldes CP
    balances = await db.leave_balances.find({
        "hotel_id": hotel_id,
        "reference_year": reference_year
    }, {"_id": 0}).to_list(500)
    balance_map = {b["employee_id"]: b for b in balances}
    
    # Récupérer les demandes de congés approuvées dans la période
    leave_requests = await db.leave_requests.find({
        "hotel_id": hotel_id,
        "status": "approved",
        "date_start": {"$lte": to_date},
        "date_end": {"$gte": from_date}
    }, {"_id": 0}).to_list(500)
    
    # Récupérer les jours fériés dans la période
    holidays = await db.public_holidays.find({
        "hotel_id": hotel_id,
        "date": {"$gte": from_date, "$lte": to_date}
    }, {"_id": 0}).to_list(50)
    
    # Récupérer les jours fériés travaillés
    holidays_worked = await db.holidays_worked.find({
        "hotel_id": hotel_id,
        "holiday_date": {"$gte": from_date, "$lte": to_date}
    }, {"_id": 0}).to_list(500)
    worked_map = {}
    for hw in holidays_worked:
        key = f"{hw['employee_id']}_{hw['holiday_date']}"
        worked_map[key] = hw
    
    # Construire le résumé par employé
    summary = []
    for emp in employees:
        balance = balance_map.get(emp["id"], {})
        emp_leave_requests = [lr for lr in leave_requests if lr["employee_id"] == emp["id"]]
        emp_holidays_worked = [hw for hw in holidays_worked if hw["employee_id"] == emp["id"]]
        
        # Calculer les CP pris dans la période
        cp_pris_periode = sum(lr["days_count"] for lr in emp_leave_requests)
        
        summary.append({
            "employee_id": emp["id"],
            "employee_name": f"{emp['first_name']} {emp['last_name']}",
            "position": emp.get("position", ""),
            "department": emp.get("department", ""),
            "cp_acquis": balance.get("cp_acquis", 0),
            "cp_pris_total": balance.get("cp_pris", 0),
            "cp_restant": balance.get("cp_restant", 0),
            "cp_n1_restant": balance.get("cp_n1_restant", 0),
            "cp_total_disponible": balance.get("cp_total_disponible", 0),
            "cp_pris_periode": cp_pris_periode,
            "leave_requests": emp_leave_requests,
            "holidays_worked": emp_holidays_worked
        })
    
    return {
        "employees": summary,
        "holidays": holidays,
        "period": {"from": from_date, "to": to_date},
        "reference_year": reference_year
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
