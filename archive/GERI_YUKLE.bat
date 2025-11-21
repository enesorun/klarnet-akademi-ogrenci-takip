@echo off
echo ========================================
echo   Klarnet Akademi - Yedek Geri Yukleme
echo ========================================
echo.

echo UYARI: Bu islem mevcut verilerin UZERINE yazacak!
echo.
set /p ONAY="Devam etmek istediginizden emin misiniz? (E/H): "

if /I not "%ONAY%"=="E" (
    echo Islem iptal edildi.
    pause
    exit
)

echo.
echo Yedek klasorunu secin...
echo Ornek: D:\Yedekler\KlarnetAkademi\20251119
echo.
set /p YEDEK_YOLU="Yedek klasor yolu: "

if not exist "%YEDEK_YOLU%" (
    echo.
    echo HATA: Belirtilen klasor bulunamadi!
    pause
    exit
)

echo.
echo [1/1] Veritabani geri yukleniyor...
mongorestore --db klarnet_akademi --drop "%YEDEK_YOLU%\klarnet_akademi" >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ Veritabani basariyla geri yuklendi!
) else (
    echo ✗ HATA: Veritabani geri yuklenemedi!
    echo MongoDB servisinin calistigindan emin olun.
    pause
    exit
)

echo.
echo ========================================
echo   GERI YUKLEME TAMAMLANDI!
echo   Sistemi yeniden baslatin: START.bat
echo ========================================
echo.
pause
