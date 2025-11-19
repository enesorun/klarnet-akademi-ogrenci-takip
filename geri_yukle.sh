#!/bin/bash

echo "========================================"
echo "  Klarnet Akademi - Yedek Geri Yükleme"
echo "========================================"
echo ""

echo "UYARI: Bu işlem mevcut verilerin ÜZERİNE yazacak!"
echo ""
read -p "Devam etmek istediğinizden emin misiniz? (e/h): " ONAY

if [ "$ONAY" != "e" ] && [ "$ONAY" != "E" ]; then
    echo "İşlem iptal edildi."
    exit 0
fi

echo ""
echo "Yedek klasörünü girin..."
echo "Örnek: $HOME/Desktop/KlarnetAkademi_Yedek/20251119"
echo ""
read -p "Yedek klasör yolu: " YEDEK_YOLU

if [ ! -d "$YEDEK_YOLU" ]; then
    echo ""
    echo "HATA: Belirtilen klasör bulunamadı!"
    exit 1
fi

echo ""
echo "[1/1] Veritabanı geri yükleniyor..."
mongorestore --db klarnet_akademi --drop "$YEDEK_YOLU/klarnet_akademi" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Veritabanı başarıyla geri yüklendi!"
else
    echo "✗ HATA: Veritabanı geri yüklenemedi!"
    echo "MongoDB servisinin çalıştığından emin olun."
    exit 1
fi

echo ""
echo "========================================"
echo "  GERİ YÜKLEME TAMAMLANDI!"
echo "  Sistemi yeniden başlatın: ./start.sh"
echo "========================================"
echo ""
