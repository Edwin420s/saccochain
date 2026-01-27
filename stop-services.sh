#!/bin/bash

# Stop all SACCOChain services

echo "🛑 Stopping SACCOChain Services"
echo "================================"

# Function to stop service by port
stop_by_port() {
    PORT=$1
    NAME=$2
    
    PID=$(lsof -ti:$PORT)
    if [ -n "$PID" ]; then
        echo "Stopping $NAME (PID: $PID on port $PORT)..."
        kill $PID 2>/dev/null
        echo "✅ $NAME stopped"
    else
        echo "ℹ️  $NAME not running on port $PORT"
    fi
}

# Stop services
stop_by_port 5173 "Frontend"
stop_by_port 3000 "Backend"
stop_by_port 5001 "AI Service"

echo ""
echo "✅ All services stopped"
