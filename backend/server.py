from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
from database import db as sqlite_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite database (imported from database.py)
db = sqlite_db

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
    ozel_alanlar: Optional[dict] = {}
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
    ozel_alanlar: Optional[dict] = {}

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
    tarife_id: Optional[str] = None
    tarih: str
    tutar: float
    ders_sayisi: int = 4
    not_: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentCreate(BaseModel):
    ogrenci_id: str
    tarife_id: Optional[str] = None
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
    islenen_konu: str = ""
    odev_not: str = ""
    onemli: bool = False
    not_: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LessonCreate(BaseModel):
    ogrenci_id: str
    tarih: str
    sure: int = 50
    islenen_konu: str = ""
    odev_not: str = ""
    onemli: bool = False
    not_: str = ""

class DashboardStats(BaseModel):
    aktif_ogrenci_sayisi: int
    potansiyel_aylik_gelir: float
    aylik_gelir: float = 0.0
    baslangic_gunu: int = 15
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

# ==================== GRUP DERSLERI MODELS ====================

class Sezon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sezon_adi: str
    baslangic_tarihi: Optional[str] = ""
    bitis_tarihi: Optional[str] = ""
    durum: str = "aktif"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SezonCreate(BaseModel):
    sezon_adi: str
    baslangic_tarihi: Optional[str] = ""
    bitis_tarihi: Optional[str] = ""
    durum: str = "aktif"

class Grup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sezon_id: str
    grup_adi: str
    kur_etap: str  # "1. Etap", "2. Etap", "Tam Paket"
    gun_saat: str  # Örn: "Pazartesi 18:00"
    max_kapasite: int
    toplam_ders_sayisi: int = 16
    yapilan_ders_sayisi: int = 0
    durum: str = "aktif"  # aktif, tamamlandi
    ozel_alanlar: Optional[dict] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GrupCreate(BaseModel):
    sezon_id: str
    grup_adi: str
    kur_etap: str
    gun_saat: str
    max_kapasite: int
    toplam_ders_sayisi: int = 16
    ozel_alanlar: Optional[dict] = {}

