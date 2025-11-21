@echo off
chcp 65001 >nul
color 0A
title Klarnet Akademi - Otomatik Kurulum

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        KLARNET AKADEMI OGRENCI TAKIP SISTEMI              ║
echo ║                                                            ║
echo ║               OTOMATIK KURULUM BASLATIYOR                 ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Lutfen bekleyin, sistem hazirlaniyor...
echo.

REM Yonetici yetkisi kontrolu
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] UYARI: Bu programi yonetici olarak calistirmaniz onerilir.
    echo     Sag tiklayin ve "Yonetici olarak calistir" secin.
    echo.
    timeout /t 3 /nobreak >nul
)

REM Kurulum dizinini kaydet
set KURULUM_DIZIN=%~dp0
cd /d "%KURULUM_DIZIN%"

echo ═══════════════════════════════════════════════════════════
echo  ADIM 1/6: Gerekli Programlar Kontrol Ediliyor
echo ═══════════════════════════════════════════════════════════
echo.

REM Python kontrolu
echo [1/3] Python kontrol ediliyor...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ✗ Python bulunamadi!
    set PYTHON_YOK=1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
    echo     ✓ Python %PYTHON_VER% bulundu
    set PYTHON_YOK=0
)

REM Node.js kontrolu
echo [2/3] Node.js kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     ✗ Node.js bulunamadi!
    set NODE_YOK=1
) else (
    for /f %%i in ('node --version') do set NODE_VER=%%i
    echo     ✓ Node.js %NODE_VER% bulundu
    set NODE_YOK=0
)

REM MongoDB kontrolu
echo [3/3] MongoDB kontrol ediliyor...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo     ✗ MongoDB servisi bulunamadi!
    set MONGO_YOK=1
) else (
    echo     ✓ MongoDB bulundu
    set MONGO_YOK=0
)

echo.

REM Eksik program varsa uyari
if %PYTHON_YOK%==1 (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo  PYTHON KURULUMU GEREKLI
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo Python bulunamadi. Lutfen asagidaki adimları takip edin:
    echo.
    echo 1. https://www.python.org/downloads/ adresine gidin
    echo 2. "Download Python" butonuna tiklayin
    echo 3. Indirilen dosyayi calistirin
    echo 4. ONEMLI: "Add Python to PATH" kutucugunu isaretleyin!
    echo 5. "Install Now" tiklayin
    echo 6. Kurulum bitince bu programi tekrar calistirin
    echo.
    start https://www.python.org/downloads/
    pause
    exit
)

if %NODE_YOK%==1 (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo  NODE.JS KURULUMU GEREKLI
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo Node.js bulunamadi. Lutfen asagidaki adimları takip edin:
    echo.
    echo 1. https://nodejs.org/ adresine gidin
    echo 2. Yesil "LTS" butonuna tiklayin
    echo 3. Indirilen dosyayi calistirin
    echo 4. Varsayilan ayarlarla kurun
    echo 5. Kurulum bitince bu programi tekrar calistirin
    echo.
    start https://nodejs.org/
    pause
    exit
)

if %MONGO_YOK%==1 (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo  MONGODB KURULUMU GEREKLI
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo MongoDB bulunamadi. Lutfen asagidaki adimları takip edin:
    echo.
    echo 1. https://www.mongodb.com/try/download/community adresine gidin
    echo 2. "Download" butonuna tiklayin
    echo 3. Indirilen dosyayi calistirin
    echo 4. ONEMLI: "Install MongoDB as a Service" isaretli olmali!
    echo 5. "Complete" kurulum secin
    echo 6. Kurulum bitince bu programi tekrar calistirin
    echo.
    start https://www.mongodb.com/try/download/community
    pause
    exit
)

echo ═══════════════════════════════════════════════════════════
echo  ADIM 2/6: Backend Bagimliliklari Kuruluyor
echo ═══════════════════════════════════════════════════════════
echo.
echo Lutfen bekleyin, bu birkaç dakika surebilir...
echo.

