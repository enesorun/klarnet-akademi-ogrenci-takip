#!/bin/bash

# Renkler
YESIL='\033[0;32m'
KIRMIZI='\033[0;31m'
SARI='\033[1;33m'
MAVI='\033[0;34m'
RESET='\033[0m'

clear

echo "════════════════════════════════════════════════════════════"
echo "                                                            "
echo "        KLARNET AKADEMI OGRENCI TAKIP SISTEMI              "
echo "                                                            "
echo "               OTOMATIK KURULUM BASLATIYOR                 "
echo "                                                            "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Lutfen bekleyin, sistem hazirlaniyor..."
echo ""
sleep 2

# Kurulum dizinini kaydet
KURULUM_DIZIN="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$KURULUM_DIZIN"

echo "═══════════════════════════════════════════════════════════"
echo " ADIM 1/6: Gerekli Programlar Kontrol Ediliyor"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Python kontrolu
echo -n "[1/3] Python kontrol ediliyor... "
if command -v python3 &> /dev/null; then
    PYTHON_VER=$(python3 --version | awk '{print $2}')
    echo -e "${YESIL}✓ Python $PYTHON_VER bulundu${RESET}"
    PYTHON_YOK=0
else
    echo -e "${KIRMIZI}✗ Python bulunamadi!${RESET}"
    PYTHON_YOK=1
fi

# Node.js kontrolu
echo -n "[2/3] Node.js kontrol ediliyor... "
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo -e "${YESIL}✓ Node.js $NODE_VER bulundu${RESET}"
    NODE_YOK=0
else
    echo -e "${KIRMIZI}✗ Node.js bulunamadi!${RESET}"
    NODE_YOK=1
fi

# MongoDB kontrolu
echo -n "[3/3] MongoDB kontrol ediliyor... "
if command -v mongod &> /dev/null; then
    echo -e "${YESIL}✓ MongoDB bulundu${RESET}"
    MONGO_YOK=0
else
    echo -e "${KIRMIZI}✗ MongoDB bulunamadi!${RESET}"
    MONGO_YOK=1
fi

echo ""

