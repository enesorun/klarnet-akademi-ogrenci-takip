import aiosqlite
import os
from pathlib import Path
from datetime import datetime, timezone
import json
import uuid

# Göreli yol kullan - uygulama nerede çalışırsa çalışsın
BASE_DIR = Path(__file__).parent.parent  # /app dizini
DB_PATH = BASE_DIR / "data" / "ogrenciler.db"

# Data klasörünü oluştur
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

class Database:
    def __init__(self):
        self.db_path = str(DB_PATH)
        self._db = None
    
    async def connect(self):
        """Veritabanı bağlantısını oluştur"""
        self._db = await aiosqlite.connect(self.db_path)
        self._db.row_factory = aiosqlite.Row
        await self.create_tables()
    
    async def close(self):
        """Veritabanı bağlantısını kapat"""
        if self._db:
            await self._db.close()
    
    async def create_tables(self):
        """Tüm tabloları oluştur"""
        
        # Students (Öğrenciler)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                ad_soyad TEXT NOT NULL,
                konum TEXT,
                seviye TEXT,
                email TEXT,
                yas INTEGER,
                meslek TEXT,
                ilk_ders_tarihi TEXT,
                referans TEXT,
                genel_durum TEXT DEFAULT 'aktif',
                notlar TEXT,
                ozel_alanlar TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Tarifeler (Tariffs)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS tarifeler (
                id TEXT PRIMARY KEY,
                ogrenci_id TEXT NOT NULL,
                baslangic_tarihi TEXT NOT NULL,
                bitis_tarihi TEXT,
                ucret REAL NOT NULL,
                aylik_ders_sayisi INTEGER NOT NULL,
                not_ TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ogrenci_id) REFERENCES students(id) ON DELETE CASCADE
            )
        """)
        
        # Ödemeler (Payments)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS odemeler (
                id TEXT PRIMARY KEY,
                ogrenci_id TEXT NOT NULL,
                tarife_id TEXT,
                tutar REAL NOT NULL,
                tarih TEXT NOT NULL,
                not_ TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ogrenci_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (tarife_id) REFERENCES tarifeler(id) ON DELETE CASCADE
            )
        """)
        
        # Dersler (Lessons)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS dersler (
                id TEXT PRIMARY KEY,
                ogrenci_id TEXT NOT NULL,
                tarih TEXT NOT NULL,
                sure INTEGER NOT NULL,
                not_ TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ogrenci_id) REFERENCES students(id) ON DELETE CASCADE
            )
        """)
        
        # Grup Sezonlar
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS grup_sezonlar (
                id TEXT PRIMARY KEY,
                sezon_adi TEXT NOT NULL,
                baslangic_tarihi TEXT,
                bitis_tarihi TEXT,
                durum TEXT DEFAULT 'aktif',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Gruplar
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS gruplar (
                id TEXT PRIMARY KEY,
                sezon_id TEXT NOT NULL,
                grup_adi TEXT NOT NULL,
                durum TEXT DEFAULT 'aktif',
                ozel_alanlar TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sezon_id) REFERENCES grup_sezonlar(id) ON DELETE CASCADE
            )
        """)
        
        # Grup Öğrencileri
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS grup_ogrenciler (
                id TEXT PRIMARY KEY,
                sezon_id TEXT NOT NULL,
                grup_id TEXT NOT NULL,
                ad_soyad TEXT NOT NULL,
                etap TEXT,
                ucret REAL NOT NULL,
                ilk_odeme_tutari REAL DEFAULT 0,
                ilk_odeme_tarihi TEXT,
                durum TEXT DEFAULT 'aktif',
                ozel_alanlar TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sezon_id) REFERENCES grup_sezonlar(id) ON DELETE CASCADE,
                FOREIGN KEY (grup_id) REFERENCES gruplar(id) ON DELETE CASCADE
            )
        """)
        
        # Grup Ders Kayıtları
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS grup_ders_kayitlari (
                id TEXT PRIMARY KEY,
                grup_id TEXT NOT NULL,
                sezon_id TEXT NOT NULL,
                ders_tarihi TEXT NOT NULL,
                not_ TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (grup_id) REFERENCES gruplar(id) ON DELETE CASCADE,
                FOREIGN KEY (sezon_id) REFERENCES grup_sezonlar(id) ON DELETE CASCADE
            )
        """)
        
        # Grup Öğrenci Ödemeleri
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS grup_ogrenci_odemeler (
                id TEXT PRIMARY KEY,
                ogrenci_id TEXT NOT NULL,
                tutar REAL NOT NULL,
                odeme_tarihi TEXT NOT NULL,
                not_ TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ogrenci_id) REFERENCES grup_ogrenciler(id) ON DELETE CASCADE
            )
        """)
        
        # Ayarlar (Settings)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS ayarlar (
                id TEXT PRIMARY KEY,
                kategori TEXT NOT NULL,
                deger TEXT NOT NULL,
                sira INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Özel Alan Konfigürasyonları
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS ozel_alanlar_config (
                id TEXT PRIMARY KEY,
                model_tipi TEXT NOT NULL,
                alan_adi TEXT NOT NULL,
                alan_tipi TEXT NOT NULL,
                aktif INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # İstatistik Baseline (Yeni - Manuel düzenleme için)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS istatistik_baseline (
                id TEXT PRIMARY KEY,
                istatistik_adi TEXT UNIQUE NOT NULL,
                manuel_deger REAL NOT NULL,
                guncelleme_tarihi TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await self._db.commit()
    
    async def execute(self, query, params=()):
        """SQL sorgusu çalıştır ve commit et"""
        cursor = await self._db.execute(query, params)
        await self._db.commit()
        return cursor
    
    async def fetch_one(self, query, params=()):
        """Tek satır getir"""
        cursor = await self._db.execute(query, params)
        row = await cursor.fetchone()
        return dict(row) if row else None
    
    async def fetch_all(self, query, params=()):
        """Tüm satırları getir"""
        cursor = await self._db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

# Global database instance
db = Database()
