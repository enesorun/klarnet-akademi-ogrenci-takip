#!/bin/bash

echo "🔨 Backend Build Başlıyor..."

cd /app/backend

# PyInstaller ile backend'i exe'ye dönüştür
echo "📦 PyInstaller ile backend exe oluşturuluyor..."
pyinstaller server.spec --clean --noconfirm

# Build edilmiş exe'yi electron klasörüne kopyala
echo "📁 Backend exe kopyalanıyor..."
mkdir -p /app/electron/backend
cp dist/server.exe /app/electron/backend/ 2>/dev/null || cp dist/server /app/electron/backend/

# Database helper'ı da kopyala
cp database.py /app/electron/backend/
cp .env /app/electron/backend/

echo "✅ Backend build tamamlandı!"
echo "📂 Backend: /app/electron/backend/server.exe"