class GrupOgrenci(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sezon_id: str
    grup_id: str
    ad_soyad: str
    telefon: str
    eposta: Optional[str] = ""
    paket_tipi: str  # "1. Etap", "2. Etap", "Tam Paket"
    ucret: float
    odeme_sekli: str  # "Peşin", "2 Taksit", "4 Taksit"
    odenen_tutar: float = 0
    kalan_tutar: float = 0
    ilk_odeme_tutari: Optional[float] = 0
    ilk_odeme_tarihi: Optional[str] = ""
    kayit_tarihi: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    durum: str = "aktif"  # aktif, ayrildi, beklemede
    ozel_alanlar: Optional[dict] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GrupOgrenciCreate(BaseModel):
    sezon_id: str
    grup_id: str
    ad_soyad: str
    telefon: str
    eposta: Optional[str] = ""
    paket_tipi: str
    ucret: float
    odeme_sekli: str
    ilk_odeme_tutari: Optional[float] = 0
    ilk_odeme_tarihi: Optional[str] = ""
    ozel_alanlar: Optional[dict] = {}

class GrupDashboardStats(BaseModel):
    toplam_grup_sayisi: int
    toplam_ogrenci_sayisi: int
    tahmini_toplam_gelir: float
    odeme_tamamlanan: int
    taksitte_olan: int

# Grup Ödemesi Model
class GrupOdeme(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    grup_ogrenci_id: str
    grup_id: str
    tutar: float
    tarih: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    aciklama: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GrupOdemeCreate(BaseModel):
    grup_ogrenci_id: str
    grup_id: str
    tutar: float
    tarih: Optional[str] = None
    aciklama: str = ""

# ==================== İSTATİSTİK BASELINE MODELS ====================

class IstatistikBaseline(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    istatistik_adi: str  # "toplam_ogrenci", "toplam_ders", "toplam_gelir", vs
    manuel_deger: float
    guncelleme_tarihi: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class IstatistikBaselineCreate(BaseModel):
    istatistik_adi: str
    manuel_deger: float

# ==================== AYARLAR (SETTINGS) MODELS ====================

class AyarItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kategori: str  # "seviyeler", "etaplar", "ogrenci_durumlari", "grup_durumlari", "referans_kaynaklari", "odeme_sekilleri"
    deger: str  # Görünen değer (örn: "Başlangıç", "1. Etap")
    varsayilan_ucret: Optional[float] = None  # Sadece etaplar için
    sira: int = 0  # Sıralama için
    aktif: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AyarItemCreate(BaseModel):
    kategori: str
    deger: str
    varsayilan_ucret: Optional[float] = None
    sira: int = 0
    aktif: bool = True

# ==================== ÖZEL ALAN MODEL ====================

class OzelAlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    model_tipi: str  # "ogrenci", "grup", "grup_ogrenci"
    alan_adi: str
    alan_tipi: str  # "text", "number", "date"
    aktif: bool = True
    sira: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OzelAlanCreate(BaseModel):
    model_tipi: str
    alan_adi: str
    alan_tipi: str
    aktif: bool = True

# ==================== GRUP DERS KAYDI MODEL ====================

class GrupDersKaydi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    grup_id: str
    tarih: str
    konu: Optional[str] = ""
    not_: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GrupDersKaydiCreate(BaseModel):
    grup_id: str
    tarih: str
    konu: Optional[str] = ""
    not_: Optional[str] = ""

class AylikGelirRapor(BaseModel):
    ay: str
    donem: str
    toplam_gelir: float
    birebir_gelir: float = 0
    grup_gelir: float = 0
    onceki_ay_fark: float
    degisim_yuzde: float

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
    # SQLite: Filtre ile veya filtresiz tüm öğrencileri getir
    if status:
        students = await db.find_all("students", where={"genel_durum": status}, order_by="created_at DESC")
    else:
        students = await db.find_all("students", order_by="created_at DESC")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    import json
    for student in students:
        if student.get("ozel_alanlar") and isinstance(student["ozel_alanlar"], str):
            try:
                student["ozel_alanlar"] = json.loads(student["ozel_alanlar"])
            except:
                student["ozel_alanlar"] = {}
        elif not student.get("ozel_alanlar"):
            student["ozel_alanlar"] = {}
    
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    # SQLite: ID ile öğrenci getir
    student = await db.find_one("students", where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    import json
    if student.get("ozel_alanlar") and isinstance(student["ozel_alanlar"], str):
        try:
            student["ozel_alanlar"] = json.loads(student["ozel_alanlar"])
        except:
            student["ozel_alanlar"] = {}
    elif not student.get("ozel_alanlar"):
        student["ozel_alanlar"] = {}
    
    return student

@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate):
    import json
    student_obj = Student(**student.model_dump())
    doc = student_obj.model_dump()
    
    # SQLite: ozel_alanlar dict ise JSON string'e çevir (boş dict dahil)
    if isinstance(doc.get("ozel_alanlar"), dict):
        doc["ozel_alanlar"] = json.dumps(doc["ozel_alanlar"], ensure_ascii=False)
    elif doc.get("ozel_alanlar") is None:
        doc["ozel_alanlar"] = "{}"
    
    # SQLite: Insert
    await db.insert("students", doc)
    
    # Frontend'den tarife gönderilmezse, otomatik oluşturulmaz
    # Frontend manuel tarife ekleyecek
    
    return student_obj

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: StudentUpdate):
    update_data = {k: v for k, v in student_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek veri bulunamadı")
    
    # SQLite: Önce öğrencinin var olduğunu kontrol et
    existing = await db.find_one("students", where={"id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # SQLite: Update
    await db.update("students", update_data, "id", student_id)
    
    # Güncellenmiş öğrenciyi getir
    updated_student = await db.find_one("students", where={"id": student_id})
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    import json
    if updated_student.get("ozel_alanlar") and isinstance(updated_student["ozel_alanlar"], str):
        try:
            updated_student["ozel_alanlar"] = json.loads(updated_student["ozel_alanlar"])
        except:
            updated_student["ozel_alanlar"] = {}
    elif not updated_student.get("ozel_alanlar"):
        updated_student["ozel_alanlar"] = {}
    
    return updated_student

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    """Öğrenciyi ve tüm ilişkili verileri sil (Cascade Delete)"""
    # SQLite: Önce öğrencinin var olduğunu kontrol et
    student = await db.find_one("students", where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # SQLite: CASCADE ON DELETE sayesinde ilişkili veriler otomatik silinecek
    # Ancak güvenlik için manuel olarak da silelim
    await db.delete("students", "id", student_id)
    await db.execute("DELETE FROM tarifeler WHERE ogrenci_id = ?", (student_id,))
    await db.execute("DELETE FROM odemeler WHERE ogrenci_id = ?", (student_id,))
    await db.execute("DELETE FROM dersler WHERE ogrenci_id = ?", (student_id,))
    
    return {
        "message": "Öğrenci ve tüm ilişkili veriler silindi",
        "student_id": student_id
    }

# ==================== TARIFF ENDPOINTS ====================

@api_router.get("/tariffs/{student_id}", response_model=List[Tariff])
async def get_tariffs(student_id: str):
    # SQLite: Öğrencinin tarifelerini getir
    tariffs = await db.find_all("tarifeler", where={"ogrenci_id": student_id}, order_by="created_at DESC")
    return tariffs

@api_router.post("/tariffs", response_model=Tariff)
async def create_tariff(tariff: TariffCreate):
    # SQLite: Eski tarifeleri kapat (bitis_tarihi NULL olanları güncelle)
    await db.execute(
        "UPDATE tarifeler SET bitis_tarihi = ? WHERE ogrenci_id = ? AND bitis_tarihi IS NULL",
        (tariff.baslangic_tarihi, tariff.ogrenci_id)
    )
    
    tariff_obj = Tariff(**tariff.model_dump())
    doc = tariff_obj.model_dump()
    
    # SQLite: Insert
    await db.insert("tarifeler", doc)
    return tariff_obj

@api_router.put("/tariffs/{tariff_id}", response_model=Tariff)
async def update_tariff(tariff_id: str, tariff_update: TariffCreate):
    update_data = tariff_update.model_dump()
    
    # SQLite: Önce tarifeyi kontrol et
    existing = await db.find_one("tarifeler", where={"id": tariff_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tarife bulunamadı")
    
    # SQLite: Update
    await db.update("tarifeler", update_data, "id", tariff_id)
    
    # Güncellenmiş tarifeyi getir
    updated_tariff = await db.find_one("tarifeler", where={"id": tariff_id})
    return updated_tariff

# ==================== PAYMENT ENDPOINTS ====================

@api_router.get("/payments/{student_id}", response_model=List[Payment])
async def get_payments(student_id: str):
    # SQLite: Öğrencinin ödemelerini getir
    payments = await db.find_all("odemeler", where={"ogrenci_id": student_id}, order_by="tarih DESC")
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    payment_obj = Payment(**payment.model_dump())
    doc = payment_obj.model_dump()
    
    # SQLite: Insert
    await db.insert("odemeler", doc)
    return payment_obj

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, payment_update: PaymentCreate):
    update_data = payment_update.model_dump()
    
    # SQLite: Önce ödemeyi kontrol et
    existing = await db.find_one("odemeler", where={"id": payment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ödeme bulunamadı")
    
    # SQLite: Update
    await db.update("odemeler", update_data, "id", payment_id)
    
    # Güncellenmiş ödemeyi getir
    updated_payment = await db.find_one("odemeler", where={"id": payment_id})
    return updated_payment

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str):
    # SQLite: Önce ödemeyi kontrol et
    existing = await db.find_one("odemeler", where={"id": payment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ödeme bulunamadı")
    
    # SQLite: Delete
    await db.delete("odemeler", "id", payment_id)
    return {"message": "Ödeme silindi"}

# ==================== LESSON ENDPOINTS ====================

@api_router.get("/lessons/{student_id}", response_model=List[Lesson])
async def get_lessons(student_id: str):
    # SQLite: Öğrencinin derslerini getir
    lessons = await db.find_all("dersler", where={"ogrenci_id": student_id}, order_by="tarih DESC")
    return lessons

@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(lesson: LessonCreate):
    lesson_obj = Lesson(**lesson.model_dump())
    doc = lesson_obj.model_dump()
    
    # SQLite: Insert
    await db.insert("dersler", doc)
    return lesson_obj

@api_router.put("/lessons/{lesson_id}", response_model=Lesson)
async def update_lesson(lesson_id: str, lesson_update: LessonCreate):
    update_data = lesson_update.model_dump()
    
    # SQLite: Önce dersi kontrol et
    existing = await db.find_one("dersler", where={"id": lesson_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    # SQLite: Update
    await db.update("dersler", update_data, "id", lesson_id)
    
    # Güncellenmiş dersi getir
    updated_lesson = await db.find_one("dersler", where={"id": lesson_id})
    return updated_lesson

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str):
    # SQLite: Önce dersi kontrol et
    existing = await db.find_one("dersler", where={"id": lesson_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    
    # SQLite: Delete
    await db.delete("dersler", "id", lesson_id)
    return {"message": "Ders silindi"}

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # SQLite: Aktif öğrenciler
    aktif_students = await db.find_all("students", where={"genel_durum": "aktif"})
    aktif_count = len(aktif_students)
    
    # Her öğrenci için hesaplamalar
    potansiyel_gelir = 0
    odeme_yaklasan_list = []
    odeme_bekleyen_list = []
    
    for student in aktif_students:
        student_id = student["id"]
        
        # SQLite: Güncel tarife (bitis_tarihi NULL olan)
        tariff = await db.fetch_one(
            "SELECT * FROM tarifeler WHERE ogrenci_id = ? AND bitis_tarihi IS NULL LIMIT 1",
            (student_id,)
        )
        
        if not tariff:
            continue
        
        # SQLite: Ödemeler ve dersler
        payments = await db.find_all("odemeler", where={"ogrenci_id": student_id})
        lessons = await db.find_all("dersler", where={"ogrenci_id": student_id})
        
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
    
    # Aylık Gelir Hesapla (Ayın 15'inden bugüne kadar ödemeler)
    from datetime import datetime, timezone
    from dateutil.relativedelta import relativedelta
    
    # SQLite: Gelir raporu ayarlarından başlangıç gününü al
    gelir_ayarlari = await db.fetch_one("SELECT * FROM ayarlar WHERE kategori = ? LIMIT 1", ("gelir_raporu_baslangic",))
    baslangic_gunu = int(gelir_ayarlari["deger"]) if gelir_ayarlari else 15
    
    now = datetime.now(timezone.utc)
    
    # Bu ayın başlangıç gününü belirle
    if now.day >= baslangic_gunu:
        # Ayın 15'inden bugüne
        period_start = datetime(now.year, now.month, baslangic_gunu, tzinfo=timezone.utc)
    else:
        # Geçen ayın 15'inden bugüne
        prev_month = now - relativedelta(months=1)
        period_start = datetime(prev_month.year, prev_month.month, baslangic_gunu, tzinfo=timezone.utc)
    
    # SQLite: Bu dönemdeki ödemeleri topla (Birebir)
    birebir_payments = await db.find_all("odemeler")
    aylik_gelir = 0
    
    for payment in birebir_payments:
        try:
            payment_date_str = payment["tarih"].replace("Z", "+00:00")
            payment_date = datetime.fromisoformat(payment_date_str)
            # Eğer timezone bilgisi yoksa UTC olarak kabul et
            if payment_date.tzinfo is None:
                payment_date = payment_date.replace(tzinfo=timezone.utc)
            if period_start <= payment_date <= now:
                aylik_gelir += payment["tutar"]
        except Exception:
            continue
    
    # SQLite: Grup ödemelerini ekle
    grup_payments = await db.find_all("grup_ogrenci_odemeler")
    for payment in grup_payments:
        try:
            payment_date_str = payment["odeme_tarihi"].replace("Z", "+00:00")
            payment_date = datetime.fromisoformat(payment_date_str)
            # Eğer timezone bilgisi yoksa UTC olarak kabul et
            if payment_date.tzinfo is None:
                payment_date = payment_date.replace(tzinfo=timezone.utc)
            if period_start <= payment_date <= now:
                aylik_gelir += payment["tutar"]
        except Exception:
            continue
    
    return DashboardStats(
        aktif_ogrenci_sayisi=aktif_count,
        potansiyel_aylik_gelir=potansiyel_gelir,
        aylik_gelir=aylik_gelir,
        baslangic_gunu=baslangic_gunu,
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

@api_router.get("/reports/grup-istatistik")
async def get_grup_istatistikleri():
    """Grup dersleri için genel istatistikler - baseline destekli"""
    try:
        # Baseline değerlerini al
        baselines = await db.istatistik_baseline.find({}, {"_id": 0}).to_list(1000)
        baseline_dict = {b["istatistik_adi"]: b["manuel_deger"] for b in baselines}
        
        baseline_grup_ogrenci = baseline_dict.get("grup_toplam_ogrenci", 0)
        baseline_grup_ders = baseline_dict.get("grup_toplam_ders", 0)
        baseline_grup_gelir = baseline_dict.get("grup_toplam_gelir", 0)
        
        # Gerçek verileri topla
        gercek_grup_ogrencisi = await db.grup_ogrenciler.count_documents({})
        gercek_grup_dersi = await db.grup_ders_kayitlari.count_documents({})
        
        grup_odemeler = await db.grup_ogrenci_odemeler.find({}, {"_id": 0}).to_list(10000)
        gercek_grup_geliri = sum(odeme.get("tutar", 0) for odeme in grup_odemeler)
        
        # Toplam = baseline + gerçek
        toplam_grup_ogrencisi = int(baseline_grup_ogrenci + gercek_grup_ogrencisi)
        toplam_grup_dersi = int(baseline_grup_ders + gercek_grup_dersi)
        toplam_grup_geliri = baseline_grup_gelir + gercek_grup_geliri
        
        # Ortalama ders saati ücreti
        ortalama_ders_ucreti = toplam_grup_geliri / toplam_grup_dersi if toplam_grup_dersi > 0 else 0
        
        return {
            "toplam_grup_ogrencisi": toplam_grup_ogrencisi,
            "toplam_yapilan_grup_dersi": toplam_grup_dersi,
            "toplam_grup_geliri": round(toplam_grup_geliri, 2),
            "ortalama_ders_ucreti": round(ortalama_ders_ucreti, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İstatistik hatası: {str(e)}")

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

@api_router.get("/reports/aylik-gelir", response_model=List[AylikGelirRapor])
async def get_aylik_gelir_raporu():
    """
    Aylık gelir raporu - Ayarlanabilir başlangıç günü ile hesaplama
    Birebir ve Grup gelirlerini ayrı gösterir
    """
    from datetime import datetime, timedelta
    from dateutil.relativedelta import relativedelta
    
    # Gelir raporu ayarlarını al
    ayarlar = await db.gelir_raporu_ayarlari.find_one({}, {"_id": 0})
    baslangic_gunu = ayarlar.get("baslangic_gunu", 15) if ayarlar else 15
    
    # Tüm ödemeleri al (Birebir - payments)
    birebir_payments = await db.payments.find({}, {"_id": 0}).to_list(10000)
    
    # Grup ödemelerini al
    grup_payments_raw = await db.grup_odemeler.find({}, {"_id": 0}).to_list(10000)
    # Format'ı birebir ödemelerle aynı yap (tutar ve tarih alanları)
    grup_payments = [{"tutar": p["tutar"], "tarih": p["tarih"]} for p in grup_payments_raw]
    
    all_payments = birebir_payments + grup_payments
    
    if not all_payments:
        return []
    
    # Ödemeleri tarihe göre sırala
    sorted_payments = sorted(all_payments, key=lambda x: x["tarih"])
    
    # İlk ve son ödeme tarihlerini bul
    first_payment_date = datetime.fromisoformat(sorted_payments[0]["tarih"].replace("Z", "+00:00"))
    last_payment_date = datetime.fromisoformat(sorted_payments[-1]["tarih"].replace("Z", "+00:00"))
    
    # İlk ödemenin başlangıç gününden başla
    if first_payment_date.day >= baslangic_gunu:
        start_date = datetime(first_payment_date.year, first_payment_date.month, baslangic_gunu)
    else:
        prev_month = first_payment_date - relativedelta(months=1)
        start_date = datetime(prev_month.year, prev_month.month, baslangic_gunu)
    
    # Son ödemenin ayına kadar git
    end_date = datetime.now()
    
    # Aylık dönemleri oluştur
    monthly_data = []
    current = start_date
    
    while current <= end_date:
        next_period = current + relativedelta(months=1)
        
        # Bu dönemdeki ödemeleri topla (Birebir vs Grup ayrımı)
        birebir_total = 0
        grup_total = 0
        
        for payment in birebir_payments:
            payment_date = datetime.fromisoformat(payment["tarih"].replace("Z", "+00:00"))
            if current <= payment_date < next_period:
                birebir_total += payment["tutar"]
        
        for payment in grup_payments:
            payment_date = datetime.fromisoformat(payment["tarih"].replace("Z", "+00:00"))
            if current <= payment_date < next_period:
                grup_total += payment["tutar"]
        
        period_total = birebir_total + grup_total
        
        # Ay adını belirle (dönem bitiş ayı)
        month_name = next_period.strftime("%B %Y")
        month_name_tr = {
            "January": "Ocak", "February": "Şubat", "March": "Mart",
            "April": "Nisan", "May": "Mayıs", "June": "Haziran",
            "July": "Temmuz", "August": "Ağustos", "September": "Eylül",
            "October": "Ekim", "November": "Kasım", "December": "Aralık"
        }
        for en, tr in month_name_tr.items():
            month_name = month_name.replace(en, tr)
        
        donem_str = f"{current.day} {current.strftime('%B')} - {next_period.day} {next_period.strftime('%B')}"
        for en, tr in month_name_tr.items():
            donem_str = donem_str.replace(en, tr)
        
        monthly_data.append({
            "ay": month_name,
            "donem": donem_str,
            "toplam_gelir": period_total,
            "birebir_gelir": birebir_total,
            "grup_gelir": grup_total
        })
        
        current = next_period
    
    # Önceki aya göre fark ve yüzde hesapla
    result = []
    for i, data in enumerate(monthly_data):
        if i == 0:
            onceki_fark = 0
            degisim_yuzde = 0
        else:
            onceki_gelir = monthly_data[i-1]["toplam_gelir"]
            onceki_fark = data["toplam_gelir"] - onceki_gelir
            if onceki_gelir > 0:
                degisim_yuzde = (onceki_fark / onceki_gelir) * 100
            else:
                degisim_yuzde = 0
        
        result.append(AylikGelirRapor(
            ay=data["ay"],
            donem=data["donem"],
            toplam_gelir=data["toplam_gelir"],
            birebir_gelir=data["birebir_gelir"],
            grup_gelir=data["grup_gelir"],
            onceki_ay_fark=onceki_fark,
            degisim_yuzde=degisim_yuzde
        ))
    
    return result

@api_router.get("/reports/genel", response_model=GenelIstatistik)
async def get_genel_istatistik():
    # Baseline değerlerini al
    baselines = await db.istatistik_baseline.find({}, {"_id": 0}).to_list(1000)
    baseline_dict = {b["istatistik_adi"]: b["manuel_deger"] for b in baselines}
    
    # Manuel baseline varsa kullan, yoksa 0'dan başla
    baseline_ogrenci = baseline_dict.get("toplam_ogrenci", 0)
    baseline_ders = baseline_dict.get("toplam_ders", 0)
    baseline_kazanc = baseline_dict.get("toplam_kazanilan_para", 0)
    
    # Gerçek verileri topla
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    gercek_ogrenci = len(students)
    
    # Tüm dersler (birebir)
    all_lessons = await db.lessons.find({}, {"_id": 0}).to_list(10000)
    gercek_ders = len(all_lessons)
    
    # Grup dersleri ekle
    grup_ders_kayitlari = await db.grup_ders_kayitlari.find({}, {"_id": 0}).to_list(10000)
    gercek_ders += len(grup_ders_kayitlari)
    
    # Tüm ödemeler (birebir)
    all_payments = await db.payments.find({}, {"_id": 0}).to_list(10000)
    gercek_kazanc = sum(p["tutar"] for p in all_payments)
    
    # Grup öğrenci ödemeleri ekle
    grup_odemeler = await db.grup_ogrenci_odemeler.find({}, {"_id": 0}).to_list(10000)
    gercek_kazanc += sum(p["tutar"] for p in grup_odemeler)
    
    # Toplam = baseline + gerçek veriler
    toplam_ogrenci = baseline_ogrenci + gercek_ogrenci
    toplam_ders = baseline_ders + gercek_ders
    toplam_kazanc = baseline_kazanc + gercek_kazanc
    
    # Ortalamalar
    ortalama_ders_ucreti = toplam_kazanc / toplam_ders if toplam_ders > 0 else 0
    ogrenci_basina_ders = toplam_ders / toplam_ogrenci if toplam_ogrenci > 0 else 0
    
    return GenelIstatistik(
        toplam_ogrenci=int(toplam_ogrenci),
        toplam_yapilan_ders=int(toplam_ders),
        toplam_kazanilan_para=toplam_kazanc,
        ortalama_ders_ucreti=round(ortalama_ders_ucreti, 2),
        ogrenci_basina_ortalama_ders=round(ogrenci_basina_ders, 1)
    )

# ==================== CALCULATE ENDPOINTS ====================

@api_router.get("/calculate/{student_id}")
async def calculate_student_data(student_id: str):
    """Öğrenci için tüm hesaplamaları yap"""
    
    # SQLite: Güncel tarife (bitis_tarihi NULL olan)
    tariff = await db.fetch_one(
        "SELECT * FROM tarifeler WHERE ogrenci_id = ? AND bitis_tarihi IS NULL LIMIT 1",
        (student_id,)
    )
    
    # SQLite: Ödemeler
    payments = await db.find_all("odemeler", where={"ogrenci_id": student_id})
    toplam_odenen = sum(p["tutar"] for p in payments)
    toplam_ders_kredisi = sum(p.get("ders_sayisi", 0) for p in payments)
    son_odeme = payments[0] if payments else None
    
    # SQLite: Dersler
    lessons = await db.find_all("dersler", where={"ogrenci_id": student_id})
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

# ==================== GRUP DERSLERI ENDPOINTS ====================

# Sezon endpoints
@api_router.get("/grup-dersleri/sezonlar", response_model=List[Sezon])
async def get_sezonlar():
    # SQLite: Tüm sezonları getir
    sezonlar = await db.find_all("grup_sezonlar", order_by="created_at DESC")
    return sezonlar

@api_router.post("/grup-dersleri/sezonlar", response_model=Sezon)
async def create_sezon(sezon: SezonCreate):
    new_sezon = Sezon(**sezon.dict())
    sezon_dict = new_sezon.dict()
    
    # SQLite: Insert
    await db.insert("grup_sezonlar", sezon_dict)
    return new_sezon

@api_router.delete("/grup-dersleri/sezonlar/{sezon_id}")
async def delete_sezon(sezon_id: str):
    # SQLite: Önce sezonu kontrol et
    existing = await db.find_one("grup_sezonlar", where={"id": sezon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Sezon bulunamadı")
    
    # SQLite: CASCADE ON DELETE ile ilişkili gruplar da silinecek
    await db.delete("grup_sezonlar", "id", sezon_id)
    return {"message": "Sezon silindi"}

# Grup endpoints
@api_router.get("/grup-dersleri/gruplar", response_model=List[Grup])
async def get_gruplar(sezon_id: Optional[str] = None):
    # SQLite: Filtre ile veya filtresiz grupları getir
    import json
    if sezon_id:
        gruplar = await db.find_all("gruplar", where={"sezon_id": sezon_id}, order_by="created_at DESC")
    else:
        gruplar = await db.find_all("gruplar", order_by="created_at DESC")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    for grup in gruplar:
        if grup.get("ozel_alanlar") and isinstance(grup["ozel_alanlar"], str):
            try:
                grup["ozel_alanlar"] = json.loads(grup["ozel_alanlar"])
            except:
                grup["ozel_alanlar"] = {}
        elif not grup.get("ozel_alanlar"):
            grup["ozel_alanlar"] = {}
    
    return gruplar

@api_router.post("/grup-dersleri/gruplar", response_model=Grup)
async def create_grup(grup: GrupCreate):
    import json
    new_grup = Grup(**grup.dict())
    grup_dict = new_grup.dict()
    
    # SQLite: ozel_alanlar dict ise JSON string'e çevir
    if isinstance(grup_dict.get("ozel_alanlar"), dict):
        grup_dict["ozel_alanlar"] = json.dumps(grup_dict["ozel_alanlar"], ensure_ascii=False)
    elif grup_dict.get("ozel_alanlar") is None:
        grup_dict["ozel_alanlar"] = "{}"
    
    # SQLite: Insert
    await db.insert("gruplar", grup_dict)
    return new_grup

@api_router.get("/grup-dersleri/gruplar/{grup_id}", response_model=Grup)
async def get_grup(grup_id: str):
    import json
    # SQLite: ID ile grup getir
    grup = await db.find_one("gruplar", where={"id": grup_id})
    if not grup:
        raise HTTPException(status_code=404, detail="Grup bulunamadı")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    if grup.get("ozel_alanlar") and isinstance(grup["ozel_alanlar"], str):
        try:
            grup["ozel_alanlar"] = json.loads(grup["ozel_alanlar"])
        except:
            grup["ozel_alanlar"] = {}
    elif not grup.get("ozel_alanlar"):
        grup["ozel_alanlar"] = {}
    
    return grup

@api_router.put("/grup-dersleri/gruplar/{grup_id}", response_model=Grup)
async def update_grup(grup_id: str, grup: GrupCreate):
    import json
    # SQLite: Önce grubu kontrol et
    existing = await db.find_one("gruplar", where={"id": grup_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Grup bulunamadı")
    
    update_data = grup.dict()
    
    # SQLite: ozel_alanlar dict ise JSON string'e çevir
    if isinstance(update_data.get("ozel_alanlar"), dict):
        update_data["ozel_alanlar"] = json.dumps(update_data["ozel_alanlar"], ensure_ascii=False)
    
    # SQLite: Update
    await db.update("gruplar", update_data, "id", grup_id)
    
    # Güncellenmiş grubu getir
    updated_grup = await db.find_one("gruplar", where={"id": grup_id})
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    if updated_grup.get("ozel_alanlar") and isinstance(updated_grup["ozel_alanlar"], str):
        try:
            updated_grup["ozel_alanlar"] = json.loads(updated_grup["ozel_alanlar"])
        except:
            updated_grup["ozel_alanlar"] = {}
    
    return updated_grup

@api_router.delete("/grup-dersleri/gruplar/{grup_id}")
async def delete_grup(grup_id: str):
    # SQLite: Önce grubu kontrol et
    existing = await db.find_one("gruplar", where={"id": grup_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Grup bulunamadı")
    
    # SQLite: CASCADE ON DELETE ile ilişkili veriler silinecek
    await db.delete("gruplar", "id", grup_id)
    return {"message": "Grup silindi"}

# Grup öğrenci endpoints
@api_router.get("/grup-dersleri/ogrenciler", response_model=List[GrupOgrenci])
async def get_grup_ogrenciler(
    sezon_id: Optional[str] = None,
    grup_id: Optional[str] = None,
    durum: Optional[str] = None
):
    # SQLite: Dinamik sorgu oluştur
    import json
    where_clause = {}
    if sezon_id:
        where_clause["sezon_id"] = sezon_id
    if grup_id:
        where_clause["grup_id"] = grup_id
    if durum:
        where_clause["durum"] = durum
    
    if where_clause:
        ogrenciler = await db.find_all("grup_ogrenciler", where=where_clause, order_by="created_at DESC")
    else:
        ogrenciler = await db.find_all("grup_ogrenciler", order_by="created_at DESC")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    for ogrenci in ogrenciler:
        if ogrenci.get("ozel_alanlar") and isinstance(ogrenci["ozel_alanlar"], str):
            try:
                ogrenci["ozel_alanlar"] = json.loads(ogrenci["ozel_alanlar"])
            except:
                ogrenci["ozel_alanlar"] = {}
        elif not ogrenci.get("ozel_alanlar"):
            ogrenci["ozel_alanlar"] = {}
    
    return ogrenciler

@api_router.post("/grup-dersleri/ogrenciler", response_model=GrupOgrenci)
async def create_grup_ogrenci(ogrenci: GrupOgrenciCreate):
    import json
    new_ogrenci = GrupOgrenci(**ogrenci.dict())
    
    # İlk ödeme varsa, ödenen tutarı güncelle
    if new_ogrenci.ilk_odeme_tutari and new_ogrenci.ilk_odeme_tutari > 0:
        new_ogrenci.odenen_tutar = new_ogrenci.ilk_odeme_tutari
    
    # Kalan tutarı hesapla
    new_ogrenci.kalan_tutar = new_ogrenci.ucret - new_ogrenci.odenen_tutar
    
    ogrenci_dict = new_ogrenci.dict()
    
    # SQLite: ozel_alanlar dict ise JSON string'e çevir
    if isinstance(ogrenci_dict.get("ozel_alanlar"), dict):
        ogrenci_dict["ozel_alanlar"] = json.dumps(ogrenci_dict["ozel_alanlar"], ensure_ascii=False)
    elif ogrenci_dict.get("ozel_alanlar") is None:
        ogrenci_dict["ozel_alanlar"] = "{}"
    
    # SQLite: Insert
    await db.insert("grup_ogrenciler", ogrenci_dict)
    return new_ogrenci

@api_router.get("/grup-dersleri/ogrenciler/{ogrenci_id}", response_model=GrupOgrenci)
async def get_grup_ogrenci(ogrenci_id: str):
    import json
    # SQLite: ID ile grup öğrencisi getir
    ogrenci = await db.find_one("grup_ogrenciler", where={"id": ogrenci_id})
    if not ogrenci:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    if ogrenci.get("ozel_alanlar") and isinstance(ogrenci["ozel_alanlar"], str):
        try:
            ogrenci["ozel_alanlar"] = json.loads(ogrenci["ozel_alanlar"])
        except:
            ogrenci["ozel_alanlar"] = {}
    elif not ogrenci.get("ozel_alanlar"):
        ogrenci["ozel_alanlar"] = {}
    
    return ogrenci

@api_router.put("/grup-dersleri/ogrenciler/{ogrenci_id}", response_model=GrupOgrenci)
async def update_grup_ogrenci(ogrenci_id: str, ogrenci: GrupOgrenciCreate):
    import json
    # SQLite: Mevcut öğrenciyi kontrol et
    existing = await db.find_one("grup_ogrenciler", where={"id": ogrenci_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # Güncelleme dictionary'si oluştur
    update_data = {
        "ad_soyad": ogrenci.ad_soyad,
        "telefon": ogrenci.telefon,
        "eposta": ogrenci.eposta,
        "paket_tipi": ogrenci.paket_tipi,
        "ucret": ogrenci.ucret,
        "odeme_sekli": ogrenci.odeme_sekli,
    }
    
    # ozel_alanlar işleme
    ozel_alanlar = ogrenci.ozel_alanlar or existing.get("ozel_alanlar", {})
    if isinstance(ozel_alanlar, str):
        try:
            ozel_alanlar = json.loads(ozel_alanlar)
        except:
            ozel_alanlar = {}
    update_data["ozel_alanlar"] = json.dumps(ozel_alanlar, ensure_ascii=False) if isinstance(ozel_alanlar, dict) else "{}"
    
    # İlk ödeme tutarı varsa ve değiştiyse, ödeme kaydı oluştur
    if ogrenci.ilk_odeme_tutari and ogrenci.ilk_odeme_tutari > 0:
        # Ödenen tutarı güncelle
        new_odenen = existing.get("odenen_tutar", 0) + ogrenci.ilk_odeme_tutari
        update_data["odenen_tutar"] = new_odenen
        
        # SQLite: Ödeme kaydı oluştur
        odeme = GrupOdeme(
            grup_ogrenci_id=ogrenci_id,
            grup_id=ogrenci.grup_id,
            tutar=ogrenci.ilk_odeme_tutari,
            tarih=ogrenci.ilk_odeme_tarihi or datetime.now(timezone.utc).isoformat(),
            aciklama="Güncelleme sırasında eklenen ödeme"
        )
        await db.insert("grup_ogrenci_odemeler", odeme.dict())
    else:
        # Ödenen tutarı koru
        update_data["odenen_tutar"] = existing.get("odenen_tutar", 0)
    
    # Kalan tutarı hesapla
    update_data["kalan_tutar"] = ogrenci.ucret - update_data["odenen_tutar"]
    
    # SQLite: Güncelle
    await db.update("grup_ogrenciler", update_data, "id", ogrenci_id)
    
    # Güncellenmiş öğrenciyi dön
    updated = await db.find_one("grup_ogrenciler", where={"id": ogrenci_id})
    
    # JSON string olan ozel_alanlar'ı dict'e çevir
    if updated.get("ozel_alanlar") and isinstance(updated["ozel_alanlar"], str):
        try:
            updated["ozel_alanlar"] = json.loads(updated["ozel_alanlar"])
        except:
            updated["ozel_alanlar"] = {}
    
    return updated

@api_router.delete("/grup-dersleri/ogrenciler/{ogrenci_id}")
async def delete_grup_ogrenci(ogrenci_id: str):
    """Grup öğrencisini ve tüm ilişkili verileri sil (Cascade Delete)"""
    # SQLite: Önce öğrencinin var olduğunu kontrol et
    ogrenci = await db.find_one("grup_ogrenciler", where={"id": ogrenci_id})
    if not ogrenci:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    
    # SQLite: CASCADE ON DELETE ile ilişkili ödemeler silinecek
    await db.delete("grup_ogrenciler", "id", ogrenci_id)
    await db.execute("DELETE FROM grup_ogrenci_odemeler WHERE ogrenci_id = ?", (ogrenci_id,))
    
    return {
        "message": "Grup öğrencisi ve tüm ödemeleri silindi",
        "ogrenci_id": ogrenci_id
    }

# Grup dersleri dashboard
@api_router.get("/grup-dersleri/dashboard/{sezon_id}", response_model=GrupDashboardStats)
async def get_grup_dashboard_stats(sezon_id: str):
    # Sezona ait grupları al
    gruplar = await db.gruplar.find({"sezon_id": sezon_id}, {"_id": 0}).to_list(1000)
    toplam_grup_sayisi = len(gruplar)
    
    # Sezona ait öğrencileri al
    ogrenciler = await db.grup_ogrenciler.find({"sezon_id": sezon_id}, {"_id": 0}).to_list(1000)
    toplam_ogrenci_sayisi = len(ogrenciler)
    
    # Gelir hesaplama
    tahmini_toplam_gelir = sum(o["ucret"] for o in ogrenciler)
    
    # Ödeme durumu
    odeme_tamamlanan = len([o for o in ogrenciler if o["kalan_tutar"] == 0])
    taksitte_olan = len([o for o in ogrenciler if o["kalan_tutar"] > 0])
    
    return GrupDashboardStats(
        toplam_grup_sayisi=toplam_grup_sayisi,
        toplam_ogrenci_sayisi=toplam_ogrenci_sayisi,
        tahmini_toplam_gelir=tahmini_toplam_gelir,
        odeme_tamamlanan=odeme_tamamlanan,
        taksitte_olan=taksitte_olan
    )

# ==================== AYARLAR (SETTINGS) ENDPOINTS ====================

@api_router.get("/ayarlar", response_model=List[AyarItem])
async def get_ayarlar(kategori: Optional[str] = None, aktif: Optional[bool] = None):
    query = {}
    if kategori:
        query["kategori"] = kategori
    if aktif is not None:
        query["aktif"] = aktif
    
    ayarlar = await db.ayarlar.find(query, {"_id": 0}).sort("sira", 1).to_list(1000)
    return ayarlar

@api_router.post("/ayarlar", response_model=AyarItem)
async def create_ayar(ayar: AyarItemCreate):
    new_ayar = AyarItem(**ayar.dict())
    await db.ayarlar.insert_one(new_ayar.dict())
    return new_ayar

@api_router.put("/ayarlar/{ayar_id}", response_model=AyarItem)
async def update_ayar(ayar_id: str, ayar: AyarItemCreate):
    result = await db.ayarlar.update_one(
        {"id": ayar_id},
        {"$set": ayar.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ayar bulunamadı")
    updated_ayar = await db.ayarlar.find_one({"id": ayar_id}, {"_id": 0})
    return updated_ayar

@api_router.delete("/ayarlar/{ayar_id}")
async def delete_ayar(ayar_id: str):
    result = await db.ayarlar.delete_one({"id": ayar_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ayar bulunamadı")
    return {"message": "Ayar silindi"}

# Varsayılan ayarları yükle
@api_router.post("/ayarlar/initialize")
async def initialize_ayarlar():
    # Kontrol et, varsa tekrar yükleme
    existing = await db.ayarlar.count_documents({})
    if existing > 0:
        return {"message": "Ayarlar zaten mevcut", "count": existing}
    
    varsayilan_ayarlar = [
        # Seviyeler
        {"kategori": "seviyeler", "deger": "Başlangıç", "sira": 1, "aktif": True},
        {"kategori": "seviyeler", "deger": "Orta", "sira": 2, "aktif": True},
        {"kategori": "seviyeler", "deger": "İleri", "sira": 3, "aktif": True},
        {"kategori": "seviyeler", "deger": "Uzman", "sira": 4, "aktif": True},
        
        # Öğrenci Durumları
        {"kategori": "ogrenci_durumlari", "deger": "aktif", "sira": 1, "aktif": True},
        {"kategori": "ogrenci_durumlari", "deger": "ara_verdi", "sira": 2, "aktif": True},
        {"kategori": "ogrenci_durumlari", "deger": "eski", "sira": 3, "aktif": True},
        
        # Referans Kaynakları
        {"kategori": "referans_kaynaklari", "deger": "Tavsiye", "sira": 1, "aktif": True},
        {"kategori": "referans_kaynaklari", "deger": "Google Arama", "sira": 2, "aktif": True},
        {"kategori": "referans_kaynaklari", "deger": "Sosyal Medya", "sira": 3, "aktif": True},
        {"kategori": "referans_kaynaklari", "deger": "Meta Reklam", "sira": 4, "aktif": True},
        {"kategori": "referans_kaynaklari", "deger": "Google Reklam", "sira": 5, "aktif": True},
        {"kategori": "referans_kaynaklari", "deger": "Diğer", "sira": 6, "aktif": True},
        
        # Grup Etapları
        {"kategori": "grup_etaplari", "deger": "1. Etap", "varsayilan_ucret": 5000.0, "sira": 1, "aktif": True},
        {"kategori": "grup_etaplari", "deger": "2. Etap", "varsayilan_ucret": 5500.0, "sira": 2, "aktif": True},
        {"kategori": "grup_etaplari", "deger": "Tam Paket", "varsayilan_ucret": 9500.0, "sira": 3, "aktif": True},
        
        # Grup Durumları
        {"kategori": "grup_durumlari", "deger": "planlanan", "sira": 1, "aktif": True},
        {"kategori": "grup_durumlari", "deger": "aktif", "sira": 2, "aktif": True},
        {"kategori": "grup_durumlari", "deger": "tamamlandi", "sira": 3, "aktif": True},
        {"kategori": "grup_durumlari", "deger": "iptal", "sira": 4, "aktif": True},
        
        # Grup Öğrenci Durumları
        {"kategori": "grup_ogrenci_durumlari", "deger": "aktif", "sira": 1, "aktif": True},
        {"kategori": "grup_ogrenci_durumlari", "deger": "beklemede", "sira": 2, "aktif": True},
        {"kategori": "grup_ogrenci_durumlari", "deger": "ayrildi", "sira": 3, "aktif": True},
        
        # Ödeme Şekilleri
        {"kategori": "odeme_sekilleri", "deger": "Peşin", "sira": 1, "aktif": True},
        {"kategori": "odeme_sekilleri", "deger": "2 Taksit", "sira": 2, "aktif": True},
        {"kategori": "odeme_sekilleri", "deger": "4 Taksit", "sira": 3, "aktif": True},
    ]
    
    for ayar_data in varsayilan_ayarlar:
        ayar = AyarItem(**ayar_data)
        await db.ayarlar.insert_one(ayar.dict())
    
    return {"message": "Varsayılan ayarlar yüklendi", "count": len(varsayilan_ayarlar)}

# ==================== ÖZEL ALAN ENDPOINTS ====================

@api_router.get("/ozel-alanlar", response_model=List[OzelAlan])
async def get_ozel_alanlar(model_tipi: Optional[str] = None, aktif: Optional[bool] = None):
    query = {}
    if model_tipi:
        query["model_tipi"] = model_tipi
    if aktif is not None:
        query["aktif"] = aktif
    
    ozel_alanlar = await db.ozel_alanlar.find(query, {"_id": 0}).sort("sira", 1).to_list(1000)
    return ozel_alanlar

@api_router.post("/ozel-alanlar", response_model=OzelAlan)
async def create_ozel_alan(alan: OzelAlanCreate):
    # Aynı model_tipi için maksimum sıra numarasını bul
    existing_alanlar = await db.ozel_alanlar.find(
        {"model_tipi": alan.model_tipi}, 
        {"_id": 0}
    ).to_list(1000)
    max_sira = max([a.get("sira", 0) for a in existing_alanlar], default=0)
    
    new_alan = OzelAlan(**alan.dict(), sira=max_sira + 1)
    await db.ozel_alanlar.insert_one(new_alan.dict())
    return new_alan

@api_router.put("/ozel-alanlar/{alan_id}", response_model=OzelAlan)
async def update_ozel_alan(alan_id: str, alan: OzelAlanCreate):
    result = await db.ozel_alanlar.update_one(
        {"id": alan_id},
        {"$set": alan.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Özel alan bulunamadı")
    updated_alan = await db.ozel_alanlar.find_one({"id": alan_id}, {"_id": 0})
    return updated_alan

@api_router.delete("/ozel-alanlar/{alan_id}")
async def delete_ozel_alan(alan_id: str):
    result = await db.ozel_alanlar.delete_one({"id": alan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Özel alan bulunamadı")
    return {"message": "Özel alan silindi"}

# ==================== GELİR RAPORU AYARLARI ====================

@api_router.get("/gelir-raporu-ayarlari")
async def get_gelir_raporu_ayarlari():
    ayar = await db.gelir_raporu_ayarlari.find_one({}, {"_id": 0})
    if not ayar:
        # Varsayılan ayarları dön
        return {"baslangic_gunu": 15}
    return ayar

@api_router.post("/gelir-raporu-ayarlari")
async def update_gelir_raporu_ayarlari(baslangic_gunu: int):
    if baslangic_gunu < 1 or baslangic_gunu > 28:
        raise HTTPException(status_code=400, detail="Başlangıç günü 1-28 arası olmalıdır")
    
    # Mevcut ayarı güncelle veya yeni oluştur
    await db.gelir_raporu_ayarlari.delete_many({})
    await db.gelir_raporu_ayarlari.insert_one({"baslangic_gunu": baslangic_gunu})
    return {"message": "Ayar kaydedildi", "baslangic_gunu": baslangic_gunu}

# ==================== YEDEKLEME SİSTEMİ ====================

@api_router.post("/backup/create")
async def create_backup():
    """Tüm veritabanını JSON formatında yedekle ve YYYY-MM klasörüne kaydet"""
    import os
    import json
    from datetime import datetime
    
    try:
        # Şu anki tarih
        now = datetime.now()
        year_month = now.strftime("%Y-%m")
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        
        # Yedekleme klasörü oluştur
        backup_dir = f"/app/data/backup/{year_month}"
        os.makedirs(backup_dir, exist_ok=True)
        
        # Yedeklenecek koleksiyonlar
        collections = [
            "ogrenciler",
            "payments",
            "tariffs",
            "ayarlar",
            "grup_sezonlar",
            "gruplar",
            "grup_ogrenciler",
            "grup_ders_kayitlari",
            "ozel_alanlar",
            "gelir_raporu_ayarlari"
        ]
        
        backup_data = {}
        total_documents = 0
        
        # Her koleksiyonu topla
        for collection_name in collections:
            collection = db[collection_name]
            documents = await collection.find({}, {"_id": 0}).to_list(100000)
            backup_data[collection_name] = documents
            total_documents += len(documents)
        
        # JSON dosyası olarak kaydet
        backup_filename = f"yedek_{timestamp}.json"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        # Dosya boyutunu hesapla
        file_size = os.path.getsize(backup_path)
        file_size_mb = file_size / (1024 * 1024)
        
        return {
            "message": "Yedekleme başarıyla tamamlandı",
            "filename": backup_filename,
            "path": backup_path,
            "size_mb": round(file_size_mb, 2),
            "total_documents": total_documents,
            "collections": len(collections),
            "timestamp": now.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yedekleme hatası: {str(e)}")

@api_router.get("/backup/list")
async def list_backups():
    """Mevcut yedekleri listele"""
    import os
    import json
    from datetime import datetime
    
    try:
        backup_base = "/app/data/backup"
        
        if not os.path.exists(backup_base):
            return {"backups": []}
        
        backups = []
        
        # Tüm YYYY-MM klasörlerini tara
        for year_month in sorted(os.listdir(backup_base), reverse=True):
            month_dir = os.path.join(backup_base, year_month)
            
            if not os.path.isdir(month_dir):
                continue
            
            # Klasördeki tüm yedek dosyalarını listele
            for filename in sorted(os.listdir(month_dir), reverse=True):
                if filename.endswith('.json'):
                    filepath = os.path.join(month_dir, filename)
                    file_size = os.path.getsize(filepath)
                    file_size_mb = file_size / (1024 * 1024)
                    
                    # Dosya tarih bilgisini al
                    mtime = os.path.getmtime(filepath)
                    created_at = datetime.fromtimestamp(mtime).isoformat()
                    
                    backups.append({
                        "filename": filename,
                        "year_month": year_month,
                        "size_mb": round(file_size_mb, 2),
                        "created_at": created_at
                    })
        
        return {"backups": backups, "count": len(backups)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liste hatası: {str(e)}")

# ==================== EXPORT/IMPORT SİSTEMİ ====================

@api_router.get("/export/data")
async def export_data():
    """Tüm veriyi tek JSON dosyası olarak export et"""
    from fastapi.responses import StreamingResponse
    import json
    import io
    from datetime import datetime
    
    try:
        # Yedeklenecek koleksiyonlar
        collections = [
            "ogrenciler",
            "payments",
            "tariffs",
            "ayarlar",
            "grup_sezonlar",
            "gruplar",
            "grup_ogrenciler",
            "grup_ders_kayitlari",
            "ozel_alanlar",
            "gelir_raporu_ayarlari"
        ]
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "version": "1.0",
            "collections": {}
        }
        
        # Her koleksiyonu topla
        for collection_name in collections:
            collection = db[collection_name]
            documents = await collection.find({}, {"_id": 0}).to_list(100000)
            export_data["collections"][collection_name] = documents
        
        # JSON string'e çevir
        json_str = json.dumps(export_data, ensure_ascii=False, indent=2)
        json_bytes = json_str.encode('utf-8')
        
        # Stream olarak dön
        return StreamingResponse(
            io.BytesIO(json_bytes),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=klarnet_akademi_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export hatası: {str(e)}")

@api_router.post("/import/data")
async def import_data(file: UploadFile):
    """JSON dosyasını import et (deduplication ile)"""
    import json
    
    try:
        # Dosyayı oku
        contents = await file.read()
        data = json.loads(contents.decode('utf-8'))
        
        # Versiyon kontrolü
        if "collections" not in data:
            raise HTTPException(status_code=400, detail="Geçersiz dosya formatı")
        
        collections_data = data["collections"]
        
        stats = {
            "total_imported": 0,
            "total_skipped": 0,
            "collections": {}
        }
        
        # Her koleksiyonu import et
        for collection_name, documents in collections_data.items():
            collection = db[collection_name]
            
            imported = 0
            skipped = 0
            
            for doc in documents:
                if "id" in doc:
                    # ID var - deduplication yap
                    existing = await collection.find_one({"id": doc["id"]}, {"_id": 0})
                    
                    if existing:
                        skipped += 1
                    else:
                        await collection.insert_one(doc)
                        imported += 1
                else:
                    # ID yok - direkt ekle
                    await collection.insert_one(doc)
                    imported += 1
            
            stats["collections"][collection_name] = {
                "imported": imported,
                "skipped": skipped
            }
            stats["total_imported"] += imported
            stats["total_skipped"] += skipped
        
        return {
            "message": "Import başarıyla tamamlandı",
            "stats": stats
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Geçersiz JSON dosyası")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import hatası: {str(e)}")

# ==================== CSV EXPORT SİSTEMİ ====================

@api_router.get("/export/students/csv")
async def export_students_csv():
    """Bireysel öğrencileri CSV olarak export et"""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    from datetime import datetime
    
    try:
        # Öğrencileri al
        students = await db.students.find({}, {"_id": 0}).to_list(10000)
        
        if not students:
            raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
        
        # CSV oluştur
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        headers = [
            "Ad Soyad", "Konum", "Seviye", "Email", "Yaş", "Meslek",
            "İlk Ders Tarihi", "Referans", "Genel Durum", "Notlar", "Kayıt Tarihi"
        ]
        writer.writerow(headers)
        
        # Satırlar
        for student in students:
            row = [
                student.get("ad_soyad", ""),
                student.get("konum", ""),
                student.get("seviye", ""),
                student.get("email", ""),
                student.get("yas", ""),
                student.get("meslek", ""),
                student.get("ilk_ders_tarihi", ""),
                student.get("referans", ""),
                student.get("genel_durum", ""),
                student.get("notlar", ""),
                student.get("created_at", "")
            ]
            writer.writerow(row)
        
        # CSV'yi bytes'a çevir
        output.seek(0)
        csv_content = output.getvalue().encode('utf-8-sig')  # BOM ekle (Excel için)
        
        return StreamingResponse(
            io.BytesIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=ogrenciler_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export hatası: {str(e)}")

@api_router.get("/export/grup-ogrenciler/csv")
async def export_grup_ogrenciler_csv(grup_id: Optional[str] = None):
    """Grup öğrencilerini CSV olarak export et"""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    from datetime import datetime
    
    try:
        # Query oluştur
        query = {}
        if grup_id:
            query["grup_id"] = grup_id
        
        # Grup öğrencilerini al
        grup_ogrenciler = await db.grup_ogrenciler.find(query, {"_id": 0}).to_list(10000)
        
        if not grup_ogrenciler:
            raise HTTPException(status_code=404, detail="Grup öğrencisi bulunamadı")
        
        # CSV oluştur
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        headers = [
            "Ad Soyad", "Telefon", "E-posta", "Paket Tipi", "Ücret",
            "Ödeme Şekli", "Ödenen Tutar", "Kalan Tutar", "Durum", "Kayıt Tarihi"
        ]
        writer.writerow(headers)
        
        # Satırlar
        for ogrenci in grup_ogrenciler:
            row = [
                ogrenci.get("ad_soyad", ""),
                ogrenci.get("telefon", ""),
                ogrenci.get("eposta", ""),
                ogrenci.get("paket_tipi", ""),
                ogrenci.get("ucret", ""),
                ogrenci.get("odeme_sekli", ""),
                ogrenci.get("odenen_tutar", ""),
                ogrenci.get("kalan_tutar", ""),
                ogrenci.get("durum", ""),
                ogrenci.get("kayit_tarihi", "")
            ]
            writer.writerow(row)
        
        # CSV'yi bytes'a çevir
        output.seek(0)
        csv_content = output.getvalue().encode('utf-8-sig')  # BOM ekle (Excel için)
        
        filename = f"grup_ogrenciler_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        if grup_id:
            filename = f"grup_{grup_id}_ogrenciler_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export hatası: {str(e)}")

# ==================== GRUP DERS KAYDI ENDPOINTS ====================

@api_router.get("/grup-dersleri/ders-kayitlari", response_model=List[GrupDersKaydi])
async def get_grup_ders_kayitlari(grup_id: str):
    kayitlar = await db.grup_ders_kayitlari.find({"grup_id": grup_id}, {"_id": 0}).sort("tarih", -1).to_list(1000)
    return kayitlar

@api_router.post("/grup-dersleri/ders-kayitlari", response_model=GrupDersKaydi)
async def create_grup_ders_kaydi(kayit: GrupDersKaydiCreate):
    new_kayit = GrupDersKaydi(**kayit.dict())
    await db.grup_ders_kayitlari.insert_one(new_kayit.dict())
    
    # Grubun yapilan_ders_sayisi'ni artır
    await db.gruplar.update_one(
        {"id": kayit.grup_id},
        {"$inc": {"yapilan_ders_sayisi": 1}}
    )
    
    return new_kayit

@api_router.put("/grup-dersleri/ders-kayitlari/{kayit_id}", response_model=GrupDersKaydi)
async def update_grup_ders_kaydi(kayit_id: str, kayit: GrupDersKaydiCreate):
    result = await db.grup_ders_kayitlari.update_one(
        {"id": kayit_id},
        {"$set": kayit.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ders kaydı bulunamadı")
    
    updated_kayit = await db.grup_ders_kayitlari.find_one({"id": kayit_id}, {"_id": 0})
    return updated_kayit

@api_router.delete("/grup-dersleri/ders-kayitlari/{kayit_id}")
async def delete_grup_ders_kaydi(kayit_id: str):
    # Önce kaydı al (grup_id'yi bilmek için)
    kayit = await db.grup_ders_kayitlari.find_one({"id": kayit_id}, {"_id": 0})
    if not kayit:
        raise HTTPException(status_code=404, detail="Ders kaydı bulunamadı")
    
    # Kaydı sil
    await db.grup_ders_kayitlari.delete_one({"id": kayit_id})
    
    # Grubun yapilan_ders_sayisi'ni azalt
    await db.gruplar.update_one(
        {"id": kayit["grup_id"]},
        {"$inc": {"yapilan_ders_sayisi": -1}}
    )
    
    return {"message": "Ders kaydı silindi"}

# ==================== GRUP ÖDEMELERİ ENDPOINTS ====================

@api_router.post("/grup-dersleri/odemeler", response_model=GrupOdeme)
async def create_grup_odeme(odeme: GrupOdemeCreate):
    """Grup öğrencisi için ödeme ekle"""
    # Tarih yoksa şimdiyi kullan
    if not odeme.tarih:
        odeme.tarih = datetime.now(timezone.utc).isoformat()
    
    new_odeme = GrupOdeme(**odeme.dict())
    await db.grup_odemeler.insert_one(new_odeme.dict())
    
    # Öğrencinin odenen_tutar'ını güncelle
    await db.grup_ogrenciler.update_one(
        {"id": odeme.grup_ogrenci_id},
        {"$inc": {"odenen_tutar": odeme.tutar}}
    )
    
    # Kalan tutarı hesapla ve güncelle
    ogrenci = await db.grup_ogrenciler.find_one({"id": odeme.grup_ogrenci_id}, {"_id": 0})
    if ogrenci:
        kalan = ogrenci["ucret"] - (ogrenci.get("odenen_tutar", 0) + odeme.tutar)
        await db.grup_ogrenciler.update_one(
            {"id": odeme.grup_ogrenci_id},
            {"$set": {"kalan_tutar": kalan}}
        )
    
    return new_odeme

@api_router.get("/grup-dersleri/odemeler")
async def get_grup_odemeler(grup_id: Optional[str] = None, grup_ogrenci_id: Optional[str] = None):
    """Grup ödemelerini listele"""
    query = {}
    if grup_id:
        query["grup_id"] = grup_id
    if grup_ogrenci_id:
        query["grup_ogrenci_id"] = grup_ogrenci_id
    
    odemeler = await db.grup_odemeler.find(query, {"_id": 0}).sort("tarih", -1).to_list(10000)
    return odemeler

# Include the router in the main app
# ==================== İSTATİSTİK BASELINE ENDPOINTS ====================

@api_router.get("/istatistik-baseline")
async def get_all_baselines():
    """Tüm baseline değerlerini getir"""
    baselines = await db.istatistik_baseline.find({}, {"_id": 0}).to_list(1000)
    # Dict formatına çevir (frontend için kolaylık)
    baseline_dict = {b["istatistik_adi"]: b["manuel_deger"] for b in baselines}
    return baseline_dict

@api_router.get("/istatistik-baseline/{istatistik_adi}")
async def get_baseline(istatistik_adi: str):
    """Belirli bir istatistik için baseline değerini getir"""
    baseline = await db.istatistik_baseline.find_one(
        {"istatistik_adi": istatistik_adi}, 
        {"_id": 0}
    )
    if not baseline:
        return {"manuel_deger": None}
    return baseline

@api_router.post("/istatistik-baseline")
async def create_or_update_baseline(baseline: IstatistikBaselineCreate):
    """Yeni baseline oluştur veya mevcut olanı güncelle"""
    # Önce mevcut olanı kontrol et
    existing = await db.istatistik_baseline.find_one(
        {"istatistik_adi": baseline.istatistik_adi}
    )
    
    if existing:
        # Güncelle
        await db.istatistik_baseline.update_one(
            {"istatistik_adi": baseline.istatistik_adi},
            {"$set": {
                "manuel_deger": baseline.manuel_deger,
                "guncelleme_tarihi": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Baseline güncellendi", "istatistik_adi": baseline.istatistik_adi}
    else:
        # Yeni oluştur
        baseline_obj = IstatistikBaseline(
            istatistik_adi=baseline.istatistik_adi,
            manuel_deger=baseline.manuel_deger
        )
        await db.istatistik_baseline.insert_one(baseline_obj.model_dump())
        return {"message": "Baseline oluşturuldu", "istatistik_adi": baseline.istatistik_adi}

@api_router.delete("/istatistik-baseline/{istatistik_adi}")
async def delete_baseline(istatistik_adi: str):
    """Baseline değerini sil (otomatik hesaplamaya geri dön)"""
    result = await db.istatistik_baseline.delete_one({"istatistik_adi": istatistik_adi})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Baseline bulunamadı")
    return {"message": "Baseline silindi, otomatik hesaplama devrede"}

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

@app.on_event("startup")
async def startup_db():
    """SQLite veritabanını başlat"""
    await db.connect()
    logger.info(f"✅ SQLite database connected: {db.db_path}")

@app.on_event("shutdown")
async def shutdown_db():
    """SQLite bağlantısını kapat"""
    await db.close()
    logger.info("✅ SQLite database closed")