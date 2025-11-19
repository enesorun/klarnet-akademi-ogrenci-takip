from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ad_soyad: str
    konum: str
    seviye: str
    email: str
    yas: int
    meslek: str
    ilk_ders_tarihi: str
    referans: str
    genel_durum: str = "aktif"  # aktif, ara_verdi, eski
    notlar: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StudentCreate(BaseModel):
    ad_soyad: str
    konum: str
    seviye: str
    email: str
    yas: int
    meslek: str
    ilk_ders_tarihi: str
    referans: str
    genel_durum: str = "aktif"
    notlar: str = ""

class StudentUpdate(BaseModel):
    ad_soyad: Optional[str] = None
    konum: Optional[str] = None
    seviye: Optional[str] = None
    email: Optional[str] = None
    yas: Optional[int] = None
    meslek: Optional[str] = None
    ilk_ders_tarihi: Optional[str] = None
    referans: Optional[str] = None
    genel_durum: Optional[str] = None
    notlar: Optional[str] = None

class Tariff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ogrenci_id: str
    baslangic_tarihi: str
    bitis_tarihi: Optional[str] = None
    ucret: float
    aylik_ders_sayisi: int
    not_: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TariffCreate(BaseModel):
    ogrenci_id: str
    baslangic_tarihi: str
    bitis_tarihi: Optional[str] = None
    ucret: float
    aylik_ders_sayisi: int
    not_: str = ""

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ogrenci_id: str
    tarih: str
    tutar: float
    ders_sayisi: int = 4
    not_: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentCreate(BaseModel):
    ogrenci_id: str
    tarih: str
    tutar: float
    ders_sayisi: int = 4
    not_: str = ""

