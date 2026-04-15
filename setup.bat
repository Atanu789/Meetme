@echo off
REM ZoomClone Quick Setup Script for Windows
REM This script automates the initial setup process

echo.
echo ^>^> ZoomClone - Quick Setup
echo ^>^> ==================================
echo.

REM Check Node.js
echo [*] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found. Please install Node.js 18+
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found
echo.

REM Check npm
echo [*] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm not found
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% found
echo.

REM Create .env.local if it doesn't exist
echo [*] Setting up environment variables...
if not exist .env.local (
    copy .env.example .env.local
    echo [OK] Created .env.local
    echo.
    echo [!] Update these values in .env.local:
    echo     - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    echo     - CLERK_SECRET_KEY
    echo     - MONGODB_URI
    echo.
) else (
    echo [OK] .env.local already exists
)
echo.

REM Install dependencies
echo [*] Installing dependencies...
call npm install
echo [OK] Dependencies installed
echo.

REM Build check
echo [*] Checking build...
call npm run build
echo [OK] Build successful
echo.

echo.
echo ===== Setup Complete! =====
echo.
echo Next steps:
echo 1. Update .env.local with your configuration
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo For detailed setup instructions, see SETUP_GUIDE.md
echo.

pause