# Eksik programlar icin kurulum onerileri
if [ $PYTHON_YOK -eq 1 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo " PYTHON KURULUMU GEREKLI"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Python bulunamadi. Kurmak icin:"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac icin:"
        echo "  brew install python3"
        echo ""
        echo "veya https://www.python.org/downloads/ adresinden indirin"
    else
        echo "Ubuntu/Debian icin:"
        echo "  sudo apt update"
        echo "  sudo apt install python3 python3-pip"
        echo ""
        echo "Fedora icin:"
        echo "  sudo dnf install python3 python3-pip"
    fi
    echo ""
    read -p "Kurulum tamamlandiktan sonra bu programi tekrar calistirin. Enter ile cikis..."
    exit 1
fi

if [ $NODE_YOK -eq 1 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo " NODE.JS KURULUMU GEREKLI"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Node.js bulunamadi. Kurmak icin:"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac icin:"
        echo "  brew install node"
        echo ""
        echo "veya https://nodejs.org/ adresinden indirin"
    else
        echo "Ubuntu/Debian icin:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        echo ""
        echo "Fedora icin:"
        echo "  sudo dnf install nodejs"
    fi
    echo ""
    read -p "Kurulum tamamlandiktan sonra bu programi tekrar calistirin. Enter ile cikis..."
    exit 1
fi

if [ $MONGO_YOK -eq 1 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo " MONGODB KURULUMU GEREKLI"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "MongoDB bulunamadi. Kurmak icin:"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac icin:"
        echo "  brew tap mongodb/brew"
        echo "  brew install mongodb-community"
        echo "  brew services start mongodb-community"
    else
        echo "Ubuntu/Debian icin:"
        echo "  https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/"
        echo ""
        echo "Fedora icin:"
        echo "  https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/"
    fi
    echo ""
    read -p "Kurulum tamamlandiktan sonra bu programi tekrar calistirin. Enter ile cikis..."
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo " ADIM 2/6: Backend Bagimliliklari Kuruluyor"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Lutfen bekleyin, bu birkaç dakika surebilir..."
echo ""

cd "$KURULUM_DIZIN/backend"
if pip3 install -r requirements.txt > /dev/null 2>&1; then
    echo -e "${YESIL}✓ Backend bagimliliklari kuruldu${RESET}"
else
    echo -e "${KIRMIZI}✗ Backend kurulumunda hata olustu!${RESET}"
    echo ""
    echo "Detayli hata icin:"
    pip3 install -r requirements.txt
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ADIM 3/6: Frontend Bagimliliklari Kuruluyor"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Lutfen bekleyin, bu 5-10 dakika surebilir..."
echo ""

cd "$KURULUM_DIZIN/frontend"
if npm install > /dev/null 2>&1; then
    echo -e "${YESIL}✓ Frontend bagimliliklari kuruldu${RESET}"
else
    echo -e "${KIRMIZI}✗ Frontend kurulumunda hata olustu!${RESET}"
    echo ""
    echo "Detayli hata icin:"
    npm install
    exit 1
fi

cd "$KURULUM_DIZIN"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ADIM 4/6: MongoDB Servisi Kontrol Ediliyor"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    if brew services list | grep mongodb-community | grep started > /dev/null; then
        echo -e "${YESIL}✓ MongoDB zaten calisiyor${RESET}"
    else
        brew services start mongodb-community > /dev/null 2>&1
        echo -e "${YESIL}✓ MongoDB servisi baslatildi${RESET}"
    fi
else
    # Linux
    if systemctl is-active --quiet mongod; then
        echo -e "${YESIL}✓ MongoDB zaten calisiyor${RESET}"
    else
        sudo systemctl start mongod > /dev/null 2>&1
        echo -e "${YESIL}✓ MongoDB servisi baslatildi${RESET}"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ADIM 5/6: Masaustu Kisayolu Olusturuluyor"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Masaustu yolu
if [[ "$OSTYPE" == "darwin"* ]]; then
    DESKTOP_PATH="$HOME/Desktop"
else
    DESKTOP_PATH="$HOME/Desktop"
    if [ ! -d "$DESKTOP_PATH" ]; then
        DESKTOP_PATH="$HOME/Masaüstü"
    fi
fi

# .desktop dosyasi olustur (Linux)
if [[ "$OSTYPE" != "darwin"* ]]; then
    DESKTOP_FILE="$DESKTOP_PATH/klarnet-akademi.desktop"
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Klarnet Akademi
Comment=Ogrenci Takip Sistemi
Exec=gnome-terminal -- bash -c "$KURULUM_DIZIN/start.sh; exec bash"
Icon=$KURULUM_DIZIN/frontend/public/favicon.ico
Terminal=false
Categories=Education;
EOF
    chmod +x "$DESKTOP_FILE"
    echo -e "${YESIL}✓ Masaustu kisayolu olusturuldu${RESET}"
else
    # Mac icin Automator uygulamasi olustur
    echo -e "${SARI}! Mac'te masaustu kisayolu manuel olusturulmali${RESET}"
    echo "  start.sh dosyasini Dock'a surukleyin"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ADIM 6/6: Calistirma Izinleri Veriliyor"
echo "═══════════════════════════════════════════════════════════"
echo ""

chmod +x "$KURULUM_DIZIN"/*.sh
echo -e "${YESIL}✓ Tum scriptlere calistirma izni verildi${RESET}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " KURULUM TAMAMLANDI!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${YESIL}✓ Tum bilesenler basariyla kuruldu${RESET}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " NASIL KULLANILIR?"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Terminal'de: ./start.sh"
echo "2. Veya masaustundeki kisayola tiklayin"
echo "3. Tarayicinizda http://localhost:3000 acilacak"
echo "4. Kapatmak icin: ./stop.sh"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ILGILI DOSYALAR"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "• ./start.sh - Sistemi baslatir"
echo "• ./stop.sh - Sistemi kapatir"
echo "• ./yedek.sh - Verilerinizi yedekler"
echo "• ./geri_yukle.sh - Yedeginizi geri yukler"
echo "• KURULUM.txt - Detayli kullanim kilavuzu"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

read -p "Simdi sistemi baslatmak ister misiniz? (e/h): " BASLAT
if [ "$BASLAT" = "e" ] || [ "$BASLAT" = "E" ]; then
    echo ""
    echo "Sistem baslatiliyor..."
    echo ""
    ./start.sh
else
    echo ""
    echo "Sistemi daha sonra ./start.sh ile baslatabilirsiniz."
    echo ""
fi
