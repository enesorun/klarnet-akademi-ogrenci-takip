# Windows EXE Build - Developer Instructions

## Overview

Bu proje FastAPI backend'i Windows executable'a dönüştürmek için hazırlanmıştır.

## Prerequisites

- Windows 10/11 x64
- Python 3.11 or higher
- pip (Python package installer)

## Build Steps

### 1. Setup Environment

```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
```

### 2. Install Dependencies

```cmd
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller
```

### 3. Build EXE

```cmd
pyinstaller server.spec --clean --noconfirm
```

**Build time:** ~2-3 minutes

### 4. Output

```
backend/
└── dist/
    └── backend.exe    (~25-30 MB)
```

## Testing

### Test 1: Run EXE
```cmd
cd dist
backend.exe
```

**Expected output:**
```
📂 Database path: ...\dist\database.db
🚀 Backend server başlatılıyor...
📍 URL: http://127.0.0.1:8000
Uvicorn running on http://127.0.0.1:8000
```

### Test 2: Check API
Open browser: `http://127.0.0.1:8000/api/students`

**Expected:** `[]` (empty array)

### Test 3: Check Frontend
Open browser: `http://127.0.0.1:8000`

**Expected:** Student tracking system homepage

## Deployment Package

Create final package:

```
OgrenciTakip/
├── backend.exe          # Built executable
├── database.db          # Empty SQLite file (will be created if missing)
├── frontend_build/      # Copy from: ../frontend/build/*
│   ├── static/
│   └── index.html
├── backups/             # Empty folder
└── logs/                # Empty folder
```

### Manual Package Creation

```cmd
mkdir OgrenciTakip
mkdir OgrenciTakip\backups
mkdir OgrenciTakip\logs

copy backend\dist\backend.exe OgrenciTakip\
xcopy /E /I frontend\build OgrenciTakip\frontend_build
type nul > OgrenciTakip\database.db
```

## Common Issues

### Issue: "Python not found"

**Solution:** Add Python to PATH or use full path:
```cmd
C:\Users\[Username]\AppData\Local\Programs\Python\Python311\python.exe
```

### Issue: "Module not found"

**Solution:** Ensure virtual environment is activated and dependencies installed:
```cmd
venv\Scripts\activate.bat
pip install -r requirements.txt
```

### Issue: "Build failed"

**Solution:** Clean and rebuild:
```cmd
rmdir /s /q build
rmdir /s /q dist
pyinstaller server.spec --clean --noconfirm
```

### Issue: "UPX not available"

**Not a problem!** UPX is optional. Build will succeed, EXE will be slightly larger.

## Important Notes

### Console Window
- `console=True` in `server.spec` shows console window (required for logging)
- To hide console, change to `console=False` (but logging won't work properly)

### Database Path
- Backend automatically creates `database.db` in same folder as `backend.exe`
- Path handling is already configured in `server.py` and `database.py`

### Frontend Path
- Backend looks for `frontend_build/` folder next to `backend.exe`
- Copy `frontend/build/*` to `frontend_build/` in deployment package

### Port
- Default: 127.0.0.1:8000
- Can be changed via PORT environment variable

## Verification Checklist

Before delivering:

- [ ] backend.exe created successfully
- [ ] EXE runs without errors
- [ ] Console shows "Uvicorn running" message
- [ ] http://127.0.0.1:8000 loads homepage
- [ ] http://127.0.0.1:8000/api/students returns JSON
- [ ] Final package structure matches template above
- [ ] Empty database.db file created
- [ ] backups/ and logs/ folders created

## Contact

If you encounter issues not covered here, check:
- `docs/WINDOWS_BUILD_KILAVUZU.md` for detailed troubleshooting
- Python and PyInstaller documentation

## License

All rights reserved.
