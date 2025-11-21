#!/bin/bash

# Öğrenci Takip Sistemi - Desktop App Build Script
# Bu script tüm build işlemlerini otomatik yapar

set -e  # Hata olursa dur

echo "🚀 Öğrenci Takip Sistemi - Desktop App Build Başlatılıyor..."
echo "=================================================="
echo ""

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Root dizin
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}📂 Root dizin: $ROOT_DIR${NC}"
echo ""

# 1. Frontend Build
echo -e "${YELLOW}📦 ADIM 1: Frontend Build${NC}"
echo "--------------------------------------"
cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "📥 Frontend dependencies yükleniyor..."
    yarn install
fi

echo "🏗️ Frontend production build yapılıyor..."
yarn build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Frontend build başarısız!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build tamamlandı!${NC}"
echo ""

# 2. Backend Build (PyInstaller)
echo -e "${YELLOW}⚙️ ADIM 2: Backend Build (PyInstaller)${NC}"
echo "--------------------------------------"
cd "$ROOT_DIR/backend"

# Virtual environment kontrolü
if [ ! -d "$ROOT_DIR/.venv" ]; then
    echo -e "${RED}❌ Virtual environment bulunamadı!${NC}"
    echo "Lütfen önce: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# PyInstaller yüklü mü kontrol et
if ! command -v pyinstaller &> /dev/null; then
    echo "📥 PyInstaller yükleniyor..."
    pip install pyinstaller
fi

echo "🏗️ Backend executable oluşturuluyor..."
pyinstaller server.spec --clean --noconfirm

if [ ! -f "dist/backend.exe" ] && [ ! -f "dist/backend" ]; then
    echo -e "${RED}❌ Backend build başarısız!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend build tamamlandı!${NC}"
echo ""

# 3. Final Package Oluşturma
echo -e "${YELLOW}📦 ADIM 3: Final Package${NC}"
echo "--------------------------------------"

PACKAGE_DIR="$ROOT_DIR/OgrenciTakip"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "📁 Package klasörü oluşturuldu: $PACKAGE_DIR"

# Backend exe'yi kopyala
echo "📋 Backend kopyalanıyor..."
if [ -f "$ROOT_DIR/backend/dist/backend.exe" ]; then
    cp "$ROOT_DIR/backend/dist/backend.exe" "$PACKAGE_DIR/"
elif [ -f "$ROOT_DIR/backend/dist/backend" ]; then
    cp "$ROOT_DIR/backend/dist/backend" "$PACKAGE_DIR/backend.exe"
fi

# Frontend build'i kopyala
echo "📋 Frontend build kopyalanıyor..."
mkdir -p "$PACKAGE_DIR/frontend_build"
cp -r "$ROOT_DIR/frontend/build/"* "$PACKAGE_DIR/frontend_build/"

# Boş klasörler oluştur
echo "📂 Yardımcı klasörler oluşturuluyor..."
mkdir -p "$PACKAGE_DIR/backups"
mkdir -p "$PACKAGE_DIR/logs"

# Boş database oluştur (ilk çalıştırmada otomatik doldurulacak)
echo "💾 Boş database dosyası oluşturuluyor..."
touch "$PACKAGE_DIR/database.db"

echo -e "${GREEN}✅ Final package hazır!${NC}"
echo ""

# 4. Electron Build (Opsiyonel - tam installer için)
echo -e "${YELLOW}🖥️ ADIM 4: Electron Build (Installer)${NC}"
echo "--------------------------------------"
echo "Not: Bu adım OgrenciTakip.exe installer'ı oluşturur."
echo ""

read -p "Electron installer oluşturulsun mu? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$ROOT_DIR/electron"
    
    if [ ! -d "node_modules" ]; then
        echo "📥 Electron dependencies yükleniyor..."
        yarn install
    fi
    
    # Backend ve frontend'i electron klasörüne kopyala
    echo "📋 Dosyalar electron build için hazırlanıyor..."
    cp "$PACKAGE_DIR/backend.exe" "$ROOT_DIR/electron/"
    cp -r "$ROOT_DIR/frontend/build" "$ROOT_DIR/electron/frontend_build"
    
    echo "🏗️ Electron build başlatılıyor..."
    yarn build-win
    
    echo -e "${GREEN}✅ Electron build tamamlandı!${NC}"
    echo "📦 Installer: $ROOT_DIR/electron/dist/"
else
    echo "⏭️ Electron build atlandı"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 BUILD TAMAMLANDI!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📁 Portable Klasör:${NC} $PACKAGE_DIR"
echo ""
echo "İçindekiler:"
echo "  - backend.exe          : FastAPI backend server"
echo "  - database.db          : SQLite veritabanı (boş)"
echo "  - frontend_build/      : React frontend"
echo "  - backups/             : Otomatik yedekler"
echo "  - logs/                : Log dosyaları"
echo ""
echo -e "${YELLOW}Kullanım:${NC}"
echo "1. OgrenciTakip/ klasörünü istediğiniz yere kopyalayın"
echo "2. backend.exe'yi çalıştırın"
echo "3. Tarayıcıda http://127.0.0.1:8000 adresini açın"
echo ""
echo -e "${YELLOW}Veya Electron installer kullanın:${NC}"
echo "  electron/dist/OgrenciTakip-*-setup.exe"
echo ""
echo -e "${GREEN}✨ Başarılar!${NC}"
