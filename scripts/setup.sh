#!/bin/bash

set -e

echo "🚀 Setting up SACCOChain Development Environment..."
echo "==================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p ssl

# Copy environment files
print_status "Setting up environment configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please update .env file with your configuration"
else
    print_status ".env file already exists"
fi

# Setup backend
print_status "Setting up backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
fi

print_status "Installing backend dependencies..."
npm install

print_status "Generating Prisma client..."
npx prisma generate

print_status "Running database migrations..."
npx prisma db push

print_status "Seeding database..."
npm run db:seed

cd ..

# Setup frontend
print_status "Setting up frontend..."
cd frontend

if [ ! -f .env ]; then
    cp .env.example .env
fi

print_status "Installing frontend dependencies..."
npm install

cd ..

# Setup AI service
print_status "Setting up AI service..."
cd ai-service

if [ ! -f .env ]; then
    cp .env.example .env
fi

print_status "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

print_status "Installing Python dependencies..."
pip install -r requirements.txt

print_status "Training initial credit scoring model..."
python train_model.py

deactivate
cd ..

# Build Docker images
print_status "Building Docker images..."
docker-compose build

print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Run health checks
print_status "Running health checks..."

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend API is healthy"
else
    print_error "Backend API is not responding"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_error "Frontend is not responding"
fi

# Check database
if docker-compose exec db pg_isready -U sacco_user -d saccochain > /dev/null 2>&1; then
    print_status "Database is healthy"
else
    print_error "Database is not responding"
fi

echo ""
echo "🎉 SACCOChain setup completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: localhost:5432"
echo "   Adminer: http://localhost:8080 (for database management)"
echo ""
echo "🔑 Default Login Credentials:"
echo "   Admin: admin@saccochain.com / admin123"
echo "   Member: john.member@saccochain.com / member123"
echo ""
echo "🚀 To start developing:"
echo "   cd frontend && npm run dev    # Frontend development"
echo "   cd backend && npm run dev     # Backend development"
echo ""
echo "🐳 To manage services:"
echo "   docker-compose up -d          # Start all services"
echo "   docker-compose down           # Stop all services"
echo "   docker-compose logs -f        # View logs"
echo ""
echo "📚 For more information, check README.md"