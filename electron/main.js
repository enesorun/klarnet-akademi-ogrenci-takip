const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = 3000;

// Backend başlat
function startBackend() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;
    
    if (isDev) {
      // Development modunda Python backend'i başlat
      console.log('Starting backend in development mode...');
      backendProcess = spawn('python', [
        path.join(__dirname, '..', 'backend', 'server.py')
      ], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
    } else {
      // Production modunda PyInstaller ile oluşturulmuş exe'yi başlat
      console.log('Starting backend in production mode...');
      const backendPath = path.join(process.resourcesPath, 'backend', 'server.exe');
      backendProcess = spawn(backendPath, [], {
        env: { ...process.env }
      });
    }
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
    
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });
    
    // Backend'in hazır olmasını bekle
    checkBackendReady(resolve, reject);
  });
}

// Backend'in hazır olup olmadığını kontrol et
function checkBackendReady(resolve, reject, attempts = 0) {
  if (attempts > 30) {
    reject(new Error('Backend başlatılamadı'));
    return;
  }
  
  http.get(`http://localhost:${BACKEND_PORT}/api/students`, (res) => {
    if (res.statusCode === 200) {
      console.log('Backend hazır!');
      resolve();
    } else {
      setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 1000);
    }
  }).on('error', () => {
    setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 1000);
  });
}

// Ana pencereyi oluştur
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: 'Öğrenci Takip Sistemi'
  });
  
  // Menü'yü kaldır
  Menu.setApplicationMenu(null);
  
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Development modunda React dev server'a bağlan
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    // Production modunda build edilmiş frontend'i yükle
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Uygulama hazır olduğunda
app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (error) {
    console.error('Uygulama başlatma hatası:', error);
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
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama kapanmadan önce
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
