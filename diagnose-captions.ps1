# Caption System Diagnostic Script
# Run this to quickly check if all services are running and configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Caption System Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Meeting AI Service
Write-Host "[1/5] Checking Meeting AI Service..." -ForegroundColor Yellow
$meetingAiTest = $null
try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:4010/health" -ErrorAction Stop
  $meetingAiTest = $response.Content | ConvertFrom-Json
  Write-Host "✓ Meeting AI Service: RUNNING on http://localhost:4010" -ForegroundColor Green
} catch {
  Write-Host "✗ Meeting AI Service: NOT RUNNING on port 4010" -ForegroundColor Red
  Write-Host "  Start it with: cd backend/meeting-ai-service; npm start" -ForegroundColor Gray
}
Write-Host ""

# Check 2: Next.js App
Write-Host "[2/5] Checking Next.js App..." -ForegroundColor Yellow
$nextjsTest = $null
try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000" -ErrorAction Stop
  Write-Host "✓ Next.js App: RUNNING on http://localhost:3000" -ForegroundColor Green
} catch {
  Write-Host "✗ Next.js App: NOT RUNNING on port 3000" -ForegroundColor Red
  Write-Host "  Start it with: npm run dev" -ForegroundColor Gray
}
Write-Host ""

# Check 3: AssemblyAI API Key
Write-Host "[3/5] Checking AssemblyAI Configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
  $envContent = Get-Content ".env.local" -Raw
  if ($envContent -match "ASSEMBLYAI_API_KEY=") {
    $hasKey = $envContent -match "ASSEMBLYAI_API_KEY=[a-z0-9]+"
    if ($hasKey) {
      Write-Host "✓ AssemblyAI API Key: CONFIGURED in .env.local" -ForegroundColor Green
    } else {
      Write-Host "✗ AssemblyAI API Key: EMPTY in .env.local" -ForegroundColor Red
      Write-Host "  Configure it with your actual API key" -ForegroundColor Gray
    }
  } else {
    Write-Host "✗ AssemblyAI API Key: NOT FOUND in .env.local" -ForegroundColor Red
  }
} else {
  Write-Host "✗ .env.local: NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# Check 4: WebSocket URL
Write-Host "[4/5] Checking WebSocket Configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
  $envContent = Get-Content ".env.local" -Raw
  if ($envContent -match "NEXT_PUBLIC_MEETING_AI_WS_URL") {
    $match = [regex]::Match($envContent, "NEXT_PUBLIC_MEETING_AI_WS_URL=(.*?)(\r?\n|`$)")
    $wsUrl = $match.Groups[1].Value.Trim().Trim('"')
    Write-Host "✓ WebSocket URL: CONFIGURED" -ForegroundColor Green
    Write-Host "  URL: $wsUrl" -ForegroundColor Gray
  } else {
    Write-Host "✗ WebSocket URL: NOT FOUND in .env.local" -ForegroundColor Red
  }
} else {
  Write-Host "✗ .env.local: NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# Check 5: Caption Endpoint
Write-Host "[5/5] Testing Caption Endpoint..." -ForegroundColor Yellow
if ($meetingAiTest) {
  try {
    $testId = "diagnostic-$(Get-Random -Minimum 10000 -Maximum 99999)"
    $response = Invoke-WebRequest -UseBasicParsing -Method Post `
      -Uri "http://localhost:4010/api/rooms/$testId/captions" `
      -ContentType 'application/json' `
      -Body (ConvertTo-Json @{ text = "Diagnostic test"; speaker = "System"; final = $true }) `
      -ErrorAction Stop
    Write-Host "✓ Caption Endpoint: WORKING" -ForegroundColor Green
  } catch {
    Write-Host "✗ Caption Endpoint: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
  }
} else {
  Write-Host "⊘ Caption Endpoint: SKIPPED (Meeting AI Service not running)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If all checks passed:" -ForegroundColor White
Write-Host "   - Open http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Join a meeting room" -ForegroundColor Gray
Write-Host "   - Open DevTools (F12) and check console for errors" -ForegroundColor Gray
Write-Host "   - Click Speak button and allow microphone access" -ForegroundColor Gray
Write-Host ""
Write-Host "2. If services are not running:" -ForegroundColor White
Write-Host "   - Start Meeting AI: cd backend/meeting-ai-service; npm start" -ForegroundColor Gray
Write-Host "   - Start Next.js: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. For more help:" -ForegroundColor White
Write-Host "   - See CAPTIONS_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host ""
