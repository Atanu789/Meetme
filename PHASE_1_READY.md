# 🚀 Phase 1 Audio Validation — READY TO TEST

## Status: ✅ COMPLETE

All Phase 1 components are ready:

- ✅ Bot syntax verified
- ✅ Audio recording function implemented  
- ✅ Validation logic implemented
- ✅ Auto-open folder on Windows added
- ✅ Crystal-clear path logging added
- ✅ File size reporting added
- ✅ Error messages specific to each failure mode

---

## What Was Enhanced

### 1. Auto-Open Folder
When bot finishes recording, Windows Explorer automatically opens showing:
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\{meetingId}\
```

**Files inside:**
- `test.wav` (10 seconds of captured audio)

### 2. Crystal-Clear Output
Bot prints this when audio validation passes:
```
╔════════════════════════════════════════════════════════════════╗
║                    AUDIO FILE SAVED                           ║
╚════════════════════════════════════════════════════════════════╝

📁 Absolute Path:
   C:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\audio-test-001\test.wav

📊 File Size:
   315.42 KB (323000 bytes)

⏱️  Duration:
   10.05 seconds

🔊 Audio Energy (RMS):
   0.045230 (speech-like)
```

### 3. Specific Error Messages
If audio capture fails, bot tells you exactly why:

```
❌ Audio is silent (RMS < 0.001)
   This likely means:
   - No audio source available on device
   - Meeting has no active speakers  
   - OS-level loopback capture not configured
   - Audio output not routed to loopback device

❌ Recording too short (3.2s < 9s)
   - ffmpeg may have failed to start
   - Device not recognized
```

---

## How to Test Phase 1

### 📋 Step-by-Step

**Step 1: Start Backend** (Terminal 1)
```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
npm start
```

**Step 2: Open Meeting** (Browser)
```
https://meet.melanam.com/audio-test-001
```
(or any Jitsi meeting URL you prefer)

**Step 3: Run Bot** (Terminal 2)
```powershell
cd "c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service"
node src/bot/zoomBotAssemblyRunner.js "audio-test-001" "https://meet.melanam.com/audio-test-001" "Melanam Bot"
```

**Step 4: Listen to test.wav**
- Explorer will open automatically
- Double-click `test.wav` to play
- Tell ChatGPT: Can you hear meeting audio or silence?

---

## What Happens Inside the Bot

```
1. Launch Playwright browser (silent)
2. Navigate to Jitsi meeting URL
3. Automatically fill name and join
4. Wait for meeting confirmation (up to 2 minutes)
5. Record 10 seconds of OS-level audio
6. Validate:
   ✅ File exists and has size
   ✅ Duration is at least 9 seconds
   ✅ RMS > 0.001 (not silent)
7. Print exact file path
8. Print file size in KB
9. Auto-open Windows Explorer
10. Exit successfully
```

---

## What to Look For

### ✅ SUCCESS (Proceed to Phase 2)
- Bot exits with: `shutdown: audio-validation-complete`
- File size: > 300 KB
- Duration: 9+ seconds
- RMS: > 0.001
- test.wav plays with audio/speech

### ❌ FAILURE (Fix audio device)
- Bot exits with: `shutdown: audio-validation-failed`
- File size: 0 KB or < 10 KB
- Duration: < 9 seconds
- RMS: close to 0 (silence)
- test.wav plays silence

---

## File Locations Reference

### Bot Code
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\src\bot\zoomBotAssemblyRunner.js
```

### Recording Output
```
c:\Users\Atanu Basak\ZOOM 2.0\backend\meeting-ai-service\data\audio\{meetingId}\test.wav
```

### Test Instructions
```
c:\Users\Atanu Basak\ZOOM 2.0\PHASE_1_AUDIO_TESTING.md
c:\Users\Atanu Basak\ZOOM 2.0\QUICK_TEST_COMMANDS.md
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Bot won't start | Backend not running | `npm start` in terminal 1 |
| test.wav 0 KB | ffmpeg not found | Install ffmpeg |
| test.wav silent | Loopback disabled | Enable Stereo Mix on Windows |
| Recording too short | ffmpeg timeout | Verify audio device exists |
| Explorer won't open | OS issue | Manually open file by path |

---

## Next Phase (After Audio Validation Passes)

Once Phase 1 confirms audio is being captured:

### Phase 2: Realtime Transcription
- Enable AssemblyAI WebSocket connection
- Stream audio in real-time (not to disk)
- Handle transcript messages
- Publish captions to backend

---

## Summary

🎯 **Goal:** Capture 10 seconds of meeting audio, save to test.wav, listen manually

📋 **Setup:** 2 terminals + 1 browser tab

⏱️ **Time:** ~20 seconds total

📂 **Output:** Automatic folder open showing test.wav

🔊 **Validation:** Manual listen to confirm audio present

---

## Ready? 

Copy the commands from `QUICK_TEST_COMMANDS.md` and run them! 

Bot will tell you exactly where test.wav is saved and auto-open it.

Report back: "I can hear [meeting audio / silence / background noise]"

