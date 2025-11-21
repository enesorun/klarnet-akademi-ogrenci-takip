#!/bin/bash

echo "🚀 Öğrenci Takip Sistemi - Full Build Başlıyor..."
echo "=================================================="

# 1. Frontend Build
echo ""
echo "1️⃣ Frontend Build..."
cd /app/frontend
yarn build
cp -r build /app/electron/frontend
echo "✅ Frontend hazır"

# 2. Backend Build (PyInstaller)
echo ""
echo "2️⃣ Backend Build..."
cd /app/backend
pyinstaller server.spec --clean --noconfirm
mkdir -p /app/electron/backend
cp dist/server /app/electron/backend/ || cp dist/server.exe /app/electron/backend/
cp database.py /app/electron/backend/
cp .env /app/electron/backend/
echo "✅ Backend hazır"

# 3. Data klasörü hazırla
echo ""
echo "3️⃣ Data klasörü hazırlanıyor..."
mkdir -p /app/electron/data
touch /app/electron/data/.gitkeep
echo "✅ Data klasörü hazır"

# 4. Electron Build (Windows .exe)
echo ""
echo "4️⃣ Electron ile Windows exe oluşturuluyor..."
cd /app/electron
yarn install
yarn build-win

echo ""
echo "🎉 BUILD TAMAMLANDI!"
echo "=================================================="
echo "📦 Çıktı: /app/electron/dist/"
echo ""
echo "Kurulum dosyası:"
echo "  - Windows: Öğrenci Takip Sistemi Setup 1.0.0.exe"
echo ""