class Lesson(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ogrenci_id: str
    tarih: str
    sure: int = 50
    islenen_konu: str
    odev_not: str = ""
    onemli: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LessonCreate(BaseModel):
    ogrenci_id: str
    tarih: str
    sure: int = 50
    islenen_konu: str
    odev_not: str = ""
    onemli: bool = False

class DashboardStats(BaseModel):
    aktif_ogrenci_sayisi: int
    potansiyel_aylik_gelir: float
    odeme_yaklasan: dict
    odeme_bekleyen: dict

class ReferansRapor(BaseModel):
    referans: str
    ogrenci_sayisi: int
    ortalama_kalis_suresi: float
    toplam_gelir: float

class AylikRapor(BaseModel):
    ay: str
    yeni_baslayan: int
    ara_veren: int
    birakan: int
    ay_sonu_toplam: int

class GenelIstatistik(BaseModel):
    toplam_ogrenci: int
    toplam_yapilan_ders: int
    toplam_kazanilan_para: float
    ortalama_ders_ucreti: float
    ogrenci_basina_ortalama_ders: float

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.username == "enesorun" and request.password == "316400":
        return LoginResponse(success=True, message="Giriş başarılı")
    return LoginResponse(success=False, message="Kullanıcı adı veya parola hatalı.")

# ==================== STUDENT ENDPOINTS ====================

@api_router.get("/students", response_model=List[Student])
async def get_students(status: Optional[str] = None):
    query = {}
    if status:
        query["genel_durum"] = status
    
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return student

@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate):
    student_obj = Student(**student.model_dump())
    doc = student_obj.model_dump()
    await db.students.insert_one(doc)
    
    # İlk tarife oluştur
    tariff = Tariff(
        ogrenci_id=student_obj.id,
        baslangic_tarihi=student_obj.ilk_ders_tarihi,
        ucret=6000,
        aylik_ders_sayisi=4,
        not_="İlk tarife"
    )
    await db.tariffs.insert_one(tariff.model_dump())
    
    return student_obj

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: StudentUpdate):
    update_data = {k: v for k, v in student_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek veri bulunamadı")
    
    result = await db.students.update_one(
        {"id": student_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    return updated_student

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return {"message": "Öğrenci silindi"}

# ==================== TARIFF ENDPOINTS ====================

@api_router.get("/tariffs/{student_id}", response_model=List[Tariff])
async def get_tariffs(student_id: str):
    tariffs = await db.tariffs.find({"ogrenci_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tariffs

@api_router.post("/tariffs", response_model=Tariff)
async def create_tariff(tariff: TariffCreate):
    # Eski tarifeyi kapat
    await db.tariffs.update_many(
        {"ogrenci_id": tariff.ogrenci_id, "bitis_tarihi": None},
        {"$set": {"bitis_tarihi": tariff.baslangic_tarihi}}
    )
    
    tariff_obj = Tariff(**tariff.model_dump())
    doc = tariff_obj.model_dump()
    await db.tariffs.insert_one(doc)
    return tariff_obj

@api_router.put("/tariffs/{tariff_id}", response_model=Tariff)
async def update_tariff(tariff_id: str, tariff_update: TariffCreate):
    update_data = tariff_update.model_dump()
    
    result = await db.tariffs.update_one(
        {"id": tariff_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    updated_tariff = await db.tariffs.find_one({"id": tariff_id}, {"_id": 0})
    return updated_tariff

# ==================== PAYMENT ENDPOINTS ====================

@api_router.get("/payments/{student_id}", response_model=List[Payment])
async def get_payments(student_id: str):
    payments = await db.payments.find({"ogrenci_id": student_id}, {"_id": 0}).sort("tarih", -1).to_list(100)
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    payment_obj = Payment(**payment.model_dump())
    doc = payment_obj.model_dump()
    await db.payments.insert_one(doc)
    return payment_obj

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, payment_update: PaymentCreate):
    update_data = payment_update.model_dump()
    
    result = await db.payments.update_one(
        {"id": payment_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ödeme bulunamadı")
    
    updated_payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    return updated_payment

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str):
    result = await db.payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ödeme bulunamadı")
    return {"message": "Ödeme silindi"}

# ==================== LESSON ENDPOINTS ====================

@api_router.get("/lessons/{student_id}", response_model=List[Lesson])
async def get_lessons(student_id: str):
    lessons = await db.lessons.find({"ogrenci_id": student_id}, {"_id": 0}).sort("tarih", -1).to_list(1000)
    return lessons

@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(lesson: LessonCreate):
    lesson_obj = Lesson(**lesson.model_dump())
    doc = lesson_obj.model_dump()
    await db.lessons.insert_one(doc)
    return lesson_obj

@api_router.put("/lessons/{lesson_id}", response_model=Lesson)
async def update_lesson(lesson_id: str, lesson_update: LessonCreate):
    update_data = lesson_update.model_dump()
    
    result = await db.lessons.update_one(
        {"id": lesson_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    updated_lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    return updated_lesson

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str):
    result = await db.lessons.delete_one({"id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    return {"message": "Ders silindi"}

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Aktif öğrenciler
    aktif_students = await db.students.find({"genel_durum": "aktif"}, {"_id": 0}).to_list(1000)
    aktif_count = len(aktif_students)
    
    # Her öğrenci için hesaplamalar
    potansiyel_gelir = 0
    odeme_yaklasan_list = []
    odeme_bekleyen_list = []
    
    for student in aktif_students:
        student_id = student["id"]
        
        # Güncel tarife
        tariff = await db.tariffs.find_one(
            {"ogrenci_id": student_id, "bitis_tarihi": None},
            {"_id": 0}
        )
        
        if not tariff:
            continue
        
        # Ödemeler ve dersler
        payments = await db.payments.find({"ogrenci_id": student_id}, {"_id": 0}).to_list(1000)
        lessons = await db.lessons.find({"ogrenci_id": student_id}, {"_id": 0}).to_list(1000)
        
        toplam_ders_kredisi = sum(p["ders_sayisi"] for p in payments)
        yapilan_ders = len(lessons)
        kalan_ders = toplam_ders_kredisi - yapilan_ders
        
        # Potansiyel gelir hesapla (4 derslik paket)
        potansiyel_gelir += tariff["ucret"]
        
        # Ödeme durumu
        if kalan_ders == 0:
            odeme_bekleyen_list.append({"student": student, "tariff": tariff})
        elif kalan_ders == 1:
            odeme_yaklasan_list.append({"student": student, "tariff": tariff})
    
    # Toplam tutar hesapla
    odeme_yaklasan_tutar = sum(item["tariff"]["ucret"] for item in odeme_yaklasan_list)
    odeme_bekleyen_tutar = sum(item["tariff"]["ucret"] for item in odeme_bekleyen_list)
    
    return DashboardStats(
        aktif_ogrenci_sayisi=aktif_count,
        potansiyel_aylik_gelir=potansiyel_gelir,
        odeme_yaklasan={
            "count": len(odeme_yaklasan_list),
            "tutar": odeme_yaklasan_tutar
        },
        odeme_bekleyen={
            "count": len(odeme_bekleyen_list),
            "tutar": odeme_bekleyen_tutar
        }
    )

# ==================== REPORT ENDPOINTS ====================

@api_router.get("/reports/referans", response_model=List[ReferansRapor])
async def get_referans_raporu():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    referans_data = {}
    
    for student in students:
        ref = student.get("referans", "Diğer")
        
        if ref not in referans_data:
            referans_data[ref] = {
                "ogrenci_sayisi": 0,
                "toplam_kalis_suresi": 0,
                "toplam_gelir": 0
            }
        
        referans_data[ref]["ogrenci_sayisi"] += 1
        
        # Kalış süresi hesapla (ay)
        try:
            if isinstance(student["ilk_ders_tarihi"], str):
                ilk_ders = datetime.fromisoformat(student["ilk_ders_tarihi"].replace("Z", "+00:00"))
            else:
                ilk_ders = student["ilk_ders_tarihi"]
            
            # Make sure both datetimes are timezone-aware
            if ilk_ders.tzinfo is None:
                ilk_ders = ilk_ders.replace(tzinfo=timezone.utc)
                
            now = datetime.now(timezone.utc)
            kalis_suresi = (now - ilk_ders).days / 30
        except:
            kalis_suresi = 0
        referans_data[ref]["toplam_kalis_suresi"] += kalis_suresi
        
        # Toplam gelir
        payments = await db.payments.find({"ogrenci_id": student["id"]}, {"_id": 0}).to_list(1000)
        toplam_odeme = sum(p["tutar"] for p in payments)
        referans_data[ref]["toplam_gelir"] += toplam_odeme
    
    result = []
    for ref, data in referans_data.items():
        ortalama_kalis = data["toplam_kalis_suresi"] / data["ogrenci_sayisi"] if data["ogrenci_sayisi"] > 0 else 0
        result.append(ReferansRapor(
            referans=ref,
            ogrenci_sayisi=data["ogrenci_sayisi"],
            ortalama_kalis_suresi=round(ortalama_kalis, 1),
            toplam_gelir=data["toplam_gelir"]
        ))
    
    return result

@api_router.get("/reports/aylik", response_model=List[AylikRapor])
async def get_aylik_rapor():
    # Basitleştirilmiş versiyon - gerçek implementasyon durum değişikliği timeline'ına göre yapılmalı
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    # Şimdilik sadece toplam sayı
    aktif = len([s for s in students if s["genel_durum"] == "aktif"])
    ara_verdi = len([s for s in students if s["genel_durum"] == "ara_verdi"])
    eski = len([s for s in students if s["genel_durum"] == "eski"])
    
    return [AylikRapor(
        ay="Toplam",
        yeni_baslayan=0,
        ara_veren=ara_verdi,
        birakan=eski,
        ay_sonu_toplam=aktif + ara_verdi
    )]

@api_router.get("/reports/genel", response_model=GenelIstatistik)
async def get_genel_istatistik():
    # Başlangıç değerleri
    BASLANGIC_ESKI = 250
    BASLANGIC_ARA_VERDI = 17
    BASLANGIC_DERS = 5000
    
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    toplam_ogrenci = len(students) + BASLANGIC_ESKI
    
    # Tüm dersler
    all_lessons = await db.lessons.find({}, {"_id": 0}).to_list(10000)
    toplam_ders = len(all_lessons) + BASLANGIC_DERS
    
    # Tüm ödemeler
    all_payments = await db.payments.find({}, {"_id": 0}).to_list(10000)
    toplam_kazanc = sum(p["tutar"] for p in all_payments)
    
    ortalama_ders_ucreti = toplam_kazanc / toplam_ders if toplam_ders > 0 else 0
    ogrenci_basina_ders = toplam_ders / toplam_ogrenci if toplam_ogrenci > 0 else 0
    
    return GenelIstatistik(
        toplam_ogrenci=toplam_ogrenci,
        toplam_yapilan_ders=toplam_ders,
        toplam_kazanilan_para=toplam_kazanc,
        ortalama_ders_ucreti=round(ortalama_ders_ucreti, 2),
        ogrenci_basina_ortalama_ders=round(ogrenci_basina_ders, 1)
    )

# ==================== CALCULATE ENDPOINTS ====================

@api_router.get("/calculate/{student_id}")
async def calculate_student_data(student_id: str):
    """Öğrenci için tüm hesaplamaları yap"""
    
    # Güncel tarife
    tariff = await db.tariffs.find_one(
        {"ogrenci_id": student_id, "bitis_tarihi": None},
        {"_id": 0}
    )
    
    # Ödemeler
    payments = await db.payments.find({"ogrenci_id": student_id}, {"_id": 0}).to_list(1000)
    toplam_odenen = sum(p["tutar"] for p in payments)
    toplam_ders_kredisi = sum(p["ders_sayisi"] for p in payments)
    son_odeme = payments[0] if payments else None
    
    # Dersler
    lessons = await db.lessons.find({"ogrenci_id": student_id}, {"_id": 0}).to_list(1000)
    yapilan_ders = len(lessons)
    kalan_ders = toplam_ders_kredisi - yapilan_ders
    
    # Progress hesapla (4 derslik paket için)
    progress_percentage = ((4 - (kalan_ders % 4)) / 4 * 100) if kalan_ders >= 0 else 0
    
    # Durum rengi
    if kalan_ders == 0:
        status_color = "red"
    elif kalan_ders == 1:
        status_color = "yellow"
    else:
        status_color = "green"
    
    return {
        "tariff": tariff,
        "toplam_odenen": toplam_odenen,
        "toplam_ders_kredisi": toplam_ders_kredisi,
        "yapilan_ders": yapilan_ders,
        "kalan_ders": kalan_ders,
        "son_odeme": son_odeme,
        "progress_percentage": progress_percentage,
        "status_color": status_color
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()