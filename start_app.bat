@echo off
chcp 65001 >nul
echo ==========================================
echo Ogrenci Takip Sistemi Baslatiliyor...
echo ==========================================
echo.

cd /d "%~dp0backend"

echo Python kontrol ediliyor...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo HATA: Python bulunamadi!
    echo.
    echo Lutfen Python 3.11 veya ustunu yukleyin:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo.
echo Backend server baslatiliyor...
echo.
echo Console penceresini KAPATMAYIN!
echo Tarayicinizda http://127.0.0.1:8000 adresini acin
echo.
echo Durdurmak icin bu pencerede CTRL+C basin
echo.
echo ==========================================
echo.

python server.py
