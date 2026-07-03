#!/bin/bash
# IEL Architecture — Quick Setup Script

echo "?? IEL Architecture Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "? Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "? Node.js $(node --version) found"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "? npm not found. Please reinstall Node.js"
    exit 1
fi

echo "? npm $(npm --version) found"
echo ""

# Install dependencies
echo "?? Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "? npm install failed"
    exit 1
fi

echo "? Dependencies installed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "??  .env.local not found"
    echo ""
    echo "?? Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "? .env.local created"
    echo ""
    echo "??  IMPORTANT: Edit .env.local with your Firebase credentials"
    echo "   See FIREBASE_SETUP.md for detailed instructions"
    echo ""
fi

echo "?? Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with Firebase credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
