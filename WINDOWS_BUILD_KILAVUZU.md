# Windows'ta backend.exe Oluşturma Kılavuzu

## ⚠️ Önemli Not

Linux ortamında oluşturulan PyInstaller binary'si Windows'ta ÇALIŞMAZ!
Windows için build almak için Windows bilgisayarda PyInstaller çalıştırmanız gerekiyor.

---

## 🔧 Gereksinimler

- Windows 10/11 64-bit
- Python 3.11 (veya üstü)
- Git Bash veya PowerShell
- İnternet bağlantısı (ilk kurulum için)

---

## 📋 Adım Adım Build Süreci

### 1. Python Kurulumu

Eğer Python yüklü değilse:

1. https://www.python.org/downloads/ adresinden Python 3.11 indirin
2. Kurulum sırasında **"Add Python to PATH"** seçeneğini işaretleyin
3. Kurulumu tamamlayın

Kontrol:
```cmd
python --version
```
Çıktı: `Python 3.11.x` olmalı

### 2. Proje Dosyalarını Kopyalayın

```
C:\OgrenciTakip\
├── backend/
│   ├── server.py
│   ├── database.py
│   ├── server.spec
│   └── requirements.txt
└── frontend/
    └── build/
```

### 3. Virtual Environment Oluşturun

**PowerShell:**
```powershell
cd C:\OgrenciTakip\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**CMD:**
```cmd
cd C:\OgrenciTakip\backend
python -m venv venv
venv\Scripts\activate.bat
```

Başarılı olduğunda prompt başında `(venv)` görmelisiniz.

### 4. Dependencies Yükleyin

```cmd
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller
```

**Beklenen süre:** 2-5 dakika

### 5. PyInstaller Build

```cmd
pyinstaller server.spec --clean --noconfirm
```

**Beklenen süre:** 1-3 dakika

### 6. Sonucu Kontrol Edin

```cmd
dir dist
```

Göreceksiniz:
```
backend.exe    (yaklaşık 25-30 MB)
```

### 7. Test Edin

```cmd
cd dist
backend.exe
```

**Göreceğiniz loglar:**
```
📂 Database path: C:\OgrenciTakip\backend\dist\database.db
📂 Frontend build path: C:\OgrenciTakip\backend\dist\frontend_build
🚀 Backend server başlatılıyor...
📍 URL: http://127.0.0.1:8000
Uvicorn running on http://127.0.0.1:8000
```

Tarayıcıda `http://127.0.0.1:8000` açın - çalışıyorsa başarılı!

### 8. Final Package Oluşturun

```cmd
cd C:\OgrenciTakip
mkdir Final
mkdir Final\OgrenciTakip
mkdir Final\OgrenciTakip\backups
mkdir Final\OgrenciTakip\logs

copy backend\dist\backend.exe Final\OgrenciTakip\
xcopy /E /I frontend\build Final\OgrenciTakip\frontend_build
type nul > Final\OgrenciTakip\database.db
```

Sonuç:
```
Final\OgrenciTakip\
├── backend.exe          (25-30 MB)
├── database.db          (boş)
├── frontend_build\
├── backups\
└── logs\
```

---

## 🐛 Sorun Giderme

### Hata: "Python bulunamadı"

**Çözüm:**
1. Python'u PATH'e ekleyin
2. Veya tam path kullanın:
   ```cmd
   C:\Users\[Kullanici]\AppData\Local\Programs\Python\Python311\python.exe
   ```

### Hata: "pip install başarısız"

**Çözüm:**
```cmd
python -m pip install --upgrade pip
pip install --upgrade setuptools wheel
```

### Hata: "PyInstaller modülü bulunamadı"

**Çözüm:**
```cmd
pip uninstall pyinstaller
pip install pyinstaller
```

### Hata: "build failed"

**Çözüm:**
1. `build` ve `dist` klasörlerini silin
2. Tekrar deneyin:
   ```cmd
   rmdir /s /q build
   rmdir /s /q dist
   pyinstaller server.spec --clean --noconfirm
   ```

### Uyarı: "UPX is not available"

**Sorun değil!** UPX opsiyonel bir sıkıştırma tool'u. 
Build yine de başarılı olur, sadece exe biraz daha büyük olur.

---

## ✅ Build Başarılı Oldu mu?

Şu kontrolleri yapın:

1. **Dosya boyutu:**
   ```cmd
   dir dist\backend.exe
   ```
   Boyut: 20-35 MB arası olmalı

2. **Çalıştırma:**
   ```cmd
   dist\backend.exe
   ```
   Console açılmalı, "Uvicorn running" mesajı görmelisiniz

3. **API testi:**
   Tarayıcıda: `http://127.0.0.1:8000/api/students`
   Sonuç: `[]` (boş array) görmelisiniz

4. **Frontend testi:**
   Tarayıcıda: `http://127.0.0.1:8000`
   Sonuç: Öğrenci Takip ana sayfası görmelisiniz

---

## 📦 Alternatif: Python ile Direkt Çalıştırma

Eğer PyInstaller build almak istemiyorsanız:

### Çözüm 1: Python ile Çalıştırma

**start_backend.bat** dosyası oluşturun:
```batch
@echo off
cd /d "%~dp0backend"
python server.py
pause
```

Kullanım:
1. `start_backend.bat` çift tıklayın
2. Tarayıcıda `http://127.0.0.1:8000` açın

### Çözüm 2: Gizli Console (Pythonw)

**start_backend_silent.vbs** dosyası oluşturun:
```vbscript
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\OgrenciTakip\backend && python server.py", 0, False
Set WshShell = Nothing
```

Kullanım:
1. `start_backend_silent.vbs` çift tıklayın
2. Console penceresi açılmaz, arka planda çalışır
3. Durdurmak için Task Manager'dan `python.exe` sonlandırın

### Çözüm 3: Windows Servis (NSSM)

1. NSSM indir: https://nssm.cc/download
2. Kurulum:
   ```cmd
   nssm install OgrenciTakip "C:\Users\...\python.exe" "C:\OgrenciTakip\backend\server.py"
   nssm start OgrenciTakip
   ```
3. Otomatik başlatma:
   ```cmd
   nssm set OgrenciTakip Start SERVICE_AUTO_START
   ```

---

## 💡 Tavsiyeler

### Geliştirme Ortamı
- Python + batch script kullanın (hızlı test için)
- PyInstaller sadece final delivery için

### Production Ortamı
- PyInstaller exe kullanın (tek dosya)
- Veya Windows servis olarak çalıştırın

### Dağıtım
- PyInstaller exe + frontend_build klasörü
- ZIP ile paketleyin
- README.txt ekleyin

---

## 🎯 Özet

Windows'ta çalışan `backend.exe` için:

1. **Windows bilgisayarda** PyInstaller çalıştırın
2. `server.spec` dosyası hazır
3. Build komutu: `pyinstaller server.spec --clean --noconfirm`
4. Sonuç: `dist/backend.exe`

**Alternatif:**
- Python direkt çalıştırma (batch script)
- Windows servis (NSSM)

Her iki yöntem de çalışır!
