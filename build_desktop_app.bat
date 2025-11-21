@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 Öğrenci Takip Sistemi - Desktop Build
echo ========================================
echo.

:: Root dizin
set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: 1. Frontend Build
echo.
echo 📦 ADIM 1: Frontend Build
echo --------------------------------------
cd "%ROOT_DIR%frontend"

if not exist "node_modules" (
    echo 📥 Frontend dependencies yükleniyor...
    call yarn install
)

echo 🏗️ Frontend production build yapılıyor...
call yarn build

if not exist "build" (
    echo ❌ Frontend build başarısız!
    pause
    exit /b 1
)

echo ✅ Frontend build tamamlandı!

:: 2. Backend Build
echo.
echo ⚙️ ADIM 2: Backend Build (PyInstaller)
echo --------------------------------------
cd "%ROOT_DIR%backend"

:: PyInstaller kontrolü
where pyinstaller >nul 2>&1
if errorlevel 1 (
    echo 📥 PyInstaller yükleniyor...
    pip install pyinstaller
)

echo 🏗️ Backend executable oluşturuluyor...
pyinstaller server.spec --clean --noconfirm

if not exist "dist\backend.exe" (
    echo ❌ Backend build başarısız!
    pause
    exit /b 1
)

echo ✅ Backend build tamamlandı!

:: 3. Final Package
echo.
echo 📦 ADIM 3: Final Package Oluşturuluyor
echo --------------------------------------

set PACKAGE_DIR=%ROOT_DIR%OgrenciTakip
if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"

echo 📋 Backend kopyalanıyor...
copy "%ROOT_DIR%backend\dist\backend.exe" "%PACKAGE_DIR%\" >nul

echo 📋 Frontend build kopyalanıyor...
mkdir "%PACKAGE_DIR%\frontend_build"
xcopy /s /e /q "%ROOT_DIR%frontend\build\*" "%PACKAGE_DIR%\frontend_build\" >nul

echo 📂 Yardımcı klasörler oluşturuluyor...
mkdir "%PACKAGE_DIR%\backups"
mkdir "%PACKAGE_DIR%\logs"

echo 💾 Boş database oluşturuluyor...
type nul > "%PACKAGE_DIR%\database.db"

echo ✅ Final package hazır!

:: 4. README oluştur
echo 📝 README oluşturuluyor...
(
echo Öğrenci Takip Sistemi - Windows Desktop
echo =========================================
echo.
echo KULLANIM:
echo 1. backend.exe dosyasını çift tıklayarak başlatın
echo 2. Tarayıcınızda http://127.0.0.1:8000 adresini açın
echo.
echo VEYA
echo.
echo 1. OgrenciTakip.exe'yi çalıştırın ^(Electron versiyonu^)
echo 2. Uygulama otomatik olarak açılacaktır
echo.
echo YEDEKLEME:
echo - Otomatik yedekler: backups/ klasöründe
echo - Manuel yedek: Ayarlar ^> Veri Yönetimi
echo.
echo LOG DOSYALARI:
echo - Backend: logs/backend.log
echo - Electron: logs/electron.log
echo.
echo VERİTABANI:
echo - database.db dosyası tüm verilerinizi içerir
echo - Bu dosyayı yedekleyerek verilerinizi koruyun
) > "%PACKAGE_DIR%\README.txt"

echo.
echo ========================================
echo 🎉 BUILD TAMAMLANDI!
echo ========================================
echo.
echo 📁 Package Klasörü: %PACKAGE_DIR%
echo.
echo İçindekiler:
echo   - backend.exe          : FastAPI backend server
echo   - database.db          : SQLite veritabanı
echo   - frontend_build/      : React frontend
echo   - backups/             : Otomatik yedekler
echo   - logs/                : Log dosyaları
echo   - README.txt           : Kullanım talimatları
echo.
echo 🚀 Kullanım:
echo 1. OgrenciTakip klasörünü istediğiniz yere kopyalayın
echo 2. backend.exe'yi çalıştırın
echo 3. Tarayıcıda http://127.0.0.1:8000 açın
echo.
echo ✨ Başarılar!
echo.
pause
