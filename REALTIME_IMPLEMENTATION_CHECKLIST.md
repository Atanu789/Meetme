# Realtime Streaming Implementation Checklist

## ✅ Bot Pipeline Changes

### FFmpeg Setup
- [x] Removed segment recording (`-f segment -segment_time`)
- [x] Added PCM streaming (`-f s16le -` to stdout)
- [x] All platforms supported (Windows/Linux/macOS)
- [x] 16kHz mono audio format maintained
- [x] Proper stdio configuration: `['pipe', 'pipe', 'pipe']`

### AssemblyAI WebSocket
- [x] New `startRealtimeAudioStream()` function
- [x] Connects to `wss://streaming.assemblyai.com/v3/ws`
- [x] Sends Base64-encoded PCM chunks continuously
- [x] Handles `PartialTranscript` messages
- [x] Handles `FinalTranscript` messages
- [x] Session lifecycle events handled (Begin/Terminate)

### Caption Publishing
- [x] New `createRealtimeTranscriptHandler()` function
- [x] Immediate publish on each transcript (no batching)
- [x] Speaker ID mapping maintained
- [x] Final flag set correctly for each message
- [x] Publishes to `POST /api/rooms/{meetingId}/captions`

### Process Management
- [x] AAI WebSocket connection established before browser launch
- [x] FFmpeg process spawned after meeting join
- [x] Proper shutdown handlers for graceful cleanup
- [x] Signal handlers (SIGINT, SIGTERM) configured

### Environment Variables
- [x] `ASSEMBLYAI_API_KEY` - Used for authentication
- [x] `ASSEMBLYAI_WS_BASE_URL` - Realtime endpoint
- [x] `ASSEMBLYAI_SPEECH_MODEL` - u3-rt-pro model
- [x] `CAPTION_BACKEND_URL` - Caption endpoint target
- [x] All other vars maintained for compatibility

## ✅ Frontend Caption Display

### Caption Reducer
- [x] `UPDATE_ACTIVE` - Partial updates replace text in-place
- [x] `FINALIZE` - Sets expiry time (2500ms)
- [x] `FADE` - Opacity transitions
- [x] Max 2 captions maintained (current + previous)

### WebSocket Handling
- [x] Parses caption messages (type: 'caption')
- [x] Distinguishes partial vs final (`payload.final`)
- [x] Triggers FINALIZE action on final transcript
- [x] Auto-fade animation (1500ms → 0.6, 2000ms → 0.3)
- [x] Ignores summary messages
- [x] Handles connection/disconnection gracefully

### UI Display
- [x] Shows speaker name with live indicator
- [x] Shows caption text
- [x] Perfect marker for final captions (●)
- [x] Fade animation on expiry
- [x] Auto-removes expired captions
- [x] Connection status when no captions
- [x] Debug mode support (?captions_debug=1)

## ✅ No Architecture Changes

### Preserved
- [x] Jitsi External API usage (unchanged)
- [x] Playwright bot joining (unchanged)
- [x] Participant mapping (unchanged)
- [x] Meeting room structure (unchanged)
- [x] WebSocket broadcast mechanism (unchanged)
- [x] Caption endpoint (`/api/rooms/{meetingId}/captions`) (unchanged)

### Removed
- [x] FFmpeg segment files
- [x] File-based chunk watching
- [x] AssemblyAI v2 upload endpoint
- [x] Polling for transcript completion
- [x] Browser MediaRecorder fallback
- [x] Data directory management

## ✅ Dependencies

### Bot Requirements
- [x] `ws` - WebSocket client for AAI
- [x] `playwright` - Browser control (unchanged)
- [x] `dotenv` - Config loading (unchanged)
- [x] `node:child_process` - FFmpeg spawning (unchanged)
- [x] All existing deps maintained

### Frontend Requirements
- [x] React hooks - Already in place
- [x] TypeScript types - Already defined
- [x] Portal rendering - Already used
- [x] No new dependencies needed

## ✅ Configuration Verification

