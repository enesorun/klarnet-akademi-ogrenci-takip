@echo off
echo ========================================
echo   Klarnet Akademi Ogrenci Takip Sistemi
echo   Baslatiliyor...
echo ========================================
echo.

echo [1/3] MongoDB kontrol ediliyor...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB servisi bulunamadi. Lutfen MongoDB'yi kurun.
    pause
    exit
)

echo [2/3] Backend baslatiliyor...
start "Backend Server" cmd /k "cd /d %~dp0backend && python server.py"
timeout /t 3 /nobreak >nul

echo [3/3] Frontend baslatiliyor...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Sistem baslatildi!
echo   Tarayicinizda acilacak: http://localhost:3000
echo.
echo   Sistemi durdurmak icin STOP.bat calistirin
echo ========================================
echo.

timeout /t 5 /nobreak >nul
start http://localhost:3000

exit