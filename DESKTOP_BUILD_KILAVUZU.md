# Öğrenci Takip Sistemi - Windows Desktop App Build Kılavuzu

Bu kılavuz, web uygulamasını Windows masaüstü uygulamasına dönüştürme sürecini adım adım açıklar.

## 📋 Gereksinimler

### Yazılımlar
- **Python 3.11+** (backend için)
- **Node.js 18+** ve **Yarn** (frontend için)
- **PyInstaller** (backend.exe oluşturmak için)
- **Electron** ve **electron-builder** (OgrenciTakip.exe için)

### Kurulum Kontrolleri
```bash
# Python versiyonu
python --version  # 3.11 veya üstü

# Node.js ve Yarn
node --version    # 18 veya üstü
yarn --version

# PyInstaller
pip install pyinstaller
```

## 🚀 Hızlı Build (Otomatik)

### Windows:
```cmd
build_desktop_app.bat
```

### Linux/Mac:
```bash
chmod +x build_desktop_app.sh
./build_desktop_app.sh
```

Bu script tüm build işlemlerini otomatik yapar ve `OgrenciTakip/` klasörünü oluşturur.

## 📦 Manuel Build (Adım Adım)

### 1. Frontend Build

```bash
cd frontend
yarn install
yarn build
```

Bu komut `frontend/build/` klasörünü oluşturur.

### 2. Backend Build (PyInstaller)

```bash
cd backend

# Virtual environment aktif olmalı
source ../.venv/bin/activate  # Linux/Mac
# VEYA
..\\.venv\\Scripts\\activate   # Windows

# Build
pyinstaller server.spec --clean --noconfirm
```

Bu komut `backend/dist/backend.exe` dosyasını oluşturur.

### 3. Package Oluşturma

```bash
# Root dizinde
mkdir OgrenciTakip
mkdir OgrenciTakip/frontend_build
mkdir OgrenciTakip/backups
mkdir OgrenciTakip/logs

# Dosyaları kopyala
cp backend/dist/backend.exe OgrenciTakip/
cp -r frontend/build/* OgrenciTakip/frontend_build/

# Boş database
touch OgrenciTakip/database.db
```

### 4. Electron Build (Opsiyonel - Installer İçin)

```bash
cd electron

# Dependencies
yarn install

# Backend ve frontend'i kopyala
cp ../backend/dist/backend.exe ./
cp -r ../frontend/build ./frontend_build

# Build
yarn build-win
```

Bu komut `electron/dist/` klasöründe installer oluşturur:
- `OgrenciTakip-1.0.0-setup.exe` (NSIS installer)
- `OgrenciTakip-1.0.0-portable.exe` (Portable)

## 📁 Final Klasör Yapısı

Build tamamlandığında `OgrenciTakip/` klasörü şu yapıya sahip olacak:

```
OgrenciTakip/
├── backend.exe              # FastAPI backend server
├── database.db              # SQLite veritabanı (boş)
├── frontend_build/          # React production build
│   ├── static/
│   ├── index.html
│   └── ...
├── backups/                 # Otomatik yedekler (boş)
├── logs/                    # Log dosyaları (boş)
└── README.txt               # Kullanım talimatları
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Basit Portable (Sadece Backend + Browser)

**Kullanıcı Ne Yapar:**
1. `OgrenciTakip/` klasörünü istediği yere kopyalar
2. `backend.exe`'yi çift tıklar
3. Tarayıcısında `http://127.0.0.1:8000` açar

**Avantajlar:**
- En basit yöntem
- Kullanıcı kendi tarayıcısını kullanır
- Küçük dosya boyutu

**Dezavantajlar:**
- Kullanıcı manuel olarak URL yazmalı
- Backend console penceresi görünür

### Senaryo 2: Electron App (OgrenciTakip.exe)

