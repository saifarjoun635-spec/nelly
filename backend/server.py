from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

from seed_data import DEFAULT_CONTENT, DEFAULT_SERVICES, DEFAULT_HOURS, DEFAULT_PRODUCTS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'clinique@nellyglam.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'NellyGlam2025!')

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


# ------------------------- Models -------------------------
class LoginRequest(BaseModel):
    email: str
    password: str


class AppointmentCreate(BaseModel):
    service: str
    date: str
    time: str
    firstName: str
    lastName: str
    email: str
    phone: str
    note: Optional[str] = ""


class AppointmentStatus(BaseModel):
    status: str


class ContentUpdate(BaseModel):
    data: Dict[str, Any]


class ServicesUpdate(BaseModel):
    categories: List[Dict[str, Any]]


class HoursUpdate(BaseModel):
    hours: Dict[str, Any]


class BlockedDatesUpdate(BaseModel):
    dates: List[str]


class UploadPayload(BaseModel):
    dataUrl: str  # data:image/...;base64,xxxx


class Product(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    price: Any = ""
    image: Optional[str] = ""
    category: Optional[str] = ""
    stock: int = 0


class OrderItem(BaseModel):
    productId: str
    name: str
    price: Any = ""
    qty: int = 1


class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: Any = ""
    firstName: str
    lastName: str
    email: str
    phone: str
    address: Optional[str] = ""
    note: Optional[str] = ""


class OrderStatus(BaseModel):
    status: str


class AdminCredsUpdate(BaseModel):
    currentPassword: str
    newEmail: Optional[str] = None
    newPassword: Optional[str] = None


# ------------------------- Auth helpers -------------------------
def create_token(email: str) -> str:
    payload = {"sub": email, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_admin(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expirée")


def strip_id(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


# ------------------------- Public routes -------------------------
@api_router.get("/")
async def root():
    return {"message": "Clinique Nelly Glam API"}


@api_router.get("/content")
async def get_content():
    doc = await db.site.find_one({"_id": "content"})
    return strip_id(doc) if doc else DEFAULT_CONTENT


@api_router.get("/services")
async def get_services():
    doc = await db.site.find_one({"_id": "services"})
    return doc["categories"] if doc else DEFAULT_SERVICES


@api_router.get("/hours")
async def get_hours():
    doc = await db.site.find_one({"_id": "hours"})
    return doc["hours"] if doc else DEFAULT_HOURS


async def _get_hours():
    doc = await db.site.find_one({"_id": "hours"})
    return doc["hours"] if doc else DEFAULT_HOURS


async def _get_blocked():
    doc = await db.site.find_one({"_id": "blocked"})
    return doc["dates"] if doc else []


def _slots_for(start: str, end: str, step_min: int = 30):
    sh, sm = map(int, start.split(":"))
    eh, em = map(int, end.split(":"))
    cur = sh * 60 + sm
    last = eh * 60 + em
    slots = []
    while cur < last:
        slots.append(f"{cur // 60:02d}:{cur % 60:02d}")
        cur += step_min
    return slots


async def _availability(date: str):
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Date invalide")

    hours = await _get_hours()
    blocked = await _get_blocked()
    weekday = WEEKDAYS[d.weekday()]
    day_cfg = hours.get(weekday, {})

    if date in blocked or not day_cfg.get("open", False):
        return {"date": date, "slots": []}

    all_slots = _slots_for(day_cfg.get("start", "10:00"), day_cfg.get("end", "20:00"))
    booked = await db.appointments.find(
        {"date": date, "status": {"$ne": "cancelled"}}
    ).to_list(500)
    taken = {a["time"] for a in booked}
    available = [s for s in all_slots if s not in taken]
    return {"date": date, "slots": available}


@api_router.get("/availability")
async def availability(date: str):
    return await _availability(date)


@api_router.post("/appointments")
async def create_appointment(payload: AppointmentCreate):
    avail = await _availability(payload.date)
    if payload.time not in avail["slots"]:
        raise HTTPException(status_code=409, detail="Ce créneau n'est plus disponible")
    doc = payload.dict()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "pending"
    doc["createdAt"] = datetime.utcnow().isoformat()
    await db.appointments.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


# ------------------------- Admin routes -------------------------
@api_router.post("/admin/login")
async def admin_login(payload: LoginRequest):
    admin = await db.admin_users.find_one({"email": payload.email.lower().strip()})
    if not admin or not pwd_ctx.verify(payload.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    return {"token": create_token(admin["email"]), "email": admin["email"]}


@api_router.get("/admin/me")
async def admin_me(email: str = Depends(get_current_admin)):
    return {"email": email}


@api_router.post("/admin/change-credentials")
async def change_credentials(payload: AdminCredsUpdate, email: str = Depends(get_current_admin)):
    admin = await db.admin_users.find_one({"email": email})
    if not admin or not pwd_ctx.verify(payload.currentPassword, admin["password"]):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    update = {}
    new_email = email
    if payload.newEmail:
        ne = payload.newEmail.lower().strip()
        existing = await db.admin_users.find_one({"email": ne})
        if existing and existing["email"] != email:
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")
        update["email"] = ne
        new_email = ne
    if payload.newPassword:
        if len(payload.newPassword) < 6:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
        update["password"] = pwd_ctx.hash(payload.newPassword)
    if update:
        await db.admin_users.update_one({"email": email}, {"$set": update})
    return {"token": create_token(new_email), "email": new_email}


@api_router.get("/admin/appointments")
async def list_appointments(email: str = Depends(get_current_admin)):
    items = await db.appointments.find().sort("date", 1).to_list(1000)
    return [strip_id(i) for i in items]


@api_router.patch("/admin/appointments/{appt_id}")
async def update_appointment(appt_id: str, payload: AppointmentStatus, email: str = Depends(get_current_admin)):
    res = await db.appointments.update_one({"id": appt_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    return {"ok": True}


@api_router.delete("/admin/appointments/{appt_id}")
async def delete_appointment(appt_id: str, email: str = Depends(get_current_admin)):
    await db.appointments.delete_one({"id": appt_id})
    return {"ok": True}


@api_router.put("/admin/content")
async def update_content(payload: ContentUpdate, email: str = Depends(get_current_admin)):
    data = payload.data
    data["_id"] = "content"
    await db.site.replace_one({"_id": "content"}, data, upsert=True)
    return {"ok": True}


@api_router.put("/admin/services")
async def update_services(payload: ServicesUpdate, email: str = Depends(get_current_admin)):
    await db.site.replace_one(
        {"_id": "services"}, {"_id": "services", "categories": payload.categories}, upsert=True
    )
    return {"ok": True}


@api_router.get("/admin/blocked-dates")
async def get_blocked(email: str = Depends(get_current_admin)):
    return {"dates": await _get_blocked()}


@api_router.put("/admin/hours")
async def update_hours(payload: HoursUpdate, email: str = Depends(get_current_admin)):
    await db.site.replace_one(
        {"_id": "hours"}, {"_id": "hours", "hours": payload.hours}, upsert=True
    )
    return {"ok": True}


@api_router.put("/admin/blocked-dates")
async def update_blocked(payload: BlockedDatesUpdate, email: str = Depends(get_current_admin)):
    await db.site.replace_one(
        {"_id": "blocked"}, {"_id": "blocked", "dates": payload.dates}, upsert=True
    )
    return {"ok": True}


# ------------------------- Images -------------------------
@api_router.post("/admin/upload")
async def upload_image(payload: UploadPayload, email: str = Depends(get_current_admin)):
    raw = payload.dataUrl
    try:
        header, b64 = raw.split(",", 1)
        content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        data = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Image invalide")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image trop lourde (max 8 Mo)")
    img_id = str(uuid.uuid4())
    await db.images.insert_one({"_id": img_id, "content_type": content_type, "data": data})
    return {"id": img_id, "path": f"/api/images/{img_id}"}


@api_router.get("/images/{img_id}")
async def get_image(img_id: str):
    doc = await db.images.find_one({"_id": img_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Image introuvable")
    return Response(content=doc["data"], media_type=doc.get("content_type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=31536000"})


# ------------------------- Products (public) -------------------------
@api_router.get("/products")
async def list_products():
    items = await db.products.find().sort("createdAt", 1).to_list(500)
    return [strip_id(i) for i in items]


# ------------------------- Orders (public) -------------------------
@api_router.post("/orders")
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Panier vide")
    doc = payload.dict()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "nouvelle"
    doc["createdAt"] = datetime.utcnow().isoformat()
    await db.orders.insert_one(dict(doc))
    # decrement stock (best effort)
    for it in payload.items:
        await db.products.update_one(
            {"id": it.productId, "stock": {"$gte": it.qty}}, {"$inc": {"stock": -it.qty}}
        )
    doc.pop("_id", None)
    return doc


# ------------------------- Products (admin) -------------------------
@api_router.post("/admin/products")
async def create_product(payload: Product, email: str = Depends(get_current_admin)):
    doc = payload.dict()
    doc["id"] = str(uuid.uuid4())
    doc["createdAt"] = datetime.utcnow().isoformat()
    await db.products.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/products/{pid}")
async def update_product(pid: str, payload: Product, email: str = Depends(get_current_admin)):
    data = payload.dict()
    data.pop("id", None)
    res = await db.products.update_one({"id": pid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return {"ok": True}


@api_router.delete("/admin/products/{pid}")
async def delete_product(pid: str, email: str = Depends(get_current_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# ------------------------- Orders (admin) -------------------------
@api_router.get("/admin/orders")
async def list_orders(email: str = Depends(get_current_admin)):
    items = await db.orders.find().sort("createdAt", -1).to_list(1000)
    return [strip_id(i) for i in items]


@api_router.patch("/admin/orders/{oid}")
async def update_order(oid: str, payload: OrderStatus, email: str = Depends(get_current_admin)):
    res = await db.orders.update_one({"id": oid}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return {"ok": True}


@api_router.delete("/admin/orders/{oid}")
async def delete_order(oid: str, email: str = Depends(get_current_admin)):
    await db.orders.delete_one({"id": oid})
    return {"ok": True}


# ------------------------- Seeding -------------------------
@app.on_event("startup")
async def seed():
    if not await db.admin_users.find_one({"email": ADMIN_EMAIL.lower()}):
        await db.admin_users.insert_one(
            {"email": ADMIN_EMAIL.lower(), "password": pwd_ctx.hash(ADMIN_PASSWORD)}
        )
    if not await db.site.find_one({"_id": "content"}):
        doc = dict(DEFAULT_CONTENT)
        doc["_id"] = "content"
        await db.site.insert_one(doc)
    if not await db.site.find_one({"_id": "services"}):
        await db.site.insert_one({"_id": "services", "categories": DEFAULT_SERVICES})
    if not await db.site.find_one({"_id": "hours"}):
        await db.site.insert_one({"_id": "hours", "hours": DEFAULT_HOURS})
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in DEFAULT_PRODUCTS])
    logger.info("Seed complete")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
