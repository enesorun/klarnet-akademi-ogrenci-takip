const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 8000;

// Uygulama klasörü - backend.exe ve database.db ile aynı yerde
const APP_ROOT = app.isPackaged 
  ? path.dirname(app.getPath('exe'))  // OgrenciTakip/ klasörü
  : path.join(__dirname, '..');

const DATABASE_PATH = path.join(APP_ROOT, 'database.db');
const BACKEND_EXE = path.join(APP_ROOT, 'backend.exe');
const BACKUPS_DIR = path.join(APP_ROOT, 'backups');
const LOGS_DIR = path.join(APP_ROOT, 'logs');

// Klasörleri oluştur
[BACKUPS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Log dosyası
const LOG_FILE = path.join(LOGS_DIR, 'electron.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Backend başlat
function startBackend() {
  return new Promise((resolve, reject) => {
    log('🚀 Backend başlatılıyor...');
    log(`📂 App Root: ${APP_ROOT}`);
    log(`📁 Database: ${DATABASE_PATH}`);
    log(`⚙️ Backend EXE: ${BACKEND_EXE}`);
    
    // Backend exe kontrolü
    if (!fs.existsSync(BACKEND_EXE)) {
      const error = `Backend bulunamadı: ${BACKEND_EXE}`;
      log(`❌ ${error}`);
      dialog.showErrorBox('Backend Hatası', error);
      reject(new Error(error));
      return;
    }
    
    // Backend'i başlat
    backendProcess = spawn(BACKEND_EXE, [], {
      cwd: APP_ROOT,  // Çalışma dizini olarak OgrenciTakip/ kullan
      env: {
        ...process.env,
        PORT: BACKEND_PORT.toString(),
        DB_PATH: DATABASE_PATH
      }
    });
    
    backendProcess.stdout.on('data', (data) => {
      log(`Backend: ${data.toString().trim()}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      log(`Backend Error: ${data.toString().trim()}`);
    });
    
    backendProcess.on('error', (err) => {
      log(`❌ Backend başlatma hatası: ${err.message}`);
      dialog.showErrorBox('Backend Hatası', `Backend başlatılamadı:\n${err.message}`);
      reject(err);
    });
    
    backendProcess.on('exit', (code) => {
      log(`⚠️ Backend kapandı (kod: ${code})`);
    });
    
    // Backend'in hazır olmasını bekle
    log('⏳ Backend hazır olması bekleniyor...');
    checkBackendReady(resolve, reject);
  });
}

// Backend health check
function checkBackendReady(resolve, reject, attempts = 0) {
  if (attempts > 60) {  // 60 saniye timeout
    const error = 'Backend 60 saniye içinde hazır olmadı';
    log(`❌ ${error}`);
    dialog.showErrorBox('Bağlantı Hatası', error);
    reject(new Error(error));
    return;
  }
  
  const url = `http://127.0.0.1:${BACKEND_PORT}/api/students`;
  
  http.get(url, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      log('✅ Backend hazır!');
      resolve();
    } else {
      setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 1000);
    }
  }).on('error', () => {
    setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 1000);
  });
}

// Ana pencere
function createWindow() {
  log('🖥️ Ana pencere oluşturuluyor...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: 'Öğrenci Takip Sistemi',
    show: false  // Hazır olana kadar gösterme
  });
  
  // Menü'yü kaldır (production)
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }
  
  // Backend'den frontend'i yükle
  const url = `http://127.0.0.1:${BACKEND_PORT}`;
  log(`🌐 Frontend yükleniyor: ${url}`);
  
  mainWindow.loadURL(url);
  
  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('✅ Uygulama başarıyla başlatıldı!');
  });
  
  // Development modda DevTools aç
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC - Yedekleme işlemleri
ipcMain.handle('backup-database', async () => {
  try {
    log('📦 Manuel yedek alma başlatıldı...');
    
    // Kaydetme dialogu
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Yedek Dosyasını Kaydet',
      defaultPath: path.join(
        app.getPath('documents'),
        `ogrenci_takip_yedek_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`
      ),
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (canceled || !filePath) {
      log('⏭️ Yedekleme iptal edildi');
      return { success: false, message: 'İptal edildi' };
    }
    
    // Database dosyasını kopyala
    fs.copyFileSync(DATABASE_PATH, filePath);
    log(`✅ Yedek oluşturuldu: ${filePath}`);
    
    return { 
      success: true, 
      message: 'Yedek başarıyla oluşturuldu',
      path: filePath
    };
  } catch (error) {
    log(`❌ Yedekleme hatası: ${error.message}`);
    return { 
      success: false, 
      message: `Hata: ${error.message}` 
    };
  }
});

