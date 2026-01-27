#!/bin/bash

# SACCOChain Quick Start Script
# Starts all services for testing

echo "🚀 Starting SACCOChain Services"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "ai-service" ]; then
    echo "❌ Error: Please run this script from the saccochain root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Function to start a service
start_service() {
    SERVICE=$1
    PORT=$2
    COMMAND=$3
    DIR=$4
    
    echo "Starting $SERVICE on port $PORT..."
    
    if check_port $PORT; then
        echo "⚠️  Port $PORT is already in use. $SERVICE may already be running."
    else
        echo "▶️  Launching $SERVICE..."
        cd $DIR
        $COMMAND &
        echo "✅ $SERVICE started (PID: $!)"
        cd - > /dev/null
    fi
    echo ""
}

echo "📋 Pre-flight Checks"
echo "--------------------"

# Check if backend dependencies are installed
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if AI service venv exists
if [ -d "ai-service/venv" ]; then
    echo "✅ AI service venv exists"
else
    echo "⚠️  Creating AI service virtual environment..."
    cd ai-service && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..
fi

echo ""
echo "🌐 Starting Services"
echo "--------------------"
echo ""

# Start AI Service (Port 5001)
echo "1️⃣  AI Service (Flask)"
if [ -f "ai-service/app.py" ]; then
    cd ai-service
    if [ -d "venv" ]; then
        source venv/bin/activate
        nohup python app.py > ../logs/ai-service.log 2>&1 &
        AI_PID=$!
        echo "✅ AI Service started (PID: $AI_PID) on http://localhost:5001"
        deactivate
    else
        nohup python3 app.py > ../logs/ai-service.log 2>&1 &
        AI_PID=$!
        echo "✅ AI Service started (PID: $AI_PID) on http://localhost:5001"
    fi
    cd ..
else
    echo "❌ AI Service app.py not found"
fi
echo ""

# Start Backend  (Port 3000)
echo "2️⃣  Backend (Node.js/Express)"
if [ -f "backend/package.json" ]; then
    cd backend
    nohup npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID) on http://localhost:3000"
    cd ..
else
    echo "❌ Backend package.json not found"
fi
echo ""

# Start Frontend (Port 5173)
echo "3️⃣  Frontend (Vite/React)"
if [ -f "frontend/package.json" ]; then
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID) on http://localhost:5173"
    cd ..
else
    echo "❌ Frontend package.json not found"
fi
echo ""

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

echo ""
echo "================================"
echo "✅ SACCOChain Services Running"
echo "================================"
echo ""
echo "Access Points:"
echo "  🌐 Frontend:   http://localhost:5173"
echo "  🔧 Backend:    http://localhost:3000"
echo "  🤖 AI Service: http://localhost:5001"
echo ""
echo "Logs:"
echo "  Backend:    tail -f logs/backend.log"
echo "  Frontend:   tail -f logs/frontend.log"
echo "  AI Service: tail -f logs/ai-service.log"
echo ""
echo "To stop all services:"
echo "  ./stop-services.sh"
echo ""
echo "🎯 Open your browser to http://localhost:5173 to start testing!"
echo ""
