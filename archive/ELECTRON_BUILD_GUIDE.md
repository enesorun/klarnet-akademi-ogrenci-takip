# 🚀 Electron Build Rehberi

## Öğrenci Takip Sistemi - Desktop App Build

Bu rehber, uygulamanızı tek bir `.exe` Windows masaüstü uygulamasına dönüştürme adımlarını içerir.

---

## 📋 Gereksinimler

### Yazılımlar
- **Node.js** 18+ (https://nodejs.org/)
- **Python** 3.11+ (https://www.python.org/)
- **Yarn** (npm install -g yarn)
- **PyInstaller** (pip install pyinstaller)

### İşletim Sistemi
- **Windows 10/11** (build için)
- Linux'ta build etmek isterseniz wine kurulumu gerekir

---

## 🛠️ Adım Adım Build

### Yöntem 1: Otomatik Build (Önerilen)

```bash
# Tek komutla her şeyi build et
cd /app/electron
./build-all.sh
```

Bu script:
1. Frontend'i build eder (React)
2. Backend'i exe'ye dönüştürür (PyInstaller)
3. Electron ile Windows installer oluşturur

**Çıktı**: `/app/electron/dist/Öğrenci Takip Sistemi Setup 1.0.0.exe`

---

### Yöntem 2: Manuel Build

#### 1. Frontend Build
```bash
cd /app/frontend
yarn build
cp -r build /app/electron/frontend
```

#### 2. Backend Build (PyInstaller)
```bash
cd /app/backend
pip install pyinstaller
pyinstaller server.spec --clean --noconfirm

# Exe'yi kopyala
mkdir -p /app/electron/backend
cp dist/server /app/electron/backend/
cp database.py /app/electron/backend/
cp .env /app/electron/backend/
```

#### 3. Electron Build
```bash
cd /app/electron
yarn install
yarn build-win
```

---

## 📦 Çıktı Dosyaları

Build tamamlandığında `/app/electron/dist/` klasöründe:

```
dist/
├── Öğrenci Takip Sistemi Setup 1.0.0.exe  ← Installer (kullanıcıya dağıtılacak)
└── win-unpacked/                          ← Portable versiyon
    ├── Öğrenci Takip Sistemi.exe
    ├── resources/
    │   ├── backend/
    │   ├── frontend/
    │   └── data/
    └── ...
```

---

## 🧪 Test

### Development Modunda Test

```bash
# Terminal 1: Backend
cd /app/backend
python server.py

# Terminal 2: Frontend
cd /app/frontend
yarn start

# Terminal 3: Electron
cd /app/electron
yarn start
```

### Production Build Test

```bash
# Build sonrası installer'ı çalıştır
cd /app/electron/dist
./Öğrenci\ Takip\ Sistemi\ Setup\ 1.0.0.exe
```

---

## 🔧 Sorun Giderme

### PyInstaller Hataları

**Sorun**: `ModuleNotFoundError`
```bash
# Eksik modülü hidden imports'a ekle
# /app/backend/server.spec dosyasını düzenle
hiddenimports=[
    'fastapi',
    'eksik_modul',  # Ekle
    ...
]
```

**Sorun**: "Server.exe başlamıyor"
```bash
# Console mode ile test et
# server.spec'te: console=True yap
```

### Electron Build Hataları

**Sorun**: "electron-builder command not found"
```bash
cd /app/electron
yarn add electron-builder --dev
```

**Sorun**: "Icon hatası"
```bash
# Icon dosyası oluştur veya kaldır
# package.json'dan icon satırını sil
```

### Runtime Hataları

**Sorun**: "Port 8001 zaten kullanımda"
```bash
# main.js'te BACKEND_PORT değiştir
const BACKEND_PORT = 8002;  # Farklı port kullan
```

**Sorun**: "Database yazma hatası"
```bash
# Uygulamayı yönetici olarak çalıştır
# veya %APPDATA% iznlerini kontrol et
```

---

## 📝 Özelleştirme

### Uygulama Bilgileri

`/app/electron/package.json`:
```json
{
  "name": "ogrenci-takip-sistemi",
  "version": "1.0.0",
  "description": "...",
  "build": {
    "appId": "com.ogrencitakip.app",
    "productName": "Öğrenci Takip Sistemi"
  }
}
```

### Icon Değiştirme

1. `256x256` PNG/ICO dosyası hazırla
2. `/app/electron/resources/icon.ico` olarak kaydet
3. `package.json`'da icon yolunu ayarla

### Veritabanı Konumu

Default: `%APPDATA%/ogrenci-takip-sistemi/data/ogrenciler.db`

Değiştirmek için `/app/electron/main.js`:
```javascript
const userDataPath = path.join(app.getPath('userData'), 'data');
// Değiştir:
const userDataPath = 'C:/MyCustomPath/data';
```

---

## 📤 Dağıtım

### Installer Dağıtımı

1. `/app/electron/dist/Öğrenci Takip Sistemi Setup 1.0.0.exe` dosyasını paylaş
2. Kullanıcılar çift tıklayarak kurabilir
3. Otomatik başlangıç menüsü kısayolu oluşturulur

### Portable Versiyon

1. `/app/electron/dist/win-unpacked/` klasörünü zipla
2. Kullanıcılar açıp `Öğrenci Takip Sistemi.exe` çalıştırabilir
3. Kurulum gerektirmez

---

## ✅ Kontrol Listesi

Build öncesi:

- [ ] Tüm testler başarılı
- [ ] Frontend production build çalışıyor
- [ ] Backend SQLite'a tam geçiş yapıldı
- [ ] .env dosyası hassas bilgi içermiyor
- [ ] Icon dosyası hazır (opsiyonel)
- [ ] package.json bilgileri doğru

Build sonrası:

- [ ] Installer çalışıyor
- [ ] Uygulama başlıyor
- [ ] Backend otomatik başlıyor
- [ ] Frontend yükleniyor
- [ ] Veritabanı oluşturuluyor
- [ ] CRUD işlemleri çalışıyor
- [ ] Raporlar doğru hesaplanıyor

---

## 🎉 Tamamlandı!

Artık uygulamanız tamamen offline çalışan bir Windows masaüstü uygulaması!

### Sonraki Adımlar

- 📱 macOS versiyonu için: `yarn build-mac`
- 🐧 Linux versiyonu için: `yarn build-linux`
- 🔄 Otomatik güncelleyici ekle
- 🔐 Veritabanı şifreleme ekle
- ☁️ İsteğe bağlı cloud backup ekle

---

**Not**: Container içinde GUI olmadığı için build Linux üzerinde yapılacaktır. Windows'ta installer test edilmelidir.
