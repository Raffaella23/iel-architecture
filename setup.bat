@echo off
REM IEL Architecture - Quick Setup Script for Windows

echo.
echo ?? IEL Architecture Setup
echo ==========================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ? Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ? Node.js %NODE_VERSION% found
echo.

REM Install dependencies
echo ?? Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ? npm install failed
    pause
    exit /b 1
)

echo ? Dependencies installed
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ??  .env.local not found
    echo.
    echo ?? Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ? .env.local created
    echo.
    echo ??  IMPORTANT: Edit .env.local with your Firebase credentials
    echo    See FIREBASE_SETUP.md for detailed instructions
    echo.
)

echo ?? Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local with Firebase credentials
echo 2. Run: npm run dev
echo 3. Open: http://localhost:5173
echo.
pause