cd "%KURULUM_DIZIN%backend"
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Backend kurulumunda hata olustu!
    echo.
    echo Detayli hata icin:
    pip install -r requirements.txt
    pause
    exit
) else (
    echo ✓ Backend bagimliliklari kuruldu
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  ADIM 3/6: Frontend Bagimliliklari Kuruluyor
echo ═══════════════════════════════════════════════════════════
echo.
echo Lutfen bekleyin, bu 5-10 dakika surebilir...
echo.

cd "%KURULUM_DIZIN%frontend"
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Frontend kurulumunda hata olustu!
    echo.
    echo Detayli hata icin:
    call npm install
    pause
    exit
) else (
    echo ✓ Frontend bagimliliklari kuruldu
)

cd "%KURULUM_DIZIN%"

echo.
echo ═══════════════════════════════════════════════════════════
echo  ADIM 4/6: MongoDB Servisi Baslatiliyor
echo ═══════════════════════════════════════════════════════════
echo.

net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MongoDB servisi baslatildi
) else (
    echo ✓ MongoDB zaten calisiyor
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  ADIM 5/6: Masaustu Kisayolu Olusturuluyor
echo ═══════════════════════════════════════════════════════════
echo.

REM VBS ile masaustu kisayolu olustur
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Klarnet Akademi.lnk
set TARGET_PATH=%KURULUM_DIZIN%START.bat
set ICON_PATH=%KURULUM_DIZIN%frontend\public\favicon.ico

echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%SHORTCUT_PATH%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%TARGET_PATH%" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%KURULUM_DIZIN%" >> CreateShortcut.vbs
echo oLink.Description = "Klarnet Akademi Ogrenci Takip Sistemi" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

cscript //nologo CreateShortcut.vbs
del CreateShortcut.vbs

if exist "%SHORTCUT_PATH%" (
    echo ✓ Masaustu kisayolu olusturuldu
) else (
    echo ✗ Kisayol olusturulamadi (elle olusturabilirsiniz)
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  ADIM 6/6: Tarayici Kisayolu Olusturuluyor
echo ═══════════════════════════════════════════════════════════
echo.

REM Chrome kisayolu
set CHROME_SHORTCUT=%USERPROFILE%\Desktop\Klarnet Akademi (Tarayici).url
echo [InternetShortcut] > "%CHROME_SHORTCUT%"
echo URL=http://localhost:3000 >> "%CHROME_SHORTCUT%"
echo IconIndex=0 >> "%CHROME_SHORTCUT%"

if exist "%CHROME_SHORTCUT%" (
    echo ✓ Tarayici kisayolu olusturuldu
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  KURULUM TAMAMLANDI!
echo ═══════════════════════════════════════════════════════════
echo.
echo ✓ Tum bilesenler basariyla kuruldu
echo ✓ Masaustunde "Klarnet Akademi" kisayolu olusturuldu
echo.
echo ═══════════════════════════════════════════════════════════
echo  NASIL KULLANILIR?
echo ═══════════════════════════════════════════════════════════
echo.
echo 1. Masaustundeki "Klarnet Akademi" kisayoluna CIFT TIKLAYIN
echo 2. Sistem otomatik olarak baslatilacak
echo 3. Tarayicinizda http://localhost:3000 acilacak
echo 4. Kapatmak icin STOP.bat calistirin
echo.
echo ═══════════════════════════════════════════════════════════
echo  ILGILI DOSYALAR
echo ═══════════════════════════════════════════════════════════
echo.
echo • Masaustu: "Klarnet Akademi" - Sistemi baslatir
echo • STOP.bat - Sistemi kapatir
echo • YEDEK.bat - Verilerinizi yedekler
echo • GERI_YUKLE.bat - Yedeginizi geri yukler
echo • KURULUM.txt - Detayli kullanim kilavuzu
echo.
echo ═══════════════════════════════════════════════════════════
echo.

set /p BASLAT="Simdi sistemi baslatmak ister misiniz? (E/H): "
if /I "%BASLAT%"=="E" (
    echo.
    echo Sistem baslatiliyor...
    echo.
    call START.bat
) else (
    echo.
    echo Sistemi daha sonra masaustu kisayolundan baslatabilirsiniz.
    echo.
    pause
)
