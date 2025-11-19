#!/bin/bash

echo "========================================"
echo "  Sistem durduruluyor..."
echo "========================================"
echo ""

echo "Frontend kapatiliyor..."
if [ -f /tmp/klarnet_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/klarnet_frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm /tmp/klarnet_frontend.pid
fi
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "Backend kapatiliyor..."
if [ -f /tmp/klarnet_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/klarnet_backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm /tmp/klarnet_backend.pid
fi
lsof -ti:8001 | xargs kill -9 2>/dev/null

echo ""
echo "========================================"
echo "  Sistem durduruldu!"
echo "========================================"
echo ""