@echo off
REM Caption System Diagnostic

echo.
echo ========================================
echo Caption System Diagnostic
echo ========================================
echo.

REM Check 1: Meeting AI Service
echo [1/5] Checking Meeting AI Service...
netstat -ano | findstr :4010 >nul 2>&1
if %errorlevel% equ 0 (
    echo (OK) Meeting AI Service: RUNNING on port 4010
    echo Start it with: cd backend\meeting-ai-service ^&^& npm start
) else (
    echo (FAIL) Meeting AI Service: NOT running on port 4010
)
echo.

REM Check 2: Next.js App
echo [2/5] Checking Next.js App...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo (OK) Next.js App: RUNNING on port 3000
) else (
    echo (FAIL) Next.js App: NOT running on port 3000
    echo Start it with: npm run dev
)
echo.

REM Check 3: AssemblyAI API Key
echo [3/5] Checking .env.local...
if exist .env.local (
    findstr /M "ASSEMBLYAI_API_KEY=" .env.local >nul 2>&1
    if %errorlevel% equ 0 (
        echo (OK) AssemblyAI API Key found in .env.local
    ) else (
        echo (WARN) AssemblyAI API Key not found in .env.local
    )
) else (
    echo (FAIL) .env.local not found
)
echo.

REM Check 4: Test caption endpoint
echo [4/5] Testing Caption Endpoint...
powershell -Command "try { Invoke-WebRequest -UseBasicParsing -Uri http://localhost:4010/health | Select-Object StatusCode | Out-Null; Write-Host '(OK) Caption endpoint responding' } catch { Write-Host '(FAIL) Caption endpoint not responding' }"
echo.

echo ========================================
echo Diagnostic Summary
echo ========================================
echo.
echo If all checks passed:
echo   1. Open http://localhost:3000
echo   2. Join a meeting room
echo   3. Check browser console (F12) for errors
echo   4. Click Speak button and allow microphone
echo.
echo For more info, see: CAPTIONS_TROUBLESHOOTING.md
echo.