**Kullanıcı Ne Yapar:**
1. Installer'ı çalıştırır (`OgrenciTakip-1.0.0-setup.exe`)
2. Kurulum tamamlandığında masaüstünden `Öğrenci Takip Sistemi`'ni açar
3. Uygulama otomatik olarak başlar

**Avantajlar:**
- Profesyonel görünüm
- Otomatik backend başlatma
- Yerleşik yedekleme/geri yükleme dialogs
- Console penceresi yok
- Masaüstü shortcut

**Dezavantajlar:**
- Daha büyük dosya boyutu (~150-200 MB)

## 🔧 Önemli Notlar

### Database Yolu

Backend `database.db` dosyasını şu sırayla arar:

1. `DB_PATH` environment variable
2. Exe ile aynı klasör (production)
3. `/app/data/` klasörü (development)

```python
# database.py içinde
if getattr(sys, 'frozen', False):
    # PyInstaller ile paketlenmiş
    BASE_DIR = Path(sys.executable).parent
else:
    # Normal development
    BASE_DIR = Path(__file__).parent.parent

DB_PATH = BASE_DIR / "database.db"
```

### Port Ayarları

Backend varsayılan olarak `127.0.0.1:8000` kullanır:

```python
# server.py içinde
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
```

### Frontend API URL

Production build'de frontend backend'i `http://127.0.0.1:8000` olarak görür:

```
# frontend/.env.production
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

### Static Files

Backend frontend build'ini otomatik serve eder:

```python
# server.py içinde
frontend_build_path = Path(sys.executable).parent / "frontend_build"
app.mount("/static", StaticFiles(directory=str(frontend_build_path / "static")))
```

## 🧪 Test Senaryoları

Build tamamlandıktan sonra şu testleri yapın:

### Test 1: İlk Çalıştırma
```bash
# Yeni bir klasöre kopyala
cp -r OgrenciTakip /tmp/test_app
cd /tmp/test_app

# Backend'i başlat
./backend.exe

# Tarayıcıda aç
# http://127.0.0.1:8000

# Kontroller:
✓ Database otomatik oluştu mu?
✓ Ana sayfa açıldı mı?
✓ Öğrenci eklenebiliyor mu?
```

### Test 2: Veri Kalıcılığı
```bash
# Öğrenci ekle, ödeme ekle
# Backend'i kapat (Ctrl+C)
# Tekrar başlat
# Kontrol: Veriler korundu mu?
```

### Test 3: Manuel Yedekleme
```bash
# Ayarlar > Veri Yönetimi
# "Manuel Yedek Al" (Electron)
# Yedek dosyası oluştu mu?
# Dosya boyutu mantıklı mı?
```

### Test 4: Geri Yükleme
```bash
# Birkaç öğrenci ekle
# Manuel yedek al
# Tüm öğrencileri sil
# "Yedekten Geri Yükle"
# Kontrol: Öğrenciler geri geldi mi?
```

### Test 5: Otomatik Yedek
```bash
# Uygulamayı aç
# Birkaç işlem yap
# Uygulamayı kapat
# Kontrol: backups/ klasöründe auto_yedek_*.db var mı?
```

### Test 6: Backend Crash Recovery
```bash
# Backend'i Task Manager'dan zorla kapat
# Electron uygulaması hata gösteriyor mu?
# Tekrar başlatınca düzeliyor mu?
```

## 🐛 Sorun Giderme

### Backend Başlamıyor

**Semptom:** Backend.exe çalışıyor ama bağlantı yok

**Çözümler:**
1. Port 8000 kullanımda mı kontrol edin:
   ```cmd
   netstat -ano | findstr :8000
   ```
2. Firewall backend.exe'yi engelliyor mu?
3. `logs/backend.log` dosyasını kontrol edin

### Frontend Yüklenmiyor

**Semptom:** Tarayıcıda "Site bulunamadı"

**Çözümler:**
1. Backend çalışıyor mu?
2. `frontend_build/` klasörü mevcut mu?
3. `frontend_build/index.html` var mı?

### Database Bulunamadı

**Semptom:** "Database path not found" hatası

**Çözümler:**
1. `database.db` backend.exe ile aynı klasörde mi?
2. Yazma izinleri var mı?
3. DB_PATH environment variable set edilmiş mi?

### Yedekleme Çalışmıyor

**Semptom:** "Yedek oluşturulamadı" hatası

**Çözümler:**
1. `backups/` klasörü mevcut mu?
2. Disk alanı yeterli mi?
3. Yazma izinleri var mı?

## 📝 Geliştirici Notları

### PyInstaller Spec Dosyası

`backend/server.spec` dosyası backend.exe build ayarlarını içerir:

- `hiddenimports`: FastAPI, uvicorn modülleri
- `console`: False (production'da console gizle)
- `name`: 'backend'

### Electron Main Process

`electron/main.js` şunları yapar:

1. `backend.exe`'yi spawn eder (cwd: OgrenciTakip/)
2. Health check: `http://127.0.0.1:8000/api/students`
3. BrowserWindow açar: `http://127.0.0.1:8000`
4. Kapanışta backend'i kill eder
5. Otomatik yedek alır

