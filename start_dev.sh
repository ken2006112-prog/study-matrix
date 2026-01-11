#!/bin/bash

# Study Matrix - Local Development Start Script

echo "🚀 Starting Study Matrix Local Environment (Electron App)..."

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 1. Backend Setup & Run
echo ""
echo "🐍 Setting up Backend..."
cd backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "Checking backend dependencies..."
pip install -r requirements.txt > /dev/null

echo "Generating Prisma client..."
prisma generate > /dev/null

echo "Starting Backend Server on port 8000..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# 2. Frontend Setup & Run
echo ""
echo "⚛️  Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Frontend Server on port 3000..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

echo "Waiting for frontend to be ready (approx 5-10s)..."
# Simple wait loop for port 3000
while ! nc -z localhost 3000; do   
  sleep 1
done
echo "Frontend is ready!"

# 3. Launch Electron
echo ""
echo "🖥️  Launching Desktop App..."
npm run electron

# When Electron closes, we are done
cleanup