### Environment
```
ASSEMBLYAI_API_KEY=01a4430716df47e... ✓
ASSEMBLYAI_WS_BASE_URL=wss://streaming.assemblyai.com/v3/ws ✓
ASSEMBLYAI_SPEECH_MODEL=u3-rt-pro ✓
CAPTION_BACKEND_URL=http://localhost:4010 ✓
NEXT_PUBLIC_MEETING_AI_WS_URL=ws://127.0.0.1:4010/ws ✓
BOT_DISPLAY_NAME=Melanam Note Bot ✓
BOT_FFMPEG_PATH=(optional) ✓
BOT_PULSE_SOURCE=(optional, Linux only) ✓
```

### File Permissions
- [x] Bot script executable via node
- [x] No file I/O needed (stdout only)
- [x] No disk cache directory needed

## ✅ Expected Behavior

### On Bot Start
1. ✓ Parses command-line args (meetingId, URL, name)
2. ✓ Validates ASSEMBLYAI_API_KEY
3. ✓ Connects to AssemblyAI WebSocket
4. ✓ Receives SessionBegins message
5. ✓ Launches Playwright browser
6. ✓ Navigates to Jitsi meeting URL
7. ✓ Fills in bot name, clicks Join
8. ✓ Waits for meeting join confirmation
9. ✓ Starts FFmpeg audio capture
10. ✓ Begins streaming PCM to AAI

### During Meeting
1. ✓ FFmpeg continuously captures audio
2. ✓ FFmpeg outputs PCM to stdout
3. ✓ PCM encoded as Base64 chunks
4. ✓ Chunks sent to AAI WebSocket
5. ✓ AAI sends PartialTranscript (rolling)
6. ✓ AAI sends FinalTranscript (when speaker pauses)
7. ✓ Bot publishes each caption immediately
8. ✓ Backend broadcasts via WebSocket
9. ✓ Frontend receives and displays caption
10. ✓ Caption fades and disappears after 2.5s

### Latency Profile
- FFmpeg capture: ~50-100ms
- AAI processing: ~200-500ms (realtime model)
- Network round-trip: ~50-200ms
- Frontend update: ~50-100ms
- **Total: 500-1500ms** ✓

### On Bot Shutdown
1. ✓ Catches SIGINT/SIGTERM
2. ✓ Closes AAI WebSocket gracefully
3. ✓ Kills FFmpeg process
4. ✓ Closes Playwright browser
5. ✓ Exits cleanly

## ✅ Testing Steps

### 1. Syntax Validation
```bash
node -c backend/meeting-ai-service/src/bot/zoomBotAssemblyRunner.js
# Expected: No output (clean syntax)
```

### 2. Start Service
```bash
cd backend/meeting-ai-service
npm start
# Expected: Server listening on port 4010
```

### 3. Create Meeting (in app)
- Create via dashboard
- Copy meeting link

### 4. Join Meeting (in app)
- Open meeting
- See Jitsi iframe
- Bot joins automatically
- Captions appear in overlay

### 5. Verify Behavior
- Speak in meeting
- Watch captions roll in real-time
- See partial updates every 200-500ms
- See final caption lock when you pause
- See caption fade after 2-3 seconds
- Check timezone in caption timestamps

### 6. Check Logs
```
Terminal 1 (meeting-ai-service):
[aai] ✅ Connected to AssemblyAI realtime WebSocket
[audio-stream] starting ffmpeg (win32)...
[aai] PARTIAL: Speaker: Hello world...
[aai] FINAL: Speaker: Hello world.
[ws] broadcasting to N sockets...

Browser Console:
[captions] ✅ WebSocket CONNECTED
[captions] 🎤 CAPTION: Speaker: Hello world
[captions] ✅ Parsed message type: caption
```

## ✅ Rollback Plan

If issues occur:
```bash
git log --oneline backend/meeting-ai-service/src/bot/
git checkout <old-hash> -- backend/meeting-ai-service/src/bot/zoomBotAssemblyRunner.js
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Caption latency | 500-1500ms | ✓ Design target |
| FFmpeg CPU | <20% | ✓ Expected |
| Memory (bot) | <200MB | ✓ Expected |
| WebSocket traffic | Continuous | ✓ By design |
| Disk usage | 0MB | ✓ No files |

## Final Status

✅ **Implementation Complete**
✅ **Syntax Validated**
✅ **Architecture Preserved**
✅ **Ready for Testing**

Next: `npm start` and test in a real meeting!
