# Öğrenci Takip Sistemi - Desktop App

Tamamen **offline** çalışan, tek dosya Windows masaüstü uygulaması.

## 🎯 Özellikler

- ✅ SQLite tabanlı yerel veritabanı
- ✅ İnternet bağlantısı gerektirmez
- ✅ Tüm veriler bilgisayarınızda saklanır
- ✅ Login ekranı yok - direkt dashboard açılır
- ✅ Tek `.exe` dosyası - kolay kurulum

## 📦 Kurulum (Windows)

1. `Öğrenci Takip Sistemi Setup 1.0.0.exe` dosyasını çalıştırın
2. Kurulum wizard'ını takip edin
3. Masaüstünde oluşan kısayoldan uygulamayı başlatın

## 🛠️ Geliştirme

### Gereksinimler

- Node.js 18+
- Python 3.11+
- Yarn

### Development Modunda Çalıştırma

```bash
# Backend'i başlat
cd /app/backend
python server.py

# Frontend'i başlat (yeni terminal)
cd /app/frontend
yarn start

# Electron'u başlat (yeni terminal)
cd /app/electron
yarn start
```

### Production Build

```bash
cd /app/electron
./build-all.sh
```

Build edilen `.exe` dosyası `/app/electron/dist/` klasöründe oluşacaktır.

## 📂 Veritabanı

Uygulama ilk çalıştırıldığında, kullanıcının bilgisayarında otomatik olarak bir SQLite veritabanı oluşturulur:

- **Konum**: `%APPDATA%/ogrenci-takip-sistemi/data/ogrenciler.db`
- **Yedekleme**: Uygulama içinden JSON/CSV olarak export edilebilir

## 🔧 Sorun Giderme

### Uygulama açılmıyor
- Windows Defender / Antivirus yazılımınızın uygulamayı engellemiş olabilir
- Uygulamayı "güvenilir" olarak işaretleyin

### Veritabanı hatası
- `%APPDATA%/ogrenci-takip-sistemi/data/` klasörünü kontrol edin
- Klasör yazma izinlerine sahip olduğunuzdan emin olun

### Port hatası (8001 kullanımda)
- Başka bir uygulama 8001 portunu kullanıyor olabilir
- O uygulamayı kapatın veya port numarasını değiştirin

## 📝 Notlar

- Uygulama tamamen **offline** çalışır
- **İnternet bağlantısı gerekmez**
- Tüm veriler **yerel bilgisayarda** saklanır
- **Düzenli yedekleme** yapmanız önerilir

## 📄 Lisans

MIT License
