#!/bin/bash

echo "========================================"
echo "  Klarnet Akademi - Veri Yedekleme"
echo "========================================"
echo ""

# Tarih formatı (YYYYMMDD)
TARIH=$(date +%Y%m%d)

# Yedek klasörü (Değiştirebilirsiniz)
YEDEK_KLASOR="$HOME/Desktop/KlarnetAkademi_Yedek/$TARIH"

echo "Yedek Tarihi: $TARIH"
echo "Yedek Konumu: $YEDEK_KLASOR"
echo ""

# Klasör yoksa oluştur
mkdir -p "$YEDEK_KLASOR"

echo "[1/2] MongoDB veritabanı yedekleniyor..."
mongodump --db klarnet_akademi --out "$YEDEK_KLASOR" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Veritabanı yedeklendi"
else
    echo "✗ HATA: MongoDB yedeklenemedi!"
    echo "MongoDB servisinin çalıştığından emin olun."
    exit 1
fi

echo "[2/2] Proje dosyaları yedekleniyor..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR" "$YEDEK_KLASOR/proje" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Proje dosyaları yedeklendi"
else
    echo "✗ UYARI: Proje dosyaları tam yedeklenemedi"
fi

echo ""
echo "========================================"
echo "  YEDEKLEME TAMAMLANDI!"
echo "  Konum: $YEDEK_KLASOR"
echo "========================================"
echo ""
