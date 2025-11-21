@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo Ogrenci Takip Sistemi - Desktop Build
echo ==========================================
echo.

set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

set "FRONTEND_DIR=%BASE_DIR%frontend"
set "BACKEND_DIR=%BASE_DIR%backend"
set "DIST_DIR=%BASE_DIR%OgrenciTakip"

echo Base Directory: %BASE_DIR%
echo.

REM Eski dist klasorunu temizle
if exist "%DIST_DIR%" (
    echo Eski OgrenciTakip klasoru temizleniyor...
    rmdir /s /q "%DIST_DIR%"
)

echo Yeni klasor olusturuluyor...
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\backups"
mkdir "%DIST_DIR%\logs"
mkdir "%DIST_DIR%\frontend_build"
echo.

REM ADIM 1: Frontend Build
echo ==========================================
echo ADIM 1: Frontend Build
echo ==========================================
cd /d "%FRONTEND_DIR%"

if not exist "package.json" (
    echo HATA: Frontend package.json bulunamadi!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Frontend dependencies yukleniyor...
    call yarn install
    if errorlevel 1 (
        echo HATA: yarn install basarisiz!
        pause
        exit /b 1
    )
)

echo Frontend build yapiliyor...
call yarn build
if errorlevel 1 (
    echo HATA: Frontend build basarisiz!
    pause
    exit /b 1
)

if not exist "build" (
    echo HATA: Frontend build klasoru olusturulamadi!
    pause
    exit /b 1
)

echo Frontend build tamamlandi.
echo.

REM Frontend build'i kopyala
echo Frontend dosyalari kopyalaniyor...
xcopy "%FRONTEND_DIR%\build\*" "%DIST_DIR%\frontend_build\" /E /I /Y /Q >nul
if errorlevel 1 (
    echo HATA: Frontend kopyalama basarisiz!
    pause
    exit /b 1
)
echo.

REM ADIM 2: Backend Build
echo ==========================================
echo ADIM 2: Backend Build (PyInstaller)
echo ==========================================
cd /d "%BACKEND_DIR%"

if not exist "server.spec" (
    echo HATA: server.spec bulunamadi!
    pause
    exit /b 1
)

where pyinstaller >nul 2>&1
if errorlevel 1 (
    echo PyInstaller bulunamadi, yukleniyor...
    pip install pyinstaller
    if errorlevel 1 (
        echo HATA: PyInstaller yuklenemedi!
        pause
        exit /b 1
    )
)

echo Backend executable olusturuluyor...
pyinstaller server.spec --clean --noconfirm
if errorlevel 1 (
    echo HATA: Backend build basarisiz!
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\dist\backend.exe" (
    echo HATA: backend.exe olusturulamadi!
    pause
    exit /b 1
)

echo Backend build tamamlandi.
echo.

REM Backend exe'yi kopyala
echo Backend kopyalaniyor...
copy /Y "%BACKEND_DIR%\dist\backend.exe" "%DIST_DIR%\backend.exe" >nul
if errorlevel 1 (
    echo HATA: backend.exe kopyalanamadi!
    pause
    exit /b 1
)
echo.

REM Database varsa kopyala
if exist "%BACKEND_DIR%\database.db" (
    echo Database dosyasi kopyalaniyor...
    copy /Y "%BACKEND_DIR%\database.db" "%DIST_DIR%\database.db" >nul
    echo Database kopyalandi.
) else (
    echo Database bulunamadi, bos dosya olusturuluyor...
    type nul > "%DIST_DIR%\database.db"
)
echo.

REM ADIM 3: README olustur
echo README olusturuluyor...
cd /d "%DIST_DIR%"
(
echo ==========================================
echo Ogrenci Takip Sistemi - Windows Desktop
echo ==========================================
echo.
echo CALISTIRMA:
echo.
echo 1^) backend.exe dosyasini cift tiklayarak calistirin
echo 2^) Tarayicinizda http://127.0.0.1:8000 adresini acin
echo 3^) Uygulama otomatik olarak acilacaktir
echo.
echo ==========================================
echo KLASOR YAPISI
echo ==========================================
echo.
echo backend.exe          - FastAPI backend server
echo database.db          - SQLite veritabani
echo frontend_build/      - React frontend dosyalari
echo backups/             - Otomatik yedek dosyalari
echo logs/                - Log dosyalari
echo.
echo ==========================================
echo YEDEKLEME
echo ==========================================
echo.
echo Otomatik Yedek:
echo - Uygulama her kapatildiginda otomatik yedek alinir
echo - Yedekler backups/ klasorunde saklanir
echo - En fazla 5 otomatik yedek tutulur
echo.
echo Manuel Yedek:
echo - Ayarlar sayfasindan Manuel Yedek Al butonuna basin
echo - Istediginiz bir konuma database.db dosyasini kaydedin
echo.
echo Geri Yukleme:
echo - Ayarlar sayfasindan Yedekten Geri Yukle butonuna basin
echo - Onceden aldiginiz bir yedek dosyasini secin
echo - Mevcut veriler yedek dosya ile degistirilir
echo.
echo ==========================================
echo ONEMLI NOTLAR
echo ==========================================
echo.
echo - database.db dosyasi TUM verilerinizi icerir
echo - Bu dosyayi duzenli olarak yedekleyin
echo - Uygulama internet baglantisi gerektirmez
echo - Windows Defender veya antivirusta izin verin
echo.
echo ==========================================
echo SORUN GIDERME
echo ==========================================
echo.
echo Backend baslamiyor:
echo - Port 8000 baska bir program tarafindan kullaniliyor olabilir
echo - Firewall backend.exe'yi engelliyor olabilir
echo - logs/backend.log dosyasini kontrol edin
echo.
echo Frontend yuklenmiyor:
echo - Backend calisiyor mu kontrol edin
echo - Tarayicida http://127.0.0.1:8000 adresini deneyin
echo - Cache'i temizleyip sayfayi yenileyin
echo.
echo Database hatasi:
echo - database.db dosyasinin yazma izni var mi kontrol edin
echo - Dosya bozuksa backups/ klasorunden geri yukleyin
echo.
echo ==========================================
echo DESTEK
echo ==========================================
echo.
echo Log dosyalari:
echo - logs/backend.log
echo - logs/electron.log
echo.
echo Bu dosyalari kontrol ederek hata ayiklama yapabilirsiniz.
echo.
) > README.txt

echo README olusturuldu.
echo.

REM ADIM 4: Bitti
echo ==========================================
echo BUILD TAMAMLANDI
echo ==========================================
echo.
echo Klasor: %DIST_DIR%
echo.
echo Icerik:
echo - backend.exe
echo - database.db
echo - frontend_build/
echo - backups/
echo - logs/
echo - README.txt
echo.
echo Kullanim:
echo 1. OgrenciTakip klasorunu istediginiz yere kopyalayin
echo 2. backend.exe'yi calistirin
echo 3. Tarayicida http://127.0.0.1:8000 acin
echo.
echo BUILD BASARILI!
echo.
pause
endlocal
