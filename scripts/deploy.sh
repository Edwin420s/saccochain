#!/bin/bash

set -e

echo "🚀 Deploying SACCOChain to Production..."
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Load environment
if [ ! -f .env.production ]; then
    print_error "Production environment file not found"
    exit 1
fi

source .env.production

# Validation
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    print_error "Required environment variables not set"
    exit 1
fi

print_status "Starting production deployment..."

# Build and push Docker images
print_status "Building production Docker images..."
docker-compose -f docker-compose.prod.yml build

print_status "Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

print_status "Running health checks..."
sleep 30

# Health checks
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    print_status "Production deployment successful!"
else
    print_error "Health check failed"
    exit 1
fi

print_status "SACCOChain is now live at https://$DOMAIN"