ipcMain.handle('restore-database', async () => {
  try {
    log('📥 Yedekten geri yükleme başlatıldı...');
    
    // Dosya seçme dialogu
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Yedek Dosyasını Seç',
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (canceled || filePaths.length === 0) {
      log('⏭️ Geri yükleme iptal edildi');
      return { success: false, message: 'İptal edildi' };
    }
    
    const backupFile = filePaths[0];
    log(`📁 Yedek dosyası seçildi: ${backupFile}`);
    
    // Onay dialogu
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Yedek Geri Yükleme',
      message: 'Mevcut veritabanı silinecek!',
      detail: 'Seçtiğiniz yedek dosyası mevcut veritabanının üzerine yazılacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      buttons: ['İptal', 'Evet, Geri Yükle'],
      defaultId: 0,
      cancelId: 0
    });
    
    if (response.response === 0) {
      log('⏭️ Geri yükleme kullanıcı tarafından iptal edildi');
      return { success: false, message: 'İptal edildi' };
    }
    
    // Backend'i durdur
    log('⏸️ Backend durduruluyor...');
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    
    // Eski database'i yedekle (güvenlik)
    const oldBackup = path.join(BACKUPS_DIR, `database_eski_${Date.now()}.db`);
    if (fs.existsSync(DATABASE_PATH)) {
      fs.copyFileSync(DATABASE_PATH, oldBackup);
      log(`💾 Eski database yedeklendi: ${oldBackup}`);
    }
    
    // Yedek dosyayı kopyala
    fs.copyFileSync(backupFile, DATABASE_PATH);
    log(`✅ Yedek geri yüklendi: ${DATABASE_PATH}`);
    
    // Backend'i yeniden başlat
    log('🔄 Backend yeniden başlatılıyor...');
    await startBackend();
    
    // Uygulamayı yeniden yükle
    if (mainWindow) {
      mainWindow.reload();
    }
    
    log('✅ Geri yükleme tamamlandı!');
    return { 
      success: true, 
      message: 'Yedek başarıyla geri yüklendi. Uygulama yeniden yüklendi.'
    };
  } catch (error) {
    log(`❌ Geri yükleme hatası: ${error.message}`);
    return { 
      success: false, 
      message: `Hata: ${error.message}` 
    };
  }
});

// Otomatik yedekleme
function autoBackup() {
  try {
    // En fazla 5 otomatik yedek tut
    const backupFiles = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('auto_yedek_') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUPS_DIR, f),
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // 5'ten fazla varsa en eskiyi sil
    if (backupFiles.length >= 5) {
      const toDelete = backupFiles.slice(4);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        log(`🗑️ Eski otomatik yedek silindi: ${file.name}`);
      });
    }
    
    // Yeni otomatik yedek oluştur
    const autoBackupFile = path.join(
      BACKUPS_DIR,
      `auto_yedek_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`
    );
    
    if (fs.existsSync(DATABASE_PATH)) {
      fs.copyFileSync(DATABASE_PATH, autoBackupFile);
      log(`✅ Otomatik yedek oluşturuldu: ${autoBackupFile}`);
    }
  } catch (error) {
    log(`⚠️ Otomatik yedekleme hatası: ${error.message}`);
  }
}

// Uygulama hazır
app.whenReady().then(async () => {
  log('🎬 Uygulama başlatılıyor...');
  log(`📍 İşletim Sistemi: ${process.platform}`);
  log(`📦 Paketlenmiş: ${app.isPackaged ? 'Evet' : 'Hayır (Development)'}`);
  
  try {
    await startBackend();
    createWindow();
    
    // İlk otomatik yedek
    setTimeout(() => autoBackup(), 5000);
  } catch (error) {
    log(`❌ Başlatma hatası: ${error.message}`);
    dialog.showErrorBox(
      'Başlatma Hatası',
      `Uygulama başlatılamadı:\n\n${error.message}\n\nLütfen logs/electron.log dosyasını kontrol edin.`
    );
    app.quit();
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
  log('🚪 Tüm pencereler kapatıldı');
  
  // Otomatik yedek al
  autoBackup();
  
  // Backend'i durdur
  if (backendProcess) {
    log('⏹️ Backend durduruluyor...');
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama kapanmadan önce
app.on('before-quit', () => {
  log('👋 Uygulama kapanıyor...');
  
  // Backend'i durdur
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

// Beklenmeyen hatalar
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection: ${reason}`);
});
