#!/bin/bash

echo "========================================"
echo "  Klarnet Akademi Ogrenci Takip Sistemi"
echo "  Baslatiliyor..."
echo "========================================"
echo ""

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "[1/3] MongoDB kontrol ediliyor..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "MongoDB baslatiliyor..."
    mongod --fork --logpath /tmp/mongodb.log --dbpath ~/data/db
fi

echo "[2/3] Backend baslatiliyor..."
cd "$DIR/backend"
python server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

echo "[3/3] Frontend baslatiliyor..."
cd "$DIR/frontend"
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "  Sistem baslatildi!"
echo "  Tarayicinizda acin: http://localhost:3000"
echo ""
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Sistemi durdurmak icin ./stop.sh calistirin"
echo "========================================"
echo ""

# Save PIDs for stop script
echo $BACKEND_PID > /tmp/klarnet_backend.pid
echo $FRONTEND_PID > /tmp/klarnet_frontend.pid

# Open browser (Mac/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000 2>/dev/null
fi