# Live Captions Diagnostic Checklist

## Phase 1: Environment & Services
- [ ] Verify ASSEMBLYAI_API_KEY is set in `.env.local`
- [ ] Verify ASSEMBLYAI_TRANSCRIBE_LANGUAGE=en is set
- [ ] Kill all node processes via Task Manager
- [ ] Start meeting-ai service: `cd backend/meeting-ai-service && node server.js`
  - Expected: `[meeting-ai] listening on http://0.0.0.0:4010`
  - No error messages
- [ ] Start Next.js dev server: `npm run dev` (in root)
  - Expected: `ready - started server on 0.0.0.0:3000, url: http://localhost:3000`

## Phase 2: Backend Connectivity
- [ ] Test health endpoint: `curl http://127.0.0.1:4010/health`
  - Expected: `{"ok":true}`
- [ ] Monitor meeting-ai service logs while proceeding

## Phase 3: Room & Bot Setup
- [ ] Open room page: `http://localhost:3000/room/{roomId}`
- [ ] Check browser DevTools Console for `[captions]` messages
  - Look for: `[captions] ✅ WebSocket CONNECTED`
  - Look for: `[captions] Sent join message`
- [ ] Verify bot joins meeting
  - Check meeting-ai terminal for: `[bot:...] [bot] joined meeting successfully`
  - Look for: `[bot:...] [bot] browser audio capture started`

## Phase 4: Audio Capture & Transcription
- [ ] Speak in the meeting (5+ seconds)
- [ ] Check meeting-ai terminal for:
  - `[bot:...] [bot] transcribing browser audio chunk (...)`
  - `[server] /api/rooms/.../captions received: ...`
- [ ] Check browser console for:
  - `[captions] 📨 Raw message received: {"type":"caption",...}`
  - `[captions] 🎤 CAPTION RECEIVED: ...`

## Phase 5: Caption Display
- [ ] Caption overlay should show at bottom of screen
  - Green border (live indicator)
  - Speaker name + badge
  - Caption text
- [ ] If not visible, check:
  - Browser console for rendering errors
  - Desktop for hidden windows (caption might be offscreen)

## Debug Mode: Use Query Flag
- [ ] Add `?captions_debug=1` to room URL
- [ ] At bottom should show "Captions WS Debug" panel
  - It will display the last raw WebSocket message received
  - Verify JSON structure before display

## Troubleshooting Steps

### If services won't start (Exit Code 1):
```powershell
# Check for syntax errors
node -c backend/meeting-ai-service/src/bot/zoomBotAssemblyRunner.js
node -c backend/meeting-ai-service/src/server/index.js

# Check for port already in use
netstat -ano | grep 4010
```

### If bot doesn't capture audio:
- Check meeting URL is reachable
- Verify browser allows audio capture
- Check Zoom/Jitsi iframe is not blocking media capture

### If AssemblyAI errors:
- Verify API key: `$env:ASSEMBLYAI_API_KEY`
- Check AssemblyAI quota/balance
- Look for 401/403 errors in terminal

### If WS connection fails:
- Verify backend is running on port 4010
- Check `NEXT_PUBLIC_MEETING_AI_WS_URL` is set correctly
- Monitor WS connection in DevTools Network tab
