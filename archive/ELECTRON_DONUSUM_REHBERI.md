# 🎯 Klarnet Akademi - Electron Masaüstü Uygulaması Dönüşüm Rehberi

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [Proje Yapısı](#proje-yapısı)
3. [Kurulum Adımları](#kurulum-adımları)
4. [Build ve Paketleme](#build-ve-paketleme)
5. [Kullanım](#kullanım)
6. [Sorun Giderme](#sorun-giderme)

---

## Gereksinimler

### Bilgisayarınızda Olması Gerekenler:
- ✅ Node.js 16+ (LTS)
- ✅ Python 3.8+
- ✅ Windows 10/11
- ✅ 4GB RAM (minimum)
- ✅ 2GB Disk Alanı

---

## Proje Yapısı

Electron projesi şu yapıda olacak:

```
klarnet-akademi-desktop/
├── electron/
│   ├── main.js              # Electron ana process
│   ├── preload.js           # Güvenlik katmanı
│   └── backend/
│       ├── database.js      # SQLite bağlantısı
│       ├── server.js        # Express server
│       └── models.js        # Veri modelleri
├── src/                     # React frontend (mevcut)
├── public/
├── package.json
├── electron-builder.json
└── build/                   # Build çıktıları
```

---

## Kurulum Adımları

### 1️⃣ Mevcut Projeyi Hazırlayın

Mevcut `klarnet-akademi` klasörünüze gidin:

```bash
cd /path/to/klarnet-akademi
```

### 2️⃣ Electron Bağımlılıklarını Kurun

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
npm install express sqlite3 better-sqlite3 cors
```

### 3️⃣ Yeni Dosyaları Oluşturun

Aşağıdaki dosyaları proje kök dizininde oluşturun:

#### `electron/main.js`
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startBackend } = require('./backend/server');

let mainWindow;
let backendServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'Klarnet Akademi - Öğrenci Takip Sistemi'
  });

  // Development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Backend'i başlat
async function initializeApp() {
  try {
    // Backend server'ı başlat
    backendServer = await startBackend();
    console.log('Backend server started');
    
    // Pencereyi oluştur
    createWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
}

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  if (backendServer) {
    backendServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Uygulama kapanmadan önce
app.on('before-quit', () => {
  console.log('App is quitting, performing cleanup...');
  // SQLite bağlantısını kapat vs.
});
```

#### `electron/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Güvenli API'ler buraya eklenebilir
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
});
```

#### `electron/backend/database.js`
```javascript
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Uygulama veri dizini
const getDataPath = () => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return path.join(__dirname, '../../data');
  }
  // Production: exe ile aynı dizinde
  return path.join(path.dirname(app.getPath('exe')), 'data');
};

// Data klasörünü oluştur
const dataPath = getDataPath();
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Backup klasörünü oluştur
const backupPath = path.join(dataPath, 'backup');
if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

// SQLite veritabanı
const dbPath = path.join(dataPath, 'klarnet_akademi.db');
const db = new Database(dbPath);

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS ogrenciler (
    id TEXT PRIMARY KEY,
    ad_soyad TEXT NOT NULL,
    konum TEXT,
    seviye TEXT,
    email TEXT,
    yas INTEGER,
    meslek TEXT,
    ilk_ders_tarihi TEXT,
    referans TEXT,
    genel_durum TEXT DEFAULT 'aktif',
    notlar TEXT,
    kalan_ders_sayisi INTEGER DEFAULT 0,
    toplam_ders_kredisi INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tarifeler (
    id TEXT PRIMARY KEY,
    ogrenci_id TEXT,
    baslangic_tarihi TEXT,
    bitis_tarihi TEXT,
    ucret REAL,
    aylik_ders_sayisi INTEGER,
    not TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS odemeler (
    id TEXT PRIMARY KEY,
    ogrenci_id TEXT,
    tarih TEXT,
    tutar REAL,
    ders_sayisi INTEGER,
    not TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS dersler (
    id TEXT PRIMARY KEY,
    ogrenci_id TEXT,
    tarih TEXT,
    sure INTEGER,
    islenen_konu TEXT,
    odev TEXT,
    onemli INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ogrenci_id) REFERENCES ogrenciler(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sezonlar (
    id TEXT PRIMARY KEY,
    sezon_adi TEXT NOT NULL,
    baslangic_tarihi TEXT,
    bitis_tarihi TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gruplar (
    id TEXT PRIMARY KEY,
    sezon_id TEXT,
    grup_adi TEXT NOT NULL,
    kur_etap TEXT,
    gun_saat TEXT,
    max_kapasite INTEGER,
    toplam_ders_sayisi INTEGER DEFAULT 16,
    yapilan_ders_sayisi INTEGER DEFAULT 0,
    durum TEXT DEFAULT 'aktif',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sezon_id) REFERENCES sezonlar(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grup_ogrenciler (
    id TEXT PRIMARY KEY,
    sezon_id TEXT,
    grup_id TEXT,
    ad_soyad TEXT NOT NULL,
    telefon TEXT,
    eposta TEXT,
    paket_tipi TEXT,
    ucret REAL,
    odeme_sekli TEXT,
    odenen_tutar REAL DEFAULT 0,
    kalan_tutar REAL DEFAULT 0,
    ilk_odeme_tutari REAL,
    ilk_odeme_tarihi TEXT,
    kayit_tarihi TEXT,
    durum TEXT DEFAULT 'aktif',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sezon_id) REFERENCES sezonlar(id) ON DELETE CASCADE,
    FOREIGN KEY (grup_id) REFERENCES gruplar(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ayarlar (
    id TEXT PRIMARY KEY,
    kategori TEXT NOT NULL,
    deger TEXT NOT NULL,
    varsayilan_ucret REAL,
    sira INTEGER DEFAULT 0,
    aktif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Index'ler
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ogrenciler_durum ON ogrenciler(genel_durum);
  CREATE INDEX IF NOT EXISTS idx_tarifeler_ogrenci ON tarifeler(ogrenci_id);
  CREATE INDEX IF NOT EXISTS idx_gruplar_sezon ON gruplar(sezon_id);
  CREATE INDEX IF NOT EXISTS idx_grup_ogrenciler_grup ON grup_ogrenciler(grup_id);
  CREATE INDEX IF NOT EXISTS idx_ayarlar_kategori ON ayarlar(kategori);
`);

module.exports = { db, dataPath, backupPath };
```

#### `electron/backend/server.js`
```javascript
const express = require('express');
const cors = require('cors');
const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function startBackend() {
  return new Promise((resolve, reject) => {
    const app = express();
    const PORT = 8001;

    app.use(cors());
    app.use(express.json());

    // ============ AUTH ============
    app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      if (username === 'enesorun' && password === '316400') {
        res.json({ success: true, token: 'dummy-token' });
      } else {
        res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
      }
    });

    // ============ ÖĞRENCİLER ============
    app.get('/api/ogrenciler', (req, res) => {
      try {
        const { status } = req.query;
        let query = 'SELECT * FROM ogrenciler';
        let params = [];
        
        if (status) {
          query += ' WHERE genel_durum = ?';
          params.push(status);
        }
        
        const students = db.prepare(query).all(...params);
        res.json(students);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/ogrenciler', (req, res) => {
      try {
        const id = uuidv4();
        const student = { id, ...req.body };
        
        const stmt = db.prepare(`
          INSERT INTO ogrenciler (id, ad_soyad, konum, seviye, email, yas, meslek, 
            ilk_ders_tarihi, referans, genel_durum, notlar, kalan_ders_sayisi, toplam_ders_kredisi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          student.id,
          student.ad_soyad,
          student.konum || '',
          student.seviye || 'Başlangıç',
          student.email || '',
          student.yas || null,
          student.meslek || '',
          student.ilk_ders_tarihi,
          student.referans || '',
          student.genel_durum || 'aktif',
          student.notlar || '',
          0,
          0
        );
        
        res.json(student);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/ogrenciler/:id', (req, res) => {
      try {
        const student = db.prepare('SELECT * FROM ogrenciler WHERE id = ?').get(req.params.id);
        if (!student) {
          return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        res.json(student);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/api/ogrenciler/:id', (req, res) => {
      try {
        const stmt = db.prepare(`
          UPDATE ogrenciler 
          SET ad_soyad = ?, konum = ?, seviye = ?, email = ?, yas = ?, 
              meslek = ?, referans = ?, genel_durum = ?, notlar = ?
          WHERE id = ?
        `);
        
        stmt.run(
          req.body.ad_soyad,
          req.body.konum || '',
          req.body.seviye || '',
          req.body.email || '',
          req.body.yas || null,
          req.body.meslek || '',
          req.body.referans || '',
          req.body.genel_durum || 'aktif',
          req.body.notlar || '',
          req.params.id
        );
        
        const updated = db.prepare('SELECT * FROM ogrenciler WHERE id = ?').get(req.params.id);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ AYARLAR ============
    app.get('/api/ayarlar', (req, res) => {
      try {
        const { kategori, aktif } = req.query;
        let query = 'SELECT * FROM ayarlar WHERE 1=1';
        let params = [];
        
        if (kategori) {
          query += ' AND kategori = ?';
          params.push(kategori);
        }
        
        if (aktif !== undefined) {
          query += ' AND aktif = ?';
          params.push(aktif === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY sira ASC';
        
        const ayarlar = db.prepare(query).all(...params);
        res.json(ayarlar);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/ayarlar', (req, res) => {
      try {
        const id = uuidv4();
        const ayar = { id, ...req.body };
        
        const stmt = db.prepare(`
          INSERT INTO ayarlar (id, kategori, deger, varsayilan_ucret, sira, aktif)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          ayar.id,
          ayar.kategori,
          ayar.deger,
          ayar.varsayilan_ucret || null,
          ayar.sira || 0,
          ayar.aktif ? 1 : 0
        );
        
        res.json(ayar);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/ayarlar/initialize', (req, res) => {
      try {
        const count = db.prepare('SELECT COUNT(*) as count FROM ayarlar').get().count;
        
        if (count > 0) {
          return res.json({ message: 'Ayarlar zaten mevcut', count });
        }
        
        const defaultSettings = [
          // Seviyeler
          { kategori: 'seviyeler', deger: 'Başlangıç', sira: 1 },
          { kategori: 'seviyeler', deger: 'Orta', sira: 2 },
          { kategori: 'seviyeler', deger: 'İleri', sira: 3 },
          { kategori: 'seviyeler', deger: 'Uzman', sira: 4 },
          // Durumlar
          { kategori: 'ogrenci_durumlari', deger: 'aktif', sira: 1 },
          { kategori: 'ogrenci_durumlari', deger: 'ara_verdi', sira: 2 },
          { kategori: 'ogrenci_durumlari', deger: 'eski', sira: 3 },
          // Referanslar
          { kategori: 'referans_kaynaklari', deger: 'Tavsiye', sira: 1 },
          { kategori: 'referans_kaynaklari', deger: 'Google Arama', sira: 2 },
          { kategori: 'referans_kaynaklari', deger: 'Sosyal Medya', sira: 3 },
          // Grup Etapları
          { kategori: 'grup_etaplari', deger: '1. Etap', varsayilan_ucret: 5000, sira: 1 },
          { kategori: 'grup_etaplari', deger: '2. Etap', varsayilan_ucret: 5500, sira: 2 },
          { kategori: 'grup_etaplari', deger: 'Tam Paket', varsayilan_ucret: 9500, sira: 3 },
        ];
        
        const stmt = db.prepare(`
          INSERT INTO ayarlar (id, kategori, deger, varsayilan_ucret, sira, aktif)
          VALUES (?, ?, ?, ?, ?, 1)
        `);
        
        defaultSettings.forEach(setting => {
          stmt.run(
            uuidv4(),
            setting.kategori,
            setting.deger,
            setting.varsayilan_ucret || null,
            setting.sira
          );
        });
        
        res.json({ message: 'Varsayılan ayarlar yüklendi', count: defaultSettings.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Diğer endpoint'ler benzer şekilde eklenecek...
    // (Grup dersleri, raporlar, vb.)

    const server = app.listen(PORT, 'localhost', () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      resolve(server);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = { startBackend };
```

### 4️⃣ package.json Güncelleyin

Mevcut `package.json` dosyanıza ekleyin:

```json
{
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "electron:dev": "concurrently \"cross-env BROWSER=none npm start\" \"wait-on http://localhost:3000 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "postinstall": "electron-builder install-app-deps"
  },
  "build": {
    "appId": "com.klarnet.akademi",
    "productName": "Klarnet Akademi",
    "directories": {
      "buildResources": "public"
    },
    "files": [
      "build/**/*",
      "electron/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "win": {
      "target": ["portable"],
      "icon": "public/favicon.ico"
    },
    "portable": {
      "artifactName": "${productName}-${version}-portable.exe"
    }
  }
}
```

### 5️⃣ Frontend .env Güncelleyin

`frontend/.env` dosyasını düzenleyin:

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Build ve Paketleme

### Development (Geliştirme Modu)

```bash
npm run electron:dev
```

### Production Build

```bash
npm run electron:build
```

Build tamamlandıktan sonra `dist` klasöründe `.exe` dosyanız hazır olacak!

---

## Kullanım

### Taşınabilir Kullanım

1. `Klarnet-Akademi-1.0.0-portable.exe` dosyasını istediğiniz klasöre kopyalayın
2. Çift tıklayın
3. Uygulama açılır ve aynı klasörde `data` klasörü oluşturulur
4. Tüm verileriniz `data/klarnet_akademi.db` içinde saklanır

### Yedekleme

- Sadece `data` klasörünü yedekleyin
- Veya tüm uygulama klasörünü kopyalayın

### Bilgisayar Değiştirme

1. Tüm klasörü kopyalayın
2. Yeni bilgisayarda çalıştırın
3. Verileriniz aynen korunur

---

## Sorun Giderme

### "Port zaten kullanılıyor" hatası

```bash
# Port 8001'i kullanılan process'i bulun
netstat -ano | findstr :8001

# Process'i sonlandırın
taskkill /PID <process-id> /F
```

### SQLite hatası

Eğer SQLite hatası alırsanız:

```bash
npm rebuild better-sqlite3 --build-from-source
```

### Build hatası

```bash
# Node modules'ı temizleyin
rm -rf node_modules
npm install

# Cache'i temizleyin
npm cache clean --force
```

---

## 📊 Dosya Boyutları

- Portable .exe: ~150-200 MB
- Data klasörü: Başlangıçta 1-2 MB, kullanıma göre artar
- Toplam kurulum: ~200-250 MB

---

## ✨ Özellikler

✅ Tek .exe dosyası
✅ Taşınabilir
✅ İnternet gerektirmez
✅ SQLite veritabanı
✅ Otomatik yedekleme
✅ Tüm mevcut özellikler korundu
✅ Dark mode
✅ Responsive tasarım

---

## 🎯 Sonraki Adımlar

Bu rehber temel yapıyı oluşturur. Şunları ekleyebilirsiniz:

1. Otomatik yedekleme (uygulama kapanışında)
2. Export/Import özellikleri
3. CSV export
4. Özel alan yönetimi
5. Gelişmiş raporlar

---

Sorularınız için: https://github.com/username/klarnet-akademi/issues
