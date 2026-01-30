#!/bin/bash

# 🚀 Quick Start Script for iLoveSPSR Nellore
# This script sets up and runs the application

set -e

echo "🌟 iLoveSPSR Nellore - Quick Start"
echo "=================================="
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    USE_DOCKER=true
else
    echo "⚠️  Docker not found. Will use local Node.js"
    USE_DOCKER=false
fi

# Check if Node.js is installed (if not using Docker)
if [ "$USE_DOCKER" = false ]; then
    if ! command -v node &> /dev/null; then
        echo "❌ Error: Node.js is not installed"
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    echo "✅ Node.js $(node --version) found"
fi

echo ""
echo "📦 Installation Method:"
if [ "$USE_DOCKER" = true ]; then
    echo "   Using Docker (Recommended)"
    echo ""
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "Creating .env file..."
        cp .env.example .env
        echo "✅ .env created. Please update JWT_SECRET for production!"
    fi
    
    echo "Building and starting Docker containers..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    echo ""
    echo "Waiting for container to be ready..."
    sleep 5
    
    echo "Seeding database with demo data..."
    docker exec ilovespsr-nellore node server/db/seed.js
    
    echo ""
    echo "✨ Success! Application is running"
    echo ""
    echo "🌐 Open your browser:"
    echo "   http://localhost:3001"
    echo ""
    echo "📝 Demo Credentials:"
    echo "   Customer: priya@gmail.com / customer123"
    echo "   Vendor:   ravi@nelloreservices.com / vendor123"
    echo "   Admin:    admin@ilovespsrnellore.com / admin123"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop: docker-compose down"
    
else
    echo "   Using Local Node.js"
    echo ""
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "Creating .env file..."
        cp .env.example .env
        echo "✅ .env created. Please update JWT_SECRET for production!"
    fi
    
    echo "Installing dependencies..."
    npm install
    
    echo "Seeding database with demo data..."
    npm run seed
    
    echo ""
    echo "✨ Installation complete!"
    echo ""
    echo "🚀 To start the server, run:"
    echo "   npm start"
    echo ""
    echo "Or for development with auto-reload:"
    echo "   npm run dev"
    echo ""
    echo "🌐 Then open: http://localhost:3001"
    echo ""
    echo "📝 Demo Credentials:"
    echo "   Customer: priya@gmail.com / customer123"
    echo "   Vendor:   ravi@nelloreservices.com / vendor123"
    echo "   Admin:    admin@ilovespsrnellore.com / admin123"
fi

echo ""
echo "📚 For deployment to cloud, see: DEPLOYMENT.md"
echo ""
