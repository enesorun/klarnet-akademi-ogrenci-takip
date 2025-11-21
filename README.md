# Öğrenci Takip Sistemi

FastAPI + React + SQLite tabanlı öğrenci takip ve ödeme yönetim sistemi.

## Proje Yapısı

```
/
├── backend/                 # FastAPI backend
│   ├── server.py           # Ana backend dosyası (entry point)
│   ├── database.py         # SQLite database yönetimi
│   ├── server.spec         # PyInstaller build config
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── src/               # React kaynak kodları
│   ├── build/             # Production build (hazır)
│   └── package.json       # Node dependencies
│
├── scripts/               # Yardımcı scriptler
│   ├── start_app.bat     # Python ile başlatma
│   ├── start_app_hidden.vbs  # Gizli başlatma
│   └── build_desktop_app.bat # EXE build scripti
│
├── docs/                  # Dokümantasyon
│   ├── WINDOWS_BUILD_KILAVUZU.md
│   └── ...
│
└── archive/               # Eski/kullanılmayan dosyalar
```

## Hızlı Başlangıç

### Python ile Çalıştırma

1. Backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Backend'i başlat:
```bash
python server.py
```

3. Tarayıcıda aç:
```
http://127.0.0.1:8000
```

### Windows EXE Build

Detaylı kılavuz: `docs/WINDOWS_BUILD_KILAVUZU.md`

Kısa adımlar:
```cmd
cd backend
pip install pyinstaller
pyinstaller server.spec --clean --noconfirm
```

Sonuç: `backend/dist/backend.exe`

## Gereksinimler

- Python 3.11+
- Node.js 18+ (sadece frontend değişikliği için)

## Özellikler

- Öğrenci kaydı ve takibi
- Ödeme yönetimi
- Ders planlaması
- Grup dersleri
- Raporlama ve istatistikler
- Manuel ve otomatik yedekleme
- Offline çalışma (SQLite)

## Lisans

Tüm hakları saklıdır.
