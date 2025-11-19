@echo off
echo ========================================
echo   Sistem durduruluyor...
echo ========================================
echo.

echo Frontend kapatiliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1

echo Backend kapatiliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /F /PID %%a >nul 2>&1

echo.
echo ========================================
echo   Sistem durduruldu!
echo ========================================
echo.
pause