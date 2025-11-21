==========================================
Ogrenci Takip Sistemi - Windows Desktop
==========================================

KURULUM VE CALISTIRMA:

1) Bu klasoru (OgrenciTakip) istediginiz bir yere kopyalayin
2) backend.exe dosyasini cift tiklayarak calistirin
3) Tarayicinizda http://127.0.0.1:8000 adresini acin
4) Uygulama otomatik olarak acilacaktir

NOT: Windows'ta ilk calistirildiginda Windows Defender veya
antivirüs programi uyari verebilir. "Yine de calistir" 
seceneğini secin.

==========================================
KLASOR YAPISI
==========================================

backend.exe          - FastAPI backend server (19 MB)
database.db          - SQLite veritabani (tum verileriniz)
frontend_build/      - React frontend dosyalari
backups/             - Otomatik yedek dosyalari
logs/                - Log dosyalari

==========================================
YEDEKLEME
==========================================

Otomatik Yedek:
- Uygulama her kapatildiginda otomatik yedek alinir
- Yedekler backups/ klasorunde saklanir
- En fazla 5 otomatik yedek tutulur

Manuel Yedek:
- Ayarlar sayfasindan "Manuel Yedek Al" butonuna basin
- Istediginiz bir konuma database.db dosyasini kaydedin

Geri Yukleme:
- Ayarlar sayfasindan "Yedekten Geri Yukle" butonuna basin
- Onceden aldiginiz bir yedek dosyasini secin
- Mevcut veriler yedek dosya ile degistirilir

ONEMLI: database.db dosyasi TUM verilerinizi icerir!
Bu dosyayi duzenli olarak yedekleyin!

==========================================
ONEMLI NOTLAR
==========================================

- Uygulama internet baglantisi gerektirmez (OFFLINE)
- Tum veriler yerel olarak database.db dosyasinda saklanir
- Port 8000 baska bir program tarafindan kullaniliyorsa
  uygulama baslamaz
- Windows Defender veya antivirusta izin verin

==========================================
SORUN GIDERME
==========================================

Backend baslamiyor:
- Port 8000 baska bir program tarafindan kullaniliyor olabilir
  Kontrol: cmd'de "netstat -ano | findstr :8000" komutu
- Firewall backend.exe'yi engelliyor olabilir
- Windows Defender'da izin verin

Frontend yuklenmiyor / Beyaz ekran:
- Backend calisiyor mu kontrol edin
- backend.exe'yi calistirdiktan sonra 3-5 saniye bekleyin
- Tarayicida http://127.0.0.1:8000 adresini deneyin
- Tarayici cache'ini temizleyip sayfayi yenileyin (Ctrl+F5)

Database hatasi:
- database.db dosyasinin yazma izni var mi kontrol edin
- Dosya bozuksa backups/ klasorunden geri yukleyin
- Dosyayi tamamen silerseniz backend bos database olusturur

==========================================
TEKNIK DETAYLAR
==========================================

Backend:
- FastAPI (Python)
- SQLite veritabani
- Port: 127.0.0.1:8000

Frontend:
- React
- TailwindCSS
- React Router

Log Dosyalari:
- logs/backend.log (backend hatalari)
- logs/electron.log (electron hatalari - varsa)

Veritabani:
- SQLite format
- Dosya: database.db
- Baglanti: aiosqlite

==========================================
GUVENLIK
==========================================

- Tum veriler YEREL olarak saklanir
- Internet baglantisi gerektirmez
- Veri paylasimi yapilmaz
- Antivirüs programi backend.exe'yi tarayabilir
  (Guvenli bir dosyadir, sadece yerel server calistirir)

==========================================
YARDIM VE DESTEK
==========================================

Sorun yaşarsaniz:
1. Backend'i kapatip tekrar calistirin
2. logs/ klasorundeki dosyalari kontrol edin
3. database.db dosyasini yedekleyip silin, yeni olusturun

Versiyon: 1.0
Tarih: 2025-11-21
