@echo off
echo ========================================
echo   Klarnet Akademi - Veri Yedekleme
echo ========================================
echo.

REM Tarih formatini olustur (YYYYMMDD)
set TARIH=%date:~-4%%date:~-7,2%%date:~-10,2%

REM Yedek klasorunu belirle (Degistirebilirsiniz)
set YEDEK_KLASOR=D:\Yedekler\KlarnetAkademi\%TARIH%

echo Yedek Tarihi: %TARIH%
echo Yedek Konumu: %YEDEK_KLASOR%
echo.

REM Klasor yoksa olustur
if not exist "D:\Yedekler\KlarnetAkademi" mkdir "D:\Yedekler\KlarnetAkademi"

echo [1/2] MongoDB veritabani yedekleniyor...
mongodump --db klarnet_akademi --out "%YEDEK_KLASOR%" >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ Veritabani yedeklendi
) else (
    echo ✗ HATA: MongoDB yedeklenemedi!
    echo MongoDB servisinin calistigindan emin olun.
    pause
    exit
)

echo [2/2] Proje dosyalari yedekleniyor...
xcopy "%~dp0" "%YEDEK_KLASOR%\proje" /E /I /H /Y >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ Proje dosyalari yedeklendi
) else (
    echo ✗ UYARI: Proje dosyalari tam yedeklenemedi
)

echo.
echo ========================================
echo   YEDEKLEME TAMAMLANDI!
echo   Konum: %YEDEK_KLASOR%
echo ========================================
echo.
pause
