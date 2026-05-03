# Live Captions Troubleshooting Guide

## Quick Checklist

- [ ] Meeting AI service running on port 4010
- [ ] Next.js app running on port 3000
- [ ] AssemblyAI API key configured in `.env.local`
- [ ] Browser console showing no errors
- [ ] Microphone access granted
- [ ] CaptionOverlay showing "Live captions waiting"
- [ ] AudioCapture "Speak" button visible (bottom-left)

## Step-by-Step Diagnosis

### 1. Check if Services are Running

**Meeting AI Service:**
```bash
# Check if port 4010 is in use
netstat -ano | findstr :4010

# If not running, start it:
cd backend/meeting-ai-service
npm start

# Should show: [meeting-ai] listening on http://0.0.0.0:4010
```

**Next.js App:**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# If not running, start it:
npm run dev

# Should show: ✓ Ready in X.Xs
```

### 2. Test WebSocket Connection

```powershell
# Test if WebSocket endpoint is reachable
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:4010/health" | Select-Object -ExpandProperty Content

# Expected: {"ok":true}
```

### 3. Test Caption Posting

```powershell
# Test if caption posting works
$meetingId = "test-$(Get-Random -Minimum 10000 -Maximum 99999)"
Invoke-WebRequest -UseBasicParsing -Method Post `
  -Uri "http://localhost:4010/api/rooms/$meetingId/captions" `
  -ContentType 'application/json' `
  -Body (ConvertTo-Json @{ 
    text = "Test caption"; 
    speaker = "Test"; 
    final = $true 
  }) | Select-Object -ExpandProperty Content

# Expected: {"ok":true}
```

### 4. Check Browser Console for Errors

**Open your browser's Developer Tools (F12):**

Look for console errors starting with:
- `[captions]` - WebSocket connection issues
- `[audio]` - Audio capture issues
- Any fetch/CORS errors

**Common Errors:**

1. **"WebSocket connection refused"**
   - Meeting AI service not running
   - Firewall blocking port 4010
   - Wrong IP/domain in NEXT_PUBLIC_MEETING_AI_WS_URL

2. **"Microphone access denied"**
   - User didn't grant microphone permission
   - Browser requires HTTPS for microphone on some sites
   - Check browser privacy settings

3. **"Transcription failed - 401"**
   - AssemblyAI API key is invalid
   - Check ASSEMBLYAI_API_KEY in .env.local

### 5. Verify Environment Variables

**.env.local should contain:**

```bash
# Critical for captions
ASSEMBLYAI_API_KEY=your_actual_key_here
NEXT_PUBLIC_MEETING_AI_WS_URL=ws://127.0.0.1:4010/ws

# For caption backend
MEETING_AI_CONTROL_URL=http://127.0.0.1:4010
MEETING_AI_PORT=4010
MEETING_AI_HOST=0.0.0.0
```

**Check if configured:**
```bash
# In VS Code terminal, these should NOT be empty
echo $env:ASSEMBLYAI_API_KEY
echo $env:NEXT_PUBLIC_MEETING_AI_WS_URL
```

### 6. Test Full Audio Capture Flow

1. Open meeting room: `http://localhost:3000/room/[room-id]`
2. Look for "Speak" button (bottom-left corner)
3. Click "Speak" button
4. **Grant microphone access** when prompted
5. Speak a few words clearly
6. Stop speaking and wait 1-2 seconds
7. Watch for caption to appear below Jitsi iframe

### 7. Remote Deployment Fix

If accessing the app from a different machine or over a network:

**Problem:** Browser can't reach `ws://127.0.0.1:4010/ws`

**Solution:** Update `.env.local` to use your server's actual IP or domain:

```bash
# Replace 127.0.0.1 with your server IP or domain
NEXT_PUBLIC_MEETING_AI_WS_URL=ws://your-server-ip:4010/ws

# Or if using a domain with SSL:
NEXT_PUBLIC_MEETING_AI_WS_URL=wss://your-domain:4010/ws
```

Then rebuild and restart Next.js:
```bash
npm run build
npm run dev
```

### 8. AssemblyAI API Key Check

**Verify key is correct:**
```powershell
# Test AssemblyAI API
$headers = @{ "Authorization" = "your_api_key_here" }
Invoke-WebRequest -UseBasicParsing -Uri "https://api.assemblyai.com/v2/account" `
  -Headers $headers | Select-Object -ExpandProperty Content

# If valid, you'll see account info
# If invalid, you'll get 401 error
```

## Common Issues and Solutions

### Captions showing "Live captions waiting" but never receive captions

**Likely cause:** Audio not being uploaded or transcribed

**Solution:**
1. Check browser console for `[audio]` errors
2. Verify microphone is working on your system
3. Try speaking CLEARLY and SLOWLY
4. Check AssemblyAI API key is valid
5. Wait longer (transcription takes 2-10 seconds depending on audio length)

### WebSocket shows "connected" but captions still don't arrive

**Likely cause:** Transcription service failing silently

**Solution:**
1. Check server logs in VS Code terminal
2. Verify ASSEMBLYAI_API_KEY is correct
3. Check /api/transcribe-audio endpoint is working
4. Manually test caption posting (step 3 above)

### Button says "Live captions waiting" constantly

**Likely cause:** WebSocket not connecting

**Solution:**
1. Check meeting AI service is running (step 1)
2. Check NEXT_PUBLIC_MEETING_AI_WS_URL is correct
3. Try accessing from same machine first (use http://localhost:3000)
4. Check browser console for WebSocket errors
5. Check firewall allows port 4010

### No "Speak" button visible

**Likely cause:** Component not rendering or hidden behind other elements

**Solution:**
1. Open browser DevTools (F12)
2. Run in console:
   ```javascript
   // Check if button exists in DOM
   document.querySelector('[class*="Speak"]')
   ```
3. Check for JavaScript errors
4. Refresh page and check again
5. Try incognito/private browse mode

## Manual Testing

If automated testing doesn't work, do this manually:

1. **Terminal 1:** Start meeting AI service
   ```bash
   cd backend/meeting-ai-service && npm start
   ```

2. **Terminal 2:** Start Next.js app
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Go to http://localhost:3000
   - Create or join meeting room
   - Open DevTools (F12)
   - Click "Speak" button
   - Speak something
   - Watch console for logs

4. **In another terminal:** Manually test caption posting
   ```powershell
   Invoke-WebRequest -UseBasicParsing -Method Post `
     -Uri "http://localhost:4010/api/rooms/[room-id]/captions" `
     -ContentType 'application/json' `
     -Body (ConvertTo-Json @{ text = "Hello"; speaker = "Test"; final = $true })
   ```

## Getting Help

If none of the above works, collect this info:

1. Error messages from browser console (copy full error)
2. Output from `npm run dev` terminal
3. Output from meeting AI service terminal
4. Contents of `.env.local` (remove sensitive keys)
5. Screenshot of the "Speak" button area

Then open an issue with this information.
