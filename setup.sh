#!/bin/bash

# ZoomClone Quick Setup Script
# This script automates the initial setup process

set -e

echo "🚀 ZoomClone - Quick Setup"
echo "===================================="
echo ""

# Check Node.js
echo "📋 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version) found"
echo ""

# Check npm
echo "📋 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm --version) found"
echo ""

# Create .env.local if it doesn't exist
echo "📝 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  Update these values in .env.local:"
    echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    echo "   - CLERK_SECRET_KEY"
    echo "   - MONGODB_URI"
    echo ""
else
    echo "✅ .env.local already exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build check
echo "🔨 Checking build..."
npm run build
echo "✅ Build successful"
echo ""

echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "For detailed setup instructions, see SETUP_GUIDE.md"
