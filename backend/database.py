import aiosqlite
import os
from pathlib import Path
from datetime import datetime, timezone
import json
import uuid

# DB_PATH environment variable'dan al, yoksa default
if os.environ.get('DB_PATH'):
    DB_PATH = Path(os.environ.get('DB_PATH'))
else:
    # Göreli yol kullan - uygulama nerede çalışırsa çalışsın
    BASE_DIR = Path(__file__).parent.parent  # /app dizini
    DB_PATH = BASE_DIR / "data" / "ogrenciler.db"

# Data klasörünü oluştur
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

print(f"📂 Database path: {DB_PATH}")

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
                ders_sayisi INTEGER DEFAULT 4,
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
                sure INTEGER DEFAULT 50,
                islenen_konu TEXT,
                odev_not TEXT,
                onemli INTEGER DEFAULT 0,
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
                kur_etap TEXT,
                gun_saat TEXT,
                max_kapasite INTEGER,
                toplam_ders_sayisi INTEGER DEFAULT 16,
                yapilan_ders_sayisi INTEGER DEFAULT 0,
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
                telefon TEXT,
                eposta TEXT,
                paket_tipi TEXT,
                ucret REAL NOT NULL,
                odeme_sekli TEXT,
                odenen_tutar REAL DEFAULT 0,
                kalan_tutar REAL DEFAULT 0,
                ilk_odeme_tutari REAL DEFAULT 0,
                ilk_odeme_tarihi TEXT,
                kayit_tarihi TEXT,
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
                varsayilan_ucret REAL,
                sira INTEGER DEFAULT 0,
                aktif INTEGER DEFAULT 1,
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
                sira INTEGER DEFAULT 0,
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
    
    # ==================== HELPER METHODS ====================
    
    async def insert(self, table, data):
        """Insert a record and commit"""
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        await self.execute(query, tuple(data.values()))
    
    async def update(self, table, data, where_field, where_value):
        """Update a record and commit"""
        set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE {where_field} = ?"
        params = tuple(data.values()) + (where_value,)
        await self.execute(query, params)
    
    async def delete(self, table, where_field, where_value):
        """Delete a record and commit"""
        query = f"DELETE FROM {table} WHERE {where_field} = ?"
        await self.execute(query, (where_value,))
    
    async def find_all(self, table, where=None, order_by=None):
        """Find all records matching criteria"""
        query = f"SELECT * FROM {table}"
        params = ()
        
        if where:
            where_clause = ' AND '.join([f"{k} = ?" for k in where.keys()])
            query += f" WHERE {where_clause}"
            params = tuple(where.values())
        
        if order_by:
            query += f" ORDER BY {order_by}"
        
        return await self.fetch_all(query, params)
    
    async def find_one(self, table, where):
        """Find one record"""
        where_clause = ' AND '.join([f"{k} = ?" for k in where.keys()])
        query = f"SELECT * FROM {table} WHERE {where_clause} LIMIT 1"
        return await self.fetch_one(query, tuple(where.values()))
    
    async def count(self, table, where=None):
        """Count records"""
        query = f"SELECT COUNT(*) as count FROM {table}"
        params = ()
        
        if where:
            where_clause = ' AND '.join([f"{k} = ?" for k in where.keys()])
            query += f" WHERE {where_clause}"
            params = tuple(where.values())
        
        result = await self.fetch_one(query, params)
        return result['count'] if result else 0

# Global database instance
db = Database()