### Yedekleme IPC

`electron/preload.js` ve `main.js` arasında IPC:

```javascript
// Preload
window.electronAPI = {
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: () => ipcRenderer.invoke('restore-database')
}

// Main
ipcMain.handle('backup-database', async () => {
  // dialog.showSaveDialog
  // fs.copyFileSync(DATABASE_PATH, selectedPath)
})
```

## 🔄 Güncelleme Süreci

Uygulama güncellemek için:

1. Kod değişikliklerini yap
2. Build script'ini çalıştır
3. Yeni `OgrenciTakip/` klasörünü dağıt
4. Kullanıcılar eski `database.db`'yi yeni klasöre kopyalasın

**Önemli:** database.db dosyası korunmalı!

## 📦 Dağıtım

### Portable Versiyonu

```
OgrenciTakip-v1.0.zip
├── OgrenciTakip/
│   ├── backend.exe
│   ├── frontend_build/
│   ├── database.db (boş)
│   ├── backups/ (boş)
│   ├── logs/ (boş)
│   └── README.txt
```

**Boyut:** ~50-80 MB

### Installer (Electron)

```
OgrenciTakip-1.0.0-setup.exe
```

**Boyut:** ~150-200 MB

**Kurulum Konumu:** `C:\Program Files\OgrenciTakip\`

**Data Konumu:** `%APPDATA%\OgrenciTakip\`

## ✅ Kontrol Listesi

Build öncesi:

- [ ] Python 3.11+ kurulu
- [ ] Node.js 18+ ve Yarn kurulu
- [ ] PyInstaller yüklü
- [ ] Virtual environment aktif
- [ ] Tüm dependencies yüklü

Build sonrası:

- [ ] backend.exe oluştu
- [ ] frontend/build/ var
- [ ] OgrenciTakip/ klasörü tam
- [ ] database.db (boş) var
- [ ] README.txt oluştu

Test:

- [ ] Backend başlıyor
- [ ] Frontend yükleniyor
- [ ] Öğrenci eklenebiliyor
- [ ] Veriler kalıcı
- [ ] Manuel yedek çalışıyor
- [ ] Geri yükleme çalışıyor
- [ ] Otomatik yedek çalışıyor

## 🎉 Son

Build başarılı olduysa:

```
✅ Backend: backend.exe (FastAPI server)
✅ Frontend: frontend_build/ (React app)
✅ Database: database.db (SQLite)
✅ Yedekleme: Hem manuel hem otomatik
✅ Portable: Tek klasör, kopyala-yapıştır
✅ Offline: İnternet gerekmez
```

**Tebrikler! Windows desktop uygulamanız hazır! 🚀**
